/**
 * Alerts and Toast Notifications Examples
 *
 * This example demonstrates different types of alerts and toast notifications
 * that can be displayed in your desktop application.
 *
 * Note: This is a placeholder implementation. Full alert functionality
 * will be available in a future release.
 *
 * To run this example:
 *   bun run examples/alerts-demo.ts
 */

import {
  showAlert,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showToast,
  showWarningToast,
} from '../src/index'

async function main() {
  console.log('🔔 Alerts and Toast Notifications Examples\n')

  // 1. Info Toast
  console.log('1️⃣ Info Toast (3 seconds)')
  await showInfoToast('This is an informational message', 3000)
  console.log('   ✓ Info toast displayed\n')

  // Wait a bit before showing next toast
  await delay(500)

  // 2. Success Toast
  console.log('2️⃣ Success Toast (3 seconds)')
  await showSuccessToast('Operation completed successfully!', 3000)
  console.log('   ✓ Success toast displayed\n')

  await delay(500)

  // 3. Warning Toast
  console.log('3️⃣ Warning Toast (3 seconds)')
  await showWarningToast('Please review your settings', 3000)
  console.log('   ✓ Warning toast displayed\n')

  await delay(500)

  // 4. Error Toast
  console.log('4️⃣ Error Toast (5 seconds)')
  await showErrorToast('An error occurred', 5000)
  console.log('   ✓ Error toast displayed\n')

  await delay(500)

  // 5. Custom Toast with all options
  console.log('5️⃣ Custom Toast (top-right, dark theme, 4 seconds)')
  await showToast({
    title: 'Custom Toast',
    message: 'This is a fully customized toast notification',
    type: 'info',
    duration: 4000,
    position: 'top-right',
    theme: 'dark',
    onClick: () => {
      console.log('   Toast clicked!')
    },
  })
  console.log('   ✓ Custom toast displayed\n')

  await delay(500)

  // 6. Toast with different positions
  console.log('6️⃣ Toasts in Different Positions')

  const positions = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ] as const

  for (const position of positions) {
    await showToast({
      message: `Toast at ${position}`,
      position,
      duration: 2000,
    })
    console.log(`   ✓ Toast at ${position}`)
    await delay(300)
  }
  console.log()

  // 7. Alert with custom styling
  console.log('7️⃣ Custom Alert')
  await showAlert({
    title: 'Important Notice',
    message: 'This is a custom alert with a title',
    type: 'warning',
    duration: 5000,
    position: 'top-center',
    theme: 'auto',
  })
  console.log('   ✓ Custom alert displayed\n')

  console.log('✓ All alert examples completed!')
  console.log('\n💡 Note: These are placeholder implementations.')
  console.log('   Full alert functionality coming in a future release.')
}

// Helper function to add delays between toasts
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run the example
main().catch(console.error)
