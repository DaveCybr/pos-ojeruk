import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, PauseCircle, Loader2 } from 'lucide-react'
import { formatDateTime } from '../../lib/utils'
import { posApi } from './api'
import { useCartStore } from '../../stores/cart.store'
import type { HeldTransaction } from './types'
import type { CartItem } from '../../stores/cart.store'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  branchId: string
}

export function HeldTransactionsDrawer({ open, onClose, branchId }: Props) {
  const qc = useQueryClient()
  const { items: cartItems, clearCart, addItem } = useCartStore()

  const { data: held = [], isLoading } = useQuery({
    queryKey: ['held-transactions', branchId],
    queryFn: () => posApi.getHeld(branchId).then(r => r.data.data),
    enabled: open && !!branchId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteHeld(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['held-transactions'] }),
  })

  const handleResume = (h: HeldTransaction) => {
    if (cartItems.length > 0) {
      if (!confirm('Keranjang sekarang akan diganti. Lanjutkan?')) return
    }
    clearCart()
    const cartData = Array.isArray(h.cartData) ? (h.cartData as CartItem[]) : []
    cartData.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ productId: item.productId, name: item.name, price: item.price, discount: item.discount, imageUrl: item.imageUrl, categoryName: item.categoryName })
      }
    })
    deleteMutation.mutate(h.id)
    toast.success('Transaksi dilanjutkan')
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col
        transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <PauseCircle size={18} className="text-orange-500" />
            <span className="font-semibold text-stone-800">Transaksi Ditahan</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : held.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <PauseCircle size={32} className="text-stone-200 mb-2" />
              <p className="text-sm text-stone-400">Tidak ada transaksi ditahan</p>
            </div>
          ) : held.map(h => {
            const cartData = Array.isArray(h.cartData) ? (h.cartData as CartItem[]) : []
            const itemCount = cartData.reduce((s: number, i: CartItem) => s + i.quantity, 0)
            return (
              <div key={h.id} className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{h.label || 'Transaksi Ditahan'}</p>
                    <p className="text-[12px] text-stone-400">{formatDateTime(h.createdAt)}</p>
                    <p className="text-[12px] text-stone-500">{itemCount} item</p>
                  </div>
                  <button onClick={() => deleteMutation.mutate(h.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <button onClick={() => handleResume(h)}
                  className="w-full h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
                  Lanjutkan
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
