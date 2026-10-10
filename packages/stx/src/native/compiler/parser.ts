/* eslint-disable style/max-statements-per-line */
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

import type { STXNode, STXDocument, STXStyle, STXDirectives } from './ir'
import { createNode, createDocument } from './ir'
import { compileClassStyles } from './headwind-to-style'
import { iconClassIn, resolveIconName } from './icons'
export { mapToNativeComponent, transformToNativeComponents } from './component-mapping'

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
  private inTag = false
  /** `<template>` wrappers are skipped; `<template :if>` fragments are kept. */
  private templates: boolean[] = []

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
    if (this.inTag) this.skipWhitespace()

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
      const attributes = this.input.slice(this.pos + 7, contentStart - 1)
      this.advance(contentEnd - this.pos + closeTag.length)
      // `<script server>` runs on a web server; a native screen has none.
      if (/\bserver\b/.test(attributes)) return null
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

    // Template block markers (skip, parse contents). A template with
    // attributes is a fragment (`<template :if="ready">`) and stays a tag.
    if (this.match('<template>')) {
      this.templates.push(false)
      this.advance(10)
      return null
    }
    if (this.match('<template')) {
      this.templates.push(true)
    }
    if (this.match('</template>') && this.templates.pop() !== true) {
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
      this.inTag = false
      return { type: 'TAG_CLOSE', value: tagName, line: startLine, column: startColumn }
    }

    // Opening tag: <TagName
    if (this.peek() === '<') {
      this.advance(1)
      const tagName = this.readTagName()
      this.inTag = true
      return { type: 'TAG_OPEN', value: tagName, line: startLine, column: startColumn }
    }

    // Self-closing tag end: />
    if (this.match('/>')) {
      this.advance(2)
      this.inTag = false
      return { type: 'TAG_SELF_CLOSE', value: '/>', line: startLine, column: startColumn }
    }

    // Tag end: >
    if (this.peek() === '>') {
      this.advance(1)
      this.inTag = false
      return { type: 'TAG_END', value: '>', line: startLine, column: startColumn }
    }

    // Expression: {{ expression }}, as stx and Vue write it in text.
    if (!this.inTag && this.match('{{')) {
      const end = this.input.indexOf('}}', this.pos + 2)
      if (end !== -1) {
        const value = this.input.slice(this.pos + 2, end)
        this.advance(end - this.pos + 2)
        return { type: 'EXPRESSION', value: value.trim(), line: startLine, column: startColumn }
      }
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
    if (this.inTag && (this.isAlpha(this.peek()) || this.peek() === ':' || this.peek() === '@')) {
      const attrName = this.readAttributeName()
      this.skipWhitespace()

      if (this.peek() === '=') {
        this.advance(1)
        this.skipWhitespace()

        let attrValue: string
        let raw: string | undefined

        if (this.peek() === '"' || this.peek() === '\'') {
          // String attribute: name="value" or name='value'
          const quote = this.peek()
          this.advance(1)
          attrValue = ''
          while (this.peek() !== quote && this.pos < this.input.length) {
            attrValue += this.peek()
            this.advance(1)
          }
          this.advance(1) // Skip closing quote
        }
else if (this.peek() === '{') {
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
        }
else {
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

    // A space between two expressions on one line (`{a} {b}`) is text too.
    if (text.trim() || (text && !text.includes('\n'))) {
      return { type: 'TEXT', value: text, line: startLine, column: startColumn }
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
      }
else {
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
  warnings: string[]
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
      warnings: [],
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

    const document = createDocument(
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
    if (this.ctx.warnings.length) document.meta.warnings = [...new Set(this.ctx.warnings)]
    return document
  }

  private extractScriptBlocks(): void {
    while (this.ctx.pos < this.ctx.tokens.length) {
      const token = this.peek()
      if (token.type === 'SCRIPT_BLOCK') {
        this.ctx.scriptCode += `${token.value}\n`
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
      }
catch {
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
    const attributes = this.parseAttributes(tagName, token.line)
    const { props, style, events } = attributes

    // Check for self-closing or tag end
    const nextToken = this.peek()
    if (nextToken.type === 'TAG_SELF_CLOSE') {
      this.advance()
      const node = createNode(tagName, props, style, events, [])
      this.finishNode(node, attributes, source)
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
    this.finishNode(node, attributes, source)
    return node
  }

  private finishNode(node: STXNode, attributes: ParsedAttributes, source: STXNode['_source']): void {
    if (typeof node.props.__text === 'string') {
      node.children = [`{${node.props.__text}}`]
      delete node.props.__text
    }
    normalizeWhitespace(node)
    if (attributes.classes) node._classes = attributes.classes
    node._source = source
    if (attributes.darkStyle) node.darkStyle = attributes.darkStyle
    if (Object.keys(attributes.directives).length) node.directives = attributes.directives
    if (Object.keys(attributes.bindings).length) node.bindings = attributes.bindings
    if (attributes.numberOfLines !== undefined && node.props.numberOfLines === undefined)
      node.props.numberOfLines = attributes.numberOfLines
    if (node.type === 'Icon') this.finishIcon(node, attributes.icon)
  }

  /**
   * `<Icon>`: a symbol, an Iconify name, or an Iconify class, all ending as
   * an SF Symbol name in `props.symbol`. Expressions are left for the runtime,
   * which maps them with the same table.
   */
  private finishIcon(node: STXNode, iconClass: string | undefined): void {
    const props = node.props
    const isExpression = (value: unknown) => typeof value === 'string' && /\{[^}]*\}/.test(value)
    if (props.size !== undefined) {
      const size = Number(props.size)
      if (Number.isFinite(size)) {
        node.style.width ??= size
        node.style.height ??= size
        delete props.size
      }
    }
    node.children = []
    if (props.symbol !== undefined) {
      delete props.name
      return
    }
    const name = props.name ?? props.icon ?? iconClass
    delete props.icon
    if (name === undefined) {
      if (!node.bindings?.class)
        this.ctx.warnings.push(`<Icon> without symbol, name or an i-* class in ${this.ctx.source}; drawn as circle`)
      return
    }
    if (isExpression(name)) {
      props.name = name
      return
    }
    delete props.name
    const icon = resolveIconName(String(name))
    props.symbol = icon.symbol
    if (icon.iconify) props.iconify = icon.iconify
    if (!icon.known)
      this.ctx.warnings.push(`Unknown icon ${name} in ${this.ctx.source}; drawn as ${icon.symbol}`)
  }

  private parseAttributes(tagName: string, line: number): ParsedAttributes {
    const props: Record<string, unknown> = {}
    const events: Record<string, string> = {}
    const directives: STXDirectives = {}
    const bindings: Record<string, string> = {}
    let classes = ''
    let inlineStyle: STXStyle = {}

    while (this.peek().type === 'ATTRIBUTE') {
      const token = this.peek()
      this.advance()

      const [rawName, ...valueParts] = token.value.split('=')
      const value = valueParts.join('=') // Handle = in values
      // `x-bind:foo` and `:foo` are one binding; `x-on:click` and `@click` one event.
      const name = rawName.startsWith('x-bind:') ? `:${rawName.slice(7)}` : rawName.startsWith('x-on:') ? `@${rawName.slice(5)}` : rawName
      const bound = name.startsWith(':') || (name.startsWith('x-') && name !== 'x-cloak')
      const binding = bound ? (name.startsWith(':') ? name.slice(1) : name.slice(2)) : ''
      const boolean = !token.raw && value === 'true' && !token.value.endsWith('="true"')

      // Structural directives: `:if`, `:else-if`, `:else`, `:for`, `:show`.
      if (bound && binding === 'if') { directives.if = value; continue }
      if (bound && (binding === 'else-if' || binding === 'elseif')) { directives.elseIf = value; continue }
      if (bound && binding === 'else') { directives.else = true; continue }
      if (bound && binding === 'show') { directives.show = value; continue }
      if (bound && binding === 'for') {
        const loop = parseForExpression(value)
        if (!loop) throw new Error(`Cannot read :for="${value}" at line ${line}: expected "item in items" or "(item, index) in items"`)
        directives.for = loop
        continue
      }
      if (bound && binding === 'key') { props.key = `{${value}}`; continue }
      if (bound && binding === 'text') { props.__text = value; continue }
      if (name === 'x-cloak' || name === 'x-data') continue

      // Handle class attribute
      if (name === 'class' || name === 'className' || (bound && (binding === 'class' || binding === 'className'))) {
        if (bound || token.raw) bindings.class = value
        else classes = classes ? `${classes} ${value}` : value
        continue
      }

      // Handle style attribute
      if (name === 'style' || (bound && binding === 'style')) {
        if (bound) {
          bindings.style = value
          continue
        }
        if (token.raw) {
          try {
            inlineStyle = { ...inlineStyle, ...JSON.parse(value) }
          }
          catch {
            // `style={{ flex: 1 }}` and `style={tone}` are code: the runtime
            // evaluates them in the screen's scope.
            bindings.style = value
          }
          continue
        }
        // Parse inline style object
        try {
          if (value.startsWith('{') && value.endsWith('}')) {
            inlineStyle = { ...inlineStyle, ...JSON.parse(value) }
          }
          else {
            inlineStyle = { ...inlineStyle, ...JSON.parse(`{${value}}`) }
          }
        }
        catch {
          // If not valid JSON, try to parse as CSS-in-JS
          inlineStyle = { ...inlineStyle, ...this.parseCSSInJS(value) }
        }
        continue
      }

      // Handle event handlers (onPress, onClick, @click, etc.). The value is
      // code: a function (`onPress={refresh}`), a call with arguments
      // (`onPress={open(item.id)}`, `@click="select(day)"`), an arrow, or a
      // statement (`@click="count++"`).
      if ((/^on[A-Z]/.test(name) && !NOT_EVENTS.has(name)) || name.startsWith('@')) {
        const eventName = name.startsWith('@') ? nativeEventName(name.slice(1)) : name
        if (!boolean) events[eventName] = value
        continue
      }

      // Handle key prop
      if (name === 'key') {
        props.key = token.raw ?? value
        continue
      }

      // `:prop="expr"` is `prop={expr}`.
      if (bound) {
        props[binding] = `{${value}}`
        continue
      }

      // Handle other props
      // Try to parse as JSON for booleans, numbers, etc.
      if (token.raw) {
        // JSON literals inside expression braces are already fully typed.
        // Preserve braces only for code that needs the native screen scope.
        try {
          props[name] = JSON.parse(value)
        }
        catch {
          props[name] = token.raw
        }
        continue
      }
      try {
        props[name] = JSON.parse(value)
      }
      catch {
        props[name] = value
      }
    }

    // Compile Headwind classes to style object, `dark:` kept apart
    const compiled = classes ? compileClassStyles(classes) : null
    if (compiled && compiled.unknown.length)
      this.ctx.warnings.push(`Classes with no native style on <${tagName}> at line ${line}: ${compiled.unknown.join(' ')}`)

    // Merge headwind style with inline style (inline takes precedence)
    const style = { ...(compiled?.style ?? {}), ...inlineStyle }

    return {
      props,
      style,
      events,
      classes,
      directives,
      bindings,
      darkStyle: compiled?.dark,
      numberOfLines: compiled?.numberOfLines,
      icon: compiled?.icon ?? (classes ? iconClassIn(classes) : undefined),
    }
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

/**
 * Text as HTML renders it: runs of whitespace are one space, and the edges of
 * a node's text are trimmed. A container with elements keeps no
 * whitespace-only strings, since those are indentation, not words.
 */
function normalizeWhitespace(node: STXNode): void {
  const hasElements = node.children.some(child => typeof child !== 'string')
  let children = node.children
    .map(child => (typeof child === 'string' && !/^\{[\s\S]*\}$/.test(child) ? child.replace(/\s+/g, ' ') : child))
    .filter(child => !(hasElements && typeof child === 'string' && !child.trim()))
  if (!hasElements && children.length) {
    const first = children[0]
    const last = children[children.length - 1]
    if (typeof first === 'string') children[0] = first.replace(/^\s+/, '')
    if (typeof last === 'string') children[children.length - 1] = (children[children.length - 1] as string).replace(/\s+$/, '')
    children = children.filter(child => child !== '')
  }
  node.children = children
}

interface ParsedAttributes {
  props: Record<string, unknown>
  style: STXStyle
  events: Record<string, string>
  classes: string
  directives: STXDirectives
  bindings: Record<string, string>
  darkStyle?: STXStyle
  numberOfLines?: number
  icon?: string
}

/** Props that start with `on` and are values, not handlers. */
const NOT_EVENTS = new Set(['onEndReachedThreshold'])

/** Web event names as the native renderers dispatch them. */
const NATIVE_EVENT_NAMES: Record<string, string> = {
  click: 'onPress',
  press: 'onPress',
  tap: 'onPress',
  longpress: 'onLongPress',
  contextmenu: 'onLongPress',
  input: 'onChangeText',
  change: 'onChange',
  focus: 'onFocus',
  blur: 'onBlur',
  submit: 'onSubmitEditing',
  scroll: 'onScroll',
  refresh: 'onRefresh',
  close: 'onRequestClose',
  layout: 'onLayout',
}

/** `@click.prevent` to `onPress`; anything unmapped to `onName`. */
function nativeEventName(spelling: string): string {
  const [base] = spelling.split('.')
  return NATIVE_EVENT_NAMES[base.toLowerCase()] ?? `on${base.charAt(0).toUpperCase()}${base.slice(1)}`
}

/**
 * `item in items`, `(item, index) in items`, `item of items`, and stx's
 * `items as item` / `items as index => item`.
 */
export function parseForExpression(value: string): STXDirectives['for'] | null {
  const trimmed = value.trim()
  const inForm = /^\(?\s*([$\w]+)\s*(?:,\s*([$\w]+)\s*)?\)?\s+(?:in|of)\s+([\s\S]+)$/.exec(trimmed)
  if (inForm) return { item: inForm[1], index: inForm[2], source: inForm[3].trim() }
  const asForm = /^([\s\S]+?)\s+as\s+(?:([$\w]+)\s*=>\s*)?([$\w]+)$/.exec(trimmed)
  if (asForm) return { item: asForm[3], index: asForm[2], source: asForm[1].trim() }
  return null
}

/** The `(…)` after a directive, with nested parentheses and strings. */
function balancedParens(source: string, open: number): number {
  let depth = 0
  let quote = ''
  for (let i = open; i < source.length; i++) {
    const char = source[i]
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'' || char === '`') quote = char
    else if (char === '(') depth++
    else if (char === ')' && --depth === 0) return i
  }
  return -1
}

/** A directive's expression as an attribute value the lexer reads back intact. */
function attribute(name: string, expression: string): string {
  return expression.includes('"') ? `${name}={${expression}}` : `${name}="${expression}"`
}

/**
 * stx's text directives as fragments the parser already understands.
 *
 * `@if (a) … @elseif (b) … @else … @endif` becomes sibling
 * `<Fragment :if>`/`:else-if`/`:else` nodes, and `@foreach (items as item) …
 * @endforeach` a `<Fragment :for>`, so the runtime evaluates both on every
 * render like the attribute forms. Script and style blocks are left alone.
 */
export function expandTextDirectives(source: string): string {
  const pattern = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|@(if|elseif|unless|foreach|for)\s*\(|@(else|endif|endunless|endforeach|endfor)\b/g
  let out = ''
  let last = 0
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    if (match[0].startsWith('<')) continue
    // `@click=` and `user@if(` are attributes and words, not directives.
    const before = source[match.index - 1]
    if (before && /[\w@.]/.test(before)) continue
    out += source.slice(last, match.index)
    if (match[1]) {
      const open = match.index + match[0].length - 1
      const close = balancedParens(source, open)
      if (close === -1) throw new Error(`Unclosed @${match[1]}( in template`)
      const expression = source.slice(open + 1, close).trim()
      if (match[1] === 'if') out += `<Fragment ${attribute(':if', expression)}>`
      else if (match[1] === 'unless') out += `<Fragment ${attribute(':if', `!(${expression})`)}>`
      else if (match[1] === 'elseif') out += `</Fragment><Fragment ${attribute(':else-if', expression)}>`
      else {
        const loop = parseForExpression(expression)
        if (!loop) throw new Error(`Cannot read @${match[1]}(${expression})`)
        const head = loop.index ? `(${loop.item}, ${loop.index})` : loop.item
        out += `<Fragment ${attribute(':for', `${head} in ${loop.source}`)}>`
      }
      last = close + 1
      pattern.lastIndex = last
    }
    else {
      out += match[2] === 'else' ? '</Fragment><Fragment :else>' : '</Fragment>'
      last = match.index + match[0].length
    }
  }
  return out + source.slice(last)
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse an STX template string into an STX Document
 */
export function parseSTX(template: string, source = 'unknown.stx'): STXDocument {
  const lexer = new Lexer(expandTextDirectives(template))
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
// Exports
// ============================================================================

export { Lexer, Parser }
export type { Token, TokenType, ParseContext }
