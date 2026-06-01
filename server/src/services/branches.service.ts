import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { NotFoundError } from '../utils/errors'

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Nama cabang wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  isActive: z.boolean().optional().default(true),
})

export const updateBranchSchema = createBranchSchema.partial()

export async function listBranches() {
  return prisma.branch.findMany({ orderBy: { name: 'asc' } })
}

export async function createBranch(data: z.infer<typeof createBranchSchema>) {
  return prisma.branch.create({ data })
}

export async function getBranchById(id: string) {
  const branch = await prisma.branch.findUnique({ where: { id } })
  if (!branch) throw new NotFoundError('Cabang tidak ditemukan')
  return branch
}

export async function updateBranch(id: string, data: z.infer<typeof updateBranchSchema>) {
  await getBranchById(id)
  return prisma.branch.update({ where: { id }, data })
}

export async function softDeleteBranch(id: string) {
  await getBranchById(id)
  return prisma.branch.update({ where: { id }, data: { isActive: false } })
}
