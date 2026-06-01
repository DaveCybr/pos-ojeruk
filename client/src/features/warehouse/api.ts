import api from '../../lib/axios'
import { ApiResponse, ApiListResponse } from '../../types'
import { RestockRequest, RestockFilters, CreateRestockInput, UpdateRestockStatusInput } from './types'

export const warehouseApi = {
  listRestock: (filters?: RestockFilters) =>
    api.get<ApiListResponse<RestockRequest>>('/restock-requests', { params: filters }),

  createRestock: (data: CreateRestockInput) =>
    api.post<ApiResponse<RestockRequest>>('/restock-requests', data),

  updateRestockStatus: (id: string, data: UpdateRestockStatusInput) =>
    api.put<ApiResponse<RestockRequest>>(`/restock-requests/${id}/status`, data),
}
