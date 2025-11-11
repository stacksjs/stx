/**
 * Detects clicks outside a specified element
 *
 * @example
 * ```ts
 * const cleanup = useClickOutside(
 *   modalRef,
 *   () => closeModal(),
 *   { enabled: isOpen, ignore: ['.tooltip'] }
 * )
 * ```
 */

/**
 * Options for useClickOutside hook
 */
export interface UseClickOutsideOptions {
  /** Whether the hook is enabled */
  enabled?: boolean
  /** CSS selectors to ignore (clicks on these elements won't trigger callback) */
  ignore?: string[]
}

/**
 * Hook to detect clicks outside an element
 *
 * @param elementRef - The element to detect clicks outside of
 * @param callback - Function to call when click occurs outside element
 * @param options - Configuration options
 * @returns Cleanup function to remove event listeners
 */
export function useClickOutside(
  elementRef: HTMLElement | null,
  callback: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {},
): () => void {
  const { enabled = true, ignore = [] } = options

  const handleClick = (event: MouseEvent | TouchEvent) => {
    if (!enabled || !elementRef)
      return

    const target = event.target as Node

    // Check if click is outside element
    if (!elementRef.contains(target)) {
      // Check if target matches any ignore selectors
      const shouldIgnore = ignore.some((selector) => {
        const elements = document.querySelectorAll(selector)
        return Array.from(elements).some(el => el.contains(target))
      })

      if (!shouldIgnore) {
        callback(event)
      }
    }
  }

  // Add event listeners
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
  }

  // Return cleanup function
  return () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }
}
