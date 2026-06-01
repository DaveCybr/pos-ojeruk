import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import * as service from '../services/users.service'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = service.listUsersSchema.parse(req.query)
  const { users, total, page, limit } = await service.listUsers(query)
  const lastPage = Math.ceil(total / limit)
  return sendList(res, users, { total, page, per_page: limit, last_page: lastPage })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = service.createUserSchema.parse(req.body)
  const user = await service.createUser(body)
  return sendSuccess(res, user, 'User berhasil dibuat', 201)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.getUserById(req.params.id)
  return sendSuccess(res, user, 'Data user berhasil diambil')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = service.updateUserSchema.parse(req.body)
  const user = await service.updateUser(req.params.id, body)
  return sendSuccess(res, user, 'User berhasil diperbarui')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteUser(req.params.id)
  return sendSuccess(res, null, 'User berhasil dihapus')
})
