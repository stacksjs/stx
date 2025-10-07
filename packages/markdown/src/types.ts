/**
 * Markdown parsing options
 */
export interface MarkdownOptions {
  /** Enable GitHub Flavored Markdown */
  gfm?: boolean
  /** Convert line breaks to <br> */
  breaks?: boolean
  /** Enable header IDs */
  headerIds?: boolean
  /** Prefix for header IDs */
  headerPrefix?: string
  /** Enable syntax highlighting */
  highlight?: (code: string, lang: string) => string
  /** Pedantic mode */
  pedantic?: boolean
  /** Use smarter list behavior */
  smartLists?: boolean
  /** Use "smart" typographic punctuation */
  smartypants?: boolean
  /** Sanitize HTML output */
  sanitize?: boolean
}

/**
 * Parsed markdown with frontmatter
 */
export interface ParsedMarkdown<T = Record<string, any>> {
  /** Parsed frontmatter data */
  data: T
  /** Markdown content (without frontmatter) */
  content: string
  /** Original content */
  original: string
  /** Matter section (frontmatter text) */
  matter?: string
}

/**
 * YAML parsing options
 */
export interface YamlOptions {
  /** Strict mode */
  strict?: boolean
  /** Custom schema */
  schema?: 'core' | 'json' | 'default'
}

/**
 * Token types for markdown parsing
 */
export interface Token {
  type: string
  raw: string
  depth?: number
  text?: string
  tokens?: Token[]
  lang?: string
  href?: string
  title?: string
  ordered?: boolean
  start?: number
  loose?: boolean
  items?: Token[]
  header?: string[]
  align?: Array<'left' | 'center' | 'right' | null>
  rows?: string[][]
  task?: boolean
  checked?: boolean
}
