/**
 * Modal Dialog Examples
 *
 * This example demonstrates different types of modal dialogs
 * that can be displayed in your desktop application.
 *
 * Note: This is a placeholder implementation. Full modal functionality
 * will be available in a future release.
 *
 * To run this example:
 *   bun run examples/modal-demo.ts
 */

import {
  showErrorModal,
  showInfoModal,
  showModal,
  showQuestionModal,
  showSuccessModal,
  showWarningModal,
} from '../src/index'

async function main() {
  console.log('📋 Modal Dialog Examples\n')

  // 1. Info Modal
  console.log('1️⃣ Info Modal')
  const infoResult = await showInfoModal(
    'Information',
    'This is an informational message.',
  )
  console.log(`   Result: ${infoResult.cancelled ? 'Cancelled' : 'OK'}\n`)

  // 2. Success Modal
  console.log('2️⃣ Success Modal')
  const successResult = await showSuccessModal(
    'Success!',
    'Your operation completed successfully.',
  )
  console.log(`   Result: ${successResult.cancelled ? 'Cancelled' : 'OK'}\n`)

  // 3. Warning Modal
  console.log('3️⃣ Warning Modal')
  const warningResult = await showWarningModal(
    'Warning',
    'This action may have consequences.',
  )
  console.log(`   Result: ${warningResult.cancelled ? 'Cancelled' : 'OK'}\n`)

  // 4. Error Modal
  console.log('4️⃣ Error Modal')
  const errorResult = await showErrorModal(
    'Error',
    'An error occurred while processing your request.',
  )
  console.log(`   Result: ${errorResult.cancelled ? 'Cancelled' : 'OK'}\n`)

  // 5. Question Modal
  console.log('5️⃣ Question Modal')
  const questionResult = await showQuestionModal(
    'Confirm Action',
    'Are you sure you want to proceed?',
  )
  console.log(`   Result: ${questionResult.cancelled ? 'Cancelled' : 'OK'}\n`)

  // 6. Custom Modal with Multiple Buttons
  console.log('6️⃣ Custom Modal with Multiple Buttons')
  const customResult = await showModal({
    title: 'Choose an Option',
    message: 'What would you like to do?',
    type: 'question',
    buttons: [
      {
        label: 'Save',
        style: 'primary',
        action: () => console.log('Save clicked'),
      },
      {
        label: 'Discard',
        style: 'destructive',
        action: () => console.log('Discard clicked'),
      },
      {
        label: 'Cancel',
        style: 'default',
        action: () => console.log('Cancel clicked'),
      },
    ],
    defaultButton: 0, // Save button is default
    cancelButton: 2, // Cancel button closes the modal
  })
  console.log(`   Button clicked: ${customResult.buttonIndex}`)
  console.log(`   Cancelled: ${customResult.cancelled}\n`)

  console.log('✓ All modal examples completed!')
  console.log('\n💡 Note: These are placeholder implementations.')
  console.log('   Full modal functionality coming in a future release.')
}

// Run the example
main().catch(console.error)
