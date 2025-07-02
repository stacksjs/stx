import { Window } from 'happy-dom'

// Set up DOM
const window = new Window()
const document = window.document
global.window = window
global.document = document

// Create a test element
const testElement = document.createElement('div')
let listenerCalled = false

// Add an event listener
testElement.addEventListener('click', () => {
  listenerCalled = true
  console.log('Listener called!')
})

// Inspect the element's internal structure
console.log('Element properties:', Object.getOwnPropertyNames(testElement))
console.log('Element _eventListeners:', testElement._eventListeners)
console.log('Element prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(testElement)))

// Try to find where listeners are stored
for (const prop of Object.getOwnPropertyNames(testElement)) {
  if (prop.includes('event') || prop.includes('listener')) {
    console.log(`Found ${prop}:`, testElement[prop])
  }
}

// Try to manually trigger the event
try {
  const event = new window.Event('click')
  testElement.dispatchEvent(event)
  console.log('dispatchEvent worked, listener called:', listenerCalled)
} catch (error) {
  console.log('dispatchEvent failed:', error.message)
} 