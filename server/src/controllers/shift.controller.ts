import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as service from '../services/shift.service'

function auth(req: Request) { return req as AuthRequest }

export const getActive = asyncHandler(async (req: Request, res: Response) => {
  const { user } = auth(req)
  const branchId = (req.query.branchId as string) || user?.branchId || ''
  if (!branchId) return sendSuccess(res, null, 'Tidak ada branch aktif')
  const shift = await service.getActiveShift(branchId, user!.id)
  return sendSuccess(res, shift, shift ? 'Shift aktif ditemukan' : 'Tidak ada shift aktif')
})

export const open = asyncHandler(async (req: Request, res: Response) => {
  const { user } = auth(req)
  const data  = service.openShiftSchema.parse(req.body)
  const shift = await service.openShift(data, user!.id)
  return sendSuccess(res, shift, 'Shift berhasil dibuka', 201)
})

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const { user } = auth(req)
  const data = await service.getShiftSummary(req.params.id, user!.id)
  return sendSuccess(res, data, 'Ringkasan shift berhasil diambil')
})

export const close = asyncHandler(async (req: Request, res: Response) => {
  const { user } = auth(req)
  const data  = service.closeShiftSchema.parse(req.body)
  const shift = await service.closeShift(req.params.id, user!.id, data)
  return sendSuccess(res, shift, 'Shift berhasil ditutup')
})

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { user } = auth(req)
  const query = service.listShiftsSchema.parse(req.query)
  const userCashierId = user?.role === 'CASHIER' ? user.id : undefined
  const { shifts, total, page, limit } = await service.listShifts(query, userCashierId)
  return sendList(res, shifts, { total, page, per_page: limit, last_page: Math.ceil(total / limit) })
})
