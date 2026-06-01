import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { ProductFormModal } from './ProductFormModal'
import { productApi } from './api'
import { categoryApi } from '../categories/api'
import type { Product } from '../../types'

const formatRp = (n: string | number) => 'Rp ' + Number(n).toLocaleString('id-ID')

export function ProductsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  /* Server-side filters */
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isActive, setIsActive] = useState<'true' | 'false' | ''>('')
  const [page, setPage] = useState(1)

  const filters = {
    search: search || undefined,
    categoryId: categoryId || undefined,
    isActive: (isActive || undefined) as 'true' | 'false' | undefined,
    page,
    limit: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.list(filters).then((r) => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produk berhasil dinonaktifkan') },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Terjadi kesalahan'),
  })

  const openCreate = () => { setSelected(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setSelected(p); setModalOpen(true) }
  const handleDelete = (p: Product) => {
    if (confirm(`Nonaktifkan produk "${p.name}"?`)) deleteMutation.mutate(p.id)
  }

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        id: 'product',
        header: 'Produk',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-stone-800">{row.original.name}</p>
            <p className="text-[12px] text-stone-400">{row.original.unit}</p>
          </div>
        ),
      },
      {
        accessorKey: 'barcode',
        header: 'Barcode',
        cell: ({ row }) => <span className="text-[13px] font-mono text-stone-600">{row.original.barcode}</span>,
      },
      {
        id: 'category',
        header: 'Kategori',
        enableSorting: false,
        cell: ({ row }) => <span className="text-stone-600">{row.original.category?.name ?? '—'}</span>,
      },
      {
        accessorKey: 'price',
        header: 'Harga Jual',
        cell: ({ row }) => <span className="font-medium text-stone-800">{formatRp(row.original.price)}</span>,
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

  /* Server-side search + filter toolbar — passed into DataTable toolbar slot */
  const serverToolbar = (
    <div className="flex flex-wrap gap-2 flex-1">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari produk..."
          className="pl-8 pr-3 h-8 w-44 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 bg-white" />
      </div>
      <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
        <option value="">Semua Kategori</option>
        {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={isActive} onChange={(e) => { setIsActive(e.target.value as typeof isActive); setPage(1) }}
        className="h-8 border border-stone-300 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
        <option value="">Semua Status</option>
        <option value="true">Aktif</option>
        <option value="false">Nonaktif</option>
      </select>
    </div>
  )

  return (
    <AppLayout>
      <PageHeader
        title="Produk"
        description="Kelola data produk dan harga"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
            <Plus size={16} /> Tambah Produk
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-4">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          {/* Client-side sort ON; server-side search/filter/pagination via toolbar */}
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            enableSorting
            toolbar={serverToolbar}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-stone-100 rounded-full p-4 mb-4">
                  <Package className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-base font-medium text-stone-600 mb-1">Belum ada produk</p>
                <button onClick={openCreate}
                  className="mt-4 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
                  Tambah Produk
                </button>
              </div>
            }
          />
        </div>

        {/* Server-side pagination */}
        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>{data.data.length} dari {data.meta.total} produk (halaman {page}/{data.meta.last_page})</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-all">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductFormModal open={modalOpen} onClose={() => setModalOpen(false)} product={selected} />
    </AppLayout>
  )
}
