import api from '../../lib/axios'
import type { ApiResponse } from '../../types'

export interface ActiveShift {
  id: string
  branchId: string
  cashierId: string
  status: 'OPEN' | 'CLOSED'
  openingCash: string
  openedAt: string
  cashier: { id: string; name: string }
  branch:  { id: string; name: string }
}

export interface ShiftSummary {
  shift: ActiveShift
  summary: {
    totalTransactions: number
    totalRevenue: number
    cashRevenue: number
    nonCashRevenue: number
    totalItems: number
    expectedClosing: number
  }
}

export const shiftApi = {
  getActive: (branchId: string) =>
    api.get<ApiResponse<ActiveShift | null>>('/shifts/active', { params: { branchId } }),

  open: (branchId: string, openingCash: number) =>
    api.post<ApiResponse<ActiveShift>>('/shifts', { branchId, openingCash }),

  getSummary: (shiftId: string) =>
    api.get<ApiResponse<ShiftSummary>>(`/shifts/${shiftId}/summary`),

  close: (shiftId: string, closingCash: number, notes?: string) =>
    api.put<ApiResponse<ActiveShift>>(`/shifts/${shiftId}/close`, { closingCash, notes }),
}
