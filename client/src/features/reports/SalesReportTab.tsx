import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { DataTable } from '../../components/ui/DataTable'
import { reportsApi } from './api'
import { useAuthStore } from '../../stores/auth.store'
import { branchApi } from '../branches/api'
import { formatCurrency } from '../../lib/utils'
import { exportCsv } from '../../lib/exportCsv'
import type { SalesPeriod } from './types'
import type { ColumnDef } from '@tanstack/react-table'
import type { Branch } from '../../types'

function toISO(d: Date) { return d.toISOString().slice(0, 10) }
const def7 = () => {
  const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 6)
  return { start: toISO(start), end: toISO(end) }
}
const compactRp = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

export function SalesReportTab() {
  const { user } = useAuthStore()
  const isAdmin  = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'
  const init     = def7()

  const [startDate, setStart]     = useState(init.start)
  const [endDate, setEnd]         = useState(init.end)
  const [branchFilter, setBranch] = useState(user?.role === 'CASHIER' ? (user.branchId ?? '') : '')
  const [groupBy, setGroupBy]     = useState<'day' | 'week' | 'month'>('day')

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data),
    enabled:  isAdmin, staleTime: Infinity,
  })

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', 'sales', startDate, endDate, branchFilter, groupBy],
    queryFn:  () => reportsApi.sales({
      startDate, endDate, groupBy, branchId: branchFilter || undefined,
    }).then(r => r.data.data),
  })

  const summary      = report?.summary
  const series       = report?.series ?? []
  const topProducts  = report?.topProducts ?? []
  const payBreakdown = report?.paymentBreakdown ?? []

  const periodCols: ColumnDef<SalesPeriod, unknown>[] = [
    { accessorKey: 'label',             header: 'Periode',    cell: ({ getValue }) => <span className="font-mono text-[13px]">{getValue() as string}</span> },
    { accessorKey: 'totalRevenue',      header: 'Revenue',    cell: ({ getValue }) => formatCurrency(getValue() as number) },
    { accessorKey: 'totalTransactions', header: 'Transaksi',  cell: ({ getValue }) => getValue() as number },
    { accessorKey: 'totalItemsSold',    header: 'Item Terjual', cell: ({ getValue }) => getValue() as number },
  ]

  const handleExport = () => {
    exportCsv(
      ['Periode', 'Revenue', 'Transaksi', 'Item Terjual'],
      series.map(r => [r.label, r.totalRevenue, r.totalTransactions, r.totalItemsSold]),
      `laporan-penjualan-${startDate}-${endDate}`,
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            startDate={startDate} endDate={endDate}
            onStartChange={setStart} onEndChange={setEnd}
          />
          <div className="flex gap-1 border border-stone-200 rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as const).map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-3 h-8 text-xs font-medium transition-all ${
                  groupBy === g ? 'bg-orange-500 text-white' : 'text-stone-600 hover:bg-stone-50'
                }`}>
                {g === 'day' ? 'Hari' : g === 'week' ? 'Minggu' : 'Bulan'}
              </button>
            ))}
          </div>
          {isAdmin && (
            <select value={branchFilter} onChange={e => setBranch(e.target.value)}
              className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400">
              <option value="">Semua Cabang</option>
              {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
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
              { label: 'Total Revenue', value: formatCurrency(summary?.totalRevenue ?? 0) },
              { label: 'Total Transaksi', value: String(summary?.totalTransactions ?? 0) },
              { label: 'Item Terjual', value: String(summary?.totalItemsSold ?? 0) },
              { label: 'Rata-rata / Transaksi', value: formatCurrency(summary?.avgPerTransaction ?? 0) },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                <p className="text-xs text-stone-500 mb-1">{c.label}</p>
                <p className="text-xl font-bold text-stone-900">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <p className="text-sm font-semibold text-stone-700 mb-4">Grafik Penjualan</p>
            <ResponsiveContainer width="100%" height={220}>
              {groupBy === 'day' ? (
                <BarChart data={series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} tickFormatter={compactRp} width={42} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 13 }} cursor={{ fill: '#fff7ed' }} />
                  <Bar dataKey="totalRevenue" name="Revenue" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              ) : (
                <LineChart data={series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} tickFormatter={compactRp} width={42} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 13 }} />
                  <Line dataKey="totalRevenue" name="Revenue" stroke="#fb923c" strokeWidth={2} dot={{ r: 3, fill: '#fb923c' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Products */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <p className="text-sm font-semibold text-stone-700 mb-3">Top 10 Produk Terlaris</p>
              {topProducts.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-8">Tidak ada data</p>
              ) : (
                <div className="space-y-1.5">
                  {topProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3 py-1.5">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm text-stone-700 truncate">{p.name}</span>
                      <span className="text-xs text-stone-400 w-14 text-right flex-shrink-0">{p.qty} item</span>
                      <span className="text-sm font-semibold text-stone-800 w-24 text-right flex-shrink-0">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <p className="text-sm font-semibold text-stone-700 mb-3">Metode Pembayaran</p>
              {payBreakdown.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-8">Tidak ada data</p>
              ) : (
                <div className="space-y-3">
                  {payBreakdown.map(p => (
                    <div key={p.method} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-700">{p.method}</p>
                        <p className="text-xs text-stone-400">{p.count} transaksi</p>
                      </div>
                      <p className="text-sm font-semibold text-stone-800">{formatCurrency(p.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-100">
              <p className="text-sm font-semibold text-stone-700">Detail per Periode</p>
            </div>
            <DataTable data={series} columns={periodCols} enableSorting />
          </div>
        </>
      )}
    </div>
  )
}
