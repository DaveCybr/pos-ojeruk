export type Role = 'ADMIN' | 'WAREHOUSE' | 'CASHIER'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS'
export type TransactionStatus = 'COMPLETED' | 'VOIDED' | 'HELD'
export type RestockStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED'
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESTOCK'

export interface Branch { id: string; name: string; address: string; city: string; isActive: boolean; createdAt: string }
export interface User { id: string; name: string; email: string; role: Role; branchId: string | null; branch?: Branch; createdAt: string }
export interface Category { id: string; name: string; description?: string }
export interface Product { id: string; name: string; barcode: string; categoryId: string; category?: Category; price: string; costPrice: string; unit: string; imageUrl?: string; isActive: boolean }
export interface Stock { id: string; productId: string; branchId: string; quantity: number; minStock: number; product?: Product; branch?: Branch }
export interface StockMovement { id: string; productId: string; branchId: string; userId: string; type: StockMovementType; quantity: number; note?: string; createdAt: string; product?: Product; user?: User }
export interface RestockRequest { id: string; branchId: string; productId: string; requestedBy: string; quantityRequested: number; status: RestockStatus; note?: string; createdAt: string; branch?: Branch; product?: Product; requester?: User }
export interface Customer { id: string; name: string; phone?: string; createdAt: string }
export interface TransactionItem { id: string; transactionId: string; productId: string; quantity: number; price: string; discount: string; subtotal: string; product?: Product }
export interface Transaction { id: string; invoiceNo: string; branchId: string; cashierId: string; customerId?: string; subtotal: string; discount: string; tax: string; total: string; paidAmount: string; changeAmount: string; paymentMethod: PaymentMethod; status: TransactionStatus; createdAt: string; branch?: Branch; cashier?: User; customer?: Customer; items?: TransactionItem[] }

export interface ApiResponse<T> { success: boolean; message: string; data: T }
export interface ApiListResponse<T> { success: boolean; message: string; data: T[]; meta: { total: number; page: number; per_page: number; last_page: number } }
