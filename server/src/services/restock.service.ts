import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { NotFoundError, BadRequestError } from '../utils/errors'
import { RestockStatus } from '@prisma/client'

// ─── Schemas ────────────────────────────────────────────────────────────────

export const listRestockSchema = z.object({
  branchId: z.string().optional(),
  status:   z.nativeEnum(RestockStatus).optional(),
  page:     z.coerce.number().positive().optional().default(1),
  limit:    z.coerce.number().positive().max(100).optional().default(20),
})

export const createRestockSchema = z.object({
  productId:         z.string().min(1, 'Produk wajib dipilih'),
  branchId:          z.string().min(1, 'Cabang wajib dipilih'),
  quantityRequested: z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  note:              z.string().optional(),
})

export const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'FULFILLED']),
  note:   z.string().optional(),
})

const restockInclude = {
  branch:    { select: { id: true, name: true, city: true } },
  product:   { select: { id: true, name: true, barcode: true } },
  requester: { select: { id: true, name: true } },
} as const

// ─── List ────────────────────────────────────────────────────────────────────

export async function listRestockRequests(
  query: z.infer<typeof listRestockSchema>,
  userBranchId?: string | null,
) {
  const { branchId, status, page, limit } = query
  const where = {
    ...(branchId    ? { branchId } : userBranchId ? { branchId: userBranchId } : {}),
    ...(status      && { status }),
  }
  const [total, requests] = await Promise.all([
    prisma.restockRequest.count({ where }),
    prisma.restockRequest.findMany({
      where,
      include: restockInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { requests, total, page, limit }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createRestockRequest(
  data: z.infer<typeof createRestockSchema>,
  userId: string,
  userBranchId: string | null,
) {
  if (userBranchId && data.branchId !== userBranchId) {
    throw new BadRequestError('Anda hanya bisa mengajukan restok untuk cabang sendiri')
  }
  return prisma.restockRequest.create({
    data: { ...data, requestedBy: userId },
    include: restockInclude,
  })
}

// ─── Update status ───────────────────────────────────────────────────────────

export async function updateRestockStatus(
  id: string,
  data: z.infer<typeof updateStatusSchema>,
) {
  const request = await prisma.restockRequest.findUnique({ where: { id }, include: restockInclude })
  if (!request) throw new NotFoundError('Permintaan restok tidak ditemukan')
  if (request.status === 'FULFILLED') throw new BadRequestError('Permintaan sudah FULFILLED, tidak bisa diubah')
  if (request.status === 'REJECTED')  throw new BadRequestError('Permintaan sudah REJECTED, tidak bisa diubah')

  if (data.status === 'FULFILLED') {
    // Atomic: update restock status + update stock + create movement
    const stock = await prisma.stock.findUnique({
      where: { productId_branchId: { productId: request.productId, branchId: request.branchId } },
    })
    if (!stock) throw new NotFoundError('Stok produk di cabang ini tidak ditemukan')

    const newQty = stock.quantity + request.quantityRequested

    const [updated] = await prisma.$transaction([
      prisma.restockRequest.update({ where: { id }, data: { status: 'FULFILLED', note: data.note }, include: restockInclude }),
      prisma.stock.update({
        where: { productId_branchId: { productId: request.productId, branchId: request.branchId } },
        data:  { quantity: newQty },
      }),
      prisma.stockMovement.create({
        data: {
          productId: request.productId,
          branchId:  request.branchId,
          userId:    request.requestedBy,
          type:      'RESTOCK',
          quantity:  request.quantityRequested,
          note:      `Restok dari request #${id.slice(0, 8)}`,
        },
      }),
    ])

    return { updated, newQty, branchId: request.branchId, productId: request.productId, minStock: stock.minStock }
  }

  const updated = await prisma.restockRequest.update({
    where: { id },
    data:  { status: data.status, note: data.note },
    include: restockInclude,
  })
  return { updated, newQty: null, branchId: request.branchId, productId: request.productId, minStock: null }
}
