/**
 * STX Config
 */
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
}

export type StxOptions = Partial<StxConfig>
