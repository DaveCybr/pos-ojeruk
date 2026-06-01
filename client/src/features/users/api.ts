import api from '../../lib/axios'
import { ApiResponse, ApiListResponse, User } from '../../types'
import { UserInput, UserUpdateInput, UserFilters } from './types'

export const userApi = {
  list: (filters?: UserFilters & { page?: number; limit?: number }) =>
    api.get<ApiListResponse<User>>('/users', { params: filters }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: UserInput) => api.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: UserUpdateInput) => api.put<ApiResponse<User>>(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
}
