'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  User, Lock, Mail, Phone, ArrowRight, Sparkles, ShieldCheck,
  Eye, EyeOff, CheckCircle2, Shield, HeartHandshake, LogIn
} from 'lucide-react'
import { useCustomerAuthStore } from '../../store/useCustomerAuthStore'
import { getCookie, setCookie } from '../../lib/cookies'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const { user, login: customerLogin, register: customerRegister } = useCustomerAuthStore()

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Registration specific fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    setMounted(true)
    const adminToken =
      getCookie('popote_admin_token') ||
      getCookie('fair_admin_token') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('popote_admin_token') || localStorage.getItem('fair_admin_token')
        : null)

    if (adminToken) {
      router.replace(redirectUrl || '/admin')
      return
    }

    if (user) {
      router.replace(redirectUrl || '/account')
    }
  }, [user, router, redirectUrl])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    setLoading(true)

    try {
      // 1. First attempt admin/staff authentication via backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`
        : '/api/v1/auth/login'

      let isAdminAuthSuccess = false
      let adminData: any = null

      try {
        const adminRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        })

        if (adminRes.ok) {
          const resJson = await adminRes.json()
          if (resJson.data?.accessToken) {
            isAdminAuthSuccess = true
            adminData = resJson.data
          }
        }
      } catch (adminErr) {
        // Backend or network error, fallback to customer auth check
        console.warn('Admin check skipped due to network/endpoint status', adminErr)
      }

      if (isAdminAuthSuccess && adminData) {
        const token = adminData.accessToken
        setCookie('popote_admin_token', token, 7)
        if (typeof window !== 'undefined') {
          localStorage.setItem('popote_admin_token', token)
        }
        toast.success(`Welcome back, Administrator (${adminData.user?.email || 'Admin'})!`)
        router.push(redirectUrl || '/admin')
        return
      }

      // 2. If not admin, authenticate as customer
      const customerSuccess = customerLogin(email.trim(), password)
      if (customerSuccess) {
        toast.success('Signed in successfully!')
        router.push(redirectUrl || '/account')
        return
      }

      setErrorMessage('Invalid email or password. Please verify your credentials.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage('Please fill in all required registration fields.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      const success = customerRegister(fullName.trim(), email.trim(), phone.trim(), password)
      if (success) {
        toast.success('Account created successfully! Welcome to Popote Cards.')
        router.push(redirectUrl || '/account')
      } else {
        setErrorMessage('Failed to create account. Please try again.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  // Quick Demo Logins
  const handleDemoCustomerLogin = () => {
    setEmail('amina.muthoni@gmail.com')
    setPassword('demo1234')
    customerLogin('amina.muthoni@gmail.com', 'demo1234')
    toast.success('Signed in as Demo Customer (Amina Muthoni)!')
    router.push(redirectUrl || '/account')
  }

  const handleDemoAdminLogin = () => {
    setEmail('admin@popotecards.co.ke')
    setPassword('Admin123!')
  }

  if (!mounted) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50/70 dark:bg-zinc-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 mb-1 border border-pink-100 dark:border-pink-900/40 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {authMode === 'login' ? 'Welcome to Popote Cards' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            {authMode === 'login'
              ? 'One unified sign-in for customer orders, tracking, and staff portal access.'
              : 'Join to order personalized success cards and track high school deliveries across Kenya.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login')
              setErrorMessage(null)
            }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'login'
                ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register')
              setErrorMessage(null)
            }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'register'
                ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'login' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-pink-500" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.co.ke"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-pink-500" />
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-pink-500" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Amina Muthoni"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-pink-500" />
                Kenyan Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-pink-500" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.co.ke"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-pink-500" />
                Create Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm shadow-md shadow-pink-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Shortcuts */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block text-center">
            Instant Demo Shortcuts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoCustomerLogin}
              className="px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-[11px] font-semibold text-slate-700 dark:text-zinc-300 transition-all text-left flex items-center gap-1.5"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <div className="truncate">
                <span className="block font-bold">Demo Customer</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Amina Muthoni</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDemoAdminLogin}
              className="px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-[11px] font-semibold text-slate-700 dark:text-zinc-300 transition-all text-left flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <div className="truncate">
                <span className="block font-bold">Demo Admin</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Staff / Dispatch</span>
              </div>
            </button>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit Encrypted Secure Sessions</span>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
