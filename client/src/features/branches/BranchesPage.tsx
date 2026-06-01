import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { BranchFormModal } from './BranchFormModal'
import { branchApi } from './api'
import type { Branch } from '../../types'

export function BranchesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Branch | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.list().then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Cabang berhasil dinonaktifkan')
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Terjadi kesalahan',
      ),
  })

  const openCreate = () => { setSelected(null); setModalOpen(true) }
  const openEdit = (b: Branch) => { setSelected(b); setModalOpen(true) }
  const handleDelete = (b: Branch) => {
    if (confirm(`Nonaktifkan cabang "${b.name}"?`)) deleteMutation.mutate(b.id)
  }

  const columns = useMemo<ColumnDef<Branch, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama Cabang',
        cell: ({ row }) => <span className="font-medium text-stone-800">{row.original.name}</span>,
      },
      {
        accessorKey: 'address',
        header: 'Alamat',
        cell: ({ row }) => <span className="text-stone-600">{row.original.address}</span>,
      },
      {
        accessorKey: 'city',
        header: 'Kota',
        cell: ({ row }) => <span className="text-stone-600">{row.original.city}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${
            row.original.isActive
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-stone-100 text-stone-500 border-stone-200'
          }`}>
            {row.original.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(row.original)}
              className="p-2 rounded-lg text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
              <Pencil size={15} />
            </button>
            <button onClick={() => handleDelete(row.original)} disabled={deleteMutation.isPending}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.isPending],
  )

  return (
    <AppLayout>
      <PageHeader
        title="Cabang"
        description="Kelola data cabang outlet O-Jeruk"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
            <Plus size={16} /> Tambah Cabang
          </button>
        }
      />

      <div className="p-6 md:p-8">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            enableSorting
            enableSearch
            searchPlaceholder="Cari cabang..."
            enablePagination
            defaultPageSize={10}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-stone-100 rounded-full p-4 mb-4">
                  <Store className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-base font-medium text-stone-600 mb-1">Belum ada cabang</p>
                <p className="text-sm text-stone-400 mb-4">Tambah cabang pertama untuk memulai</p>
                <button onClick={openCreate}
                  className="px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
                  Tambah Cabang
                </button>
              </div>
            }
          />
        </div>
      </div>

      <BranchFormModal open={modalOpen} onClose={() => setModalOpen(false)} branch={selected} />
    </AppLayout>
  )
}
