import process from 'node:process'

/**
 * Returns true when running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Returns true when NOT in production mode, or when debug is enabled.
 * This covers development, test, and unset environments.
 */
export function isDevelopment(): boolean {
  return !isProduction()
    || process.env.STX_DEBUG === 'true'
}
