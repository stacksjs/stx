/**
 * Configuration Types for stx
 */

import type { CustomDirective, Middleware } from './directive-types'
import type { ComponentConfig, DocGeneratorConfig, WebComponentConfig } from './component-types'
import type { PwaConfig } from './pwa-types'
import type { CspConfig } from './csp-types'

/**
 * Internationalization (i18n) configuration
 */
export interface I18nConfig {
  /** Default locale to use when translation is not found */
  defaultLocale: string
  /** Current locale */
  locale: string
  /** Path to directory containing translation files */
  translationsDir: string
  /** Format of translation files (json, yaml, yml, or js) */
  format: 'json' | 'yaml' | 'yml' | 'js'
  /** Whether to fallback to the key when translation is not found */
  fallbackToKey: boolean
  /** Cache translations in memory */
  cache: boolean
}

/**
 * Streaming configuration
 */
export interface StreamingConfig {
  /** Enable streaming support */
  enabled: boolean
  /** Buffer size for stream chunks in bytes */
  bufferSize: number
  /** Strategy for chunking the output */
  strategy: 'auto' | 'manual' | 'sections'
  /** Default timeout for stream rendering in milliseconds */
  timeout: number
}

/**
 * Stream renderer for progressive loading
 */
export interface StreamRenderer {
  /** Render the shell of the page (initial HTML) */
  renderShell: (data?: Record<string, unknown>) => Promise<string>
  /** Render a specific section of the template */
  renderSection: (section: string, data?: Record<string, unknown>) => Promise<string>
  /** Get the list of sections defined in the template */
  getSections: () => string[]
  /** Get the full template content */
  getTemplate: () => string
}

/**
 * Hydration configuration
 */
export interface HydrationConfig {
  /** Enable partial hydration */
  enabled: boolean
  /** Hydration mode */
  mode: 'progressive' | 'islands'
  /** Path to client-side hydration entry point */
  clientEntry: string
  /** Auto-generate hydration markers */
  autoMarkers: boolean
  /** Preload strategy for hydration code */
  preload: 'none' | 'eager' | 'lazy'
}

/**
 * Island definition for partial hydration
 */
export interface Island {
  /** Island unique identifier */
  id: string
  /** Client component to hydrate with (path or name) */
  component: string
  /** Initial props for the island */
  props?: Record<string, unknown>
  /** Load priority (eager or lazy) */
  priority?: 'eager' | 'lazy'
  /** Whether to use shadow DOM */
  shadowDOM?: boolean
}

/**
 * Accessibility configuration
 */
export interface A11yConfig {
  /** Enable accessibility checks */
  enabled: boolean
  /** Automatically add screen reader styles */
  addSrOnlyStyles: boolean
  /** Level of accessibility checking to enforce */
  level: 'AA' | 'AAA'
  /** Ignore certain types of a11y checks */
  ignoreChecks?: string[]
  /** Auto-fix simple a11y issues during template processing */
  autoFix: boolean
}

/**
 * SEO OpenGraph configuration
 */
export interface OpenGraphConfig {
  /** Open Graph type (website, article, etc.) */
  type?: string
  /** Title for Open Graph */
  title?: string
  /** Description for Open Graph */
  description?: string
  /** URL for Open Graph */
  url?: string
  /** Image URL for Open Graph */
  image?: string
  /** Alt text for the OG image */
  imageAlt?: string
  /** Width of the OG image */
  imageWidth?: number
  /** Height of the OG image */
  imageHeight?: number
  /** Site name for Open Graph */
  siteName?: string
}

/**
 * SEO Twitter card configuration
 */
export interface TwitterConfig {
  /** Twitter card type */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player'
  /** Title for Twitter card */
  title?: string
  /** Description for Twitter card */
  description?: string
  /** Image URL for Twitter card */
  image?: string
  /** Twitter site handle */
  site?: string
  /** Twitter creator handle */
  creator?: string
}

/**
 * SEO configuration
 */
export interface SeoConfig {
  /** Page title */
  title?: string
  /** Page description */
  description?: string
  /** Page keywords */
  keywords?: string[] | string
  /** Robots directives */
  robots?: string
  /** Canonical URL */
  canonical?: string
  /** Open Graph configuration */
  openGraph?: OpenGraphConfig
  /** Twitter card configuration */
  twitter?: TwitterConfig
  /** Structured data (JSON-LD) */
  structuredData?: Record<string, unknown>
}

/**
 * SEO features configuration
 */
export interface SeoFeatureConfig {
  /** Enable automatic SEO features */
  enabled: boolean
  /** Default SEO configuration to apply to all pages */
  defaultConfig?: SeoConfig
  /** Enable social preview meta tags */
  socialPreview?: boolean
  /** Default image URL for social previews */
  defaultImage?: string
}

/**
 * Analytics driver type
 */
export type AnalyticsDriver = 'fathom' | 'google-analytics' | 'plausible' | 'self-hosted' | 'custom'

/**
 * Analytics configuration for automatic script injection
 */
export interface AnalyticsConfig {
  /** Enable analytics tracking */
  enabled: boolean
  /** Analytics driver/provider */
  driver: AnalyticsDriver
  /** Fathom Analytics configuration */
  fathom?: {
    /** Fathom site ID */
    siteId: string
    /** Custom script URL (default: https://cdn.usefathom.com/script.js) */
    scriptUrl?: string
    /** Honor Do Not Track browser setting */
    honorDnt?: boolean
    /** Defer script loading (default: true) */
    defer?: boolean
    /** Enable SPA mode for client-side routing */
    spa?: boolean
    /** Canonical URL override */
    canonical?: string
    /** Auto-track page views (default: true) */
    auto?: boolean
  }
  /** Google Analytics configuration */
  googleAnalytics?: {
    /** GA4 Measurement ID (e.g., G-XXXXXXXXXX) */
    measurementId: string
    /** Enable debug mode */
    debug?: boolean
  }
  /** Plausible Analytics configuration */
  plausible?: {
    /** Your domain (e.g., example.com) */
    domain: string
    /** Custom script URL (default: https://plausible.io/js/script.js) */
    scriptUrl?: string
    /** Track localhost */
    trackLocalhost?: boolean
    /** Enable hash-based routing */
    hashMode?: boolean
  }
  /** Self-hosted analytics configuration (using dynamodb-tooling analytics) */
  selfHosted?: {
    /** Site ID for tracking */
    siteId: string
    /** API endpoint URL for collecting analytics */
    apiEndpoint: string
    /** Honor Do Not Track browser setting */
    honorDnt?: boolean
    /** Track hash changes as page views */
    trackHashChanges?: boolean
    /** Track outbound link clicks */
    trackOutboundLinks?: boolean
  }
  /** Custom analytics configuration */
  custom?: {
    /** Custom script URL */
    scriptUrl: string
    /** Script ID attribute */
    scriptId?: string
    /** Additional script attributes */
    attributes?: Record<string, string>
    /** Inline script content (instead of external URL) */
    inlineScript?: string
  }
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Enable animation system */
  enabled: boolean
  /** Default duration for transitions in milliseconds */
  defaultDuration: number
  /** Default easing function for transitions */
  defaultEase: string
  /** Respect user's motion preferences by default */
  respectMotionPreferences: boolean
  /** Default stagger delay for grouped animations */
  staggerDelay: number
}

/**
 * Loop directive configuration
 */
export interface LoopConfig {
  /**
   * Maximum iterations for @while loops (safety limit to prevent infinite loops)
   * @default 1000
   */
  maxWhileIterations: number
  /**
   * Use $loop instead of loop for loop context variable
   * Set to true to avoid conflicts if you have a variable named 'loop'
   * @default false
   */
  useAltLoopVariable: boolean
}

/**
 * Available syntax highlighting themes
 */
export type SyntaxHighlightTheme =
  | 'css-variables'
  | 'dark-plus'
  | 'dracula'
  | 'dracula-soft'
  | 'github-dark'
  | 'github-dark-dimmed'
  | 'github-light'
  | 'hc_light'
  | 'light-plus'
  | 'material-theme'
  | 'material-theme-darker'
  | 'material-theme-lighter'
  | 'material-theme-ocean'
  | 'material-theme-palenight'
  | 'min-dark'
  | 'min-light'
  | 'monokai'
  | 'nord'
  | 'one-dark-pro'
  | 'poimandres'
  | 'rose-pine'
  | 'rose-pine-dawn'
  | 'rose-pine-moon'
  | 'slack-dark'
  | 'slack-ochin'
  | 'solarized-dark'
  | 'solarized-light'
  | 'vitesse-dark'
  | 'vitesse-light'

/**
 * Syntax highlighting configuration
 */
export interface SyntaxHighlightingConfig {
  /** Enable syntax highlighting */
  enabled: boolean
  /** Use server-side highlighting (true) instead of client-side (false) */
  serverSide: boolean
  /** Default theme for syntax highlighting */
  defaultTheme: SyntaxHighlightTheme
  /** Attempt to highlight code blocks with unknown language */
  highlightUnknownLanguages: boolean
  /** List of additional themes to make available in the UI */
  additionalThemes?: SyntaxHighlightTheme[]
}

/**
 * Markdown configuration
 */
export interface MarkdownConfig {
  /** Enable markdown processing */
  enabled: boolean
  /** Path to markdown directory */
  dir?: string
  /** Syntax highlighting configuration */
  syntaxHighlighting?: Partial<SyntaxHighlightingConfig>
}

/**
 * Configuration for form directives
 */
export interface FormConfig {
  /** CSS class names for form elements */
  classes?: {
    /** Class for text inputs, textareas, and selects */
    input?: string
    /** Class added to inputs with validation errors */
    inputError?: string
    /** Class for checkboxes and radios */
    checkInput?: string
    /** Class for labels */
    label?: string
    /** Class for error message containers */
    errorFeedback?: string
  }
}

/**
 * stx configuration options
 */
export interface StxConfig {
  /**
   * Root directory for templates
   */
  templatesDir?: string

  /**
   * Default title to use for SEO if none is provided
   */
  defaultTitle?: string

  /**
   * Default description to use for SEO if none is provided
   */
  defaultDescription?: string

  /**
   * Default image URL to use for SEO/OpenGraph if none is provided
   */
  defaultImage?: string

  /**
   * Enable or disable caching
   */
  cache?: boolean

  /**
   * Cache directory path
   */
  cacheDir?: string

  /**
   * Cache version, used to invalidate cache
   */
  cacheVersion?: string

  /**
   * Enable stx features
   */
  enabled: boolean
  /** Path to partials directory, defaults to 'partials' in the same directory as the template */
  partialsDir: string
  /** Path to components directory, defaults to 'components' in the same directory as the template */
  componentsDir: string
  /** Path to layouts directory, defaults to 'layouts' in the project root */
  layoutsDir?: string
  /** Default layout to use for pages without DOCTYPE, relative to layoutsDir */
  defaultLayout?: string
  /** Enable debug mode for detailed error messages */
  debug: boolean
  /** Directory to store cached templates, defaults to '.stx/cache' in the project root */
  cachePath: string
  /** Custom directives registered by the user */
  customDirectives?: CustomDirective[]
  /** Middleware for pre/post-processing templates */
  middleware?: Middleware[]
  /** Internationalization (i18n) configuration */
  i18n?: Partial<I18nConfig>
  /** Web Components integration configuration */
  webComponents?: Partial<WebComponentConfig>
  /** Documentation generator configuration */
  docs?: Partial<DocGeneratorConfig>
  /** Streaming rendering configuration */
  streaming?: Partial<StreamingConfig>
  /** Partial hydration configuration */
  hydration?: Partial<HydrationConfig>
  /** Accessibility configuration */
  a11y?: Partial<A11yConfig>
  /** SEO configuration */
  seo?: Partial<SeoFeatureConfig>
  /** Analytics configuration */
  analytics?: Partial<AnalyticsConfig>
  /** Animation system configuration */
  animation?: Partial<AnimationConfig>
  /** Skip adding default SEO tags */
  skipDefaultSeoTags?: boolean
  /** Markdown configuration */
  markdown?: Partial<MarkdownConfig>
  /** Loop directive configuration */
  loops?: Partial<LoopConfig>
  /** Form directives configuration */
  forms?: Partial<FormConfig>
  /** Content Security Policy configuration */
  csp?: Partial<CspConfig>
  /** Story (component showcase) configuration */
  story?: Partial<import('../story/types').StoryConfig>
  /** Progressive Web App (PWA) configuration */
  pwa?: Partial<PwaConfig>
  /** Component configuration */
  components?: Partial<ComponentConfig>
}

export type StxOptions = Partial<StxConfig>
