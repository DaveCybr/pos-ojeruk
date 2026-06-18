import { useState, useEffect, useMemo } from 'react'
import { Trash2, Minus, Plus, X, ShoppingCart, Tag, Gift } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCartStore } from '../../stores/cart.store'
import { formatCurrency } from '../../lib/utils'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { CustomerSection } from './CustomerSection'
import { productApi } from '../products/api'

interface CartPanelProps {
  onCheckout: () => void
  onHold: () => void
}

// "teh" = name contains "teh" or starts with "the " (The Jumbo Original, Lemon Teh)
const isTeaItem = (name: string) => {
  const n = name.toLowerCase()
  return n.includes('teh') || /^the\b/.test(n)
}

// "susu/milk" = category name contains "milk" or "susu"
const isMilkItem = (categoryName: string | undefined) => {
  const c = (categoryName ?? '').toLowerCase()
  return c.includes('milk') || c.includes('susu')
}

export function CartPanel({ onCheckout, onHold }: CartPanelProps) {
  const {
    items, promoItems, discount,
    addItem, removeItem, updateQty,
    addPromoItem, removePromoItem,
    setItemDiscount, setDiscount, clearCart, subtotal, total,
  } = useCartStore()

  const [discountMode,  setDiscountMode]  = useState<'rp' | 'pct'>('rp')
  const [discountInput, setDiscountInput] = useState(0)
  const [discountItemId, setDiscountItemId] = useState<string | null>(null)

  // Fetch products for finding "es teh" in mix promo (cache hit - same key as ProductGrid)
  const { data: productData } = useQuery({
    queryKey: ['products', { limit: 200, isActive: 'true' }],
    queryFn: () => productApi.list({ limit: 200, isActive: 'true' }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const sub     = subtotal()
  const tot     = total()
  const isEmpty = items.length === 0

  // ── Promo logic ─────────────────────────────────────────────────────────────

  const teaQty = useMemo(
    () => items.filter(i => isTeaItem(i.name)).reduce((s, i) => s + i.quantity, 0),
    [items],
  )
  const milkQty = useMemo(
    () => items.filter(i => isMilkItem(i.categoryName)).reduce((s, i) => s + i.quantity, 0),
    [items],
  )
  const otherQty = useMemo(
    () => items.filter(i => !isTeaItem(i.name) && !isMilkItem(i.categoryName)).reduce((s, i) => s + i.quantity, 0),
    [items],
  )

  const earnedFreeTea   = Math.floor(teaQty / 3)
  const earnedFreeMilk  = Math.floor(milkQty / 3)
  const mixQty          = (teaQty % 3) + (milkQty % 3) + otherQty
  const earnedFreeEsTeh = Math.floor(mixQty / 3)

  const claimedTea   = promoItems.filter(p => p.type === 'tea').length
  const claimedMilk  = promoItems.filter(p => p.type === 'milk').length
  const claimedEsTeh = promoItems.filter(p => p.type === 'esteh').length

  const availableFreeTea   = earnedFreeTea   - claimedTea
  const availableFreeMilk  = earnedFreeMilk  - claimedMilk
  const availableFreeEsTeh = earnedFreeEsTeh - claimedEsTeh
  const hasPromo = availableFreeTea > 0 || availableFreeMilk > 0 || availableFreeEsTeh > 0

  const totalPromoSavings = promoItems.reduce((s, p) => s + p.price, 0)

  // Auto-remove excess promos when cart items are removed
  useEffect(() => {
    if (claimedTea > earnedFreeTea) {
      const excess = claimedTea - earnedFreeTea
      promoItems.filter(p => p.type === 'tea').slice(-excess).forEach(p => removePromoItem(p.id))
    }
    if (claimedMilk > earnedFreeMilk) {
      const excess = claimedMilk - earnedFreeMilk
      promoItems.filter(p => p.type === 'milk').slice(-excess).forEach(p => removePromoItem(p.id))
    }
    if (claimedEsTeh > earnedFreeEsTeh) {
      const excess = claimedEsTeh - earnedFreeEsTeh
      promoItems.filter(p => p.type === 'esteh').slice(-excess).forEach(p => removePromoItem(p.id))
    }
  }, [earnedFreeTea, earnedFreeMilk, earnedFreeEsTeh, claimedTea, claimedMilk, claimedEsTeh])

  // ── Promo claim handlers ─────────────────────────────────────────────────────

  const handleClaimFreeTea = () => {
    const cheapest = [...items]
      .filter(i => isTeaItem(i.name))
      .sort((a, b) => a.price - b.price)[0]
    if (!cheapest) return
    addPromoItem({ id: `promo-tea-${Date.now()}`, productId: cheapest.productId, name: cheapest.name, price: cheapest.price, type: 'tea' })
  }

  const handleClaimFreeMilk = () => {
    const cheapest = [...items]
      .filter(i => isMilkItem(i.categoryName))
      .sort((a, b) => a.price - b.price)[0]
    if (!cheapest) return
    addPromoItem({ id: `promo-milk-${Date.now()}`, productId: cheapest.productId, name: cheapest.name, price: cheapest.price, type: 'milk' })
  }

  const handleClaimFreeEsTeh = () => {
    // Find cheapest tea product from all products (The Jumbo Original)
    const tehProducts = (productData ?? [])
      .filter(p => isTeaItem(p.name))
      .sort((a, b) => Number(a.price) - Number(b.price))
    const esTeh = tehProducts[0]
    if (!esTeh) return
    addPromoItem({ id: `promo-esteh-${Date.now()}`, productId: esTeh.id, name: esTeh.name, price: Number(esTeh.price), type: 'esteh' })
  }

  // ── Discount handlers ────────────────────────────────────────────────────────

  const handleDiscountChange = (num: number) => {
    setDiscountInput(num)
    setDiscount(discountMode === 'rp' ? num : (num / 100) * sub)
  }

  const handleModeToggle = () => {
    const next = discountMode === 'rp' ? 'pct' : 'rp'
    setDiscountMode(next)
    setDiscountInput(0)
    setDiscount(0)
  }

  const toggleItemDiscount = (productId: string) => {
    setDiscountItemId(prev => prev === productId ? null : productId)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={17} className="text-orange-500" />
          <span className="font-semibold text-stone-800 text-sm">Keranjang</span>
          {!isEmpty && (
            <span className="bg-orange-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button onClick={() => { clearCart(); setDiscountInput(0); setDiscountItemId(null) }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <ShoppingCart size={36} className="text-stone-200 mb-3" />
            <p className="text-sm text-stone-400">Tap produk untuk menambah</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {items.map(item => (
              <div key={item.productId} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-orange-600 font-semibold">{formatCurrency(item.price)}</p>
                      {item.discount > 0 && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                          -{formatCurrency(item.discount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-0 flex-shrink-0">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all text-stone-600">
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold text-stone-800">{item.quantity}</span>
                    <button onClick={() => addItem({ productId: item.productId, name: item.name, price: item.price, discount: item.discount, imageUrl: item.imageUrl, categoryName: item.categoryName })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-orange-100 active:scale-95 transition-all text-stone-600 hover:text-orange-600">
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex-shrink-0 text-right min-w-[60px]">
                    <p className="text-sm font-semibold text-stone-800">{formatCurrency(item.subtotal)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <button
                        onClick={() => toggleItemDiscount(item.productId)}
                        className={`p-0.5 rounded transition-colors ${
                          item.discount > 0 || discountItemId === item.productId
                            ? 'text-green-600'
                            : 'text-stone-300 hover:text-stone-500'
                        }`}
                        title="Diskon item"
                      >
                        <Tag size={11} />
                      </button>
                      <button onClick={() => {
                        removeItem(item.productId)
                        if (discountItemId === item.productId) setDiscountItemId(null)
                      }}
                        className="text-stone-300 hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline item discount input */}
                {discountItemId === item.productId && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
                    <span className="text-xs text-stone-500 flex-shrink-0">Diskon item</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">Rp</span>
                      <CurrencyInput
                        value={item.discount}
                        onChange={v => setItemDiscount(item.productId, Math.min(v, item.price * item.quantity))}
                        placeholder="0"
                        className="w-full h-7 pl-7 pr-2 border border-stone-200 rounded-lg text-sm text-right
                          focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20"
                      />
                    </div>
                    <button onClick={() => { setItemDiscount(item.productId, 0); setDiscountItemId(null) }}
                      className="text-xs text-stone-400 hover:text-red-500 transition-colors flex-shrink-0">
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Promo items */}
            {promoItems.map(promo => (
              <div key={promo.id} className="px-4 py-3 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Gift size={12} className="text-green-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-green-800 truncate">{promo.name}</p>
                    </div>
                    <span className="text-[10px] bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                      GRATIS
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs line-through text-stone-400">{formatCurrency(promo.price)}</p>
                    <p className="text-sm font-bold text-green-600">Rp 0</p>
                  </div>
                  <button onClick={() => removePromoItem(promo.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: Promo banner + Customer + Discount + Summary + Actions */}
      {!isEmpty && (
        <div className="flex-shrink-0 border-t border-stone-100">

          {/* Promo claim banner */}
          {hasPromo && (
            <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <Gift size={13} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-700">PROMO! Beli 3 Gratis 1</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {availableFreeTea > 0 && (
                  <button onClick={handleClaimFreeTea}
                    className="w-full h-8 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-white rounded-lg text-xs font-semibold transition-all">
                    Klaim 1 Teh GRATIS {availableFreeTea > 1 ? `(${availableFreeTea}x)` : ''}
                  </button>
                )}
                {availableFreeMilk > 0 && (
                  <button onClick={handleClaimFreeMilk}
                    className="w-full h-8 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-white rounded-lg text-xs font-semibold transition-all">
                    Klaim 1 Susu GRATIS {availableFreeMilk > 1 ? `(${availableFreeMilk}x)` : ''}
                  </button>
                )}
                {availableFreeEsTeh > 0 && (
                  <button onClick={handleClaimFreeEsTeh}
                    className="w-full h-8 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-white rounded-lg text-xs font-semibold transition-all">
                    Klaim Es Teh GRATIS {availableFreeEsTeh > 1 ? `(${availableFreeEsTeh}x)` : ''}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Customer */}
          <div className="px-4 pt-3 pb-2">
            <CustomerSection />
          </div>

          {/* Transaction-level Discount */}
          <div className="px-4 py-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-stone-500 flex-shrink-0">Diskon</label>
              <button onClick={handleModeToggle}
                className="text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200 text-stone-500 hover:border-orange-300 hover:text-orange-600 transition-all">
                {discountMode === 'rp' ? 'Rp' : '%'}
              </button>
              {discountMode === 'rp' ? (
                <CurrencyInput
                  value={discountInput}
                  onChange={handleDiscountChange}
                  placeholder="0"
                  className="flex-1 h-8 border border-stone-200 rounded-lg px-2 text-sm text-right focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20"
                />
              ) : (
                <input
                  type="number"
                  value={discountInput || ''}
                  onChange={e => handleDiscountChange(parseFloat(e.target.value) || 0)}
                  placeholder="0 %"
                  min={0} max={100}
                  className="flex-1 h-8 border border-stone-200 rounded-lg px-2 text-sm text-right focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20"
                />
              )}
            </div>
            {discount > 0 && (
              <p className="text-xs text-green-600 text-right">Hemat {formatCurrency(discount)}</p>
            )}
          </div>

          {/* Summary */}
          <div className="px-4 pb-3 space-y-1.5 border-t border-stone-100 pt-3">
            <div className="flex justify-between text-sm text-stone-600">
              <span>Subtotal</span>
              <span>{formatCurrency(sub)}</span>
            </div>
            {items.some(i => i.discount > 0) && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon item</span>
                <span>-{formatCurrency(items.reduce((s, i) => s + i.discount, 0))}</span>
              </div>
            )}
            {totalPromoSavings > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promo gratis ({promoItems.length} item)</span>
                <span>-{formatCurrency(totalPromoSavings)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon transaksi</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-orange-600 pt-1 border-t border-stone-100">
              <span>Total</span>
              <span>{formatCurrency(tot)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 space-y-2">
            <button onClick={onCheckout}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                text-white rounded-xl font-bold text-lg transition-all active:scale-[0.98]">
              BAYAR
            </button>
            <button onClick={onHold}
              className="w-full h-10 border border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50
                rounded-xl text-sm font-medium transition-all">
              Tahan Transaksi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
