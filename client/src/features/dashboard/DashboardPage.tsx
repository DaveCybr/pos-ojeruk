import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Receipt, ShoppingCart, DollarSign,
  AlertTriangle, ArrowRight, Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { reportsApi } from '../reports/api'
import { useAuthStore } from '../../stores/auth.store'
import { branchApi } from '../branches/api'
import { formatCurrency } from '../../lib/utils'
import type { SummaryData, SalesData } from '../reports/types'
import type { Branch } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date) { return d.toISOString().slice(0, 10) }

function last7Days() {
  const end = new Date(); const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return { startDate: toISO(start), endDate: toISO(end) }
}

const compactRp = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

const PIE_COLORS: Record<string, string> = {
  CASH:     '#fb923c',
  TRANSFER: '#38bdf8',
  QRIS:     '#a78bfa',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, color, growth,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  growth?: number | null
}) {
  const isUp = (growth ?? 0) >= 0
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {growth != null && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-sm text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
    </div>
  )
}

function ChartTooltipContent({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-stone-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-stone-600">
          {p.name === 'totalRevenue' ? 'Revenue' : 'Transaksi'}:{' '}
          <span className="font-semibold text-orange-600">
            {p.name === 'totalRevenue' ? formatCurrency(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin  = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'
  const [branchFilter, setBranch] = useState(
    user?.role === 'CASHIER' ? (user.branchId ?? '') : ''
  )

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data),
    enabled:  isAdmin,
    staleTime: 5 * 60 * 1000,
  })

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary', branchFilter],
    queryFn:  () => reportsApi.summary(branchFilter || undefined).then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const { data: salesRes, isLoading: chartLoading } = useQuery({
    queryKey: ['reports', 'sales-chart', branchFilter],
    queryFn:  () => reportsApi.sales({
      ...last7Days(), groupBy: 'day', branchId: branchFilter || undefined,
    }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const summary: SummaryData | undefined = summaryRes
  const sales: SalesData | undefined = salesRes

  if (summaryLoading) {
    return (
      <AppLayout>
        <PageHeader title="Dashboard" description="Ringkasan penjualan & stok hari ini" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      </AppLayout>
    )
  }

  const today = summary?.today
  const chartData = sales?.series ?? []

  return (
    <AppLayout>
      <PageHeader title="Dashboard" description="Ringkasan penjualan & stok hari ini" />

      <div className="p-6 md:p-8 space-y-6">
        {/* Branch filter (Admin/Warehouse) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Cabang:</span>
            <select
              value={branchFilter}
              onChange={e => setBranch(e.target.value)}
              className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400"
            >
              <option value="">Semua Cabang</option>
              {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Pendapatan Hari Ini"
            value={formatCurrency(today?.totalRevenue ?? 0)}
            icon={TrendingUp}
            color="bg-green-500"
            growth={summary?.revenueGrowth}
          />
          <SummaryCard
            label="Total Transaksi"
            value={String(today?.totalTransactions ?? 0)}
            icon={Receipt}
            color="bg-sky-500"
            growth={null}
          />
          <SummaryCard
            label="Item Terjual"
            value={String(today?.totalItemsSold ?? 0)}
            icon={ShoppingCart}
            color="bg-orange-500"
            growth={null}
          />
          <SummaryCard
            label="Gross Profit"
            value={formatCurrency(today?.totalProfit ?? 0)}
            icon={DollarSign}
            color="bg-emerald-500"
            growth={null}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <p className="text-sm font-semibold text-stone-700 mb-4">Pendapatan 7 Hari Terakhir</p>
            {chartLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#a8a29e' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v.slice(5)} // MM-DD
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#a8a29e' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={compactRp}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: '#fff7ed' }} />
                  <Bar dataKey="totalRevenue" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Pie */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <p className="text-sm font-semibold text-stone-700 mb-4">Metode Pembayaran</p>
            {(summary?.paymentBreakdown?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-stone-400">
                <p className="text-sm">Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={summary?.paymentBreakdown ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="total"
                    nameKey="method"
                  >
                    {summary?.paymentBreakdown?.map(entry => (
                      <Cell key={entry.method} fill={PIE_COLORS[entry.method] ?? '#d6d3d1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: 13 }}
                  />
                  <Legend
                    formatter={v => <span style={{ fontSize: 12, color: '#78716c' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <p className="text-sm font-semibold text-stone-700 mb-4">Produk Terlaris Hari Ini</p>
            {(summary?.topProducts?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-stone-400">
                <ShoppingCart size={28} className="mb-2 text-stone-200" />
                <p className="text-sm">Belum ada penjualan</p>
              </div>
            ) : (
              <div className="space-y-1">
                {summary?.topProducts?.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-stone-700 truncate">{p.name}</span>
                    <span className="text-xs text-stone-400 flex-shrink-0">{p.qty} item</span>
                    <span className="text-sm font-semibold text-stone-800 flex-shrink-0">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-stone-700">Peringatan Stok</p>
              <button
                onClick={() => navigate('/stock')}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Lihat semua <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-[11px] text-amber-600 font-medium mb-1">Stok Rendah</p>
                <p className="text-2xl font-bold text-amber-700">{summary?.lowStockCount ?? 0}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <p className="text-[11px] text-red-600 font-medium mb-1">Stok Habis</p>
                <p className="text-2xl font-bold text-red-700">{summary?.outOfStockCount ?? 0}</p>
              </div>
            </div>
            {(summary?.lowStockCount ?? 0) + (summary?.outOfStockCount ?? 0) === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 font-medium">✓ Semua stok dalam kondisi aman</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                <AlertTriangle size={13} />
                <span>Ada {(summary?.lowStockCount ?? 0) + (summary?.outOfStockCount ?? 0)} produk perlu perhatian</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
