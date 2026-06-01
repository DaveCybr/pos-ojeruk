import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

export function POSPage() {
  const { user } = useAuthStore()
  const { items, discount, clearCart } = useCartStore()
  const qc = useQueryClient()

  const [paymentOpen, setPaymentOpen]   = useState(false)
  const [receiptOpen, setReceiptOpen]   = useState(false)
  const [heldOpen, setHeldOpen]         = useState(false)
  const [lastTx, setLastTx]             = useState<Transaction | null>(null)

  // Guard: CASHIER must have branchId
  if (!user?.branchId) {
    return <Navigate to="/dashboard" replace />
  }

  const branchId = user.branchId

  // Hold mutation
  const holdMutation = useMutation({
    mutationFn: () =>
      posApi.createHeld({ branchId, cartData: items }),
    onSuccess: () => {
      clearCart()
      qc.invalidateQueries({ queryKey: ['held-transactions'] })
      toast.success('Transaksi berhasil ditahan')
    },
    onError: () => toast.error('Gagal menahan transaksi'),
  })

  const handleHold = () => {
    if (items.length === 0) { toast('Keranjang kosong'); return }
    holdMutation.mutate()
  }

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (receiptOpen) handleReceiptClose()
        else if (paymentOpen) setPaymentOpen(false)
        else if (heldOpen) setHeldOpen(false)
      }
      if (e.key === 'F2' && !paymentOpen && !receiptOpen && items.length > 0) {
        e.preventDefault()
        setPaymentOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  return (
    <>
      <POSLayout
        onShowHeld={() => setHeldOpen(true)}
        onShowHistory={() => window.open('/transactions', '_blank')}
      >
        {/* Left — products */}
        <div className="flex-[6] overflow-hidden bg-stone-50 border-r border-stone-200">
          <ProductGrid branchId={branchId} />
        </div>

        {/* Right — cart */}
        <div className="flex-[4] overflow-hidden">
          <CartPanel
            onCheckout={() => {
              if (items.length === 0) { toast('Tambahkan produk terlebih dahulu'); return }
              setPaymentOpen(true)
            }}
            onHold={handleHold}
          />
        </div>
      </POSLayout>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        open={receiptOpen}
        onClose={handleReceiptClose}
        transaction={lastTx}
      />

      <HeldTransactionsDrawer
        open={heldOpen}
        onClose={() => setHeldOpen(false)}
        branchId={branchId}
      />

      {/* Discount reference (unused in render, kept to avoid TS warnings) */}
      {discount > 0 && null}
    </>
  )
}
