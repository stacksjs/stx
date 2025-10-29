import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import {
  showErrorModal,
  showInfoModal,
  showModal,
  showQuestionModal,
  showSuccessModal,
  showWarningModal,
} from '../src/modals'

describe('Modals', () => {
  let consoleSpy: any

  afterEach(() => {
    if (consoleSpy) {
      consoleSpy.mockRestore()
      consoleSpy = undefined
    }
  })

  describe('showModal', () => {
    it('should warn that feature is not yet implemented', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({ message: 'Test message' })

      expect(consoleSpy).toHaveBeenCalledWith('Modal dialogs not yet implemented')
    })

    it('should return a ModalResult', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showModal({ message: 'Test message' })

      expect(result).toBeDefined()
      expect(result.buttonIndex).toBe(0)
      expect(result.cancelled).toBe(true)
    })

    it('should accept title option', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({
        title: 'Test Title',
        message: 'Test message',
      })

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.title).toBe('Test Title')
      expect(optionsArg.message).toBe('Test message')
    })

    it('should accept message option', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({ message: 'Custom message' })

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.message).toBe('Custom message')
    })

    it('should accept type option', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showModal({
        message: 'Test',
        type: 'warning',
      })

      expect(result).toBeDefined()
    })

    it('should accept buttons option', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({
        message: 'Test',
        buttons: [
          { label: 'OK', action: () => {} },
          { label: 'Cancel', action: () => {} },
        ],
      })
    })

    it('should accept defaultButton option', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({
        message: 'Test',
        defaultButton: 0,
      })
    })

    it('should accept cancelButton option', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({
        message: 'Test',
        cancelButton: 1,
      })
    })

    it('should handle all modal types', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

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
    it('should call showModal with info type', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showInfoModal('Info Title', 'Info message')

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.type).toBe('info')
      expect(optionsArg.title).toBe('Info Title')
      expect(optionsArg.message).toBe('Info message')
    })

    it('should return ModalResult', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showInfoModal('Title', 'Message')

      expect(result.cancelled).toBe(true)
      expect(result.buttonIndex).toBe(0)
    })
  })

  describe('showWarningModal', () => {
    it('should call showModal with warning type', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showWarningModal('Warning Title', 'Warning message')

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.type).toBe('warning')
      expect(optionsArg.title).toBe('Warning Title')
      expect(optionsArg.message).toBe('Warning message')
    })

    it('should return ModalResult', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showWarningModal('Title', 'Message')

      expect(result.cancelled).toBe(true)
    })
  })

  describe('showErrorModal', () => {
    it('should call showModal with error type', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showErrorModal('Error Title', 'Error message')

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.type).toBe('error')
      expect(optionsArg.title).toBe('Error Title')
      expect(optionsArg.message).toBe('Error message')
    })

    it('should return ModalResult', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showErrorModal('Title', 'Message')

      expect(result.cancelled).toBe(true)
    })
  })

  describe('showSuccessModal', () => {
    it('should call showModal with success type', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showSuccessModal('Success Title', 'Success message')

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.type).toBe('success')
      expect(optionsArg.title).toBe('Success Title')
      expect(optionsArg.message).toBe('Success message')
    })

    it('should return ModalResult', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showSuccessModal('Title', 'Message')

      expect(result.cancelled).toBe(true)
    })
  })

  describe('showQuestionModal', () => {
    it('should call showModal with question type', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showQuestionModal('Question Title', 'Question message')

      const optionsArg = consoleSpy.mock.calls[1][1]
      expect(optionsArg.type).toBe('question')
      expect(optionsArg.title).toBe('Question Title')
      expect(optionsArg.message).toBe('Question message')
    })

    it('should return ModalResult', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const result = await showQuestionModal('Title', 'Message')

      expect(result.cancelled).toBe(true)
    })
  })

  describe('Complex modal configurations', () => {
    it('should handle multiple buttons with different styles', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({
        title: 'Confirm',
        message: 'Are you sure?',
        buttons: [
          { label: 'Cancel', style: 'default' },
          { label: 'Delete', style: 'destructive' },
          { label: 'Save', style: 'primary' },
        ],
      })
    })

    it('should handle buttons with actions', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      let actionCalled = false

      await showModal({
        message: 'Test',
        buttons: [
          {
            label: 'Action',
            action: () => {
              actionCalled = true
            },
          },
        ],
      })

      // Note: actions won't be called in placeholder implementation
      expect(actionCalled).toBe(false)
    })

    it('should handle modal with default and cancel buttons', async () => {
      consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

      await showModal({
        message: 'Test',
        buttons: [
          { label: 'Cancel' },
          { label: 'OK' },
        ],
        defaultButton: 1,
        cancelButton: 0,
      })
    })
  })
})
