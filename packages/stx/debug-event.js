import { Window } from 'happy-dom'

// Set up DOM
const window = new Window()
const document = window.document
globalThis.window = window
globalThis.document = document

// Create a test element
const testElement = document.createElement('div')
let listenerCalled = false

// Add an event listener
testElement.addEventListener('click', () => {
  listenerCalled = true
  console.warn('Listener called!')
})

// Inspect the element's internal structure
console.warn('Element properties:', Object.getOwnPropertyNames(testElement))
console.warn('Element _eventListeners:', testElement._eventListeners)
console.warn('Element prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(testElement)))

// Try to find where listeners are stored
for (const prop of Object.getOwnPropertyNames(testElement)) {
  if (prop.includes('event') || prop.includes('listener')) {
    console.warn(`Found ${prop}:`, testElement[prop])
  }
}

// Try to manually trigger the event
try {
  const event = new window.Event('click')
  testElement.dispatchEvent(event)
  console.warn('dispatchEvent worked, listener called:', listenerCalled)
}
catch (error) {
  console.error('dispatchEvent failed:', error.message)
}
