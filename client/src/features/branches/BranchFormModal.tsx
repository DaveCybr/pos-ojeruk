import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { branchApi } from './api'
import type { Branch } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Nama cabang wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  branch?: Branch | null
}

const inputCls = `w-full border border-stone-300 rounded-lg h-10 px-3 text-sm bg-white
  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
  placeholder:text-stone-400 transition-all`

const errCls = 'text-[13px] text-red-600 mt-1'

export function BranchFormModal({ open, onClose, branch }: Props) {
  const qc = useQueryClient()
  const isEdit = !!branch

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) reset(branch ? { name: branch.name, address: branch.address, city: branch.city } : { name: '', address: '', city: '' })
  }, [open, branch, reset])

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      isEdit ? branchApi.update(branch!.id, data) : branchApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success(isEdit ? 'Cabang berhasil diperbarui' : 'Cabang berhasil dibuat')
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'
      toast.error(msg)
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Cabang' : 'Tambah Cabang'}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Nama Cabang</label>
          <input {...register('name')} placeholder="O-Jeruk Jember" className={inputCls} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Alamat</label>
          <input {...register('address')} placeholder="Jl. Mastrip No. 1" className={inputCls} />
          {errors.address && <p className={errCls}>{errors.address.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Kota</label>
          <input {...register('city')} placeholder="Jember" className={inputCls} />
          {errors.city && <p className={errCls}>{errors.city.message}</p>}
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
