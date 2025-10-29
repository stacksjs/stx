import { spawn } from 'node:child_process'
import process from 'node:process'
import type { ModalOptions, ModalResult } from './types'

/**
 * Show a native modal dialog
 * Uses macOS native dialogs via osascript
 */
export async function showModal(options: ModalOptions): Promise<ModalResult> {
  // Map modal type to AppleScript icon
  const iconMap = {
    info: 'note',
    warning: 'caution',
    error: 'stop',
    success: 'note',
    question: 'note',
  }

  const icon = iconMap[options.type || 'info']
  const title = options.title || 'Message'
  const message = options.message

  // Build buttons array
  let buttons = ['OK']
  if (options.buttons && options.buttons.length > 0) {
    buttons = options.buttons.map(b => b.label)
  }

  // Build AppleScript command
  const buttonList = buttons.map(b => `"${b}"`).join(', ')
  const defaultButton = options.defaultButton !== undefined ? options.defaultButton + 1 : 1

  const script = `
    set dialogResult to display dialog "${message}" ¬
      with title "${title}" ¬
      buttons {${buttonList}} ¬
      default button ${defaultButton} ¬
      with icon ${icon}

    set buttonPressed to button returned of dialogResult
    return buttonPressed
  `

  try {
    const result = await executeAppleScript(script)
    const buttonIndex = buttons.indexOf(result.trim())

    // Check if it was cancelled (happens when user clicks Cancel or presses Escape)
    const cancelIndex = options.cancelButton !== undefined ? options.cancelButton : -1
    const cancelled = buttonIndex === cancelIndex

    return {
      buttonIndex: buttonIndex >= 0 ? buttonIndex : 0,
      cancelled,
    }
  }
  catch (error) {
    // User cancelled the dialog
    return {
      buttonIndex: options.cancelButton !== undefined ? options.cancelButton : 0,
      cancelled: true,
    }
  }
}

/**
 * Execute an AppleScript command
 */
function executeAppleScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'darwin') {
      reject(new Error('Native modals only supported on macOS'))
      return
    }

    const proc = spawn('osascript', ['-e', script])
    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      }
      else {
        reject(new Error(stderr || `osascript exited with code ${code}`))
      }
    })

    proc.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Show an info modal
 */
export async function showInfoModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'info' })
}

/**
 * Show a warning modal
 */
export async function showWarningModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'warning' })
}

/**
 * Show an error modal
 */
export async function showErrorModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'error' })
}

/**
 * Show a success modal
 */
export async function showSuccessModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'success' })
}

/**
 * Show a question modal
 */
export async function showQuestionModal(title: string, message: string): Promise<ModalResult> {
  return showModal({
    title,
    message,
    type: 'question',
    buttons: [
      { label: 'No', style: 'default' },
      { label: 'Yes', style: 'primary' },
    ],
    defaultButton: 1,
    cancelButton: 0,
  })
}
