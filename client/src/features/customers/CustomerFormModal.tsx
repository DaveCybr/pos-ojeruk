import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '../../components/ui/Modal'
import { customerApi } from './api'
import type { CustomerListItem, CustomerInput } from './types'

interface Props {
  open: boolean
  onClose: () => void
  customer?: CustomerListItem | null
  onSuccess?: (c: CustomerListItem) => void
}

function validate(name: string, phone: string) {
  const errs: { name?: string; phone?: string } = {}
  if (name.trim().length < 2) errs.name = 'Nama minimal 2 karakter'
  if (phone && !/^\d{10,13}$/.test(phone)) errs.phone = 'Nomor HP harus 10–13 digit angka'
  return errs
}

export function CustomerFormModal({ open, onClose, customer, onSuccess }: Props) {
  const qc = useQueryClient()
  const isEdit = !!customer

  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? '')
      setPhone(customer?.phone ?? '')
      setErrors({})
    }
  }, [open, customer])

  const mutation = useMutation({
    mutationFn: () => {
      const data: CustomerInput = { name: name.trim(), phone: phone.trim() || undefined }
      return isEdit
        ? customerApi.update(customer!.id, data).then(r => r.data.data)
        : customerApi.create(data).then(r => r.data.data)
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success(isEdit ? 'Pelanggan berhasil diperbarui' : 'Pelanggan berhasil ditambahkan')
      onSuccess?.(c)
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Terjadi kesalahan')
    },
  })

  const handleSubmit = () => {
    const errs = validate(name, phone)
    setErrors(errs)
    if (Object.keys(errs).length) return
    mutation.mutate()
  }

  const fieldCls = (err?: string) =>
    `w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-all ${
      err
        ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400/20'
        : 'border-stone-300 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20'
    }`

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'} maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Nama <span className="text-red-400">*</span></label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nama pelanggan"
            className={fieldCls(errors.name)}
            autoFocus
          />
          {errors.name && <p className="text-[13px] text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">No HP <span className="text-stone-400 font-normal">(opsional)</span></label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            type="tel"
            inputMode="numeric"
            className={fieldCls(errors.phone)}
          />
          {errors.phone && <p className="text-[13px] text-red-600">{errors.phone}</p>}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={mutation.isPending}
            className="flex-1 h-10 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium
              transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
