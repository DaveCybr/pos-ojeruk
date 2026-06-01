import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  discount: number
  subtotal: number
  imageUrl?: string | null
}

interface CartStore {
  items: CartItem[]
  discount: number
  addItem: (product: Omit<CartItem, 'quantity' | 'subtotal'>) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  setDiscount: (discount: number) => void
  clearCart: () => void
  total: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
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
  removeItem: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),
  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return }
    set({ items: get().items.map(i => i.productId === productId
      ? { ...i, quantity: qty, subtotal: qty * i.price } : i
    )})
  },
  setDiscount: (discount) => set({ discount }),
  clearCart: () => set({ items: [], discount: 0 }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
  total: () => Math.max(0, get().subtotal() - get().discount),
}))
