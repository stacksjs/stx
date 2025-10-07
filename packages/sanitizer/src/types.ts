/**
 * Sanitizer configuration options
 */
export interface SanitizerOptions {
  /** Allowed HTML tags */
  allowedTags?: string[]
  /** Allowed HTML attributes (global or per-tag) */
  allowedAttributes?: Record<string, string[]> | string[]
  /** Allowed URL schemes for links and other URL attributes */
  allowedSchemes?: string[]
  /** Allowed CSS properties (for style attributes) */
  allowedStyles?: string[]
  /** Allow data attributes */
  allowDataAttributes?: boolean
  /** Allow aria attributes */
  allowAriaAttributes?: boolean
  /** Custom URL validator */
  urlValidator?: (url: string) => boolean
  /** Remove disallowed tags instead of escaping */
  stripTags?: boolean
  /** Keep HTML comments */
  allowComments?: boolean
  /** Transform function for tags */
  transformTag?: (tagName: string, attributes: Record<string, string>) => { tagName: string, attributes: Record<string, string> } | null
}

/**
 * Preset configurations
 */
export type SanitizerPreset = 'strict' | 'basic' | 'relaxed' | 'markdown'

/**
 * HTML sanitization result
 */
export interface SanitizeResult {
  /** Sanitized HTML */
  html: string
  /** Whether any content was removed/modified */
  modified: boolean
  /** List of removed tags */
  removedTags?: string[]
  /** List of removed attributes */
  removedAttributes?: string[]
}
