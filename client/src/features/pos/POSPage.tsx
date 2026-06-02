import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import toast from 'react-hot-toast'
import { POSLayout } from '../../components/layout/POSLayout'
import { ProductGrid } from './ProductGrid'
import { CartPanel } from './CartPanel'
import { PaymentModal } from './PaymentModal'
import { ReceiptModal } from './ReceiptModal'
import { HeldTransactionsDrawer } from './HeldTransactionsDrawer'
import { posApi } from './api'
import { useAuthStore } from '../../stores/auth.store'
import { useCartStore } from '../../stores/cart.store'
import type { Transaction } from './types'

// ─── POS Page ─────────────────────────────────────────────────────────────────

export function POSPage() {
  const { user } = useAuthStore()
  const { items, discount, clearCart } = useCartStore()
  const qc = useQueryClient()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'
  const branchStorageKey = `pos_branch_${user?.id}`

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    if (!isAdmin) return user?.branchId ?? ''
    return localStorage.getItem(branchStorageKey) ?? ''
  })

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [heldOpen, setHeldOpen]       = useState(false)
  const [lastTx, setLastTx]           = useState<Transaction | null>(null)

  const handleBranchChange = (id: string) => {
    setActiveBranchId(id)
    if (isAdmin) localStorage.setItem(branchStorageKey, id)
    // reset cart when switching branch
    clearCart()
  }

  // ── All hooks MUST be declared before any conditional return ──────────────

  const holdMutation = useMutation({
    mutationFn: () => posApi.createHeld({ branchId: activeBranchId, cartData: items }),
    onSuccess: () => {
      clearCart()
      qc.invalidateQueries({ queryKey: ['held-transactions'] })
      toast.success('Transaksi berhasil ditahan')
    },
    onError: () => toast.error('Gagal menahan transaksi'),
  })

  const handlePaymentSuccess = (tx: Transaction) => {
    setPaymentOpen(false)
    setLastTx(tx)
    setReceiptOpen(true)
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['stock'] })
  }

  const handleReceiptClose = () => {
    setReceiptOpen(false)
    setLastTx(null)
  }

  const handleHold = () => {
    if (items.length === 0) { toast('Keranjang kosong'); return }
    holdMutation.mutate()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (receiptOpen)  { handleReceiptClose(); return }
        if (paymentOpen)  { setPaymentOpen(false); return }
        if (heldOpen)     { setHeldOpen(false); return }
      }
      if (e.key === 'F2' && !paymentOpen && !receiptOpen && items.length > 0) {
        e.preventDefault()
        setPaymentOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  // ── Conditional returns AFTER all hooks ──────────────────────────────────

  if (user?.role === 'CASHIER' && !user.branchId) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <POSLayout
        activeBranchId={activeBranchId}
        onBranchChange={isAdmin ? handleBranchChange : undefined}
        onShowHeld={() => setHeldOpen(true)}
        onShowHistory={() => window.open('/transactions', '_blank')}
      >
        {!activeBranchId ? (
          /* Admin belum pilih cabang — prompt di tengah halaman */
          <div className="flex-1 flex items-center justify-center bg-stone-50">
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store size={26} className="text-orange-500" />
              </div>
              <p className="text-stone-700 font-medium">Pilih cabang dari dropdown di header</p>
              <p className="text-stone-400 text-sm mt-1">untuk memulai sesi kasir</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-[6] overflow-hidden bg-stone-50 border-r border-stone-200">
              <ProductGrid branchId={activeBranchId} />
            </div>
            <div className="flex-[4] overflow-hidden">
              <CartPanel
                onCheckout={() => {
                  if (items.length === 0) { toast('Tambahkan produk terlebih dahulu'); return }
                  setPaymentOpen(true)
                }}
                onHold={handleHold}
              />
            </div>
          </>
        )}
      </POSLayout>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        branchId={activeBranchId}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={handleReceiptClose}
        transaction={lastTx}
      />
      <HeldTransactionsDrawer
        open={heldOpen}
        onClose={() => setHeldOpen(false)}
        branchId={activeBranchId}
      />

      {discount > 0 && null}
    </>
  )
}
