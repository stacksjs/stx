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

const LIGHT = 'github-light'
const DARK = 'github-dark'

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

/*
 * Matched on the class ATTRIBUTE generally, then filtered, rather than with
 * `class="token …"` written into the pattern: the linter reads that literal as
 * a Tailwind class list and asks for it to be reordered.
 */
const STYLED_SPAN = /<span class="([^"]*)"[^>]*style="([^"]*)"/g
const TOKEN_CLASS = /^token\s+(\S.*)$/

/** `color: #rrggbb; font-style: italic` on each token span, in document order. */
function tokenStyles(html: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const m of html.matchAll(STYLED_SPAN)) {
    const token = TOKEN_CLASS.exec(m[1] ?? '')
    if (token)
      out.push([token[1]!.trim(), m[2] ?? ''])
  }
  return out
}

/** A CSS class is safe to put in a selector; a scope name from a theme is not. */
function selectorSafe(cls: string): boolean {
  return /^[\w-]+$/.test(cls)
}

/**
 * Both palettes as CSS, with the inline colours stripped so the rules apply.
 *
 * The engine writes token colours inline, which no media query can override, so
 * `auto` could only ever ship one palette (stacksjs/stx#2015). This renders the
 * same code under each theme, pairs the spans by position - they are the same
 * tokens, so the two renders align exactly - and re-emits the colours as rules
 * on the `.token` classes the spans already carry.
 *
 * Returns null when the two renders do not align or nothing is coloured, so a
 * surprise from the engine degrades to the single-palette path rather than to
 * an unstyled block.
 */
async function dualTheme(
  highlighter: TSHighlighter,
  code: string,
  language: string,
): Promise<{ html: string, css: string } | null> {
  let light: { html?: string, css?: string }
  let dark: { html?: string, css?: string }
  try {
    light = await highlighter.highlight(code, language, { theme: LIGHT }) as { html?: string, css?: string }
    dark = await highlighter.highlight(code, language, { theme: DARK }) as { html?: string, css?: string }
  }
  catch {
    return null
  }

  const lightHtml = light?.html
  const darkHtml = dark?.html
  if (!lightHtml || !darkHtml)
    return null

  const lightStyles = tokenStyles(lightHtml)
  const darkStyles = tokenStyles(darkHtml)
  if (lightStyles.length === 0 || lightStyles.length !== darkStyles.length)
    return null

  // First occurrence wins: a token class maps to one scope, so every span
  // carrying it resolves to the same colour in a given theme.
  const palette = new Map<string, { light: string, dark: string }>()
  for (let i = 0; i < lightStyles.length; i++) {
    const [cls, lightStyle] = lightStyles[i]!
    const darkStyle = darkStyles[i]![1]
    if (!cls || !lightStyle || !darkStyle || palette.has(cls) || !selectorSafe(cls))
      continue
    palette.set(cls, { light: lightStyle, dark: darkStyle })
  }
  if (palette.size === 0)
    return null

  const rules: string[] = []
  const darkRules: string[] = []
  for (const [cls, { light: l, dark: d }] of palette) {
    rules.push(`.syntax .token.${cls} { ${l} }`)
    darkRules.push(`.syntax .token.${cls} { ${d} }`)
  }

  /*
   * The PANEL as well as the tokens. `.syntax` carries
   * `background-color: #ffffff` from the light stylesheet and the issue names
   * it directly - dark token colours on a white panel is the same bug in
   * reverse, and it is the half a reader notices first. Taken from the engine's
   * own dark stylesheet rather than from the theme's `colors` map, for the same
   * reason the token colours are: its resolution stays authoritative.
   */
  const darkPanel = /\.syntax\s*\{([^}]*)\}/.exec(dark.css ?? '')?.[1]
  const panelDecls = darkPanel
    ? darkPanel.split(';').map(d => d.trim()).filter(d => /^(?:background-color|color)\s*:/.test(d)).join('; ')
    : ''
  if (panelDecls)
    darkRules.unshift(`.syntax { ${panelDecls} }`)

  /*
   * Both switches, matching how the rest of the library does dark mode: the
   * media query for a viewer following their OS, and `.dark` for an app with a
   * manual toggle. The media query is guarded against a page pinned to light,
   * or an app that chose light on a dark OS would get dark code.
   */
  const css = [
    light.css ?? '',
    rules.join('\n'),
    `@media (prefers-color-scheme: dark) {\n:root:not(.light) ${darkRules.join('\n:root:not(.light) ')}\n}`,
    darkRules.map(rule => `.dark ${rule}`).join('\n'),
  ].filter(Boolean).join('\n')

  // Stripped, or the inline colour beats every rule above. Same reason as
  // STYLED_SPAN for not writing the class literal into the pattern.
  const html = lightHtml.replace(
    /(<span class="[^"]*")[^>]*?\s+style="[^"]*"/g,
    (whole, open: string) => (TOKEN_CLASS.test(/class="([^"]*)"/.exec(open)?.[1] ?? '') ? open : whole),
  )

  return { html, css }
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
   * `auto` emits BOTH palettes and lets CSS choose, rather than probing
   * matchMedia. `highlight()` runs in `<script server>`, where
   * `globalThis.matchMedia` does not exist and a viewer's preference is not
   * knowable at render time anyway, so selecting a palette in JS cannot answer
   * the question at all - it just always answered "light".
   *
   * `renderDualTheme` is the shape the engine offers for this and does not
   * solve it: its CSS styles the `.syntax` CONTAINER for both modes but leaves
   * every token colour where the highlighter puts it, in an inline `style`
   * attribute that no stylesheet rule can override. That would give a dark
   * panel with light-theme token colours - the unreadable half of the bug,
   * kept. There are no per-token-type rules in its output to override either,
   * in single or dual mode.
   *
   * So `dualTheme()` below renders the same code under each palette, reads
   * back the colours the highlighter itself assigned, and emits them as rules
   * keyed on the token classes already present on the spans - with the inline
   * styles stripped so the rules win. Reading them back rather than resolving
   * the themes' TextMate scopes keeps the engine's own resolution authoritative
   * instead of reimplementing it.
   */
  const effectiveTheme = theme === 'auto'
    ? (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'github-dark' : 'github-light')
    : theme === 'dark' ? DARK : LIGHT

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

  /*
   * `auto` means both palettes, chosen by CSS. Falls through to the single
   * palette below if the engine's two renders do not line up, so a surprise
   * degrades to today's behaviour rather than to an unstyled block.
   */
  if (theme === 'auto') {
    const dual = await dualTheme(highlighter, code, language)
    if (dual)
      return { html: dual.html, css: dual.css, language, theme: 'auto' }
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
