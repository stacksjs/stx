/**
 * ANSI color codes for terminal output
 * Provides consistent coloring for CLI messages
 */
export const colors = {
  // Reset
  reset: '\x1B[0m',

  // Text styles
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  underscore: '\x1B[4m',
  blink: '\x1B[5m',
  reverse: '\x1B[7m',
  hidden: '\x1B[8m',

  // Foreground colors
  black: '\x1B[30m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
  white: '\x1B[37m',
  gray: '\x1B[90m',

  // Background colors
  bgBlack: '\x1B[40m',
  bgRed: '\x1B[41m',
  bgGreen: '\x1B[42m',
  bgYellow: '\x1B[43m',
  bgBlue: '\x1B[44m',
  bgMagenta: '\x1B[45m',
  bgCyan: '\x1B[46m',
  bgWhite: '\x1B[47m',
  bgGray: '\x1B[100m',
} as const

export type ColorName = keyof typeof colors

/**
 * Colorize a string with the specified color
 */
export function colorize(text: string, color: ColorName): string {
  return `${colors[color]}${text}${colors.reset}`
}

/**
 * Create a success message (green)
 */
export function success(text: string): string {
  return colorize(text, 'green')
}

/**
 * Create a warning message (yellow)
 */
export function warning(text: string): string {
  return colorize(text, 'yellow')
}

/**
 * Create an error message (red)
 */
export function error(text: string): string {
  return colorize(text, 'red')
}

/**
 * Create an info message (cyan)
 */
export function info(text: string): string {
  return colorize(text, 'cyan')
}

/**
 * Create a dim/muted message (gray)
 */
export function dim(text: string): string {
  return colorize(text, 'gray')
}
