import { createContext, useContext, useEffect, useState } from 'react'
import { getSetting, setSetting } from '../db/database'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system') // 'light', 'dark', 'system'
  const [resolvedTheme, setResolvedTheme] = useState('dark') // actual theme applied

  // Load theme from Dexie on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await getSetting('theme')
      if (savedTheme) {
        setThemeState(savedTheme)
      } else {
        // Default to dark mode for new users (2026 trend)
        setThemeState('dark')
        await setSetting('theme', 'dark')
      }
    }
    loadTheme()
  }, [])

  // Handle system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Resolve actual theme when theme setting changes
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setResolvedTheme(isDark ? 'dark' : 'light')
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement

    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  const setTheme = async (newTheme) => {
    setThemeState(newTheme)
    await setSetting('theme', newTheme)

    // Also save to localStorage for faster initial load
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
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

export default ThemeContext
