import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '../products/api'
import { stockApi } from '../stock/api'
import { useCartStore } from '../../stores/cart.store'
import { formatCurrency } from '../../lib/utils'
import type { Product, Category } from '../../types'
import type { StockItem } from '../stock/types'

interface ProductGridProps {
  branchId: string
  onBarcodeSearch?: (query: string) => void
}

export function ProductGrid({ branchId, onBarcodeSearch }: ProductGridProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const { addItem } = useCartStore()

  // Fetch all active products once
  const { data: productData } = useQuery({
    queryKey: ['products', { limit: 200, isActive: 'true' }],
    queryFn: () => productApi.list({ limit: 200, isActive: 'true' }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch stock for this branch
  const { data: stockData } = useQuery({
    queryKey: ['stock', 'branch', branchId],
    queryFn: () => stockApi.byBranch(branchId).then(r => r.data.data),
    refetchInterval: 30_000,
  })

  // Build a stock map: productId → StockItem
  const stockMap = useMemo(() => {
    const m = new Map<string, StockItem>()
    stockData?.forEach(s => m.set(s.productId, s))
    return m
  }, [stockData])

  // Extract unique categories
  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>()
    productData?.forEach(p => { if (p.category) map.set(p.category.id, p.category) })
    return Array.from(map.values())
  }, [productData])

  // Filtered products
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return (productData ?? []).filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q)
      const matchCat    = activeCategory === 'all' || p.categoryId === activeCategory
      return matchSearch && matchCat
    })
  }, [productData, searchQuery, activeCategory])

  // Keyboard shortcut: '/' or 'F5' → focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === '/' || e.key === 'F5') && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    // Barcode: 8+ digits → auto-add
    if (/^\d{8,}$/.test(val)) {
      const p = productData?.find(p => p.barcode === val)
      if (p) {
        handleAddToCart(p)
        setSearchQuery('')
      } else {
        onBarcodeSearch?.(val)
      }
    }
  }

  const handleAddToCart = (p: Product) => {
    const stock = stockMap.get(p.id)
    if (stock && stock.quantity === 0) return
    addItem({ productId: p.id, name: p.name, price: Number(p.price), discount: 0, imageUrl: p.imageUrl })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Cari produk atau scan barcode... ( / )"
            className="w-full pl-10 pr-4 h-11 border border-stone-300 rounded-xl text-sm bg-white
              focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
              placeholder:text-stone-400 transition-all"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto flex-shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            activeCategory === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:border-orange-300'
          }`}
        >
          Semua
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)}
            className={`px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === c.id
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-orange-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => {
            const stock    = stockMap.get(p.id)
            const qty      = stock?.quantity ?? 0
            const minStock = stock?.minStock ?? 5
            const isOut    = qty === 0
            const isLow    = qty > 0 && qty <= minStock

            return (
              <button
                key={p.id}
                onClick={() => handleAddToCart(p)}
                disabled={isOut}
                className={`bg-white rounded-xl border p-3 text-left flex flex-col gap-1.5
                  active:scale-95 transition-all select-none
                  ${isOut
                    ? 'opacity-60 cursor-not-allowed border-stone-200'
                    : 'border-stone-200 hover:border-orange-300 hover:shadow-md hover:bg-orange-50/40 cursor-pointer shadow-sm'
                  }`}
              >
                {/* Emoji / image */}
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-3xl mb-1 ${
                  isOut ? 'bg-stone-100' : 'bg-orange-50'
                }`}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                    : '🍊'
                  }
                </div>

                <p className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2">{p.name}</p>
                <p className="text-sm font-bold text-orange-600">{formatCurrency(p.price)}</p>

                {/* Stock badge */}
                {isOut ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 w-fit">
                    Habis
                  </span>
                ) : isLow ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                    <AlertTriangle size={10} /> Sisa {qty}
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">{p.unit}</span>
                )}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-stone-400 text-sm">Produk tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
