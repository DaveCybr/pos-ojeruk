import api from '../../lib/axios'
import type { ApiResponse, ApiListResponse } from '../../types'
import type { CustomerListItem, CustomerDetail, CustomerInput, CustomerFilters } from './types'

export const customerApi = {
  list: (filters?: CustomerFilters) =>
    api.get<ApiListResponse<CustomerListItem>>('/customers', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<CustomerDetail>>(`/customers/${id}`),

  create: (data: CustomerInput) =>
    api.post<ApiResponse<CustomerListItem>>('/customers', data),

  update: (id: string, data: CustomerInput) =>
    api.put<ApiResponse<CustomerListItem>>(`/customers/${id}`, data),

  remove: (id: string) =>
    api.delete(`/customers/${id}`),
}
