import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import * as service from '../services/customer.service'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = service.listCustomersSchema.parse(req.query)
  const { customers, total, page, limit } = await service.listCustomers(query)
  return sendList(res, customers, { total, page, per_page: limit, last_page: Math.ceil(total / limit) })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = service.customerBodySchema.parse(req.body)
  const customer = await service.createCustomer(body)
  return sendSuccess(res, customer, 'Pelanggan berhasil ditambahkan', 201)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await service.getCustomerById(req.params.id)
  return sendSuccess(res, customer, 'Data pelanggan berhasil diambil')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = service.customerBodySchema.parse(req.body)
  const customer = await service.updateCustomer(req.params.id, body)
  return sendSuccess(res, customer, 'Pelanggan berhasil diperbarui')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCustomer(req.params.id)
  return sendSuccess(res, null, 'Pelanggan berhasil dihapus')
})
