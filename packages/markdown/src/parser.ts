/* eslint-disable regexp/no-super-linear-backtracking */
import type { MarkdownOptions, Token } from './types'

/**
 * Ultra-fast Markdown parser optimized for Bun
 * Performance-focused implementation with pre-compiled regexes
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

// Pre-compiled regexes for maximum performance
const REGEX = {
  heading: /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*(?:\n|$)/,
  code: /^```(\w+)?\n([\s\S]*?)```/,
  hr: /^(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})(?:\n|$)/,
  blockquote: /^(?:>\s+(.*)(?:\n|$))+/,
  list: /^(?:(?:[*\-+]|\d+\.)\s+(?:\S.*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])(?:\n|$))+/,
  listItem: {
    ordered: /^(\d+)\.\s+(.+)(?=\n\d+\.|\n*$)/gm,
    unordered: /^[*\-+]\s+(.+)(?=\n[*\-+]|\n*$)/gm,
  },
  table: /^\|(.+)\|\n\|(?:\s*:?-+:?\s*\|)+\n((?:\|.+\|\n?)+)/,
  paragraph: /^(.+?)(?:\n\n|\n(?=#)|$)/s,
  strong: /^(\*\*|__)(.+?)\1/,
  em: /^(\*|_)(.+?)\1/,
  code_inline: /^`([^`]+)`/,
  link: /^\[([^\]]+)\]\(([^)]+)\)/,
  image: /^!\[([^\]]*)\]\(([^)]+)\)/,
  del: /^~~(.+?)~~/,
  text: /^[^*_`[\n!~]+/,
  crlf: /\r\n/g,
  cr: /\r/g,
  tab: /\t/g,
  blockquotePrefix: /^>\s?/gm,
  newline: /\n/,
}

/**
 * Parse markdown to HTML
 */
export function parse(markdown: string, options: MarkdownOptions = {}): string {
  const opts = { ...defaultOptions, ...options }
  const tokens = tokenize(markdown, opts)
  return render(tokens, opts)
}

/**
 * Parse markdown to HTML synchronously
 */
export function parseSync(markdown: string, options: MarkdownOptions = {}): string {
  return parse(markdown, options)
}

/**
 * Tokenize markdown content - optimized version
 */
function tokenize(markdown: string, options: MarkdownOptions): Token[] {
  const tokens: Token[] = []

  // Normalize line endings - optimized
  let content = markdown
  if (content.includes('\r')) {
    content = content.replace(REGEX.crlf, '\n').replace(REGEX.cr, '\n')
  }
  if (content.includes('\t')) {
    content = content.replace(REGEX.tab, '    ')
  }

  let match: RegExpMatchArray | null
  const len = content.length
  let pos = 0

  while (pos < len) {
    const remaining = content.substring(pos)
    const char = content.charCodeAt(pos)

    // Headers - check for # first
    if (char === 35) { // #
      match = remaining.match(REGEX.heading)
      if (match) {
        tokens.push({
          type: 'heading',
          depth: match[1].length,
          text: match[2],
          raw: match[0],
          tokens: parseInline(match[2], options),
        })
        pos += match[0].length
        continue
      }
    }

    // Fenced code blocks - check for ` first
    if (char === 96 && content.charCodeAt(pos + 1) === 96 && content.charCodeAt(pos + 2) === 96) { // ```
      match = remaining.match(REGEX.code)
      if (match) {
        tokens.push({
          type: 'code',
          lang: match[1] || '',
          text: match[2],
          raw: match[0],
        })
        pos += match[0].length
        continue
      }
    }

    // Horizontal rules - check for *, -, _ first
    if (char === 42 || char === 45 || char === 95) { // * - _
      match = remaining.match(REGEX.hr)
      if (match) {
        tokens.push({
          type: 'hr',
          raw: match[0],
        })
        pos += match[0].length
        continue
      }
    }

    // Blockquotes - check for > first
    if (char === 62) { // >
      match = remaining.match(REGEX.blockquote)
      if (match) {
        const quoteContent = match[0].replace(REGEX.blockquotePrefix, '')
        tokens.push({
          type: 'blockquote',
          text: quoteContent,
          raw: match[0],
          tokens: tokenize(quoteContent, options),
        })
        pos += match[0].length
        continue
      }
    }

    // Lists - check for *, -, +, or digits
    if (char === 42 || char === 45 || char === 43 || (char >= 48 && char <= 57)) { // * - + 0-9
      match = remaining.match(REGEX.list)
      if (match) {
      const listText = match[0]
      const ordered = /^\d+\./.test(listText)
      const items: Token[] = []

      const itemRegex = ordered ? REGEX.listItem.ordered : REGEX.listItem.unordered
      // Reset regex
      itemRegex.lastIndex = 0

      let itemMatch: RegExpExecArray | null
      // eslint-disable-next-line no-cond-assign
      while ((itemMatch = itemRegex.exec(listText))) {
        const itemText = ordered ? itemMatch[2] : itemMatch[1]

        // Check for task list
        const taskMatch = itemText.match(/^\[([ x])\]\s+(.+)/i)
        if (taskMatch) {
          items.push({
            type: 'list_item',
            task: true,
            checked: taskMatch[1].toLowerCase() === 'x',
            text: taskMatch[2],
            raw: itemText,
            tokens: parseInline(taskMatch[2], options),
          })
        }
        else {
          items.push({
            type: 'list_item',
            text: itemText,
            raw: itemText,
            tokens: parseInline(itemText, options),
          })
        }
      }

      tokens.push({
        type: 'list',
        ordered,
        items,
        raw: match[0],
      })

      pos += match[0].length
      continue
      }
    }

    // Tables (GFM) - check for | first
    if (options.gfm && char === 124) { // |
      match = remaining.match(REGEX.table)
      if (match) {
        const header = match[1].split('|').map(h => h.trim()).filter(h => h)
        const alignLine = match[0].split('\n')[1]
        const align = alignLine.split('|').slice(1, -1).map((cell) => {
          const trimmed = cell.trim()
          if (trimmed.startsWith(':') && trimmed.endsWith(':'))
            return 'center'
          if (trimmed.endsWith(':'))
            return 'right'
          if (trimmed.startsWith(':'))
            return 'left'
          return null
        })

        const rows = match[2].trim().split('\n').map((row) => {
          return row.split('|').slice(1, -1).map(cell => cell.trim())
        })

        tokens.push({
          type: 'table',
          header,
          align,
          rows,
          raw: match[0],
        })

        pos += match[0].length
        continue
      }
    }

    // Skip newlines
    if (remaining.charCodeAt(0) === 10) { // \n
      pos++
      continue
    }

    // Paragraphs and text
    match = remaining.match(REGEX.paragraph)
    if (match) {
      const text = match[1].trim()
      if (text) {
        tokens.push({
          type: 'paragraph',
          text,
          raw: match[0],
          tokens: parseInline(text, options),
        })
      }
      pos += match[0].length
      continue
    }

    // Fallback: consume one line
    const lineEnd = remaining.indexOf('\n')
    if (lineEnd === -1) {
      const text = remaining.trim()
      if (text) {
        tokens.push({
          type: 'text',
          text,
          raw: remaining,
        })
      }
      break
    }

    pos += lineEnd + 1
  }

  return tokens
}

/**
 * Parse inline elements - optimized version with nested token support
 * Uses depth limiting to prevent excessive recursion on large documents
 */
function parseInline(text: string, options: MarkdownOptions, depth: number = 0): Token[] {
  const tokens: Token[] = []
  const len = text.length
  let pos = 0
  let match: RegExpMatchArray | null

  // Limit recursion depth to prevent stack overflow and improve performance
  const maxDepth = 3
  const allowNesting = depth < maxDepth

  while (pos < len) {
    const remaining = text.substring(pos)
    const char = text.charCodeAt(pos)

    // Strong emphasis (bold) - check first char before regex
    if (char === 42 || char === 95) { // * or _
      match = remaining.match(REGEX.strong)
      if (match) {
        tokens.push({
          type: 'strong',
          text: match[2],
          raw: match[0],
          tokens: allowNesting ? parseInline(match[2], options, depth + 1) : undefined,
        })
        pos += match[0].length
        continue
      }

      // Emphasis (italic) - already checked first char
      match = remaining.match(REGEX.em)
      if (match) {
        tokens.push({
          type: 'em',
          text: match[2],
          raw: match[0],
          tokens: allowNesting ? parseInline(match[2], options, depth + 1) : undefined,
        })
        pos += match[0].length
        continue
      }
    }

    // Code - check for backtick
    if (char === 96) { // `
      match = remaining.match(REGEX.code_inline)
      if (match) {
        tokens.push({
          type: 'codespan',
          text: match[1],
          raw: match[0],
        })
        pos += match[0].length
        continue
      }
    }

    // Links - check for [
    if (char === 91) { // [
      match = remaining.match(REGEX.link)
      if (match) {
        tokens.push({
          type: 'link',
          text: match[1],
          href: match[2],
          raw: match[0],
          tokens: allowNesting ? parseInline(match[1], options, depth + 1) : undefined,
        })
        pos += match[0].length
        continue
      }
    }

    // Images - check for !
    if (char === 33) { // !
      match = remaining.match(REGEX.image)
      if (match) {
        tokens.push({
          type: 'image',
          text: match[1],
          href: match[2],
          title: match[1],
          raw: match[0],
        })
        pos += match[0].length
        continue
      }
    }

    // Strikethrough (GFM) - check for ~
    if (options.gfm && char === 126) { // ~
      match = remaining.match(REGEX.del)
      if (match) {
        tokens.push({
          type: 'del',
          text: match[1],
          raw: match[0],
          tokens: allowNesting ? parseInline(match[1], options, depth + 1) : undefined,
        })
        pos += match[0].length
        continue
      }
    }

    // Line breaks
    if (options.breaks && remaining.charCodeAt(0) === 10) {
      tokens.push({
        type: 'br',
        raw: '\n',
      })
      pos++
      continue
    }

    // Regular text
    match = remaining.match(REGEX.text)
    if (match) {
      tokens.push({
        type: 'text',
        text: match[0],
        raw: match[0],
      })
      pos += match[0].length
      continue
    }

    // Single character fallback
    tokens.push({
      type: 'text',
      text: remaining[0],
      raw: remaining[0],
    })
    pos++
  }

  return tokens
}

/**
 * Render tokens to HTML - optimized with string builder
 */
function render(tokens: Token[], options: MarkdownOptions): string {
  const parts: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    switch (token.type) {
      case 'heading': {
        const id = options.headerIds ? ` id="${options.headerPrefix}${slugify(token.text || '')}"` : ''
        parts.push(`<h${token.depth}${id}>`)
        if (token.tokens) {
          parts.push(renderInlineTokens(token.tokens, options))
        } else {
          parts.push(escapeHtml(token.text || ''))
        }
        parts.push(`</h${token.depth}>\n`)
        break
      }

      case 'code': {
        const lang = token.lang || ''
        let code = escapeHtml(token.text || '')

        // Apply syntax highlighting if provided
        if (options.highlight && lang) {
          code = options.highlight(token.text || '', lang)
        }

        parts.push(`<pre><code class="language-${lang}">${code}</code></pre>\n`)
        break
      }

      case 'hr': {
        parts.push('<hr>\n')
        break
      }

      case 'blockquote': {
        parts.push('<blockquote>\n')
        if (token.tokens) {
          parts.push(render(token.tokens, options))
        }
        parts.push('</blockquote>\n')
        break
      }

      case 'list': {
        const tag = token.ordered ? 'ol' : 'ul'
        parts.push(`<${tag}>\n`)

        if (token.items) {
          for (let j = 0; j < token.items.length; j++) {
            const item = token.items[j]
            parts.push('<li>')
            if (item.task) {
              const checked = item.checked ? ' checked disabled' : ' disabled'
              parts.push(`<input type="checkbox"${checked}> `)
            }
            if (item.tokens) {
              parts.push(renderInlineTokens(item.tokens, options))
            }
            parts.push('</li>\n')
          }
        }

        parts.push(`</${tag}>\n`)
        break
      }

      case 'table': {
        parts.push('<table>\n<thead>\n<tr>\n')

        if (token.header) {
          for (let j = 0; j < token.header.length; j++) {
            const align = token.align?.[j]
            const alignAttr = align ? ` align="${align}"` : ''
            parts.push(`<th${alignAttr}>`, renderInline(token.header[j], options), '</th>\n')
          }
        }

        parts.push('</tr>\n</thead>\n<tbody>\n')

        if (token.rows) {
          for (let j = 0; j < token.rows.length; j++) {
            const row = token.rows[j]
            parts.push('<tr>\n')
            for (let k = 0; k < row.length; k++) {
              const align = token.align?.[k]
              const alignAttr = align ? ` align="${align}"` : ''
              parts.push(`<td${alignAttr}>`, renderInline(row[k], options), '</td>\n')
            }
            parts.push('</tr>\n')
          }
        }

        parts.push('</tbody>\n</table>\n')
        break
      }

      case 'paragraph': {
        parts.push('<p>')
        if (token.tokens) {
          parts.push(renderInlineTokens(token.tokens, options))
        }
        parts.push('</p>\n')
        break
      }

      case 'text': {
        parts.push(renderInline(token.text || '', options))
        break
      }
    }
  }

  return parts.join('')
}

/**
 * Render inline markdown - optimized
 */
function renderInline(text: string, options: MarkdownOptions): string {
  const tokens = parseInline(text, options)
  return renderInlineTokens(tokens, options)
}

/**
 * Render inline tokens - optimized with string builder, no re-parsing
 */
function renderInlineTokens(tokens: Token[], options: MarkdownOptions): string {
  const parts: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    switch (token.type) {
      case 'strong':
        parts.push('<strong>')
        if (token.tokens) {
          parts.push(renderInlineTokens(token.tokens, options))
        } else {
          parts.push(escapeHtml(token.text || ''))
        }
        parts.push('</strong>')
        break

      case 'em':
        parts.push('<em>')
        if (token.tokens) {
          parts.push(renderInlineTokens(token.tokens, options))
        } else {
          parts.push(escapeHtml(token.text || ''))
        }
        parts.push('</em>')
        break

      case 'codespan':
        parts.push('<code>', escapeHtml(token.text || ''), '</code>')
        break

      case 'link':
        parts.push('<a href="', escapeHtml(token.href || ''), '">')
        if (token.tokens) {
          parts.push(renderInlineTokens(token.tokens, options))
        } else {
          parts.push(escapeHtml(token.text || ''))
        }
        parts.push('</a>')
        break

      case 'image':
        parts.push('<img src="', escapeHtml(token.href || ''), '" alt="', escapeHtml(token.text || ''), '">')
        break

      case 'del':
        parts.push('<del>')
        if (token.tokens) {
          parts.push(renderInlineTokens(token.tokens, options))
        } else {
          parts.push(escapeHtml(token.text || ''))
        }
        parts.push('</del>')
        break

      case 'br':
        parts.push('<br>')
        break

      case 'text':
        parts.push(escapeHtml(token.text || ''))
        break
    }
  }

  return parts.join('')
}

// Character code constants for faster comparison
const CHAR_AMP = 38  // &
const CHAR_LT = 60   // <
const CHAR_GT = 62   // >
const CHAR_QUOT = 34 // "
const CHAR_APOS = 39 // '

/**
 * Escape HTML special characters - optimized version
 */
function escapeHtml(text: string): string {
  const len = text.length
  let escaped = ''
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
      escaped += text.substring(lastPos, i) + replacement
      lastPos = i + 1
    }
  }

  if (lastPos === 0) {
    return text
  }

  return escaped + text.substring(lastPos)
}

/**
 * Create URL-friendly slug from text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
