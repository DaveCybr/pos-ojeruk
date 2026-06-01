import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { SlidersHorizontal, Boxes, AlertTriangle } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { stockApi } from './api'
import { branchApi } from '../branches/api'
import { categoryApi } from '../categories/api'
import { useAuthStore } from '../../stores/auth.store'
import type { StockItem } from './types'

type StockStatus = 'all' | 'low' | 'empty'

const statusBadge = (qty: number, min: number) =>
  qty === 0
    ? { label: 'Habis',  cls: 'bg-red-50 text-red-700 border-red-200' }
    : qty <= min
    ? { label: 'Rendah', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    : { label: 'Aman',   cls: 'bg-green-50 text-green-700 border-green-200' }


interface StockPageProps { noLayout?: boolean }

export function StockPage({ noLayout }: StockPageProps = {}) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  const [modalOpen, setModalOpen]  = useState(false)
  const [prefill, setPrefill]       = useState<{ productId: string; branchId: string } | undefined>()
  const [branchId, setBranchId]     = useState(isAdmin ? '' : (user?.branchId ?? ''))
  const [categoryId, setCategoryId] = useState('')
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all')
  const [page, setPage]             = useState(1)

  const filters = {
    branchId:   branchId   || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 30,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['stock', filters],
    queryFn:  () => stockApi.list(filters).then(r => r.data),
  })

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data),
    enabled:  isAdmin,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoryApi.list().then(r => r.data.data),
  })

  const filtered = useMemo(() => {
    const rows = data?.data ?? []
    if (statusFilter === 'empty') return rows.filter(s => s.quantity === 0)
    if (statusFilter === 'low')   return rows.filter(s => s.quantity > 0 && s.quantity <= s.minStock)
    return rows
  }, [data, statusFilter])

  const openAdjustment = (s?: StockItem) => {
    setPrefill(s ? { productId: s.productId, branchId: s.branchId } : undefined)
    setModalOpen(true)
  }

  const columns = useMemo<ColumnDef<StockItem, unknown>[]>(() => [
    {
      accessorKey: 'product',
      header: 'Produk',
      accessorFn: r => r.product.name,
      cell: ({ row: { original: s } }) => (
        <div>
          <p className="font-medium text-stone-800">{s.product.name}</p>
          <p className="text-[12px] text-stone-400">{s.product.category?.name}</p>
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
      accessorKey: 'quantity',
      header: 'Stok',
      cell: ({ row: { original: s } }) => (
        <span className={`font-mono font-semibold text-base ${
          s.quantity === 0 ? 'text-red-600' : s.quantity <= s.minStock ? 'text-amber-600' : 'text-stone-800'
        }`}>
          {s.quantity}
        </span>
      ),
    },
    {
      accessorKey: 'minStock',
      header: 'Min',
      cell: ({ row }) => <span className="font-mono text-stone-500">{row.original.minStock}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      enableSorting: false,
      cell: ({ row: { original: s } }) => {
        const { label, cls } = statusBadge(s.quantity, s.minStock)
        return (
          <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${cls}`}>
            {s.quantity <= s.minStock && s.quantity > 0 && <AlertTriangle size={11} className="inline mr-1" />}
            {label}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => isAdmin ? (
        <button onClick={() => openAdjustment(row.original)}
          className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-stone-200 text-stone-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all">
          <SlidersHorizontal size={12} /> Koreksi
        </button>
      ) : null,
    },
  ], [isAdmin])

  const toolbar = (
    <div className="flex flex-wrap gap-2 flex-1">
      {isAdmin && (
        <select value={branchId} onChange={e => { setBranchId(e.target.value); setPage(1) }}
          className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
          <option value="">Semua Cabang</option>
          {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
        <option value="">Semua Kategori</option>
        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {(['all', 'low', 'empty'] as StockStatus[]).map(s => (
        <button key={s} onClick={() => setStatusFilter(s)}
          className={`px-3 h-8 rounded-lg text-xs font-medium transition-all ${
            statusFilter === s ? 'bg-orange-500 text-white' : 'border border-stone-200 text-stone-600 hover:border-orange-200 hover:text-orange-600'
          }`}>
          {s === 'all' ? 'Semua' : s === 'low' ? '⚠️ Rendah' : '🔴 Habis'}
        </button>
      ))}
    </div>
  )

  const content = (
    <div className="p-6 md:p-8 space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <DataTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          enableSorting
          enableSearch
          searchPlaceholder="Cari nama produk..."
          toolbar={toolbar}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-stone-100 rounded-full p-4 mb-4">
                <Boxes className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-base font-medium text-stone-600">Belum ada data stok</p>
            </div>
          }
        />
      </div>

      {data && data.meta.last_page > 1 && (
        <div className="flex justify-between text-sm text-stone-500">
          <span>{data.data.length} dari {data.meta.total} item</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 h-8 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-all">←</button>
            <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
              className="px-3 h-8 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-all">→</button>
          </div>
        </div>
      )}

      <StockAdjustmentModal open={modalOpen} onClose={() => setModalOpen(false)} prefill={prefill} />
    </div>
  )

  if (noLayout) return content

  return (
    <AppLayout>
      <PageHeader title="Monitoring Stok" description="Pantau stok produk per cabang"
        action={isAdmin ? (
          <button onClick={() => openAdjustment()}
            className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
            <SlidersHorizontal size={16} /> Koreksi Stok
          </button>
        ) : undefined}
      />
      {content}
    </AppLayout>
  )
}
