import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendList } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as service from '../services/transactions.service'
import { emitToAll, emitToWarehouse } from '../socket'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const query = service.listTransactionsSchema.parse(req.query)
  const userBranchId = auth.user?.role === 'CASHIER' ? (auth.user.branchId ?? null) : null
  const { transactions, total, page, limit } = await service.listTransactions(query, userBranchId)
  return sendList(res, transactions, { total, page, per_page: limit, last_page: Math.ceil(total / limit) })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const body = service.createTransactionSchema.parse(req.body)
  const { transaction, stockUpdates } = await service.createTransaction(body, auth.user!.id)

  // Emit transaction event
  emitToAll(body.branchId, 'transaction:new', { transaction, branch_id: body.branchId })

  // Emit stock events
  for (const s of stockUpdates) {
    emitToAll(s.branchId, 'stock:updated', { product_id: s.productId, branch_id: s.branchId, quantity: s.quantity })
    if (s.quantity <= s.minStock) {
      emitToWarehouse('stock:low', { product_id: s.productId, branch_id: s.branchId, quantity: s.quantity, min_stock: s.minStock })
    }
  }

  return sendSuccess(res, transaction, 'Transaksi berhasil dibuat', 201)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const tx = await service.getTransactionById(req.params.id)
  return sendSuccess(res, tx, 'Data transaksi berhasil diambil')
})

export const getByBranch = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getTransactionsByBranch(req.params.id)
  return sendSuccess(res, data, 'Transaksi cabang berhasil diambil')
})

export const voidTx = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthRequest
  const { voided, stockUpdates, branchId } = await service.voidTransaction(req.params.id, auth.user!.id)

  for (const s of stockUpdates) {
    emitToAll(s.branchId, 'stock:updated', { product_id: s.productId, branch_id: s.branchId, quantity: s.quantity })
  }
  emitToAll(branchId, 'transaction:new', { voided: true, branch_id: branchId })

  return sendSuccess(res, voided, 'Transaksi berhasil di-void')
})
