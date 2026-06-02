import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, TrendingUp, Banknote, CreditCard, ShoppingCart } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { shiftApi } from './shiftApi'
import { formatCurrency, formatDateTime } from '../../lib/utils'

interface Props {
  open: boolean
  shiftId: string
  onClose: () => void
  onClosed: () => void
}

export function ShiftCloseModal({ open, shiftId, onClose, onClosed }: Props) {
  const [closingCash, setClosingCash] = useState(0)
  const [notes, setNotes]             = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['shift-summary', shiftId],
    queryFn:  () => shiftApi.getSummary(shiftId).then(r => r.data.data),
    enabled:  open && !!shiftId,
    staleTime: 0,
  })

  const mutation = useMutation({
    mutationFn: () => shiftApi.close(shiftId, closingCash, notes || undefined),
    onSuccess: () => { onClosed() },
  })

  const s = data?.summary
  const shift = data?.shift
  const diff = s ? closingCash - s.expectedClosing : 0
  const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-stone-600'

  return (
    <Modal open={open} onClose={onClose} title="Tutup Shift" maxWidth="max-w-md">
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : s && shift ? (
        <div className="space-y-5">
          {/* Shift meta */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-sm text-stone-600">
            <span className="font-medium text-stone-800">{shift.cashier.name}</span>
            {' · '}Mulai {formatDateTime(shift.openedAt)}
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShoppingCart, label: 'Transaksi', value: String(s.totalTransactions), color: 'text-sky-700', bg: 'bg-sky-50' },
              { icon: TrendingUp,   label: 'Total Omset', value: formatCurrency(s.totalRevenue), color: 'text-orange-700', bg: 'bg-orange-50' },
              { icon: Banknote,     label: 'Tunai (CASH)', value: formatCurrency(s.cashRevenue), color: 'text-green-700', bg: 'bg-green-50' },
              { icon: CreditCard,   label: 'Non-Tunai', value: formatCurrency(s.nonCashRevenue), color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} rounded-xl p-3 border border-stone-100`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <c.icon size={13} className={c.color} />
                  <span className="text-[11px] text-stone-500">{c.label}</span>
                </div>
                <p className={`text-base font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Cash reconciliation */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Modal awal</span>
              <span className="font-medium">{formatCurrency(Number(shift.openingCash))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">+ Penerimaan tunai</span>
              <span className="font-medium">{formatCurrency(s.cashRevenue)}</span>
            </div>
            <div className="flex justify-between border-t border-amber-200 pt-2">
              <span className="font-semibold text-stone-700">Kas seharusnya</span>
              <span className="font-bold text-amber-700">{formatCurrency(s.expectedClosing)}</span>
            </div>
          </div>

          {/* Closing cash input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Kas Aktual di Laci</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium select-none">Rp</span>
              <CurrencyInput
                value={closingCash}
                onChange={setClosingCash}
                placeholder="0"
                autoFocus
                className="w-full h-11 pl-10 pr-4 border border-stone-300 rounded-xl text-right text-base font-semibold
                  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
            {closingCash > 0 && (
              <p className={`text-[13px] font-medium ${diffColor}`}>
                Selisih: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                {diff === 0 && ' · Sesuai ✓'}
                {diff > 0  && ' · Lebih'}
                {diff < 0  && ' · Kurang'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Catatan <span className="text-stone-400 font-normal">(opsional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan penutupan shift..."
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={mutation.isPending}
              className="flex-1 h-10 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-50">
              Batal
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || closingCash === 0}
              className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold
                transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Tutup Shift
            </button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 text-center">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menutup shift'}
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
