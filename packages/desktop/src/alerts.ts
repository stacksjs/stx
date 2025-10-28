import type { AlertOptions, ToastOptions } from './types'

/**
 * Show an alert/notification
 */
export async function showAlert(options: AlertOptions): Promise<void> {
  console.warn('Alerts not yet implemented')
  console.warn('Options:', options)

  // TODO: Implement alerts using Zyte's native notification APIs
  // This would use platform-specific notifications:
  // - macOS: NSUserNotification
  // - Linux: libnotify
  // - Windows: Windows Notifications
}

/**
 * Show a toast notification
 */
export async function showToast(options: ToastOptions): Promise<void> {
  return showAlert(options)
}

/**
 * Show an info toast
 */
export async function showInfoToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'info', duration })
}

/**
 * Show a success toast
 */
export async function showSuccessToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'success', duration })
}

/**
 * Show a warning toast
 */
export async function showWarningToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'warning', duration })
}

/**
 * Show an error toast
 */
export async function showErrorToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'error', duration })
}
