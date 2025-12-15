/**
 * Native Dialog Integration
 *
 * Provides native file dialogs, message boxes, and other system dialogs
 * using Craft's Dialog Bridge APIs.
 *
 * When running inside a Craft native window, these dialogs use the native
 * OS dialogs (NSOpenPanel on macOS, etc.). When running in a browser,
 * they fall back to web alternatives where possible.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Options for opening a file dialog
 */
export interface OpenDialogOptions {
  /** Dialog title */
  title?: string
  /** Default path to open */
  defaultPath?: string
  /** Button label (e.g., "Open", "Select") */
  buttonLabel?: string
  /** File type filters */
  filters?: FileFilter[]
  /** Allow selecting multiple files */
  multiSelections?: boolean
  /** Show hidden files */
  showHiddenFiles?: boolean
  /** Allow selecting directories */
  canChooseDirectories?: boolean
  /** Allow selecting files */
  canChooseFiles?: boolean
  /** Allow creating new directories */
  canCreateDirectories?: boolean
}

/**
 * Options for saving a file dialog
 */
export interface SaveDialogOptions {
  /** Dialog title */
  title?: string
  /** Default path/filename */
  defaultPath?: string
  /** Button label (e.g., "Save") */
  buttonLabel?: string
  /** File type filters */
  filters?: FileFilter[]
  /** Show hidden files */
  showHiddenFiles?: boolean
  /** Allow creating new directories */
  canCreateDirectories?: boolean
}

/**
 * File type filter
 */
export interface FileFilter {
  /** Filter name (e.g., "Images") */
  name: string
  /** File extensions (e.g., ["png", "jpg", "gif"]) */
  extensions: string[]
}

/**
 * Result from open dialog
 */
export interface OpenDialogResult {
  /** Whether the dialog was cancelled */
  canceled: boolean
  /** Selected file paths */
  filePaths: string[]
}

/**
 * Result from save dialog
 */
export interface SaveDialogResult {
  /** Whether the dialog was cancelled */
  canceled: boolean
  /** Selected file path */
  filePath?: string
}

/**
 * Options for message box dialog
 */
export interface MessageBoxOptions {
  /** Message box type */
  type?: 'none' | 'info' | 'warning' | 'error' | 'question'
  /** Dialog title */
  title?: string
  /** Main message */
  message: string
  /** Secondary detail text */
  detail?: string
  /** Button labels */
  buttons?: string[]
  /** Index of default button */
  defaultButton?: number
  /** Index of cancel button */
  cancelButton?: number
}

/**
 * Result from message box
 */
export interface MessageBoxResult {
  /** Index of button clicked */
  response: number
}

/**
 * Options for color picker dialog
 */
export interface ColorPickerOptions {
  /** Initial color (hex format) */
  color?: string
  /** Show alpha/opacity control */
  showAlpha?: boolean
}

/**
 * Result from color picker
 */
export interface ColorPickerResult {
  /** Whether the dialog was cancelled */
  canceled: boolean
  /** Selected color in hex format */
  color?: string
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Check if running inside a Craft native window
 */
function isInCraftWindow(): boolean {
  if (typeof window !== 'undefined' && (window as any).craft?.dialog) {
    return true
  }
  return false
}

// =============================================================================
// Native Dialog Functions
// =============================================================================

/**
 * Show a native file open dialog
 *
 * When running in Craft, uses the native OS file picker.
 * In browser, falls back to HTML file input.
 *
 * @param options - Dialog options
 * @returns Promise resolving to selected files or cancellation
 *
 * @example
 * ```typescript
 * const result = await showOpenDialog({
 *   title: 'Select an image',
 *   filters: [{ name: 'Images', extensions: ['png', 'jpg', 'gif'] }],
 *   multiSelections: true,
 * })
 *
 * if (!result.canceled) {
 *   console.log('Selected:', result.filePaths)
 * }
 * ```
 */
export async function showOpenDialog(options: OpenDialogOptions = {}): Promise<OpenDialogResult> {
  if (isInCraftWindow()) {
    // Use Craft's native dialog
    const craftWindow = window as any
    try {
      return await craftWindow.craft.dialog.showOpenDialog(options)
    }
    catch (error) {
      console.warn('[stx-dialog] Failed to show native open dialog:', error)
      // Fall through to web fallback
    }
  }

  // Web fallback: use file input
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ canceled: true, filePaths: [] })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = options.multiSelections ?? false

    // Set accept types from filters
    if (options.filters?.length) {
      const extensions = options.filters.flatMap(f => f.extensions.map(e => `.${e}`))
      input.accept = extensions.join(',')
    }

    // Directory selection (limited browser support)
    if (options.canChooseDirectories && !options.canChooseFiles) {
      (input as any).webkitdirectory = true
    }

    input.onchange = () => {
      const files = Array.from(input.files || [])
      if (files.length === 0) {
        resolve({ canceled: true, filePaths: [] })
      }
      else {
        // Note: In browsers, we can only get file names, not full paths
        const filePaths = files.map(f => f.name)
        resolve({ canceled: false, filePaths })
      }
    }

    input.oncancel = () => {
      resolve({ canceled: true, filePaths: [] })
    }

    input.click()
  })
}

/**
 * Show a native file save dialog
 *
 * When running in Craft, uses the native OS save dialog.
 * In browser, this is limited to triggering downloads.
 *
 * @param options - Dialog options
 * @returns Promise resolving to selected path or cancellation
 *
 * @example
 * ```typescript
 * const result = await showSaveDialog({
 *   title: 'Save document',
 *   defaultPath: 'document.txt',
 *   filters: [{ name: 'Text Files', extensions: ['txt'] }],
 * })
 *
 * if (!result.canceled && result.filePath) {
 *   console.log('Save to:', result.filePath)
 * }
 * ```
 */
export async function showSaveDialog(options: SaveDialogOptions = {}): Promise<SaveDialogResult> {
  if (isInCraftWindow()) {
    // Use Craft's native dialog
    const craftWindow = window as any
    try {
      return await craftWindow.craft.dialog.showSaveDialog(options)
    }
    catch (error) {
      console.warn('[stx-dialog] Failed to show native save dialog:', error)
    }
  }

  // Web fallback: use showSaveFilePicker if available (modern browsers)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const fileTypes = options.filters?.map(f => ({
        description: f.name,
        accept: {
          '*/*': f.extensions.map(e => `.${e}`),
        },
      }))

      const handle = await (window as any).showSaveFilePicker({
        suggestedName: options.defaultPath,
        types: fileTypes,
      })

      return { canceled: false, filePath: handle.name }
    }
    catch (error) {
      // User cancelled or API not supported
      return { canceled: true }
    }
  }

  // Fallback: prompt for filename
  console.warn('[stx-dialog] Save dialog not available, using prompt fallback')
  const filename = prompt('Enter filename:', options.defaultPath || 'file.txt')
  if (filename) {
    return { canceled: false, filePath: filename }
  }
  return { canceled: true }
}

/**
 * Show a native message box dialog
 *
 * When running in Craft, uses the native OS message box.
 * In browser, falls back to confirm/alert dialogs.
 *
 * @param options - Message box options
 * @returns Promise resolving to button index clicked
 *
 * @example
 * ```typescript
 * const result = await showMessageBox({
 *   type: 'question',
 *   title: 'Confirm',
 *   message: 'Are you sure you want to delete this file?',
 *   buttons: ['Cancel', 'Delete'],
 *   defaultButton: 0,
 *   cancelButton: 0,
 * })
 *
 * if (result.response === 1) {
 *   // User clicked "Delete"
 * }
 * ```
 */
export async function showMessageBox(options: MessageBoxOptions): Promise<MessageBoxResult> {
  if (isInCraftWindow()) {
    // Use Craft's native dialog
    const craftWindow = window as any
    try {
      return await craftWindow.craft.dialog.showMessageBox(options)
    }
    catch (error) {
      console.warn('[stx-dialog] Failed to show native message box:', error)
    }
  }

  // Web fallback
  const buttons = options.buttons || ['OK']

  if (buttons.length === 1) {
    // Simple alert
    alert(options.message)
    return { response: 0 }
  }

  if (buttons.length === 2 && options.type === 'question') {
    // Use confirm for simple yes/no
    const confirmed = confirm(options.message)
    return { response: confirmed ? 1 : 0 }
  }

  // For more complex dialogs, we'd need a custom modal
  // For now, fall back to confirm
  console.warn('[stx-dialog] Complex message box not fully supported in browser, using confirm')
  const confirmed = confirm(`${options.message}\n\n${buttons.join(' / ')}`)
  return { response: confirmed ? (buttons.length - 1) : 0 }
}

/**
 * Show a native color picker dialog
 *
 * @param options - Color picker options
 * @returns Promise resolving to selected color or cancellation
 *
 * @example
 * ```typescript
 * const result = await showColorPicker({
 *   color: '#ff0000',
 *   showAlpha: true,
 * })
 *
 * if (!result.canceled && result.color) {
 *   document.body.style.backgroundColor = result.color
 * }
 * ```
 */
export async function showColorPicker(options: ColorPickerOptions = {}): Promise<ColorPickerResult> {
  if (isInCraftWindow()) {
    // Use Craft's native dialog
    const craftWindow = window as any
    try {
      return await craftWindow.craft.dialog.showColorPicker(options)
    }
    catch (error) {
      console.warn('[stx-dialog] Failed to show native color picker:', error)
    }
  }

  // Web fallback: use color input
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ canceled: true })
      return
    }

    const input = document.createElement('input')
    input.type = 'color'
    input.value = options.color || '#000000'

    input.onchange = () => {
      resolve({ canceled: false, color: input.value })
    }

    input.oncancel = () => {
      resolve({ canceled: true })
    }

    input.click()
  })
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Show a simple alert message dialog (native)
 *
 * @param message - Message to display
 * @param title - Optional dialog title
 */
export async function showAlertDialog(message: string, title?: string): Promise<void> {
  await showMessageBox({
    type: 'info',
    title: title || 'Alert',
    message,
    buttons: ['OK'],
  })
}

/**
 * Show a confirmation dialog (native)
 *
 * @param message - Message to display
 * @param title - Optional dialog title
 * @returns True if confirmed, false if cancelled
 */
export async function showConfirmDialog(message: string, title?: string): Promise<boolean> {
  const result = await showMessageBox({
    type: 'question',
    title: title || 'Confirm',
    message,
    buttons: ['Cancel', 'OK'],
    defaultButton: 1,
    cancelButton: 0,
  })
  return result.response === 1
}

/**
 * Show an error dialog (native)
 *
 * @param message - Error message
 * @param title - Optional dialog title
 */
export async function showErrorDialog(message: string, title?: string): Promise<void> {
  await showMessageBox({
    type: 'error',
    title: title || 'Error',
    message,
    buttons: ['OK'],
  })
}

/**
 * Show a warning dialog (native)
 *
 * @param message - Warning message
 * @param title - Optional dialog title
 */
export async function showWarningDialog(message: string, title?: string): Promise<void> {
  await showMessageBox({
    type: 'warning',
    title: title || 'Warning',
    message,
    buttons: ['OK'],
  })
}

// =============================================================================
// Bridge Script Generator
// =============================================================================

/**
 * Generate a JavaScript snippet for dialog control from inside a webview.
 * This provides convenient wrappers around the Craft dialog bridge.
 */
export function getDialogBridgeScript(): string {
  return `
// STX Desktop Dialog Bridge
// Provides convenient wrappers around window.craft.dialog APIs
window.stxDialog = {
  // File dialogs
  showOpenDialog: (options) => window.craft?.dialog?.showOpenDialog(options),
  showSaveDialog: (options) => window.craft?.dialog?.showSaveDialog(options),

  // Message dialogs
  showMessageBox: (options) => window.craft?.dialog?.showMessageBox(options),

  // Color picker
  showColorPicker: (options) => window.craft?.dialog?.showColorPicker(options),

  // Font picker
  showFontPicker: (options) => window.craft?.dialog?.showFontPicker(options),

  // Convenience functions
  alert: async (message, title) => {
    return window.craft?.dialog?.showMessageBox({
      type: 'info',
      title: title || 'Alert',
      message,
      buttons: ['OK'],
    });
  },

  confirm: async (message, title) => {
    const result = await window.craft?.dialog?.showMessageBox({
      type: 'question',
      title: title || 'Confirm',
      message,
      buttons: ['Cancel', 'OK'],
    });
    return result?.response === 1;
  },

  error: async (message, title) => {
    return window.craft?.dialog?.showMessageBox({
      type: 'error',
      title: title || 'Error',
      message,
      buttons: ['OK'],
    });
  },

  // Check if dialog is available
  isAvailable: () => typeof window.craft?.dialog !== 'undefined',
};
`
}
