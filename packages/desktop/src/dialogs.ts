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
 * The dialog methods this module probes for on the host.
 *
 * Deliberately all optional: the whole bug was assuming a method is there
 * because the namespace is. `unknown` returns, because the three hosts answer
 * a button press in three different shapes -- see {@link toMessageBoxResult}.
 */
interface NativeDialogApi {
  showMessageBox?: (options: MessageBoxOptions) => Promise<unknown>
  showAlert?: (options: Record<string, unknown>) => Promise<unknown>
}

/** The host's dialog namespace, or undefined outside a Craft window. */
function nativeDialogApi(): NativeDialogApi | undefined {
  if (typeof window === 'undefined')
    return undefined
  return (window as { craft?: { dialog?: NativeDialogApi } }).craft?.dialog
}

/** How a Craft alert style names what a message box calls a `type`. */
const ALERT_STYLE: Record<string, string> = {
  error: 'critical',
  warning: 'warning',
  question: 'info',
  info: 'info',
  none: 'info',
}

/**
 * A message box expressed as the alert the bridge implements.
 *
 * Craft's `title` is the bold primary line and `message` the secondary one,
 * which is the opposite emphasis from `MessageBoxOptions`, where `message` is
 * the primary text and `title` the window title. So the primary line is the
 * title when there is one and the message otherwise, and whatever is left over
 * joins the detail underneath.
 */
function toAlertOptions(options: MessageBoxOptions): Record<string, unknown> {
  const secondary = [options.title ? options.message : '', options.detail ?? '']
    .filter(Boolean)
    .join('\n\n')

  return {
    title: options.title || options.message,
    message: secondary || undefined,
    style: ALERT_STYLE[options.type ?? 'none'] ?? 'info',
    buttons: options.buttons,
  }
}

/**
 * Whatever the host answered, as a button index.
 *
 * Three currencies are in circulation for one question. `showAlert` resolves
 * to a bare number; a host implementing `showMessageBox` may answer Electron's
 * `{ response }` or Craft's own `{ buttonIndex }` -- the key the native
 * runtime puts on the wire. Reading only one of them yields `undefined`, and
 * `undefined === 0` is false, so a confirm dialog silently reports "not that
 * button" whichever button was pressed.
 *
 * An unreadable answer falls back to the CANCEL button rather than to 0: the
 * conventional ordering puts the action first, so defaulting to 0 would treat
 * a dialog that failed to answer as consent to the destructive thing it asked
 * about.
 */
function toMessageBoxResult(raw: unknown, options: MessageBoxOptions): MessageBoxResult {
  if (typeof raw === 'number' && Number.isFinite(raw))
    return { response: raw }

  if (raw && typeof raw === 'object') {
    const value = raw as Record<string, unknown>
    if (typeof value.response === 'number')
      return { response: value.response }
    if (typeof value.buttonIndex === 'number')
      return { response: value.buttonIndex }
  }

  const buttons = options.buttons ?? ['OK']
  return { response: options.cancelButton ?? Math.max(0, buttons.length - 1) }
}

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
  const native = nativeDialogApi()

  /*
   * Ask for the METHOD, not the namespace.
   *
   * `isInCraftWindow()` only establishes that `craft.dialog` exists, and the
   * shipped bridge's dialog namespace is
   *
   *   { openFile, openFolder, saveFile, showAlert, showConfirm, showPrompt }
   *
   * with no showMessageBox at all -- although `craft-native`'s own
   * `bridge/core.d.ts` declares one, which is why this read as available. So
   * the call threw "not a function", the catch below swallowed it, and every
   * native dialog quietly fell through to the web `confirm()` path. In a
   * packaged app that is the worst place to land: there is no console to see
   * the warning in, and a WebView that does not implement the confirm panel
   * answers `false` without showing anything -- so the dialog appeared to draw
   * and then refuse every answer (stacksjs/stx#2040).
   */
  if (typeof native?.showMessageBox === 'function') {
    try {
      return toMessageBoxResult(await native.showMessageBox(options), options)
    }
    catch (error) {
      console.warn('[stx-dialog] Failed to show native message box:', error)
    }
  }
  else if (typeof native?.showAlert === 'function') {
    // The surface the bridge actually implements. It answers with the button
    // index directly, having already unwrapped the host's `{ buttonIndex }`.
    try {
      return toMessageBoxResult(await native.showAlert(toAlertOptions(options)), options)
    }
    catch (error) {
      console.warn('[stx-dialog] Failed to show native alert:', error)
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

  // Message dialogs.
  //
  // The bridge's dialog namespace has no showMessageBox -- showAlert is the
  // method it actually implements, and it answers with the button index. So
  // this prefers showMessageBox when a host provides one and uses showAlert
  // otherwise, instead of calling a method that is not there (stacksjs/stx#2040).
  showMessageBox: async (options) => {
    const api = window.craft?.dialog;
    if (typeof api?.showMessageBox === 'function') {
      const raw = await api.showMessageBox(options);
      if (typeof raw === 'number') return { response: raw };
      if (raw && typeof raw.response === 'number') return { response: raw.response };
      if (raw && typeof raw.buttonIndex === 'number') return { response: raw.buttonIndex };
    }
    else if (typeof api?.showAlert === 'function') {
      const index = await api.showAlert({
        title: options.title || options.message,
        message: options.title ? options.message : options.detail,
        buttons: options.buttons,
      });
      if (typeof index === 'number') return { response: index };
    }
    // Unreadable: answer with cancel, never with the action button.
    const buttons = options.buttons || ['OK'];
    return { response: options.cancelButton ?? Math.max(0, buttons.length - 1) };
  },

  // Color picker
  showColorPicker: (options) => window.craft?.dialog?.showColorPicker(options),

  // Font picker
  showFontPicker: (options) => window.craft?.dialog?.showFontPicker(options),

  // Convenience functions
  alert: async (message, title) => {
    return window.stxDialog.showMessageBox({
      type: 'info',
      title: title || 'Alert',
      message,
      buttons: ['OK'],
    });
  },

  // OK first, matching showConfirmDialog: NSAlert adds buttons right-to-left
  // and makes the first one the default, so ['Cancel', 'OK'] built a confirm
  // that defaulted to Cancel and put OK on the left. This wrapper still had
  // the old order after the typed path was corrected.
  confirm: async (message, title) => {
    const result = await window.stxDialog.showMessageBox({
      type: 'question',
      title: title || 'Confirm',
      message,
      buttons: ['OK', 'Cancel'],
      defaultButton: 0,
      cancelButton: 1,
    });
    return result?.response === 0;
  },

  error: async (message, title) => {
    return window.stxDialog.showMessageBox({
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
