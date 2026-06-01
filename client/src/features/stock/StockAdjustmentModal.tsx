import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { stockApi } from './api'
import { branchApi } from '../branches/api'
import { productApi } from '../products/api'
import type { StockItem } from './types'

const schema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  branchId:  z.string().min(1, 'Cabang wajib dipilih'),
  quantity:  z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  type:      z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  note:      z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const typeLabel: Record<string, string> = { IN: 'Masuk', OUT: 'Keluar', ADJUSTMENT: 'Koreksi' }
const typeBadge: Record<string, string> = {
  IN:         'bg-green-50 text-green-700',
  OUT:        'bg-red-50 text-red-700',
  ADJUSTMENT: 'bg-amber-50 text-amber-700',
}

const inputCls = `w-full border border-stone-300 rounded-lg h-10 px-3 text-sm bg-white
  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all`

interface Props {
  open: boolean
  onClose: () => void
  prefill?: Partial<Pick<StockItem, 'productId' | 'branchId'>>
}

export function StockAdjustmentModal({ open, onClose, prefill }: Props) {
  const qc = useQueryClient()
  const [currentStock, setCurrentStock] = useState<StockItem | null>(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'IN', quantity: 1, productId: prefill?.productId ?? '', branchId: prefill?.branchId ?? '' },
  })

  const watchedProduct = watch('productId')
  const watchedBranch  = watch('branchId')
  const watchedQty     = watch('quantity')
  const watchedType    = watch('type')

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.list().then(r => r.data.data),
    enabled: open,
  })

  const { data: productData } = useQuery({
    queryKey: ['products', { limit: 100 }],
    queryFn: () => productApi.list({ limit: 100 }).then(r => r.data.data),
    enabled: open,
  })

  // Preview current stock when product+branch selected
  useQuery({
    queryKey: ['stock', 'preview', watchedProduct, watchedBranch],
    queryFn: () => stockApi.byBranch(watchedBranch).then(r => {
      const s = r.data.data.find(x => x.productId === watchedProduct) ?? null
      setCurrentStock(s)
      return s
    }),
    enabled: open && !!watchedProduct && !!watchedBranch,
  })

  const previewQty = currentStock
    ? watchedType === 'IN'         ? currentStock.quantity + (watchedQty || 0)
    : watchedType === 'OUT'        ? currentStock.quantity - (watchedQty || 0)
    : watchedType === 'ADJUSTMENT' ? (watchedQty || 0)
    : currentStock.quantity
    : null

  const mutation = useMutation({
    mutationFn: stockApi.adjustment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      toast.success('Stok berhasil dikoreksi')
      reset()
      setCurrentStock(null)
      onClose()
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  return (
    <Modal open={open} onClose={() => { reset(); setCurrentStock(null); onClose() }} title="Koreksi Stok" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Produk</label>
            <select {...register('productId')} className={inputCls}>
              <option value="">— Pilih produk —</option>
              {productData?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.productId && <p className="text-[13px] text-red-600">{errors.productId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Cabang</label>
            <select {...register('branchId')} className={inputCls}>
              <option value="">— Pilih cabang —</option>
              {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.branchId && <p className="text-[13px] text-red-600">{errors.branchId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Tipe</label>
            <select {...register('type')} className={inputCls}>
              <option value="IN">IN — Stok Masuk</option>
              <option value="OUT">OUT — Stok Keluar</option>
              <option value="ADJUSTMENT">ADJUSTMENT — Koreksi Manual</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">
              Jumlah {watchedType === 'ADJUSTMENT' && <span className="text-stone-400 font-normal">(set ke nilai ini)</span>}
            </label>
            <input {...register('quantity')} type="number" min="1" className={inputCls} />
            {errors.quantity && <p className="text-[13px] text-red-600">{errors.quantity.message}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Catatan</label>
            <input {...register('note')} placeholder="Alasan koreksi stok..." className={inputCls} />
          </div>
        </div>

        {/* Preview */}
        {currentStock && previewQty !== null && (
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Preview Perubahan</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Stok sekarang</span>
              <span className="font-mono font-medium text-stone-800">{currentStock.quantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                Tipe
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge[watchedType]}`}>
                  {typeLabel[watchedType]}
                </span>
              </div>
              <span className="font-mono font-medium text-stone-800">{watchedQty || 0}</span>
            </div>
            <div className="border-t border-stone-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-700">Stok setelah</span>
              <span className={`font-mono font-bold text-base ${previewQty < 0 ? 'text-red-600' : previewQty <= currentStock.minStock ? 'text-amber-600' : 'text-green-600'}`}>
                {previewQty}
              </span>
            </div>
            {previewQty < 0 && (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <AlertTriangle size={13} /> Stok tidak boleh negatif
              </div>
            )}
            {previewQty >= 0 && previewQty <= currentStock.minStock && (
              <div className="flex items-center gap-2 text-amber-600 text-xs">
                <AlertTriangle size={13} /> Stok akan di bawah minimum ({currentStock.minStock})
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={() => { reset(); setCurrentStock(null); onClose() }}
            className="px-4 h-10 rounded-lg text-sm text-stone-600 border border-stone-300 hover:bg-stone-50 transition-all">
            Batal
          </button>
          <button type="submit" disabled={mutation.isPending || (previewQty !== null && previewQty < 0)}
            className="px-4 h-10 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 flex items-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Simpan Koreksi
          </button>
        </div>
      </form>
    </Modal>
  )
}
