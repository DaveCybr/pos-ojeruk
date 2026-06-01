import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { userApi } from './api'
import { branchApi } from '../branches/api'
import type { User } from '../../types'

const createSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['ADMIN', 'WAREHOUSE', 'CASHIER']),
  branchId: z.string().nullable().optional(),
})

const updateSchema = createSchema.extend({
  password: z.string().min(6).optional().or(z.literal('')),
})

type CreateValues = z.infer<typeof createSchema>
type UpdateValues = z.infer<typeof updateSchema>

interface Props {
  open: boolean
  onClose: () => void
  user?: User | null
}

const inputCls = `w-full border border-stone-300 rounded-lg h-10 px-3 text-sm bg-white
  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
  placeholder:text-stone-400 transition-all`

const errCls = 'text-[13px] text-red-600 mt-1'

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-orange-50 text-orange-700',
  WAREHOUSE: 'bg-sky-50 text-sky-700',
  CASHIER: 'bg-green-50 text-green-700',
}

export function UserFormModal({ open, onClose, user }: Props) {
  const qc = useQueryClient()
  const isEdit = !!user

  const schema = isEdit ? updateSchema : createSchema
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(schema),
  })

  const role = watch('role')

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.list().then(r => r.data.data),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      reset(isEdit
        ? { name: user.name, email: user.email, password: '', role: user.role, branchId: user.branchId ?? null }
        : { name: '', email: '', password: '', role: 'CASHIER', branchId: null }
      )
    }
  }, [open, isEdit, user, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateValues | UpdateValues) => {
      const payload = { ...data, password: (data.password || undefined) }
      return isEdit ? userApi.update(user!.id, payload) : userApi.create(data as CreateValues)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(isEdit ? 'User berhasil diperbarui' : 'User berhasil dibuat')
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'
      toast.error(msg)
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Nama Lengkap</label>
          <input {...register('name')} placeholder="Ahmad Fauzi" className={inputCls} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Email</label>
          <input {...register('email')} type="email" placeholder="user@ojeruk.com" className={inputCls} />
          {errors.email && <p className={errCls}>{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">
            Password {isEdit && <span className="text-stone-400 font-normal">(kosongkan jika tidak diubah)</span>}
          </label>
          <input {...register('password')} type="password" placeholder="••••••••" className={inputCls} />
          {errors.password && <p className={errCls}>{errors.password.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Role</label>
            <select {...register('role')} className={inputCls}>
              {['ADMIN', 'WAREHOUSE', 'CASHIER'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {role && (
              <span className={`inline-block text-[12px] font-medium px-2 py-0.5 rounded-full ${roleBadge[role]}`}>{role}</span>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Cabang</label>
            <select {...register('branchId')} disabled={role !== 'CASHIER'} className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}>
              <option value="">— Tidak ada —</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {role !== 'CASHIER' && <p className="text-[12px] text-stone-400">Hanya untuk kasir</p>}
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
