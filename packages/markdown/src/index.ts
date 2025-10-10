/**
 * @stacksjs/markdown
 *
 * A fast, native Bun-powered markdown parser with frontmatter support.
 * Replaces gray-matter, marked, and yaml with performance-optimized implementations.
 */

// Default export for common use case
import { parse as parseFrontmatter } from './frontmatter'
import { parse as parseMarkdown } from './parser'

export * as frontmatter from './frontmatter'
// Re-export for convenience
export { parse as parseFrontmatter, stringify as stringifyFrontmatter } from './frontmatter'
export * from './parser'
export { parse as parseMarkdown, parseSync as parseMarkdownSync } from './parser'

export * from './types'
export * as yaml from './yaml'
export { parse as parseYaml, stringify as stringifyYaml } from './yaml'

/**
 * Parse markdown file with frontmatter in one go
 */
export function parseMarkdownWithFrontmatter<T = Record<string, any>>(
  content: string,
  options?: { gfm?: boolean, breaks?: boolean },
): { data: T, content: string, html: string } {
  const { data, content: markdown } = parseFrontmatter<T>(content)
  const html = parseMarkdown(markdown, options)

  return {
    data,
    content: markdown,
    html,
  }
}

/**
 * Default export
 */
const markdownParser: {
  parseFrontmatter: typeof parseFrontmatter
  parseMarkdown: typeof parseMarkdown
  parseMarkdownWithFrontmatter: typeof parseMarkdownWithFrontmatter
} = {
  parseFrontmatter,
  parseMarkdown,
  parseMarkdownWithFrontmatter,
}

export default markdownParser
