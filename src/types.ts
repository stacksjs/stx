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
}

export type StxOptions = Partial<StxConfig>
