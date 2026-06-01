import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as service from '../services/stock.service'
import { emitToAll, emitToWarehouse, emitToBranch } from '../socket'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const query = service.listStockSchema.parse({
    ...req.query,
    // CASHIER: force own branch
    ...(auth.user?.role === 'CASHIER' && { branchId: auth.user.branchId ?? undefined }),
  })
  const { items, total, page, limit } = await service.listStock(query)
  return sendList(res, items, { total, page, per_page: limit, last_page: Math.ceil(total / limit) })
})

export const lowStock = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const branchId = auth.user?.role === 'CASHIER' ? (auth.user.branchId ?? undefined) : (req.query.branchId as string | undefined)
  const data = await service.getLowStock(branchId)
  return sendSuccess(res, data, 'Stok rendah berhasil diambil')
})

export const byBranch = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getStockByBranch(req.params.branchId)
  return sendSuccess(res, data, 'Stok cabang berhasil diambil')
})

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const query = service.listMovementsSchema.parse({
    ...req.query,
    ...(auth.user?.role === 'CASHIER' && { branchId: auth.user.branchId ?? undefined }),
  })
  const { movements, total, page, limit } = await service.listMovements(query)
  return sendList(res, movements, { total, page, per_page: limit, last_page: Math.ceil(total / limit) })
})

export const adjustment = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const body = service.adjustmentSchema.parse(req.body)
  const { stock, newQty, isLow } = await service.adjustStock(body, auth.user!.id)

  // Emit real-time events
  emitToAll(body.branchId, 'stock:updated', {
    product_id: body.productId,
    branch_id:  body.branchId,
    quantity:   newQty,
  })
  if (isLow) {
    emitToWarehouse('stock:low', {
      product_id: body.productId,
      branch_id:  body.branchId,
      quantity:   newQty,
      min_stock:  stock.minStock,
    })
  }

  return sendSuccess(res, stock, 'Stok berhasil dikoreksi')
})
