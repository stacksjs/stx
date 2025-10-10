/* eslint-disable regexp/no-super-linear-backtracking */
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

  // Normalize script tag formatting
  formatted = formatScriptTags(formatted, opts)

  // Format HTML structure
  formatted = formatHtml(formatted, opts)

  // Format attributes
  formatted = formatAttributes(formatted, opts)

  // Format stx directives
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
 * Format script tags within stx files
 */
function formatScriptTags(content: string, options: Required<FormatterOptions>): string {
  return content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
    // Basic script formatting - normalize indentation
    const lines = scriptContent.split('\n')
    const formattedLines = lines.map((line: string, index: number) => {
      if (index === 0 && line.trim() === '')
        return '' // Empty first line
      if (index === lines.length - 1 && line.trim() === '')
        return '' // Empty last line

      // Add consistent indentation
      const trimmed = line.trim()
      if (trimmed === '')
        return ''

      const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize)
      return `${indent}${trimmed}`
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
 */
function formatHtml(content: string, options: Required<FormatterOptions>): string {
  // Pre-process: Split inline nested HTML elements and directives into separate lines
  let preprocessed = content

  // First, protect whitespace-sensitive tags from formatting (pre, code, textarea, style)
  const whitespaceSensitivePlaceholders: string[] = []
  const whitespaceTags = ['pre', 'code', 'textarea', 'style']
  for (const tag of whitespaceTags) {
    const regex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    preprocessed = preprocessed.replace(regex, (match) => {
      const placeholder = `__WHITESPACE_TAG_${whitespaceSensitivePlaceholders.length}__`
      whitespaceSensitivePlaceholders.push(match)
      return placeholder
    })
  }

  // Then protect empty tags from being split (e.g., <script></script>, <div></div>)
  const emptyTagPlaceholders: string[] = []
  preprocessed = preprocessed.replace(/<(\w+)([^>]*)><\/\1>/g, (match) => {
    const placeholder = `__EMPTY_TAG_${emptyTagPlaceholders.length}__`
    emptyTagPlaceholders.push(match)
    return placeholder
  })

  // Split between HTML tags: ><  → >\n<
  preprocessed = preprocessed.replace(/>(\s*)</g, (match, whitespace) => {
    // If there's already whitespace including newlines, keep it
    if (whitespace.includes('\n')) {
      return match
    }
    // Otherwise add a newline between tags
    return '>\n<'
  })

  // Split before directives: >@ → >\n@
  preprocessed = preprocessed.replace(/>(\s*)@/g, (match, whitespace) => {
    if (whitespace.includes('\n')) {
      return match
    }
    return '>\n@'
  })

  // Split after closing directives before tags: @endif< → @endif\n<
  preprocessed = preprocessed.replace(/(@end\w+)(\s*)</g, (match, directive, whitespace) => {
    if (whitespace.includes('\n')) {
      return match
    }
    return `${directive}\n<`
  })

  // Split after directive statements before other directives: )@ → )\n@
  preprocessed = preprocessed.replace(/\)(\s*)@/g, (match, whitespace) => {
    if (whitespace.includes('\n')) {
      return match
    }
    return ')\n@'
  })

  // Split after directive statements before tags: )<tag> → )\n<tag>
  preprocessed = preprocessed.replace(/\)(\s*)</g, (match, whitespace) => {
    if (whitespace.includes('\n')) {
      return match
    }
    return ')\n<'
  })

  // Split between closing directives: @endif@endif → @endif\n@endif
  preprocessed = preprocessed.replace(/(@end\w+)(\s*)@/g, (match, directive, whitespace) => {
    if (whitespace.includes('\n')) {
      return match
    }
    return `${directive}\n@`
  })

  // Split standalone directives (no parens) from tags: @csrf< → @csrf\n<, @endif< → @endif\n<
  // Match @directive< where there's no ( between @ and <
  preprocessed = preprocessed.replace(/(@\w+)(?!\s*\()(\s*)</g, (match, directive, whitespace) => {
    if (whitespace.includes('\n')) {
      return match
    }
    return `${directive}\n<`
  })

  const lines = preprocessed.split('\n')
  const formattedLines: string[] = []
  let indentLevel = 0
  const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === '') {
      formattedLines.push('')
      continue
    }

    // Handle closing tags
    if (line.startsWith('</') || line.startsWith('@end')) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    // Add the line with proper indentation
    const indentedLine = indentLevel > 0 ? indent.repeat(indentLevel) + line : line
    formattedLines.push(indentedLine)

    // Handle opening tags (but not self-closing)
    if (line.startsWith('<') && !line.includes('/>') && !line.startsWith('</')) {
      // Check if it's not a self-closing tag or comment
      // Also check if the line contains both opening and closing tags (e.g., <title>Text</title>)
      const hasMatchingClosingTag = line.match(/<(\w+)[^>]*>.*<\/\1>/)
      if (!line.includes('<!') && !isSelfClosingTag(line) && !hasMatchingClosingTag) {
        indentLevel++
      }
    }

    // Handle stx directives that open blocks
    if (line.startsWith('@') && isOpeningDirective(line)) {
      indentLevel++
    }
  }

  let result = formattedLines.join('\n')

  // Restore whitespace-sensitive tag placeholders first
  whitespaceSensitivePlaceholders.forEach((tag, index) => {
    result = result.replace(`__WHITESPACE_TAG_${index}__`, tag)
  })

  // Then restore empty tag placeholders
  emptyTagPlaceholders.forEach((tag, index) => {
    result = result.replace(`__EMPTY_TAG_${index}__`, tag)
  })

  return result
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
    const tagName = tagMatch[1].toLowerCase()
    return selfClosingTags.includes(tagName)
  }

  return false
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
