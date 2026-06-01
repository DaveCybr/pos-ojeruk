import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/response'
import * as service from '../services/categories.service'

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listCategories()
  return sendSuccess(res, data, 'Data kategori berhasil diambil')
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = service.createCategorySchema.parse(req.body)
  const category = await service.createCategory(body)
  return sendSuccess(res, category, 'Kategori berhasil dibuat', 201)
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = service.updateCategorySchema.parse(req.body)
  const category = await service.updateCategory(req.params.id, body)
  return sendSuccess(res, category, 'Kategori berhasil diperbarui')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCategory(req.params.id)
  return sendSuccess(res, null, 'Kategori berhasil dihapus')
})
