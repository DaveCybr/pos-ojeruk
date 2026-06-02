import { z } from 'zod'
import { Prisma, PaymentMethod, TransactionStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { NotFoundError, BadRequestError } from '../utils/errors'

// ─── Schemas ────────────────────────────────────────────────────────────────

export const listTransactionsSchema = z.object({
  branchId:  z.string().optional(),
  cashierId: z.string().optional(),
  status:    z.nativeEnum(TransactionStatus).optional(),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
  page:      z.coerce.number().positive().optional().default(1),
  limit:     z.coerce.number().positive().max(100).optional().default(20),
})

export const createTransactionSchema = z.object({
  branchId:      z.string().min(1, 'Cabang wajib dipilih'),
  customerId:    z.string().nullable().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paidAmount:    z.coerce.number().nonnegative(),
  discount:      z.coerce.number().nonnegative().default(0),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity:  z.coerce.number().int().positive(),
    price:     z.coerce.number().nonnegative(),
    discount:  z.coerce.number().nonnegative().default(0),
  })).min(1, 'Minimal 1 item'),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function generateInvoiceNo(
  tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  branchId: string,
): Promise<string> {
  const branch = await tx.branch.findUnique({ where: { id: branchId } })
  if (!branch) throw new NotFoundError('Cabang tidak ditemukan')

  const code   = branch.city.slice(0, 3).toUpperCase()
  const now    = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const prefix = `INV-${code}-${y}${m}${d}-`

  const count  = await tx.transaction.count({ where: { invoiceNo: { startsWith: prefix } } })
  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

const txInclude = {
  branch:   { select: { id: true, name: true, city: true } },
  cashier:  { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, phone: true } },
  items:    { include: { product: { select: { id: true, name: true, barcode: true, unit: true } } } },
} as const

// ─── List ────────────────────────────────────────────────────────────────────

export async function listTransactions(query: z.infer<typeof listTransactionsSchema>, userBranchId?: string | null) {
  const { branchId, cashierId, status, startDate, endDate, page, limit } = query
  const where: Prisma.TransactionWhereInput = {
    ...(userBranchId ? { branchId: userBranchId } : branchId ? { branchId } : {}),
    ...(cashierId && { cashierId }),
    ...(status    && { status }),
    ...((startDate || endDate) ? {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate + 'T23:59:59.999Z') }),
      },
    } : {}),
  }
  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: txInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { transactions, total, page, limit }
}

export async function getTransactionById(id: string) {
  const tx = await prisma.transaction.findUnique({ where: { id }, include: txInclude })
  if (!tx) throw new NotFoundError('Transaksi tidak ditemukan')
  return tx
}

export async function getTransactionsByBranch(branchId: string) {
  return prisma.transaction.findMany({
    where: { branchId },
    include: txInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createTransaction(
  data: z.infer<typeof createTransactionSchema>,
  userId: string,
  userContext: { role: string; branchId: string | null },
) {
  const { branchId, customerId, paymentMethod, paidAmount, discount, items } = data

  if (userContext.role === 'CASHIER' && branchId !== userContext.branchId) {
    throw new BadRequestError('Kasir hanya bisa membuat transaksi di cabang sendiri')
  }

  const result = await prisma.$transaction(async (tx) => {
    // Stock check
    for (const item of items) {
      const stock = await tx.stock.findUnique({
        where: { productId_branchId: { productId: item.productId, branchId } },
        include: { product: { select: { name: true } } },
      })
      if (!stock) throw new BadRequestError(`Stok tidak ditemukan untuk salah satu produk`)
      if (stock.quantity < item.quantity) {
        throw new BadRequestError(`Stok ${stock.product.name} tidak mencukupi (tersisa ${stock.quantity})`)
      }
    }

    // Calculate totals
    const itemsSubtotal = items.reduce((s, i) => s + i.price * i.quantity - i.discount, 0)
    const total         = Math.max(0, itemsSubtotal - discount)
    const actualPaid    = paymentMethod === 'CASH' ? paidAmount : total
    const changeAmount  = paymentMethod === 'CASH' ? Math.max(0, paidAmount - total) : 0

    if (paymentMethod === 'CASH' && paidAmount < total) {
      throw new BadRequestError('Uang yang dibayarkan kurang dari total belanja')
    }

    const invoiceNo = await generateInvoiceNo(tx, branchId)

    // Create transaction + items in one nested write
    const transaction = await tx.transaction.create({
      data: {
        invoiceNo,
        branchId,
        cashierId: userId,
        customerId: customerId || null,
        subtotal:   itemsSubtotal,
        discount,
        tax:        0,
        total,
        paidAmount: actualPaid,
        changeAmount,
        paymentMethod,
        status: 'COMPLETED',
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity:  i.quantity,
            price:     i.price,
            discount:  i.discount,
            subtotal:  i.price * i.quantity - i.discount,
          })),
        },
      },
      include: txInclude,
    })

    // Decrement stock + record movements
    const stockUpdates: { productId: string; branchId: string; quantity: number; minStock: number }[] = []
    for (const item of items) {
      const updated = await tx.stock.update({
        where: { productId_branchId: { productId: item.productId, branchId } },
        data:  { quantity: { decrement: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          branchId,
          userId,
          type:     'OUT',
          quantity: item.quantity,
          note:     `Penjualan ${invoiceNo}`,
        },
      })
      stockUpdates.push({ productId: item.productId, branchId, quantity: updated.quantity, minStock: updated.minStock })
    }

    return { transaction, stockUpdates }
  })

  return result
}

// ─── Void ────────────────────────────────────────────────────────────────────

export async function voidTransaction(id: string, userId: string) {
  const original = await prisma.transaction.findUnique({ where: { id }, include: { items: true } })
  if (!original) throw new NotFoundError('Transaksi tidak ditemukan')
  if (original.status === 'VOIDED') throw new BadRequestError('Transaksi sudah di-void')

  const result = await prisma.$transaction(async (tx) => {
    const voided = await tx.transaction.update({
      where: { id },
      data:  { status: 'VOIDED' },
      include: txInclude,
    })

    const stockUpdates: { productId: string; branchId: string; quantity: number }[] = []
    for (const item of original.items) {
      const updated = await tx.stock.update({
        where: { productId_branchId: { productId: item.productId, branchId: original.branchId } },
        data:  { quantity: { increment: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          branchId:  original.branchId,
          userId,
          type:     'IN',
          quantity:  item.quantity,
          note:     `Void transaksi ${original.invoiceNo}`,
        },
      })
      stockUpdates.push({ productId: item.productId, branchId: original.branchId, quantity: updated.quantity })
    }

    return { voided, stockUpdates, branchId: original.branchId }
  })

  return result
}
