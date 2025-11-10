/**
 * Dark mode utilities for STX components
 */

export interface DarkModeOptions {
  storageKey?: string
  defaultTheme?: 'light' | 'dark' | 'system'
}

export interface DarkModeResult {
  isDark: boolean
  theme: 'light' | 'dark' | 'system'
  toggle: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

/**
 * Check if system prefers dark mode
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get the effective theme (resolving 'system' to actual theme)
 */
export function getEffectiveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

/**
 * Use dark mode hook
 */
export function useDarkMode(options: DarkModeOptions = {}): DarkModeResult {
  const { storageKey = 'theme', defaultTheme = 'system' } = options

  // Get initial theme from storage or use default
  let theme: 'light' | 'dark' | 'system' = defaultTheme

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(storageKey) as 'light' | 'dark' | 'system' | null
    if (stored) theme = stored
  }

  const isDark = getEffectiveTheme(theme) === 'dark'

  // Apply theme to document
  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const effective = getEffectiveTheme(newTheme)

    if (typeof document !== 'undefined') {
      if (effective === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, newTheme)
    }
  }

  // Set theme
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme = newTheme
    applyTheme(newTheme)
  }

  // Toggle between light and dark
  const toggle = () => {
    const currentEffective = getEffectiveTheme(theme)
    const newTheme = currentEffective === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Apply initial theme
  applyTheme(theme)

  // Listen for system theme changes if using system theme
  if (typeof window !== 'undefined' && theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme === 'system') {
        applyTheme('system')
      }
    })
  }

  return {
    isDark,
    theme,
    toggle,
    setTheme,
  }
}
