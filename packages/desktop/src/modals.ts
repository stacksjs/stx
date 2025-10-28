import type { ModalOptions, ModalResult } from './types'

/**
 * Show a modal dialog
 */
export async function showModal(options: ModalOptions): Promise<ModalResult> {
  console.warn('Modal dialogs not yet implemented')
  console.warn('Options:', options)

  // TODO: Implement modal dialogs using Zyte's native APIs
  // This would require creating a modal window with the specified options

  // For now, return a default result
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
  return showModal({ title, message, type: 'question' })
}
