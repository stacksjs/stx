/**
 * Basic Window Example
 *
 * This example demonstrates how to create a simple native window
 * that displays a URL.
 *
 * To run this example:
 *   bun run examples/basic-window.ts
 */

import { createWindow } from '../src/index'

async function main() {
  console.log('🚀 Creating a basic native window...\n')

  // Create a window with default options
  const window = await createWindow('https://stacksjs.org', {
    title: 'Stacks - Basic Window Example',
    width: 1200,
    height: 800,
  })

  if (window) {
    console.log(`✓ Window created successfully!`)
    console.log(`  Window ID: ${window.id}`)
    console.log(`  Title: "Stacks - Basic Window Example"`)
    console.log(`  Size: 1200x800\n`)

    // The window is now open and running as a detached process
    console.log('💡 The window is running in the background.')
    console.log('   Close the window manually to exit.\n')

    // You can interact with the window instance:
    // window.show()     // Show the window (already visible by default)
    // window.hide()     // Hide the window
    // window.focus()    // Focus the window
    // window.minimize() // Minimize the window
    // window.maximize() // Maximize the window
    // window.close()    // Close the window
  }
  else {
    console.error('✗ Failed to create window')
    console.error('  Make sure Zyte is built (it will build automatically on first run)')
  }
}

// Run the example
main().catch(console.error)
