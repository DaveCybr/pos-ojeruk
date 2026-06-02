import { useState } from 'react'
import { Trash2, Minus, Plus, X, ShoppingCart, Tag } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { formatCurrency } from '../../lib/utils'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { CustomerSection } from './CustomerSection'

interface CartPanelProps {
  onCheckout: () => void
  onHold: () => void
}

export function CartPanel({ onCheckout, onHold }: CartPanelProps) {
  const {
    items, discount, addItem, removeItem, updateQty,
    setItemDiscount, setDiscount, clearCart, subtotal, total,
  } = useCartStore()

  const [discountMode,  setDiscountMode]  = useState<'rp' | 'pct'>('rp')
  const [discountInput, setDiscountInput] = useState(0)
  // track which product has its discount input open
  const [discountItemId, setDiscountItemId] = useState<string | null>(null)

  const sub     = subtotal()
  const tot     = total()
  const isEmpty = items.length === 0

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
                    <button onClick={() => addItem({ productId: item.productId, name: item.name, price: item.price, discount: item.discount, imageUrl: item.imageUrl })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-orange-100 active:scale-95 transition-all text-stone-600 hover:text-orange-600">
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex-shrink-0 text-right min-w-[60px]">
                    <p className="text-sm font-semibold text-stone-800">{formatCurrency(item.subtotal)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {/* Item discount toggle */}
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
          </div>
        )}
      </div>

      {/* Bottom: Customer + Discount + Summary + Actions */}
      {!isEmpty && (
        <div className="flex-shrink-0 border-t border-stone-100">
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
