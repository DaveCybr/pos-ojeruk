import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { BadRequestError, NotFoundError } from '../utils/errors'

export const openShiftSchema = z.object({
  branchId:    z.string().min(1),
  openingCash: z.coerce.number().nonnegative().default(0),
})

export const closeShiftSchema = z.object({
  closingCash: z.coerce.number().nonnegative(),
  notes:       z.string().optional(),
})

export const listShiftsSchema = z.object({
  branchId:  z.string().optional(),
  cashierId: z.string().optional(),
  page:      z.coerce.number().positive().optional().default(1),
  limit:     z.coerce.number().positive().max(50).optional().default(20),
})

const shiftInclude = {
  cashier: { select: { id: true, name: true } },
  branch:  { select: { id: true, name: true } },
} as const

// ─── Get active shift ─────────────────────────────────────────────────────────

export async function getActiveShift(branchId: string, cashierId: string) {
  return prisma.cashierShift.findFirst({
    where: { branchId, cashierId, status: 'OPEN' },
    include: shiftInclude,
    orderBy: { openedAt: 'desc' },
  })
}

// ─── Open shift ───────────────────────────────────────────────────────────────

export async function openShift(
  data: z.infer<typeof openShiftSchema>,
  cashierId: string,
) {
  const existing = await getActiveShift(data.branchId, cashierId)
  if (existing) throw new BadRequestError('Sudah ada shift yang sedang berjalan')

  return prisma.cashierShift.create({
    data: {
      branchId:    data.branchId,
      cashierId,
      openingCash: data.openingCash,
      status:      'OPEN',
    },
    include: shiftInclude,
  })
}

// ─── Close shift ──────────────────────────────────────────────────────────────

export async function closeShift(
  shiftId: string,
  cashierId: string,
  data: z.infer<typeof closeShiftSchema>,
) {
  const shift = await prisma.cashierShift.findUnique({ where: { id: shiftId } })
  if (!shift)                        throw new NotFoundError('Shift tidak ditemukan')
  if (shift.cashierId !== cashierId)  throw new BadRequestError('Bukan shift milik Anda')
  if (shift.status === 'CLOSED')      throw new BadRequestError('Shift sudah ditutup')

  // Compute summary from transactions during this shift
  const transactions = await prisma.transaction.findMany({
    where: {
      branchId:  shift.branchId,
      cashierId: shift.cashierId,
      status:    'COMPLETED',
      createdAt: { gte: shift.openedAt },
    },
    select: { total: true, paymentMethod: true },
  })

  const totalTransactions = transactions.length
  const totalRevenue      = transactions.reduce((s, t) => s + Number(t.total), 0)
  const cashRevenue       = transactions
    .filter(t => t.paymentMethod === 'CASH')
    .reduce((s, t) => s + Number(t.total), 0)

  return prisma.cashierShift.update({
    where: { id: shiftId },
    data: {
      status:           'CLOSED',
      closedAt:         new Date(),
      closingCash:      data.closingCash,
      notes:            data.notes,
      totalTransactions,
      totalRevenue,
      cashRevenue,
    },
    include: shiftInclude,
  })
}

// ─── Shift summary (live, for close modal preview) ────────────────────────────

export async function getShiftSummary(shiftId: string, cashierId: string) {
  const shift = await prisma.cashierShift.findUnique({
    where: { id: shiftId },
    include: shiftInclude,
  })
  if (!shift)                        throw new NotFoundError('Shift tidak ditemukan')
  if (shift.cashierId !== cashierId)  throw new BadRequestError('Bukan shift milik Anda')

  const transactions = await prisma.transaction.findMany({
    where: {
      branchId:  shift.branchId,
      cashierId: shift.cashierId,
      status:    'COMPLETED',
      createdAt: { gte: shift.openedAt },
    },
    select: { total: true, paymentMethod: true, items: { select: { quantity: true } } },
  })

  const totalTransactions = transactions.length
  const totalRevenue      = transactions.reduce((s, t) => s + Number(t.total), 0)
  const cashRevenue       = transactions.filter(t => t.paymentMethod === 'CASH').reduce((s, t) => s + Number(t.total), 0)
  const nonCashRevenue    = totalRevenue - cashRevenue
  const totalItems        = transactions.reduce((s, t) => s + t.items.reduce((si, i) => si + i.quantity, 0), 0)
  const expectedClosing   = Number(shift.openingCash) + cashRevenue

  return {
    shift,
    summary: { totalTransactions, totalRevenue, cashRevenue, nonCashRevenue, totalItems, expectedClosing },
  }
}

// ─── List shifts ──────────────────────────────────────────────────────────────

export async function listShifts(query: z.infer<typeof listShiftsSchema>, userCashierId?: string) {
  const { branchId, cashierId, page, limit } = query
  const where = {
    ...(branchId  && { branchId }),
    ...(cashierId ? { cashierId } : userCashierId ? { cashierId: userCashierId } : {}),
  }
  const [total, shifts] = await Promise.all([
    prisma.cashierShift.count({ where }),
    prisma.cashierShift.findMany({
      where,
      include: shiftInclude,
      orderBy: { openedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { shifts, total, page, limit }
}
