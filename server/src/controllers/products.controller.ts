import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import * as service from '../services/products.service'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = service.listProductsSchema.parse(req.query)
  const { products, total, page, limit } = await service.listProducts(query)
  const lastPage = Math.ceil(total / limit)
  return sendList(res, products, { total, page, per_page: limit, last_page: lastPage })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = service.createProductSchema.parse(req.body)
  const product = await service.createProduct(body)
  return sendSuccess(res, product, 'Produk berhasil dibuat', 201)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProductById(req.params.id)
  return sendSuccess(res, product, 'Data produk berhasil diambil')
})

export const getByBarcode = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProductByBarcode(req.params.barcode)
  return sendSuccess(res, product, 'Produk ditemukan')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = service.updateProductSchema.parse(req.body)
  const product = await service.updateProduct(req.params.id, body)
  return sendSuccess(res, product, 'Produk berhasil diperbarui')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.softDeleteProduct(req.params.id)
  return sendSuccess(res, null, 'Produk berhasil dinonaktifkan')
})
