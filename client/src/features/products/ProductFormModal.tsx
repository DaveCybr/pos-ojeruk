import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { productApi } from './api'
import { categoryApi } from '../categories/api'
import api from '../../lib/axios'
import type { Product } from '../../types'

const schema = z.object({
  name:       z.string().min(1, 'Nama produk wajib diisi'),
  barcode:    z.string().min(1, 'Barcode wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  price:      z.coerce.number().positive('Harga harus lebih dari 0'),
  costPrice:  z.coerce.number().positive('Harga modal harus lebih dari 0'),
  unit:       z.string().min(1, 'Satuan wajib diisi'),
  isActive:   z.boolean().optional(),
  imageUrl:   z.string().url().nullable().optional(),
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
  const qc      = useQueryClient()
  const isEdit  = !!product
  const fileRef = useRef<HTMLInputElement>(null)

  const [imagePreview,   setImagePreview]   = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const imageUrl = watch('imageUrl')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoryApi.list().then(r => r.data.data),
    enabled:  open,
  })

  useEffect(() => {
    if (open) {
      reset(product ? {
        name: product.name, barcode: product.barcode, categoryId: product.categoryId,
        price: Number(product.price), costPrice: Number(product.costPrice),
        unit: product.unit, isActive: product.isActive, imageUrl: product.imageUrl ?? null,
      } : { name: '', barcode: '', categoryId: '', price: 0, costPrice: 0, unit: 'pcs', isActive: true, imageUrl: null })
      setImagePreview(product?.imageUrl ?? null)
    }
  }, [open, product, reset])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    setImagePreview(URL.createObjectURL(file))
    setUploadingImage(true)

    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post<{ data: { url: string } }>('/products/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setValue('imageUrl', res.data.data.url)
      toast.success('Gambar berhasil diupload')
    } catch {
      toast.error('Gagal upload gambar')
      setImagePreview(product?.imageUrl ?? null)
      setValue('imageUrl', product?.imageUrl ?? null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setValue('imageUrl', null)
    if (fileRef.current) fileRef.current.value = ''
  }

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
        {/* Image upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Foto Produk <span className="text-stone-400 font-normal">(opsional)</span></label>
          <div className="flex items-start gap-3">
            {/* Preview / placeholder */}
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center
                overflow-hidden bg-stone-50 flex-shrink-0 relative cursor-pointer hover:border-orange-300 transition-all"
              onClick={() => !uploadingImage && fileRef.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 size={20} className="animate-spin text-orange-400" />
              ) : imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRemoveImage() }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X size={11} className="text-white" />
                  </button>
                </>
              ) : (
                <ImagePlus size={22} className="text-stone-300" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="h-9 px-3 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-50"
              >
                {uploadingImage ? 'Mengupload...' : imagePreview ? 'Ganti Foto' : 'Pilih Foto'}
              </button>
              <p className="text-[12px] text-stone-400 mt-1.5">JPG/PNG/WebP, maks. 2MB</p>
              {imageUrl && !uploadingImage && (
                <p className="text-[11px] text-green-600 mt-1 truncate max-w-[180px]">✓ Foto tersimpan</p>
              )}
            </div>
          </div>
        </div>

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
          <button type="submit" disabled={mutation.isPending || uploadingImage}
            className="px-4 h-10 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 flex items-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
