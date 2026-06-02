import api from '../../lib/axios'
import type { ApiResponse } from '../../types'
import type { SummaryData, SalesData, ProfitData, StockData, ReportFilters } from './types'

export const reportsApi = {
  summary: (branchId?: string) =>
    api.get<ApiResponse<SummaryData>>('/reports/summary', { params: { branchId } }),

  sales: (filters: ReportFilters) =>
    api.get<ApiResponse<SalesData>>('/reports/sales', { params: filters }),

  profit: (filters: ReportFilters) =>
    api.get<ApiResponse<ProfitData>>('/reports/profit', { params: filters }),

  stock: (filters: ReportFilters) =>
    api.get<ApiResponse<StockData>>('/reports/stock', { params: filters }),
}
