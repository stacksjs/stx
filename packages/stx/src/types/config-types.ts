/**
 * Configuration Types for stx
 */

import type { ColorModeBootConfig } from '../color-mode-boot'
import type { CustomDirective, Middleware } from './directive-types'
import type { ComponentConfig, DocGeneratorConfig, WebComponentConfig } from './component-types'
import type { PwaConfig } from './pwa-types'
import type { CspConfig } from './csp-types'
import type { HeatmapConfig } from '../heatmap'
import type { MediaConfig } from '../media/types'

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
 * Route middleware configuration
 */
export interface RouteMiddlewareConfig {
  /** Enable route middleware system */
  enabled: boolean
  /** Directory containing middleware files (default: 'middleware') */
  dir: string
  /** Global middleware to run on every route */
  global?: string[]
  // `defaultMode` was removed with the 'client' mode it existed to select
  // (stacksjs/stx#1891) — it was declared here and read by nothing.
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
 * Strict mode configuration for DOM API validation.
 * When enabled, stx warns (or errors) when client scripts use raw browser APIs
 * instead of framework composables.
 */
export interface StrictModeConfig {
  /** Enable strict mode validation */
  enabled: boolean
  /** Throw errors instead of warnings (default: false) */
  failOnViolation?: boolean
  /** Pattern strings to allow through validation (matched against message or regex source) */
  allowPatterns?: string[]
  /**
   * What to do when a `<script client>` block does not bundle.
   *
   * `'warn'` (default) ships the ORIGINAL, unbundled source so the page still
   * renders — right for a dev server, and why the error overlay exists.
   * `'error'` refuses instead, for anyone who would rather nothing rendered
   * than a page whose bindings quietly do nothing. `stx build` fails on a
   * bundle error either way. See #1884.
   */
  bundlerFallback?: 'warn' | 'error'
}

/**
 * Real-time broadcasting configuration.
 *
 * When enabled, stx starts a ts-broadcasting WebSocket server
 * alongside the dev server so pages can receive push events.
 */
export interface BroadcastingConfig {
  /** Enable the broadcasting server @default false */
  enabled?: boolean
  /** Broadcasting driver @default 'bun' */
  driver?: 'bun' | 'reverb' | 'pusher' | 'ably' | 'log' | 'null'
  /** WebSocket server host @default '0.0.0.0' */
  host?: string
  /** WebSocket server port @default 6001 */
  port?: number
  /** URL scheme @default 'ws' */
  scheme?: 'ws' | 'wss'
  /** Enable verbose logging @default false */
  verbose?: boolean
}

/**
 * App head configuration — auto-generates the document shell.
 * No .stx file needs to write <!DOCTYPE>, <html>, <head>, or <body>.
 */
export interface AppHeadConfig {
  /** Page title (can be overridden per-page with @section('title')) */
  title?: string
  /** HTML lang attribute @default 'en' */
  lang?: string
  /** Meta tags */
  meta?: Array<Record<string, string>>
  /** Link tags (stylesheets, icons, etc.) */
  link?: Array<Record<string, string>>
  /** Script tags to include in <head> */
  script?: Array<{ src?: string, content?: string, [key: string]: any }>
  /** Additional raw HTML to inject in <head> */
  headRaw?: string
  /**
   * Attributes for the `<html>` element.
   *
   * `class` is the reason this exists: design tokens scoped to the root
   * element (`html.marketing { --bg: … }`) need a class the page cannot
   * otherwise set once it stops hand-writing its own document shell.
   * `htmlAttrs.lang` takes precedence over the `lang` option.
   *
   * Also settable per-page via `useHead({ htmlAttrs })`, which merges over
   * this. Reconciled by the router on SPA layout changes (stacksjs/stx#1798).
   */
  htmlAttrs?: Record<string, string>
  /** Body class */
  bodyClass?: string
  /** Body attributes */
  bodyAttrs?: Record<string, string>
}

/**
 * stx configuration options
 */
export interface StxConfig {
  /**
   * App head configuration.
   * Defines the document shell that stx auto-generates around page content.
   * No .stx file needs to write <!DOCTYPE>, <html>, <head>, or <body>.
   *
   * @example
   * ```ts
   * // stx.config.ts
   * export default {
   *   app: {
   *     head: {
   *       title: 'My App',
   *       meta: [
   *         { name: 'description', content: 'My stx app' },
   *       ],
   *       link: [
   *         { rel: 'icon', href: '/favicon.ico' },
   *       ],
   *     },
   *   },
   * }
   * ```
   */
  /**
   * Canonical site identity (stacksjs/stx#1866).
   *
   * `url` is what sitemap.xml and robots.txt are built from. Without it the
   * static build falls back to `http://localhost` and warns — a sitemap of
   * localhost URLs is valid XML and useless to a crawler, so it has to be said
   * out loud rather than discovered after deploy.
   *
   * The site-builder path reads the same field from `site.config.ts`; either
   * file works.
   *
   * @example
   * ```ts
   * // stx.config.ts
   * export default {
   *   site: { url: 'https://example.com' },
   * }
   * ```
   */
  site?: {
    /** Absolute origin, e.g. `https://example.com`. */
    url?: string
  }
  app?: {
    head?: AppHeadConfig
    /**
     * Pre-paint color mode (stacksjs/stx#1794).
     *
     * Declaring this makes stx inline a small render-blocking script as the
     * first thing in `<head>`, which reads the persisted preference and stamps
     * the root element before the browser paints. Without it, `useColorMode`
     * can only apply the theme after hydration, which flashes the wrong theme
     * on every cold load for users whose stored preference differs from the
     * default.
     *
     * The options are the same ones `useColorMode` takes, and the boot script
     * publishes them to the client — so `useColorMode()` with no arguments
     * picks up the configured key and attribute instead of repeating them.
     *
     * @example
     * ```ts
     * // stx.config.ts
     * export default {
     *   app: {
     *     colorMode: { storageKey: 'theme', attribute: 'data-theme' },
     *   },
     * }
     * ```
     */
    colorMode?: ColorModeBootConfig
    /**
     * Defaults for the native dev window (`stx dev --native`).
     * Only used when the user passes `--native`. Sensible per-app sizes
     * keep the window from opening at a one-size-fits-all 1400×900.
     */
    window?: {
      /** Window width in points/pixels. Default: 1400. */
      width?: number
      /** Window height in points/pixels. Default: 900. */
      height?: number
      /** Open with the system dark theme. Default: true. */
      darkMode?: boolean
      /** Enable hot-reload bridge inside the webview. Default: true. */
      hotReload?: boolean
    }
  }

  /**
   * Source root for .stx files.
   * pages/, layouts/, components/, partials/ resolve relative to this.
   *
   * - Standalone app: defaults to '.' (project root)
   * - Stacks app: auto-detected as 'resources/views' if that directory has pages/
   * - Override: set explicitly to any path
   *
   * Note: the state directory (see `stateDir`), .output/ (build), and
   * stx.config.ts stay at project root.
   *
   * @default '.' (auto-detects 'resources/views' if it exists with pages/)
   */
  root?: string

  /**
   * Where stx keeps its generated state: the compiled-template cache, the
   * Crosswind CSS cache, the client-script bundle cache and temp dir, the
   * generated route manifest and route types, dev-server output, SSG and media
   * caches, story snapshots.
   *
   * Point it at an existing home for generated state to keep the project root
   * clean - a Stacks application sets `storage/framework/stx`. The path-shaped
   * options that default to somewhere under `.stx/` (`cachePath`,
   * `build.cacheDir`, `media.cache.directory`, `story.outDir`) follow this
   * setting; a path you point somewhere else entirely is left alone.
   *
   * Relative paths resolve against the project root; absolute paths are used
   * as-is. `STX_DIR` overrides this.
   *
   * @default '.stx'
   */
  stateDir?: string

  /**
   * Pages directory name (relative to root).
   * Standalone apps: 'pages' (default)
   * Stacks apps: 'views'
   *
   * @default 'pages'
   */
  pagesDir?: string

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
   * Enable server-side rendering at request time.
   *
   * - `false` (default) → SSG. `<script server>` runs at build time, output
   *   goes to `dist/` as flat HTML files. Deploy to S3 + CloudFront.
   * - `true` → SSR. `<script server>` runs per-request on a Bun server,
   *   output goes to `.output/`. Deploy to EC2 behind CloudFront.
   *
   * `<script server>` works in both modes — this flag controls *when* it
   * runs, not whether it's allowed.
   *
   * @default false
   */
  ssr?: boolean

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
  /**
   * Called when an `@include` fails, instead of the failure being silent.
   *
   * A failed include renders the error where the markup should have been. In dev
   * that is the right call — you see it as soon as you look. In a build it
   * produces a file nobody would knowingly deploy, and nothing else can see it:
   * one app shipped pre-rendered pages whose header, footer, hero and CTA were
   * all replaced by an ENOENT banner while the build printed `Failed: 0` and
   * exited 0 (stacksjs/stx#1921).
   *
   * The rendered output is unchanged — this only carries the fact out, so a
   * caller that builds files can decide to fail. `partialsDir` is included
   * because "it looked in the wrong place" is the usual cause and the resolved
   * path is what makes it a ten-second fix.
   */
  onIncludeError?: (failure: {
    /** The path as written in the directive, e.g. `Bench/ConfirmHost`. */
    includePath: string
    /** The template the directive appeared in. */
    templatePath: string
    message: string
    /** The directory the include was resolved against. */
    partialsDir: string
  }) => void
  /** Path to components directory, defaults to 'components' in the same directory as the template */
  componentsDir: string
  /** @internal Configured component root retained while nested components resolve locally. */
  _rootComponentsDir?: string
  /** Path to layouts directory, defaults to 'layouts' in the project root */
  layoutsDir?: string
  /**
   * Path to the stores directory, resolved against `root`.
   *
   * Every `.ts` file in it (except `index.ts`, `types.ts` and `.d.ts`) is
   * discovered, bundled, and injected ahead of any page script, so a
   * `defineStore(...)` call has already run by the time `useStore('id')` looks
   * it up. Files are ordered so stores that call `useStore()` load after the
   * ones they depend on.
   *
   * @default 'stores'
   */
  storesDir?: string

  /**
   * Path to the composables directory, resolved against `root`.
   *
   * Every `.ts` file in it (except `index.ts`, `types.ts` and `.d.ts`) is
   * discovered, bundled, and injected ahead of any page script. Exported
   * bindings are registered on `window.__composables`, which is what
   * `import { useThing } from '@composables'` compiles to — a plain destructure
   * in the page's own scope, so template directives can see the names.
   *
   * All composables share one scope, so they can call each other directly
   * without importing.
   *
   * When unset, stx probes `composables/` and then `functions/`, so an app
   * already using either layout works with no configuration.
   *
   * @default 'composables' (falls back to 'functions')
   */
  composablesDir?: string
  /** Default layout to use for pages without DOCTYPE, relative to layoutsDir */
  defaultLayout?: string
  /** Plugins to load — npm packages, local paths, or [path, options] tuples */
  plugins?: Array<string | [string, Record<string, any>]>
  /** Path to public/static assets directory, defaults to 'public' */
  publicDir?: string
  /** Path to .env file, defaults to '.env' in project root (Bun loads this automatically) */
  envFile?: string | boolean
  /** Environment variable prefix for client-side exposure (e.g. 'STX_PUBLIC_') */
  envPrefix?: string
  /**
   * Path to a `crosswind.config.*` file, or an inline Crosswind config. The
   * inline object accepts any Crosswind field (`theme`, `fonts`, `safelist`,
   * `shortcuts`, …) — e.g. load web fonts with
   * `css: { fonts: { google: ['Inter:wght@400;700'] } }`.
   */
  css?: string | { config?: string, content?: string[], preflight?: boolean, minify?: boolean, [key: string]: unknown }
  /** Enable debug mode for detailed error messages */
  debug: boolean
  /**
   * Turn degraded-but-working behaviour into a hard failure.
   *
   * `bundlerFallback` decides what happens when a `<script client>` block will
   * not bundle. The default `'warn'` ships the ORIGINAL, unbundled source so the
   * page still renders, which is right for a dev server and is why the overlay
   * exists; `'error'` refuses instead, for anyone who would rather nothing
   * rendered than a page whose bindings quietly do nothing. `stx build` fails on
   * a bundle error either way. See #1884.
   */
  /** Directory to store cached templates, defaults to `cache` inside `stateDir` */
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
  /** Skip injecting signals runtime (for nested component processing) */
  skipSignalsRuntime?: boolean
  /** Skip event directive processing (for signal components where runtime handles @click etc.) */
  skipEventDirectives?: boolean
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
  /** Route middleware configuration */
  routeMiddleware?: Partial<RouteMiddlewareConfig>
  /** Heatmap tracking configuration */
  heatmap?: Partial<HeatmapConfig>
  /** Static Site Generation (SSG) build configuration */
  build?: Partial<BuildConfig>
  /** Media (images, video, uploads) configuration */
  media?: Partial<MediaConfig>
  /**
   * Strict mode for DOM API validation.
   * When `true`, warns about raw `document.*` / `window.*` usage in client scripts.
   * Pass a StrictModeConfig object for fine-grained control.
   */
  strict?: boolean | StrictModeConfig

  /**
   * Build mode for the processing pipeline.
   * - `undefined` (default): dev mode, inline everything per request
   * - `'compile'`: build mode, emit asset reference placeholders instead of inline code
   * - `'serve'`: serve mode, reference shared runtime and router assets
   */
  buildMode?: 'compile' | 'serve' | 'spa'

  /**
   * Auto-generate document shell (<!DOCTYPE>, <html>, <head>, <body>) around output.
   * Set by serve paths to wrap page output. Not set for tests or programmatic usage.
   * @default false
   */
  autoShell?: boolean

  /**
   * Output directory for production builds.
   * @default '.output'
   */
  outputDir?: string

  /**
   * App shell file for single-shell mode.
   * When set (or auto-detected as 'app.stx'), the shell wraps all pages.
   * The shell's `<slot />` is replaced with page content.
   * Direct requests get full shell + page; SPA navigation gets page fragments.
   * @default undefined (auto-detects 'app.stx' in project root)
   */
  shell?: string | false

  /**
   * Real-time broadcasting configuration (powered by ts-broadcasting).
   *
   * When enabled, stx starts a WebSocket broadcasting server alongside
   * the dev server and injects client helpers automatically.
   *
   * @example
   * ```ts
   * // stx.config.ts
   * export default {
   *   broadcasting: {
   *     enabled: true,
   *     port: 6001,
   *   }
   * }
   * ```
   */
  broadcasting?: Partial<BroadcastingConfig>

  /**
   * Custom API routes for the dev server.
   * Keys are path patterns (e.g. '/api/delete'), values are request handlers.
   * Handlers receive the standard Request and return a Response.
   */
  apiRoutes?: Record<string, (request: Request) => Response | Promise<Response>>

  /**
   * Client-side router configuration
   */
  router?: {
    enabled?: boolean
    container?: string
    linkSelector?: string
    /**
     * Intercept every in-app `<a>` for client-side navigation rather than
     * only those matching `linkSelector`. Default: false.
     */
    interceptAllLinks?: boolean
    viewTransitions?: boolean
    /**
     * Duration of the default View Transitions fade, in milliseconds.
     * Only applied when viewTransitions is enabled and the browser supports
     * document.startViewTransition. Default: 220.
     */
    viewTransitionDuration?: number
    /**
     * Easing curve for the default View Transitions fade. Any valid CSS
     * animation-timing-function. Default: cubic-bezier(0.16, 1, 0.3, 1).
     */
    viewTransitionEasing?: string
    scrollToTop?: boolean
    prefetch?: boolean
    cache?: boolean
    cacheTTL?: number
    skipSelectors?: string
    viewTransitionCSS?: Record<string, string>
    /**
     * Show the top loading/progress bar during client-side navigation.
     * Default: true.
     */
    progress?: boolean
    /**
     * Progress-bar color (hex, rgb, css var, etc.). Default: '#78dce8'.
     */
    progressColor?: string
    /**
     * Progress-bar height including units (e.g. '2px', '3px'). Default: '2px'.
     */
    progressHeight?: string
  }

  /**
   * Custom router instance (e.g. @stacksjs/bun-router) for API handling.
   * When set, incoming requests are passed to router.handleRequest() before
   * falling through to page routes. Takes precedence over apiRoutes for
   * matching paths.
   */
  apiRouter?: { handleRequest: (request: Request) => Response | Promise<Response> }
}

/**
 * SSG Build configuration for static site generation
 */
export interface BuildConfig {
  /** Directory containing page templates (default: 'pages') */
  pagesDir: string
  /** Output directory for generated files (default: 'dist') */
  outputDir: string
  /** Base URL path for the site (default: '/') */
  baseUrl: string
  /** Site domain for absolute URLs in sitemap */
  domain?: string
  /** Generate sitemap.xml (default: true) */
  sitemap: boolean
  /** Routes to omit from sitemap.xml and disallow in robots.txt. */
  sitemapExclude?: (string | RegExp)[]
  /** Generate robots.txt and optionally configure its rules. */
  robots?: boolean | import('../ssg').RobotsConfig
  /** Generate RSS feed */
  rss?: boolean | import('../ssg').RSSConfig
  /** Minify HTML output (default: true) */
  minify: boolean
  /** Enable build caching (default: true) */
  cache: boolean
  /** Cache directory (default: `ssg-cache` inside `stateDir`) */
  cacheDir: string
  /** Parallel page generation limit (default: 10) */
  concurrency: number
  /** Generate 404 page (default: true) */
  generate404: boolean
  /** Directory with static assets to copy (default: 'public') */
  publicDir: string
  /** Add trailing slashes to URLs (default: false) */
  trailingSlash: boolean
  /** Clean output directory before build (default: true) */
  cleanOutput: boolean
  /** ISR revalidation time in seconds */
  revalidate?: number | false
}

export type StxOptions = Partial<StxConfig>
