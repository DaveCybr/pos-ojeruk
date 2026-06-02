import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors'

export const listCustomersSchema = z.object({
  search: z.string().optional(),
  page:   z.coerce.number().positive().optional().default(1),
  limit:  z.coerce.number().positive().max(100).optional().default(20),
})

export const customerBodySchema = z.object({
  name:  z.string().min(2, 'Nama minimal 2 karakter').transform(s => s.trim()),
  phone: z.string()
    .regex(/^\d{10,13}$/, 'Nomor HP harus 10–13 digit angka')
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
})

const txInclude = {
  branch:  { select: { id: true, name: true, city: true } },
  cashier: { select: { id: true, name: true } },
  items: {
    include: { product: { select: { id: true, name: true, barcode: true, unit: true } } },
  },
} as const

export async function listCustomers(query: z.infer<typeof listCustomersSchema>) {
  const { search, page, limit } = query
  const where = search
    ? { OR: [
        { name:  { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ] }
    : {}

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  // Aggregate total belanja per customer in one query
  const ids = customers.map(c => c.id)
  const totals = ids.length
    ? await prisma.transaction.groupBy({
        by: ['customerId'],
        where: { customerId: { in: ids }, status: 'COMPLETED' },
        _sum: { total: true },
      })
    : []
  const totalMap = new Map(totals.map(t => [t.customerId, Number(t._sum.total ?? 0)]))

  return {
    customers: customers.map(c => ({
      id:               c.id,
      name:             c.name,
      phone:            c.phone,
      createdAt:        c.createdAt,
      transactionCount: c._count.transactions,
      totalBelanja:     totalMap.get(c.id) ?? 0,
    })),
    total, page, limit,
  }
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: txInclude,
      },
    },
  })
  if (!customer) throw new NotFoundError('Pelanggan tidak ditemukan')

  const totalBelanja = customer.transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((s, t) => s + Number(t.total), 0)

  return { ...customer, totalBelanja }
}

export async function createCustomer(data: z.infer<typeof customerBodySchema>) {
  if (data.phone) {
    const existing = await prisma.customer.findFirst({ where: { phone: data.phone } })
    if (existing) throw new ConflictError('Nomor HP sudah terdaftar pada pelanggan lain')
  }
  return prisma.customer.create({ data: { name: data.name, phone: data.phone } })
}

export async function updateCustomer(id: string, data: z.infer<typeof customerBodySchema>) {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) throw new NotFoundError('Pelanggan tidak ditemukan')

  if (data.phone && data.phone !== customer.phone) {
    const existing = await prisma.customer.findFirst({ where: { phone: data.phone, NOT: { id } } })
    if (existing) throw new ConflictError('Nomor HP sudah terdaftar pada pelanggan lain')
  }
  return prisma.customer.update({ where: { id }, data: { name: data.name, phone: data.phone } })
}

export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  })
  if (!customer) throw new NotFoundError('Pelanggan tidak ditemukan')
  if (customer._count.transactions > 0) {
    throw new BadRequestError(
      `Pelanggan tidak bisa dihapus — memiliki ${customer._count.transactions} transaksi`,
    )
  }
  return prisma.customer.delete({ where: { id } })
}
