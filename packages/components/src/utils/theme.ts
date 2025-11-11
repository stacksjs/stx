/**
 * Theme system for @stacksjs/components
 *
 * Provides customizable color palettes, typography, spacing, and component variants
 *
 * @example
 * ```ts
 * import { createTheme, applyTheme, useTheme } from '@stacksjs/components'
 *
 * const myTheme = createTheme({
 *   colors: {
 *     primary: '#3b82f6',
 *     secondary: '#8b5cf6'
 *   }
 * })
 *
 * applyTheme(myTheme)
 * ```
 */

/**
 * Color palette definition
 */
export interface ColorPalette {
  primary?: string
  secondary?: string
  success?: string
  warning?: string
  danger?: string
  info?: string
  gray?: string
  white?: string
  black?: string
}

/**
 * Typography scale
 */
export interface Typography {
  fontFamily?: {
    sans?: string
    serif?: string
    mono?: string
  }
  fontSize?: {
    xs?: string
    sm?: string
    base?: string
    lg?: string
    xl?: string
    '2xl'?: string
    '3xl'?: string
    '4xl'?: string
  }
  fontWeight?: {
    light?: string
    normal?: string
    medium?: string
    semibold?: string
    bold?: string
  }
  lineHeight?: {
    tight?: string
    normal?: string
    relaxed?: string
  }
}

/**
 * Spacing scale
 */
export interface Spacing {
  xs?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
  '3xl'?: string
  '4xl'?: string
}

/**
 * Border radius scale
 */
export interface BorderRadius {
  none?: string
  sm?: string
  md?: string
  lg?: string
  full?: string
}

/**
 * Shadow scale
 */
export interface Shadows {
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
  none?: string
}

/**
 * Component-specific overrides
 */
export interface ComponentOverrides {
  button?: {
    borderRadius?: string
    padding?: string
    fontSize?: string
    fontWeight?: string
  }
  input?: {
    borderRadius?: string
    padding?: string
    fontSize?: string
    borderWidth?: string
  }
  card?: {
    borderRadius?: string
    padding?: string
    shadow?: string
  }
}

/**
 * Complete theme configuration
 */
export interface Theme {
  colors: ColorPalette
  typography: Typography
  spacing: Spacing
  borderRadius: BorderRadius
  shadows: Shadows
  components?: ComponentOverrides
}

/**
 * Default theme
 */
export const defaultTheme: Theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    gray: '#6b7280',
    white: '#ffffff',
    black: '#000000',
  },
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    none: 'none',
  },
  components: {
    button: {
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    input: {
      borderRadius: '0.375rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      borderWidth: '1px',
    },
    card: {
      borderRadius: '0.5rem',
      padding: '1.5rem',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
  },
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target }

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key] as any, source[key] as any)
    }
    else {
      output[key] = source[key] as any
    }
  }

  return output
}

/**
 * Create a custom theme by merging with default theme
 *
 * @param customTheme - Partial theme configuration
 * @returns Complete theme object
 *
 * @example
 * ```ts
 * const myTheme = createTheme({
 *   colors: {
 *     primary: '#3b82f6',
 *     secondary: '#8b5cf6'
 *   },
 *   typography: {
 *     fontFamily: {
 *       sans: 'Inter, sans-serif'
 *     }
 *   }
 * })
 * ```
 */
export function createTheme(customTheme: Partial<Theme>): Theme {
  return deepMerge(defaultTheme, customTheme)
}

/**
 * Current active theme
 */
let currentTheme: Theme = defaultTheme

/**
 * Get the current active theme
 *
 * @returns Current theme object
 */
export function getTheme(): Theme {
  return currentTheme
}

/**
 * Convert theme to CSS custom properties
 *
 * @param theme - Theme object
 * @returns CSS custom properties string
 */
export function themeToCSSProperties(theme: Theme): string {
  const cssVars: string[] = []

  // Colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--color-${key}: ${value};`)
    })
  }

  // Typography
  if (theme.typography?.fontFamily) {
    Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--font-${key}: ${value};`)
    })
  }

  if (theme.typography?.fontSize) {
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--text-${key}: ${value};`)
    })
  }

  if (theme.typography?.fontWeight) {
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--font-weight-${key}: ${value};`)
    })
  }

  if (theme.typography?.lineHeight) {
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--leading-${key}: ${value};`)
    })
  }

  // Spacing
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--spacing-${key}: ${value};`)
    })
  }

  // Border radius
  if (theme.borderRadius) {
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--radius-${key}: ${value};`)
    })
  }

  // Shadows
  if (theme.shadows) {
    Object.entries(theme.shadows).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--shadow-${key}: ${value};`)
    })
  }

  // Component overrides
  if (theme.components?.button) {
    Object.entries(theme.components.button).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--button-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    })
  }

  if (theme.components?.input) {
    Object.entries(theme.components.input).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--input-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    })
  }

  if (theme.components?.card) {
    Object.entries(theme.components.card).forEach(([key, value]) => {
      if (value)
        cssVars.push(`--card-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    })
  }

  return `:root {\n  ${cssVars.join('\n  ')}\n}`
}

/**
 * Apply theme to the document
 *
 * @param theme - Theme object to apply
 * @param target - Target element (defaults to document.documentElement)
 *
 * @example
 * ```ts
 * const theme = createTheme({ colors: { primary: '#3b82f6' } })
 * applyTheme(theme)
 * ```
 */
export function applyTheme(theme: Theme, target?: HTMLElement): void {
  currentTheme = theme

  if (typeof document === 'undefined')
    return

  const element = target || document.documentElement

  // Colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--color-${key}`, value)
    })
  }

  // Typography
  if (theme.typography?.fontFamily) {
    Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--font-${key}`, value)
    })
  }

  if (theme.typography?.fontSize) {
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--text-${key}`, value)
    })
  }

  if (theme.typography?.fontWeight) {
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--font-weight-${key}`, value)
    })
  }

  if (theme.typography?.lineHeight) {
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--leading-${key}`, value)
    })
  }

  // Spacing
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--spacing-${key}`, value)
    })
  }

  // Border radius
  if (theme.borderRadius) {
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--radius-${key}`, value)
    })
  }

  // Shadows
  if (theme.shadows) {
    Object.entries(theme.shadows).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--shadow-${key}`, value)
    })
  }

  // Component overrides
  if (theme.components?.button) {
    Object.entries(theme.components.button).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--button-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
    })
  }

  if (theme.components?.input) {
    Object.entries(theme.components.input).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--input-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
    })
  }

  if (theme.components?.card) {
    Object.entries(theme.components.card).forEach(([key, value]) => {
      if (value)
        element.style.setProperty(`--card-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
    })
  }
}

/**
 * Hook to use theme in components
 *
 * @returns Current theme object
 *
 * @example
 * ```ts
 * const theme = useTheme()
 * const primaryColor = theme.colors.primary
 * ```
 */
export function useTheme(): Theme {
  return currentTheme
}

/**
 * Get a specific theme value by path
 *
 * @param path - Dot-notation path to theme value
 * @returns Theme value or undefined
 *
 * @example
 * ```ts
 * const primary = getThemeValue('colors.primary')
 * const fontSize = getThemeValue('typography.fontSize.base')
 * ```
 */
export function getThemeValue(path: string): any {
  const keys = path.split('.')
  let value: any = currentTheme

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    }
    else {
      return undefined
    }
  }

  return value
}

/**
 * Predefined theme presets
 */
export const themePresets = {
  /**
   * Default blue theme
   */
  default: defaultTheme,

  /**
   * Purple theme
   */
  purple: createTheme({
    colors: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
    },
  }),

  /**
   * Green theme
   */
  green: createTheme({
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
    },
  }),

  /**
   * Orange theme
   */
  orange: createTheme({
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
    },
  }),

  /**
   * Dark theme
   */
  dark: createTheme({
    colors: {
      primary: '#60a5fa',
      secondary: '#a78bfa',
      gray: '#9ca3af',
      white: '#1f2937',
      black: '#f9fafb',
    },
  }),

  /**
   * Minimal theme with reduced shadows and border radius
   */
  minimal: createTheme({
    borderRadius: {
      none: '0',
      sm: '0',
      md: '0.125rem',
      lg: '0.25rem',
      full: '0.25rem',
    },
    shadows: {
      sm: 'none',
      md: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      lg: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      xl: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '2xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      none: 'none',
    },
  }),
}

/**
 * Generate CSS file content for a theme
 *
 * @param theme - Theme object
 * @returns CSS file content
 *
 * @example
 * ```ts
 * const theme = createTheme({ colors: { primary: '#3b82f6' } })
 * const css = generateThemeCSS(theme)
 * // Write to file or inject into page
 * ```
 */
export function generateThemeCSS(theme: Theme): string {
  return themeToCSSProperties(theme)
}
