// Hook for keyboard event handling

export interface UseKeyboardOptions {
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  target?: HTMLElement | Document | Window | null
}

export interface KeyboardHandler {
  key: string | string[]
  handler: (event: KeyboardEvent) => void
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
}

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
