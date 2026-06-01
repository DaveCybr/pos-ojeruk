import type { PaymentMethod, TransactionStatus, Product, Branch, User, Customer } from '../../types'

export interface TransactionItem {
  id: string
  transactionId: string
  productId: string
  quantity: number
  price: string
  discount: string
  subtotal: string
  product?: Pick<Product, 'id' | 'name' | 'barcode' | 'unit'>
}

export interface Transaction {
  id: string
  invoiceNo: string
  branchId: string
  cashierId: string
  customerId?: string
  subtotal: string
  discount: string
  tax: string
  total: string
  paidAmount: string
  changeAmount: string
  paymentMethod: PaymentMethod
  status: TransactionStatus
  createdAt: string
  branch?: Pick<Branch, 'id' | 'name' | 'city'>
  cashier?: Pick<User, 'id' | 'name'>
  customer?: Pick<Customer, 'id' | 'name' | 'phone'>
  items?: TransactionItem[]
}

export interface HeldTransaction {
  id: string
  branchId: string
  cashierId: string
  label?: string
  cartData: unknown
  createdAt: string
}

export interface CreateTransactionInput {
  branchId: string
  customerId?: string | null
  paymentMethod: PaymentMethod
  paidAmount: number
  discount: number
  items: { productId: string; quantity: number; price: number; discount: number }[]
}

export interface TransactionFilters {
  branchId?: string
  cashierId?: string
  status?: TransactionStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
