/**
 * stx Config
 */

// =============================================================================
// Context Types - Typed interfaces for template context objects
// =============================================================================

/**
 * Loop context object available within @foreach loops
 * Provides iteration metadata for template logic
 */
export interface LoopContext {
  /** Current zero-based index */
  index: number
  /** Current one-based iteration count */
  iteration: number
  /** Whether this is the first iteration */
  first: boolean
  /** Whether this is the last iteration */
  last: boolean
  /** Total number of items in the array */
  count: number
}

/**
 * Authentication context for @auth, @guest, @can directives
 * Required shape for auth-related template directives
 *
 * @example
 * ```typescript
 * const authContext: AuthContext = {
 *   check: true,
 *   user: { id: 1, name: 'John', role: 'admin' }
 * }
 * ```
 */
export interface AuthContext {
  /** Whether the user is authenticated */
  check: boolean
  /** User object (null if not authenticated) */
  user: Record<string, any> | null
}

/**
 * Permissions context for @can, @cannot directives
 *
 * @example
 * ```typescript
 * const permissions: PermissionsContext = {
 *   check: (ability, type?, id?) => {
 *     // Check if user has the ability
 *     return user.abilities.includes(ability)
 *   }
 * }
 * ```
 */
export interface PermissionsContext {
  /** Function to check if user has a specific permission */
  check: (ability: string, type?: string, id?: any) => boolean
}

/**
 * Translation context for @translate, @t directives
 */
export interface TranslationContext {
  /** Translation lookup object keyed by locale */
  [locale: string]: Record<string, string>
}

/**
 * Base template context with common properties
 * Extend this interface for specific template contexts
 */
export interface BaseTemplateContext {
  /** Authentication context (optional) */
  auth?: AuthContext
  /** Permissions context (optional) */
  permissions?: PermissionsContext
  /** User permissions map for simple boolean checks */
  userCan?: Record<string, boolean>
  /** Translations for i18n */
  __translations?: TranslationContext
  /** Internal sections storage (set by layout processing) */
  __sections?: Record<string, string>
  /** Internal stx options reference */
  __stx_options?: StxOptions
  /** Loop context (available within @foreach) */
  loop?: LoopContext
  /** Alias for loop context to avoid conflicts with user variables */
  $loop?: LoopContext
  /** Slot content for components */
  slot?: string
  /** Allow additional properties */
  [key: string]: any
}

/**
 * Template context type alias for backward compatibility
 * Use BaseTemplateContext for new code
 */
export type TemplateContext = BaseTemplateContext

// =============================================================================
// Directive Types
// =============================================================================

/**
 * Custom directive handler function
 */
export type CustomDirectiveHandler = (
  content: string,
  params: string[],
  context: Record<string, any>,
  filePath: string
) => string | Promise<string>

/**
 * Custom directive definition
 */
export interface CustomDirective {
  /** The name of the directive without the @ symbol (e.g., 'uppercase') */
  name: string
  /** Handler function for the directive */
  handler: CustomDirectiveHandler
  /** Whether the directive has a closing tag (e.g., @uppercase...@enduppercase) */
  hasEndTag?: boolean
  /** Optional description for documentation */
  description?: string
}

/**
 * Middleware handler function
 */
export type MiddlewareHandler = (
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions
) => string | Promise<string>

/**
 * Middleware definition
 */
export interface Middleware {
  /** Unique name for the middleware */
  name: string
  /** Handler function for the middleware */
  handler: MiddlewareHandler
  /** When to run this middleware (before or after directive processing) */
  timing: 'before' | 'after'
  /** Optional description for documentation */
  description?: string
}

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
 * Web component definition
 */
export interface WebComponent {
  /** Name of the web component class */
  name: string
  /** HTML tag to register (must include a hyphen) */
  tag: string
  /** Path to the stx component file to convert */
  file: string
  /** Optional element to extend (default: HTMLElement) */
  extends?: string
  /** Whether to use shadow DOM (default: true) */
  shadowDOM?: boolean
  /** Whether to use a template element (default: true) */
  template?: boolean
  /** Path to an external stylesheet to link */
  styleSource?: string
  /** List of attributes to observe */
  attributes?: string[]
  /** Description of the component for documentation */
  description?: string
}

/**
 * Web components configuration
 */
export interface WebComponentConfig {
  /** Enable web component integration */
  enabled: boolean
  /** Directory to output web components */
  outputDir: string
  /** Web components to build */
  components: WebComponent[]
}

/**
 * Documentation format options
 */
export type DocFormat = 'markdown' | 'html' | 'json'

/**
 * Component property documentation
 */
export interface ComponentPropDoc {
  /** Name of the property */
  name: string
  /** Type of the property (e.g., string, number, boolean) */
  type?: string
  /** Whether the property is required */
  required?: boolean
  /** Default value if any */
  default?: string
  /** Description of the property */
  description?: string
}

/**
 * Component documentation
 */
export interface ComponentDoc {
  /** Name of the component */
  name: string
  /** File path */
  path: string
  /** Component description */
  description?: string
  /** Component properties/attributes */
  props: ComponentPropDoc[]
  /** Example usage */
  example?: string
  /** Whether this is a web component */
  isWebComponent?: boolean
  /** HTML tag if it's a web component */
  tag?: string
}

/**
 * Template documentation
 */
export interface TemplateDoc {
  /** Template name */
  name: string
  /** File path */
  path: string
  /** Description */
  description?: string
  /** Used components */
  components?: string[]
  /** Used directives */
  directives?: string[]
}

/**
 * Directive documentation
 */
export interface DirectiveDoc {
  /** Directive name */
  name: string
  /** Description */
  description?: string
  /** Has end tag */
  hasEndTag: boolean
  /** Example usage */
  example?: string
}

/**
 * Documentation generator configuration
 */
export interface DocGeneratorConfig {
  /** Enable documentation generation */
  enabled: boolean
  /** Output directory for documentation */
  outputDir: string
  /** Format of generated documentation */
  format: DocFormat
  /** Generate docs for components */
  components: boolean
  /** Generate docs for templates */
  templates: boolean
  /** Generate docs for directives */
  directives: boolean
  /** Extra content to include in documentation */
  extraContent?: string
  /** Custom template for documentation */
  template?: string
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
  renderShell: (data?: Record<string, any>) => Promise<string>
  /** Render a specific section of the template */
  renderSection: (section: string, data?: Record<string, any>) => Promise<string>
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
  props?: Record<string, any>
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
  structuredData?: Record<string, any>
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

// =============================================================================
// Component System Types
// =============================================================================

/**
 * Prop type definition for component prop validation
 */
export type PropType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function' | 'any'

/**
 * Component prop definition for validation
 */
export interface PropDefinition {
  /** Type of the prop */
  type: PropType | PropType[]
  /** Whether the prop is required */
  required?: boolean
  /** Default value if not provided */
  default?: any
  /** Custom validator function */
  validator?: (value: any) => boolean
}

/**
 * Component props schema for validation
 *
 * @example
 * ```typescript
 * const alertProps: ComponentPropsSchema = {
 *   title: { type: 'string', required: true },
 *   type: { type: 'string', default: 'info' },
 *   dismissible: { type: 'boolean', default: false }
 * }
 * ```
 */
export interface ComponentPropsSchema {
  [propName: string]: PropDefinition
}

/**
 * Component definition with metadata
 */
export interface ComponentDefinition {
  /** Component name */
  name: string
  /** Path to component file */
  path?: string
  /** Props schema for validation */
  props?: ComponentPropsSchema
  /** Component description for documentation */
  description?: string
}

/**
 * Component configuration
 */
export interface ComponentConfig {
  /** Enable prop validation */
  validateProps?: boolean
  /** Component definitions for prop validation */
  components?: Record<string, ComponentDefinition>
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

export type StxOptions = Partial<StxConfig>
