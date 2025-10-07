/* eslint-disable regexp/no-super-linear-backtracking */
import type { MarkdownOptions } from './types'

/**
 * Ultra-optimized single-pass Markdown parser for Bun
 * Generates HTML directly without intermediate tokens for maximum speed
 */

const defaultOptions: MarkdownOptions = {
  gfm: true,
  breaks: false,
  headerIds: true,
  headerPrefix: '',
  pedantic: false,
  smartLists: true,
  smartypants: false,
  sanitize: false,
}

// Character codes for fast comparison
const CHAR_HASH = 35    // #
const CHAR_STAR = 42    // *
const CHAR_PLUS = 43    // +
const CHAR_DASH = 45    // -
const CHAR_NEWLINE = 10 // \n
const CHAR_SPACE = 32   // space
const CHAR_GT = 62      // >
const CHAR_BACKTICK = 96 // `
const CHAR_PIPE = 124   // |
const CHAR_UNDERSCORE = 95 // _
const CHAR_LT = 60      // <
const CHAR_AMP = 38     // &
const CHAR_QUOT = 34    // "
const CHAR_APOS = 39    // '
const CHAR_LBRACKET = 91  // [
const CHAR_RBRACKET = 93  // ]
const CHAR_LPAREN = 40    // (
const CHAR_RPAREN = 41    // )
const CHAR_EXCLAIM = 33   // !
const CHAR_TILDE = 126    // ~

/**
 * Parse markdown to HTML - ultra-fast single-pass version
 */
export function parse(markdown: string, options: MarkdownOptions = {}): string {
  const opts = { ...defaultOptions, ...options }
  return parseMarkdown(markdown, opts)
}

export function parseSync(markdown: string, options: MarkdownOptions = {}): string {
  return parse(markdown, options)
}

/**
 * Main parser - single pass, direct HTML generation
 */
function parseMarkdown(input: string, opts: MarkdownOptions): string {
  const len = input.length
  const output: string[] = []
  let i = 0

  // Normalize line endings
  const content = input.includes('\r')
    ? input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    : input

  while (i < len) {
    const char = content.charCodeAt(i)

    // Skip leading newlines
    if (char === CHAR_NEWLINE) {
      i++
      continue
    }

    // Headers (must be at start of line)
    if (char === CHAR_HASH) {
      const result = parseHeader(content, i, len, opts)
      if (result) {
        output.push(result.html)
        i = result.pos
        continue
      }
    }

    // Fenced code blocks
    if (char === CHAR_BACKTICK && content.charCodeAt(i + 1) === CHAR_BACKTICK && content.charCodeAt(i + 2) === CHAR_BACKTICK) {
      const result = parseCodeBlock(content, i, len, opts)
      if (result) {
        output.push(result.html)
        i = result.pos
        continue
      }
    }

    // Horizontal rules
    if ((char === CHAR_STAR || char === CHAR_DASH || char === CHAR_UNDERSCORE) && isHorizontalRule(content, i, len)) {
      const result = skipHorizontalRule(content, i, len)
      output.push('<hr>\n')
      i = result.pos
      continue
    }

    // Blockquotes
    if (char === CHAR_GT) {
      const result = parseBlockquote(content, i, len, opts)
      if (result) {
        output.push(result.html)
        i = result.pos
        continue
      }
    }

    // Lists
    if (char === CHAR_STAR || char === CHAR_PLUS || char === CHAR_DASH || (char >= 48 && char <= 57)) {
      const result = parseList(content, i, len, opts)
      if (result) {
        output.push(result.html)
        i = result.pos
        continue
      }
    }

    // Tables (GFM)
    if (opts.gfm && char === CHAR_PIPE) {
      const result = parseTable(content, i, len, opts)
      if (result) {
        output.push(result.html)
        i = result.pos
        continue
      }
    }

    // Paragraphs (default)
    const result = parseParagraph(content, i, len, opts)
    output.push(result.html)
    i = result.pos
  }

  return output.join('')
}

/**
 * Parse header - optimized
 */
function parseHeader(content: string, start: number, len: number, opts: MarkdownOptions): { html: string, pos: number } | null {
  let i = start
  let depth = 0

  // Count # characters
  while (i < len && content.charCodeAt(i) === CHAR_HASH && depth < 6) {
    depth++
    i++
  }

  if (depth === 0 || i >= len || content.charCodeAt(i) !== CHAR_SPACE) {
    return null
  }

  i++ // Skip space

  // Find end of line
  const lineStart = i
  while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) {
    i++
  }

  const text = content.substring(lineStart, i).trim()
  const id = opts.headerIds ? ` id="${opts.headerPrefix}${slugify(text)}"` : ''
  const innerHtml = parseInline(text, opts)

  return {
    html: `<h${depth}${id}>${innerHtml}</h${depth}>\n`,
    pos: i + 1,
  }
}

/**
 * Parse code block - optimized
 */
function parseCodeBlock(content: string, start: number, len: number, opts: MarkdownOptions): { html: string, pos: number } | null {
  let i = start + 3 // Skip ```

  // Get language
  const langStart = i
  while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) {
    i++
  }
  const lang = content.substring(langStart, i)
  i++ // Skip newline

  // Find closing ```
  const codeStart = i
  while (i < len - 2) {
    if (content.charCodeAt(i) === CHAR_BACKTICK &&
        content.charCodeAt(i + 1) === CHAR_BACKTICK &&
        content.charCodeAt(i + 2) === CHAR_BACKTICK) {
      const code = content.substring(codeStart, i)
      const escaped = opts.highlight && lang
        ? opts.highlight(code, lang)
        : escapeHtml(code)

      i += 3 // Skip closing ```
      if (i < len && content.charCodeAt(i) === CHAR_NEWLINE) i++

      return {
        html: `<pre><code class="language-${lang}">${escaped}</code></pre>\n`,
        pos: i,
      }
    }
    i++
  }

  return null
}

/**
 * Check if line is a horizontal rule
 */
function isHorizontalRule(content: string, start: number, len: number): boolean {
  const char = content.charCodeAt(start)
  let count = 0
  let i = start

  while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) {
    const c = content.charCodeAt(i)
    if (c === char) {
      count++
    } else if (c !== CHAR_SPACE && c !== 9) { // not space or tab
      return false
    }
    i++
  }

  return count >= 3
}

function skipHorizontalRule(content: string, start: number, len: number): { pos: number } {
  let i = start
  while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) {
    i++
  }
  return { pos: i + 1 }
}

/**
 * Parse blockquote - optimized
 */
function parseBlockquote(content: string, start: number, len: number, opts: MarkdownOptions): { html: string, pos: number } | null {
  const lines: string[] = []
  let i = start

  while (i < len) {
    if (content.charCodeAt(i) !== CHAR_GT) {
      break
    }

    i++ // Skip >
    if (content.charCodeAt(i) === CHAR_SPACE) i++ // Skip optional space

    const lineStart = i
    while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) {
      i++
    }

    lines.push(content.substring(lineStart, i))
    i++ // Skip newline

    // Check if next line is also a blockquote
    if (i >= len || content.charCodeAt(i) !== CHAR_GT) {
      break
    }
  }

  if (lines.length === 0) return null

  const innerContent = lines.join('\n')
  const innerHtml = parseMarkdown(innerContent, opts)

  return {
    html: `<blockquote>\n${innerHtml}</blockquote>\n`,
    pos: i,
  }
}

/**
 * Parse list - optimized
 */
function parseList(content: string, start: number, len: number, opts: MarkdownOptions): { html: string, pos: number } | null {
  const firstChar = content.charCodeAt(start)
  const ordered = firstChar >= 48 && firstChar <= 57 // 0-9
  const items: string[] = []
  let i = start

  while (i < len) {
    // Check for list marker
    if (ordered) {
      // Skip digits
      let j = i
      while (j < len && content.charCodeAt(j) >= 48 && content.charCodeAt(j) <= 57) {
        j++
      }
      if (j === i || j >= len || content.charCodeAt(j) !== 46) { // . character
        break
      }
      i = j + 1
    } else {
      const c = content.charCodeAt(i)
      if (c !== CHAR_STAR && c !== CHAR_PLUS && c !== CHAR_DASH) {
        break
      }
      i++
    }

    // Skip space
    if (content.charCodeAt(i) === CHAR_SPACE) i++

    // Get line content
    const lineStart = i
    while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) {
      i++
    }

    const lineContent = content.substring(lineStart, i)

    // Check for task list
    const taskMatch = lineContent.match(/^\[([ xX])\]\s+(.+)/)
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === 'x'
      const text = parseInline(taskMatch[2], opts)
      items.push(`<li><input type="checkbox"${checked ? ' checked disabled' : ' disabled'}> ${text}</li>\n`)
    } else {
      const text = parseInline(lineContent, opts)
      items.push(`<li>${text}</li>\n`)
    }

    i++ // Skip newline

    // Check if next line is also a list item
    if (i >= len) break
    const nextChar = content.charCodeAt(i)
    if (ordered && (nextChar < 48 || nextChar > 57)) break
    if (!ordered && nextChar !== CHAR_STAR && nextChar !== CHAR_PLUS && nextChar !== CHAR_DASH) break
  }

  if (items.length === 0) return null

  const tag = ordered ? 'ol' : 'ul'
  return {
    html: `<${tag}>\n${items.join('')}</${tag}>\n`,
    pos: i,
  }
}

/**
 * Parse table - optimized
 */
function parseTable(content: string, start: number, len: number, opts: MarkdownOptions): { html: string, pos: number } | null {
  // Quick check - need at least 3 lines
  let i = start

  // Parse header row
  if (content.charCodeAt(i) !== CHAR_PIPE) return null

  const headerStart = i
  while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) i++
  if (i >= len) return null

  const headerLine = content.substring(headerStart, i)
  i++ // Skip newline

  // Parse separator row
  const sepStart = i
  if (i >= len || content.charCodeAt(i) !== CHAR_PIPE) return null

  while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) i++
  if (i >= len) return null

  const sepLine = content.substring(sepStart, i)

  // Validate separator
  if (!/^\|[\s\-:|]+\|$/.test(sepLine)) return null

  i++ // Skip newline

  // Parse header
  const headers = headerLine.split('|').slice(1, -1).map(h => h.trim()).filter(h => h)
  const aligns = sepLine.split('|').slice(1, -1).map(cell => {
    const trimmed = cell.trim()
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
    if (trimmed.endsWith(':')) return 'right'
    if (trimmed.startsWith(':')) return 'left'
    return null
  })

  // Parse body rows
  const rows: string[][] = []
  while (i < len && content.charCodeAt(i) === CHAR_PIPE) {
    const rowStart = i
    while (i < len && content.charCodeAt(i) !== CHAR_NEWLINE) i++
    const rowLine = content.substring(rowStart, i)
    const cells = rowLine.split('|').slice(1, -1).map(c => c.trim())
    rows.push(cells)
    i++
  }

  // Build table HTML
  const parts: string[] = ['<table>\n<thead>\n<tr>\n']

  for (let j = 0; j < headers.length; j++) {
    const align = aligns[j]
    const alignAttr = align ? ` align="${align}"` : ''
    parts.push(`<th${alignAttr}>`, parseInline(headers[j], opts), '</th>\n')
  }

  parts.push('</tr>\n</thead>\n<tbody>\n')

  for (const row of rows) {
    parts.push('<tr>\n')
    for (let j = 0; j < row.length; j++) {
      const align = aligns[j]
      const alignAttr = align ? ` align="${align}"` : ''
      parts.push(`<td${alignAttr}>`, parseInline(row[j], opts), '</td>\n')
    }
    parts.push('</tr>\n')
  }

  parts.push('</tbody>\n</table>\n')

  return {
    html: parts.join(''),
    pos: i,
  }
}

/**
 * Parse paragraph - optimized
 */
function parseParagraph(content: string, start: number, len: number, opts: MarkdownOptions): { html: string, pos: number } {
  let i = start
  const textStart = i

  // Find end of paragraph (double newline or EOF)
  while (i < len) {
    if (content.charCodeAt(i) === CHAR_NEWLINE) {
      if (i + 1 < len && content.charCodeAt(i + 1) === CHAR_NEWLINE) {
        break // Double newline
      }
      // Check if next line starts a new block element
      if (i + 1 < len) {
        const nextChar = content.charCodeAt(i + 1)
        if (nextChar === CHAR_HASH || nextChar === CHAR_GT || nextChar === CHAR_BACKTICK) {
          break
        }
      }
    }
    i++
  }

  const text = content.substring(textStart, i).trim()
  if (!text) {
    return { html: '', pos: i + 1 }
  }

  const html = parseInline(text, opts)
  return {
    html: `<p>${html}</p>\n`,
    pos: i + 1,
  }
}

/**
 * Parse inline markdown - ultra-optimized character-by-character parser
 */
function parseInline(text: string, opts: MarkdownOptions): string {
  const len = text.length
  const output: string[] = []
  let i = 0

  while (i < len) {
    const char = text.charCodeAt(i)

    // Strong emphasis **text** or __text__
    if ((char === CHAR_STAR && text.charCodeAt(i + 1) === CHAR_STAR) ||
        (char === CHAR_UNDERSCORE && text.charCodeAt(i + 1) === CHAR_UNDERSCORE)) {
      const marker = char
      const end = findClosingMarker(text, i + 2, len, marker, 2)
      if (end !== -1) {
        const inner = text.substring(i + 2, end)
        output.push('<strong>', parseInline(inner, opts), '</strong>')
        i = end + 2
        continue
      }
    }

    // Emphasis *text* or _text_
    if (char === CHAR_STAR || char === CHAR_UNDERSCORE) {
      const nextChar = text.charCodeAt(i + 1)
      if (nextChar !== char) { // Not a double marker
        const end = findClosingMarker(text, i + 1, len, char, 1)
        if (end !== -1) {
          const inner = text.substring(i + 1, end)
          output.push('<em>', parseInline(inner, opts), '</em>')
          i = end + 1
          continue
        }
      }
    }

    // Inline code `code`
    if (char === CHAR_BACKTICK) {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        const code = text.substring(i + 1, end)
        output.push('<code>', escapeHtml(code), '</code>')
        i = end + 1
        continue
      }
    }

    // Links [text](url)
    if (char === CHAR_LBRACKET) {
      const textEnd = text.indexOf(']', i + 1)
      if (textEnd !== -1 && text.charCodeAt(textEnd + 1) === CHAR_LPAREN) {
        const urlEnd = text.indexOf(')', textEnd + 2)
        if (urlEnd !== -1) {
          const linkText = text.substring(i + 1, textEnd)
          const url = text.substring(textEnd + 2, urlEnd)
          output.push('<a href="', escapeHtml(url), '">', parseInline(linkText, opts), '</a>')
          i = urlEnd + 1
          continue
        }
      }
    }

    // Images ![alt](url)
    if (char === CHAR_EXCLAIM && text.charCodeAt(i + 1) === CHAR_LBRACKET) {
      const textEnd = text.indexOf(']', i + 2)
      if (textEnd !== -1 && text.charCodeAt(textEnd + 1) === CHAR_LPAREN) {
        const urlEnd = text.indexOf(')', textEnd + 2)
        if (urlEnd !== -1) {
          const alt = text.substring(i + 2, textEnd)
          const url = text.substring(textEnd + 2, urlEnd)
          output.push('<img src="', escapeHtml(url), '" alt="', escapeHtml(alt), '">')
          i = urlEnd + 1
          continue
        }
      }
    }

    // Strikethrough ~~text~~ (GFM)
    if (opts.gfm && char === CHAR_TILDE && text.charCodeAt(i + 1) === CHAR_TILDE) {
      const end = text.indexOf('~~', i + 2)
      if (end !== -1) {
        const inner = text.substring(i + 2, end)
        output.push('<del>', parseInline(inner, opts), '</del>')
        i = end + 2
        continue
      }
    }

    // Line break
    if (opts.breaks && char === CHAR_NEWLINE) {
      output.push('<br>')
      i++
      continue
    }

    // Regular text - find next special character
    const textStart = i
    while (i < len) {
      const c = text.charCodeAt(i)
      if (c === CHAR_STAR || c === CHAR_UNDERSCORE || c === CHAR_BACKTICK ||
          c === CHAR_LBRACKET || c === CHAR_EXCLAIM || c === CHAR_TILDE ||
          (opts.breaks && c === CHAR_NEWLINE)) {
        break
      }
      i++
    }

    if (i > textStart) {
      output.push(escapeHtml(text.substring(textStart, i)))
    } else {
      // Single character that didn't match anything
      output.push(escapeHtml(text[i]))
      i++
    }
  }

  return output.join('')
}

/**
 * Find closing marker for emphasis
 */
function findClosingMarker(text: string, start: number, len: number, marker: number, count: number): number {
  let i = start
  while (i < len) {
    if (text.charCodeAt(i) === marker) {
      let matched = 1
      while (matched < count && i + matched < len && text.charCodeAt(i + matched) === marker) {
        matched++
      }
      if (matched === count) {
        return i
      }
    }
    i++
  }
  return -1
}

/**
 * Escape HTML - optimized
 */
function escapeHtml(text: string): string {
  const len = text.length
  let result = ''
  let lastPos = 0

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i)
    let replacement: string | null = null

    switch (code) {
      case CHAR_AMP:
        replacement = '&amp;'
        break
      case CHAR_LT:
        replacement = '&lt;'
        break
      case CHAR_GT:
        replacement = '&gt;'
        break
      case CHAR_QUOT:
        replacement = '&quot;'
        break
      case CHAR_APOS:
        replacement = '&#39;'
        break
    }

    if (replacement) {
      result += text.substring(lastPos, i) + replacement
      lastPos = i + 1
    }
  }

  return lastPos === 0 ? text : result + text.substring(lastPos)
}

/**
 * Create URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
