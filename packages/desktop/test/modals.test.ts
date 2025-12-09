import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import {
  closeAllModals,
  getActiveModalCount,
  showErrorModal,
  showInfoModal,
  showModal,
  showQuestionModal,
  showSuccessModal,
  showWarningModal,
} from '../src/modals'

// Check if we're in a browser-like environment (Happy DOM)
const isBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined'

/**
 * Safely clean up modals - handles very-happy-dom quirks
 */
function cleanupModals(): void {
  if (!isBrowserEnv)
    return
  try {
    const modals = document.querySelectorAll('.stx-modal-overlay')
    if (modals && modals.length > 0) {
      Array.from(modals).forEach((el) => {
        try {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el)
          }
        }
        catch {
          // Ignore errors during cleanup
        }
      })
    }
  }
  catch {
    // Ignore querySelectorAll errors in very-happy-dom
  }
}

describe('Modals', () => {
  let consoleSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {})
    // Clean up any existing modals from previous tests
    cleanupModals()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    closeAllModals()
    // Clean up any modals
    cleanupModals()
  })

  describe('showModal', () => {
    it('should show modal', async () => {
      const result = await showModal({ message: 'Test message' })

      expect(result).toBeDefined()
      expect(typeof result.buttonIndex).toBe('number')
    })

    it('should return a ModalResult', async () => {
      const result = await showModal({ message: 'Test message' })

      expect(result).toBeDefined()
      expect(typeof result.buttonIndex).toBe('number')
      expect(typeof result.cancelled).toBe('boolean')
    })

    it('should accept title option', async () => {
      const result = await showModal({
        title: 'Test Title',
        message: 'Test message',
      })

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('Test Title'))).toBe(true)
      }
    })

    it('should accept message option', async () => {
      const result = await showModal({ message: 'Custom message' })

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('Custom message'))).toBe(true)
      }
    })

    it('should accept type option', async () => {
      const result = await showModal({
        message: 'Test',
        type: 'warning',
      })

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('WARNING'))).toBe(true)
      }
    })

    it('should accept buttons option', async () => {
      const result = await showModal({
        message: 'Test',
        buttons: [
          { label: 'OK', action: () => {} },
          { label: 'Cancel', action: () => {} },
        ],
      })

      expect(result).toBeDefined()
    })

    it('should accept defaultButton option', async () => {
      const result = await showModal({
        message: 'Test',
        defaultButton: 0,
      })

      expect(result.buttonIndex).toBe(0)
    })

    it('should accept cancelButton option', async () => {
      const result = await showModal({
        message: 'Test',
        cancelButton: 1,
      })

      expect(result).toBeDefined()
    })

    it('should handle all modal types', async () => {
      const types: Array<'info' | 'warning' | 'error' | 'success' | 'question'> = [
        'info',
        'warning',
        'error',
        'success',
        'question',
      ]

      for (const type of types) {
        const result = await showModal({ message: 'Test', type })
        expect(result).toBeDefined()
      }
    })
  })

  describe('showInfoModal', () => {
    it('should show modal with info type', async () => {
      const result = await showInfoModal('Info Title', 'Info message')

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('INFO'))).toBe(true)
      }
    })

    it('should return ModalResult', async () => {
      const result = await showInfoModal('Title', 'Message')

      expect(result).toBeDefined()
      expect(typeof result.buttonIndex).toBe('number')
    })
  })

  describe('showWarningModal', () => {
    it('should show modal with warning type', async () => {
      const result = await showWarningModal('Warning Title', 'Warning message')

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('WARNING'))).toBe(true)
      }
    })

    it('should return ModalResult', async () => {
      const result = await showWarningModal('Title', 'Message')

      expect(result).toBeDefined()
    })
  })

  describe('showErrorModal', () => {
    it('should show modal with error type', async () => {
      const result = await showErrorModal('Error Title', 'Error message')

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('ERROR'))).toBe(true)
      }
    })

    it('should return ModalResult', async () => {
      const result = await showErrorModal('Title', 'Message')

      expect(result).toBeDefined()
    })
  })

  describe('showSuccessModal', () => {
    it('should show modal with success type', async () => {
      const result = await showSuccessModal('Success Title', 'Success message')

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('SUCCESS'))).toBe(true)
      }
    })

    it('should return ModalResult', async () => {
      const result = await showSuccessModal('Title', 'Message')

      expect(result).toBeDefined()
    })
  })

  describe('showQuestionModal', () => {
    it('should show modal with question type', async () => {
      const result = await showQuestionModal('Question Title', 'Question message')

      expect(result).toBeDefined()
      if (!isBrowserEnv) {
        const calls = consoleSpy.mock.calls
        expect(calls.some((call: unknown[]) => (call[0] as string)?.includes('QUESTION'))).toBe(true)
      }
    })

    it('should return ModalResult', async () => {
      const result = await showQuestionModal('Title', 'Message')

      expect(result).toBeDefined()
    })
  })

  describe('Complex modal configurations', () => {
    it('should handle multiple buttons with different styles', async () => {
      const result = await showModal({
        title: 'Confirm',
        message: 'Are you sure?',
        buttons: [
          { label: 'Cancel', style: 'default' },
          { label: 'Delete', style: 'destructive' },
          { label: 'Save', style: 'primary' },
        ],
      })

      expect(result).toBeDefined()
    })

    it('should handle buttons with actions', async () => {
      let actionCalled = false

      const result = await showModal({
        message: 'Test',
        buttons: [
          {
            label: 'Action',
            action: () => {
              actionCalled = true
            },
          },
        ],
        defaultButton: 0,
      })

      // Action should be called when modal resolves with that button
      expect(actionCalled).toBe(true)
      expect(result.buttonIndex).toBe(0)
    })

    it('should handle modal with default and cancel buttons', async () => {
      const result = await showModal({
        message: 'Test',
        buttons: [
          { label: 'Cancel' },
          { label: 'OK' },
        ],
        defaultButton: 1,
        cancelButton: 0,
      })

      expect(result.buttonIndex).toBe(1)
    })
  })

  describe('Modal management', () => {
    it('should track active modal count', async () => {
      const modalPromise = showModal({ message: 'Test' })

      await modalPromise

      // After resolution, count should be 0
      expect(getActiveModalCount()).toBe(0)
    })

    it('should close all modals', async () => {
      await showModal({ message: 'Test 1' })
      await showModal({ message: 'Test 2' })

      closeAllModals()

      expect(getActiveModalCount()).toBe(0)
    })
  })
})
