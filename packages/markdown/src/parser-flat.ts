import type { MarkdownOptions } from './types'

/**
 * markdown-it inspired flat token stream architecture
 * Key optimizations:
 * - Flat token array (no nesting)
 * - Position-based parsing (no substring allocations)
 * - Pending text buffer (batch consecutive text)
 * - Two-pass emphasis matching
 */

interface FlatToken {
  type: string
  tag?: string
  nesting?: number // 1 = open, 0 = self-closing, -1 = close
  content?: string
  markup?: string
  level?: number
  children?: FlatToken[]
}

interface ParserState {
  src: string
  pos: number
  posMax: number
  tokens: FlatToken[]
  pending: string
  level: number
  options: MarkdownOptions
  // Cache for emphasis delimiter matching
  cache: Record<number, number>
  delimiters: Array<{
    marker: number
    length: number
    token: number
    end: number
    can_open: boolean
    can_close: boolean
  }>
}

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
const CODE_NEWLINE = 10 // \n
const CODE_HASH = 35 // #
const CODE_STAR = 42 // *
const CODE_UNDERSCORE = 95 // _
const CODE_BACKTICK = 96 // `
const CODE_LBRACKET = 91 // [
const CODE_BANG = 33 // !
const CODE_TILDE = 126 // ~
const CODE_PIPE = 124 // |
const CODE_GT = 62 // >
const CODE_MINUS = 45 // -
const CODE_PLUS = 43 // +
const CODE_SPACE = 32 // space

export function parse(markdown: string, options: MarkdownOptions = {}): string {
  const opts = { ...defaultOptions, ...options }
  const state: ParserState = {
    src: markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
    pos: 0,
    posMax: markdown.length,
    tokens: [],
    pending: '',
    level: 0,
    options: opts,
    cache: {},
    delimiters: [],
  }

  // Block parsing
  parseBlocks(state)

  // Render tokens to HTML
  return renderTokens(state.tokens, opts)
}

export function parseSync(markdown: string, options: MarkdownOptions = {}): string {
  return parse(markdown, options)
}

function parseBlocks(state: ParserState): void {
  while (state.pos < state.posMax) {
    const char = state.src.charCodeAt(state.pos)

    // Skip empty lines
    if (char === CODE_NEWLINE) {
      state.pos++
      continue
    }

    // Headings
    if (char === CODE_HASH && isStartOfLine(state)) {
      if (parseHeading(state))
        continue
    }

    // Code blocks
    if (char === CODE_BACKTICK && lookAhead(state, '```')) {
      if (parseCodeBlock(state))
        continue
    }

    // Horizontal rule
    if ((char === CODE_STAR || char === CODE_MINUS || char === CODE_UNDERSCORE) && isStartOfLine(state)) {
      if (parseHR(state))
        continue
    }

    // Blockquote
    if (char === CODE_GT && isStartOfLine(state)) {
      if (parseBlockquote(state))
        continue
    }

    // Lists
    if (isListMarker(char) && isStartOfLine(state)) {
      if (parseList(state))
        continue
    }

    // Tables
    if (state.options.gfm && char === CODE_PIPE && isStartOfLine(state)) {
      if (parseTable(state))
        continue
    }

    // Paragraph
    if (parseParagraph(state))
      continue

    // Fallback: skip character
    state.pos++
  }

  // Flush any pending text
  if (state.pending) {
    pushPending(state)
  }
}

function isStartOfLine(state: ParserState): boolean {
  return state.pos === 0 || state.src.charCodeAt(state.pos - 1) === CODE_NEWLINE
}

function lookAhead(state: ParserState, str: string): boolean {
  return state.src.slice(state.pos, state.pos + str.length) === str
}

function isListMarker(char: number): boolean {
  return char === CODE_STAR || char === CODE_MINUS || char === CODE_PLUS || (char >= 48 && char <= 57)
}

function pushPending(state: ParserState): void {
  if (!state.pending)
    return

  state.tokens.push({
    type: 'text',
    content: state.pending,
    level: state.level,
  })
  state.pending = ''
}

function pushToken(state: ParserState, type: string, tag: string, nesting: number): FlatToken {
  pushPending(state)

  if (nesting < 0)
    state.level--

  const token: FlatToken = {
    type,
    tag,
    nesting,
    level: state.level,
  }

  if (nesting > 0)
    state.level++

  state.tokens.push(token)
  return token
}

function parseHeading(state: ParserState): boolean {
  const start = state.pos
  let level = 0

  while (state.pos < state.posMax && state.src.charCodeAt(state.pos) === CODE_HASH && level < 6) {
    level++
    state.pos++
  }

  if (level === 0 || state.pos >= state.posMax || state.src.charCodeAt(state.pos) !== CODE_SPACE) {
    state.pos = start
    return false
  }

  state.pos++ // skip space

  // Find end of line
  const textStart = state.pos
  let textEnd = state.pos
  while (textEnd < state.posMax && state.src.charCodeAt(textEnd) !== CODE_NEWLINE) {
    textEnd++
  }

  const content = state.src.slice(textStart, textEnd).trim()

  const token = pushToken(state, 'heading_open', `h${level}`, 1)

  // Add header ID if enabled
  if (state.options.headerIds) {
    token.markup = `${state.options.headerPrefix}${slugify(content)}`
  }

  // Parse inline content
  parseInline(state, content)

  pushToken(state, 'heading_close', `h${level}`, -1)

  state.pos = textEnd + 1
  return true
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseCodeBlock(state: ParserState): boolean {
  const start = state.pos
  state.pos += 3 // skip ```

  // Get language
  const langStart = state.pos
  while (state.pos < state.posMax && state.src.charCodeAt(state.pos) !== CODE_NEWLINE) {
    state.pos++
  }
  const lang = state.src.slice(langStart, state.pos).trim()
  state.pos++ // skip newline

  // Find closing ```
  const codeStart = state.pos
  const closing = state.src.indexOf('\n```', state.pos)
  if (closing === -1) {
    state.pos = start
    return false
  }

  const code = state.src.slice(codeStart, closing)

  const token = pushToken(state, 'fence', 'code', 0)
  token.content = code
  token.markup = lang

  state.pos = closing + 4
  return true
}

function parseHR(state: ParserState): boolean {
  const start = state.pos
  const marker = state.src.charCodeAt(state.pos)
  let count = 0

  while (state.pos < state.posMax) {
    const char = state.src.charCodeAt(state.pos)
    if (char === marker)
      count++
    else if (char !== CODE_SPACE && char !== CODE_NEWLINE)
      break
    state.pos++
    if (char === CODE_NEWLINE)
      break
  }

  if (count >= 3) {
    pushToken(state, 'hr', 'hr', 0)
    return true
  }

  state.pos = start
  return false
}

function parseBlockquote(state: ParserState): boolean {
  // Simple blockquote implementation
  pushToken(state, 'blockquote_open', 'blockquote', 1)

  while (state.pos < state.posMax && state.src.charCodeAt(state.pos) === CODE_GT) {
    state.pos++ // skip >
    if (state.src.charCodeAt(state.pos) === CODE_SPACE)
      state.pos++

    const lineStart = state.pos
    let lineEnd = state.pos
    while (lineEnd < state.posMax && state.src.charCodeAt(lineEnd) !== CODE_NEWLINE) {
      lineEnd++
    }

    const content = state.src.slice(lineStart, lineEnd).trim()
    if (content) {
      pushToken(state, 'paragraph_open', 'p', 1)
      parseInline(state, content)
      pushToken(state, 'paragraph_close', 'p', -1)
    }

    state.pos = lineEnd + 1
  }

  pushToken(state, 'blockquote_close', 'blockquote', -1)
  return true
}

function parseList(state: ParserState): boolean {
  const start = state.pos
  const firstChar = state.src.charCodeAt(state.pos)
  const isOrdered = firstChar >= 48 && firstChar <= 57

  pushToken(state, isOrdered ? 'ordered_list_open' : 'bullet_list_open', isOrdered ? 'ol' : 'ul', 1)

  while (state.pos < state.posMax) {
    const char = state.src.charCodeAt(state.pos)

    // Check for list marker
    if (isOrdered) {
      let num = 0
      while (state.src.charCodeAt(state.pos) >= 48 && state.src.charCodeAt(state.pos) <= 57) {
        state.pos++
        num++
      }
      if (num === 0 || state.src.charCodeAt(state.pos) !== 46)
        break // not a number or missing dot
      state.pos++ // skip dot
    }
    else {
      if (char !== CODE_STAR && char !== CODE_MINUS && char !== CODE_PLUS)
        break
      state.pos++
    }

    if (state.src.charCodeAt(state.pos) !== CODE_SPACE)
      break
    state.pos++ // skip space

    // Get item content
    const itemStart = state.pos
    let itemEnd = state.pos
    while (itemEnd < state.posMax && state.src.charCodeAt(itemEnd) !== CODE_NEWLINE) {
      itemEnd++
    }

    let content = state.src.slice(itemStart, itemEnd).trim()

    // Check for task list item
    const taskMatch = content.match(/^\[([ x])\]\s+(.+)/i)
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === 'x'
      content = taskMatch[2]

      const token = pushToken(state, 'list_item_open', 'li', 1)
      token.markup = checked ? 'checked' : 'unchecked'

      parseInline(state, content)
      pushToken(state, 'list_item_close', 'li', -1)
    }
    else {
      pushToken(state, 'list_item_open', 'li', 1)
      parseInline(state, content)
      pushToken(state, 'list_item_close', 'li', -1)
    }

    state.pos = itemEnd + 1

    // Check if next line is also a list item
    const nextChar = state.src.charCodeAt(state.pos)
    if (!isListMarker(nextChar))
      break
  }

  pushToken(state, isOrdered ? 'ordered_list_close' : 'bullet_list_close', isOrdered ? 'ol' : 'ul', -1)
  return true
}

function parseTable(state: ParserState): boolean {
  const start = state.pos

  // Find first line (header)
  let lineEnd = state.pos
  while (lineEnd < state.posMax && state.src.charCodeAt(lineEnd) !== CODE_NEWLINE) {
    lineEnd++
  }
  const headerLine = state.src.slice(state.pos, lineEnd)

  // Check if it's a valid table (starts and ends with |)
  if (!headerLine.startsWith('|') || !headerLine.trim().endsWith('|')) {
    return false
  }

  // Move past header line
  state.pos = lineEnd + 1

  // Parse alignment line
  lineEnd = state.pos
  while (lineEnd < state.posMax && state.src.charCodeAt(lineEnd) !== CODE_NEWLINE) {
    lineEnd++
  }
  const alignLine = state.src.slice(state.pos, lineEnd)

  // Validate alignment line
  if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(alignLine.trim())) {
    state.pos = start
    return false
  }

  // Parse alignment
  const alignCells = alignLine.split('|').slice(1, -1)
  const align: Array<string | null> = alignCells.map((cell) => {
    const trimmed = cell.trim()
    if (trimmed.startsWith(':') && trimmed.endsWith(':'))
      return 'center'
    if (trimmed.endsWith(':'))
      return 'right'
    if (trimmed.startsWith(':'))
      return 'left'
    return null
  })

  // Move past alignment line
  state.pos = lineEnd + 1

  // Parse header cells
  const headerCells = headerLine.split('|').slice(1, -1).map(c => c.trim())

  // Start table
  pushToken(state, 'table_open', 'table', 1)
  pushToken(state, 'thead_open', 'thead', 1)
  pushToken(state, 'tr_open', 'tr', 1)

  // Render header cells
  for (let i = 0; i < headerCells.length; i++) {
    const token = pushToken(state, 'th_open', 'th', 1)
    if (align[i]) {
      token.markup = align[i]
    }
    parseInline(state, headerCells[i])
    pushToken(state, 'th_close', 'th', -1)
  }

  pushToken(state, 'tr_close', 'tr', -1)
  pushToken(state, 'thead_close', 'thead', -1)

  // Parse body rows
  pushToken(state, 'tbody_open', 'tbody', 1)

  while (state.pos < state.posMax) {
    lineEnd = state.pos
    while (lineEnd < state.posMax && state.src.charCodeAt(lineEnd) !== CODE_NEWLINE) {
      lineEnd++
    }

    const rowLine = state.src.slice(state.pos, lineEnd).trim()

    // Check if still a table row
    if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) {
      break
    }

    const cells = rowLine.split('|').slice(1, -1).map(c => c.trim())

    pushToken(state, 'tr_open', 'tr', 1)

    for (let i = 0; i < cells.length; i++) {
      const token = pushToken(state, 'td_open', 'td', 1)
      if (align[i]) {
        token.markup = align[i]
      }
      parseInline(state, cells[i])
      pushToken(state, 'td_close', 'td', -1)
    }

    pushToken(state, 'tr_close', 'tr', -1)

    state.pos = lineEnd + 1
  }

  pushToken(state, 'tbody_close', 'tbody', -1)
  pushToken(state, 'table_close', 'table', -1)

  return true
}

function parseParagraph(state: ParserState): boolean {
  const start = state.pos
  let end = state.pos

  // Find end of paragraph (double newline or EOF)
  while (end < state.posMax) {
    if (state.src.charCodeAt(end) === CODE_NEWLINE) {
      if (end + 1 < state.posMax && state.src.charCodeAt(end + 1) === CODE_NEWLINE) {
        break
      }
    }
    end++
  }

  const content = state.src.slice(start, end).trim()
  if (!content) {
    state.pos = end + 1
    return false
  }

  pushToken(state, 'paragraph_open', 'p', 1)
  parseInline(state, content)
  pushToken(state, 'paragraph_close', 'p', -1)

  state.pos = end + 1
  return true
}

// Inline parsing with delimiter-based matching (like markdown-it)
function parseInline(state: ParserState, content: string): void {
  const savedSrc = state.src
  const savedPos = state.pos
  const savedPosMax = state.posMax
  const savedDelimiters = state.delimiters

  state.src = content
  state.pos = 0
  state.posMax = content.length
  state.delimiters = []

  // First pass: tokenize and collect delimiters
  while (state.pos < state.posMax) {
    const char = state.src.charCodeAt(state.pos)

    // Bold/italic markers
    if (char === CODE_STAR || char === CODE_UNDERSCORE) {
      scanEmphasis(state)
      continue
    }

    // Inline code
    if (char === CODE_BACKTICK) {
      if (scanCode(state))
        continue
    }

    // Links
    if (char === CODE_LBRACKET) {
      if (scanLink(state))
        continue
    }

    // Images
    if (char === CODE_BANG && state.src.charCodeAt(state.pos + 1) === CODE_LBRACKET) {
      if (scanImage(state))
        continue
    }

    // Strikethrough (GFM)
    if (state.options.gfm && char === CODE_TILDE && state.src.charCodeAt(state.pos + 1) === CODE_TILDE) {
      if (scanStrikethrough(state))
        continue
    }

    // Regular text
    state.pending += state.src[state.pos]
    state.pos++
  }

  // Flush pending
  if (state.pending)
    pushPending(state)

  // Second pass: match delimiters (emphasis/strong)
  processDelimiters(state)

  // Restore state
  state.src = savedSrc
  state.pos = savedPos
  state.posMax = savedPosMax
  state.delimiters = savedDelimiters
}

function scanEmphasis(state: ParserState): void {
  const marker = state.src.charCodeAt(state.pos)
  const startPos = state.pos
  let count = 0

  while (state.pos < state.posMax && state.src.charCodeAt(state.pos) === marker) {
    count++
    state.pos++
  }

  // Push as text tokens and record delimiters
  for (let i = 0; i < count; i++) {
    state.pending += String.fromCharCode(marker)
  }

  pushPending(state)

  state.delimiters.push({
    marker,
    length: count,
    token: state.tokens.length - 1,
    end: -1,
    can_open: true,
    can_close: true,
  })
}

function scanCode(state: ParserState): boolean {
  const start = state.pos
  state.pos++ // skip opening `

  const codeStart = state.pos
  const closeIdx = state.src.indexOf('`', state.pos)
  if (closeIdx === -1) {
    state.pos = start
    return false
  }

  const code = state.src.slice(codeStart, closeIdx)
  pushToken(state, 'code_inline', 'code', 0).content = code

  state.pos = closeIdx + 1
  return true
}

function scanLink(state: ParserState): boolean {
  const start = state.pos
  state.pos++ // skip [

  const textStart = state.pos
  const textEnd = state.src.indexOf(']', state.pos)
  if (textEnd === -1) {
    state.pos = start
    return false
  }

  if (state.src.charCodeAt(textEnd + 1) !== 40) { // not followed by (
    state.pos = start
    return false
  }

  const urlStart = textEnd + 2
  const urlEnd = state.src.indexOf(')', urlStart)
  if (urlEnd === -1) {
    state.pos = start
    return false
  }

  const text = state.src.slice(textStart, textEnd)
  const url = state.src.slice(urlStart, urlEnd)

  pushToken(state, 'link_open', 'a', 1).markup = url
  state.pending += text
  pushPending(state)
  pushToken(state, 'link_close', 'a', -1)

  state.pos = urlEnd + 1
  return true
}

function scanImage(state: ParserState): boolean {
  const start = state.pos
  state.pos += 2 // skip ![

  const altStart = state.pos
  const altEnd = state.src.indexOf(']', state.pos)
  if (altEnd === -1) {
    state.pos = start
    return false
  }

  if (state.src.charCodeAt(altEnd + 1) !== 40) {
    state.pos = start
    return false
  }

  const urlStart = altEnd + 2
  const urlEnd = state.src.indexOf(')', urlStart)
  if (urlEnd === -1) {
    state.pos = start
    return false
  }

  const alt = state.src.slice(altStart, altEnd)
  const url = state.src.slice(urlStart, urlEnd)

  pushToken(state, 'image', 'img', 0).markup = `${alt}|${url}`

  state.pos = urlEnd + 1
  return true
}

function scanStrikethrough(state: ParserState): boolean {
  const start = state.pos
  state.pos += 2 // skip ~~

  const textStart = state.pos
  const closeIdx = state.src.indexOf('~~', state.pos)
  if (closeIdx === -1) {
    state.pos = start
    return false
  }

  const text = state.src.slice(textStart, closeIdx)

  pushToken(state, 'del_open', 'del', 1)
  state.pending += text
  pushPending(state)
  pushToken(state, 'del_close', 'del', -1)

  state.pos = closeIdx + 2
  return true
}

function processDelimiters(state: ParserState): void {
  const delimiters = state.delimiters
  const max = delimiters.length

  for (let i = 0; i < max; i++) {
    const startDelim = delimiters[i]

    if (startDelim.marker !== CODE_STAR && startDelim.marker !== CODE_UNDERSCORE)
      continue
    if (startDelim.end !== -1)
      continue

    // Find closing delimiter
    for (let j = i + 1; j < max; j++) {
      const endDelim = delimiters[j]

      if (endDelim.marker !== startDelim.marker)
        continue
      if (!endDelim.can_close)
        continue

      // Match delimiters
      startDelim.end = j
      endDelim.end = i

      // Check if strong (** or __)
      const isStrong = startDelim.length >= 2 && endDelim.length >= 2
      const ch = String.fromCharCode(startDelim.marker)

      // Update tokens
      const openToken = state.tokens[startDelim.token]
      openToken.type = isStrong ? 'strong_open' : 'em_open'
      openToken.tag = isStrong ? 'strong' : 'em'
      openToken.nesting = 1
      openToken.content = ''

      const closeToken = state.tokens[endDelim.token]
      closeToken.type = isStrong ? 'strong_close' : 'em_close'
      closeToken.tag = isStrong ? 'strong' : 'em'
      closeToken.nesting = -1
      closeToken.content = ''

      break
    }
  }
}

function renderTokens(tokens: FlatToken[], options: MarkdownOptions): string {
  let html = ''

  for (const token of tokens) {
    switch (token.type) {
      case 'heading_open':
        if (token.markup) {
          html += `<${token.tag} id="${token.markup}">`
        }
        else {
          html += `<${token.tag}>`
        }
        break
      case 'heading_close':
        html += `</${token.tag}>\n`
        break
      case 'paragraph_open':
        html += '<p>'
        break
      case 'paragraph_close':
        html += '</p>\n'
        break
      case 'fence':
      case 'code_block':
        if (token.markup) {
          html += `<pre><code class="language-${token.markup}">${escapeHtml(token.content || '')}</code></pre>\n`
        }
        else {
          html += `<pre><code>${escapeHtml(token.content || '')}</code></pre>\n`
        }
        break
      case 'code_inline':
        html += `<code>${escapeHtml(token.content || '')}</code>`
        break
      case 'hr':
        html += '<hr>\n'
        break
      case 'blockquote_open':
        html += '<blockquote>\n'
        break
      case 'blockquote_close':
        html += '</blockquote>\n'
        break
      case 'bullet_list_open':
        html += '<ul>\n'
        break
      case 'bullet_list_close':
        html += '</ul>\n'
        break
      case 'ordered_list_open':
        html += '<ol>\n'
        break
      case 'ordered_list_close':
        html += '</ol>\n'
        break
      case 'list_item_open':
        html += '<li>'
        if (token.markup === 'checked') {
          html += '<input type="checkbox" checked disabled> '
        }
        else if (token.markup === 'unchecked') {
          html += '<input type="checkbox" disabled> '
        }
        break
      case 'list_item_close':
        html += '</li>\n'
        break
      case 'table_open':
        html += '<table>\n'
        break
      case 'table_close':
        html += '</table>\n'
        break
      case 'thead_open':
        html += '<thead>\n'
        break
      case 'thead_close':
        html += '</thead>\n'
        break
      case 'tbody_open':
        html += '<tbody>\n'
        break
      case 'tbody_close':
        html += '</tbody>\n'
        break
      case 'tr_open':
        html += '<tr>\n'
        break
      case 'tr_close':
        html += '</tr>\n'
        break
      case 'th_open':
        if (token.markup) {
          html += `<th align="${token.markup}">`
        }
        else {
          html += '<th>'
        }
        break
      case 'th_close':
        html += '</th>\n'
        break
      case 'td_open':
        if (token.markup) {
          html += `<td align="${token.markup}">`
        }
        else {
          html += '<td>'
        }
        break
      case 'td_close':
        html += '</td>\n'
        break
      case 'strong_open':
        html += '<strong>'
        break
      case 'strong_close':
        html += '</strong>'
        break
      case 'em_open':
        html += '<em>'
        break
      case 'em_close':
        html += '</em>'
        break
      case 'del_open':
        html += '<del>'
        break
      case 'del_close':
        html += '</del>'
        break
      case 'link_open':
        html += `<a href="${escapeHtml(token.markup || '')}">`
        break
      case 'link_close':
        html += '</a>'
        break
      case 'image':
        const [alt, url] = (token.markup || '|').split('|')
        html += `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`
        break
      case 'text':
        html += escapeHtml(token.content || '')
        break
    }
  }

  return html
}

// Character codes for HTML escaping
const CHAR_AMP = 38 // &
const CHAR_LT = 60 // <
const CHAR_GT = 62 // >
const CHAR_QUOT = 34 // "
const CHAR_APOS = 39 // '

function escapeHtml(text: string): string {
  const len = text.length
  let lastPos = 0
  let needsEscape = false

  // Quick scan to see if escaping is needed
  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i)
    if (code === CHAR_AMP || code === CHAR_LT || code === CHAR_GT || code === CHAR_QUOT || code === CHAR_APOS) {
      needsEscape = true
      break
    }
  }

  if (!needsEscape)
    return text

  const parts: string[] = []
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
      if (i > lastPos) {
        parts.push(text.substring(lastPos, i))
      }
      parts.push(replacement)
      lastPos = i + 1
    }
  }

  if (lastPos < len) {
    parts.push(text.substring(lastPos))
  }

  return parts.join('')
}
