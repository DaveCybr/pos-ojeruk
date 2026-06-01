import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../stores/auth.store'

interface StockUpdatedPayload {
  product_id: string
  branch_id: string
  quantity: number
}

interface StockLowPayload extends StockUpdatedPayload {
  min_stock: number
  product_name?: string
  branch_name?: string
}

interface RestockRequestedPayload {
  restock_request: {
    id: string
    branch: { name: string }
    product: { name: string }
    quantityRequested: number
  }
}

interface RestockStatusPayload {
  restock_request_id: string
  status: string
}

export function useStockSocket() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const socket = getSocket()

    socket.on('stock:updated', (_payload: StockUpdatedPayload) => {
      qc.invalidateQueries({ queryKey: ['stock'] })
    })

    socket.on('stock:low', (payload: StockLowPayload) => {
      qc.invalidateQueries({ queryKey: ['stock', 'low'] })
      const name   = payload.product_name ?? 'Produk'
      const branch = payload.branch_name  ?? 'cabang'
      toast(
        `⚠️ Stok ${name} di ${branch} hampir habis! (${payload.quantity} tersisa)`,
        { duration: 6000, style: { background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' } },
      )
    })

    socket.on('restock:requested', (payload: RestockRequestedPayload) => {
      if (user.role === 'ADMIN' || user.role === 'WAREHOUSE') {
        qc.invalidateQueries({ queryKey: ['restock-requests'] })
        const r = payload.restock_request
        toast(
          `📦 Permintaan restok baru dari ${r.branch.name}: ${r.product.name} (${r.quantityRequested} unit)`,
          { duration: 5000, style: { background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0c4a6e' } },
        )
      }
    })

    socket.on('restock:status', (payload: RestockStatusPayload) => {
      qc.invalidateQueries({ queryKey: ['restock-requests'] })
      const labels: Record<string, string> = {
        APPROVED: '✅ Permintaan restok kamu disetujui',
        REJECTED: '❌ Permintaan restok kamu ditolak',
        FULFILLED: '✅ Restok sudah dikirim ke cabangmu',
      }
      toast(labels[payload.status] ?? 'Status restok diperbarui', { duration: 5000 })
    })

    return () => {
      socket.off('stock:updated')
      socket.off('stock:low')
      socket.off('restock:requested')
      socket.off('restock:status')
    }
  }, [user, qc])
}
