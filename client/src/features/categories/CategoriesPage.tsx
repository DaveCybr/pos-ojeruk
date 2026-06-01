import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { categoryApi } from './api'
import type { Category } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const inputCls =
  'border border-stone-300 rounded-lg h-9 px-3 text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all'

function InlineForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Category | null
  onSubmit: (d: FormValues) => void
  onCancel: () => void
  loading: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? { name: initial.name, description: initial.description ?? '' }
      : { name: '', description: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)}
      className="flex items-start gap-2 px-4 py-3 bg-orange-50/60 border-b border-orange-100">
      <div className="flex-1 space-y-1">
        <input {...register('name')} placeholder="Nama kategori"
          className={`${inputCls} w-full`} autoFocus />
        {errors.name && <p className="text-[12px] text-red-600">{errors.name.message}</p>}
      </div>
      <input {...register('description')} placeholder="Deskripsi (opsional)"
        className={`${inputCls} flex-1`} />
      <button type="submit" disabled={loading}
        className="h-9 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all disabled:opacity-50 flex items-center">
        <Check size={14} />
      </button>
      <button type="button" onClick={onCancel}
        className="h-9 px-3 border border-stone-200 text-stone-500 hover:bg-stone-100 rounded-lg transition-all">
        <X size={14} />
      </button>
    </form>
  )
}

export function CategoriesPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Kategori berhasil dibuat')
      setShowAdd(false)
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) => categoryApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Kategori berhasil diperbarui')
      setEditId(null)
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  const deleteMutation = useMutation({
    mutationFn: categoryApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Kategori berhasil dihapus')
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  const editingCategory = editId ? data.find((c) => c.id === editId) : null

  const columns = useMemo<ColumnDef<Category, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama Kategori',
        cell: ({ row }) =>
          editId === row.original.id ? (
            <InlineForm
              initial={editingCategory}
              onSubmit={(d) => updateMutation.mutate({ id: row.original.id, data: d })}
              onCancel={() => setEditId(null)}
              loading={updateMutation.isPending}
            />
          ) : (
            <span className="font-medium text-stone-800">{row.original.name}</span>
          ),
      },
      {
        accessorKey: 'description',
        header: 'Deskripsi',
        cell: ({ row }) =>
          editId === row.original.id ? null : (
            <span className="text-stone-500">
              {row.original.description || <span className="text-stone-300">—</span>}
            </span>
          ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          editId === row.original.id ? null : (
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => setEditId(row.original.id)}
                className="p-2 rounded-lg text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                <Pencil size={15} />
              </button>
              <button
                onClick={() => { if (confirm(`Hapus kategori "${row.original.name}"?`)) deleteMutation.mutate(row.original.id) }}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                <Trash2 size={15} />
              </button>
            </div>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editId, editingCategory, updateMutation.isPending, deleteMutation.isPending],
  )

  return (
    <AppLayout>
      <PageHeader
        title="Kategori Produk"
        description="Kelola kategori untuk pengelompokan produk"
        action={
          !showAdd ? (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
              <Plus size={16} /> Tambah Kategori
            </button>
          ) : undefined
        }
      />

      <div className="p-6 md:p-8">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          {showAdd && (
            <InlineForm
              onSubmit={(d) => createMutation.mutate(d)}
              onCancel={() => setShowAdd(false)}
              loading={createMutation.isPending}
            />
          )}
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            enableSorting
            enableSearch
            searchPlaceholder="Cari kategori..."
            emptyState={
              !showAdd ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-stone-100 rounded-full p-4 mb-4">
                    <Tag className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-base font-medium text-stone-600 mb-1">Belum ada kategori</p>
                  <button onClick={() => setShowAdd(true)}
                    className="mt-4 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
                    Tambah Kategori
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
    </AppLayout>
  )
}
