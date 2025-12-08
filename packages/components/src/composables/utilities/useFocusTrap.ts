/**
 * Traps focus within a container element (useful for modals, dialogs, dropdowns)
 *
 * @example
 * ```ts
 * const { activate, deactivate } = useFocusTrap(modalRef, {
 *   initialFocus: firstInputRef,
 *   returnFocus: true
 * })
 *
 * // When modal opens
 * activate()
 *
 * // When modal closes
 * deactivate()
 * ```
 */

/**
 * Options for useFocusTrap hook
 */
export interface UseFocusTrapOptions {
  /** Whether the focus trap is enabled */
  enabled?: boolean
  /** Element to focus initially (defaults to first focusable element) */
  initialFocus?: HTMLElement | null
  /** Whether to return focus to previously focused element on deactivate */
  returnFocus?: boolean
  /** Fallback element to focus if no focusable elements found */
  fallbackFocus?: HTMLElement | null
}

/**
 * Hook to trap focus within an element
 *
 * @param containerRef - The container element to trap focus within
 * @param options - Configuration options
 * @returns Object with activate and deactivate functions
 */
export function useFocusTrap(
  containerRef: HTMLElement | null,
  options: UseFocusTrapOptions = {},
): { activate: () => void, deactivate: () => void } {
  const {
    enabled = true,
    initialFocus = null,
    returnFocus = true,
    fallbackFocus = null,
  } = options

  let previouslyFocusedElement: HTMLElement | null = null
  let isActive = false

  // Get all focusable elements within container
  function getFocusableElements(): HTMLElement[] {
    if (!containerRef)
      return []

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    return Array.from(containerRef.querySelectorAll(focusableSelectors))
  }

  // Handle tab key
  function handleTab(event: KeyboardEvent) {
    if (!enabled || !isActive || !containerRef)
      return

    const focusableElements = getFocusableElements()

    if (focusableElements.length === 0) {
      event.preventDefault()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement || document.activeElement === containerRef) {
        event.preventDefault()
        lastElement.focus()
      }
    }
    else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  // Handle escape key
  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && enabled && isActive) {
      deactivate()
    }
  }

  // Activate focus trap
  function activate() {
    if (!enabled || !containerRef || isActive)
      return

    // Store previously focused element
    previouslyFocusedElement = document.activeElement as HTMLElement

    // Focus initial element
    if (initialFocus) {
      initialFocus.focus()
    }
    else {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
      else if (fallbackFocus) {
        fallbackFocus.focus()
      }
      else {
        containerRef.focus()
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleTab)
    document.addEventListener('keydown', handleEscape)

    isActive = true
  }

  // Deactivate focus trap
  function deactivate() {
    if (!isActive)
      return

    // Remove event listeners
    document.removeEventListener('keydown', handleTab)
    document.removeEventListener('keydown', handleEscape)

    // Return focus
    if (returnFocus && previouslyFocusedElement) {
      previouslyFocusedElement.focus()
    }

    isActive = false
  }

  return { activate, deactivate }
}
