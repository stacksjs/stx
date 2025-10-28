/**
 * @stacksjs/desktop
 *
 * Native desktop application wrapper for stx using Zyte framework
 *
 * This package provides a TypeScript API for creating native desktop applications
 * with the stx framework, powered by the Zyte webview framework.
 */

// Export all types
export type {
  AlertOptions,
  ComponentProps,
  ModalButton,
  ModalOptions,
  ModalResult,
  SystemTrayInstance,
  SystemTrayMenuItem,
  SystemTrayOptions,
  ToastOptions,
  WindowInstance,
  WindowOptions,
} from './types'

// Export window management
export {
  buildZyte,
  createWindow,
  createWindowWithHTML,
  isZyteBuilt,
  openDevWindow,
} from './window'

// Export system tray
export {
  createMenubar,
  createSystemTray,
} from './system-tray'

// Export modals
export {
  showErrorModal,
  showInfoModal,
  showModal,
  showQuestionModal,
  showSuccessModal,
  showWarningModal,
} from './modals'

// Export alerts/toasts
export {
  showAlert,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showToast,
  showWarningToast,
} from './alerts'

// Export components
export {
  AVAILABLE_COMPONENTS,
  createButton,
  createCheckbox,
  createTextInput,
} from './components'

export type { ComponentName } from './components'

// Re-export from types for convenience
export type { ButtonProps, CheckboxProps, TextInputProps } from './components'
