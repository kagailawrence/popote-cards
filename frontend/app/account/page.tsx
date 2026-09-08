'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User, Lock, Mail, Phone, MapPin, Package, CheckCircle2,
  Clock, ArrowRight, LogOut, Sparkles, ShieldCheck, Heart,
  Edit3, Save, UserCheck, ChevronRight, School, Award, Star,
  Eye, EyeOff
} from 'lucide-react'
import { useCustomerAuthStore, CustomerOrder } from '../../store/useCustomerAuthStore'
import { getCookie } from '../../lib/cookies'
import { ReviewModal } from '../../components/ReviewModal'

export default function CustomerAccountPage() {
  const router = useRouter()
  const { user, orders, login, register, logout, updateProfile } = useCustomerAuthStore()
  const [mounted, setMounted] = useState(false)

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [authError, setAuthError] = useState('')

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders')

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCounty, setEditCounty] = useState('')
  const [editSubCounty, setEditSubCounty] = useState('')
  const [editSchool, setEditSchool] = useState('')
  const [saveSuccessToast, setSaveSuccessToast] = useState(false)
  const [reviewingOrder, setReviewingOrder] = useState<CustomerOrder | null>(null)

  useEffect(() => {
    setMounted(true)
    const adminToken =
      getCookie('popote_admin_token') ||
      getCookie('fair_admin_token') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('popote_admin_token') || localStorage.getItem('fair_admin_token')
        : null)
    if (adminToken) {
      router.push('/admin')
      return
    }
    const token = getCookie('popote_customer_token') || getCookie('fair_customer_token')
    if (token && !user) {
      login('customer@fair.co.ke', 'demo1234')
    }
  }, [user, login, router])

  useEffect(() => {
    if (user) {
      setEditName(user.name || '')
      setEditPhone(user.phone || '')
      setEditCounty(user.defaultCounty || 'Nairobi County')
      setEditSubCounty(user.defaultSubCounty || 'Westlands Sub-County')
      setEditSchool(user.defaultSchool || 'Kenya High School')
    }
  }, [user])

  if (!mounted) return null

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!email || !password) {
      setAuthError('Please fill in both email and password.')
      return
    }
    login(email, password)
  }

  // Handle Registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!fullName || !email || !phone || !password) {
      setAuthError('Please complete all required fields.')
      return
    }
    register(fullName, email, phone, password)
  }

  // Handle Instant Demo Sign-In
  const handleDemoSignIn = () => {
    login('amina.muthoni@gmail.com', 'demo1234')
  }

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      name: editName,
      phone: editPhone,
      defaultCounty: editCounty,
      defaultSubCounty: editSubCounty,
      defaultSchool: editSchool,
    })
    setIsEditingProfile(false)
    setSaveSuccessToast(true)
    setTimeout(() => setSaveSuccessToast(false), 3000)
  }

  // LOGGED-OUT AUTHENTICATION SCREEN
  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-zinc-950 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in">
          {/* Top Brand & Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Customer Account'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {authMode === 'login'
                ? 'Track your orders, save school addresses, and manage your delivery details.'
                : 'Sign up to easily send success cards to students across Kenya.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-xs font-bold">
            <button
              onClick={() => {
                setAuthMode('login')
                setAuthError('')
              }}
              className={`py-2 rounded-lg transition-all ${authMode === 'login'
                  ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('register')
                setAuthError('')
              }}
              className={`py-2 rounded-lg transition-all ${authMode === 'register'
                  ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amina@example.com"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs pl-9 pr-10 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-0.5 rounded-lg focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                Sign In to My Account <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Amina Muthoni"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amina@example.com"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">M-Pesa / Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs pl-9 pr-10 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-0.5 rounded-lg focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                Create Account <UserCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Sign-in Shortcut */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <button
              onClick={handleDemoSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-pink-500" /> Instant Demo Customer Sign-In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LOGGED-IN CUSTOMER DASHBOARD
  const initials = user.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
    : 'CU'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-slide-up">
      {/* Save Profile Success Toast */}
      {saveSuccessToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-3 shadow-2xl animate-scale-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Account details & saved delivery preferences updated!</span>
        </div>
      )}

      {/* Header Profile Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xl font-extrabold flex items-center justify-center shadow-lg shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-extrabold uppercase tracking-widest text-amber-200">
                VERIFIED CUSTOMER
              </span>
              <span className="text-xs text-white/80">Member since {user.memberSince || '2026'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hello, {user.name}!</h1>
            <p className="text-xs text-white/80 flex items-center gap-3 mt-1">
              <span>{user.email}</span>
              <span>•</span>
              <span>{user.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 self-end md:self-auto">
          <Link
            href="/catalog"
            className="px-5 py-2.5 rounded-xl bg-white text-pink-700 hover:bg-pink-50 font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            Order New Card <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/50 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Total Cards Ordered</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{orders.length}</p>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {orders.filter((o) => o.status === 'Delivered').length} Delivered Successfully
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-200 dark:border-pink-800">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Default Delivery School</span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[180px]">
              {user.defaultSchool || 'Kenya High School'}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-pink-500" /> {user.defaultCounty || 'Nairobi'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <School className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Loyalty Status</span>
            <p className="text-lg font-black text-amber-500 flex items-center gap-1">
              <Award className="w-5 h-5 text-amber-500" /> Gold Member
            </p>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
              Free Express School Delivery
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabbed Content Area */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${activeTab === 'orders'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-500'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Package className="w-4 h-4" /> Order History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${activeTab === 'addresses'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-500'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <MapPin className="w-4 h-4" /> Saved School Addresses
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 transition-colors relative flex items-center gap-2 ${activeTab === 'profile'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-500'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <User className="w-4 h-4" /> Profile & Details
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY & REAL-TIME TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Orders</h2>
              <Link href="/catalog" className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1">
                Order Another Success Card &rarr;
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-zinc-500 space-y-3">
                <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700" />
                <p className="text-sm font-semibold">You haven't placed any orders yet.</p>
                <Link
                  href="/catalog"
                  className="inline-block px-5 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-md"
                >
                  Browse Success Cards
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-pink-500/40"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">{ord.orderNumber}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${ord.status === 'Delivered'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : ord.status === 'Out for Delivery'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-800'
                            }`}
                        >
                          {ord.status}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">Ordered: {ord.date}</span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                        Card Design: {ord.designName}
                      </h3>

                      <div className="text-xs text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Recipient: <strong>{ord.recipientName}</strong></span>
                        <span>School: <strong>{ord.schoolName}</strong></span>
                        <span>Area: <strong>{ord.subCountyName}, {ord.countyName}</strong></span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-base font-extrabold text-pink-600 dark:text-pink-400">
                        KSh {ord.amountKes.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReviewingOrder(ord)}
                          className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Star className="w-3 h-3 fill-pink-500 text-pink-500" /> Review
                        </button>
                        <Link
                          href={`/order/${ord.orderNumber}`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-pink-600 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          Track <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED SCHOOL ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Saved Delivery Addresses</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Save default schools and Kenya counties for 1-click checkout pre-filling.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Default County</label>
                  <input
                    type="text"
                    value={editCounty}
                    onChange={(e) => setEditCounty(e.target.value)}
                    placeholder="e.g. Kiambu County"
                    className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Default Sub-County / Area</label>
                  <input
                    type="text"
                    value={editSubCounty}
                    onChange={(e) => setEditSubCounty(e.target.value)}
                    placeholder="e.g. Westlands Sub-County"
                    className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Primary Delivery School</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    placeholder="e.g. Kenya High School"
                    className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Save className="w-4 h-4" /> Save Address Preferences
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PROFILE & DETAILS */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Account Information</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Manage contact details and M-Pesa phone number.</p>
              </div>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-pink-500" /> Edit Profile
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Phone / M-Pesa Number</label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Full Name</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{user.name}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Email Address</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{user.email}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Phone / M-Pesa</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{user.phone}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Account Type</span>
                  <p className="text-sm font-extrabold text-pink-600 dark:text-pink-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Customer Account
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {reviewingOrder && (
        <ReviewModal
          isOpen={!!reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          initialOrderNumber={reviewingOrder.orderNumber}
          initialSchoolName={reviewingOrder.schoolName}
          initialCardType={reviewingOrder.designName}
          initialCustomerName={user.name}
          initialPhone={user.phone}
        />
      )}
    </div>
  )
}
