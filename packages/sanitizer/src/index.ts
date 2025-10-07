/**
 * @stacksjs/sanitizer
 *
 * A fast, native Bun-powered HTML sanitizer with DOMPurify-like features.
 * Protection against XSS and malicious content.
 */

// Default export
import { sanitize } from './sanitizer'

export * from './presets'
export { basic, getPreset, markdown, relaxed, strict } from './presets'
export * from './sanitizer'

// Re-export for convenience
export { escape, isSafe, sanitize, sanitizeWithInfo, stripTags } from './sanitizer'
export * from './types'

export default sanitize
