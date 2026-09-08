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
  zone?: 'cbd' | 'outskirts'
  religion?: 'christian' | 'muslim' | 'other'
  unitPriceKes: number
}

interface CartStore {
  items: CartItem[]
  deliveryRates: { cbd: number; outskirts: number }
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  clearCart: () => void
  setDeliveryRates: (rates: { cbd: number; outskirts: number }) => void
  getCardsSubtotal: () => number
  getDeliveryTotal: (customRates?: { cbd: number; outskirts: number }) => number
  getTotalAmount: (customRates?: { cbd: number; outskirts: number }) => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryRates: { cbd: 150, outskirts: 300 },
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      clearCart: () => set({ items: [] }),
      setDeliveryRates: (rates) => set({ deliveryRates: rates }),
      getCardsSubtotal: () => get().items.reduce((sum, item) => sum + item.unitPriceKes, 0),
      getDeliveryTotal: (customRates) => {
        const rates = customRates || get().deliveryRates || { cbd: 150, outskirts: 300 }
        return get().items.reduce((sum, item) => {
          const fee = item.zone === 'outskirts' ? rates.outskirts : rates.cbd
          return sum + fee
        }, 0)
      },
      getTotalAmount: (customRates) => {
        const cardsTotal = get().items.reduce((sum, item) => sum + item.unitPriceKes, 0)
        const deliveryTotal = get().getDeliveryTotal(customRates)
        return cardsTotal + deliveryTotal
      },
    }),
    {
      name: 'popote_cart_storage',
    }
  )
)
