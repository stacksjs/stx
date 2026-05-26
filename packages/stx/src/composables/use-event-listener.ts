/**
 * useEventListener - Event listener composable with auto-cleanup
 *
 * Attaches event listeners and automatically removes them on component destroy.
 * Replaces raw `window.addEventListener` / `document.addEventListener` usage.
 */

export interface UseEventListenerOptions {
  /** Event target (defaults to window) */
  target?: EventTarget | string
  /** Use capture phase */
  capture?: boolean
  /** Passive listener */
  passive?: boolean
  /** Auto-remove after first invocation */
  once?: boolean
}

export interface EventListenerRef {
  /** Manually remove the listener */
  remove: () => void
}

/**
 * Attach an event listener with auto-cleanup.
 *
 * @example
 * ```ts
 * // Listen on window (default)
 * useEventListener('resize', () => console.log('resized'))
 *
 * // Listen on document
 * useEventListener('click', handler, { target: document })
 *
 * // Listen on a specific element by selector
 * useEventListener('click', handler, { target: '#my-button' })
 *
 * // Manual removal
 * const { remove } = useEventListener('scroll', handler)
 * remove()
 * ```
 */
export function useEventListener(
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: UseEventListenerOptions,
): EventListenerRef {
  if (typeof window === 'undefined') {
    return { remove: () => {} }
  }

  let target: EventTarget = window
  if (options?.target) {
    if (typeof options.target === 'string') {
      // Previously `document.querySelector(...) || window` — a typo'd
      // selector silently upgraded the listener to window scope (the
      // intended `click outside #dropdown` would fire on every click in
      // the page). Now we bail with a clear warning so the misconfig is
      // discoverable. Matches the runtime version's no-spurious-fallback
      // behavior (signals.ts:3054-3055). See stacksjs/stx#1721.
      const resolved = document.querySelector(options.target)
      if (!resolved) {
        console.warn(
          `[stx] useEventListener: selector "${options.target}" did not match any element. Listener not attached.`,
        )
        return { remove: () => {} }
      }
      target = resolved
    }
    else {
      target = options.target
    }
  }

  const listenerOptions: AddEventListenerOptions = {
    capture: options?.capture,
    passive: options?.passive,
    once: options?.once,
  }

  target.addEventListener(event, handler, listenerOptions)

  const remove = () => {
    target.removeEventListener(event, handler, listenerOptions)
  }

  // Auto-cleanup via onDestroy if available
  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(remove)
  }

  return { remove }
}
