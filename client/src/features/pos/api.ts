import api from '../../lib/axios'
import { ApiResponse, ApiListResponse } from '../../types'
import { Transaction, HeldTransaction, CreateTransactionInput, TransactionFilters } from './types'
import type { CartItem } from '../../stores/cart.store'

export const posApi = {
  // Transactions
  listTransactions: (filters?: TransactionFilters) =>
    api.get<ApiListResponse<Transaction>>('/transactions', { params: filters }),

  createTransaction: (data: CreateTransactionInput) =>
    api.post<ApiResponse<Transaction>>('/transactions', data),

  getTransaction: (id: string) =>
    api.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  getTransactionsByBranch: (branchId: string) =>
    api.get<ApiResponse<Transaction[]>>(`/transactions/branch/${branchId}`),

  voidTransaction: (id: string) =>
    api.put<ApiResponse<Transaction>>(`/transactions/${id}/void`),

  // Held transactions
  getHeld: (branchId: string) =>
    api.get<ApiResponse<HeldTransaction[]>>(`/held-transactions/branch/${branchId}`),

  createHeld: (data: { branchId: string; label?: string; cartData: CartItem[] }) =>
    api.post<ApiResponse<HeldTransaction>>('/held-transactions', data),

  deleteHeld: (id: string) =>
    api.delete(`/held-transactions/${id}`),
}
