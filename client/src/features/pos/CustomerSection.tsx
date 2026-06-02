import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, X, Loader2, Search } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { customerApi } from '../customers/api'
import type { CustomerListItem } from '../customers/types'

// ─── Mini Create Form ─────────────────────────────────────────────────────────

function MiniCreateForm({ onCreated, onCancel }: {
  onCreated: (c: CustomerListItem) => void
  onCancel: () => void
}) {
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr]     = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => customerApi.create({ name: name.trim(), phone: phone.trim() || undefined })
      .then(r => r.data.data),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      onCreated(c)
    },
    onError: (e: unknown) => {
      setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal membuat pelanggan')
    },
  })

  const handleSubmit = () => {
    if (name.trim().length < 2) { setErr('Nama minimal 2 karakter'); return }
    if (phone && !/^\d{10,13}$/.test(phone.trim())) { setErr('No HP harus 10–13 digit'); return }
    setErr('')
    mutation.mutate()
  }

  return (
    <div className="p-3 border-t border-stone-100 space-y-2">
      <p className="text-xs font-medium text-stone-600">Buat Pelanggan Baru</p>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nama *"
        autoFocus
        className="w-full h-8 border border-stone-200 rounded-lg px-2.5 text-sm focus:outline-none focus:border-orange-400"
      />
      <input
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="No HP (opsional)"
        type="tel"
        inputMode="numeric"
        className="w-full h-8 border border-stone-200 rounded-lg px-2.5 text-sm focus:outline-none focus:border-orange-400"
      />
      {err && <p className="text-[12px] text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 h-8 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-all">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={mutation.isPending}
          className="flex-1 h-8 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg
            transition-all disabled:opacity-50 flex items-center justify-center gap-1">
          {mutation.isPending && <Loader2 size={11} className="animate-spin" />}
          Simpan & Pilih
        </button>
      </div>
    </div>
  )
}

// ─── Customer Section ─────────────────────────────────────────────────────────

export function CustomerSection() {
  const { customer, setCustomer } = useCartStore()
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const popoverRef                = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: results, isFetching } = useQuery({
    queryKey: ['customers', 'search', query],
    queryFn:  () => customerApi.list({ search: query || undefined, limit: 6 }).then(r => r.data.data),
    enabled:  open,
    staleTime: 10_000,
  })

  const handleOpen = () => {
    setOpen(true)
    setQuery('')
    setShowCreate(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelect = (c: CustomerListItem) => {
    setCustomer({ id: c.id, name: c.name, phone: c.phone })
    setOpen(false)
    setQuery('')
  }

  const handleCreated = (c: CustomerListItem) => {
    setCustomer({ id: c.id, name: c.name, phone: c.phone })
    setOpen(false)
    setShowCreate(false)
  }

  // ── Already selected ──────────────────────────────────────────────────────

  if (customer) {
    const initials = customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-800 truncate">{customer.name}</p>
          {customer.phone && <p className="text-[12px] text-orange-600">{customer.phone}</p>}
        </div>
        <button onClick={() => setCustomer(null)}
          className="p-1 text-orange-400 hover:text-orange-700 transition-colors flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  // ── Default state ─────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpen}
          className="flex-1 flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-200 text-sm
            text-stone-500 hover:border-orange-300 hover:text-orange-600 transition-all"
        >
          <UserPlus size={14} /> Tambah Pelanggan
        </button>
        <button onClick={() => {}} className="text-xs text-stone-400 hover:text-stone-600 transition-colors px-1">
          Lewati
        </button>
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-stone-200
          shadow-lg z-50 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-stone-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setShowCreate(false) }}
                placeholder="Cari nama atau nomor HP..."
                className="w-full h-8 pl-8 pr-3 border border-stone-200 rounded-lg text-sm
                  focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-48 overflow-y-auto">
            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-orange-400" />
              </div>
            ) : (results?.length ?? 0) > 0 ? (
              results!.map(c => (
                <button key={c.id} onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors text-left">
                  <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-semibold text-[11px]">
                      {c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{c.name}</p>
                    {c.phone && <p className="text-[12px] text-stone-400">{c.phone}</p>}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-stone-400 text-center py-4">
                {query ? 'Tidak ditemukan' : 'Ketik untuk mencari...'}
              </p>
            )}
          </div>

          {/* Create new */}
          {showCreate ? (
            <MiniCreateForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
          ) : (
            <div className="p-2 border-t border-stone-100">
              <button onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-3 h-8 rounded-lg text-sm text-orange-600
                  hover:bg-orange-50 transition-all font-medium">
                <UserPlus size={14} />
                {query ? `Buat "${query}" sebagai pelanggan` : 'Buat Pelanggan Baru'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
