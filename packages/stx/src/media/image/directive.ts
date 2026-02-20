/**
 * STX Media - Image Directive
 *
 * @img directive for declarative responsive image rendering.
 *
 * @module media/image/directive
 *
 * @example
 * ```html
 * @img('/images/hero.jpg', 'Hero image', { sizes: '100vw', placeholder: 'thumbhash' })
 * @img('/images/photo.jpg', 'Photo')
 * @img(dynamicSrc, dynamicAlt, { lazy: true })
 * ```
 */

import { defineDirective } from '../../directive-api'
import type { CustomDirective } from '../../types'
import type { ImgDirectiveOptions, ImgProps, PlaceholderStrategy } from '../types'
import { renderImgComponent } from './component'
import { DEFAULT_WIDTHS, DEFAULT_FORMATS } from './srcset'

// =============================================================================
// Directive Definition
// =============================================================================

/**
 * Create the @img directive
 */
export function createImgDirective(): CustomDirective {
  return defineDirective<{
    src: string
    alt: string
    options: ImgDirectiveOptions
  }>({
    name: 'img',
    hasEndTag: false,
    description: 'Render an optimized responsive image with srcset and lazy loading',

    transform: async (content, params, context, filePath) => {
      // Parse arguments from content
      const { src, alt, options } = parseImgArgs(content, params, context)

      if (!src) {
        console.warn('@img directive: missing src argument')
        return '<!-- @img: missing src -->'
      }

      // Build component props
      const props: ImgProps = {
        src,
        alt: alt || '',
        widths: options.widths || DEFAULT_WIDTHS,
        formats: options.formats || DEFAULT_FORMATS,
        quality: options.quality,
        sizes: options.sizes,
        dpr: options.dpr,
        params: options.params,
        placeholder: options.placeholder,
        placeholderOptions: options.placeholderOptions,
        lazy: options.lazy !== false, // Default to true
        priority: options.priority || false,
        loading: options.loading,
        decoding: options.decoding,
        fetchpriority: options.fetchpriority,
        objectFit: options.objectFit,
        objectPosition: options.objectPosition,
        class: options.class,
        style: options.style,
        id: options.id,
        width: options.width,
        height: options.height,
      }

      // Render the component
      const isDev = context.__isDev as boolean || false
      const result = await renderImgComponent(props, { isDev })

      // Combine all outputs
      let output = result.html

      // Add preload link if present
      if (result.preloadLink) {
        output = result.preloadLink + '\n' + output
      }

      // Add styles if present
      if (result.css) {
        output += `\n<style>${result.css}</style>`
      }

      // Add script if present
      if (result.script) {
        output += `\n<script>${result.script}</script>`
      }

      return output
    },

    // Default parameter values
    defaults: {
      src: '',
      alt: '',
      options: {
        lazy: true,
        placeholder: 'none',
      },
    },
  })
}

// =============================================================================
// Argument Parsing
// =============================================================================

/**
 * Parse @img directive arguments
 *
 * Supports:
 * - @img('/path/to/image.jpg', 'Alt text', { options })
 * - @img('/path/to/image.jpg', 'Alt text')
 * - @img('/path/to/image.jpg')
 * - @img(srcVariable, altVariable, optionsVariable)
 */
function parseImgArgs(
  content: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
): { src: string; alt: string; options: ImgDirectiveOptions } {
  // If params already structured, use them
  if (params.src) {
    return {
      src: String(params.src),
      alt: String(params.alt || ''),
      options: (params.options || {}) as ImgDirectiveOptions,
    }
  }

  // Parse from content string: @img('src', 'alt', { options })
  let args = content.trim()

  // Remove @img( prefix and ) suffix if present
  if (args.startsWith('@img(') || args.startsWith('(')) {
    args = args.replace(/^@img\(/, '').replace(/^\(/, '').replace(/\)$/, '')
  }

  // Parse arguments
  const parsed = parseArguments(args)

  // Resolve variable references from context
  let src = resolveValue(parsed[0], context) as string || ''
  let alt = resolveValue(parsed[1], context) as string || ''
  let options: ImgDirectiveOptions = {}

  // Parse options object if present
  if (parsed[2]) {
    const resolvedOptions = resolveValue(parsed[2], context)
    if (typeof resolvedOptions === 'object' && resolvedOptions !== null) {
      options = resolvedOptions as ImgDirectiveOptions
    } else if (typeof parsed[2] === 'string') {
      try {
        options = JSON.parse(parsed[2])
      } catch {
        // Options parsing failed, use empty
      }
    }
  }

  return { src, alt, options }
}

/**
 * Parse comma-separated arguments with proper quote and brace handling
 */
function parseArguments(argsStr: string): unknown[] {
  const args: unknown[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let braceDepth = 0
  let bracketDepth = 0

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]
    const prevChar = i > 0 ? argsStr[i - 1] : ''

    // Handle string delimiters
    if ((char === '"' || char === '\'' || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      } else {
        current += char
      }
      continue
    }

    // Track braces/brackets when not in string
    if (!inString) {
      if (char === '{') braceDepth++
      if (char === '}') braceDepth--
      if (char === '[') bracketDepth++
      if (char === ']') bracketDepth--

      // Comma delimiter at top level
      if (char === ',' && braceDepth === 0 && bracketDepth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
    }

    current += char
  }

  // Push last argument
  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

/**
 * Resolve a value that might be a variable reference
 */
function resolveValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value !== 'string') return value

  // Remove quotes if present
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // Check if it's a variable reference (no quotes, not a path, not an object)
  if (!trimmed.startsWith('/') &&
      !trimmed.startsWith('.') &&
      !trimmed.startsWith('http') &&
      !trimmed.startsWith('{')) {
    const contextValue = context[trimmed]
    if (contextValue !== undefined) {
      return contextValue
    }
  }

  // Try to parse as JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Not valid JSON
    }
  }

  return trimmed
}

// =============================================================================
// Simple Image Directive (fallback)
// =============================================================================

/**
 * Render a simple image without optimization (development fallback)
 */
function renderSimpleImage(
  src: string,
  alt: string,
  options: ImgDirectiveOptions,
): string {
  const attrs: string[] = [`src="${escapeAttr(src)}"`]

  if (alt) attrs.push(`alt="${escapeAttr(alt)}"`)
  if (options.width) attrs.push(`width="${options.width}"`)
  if (options.height) attrs.push(`height="${options.height}"`)
  if (options.class) attrs.push(`class="${escapeAttr(options.class)}"`)
  if (options.style) attrs.push(`style="${escapeAttr(options.style)}"`)
  if (options.id) attrs.push(`id="${escapeAttr(options.id)}"`)
  if (options.lazy !== false) attrs.push('loading="lazy"')
  attrs.push('decoding="async"')

  return `<img ${attrs.join(' ')} />`
}

/**
 * Escape HTML attribute value
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// =============================================================================
// Export
// =============================================================================

/**
 * The @img directive instance
 */
export const imgDirective = createImgDirective()
