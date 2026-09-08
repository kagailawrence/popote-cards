import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  designId: string
  designName: string
  designImageUrl?: string
  size: 'A3' | 'A4' | 'A5'
  customPhotoUrl?: string
  customPhotoPath?: string
  messageBody: string
  messageFont?: string
  messageColour?: string
  recipientFullNames: string
  admissionNumber: string
  schoolName: string
  studentClass?: string
  countyId: string
  countyName: string
  subCountyId: string
  subCountyName: string
  religion?: 'christian' | 'muslim' | 'other'
  unitPriceKes: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  clearCart: () => void
  getTotalAmount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      clearCart: () => set({ items: [] }),
      getTotalAmount: () => get().items.reduce((sum, item) => sum + item.unitPriceKes, 0),
    }),
    {
      name: 'popote_cart_storage',
    }
  )
)
