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

/**
 * Generic template context that allows specifying custom typed properties
 *
 * @example
 * ```typescript
 * // Define your typed context
 * interface MyContext extends TypedContext<{
 *   user: { name: string; email: string }
 *   items: string[]
 *   count: number
 * }> {}
 *
 * // Use in template processing
 * const ctx: MyContext = {
 *   user: { name: 'John', email: 'john@example.com' },
 *   items: ['a', 'b'],
 *   count: 42
 * }
 * ```
 */
export type TypedContext<T extends Record<string, unknown>> = BaseTemplateContext & T

/**
 * Utility type to extract the value type from a context key
 */
export type ContextValue<C extends BaseTemplateContext, K extends keyof C> = C[K]

/**
 * Utility type to make certain context properties required
 */
export type RequireContextKeys<C extends BaseTemplateContext, K extends keyof C> =
  Required<Pick<C, K>> & Omit<C, K>

// =============================================================================
// Directive Types - Discriminated Unions
// =============================================================================

/**
 * Base directive type with common properties
 */
interface BaseDirective {
  /** The directive type for discriminated union */
  readonly kind: string
  /** Raw matched string from template */
  raw: string
  /** Start position in template */
  start: number
  /** End position in template */
  end: number
}

/**
 * Conditional directive (@if, @elseif, @else, @unless, @isset, @empty)
 */
export interface ConditionalDirective extends BaseDirective {
  kind: 'conditional'
  /** Specific conditional type */
  type: 'if' | 'elseif' | 'else' | 'endif' | 'unless' | 'endunless' | 'isset' | 'endisset' | 'empty' | 'endempty'
  /** Condition expression (undefined for @else, @endif, etc.) */
  condition?: string
  /** Content inside the directive block */
  content?: string
}

/**
 * Loop directive (@foreach, @for, @while, @forelse)
 */
export interface LoopDirective extends BaseDirective {
  kind: 'loop'
  /** Specific loop type */
  type: 'foreach' | 'endforeach' | 'for' | 'endfor' | 'while' | 'endwhile' | 'forelse' | 'empty' | 'endforelse'
  /** Loop expression (e.g., "items as item" or "let i = 0; i < 10; i++") */
  expression?: string
  /** Item variable name (for foreach) */
  itemVar?: string
  /** Array expression (for foreach) */
  arrayExpr?: string
  /** Content inside the loop */
  content?: string
  /** Empty content (for forelse) */
  emptyContent?: string
}

/**
 * Include directive (@include, @includeIf, @includeWhen, @includeUnless, @includeFirst)
 */
export interface IncludeDirective extends BaseDirective {
  kind: 'include'
  /** Specific include type */
  type: 'include' | 'includeIf' | 'includeWhen' | 'includeUnless' | 'includeFirst' | 'partial' | 'once'
  /** Path to the included template */
  path?: string
  /** Array of paths (for includeFirst) */
  paths?: string[]
  /** Condition expression (for includeWhen/includeUnless) */
  condition?: string
  /** Local variables to pass to included template */
  variables?: Record<string, any>
}

/**
 * Layout directive (@extends, @section, @yield, @parent)
 */
export interface LayoutDirective extends BaseDirective {
  kind: 'layout'
  /** Specific layout type */
  type: 'extends' | 'section' | 'endsection' | 'yield' | 'parent' | 'show'
  /** Layout or section name */
  name?: string
  /** Default content (for yield) */
  defaultContent?: string
  /** Section content */
  content?: string
}

/**
 * Component directive (@component, x-component)
 */
export interface ComponentDirective extends BaseDirective {
  kind: 'component'
  /** Specific component type */
  type: 'component' | 'endcomponent' | 'slot' | 'endslot'
  /** Component name */
  name?: string
  /** Component props */
  props?: Record<string, any>
  /** Slot name (for named slots) */
  slotName?: string
  /** Slot content */
  content?: string
}

/**
 * Auth directive (@auth, @guest, @can, @cannot)
 */
export interface AuthDirective extends BaseDirective {
  kind: 'auth'
  /** Specific auth type */
  type: 'auth' | 'endauth' | 'guest' | 'endguest' | 'can' | 'endcan' | 'cannot' | 'endcannot' | 'role' | 'endrole'
  /** Guard name (optional) */
  guard?: string
  /** Ability/permission name (for can/cannot) */
  ability?: string
  /** Additional arguments for permission check */
  arguments?: any[]
  /** Content inside the auth block */
  content?: string
}

/**
 * Form directive (@csrf, @method, @error, @old)
 */
export interface FormDirective extends BaseDirective {
  kind: 'form'
  /** Specific form type */
  type: 'csrf' | 'method' | 'error' | 'enderror' | 'old'
  /** HTTP method (for @method) */
  method?: 'PUT' | 'PATCH' | 'DELETE'
  /** Field name (for @error, @old) */
  field?: string
  /** Content inside error block */
  content?: string
}

/**
 * Stack directive (@push, @prepend, @stack)
 */
export interface StackDirective extends BaseDirective {
  kind: 'stack'
  /** Specific stack type */
  type: 'push' | 'endpush' | 'prepend' | 'endprepend' | 'stack'
  /** Stack name */
  name: string
  /** Content to push/prepend */
  content?: string
}

/**
 * Expression directive ({{ }}, {!! !!})
 */
export interface ExpressionDirective extends BaseDirective {
  kind: 'expression'
  /** Expression type */
  type: 'escaped' | 'raw'
  /** The expression to evaluate */
  expression: string
  /** Applied filters */
  filters?: Array<{
    name: string
    args?: any[]
  }>
}

/**
 * Switch directive (@switch, @case, @default)
 */
export interface SwitchDirective extends BaseDirective {
  kind: 'switch'
  /** Specific switch type */
  type: 'switch' | 'case' | 'default' | 'break' | 'endswitch'
  /** Switch expression */
  expression?: string
  /** Case value */
  caseValue?: any
  /** Content */
  content?: string
}

/**
 * SEO directive (@meta, @seo, @og, @twitter, @jsonld)
 */
export interface SeoDirective extends BaseDirective {
  kind: 'seo'
  /** Specific SEO type */
  type: 'meta' | 'seo' | 'og' | 'twitter' | 'jsonld' | 'canonical' | 'robots'
  /** Meta name or property */
  name?: string
  /** Meta content */
  metaContent?: string
  /** SEO configuration object */
  config?: Record<string, any>
}

/**
 * Accessibility directive (@a11y, @screenReader, @ariaDescribe)
 */
export interface A11yDirective extends BaseDirective {
  kind: 'a11y'
  /** Specific a11y type */
  type: 'screenReader' | 'srOnly' | 'ariaDescribe' | 'a11y'
  /** Screen reader text content */
  text?: string
  /** Target element selector (for ariaDescribe) */
  target?: string
  /** Description ID */
  descriptionId?: string
}

/**
 * JavaScript/TypeScript execution directive (@js, @ts)
 */
export interface ScriptDirective extends BaseDirective {
  kind: 'script'
  /** Script type */
  type: 'js' | 'ts'
  /** Script code to execute */
  code: string
}

/**
 * Environment directive (@env, @production, @development)
 */
export interface EnvDirective extends BaseDirective {
  kind: 'env'
  /** Specific env type */
  type: 'env' | 'endenv' | 'production' | 'endproduction' | 'development' | 'enddevelopment'
  /** Environment names to match */
  environments?: string[]
  /** Content */
  content?: string
}

/**
 * i18n directive (@translate, @t, @lang)
 */
export interface I18nDirective extends BaseDirective {
  kind: 'i18n'
  /** Specific i18n type */
  type: 'translate' | 't' | 'lang' | 'endlang' | 'choice'
  /** Translation key */
  key?: string
  /** Replacement parameters */
  params?: Record<string, any>
  /** Count for pluralization */
  count?: number
  /** Locale override */
  locale?: string
  /** Content (for lang blocks) */
  content?: string
}

/**
 * Custom directive (user-defined)
 */
export interface UserCustomDirective extends BaseDirective {
  kind: 'custom'
  /** Directive name */
  name: string
  /** Parameters passed to the directive */
  params: string[]
  /** Content inside the directive (if hasEndTag) */
  content?: string
}

/**
 * Union type of all directive types (discriminated union)
 *
 * Use the `kind` property to narrow the type:
 *
 * @example
 * ```typescript
 * function processDirective(directive: Directive) {
 *   switch (directive.kind) {
 *     case 'conditional':
 *       // TypeScript knows directive is ConditionalDirective here
 *       if (directive.type === 'if') {
 *         console.log(directive.condition)
 *       }
 *       break
 *     case 'loop':
 *       // TypeScript knows directive is LoopDirective here
 *       console.log(directive.expression)
 *       break
 *     // ... other cases
 *   }
 * }
 * ```
 */
export type Directive =
  | ConditionalDirective
  | LoopDirective
  | IncludeDirective
  | LayoutDirective
  | ComponentDirective
  | AuthDirective
  | FormDirective
  | StackDirective
  | ExpressionDirective
  | SwitchDirective
  | SeoDirective
  | A11yDirective
  | ScriptDirective
  | EnvDirective
  | I18nDirective
  | UserCustomDirective

/**
 * Type guard to check if a directive is a specific kind
 */
export function isDirectiveKind<K extends Directive['kind']>(
  directive: Directive,
  kind: K,
): directive is Extract<Directive, { kind: K }> {
  return directive.kind === kind
}

/**
 * Helper type to extract directive by kind
 */
export type DirectiveOfKind<K extends Directive['kind']> = Extract<Directive, { kind: K }>

// =============================================================================
// Custom Directive Types (Legacy - for backward compatibility)
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
  /** Output format: 'js' (default) or 'ts' for TypeScript */
  outputFormat?: 'js' | 'ts'
  /** Type definitions for observed attributes (for TypeScript output) */
  attributeTypes?: Record<string, 'string' | 'number' | 'boolean' | 'object'>
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
  story?: Partial<import('./story/types').StoryConfig>
  /** Progressive Web App (PWA) configuration */
  pwa?: Partial<PwaConfig>
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

// =============================================================================
// Progressive Web App (PWA) Types
// =============================================================================

/**
 * PWA caching strategy for service worker routes
 */
export type PwaCacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only'

/**
 * PWA route cache configuration
 * Defines how specific routes should be cached by the service worker
 */
export interface PwaRouteCache {
  /** Route pattern (glob-style, e.g., '/api/*', '*.{js,css}') */
  pattern: string
  /** Caching strategy for this route */
  strategy: PwaCacheStrategy
  /** Custom cache name for this route group */
  cacheName?: string
  /** Cache expiration in seconds */
  maxAgeSeconds?: number
  /** Maximum number of entries in cache */
  maxEntries?: number
}

/**
 * PWA icon configuration for automatic generation
 */
export interface PwaIconConfig {
  /** Source icon path (512x512 PNG recommended) */
  src: string
  /** Sizes to generate (default: [72, 96, 128, 144, 152, 192, 384, 512]) */
  sizes?: number[]
  /** Generate WebP variants alongside PNG */
  generateWebP?: boolean
  /** Generate Apple touch icon variants */
  generateAppleIcons?: boolean
  /** Output directory for generated icons (relative to output dir) */
  outputDir?: string
  /** Icon purpose for manifest ('any', 'maskable', 'monochrome') */
  purpose?: ('any' | 'maskable' | 'monochrome')[]
}

/**
 * PWA shortcut definition for app shortcuts menu
 */
export interface PwaShortcut {
  /** Shortcut name */
  name: string
  /** Short name (optional) */
  shortName?: string
  /** Description of the shortcut */
  description?: string
  /** URL to navigate to */
  url: string
  /** Icons for the shortcut */
  icons?: Array<{ src: string, sizes: string, type?: string }>
}

/**
 * PWA screenshot definition for app store listings
 */
export interface PwaScreenshot {
  /** Screenshot image path */
  src: string
  /** Image dimensions (e.g., '1280x720') */
  sizes: string
  /** Image MIME type */
  type?: string
  /** Screenshot label/description */
  label?: string
  /** Platform: 'wide' for desktop, 'narrow' for mobile */
  platform?: 'wide' | 'narrow'
}

/**
 * PWA Web App Manifest configuration
 */
export interface PwaManifestConfig {
  /** Full application name */
  name: string
  /** Short name (displayed on home screen) */
  shortName?: string
  /** Application description */
  description?: string
  /** Start URL when app is launched */
  startUrl?: string
  /** Display mode for the app */
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  /** Preferred orientation */
  orientation?: 'portrait' | 'landscape' | 'any' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'
  /** Theme color (affects browser UI) */
  themeColor?: string
  /** Background color (splash screen) */
  backgroundColor?: string
  /** Scope of the PWA */
  scope?: string
  /** Primary language */
  lang?: string
  /** Text direction */
  dir?: 'ltr' | 'rtl' | 'auto'
  /** App categories for store listings */
  categories?: string[]
  /** App shortcuts for quick actions */
  shortcuts?: PwaShortcut[]
  /** Screenshots for app store listings */
  screenshots?: PwaScreenshot[]
}

/**
 * PWA offline fallback page configuration
 */
export interface PwaOfflineConfig {
  /** Enable offline support */
  enabled: boolean
  /** Path to custom offline page (.stx file) */
  page?: string
  /** Fallback title when offline */
  fallbackTitle?: string
  /** Fallback message when offline */
  fallbackMessage?: string
  /** Additional assets to precache for offline access */
  precacheAssets?: string[]
}

/**
 * Service worker configuration
 */
export interface PwaServiceWorkerConfig {
  /** Service worker file name (default: 'sw.js') */
  fileName?: string
  /** Cache version for cache busting */
  cacheVersion?: string
  /** Skip waiting and activate immediately */
  skipWaiting?: boolean
  /** Claim all clients immediately */
  clientsClaim?: boolean
  /** Enable navigation preload */
  navigationPreload?: boolean
  /** Routes to exclude from caching (glob patterns) */
  excludeRoutes?: string[]
  /** File types to cache (extensions without dot) */
  cacheFileTypes?: string[]
}

/**
 * Complete PWA configuration
 */
export interface PwaConfig {
  /** Enable PWA features */
  enabled: boolean
  /** Web App Manifest configuration */
  manifest: PwaManifestConfig
  /** Icon generation configuration */
  icons?: PwaIconConfig
  /** Route-based caching strategies */
  routes?: PwaRouteCache[]
  /** Offline fallback configuration */
  offline?: PwaOfflineConfig
  /** Service worker configuration */
  serviceWorker?: PwaServiceWorkerConfig
  /** Auto-inject PWA meta tags and service worker registration */
  autoInject?: boolean
}

// =============================================================================
// Content Security Policy Types
// =============================================================================

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

export type StxOptions = Partial<StxConfig>
