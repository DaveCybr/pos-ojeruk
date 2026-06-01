import type { Product, Branch, Category, User } from '../../types'

export interface StockItem {
  id: string
  productId: string
  branchId: string
  quantity: number
  minStock: number
  updatedAt: string
  product: Product & { category?: Category }
  branch: Pick<Branch, 'id' | 'name' | 'city'>
}

export interface StockMovement {
  id: string
  productId: string
  branchId: string
  userId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESTOCK'
  quantity: number
  note?: string
  createdAt: string
  product: Pick<Product, 'id' | 'name' | 'barcode'>
  branch: Pick<Branch, 'id' | 'name'>
  user: Pick<User, 'id' | 'name'>
}

export interface StockFilters {
  branchId?: string
  categoryId?: string
  search?: string
  page?: number
  limit?: number
}

export interface MovementFilters {
  branchId?: string
  productId?: string
  type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESTOCK'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface AdjustmentInput {
  productId: string
  branchId: string
  quantity: number
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  note?: string
}
