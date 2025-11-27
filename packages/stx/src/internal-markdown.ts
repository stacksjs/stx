/**
 * Internal markdown utilities to replace ts-md dependency
 * Provides frontmatter parsing and markdown to HTML conversion
 */

export interface FrontmatterResult {
  data: Record<string, unknown>
  content: string
}

export interface MarkdownOptions {
  gfm?: boolean
  breaks?: boolean
}

/**
 * Parse YAML frontmatter from markdown content
 * Frontmatter is delimited by --- at the start of the file
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return {
      data: {},
      content: content.trim(),
    }
  }

  const yamlContent = match[1]
  const markdownContent = content.slice(match[0].length)

  // Simple YAML parser for common cases
  const data: Record<string, unknown> = {}

  for (const line of yamlContent.split('\n')) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#'))
      continue

    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex === -1)
      continue

    const key = trimmedLine.slice(0, colonIndex).trim()
    let value: unknown = trimmedLine.slice(colonIndex + 1).trim()

    // Remove quotes if present
    if (typeof value === 'string') {
      if ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith('\'') && value.endsWith('\''))) {
        value = value.slice(1, -1)
      }
      // Handle arrays (basic support)
      else if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value)
        }
        catch {
          // Keep as string if not valid JSON
        }
      }
      // Handle booleans
      else if (value === 'true') {
        value = true
      }
      else if (value === 'false') {
        value = false
      }
      // Handle numbers
      else if (/^-?\d+(\.\d+)?$/.test(value as string)) {
        value = Number(value)
      }
    }

    data[key] = value
  }

  return {
    data,
    content: markdownContent.trim(),
  }
}

/**
 * Convert markdown to HTML
 * Simple implementation that handles common markdown patterns
 */
export function parseMarkdown(content: string, options: MarkdownOptions = {}): string {
  const { gfm = true, breaks = false } = options

  let html = content

  // Escape HTML entities first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Process code blocks first (to avoid processing markdown inside them)
  const codeBlocks: string[] = []
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const index = codeBlocks.length
    const langAttr = lang ? ` class="language-${lang}"` : ''
    codeBlocks.push(`<pre><code${langAttr}>${code.trim()}</code></pre>`)
    return `__CODE_BLOCK_${index}__`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough (GFM)
  if (gfm) {
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  }

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Horizontal rules
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr />')

  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
  // Merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n')

  // Unordered lists
  html = html.replace(/^[\*\-\+]\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.replace(/<\/ul>\n<ul>/g, '')

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
  // Only wrap consecutive li items in ol if they follow numbered pattern
  const olPattern = /(<li>.*<\/li>\n?)+/g
  const matches = html.match(olPattern)
  if (matches) {
    for (const match of matches) {
      if (!html.includes(`<ul>${match}</ul>`)) {
        // Only wrap in ol if not already in ul
        const wrapped = `<ol>${match}</ol>`
        html = html.replace(match, wrapped)
      }
    }
  }

  // Tables (GFM)
  if (gfm) {
    html = html.replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n)*)/gm, (_match, header, body) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean)
      const headerRow = `<tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>`

      const bodyRows = body
        .trim()
        .split('\n')
        .map((row: string) => {
          const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean)
          return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`
        })
        .join('\n')

      return `<table>\n<thead>\n${headerRow}\n</thead>\n<tbody>\n${bodyRows}\n</tbody>\n</table>`
    })
  }

  // Task lists (GFM)
  if (gfm) {
    html = html.replace(/<li>\s*\[\s*\]\s*/g, '<li><input type="checkbox" disabled /> ')
    html = html.replace(/<li>\s*\[x\]\s*/gi, '<li><input type="checkbox" checked disabled /> ')
  }

  // Paragraphs - wrap text blocks not already in tags
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inParagraph = false
  let paragraphContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const isBlockElement = /^<(h[1-6]|ul|ol|li|blockquote|pre|table|thead|tbody|tr|th|td|hr|div|p)/.test(trimmed)
      || /^__CODE_BLOCK_\d+__$/.test(trimmed)
      || trimmed === ''

    if (isBlockElement) {
      if (inParagraph && paragraphContent.length > 0) {
        processedLines.push(`<p>${paragraphContent.join(breaks ? '<br />\n' : '\n')}</p>`)
        paragraphContent = []
        inParagraph = false
      }
      processedLines.push(line)
    }
    else {
      inParagraph = true
      paragraphContent.push(trimmed)
    }
  }

  if (inParagraph && paragraphContent.length > 0) {
    processedLines.push(`<p>${paragraphContent.join(breaks ? '<br />\n' : '\n')}</p>`)
  }

  html = processedLines.join('\n')

  // Restore code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    html = html.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i])
  }

  // Line breaks (if breaks option is enabled)
  if (breaks) {
    html = html.replace(/\n/g, '<br />\n')
  }

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html.trim()
}
