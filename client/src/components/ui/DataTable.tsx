import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table'
import {
  Loader2, Search,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  /** Clickable column headers with asc/desc indicator */
  enableSorting?: boolean
  /** Built-in global search input */
  enableSearch?: boolean
  searchPlaceholder?: string
  /** Built-in pagination controls + rows-per-page selector */
  enablePagination?: boolean
  defaultPageSize?: number
  /** Extra controls rendered beside the search bar (e.g. external filters) */
  toolbar?: React.ReactNode
}

export function DataTable<TData>({
  data,
  columns,
  isLoading,
  emptyState,
  enableSorting = false,
  enableSearch = false,
  searchPlaceholder = 'Cari...',
  enablePagination = false,
  defaultPageSize = 10,
  toolbar,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    autoResetPageIndex: true,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
      </div>
    )
  }

  const totalFiltered = table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize } = table.getState().pagination
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min(pageIndex * pageSize + pageSize, totalFiltered)

  // No data + no toolbar → render standalone emptyState (no table needed)
  if (!data.length && !enableSearch && !toolbar && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div>
      {/* Toolbar — always rendered when present, even when data is empty */}
      {(enableSearch || toolbar) && (
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 flex-wrap">
          {enableSearch && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 pr-3 h-8 w-52 border border-stone-300 rounded-lg text-sm
                  focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 bg-white"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {/* Empty state below toolbar when data array is empty */}
      {data.length === 0 && emptyState ? (
        emptyState
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left text-sm font-semibold text-stone-600 px-4 py-3 whitespace-nowrap"
                    >
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button
                          onClick={h.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 hover:text-stone-900 transition-colors group"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          <span className="text-stone-300 group-hover:text-stone-500 transition-colors">
                            {h.column.getIsSorted() === 'asc' ? (
                              <ArrowUp size={12} className="text-orange-500" />
                            ) : h.column.getIsSorted() === 'desc' ? (
                              <ArrowDown size={12} className="text-orange-500" />
                            ) : (
                              <ArrowUpDown size={12} />
                            )}
                          </span>
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-stone-400"
                  >
                    Tidak ada data yang cocok dengan pencarian
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-stone-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination — hide when data is empty */}
      {enablePagination && data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>
              {totalFiltered === 0
                ? 'Tidak ada data'
                : `${startRow}–${endRow} dari ${totalFiltered} baris`}
            </span>
            <select
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-7 border border-stone-200 rounded-md text-xs px-1.5 bg-white
                focus:outline-none focus:border-orange-400 cursor-pointer"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / halaman</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-all"
              title="Halaman pertama"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-all"
              title="Sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-sm text-stone-600 min-w-[4rem] text-center">
              {pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-all"
              title="Berikutnya"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-all"
              title="Halaman terakhir"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
