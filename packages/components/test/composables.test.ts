import { describe, expect, it } from 'bun:test'
import { useCopyCode, copyToClipboard } from '../src/composables/useCopyCode'
import { getSystemTheme, getEffectiveTheme } from '../src/composables/useDarkMode'

describe('Composables', () => {
  describe('useCopyCode', () => {
    it('should return copy function and state', () => {
      const result = useCopyCode({ code: 'test' })

      expect(result).toHaveProperty('copied')
      expect(result).toHaveProperty('copy')
      expect(result).toHaveProperty('reset')
      expect(typeof result.copy).toBe('function')
      expect(typeof result.reset).toBe('function')
    })

    it('should start with copied as false', () => {
      const { copied } = useCopyCode({ code: 'test' })
      expect(copied).toBe(false)
    })
  })

  describe('useDarkMode', () => {
    it('should get system theme', () => {
      const theme = getSystemTheme()
      expect(['light', 'dark']).toContain(theme)
    })

    it('should resolve effective theme', () => {
      expect(getEffectiveTheme('light')).toBe('light')
      expect(getEffectiveTheme('dark')).toBe('dark')
      expect(['light', 'dark']).toContain(getEffectiveTheme('system'))
    })

    it('should resolve system theme to actual theme', () => {
      const effective = getEffectiveTheme('system')
      expect(['light', 'dark']).toContain(effective)
    })
  })
})
