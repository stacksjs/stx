import type { Highlighter as TSHighlighter } from 'ts-syntax-highlighter'

// Imported at call time, not at module load. A static import here made the
// highlighter's own resolution a load-time dependency of this module, so
// anything importing it -- CodeBlock's <script server> -- died with it, and a
// server block that throws renders the component as nothing at all. 0.2.17
// ships a bundle that imports `bunfig` while declaring no dependencies, which
// is exactly the resolution failure that has to stay survivable.
async function loadCreateHighlighter(): Promise<typeof import('ts-syntax-highlighter')['createHighlighter'] | null> {
  try {
    const mod = await import('ts-syntax-highlighter')
    return mod.createHighlighter
  }
  catch {
    return null
  }
}

let highlighterInstance: TSHighlighter | null = null

export interface HighlighterOptions {
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  lineNumbers?: boolean
  wrapLines?: boolean
}

export interface HighlightResult {
  html: string
  /**
   * The token styles for `html`. Nothing else in this package ships styles for
   * the highlighter's class names, so a block rendered without this CSS is
   * correctly marked up and visually plain.
   */
  css: string
  language: string
  theme: string
}

/** The code itself, escaped, for when highlighting is unavailable. */
function plainCodeHtml(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<pre class="syntax"><code>${escaped}</code></pre>`
}

/**
 * Initialize or get the syntax highlighter instance
 */
export async function getHighlighter(): Promise<TSHighlighter> {
  if (!highlighterInstance) {
    const createHighlighter = await loadCreateHighlighter()
    if (!createHighlighter)
      throw new Error('ts-syntax-highlighter could not be loaded')
    highlighterInstance = await createHighlighter({
      theme: 'github-light',
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
    lineNumbers: _lineNumbers = false,
    wrapLines: _wrapLines = true,
  } = options

  /*
   * Resolved before anything can return, so every exit reports the theme that
   * was asked for.
   *
   * It used to be computed after the load guard below, which returned a
   * hardcoded `github-light` on that path: a caller asking for dark and getting
   * the plain-text floor was told it got light, which is a second untruth on
   * top of the first (stacksjs/stx#2015).
   *
   * `auto` still resolves light on a server. `highlight()` is called from
   * `<script server>`, where `globalThis.matchMedia` does not exist, and a
   * viewer's preference is not knowable at render time anyway. Selecting a
   * palette in JS cannot answer that question; emitting both and letting CSS
   * choose can, and is not possible yet because this highlighter writes token
   * colours as inline `style` attributes on each span rather than through its
   * token classes, so no media query can override them. Its `renderDualTheme`
   * is the right shape for it and takes `TokenLine[]`, which no public method
   * returns. Tracked on the issue; `theme: 'dark'` is the explicit escape until
   * then.
   */
  const effectiveTheme = theme === 'auto'
    ? (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'github-dark' : 'github-light')
    : theme === 'dark' ? 'github-dark' : 'github-light'

  // A highlighter that cannot load must not take the code with it. Highlighting
  // is decoration; the code is the content. ts-syntax-highlighter@0.2.17 ships a
  // bundle that imports `bunfig` while declaring no dependencies, so it throws
  // outright wherever that package is not reachable -- and a <script server>
  // that throws renders the whole component as nothing, with no error logged.
  // Escaped plain text is the floor.
  let highlighter: TSHighlighter
  try {
    highlighter = await getHighlighter()
  }
  catch {
    return { html: plainCodeHtml(code), css: '', language, theme: effectiveTheme }
  }

  // ts-syntax-highlighter returns { html, css, tokens, ansi }. This read the
  // whole result as if it were the HTML string, and the `String(...)` meant to
  // be defensive turned the object into the literal text [object Object] --
  // which is what every CodeBlock rendered, instead of the code. A fallback
  // that stringifies anything cannot tell a wrong shape from a right one.
  let result: unknown
  try {
    // The theme belongs here. It was resolved above and then dropped, so every
    // render came from the instance's own `github-light` and every CodeBlock in
    // every app was light whatever it asked for, while the returned `theme`
    // field reported the request. `RenderOptions.theme` overrides the instance
    // per call, which is what keeps one shared highlighter usable for both.
    result = await highlighter.highlight(code, language, { theme: effectiveTheme })
  }
  catch {
    return { html: plainCodeHtml(code), css: '', language, theme: effectiveTheme }
  }
  const shaped = result as { html?: string, css?: string } | string | null
  const highlighted = typeof shaped === 'string'
    ? { html: shaped, css: '' }
    : { html: shaped?.html ?? plainCodeHtml(code), css: shaped?.css ?? '' }

  return {
    html: highlighted.html,
    css: highlighted.css,
    language,
    theme: effectiveTheme,
  }
}

/**
 * Detect language from code content
 */
export function detectLanguage(code: string): string {
  // Simple heuristics for language detection
  if (code.includes('<!DOCTYPE') || code.includes('<html'))
    return 'html'
  if (code.includes('<?php'))
    return 'php'
  if (code.includes('import') && code.includes('from'))
    return 'typescript'
  if (code.includes('function') || code.includes('const'))
    return 'javascript'
  if (code.includes('{') && code.includes('}'))
    return 'json'
  if (code.includes('$') && code.includes('|'))
    return 'bash'
  if (code.includes('#') && code.includes('##'))
    return 'markdown'

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
