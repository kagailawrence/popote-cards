'use client'

import Link from 'next/link'
import { useCartStore } from '../store/useCartStore'
import { useCustomerAuthStore } from '../store/useCustomerAuthStore'
import { ThemeToggle } from './ThemeToggle'
import { ShoppingBag, ChevronDown, Layers, Menu, X, Tag, User, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCookie } from '../lib/cookies'

interface Category {
  id: string
  type: string
  name: string
}

export function Navbar() {
  const items = useCartStore((state) => state.items)
  const user = useCustomerAuthStore((state) => state.user)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    const adminToken =
      getCookie('popote_admin_token') ||
      getCookie('fair_admin_token') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('popote_admin_token') || localStorage.getItem('fair_admin_token')
        : null)
    setIsAdminLoggedIn(!!adminToken)

    async function fetchCategories() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/catalog/categories`
            : '/api/v1/catalog/categories'
        const res = await fetch(apiUrl)
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setCategories(data.data)
          }
        }
      } catch (err) {
        console.error('Failed to load menu categories', err)
      }
    }
    fetchCategories()
  }, [])

  const count = mounted ? items.length : 0

  const occasions = categories.filter((c) => c.type === 'occasion')
  const styles = categories.filter((c) => c.type === 'style')

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-transparent flex items-center justify-center h-25 hover:scale-105 transition-transform duration-200">
            <img src="/popote-logo.png" alt="Popote Card Delivery" loading="eager" decoding="async" className="h-30 w-auto object-contain" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-zinc-300">
          <Link href="/catalog" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-pink-500" /> All Card Designs
          </Link>

          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              onMouseEnter={() => setCategoriesDropdownOpen(true)}
              className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1 py-2 font-semibold text-slate-800 dark:text-zinc-200"
            >
              <Tag className="w-4 h-4 text-pink-500" />
              <span>Card Categories</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {categoriesDropdownOpen && (
              <div
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
                className="absolute top-full left-0 mt-1 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-xl dark:shadow-2xl space-y-3 z-50 animate-fade-in"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-pink-600 dark:text-pink-400 block mb-1.5">
                    Exams & Occasions
                  </span>
                  <div className="space-y-1">
                    {occasions.length > 0 ? (
                      occasions.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/catalog?occasion=${encodeURIComponent(cat.name)}`}
                          onClick={() => setCategoriesDropdownOpen(false)}
                          className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-white transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <>
                        <Link href="/catalog?occasion=KCSE%20Success" className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-white">KCSE Exam Success</Link>
                        <Link href="/catalog?occasion=Primary%20KCPE" className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-white">Primary KCPE / KPSEA</Link>
                        <Link href="/catalog?occasion=Graduation" className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-white">Graduation & University</Link>
                      </>
                    )}
                  </div>
                </div>

                {styles.length > 0 && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-zinc-400 block mb-1.5">
                      Design Styles
                    </span>
                    <div className="space-y-1">
                      {styles.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/catalog?style=${encodeURIComponent(cat.name)}`}
                          onClick={() => setCategoriesDropdownOpen(false)}
                          className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-white transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/catalog?occasion=KCSE%20Success" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/40">
            KCSE Success Cards
          </Link>
        </nav>

        {/* Right Section: Login / Account, Theme Toggle & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle variant="icon" />
          </div>

          {/* Universal Login / Account / Admin Button */}
          {isAdminLoggedIn ? (
            <Link
              href="/admin"
              aria-label="Admin Portal"
              className="p-2 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Admin Portal</span>
            </Link>
          ) : user ? (
            <Link
              href="/account"
              aria-label="User Account"
              className="p-2 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/50 text-slate-800 dark:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              <User className="w-4 h-4 text-pink-500" />
              <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Sign In"
              className="p-2 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/50 text-slate-800 dark:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              <User className="w-4 h-4 text-pink-500" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={`View cart with ${count} items`}
            className="relative p-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/50 text-slate-800 dark:text-zinc-200 transition-all flex items-center justify-center shadow-sm"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-4 py-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Appearance Theme</span>
            <ThemeToggle variant="icon" />
          </div>

          {isAdminLoggedIn ? (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-indigo-500" />
              Admin Portal
            </Link>
          ) : user ? (
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <User className="w-4 h-4 text-pink-500" />
              Account ({user.name})
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <User className="w-4 h-4 text-pink-500" />
              Sign In / Register
            </Link>
          )}

          <Link
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-pink-500" /> All Card Catalog
          </Link>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-pink-600 dark:text-pink-400 block">
              Card Categories
            </span>
            {occasions.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?occasion=${encodeURIComponent(cat.name)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-2"
              >
                <Tag className="w-3.5 h-3.5 text-pink-500" /> {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
