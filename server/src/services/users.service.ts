import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { NotFoundError, ConflictError } from '../utils/errors'
import { Role } from '@prisma/client'

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.nativeEnum(Role),
  branchId: z.string().nullable().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
  branchId: z.string().nullable().optional(),
})

export const listUsersSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  branchId: z.string().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20),
})

const userSelect = {
  id: true, name: true, email: true, role: true, branchId: true, createdAt: true,
  branch: { select: { id: true, name: true, city: true } },
} as const

export async function listUsers(query: z.infer<typeof listUsersSchema>) {
  const { role, branchId, page, limit } = query
  const where = {
    ...(role && { role }),
    ...(branchId && { branchId }),
  }
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, select: userSelect,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { users, total, page, limit }
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new ConflictError('Email sudah digunakan')
  const hashed = await bcrypt.hash(data.password, 12)
  return prisma.user.create({
    data: { ...data, password: hashed },
    select: userSelect,
  })
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect })
  if (!user) throw new NotFoundError('User tidak ditemukan')
  return user
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  await getUserById(id)
  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } })
    if (existing) throw new ConflictError('Email sudah digunakan')
  }
  const updateData: Record<string, unknown> = { ...data }
  if (data.password) updateData.password = await bcrypt.hash(data.password, 12)
  return prisma.user.update({ where: { id }, data: updateData, select: userSelect })
}

export async function deleteUser(id: string) {
  await getUserById(id)
  return prisma.user.delete({ where: { id } })
}
