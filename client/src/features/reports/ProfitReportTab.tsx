import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { reportsApi } from './api'
import { useAuthStore } from '../../stores/auth.store'
import { branchApi } from '../branches/api'
import { formatCurrency } from '../../lib/utils'
import { exportCsv } from '../../lib/exportCsv'
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

export function ProfitReportTab() {
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
    queryKey: ['reports', 'profit', startDate, endDate, branchFilter, groupBy],
    queryFn:  () => reportsApi.profit({
      startDate, endDate, groupBy, branchId: branchFilter || undefined,
    }).then(r => r.data.data),
  })

  const summary     = report?.summary
  const series      = report?.series ?? []
  const topProducts = report?.topProducts ?? []

  const handleExport = () => {
    exportCsv(
      ['Periode', 'Revenue', 'HPP (COGS)', 'Gross Profit', 'Margin (%)'],
      series.map(r => [r.label, r.revenue, r.cogs, r.grossProfit, r.profitMargin]),
      `laporan-profit-${startDate}-${endDate}`,
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
              { label: 'Total Revenue',  value: formatCurrency(summary?.totalRevenue ?? 0),   color: 'text-stone-900' },
              { label: 'Total HPP',      value: formatCurrency(summary?.totalCogs ?? 0),       color: 'text-stone-900' },
              { label: 'Gross Profit',   value: formatCurrency(summary?.totalProfit ?? 0),     color: 'text-emerald-700' },
              { label: 'Profit Margin',  value: `${summary?.avgMargin ?? 0}%`,                 color: 'text-emerald-700' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                <p className="text-xs text-stone-500 mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Grouped Bar Chart: Revenue vs HPP */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <p className="text-sm font-semibold text-stone-700 mb-4">Revenue vs HPP per Periode</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false}
                  tickFormatter={v => groupBy === 'day' ? v.slice(5) : v} />
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} tickFormatter={compactRp} width={42} />
                <Tooltip
                  formatter={(v: number, name: string) => [formatCurrency(v), name === 'revenue' ? 'Revenue' : name === 'cogs' ? 'HPP' : 'Gross Profit']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 13 }}
                  cursor={{ fill: '#fff7ed' }}
                />
                <Legend formatter={v => <span style={{ fontSize: 12, color: '#78716c' }}>{v === 'revenue' ? 'Revenue' : v === 'cogs' ? 'HPP' : 'Gross Profit'}</span>} />
                <Bar dataKey="revenue" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="cogs"    fill="#d6d3d1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="grossProfit" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Profit */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <p className="text-sm font-semibold text-stone-700 mb-3">Top 10 Produk Paling Profitable</p>
            {topProducts.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">Tidak ada data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left py-2 px-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">#</th>
                      <th className="text-left py-2 px-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">Produk</th>
                      <th className="text-right py-2 px-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">Revenue</th>
                      <th className="text-right py-2 px-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">HPP</th>
                      <th className="text-right py-2 px-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">Profit</th>
                      <th className="text-right py-2 px-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.productId} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                        <td className="py-2 px-2 text-stone-400">{i + 1}</td>
                        <td className="py-2 px-2 font-medium text-stone-800">{p.name}</td>
                        <td className="py-2 px-2 text-right text-stone-600">{formatCurrency(p.revenue)}</td>
                        <td className="py-2 px-2 text-right text-stone-500">{formatCurrency(p.cogs)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-emerald-700">{formatCurrency(p.profit)}</td>
                        <td className="py-2 px-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {p.margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Table */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100">
              <p className="text-sm font-semibold text-stone-700">Detail per Periode</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    {['Periode', 'Revenue', 'HPP', 'Gross Profit', 'Margin'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {series.map(row => (
                    <tr key={row.label} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[13px] text-stone-700">{row.label}</td>
                      <td className="px-4 py-3 text-stone-700">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-3 text-stone-500">{formatCurrency(row.cogs)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(row.grossProfit)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {row.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {series.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
