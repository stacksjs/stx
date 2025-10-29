/**
 * Desktop Application Types
 */

/**
 * Window configuration options
 */
export interface WindowOptions {
  /** Window title */
  title?: string
  /** Window width in pixels */
  width?: number
  /** Window height in pixels */
  height?: number
  /** Enable dark mode */
  darkMode?: boolean
  /** Enable hot reload for development */
  hotReload?: boolean
  /** Window is resizable */
  resizable?: boolean
  /** Window can be minimized */
  minimizable?: boolean
  /** Window can be maximized */
  maximizable?: boolean
  /** Window has close button */
  closable?: boolean
  /** Window always on top */
  alwaysOnTop?: boolean
  /** Window is frameless (no title bar) */
  frameless?: boolean
  /** Window background color */
  backgroundColor?: string
}

/**
 * System tray/menubar configuration options
 */
export interface SystemTrayOptions {
  /** Tray icon path or base64 data */
  icon?: string
  /** Tooltip text when hovering over icon */
  tooltip?: string
  /** Menu items */
  menu?: SystemTrayMenuItem[]
}

/**
 * System tray menu item
 */
export type SystemTrayMenuItem =
  | {
    /** Menu item label */
    label: string
    /** Click handler */
    onClick?: () => void
    /** Keyboard shortcut */
    accelerator?: string
    /** Menu item type */
    type?: 'normal' | 'checkbox' | 'submenu'
    /** Submenu items (if type is 'submenu') */
    submenu?: SystemTrayMenuItem[]
    /** Is checkbox checked (if type is 'checkbox') */
    checked?: boolean
    /** Is menu item enabled */
    enabled?: boolean
  }
  | {
    /** Menu item type */
    type: 'separator'
  }

/**
 * Modal dialog options
 */
export interface ModalOptions {
  /** Modal title */
  title?: string
  /** Modal message */
  message: string
  /** Modal type */
  type?: 'info' | 'warning' | 'error' | 'success' | 'question'
  /** Buttons to display */
  buttons?: ModalButton[]
  /** Default button index */
  defaultButton?: number
  /** Cancel button index */
  cancelButton?: number
}

/**
 * Modal button configuration
 */
export interface ModalButton {
  /** Button label */
  label: string
  /** Button action */
  action?: () => void
  /** Button style */
  style?: 'default' | 'primary' | 'destructive'
}

/**
 * Alert/notification options
 */
export interface AlertOptions {
  /** Alert title */
  title?: string
  /** Alert message */
  message: string
  /** Alert type */
  type?: 'info' | 'success' | 'warning' | 'error'
  /** Duration in milliseconds (0 = no auto-close) */
  duration?: number
  /** Position on screen */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  /** Theme */
  theme?: 'light' | 'dark' | 'auto'
  /** Click handler */
  onClick?: () => void
}

/**
 * Toast notification options (alias for AlertOptions)
 */
export type ToastOptions = AlertOptions

/**
 * Component base properties
 */
export interface ComponentProps {
  /** Component ID */
  id?: string
  /** CSS classes */
  className?: string
  /** Inline styles */
  style?: Record<string, string>
  /** Component is visible */
  visible?: boolean
  /** Component is enabled */
  enabled?: boolean
}

/**
 * Window instance
 */
export interface WindowInstance {
  /** Window ID */
  id: string
  /** Show the window */
  show: () => void
  /** Hide the window */
  hide: () => void
  /** Close the window */
  close: () => void
  /** Focus the window */
  focus: () => void
  /** Minimize the window */
  minimize: () => void
  /** Maximize the window */
  maximize: () => void
  /** Restore the window from minimized/maximized state */
  restore: () => void
  /** Set window title */
  setTitle: (title: string) => void
  /** Load a URL */
  loadURL: (url: string) => void
  /** Reload the window content */
  reload: () => void
}

/**
 * System tray instance
 */
export interface SystemTrayInstance {
  /** Tray ID */
  id: string
  /** Set tray icon */
  setIcon: (icon: string) => void
  /** Set tray tooltip */
  setTooltip: (tooltip: string) => void
  /** Update tray menu */
  setMenu: (menu: SystemTrayMenuItem[]) => void
  /** Destroy the tray */
  destroy: () => void
}

/**
 * Result of modal dialog
 */
export interface ModalResult {
  /** Index of button clicked */
  buttonIndex: number
  /** Whether the modal was cancelled */
  cancelled: boolean
}
