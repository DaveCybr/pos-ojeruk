import { z } from 'zod'
import { prisma } from '../lib/prisma'

export const reportQuerySchema = z.object({
  branchId:   z.string().optional(),
  categoryId: z.string().optional(),
  startDate:  z.string().optional(),
  endDate:    z.string().optional(),
  groupBy:    z.enum(['day', 'week', 'month']).optional().default('day'),
  status:     z.enum(['low', 'out', 'ok']).optional(),
  page:       z.coerce.number().positive().optional().default(1),
  limit:      z.coerce.number().positive().max(200).optional().default(50),
})

type ReportQuery = z.infer<typeof reportQuerySchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateRange(startDate?: string, endDate?: string, defaultDays = 30) {
  const end   = endDate   ? new Date(endDate   + 'T23:59:59.999Z') : new Date()
  const start = startDate ? new Date(startDate + 'T00:00:00.000Z')
                          : new Date(end.getTime() - (defaultDays - 1) * 86_400_000)
  return { start, end }
}

function dayKey(d: Date)   { return d.toISOString().slice(0, 10) }
function monthKey(d: Date) { return d.toISOString().slice(0, 7)  }

function weekKey(d: Date) {
  const tmp = new Date(d)
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
  const w1 = new Date(tmp.getFullYear(), 0, 4)
  const wn = 1 + Math.round(((tmp.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
  return `${tmp.getFullYear()}-W${String(wn).padStart(2, '0')}`
}

function getKey(d: Date, g: 'day' | 'week' | 'month') {
  return g === 'week' ? weekKey(d) : g === 'month' ? monthKey(d) : dayKey(d)
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export async function getSummary(branchId?: string) {
  const now            = new Date()
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart  = new Date(todayStart.getTime() + 86_400_000)
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)
  const bf             = branchId ? { branchId } : {}

  const completedWhere = (gte: Date, lt: Date) => ({
    status: 'COMPLETED' as const, createdAt: { gte, lt }, ...bf,
  })

  const [todayAgg, yesterdayAgg, todayItems, stocks, paymentGroups, recentTx] = await Promise.all([
    prisma.transaction.aggregate({
      where: completedWhere(todayStart, tomorrowStart),
      _count: { id: true },
      _sum:   { total: true },
    }),
    prisma.transaction.aggregate({
      where: completedWhere(yesterdayStart, todayStart),
      _sum: { total: true },
    }),
    prisma.transactionItem.findMany({
      where: { transaction: completedWhere(todayStart, tomorrowStart) },
      include: { product: { select: { costPrice: true, name: true } } },
    }),
    prisma.stock.findMany({
      where: branchId ? { branchId } : {},
      select: { quantity: true, minStock: true },
    }),
    prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: completedWhere(todayStart, tomorrowStart),
      _count: { id: true },
      _sum:   { total: true },
    }),
    prisma.transaction.findMany({
      where: completedWhere(todayStart, tomorrowStart),
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        branch:  { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items:   { select: { id: true } },
      },
    }),
  ])

  const totalRevenue      = Number(todayAgg._sum.total ?? 0)
  const totalTransactions = todayAgg._count.id
  const totalItemsSold    = todayItems.reduce((s, i) => s + i.quantity, 0)
  const totalProfit       = todayItems.reduce((s, i) =>
    s + (Number(i.price) - Number(i.product.costPrice)) * i.quantity, 0)

  const yesterdayRevenue = Number(yesterdayAgg._sum.total ?? 0)
  const revenueGrowth    = yesterdayRevenue === 0
    ? (totalRevenue > 0 ? 100 : 0)
    : +((totalRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)

  const lowStockCount = stocks.filter(s => s.quantity > 0 && s.quantity <= s.minStock).length
  const outOfStockCount = stocks.filter(s => s.quantity === 0).length

  // Top 5 products today
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  todayItems.forEach(item => {
    const p = productMap.get(item.productId) ?? { name: item.product.name, qty: 0, revenue: 0 }
    productMap.set(item.productId, {
      name: p.name, qty: p.qty + item.quantity, revenue: p.revenue + Number(item.subtotal),
    })
  })
  const topProducts = [...productMap.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  const paymentBreakdown = paymentGroups.map(g => ({
    method: g.paymentMethod,
    count:  g._count.id,
    total:  Number(g._sum.total ?? 0),
  }))

  return {
    today: { totalRevenue, totalTransactions, totalItemsSold, totalProfit },
    revenueGrowth,
    lowStockCount,
    outOfStockCount,
    topProducts,
    paymentBreakdown,
    recentTransactions: recentTx,
  }
}

// ─── Sales Report ─────────────────────────────────────────────────────────────

export async function getSalesReport(query: ReportQuery) {
  const { branchId, groupBy = 'day' } = query
  const { start, end } = dateRange(query.startDate, query.endDate, 30)
  const bf = branchId ? { branchId } : {}

  const transactions = await prisma.transaction.findMany({
    where: { status: 'COMPLETED', createdAt: { gte: start, lte: end }, ...bf },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by period
  const periodMap = new Map<string, { totalRevenue: number; totalTransactions: number; totalItemsSold: number }>()
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  const payMap     = new Map<string, { count: number; total: number }>()

  transactions.forEach(tx => {
    const key = getKey(tx.createdAt, groupBy)

    const period = periodMap.get(key) ?? { totalRevenue: 0, totalTransactions: 0, totalItemsSold: 0 }
    const itemsTotal = tx.items.reduce((s, i) => s + i.quantity, 0)
    periodMap.set(key, {
      totalRevenue:      period.totalRevenue      + Number(tx.total),
      totalTransactions: period.totalTransactions + 1,
      totalItemsSold:    period.totalItemsSold    + itemsTotal,
    })

    const pm = payMap.get(tx.paymentMethod) ?? { count: 0, total: 0 }
    payMap.set(tx.paymentMethod, { count: pm.count + 1, total: pm.total + Number(tx.total) })

    tx.items.forEach(item => {
      const p = productMap.get(item.productId) ?? { name: item.product?.name ?? '-', qty: 0, revenue: 0 }
      productMap.set(item.productId, {
        name:    p.name,
        qty:     p.qty     + item.quantity,
        revenue: p.revenue + Number(item.subtotal),
      })
    })
  })

  const series         = [...periodMap.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const topProducts    = [...productMap.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const paymentBreakdown = [...payMap.entries()]
    .map(([method, v]) => ({ method, ...v }))

  const totalRevenue      = series.reduce((s, d) => s + d.totalRevenue, 0)
  const totalTransactions = series.reduce((s, d) => s + d.totalTransactions, 0)
  const totalItemsSold    = series.reduce((s, d) => s + d.totalItemsSold, 0)

  return {
    series,
    summary: {
      totalRevenue,
      totalTransactions,
      totalItemsSold,
      avgPerTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    },
    topProducts,
    paymentBreakdown,
  }
}

// ─── Profit Report ────────────────────────────────────────────────────────────

export async function getProfitReport(query: ReportQuery) {
  const { branchId, groupBy = 'day' } = query
  const { start, end } = dateRange(query.startDate, query.endDate, 30)
  const bf = branchId ? { branchId } : {}

  const items = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
        ...bf,
      },
    },
    include: {
      product:     { select: { name: true, costPrice: true } },
      transaction: { select: { createdAt: true, invoiceNo: true, paymentMethod: true } },
    },
    orderBy: { transaction: { createdAt: 'asc' } },
  })

  const periodMap  = new Map<string, { revenue: number; cogs: number; grossProfit: number }>()
  const productMap = new Map<string, { name: string; revenue: number; cogs: number; profit: number }>()

  items.forEach(item => {
    const key     = getKey(item.transaction.createdAt, groupBy)
    const revenue = Number(item.subtotal)
    const cogs    = Number(item.product.costPrice) * item.quantity
    const profit  = revenue - cogs

    const period = periodMap.get(key) ?? { revenue: 0, cogs: 0, grossProfit: 0 }
    periodMap.set(key, {
      revenue:     period.revenue     + revenue,
      cogs:        period.cogs        + cogs,
      grossProfit: period.grossProfit + profit,
    })

    const p = productMap.get(item.productId) ?? { name: item.product.name, revenue: 0, cogs: 0, profit: 0 }
    productMap.set(item.productId, {
      name:    p.name,
      revenue: p.revenue + revenue,
      cogs:    p.cogs    + cogs,
      profit:  p.profit  + profit,
    })
  })

  const series = [...periodMap.entries()]
    .map(([label, v]) => ({
      label,
      ...v,
      profitMargin: v.revenue > 0 ? +(v.grossProfit / v.revenue * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const topProducts = [...productMap.entries()]
    .map(([productId, v]) => ({
      productId, ...v,
      margin: v.revenue > 0 ? +(v.profit / v.revenue * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  const totalRevenue = series.reduce((s, d) => s + d.revenue, 0)
  const totalCogs    = series.reduce((s, d) => s + d.cogs, 0)
  const totalProfit  = series.reduce((s, d) => s + d.grossProfit, 0)

  return {
    series,
    summary: {
      totalRevenue,
      totalCogs,
      totalProfit,
      avgMargin: totalRevenue > 0 ? +(totalProfit / totalRevenue * 100).toFixed(1) : 0,
    },
    topProducts,
  }
}

// ─── Stock Report ─────────────────────────────────────────────────────────────

export async function getStockReport(query: Pick<ReportQuery, 'branchId' | 'categoryId' | 'status'>) {
  const { branchId, categoryId, status } = query

  const stocks = await prisma.stock.findMany({
    where: {
      ...(branchId   ? { branchId }   : {}),
      ...(categoryId ? { product: { categoryId } } : {}),
    },
    include: {
      product: { include: { category: { select: { id: true, name: true } } } },
      branch:  { select: { id: true, name: true, city: true } },
    },
    orderBy: [{ branch: { name: 'asc' } }, { quantity: 'asc' }],
  })

  const lowStockItems  = stocks.filter(s => s.quantity > 0 && s.quantity <= s.minStock)
  const outStockItems  = stocks.filter(s => s.quantity === 0)
  const totalSKU       = new Set(stocks.map(s => s.productId)).size
  const stockValue     = stocks.reduce((s, st) =>
    s + st.quantity * Number(st.product.costPrice), 0)

  // Status filter
  let stockList = stocks
  if (status === 'low')  stockList = lowStockItems
  if (status === 'out')  stockList = outStockItems
  if (status === 'ok')   stockList = stocks.filter(s => s.quantity > s.minStock)

  const enriched = stockList.map(s => {
    const st = s.quantity === 0 ? 'out' : s.quantity <= s.minStock ? 'low' : 'ok'
    return {
      id:          s.id,
      productId:   s.productId,
      productName: s.product.name,
      barcode:     s.product.barcode,
      category:    s.product.category,
      branchId:    s.branchId,
      branchName:  s.branch.name,
      quantity:    s.quantity,
      minStock:    s.minStock,
      costPrice:   Number(s.product.costPrice),
      stockValue:  s.quantity * Number(s.product.costPrice),
      status:      st,
      updatedAt:   s.updatedAt,
    }
  })

  return {
    summary: {
      stockValue,
      totalSKU,
      lowStockCount:  lowStockItems.length,
      outOfStockCount: outStockItems.length,
    },
    lowStockItems:  lowStockItems.slice(0, 10).map(s => ({
      productName: s.product.name,
      branchName:  s.branch.name,
      quantity:    s.quantity,
      minStock:    s.minStock,
    })),
    outOfStockItems: outStockItems.slice(0, 10).map(s => ({
      productName: s.product.name,
      branchName:  s.branch.name,
      quantity:    s.quantity,
      minStock:    s.minStock,
    })),
    stockList: enriched,
  }
}
