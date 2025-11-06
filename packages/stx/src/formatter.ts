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

  // Format attributes if enabled
  formatted = formatAttributes(formatted, opts)

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
    const nonEmptyLines = lines.filter((line: string) => line.trim().length > 0)

    if (nonEmptyLines.length === 0) {
      return match // Keep empty code blocks as-is
    }

    // Find minimum indentation in the code block
    const minIndent = Math.min(
      ...nonEmptyLines.map((line: string) => {
        const match = line.match(/^( *)/)
        return match ? match[1].length : 0
      }),
    )

    // Remove the base indentation, format, then restore with fence indentation
    const dedented = lines.map((line: string) => {
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
 * Split inline tags onto separate lines
 * But preserve mixed text content (text + tags on same line)
 */
function splitInlineTags(content: string): string {
  // Split on tags, but keep mixed text/tag content together
  let result = content

  // Split directives onto their own lines FIRST (before other processing)
  // Split opening block directives
  result = result.replace(/(@(?:if|foreach|for|while|unless|section|component|slot|push|prepend)(?:\([^)]*\))?)/g, '\n$1\n')
  // Split closing directives
  result = result.replace(/(@end\w+)/g, '\n$1\n')
  // Split middle directives
  result = result.replace(/(@(?:else|elseif)(?:\([^)]*\))?)/g, '\n$1\n')

  // Split opening tags onto new lines (unless there's text before them)
  result = result.replace(/(?<=>)(<(?!\/)[^>]+>)/g, '\n$1')

  // Split closing tags onto new lines (unless there's text after them on same line)
  result = result.replace(/(<\/[^>]+>)(?=<)/g, '$1\n')

  // Also split before closing tags if there's an opening tag before
  // BUT don't split when it's an empty element (opening immediately followed by closing)
  result = result.replace(/(>)(<\/)(?![\w\s]*>$)/g, (match, gt, closeTag, offset, string) => {
    // Check if this is part of an empty element pattern like <tag></tag>
    const before = string.substring(Math.max(0, offset - 50), offset)
    const after = string.substring(offset + match.length, Math.min(string.length, offset + match.length + 20))

    // If the closing tag immediately follows opening (empty element), don't split
    if (before.match(/<\w[^>]*>$/) && after.match(/^\w[^>]*>/)) {
      // eslint-disable-next-line regexp/optimal-quantifier-concatenation
      const openTagName = before.match(/<(\w+)[^>]*>$/)?.[1]
      const closeTagName = after.match(/^(\w+)>/)?.[1]
      if (openTagName === closeTagName) {
        return match // Keep empty elements together
      }
    }
    return `${gt}\n${closeTag}`
  })

  // Clean up multiple consecutive newlines
  result = result.replace(/\n{2,}/g, '\n')

  // Remove leading/trailing newlines from each line
  result = result.split('\n').map((line: string) => line.trim()).join('\n')

  // Remove empty lines at start/end
  result = result.replace(/^\n+/, '').replace(/\n+$/, '')

  return result
}

/**
 * Format HTML structure with proper indentation
 * Tracks total indentation level for both HTML and directives
 */
function formatHtml(content: string, options: Required<FormatterOptions>): string {
  // First, split inline tags onto separate lines
  const preprocessed = splitInlineTags(content)

  const lines = preprocessed.split('\n')
  const formattedLines: string[] = []
  let indentLevel = 0 // Track current indentation level
  let inScriptTag = false // Track if we're inside a <script> tag
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty lines pass through as-is
    if (trimmed === '') {
      formattedLines.push('')
      continue
    }

    // Track script tag state - but handle opening/closing script tags normally first
    const hasScriptOpen = trimmed.match(/<script\b/i)
    const hasScriptClose = trimmed.match(/<\/script>/i)

    // If we're inside a script tag content (not the opening/closing tags), preserve formatting
    if (inScriptTag && !hasScriptClose) {
      formattedLines.push(line)
      continue
    }

    // Check if this line is just a closing tag marker (like a lone ">")
    const isJustClosingBracket = trimmed === '>'

    // Handle mixed inline content (text + tags on same line) - keep inline
    if (hasCompleteElement(trimmed) && !trimmed.startsWith('<') && !trimmed.startsWith('@')) {
      formattedLines.push(indent.repeat(indentLevel) + trimmed)
      continue
    }

    // Check what kind of line this is
    const isClosingDirective = trimmed.startsWith('@end')
    const isMiddleDirective = trimmed.startsWith('@else') || trimmed.startsWith('@elseif')
    const isDirectiveOpening = trimmed.startsWith('@') && isOpeningDirective(trimmed)
    const isDocType = trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<!doctype')
    const isComment = trimmed.startsWith('<!--')
    const isClosingTag = trimmed.startsWith('</')
    const isOpeningTag = trimmed.startsWith('<') && !isClosingTag && !isComment && !isDocType
    const isSelfClosing = trimmed.includes('/>') || isSelfClosingTag(trimmed)
    const hasCompleteTag = hasCompleteElement(trimmed)

    // Decrease indent BEFORE printing closing tags/directives
    if (isClosingTag || isClosingDirective) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    // Middle directives stay at same level as their opening directive
    const currentIndent = isMiddleDirective
      ? Math.max(0, indentLevel - 1)
      : indentLevel

    // Print the line with proper indentation (unless it's just a closing bracket)
    if (isJustClosingBracket) {
      formattedLines.push(line)
    }
    else {
      formattedLines.push(indent.repeat(currentIndent) + trimmed)
    }

    // Increase indent AFTER printing opening tags/directives
    if ((isOpeningTag && !isSelfClosing && !hasCompleteTag && !isJustClosingBracket) || isDirectiveOpening) {
      indentLevel++
    }

    // Update script tag state AFTER processing the line
    if (hasScriptOpen) {
      inScriptTag = true
    }
    if (hasScriptClose) {
      inScriptTag = false
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
function formatAttributes(content: string, options: Required<FormatterOptions>): string {
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
