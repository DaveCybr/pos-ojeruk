import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as service from '../services/held-transactions.service'

export const getByBranch = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getHeldByBranch(req.params.branchId)
  return sendSuccess(res, data, 'Transaksi tahan berhasil diambil')
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const body = service.createHeldSchema.parse({ ...req.body, cashierId: auth.user!.id })
  const held = await service.createHeld(body)
  return sendSuccess(res, held, 'Transaksi berhasil ditahan', 201)
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteHeld(req.params.id)
  return sendSuccess(res, null, 'Transaksi tahan berhasil dihapus')
})
