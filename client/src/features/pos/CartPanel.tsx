import { useState } from 'react'
import { Trash2, Minus, Plus, X, ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { formatCurrency } from '../../lib/utils'

interface CartPanelProps {
  onCheckout: () => void
  onHold: () => void
}

export function CartPanel({ onCheckout, onHold }: CartPanelProps) {
  const { items, discount, addItem, removeItem, updateQty, setDiscount, clearCart, subtotal, total } = useCartStore()
  const [discountMode, setDiscountMode] = useState<'rp' | 'pct'>('rp')
  const [discountInput, setDiscountInput] = useState('')

  const sub = subtotal()
  const tot = total()
  const isEmpty = items.length === 0

  const handleDiscountChange = (val: string) => {
    setDiscountInput(val)
    const num = parseFloat(val) || 0
    setDiscount(discountMode === 'rp' ? num : (num / 100) * sub)
  }

  const handleModeToggle = () => {
    const next = discountMode === 'rp' ? 'pct' : 'rp'
    setDiscountMode(next)
    setDiscountInput('')
    setDiscount(0)
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
          <button onClick={() => { clearCart(); setDiscountInput('') }}
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
              <div key={item.productId} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                  <p className="text-xs text-orange-600 font-semibold">{formatCurrency(item.price)}</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-0 flex-shrink-0">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all text-stone-600">
                    <Minus size={13} />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold text-stone-800">{item.quantity}</span>
                  <button onClick={() => addItem({ productId: item.productId, name: item.name, price: item.price, discount: 0, imageUrl: item.imageUrl })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-orange-100 active:scale-95 transition-all text-stone-600 hover:text-orange-600">
                    <Plus size={13} />
                  </button>
                </div>

                <div className="flex-shrink-0 text-right min-w-[60px]">
                  <p className="text-sm font-semibold text-stone-800">{formatCurrency(item.subtotal)}</p>
                  <button onClick={() => removeItem(item.productId)}
                    className="mt-0.5 text-stone-300 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discount + Summary + Actions */}
      {!isEmpty && (
        <div className="flex-shrink-0 border-t border-stone-100">
          {/* Discount */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-stone-500 flex-shrink-0">Diskon</label>
              <button onClick={handleModeToggle}
                className="text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200 text-stone-500 hover:border-orange-300 hover:text-orange-600 transition-all">
                {discountMode === 'rp' ? 'Rp' : '%'}
              </button>
              <input
                type="number"
                value={discountInput}
                onChange={e => handleDiscountChange(e.target.value)}
                placeholder={discountMode === 'rp' ? '0' : '0 %'}
                min={0}
                className="flex-1 h-8 border border-stone-200 rounded-lg px-2 text-sm text-right focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20"
              />
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
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon</span>
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
            <button
              onClick={onCheckout}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                text-white rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
            >
              BAYAR
            </button>
            <button
              onClick={onHold}
              className="w-full h-10 border border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50
                rounded-xl text-sm font-medium transition-all"
            >
              Tahan Transaksi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
