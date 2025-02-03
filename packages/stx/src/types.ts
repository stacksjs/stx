/**
 * STX Config
 */

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
  /** Path to the STX component file to convert */
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

export interface StxConfig {
  /** Enable STX features */
  enabled: boolean
  /** Path to partials directory, defaults to 'partials' in the same directory as the template */
  partialsDir: string
  /** Path to components directory, defaults to 'components' in the same directory as the template */
  componentsDir: string
  /** Enable debug mode for detailed error messages */
  debug: boolean
  /** Enable template caching to avoid recompiling unchanged templates */
  cache: boolean
  /** Directory to store cached templates, defaults to '.stx/cache' in the project root */
  cachePath: string
  /** Cache version to invalidate cache when the plugin version changes */
  cacheVersion: string
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
}

export type StxOptions = Partial<StxConfig>
