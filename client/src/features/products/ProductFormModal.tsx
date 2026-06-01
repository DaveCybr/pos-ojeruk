import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { productApi } from './api'
import { categoryApi } from '../categories/api'
import type { Product } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  barcode: z.string().min(1, 'Barcode wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  price: z.coerce.number().positive('Harga harus lebih dari 0'),
  costPrice: z.coerce.number().positive('Harga modal harus lebih dari 0'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  isActive: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  product?: Product | null
}

const inputCls = `w-full border border-stone-300 rounded-lg h-10 px-3 text-sm bg-white
  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
  placeholder:text-stone-400 transition-all`

const errCls = 'text-[13px] text-red-600 mt-1'

export function ProductFormModal({ open, onClose, product }: Props) {
  const qc = useQueryClient()
  const isEdit = !!product

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then(r => r.data.data),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      reset(product ? {
        name: product.name, barcode: product.barcode, categoryId: product.categoryId,
        price: Number(product.price), costPrice: Number(product.costPrice),
        unit: product.unit, isActive: product.isActive,
      } : { name: '', barcode: '', categoryId: '', price: 0, costPrice: 0, unit: 'pcs', isActive: true })
    }
  }, [open, product, reset])

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      isEdit ? productApi.update(product!.id, data) : productApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? 'Produk berhasil diperbarui' : 'Produk berhasil dibuat')
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'
      toast.error(msg)
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Produk' : 'Tambah Produk'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Nama Produk</label>
            <input {...register('name')} placeholder="Jeruk Pontianak" className={inputCls} />
            {errors.name && <p className={errCls}>{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Barcode</label>
            <input {...register('barcode')} placeholder="JRK001" className={inputCls} />
            {errors.barcode && <p className={errCls}>{errors.barcode.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Kategori</label>
            <select {...register('categoryId')} className={inputCls}>
              <option value="">— Pilih kategori —</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className={errCls}>{errors.categoryId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Harga Jual (Rp)</label>
            <input {...register('price')} type="number" placeholder="25000" className={inputCls} />
            {errors.price && <p className={errCls}>{errors.price.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Harga Modal (Rp)</label>
            <input {...register('costPrice')} type="number" placeholder="18000" className={inputCls} />
            {errors.costPrice && <p className={errCls}>{errors.costPrice.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Satuan</label>
            <input {...register('unit')} placeholder="kg / pcs / cup" className={inputCls} />
            {errors.unit && <p className={errCls}>{errors.unit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Status</label>
            <select {...register('isActive', { setValueAs: v => v === 'true' || v === true })} className={inputCls}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 h-10 rounded-lg text-sm text-stone-600 border border-stone-300 hover:bg-stone-50 transition-all">
            Batal
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="px-4 h-10 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 flex items-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
