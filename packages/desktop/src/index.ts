/**
 * @stacksjs/desktop
 *
 * Native desktop application framework for stx
 *
 * This package provides a TypeScript API for creating native desktop applications
 * with the stx framework. Powered by Craft (~/Code/craft).
 */

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

// Export modals
export {
  showErrorModal,
  showInfoModal,
  showModal,
  showQuestionModal,
  showSuccessModal,
  showWarningModal,
} from './modals'

// Export system tray
export {
  createMenubar,
  createSystemTray,
} from './system-tray'

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
  createWindow,
  createWindowWithHTML,
  isWebviewAvailable,
  openDevWindow,
} from './window'
