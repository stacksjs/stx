// Use shared happy-dom configuration
import '../../test-utils/happy-dom'

// Set up DOM globals using happy-dom
const window = new Window()
const document = window.document

// Register globals
global.window = window as any
global.document = document as any
global.HTMLElement = window.HTMLElement as any
global.Document = window.Document as any

// Add any additional global setup for tests
global.fetch = global.fetch || (() => Promise.reject(new Error('fetch not implemented'))) 