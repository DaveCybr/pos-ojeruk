import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { warehouseApi } from './api'
import { productApi } from '../products/api'
import { stockApi } from '../stock/api'
import { useAuthStore } from '../../stores/auth.store'

const schema = z.object({
  productId:         z.string().min(1, 'Produk wajib dipilih'),
  quantityRequested: z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  note:              z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const inputCls = `w-full border border-stone-300 rounded-lg h-10 px-3 text-sm bg-white
  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all`

interface Props {
  open: boolean
  onClose: () => void
  prefillProductId?: string
}

export function RestockRequestModal({ open, onClose, prefillProductId }: Props) {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: prefillProductId ?? '', quantityRequested: 1 },
  })

  useEffect(() => {
    if (open) reset({ productId: prefillProductId ?? '', quantityRequested: 1 })
  }, [open, prefillProductId, reset])

  const watchedProduct = watch('productId')

  const { data: products } = useQuery({
    queryKey: ['products', { limit: 100 }],
    queryFn: () => productApi.list({ limit: 100, isActive: 'true' }).then(r => r.data.data),
    enabled: open,
  })

  const { data: stockItems } = useQuery({
    queryKey: ['stock', 'branch', user?.branchId],
    queryFn: () => stockApi.byBranch(user!.branchId!).then(r => r.data.data),
    enabled: open && !!user?.branchId,
  })

  const currentStock = stockItems?.find(s => s.productId === watchedProduct)

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      warehouseApi.createRestock({ ...data, branchId: user!.branchId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restock-requests'] })
      toast.success('Permintaan restok berhasil dikirim')
      onClose()
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Ajukan Permintaan Restok">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Produk</label>
          <select {...register('productId')} className={inputCls}>
            <option value="">— Pilih produk —</option>
            {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.productId && <p className="text-[13px] text-red-600">{errors.productId.message}</p>}
          {currentStock && (
            <p className="text-[13px] text-stone-500">
              Stok sekarang: <span className={`font-semibold ${currentStock.quantity === 0 ? 'text-red-600' : currentStock.quantity <= currentStock.minStock ? 'text-amber-600' : 'text-green-600'}`}>
                {currentStock.quantity}
              </span> {currentStock.product.unit} (min: {currentStock.minStock})
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Jumlah yang Diminta</label>
          <input {...register('quantityRequested')} type="number" min="1" className={inputCls} />
          {errors.quantityRequested && <p className="text-[13px] text-red-600">{errors.quantityRequested.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Catatan</label>
          <input {...register('note')} placeholder="Alasan permintaan restok..." className={inputCls} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 h-10 rounded-lg text-sm text-stone-600 border border-stone-300 hover:bg-stone-50 transition-all">
            Batal
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="px-4 h-10 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 flex items-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Kirim Permintaan
          </button>
        </div>
      </form>
    </Modal>
  )
}
