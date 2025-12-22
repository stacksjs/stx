/**
 * Keyboard Shortcuts Module
 * Handles keyboard input for dev server control
 */

import process from 'node:process'
import { colors } from './terminal-colors'

/**
 * Keyboard shortcut command handlers
 */
export interface KeyboardCommandHandlers {
  onOpen?: () => void
  onClear?: () => void
  onQuit?: () => void
  onHelp?: () => void
}

/**
 * Print keyboard shortcuts help
 */
export function printShortcutsHelp(): void {
  console.log('\nKeyboard shortcuts:')
  console.log(`  ${colors.cyan}o${colors.reset} + Enter - Open in browser`)
  console.log(`  ${colors.cyan}c${colors.reset} + Enter - Clear console`)
  console.log(`  ${colors.cyan}q${colors.reset} + Enter (or ${colors.cyan}Ctrl+C${colors.reset}) - Quit server`)
  console.log(`  ${colors.cyan}h${colors.reset} + Enter - Show this help`)
}

/**
 * Print server status with URL
 */
export function printServerStatus(serverUrl: string): void {
  console.log(`${colors.green}Server running at ${colors.cyan}${serverUrl}${colors.reset}`)
  console.log(`Press ${colors.cyan}Ctrl+C${colors.reset} to stop the server`)
  printShortcutsHelp()
}

/**
 * Open URL in the default browser
 */
export function openInBrowser(url: string): void {
  console.log(`${colors.dim}Opening ${colors.cyan}${url}${colors.dim} in your browser...${colors.reset}`)
  Bun.spawn(['open', url], { stderr: 'inherit' })
}

/**
 * Setup keyboard shortcuts for the server
 * Enables raw mode for handling single keystrokes
 *
 * @param serverUrl - The URL of the dev server
 * @param stopServer - Function to call when stopping the server
 * @param customHandlers - Optional custom command handlers
 */
export function setupKeyboardShortcuts(
  serverUrl: string,
  stopServer: () => void,
  customHandlers?: KeyboardCommandHandlers,
): void {
  // Only setup shortcuts if stdin is a TTY (interactive terminal)
  if (!process.stdin.isTTY) {
    return
  }

  // Set up raw mode for handling keyboard input
  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.resume()

  printShortcutsHelp()

  let buffer = ''

  process.stdin.on('data', (key: string) => {
    // Handle Ctrl+C
    if (key === '\u0003') {
      if (customHandlers?.onQuit) {
        customHandlers.onQuit()
      }
      stopServer()
      process.exit(0)
    }

    buffer += key

    // Check for command sequences (command + Enter)
    if (buffer.endsWith('\r') || buffer.endsWith('\n')) {
      const cmd = buffer.trim().toLowerCase()
      buffer = ''

      handleCommand(cmd, serverUrl, stopServer, customHandlers)
    }
  })
}

/**
 * Handle a keyboard command
 */
function handleCommand(
  cmd: string,
  serverUrl: string,
  stopServer: () => void,
  customHandlers?: KeyboardCommandHandlers,
): void {
  switch (cmd) {
    case 'o':
      // Open in browser
      if (customHandlers?.onOpen) {
        customHandlers.onOpen()
      }
      else {
        openInBrowser(serverUrl)
      }
      break

    case 'c':
      // Clear console
      if (customHandlers?.onClear) {
        customHandlers.onClear()
      }
      else {
        console.clear()
        printServerStatus(serverUrl)
      }
      break

    case 'q':
      // Quit server
      if (customHandlers?.onQuit) {
        customHandlers.onQuit()
      }
      console.log(`${colors.yellow}Stopping server...${colors.reset}`)
      stopServer()
      process.exit(0)
      break

    case 'h':
      // Show help
      if (customHandlers?.onHelp) {
        customHandlers.onHelp()
      }
      else {
        printShortcutsHelp()
      }
      break

    default:
      // Unknown command, ignore
      break
  }
}

/**
 * Cleanup keyboard shortcuts (restore terminal state)
 */
export function cleanupKeyboardShortcuts(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
    process.stdin.pause()
  }
}
