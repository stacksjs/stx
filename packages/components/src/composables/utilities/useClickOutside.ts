// Hook to detect clicks outside an element

export interface UseClickOutsideOptions {
  enabled?: boolean
  ignore?: string[] // CSS selectors to ignore
}

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
