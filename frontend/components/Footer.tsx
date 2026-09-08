import Link from 'next/link'
import { Heart, Lock, Truck, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 py-12 text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-transparent flex items-center justify-center h-32 hover:scale-105 transition-transform duration-200">
                <img src="/popote-logo.png" alt="Popote Card Delivery" loading="lazy" decoding="async" className="h-35 w-auto object-contain" />
              </div>
            </Link>
            <p className="text-slate-500 dark:text-zinc-500 leading-relaxed text-xs">
             At popote card delivery we deliver premium physical success & celebration cards printed locally and delivered with love across Kenya.
            </p>
            <div className="mt-4">
              <ThemeToggle variant="segmented" />
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/catalog" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Shop Collection</Link></li>
              <li><Link href="/order/track" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium">Track Orders</Link></li>
              <li><Link href="/reviews" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Customer Reviews & Stories</Link></li>
              <li><Link href="/cart" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">View Cart</Link></li>
              <li><Link href="/dispute" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Help & Disputes</Link></li>
              <li><Link href="/admin" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-3">Guarantees</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-zinc-500">
              <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-pink-500" /> M-Pesa Encrypted Checkout</li>
              <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-pink-500" /> Doorstep & School Delivery</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-pink-500" /> Proof of Delivery</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-3">Support</h4>
            <p className="text-slate-500 dark:text-zinc-500 text-xs">Need assistance? Track your order progress in real-time or raise a dispute directly on our platform.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link href="/order/track" className="inline-block px-3.5 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/80 text-pink-700 dark:text-pink-300 hover:bg-pink-100 text-xs font-semibold shadow-sm transition-all">
                Track Order
              </Link>
              <Link href="/dispute" className="inline-block px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-pink-500 text-xs font-semibold shadow-sm transition-all">
                Dispute Order
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-zinc-600 gap-4">
          <p>© {new Date().getFullYear()} Popote Card Delivery Kenya. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> in Kenya
          </p>
        </div>
      </div>
    </footer>
  )
}
