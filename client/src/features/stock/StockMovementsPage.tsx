import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { stockApi } from './api'
import { branchApi } from '../branches/api'
import { useAuthStore } from '../../stores/auth.store'
import type { StockMovement } from './types'

const typeBadge: Record<string, string> = {
  IN:         'bg-green-50 text-green-700 border-green-200',
  OUT:        'bg-red-50 text-red-700 border-red-200',
  ADJUSTMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  RESTOCK:    'bg-sky-50 text-sky-700 border-sky-200',
}

export function StockMovementsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  const [branchId, setBranchId] = useState(isAdmin ? '' : (user?.branchId ?? ''))
  const [type, setType]         = useState('')
  const [startDate, setStart]   = useState('')
  const [endDate, setEnd]       = useState('')
  const [page, setPage]         = useState(1)

  const filters = {
    branchId:   branchId   || undefined,
    type:       (type       || undefined) as StockMovement['type'] | undefined,
    startDate:  startDate  || undefined,
    endDate:    endDate    || undefined,
    page, limit: 25,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['stock', 'movements', filters],
    queryFn:  () => stockApi.movements(filters).then(r => r.data),
  })

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data),
    enabled: isAdmin,
  })

  const columns = useMemo<ColumnDef<StockMovement, unknown>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-[13px] text-stone-600 whitespace-nowrap">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: localeId })}
        </span>
      ),
    },
    {
      id: 'product',
      header: 'Produk',
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-stone-800">{row.original.product.name}</p>
          <p className="text-[12px] font-mono text-stone-400">{row.original.product.barcode}</p>
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Cabang',
      enableSorting: false,
      cell: ({ row }) => <span className="text-stone-600">{row.original.branch.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipe',
      cell: ({ row }) => (
        <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${typeBadge[row.original.type]}`}>
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Jumlah',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-stone-800">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: 'note',
      header: 'Catatan',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-stone-500 text-[13px]">{row.original.note ?? '—'}</span>
      ),
    },
    {
      id: 'user',
      header: 'Dicatat oleh',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-stone-500 text-[13px]">{row.original.user.name}</span>
      ),
    },
  ], [])

  const toolbar = (
    <div className="flex flex-wrap gap-2 flex-1">
      {isAdmin && (
        <select value={branchId} onChange={e => { setBranchId(e.target.value); setPage(1) }}
          className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
          <option value="">Semua Cabang</option>
          {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <select value={type} onChange={e => { setType(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
        <option value="">Semua Tipe</option>
        {['IN', 'OUT', 'ADJUSTMENT', 'RESTOCK'].map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input type="date" value={startDate} onChange={e => { setStart(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400" />
      <input type="date" value={endDate} onChange={e => { setEnd(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400" />
    </div>
  )

  return (
    <AppLayout>
      <PageHeader title="Riwayat Pergerakan Stok" description="Histori semua perubahan stok" />

      <div className="p-6 md:p-8 space-y-4">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            enableSorting
            toolbar={toolbar}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-stone-100 rounded-full p-4 mb-4">
                  <Receipt className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-base font-medium text-stone-600">Belum ada riwayat pergerakan stok</p>
              </div>
            }
          />
        </div>

        {data && data.meta.last_page > 1 && (
          <div className="flex justify-between text-sm text-stone-500">
            <span>{data.data.length} dari {data.meta.total} entri</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 h-8 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-all">←</button>
              <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="px-3 h-8 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-all">→</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
