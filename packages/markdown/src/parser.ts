/* eslint-disable regexp/no-super-linear-backtracking */
import type { MarkdownOptions, Token } from './types'

/**
 * Fast, native Markdown parser optimized for Bun
 * Replaces 'marked' with a performance-focused implementation
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
 * Tokenize markdown content
 */
function tokenize(markdown: string, options: MarkdownOptions): Token[] {
  const tokens: Token[] = []
  let content = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Normalize line endings
  content = content.replace(/\t/g, '    ')

  while (content) {
    // Headers
    let match = content.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*(?:\n|$)/)
    if (match) {
      tokens.push({
        type: 'heading',
        depth: match[1].length,
        text: match[2],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Fenced code blocks
    match = content.match(/^```(\w+)?\n([\s\S]*?)```/)
    if (match) {
      tokens.push({
        type: 'code',
        lang: match[1] || '',
        text: match[2],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Horizontal rules
    match = content.match(/^(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})(?:\n|$)/)
    if (match) {
      tokens.push({
        type: 'hr',
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Blockquotes
    match = content.match(/^(?:>\s+(.*)(?:\n|$))+/)
    if (match) {
      const quoteContent = match[0].replace(/^>\s?/gm, '')
      tokens.push({
        type: 'blockquote',
        text: quoteContent,
        raw: match[0],
        tokens: tokenize(quoteContent, options),
      })
      content = content.substring(match[0].length)
      continue
    }

    // Lists
    match = content.match(/^(?:(?:[*\-+]|\d+\.)\s+(?:\S.*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])(?:\n|$))+/)
    if (match) {
      const listText = match[0]
      const ordered = /^\d+\./.test(listText)
      const items: Token[] = []

      const itemRegex = ordered ? /^(\d+)\.\s+(.+)(?=\n\d+\.|\n*$)/gm : /^[*\-+]\s+(.+)(?=\n[*\-+]|\n*$)/gm

      let itemMatch
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

      content = content.substring(match[0].length)
      continue
    }

    // Tables (GFM)
    if (options.gfm) {
      match = content.match(/^\|(.+)\|\n\|(?:\s*:?-+:?\s*\|)+\n((?:\|.+\|\n?)+)/)
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

        content = content.substring(match[0].length)
        continue
      }
    }

    // Skip newlines
    if (content.startsWith('\n')) {
      content = content.substring(1)
      continue
    }

    // Paragraphs and text
    match = content.match(/^(.+?)(?:\n\n|\n(?=#)|$)/s)
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
      content = content.substring(match[0].length)
      continue
    }

    // Fallback: consume one line
    const lineEnd = content.indexOf('\n')
    if (lineEnd === -1) {
      if (content.trim()) {
        tokens.push({
          type: 'text',
          text: content,
          raw: content,
        })
      }
      break
    }

    content = content.substring(lineEnd + 1)
  }

  return tokens
}

/**
 * Parse inline elements
 */
function parseInline(text: string, options: MarkdownOptions): Token[] {
  const tokens: Token[] = []
  let content = text

  while (content) {
    // Strong emphasis (bold)
    let match = content.match(/^(\*\*|__)(.+?)\1/)
    if (match) {
      tokens.push({
        type: 'strong',
        text: match[2],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Emphasis (italic)
    match = content.match(/^(\*|_)(.+?)\1/)
    if (match) {
      tokens.push({
        type: 'em',
        text: match[2],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Code
    match = content.match(/^`([^`]+)`/)
    if (match) {
      tokens.push({
        type: 'codespan',
        text: match[1],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Links
    match = content.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (match) {
      tokens.push({
        type: 'link',
        text: match[1],
        href: match[2],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Images
    match = content.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (match) {
      const title = match[1]
      const href = match[2]
      tokens.push({
        type: 'image',
        text: title,
        href,
        title,
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Strikethrough (GFM)
    if (options.gfm) {
      match = content.match(/^~~(.+?)~~/)
      if (match) {
        tokens.push({
          type: 'del',
          text: match[1],
          raw: match[0],
        })
        content = content.substring(match[0].length)
        continue
      }
    }

    // Line breaks
    if (options.breaks && content.startsWith('\n')) {
      tokens.push({
        type: 'br',
        raw: '\n',
      })
      content = content.substring(1)
      continue
    }

    // Regular text
    match = content.match(/^[^*_`[\n!~]+/)
    if (match) {
      tokens.push({
        type: 'text',
        text: match[0],
        raw: match[0],
      })
      content = content.substring(match[0].length)
      continue
    }

    // Single character fallback
    tokens.push({
      type: 'text',
      text: content[0],
      raw: content[0],
    })
    content = content.substring(1)
  }

  return tokens
}

/**
 * Render tokens to HTML
 */
function render(tokens: Token[], options: MarkdownOptions): string {
  let html = ''

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const id = options.headerIds ? ` id="${options.headerPrefix}${slugify(token.text || '')}"` : ''
        html += `<h${token.depth}${id}>${renderInline(token.text || '', options)}</h${token.depth}>\n`
        break
      }

      case 'code': {
        const lang = token.lang || ''
        let code = escapeHtml(token.text || '')

        // Apply syntax highlighting if provided
        if (options.highlight && lang) {
          code = options.highlight(token.text || '', lang)
        }

        html += `<pre><code class="language-${lang}">${code}</code></pre>\n`
        break
      }

      case 'hr': {
        html += '<hr>\n'
        break
      }

      case 'blockquote': {
        html += '<blockquote>\n'
        if (token.tokens) {
          html += render(token.tokens, options)
        }
        html += '</blockquote>\n'
        break
      }

      case 'list': {
        const tag = token.ordered ? 'ol' : 'ul'
        html += `<${tag}>\n`

        if (token.items) {
          for (const item of token.items) {
            if (item.task) {
              const checked = item.checked ? ' checked disabled' : ' disabled'
              html += '<li>'
              html += `<input type="checkbox"${checked}> `
              html += renderInlineTokens(item.tokens || [], options)
              html += '</li>\n'
            }
            else {
              html += '<li>'
              html += renderInlineTokens(item.tokens || [], options)
              html += '</li>\n'
            }
          }
        }

        html += `</${tag}>\n`
        break
      }

      case 'table': {
        html += '<table>\n<thead>\n<tr>\n'

        if (token.header) {
          for (let i = 0; i < token.header.length; i++) {
            const align = token.align?.[i]
            const alignAttr = align ? ` align="${align}"` : ''
            html += `<th${alignAttr}>${renderInline(token.header[i], options)}</th>\n`
          }
        }

        html += '</tr>\n</thead>\n<tbody>\n'

        if (token.rows) {
          for (const row of token.rows) {
            html += '<tr>\n'
            for (let i = 0; i < row.length; i++) {
              const align = token.align?.[i]
              const alignAttr = align ? ` align="${align}"` : ''
              html += `<td${alignAttr}>${renderInline(row[i], options)}</td>\n`
            }
            html += '</tr>\n'
          }
        }

        html += '</tbody>\n</table>\n'
        break
      }

      case 'paragraph': {
        html += '<p>'
        html += renderInlineTokens(token.tokens || [], options)
        html += '</p>\n'
        break
      }

      case 'text': {
        html += renderInline(token.text || '', options)
        break
      }
    }
  }

  return html
}

/**
 * Render inline markdown
 */
function renderInline(text: string, options: MarkdownOptions): string {
  const tokens = parseInline(text, options)
  return renderInlineTokens(tokens, options)
}

/**
 * Render inline tokens
 */
function renderInlineTokens(tokens: Token[], options: MarkdownOptions): string {
  let html = ''

  for (const token of tokens) {
    switch (token.type) {
      case 'strong':
        html += `<strong>${renderInline(token.text || '', options)}</strong>`
        break

      case 'em':
        html += `<em>${renderInline(token.text || '', options)}</em>`
        break

      case 'codespan':
        html += `<code>${escapeHtml(token.text || '')}</code>`
        break

      case 'link':
        html += `<a href="${escapeHtml(token.href || '')}">${renderInline(token.text || '', options)}</a>`
        break

      case 'image':
        html += `<img src="${escapeHtml(token.href || '')}" alt="${escapeHtml(token.text || '')}">`
        break

      case 'del':
        html += `<del>${renderInline(token.text || '', options)}</del>`
        break

      case 'br':
        html += '<br>'
        break

      case 'text':
        html += escapeHtml(token.text || '')
        break
    }
  }

  return html
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
