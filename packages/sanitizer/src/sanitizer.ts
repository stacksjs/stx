import type { SanitizeResult, SanitizerOptions, SanitizerPreset } from './types'
import { getPreset } from './presets'

/**
 * Fast, native HTML sanitizer optimized for Bun
 * Provides DOMPurify-like features with performance focus
 */

const DEFAULT_OPTIONS: SanitizerOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowedSchemes: ['http', 'https', 'mailto'],
  allowDataAttributes: false,
  allowAriaAttributes: true,
  stripTags: true,
  allowComments: false,
}

// Dangerous tags that should never be allowed
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'link',
  'meta',
  'style',
]

// URL attributes that need validation
const URL_ATTRIBUTES = [
  'href',
  'src',
  'action',
  'formaction',
  'data',
  'poster',
  'cite',
  'background',
  'longdesc',
]

// Event handler attributes (always removed)
const EVENT_ATTRIBUTES_REGEX = /^on\w+/i

/**
 * Sanitize HTML content
 */
export function sanitize(
  html: string,
  options?: SanitizerOptions | SanitizerPreset,
): string {
  const result = sanitizeWithInfo(html, options)
  return result.html
}

/**
 * Sanitize HTML content with detailed information
 */
export function sanitizeWithInfo(
  html: string,
  options?: SanitizerOptions | SanitizerPreset,
): SanitizeResult {
  // Load preset if string provided
  const opts: SanitizerOptions = typeof options === 'string'
    ? getPreset(options)
    : { ...DEFAULT_OPTIONS, ...options }

  const removedTags: string[] = []
  const removedAttributes: string[] = []

  // Use a simple regex-based parser for performance
  let result = html
  let modified = false

  // Remove comments if not allowed
  if (!opts.allowComments) {
    const commentRegex = /<!--[\s\S]*?-->/g
    if (commentRegex.test(result)) {
      result = result.replace(commentRegex, '')
      modified = true
    }
  }

  // Parse and sanitize tags
  // eslint-disable-next-line regexp/use-ignore-case
  const tagRegex = /<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g
  result = result.replace(tagRegex, (match, closing, tagName, attributesStr) => {
    const lowerTag = tagName.toLowerCase()

    // Always remove dangerous tags
    if (DANGEROUS_TAGS.includes(lowerTag)) {
      if (!removedTags.includes(lowerTag)) {
        removedTags.push(lowerTag)
      }
      modified = true
      return opts.stripTags ? '' : escapeHtml(match)
    }

    // Check if tag is allowed
    const allowedTags = opts.allowedTags || []
    if (allowedTags.length > 0 && !allowedTags.includes(lowerTag)) {
      if (!removedTags.includes(lowerTag)) {
        removedTags.push(lowerTag)
      }
      modified = true
      return opts.stripTags ? '' : escapeHtml(match)
    }

    // For closing tags, just return as-is (already validated by opening tag)
    if (closing) {
      return match
    }

    // Sanitize attributes
    const sanitizedAttrs = sanitizeAttributes(
      attributesStr,
      lowerTag,
      opts,
      removedAttributes,
    )

    if (sanitizedAttrs !== attributesStr) {
      modified = true
    }

    // Transform tag if transformer provided
    if (opts.transformTag) {
      const attributes = parseAttributes(sanitizedAttrs)
      const transformed = opts.transformTag(lowerTag, attributes)

      if (transformed === null) {
        if (!removedTags.includes(lowerTag)) {
          removedTags.push(lowerTag)
        }
        modified = true
        return ''
      }

      if (transformed.tagName !== lowerTag || JSON.stringify(transformed.attributes) !== JSON.stringify(attributes)) {
        modified = true
        return buildTag(transformed.tagName, transformed.attributes)
      }
    }

    return `<${tagName}${sanitizedAttrs}>`
  })

  return {
    html: result,
    modified,
    removedTags: removedTags.length > 0 ? removedTags : undefined,
    removedAttributes: removedAttributes.length > 0 ? removedAttributes : undefined,
  }
}

/**
 * Sanitize attributes
 */
function sanitizeAttributes(
  attributesStr: string,
  tagName: string,
  options: SanitizerOptions,
  removedAttributes: string[],
): string {
  if (!attributesStr.trim()) {
    return attributesStr
  }

  const attributes = parseAttributes(attributesStr)
  const sanitized: Record<string, string> = {}

  for (const [name, value] of Object.entries(attributes)) {
    const lowerName = name.toLowerCase()

    // Remove event handlers
    if (EVENT_ATTRIBUTES_REGEX.test(lowerName)) {
      if (!removedAttributes.includes(lowerName)) {
        removedAttributes.push(lowerName)
      }
      continue
    }

    // Check if attribute is allowed
    if (!isAttributeAllowed(lowerName, tagName, options)) {
      if (!removedAttributes.includes(lowerName)) {
        removedAttributes.push(lowerName)
      }
      continue
    }

    // Validate URL attributes
    if (URL_ATTRIBUTES.includes(lowerName)) {
      if (!isUrlSafe(value, options)) {
        if (!removedAttributes.includes(lowerName)) {
          removedAttributes.push(lowerName)
        }
        continue
      }
    }

    // Sanitize style attribute
    if (lowerName === 'style' && options.allowedStyles) {
      sanitized[name] = sanitizeStyle(value, options.allowedStyles)
    }
    else {
      sanitized[name] = value
    }
  }

  return buildAttributes(sanitized)
}

/**
 * Check if attribute is allowed
 */
function isAttributeAllowed(
  attrName: string,
  tagName: string,
  options: SanitizerOptions,
): boolean {
  const allowedAttrs = options.allowedAttributes

  if (!allowedAttrs) {
    return false
  }

  // Check data attributes
  if (attrName.startsWith('data-')) {
    return options.allowDataAttributes || false
  }

  // Check aria attributes
  if (attrName.startsWith('aria-')) {
    return options.allowAriaAttributes || false
  }

  // Array format (global allowed attributes)
  if (Array.isArray(allowedAttrs)) {
    return allowedAttrs.includes(attrName)
  }

  // Object format (per-tag or global)
  if (allowedAttrs[tagName]?.includes(attrName)) {
    return true
  }

  // Check global attributes (*)
  if (allowedAttrs['*']?.includes(attrName)) {
    return true
  }

  return false
}

/**
 * Validate URL safety
 */
function isUrlSafe(url: string, options: SanitizerOptions): boolean {
  // Use custom validator if provided
  if (options.urlValidator) {
    return options.urlValidator(url)
  }

  // Check for javascript: protocol and other dangerous schemes
  const trimmed = url.trim().toLowerCase()

  // Remove common whitespace/encoding tricks
  // eslint-disable-next-line no-control-regex
  const cleaned = trimmed.replace(/[\s\x00-\x1F]/g, '')

  // Dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:text/html', 'vbscript:', 'file:']
  for (const protocol of dangerousProtocols) {
    if (cleaned.startsWith(protocol)) {
      return false
    }
  }

  // Check allowed schemes
  if (options.allowedSchemes && options.allowedSchemes.length > 0) {
    // Relative URLs are allowed
    if (!cleaned.includes(':')) {
      return true
    }

    const hasAllowedScheme = options.allowedSchemes.some((scheme) => {
      return cleaned.startsWith(`${scheme}:`)
    })

    if (!hasAllowedScheme) {
      return false
    }
  }

  return true
}

/**
 * Sanitize inline styles
 */
function sanitizeStyle(style: string, allowedStyles: string[]): string {
  const properties = style.split(';').filter(p => p.trim())
  const sanitized: string[] = []

  for (const prop of properties) {
    const colonIndex = prop.indexOf(':')
    if (colonIndex === -1)
      continue

    const name = prop.substring(0, colonIndex).trim().toLowerCase()
    const value = prop.substring(colonIndex + 1).trim()

    // Check if property is allowed
    if (allowedStyles.includes(name)) {
      // Additional validation for dangerous values
      if (!value.toLowerCase().includes('javascript:') && !value.toLowerCase().includes('expression(')) {
        sanitized.push(`${name}: ${value}`)
      }
    }
  }

  return sanitized.join('; ')
}

/**
 * Parse HTML attributes from string
 */
function parseAttributes(attributesStr: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const attrRegex = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g

  let match
  // biome-ignore lint/suspicious/noAssignInExpressions: needed for regex matching
  // eslint-disable-next-line no-cond-assign
  while ((match = attrRegex.exec(attributesStr))) {
    const name = match[1]
    const value = match[2] || match[3] || match[4] || ''
    attributes[name] = value
  }

  return attributes
}

/**
 * Build attributes string from object
 */
function buildAttributes(attributes: Record<string, string>): string {
  const parts: string[] = []

  for (const [name, value] of Object.entries(attributes)) {
    if (value === '') {
      parts.push(name)
    }
    else {
      // Escape quotes in value
      const escaped = value.replace(/"/g, '&quot;')
      parts.push(`${name}="${escaped}"`)
    }
  }

  return parts.length > 0 ? ` ${parts.join(' ')}` : ''
}

/**
 * Build tag string from name and attributes
 */
function buildTag(tagName: string, attributes: Record<string, string>): string {
  return `<${tagName}${buildAttributes(attributes)}>`
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Check if HTML content is safe (quick check)
 */
export function isSafe(html: string, options?: SanitizerOptions | SanitizerPreset): boolean {
  const result = sanitizeWithInfo(html, options)
  return !result.modified
}

/**
 * Strip all HTML tags
 */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML for safe display
 */
export function escape(text: string): string {
  return escapeHtml(text)
}
