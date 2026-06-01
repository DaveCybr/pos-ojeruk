import api from '../../lib/axios'
import { ApiResponse } from '../../types'
import { Branch } from '../../types'
import { BranchInput } from './types'

export const branchApi = {
  list: () => api.get<ApiResponse<Branch[]>>('/branches'),
  getById: (id: string) => api.get<ApiResponse<Branch>>(`/branches/${id}`),
  create: (data: BranchInput) => api.post<ApiResponse<Branch>>('/branches', data),
  update: (id: string, data: Partial<BranchInput>) => api.put<ApiResponse<Branch>>(`/branches/${id}`, data),
  remove: (id: string) => api.delete(`/branches/${id}`),
}
