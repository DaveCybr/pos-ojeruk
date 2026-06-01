import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { NotFoundError, ConflictError } from '../utils/errors'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  barcode: z.string().min(1, 'Barcode wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  price: z.coerce.number().positive('Harga harus lebih dari 0'),
  costPrice: z.coerce.number().positive('Harga modal harus lebih dari 0'),
  unit: z.string().min(1).default('pcs'),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export const listProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20),
})

const productInclude = {
  category: { select: { id: true, name: true } },
} as const

export async function listProducts(query: z.infer<typeof listProductsSchema>) {
  const { search, categoryId, isActive, page, limit } = query
  const where = {
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    ...(categoryId && { categoryId }),
    ...(isActive !== undefined && { isActive: isActive === 'true' }),
  }
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where, include: productInclude,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { products, total, page, limit }
}

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  const existing = await prisma.product.findUnique({ where: { barcode: data.barcode } })
  if (existing) throw new ConflictError('Barcode sudah digunakan oleh produk lain')
  return prisma.product.create({ data, include: productInclude })
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')
  return product
}

export async function getProductByBarcode(barcode: string) {
  const product = await prisma.product.findUnique({ where: { barcode }, include: productInclude })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')
  return product
}

export async function updateProduct(id: string, data: z.infer<typeof updateProductSchema>) {
  await getProductById(id)
  if (data.barcode) {
    const existing = await prisma.product.findFirst({ where: { barcode: data.barcode, NOT: { id } } })
    if (existing) throw new ConflictError('Barcode sudah digunakan oleh produk lain')
  }
  return prisma.product.update({ where: { id }, data, include: productInclude })
}

export async function softDeleteProduct(id: string) {
  await getProductById(id)
  return prisma.product.update({ where: { id }, data: { isActive: false } })
}
