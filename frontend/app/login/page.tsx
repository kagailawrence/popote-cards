'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '../../lib/cookies'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const adminToken = getCookie('fair_admin_token') || (typeof window !== 'undefined' ? localStorage.getItem('fair_admin_token') : null)
    if (adminToken) {
      router.replace('/admin')
    } else {
      router.replace('/account')
    }
  }, [router])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Redirecting to dashboard...</p>
    </div>
  )
}
