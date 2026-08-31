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
  /**
   * Panel behaviours, Electron's spelling.
   *
   * This is what Craft's bridge actually dispatches on, so it is part of the
   * contract rather than a convenience: `'openDirectory'` routes to the folder
   * panel, `'multiSelections'` to the multi-file panel, anything else to the
   * single-file panel. Setting the booleans above is enough — they are
   * translated into this before the call — but a caller that already speaks
   * Electron can pass it directly.
   */
  properties?: OpenDialogProperty[]
}

/** A behaviour Craft's open panel understands. */
export type OpenDialogProperty =
| 'openFile'
| 'openDirectory'
| 'multiSelections'
| 'showHiddenFiles'
| 'createDirectory'

/**
 * Restate the options in the terms Craft's bridge reads.
 *
 * `craft.dialog.showOpenDialog` chooses between three different native panels
 * by looking at `options.properties`, and nothing else. The friendly booleans
 * were passed straight through and never consulted, so `canChooseDirectories:
 * true` — the documented way to ask for a folder — opened a *file* picker.
 * Which is not a crash, and not obviously a bug from the calling side: a panel
 * appears, the user cannot pick their folder, and it reads as macOS being
 * awkward.
 */
function toCraftOpenOptions(options: OpenDialogOptions): OpenDialogOptions {
  const properties = new Set<OpenDialogProperty>(options.properties ?? [])
  if (options.canChooseDirectories)
    properties.add('openDirectory')
  if (options.canChooseFiles)
    properties.add('openFile')
  if (options.multiSelections)
    properties.add('multiSelections')
  if (options.showHiddenFiles)
    properties.add('showHiddenFiles')
  if (options.canCreateDirectories)
    properties.add('createDirectory')

  return { ...options, properties: [...properties] }
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
      return await craftWindow.craft.dialog.showOpenDialog(toCraftOpenOptions(options))
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

    const wants = new Set(toCraftOpenOptions(options).properties)
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = wants.has('multiSelections')

    // Set accept types from filters
    if (options.filters?.length) {
      const extensions = options.filters.flatMap(f => f.extensions.map(e => `.${e}`))
      input.accept = extensions.join(',')
    }

    // Directory selection (limited browser support)
    if (wants.has('openDirectory') && !wants.has('openFile')) {
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

  // Web fallback.
  //
  // `response` is an *index into `buttons`*, so the fallback has to answer in
  // the same currency the native path does. It used to return `confirmed ? 1 :
  // 0`, which is backwards for the conventional `[action, 'Cancel']` ordering:
  // accepting the dialog reported button 1, Cancel. Every caller that asked
  // "did they confirm?" as `response === 0` got the opposite answer in a
  // browser, and only in a browser — which is the hardest place to notice,
  // because the native build behaves.
  const buttons = options.buttons || ['OK']
  const detail = options.detail ? `\n\n${options.detail}` : ''
  const text = `${options.message}${detail}`

  if (buttons.length === 1) {
    alert(text)
    return { response: 0 }
  }

  // Which index means "cancel", and which means "go ahead". `cancelButton`
  // wins if given; otherwise the last button is the way out, as it is on macOS.
  const cancelIndex = options.cancelButton ?? buttons.length - 1
  const acceptIndex = options.defaultButton !== undefined && options.defaultButton !== cancelIndex
    ? options.defaultButton
    : buttons.findIndex((_, i) => i !== cancelIndex)

  if (buttons.length > 2) {
    // `confirm` is two-way and this dialog is not, so the extra buttons are
    // unreachable rather than silently mapped onto one of the two answers.
    console.warn(
      `[stx-dialog] ${buttons.length} buttons requested; a browser confirm offers two. `
      + `Reachable: "${buttons[acceptIndex]}" and "${buttons[cancelIndex]}".`,
    )
  }

  return { response: confirm(text) ? acceptIndex : cancelIndex }
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
  // OK first: NSAlert adds buttons right-to-left and makes the first one the
  // default, so `['Cancel', 'OK']` produced a confirm dialog that defaulted to
  // Cancel and put OK on the left — backwards on both counts for macOS.
  const result = await showMessageBox({
    type: 'question',
    title: title || 'Confirm',
    message,
    buttons: ['OK', 'Cancel'],
    defaultButton: 0,
    cancelButton: 1,
  })
  return result.response === 0
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
