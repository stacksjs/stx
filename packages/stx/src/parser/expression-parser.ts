/**
 * Expression Parser
 *
 * Provides utilities for parsing JavaScript expressions in templates,
 * using proper tokenization instead of regex-based approaches.
 *
 * @module parser/expression-parser
 */

import { extractBalancedExpression, findMatchingDelimiter, splitByPipe, Tokenizer } from './tokenizer'

// =============================================================================
// Expression Extraction
// =============================================================================

export interface ExpressionMatch {
  fullMatch: string
  expression: string
  start: number
  end: number
  isRaw: boolean
}

/**
 * Find all template expressions in source ({{ }} and {!! !!})
 */
export function findExpressions(source: string): ExpressionMatch[] {
  const results: ExpressionMatch[] = []
  let pos = 0

  while (pos < source.length) {
    // Look for {{ or {!!
    const nextDouble = source.indexOf('{{', pos)
    const nextRaw = source.indexOf('{!!', pos)

    let isRaw = false
    let startPos: number

    if (nextDouble === -1 && nextRaw === -1) {
      break
    }
    else if (nextDouble === -1) {
      startPos = nextRaw
      isRaw = true
    }
    else if (nextRaw === -1) {
      startPos = nextDouble
      isRaw = false
    }
    else if (nextRaw < nextDouble) {
      startPos = nextRaw
      isRaw = true
    }
    else {
      startPos = nextDouble
      isRaw = false
    }

    // Check for triple braces {{{ which should be treated as raw
    if (!isRaw && source.slice(startPos, startPos + 3) === '{{{') {
      isRaw = true
    }

    const openDelim = isRaw ? (source.slice(startPos, startPos + 3) === '{{{' ? '{{{' : '{!!') : '{{'
    const closeDelim = isRaw ? (openDelim === '{{{' ? '}}}' : '!!}') : '}}'
    const exprStart = startPos + openDelim.length

    // Find the closing delimiter using proper parsing
    const endPos = findExpressionEnd(source, exprStart, closeDelim)

    if (endPos === -1) {
      // Unclosed expression, skip and continue
      pos = startPos + 1
      continue
    }

    const expression = source.slice(exprStart, endPos).trim()
    const fullEnd = endPos + closeDelim.length

    results.push({
      fullMatch: source.slice(startPos, fullEnd),
      expression,
      start: startPos,
      end: fullEnd,
      isRaw,
    })

    pos = fullEnd
  }

  return results
}

/**
 * Find the end of an expression, respecting strings and nested structures
 */
function findExpressionEnd(source: string, startPos: number, closeDelim: string): number {
  let pos = startPos
  let inString: string | null = null
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let inTemplateExpr = 0

  while (pos < source.length) {
    const char = source[pos]
    const prevChar = pos > 0 ? source[pos - 1] : ''

    // Handle escape sequences
    if (prevChar === '\\' && inString) {
      pos++
      continue
    }

    // Handle string entry/exit
    if ((char === '"' || char === '\'') && !inString) {
      inString = char
      pos++
      continue
    }
    if (char === inString && inString !== '`') {
      inString = null
      pos++
      continue
    }

    // Handle template string
    if (char === '`' && !inString) {
      inString = '`'
      pos++
      continue
    }
    if (char === '`' && inString === '`' && inTemplateExpr === 0) {
      inString = null
      pos++
      continue
    }

    // Handle template expression ${
    if (inString === '`' && char === '$' && source[pos + 1] === '{') {
      inTemplateExpr++
      pos += 2
      continue
    }

    // Handle nested braces in template expressions
    if (inTemplateExpr > 0) {
      if (char === '{') {
        inTemplateExpr++
      }
      else if (char === '}') {
        inTemplateExpr--
      }
      pos++
      continue
    }

    // Skip if in string
    if (inString) {
      pos++
      continue
    }

    // Track delimiters
    if (char === '(') {
      depth.paren++
    }
    else if (char === ')') {
      depth.paren--
    }
    else if (char === '[') {
      depth.bracket++
    }
    else if (char === ']') {
      depth.bracket--
    }
    else if (char === '{') {
      depth.brace++
    }
    else if (char === '}') {
      depth.brace--
    }

    // Check for closing delimiter when balanced
    if (depth.paren === 0 && depth.bracket === 0 && depth.brace <= 0) {
      if (source.slice(pos, pos + closeDelim.length) === closeDelim) {
        return pos
      }
    }

    pos++
  }

  return -1
}

// =============================================================================
// Filter Parsing
// =============================================================================

export interface FilterCall {
  name: string
  args: string[]
}

export interface ParsedExpression {
  baseExpression: string
  filters: FilterCall[]
}

/**
 * Parse an expression with optional filter chain
 * e.g., "value | uppercase | truncate(10)" -> { baseExpression: "value", filters: [...] }
 */
export function parseExpressionWithFilters(expression: string): ParsedExpression {
  const parts = splitByPipe(expression)

  if (parts.length === 0) {
    return { baseExpression: '', filters: [] }
  }

  const baseExpression = parts[0]
  const filters: FilterCall[] = []

  for (let i = 1; i < parts.length; i++) {
    const filter = parseFilter(parts[i])
    if (filter) {
      filters.push(filter)
    }
  }

  return { baseExpression, filters }
}

/**
 * Parse a single filter expression
 * e.g., "truncate(10, '...')" -> { name: "truncate", args: ["10", "'...'"]}
 */
function parseFilter(filterExpr: string): FilterCall | null {
  const trimmed = filterExpr.trim()
  if (!trimmed)
    return null

  // Check for filter with arguments
  const parenIndex = trimmed.indexOf('(')
  if (parenIndex === -1) {
    // Simple filter without arguments
    return { name: trimmed, args: [] }
  }

  const name = trimmed.slice(0, parenIndex).trim()
  const argsStart = parenIndex + 1
  const argsEnd = findMatchingDelimiter(trimmed, '(', ')', parenIndex)

  if (argsEnd === -1) {
    // Malformed filter, return as-is
    return { name, args: [] }
  }

  const argsString = trimmed.slice(argsStart, argsEnd)
  const args = parseArguments(argsString)

  return { name, args }
}

/**
 * Parse comma-separated arguments, respecting nesting
 */
export function parseArguments(argsString: string): string[] {
  const args: string[] = []
  let current = ''
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let inString: string | null = null
  let inTemplateExpr = 0

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i]
    const prevChar = i > 0 ? argsString[i - 1] : ''

    // Handle escape sequences
    if (prevChar === '\\' && inString) {
      current += char
      continue
    }

    // Handle string entry/exit
    if ((char === '"' || char === '\'') && !inString) {
      inString = char
      current += char
      continue
    }
    if (char === inString && inString !== '`') {
      inString = null
      current += char
      continue
    }

    // Handle template string
    if (char === '`' && !inString) {
      inString = '`'
      current += char
      continue
    }
    if (char === '`' && inString === '`' && inTemplateExpr === 0) {
      inString = null
      current += char
      continue
    }

    // Handle template expression
    if (inString === '`' && char === '$' && argsString[i + 1] === '{') {
      inTemplateExpr++
      current += char
      continue
    }
    if (inTemplateExpr > 0 && char === '{') {
      inTemplateExpr++
      current += char
      continue
    }
    if (inTemplateExpr > 0 && char === '}') {
      inTemplateExpr--
      current += char
      continue
    }

    // Skip if in string
    if (inString) {
      current += char
      continue
    }

    // Track delimiters
    if (char === '(') {
      depth.paren++
    }
    else if (char === ')') {
      depth.paren--
    }
    else if (char === '[') {
      depth.bracket++
    }
    else if (char === ']') {
      depth.bracket--
    }
    else if (char === '{') {
      depth.brace++
    }
    else if (char === '}') {
      depth.brace--
    }

    // Check for comma at top level
    if (char === ',' && depth.paren === 0 && depth.bracket === 0 && depth.brace === 0) {
      args.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

// =============================================================================
// Directive Parameter Parsing
// =============================================================================

/**
 * Extract directive parameters from parentheses
 * e.g., "@foreach($items as $item)" -> "$items as $item"
 */
export function extractDirectiveParams(source: string, directiveEnd: number): {
  params: string
  endPos: number
} | null {
  // Skip whitespace
  let pos = directiveEnd
  while (pos < source.length && /\s/.test(source[pos])) {
    pos++
  }

  if (source[pos] !== '(') {
    return null
  }

  const closePos = findMatchingDelimiter(source, '(', ')', pos)
  if (closePos === -1) {
    return null
  }

  return {
    params: source.slice(pos + 1, closePos),
    endPos: closePos + 1,
  }
}

// =============================================================================
// Script Parsing Utilities
// =============================================================================

export interface ScriptDeclaration {
  type: 'variable' | 'function'
  name: string
  value: string
  exported: boolean
  start: number
  end: number
}

/**
 * Parse script content and extract declarations
 */
export function parseScriptDeclarations(scriptContent: string): ScriptDeclaration[] {
  const declarations: ScriptDeclaration[] = []
  const tokenizer = new Tokenizer(scriptContent)
  const tokens = tokenizer.tokenize().filter(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT')

  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]

    // Check for export keyword
    let exported = false
    if (token.type === 'IDENTIFIER' && token.value === 'export') {
      exported = true
      i++
      if (i >= tokens.length)
        break
    }

    const current = tokens[i]

    // Variable declaration: const/let/var
    if (current.type === 'IDENTIFIER' && (current.value === 'const' || current.value === 'let' || current.value === 'var')) {
      const declType = current.value
      i++

      // Get variable name or destructuring pattern
      if (i >= tokens.length)
        break
      const nameToken = tokens[i]

      if (nameToken.type === 'IDENTIFIER') {
        // Simple variable name
        const name = nameToken.value
        i++

        // Skip = operator
        if (i < tokens.length && tokens[i].type === 'OPERATOR' && tokens[i].value === '=') {
          i++

          // Extract value until end of statement
          const valueStart = i < tokens.length ? tokens[i].start : scriptContent.length
          const valueResult = extractValueFromTokens(tokens, i, scriptContent)
          i = valueResult.nextIndex

          declarations.push({
            type: 'variable',
            name,
            value: scriptContent.slice(valueStart, valueResult.endPos),
            exported,
            start: current.start,
            end: valueResult.endPos,
          })
        }
      }
      else if (nameToken.type === 'PUNCTUATION' && (nameToken.value === '{' || nameToken.value === '[')) {
        // Destructuring pattern
        const patternStart = nameToken.start
        const closeChar = nameToken.value === '{' ? '}' : ']'
        const closePos = findMatchingDelimiter(scriptContent, nameToken.value, closeChar, patternStart)

        if (closePos !== -1) {
          const pattern = scriptContent.slice(patternStart, closePos + 1)
          i = findTokenIndexAtPosition(tokens, closePos + 1)

          // Skip = operator
          if (i < tokens.length && tokens[i].type === 'OPERATOR' && tokens[i].value === '=') {
            i++

            // Extract value
            const valueStart = i < tokens.length ? tokens[i].start : scriptContent.length
            const valueResult = extractValueFromTokens(tokens, i, scriptContent)
            i = valueResult.nextIndex

            // Create a unique name for the destructured value
            const uniqueName = `__stx_destructured_${declarations.length}`
            declarations.push({
              type: 'variable',
              name: uniqueName,
              value: `${scriptContent.slice(valueStart, valueResult.endPos)}; ${declType} ${pattern} = ${uniqueName}`,
              exported,
              start: current.start,
              end: valueResult.endPos,
            })
          }
        }
      }
    }
    // Function declaration
    else if (current.type === 'IDENTIFIER' && current.value === 'function') {
      const funcStart = exported ? tokens[i - 1].start : current.start
      i++

      if (i >= tokens.length)
        break
      const nameToken = tokens[i]

      if (nameToken.type === 'IDENTIFIER') {
        const name = nameToken.value
        i++

        // Find function body
        let bodyStart = -1
        while (i < tokens.length) {
          if (tokens[i].type === 'PUNCTUATION' && tokens[i].value === '{') {
            bodyStart = tokens[i].start
            break
          }
          i++
        }

        if (bodyStart !== -1) {
          const bodyEnd = findMatchingDelimiter(scriptContent, '{', '}', bodyStart)
          if (bodyEnd !== -1) {
            declarations.push({
              type: 'function',
              name,
              value: scriptContent.slice(funcStart, bodyEnd + 1).replace(/^export\s+/, ''),
              exported,
              start: funcStart,
              end: bodyEnd + 1,
            })
            i = findTokenIndexAtPosition(tokens, bodyEnd + 1)
          }
        }
      }
    }
    else {
      i++
    }
  }

  return declarations
}

/**
 * Extract value from token stream until end of statement
 */
function extractValueFromTokens(tokens: Array<{ type: string, value: string, start: number, end: number }>, startIndex: number, source: string): {
  nextIndex: number
  endPos: number
} {
  let i = startIndex
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let endPos = startIndex < tokens.length ? tokens[startIndex].start : source.length

  while (i < tokens.length) {
    const token = tokens[i]

    // Track nesting
    if (token.type === 'PUNCTUATION') {
      if (token.value === '(')
        depth.paren++
      else if (token.value === ')')
        depth.paren--
      else if (token.value === '[')
        depth.bracket++
      else if (token.value === ']')
        depth.bracket--
      else if (token.value === '{')
        depth.brace++
      else if (token.value === '}')
        depth.brace--

      // Check for statement end
      if (token.value === ';' && depth.paren === 0 && depth.bracket === 0 && depth.brace === 0) {
        endPos = token.start
        i++
        break
      }
    }

    // Check for implicit statement end (newline followed by new declaration)
    if (token.type === 'IDENTIFIER' && (token.value === 'const' || token.value === 'let' || token.value === 'var' || token.value === 'function' || token.value === 'export')) {
      if (depth.paren === 0 && depth.bracket === 0 && depth.brace === 0) {
        endPos = tokens[i - 1]?.end ?? token.start
        break
      }
    }

    endPos = token.end
    i++
  }

  return { nextIndex: i, endPos }
}

/**
 * Find token index at or after a position
 */
function findTokenIndexAtPosition(tokens: Array<{ start: number }>, position: number): number {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].start >= position) {
      return i
    }
  }
  return tokens.length
}

// Re-export tokenizer utilities
export { extractBalancedExpression, findMatchingDelimiter, splitByPipe, Tokenizer }
