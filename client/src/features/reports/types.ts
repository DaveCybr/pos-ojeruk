export interface SummaryToday {
  totalRevenue: number
  totalTransactions: number
  totalItemsSold: number
  totalProfit: number
}

export interface TopProduct {
  productId: string
  name: string
  qty: number
  revenue: number
}

export interface PaymentBreakdown {
  method: string
  count: number
  total: number
}

export interface SummaryData {
  today: SummaryToday
  revenueGrowth: number
  lowStockCount: number
  outOfStockCount: number
  topProducts: TopProduct[]
  paymentBreakdown: PaymentBreakdown[]
  recentTransactions: unknown[]
}

export interface SalesPeriod {
  label: string
  totalRevenue: number
  totalTransactions: number
  totalItemsSold: number
}

export interface SalesSummary {
  totalRevenue: number
  totalTransactions: number
  totalItemsSold: number
  avgPerTransaction: number
}

export interface SalesTopProduct {
  productId: string
  name: string
  qty: number
  revenue: number
}

export interface SalesData {
  series: SalesPeriod[]
  summary: SalesSummary
  topProducts: SalesTopProduct[]
  paymentBreakdown: PaymentBreakdown[]
}

export interface ProfitPeriod {
  label: string
  revenue: number
  cogs: number
  grossProfit: number
  profitMargin: number
}

export interface ProfitTopProduct {
  productId: string
  name: string
  revenue: number
  cogs: number
  profit: number
  margin: number
}

export interface ProfitSummary {
  totalRevenue: number
  totalCogs: number
  totalProfit: number
  avgMargin: number
}

export interface ProfitData {
  series: ProfitPeriod[]
  summary: ProfitSummary
  topProducts: ProfitTopProduct[]
}

export interface StockSummary {
  stockValue: number
  totalSKU: number
  lowStockCount: number
  outOfStockCount: number
}

export interface StockItem {
  id: string
  productId: string
  productName: string
  barcode: string
  category: { id: string; name: string } | null
  branchId: string
  branchName: string
  quantity: number
  minStock: number
  costPrice: number
  stockValue: number
  status: 'ok' | 'low' | 'out'
  updatedAt: string
}

export interface StockData {
  summary: StockSummary
  lowStockItems: { productName: string; branchName: string; quantity: number; minStock: number }[]
  outOfStockItems: { productName: string; branchName: string; quantity: number; minStock: number }[]
  stockList: StockItem[]
}

export interface ReportFilters {
  branchId?: string
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
  categoryId?: string
  status?: 'low' | 'out' | 'ok'
}
