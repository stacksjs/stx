/**
 * Accessibility utilities for @stacksjs/components
 *
 * Provides comprehensive ARIA helpers, focus management, keyboard navigation,
 * and screen reader utilities for building accessible components
 *
 * @example
 * ```ts
 * import { createAriaLabel, manageFocus, announceToScreenReader } from '@stacksjs/components'
 *
 * // Create accessible label
 * const labelId = createAriaLabel('Search', element)
 *
 * // Manage focus
 * const trap = createFocusTrap(dialogElement)
 * trap.activate()
 *
 * // Announce to screen readers
 * announceToScreenReader('Form submitted successfully')
 * ```
 */

/**
 * ARIA live region types
 */
export type AriaLive = 'off' | 'polite' | 'assertive'

/**
 * ARIA role types
 */
export type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem'

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  /** Initial element to focus */
  initialFocus?: HTMLElement | null
  /** Element to focus when trap is deactivated */
  returnFocus?: HTMLElement | null
  /** Escape key closes trap */
  escapeDeactivates?: boolean
  /** Click outside deactivates trap */
  clickOutsideDeactivates?: boolean
  /** Allow outside click without deactivating */
  allowOutsideClick?: boolean | ((event: MouseEvent) => boolean)
  /** Callback when activated */
  onActivate?: () => void
  /** Callback when deactivated */
  onDeactivate?: () => void
}

/**
 * Focus trap instance
 */
export interface FocusTrap {
  activate: () => void
  deactivate: () => void
  pause: () => void
  unpause: () => void
}

/**
 * Generate a unique ID for accessibility attributes
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
let idCounter = 0
export function generateId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`
}

/**
 * Create accessible label and associate with element
 *
 * @param text - Label text
 * @param element - Element to associate with
 * @param options - Label options
 * @returns Generated label ID
 */
export function createAriaLabel(
  text: string,
  element?: HTMLElement | null,
  options: { visible?: boolean; id?: string } = {},
): string {
  const { visible = false, id = generateId('label') } = options

  const label = document.createElement(visible ? 'label' : 'span')
  label.id = id
  label.textContent = text

  if (!visible) {
    // Visually hidden but accessible to screen readers
    Object.assign(label.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    })
  }

  if (element) {
    element.setAttribute('aria-labelledby', id)
    if (element.parentElement) {
      element.parentElement.insertBefore(label, element)
    }
    else {
      document.body.appendChild(label)
    }
  }

  return id
}

/**
 * Create accessible description and associate with element
 *
 * @param text - Description text
 * @param element - Element to associate with
 * @returns Generated description ID
 */
export function createAriaDescription(text: string, element?: HTMLElement | null): string {
  const id = generateId('desc')

  const description = document.createElement('span')
  description.id = id
  description.textContent = text

  // Visually hidden but accessible to screen readers
  Object.assign(description.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  })

  if (element) {
    element.setAttribute('aria-describedby', id)
    if (element.parentElement) {
      element.parentElement.insertBefore(description, element)
    }
    else {
      document.body.appendChild(description)
    }
  }

  return id
}

/**
 * Announce message to screen readers
 *
 * Creates a live region and announces the message
 *
 * @param message - Message to announce
 * @param priority - Announcement priority
 */
export function announceToScreenReader(message: string, priority: AriaLive = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')

  // Visually hidden
  Object.assign(announcement.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  })

  document.body.appendChild(announcement)

  // Delay to ensure screen readers pick it up
  setTimeout(() => {
    announcement.textContent = message
  }, 100)

  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Get all focusable elements within a container
 *
 * @param container - Container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    element => element.offsetParent !== null, // Visible elements only
  )
}

/**
 * Create a focus trap for modal dialogs and overlays
 *
 * Traps keyboard focus within a container element
 *
 * @param container - Container element to trap focus within
 * @param options - Focus trap options
 * @returns Focus trap instance
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {},
): FocusTrap {
  const {
    initialFocus,
    returnFocus,
    escapeDeactivates = true,
    clickOutsideDeactivates = true,
    allowOutsideClick = false,
    onActivate,
    onDeactivate,
  } = options

  let isActive = false
  let isPaused = false
  let previouslyFocused: HTMLElement | null = null

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isPaused)
      return

    // Handle escape key
    if (escapeDeactivates && event.key === 'Escape') {
      event.preventDefault()
      deactivate()
      return
    }

    // Handle tab key
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(container)

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
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
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (isPaused)
      return

    if (!container.contains(event.target as Node)) {
      if (typeof allowOutsideClick === 'function') {
        if (!allowOutsideClick(event) && clickOutsideDeactivates) {
          deactivate()
        }
      }
      else if (!allowOutsideClick && clickOutsideDeactivates) {
        deactivate()
      }
    }
  }

  function activate() {
    if (isActive)
      return

    isActive = true
    previouslyFocused = document.activeElement as HTMLElement

    // Set initial focus
    const elementToFocus = initialFocus || getFocusableElements(container)[0]
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus()
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)

    onActivate?.()
  }

  function deactivate() {
    if (!isActive)
      return

    isActive = false

    // Return focus
    const elementToFocus = returnFocus || previouslyFocused
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus()
    }

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('click', handleClickOutside)

    onDeactivate?.()
  }

  function pause() {
    isPaused = true
  }

  function unpause() {
    isPaused = false
  }

  return {
    activate,
    deactivate,
    pause,
    unpause,
  }
}

/**
 * Manage focus order with roving tabindex
 *
 * Useful for toolbars, menus, and other composite widgets
 *
 * @param container - Container element
 * @param options - Options
 * @returns Cleanup function
 */
export interface RovingTabindexOptions {
  /** Selector for items */
  selector?: string
  /** Initial focused index */
  initialIndex?: number
  /** Orientation for arrow key navigation */
  orientation?: 'horizontal' | 'vertical' | 'both'
  /** Loop navigation */
  loop?: boolean
  /** Callback when focus changes */
  onFocusChange?: (index: number, element: HTMLElement) => void
}

export function createRovingTabindex(
  container: HTMLElement,
  options: RovingTabindexOptions = {},
): () => void {
  const {
    selector = '[role="option"], [role="menuitem"], [role="tab"], button',
    initialIndex = 0,
    orientation = 'both',
    loop = true,
    onFocusChange,
  } = options

  let currentIndex = initialIndex

  const getItems = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(selector))
  }

  const setFocusedIndex = (index: number) => {
    const items = getItems()
    if (index < 0 || index >= items.length)
      return

    // Update tabindex
    items.forEach((item, i) => {
      if (i === index) {
        item.setAttribute('tabindex', '0')
        if (typeof item.focus === 'function') {
          item.focus()
        }
      }
      else {
        item.setAttribute('tabindex', '-1')
      }
    })

    currentIndex = index
    onFocusChange?.(index, items[index])
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const items = getItems()
    const maxIndex = items.length - 1

    let handled = false
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex + 1
          if (newIndex > maxIndex) {
            newIndex = loop ? 0 : maxIndex
          }
          handled = true
        }
        break

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex - 1
          if (newIndex < 0) {
            newIndex = loop ? maxIndex : 0
          }
          handled = true
        }
        break

      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex + 1
          if (newIndex > maxIndex) {
            newIndex = loop ? 0 : maxIndex
          }
          handled = true
        }
        break

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex - 1
          if (newIndex < 0) {
            newIndex = loop ? maxIndex : 0
          }
          handled = true
        }
        break

      case 'Home':
        newIndex = 0
        handled = true
        break

      case 'End':
        newIndex = maxIndex
        handled = true
        break
    }

    if (handled) {
      event.preventDefault()
      setFocusedIndex(newIndex)
    }
  }

  // Initialize
  setFocusedIndex(initialIndex)

  // Add event listener
  container.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Tab: 'Tab',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
} as const

/**
 * Check if element has keyboard focus
 */
export function hasFocus(element: HTMLElement): boolean {
  return document.activeElement === element
}

/**
 * Move focus to next/previous element
 */
export function moveFocus(direction: 'next' | 'previous', from?: HTMLElement): void {
  const activeElement = from || (document.activeElement as HTMLElement)
  const focusableElements = getFocusableElements(document.body)

  const currentIndex = focusableElements.indexOf(activeElement)
  if (currentIndex === -1)
    return

  const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
  const nextElement = focusableElements[nextIndex]

  if (nextElement) {
    nextElement.focus()
  }
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  if (element.getAttribute('aria-hidden') === 'true') {
    return false
  }

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false
  }

  return true
}

/**
 * ARIA attribute helpers
 */
export const aria = {
  /**
   * Set aria-expanded attribute
   */
  setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', String(expanded))
  },

  /**
   * Set aria-selected attribute
   */
  setSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', String(selected))
  },

  /**
   * Set aria-checked attribute
   */
  setChecked(element: HTMLElement, checked: boolean | 'mixed'): void {
    element.setAttribute('aria-checked', String(checked))
  },

  /**
   * Set aria-disabled attribute
   */
  setDisabled(element: HTMLElement, disabled: boolean): void {
    element.setAttribute('aria-disabled', String(disabled))
    if (disabled) {
      element.setAttribute('tabindex', '-1')
    }
    else {
      element.removeAttribute('tabindex')
    }
  },

  /**
   * Set aria-hidden attribute
   */
  setHidden(element: HTMLElement, hidden: boolean): void {
    if (hidden) {
      element.setAttribute('aria-hidden', 'true')
    }
    else {
      element.removeAttribute('aria-hidden')
    }
  },

  /**
   * Set aria-pressed attribute (for toggle buttons)
   */
  setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', String(pressed))
  },

  /**
   * Set aria-invalid attribute
   */
  setInvalid(element: HTMLElement, invalid: boolean): void {
    element.setAttribute('aria-invalid', String(invalid))
  },

  /**
   * Set aria-required attribute
   */
  setRequired(element: HTMLElement, required: boolean): void {
    element.setAttribute('aria-required', String(required))
  },

  /**
   * Set aria-live region
   */
  setLive(element: HTMLElement, live: AriaLive): void {
    element.setAttribute('aria-live', live)
  },

  /**
   * Set aria-busy attribute
   */
  setBusy(element: HTMLElement, busy: boolean): void {
    element.setAttribute('aria-busy', String(busy))
  },
}

/**
 * Screen reader only text
 *
 * Creates visually hidden text that's accessible to screen readers
 */
export function createScreenReaderText(text: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.textContent = text
  span.className = 'sr-only'

  Object.assign(span.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  })

  return span
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

/**
 * Check if high contrast mode is enabled
 */
export function prefersHighContrast(): boolean {
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-contrast: high)').matches
  }
  return false
}

/**
 * Get color scheme preference
 */
export function getColorSchemePreference(): 'light' | 'dark' | null {
  if (typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  }
  return null
}

/**
 * Skip link helper for keyboard navigation
 *
 * Creates a skip link that appears on focus
 */
export function createSkipLink(targetId: string, text = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.textContent = text
  link.className = 'skip-link'

  Object.assign(link.style, {
    position: 'absolute',
    top: '-40px',
    left: '0',
    background: '#000',
    color: '#fff',
    padding: '8px',
    textDecoration: 'none',
    zIndex: '100',
  })

  link.addEventListener('focus', () => {
    link.style.top = '0'
  })

  link.addEventListener('blur', () => {
    link.style.top = '-40px'
  })

  return link
}

/**
 * Validate ARIA relationships
 *
 * Ensures aria-labelledby, aria-describedby, etc. reference valid IDs
 */
export function validateAriaRelationships(element: HTMLElement): string[] {
  const errors: string[] = []

  const checkAttribute = (attr: string) => {
    const value = element.getAttribute(attr)
    if (value) {
      const ids = value.split(' ')
      for (const id of ids) {
        if (!document.getElementById(id)) {
          errors.push(`${attr} references non-existent ID: ${id}`)
        }
      }
    }
  }

  checkAttribute('aria-labelledby')
  checkAttribute('aria-describedby')
  checkAttribute('aria-controls')
  checkAttribute('aria-owns')
  checkAttribute('aria-activedescendant')

  return errors
}
