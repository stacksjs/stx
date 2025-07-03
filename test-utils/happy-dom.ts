import { Window } from 'happy-dom'

// Set up DOM globals using happy-dom
const window = new Window()
const document = window.document

// Register globals
global.window = window as any
global.document = document as any
global.HTMLElement = window.HTMLElement as any
global.Document = window.Document as any
global.DOMParser = window.DOMParser as any

// Add any additional global setup for tests
global.fetch = global.fetch || (() => Promise.reject(new Error('fetch not implemented')))

// Add safe event dispatch helper to avoid happy-dom readonly property issues
Object.defineProperty(window.Element.prototype, '__dispatchEvent_safe', {
  value: function(event: Event) {
    // For happy-dom, manually trigger event listeners due to readonly property issues
    const eventType = event.type
    
    // Get all event listeners for this event type from happy-dom's internal structure
    const listeners = (this as any)._listeners?.[eventType] || []
    
    // Create a proper event object
    const eventObj = {
      type: eventType,
      target: this,
      currentTarget: this,
      bubbles: event.bubbles || false,
      cancelable: event.cancelable || false,
      preventDefault: () => {},
      stopPropagation: () => {},
      stopImmediatePropagation: () => {}
    }
    
    // Manually call each event listener
    listeners.forEach((listener: any) => {
      try {
        if (typeof listener === 'function') {
          listener.call(this, eventObj)
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent.call(listener, eventObj)
        }
      } catch (e) {
        // Continue processing other listeners even if one fails
        console.warn(`Event listener error for ${eventType}:`, e)
      }
    })
    
    // For specific events, also trigger the native behavior
    if (eventType === 'click' && typeof (this as any).click === 'function') {
      try {
        // Don't call click() as it might cause recursion, just ensure the event was processed
      } catch (e) {
        // Ignore click errors
      }
    }
    
    return true
  },
  writable: false,
  enumerable: false,
  configurable: false
}) 