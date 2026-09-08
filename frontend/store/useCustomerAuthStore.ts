import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setCookie, eraseCookie, getCookie } from '../lib/cookies'

export interface CustomerUser {
  id: string
  name: string
  email: string
  phone: string
  memberSince?: string
  defaultCounty?: string
  defaultSubCounty?: string
  defaultSchool?: string
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  designName: string
  recipientName: string
  schoolName: string
  countyName: string
  subCountyName: string
  status: 'Order Received' | 'Printing & Sealed' | 'Out for Delivery' | 'Delivered'
  amountKes: number
  date: string
}

interface CustomerAuthState {
  user: CustomerUser | null
  orders: CustomerOrder[]
  login: (email: string, password?: string) => boolean
  register: (name: string, email: string, phone: string, password?: string) => boolean
  logout: () => void
  updateProfile: (updated: Partial<CustomerUser>) => void
  addOrder: (order: CustomerOrder) => void
}

const DEFAULT_DEMO_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'POPOTE-8921',
    designName: 'A New Dawn',
    recipientName: 'David Wambua',
    schoolName: 'Alliance High School',
    countyName: 'Kiambu County',
    subCountyName: 'Kikuyu Sub-County',
    status: 'Out for Delivery',
    amountKes: 850,
    date: '2026-08-24',
  },
  {
    id: 'ord-102',
    orderNumber: 'POPOTE-7432',
    designName: 'You Did It',
    recipientName: 'Mercy Akinyi',
    schoolName: 'Kenya High School',
    countyName: 'Nairobi County',
    subCountyName: 'Kilimani Sub-County',
    status: 'Delivered',
    amountKes: 950,
    date: '2026-08-18',
  },
  {
    id: 'ord-103',
    orderNumber: 'POPOTE-6105',
    designName: 'Grace & Glory',
    recipientName: 'Samuel Omwamba',
    schoolName: 'Kapsabet High School',
    countyName: 'Nandi County',
    subCountyName: 'Kapsabet CBD',
    status: 'Delivered',
    amountKes: 1500,
    date: '2026-08-10',
  },
]

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: 'cust-demo-1',
        name: 'Amina Muthoni',
        email: 'amina.muthoni@gmail.com',
        phone: '+254 712 345 678',
        memberSince: 'August 2026',
        defaultCounty: 'Nairobi County',
        defaultSubCounty: 'Westlands Sub-County',
        defaultSchool: 'Kenya High School',
      },
      orders: DEFAULT_DEMO_ORDERS,

      login: (email, _password) => {
        const newUser: CustomerUser = {
          id: `cust-${Date.now()}`,
          name: email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase()),
          email: email,
          phone: '+254 722 000 111',
          memberSince: 'August 2026',
          defaultCounty: 'Nairobi County',
          defaultSubCounty: 'Starehe CBD',
          defaultSchool: 'Starehe Boys Centre',
        }
        setCookie('popote_customer_token', `token_${newUser.id}`, 7)
        set({ user: newUser })
        return true
      },

      register: (name, email, phone, _password) => {
        const newUser: CustomerUser = {
          id: `cust-${Date.now()}`,
          name,
          email,
          phone,
          memberSince: 'August 2026',
        }
        setCookie('popote_customer_token', `token_${newUser.id}`, 7)
        set({ user: newUser })
        return true
      },

      logout: () => {
        eraseCookie('popote_customer_token')
        eraseCookie('fair_customer_token')
        set({ user: null })
      },

      updateProfile: (updated) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updated } })
        }
      },

      addOrder: (newOrder) => {
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }))
      },
    }),
    {
      name: 'popote_customer_auth_v1',
    }
  )
)
