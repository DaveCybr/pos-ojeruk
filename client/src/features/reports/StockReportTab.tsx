import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Download, Loader2 } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { reportsApi } from './api'
import { useAuthStore } from '../../stores/auth.store'
import { branchApi } from '../branches/api'
import { categoryApi } from '../categories/api'
import { formatCurrency } from '../../lib/utils'
import { exportCsv } from '../../lib/exportCsv'
import type { StockItem } from './types'
import type { Branch, Category } from '../../types'

const statusBadge = {
  ok:  'bg-green-50 text-green-700 border-green-200',
  low: 'bg-amber-50 text-amber-700 border-amber-200',
  out: 'bg-red-50 text-red-700 border-red-200',
}
const statusLabel = { ok: 'Aman', low: 'Rendah', out: 'Habis' }

export function StockReportTab() {
  const { user } = useAuthStore()
  const isAdmin  = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  const [branchFilter,   setBranch]   = useState(user?.role === 'CASHIER' ? (user.branchId ?? '') : '')
  const [categoryFilter, setCategory] = useState('')
  const [statusFilter,   setStatus]   = useState<'' | 'low' | 'out' | 'ok'>('')

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data),
    enabled:  isAdmin, staleTime: Infinity,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn:  () => categoryApi.list().then(r => r.data.data),
    staleTime: Infinity,
  })

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', 'stock', branchFilter, categoryFilter, statusFilter],
    queryFn:  () => reportsApi.stock({
      branchId:   branchFilter   || undefined,
      categoryId: categoryFilter || undefined,
      status:     (statusFilter  || undefined) as 'low' | 'out' | 'ok' | undefined,
    }).then(r => r.data.data),
  })

  const summary   = report?.summary
  const stockList = report?.stockList ?? []

  const columns: ColumnDef<StockItem, unknown>[] = [
    {
      accessorKey: 'productName',
      header: 'Produk',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-stone-800">{row.original.productName}</p>
          <p className="text-[12px] font-mono text-stone-400">{row.original.barcode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ row }) => <span className="text-stone-600">{row.original.category?.name ?? '—'}</span>,
    },
    ...(isAdmin ? [{
      accessorKey: 'branchName' as keyof StockItem,
      header: 'Cabang',
      cell: ({ row }: { row: { original: StockItem } }) => <span className="text-stone-600">{row.original.branchName}</span>,
    } as ColumnDef<StockItem, unknown>] : []),
    {
      accessorKey: 'quantity',
      header: 'Stok',
      cell: ({ row }) => (
        <span className={`font-semibold ${
          row.original.quantity === 0 ? 'text-red-600' :
          row.original.quantity <= row.original.minStock ? 'text-amber-600' : 'text-stone-800'
        }`}>
          {row.original.quantity}
        </span>
      ),
    },
    { accessorKey: 'minStock', header: 'Min Stok', cell: ({ getValue }) => <span className="text-stone-500">{getValue() as number}</span> },
    {
      accessorKey: 'stockValue',
      header: 'Nilai Stok',
      cell: ({ getValue }) => <span className="font-medium text-stone-800">{formatCurrency(getValue() as number)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as 'ok' | 'low' | 'out'
        return (
          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${statusBadge[s]}`}>
            {statusLabel[s]}
          </span>
        )
      },
    },
  ]

  const handleExport = () => {
    exportCsv(
      ['Produk', 'Barcode', 'Kategori', 'Cabang', 'Qty', 'Min Stok', 'Harga Modal', 'Nilai Stok', 'Status'],
      stockList.map(s => [
        s.productName, s.barcode, s.category?.name ?? '', s.branchName,
        s.quantity, s.minStock, s.costPrice, s.stockValue, statusLabel[s.status],
      ]),
      `laporan-stok-${new Date().toISOString().slice(0, 10)}`,
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <select value={branchFilter} onChange={e => setBranch(e.target.value)}
              className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
              <option value="">Semua Cabang</option>
              {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <select value={categoryFilter} onChange={e => setCategory(e.target.value)}
            className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
            <option value="">Semua Kategori</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatus(e.target.value as '' | 'low' | 'out' | 'ok')}
            className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
            <option value="">Semua Status</option>
            <option value="ok">Aman</option>
            <option value="low">Rendah</option>
            <option value="out">Habis</option>
          </select>
          <button onClick={handleExport}
            className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Nilai Stok Total', value: formatCurrency(summary?.stockValue ?? 0), cls: 'text-stone-900' },
              { label: 'Total SKU',         value: String(summary?.totalSKU ?? 0),           cls: 'text-stone-900' },
              { label: 'Stok Rendah',       value: String(summary?.lowStockCount ?? 0),      cls: 'text-amber-700' },
              { label: 'Stok Habis',        value: String(summary?.outOfStockCount ?? 0),    cls: 'text-red-700'   },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                <p className="text-xs text-stone-500 mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.cls}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <DataTable
              data={stockList}
              columns={columns}
              enableSorting
              emptyState={
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-base font-medium text-stone-600">Tidak ada data stok</p>
                </div>
              }
            />
          </div>
        </>
      )}
    </div>
  )
}
