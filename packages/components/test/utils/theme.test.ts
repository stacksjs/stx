import { describe, expect, it } from 'bun:test'
import {
  type Theme,
  applyTheme,
  createTheme,
  defaultTheme,
  generateThemeCSS,
  getTheme,
  getThemeValue,
  themePresets,
  themeToCSSProperties,
  useTheme,
} from '../../src/utils/theme'

describe('Theme System', () => {
  describe('defaultTheme', () => {
    it('should have all required properties', () => {
      expect(defaultTheme.colors).toBeDefined()
      expect(defaultTheme.typography).toBeDefined()
      expect(defaultTheme.spacing).toBeDefined()
      expect(defaultTheme.borderRadius).toBeDefined()
      expect(defaultTheme.shadows).toBeDefined()
    })

    it('should have correct color palette', () => {
      expect(defaultTheme.colors.primary).toBe('#3b82f6')
      expect(defaultTheme.colors.secondary).toBe('#8b5cf6')
      expect(defaultTheme.colors.success).toBe('#10b981')
      expect(defaultTheme.colors.danger).toBe('#ef4444')
    })

    it('should have typography settings', () => {
      expect(defaultTheme.typography.fontFamily?.sans).toBeDefined()
      expect(defaultTheme.typography.fontSize?.base).toBe('1rem')
      expect(defaultTheme.typography.fontWeight?.normal).toBe('400')
    })

    it('should have spacing scale', () => {
      expect(defaultTheme.spacing.xs).toBe('0.25rem')
      expect(defaultTheme.spacing.sm).toBe('0.5rem')
      expect(defaultTheme.spacing.md).toBe('1rem')
      expect(defaultTheme.spacing.lg).toBe('1.5rem')
    })
  })

  describe('createTheme', () => {
    it('should merge with default theme', () => {
      const custom: Partial<Theme> = {
        colors: {
          primary: '#ff0000',
        },
      }
      const theme = createTheme(custom)

      expect(theme.colors.primary).toBe('#ff0000')
      expect(theme.colors.secondary).toBe(defaultTheme.colors.secondary)
      expect(theme.typography).toEqual(defaultTheme.typography)
    })

    it('should deep merge nested properties', () => {
      const custom: Partial<Theme> = {
        typography: {
          fontFamily: {
            sans: 'Inter, sans-serif',
          },
        },
      }
      const theme = createTheme(custom)

      expect(theme.typography.fontFamily?.sans).toBe('Inter, sans-serif')
      expect(theme.typography.fontFamily?.mono).toBe(defaultTheme.typography.fontFamily?.mono)
      expect(theme.typography.fontSize).toEqual(defaultTheme.typography.fontSize)
    })

    it('should handle component overrides', () => {
      const custom: Partial<Theme> = {
        components: {
          button: {
            borderRadius: '1rem',
          },
        },
      }
      const theme = createTheme(custom)

      expect(theme.components?.button?.borderRadius).toBe('1rem')
    })
  })

  describe('getTheme and useTheme', () => {
    it('should return current theme', () => {
      const theme = getTheme()
      expect(theme).toBeDefined()
      expect(theme.colors).toBeDefined()
    })

    it('useTheme should match getTheme', () => {
      expect(useTheme()).toEqual(getTheme())
    })
  })

  describe('getThemeValue', () => {
    it('should get nested values by path', () => {
      expect(getThemeValue('colors.primary')).toBeDefined()
      expect(getThemeValue('typography.fontSize.base')).toBe('1rem')
    })

    it('should return undefined for invalid paths', () => {
      expect(getThemeValue('invalid.path')).toBeUndefined()
    })

    it('should handle deep nesting', () => {
      const value = getThemeValue('typography.fontFamily.sans')
      expect(value).toBeDefined()
      expect(typeof value).toBe('string')
    })
  })

  describe('themeToCSSProperties', () => {
    it('should generate CSS custom properties', () => {
      const css = themeToCSSProperties(defaultTheme)

      expect(css).toContain(':root')
      expect(css).toContain('--color-primary')
      expect(css).toContain('--font-sans')
      expect(css).toContain('--text-base')
      expect(css).toContain('--spacing-md')
      expect(css).toContain('--radius-md')
      expect(css).toContain('--shadow-md')
    })

    it('should include component variables', () => {
      const css = themeToCSSProperties(defaultTheme)

      expect(css).toContain('--button-border-radius')
      expect(css).toContain('--input-padding')
      expect(css).toContain('--card-shadow')
    })

    it('should format camelCase to kebab-case', () => {
      const custom = createTheme({
        components: {
          button: {
            borderRadius: '0.5rem',
          },
        },
      })
      const css = themeToCSSProperties(custom)

      expect(css).toContain('--button-border-radius')
    })
  })

  describe('generateThemeCSS', () => {
    it('should generate valid CSS', () => {
      const css = generateThemeCSS(defaultTheme)

      expect(css).toContain(':root')
      expect(css.startsWith(':root')).toBe(true)
      expect(css).toContain(';')
    })
  })

  describe('themePresets', () => {
    it('should have default preset', () => {
      expect(themePresets.default).toEqual(defaultTheme)
    })

    it('should have purple preset', () => {
      expect(themePresets.purple.colors.primary).toBe('#8b5cf6')
    })

    it('should have green preset', () => {
      expect(themePresets.green.colors.primary).toBe('#10b981')
    })

    it('should have orange preset', () => {
      expect(themePresets.orange.colors.primary).toBe('#f97316')
    })

    it('should have dark preset', () => {
      expect(themePresets.dark.colors.primary).toBe('#60a5fa')
    })

    it('should have minimal preset with reduced shadows', () => {
      expect(themePresets.minimal.shadows.sm).toBe('none')
      expect(themePresets.minimal.borderRadius.sm).toBe('0')
    })

    it('all presets should have complete theme structure', () => {
      Object.values(themePresets).forEach((preset) => {
        expect(preset.colors).toBeDefined()
        expect(preset.typography).toBeDefined()
        expect(preset.spacing).toBeDefined()
        expect(preset.borderRadius).toBeDefined()
        expect(preset.shadows).toBeDefined()
      })
    })
  })

  describe('Complex Theme Scenarios', () => {
    it('should handle complete custom theme', () => {
      const custom: Partial<Theme> = {
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
        },
        typography: {
          fontFamily: {
            sans: 'Montserrat, sans-serif',
          },
          fontSize: {
            base: '1.125rem',
          },
        },
        spacing: {
          md: '1.25rem',
        },
      }

      const theme = createTheme(custom)

      expect(theme.colors.primary).toBe('#ff6b6b')
      expect(theme.typography.fontFamily?.sans).toBe('Montserrat, sans-serif')
      expect(theme.typography.fontSize?.base).toBe('1.125rem')
      expect(theme.spacing.md).toBe('1.25rem')
      expect(theme.colors.success).toBe(defaultTheme.colors.success)
    })

    it('should preserve all default values when partially overriding', () => {
      const custom = createTheme({
        colors: { primary: '#000000' },
      })

      const defaultKeys = Object.keys(defaultTheme)
      defaultKeys.forEach((key) => {
        expect(custom[key as keyof Theme]).toBeDefined()
      })
    })
  })
})
