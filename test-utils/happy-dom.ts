/**
 * Shared VeryHappyDOM setup for all packages in the workspace
 * This file is preloaded by Bun test to provide a DOM environment
 */

import { Window, VirtualEvent, CustomEvent as VirtualCustomEvent } from 'very-happy-dom'

// Create and setup the global window
const window = new Window()
const document = window.document

// Setup global variables
globalThis.window = window as any
globalThis.document = document as any
globalThis.navigator = window.navigator as any
globalThis.location = window.location as any
globalThis.HTMLElement = window.HTMLElement as any
globalThis.Element = window.Element as any
globalThis.Node = window.Node as any

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
const elementProto = (window.Element?.prototype || globalThis.Element?.prototype) as any

// Only add polyfills if Element prototype is available
if (elementProto) {
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
  if (!Object.getOwnPropertyDescriptor(elementProto, 'value')) {
    Object.defineProperty(elementProto, 'value', {
      get(this: Element) {
        return this.getAttribute('value') || ''
      },
      set(this: Element, value: string) {
        this.setAttribute('value', value)
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
}

// Mock IntersectionObserver for tests (if not implemented in very-happy-dom)
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      // Store callback and options if needed for testing
    }

    observe(target: Element) {
      // Mock implementation - immediately call callback as if element is visible
    }

    unobserve(target: Element) {
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
