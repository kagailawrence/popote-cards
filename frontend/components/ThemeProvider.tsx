'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'popote_theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read saved theme from localStorage
    const savedTheme = (localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('fair_theme')) as Theme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = () => {
      let activeTheme: ResolvedTheme = 'dark'

      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        activeTheme = systemPrefersDark ? 'dark' : 'light'
      } else {
        activeTheme = theme
      }

      setResolvedTheme(activeTheme)

      if (activeTheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
        root.style.colorScheme = 'light'
      }
    }

    applyTheme()

    // Listen for OS theme changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
