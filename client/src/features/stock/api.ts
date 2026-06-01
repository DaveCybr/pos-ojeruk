import api from '../../lib/axios'
import { ApiResponse, ApiListResponse } from '../../types'
import { StockItem, StockMovement, StockFilters, MovementFilters, AdjustmentInput } from './types'

export const stockApi = {
  list:        (filters?: StockFilters) =>
    api.get<ApiListResponse<StockItem>>('/stock', { params: filters }),

  low:         (branchId?: string) =>
    api.get<ApiResponse<StockItem[]>>('/stock/low', { params: branchId ? { branchId } : undefined }),

  byBranch:    (branchId: string) =>
    api.get<ApiResponse<StockItem[]>>(`/stock/branch/${branchId}`),

  movements:   (filters?: MovementFilters) =>
    api.get<ApiListResponse<StockMovement>>('/stock/movements', { params: filters }),

  adjustment:  (data: AdjustmentInput) =>
    api.post<ApiResponse<StockItem>>('/stock/adjustment', data),
}
