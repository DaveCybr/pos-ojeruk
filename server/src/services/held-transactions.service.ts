import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { NotFoundError } from '../utils/errors'

export const createHeldSchema = z.object({
  branchId:  z.string().min(1),
  cashierId: z.string().min(1),
  label:     z.string().optional(),
  cartData:  z.unknown(),
})

export async function getHeldByBranch(branchId: string) {
  return prisma.heldTransaction.findMany({
    where: { branchId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createHeld(data: z.infer<typeof createHeldSchema>) {
  return prisma.heldTransaction.create({
    data: {
      branchId:  data.branchId,
      cashierId: data.cashierId,
      label:     data.label,
      cartData:  data.cartData as Prisma.InputJsonValue,
    },
  })
}

export async function deleteHeld(id: string) {
  const held = await prisma.heldTransaction.findUnique({ where: { id } })
  if (!held) throw new NotFoundError('Transaksi tahan tidak ditemukan')
  return prisma.heldTransaction.delete({ where: { id } })
}
