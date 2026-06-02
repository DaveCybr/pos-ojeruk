import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as service from '../services/reports.service'

function getBranchFilter(req: Request): string | undefined {
  const auth = req as AuthRequest
  if (auth.user?.role === 'CASHIER') return auth.user.branchId ?? undefined
  return (req.query.branchId as string) || undefined
}

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getSummary(getBranchFilter(req))
  return sendSuccess(res, data, 'Ringkasan berhasil diambil')
})

export const sales = asyncHandler(async (req: Request, res: Response) => {
  const query = service.reportQuerySchema.parse({
    ...req.query,
    branchId: getBranchFilter(req),
  })
  const data = await service.getSalesReport(query)
  return sendSuccess(res, data, 'Laporan penjualan berhasil diambil')
})

export const profit = asyncHandler(async (req: Request, res: Response) => {
  const query = service.reportQuerySchema.parse({
    ...req.query,
    branchId: getBranchFilter(req),
  })
  const data = await service.getProfitReport(query)
  return sendSuccess(res, data, 'Laporan profit berhasil diambil')
})

export const stock = asyncHandler(async (req: Request, res: Response) => {
  const query = service.reportQuerySchema.parse({
    ...req.query,
    branchId: getBranchFilter(req),
  })
  const data = await service.getStockReport({
    branchId:   query.branchId,
    categoryId: query.categoryId,
    status:     query.status,
  })
  return sendSuccess(res, data, 'Laporan stok berhasil diambil')
})
