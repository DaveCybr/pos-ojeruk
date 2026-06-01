import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { NotFoundError, BadRequestError } from '../utils/errors'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  description: z.string().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory(data: z.infer<typeof createCategorySchema>) {
  return prisma.category.create({ data })
}

export async function getCategoryById(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } })
  if (!cat) throw new NotFoundError('Kategori tidak ditemukan')
  return cat
}

export async function updateCategory(id: string, data: z.infer<typeof updateCategorySchema>) {
  await getCategoryById(id)
  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  await getCategoryById(id)
  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) throw new BadRequestError(`Kategori masih digunakan oleh ${productCount} produk`)
  return prisma.category.delete({ where: { id } })
}
