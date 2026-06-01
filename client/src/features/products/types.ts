export interface ProductInput {
  name: string
  barcode: string
  categoryId: string
  price: number
  costPrice: number
  unit: string
  imageUrl?: string | null
  isActive?: boolean
}

export interface ProductFilters {
  search?: string
  categoryId?: string
  isActive?: 'true' | 'false'
  page?: number
  limit?: number
}
