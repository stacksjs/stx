import { Buffer } from 'node:buffer'

/**
 * CSRF Protection for stx templates
 *
 * Similar to Laravel's CSRF protection, this module provides:
 * - CSRF token generation
 * - A @csrf directive for easy token insertion in forms
 */

import crypto from 'node:crypto'

// Default settings
const DEFAULT_TOKEN_LENGTH = 40
const DEFAULT_INPUT_NAME = '_token'

// Token storage
let csrfToken: string | null = null

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  const token = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
  csrfToken = token
  return token
}

/**
 * Get the current CSRF token, generating one if it doesn't exist
 */
export function getCsrfToken(): string {
  if (!csrfToken) {
    generateCsrfToken()
  }
  return csrfToken!
}

/**
 * Reset the CSRF token (mainly for testing)
 */
export function resetCsrfToken(): void {
  csrfToken = null
}

/**
 * Set a specific CSRF token (useful for server frameworks that have their own token generation)
 */
export function setCsrfToken(token: string): void {
  csrfToken = token
}

/**
 * Generate a CSRF input field HTML
 */
export function csrfField(inputName: string = DEFAULT_INPUT_NAME): string {
  const token = getCsrfToken()
  return `<input type="hidden" name="${inputName}" value="${token}">`
}

/**
 * Process @csrf directives in templates
 */
export function processCsrfDirectives(template: string): string {
  // Replace @csrf with a hidden input field
  return template.replace(/@csrf(?:\((['"])([^'"]*)\1\))?/g, (_, quote, inputName) => {
    return csrfField(inputName || DEFAULT_INPUT_NAME)
  })
}

/**
 * Middleware-like function to verify CSRF token
 */
export function verifyCsrfToken(token: string): boolean {
  if (!csrfToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(csrfToken),
  )
}
