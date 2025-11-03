/**
 * stx file formatter for automatically formatting .stx files
 */

export interface FormatterOptions {
  /** Number of spaces for indentation (default: 2) */
  indentSize?: number
  /** Use tabs instead of spaces for indentation */
  useTabs?: boolean
  /** Maximum line length before wrapping (default: 120) */
  maxLineLength?: number
  /** Normalize whitespace in template expressions */
  normalizeWhitespace?: boolean
  /** Sort attributes alphabetically */
  sortAttributes?: boolean
  /** Remove trailing whitespace */
  trimTrailingWhitespace?: boolean
}

const DEFAULT_OPTIONS: Required<FormatterOptions> = {
  indentSize: 2,
  useTabs: false,
  maxLineLength: 120,
  normalizeWhitespace: true,
  sortAttributes: false,
  trimTrailingWhitespace: true,
}

/**
 * Format stx file content
 */
export function formatStxContent(content: string, options: FormatterOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Handle empty or whitespace-only content
  if (content.trim() === '') {
    return '\n'
  }

  let formatted = content

  // Remove trailing whitespace from all lines
  if (opts.trimTrailingWhitespace) {
    formatted = formatted.replace(/[ \t]+$/gm, '')
  }

  // Skip script tag formatting - it breaks existing code
  // formatted = formatScriptTags(formatted, opts)

  // Format HTML structure (only indentation inside directives)
  formatted = formatHtml(formatted, opts)

  // Skip attribute formatting to avoid breaking existing code
  // formatted = formatAttributes(formatted, opts)

  // Normalize directive spacing (but don't modify structure)
  formatted = formatStxDirectives(formatted, opts)

  // Final pass: remove any trailing whitespace that might have been introduced
  if (opts.trimTrailingWhitespace) {
    formatted = formatted.replace(/[ \t]+$/gm, '')
    // Also remove whitespace before closing tags (but only when there's content before it on the same line)
    formatted = formatted.replace(/(\S)[ \t]+(<\/[^>]+>)/g, '$1$2')
  }

  // Normalize line endings and ensure file ends with newline
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!formatted.endsWith('\n')) {
    formatted += '\n'
  }

  return formatted
}

/**
 * Format markdown file content, processing stx code blocks
 */
export function formatMarkdownContent(content: string, options: FormatterOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Handle empty or whitespace-only content
  if (content.trim() === '') {
    return '\n'
  }

  let formatted = content

  // Find and format code blocks that contain html or stx
  // Match: ```html or ```stx code blocks, preserving the indentation of the fence
  formatted = formatted.replace(/^( *)```(html|stx)\n([\s\S]*?)^( *)```/gm, (match, startIndent, lang, code, _endIndent) => {
    // Detect the base indentation from the code block content
    const lines = code.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)

    if (nonEmptyLines.length === 0) {
      return match // Keep empty code blocks as-is
    }

    // Find minimum indentation in the code block
    const minIndent = Math.min(
      ...nonEmptyLines.map((line) => {
        const match = line.match(/^( *)/)
        return match ? match[1].length : 0
      }),
    )

    // Remove the base indentation, format, then restore with fence indentation
    const dedented = lines.map((line) => {
      if (line.trim().length === 0)
        return ''
      return line.substring(minIndent)
    }).join('\n')

    // Format the dedented code
    const formattedCode = formatStxContent(dedented, opts).trimEnd()

    // Re-indent to match the fence indentation
    const reindented = formattedCode.split('\n').map((line) => {
      if (line.trim().length === 0)
        return ''
      return startIndent + line
    }).join('\n')

    return `${startIndent}\`\`\`${lang}\n${reindented}\n${startIndent}\`\`\``
  })

  // Remove trailing whitespace from all lines
  if (opts.trimTrailingWhitespace) {
    formatted = formatted.replace(/[ \t]+$/gm, '')
  }

  // Normalize line endings and ensure file ends with newline
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!formatted.endsWith('\n')) {
    formatted += '\n'
  }

  return formatted
}

/**
 * Format script tags within stx files
 */
function _formatScriptTags(content: string, options: Required<FormatterOptions>): string {
  return content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
    const trimmed = scriptContent.trim()

    // Keep simple one-liner scripts inline (single statement, reasonable length)
    if (trimmed && !trimmed.includes('\n') && trimmed.length < 80) {
      return match.replace(scriptContent, trimmed)
    }

    // Basic script formatting - normalize indentation for multi-line scripts
    const lines = scriptContent.split('\n')
    const formattedLines = lines.map((line: string, index: number) => {
      if (index === 0 && line.trim() === '')
        return '' // Empty first line
      if (index === lines.length - 1 && line.trim() === '')
        return '' // Empty last line

      // Preserve comment formatting (including JSDoc)
      const lineTrimmed = line.trim()
      if (lineTrimmed === '')
        return ''

      // Check if this is part of a multi-line comment
      if (lineTrimmed.startsWith('/**') || lineTrimmed.startsWith('/*') || lineTrimmed.startsWith('*') || lineTrimmed.startsWith('*/')) {
        // Preserve comment indentation relative to base indentation
        const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize)
        return `${indent}${lineTrimmed}`
      }

      const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize)
      return `${indent}${lineTrimmed}`
    }).filter((line: string, index: number, arr: string[]) => {
      // Remove empty lines at start and end
      if (index === 0 || index === arr.length - 1)
        return line !== ''
      return true
    })

    const formattedScript = formattedLines.length > 0
      ? `\n${formattedLines.join('\n')}\n`
      : ''

    return match.replace(scriptContent, formattedScript)
  })
}

/**
 * Format HTML structure with proper indentation
 * Tracks both directive depth AND HTML nesting depth
 */
function formatHtml(content: string, options: Required<FormatterOptions>): string {
  const lines = content.split('\n')
  const formattedLines: string[] = []
  const directiveStack: number[] = [] // Track base indentation for each directive level
  let htmlDepth = 0 // Track HTML element nesting inside directives
  let inScriptTag = false // Track if we're inside a <script> tag
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty lines pass through as-is
    if (trimmed === '') {
      formattedLines.push(line)
      continue
    }

    // Get current line indentation
    const currentIndent = line.match(/^(\s*)/)?.[1] || ''
    const currentIndentLevel = Math.floor(currentIndent.length / options.indentSize)

    // Track script tag state
    if (trimmed.match(/<script\b/i)) {
      inScriptTag = true
    }
    if (trimmed.match(/<\/script>/i)) {
      inScriptTag = false
    }

    // Handle closing directives
    if (trimmed.startsWith('@end')) {
      directiveStack.pop()
      htmlDepth = 0 // Reset HTML depth when exiting directive
      inScriptTag = false // Reset script tag state
      formattedLines.push(line)
      continue
    }

    // Handle middle directives (@else, @elseif) - these are at the same level as @if
    if (trimmed.startsWith('@else') || trimmed.startsWith('@elseif')) {
      // These should be at the same level as the opening @if
      htmlDepth = 0 // Reset HTML depth for new branch
      inScriptTag = false // Reset script tag state
      if (directiveStack.length > 0) {
        const baseIndentLevel = directiveStack[directiveStack.length - 1]
        const expectedIndent = indent.repeat(baseIndentLevel)
        formattedLines.push(expectedIndent + trimmed)
      }
      else {
        formattedLines.push(line)
      }
      continue
    }

    // Handle opening directives
    if (trimmed.startsWith('@') && isOpeningDirective(trimmed)) {
      // Remember the indentation level of this directive
      directiveStack.push(currentIndentLevel)
      htmlDepth = 0 // Reset HTML depth
      // Don't reset inScriptTag - we might be inside a script tag with directives
      formattedLines.push(line)
      continue
    }

    // For content inside directives, ensure proper indentation
    if (directiveStack.length > 0) {
      // If we're inside a script tag, preserve the original formatting
      if (inScriptTag) {
        formattedLines.push(line)
        continue
      }

      // Check if this line is just a closing tag marker (like a lone ">")
      const isJustClosingBracket = trimmed === '>'

      // Check if this line closes an HTML tag
      const isClosingTag = trimmed.startsWith('</')
      const isOpeningTag = trimmed.startsWith('<') && !isClosingTag && !trimmed.startsWith('<!--')
      const isSelfClosing = trimmed.includes('/>') || isSelfClosingTag(trimmed)
      const hasCompleteTag = hasCompleteElement(trimmed)

      // Decrease depth BEFORE formatting if this is a closing tag
      if (isClosingTag) {
        htmlDepth = Math.max(0, htmlDepth - 1)
      }

      // Get the base indentation from the last directive
      const baseIndentLevel = directiveStack[directiveStack.length - 1]

      // For a closing bracket on its own line (multi-line tag), keep original indentation
      if (isJustClosingBracket) {
        formattedLines.push(line)
      }
      else {
        // Total indentation = directive base + 1 (for being inside directive) + HTML depth
        const expectedIndentLevel = baseIndentLevel + 1 + htmlDepth
        const expectedIndent = indent.repeat(expectedIndentLevel)

        // Apply the indentation
        formattedLines.push(expectedIndent + trimmed)
      }

      // Increase depth AFTER formatting if this is an opening tag (but not self-closing or complete)
      // Don't increase depth for multi-line tags (when the line is just ">")
      if (isOpeningTag && !isSelfClosing && !hasCompleteTag && !isJustClosingBracket) {
        htmlDepth++
      }
    }
    else {
      // Outside directives, keep as-is
      formattedLines.push(line)
    }
  }

  return formattedLines.join('\n')
}

/**
 * Format stx directives for better readability
 */
function formatStxDirectives(content: string, options: Required<FormatterOptions>): string {
  // Format @if, @foreach, @for etc. directives
  // eslint-disable-next-line regexp/optimal-quantifier-concatenation
  content = content.replace(/@(if|elseif|foreach|for|while)\s*\(\s*([^)]+)\s*\)/g, (match, directive, condition) => {
    const normalizedCondition = condition.trim().replace(/\s+/g, ' ')
    return `@${directive}(${normalizedCondition})`
  })

  // Format simple directives like @csrf, @method etc.
  // eslint-disable-next-line regexp/optimal-quantifier-concatenation
  content = content.replace(/@(csrf|method)\s*\(\s*([^)]*)\s*\)/g, (match, directive, param) => {
    if (param.trim() === '') {
      return `@${directive}`
    }
    return `@${directive}(${param.trim()})`
  })

  // Format variable expressions {{ variable }}
  if (options.normalizeWhitespace) {
    // eslint-disable-next-line regexp/optimal-quantifier-concatenation
    content = content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      return `{{ ${expression.trim()} }}`
    })

    // Format raw expressions {!! variable !!}
    // eslint-disable-next-line regexp/optimal-quantifier-concatenation
    content = content.replace(/\{!!\s*([^!]+)\s*!!\}/g, (match, expression) => {
      return `{!! ${expression.trim()} !!}`
    })
  }

  return content
}

/**
 * Check if a tag is self-closing
 */
function isSelfClosingTag(line: string): boolean {
  const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']

  if (line.includes('/>'))
    return true

  const tagMatch = line.match(/<(\w+)/)
  if (tagMatch) {
    const tagName = tagMatch[1]
    return selfClosingTags.includes(tagName.toLowerCase())
  }

  return false
}

/**
 * Check if a line contains a complete element (opening and closing tag on same line)
 */
function hasCompleteElement(line: string): boolean {
  // Match patterns like <tag>...</tag> or <tag attr="value">...</tag>
  const completeElementRegex = /<(\w+)(?:\s[^>]*)?>[\s\S]*?<\/\1>/
  return completeElementRegex.test(line)
}

/**
 * Check if a directive opens a block that needs closing
 */
function isOpeningDirective(line: string): boolean {
  const blockDirectives = ['if', 'unless', 'foreach', 'for', 'while', 'section', 'push', 'component', 'slot', 'markdown', 'wrap', 'error']

  for (const directive of blockDirectives) {
    if (line.startsWith(`@${directive}`)) {
      return !line.includes(`@end${directive}`) // Not a single-line directive
    }
  }

  return false
}

/**
 * Format attributes in HTML tags
 */
function _formatAttributes(content: string, options: Required<FormatterOptions>): string {
  if (!options.sortAttributes)
    return content

  return content.replace(/<(\w+)([^>]*)>/g, (match, tagName, attributes) => {
    if (!attributes.trim())
      return match

    // Skip malformed tags (attributes containing <, newlines, or @ directives suggest malformed HTML)
    if (attributes.includes('<') || attributes.includes('\n') || attributes.includes('@')) {
      return match
    }

    // Parse attributes
    const attrRegex = /(\w+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
    const attrs: Array<{ name: string, value?: string }> = []
    let attrMatch

    // biome-ignore lint/suspicious/noAssignInExpressions: needed for regex matching
    // eslint-disable-next-line no-cond-assign
    while ((attrMatch = attrRegex.exec(attributes)) !== null) {
      attrs.push({
        name: attrMatch[1],
        value: attrMatch[2],
      })
    }

    // Sort attributes (class and id first, then alphabetically)
    attrs.sort((a, b) => {
      if (a.name === 'id')
        return -1
      if (b.name === 'id')
        return 1
      if (a.name === 'class')
        return -1
      if (b.name === 'class')
        return 1
      return a.name.localeCompare(b.name)
    })

    // Rebuild attributes
    const formattedAttrs = attrs
      .map(attr => attr.value ? `${attr.name}=${attr.value}` : attr.name)
      .join(' ')

    return `<${tagName}${formattedAttrs ? ` ${formattedAttrs}` : ''}>`
  })
}
