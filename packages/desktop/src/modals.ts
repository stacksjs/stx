import type { ModalOptions, ModalResult } from './types'

/**
 * Show a native modal dialog
 * TODO: Implementation pending - requires webview integration
 */
export async function showModal(options: ModalOptions): Promise<ModalResult> {
  console.warn('Modal dialogs not yet implemented')
  console.warn('Modal options:', options)

  return {
    buttonIndex: 0,
    cancelled: true,
  }
}

/**
 * Show an info modal
 */
export async function showInfoModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'info' })
}

/**
 * Show a warning modal
 */
export async function showWarningModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'warning' })
}

/**
 * Show an error modal
 */
export async function showErrorModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'error' })
}

/**
 * Show a success modal
 */
export async function showSuccessModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'success' })
}

/**
 * Show a question modal
 */
export async function showQuestionModal(title: string, message: string): Promise<ModalResult> {
  return showModal({
    title,
    message,
    type: 'question',
    buttons: [
      { label: 'No', style: 'default' },
      { label: 'Yes', style: 'primary' },
    ],
    defaultButton: 1,
    cancelButton: 0,
  })
}
