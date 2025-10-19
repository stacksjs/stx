/**
 * Shared VeryHappyDOM setup for all packages in the workspace
 * This file is preloaded by Bun test to provide a DOM environment
 */

import { CustomEvent as VirtualCustomEvent, VirtualElement, VirtualEvent, Window } from 'very-happy-dom'

// Create and setup the global window
const window = new Window()
const document = window.document

// Setup global variables
globalThis.window = window as any
globalThis.document = document as any
globalThis.navigator = window.navigator as any
globalThis.location = (window as any).location as any
globalThis.HTMLElement = (window as any).HTMLElement as any
globalThis.Element = VirtualElement as any
globalThis.Node = (window as any).Node as any

// Use VirtualEvent as Event polyfill since very-happy-dom doesn't expose window.Event
globalThis.Event = VirtualEvent as any
globalThis.MouseEvent = VirtualEvent as any
globalThis.KeyboardEvent = VirtualEvent as any
globalThis.CustomEvent = VirtualCustomEvent as any

// Add HTMLInputElement if not available
if (!globalThis.HTMLInputElement) {
  globalThis.HTMLInputElement = window.HTMLElement as any
}

// Add property reflection for common HTMLInput/TextArea attributes
// very-happy-dom doesn't implement these as properties, only as attributes
const elementProto = VirtualElement.prototype as any

// Add polyfills to VirtualElement prototype
if (elementProto) {
  // Add id property to reflect the id attribute
  if (!Object.getOwnPropertyDescriptor(elementProto, 'id')) {
    Object.defineProperty(elementProto, 'id', {
      get(this: Element) {
        return this.getAttribute('id') || ''
      },
      set(this: Element, value: string) {
        if (value) {
          this.setAttribute('id', value)
        }
        else {
          this.removeAttribute('id')
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add className property to reflect the class attribute
  if (!Object.getOwnPropertyDescriptor(elementProto, 'className')) {
    Object.defineProperty(elementProto, 'className', {
      get(this: Element) {
        return this.getAttribute('class') || ''
      },
      set(this: Element, value: string) {
        if (value) {
          this.setAttribute('class', value)
        }
        else {
          this.removeAttribute('class')
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add name property
  if (!Object.getOwnPropertyDescriptor(elementProto, 'name')) {
    Object.defineProperty(elementProto, 'name', {
      get(this: Element) {
        return this.getAttribute('name') || ''
      },
      set(this: Element, value: string) {
        if (value) {
          this.setAttribute('name', value)
        }
        else {
          this.removeAttribute('name')
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add type property
  if (!Object.getOwnPropertyDescriptor(elementProto, 'type')) {
    Object.defineProperty(elementProto, 'type', {
      get(this: Element) {
        return this.getAttribute('type') || ''
      },
      set(this: Element, value: string) {
        if (value) {
          this.setAttribute('type', value)
        }
        else {
          this.removeAttribute('type')
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  if (!Object.getOwnPropertyDescriptor(elementProto, 'placeholder')) {
    Object.defineProperty(elementProto, 'placeholder', {
      get(this: Element) {
        return this.getAttribute('placeholder') || ''
      },
      set(this: Element, value: string) {
        this.setAttribute('placeholder', value)
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add value property if not present
  // For input/textarea/select elements, value should be independent of the attribute
  if (!Object.getOwnPropertyDescriptor(elementProto, 'value')) {
    const valueStorage = new WeakMap<Element, string>()

    Object.defineProperty(elementProto, 'value', {
      get(this: Element) {
        const element = this as any

        // For SELECT elements, value comes from the selected option
        if (element.tagName === 'SELECT') {
          const options = this.querySelectorAll('option')
          for (const opt of Array.from(options)) {
            if ((opt as any).selected) {
              return (opt as any).value || (opt as Element).textContent || ''
            }
          }
          return ''
        }

        // For input/textarea, use internal storage
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          // Initialize from attribute only if not yet set
          if (!valueStorage.has(this)) {
            const attrValue = this.getAttribute('value')
            valueStorage.set(this, attrValue || '')
          }
          return valueStorage.get(this) || ''
        }

        // For other elements, fall back to attribute
        return this.getAttribute('value') || ''
      },
      set(this: Element, value: string) {
        const element = this as any

        // For SELECT elements, set the selected option
        if (element.tagName === 'SELECT') {
          const options = this.querySelectorAll('option')
          for (const opt of Array.from(options)) {
            const optValue = (opt as any).value || (opt as Element).textContent || ''
            ;(opt as any).selected = (optValue === value)
          }
        }
        // For input/textarea, use internal storage
        else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          valueStorage.set(this, value)
        }
        else {
          this.setAttribute('value', value)
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add checked property for checkboxes/radios
  if (!Object.getOwnPropertyDescriptor(elementProto, 'checked')) {
    Object.defineProperty(elementProto, 'checked', {
      get(this: Element) {
        return this.hasAttribute('checked')
      },
      set(this: Element, value: boolean) {
        if (value) {
          this.setAttribute('checked', '')
        }
        else {
          this.removeAttribute('checked')
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add __dispatchEvent_safe method to Element prototype for tests
  // This is a safer version of dispatchEvent that handles errors gracefully
  if (!elementProto.__dispatchEvent_safe) {
    elementProto.__dispatchEvent_safe = function (event: Event): boolean {
      try {
        return this.dispatchEvent(event)
      }
      catch (error) {
        console.error('Error dispatching event:', error)
        return false
      }
    }
  }

  // Add options property for select elements
  if (!Object.getOwnPropertyDescriptor(elementProto, 'options')) {
    Object.defineProperty(elementProto, 'options', {
      get(this: Element) {
        if (this.tagName !== 'SELECT')
          return undefined
        return this.querySelectorAll('option')
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add reset method for form elements
  if (!elementProto.reset) {
    elementProto.reset = function (this: Element) {
      if (this.tagName !== 'FORM')
        return
      // Reset all form inputs
      const inputs = this.querySelectorAll('input, select, textarea')
      inputs.forEach((input: Element) => {
        const inputEl = input as any
        if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
          inputEl.checked = false
        }
        else {
          inputEl.value = ''
        }
      })
    }
  }

  // Add selectedIndex property for select elements
  if (!Object.getOwnPropertyDescriptor(elementProto, 'selectedIndex')) {
    Object.defineProperty(elementProto, 'selectedIndex', {
      get(this: Element) {
        if (this.tagName !== 'SELECT')
          return -1
        const options = this.querySelectorAll('option')
        for (let i = 0; i < options.length; i++) {
          if ((options[i] as any).selected) {
            return i
          }
        }
        return -1
      },
      set(this: Element, index: number) {
        if (this.tagName !== 'SELECT')
          return
        const options = this.querySelectorAll('option')
        options.forEach((opt: Element, i: number) => {
          (opt as any).selected = (i === index)
        })
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add selected property for option elements
  if (!Object.getOwnPropertyDescriptor(elementProto, 'selected')) {
    Object.defineProperty(elementProto, 'selected', {
      get(this: Element) {
        if (this.tagName !== 'OPTION')
          return false
        return this.hasAttribute('selected')
      },
      set(this: Element, value: boolean) {
        if (this.tagName !== 'OPTION')
          return
        if (value) {
          this.setAttribute('selected', '')
        }
        else {
          this.removeAttribute('selected')
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add remove method for elements
  if (!elementProto.remove) {
    elementProto.remove = function (this: Element) {
      if (this.parentNode) {
        this.parentNode.removeChild(this)
      }
    }
  }

  // Add closest method if not present
  if (!elementProto.closest) {
    elementProto.closest = function (selector: string): Element | null {
      let element: Element | null = this as Element
      while (element) {
        if (element.matches && element.matches(selector)) {
          return element
        }
        element = element.parentElement
      }
      return null
    }
  }

  // Override click method to handle form submission for submit buttons
  const originalClick = elementProto.click
  if (originalClick) {
    elementProto.click = function (this: Element) {
      // Call the original click implementation
      originalClick.call(this)

      // If this is a submit button, also trigger form submission
      const element = this as any
      if (element.tagName === 'BUTTON' && element.type === 'submit') {
        // Find the parent form
        const form = element.closest('form')
        if (form) {
          // Dispatch submit event on the form
          const submitEvent = new VirtualEvent('submit', { bubbles: true, cancelable: true })
          form.dispatchEvent(submitEvent)
        }
      }
    }
  }
}

// Mock IntersectionObserver for tests (if not implemented in very-happy-dom)
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
      // Store callback and options if needed for testing
    }

    observe(_target: Element) {
      // Mock implementation - immediately call callback as if element is visible
    }

    unobserve(_target: Element) {
      // Mock implementation
    }

    disconnect() {
      // Mock implementation
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  globalThis.IntersectionObserver = MockIntersectionObserver as any
}

// Add getComputedStyle if not implemented
if (typeof (window as any).getComputedStyle === 'undefined') {
  ;(window as any).getComputedStyle = function (element: Element): CSSStyleDeclaration {
    // very-happy-dom stores inline styles in _internalStyles Map
    const internalStyles = (element as any)._internalStyles as Map<string, string> | undefined

    // Return a proxy that returns values from _internalStyles or defaults
    return new Proxy({}, {
      get(target, prop: string) {
        // Convert camelCase to kebab-case for style property lookup
        const kebabProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)

        // Check internal styles first
        if (internalStyles && internalStyles.has(kebabProp)) {
          return internalStyles.get(kebabProp)
        }

        // Default values for common properties
        if (prop === 'display')
          return 'block'
        if (prop === 'visibility')
          return 'visible'
        if (prop === 'opacity')
          return '1'
        return ''
      },
    }) as CSSStyleDeclaration
  }
}
