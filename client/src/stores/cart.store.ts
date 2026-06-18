import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  discount: number
  subtotal: number
  imageUrl?: string | null
  categoryName?: string
}

export interface PromoItem {
  id: string
  productId: string
  name: string
  price: number
  type: 'tea' | 'milk' | 'esteh'
}

export interface CartCustomer {
  id: string
  name: string
  phone?: string | null
}

interface CartStore {
  items: CartItem[]
  promoItems: PromoItem[]
  discount: number
  customer: CartCustomer | null
  addItem: (product: Omit<CartItem, 'quantity' | 'subtotal'>) => void
  addPromoItem: (promo: PromoItem) => void
  removePromoItem: (id: string) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  setItemDiscount: (productId: string, discount: number) => void
  setDiscount: (discount: number) => void
  setCustomer: (customer: CartCustomer | null) => void
  clearCart: () => void
  total: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  promoItems: [],
  discount: 0,
  customer: null,

  addItem: (product) => {
    const items = get().items
    const exists = items.find(i => i.productId === product.productId)
    if (exists) {
      set({ items: items.map(i => i.productId === product.productId
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
        : i
      )})
    } else {
      set({ items: [...items, { ...product, quantity: 1, subtotal: product.price }] })
    }
  },

  addPromoItem: (promo) => set({ promoItems: [...get().promoItems, promo] }),
  removePromoItem: (id) => set({ promoItems: get().promoItems.filter(p => p.id !== id) }),

  removeItem: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return }
    set({ items: get().items.map(i => i.productId === productId
      ? { ...i, quantity: qty, subtotal: qty * i.price - i.discount } : i
    )})
  },

  setItemDiscount: (productId, discount) => {
    set({ items: get().items.map(i => i.productId === productId
      ? { ...i, discount, subtotal: i.quantity * i.price - discount } : i
    )})
  },

  setDiscount: (discount) => set({ discount }),
  setCustomer: (customer) => set({ customer }),
  clearCart: () => set({ items: [], promoItems: [], discount: 0, customer: null }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
  total: () => Math.max(0, get().subtotal() - get().discount),
}))
