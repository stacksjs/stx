/**
 * Global Hotkey API
 *
 * Register global keyboard shortcuts that work even when the app is not focused.
 * Communicates with Craft's native side to register system-wide hotkeys.
 * Falls back to document-level listeners in web/non-native mode.
 *
 * @example
 * ```typescript
 * import { registerHotkey, unregisterAllHotkeys } from '@stacksjs/desktop'
 *
 * // Register a global shortcut
 * const reg = registerHotkey('Cmd+Shift+C', () => {
 *   console.log('Hotkey triggered!')
 * })
 *
 * // Unregister a specific shortcut
 * reg.unregister()
 *
 * // Unregister all shortcuts
 * unregisterAllHotkeys()
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface HotkeyRegistration {
  /** The shortcut string (e.g., 'Cmd+Shift+C') */
  shortcut: string
  /** Unique registration ID */
  id: string
  /** Unregister this hotkey */
  unregister(): void
}

export interface ParsedShortcut {
  /** Key character or name (e.g., 'c', 'Enter', 'Space') */
  key: string
  /** Meta/Command key required */
  meta: boolean
  /** Control key required */
  ctrl: boolean
  /** Shift key required */
  shift: boolean
  /** Alt/Option key required */
  alt: boolean
}

// ============================================================================
// Internal State
// ============================================================================

const registrations = new Map<string, { shortcut: string, handler: () => void, parsed: ParsedShortcut }>()
let nextId = 0
let documentListenerAttached = false

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a shortcut string into its component parts.
 *
 * Supports formats like:
 * - 'Cmd+Shift+C'
 * - 'Ctrl+Alt+Delete'
 * - 'Meta+K'
 * - 'CmdOrCtrl+S' (Cmd on macOS, Ctrl on others)
 */
export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.split('+').map(p => p.trim())
  const result: ParsedShortcut = {
    key: '',
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
  }

  for (const part of parts) {
    const lower = part.toLowerCase()

    switch (lower) {
      case 'cmd':
      case 'command':
      case 'meta':
      case '⌘':
        result.meta = true
        break
      case 'ctrl':
      case 'control':
      case '⌃':
        result.ctrl = true
        break
      case 'shift':
      case '⇧':
        result.shift = true
        break
      case 'alt':
      case 'option':
      case 'opt':
      case '⌥':
        result.alt = true
        break
      case 'cmdorctrl':
      case 'commandorcontrol':
        // On macOS use Meta, otherwise Ctrl
        if (typeof process !== 'undefined' && process.platform === 'darwin') {
          result.meta = true
        }
        else {
          result.ctrl = true
        }
        break
      default:
        result.key = lower
    }
  }

  return result
}

/**
 * Format a parsed shortcut back into a display string.
 */
export function formatShortcut(parsed: ParsedShortcut): string {
  const parts: string[] = []
  if (parsed.ctrl)
    parts.push('⌃')
  if (parsed.alt)
    parts.push('⌥')
  if (parsed.shift)
    parts.push('⇧')
  if (parsed.meta)
    parts.push('⌘')
  parts.push(parsed.key.toUpperCase())
  return parts.join('')
}

function matchesEvent(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  if (parsed.meta !== event.metaKey)
    return false
  if (parsed.ctrl !== event.ctrlKey)
    return false
  if (parsed.shift !== event.shiftKey)
    return false
  if (parsed.alt !== event.altKey)
    return false

  const eventKey = event.key.toLowerCase()
  return eventKey === parsed.key || event.code.toLowerCase() === `key${parsed.key}`
}

function handleKeyDown(event: KeyboardEvent): void {
  for (const [, reg] of registrations) {
    if (matchesEvent(event, reg.parsed)) {
      event.preventDefault()
      event.stopPropagation()
      try {
        reg.handler()
      }
      catch {}
      break
    }
  }
}

function ensureDocumentListener(): void {
  if (documentListenerAttached)
    return
  if (typeof document === 'undefined')
    return

  document.addEventListener('keydown', handleKeyDown, true)
  documentListenerAttached = true
}

function removeDocumentListener(): void {
  if (!documentListenerAttached)
    return
  if (typeof document === 'undefined')
    return

  document.removeEventListener('keydown', handleKeyDown, true)
  documentListenerAttached = false
}

// ============================================================================
// Craft Native Integration
// ============================================================================

async function registerWithCraft(id: string, shortcut: string): Promise<boolean> {
  if (typeof window === 'undefined')
    return false

  const craft = (window as any).craft
  if (!craft?.hotkeys?.register)
    return false

  try {
    await craft.hotkeys.register(id, shortcut)
    return true
  }
  catch {
    return false
  }
}

async function unregisterWithCraft(id: string): Promise<void> {
  if (typeof window === 'undefined')
    return

  const craft = (window as any).craft
  if (!craft?.hotkeys?.unregister)
    return

  try {
    await craft.hotkeys.unregister(id)
  }
  catch {}
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Register a global keyboard shortcut.
 *
 * When running in a Craft native window, this registers a system-wide hotkey
 * that works even when the app is not focused. In web mode, it falls back to
 * a document-level keydown listener.
 *
 * @param shortcut - The keyboard shortcut (e.g., 'Cmd+Shift+C', 'CmdOrCtrl+K')
 * @param handler - Function to call when the shortcut is triggered
 * @returns A registration object with an `unregister()` method
 */
export function registerHotkey(shortcut: string, handler: () => void): HotkeyRegistration {
  const id = `hotkey_${++nextId}_${Date.now()}`
  const parsed = parseShortcut(shortcut)

  registrations.set(id, { shortcut, handler, parsed })

  // Try to register with Craft native side
  registerWithCraft(id, shortcut)

  // Always set up document listener as fallback
  ensureDocumentListener()

  const registration: HotkeyRegistration = {
    shortcut,
    id,
    unregister() {
      unregisterHotkey(registration)
    },
  }

  return registration
}

/**
 * Unregister a specific hotkey.
 */
export function unregisterHotkey(registration: HotkeyRegistration): void {
  registrations.delete(registration.id)
  unregisterWithCraft(registration.id)

  if (registrations.size === 0) {
    removeDocumentListener()
  }
}

/**
 * Unregister all registered hotkeys.
 */
export function unregisterAllHotkeys(): void {
  for (const [id] of registrations) {
    unregisterWithCraft(id)
  }
  registrations.clear()
  removeDocumentListener()
}

/**
 * Get all currently registered hotkeys.
 */
export function getRegisteredHotkeys(): HotkeyRegistration[] {
  return Array.from(registrations.entries()).map(([id, reg]) => ({
    shortcut: reg.shortcut,
    id,
    unregister() {
      registrations.delete(id)
      unregisterWithCraft(id)
      if (registrations.size === 0) {
        removeDocumentListener()
      }
    },
  }))
}
