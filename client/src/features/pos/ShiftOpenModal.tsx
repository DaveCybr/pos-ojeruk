import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2, Clock, ArrowLeft } from 'lucide-react'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { shiftApi } from './shiftApi'
import type { ActiveShift } from './shiftApi'

interface Props {
  branchId: string
  branchName: string
  onOpened: (shift: ActiveShift) => void
}

export function ShiftOpenModal({ branchId, branchName, onOpened }: Props) {
  const [openingCash, setOpeningCash] = useState(0)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => shiftApi.open(branchId, openingCash).then(r => r.data.data),
    onSuccess: onOpened,
  })

  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Clock size={26} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900">Buka Shift Kasir</h2>
          <p className="text-sm text-stone-500 mt-1">{branchName}</p>
          <p className="text-xs text-stone-400 mt-0.5">{today} · {now}</p>
        </div>

        {/* Opening cash */}
        <div className="space-y-1.5 mb-5">
          <label className="text-sm font-medium text-stone-700">Modal Kas Awal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium select-none">Rp</span>
            <CurrencyInput
              value={openingCash}
              onChange={setOpeningCash}
              placeholder="0"
              autoFocus
              className="w-full h-12 pl-10 pr-4 border border-stone-300 rounded-xl text-right text-lg font-semibold
                focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          <p className="text-[12px] text-stone-400">Jumlah uang tunai yang ada di laci kasir saat ini</p>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-base
            transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Membuka...</> : 'Mulai Shift'}
        </button>

        {mutation.isError && (
          <p className="text-sm text-red-600 text-center mt-3">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal membuka shift'}
          </p>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-1.5 mt-3 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </button>
      </div>
    </div>
  )
}
