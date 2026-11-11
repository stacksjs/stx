import type { Highlighter as TSHighlighter } from 'ts-syntax-highlighter'
import { codeBlockCss, SYNTAX_DARK, SYNTAX_LIGHT, syntaxPanelCss, syntaxTokenRules, syntaxVariables } from './syntax-theme'

type BrowserEntry = typeof import('ts-syntax-highlighter/browser')

/*
 * The highlighter, through its browser entry.
 *
 * This used to import the package root, and the root loads a config file from
 * disk through `bunfig`. Two things followed. In a browser bundle the root had
 * to be mapped to an empty module (package.json's `browser` field), so a call
 * from a page fell straight to plain text: client-side highlighting did not
 * exist. And on a server where `bunfig` was not reachable - which included this
 * package's own test runner - the import threw, and every block rendered plain
 * there too, quietly.
 *
 * The browser entry is the tokenizer, the grammars and nothing that touches a
 * filesystem, so the same call now works in both places.
 *
 * Still imported at call time, and still survivable: highlighting is
 * decoration and the code is the content, so a highlighter that cannot load
 * must not take the block with it. A `<script server>` that throws renders the
 * whole component as nothing.
 */
let entry: Promise<BrowserEntry | null> | null = null

function loadHighlighter(): Promise<BrowserEntry | null> {
  entry ??= import('ts-syntax-highlighter/browser').catch(() => null)

  return entry
}

let highlighterInstance: TSHighlighter | null = null

const LIGHT = 'github-light'
const DARK = 'github-dark'

export interface HighlighterOptions {
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  /** Number the lines. Drawn by CSS, so they are never part of a copy. */
  lineNumbers?: boolean
  wrapLines?: boolean
}

export interface HighlightResult {
  html: string
  /**
   * The styles `html` needs: the palettes as custom properties, the rules that
   * colour each token class from them, and the panel. `<CodeBlock>` ships the
   * same sheet itself, so this is for a caller rendering `html` somewhere a
   * `<CodeBlock>` is not.
   */
  css: string
  language: string
  theme: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** The code itself, escaped, for when highlighting is unavailable. */
function plainCodeHtml(code: string): string {
  return `<pre class="syntax"><code>${escapeHtml(code)}</code></pre>`
}

/**
 * The full highlighter from the package root, for a caller that wants its API.
 *
 * Server only: the root entry reads a config file. `highlight()` below does
 * not use it.
 */
export async function getHighlighter(): Promise<TSHighlighter> {
  if (!highlighterInstance) {
    const { createHighlighter } = await import('ts-syntax-highlighter')
    highlighterInstance = await createHighlighter({
      theme: 'github-light',
    })
  }
  return highlighterInstance
}

/**
 * Tokenized code as HTML, or null when it cannot be tokenized.
 *
 * A class on each token and no colour: `tok-keyword`, not
 * `style="color: #cf222e"`. The highlighter's own renderer writes the colour
 * inline, where no stylesheet can reach it, which is why this block could not
 * follow a dark-mode switch without rendering everything twice and reading the
 * colours back out (stacksjs/stx#2015). With classes, light and dark are one
 * piece of markup under two sets of custom properties.
 *
 * Works in a browser as well as on a server, so a block whose code changes
 * after the page has loaded can be highlighted again where it is.
 */
export async function highlightToHtml(
  code: string,
  options: { language?: string, theme?: 'light' | 'dark' | 'auto', lineNumbers?: boolean } = {},
): Promise<string | null> {
  const highlighter = await loadHighlighter()
  if (!highlighter)
    return null

  let lines: Array<{ tokens: Array<{ type: string, content: string }> }>
  try {
    const grammar = await highlighter.resolveGrammar(options.language ?? 'typescript')
    if (!grammar)
      return null

    lines = new highlighter.Tokenizer(grammar).tokenizeLinesFrom(code.replace(/\r\n?/g, '\n').split('\n')).lines
  }
  catch {
    return null
  }

  const html = lines.map((line) => {
    let out = ''
    let run = ''
    let runClass = ''

    const flush = (): void => {
      if (run !== '')
        out += runClass === '' ? escapeHtml(run) : `<span class="tok-${runClass}">${escapeHtml(run)}</span>`
      run = ''
    }

    // Neighbours of one class are one span.
    for (const token of line.tokens) {
      const cls = highlighter.tokenClass(token.type)
      if (cls !== runClass) {
        flush()
        runClass = cls
      }
      run += token.content
    }
    flush()

    return `<span class="line">${out}</span>`
  }).join('\n')

  const attributes = [
    'class="syntax"',
    options.theme === 'light' || options.theme === 'dark' ? `data-syntax-theme="${options.theme}"` : '',
    options.lineNumbers ? 'data-line-numbers' : '',
  ].filter(Boolean).join(' ')

  return `<pre ${attributes}><code>${html}</code></pre>`
}

/** The stylesheet for one result: every palette for `auto`, one for a pinned theme. */
function cssFor(theme: 'light' | 'dark' | 'auto'): string {
  if (theme === 'auto')
    return codeBlockCss()

  const palette = theme === 'dark' ? SYNTAX_DARK : SYNTAX_LIGHT

  return [
    `[data-syntax-theme="${theme}"] {\n${syntaxVariables(palette)}\n}`,
    syntaxTokenRules(),
    syntaxPanelCss(),
  ].join('\n')
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
  } = options

  const html = await highlightToHtml(code, { language, theme, lineNumbers })

  if (html === null) {
    /*
     * The plain-text floor. It reports a concrete palette even for `auto`,
     * because `auto` means "both palettes shipped" and here neither did
     * (stacksjs/stx#2015): the field says what was emitted, not what was asked.
     */
    return { html: plainCodeHtml(code), css: '', language, theme: theme === 'dark' ? DARK : LIGHT }
  }

  return {
    html,
    css: cssFor(theme),
    language,
    theme: theme === 'auto' ? 'auto' : theme === 'dark' ? DARK : LIGHT,
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
