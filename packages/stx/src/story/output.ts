/**
 * STX Story - Pretty terminal output
 * ANSI color codes for terminal styling without external dependencies
 */

import process from 'node:process'

// ANSI escape codes
const ESC = '\x1B['
const RESET = `${ESC}0m`

// Colors
const colors = {
  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,
  // Bright colors
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
  brightWhite: `${ESC}97m`,
}

// Styles
const styles = {
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  inverse: `${ESC}7m`,
  strikethrough: `${ESC}9m`,
}

/**
 * Apply color to text
 */
export function color(text: string, colorName: keyof typeof colors): string {
  return `${colors[colorName]}${text}${RESET}`
}

/**
 * Apply style to text
 */
export function style(text: string, styleName: keyof typeof styles): string {
  return `${styles[styleName]}${text}${RESET}`
}

// Convenience functions
export const red = (text: string): string => color(text, 'red')
export const green = (text: string): string => color(text, 'green')
export const yellow = (text: string): string => color(text, 'yellow')
export const blue = (text: string): string => color(text, 'blue')
export const magenta = (text: string): string => color(text, 'magenta')
export const cyan = (text: string): string => color(text, 'cyan')
export const white = (text: string): string => color(text, 'white')
export const gray = (text: string): string => color(text, 'gray')

export const bold = (text: string): string => style(text, 'bold')
export const dim = (text: string): string => style(text, 'dim')
export const italic = (text: string): string => style(text, 'italic')
export const underline = (text: string): string => style(text, 'underline')

/**
 * Print the STX Story banner
 */
export function printBanner(): void {
  console.log('')
  console.log(cyan('  ╔═══════════════════════════════════════╗'))
  console.log(cyan('  ║') + bold('         📖 STX Story                  ') + cyan('║'))
  console.log(cyan('  ║') + dim('    Component Showcase & Testing       ') + cyan('║'))
  console.log(cyan('  ╚═══════════════════════════════════════╝'))
  console.log('')
}

/**
 * Print server URLs
 */
export function printServerUrls(url: string, networkUrl?: string): void {
  console.log(bold('  Server running at:'))
  console.log('')
  console.log(`  ${dim('➜')}  ${bold('Local:')}   ${cyan(url)}`)
  if (networkUrl) {
    console.log(`  ${dim('➜')}  ${bold('Network:')} ${cyan(networkUrl)}`)
  }
  console.log('')
}

/**
 * Print story count
 */
export function printStoryCount(count: number): void {
  const icon = count > 0 ? '✓' : '○'
  const countColor = count > 0 ? green : yellow
  console.log(`  ${countColor(icon)} Found ${bold(String(count))} story ${count === 1 ? 'file' : 'files'}`)
}

/**
 * Print file change event
 */
export function printFileChange(event: string, file: string): void {
  const icons: Record<string, string> = {
    add: green('+'),
    change: yellow('~'),
    unlink: red('-'),
  }
  const icon = icons[event] || '•'
  console.log(`  ${icon} ${dim(`[${event}]`)} ${file}`)
}

/**
 * Print error message
 */
export function printError(message: string, details?: string): void {
  console.log('')
  console.log(`  ${red('✗')} ${bold(red('Error:'))} ${message}`)
  if (details) {
    console.log(`    ${dim(details)}`)
  }
  console.log('')
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.log(`  ${yellow('⚠')} ${yellow('Warning:')} ${message}`)
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(`  ${green('✓')} ${message}`)
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.log(`  ${blue('ℹ')} ${message}`)
}

/**
 * Print build summary
 */
export function printBuildSummary(
  storyCount: number,
  outDir: string,
  duration: number,
): void {
  console.log('')
  console.log(cyan('  ╔═══════════════════════════════════════╗'))
  console.log(cyan('  ║') + bold('           Build Complete              ') + cyan('║'))
  console.log(cyan('  ╚═══════════════════════════════════════╝'))
  console.log('')
  console.log(`  ${green('✓')} Stories:  ${bold(String(storyCount))}`)
  console.log(`  ${green('✓')} Output:   ${bold(outDir)}`)
  console.log(`  ${green('✓')} Time:     ${bold(`${duration}ms`)}`)
  console.log('')
}

/**
 * Print test summary
 */
export function printTestSummary(
  total: number,
  passed: number,
  failed: number,
  duration: number,
): void {
  console.log('')
  console.log(cyan('  ╔═══════════════════════════════════════╗'))
  console.log(cyan('  ║') + bold('           Test Results                ') + cyan('║'))
  console.log(cyan('  ╚═══════════════════════════════════════╝'))
  console.log('')
  console.log(`  Total:   ${bold(String(total))}`)
  console.log(`  Passed:  ${green(String(passed))} ${green('✓')}`)
  if (failed > 0) {
    console.log(`  Failed:  ${red(String(failed))} ${red('✗')}`)
  }
  console.log(`  Time:    ${bold(`${duration}ms`)}`)
  console.log('')
}

/**
 * Print keyboard shortcuts help
 */
export function printHelp(): void {
  console.log('')
  console.log(bold('  Keyboard Shortcuts:'))
  console.log('')
  console.log(`  ${cyan('h')}  Show this help`)
  console.log(`  ${cyan('o')}  Open in browser`)
  console.log(`  ${cyan('r')}  Restart server`)
  console.log(`  ${cyan('c')}  Clear console`)
  console.log(`  ${cyan('q')}  Quit`)
  console.log('')
}

/**
 * Clear the console
 */
export function clearConsole(): void {
  process.stdout.write('\x1Bc')
}

/**
 * Create a spinner
 */
export function createSpinner(text: string): {
  start: () => void
  stop: (success?: boolean) => void
  update: (newText: string) => void
} {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let frameIndex = 0
  let interval: ReturnType<typeof setInterval> | null = null
  let currentText = text

  return {
    start() {
      interval = setInterval(() => {
        process.stdout.write(`\r  ${cyan(frames[frameIndex])} ${currentText}`)
        frameIndex = (frameIndex + 1) % frames.length
      }, 80)
    },
    stop(success = true) {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      const icon = success ? green('✓') : red('✗')
      process.stdout.write(`\r  ${icon} ${currentText}\n`)
    },
    update(newText: string) {
      currentText = newText
    },
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000)
    return `${ms}ms`
  if (ms < 60000)
    return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}

/**
 * Format file size in human-readable format
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
