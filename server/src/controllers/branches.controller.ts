import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/response'
import * as service from '../services/branches.service'

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listBranches()
  return sendSuccess(res, data, 'Data cabang berhasil diambil')
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = service.createBranchSchema.parse(req.body)
  const branch = await service.createBranch(body)
  return sendSuccess(res, branch, 'Cabang berhasil dibuat', 201)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const branch = await service.getBranchById(req.params.id)
  return sendSuccess(res, branch, 'Data cabang berhasil diambil')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = service.updateBranchSchema.parse(req.body)
  const branch = await service.updateBranch(req.params.id, body)
  return sendSuccess(res, branch, 'Cabang berhasil diperbarui')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.softDeleteBranch(req.params.id)
  return sendSuccess(res, null, 'Cabang berhasil dinonaktifkan')
})
