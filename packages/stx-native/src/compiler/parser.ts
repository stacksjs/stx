/**
 * STX Template Parser
 *
 * Parses STX template syntax and transforms it to STX IR (Intermediate Representation).
 * This enables .stx files to be compiled to native UI across iOS, Android, and Web.
 *
 * STX Template Syntax:
 * ```stx
 * <script>
 *   let count = 0
 *   function increment() { count++ }
 * </script>
 *
 * <template>
 *   <View class="flex-1 bg-gray-900 p-4">
 *     <Text class="text-white text-lg">{count}</Text>
 *     <Button onPress={increment}>Increment</Button>
 *   </View>
 * </template>
 * ```
 */

import type { STXNode, STXDocument, STXStyle, STXComponentType } from './ir'
import { createNode, createDocument } from './ir'
import { compileHeadwindToStyle } from './headwind-to-style'

// ============================================================================
// Tokenizer Types
// ============================================================================

type TokenType =
  | 'TAG_OPEN'        // <View
  | 'TAG_CLOSE'       // </View>
  | 'TAG_SELF_CLOSE'  // />
  | 'TAG_END'         // >
  | 'ATTRIBUTE'       // class="..."
  | 'TEXT'            // Plain text content
  | 'EXPRESSION'      // {variable}
  | 'SCRIPT_BLOCK'    // <script>...</script>
  | 'STYLE_BLOCK'     // <style>...</style>
  | 'COMMENT'         // <!-- ... -->
  | 'EOF'

interface Token {
  type: TokenType
  value: string
  raw?: string
  line: number
  column: number
}

// ============================================================================
// Lexer
// ============================================================================

class Lexer {
  private input: string
  private pos = 0
  private line = 1
  private column = 1

  constructor(input: string) {
    this.input = input
  }

  tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.pos < this.input.length) {
      const token = this.nextToken()
      if (token) {
        tokens.push(token)
      }
    }

    tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column })
    return tokens
  }

  private nextToken(): Token | null {
    this.skipWhitespace()

    if (this.pos >= this.input.length) return null

    const startLine = this.line
    const startColumn = this.column

    // Comment: <!-- ... -->
    if (this.match('<!--')) {
      const endIndex = this.input.indexOf('-->', this.pos)
      if (endIndex === -1) throw new Error(`Unclosed comment at line ${startLine}`)
      const value = this.input.slice(this.pos, endIndex)
      this.advance(endIndex - this.pos + 3)
      return { type: 'COMMENT', value, line: startLine, column: startColumn }
    }

    // Script block: <script>...</script>
    if (this.match('<script')) {
      const closeTag = '</script>'
      const contentStart = this.input.indexOf('>', this.pos) + 1
      const contentEnd = this.input.indexOf(closeTag, contentStart)
      if (contentEnd === -1) throw new Error(`Unclosed <script> block at line ${startLine}`)

      const value = this.input.slice(contentStart, contentEnd).trim()
      this.advance(contentEnd - this.pos + closeTag.length)
      return { type: 'SCRIPT_BLOCK', value, line: startLine, column: startColumn }
    }

    // Style block: <style>...</style>
    if (this.match('<style')) {
      const closeTag = '</style>'
      const contentStart = this.input.indexOf('>', this.pos) + 1
      const contentEnd = this.input.indexOf(closeTag, contentStart)
      if (contentEnd === -1) throw new Error(`Unclosed <style> block at line ${startLine}`)

      const value = this.input.slice(contentStart, contentEnd).trim()
      this.advance(contentEnd - this.pos + closeTag.length)
      return { type: 'STYLE_BLOCK', value, line: startLine, column: startColumn }
    }

    // Template block markers (skip, parse contents)
    if (this.match('<template>')) {
      this.advance(10)
      return null
    }
    if (this.match('</template>')) {
      this.advance(11)
      return null
    }

    // Closing tag: </TagName>
    if (this.match('</')) {
      this.advance(2)
      const tagName = this.readTagName()
      this.skipWhitespace()
      if (this.peek() !== '>') throw new Error(`Expected > at line ${this.line}`)
      this.advance(1)
      return { type: 'TAG_CLOSE', value: tagName, line: startLine, column: startColumn }
    }

    // Opening tag: <TagName
    if (this.peek() === '<') {
      this.advance(1)
      const tagName = this.readTagName()
      return { type: 'TAG_OPEN', value: tagName, line: startLine, column: startColumn }
    }

    // Self-closing tag end: />
    if (this.match('/>')) {
      this.advance(2)
      return { type: 'TAG_SELF_CLOSE', value: '/>', line: startLine, column: startColumn }
    }

    // Tag end: >
    if (this.peek() === '>') {
      this.advance(1)
      return { type: 'TAG_END', value: '>', line: startLine, column: startColumn }
    }

    // Expression: {expression}
    if (this.peek() === '{') {
      this.advance(1)
      let depth = 1
      let value = ''
      while (depth > 0 && this.pos < this.input.length) {
        const char = this.peek()
        if (char === '{') depth++
        else if (char === '}') depth--
        if (depth > 0) value += char
        this.advance(1)
      }
      return { type: 'EXPRESSION', value: value.trim(), line: startLine, column: startColumn }
    }

    // Attribute: name="value" or name={expression}
    if (this.isAlpha(this.peek()) || this.peek() === ':' || this.peek() === '@') {
      const attrName = this.readAttributeName()
      this.skipWhitespace()

      if (this.peek() === '=') {
        this.advance(1)
        this.skipWhitespace()

        let attrValue: string
        let raw: string | undefined

        if (this.peek() === '"') {
          // String attribute: name="value"
          this.advance(1)
          attrValue = ''
          while (this.peek() !== '"' && this.pos < this.input.length) {
            attrValue += this.peek()
            this.advance(1)
          }
          this.advance(1) // Skip closing quote
        } else if (this.peek() === '{') {
          // Expression attribute: name={expression}
          this.advance(1)
          let depth = 1
          attrValue = ''
          while (depth > 0 && this.pos < this.input.length) {
            const char = this.peek()
            if (char === '{') depth++
            else if (char === '}') depth--
            if (depth > 0) attrValue += char
            this.advance(1)
          }
          raw = `{${attrValue}}`
          attrValue = attrValue.trim()
        } else {
          throw new Error(`Expected " or { after = at line ${this.line}`)
        }

        return {
          type: 'ATTRIBUTE',
          value: `${attrName}=${attrValue}`,
          raw,
          line: startLine,
          column: startColumn,
        }
      }

      // Boolean attribute: disabled
      return { type: 'ATTRIBUTE', value: `${attrName}=true`, line: startLine, column: startColumn }
    }

    // Text content
    let text = ''
    while (
      this.pos < this.input.length &&
      this.peek() !== '<' &&
      this.peek() !== '{'
    ) {
      text += this.peek()
      this.advance(1)
    }

    if (text.trim()) {
      return { type: 'TEXT', value: text.trim(), line: startLine, column: startColumn }
    }

    return null
  }

  private match(str: string): boolean {
    return this.input.slice(this.pos, this.pos + str.length) === str
  }

  private peek(): string {
    return this.input[this.pos] || ''
  }

  private advance(n: number): void {
    for (let i = 0; i < n; i++) {
      if (this.input[this.pos] === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
      this.pos++
    }
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.peek())) {
      this.advance(1)
    }
  }

  private readTagName(): string {
    let name = ''
    while (this.pos < this.input.length && /[a-zA-Z0-9_-]/.test(this.peek())) {
      name += this.peek()
      this.advance(1)
    }
    return name
  }

  private readAttributeName(): string {
    let name = ''
    // Allow alphanumeric, dash, colon, @ (for @click style events)
    while (this.pos < this.input.length && /[a-zA-Z0-9_\-:@]/.test(this.peek())) {
      name += this.peek()
      this.advance(1)
    }
    return name
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char)
  }
}

// ============================================================================
// Parser
// ============================================================================

interface ParseContext {
  source: string
  tokens: Token[]
  pos: number
  scriptCode: string
  exports: Record<string, unknown>
  functions: string[]
}

class Parser {
  private ctx: ParseContext

  constructor(tokens: Token[], source: string) {
    this.ctx = {
      source,
      tokens,
      pos: 0,
      scriptCode: '',
      exports: {},
      functions: [],
    }
  }

  parse(): STXDocument {
    // First pass: extract script blocks
    this.extractScriptBlocks()

    // Reset position
    this.ctx.pos = 0

    // Parse template content
    const root = this.parseElement()

    if (!root) {
      throw new Error('No root element found in template')
    }

    return createDocument(
      root,
      {
        exports: this.ctx.exports,
        functions: this.ctx.functions,
        code: this.ctx.scriptCode,
      },
      {
        source: this.ctx.source,
        compiledAt: Date.now(),
      }
    )
  }

  private extractScriptBlocks(): void {
    while (this.ctx.pos < this.ctx.tokens.length) {
      const token = this.peek()
      if (token.type === 'SCRIPT_BLOCK') {
        this.ctx.scriptCode += token.value + '\n'
        this.extractExportsAndFunctions(token.value)
      }
      this.advance()
    }
  }

  private extractExportsAndFunctions(code: string): void {
    // Extract exported variables: let name = value, const name = value
    const varPattern = /(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g
    let match: RegExpExecArray | null
    while ((match = varPattern.exec(code)) !== null) {
      const [, name, value] = match
      try {
        // Try to parse the initial value
        this.ctx.exports[name] = JSON.parse(value.trim())
      } catch {
        // If not JSON parseable, store as string
        this.ctx.exports[name] = value.trim()
      }
    }

    // Extract function names: function name() or const name = () =>
    const funcPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>)/g
    while ((match = funcPattern.exec(code)) !== null) {
      const name = match[1] || match[2]
      if (name && !this.ctx.functions.includes(name)) {
        this.ctx.functions.push(name)
      }
    }

    // Also extract async functions
    const asyncFuncPattern = /async\s+function\s+(\w+)/g
    while ((match = asyncFuncPattern.exec(code)) !== null) {
      const name = match[1]
      if (name && !this.ctx.functions.includes(name)) {
        this.ctx.functions.push(name)
      }
    }
  }

  private parseElement(): STXNode | null {
    this.skipNonElements()

    const token = this.peek()
    if (token.type === 'EOF') return null

    if (token.type !== 'TAG_OPEN') {
      // Check for text or expression at root level
      if (token.type === 'TEXT') {
        this.advance()
        return createNode('Text', {}, {}, {}, [token.value])
      }
      if (token.type === 'EXPRESSION') {
        this.advance()
        return createNode('Text', {}, {}, {}, [`{${token.value}}`])
      }
      return null
    }

    // Consume TAG_OPEN
    const tagName = token.value
    const source = { file: this.ctx.source, line: token.line, column: token.column }
    this.advance()

    // Parse attributes
    const { props, style, events, classes } = this.parseAttributes()

    // Check for self-closing or tag end
    const nextToken = this.peek()
    if (nextToken.type === 'TAG_SELF_CLOSE') {
      this.advance()
      const node = createNode(tagName, props, style, events, [])
      node._classes = classes
      node._source = source
      return node
    }

    if (nextToken.type !== 'TAG_END') {
      throw new Error(`Expected > or /> at line ${nextToken.line}, got ${nextToken.type}`)
    }
    this.advance()

    // Parse children
    const children: (STXNode | string)[] = []
    while (true) {
      this.skipComments()
      const childToken = this.peek()

      if (childToken.type === 'EOF') {
        throw new Error(`Unclosed tag <${tagName}> at line ${token.line}`)
      }

      if (childToken.type === 'TAG_CLOSE') {
        if (childToken.value !== tagName) {
          throw new Error(
            `Mismatched closing tag: expected </${tagName}>, got </${childToken.value}> at line ${childToken.line}`
          )
        }
        this.advance()
        break
      }

      if (childToken.type === 'TEXT') {
        children.push(childToken.value)
        this.advance()
        continue
      }

      if (childToken.type === 'EXPRESSION') {
        // Wrap expression in special syntax for runtime
        children.push(`{${childToken.value}}`)
        this.advance()
        continue
      }

      if (childToken.type === 'TAG_OPEN') {
        const childNode = this.parseElement()
        if (childNode) {
          children.push(childNode)
        }
        continue
      }

      // Skip unknown tokens
      this.advance()
    }

    const node = createNode(tagName, props, style, events, children)
    node._classes = classes
    node._source = source
    return node
  }

  private parseAttributes(): {
    props: Record<string, unknown>
    style: STXStyle
    events: Record<string, string>
    classes: string
  } {
    const props: Record<string, unknown> = {}
    const events: Record<string, string> = {}
    let classes = ''
    let inlineStyle: STXStyle = {}

    while (this.peek().type === 'ATTRIBUTE') {
      const token = this.peek()
      this.advance()

      const [name, ...valueParts] = token.value.split('=')
      const value = valueParts.join('=') // Handle = in values

      // Handle class attribute
      if (name === 'class' || name === 'className') {
        classes = value
        continue
      }

      // Handle style attribute
      if (name === 'style') {
        // Parse inline style object
        try {
          if (value.startsWith('{') && value.endsWith('}')) {
            inlineStyle = JSON.parse(value)
          } else {
            inlineStyle = JSON.parse(`{${value}}`)
          }
        } catch {
          // If not valid JSON, try to parse as CSS-in-JS
          inlineStyle = this.parseCSSInJS(value)
        }
        continue
      }

      // Handle event handlers (onPress, onClick, @click, etc.)
      if (name.startsWith('on') || name.startsWith('@')) {
        const eventName = name.startsWith('@')
          ? 'on' + name.slice(1).charAt(0).toUpperCase() + name.slice(2)
          : name
        events[eventName] = value
        continue
      }

      // Handle key prop
      if (name === 'key') {
        props.key = value
        continue
      }

      // Handle other props
      // Try to parse as JSON for booleans, numbers, etc.
      try {
        props[name] = JSON.parse(value)
      } catch {
        props[name] = value
      }
    }

    // Compile Headwind classes to style object
    const headwindStyle = classes ? compileHeadwindToStyle(classes) : {}

    // Merge headwind style with inline style (inline takes precedence)
    const style = { ...headwindStyle, ...inlineStyle }

    return { props, style, events, classes }
  }

  private parseCSSInJS(value: string): STXStyle {
    const style: STXStyle = {}
    // Simple CSS-in-JS parser: "backgroundColor: 'red', padding: 10"
    const pairs = value.split(',').map(p => p.trim())

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':')
      if (colonIndex === -1) continue

      const key = pair.slice(0, colonIndex).trim()
      let val = pair.slice(colonIndex + 1).trim()

      // Remove quotes
      if ((val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1)
      }

      // Convert to number if possible
      const numVal = Number(val)
      ;(style as Record<string, unknown>)[key] = Number.isNaN(numVal) ? val : numVal
    }

    return style
  }

  private skipNonElements(): void {
    while (
      this.peek().type === 'SCRIPT_BLOCK' ||
      this.peek().type === 'STYLE_BLOCK' ||
      this.peek().type === 'COMMENT'
    ) {
      this.advance()
    }
  }

  private skipComments(): void {
    while (this.peek().type === 'COMMENT') {
      this.advance()
    }
  }

  private peek(): Token {
    return this.ctx.tokens[this.ctx.pos] || { type: 'EOF', value: '', line: 0, column: 0 }
  }

  private advance(): void {
    this.ctx.pos++
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse an STX template string into an STX Document
 */
export function parseSTX(template: string, source = 'unknown.stx'): STXDocument {
  const lexer = new Lexer(template)
  const tokens = lexer.tokenize()
  const parser = new Parser(tokens, source)
  return parser.parse()
}

/**
 * Parse an STX template and return just the root node (for simpler use cases)
 */
export function parseSTXToNode(template: string): STXNode {
  const doc = parseSTX(template)
  return doc.root
}

/**
 * Compile an STX template to JSON IR
 */
export function compileSTX(template: string, source = 'unknown.stx'): string {
  const doc = parseSTX(template, source)
  return JSON.stringify(doc, null, 2)
}

/**
 * Compile multiple STX files and return a map of their IRs
 */
export function compileSTXFiles(
  files: Record<string, string>
): Record<string, STXDocument> {
  const results: Record<string, STXDocument> = {}

  for (const [path, content] of Object.entries(files)) {
    results[path] = parseSTX(content, path)
  }

  return results
}

// ============================================================================
// Native Component Type Mapping
// ============================================================================

/**
 * Map HTML-like tags to native component types
 */
export function mapToNativeComponent(tag: string): STXComponentType | string {
  const mapping: Record<string, STXComponentType> = {
    // Direct mappings
    view: 'View',
    text: 'Text',
    button: 'Button',
    image: 'Image',
    img: 'Image',
    input: 'TextInput',
    textarea: 'TextInput',
    scroll: 'ScrollView',
    scrollview: 'ScrollView',
    list: 'FlatList',
    flatlist: 'FlatList',
    modal: 'Modal',
    switch: 'Switch',
    slider: 'Slider',
    picker: 'Picker',
    select: 'Picker',
    loading: 'ActivityIndicator',
    spinner: 'ActivityIndicator',

    // HTML-like mappings
    div: 'View',
    span: 'Text',
    p: 'Text',
    h1: 'Text',
    h2: 'Text',
    h3: 'Text',
    h4: 'Text',
    h5: 'Text',
    h6: 'Text',
    a: 'TouchableOpacity',
    section: 'View',
    article: 'View',
    header: 'SafeAreaView',
    footer: 'View',
    main: 'View',
    nav: 'View',
    aside: 'View',
    form: 'View',
    label: 'Text',
  }

  return mapping[tag.toLowerCase()] || tag
}

/**
 * Transform a node tree to use native component types
 */
export function transformToNativeComponents(node: STXNode): STXNode {
  const mappedType = mapToNativeComponent(node.type)

  const transformedChildren = node.children.map(child => {
    if (typeof child === 'string') return child
    return transformToNativeComponents(child)
  })

  return {
    ...node,
    type: mappedType,
    children: transformedChildren,
  }
}

// ============================================================================
// Exports
// ============================================================================

export { Lexer, Parser }
export type { Token, TokenType, ParseContext }
