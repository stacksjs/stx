/**
 * Development Server Integration Example
 *
 * This example demonstrates how to integrate the desktop package
 * with a development server, similar to how `stx dev --native` works.
 *
 * This is the pattern used internally by the stx CLI.
 *
 * To run this example:
 *   bun run examples/dev-server-integration.ts
 */

import { openDevWindow } from '../src/index'

async function main() {
  console.log('🚀 Development Server Integration Example\n')

  // Simulate a dev server running on port 3000
  const port = 3000

  console.log(`📡 Assuming dev server is running on http://localhost:${port}/`)
  console.log(`   (In real usage, start your dev server first)\n`)

  // Open a native window pointing to the dev server
  console.log('⚡ Opening native window...\n')

  const success = await openDevWindow(port, {
    title: 'stx Development',
    width: 1400,
    height: 900,
    darkMode: true,
    hotReload: true,
  })

  if (success) {
    console.log('\n✓ Native window opened successfully!')
    console.log('\n💡 The window is now running and connected to your dev server.')
    console.log('   Any changes to your code should trigger hot reload.')
    console.log('   Close the window manually when done.\n')

    // In a real dev server, you might want to:
    // - Watch for file changes
    // - Rebuild on changes
    // - Send reload signals to the window
    // - Handle window close events
  }
  else {
    console.error('\n✗ Failed to open native window')
    console.error('\nPossible issues:')
    console.error('  1. Zyte binary not built (will build automatically on first run)')
    console.error('  2. Dev server not running on port', port)
    console.error('  3. System dependencies missing\n')
  }
}

// Example: How stx CLI uses this
async function exampleStxUsage() {
  console.log('\n📚 Example: How stx CLI uses openDevWindow()\n')
  console.log('```typescript')
  console.log('// In packages/stx/src/dev-server.ts:')
  console.log('import { openDevWindow } from "@stacksjs/desktop"')
  console.log('')
  console.log('async function openNativeWindow(port: number) {')
  console.log('  try {')
  console.log('    const success = await openDevWindow(port, {')
  console.log('      title: "stx Development",')
  console.log('      width: 1400,')
  console.log('      height: 900,')
  console.log('      darkMode: true,')
  console.log('      hotReload: true,')
  console.log('    })')
  console.log('    return success')
  console.log('  }')
  console.log('  catch (error) {')
  console.log('    console.error("Could not open native window:", error)')
  console.log('    return false')
  console.log('  }')
  console.log('}')
  console.log('```\n')
  console.log('Then called when user runs: stx dev file.stx --native\n')
}

// Run the example
main()
  .then(() => exampleStxUsage())
  .catch(console.error)
