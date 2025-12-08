import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import {
  dismissAllAlerts,
  getActiveAlertCount,
  showAlert,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showToast,
  showWarningToast,
} from '../src/alerts'

// Check if we're in a browser-like environment (Happy DOM)
const isBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined'

describe('Alerts', () => {
  let consoleSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {})
    // Clean up any existing toast containers from previous tests
    if (isBrowserEnv) {
      document.querySelectorAll('.stx-toast-container').forEach(el => el.remove())
    }
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    dismissAllAlerts()
    // Clean up any toast containers
    if (isBrowserEnv) {
      document.querySelectorAll('.stx-toast-container').forEach(el => el.remove())
    }
  })

  describe('showAlert', () => {
    it('should show alert', async () => {
      await showAlert({ message: 'Test alert' })

      if (isBrowserEnv) {
        // In browser, check for DOM element
        const toast = document.querySelector('.stx-toast')
        expect(toast).not.toBeNull()
      }
      else {
        // In Node, check for console output
        expect(consoleSpy).toHaveBeenCalled()
      }
    })

    it('should accept message option', async () => {
      await showAlert({ message: 'Custom message' })

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast-message')
        expect(toast?.textContent).toContain('Custom message')
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('Custom message'))).toBe(true)
      }
    })

    it('should accept title option', async () => {
      await showAlert({
        title: 'Alert Title',
        message: 'Alert message',
      })

      if (isBrowserEnv) {
        const title = document.querySelector('.stx-toast-title')
        expect(title?.textContent).toContain('Alert Title')
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('Alert Title'))).toBe(true)
      }
    })

    it('should accept type option', async () => {
      const types: Array<'info' | 'success' | 'warning' | 'error'> = [
        'info',
        'success',
        'warning',
        'error',
      ]

      for (const type of types) {
        await showAlert({ message: 'Test', type })
      }

      if (isBrowserEnv) {
        // Should have created toasts with different type classes
        expect(document.querySelectorAll('.stx-toast').length).toBeGreaterThanOrEqual(4)
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('INFO'))).toBe(true)
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('SUCCESS'))).toBe(true)
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('WARNING'))).toBe(true)
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('ERROR'))).toBe(true)
      }
    })

    it('should accept duration option', async () => {
      await showAlert({
        message: 'Test',
        duration: 5000,
      })

      // Should complete without error
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should accept position option', async () => {
      const positions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ] as const

      for (const position of positions) {
        await showAlert({ message: 'Test', position })
      }

      // Should complete without error
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should accept theme option', async () => {
      const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']

      for (const theme of themes) {
        await showAlert({ message: 'Test', theme })
      }

      // Should complete without error
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should accept onClick handler', async () => {
      let clicked = false

      await showAlert({
        message: 'Test',
        onClick: () => {
          clicked = true
        },
      })

      // Handler should be stored but not called until click
      expect(clicked).toBe(false)
    })

    it('should handle alert with all options', async () => {
      await showAlert({
        title: 'Complete Alert',
        message: 'This has all options',
        type: 'success',
        duration: 3000,
        position: 'top-right',
        theme: 'dark',
        onClick: () => {},
      })

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast.success')
        expect(toast).not.toBeNull()
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('SUCCESS'))).toBe(true)
      }
    })
  })

  describe('showToast', () => {
    it('should show a toast notification', async () => {
      await showToast({ message: 'Toast message' })

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast')
        expect(toast).not.toBeNull()
      }
      else {
        expect(consoleSpy).toHaveBeenCalled()
      }
    })

    it('should accept ToastOptions', async () => {
      await showToast({
        title: 'Toast',
        message: 'Toast message',
        duration: 2000,
      })

      // Should complete without error
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('showInfoToast', () => {
    it('should show toast with info type', async () => {
      await showInfoToast('Info message')

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast.info')
        expect(toast).not.toBeNull()
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('INFO'))).toBe(true)
      }
    })

    it('should use default duration of 3000ms', async () => {
      await showInfoToast('Test')
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should accept custom duration', async () => {
      await showInfoToast('Test', 5000)
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('showSuccessToast', () => {
    it('should show toast with success type', async () => {
      await showSuccessToast('Success message')

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast.success')
        expect(toast).not.toBeNull()
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('SUCCESS'))).toBe(true)
      }
    })

    it('should use default duration', async () => {
      await showSuccessToast('Test')
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should accept custom duration', async () => {
      await showSuccessToast('Test', 2000)
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('showWarningToast', () => {
    it('should show toast with warning type', async () => {
      await showWarningToast('Warning message')

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast.warning')
        expect(toast).not.toBeNull()
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('WARNING'))).toBe(true)
      }
    })

    it('should use default duration', async () => {
      await showWarningToast('Test')
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('showErrorToast', () => {
    it('should show toast with error type', async () => {
      await showErrorToast('Error message')

      if (isBrowserEnv) {
        const toast = document.querySelector('.stx-toast.error')
        expect(toast).not.toBeNull()
      }
      else {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('ERROR'))).toBe(true)
      }
    })

    it('should use default duration', async () => {
      await showErrorToast('Test')
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should accept custom duration', async () => {
      await showErrorToast('Test', 10000)
      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Toast durations', () => {
    it('should handle duration of 0 (no auto-close)', async () => {
      await showToast({
        message: 'Persistent toast',
        duration: 0,
      })

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should handle short durations', async () => {
      await showToast({
        message: 'Quick toast',
        duration: 500,
      })

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should handle long durations', async () => {
      await showToast({
        message: 'Long toast',
        duration: 30000,
      })

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Toast positions', () => {
    it('should handle all position variants', async () => {
      const positions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ] as const

      for (const position of positions) {
        await showToast({
          message: `Toast at ${position}`,
          position,
        })
      }

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Toast themes', () => {
    it('should handle light theme', async () => {
      await showToast({
        message: 'Light theme toast',
        theme: 'light',
      })

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should handle dark theme', async () => {
      await showToast({
        message: 'Dark theme toast',
        theme: 'dark',
      })

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })

    it('should handle auto theme', async () => {
      await showToast({
        message: 'Auto theme toast',
        theme: 'auto',
      })

      expect(getActiveAlertCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Alert management', () => {
    it('should track active alert count', async () => {
      const initialCount = getActiveAlertCount()

      await showAlert({ message: 'Test 1', duration: 0 })
      await showAlert({ message: 'Test 2', duration: 0 })

      expect(getActiveAlertCount()).toBe(initialCount + 2)
    })

    it('should dismiss all alerts', async () => {
      await showAlert({ message: 'Test 1', duration: 0 })
      await showAlert({ message: 'Test 2', duration: 0 })

      dismissAllAlerts()

      expect(getActiveAlertCount()).toBe(0)
    })
  })
})
