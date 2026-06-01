import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as service from '../services/restock.service'
import { emitToWarehouse, emitToBranch, emitToAll } from '../socket'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const query = service.listRestockSchema.parse(req.query)
  const userBranchId = auth.user?.role === 'CASHIER' ? (auth.user.branchId ?? null) : null
  const { requests, total, page, limit } = await service.listRestockRequests(query, userBranchId)
  return sendList(res, requests, { total, page, per_page: limit, last_page: Math.ceil(total / limit) })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const body = service.createRestockSchema.parse(req.body)
  const request = await service.createRestockRequest(body, auth.user!.id, auth.user!.branchId ?? null)

  emitToWarehouse('restock:requested', { restock_request: request })

  return sendSuccess(res, request, 'Permintaan restok berhasil dibuat', 201)
})

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = service.updateStatusSchema.parse(req.body)
  const { updated, newQty, branchId, productId, minStock } = await service.updateRestockStatus(req.params.id, body)

  // Notify cashier branch about status change
  emitToBranch(branchId, 'restock:status', {
    restock_request_id: req.params.id,
    status: body.status,
  })

  // If fulfilled, emit stock events
  if (body.status === 'FULFILLED' && newQty !== null) {
    emitToAll(branchId, 'stock:updated', { product_id: productId, branch_id: branchId, quantity: newQty })
    if (minStock !== null && newQty <= minStock) {
      emitToWarehouse('stock:low', { product_id: productId, branch_id: branchId, quantity: newQty, min_stock: minStock })
    }
  }

  return sendSuccess(res, updated, 'Status restok berhasil diperbarui')
})
