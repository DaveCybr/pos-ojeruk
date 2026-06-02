import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { customerApi } from './api'
import { CustomerFormModal } from './CustomerFormModal'
import { CustomerDetailModal } from './CustomerDetailModal'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth.store'
import type { CustomerListItem } from './types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function CustomersPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [formOpen, setFormOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState<CustomerListItem | null>(null)
  const [detailId, setDetailId]     = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn:  () => customerApi.list({ search: search || undefined, page, limit: 25 }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Pelanggan berhasil dihapus')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Gagal menghapus pelanggan')
    },
  })

  const columns = useMemo<ColumnDef<CustomerListItem, unknown>[]>(() => [
    {
      id: 'name',
      header: 'Pelanggan',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-600 font-semibold text-xs">{initials(row.original.name)}</span>
          </div>
          <div>
            <p className="font-medium text-stone-800">{row.original.name}</p>
            {row.original.phone && <p className="text-[12px] text-stone-400">{row.original.phone}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'transactionCount',
      header: 'Total Transaksi',
      cell: ({ getValue }) => <span className="text-stone-700">{getValue() as number} transaksi</span>,
    },
    {
      accessorKey: 'totalBelanja',
      header: 'Total Belanja',
      cell: ({ getValue }) => <span className="font-semibold text-stone-800">{formatCurrency(getValue() as number)}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Bergabung',
      cell: ({ getValue }) => <span className="text-[13px] text-stone-500">{formatDate(getValue() as string)}</span>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setDetailId(row.original.id)}
            className="p-2 rounded-lg text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
            <Eye size={15} />
          </button>
          {isAdmin && (
            <>
              <button onClick={() => { setEditTarget(row.original); setFormOpen(true) }}
                className="p-2 rounded-lg text-stone-400 hover:text-sky-600 hover:bg-sky-50 transition-all">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteTarget(row.original)}
                className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ], [isAdmin])

  const toolbar = (
    <div className="flex items-center gap-2 flex-1">
      <div className="relative flex-1 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari nama atau nomor HP..."
          className="w-full h-8 pl-9 pr-3 border border-stone-300 rounded-lg text-sm bg-white
            focus:outline-none focus:border-orange-400"
        />
      </div>
      {isAdmin && (
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-orange-500 hover:bg-orange-600
            text-white text-sm font-medium transition-all ml-auto">
          <Plus size={15} /> Tambah Pelanggan
        </button>
      )}
    </div>
  )

  return (
    <AppLayout>
      <PageHeader title="Pelanggan" description="Kelola data pelanggan terdaftar" />

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
                  <Search className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-base font-medium text-stone-600 mb-1">
                  {search ? 'Pelanggan tidak ditemukan' : 'Belum ada pelanggan'}
                </p>
                {!search && isAdmin && (
                  <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
                    className="mt-3 px-4 h-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all">
                    Tambah Pelanggan
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Pagination */}
        {data && data.meta.last_page > 1 && (
          <div className="flex justify-between text-sm text-stone-500">
            <span>{data.data.length} dari {data.meta.total} pelanggan</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 h-8 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-all text-sm">
                ‹
              </button>
              <span className="px-3 h-8 flex items-center text-stone-600">{page} / {data.meta.last_page}</span>
              <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="px-3 h-8 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-all text-sm">
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        customer={editTarget}
      />

      <CustomerDetailModal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        customerId={detailId}
        onEdit={c => { setDetailId(null); setEditTarget(c); setFormOpen(true) }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Hapus Pelanggan"
        description={`Yakin ingin menghapus pelanggan "${deleteTarget?.name}"? Aksi ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </AppLayout>
  )
}
