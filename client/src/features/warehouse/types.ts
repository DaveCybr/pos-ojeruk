import type { Branch, Product, User } from '../../types'

export type RestockStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED'

export interface RestockRequest {
  id: string
  branchId: string
  productId: string
  requestedBy: string
  quantityRequested: number
  status: RestockStatus
  note?: string
  createdAt: string
  updatedAt: string
  branch: Pick<Branch, 'id' | 'name' | 'city'>
  product: Pick<Product, 'id' | 'name' | 'barcode'>
  requester: Pick<User, 'id' | 'name'>
}

export interface RestockFilters {
  branchId?: string
  status?: RestockStatus
  page?: number
  limit?: number
}

export interface CreateRestockInput {
  productId: string
  branchId: string
  quantityRequested: number
  note?: string
}

export interface UpdateRestockStatusInput {
  status: 'APPROVED' | 'REJECTED' | 'FULFILLED'
  note?: string
}
