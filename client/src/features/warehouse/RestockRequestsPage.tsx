import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { PackagePlus, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { DataTable } from '../../components/ui/DataTable'
import { RestockRequestModal } from './RestockRequestModal'
import { warehouseApi } from './api'
import { branchApi } from '../branches/api'
import { useAuthStore } from '../../stores/auth.store'
import type { RestockRequest, RestockStatus } from './types'

const statusBadge: Record<RestockStatus, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-sky-50 text-sky-700 border-sky-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  FULFILLED: 'bg-green-50 text-green-700 border-green-200',
}

const statusFilters: { label: string; value: RestockStatus | '' }[] = [
  { label: 'Semua', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
  { label: 'Terpenuhi', value: 'FULFILLED' },
]

interface Props {
  embedded?: boolean  // true when used as tab inside WarehousePage
}

export function RestockRequestsPage({ embedded = false }: Props) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  const [modalOpen, setModalOpen]     = useState(false)
  const [prefillProduct]              = useState<string | undefined>()
  const [statusFilter, setStatus]     = useState<RestockStatus | ''>('')
  const [branchFilter, setBranch]     = useState('')
  const [page, setPage]               = useState(1)

  const filters = {
    status:   statusFilter || undefined,
    branchId: branchFilter || undefined,
    page, limit: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['restock-requests', filters],
    queryFn:  () => warehouseApi.listRestock(filters).then(r => r.data),
  })

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data),
    enabled:  isAdmin,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: 'APPROVED' | 'REJECTED' | 'FULFILLED'; note?: string }) =>
      warehouseApi.updateRestockStatus(id, { status, note }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['restock-requests'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      toast.success(
        status === 'APPROVED'  ? 'Permintaan disetujui' :
        status === 'REJECTED'  ? 'Permintaan ditolak'   : 'Restok berhasil dipenuhi'
      )
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  const columns = useMemo<ColumnDef<RestockRequest, unknown>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-[13px] text-stone-600 whitespace-nowrap">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: localeId })}
        </span>
      ),
    },
    {
      id: 'branch',
      header: 'Cabang',
      enableSorting: false,
      cell: ({ row }) => <span className="text-stone-700 font-medium">{row.original.branch.name}</span>,
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
      accessorKey: 'quantityRequested',
      header: 'Jumlah',
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.quantityRequested}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${statusBadge[row.original.status]}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'note',
      header: 'Catatan',
      enableSorting: false,
      cell: ({ row }) => <span className="text-stone-500 text-[13px]">{row.original.note ?? '—'}</span>,
    },
    ...(isAdmin ? [{
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: { row: { original: RestockRequest } }) => {
        const { id, status } = row.original
        if (status !== 'PENDING' && status !== 'APPROVED') return null
        return (
          <div className="flex items-center justify-end gap-1">
            {status === 'PENDING' && (
              <>
                <button onClick={() => updateMutation.mutate({ id, status: 'APPROVED' })}
                  disabled={updateMutation.isPending}
                  title="Setujui"
                  className="p-2 rounded-lg text-stone-400 hover:text-sky-600 hover:bg-sky-50 transition-all disabled:opacity-50">
                  <Check size={15} />
                </button>
                <button onClick={() => updateMutation.mutate({ id, status: 'REJECTED' })}
                  disabled={updateMutation.isPending}
                  title="Tolak"
                  className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                  <X size={15} />
                </button>
              </>
            )}
            {status === 'APPROVED' && (
              <button onClick={() => updateMutation.mutate({ id, status: 'FULFILLED' })}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1 px-3 h-7 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all disabled:opacity-50">
                {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                Penuhi
              </button>
            )}
          </div>
        )
      },
    } as ColumnDef<RestockRequest, unknown>] : []),
  ], [isAdmin, updateMutation])

  const toolbar = (
    <div className="flex flex-wrap gap-2 flex-1">
      {isAdmin && (
        <select value={branchFilter} onChange={e => { setBranch(e.target.value); setPage(1) }}
          className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
          <option value="">Semua Cabang</option>
          {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <div className="flex gap-1">
        {statusFilters.map(f => (
          <button key={f.value} onClick={() => { setStatus(f.value); setPage(1) }}
            className={`px-3 h-8 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f.value ? 'bg-orange-500 text-white' : 'border border-stone-200 text-stone-600 hover:border-orange-200 hover:text-orange-600'
            }`}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )

  const tableContent = (
    <>
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
                <PackagePlus className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-base font-medium text-stone-600">Belum ada permintaan restok</p>
            </div>
          }
        />
      </div>
      {data && data.meta.last_page > 1 && (
        <div className="flex justify-between text-sm text-stone-500 mt-4">
          <span>{data.data.length} dari {data.meta.total} permintaan</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 h-8 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-all">←</button>
            <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
              className="px-3 h-8 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-all">→</button>
          </div>
        </div>
      )}
      <RestockRequestModal open={modalOpen} onClose={() => setModalOpen(false)} prefillProductId={prefillProduct} />
    </>
  )

  if (embedded) return (
    <div className="space-y-4">
      {tableContent}
    </div>
  )

  return null  // full-page version handled by WarehousePage
}
