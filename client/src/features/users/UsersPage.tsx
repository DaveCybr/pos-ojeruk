import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { UserFormModal } from './UserFormModal'
import { userApi } from './api'
import type { User, Role } from '../../types'

const roleBadge: Record<Role, string> = {
  ADMIN: 'bg-orange-50 text-orange-700 border-orange-200',
  WAREHOUSE: 'bg-sky-50 text-sky-700 border-sky-200',
  CASHIER: 'bg-green-50 text-green-700 border-green-200',
}

const roleFilters: { label: string; value: Role | '' }[] = [
  { label: 'Semua', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Gudang', value: 'WAREHOUSE' },
  { label: 'Kasir', value: 'CASHIER' },
]

export function UsersPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['users', { role: roleFilter }],
    queryFn: () =>
      userApi.list(roleFilter ? { role: roleFilter } : undefined).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User berhasil dihapus')
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Terjadi kesalahan',
      ),
  })

  const openCreate = () => { setSelected(null); setModalOpen(true) }
  const openEdit = (u: User) => { setSelected(u); setModalOpen(true) }
  const handleDelete = (u: User) => {
    if (confirm(`Hapus user "${u.name}"? Tindakan ini tidak bisa dibatalkan.`))
      deleteMutation.mutate(u.id)
  }

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => <span className="font-medium text-stone-800">{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-stone-600">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${roleBadge[row.original.role]}`}>
            {row.original.role}
          </span>
        ),
      },
      {
        id: 'branch',
        header: 'Cabang',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-stone-500">
            {row.original.branch?.name ?? <span className="text-stone-300">—</span>}
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

  /* Role filter tabs passed as toolbar slot */
  const roleFilterToolbar = (
    <div className="flex gap-1.5 flex-wrap">
      {roleFilters.map((f) => (
        <button key={f.value} onClick={() => setRoleFilter(f.value)}
          className={`px-3 h-7 rounded-lg text-xs font-medium transition-all ${
            roleFilter === f.value
              ? 'bg-orange-500 text-white'
              : 'border border-stone-200 text-stone-600 hover:border-orange-200 hover:text-orange-600'
          }`}>
          {f.label}
        </button>
      ))}
    </div>
  )

  return (
    <AppLayout>
      <PageHeader
        title="Pengguna"
        description="Kelola akun dan hak akses pengguna sistem"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
            <Plus size={16} /> Tambah Pengguna
          </button>
        }
      />

      <div className="p-6 md:p-8">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            enableSorting
            enableSearch
            searchPlaceholder="Cari nama atau email..."
            enablePagination
            defaultPageSize={20}
            toolbar={roleFilterToolbar}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-stone-100 rounded-full p-4 mb-4">
                  <UserCircle className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-base font-medium text-stone-600">Belum ada pengguna</p>
              </div>
            }
          />
        </div>
      </div>

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} user={selected} />
    </AppLayout>
  )
}
