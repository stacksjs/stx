/**
 * Content Security Policy (CSP) Module
 *
 * Provides utilities for generating and managing Content Security Policy headers
 * and meta tags to protect against XSS and other injection attacks.
 *
 * ## Features
 *
 * - Generate CSP headers from configuration
 * - Inject CSP meta tags into HTML
 * - Nonce generation for inline scripts/styles
 * - Preset configurations for common use cases
 * - Template directives for CSP integration
 *
 * ## Usage
 *
 * ### Configuration in stx.config.ts
 *
 * ```typescript
 * export default {
 *   csp: {
 *     enabled: true,
 *     directives: {
 *       'default-src': ["'self'"],
 *       'script-src': ["'self'", "'strict-dynamic'"],
 *       'style-src': ["'self'", "'unsafe-inline'"],
 *       'img-src': ["'self'", 'data:', 'https:'],
 *       'connect-src': ["'self'", 'https://api.example.com'],
 *     },
 *     useNonce: true,
 *     addMetaTag: true,
 *   }
 * }
 * ```
 *
 * ### Using Presets
 *
 * ```typescript
 * import { getCspPreset, generateCspHeader } from 'stx'
 *
 * const config = getCspPreset('strict')
 * const header = generateCspHeader(config.directives)
 * ```
 *
 * ### Template Directives
 *
 * ```html
 * <!-- Insert CSP meta tag -->
 * @csp
 *
 * <!-- Get current nonce for inline scripts -->
 * <script nonce="{{ cspNonce }}">
 *   console.log('Safe inline script')
 * </script>
 * ```
 *
 * ### HTTP Headers
 *
 * ```typescript
 * import { generateCspHeader } from 'stx'
 *
 * // In your server handler
 * const cspHeader = generateCspHeader(config.csp.directives)
 * response.setHeader('Content-Security-Policy', cspHeader)
 * ```
 */
import type { CspConfig, CspDirectives, CspPreset, CustomDirective, StxOptions } from './types'

// =============================================================================
// Constants
// =============================================================================

/**
 * Default nonce length in bytes (16 bytes = 128 bits)
 */
const DEFAULT_NONCE_LENGTH = 16

/**
 * Request-scoped nonce storage using WeakMap
 * This allows nonces to be garbage collected when the context is no longer referenced
 */
const nonceStorage = new WeakMap<object, string>()

// =============================================================================
// Nonce Generation
// =============================================================================

/**
 * Generate a cryptographically secure nonce for CSP
 *
 * @param length - Length of nonce in bytes (default 16)
 * @returns Base64-encoded nonce string
 *
 * @example
 * ```typescript
 * const nonce = generateNonce()
 * // Returns something like: "4AiRXmSkM+XRG3E2Y1fO9Q=="
 * ```
 */
export function generateNonce(length: number = DEFAULT_NONCE_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Get or create a nonce for the current request context
 *
 * Uses WeakMap to ensure nonce is request-scoped and can be garbage collected.
 * If no context is provided, generates a new nonce each time.
 *
 * @param context - Request context object for nonce scoping
 * @param config - CSP configuration (may include custom nonce generator)
 * @returns The nonce for the current context
 *
 * @example
 * ```typescript
 * // In a request handler
 * const ctx = { requestId: '123' }
 * const nonce = getNonce(ctx, cspConfig)
 * // Same nonce returned for same context object
 * const sameNonce = getNonce(ctx, cspConfig)
 * ```
 */
export function getNonce(context?: object, config?: CspConfig): string {
  if (!context) {
    return config?.nonceGenerator?.() ?? generateNonce()
  }

  let nonce = nonceStorage.get(context)
  if (!nonce) {
    nonce = config?.nonceGenerator?.() ?? generateNonce()
    nonceStorage.set(context, nonce)
  }
  return nonce
}

/**
 * Clear the nonce for a context (useful for testing or manual cleanup)
 *
 * @param context - Request context to clear nonce for
 */
export function clearNonce(context: object): void {
  nonceStorage.delete(context)
}

// =============================================================================
// CSP Header Generation
// =============================================================================

/**
 * Generate a CSP header string from directive configuration
 *
 * @param directives - CSP directive configuration
 * @param nonce - Optional nonce to inject into script-src and style-src
 * @returns CSP header string
 *
 * @example
 * ```typescript
 * const header = generateCspHeader({
 *   'default-src': ["'self'"],
 *   'script-src': ["'self'", 'https://cdn.example.com'],
 *   'upgrade-insecure-requests': true,
 * })
 * // Returns: "default-src 'self'; script-src 'self' https://cdn.example.com; upgrade-insecure-requests"
 * ```
 */
export function generateCspHeader(directives: CspDirectives, nonce?: string): string {
  const parts: string[] = []

  for (const [directive, value] of Object.entries(directives)) {
    if (value === undefined || value === null) {
      continue
    }

    // Handle boolean directives
    if (typeof value === 'boolean') {
      if (value) {
        parts.push(directive)
      }
      continue
    }

    // Handle array directives
    if (Array.isArray(value)) {
      let sources = [...value]

      // Inject nonce for script-src and style-src if provided
      if (nonce && (directive === 'script-src' || directive === 'style-src')) {
        sources = sources.filter(s => !s.startsWith('\'nonce-'))
        sources.push(`'nonce-${nonce}'`)
      }

      if (sources.length > 0) {
        parts.push(`${directive} ${sources.join(' ')}`)
      }
    }
  }

  return parts.join('; ')
}

/**
 * Generate CSP meta tag HTML
 *
 * @param directives - CSP directive configuration
 * @param nonce - Optional nonce to inject
 * @returns HTML meta tag string
 *
 * @example
 * ```typescript
 * const metaTag = generateCspMetaTag({
 *   'default-src': ["'self'"],
 * })
 * // Returns: '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">'
 * ```
 */
export function generateCspMetaTag(directives: CspDirectives, nonce?: string): string {
  const headerValue = generateCspHeader(directives, nonce)
  const escapedValue = headerValue
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')

  return `<meta http-equiv="Content-Security-Policy" content="${escapedValue}">`
}

// =============================================================================
// CSP Presets
// =============================================================================

/**
 * Strict CSP preset - Maximum security, may require nonces for inline content
 *
 * - No unsafe-inline or unsafe-eval
 * - Uses strict-dynamic for scripts
 * - Blocks object/embed
 * - Restricts form actions to same origin
 */
export const strictCspPreset: CspDirectives = {
  'default-src': ['\'self\''],
  'script-src': ['\'self\'', '\'strict-dynamic\''],
  'style-src': ['\'self\''],
  'img-src': ['\'self\'', 'data:', 'https:'],
  'font-src': ['\'self\'', 'https:', 'data:'],
  'connect-src': ['\'self\''],
  'media-src': ['\'self\''],
  'object-src': ['\'none\''],
  'frame-src': ['\'none\''],
  'base-uri': ['\'self\''],
  'form-action': ['\'self\''],
  'frame-ancestors': ['\'self\''],
  'upgrade-insecure-requests': true,
}

/**
 * Moderate CSP preset - Balanced security and compatibility
 *
 * - Allows unsafe-inline for styles (common requirement)
 * - Blocks unsafe-eval
 * - Allows data: URIs for images
 */
export const moderateCspPreset: CspDirectives = {
  'default-src': ['\'self\''],
  'script-src': ['\'self\''],
  'style-src': ['\'self\'', '\'unsafe-inline\''],
  'img-src': ['\'self\'', 'data:', 'https:'],
  'font-src': ['\'self\'', 'https:', 'data:'],
  'connect-src': ['\'self\'', 'https:'],
  'media-src': ['\'self\''],
  'object-src': ['\'none\''],
  'frame-src': ['\'self\''],
  'base-uri': ['\'self\''],
  'form-action': ['\'self\''],
  'upgrade-insecure-requests': true,
}

/**
 * Relaxed CSP preset - Basic protection, maximum compatibility
 *
 * - Allows unsafe-inline for both scripts and styles
 * - Still blocks unsafe-eval and object embeds
 */
export const relaxedCspPreset: CspDirectives = {
  'default-src': ['\'self\''],
  'script-src': ['\'self\'', '\'unsafe-inline\''],
  'style-src': ['\'self\'', '\'unsafe-inline\''],
  'img-src': ['\'self\'', 'data:', 'https:', 'http:'],
  'font-src': ['\'self\'', 'https:', 'http:', 'data:'],
  'connect-src': ['\'self\'', 'https:', 'http:', 'ws:', 'wss:'],
  'media-src': ['\'self\'', 'https:', 'http:'],
  'object-src': ['\'none\''],
  'frame-src': ['\'self\'', 'https:'],
  'base-uri': ['\'self\''],
}

/**
 * API-only CSP preset - For JSON API responses
 *
 * - Blocks all content loading (APIs shouldn't render HTML)
 * - Prevents framing
 */
export const apiCspPreset: CspDirectives = {
  'default-src': ['\'none\''],
  'frame-ancestors': ['\'none\''],
}

/**
 * Get a CSP preset configuration by name
 *
 * @param preset - Name of the preset
 * @returns CSP configuration object
 *
 * @example
 * ```typescript
 * const config = getCspPreset('strict')
 * // Returns full CspConfig with strict directives
 * ```
 */
export function getCspPreset(preset: CspPreset): CspConfig {
  const presets: Record<CspPreset, CspDirectives> = {
    strict: strictCspPreset,
    moderate: moderateCspPreset,
    relaxed: relaxedCspPreset,
    api: apiCspPreset,
  }

  return {
    enabled: true,
    directives: presets[preset] || moderateCspPreset,
    useNonce: preset === 'strict',
    addMetaTag: true,
  }
}

// =============================================================================
// CSP Merging
// =============================================================================

/**
 * Merge two CSP directive configurations
 *
 * Sources from the second config are added to the first.
 * Boolean directives are OR'd together.
 *
 * @param base - Base CSP directives
 * @param override - Override/additional directives
 * @returns Merged CSP directives
 *
 * @example
 * ```typescript
 * const merged = mergeCspDirectives(
 *   { 'default-src': ["'self'"], 'script-src': ["'self'"] },
 *   { 'script-src': ['https://cdn.example.com'], 'img-src': ['https:'] }
 * )
 * // Result: {
 * //   'default-src': ["'self'"],
 * //   'script-src': ["'self'", "https://cdn.example.com"],
 * //   'img-src': ["https:"]
 * // }
 * ```
 */
export function mergeCspDirectives(base: CspDirectives, override: CspDirectives): CspDirectives {
  const result: CspDirectives = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const directive = key as keyof CspDirectives
    const baseValue = result[directive]

    if (value === undefined || value === null) {
      continue
    }

    if (typeof value === 'boolean') {
      // Boolean directives: OR together
      (result as any)[directive] = (baseValue as boolean) || value
    }
    else if (Array.isArray(value)) {
      // Array directives: merge unique values
      const baseArray = Array.isArray(baseValue) ? baseValue : []
      const merged = [...new Set([...baseArray, ...value])]
      ;(result as any)[directive] = merged
    }
  }

  return result
}

// =============================================================================
// HTML Injection
// =============================================================================

/**
 * Inject CSP meta tag into HTML head
 *
 * @param html - HTML content
 * @param config - CSP configuration
 * @param context - Request context for nonce scoping
 * @returns HTML with CSP meta tag injected
 */
export function injectCspMetaTag(
  html: string,
  config: CspConfig,
  context?: object,
): string {
  if (!config.enabled || !config.addMetaTag) {
    return html
  }

  // Check if CSP meta tag already exists
  if (html.includes('http-equiv="Content-Security-Policy"')) {
    return html
  }

  // Check if document has a head tag
  if (!html.includes('<head>') && !html.includes('<head ')) {
    return html
  }

  const nonce = config.useNonce ? getNonce(context, config) : undefined
  const metaTag = generateCspMetaTag(config.directives, nonce)

  // Insert after opening head tag
  return html.replace(/<head([^>]*)>/, `<head$1>\n${metaTag}`)
}

/**
 * Add nonce attribute to all inline script and style tags
 *
 * @param html - HTML content
 * @param nonce - Nonce value to add
 * @returns HTML with nonce attributes added
 */
export function addNonceToInlineContent(html: string, nonce: string): string {
  let result = html

  // Add nonce to script tags without src (inline scripts)
  result = result.replace(/<script(?![^>]*\ssrc=)([^>]*)>/gi, (match, attrs) => {
    // Don't add if nonce already exists
    if (attrs.includes('nonce=')) {
      return match
    }
    return `<script nonce="${nonce}"${attrs}>`
  })

  // Add nonce to style tags
  result = result.replace(/<style([^>]*)>/gi, (match, attrs) => {
    // Don't add if nonce already exists
    if (attrs.includes('nonce=')) {
      return match
    }
    return `<style nonce="${nonce}"${attrs}>`
  })

  return result
}

// =============================================================================
// Template Processing
// =============================================================================

/**
 * Process CSP-related directives in templates
 *
 * Handles:
 * - @csp - Insert CSP meta tag
 * - @cspNonce - Output current nonce value
 *
 * @param template - Template content
 * @param context - Template context
 * @param _filePath - Source file path
 * @param options - STX options
 * @returns Processed template
 */
export function processCspDirectives(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  options: StxOptions,
): string {
  let output = template

  const cspConfig = options.csp

  // Process @csp directive - insert CSP meta tag
  output = output.replace(/@csp\b/g, () => {
    if (!cspConfig?.enabled || !cspConfig.directives) {
      return '<!-- CSP not configured -->'
    }

    const nonce = cspConfig.useNonce ? getNonce(context, cspConfig as CspConfig) : undefined
    return generateCspMetaTag(cspConfig.directives, nonce)
  })

  // Process @cspNonce directive - output nonce value
  output = output.replace(/@cspNonce\b/g, () => {
    if (!cspConfig?.enabled || !cspConfig.useNonce) {
      return ''
    }
    return getNonce(context, cspConfig as CspConfig)
  })

  // Inject nonce into context for use in expressions like {{ cspNonce }}
  if (cspConfig?.enabled && cspConfig.useNonce) {
    context.cspNonce = getNonce(context, cspConfig as CspConfig)
  }

  return output
}

// =============================================================================
// Custom Directives
// =============================================================================

/**
 * CSP meta tag directive
 * Usage: @csp
 */
export const cspDirective: CustomDirective = {
  name: 'csp',
  handler: (_content, _params, context, _filePath) => {
    const options = context.__stx_options as StxOptions | undefined
    const cspConfig = options?.csp

    if (!cspConfig?.enabled || !cspConfig.directives) {
      return '<!-- CSP not configured -->'
    }

    const nonce = cspConfig.useNonce ? getNonce(context, cspConfig as CspConfig) : undefined
    return generateCspMetaTag(cspConfig.directives, nonce)
  },
  hasEndTag: false,
  description: 'Insert Content-Security-Policy meta tag',
}

/**
 * CSP nonce directive
 * Usage: @cspNonce
 */
export const cspNonceDirective: CustomDirective = {
  name: 'cspNonce',
  handler: (_content, _params, context, _filePath) => {
    const options = context.__stx_options as StxOptions | undefined
    const cspConfig = options?.csp

    if (!cspConfig?.enabled || !cspConfig.useNonce) {
      return ''
    }

    return getNonce(context, cspConfig as CspConfig)
  },
  hasEndTag: false,
  description: 'Output the current CSP nonce value',
}

/**
 * Register CSP-related custom directives
 *
 * @returns Array of custom directives for CSP
 */
export function registerCspDirectives(): CustomDirective[] {
  return [
    cspDirective,
    cspNonceDirective,
  ]
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate CSP directive configuration
 *
 * @param directives - CSP directives to validate
 * @returns Array of validation warnings
 *
 * @example
 * ```typescript
 * const warnings = validateCspDirectives({
 *   'script-src': ["'unsafe-inline'", "'unsafe-eval'"],
 * })
 * // Returns warnings about unsafe usage
 * ```
 */
export function validateCspDirectives(directives: CspDirectives): string[] {
  const warnings: string[] = []

  // Check for unsafe-inline in script-src
  if (directives['script-src']?.includes('\'unsafe-inline\'')) {
    warnings.push('CSP: Using unsafe-inline in script-src significantly reduces XSS protection')
  }

  // Check for unsafe-eval in script-src
  if (directives['script-src']?.includes('\'unsafe-eval\'')) {
    warnings.push('CSP: Using unsafe-eval in script-src allows eval() and related functions')
  }

  // Check for missing default-src
  if (!directives['default-src']) {
    warnings.push('CSP: No default-src specified. Recommend adding default-src as a fallback')
  }

  // Check for overly permissive default-src
  if (directives['default-src']?.includes('*')) {
    warnings.push('CSP: Using * in default-src provides minimal protection')
  }

  // Check for missing object-src
  if (!directives['object-src'] && !directives['default-src']?.includes('\'none\'')) {
    warnings.push('CSP: Consider adding object-src: none to block plugins')
  }

  // Check for missing base-uri
  if (!directives['base-uri']) {
    warnings.push('CSP: Consider adding base-uri to prevent base tag injection attacks')
  }

  // Check for http: in sources (should prefer https:)
  for (const [directive, sources] of Object.entries(directives)) {
    if (Array.isArray(sources) && sources.includes('http:')) {
      warnings.push(`CSP: Using http: in ${directive} allows insecure resources`)
    }
  }

  return warnings
}

// =============================================================================
// HTTP Response Helpers
// =============================================================================

/**
 * Get the appropriate CSP header name based on configuration
 *
 * @param reportOnly - Whether to use report-only mode
 * @returns Header name string
 */
export function getCspHeaderName(reportOnly: boolean = false): string {
  return reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy'
}

/**
 * Create CSP headers object for HTTP response
 *
 * @param config - CSP configuration
 * @param context - Request context for nonce scoping
 * @returns Headers object ready to spread into response
 *
 * @example
 * ```typescript
 * const headers = createCspHeaders(cspConfig, requestContext)
 * return new Response(body, { headers: { ...headers } })
 * ```
 */
export function createCspHeaders(
  config: CspConfig,
  context?: object,
): Record<string, string> {
  if (!config.enabled) {
    return {}
  }

  const nonce = config.useNonce ? getNonce(context, config) : undefined
  const headerValue = generateCspHeader(config.directives, nonce)
  const headerName = getCspHeaderName(config.reportOnly)

  return { [headerName]: headerValue }
}

// =============================================================================
// Default Configuration
// =============================================================================

/**
 * Default CSP configuration - moderate preset
 */
export const defaultCspConfig: CspConfig = {
  enabled: false,
  reportOnly: false,
  directives: moderateCspPreset,
  useNonce: false,
  addMetaTag: true,
}
