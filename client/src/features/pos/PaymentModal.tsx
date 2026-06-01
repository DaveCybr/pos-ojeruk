import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { posApi } from './api'
import { useCartStore } from '../../stores/cart.store'
import { useAuthStore } from '../../stores/auth.store'
import { formatCurrency } from '../../lib/utils'
import type { PaymentMethod } from '../../types'
import type { Transaction } from './types'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (transaction: Transaction) => void
}

const METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH',     label: 'Tunai',    icon: '💵' },
  { value: 'TRANSFER', label: 'Transfer', icon: '🏦' },
  { value: 'QRIS',     label: 'QRIS',     icon: '📱' },
]

export function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuthStore()
  const { items, discount, total, subtotal, clearCart } = useCartStore()
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [paidInput, setPaidInput] = useState('')

  const tot = total()
  const sub = subtotal()
  const paid = parseFloat(paidInput) || 0
  const change = method === 'CASH' ? Math.max(0, paid - tot) : 0
  const canPay = method !== 'CASH' || paid >= tot

  useEffect(() => {
    if (open) { setMethod('CASH'); setPaidInput('') }
  }, [open])

  const mutation = useMutation({
    mutationFn: () =>
      posApi.createTransaction({
        branchId:      user!.branchId!,
        paymentMethod: method,
        paidAmount:    method === 'CASH' ? paid : tot,
        discount,
        items: items.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          price:     i.price,
          discount:  0,
        })),
      }),
    onSuccess: ({ data }) => {
      clearCart()
      onSuccess(data.data)
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Transaksi gagal'),
  })

  const quickAmounts = [tot, 50_000, 100_000, 200_000].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)

  return (
    <Modal open={open} onClose={onClose} title="Proses Pembayaran" maxWidth="max-w-sm">
      <div className="space-y-4">
        {/* Total */}
        <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
          <p className="text-xs text-stone-500 mb-1">Total Pembayaran</p>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(tot)}</p>
          {discount > 0 && (
            <p className="text-xs text-green-600 mt-1">Sudah termasuk diskon {formatCurrency(discount)}</p>
          )}
        </div>

        {/* Method */}
        <div>
          <p className="text-xs font-medium text-stone-500 mb-2">Metode Pembayaran</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  method === m.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}>
                <span className="text-xl">{m.icon}</span>
                <span className="text-xs">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash input */}
        {method === 'CASH' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500">Uang Diterima</p>
            <input
              type="number"
              value={paidInput}
              onChange={e => setPaidInput(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full h-12 border border-stone-300 rounded-xl px-4 text-right text-lg font-semibold
                focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-1.5">
              {quickAmounts.map(a => (
                <button key={a} onClick={() => setPaidInput(String(a))}
                  className={`h-9 rounded-lg text-xs font-medium border transition-all ${
                    paid === a ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-600 hover:border-orange-300'
                  }`}>
                  {a === tot ? 'Uang Pas' : formatCurrency(a).replace('Rp ', '')}
                </button>
              ))}
            </div>
            {paid >= tot && (
              <div className="flex justify-between py-2 px-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">Kembalian</span>
                <span className="text-sm font-bold text-green-700">{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="text-[13px] text-stone-500 space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(sub)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatCurrency(discount)}</span></div>}
        </div>

        {/* Submit */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!canPay || mutation.isPending}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
            text-white rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
        >
          {mutation.isPending
            ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
            : <><CreditCard size={16} /> Proses Pembayaran</>
          }
        </button>
      </div>
    </Modal>
  )
}
