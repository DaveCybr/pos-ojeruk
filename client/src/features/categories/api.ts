import api from '../../lib/axios'
import { ApiResponse } from '../../types'
import { Category } from '../../types'
import { CategoryInput } from './types'

export const categoryApi = {
  list: () => api.get<ApiResponse<Category[]>>('/categories'),
  create: (data: CategoryInput) => api.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: Partial<CategoryInput>) => api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
}
