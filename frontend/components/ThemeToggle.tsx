'use client'

import { useTheme, Theme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle({ variant = 'icon' }: { variant?: 'segmented' | 'dropdown' | 'icon' }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    setAnimating(true)
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setTimeout(() => setAnimating(false), 300)
  }

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    )
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      aria-label={`Toggle theme. Current: ${theme}`}
      title={`Theme: ${theme} (Click to toggle)`}
      className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm shrink-0"
    >
      {resolvedTheme === 'dark' ? (
        <Moon className={`w-4 h-4 text-pink-400 transition-transform duration-300 ${animating ? 'rotate-[360deg] scale-110' : ''}`} />
      ) : (
        <Sun className={`w-4 h-4 text-amber-500 transition-transform duration-300 ${animating ? 'rotate-[180deg] scale-110' : ''}`} />
      )}
    </button>
  )
}
