/**
 * Tokenizer for Template Expressions
 *
 * A character-by-character tokenizer that properly handles:
 * - Nested braces, brackets, and parentheses
 * - String literals (single, double, and template)
 * - Escaped characters within strings
 * - Template literal expressions `${...}`
 *
 * @module parser/tokenizer
 */

// =============================================================================
// Token Types
// =============================================================================

export type TokenType =
  | 'STRING' // 'string' or "string"
  | 'TEMPLATE_STRING' // `template ${expr} string`
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'PUNCTUATION' // ( ) [ ] { } , ; :
  | 'WHITESPACE'
  | 'COMMENT'
  | 'EXPRESSION_START' // {{
  | 'EXPRESSION_END' // }}
  | 'RAW_START' // {!!
  | 'RAW_END' // !!}
  | 'DIRECTIVE' // @name
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  start: number
  end: number
  line: number
  column: number
}

export interface TokenizerState {
  pos: number
  line: number
  column: number
}

// =============================================================================
// Tokenizer
// =============================================================================

/**
 * Tokenizer for template expressions
 */
export class Tokenizer {
  private source: string
  private pos: number = 0
  private line: number = 1
  private column: number = 0
  private tokens: Token[] = []

  constructor(source: string) {
    this.source = source
  }

  /**
   * Tokenize the entire source
   */
  tokenize(): Token[] {
    this.tokens = []
    this.pos = 0
    this.line = 1
    this.column = 0

    while (this.pos < this.source.length) {
      const token = this.nextToken()
      if (token) {
        this.tokens.push(token)
      }
    }

    this.tokens.push({
      type: 'EOF',
      value: '',
      start: this.pos,
      end: this.pos,
      line: this.line,
      column: this.column,
    })

    return this.tokens
  }

  /**
   * Get the next token
   */
  private nextToken(): Token | null {
    if (this.pos >= this.source.length) {
      return null
    }

    const start = this.pos
    const startLine = this.line
    const startColumn = this.column
    const char = this.source[this.pos]

    // Whitespace
    if (/\s/.test(char)) {
      return this.readWhitespace(start, startLine, startColumn)
    }

    // Comments
    if (char === '/' && this.peek(1) === '/') {
      return this.readLineComment(start, startLine, startColumn)
    }
    if (char === '/' && this.peek(1) === '*') {
      return this.readBlockComment(start, startLine, startColumn)
    }

    // Strings
    if (char === '"' || char === '\'') {
      return this.readString(char, start, startLine, startColumn)
    }
    if (char === '`') {
      return this.readTemplateString(start, startLine, startColumn)
    }

    // Numbers
    if (/\d/.test(char) || (char === '.' && /\d/.test(this.peek(1) || ''))) {
      return this.readNumber(start, startLine, startColumn)
    }

    // Identifiers and keywords
    if (/[a-z_$]/i.test(char)) {
      return this.readIdentifier(start, startLine, startColumn)
    }

    // Template expression markers
    if (char === '{') {
      if (this.peek(1) === '{' && this.peek(2) === '{') {
        this.advance(3)
        return { type: 'RAW_START', value: '{{{', start, end: this.pos, line: startLine, column: startColumn }
      }
      if (this.peek(1) === '{') {
        this.advance(2)
        return { type: 'EXPRESSION_START', value: '{{', start, end: this.pos, line: startLine, column: startColumn }
      }
      if (this.peek(1) === '!' && this.peek(2) === '!') {
        this.advance(3)
        return { type: 'RAW_START', value: '{!!', start, end: this.pos, line: startLine, column: startColumn }
      }
    }

    if (char === '}') {
      if (this.peek(1) === '}' && this.peek(2) === '}') {
        this.advance(3)
        return { type: 'RAW_END', value: '}}}', start, end: this.pos, line: startLine, column: startColumn }
      }
      if (this.peek(1) === '}') {
        this.advance(2)
        return { type: 'EXPRESSION_END', value: '}}', start, end: this.pos, line: startLine, column: startColumn }
      }
    }

    if (char === '!' && this.peek(1) === '!' && this.peek(2) === '}') {
      this.advance(3)
      return { type: 'RAW_END', value: '!!}', start, end: this.pos, line: startLine, column: startColumn }
    }

    // Directive markers
    if (char === '@' && /[a-z]/i.test(this.peek(1) || '')) {
      return this.readDirective(start, startLine, startColumn)
    }

    // Operators (multi-char first)
    const operators = [
      '===',
      '!==',
      '==',
      '!=',
      '<=',
      '>=',
      '&&',
      '||',
      '??',
      '++',
      '--',
      '+=',
      '-=',
      '*=',
      '/=',
      '%=',
      '**',
      '=>',
      '?.',
      '...',
      '<<',
      '>>',
      '>>>',
      '&=',
      '|=',
      '^=',
    ]
    for (const op of operators) {
      if (this.source.slice(this.pos, this.pos + op.length) === op) {
        this.advance(op.length)
        return { type: 'OPERATOR', value: op, start, end: this.pos, line: startLine, column: startColumn }
      }
    }

    // Single char operators
    if (/[+\-*/%<>=!&|^~?:]/.test(char)) {
      this.advance()
      return { type: 'OPERATOR', value: char, start, end: this.pos, line: startLine, column: startColumn }
    }

    // Punctuation
    if (/[()[\]{},;.]/.test(char)) {
      this.advance()
      return { type: 'PUNCTUATION', value: char, start, end: this.pos, line: startLine, column: startColumn }
    }

    // Unknown character - advance and return as punctuation
    this.advance()
    return { type: 'PUNCTUATION', value: char, start, end: this.pos, line: startLine, column: startColumn }
  }

  private readWhitespace(start: number, startLine: number, startColumn: number): Token {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.advance()
    }
    return {
      type: 'WHITESPACE',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readLineComment(start: number, startLine: number, startColumn: number): Token {
    this.advance(2) // skip //
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.advance()
    }
    return {
      type: 'COMMENT',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readBlockComment(start: number, startLine: number, startColumn: number): Token {
    this.advance(2) // skip /*
    while (this.pos < this.source.length - 1) {
      if (this.source[this.pos] === '*' && this.source[this.pos + 1] === '/') {
        this.advance(2)
        break
      }
      this.advance()
    }
    return {
      type: 'COMMENT',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readString(quote: string, start: number, startLine: number, startColumn: number): Token {
    this.advance() // skip opening quote
    while (this.pos < this.source.length) {
      const char = this.source[this.pos]
      if (char === '\\') {
        this.advance(2) // skip escaped character
        continue
      }
      if (char === quote) {
        this.advance() // skip closing quote
        break
      }
      this.advance()
    }
    return {
      type: 'STRING',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readTemplateString(start: number, startLine: number, startColumn: number): Token {
    this.advance() // skip opening backtick
    let depth = 0

    while (this.pos < this.source.length) {
      const char = this.source[this.pos]

      if (char === '\\') {
        this.advance(2) // skip escaped character
        continue
      }

      // Handle nested template expressions ${...}
      if (char === '$' && this.peek(1) === '{') {
        this.advance(2)
        depth++
        continue
      }

      if (char === '{' && depth > 0) {
        depth++
        this.advance()
        continue
      }

      if (char === '}' && depth > 0) {
        depth--
        this.advance()
        continue
      }

      if (char === '`' && depth === 0) {
        this.advance() // skip closing backtick
        break
      }

      this.advance()
    }

    return {
      type: 'TEMPLATE_STRING',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readNumber(start: number, startLine: number, startColumn: number): Token {
    // Handle hex, octal, binary
    if (this.source[this.pos] === '0') {
      const next = this.peek(1)?.toLowerCase()
      if (next === 'x' || next === 'o' || next === 'b') {
        this.advance(2)
        while (this.pos < this.source.length && /[\da-f_]/i.test(this.source[this.pos])) {
          this.advance()
        }
        return {
          type: 'NUMBER',
          value: this.source.slice(start, this.pos),
          start,
          end: this.pos,
          line: startLine,
          column: startColumn,
        }
      }
    }

    // Regular number (including decimals and exponents)
    while (this.pos < this.source.length && /[\d_]/.test(this.source[this.pos])) {
      this.advance()
    }

    // Decimal part
    if (this.source[this.pos] === '.' && /\d/.test(this.peek(1) || '')) {
      this.advance()
      while (this.pos < this.source.length && /[\d_]/.test(this.source[this.pos])) {
        this.advance()
      }
    }

    // Exponent part
    if (/e/i.test(this.source[this.pos] || '')) {
      this.advance()
      if (/[+-]/.test(this.source[this.pos] || '')) {
        this.advance()
      }
      while (this.pos < this.source.length && /[\d_]/.test(this.source[this.pos])) {
        this.advance()
      }
    }

    // BigInt suffix
    if (this.source[this.pos] === 'n') {
      this.advance()
    }

    return {
      type: 'NUMBER',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readIdentifier(start: number, startLine: number, startColumn: number): Token {
    while (this.pos < this.source.length && /[\w$]/.test(this.source[this.pos])) {
      this.advance()
    }
    return {
      type: 'IDENTIFIER',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private readDirective(start: number, startLine: number, startColumn: number): Token {
    this.advance() // skip @
    while (this.pos < this.source.length && /[a-z]/i.test(this.source[this.pos])) {
      this.advance()
    }
    return {
      type: 'DIRECTIVE',
      value: this.source.slice(start, this.pos),
      start,
      end: this.pos,
      line: startLine,
      column: startColumn,
    }
  }

  private advance(count: number = 1): void {
    for (let i = 0; i < count && this.pos < this.source.length; i++) {
      if (this.source[this.pos] === '\n') {
        this.line++
        this.column = 0
      }
      else {
        this.column++
      }
      this.pos++
    }
  }

  private peek(offset: number): string | undefined {
    return this.source[this.pos + offset]
  }

  /**
   * Save current state for backtracking
   */
  saveState(): TokenizerState {
    return { pos: this.pos, line: this.line, column: this.column }
  }

  /**
   * Restore state for backtracking
   */
  restoreState(state: TokenizerState): void {
    this.pos = state.pos
    this.line = state.line
    this.column = state.column
  }
}

// =============================================================================
// Expression Parser Utilities
// =============================================================================

/**
 * Find matching closing delimiter, respecting nesting and strings
 */
export function findMatchingDelimiter(
  source: string,
  openChar: string,
  closeChar: string,
  startPos: number = 0,
): number {
  let depth = 0
  let pos = startPos
  let inString: string | null = null
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
    if ((char === '"' || char === '\'' || char === '`') && !inString) {
      inString = char
      pos++
      continue
    }
    if (char === inString && inString !== '`') {
      inString = null
      pos++
      continue
    }

    // Handle template string expression ${
    if (inString === '`' && char === '$' && source[pos + 1] === '{') {
      inTemplateExpr++
      pos += 2
      continue
    }

    // Handle template expression closing }
    if (inTemplateExpr > 0 && char === '}') {
      inTemplateExpr--
      if (inTemplateExpr === 0 && inString === '`') {
        // Back in template string
      }
      pos++
      continue
    }

    // Handle template string end
    if (char === '`' && inString === '`' && inTemplateExpr === 0) {
      inString = null
      pos++
      continue
    }

    // Skip if in string
    if (inString) {
      pos++
      continue
    }

    // Track depth
    if (char === openChar) {
      depth++
    }
    else if (char === closeChar) {
      depth--
      if (depth === 0) {
        return pos
      }
    }

    pos++
  }

  return -1 // Not found
}

/**
 * Extract a balanced expression from source starting at position
 */
export function extractBalancedExpression(source: string, startPos: number): {
  expression: string
  endPos: number
} {
  let pos = startPos
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let inString: string | null = null
  let inTemplateExpr = 0

  while (pos < source.length) {
    const char = source[pos]
    const prevChar = pos > 0 ? source[pos - 1] : ''

    // Handle escape sequences in strings
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

    // Check for expression ending markers BEFORE tracking delimiters
    if (depth.paren === 0 && depth.bracket === 0 && depth.brace === 0) {
      // Expression ending markers (must check before counting braces)
      if (source.slice(pos, pos + 2) === '}}' || source.slice(pos, pos + 3) === '!!}') {
        break
      }
      // Common statement terminators
      if (char === ',' || char === ';') {
        break
      }
    }

    // Track delimiters
    if (char === '(') {
      depth.paren++
    }
    else if (char === ')') {
      depth.paren--
      // Stop if this closes something we didn't open
      if (depth.paren < 0) {
        break
      }
    }
    else if (char === '[') {
      depth.bracket++
    }
    else if (char === ']') {
      depth.bracket--
      // Stop if this closes something we didn't open
      if (depth.bracket < 0) {
        break
      }
    }
    else if (char === '{') {
      depth.brace++
    }
    else if (char === '}') {
      depth.brace--
      // Stop if this closes something we didn't open
      if (depth.brace < 0) {
        break
      }
    }

    pos++
  }

  return {
    expression: source.slice(startPos, pos),
    endPos: pos,
  }
}

/**
 * Split expression by pipe (|) for filters, respecting nesting
 */
export function splitByPipe(expression: string): string[] {
  const parts: string[] = []
  let current = ''
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let inString: string | null = null
  let inTemplateExpr = 0

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]
    const prevChar = i > 0 ? expression[i - 1] : ''

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

    // Handle template expression ${
    if (inString === '`' && char === '$' && expression[i + 1] === '{') {
      inTemplateExpr++
      current += char + expression[i + 1] // Add both $ and {
      i++ // Skip the {
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

    // Skip if in string (includes template string outside of expressions)
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

    // Check for pipe when balanced and not || (logical OR)
    if (
      char === '|'
      && expression[i + 1] !== '|'
      && (i === 0 || expression[i - 1] !== '|')
      && depth.paren === 0
      && depth.bracket === 0
      && depth.brace === 0
    ) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}
