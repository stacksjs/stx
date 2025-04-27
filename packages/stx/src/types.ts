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

export interface StxConfig {
  /** Enable STX plugin */
  enabled: boolean
  /** Path to partials directory, defaults to 'partials' in the same directory as the template */
  partialsDir: string
  /** Path to components directory, defaults to 'components' in the same directory as the template */
  componentsDir: string
  /** Enable debug mode for detailed error messages */
  debug: boolean
  /** Enable template caching to avoid recompiling unchanged templates */
  cache: boolean
  /** Directory to store cached templates, defaults to '.stx-cache' in the project root */
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
}

export type StxOptions = Partial<StxConfig>
