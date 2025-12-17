/**
 * Content Security Policy Types
 */

/**
 * CSP directive source values
 * These are the standard source values that can be used in CSP directives
 */
export type CspSourceValue =
  | '\'self\''
  | '\'unsafe-inline\''
  | '\'unsafe-eval\''
  | '\'unsafe-hashes\''
  | '\'strict-dynamic\''
  | '\'report-sample\''
  | '\'wasm-unsafe-eval\''
  | '\'none\''
  | 'data:'
  | 'blob:'
  | 'https:'
  | 'http:'
  | 'ws:'
  | 'wss:'
  | string // Allow custom URLs and nonces like 'nonce-xxx' or 'sha256-xxx'

/**
 * Individual CSP directive configuration
 * Maps directive names to arrays of allowed sources
 */
export interface CspDirectives {
  /** Default policy for all resource types */
  'default-src'?: CspSourceValue[]
  /** Valid sources for JavaScript */
  'script-src'?: CspSourceValue[]
  /** Valid sources for stylesheets */
  'style-src'?: CspSourceValue[]
  /** Valid sources for images */
  'img-src'?: CspSourceValue[]
  /** Valid sources for fonts */
  'font-src'?: CspSourceValue[]
  /** Valid sources for XHR, fetch, WebSockets */
  'connect-src'?: CspSourceValue[]
  /** Valid sources for media elements (audio, video) */
  'media-src'?: CspSourceValue[]
  /** Valid sources for object, embed, applet */
  'object-src'?: CspSourceValue[]
  /** Valid sources for iframes */
  'frame-src'?: CspSourceValue[]
  /** Valid sources for workers */
  'worker-src'?: CspSourceValue[]
  /** Valid sources for child contexts */
  'child-src'?: CspSourceValue[]
  /** Valid sources for manifests */
  'manifest-src'?: CspSourceValue[]
  /** Restricts URLs for form submissions */
  'form-action'?: CspSourceValue[]
  /** Restricts URLs which can embed this page */
  'frame-ancestors'?: CspSourceValue[]
  /** Restricts URLs for link prefetch/prerender */
  'prefetch-src'?: CspSourceValue[]
  /** Restricts URLs for navigate-to */
  'navigate-to'?: CspSourceValue[]
  /** Base URI for relative URLs */
  'base-uri'?: CspSourceValue[]
  /** URL to report CSP violations to */
  'report-uri'?: string[]
  /** Reporting endpoint name for CSP violations */
  'report-to'?: string[]
  /** Enable upgrade-insecure-requests */
  'upgrade-insecure-requests'?: boolean
  /** Enable block-all-mixed-content */
  'block-all-mixed-content'?: boolean
  /** Sandbox restrictions */
  'sandbox'?: (
    | 'allow-forms'
    | 'allow-modals'
    | 'allow-orientation-lock'
    | 'allow-pointer-lock'
    | 'allow-popups'
    | 'allow-popups-to-escape-sandbox'
    | 'allow-presentation'
    | 'allow-same-origin'
    | 'allow-scripts'
    | 'allow-top-navigation'
    | 'allow-top-navigation-by-user-activation'
  )[]
  /** Require trusted types */
  'require-trusted-types-for'?: ('script')[]
  /** Trusted types policies */
  'trusted-types'?: string[]
}

/**
 * CSP configuration options
 */
export interface CspConfig {
  /** Enable CSP generation */
  enabled: boolean
  /** Use report-only mode (Content-Security-Policy-Report-Only header) */
  reportOnly?: boolean
  /** CSP directives */
  directives: CspDirectives
  /** Generate nonce for inline scripts/styles */
  useNonce?: boolean
  /** Add CSP as meta tag in HTML head */
  addMetaTag?: boolean
  /** Custom nonce generator function */
  nonceGenerator?: () => string
}

/**
 * Preset CSP configurations for common use cases
 */
export type CspPreset = 'strict' | 'moderate' | 'relaxed' | 'api'
