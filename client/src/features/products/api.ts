import api from '../../lib/axios'
import { ApiResponse, ApiListResponse, Product } from '../../types'
import { ProductInput, ProductFilters } from './types'

export const productApi = {
  list: (filters?: ProductFilters) =>
    api.get<ApiListResponse<Product>>('/products', { params: filters }),
  getById: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get<ApiResponse<Product>>(`/products/barcode/${barcode}`),
  create: (data: ProductInput) => api.post<ApiResponse<Product>>('/products', data),
  update: (id: string, data: Partial<ProductInput>) => api.put<ApiResponse<Product>>(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
}
