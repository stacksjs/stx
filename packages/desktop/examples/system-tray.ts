/**
 * System Tray / Menubar Example
 *
 * This example demonstrates how to create a system tray application
 * with a menu and icon.
 *
 * Note: This is a placeholder implementation. Full system tray functionality
 * will be available in a future release.
 *
 * To run this example:
 *   bun run examples/system-tray.ts
 */

import { createSystemTray, createMenubar } from '../src/index'

async function main() {
  console.log('🔔 Creating a system tray application...\n')

  // Create a system tray with menu items
  const tray = await createSystemTray({
    icon: '/path/to/icon.png', // Path to your icon file
    tooltip: 'My Stacks App',
    menu: [
      {
        label: 'Open Dashboard',
        action: () => {
          console.log('Opening dashboard...')
        },
      },
      {
        label: 'Settings',
        action: () => {
          console.log('Opening settings...')
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        action: () => {
          console.log('Quitting application...')
          process.exit(0)
        },
      },
    ],
  })

  if (tray) {
    console.log(`✓ System tray created successfully!`)
    console.log(`  Tray ID: ${tray.id}`)
    console.log(`  Tooltip: "My Stacks App"\n`)

    console.log('💡 System tray is now running.')
    console.log('   Right-click the tray icon to see the menu.\n')

    // You can interact with the tray instance:
    // tray.setIcon('/new/icon.png')        // Change the icon
    // tray.setTooltip('New tooltip')       // Change the tooltip
    // tray.setMenu([...])                  // Update the menu
    // tray.destroy()                       // Remove the tray icon

    // Alternative: createMenubar is an alias for createSystemTray
    // const menubar = await createMenubar({ ... })
  }
  else {
    console.warn('⚠ System tray functionality not yet implemented')
    console.log('  This is a placeholder example showing the intended API.')
  }
}

// Run the example
main().catch(console.error)
