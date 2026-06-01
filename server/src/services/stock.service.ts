import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { NotFoundError, BadRequestError } from '../utils/errors'
import { StockMovementType } from '@prisma/client'

// ─── Schemas ────────────────────────────────────────────────────────────────

export const listStockSchema = z.object({
  branchId:   z.string().optional(),
  categoryId: z.string().optional(),
  search:     z.string().optional(),
  page:       z.coerce.number().positive().optional().default(1),
  limit:      z.coerce.number().positive().max(100).optional().default(20),
})

export const listMovementsSchema = z.object({
  branchId:  z.string().optional(),
  productId: z.string().optional(),
  type:      z.nativeEnum(StockMovementType).optional(),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
  page:      z.coerce.number().positive().optional().default(1),
  limit:     z.coerce.number().positive().max(100).optional().default(20),
})

export const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  branchId:  z.string().min(1, 'Cabang wajib dipilih'),
  quantity:  z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  type:      z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  note:      z.string().optional(),
})

// ─── Stock list ──────────────────────────────────────────────────────────────

export async function listStock(query: z.infer<typeof listStockSchema>) {
  const { branchId, categoryId, search, page, limit } = query
  const where = {
    ...(branchId && { branchId }),
    product: {
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(categoryId && { categoryId }),
    },
  }
  const [total, items] = await Promise.all([
    prisma.stock.count({ where }),
    prisma.stock.findMany({
      where,
      include: {
        product: { include: { category: { select: { id: true, name: true } } } },
        branch:  { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ branch: { name: 'asc' } }, { product: { name: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { items, total, page, limit }
}

export async function getLowStock(branchId?: string) {
  const all = await prisma.stock.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      product: { include: { category: { select: { id: true, name: true } } } },
      branch:  { select: { id: true, name: true, city: true } },
    },
    orderBy: { quantity: 'asc' },
  })
  return all.filter((s) => s.quantity <= s.minStock)
}

export async function getStockByBranch(branchId: string) {
  return prisma.stock.findMany({
    where: { branchId },
    include: {
      product: { include: { category: { select: { id: true, name: true } } } },
    },
    orderBy: { product: { name: 'asc' } },
  })
}

// ─── Stock movements ─────────────────────────────────────────────────────────

export async function listMovements(query: z.infer<typeof listMovementsSchema>) {
  const { branchId, productId, type, startDate, endDate, page, limit } = query
  const where = {
    ...(branchId  && { branchId }),
    ...(productId && { productId }),
    ...(type      && { type }),
    ...(startDate || endDate
      ? { createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(endDate + 'T23:59:59.999Z') }),
        } }
      : {}),
  }
  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, barcode: true } },
        branch:  { select: { id: true, name: true } },
        user:    { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { movements, total, page, limit }
}

// ─── Adjustment ──────────────────────────────────────────────────────────────

export async function adjustStock(
  data: z.infer<typeof adjustmentSchema>,
  userId: string,
) {
  const { productId, branchId, quantity, type, note } = data

  // Verify stock record exists
  const stock = await prisma.stock.findUnique({
    where: { productId_branchId: { productId, branchId } },
    include: { product: { select: { name: true } }, branch: { select: { name: true } } },
  })
  if (!stock) throw new NotFoundError('Stok untuk produk dan cabang ini tidak ditemukan')

  // Calculate new quantity
  let newQty = stock.quantity
  if (type === 'IN')         newQty += quantity
  else if (type === 'OUT')   newQty -= quantity
  else                       newQty  = quantity   // ADJUSTMENT = set absolute

  if (newQty < 0) throw new BadRequestError('Stok tidak boleh kurang dari 0')

  const [updatedStock] = await prisma.$transaction([
    prisma.stock.update({
      where: { productId_branchId: { productId, branchId } },
      data:  { quantity: newQty },
      include: { product: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.create({
      data: { productId, branchId, userId, type, quantity, note },
    }),
  ])

  return { stock: updatedStock, newQty, isLow: newQty <= stock.minStock }
}
