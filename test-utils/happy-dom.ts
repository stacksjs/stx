/**
 * Shared VeryHappyDOM setup for all packages in the workspace
 * This file is preloaded by Bun test to provide a DOM environment
 */

import { Window } from 'very-happy-dom'

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
globalThis.Event = window.Event as any
globalThis.MouseEvent = window.MouseEvent as any
globalThis.KeyboardEvent = window.KeyboardEvent as any
globalThis.CustomEvent = window.CustomEvent as any
globalThis.DOMParser = window.DOMParser as any

// Add __dispatchEvent_safe method to Element prototype for tests
// This is a safer version of dispatchEvent that handles errors gracefully
if (typeof Element !== 'undefined') {
  (Element.prototype as any).__dispatchEvent_safe = function (event: Event): boolean {
    try {
      return this.dispatchEvent(event)
    }
    catch (error) {
      console.error('Error dispatching event:', error)
      return false
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
