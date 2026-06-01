import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, XCircle, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { TransactionDetailModal } from './TransactionDetailModal'
import { posApi } from '../pos/api'
import { branchApi } from '../branches/api'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth.store'
import type { Transaction, TransactionFilters } from './types'
import type { TransactionStatus, PaymentMethod } from '../../types'

const statusBadge: Record<TransactionStatus, string> = {
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  VOIDED:    'bg-red-50 text-red-700 border-red-200',
  HELD:      'bg-amber-50 text-amber-700 border-amber-200',
}

const methodBadge: Record<PaymentMethod, string> = {
  CASH:     'bg-stone-100 text-stone-600 border-stone-200',
  TRANSFER: 'bg-sky-50 text-sky-700 border-sky-200',
  QRIS:     'bg-orange-50 text-orange-700 border-orange-200',
}

export function TransactionsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  const [detailOpen, setDetailOpen]   = useState(false)
  const [selected, setSelected]       = useState<Transaction | null>(null)
  const [branchFilter, setBranch]     = useState('')
  const [statusFilter, setStatus]     = useState<TransactionStatus | ''>('')
  const [methodFilter, setMethod]     = useState<PaymentMethod | ''>('')
  const [startDate, setStart]         = useState('')
  const [endDate, setEnd]             = useState('')
  const [page, setPage]               = useState(1)

  const filters: TransactionFilters = {
    branchId:  branchFilter || undefined,
    status:    (statusFilter || undefined) as TransactionStatus | undefined,
    startDate: startDate || undefined,
    endDate:   endDate   || undefined,
    page, limit: 25,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => posApi.listTransactions(filters).then(r => r.data),
  })

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.list().then(r => r.data.data),
    enabled: isAdmin,
  })

  const voidMutation = useMutation({
    mutationFn: (id: string) => posApi.voidTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      toast.success('Transaksi berhasil di-void')
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  const allData = useMemo(() => {
    const rows = data?.data ?? []
    if (!methodFilter) return rows
    return rows.filter(t => t.paymentMethod === methodFilter)
  }, [data, methodFilter])

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(() => [
    {
      accessorKey: 'invoiceNo',
      header: 'Invoice',
      cell: ({ row }) => <span className="font-mono text-[13px] font-medium text-stone-800">{row.original.invoiceNo}</span>,
    },
    {
      id: 'branch',
      header: 'Cabang',
      enableSorting: false,
      cell: ({ row }) => <span className="text-stone-700">{row.original.branch?.name ?? '—'}</span>,
    },
    {
      id: 'cashier',
      header: 'Kasir',
      enableSorting: false,
      cell: ({ row }) => <span className="text-stone-600">{row.original.cashier?.name ?? '—'}</span>,
    },
    {
      id: 'items',
      header: 'Item',
      enableSorting: false,
      cell: ({ row }) => <span className="text-stone-500">{row.original.items?.length ?? 0} item</span>,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => <span className="font-semibold text-stone-800">{formatCurrency(row.original.total)}</span>,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Metode',
      cell: ({ row }) => (
        <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${methodBadge[row.original.paymentMethod]}`}>
          {row.original.paymentMethod}
        </span>
      ),
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
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ row }) => <span className="text-[13px] text-stone-500">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => { setSelected(row.original); setDetailOpen(true) }}
            className="p-2 rounded-lg text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
            <Eye size={15} />
          </button>
          {user?.role === 'ADMIN' && row.original.status === 'COMPLETED' && (
            <button
              onClick={() => { if (confirm(`Void transaksi ${row.original.invoiceNo}?`)) voidMutation.mutate(row.original.id) }}
              disabled={voidMutation.isPending}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
              <XCircle size={15} />
            </button>
          )}
        </div>
      ),
    },
  ], [user?.role, voidMutation])

  const toolbar = (
    <div className="flex flex-wrap gap-2 flex-1">
      {isAdmin && (
        <select value={branchFilter} onChange={e => { setBranch(e.target.value); setPage(1) }}
          className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
          <option value="">Semua Cabang</option>
          {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <select value={statusFilter} onChange={e => { setStatus(e.target.value as TransactionStatus | ''); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
        <option value="">Semua Status</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="VOIDED">VOIDED</option>
      </select>
      <select value={methodFilter} onChange={e => setMethod(e.target.value as PaymentMethod | '')}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
        <option value="">Semua Metode</option>
        <option value="CASH">CASH</option>
        <option value="TRANSFER">TRANSFER</option>
        <option value="QRIS">QRIS</option>
      </select>
      <input type="date" value={startDate} onChange={e => { setStart(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400" />
      <input type="date" value={endDate} onChange={e => { setEnd(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400" />
    </div>
  )

  return (
    <AppLayout>
      <PageHeader title="Riwayat Transaksi" description="Semua transaksi penjualan" />

      <div className="p-6 md:p-8 space-y-4">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <DataTable
            data={allData}
            columns={columns}
            isLoading={isLoading}
            enableSorting
            toolbar={toolbar}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-stone-100 rounded-full p-4 mb-4">
                  <Receipt className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-base font-medium text-stone-600">Belum ada transaksi</p>
              </div>
            }
          />
        </div>

        {data && data.meta.last_page > 1 && (
          <div className="flex justify-between text-sm text-stone-500">
            <span>{data.data.length} dari {data.meta.total} transaksi</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-all">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} transaction={selected} />
    </AppLayout>
  )
}
