import { createHighlighter, type Highlighter as TSHighlighter } from 'ts-syntax-highlighter'

let highlighterInstance: TSHighlighter | null = null

export interface HighlighterOptions {
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  lineNumbers?: boolean
  wrapLines?: boolean
}

export interface HighlightResult {
  html: string
  language: string
  theme: string
}

/**
 * Initialize or get the syntax highlighter instance
 */
export async function getHighlighter(): Promise<TSHighlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      languages: [
        'typescript',
        'javascript',
        'html',
        'css',
        'json',
        'bash',
        'markdown',
        'vue',
        'jsx',
        'tsx',
      ],
    })
  }
  return highlighterInstance
}

/**
 * Highlight code with syntax highlighting
 */
export async function highlight(
  code: string,
  options: HighlighterOptions = {},
): Promise<HighlightResult> {
  const {
    theme = 'auto',
    language = 'typescript',
    lineNumbers = false,
    wrapLines = true,
  } = options

  const highlighter = await getHighlighter()

  // Auto-detect theme based on system preference
  const effectiveTheme = theme === 'auto'
    ? (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'github-dark' : 'github-light')
    : theme === 'dark' ? 'github-dark' : 'github-light'

  const html = highlighter.highlight(code, {
    lang: language,
    theme: effectiveTheme,
    lineNumbers,
    wrapLines,
  })

  return {
    html,
    language,
    theme: effectiveTheme,
  }
}

/**
 * Detect language from code content
 */
export function detectLanguage(code: string): string {
  // Simple heuristics for language detection
  if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html'
  if (code.includes('<?php')) return 'php'
  if (code.includes('import') && code.includes('from')) return 'typescript'
  if (code.includes('function') || code.includes('const')) return 'javascript'
  if (code.includes('{') && code.includes('}')) return 'json'
  if (code.includes('$') && code.includes('|')) return 'bash'
  if (code.includes('#') && code.includes('##')) return 'markdown'

  return 'typescript' // Default
}

/**
 * Apply headwind utility classes to highlighted code
 */
export function applyHeadwindClasses(html: string, additionalClasses?: string): string {
  const baseClasses = 'rounded-md overflow-auto text-sm leading-relaxed font-mono'
  const classes = additionalClasses ? `${baseClasses} ${additionalClasses}` : baseClasses

  // Wrap the highlighted HTML with headwind classes
  return `<div class="${classes}">${html}</div>`
}
