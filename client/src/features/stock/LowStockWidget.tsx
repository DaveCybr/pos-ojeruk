import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, PackagePlus, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { stockApi } from './api'

interface Props {
  onRequestRestock?: (productId: string, branchId: string) => void
}

export function LowStockWidget({ onRequestRestock }: Props) {
  const { user } = useAuthStore()

  const { data: items, isLoading } = useQuery({
    queryKey: ['stock', 'low'],
    queryFn: () => stockApi.low(user?.role === 'CASHIER' ? (user.branchId ?? undefined) : undefined).then(r => r.data.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-24">
      <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
    </div>
  )

  if (!items?.length) return (
    <div className="flex items-center gap-2 py-4 text-sm text-green-600">
      <span className="w-2 h-2 bg-green-400 rounded-full" /> Semua stok aman
    </div>
  )

  return (
    <div className="space-y-2">
      {items.map(s => (
        <div key={s.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
          s.quantity === 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle size={14} className={s.quantity === 0 ? 'text-red-500 flex-shrink-0' : 'text-amber-500 flex-shrink-0'} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{s.product.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  s.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {s.quantity === 0 ? 'Habis' : `Sisa ${s.quantity}`}
                </span>
                <span className="text-xs text-stone-400">{s.branch.name}</span>
              </div>
            </div>
          </div>
          {onRequestRestock && (
            <button onClick={() => onRequestRestock(s.productId, s.branchId)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-100 transition-all flex-shrink-0 ml-2">
              <PackagePlus size={12} /> Restok
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
