import type { Transaction } from '../pos/types'

export interface CustomerListItem {
  id: string
  name: string
  phone: string | null
  createdAt: string
  transactionCount: number
  totalBelanja: number
}

export interface CustomerDetail {
  id: string
  name: string
  phone: string | null
  createdAt: string
  totalBelanja: number
  transactions: Transaction[]
}

export interface CustomerInput {
  name: string
  phone?: string
}

export interface CustomerFilters {
  search?: string
  page?: number
  limit?: number
}
