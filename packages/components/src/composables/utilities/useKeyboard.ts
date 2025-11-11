/**
 * Hook for keyboard event handling with support for shortcuts and modifiers
 *
 * @example
 * ```ts
 * useKeyboard([
 *   { key: 'Escape', handler: () => closeModal() },
 *   { key: 's', ctrl: true, handler: () => save() },
 *   { key: ['ArrowUp', 'ArrowDown'], handler: (e) => navigate(e.key) }
 * ])
 * ```
 */

/**
 * Options for useKeyboard hook
 */
export interface UseKeyboardOptions {
  /** Whether the hook is enabled */
  enabled?: boolean
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean
  /** Whether to stop event propagation */
  stopPropagation?: boolean
  /** Target element for event listener (defaults to document) */
  target?: HTMLElement | Document | Window | null
}

/**
 * Keyboard event handler configuration
 */
export interface KeyboardHandler {
  /** Key or keys to listen for */
  key: string | string[]
  /** Handler function to execute */
  handler: (event: KeyboardEvent) => void
  /** Whether Ctrl key must be pressed */
  ctrl?: boolean
  /** Whether Shift key must be pressed */
  shift?: boolean
  /** Whether Alt key must be pressed */
  alt?: boolean
  /** Whether Meta (Command on Mac) key must be pressed */
  meta?: boolean
}

/**
 * Hook for keyboard event handling
 *
 * @param handlers - Single handler or array of keyboard handlers
 * @param options - Configuration options
 * @returns Cleanup function to remove event listeners
 */
export function useKeyboard(
  handlers: KeyboardHandler | KeyboardHandler[],
  options: UseKeyboardOptions = {},
): () => void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = typeof document !== 'undefined' ? document : null,
  } = options

  const handlerArray = Array.isArray(handlers) ? handlers : [handlers]

  const handleKeydown = (event: KeyboardEvent) => {
    if (!enabled)
      return

    handlerArray.forEach((handler) => {
      const keys = Array.isArray(handler.key) ? handler.key : [handler.key]
      const keyMatches = keys.some(k => k.toLowerCase() === event.key.toLowerCase())

      if (!keyMatches)
        return

      // Check modifier keys
      if (handler.ctrl !== undefined && handler.ctrl !== event.ctrlKey)
        return
      if (handler.shift !== undefined && handler.shift !== event.shiftKey)
        return
      if (handler.alt !== undefined && handler.alt !== event.altKey)
        return
      if (handler.meta !== undefined && handler.meta !== event.metaKey)
        return

      // Execute handler
      if (preventDefault)
        event.preventDefault()
      if (stopPropagation)
        event.stopPropagation()

      handler.handler(event)
    })
  }

  // Add event listener
  if (target) {
    target.addEventListener('keydown', handleKeydown as EventListener)
  }

  // Return cleanup function
  return () => {
    if (target) {
      target.removeEventListener('keydown', handleKeydown as EventListener)
    }
  }
}

// Common keyboard shortcuts
export const KeyboardShortcuts = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const
