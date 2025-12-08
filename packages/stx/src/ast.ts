/**
 * Abstract Syntax Tree for stx Templates
 *
 * Provides a proper AST representation for parsed templates, enabling
 * better analysis, transformation, and optimization of templates.
 *
 * ## Node Types
 *
 * - **Document**: Root node containing all children
 * - **Text**: Plain text content
 * - **Expression**: `{{ expr }}` or `{!! expr !!}` interpolations
 * - **Directive**: `@directive` with optional body
 * - **Component**: `<ComponentName>` custom components
 * - **Element**: HTML elements with attributes
 * - **Comment**: HTML or stx comments
 * - **Script**: `<script>` blocks
 * - **Style**: `<style>` blocks
 *
 * ## Usage
 *
 * ```typescript
 * const parser = new TemplateParser()
 * const ast = parser.parse(template)
 *
 * // Traverse the AST
 * walkAST(ast, {
 *   enter(node, parent) {
 *     console.log(node.type)
 *   }
 * })
 *
 * // Transform back to string
 * const output = generateCode(ast)
 * ```
 *
 * @module ast
 */

import type { Position } from './source-maps'

// =============================================================================
// Location Types
// =============================================================================

/**
 * Source location in template
 */
export interface SourceLocation {
  /** Start position */
  start: Position
  /** End position */
  end: Position
  /** Source file path */
  source?: string
}

// =============================================================================
// Node Types
// =============================================================================

/**
 * Base interface for all AST nodes
 */
export interface BaseNode {
  /** Node type discriminator */
  type: string
  /** Source location */
  loc?: SourceLocation
  /** Parent node (set during traversal) */
  parent?: ASTNode
}

/**
 * Document root node
 */
export interface DocumentNode extends BaseNode {
  type: 'Document'
  /** Child nodes */
  children: ASTNode[]
}

/**
 * Plain text content
 */
export interface TextNode extends BaseNode {
  type: 'Text'
  /** Text content */
  value: string
}

/**
 * Expression interpolation: {{ expr }} or {!! expr !!}
 */
export interface ExpressionNode extends BaseNode {
  type: 'Expression'
  /** Expression code */
  expression: string
  /** Whether HTML is escaped (true for {{}}, false for {!! !!}) */
  escaped: boolean
  /** Raw source text */
  raw: string
}

/**
 * Directive: @name(params) ... @endname
 */
export interface DirectiveNode extends BaseNode {
  type: 'Directive'
  /** Directive name (without @) */
  name: string
  /** Directive parameters/arguments */
  params: string | null
  /** Body content for block directives */
  body: ASTNode[] | null
  /** Whether it's a self-closing directive */
  selfClosing: boolean
  /** Raw source text */
  raw: string
}

/**
 * Component: <ComponentName attr="value">...</ComponentName>
 */
export interface ComponentNode extends BaseNode {
  type: 'Component'
  /** Component name (PascalCase) */
  name: string
  /** Attributes/props */
  attributes: AttributeNode[]
  /** Child nodes */
  children: ASTNode[]
  /** Whether it's self-closing */
  selfClosing: boolean
}

/**
 * HTML Element: <tag attr="value">...</tag>
 */
export interface ElementNode extends BaseNode {
  type: 'Element'
  /** Tag name */
  tag: string
  /** Attributes */
  attributes: AttributeNode[]
  /** Child nodes */
  children: ASTNode[]
  /** Whether it's self-closing */
  selfClosing: boolean
  /** Whether it's a void element (br, hr, etc.) */
  void: boolean
}

/**
 * Attribute on element or component
 */
export interface AttributeNode extends BaseNode {
  type: 'Attribute'
  /** Attribute name */
  name: string
  /** Attribute value (null for boolean attributes) */
  value: string | ExpressionNode | null
  /** Whether value contains dynamic expression */
  dynamic: boolean
}

/**
 * Comment: <!-- comment --> or {{-- comment --}}
 */
export interface CommentNode extends BaseNode {
  type: 'Comment'
  /** Comment content */
  value: string
  /** Comment style: html or stx */
  style: 'html' | 'stx'
}

/**
 * Script block: <script>...</script>
 */
export interface ScriptNode extends BaseNode {
  type: 'Script'
  /** Script content */
  content: string
  /** Attributes on script tag */
  attributes: AttributeNode[]
}

/**
 * Style block: <style>...</style>
 */
export interface StyleNode extends BaseNode {
  type: 'Style'
  /** Style content */
  content: string
  /** Attributes on style tag */
  attributes: AttributeNode[]
  /** Whether it's scoped */
  scoped: boolean
}

/**
 * Union of all AST node types
 */
export type ASTNode =
  | DocumentNode
  | TextNode
  | ExpressionNode
  | DirectiveNode
  | ComponentNode
  | ElementNode
  | AttributeNode
  | CommentNode
  | ScriptNode
  | StyleNode

// =============================================================================
// Node Guards
// =============================================================================

export function isDocumentNode(node: ASTNode): node is DocumentNode {
  return node.type === 'Document'
}

export function isTextNode(node: ASTNode): node is TextNode {
  return node.type === 'Text'
}

export function isExpressionNode(node: ASTNode): node is ExpressionNode {
  return node.type === 'Expression'
}

export function isDirectiveNode(node: ASTNode): node is DirectiveNode {
  return node.type === 'Directive'
}

export function isComponentNode(node: ASTNode): node is ComponentNode {
  return node.type === 'Component'
}

export function isElementNode(node: ASTNode): node is ElementNode {
  return node.type === 'Element'
}

export function isAttributeNode(node: ASTNode): node is AttributeNode {
  return node.type === 'Attribute'
}

export function isCommentNode(node: ASTNode): node is CommentNode {
  return node.type === 'Comment'
}

export function isScriptNode(node: ASTNode): node is ScriptNode {
  return node.type === 'Script'
}

export function isStyleNode(node: ASTNode): node is StyleNode {
  return node.type === 'Style'
}

// =============================================================================
// Node Creation Helpers
// =============================================================================

/**
 * Create a document node
 */
export function createDocument(children: ASTNode[] = [], loc?: SourceLocation): DocumentNode {
  return { type: 'Document', children, loc }
}

/**
 * Create a text node
 */
export function createText(value: string, loc?: SourceLocation): TextNode {
  return { type: 'Text', value, loc }
}

/**
 * Create an expression node
 */
export function createExpression(
  expression: string,
  escaped: boolean = true,
  loc?: SourceLocation,
): ExpressionNode {
  const raw = escaped ? `{{ ${expression} }}` : `{!! ${expression} !!}`
  return { type: 'Expression', expression, escaped, raw, loc }
}

/**
 * Create a directive node
 */
export function createDirective(
  name: string,
  params: string | null = null,
  body: ASTNode[] | null = null,
  loc?: SourceLocation,
): DirectiveNode {
  const selfClosing = body === null
  let raw = `@${name}`
  if (params) {
    raw += `(${params})`
  }
  return { type: 'Directive', name, params, body, selfClosing, raw, loc }
}

/**
 * Create a component node
 */
export function createComponent(
  name: string,
  attributes: AttributeNode[] = [],
  children: ASTNode[] = [],
  selfClosing: boolean = false,
  loc?: SourceLocation,
): ComponentNode {
  return { type: 'Component', name, attributes, children, selfClosing, loc }
}

/**
 * Create an element node
 */
export function createElement(
  tag: string,
  attributes: AttributeNode[] = [],
  children: ASTNode[] = [],
  loc?: SourceLocation,
): ElementNode {
  const voidElements = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])
  const isVoid = voidElements.has(tag.toLowerCase())
  return {
    type: 'Element',
    tag,
    attributes,
    children: isVoid ? [] : children,
    selfClosing: isVoid || (children.length === 0),
    void: isVoid,
    loc,
  }
}

/**
 * Create an attribute node
 */
export function createAttribute(
  name: string,
  value: string | ExpressionNode | null = null,
  loc?: SourceLocation,
): AttributeNode {
  const dynamic = value !== null && typeof value !== 'string'
  return { type: 'Attribute', name, value, dynamic, loc }
}

/**
 * Create a comment node
 */
export function createComment(
  value: string,
  style: 'html' | 'stx' = 'html',
  loc?: SourceLocation,
): CommentNode {
  return { type: 'Comment', value, style, loc }
}

/**
 * Create a script node
 */
export function createScript(
  content: string,
  attributes: AttributeNode[] = [],
  loc?: SourceLocation,
): ScriptNode {
  return { type: 'Script', content, attributes, loc }
}

/**
 * Create a style node
 */
export function createStyle(
  content: string,
  attributes: AttributeNode[] = [],
  scoped: boolean = false,
  loc?: SourceLocation,
): StyleNode {
  return { type: 'Style', content, attributes, scoped, loc }
}

// =============================================================================
// AST Traversal
// =============================================================================

/**
 * Visitor callbacks for AST traversal
 */
export interface ASTVisitor {
  /** Called when entering a node */
  enter?: (node: ASTNode, parent: ASTNode | null) => void | false
  /** Called when leaving a node */
  leave?: (node: ASTNode, parent: ASTNode | null) => void
  /** Type-specific visitors */
  Document?: { enter?: (node: DocumentNode) => void | false, leave?: (node: DocumentNode) => void }
  Text?: { enter?: (node: TextNode) => void | false, leave?: (node: TextNode) => void }
  Expression?: { enter?: (node: ExpressionNode) => void | false, leave?: (node: ExpressionNode) => void }
  Directive?: { enter?: (node: DirectiveNode) => void | false, leave?: (node: DirectiveNode) => void }
  Component?: { enter?: (node: ComponentNode) => void | false, leave?: (node: ComponentNode) => void }
  Element?: { enter?: (node: ElementNode) => void | false, leave?: (node: ElementNode) => void }
  Attribute?: { enter?: (node: AttributeNode) => void | false, leave?: (node: AttributeNode) => void }
  Comment?: { enter?: (node: CommentNode) => void | false, leave?: (node: CommentNode) => void }
  Script?: { enter?: (node: ScriptNode) => void | false, leave?: (node: ScriptNode) => void }
  Style?: { enter?: (node: StyleNode) => void | false, leave?: (node: StyleNode) => void }
}

/**
 * Walk the AST and call visitor callbacks
 */
export function walkAST(node: ASTNode, visitor: ASTVisitor, parent: ASTNode | null = null): void {
  // Set parent reference
  node.parent = parent ?? undefined

  // Call generic enter
  if (visitor.enter) {
    const result = visitor.enter(node, parent)
    if (result === false) {
      return
    }
  }

  // Call type-specific enter
  const typeVisitor = visitor[node.type as keyof ASTVisitor]
  if (typeVisitor && typeof typeVisitor === 'object' && 'enter' in typeVisitor) {
    const enterFn = typeVisitor.enter as (n: ASTNode) => void | false
    const result = enterFn(node)
    if (result === false) {
      return
    }
  }

  // Visit children
  const children = getChildren(node)
  for (const child of children) {
    walkAST(child, visitor, node)
  }

  // Call type-specific leave
  if (typeVisitor && typeof typeVisitor === 'object' && 'leave' in typeVisitor) {
    const leaveFn = typeVisitor.leave as (n: ASTNode) => void
    leaveFn(node)
  }

  // Call generic leave
  if (visitor.leave) {
    visitor.leave(node, parent)
  }
}

/**
 * Get child nodes of a node
 */
export function getChildren(node: ASTNode): ASTNode[] {
  switch (node.type) {
    case 'Document':
      return node.children
    case 'Directive':
      return node.body || []
    case 'Component':
      return [...node.attributes, ...node.children]
    case 'Element':
      return [...node.attributes, ...node.children]
    case 'Script':
    case 'Style':
      return node.attributes
    default:
      return []
  }
}

// =============================================================================
// AST Transformation
// =============================================================================

/**
 * Clone an AST node deeply
 */
export function cloneNode<T extends ASTNode>(node: T): T {
  const clone = { ...node }

  // Clone children arrays
  if ('children' in clone && Array.isArray(clone.children)) {
    clone.children = clone.children.map(child => cloneNode(child))
  }
  if ('body' in clone && Array.isArray(clone.body)) {
    clone.body = clone.body.map(child => cloneNode(child))
  }
  if ('attributes' in clone && Array.isArray(clone.attributes)) {
    clone.attributes = clone.attributes.map(attr => cloneNode(attr))
  }

  // Remove parent reference in clone
  delete clone.parent

  return clone as T
}

/**
 * Replace a node in the AST
 */
export function replaceNode(
  root: DocumentNode,
  target: ASTNode,
  replacement: ASTNode | ASTNode[],
): void {
  walkAST(root, {
    enter(node) {
      const children = getChildrenArray(node)
      if (children) {
        const index = children.indexOf(target)
        if (index !== -1) {
          const replacements = Array.isArray(replacement) ? replacement : [replacement]
          children.splice(index, 1, ...replacements)
        }
      }
    },
  })
}

/**
 * Remove a node from the AST
 */
export function removeNode(root: DocumentNode, target: ASTNode): void {
  walkAST(root, {
    enter(node) {
      const children = getChildrenArray(node)
      if (children) {
        const index = children.indexOf(target)
        if (index !== -1) {
          children.splice(index, 1)
        }
      }
    },
  })
}

/**
 * Get mutable children array from a node
 */
function getChildrenArray(node: ASTNode): ASTNode[] | null {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children
  }
  if ('body' in node && Array.isArray(node.body)) {
    return node.body
  }
  return null
}

// =============================================================================
// AST Analysis
// =============================================================================

/**
 * Find all nodes matching a predicate
 */
export function findNodes(root: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode[] {
  const results: ASTNode[] = []
  walkAST(root, {
    enter(node) {
      if (predicate(node)) {
        results.push(node)
      }
    },
  })
  return results
}

/**
 * Find all nodes of a specific type
 */
export function findNodesByType<T extends ASTNode['type']>(
  root: ASTNode,
  type: T,
): Extract<ASTNode, { type: T }>[] {
  return findNodes(root, node => node.type === type) as Extract<ASTNode, { type: T }>[]
}

/**
 * Find all directives by name
 */
export function findDirectives(root: ASTNode, name: string): DirectiveNode[] {
  return findNodes(root, node =>
    isDirectiveNode(node) && node.name === name) as DirectiveNode[]
}

/**
 * Find all components by name
 */
export function findComponents(root: ASTNode, name: string): ComponentNode[] {
  return findNodes(root, node =>
    isComponentNode(node) && node.name === name) as ComponentNode[]
}

/**
 * Find all elements by tag name
 */
export function findElements(root: ASTNode, tag: string): ElementNode[] {
  return findNodes(root, node =>
    isElementNode(node) && node.tag.toLowerCase() === tag.toLowerCase()) as ElementNode[]
}

/**
 * Get all expression nodes in the AST
 */
export function getExpressions(root: ASTNode): ExpressionNode[] {
  return findNodesByType(root, 'Expression')
}

/**
 * Get all directive names used in the template
 */
export function getDirectiveNames(root: ASTNode): Set<string> {
  const names = new Set<string>()
  walkAST(root, {
    Directive: {
      enter(node) {
        names.add(node.name)
      },
    },
  })
  return names
}

/**
 * Get all component names used in the template
 */
export function getComponentNames(root: ASTNode): Set<string> {
  const names = new Set<string>()
  walkAST(root, {
    Component: {
      enter(node) {
        names.add(node.name)
      },
    },
  })
  return names
}

// =============================================================================
// Code Generation
// =============================================================================

/**
 * Generate code from AST
 */
export function generateCode(node: ASTNode): string {
  switch (node.type) {
    case 'Document':
      return node.children.map(child => generateCode(child)).join('')

    case 'Text':
      return node.value

    case 'Expression':
      return node.raw

    case 'Directive':
      if (node.selfClosing) {
        return node.raw
      }
      else {
        const bodyCode = node.body?.map(child => generateCode(child)).join('') || ''
        return `${node.raw}${bodyCode}@end${node.name}`
      }

    case 'Component': {
      const attrs = node.attributes.map(attr => generateCode(attr)).join(' ')
      const attrStr = attrs ? ` ${attrs}` : ''
      if (node.selfClosing) {
        return `<${node.name}${attrStr} />`
      }
      else {
        const childrenCode = node.children.map(child => generateCode(child)).join('')
        return `<${node.name}${attrStr}>${childrenCode}</${node.name}>`
      }
    }

    case 'Element': {
      const attrs = node.attributes.map(attr => generateCode(attr)).join(' ')
      const attrStr = attrs ? ` ${attrs}` : ''
      if (node.void) {
        return `<${node.tag}${attrStr}>`
      }
      else if (node.selfClosing && node.children.length === 0) {
        return `<${node.tag}${attrStr} />`
      }
      else {
        const childrenCode = node.children.map(child => generateCode(child)).join('')
        return `<${node.tag}${attrStr}>${childrenCode}</${node.tag}>`
      }
    }

    case 'Attribute':
      if (node.value === null) {
        return node.name
      }
      else if (typeof node.value === 'string') {
        return `${node.name}="${node.value}"`
      }
      else {
        return `${node.name}="${generateCode(node.value)}"`
      }

    case 'Comment':
      if (node.style === 'stx') {
        return `{{-- ${node.value} --}}`
      }
      else {
        return `<!-- ${node.value} -->`
      }

    case 'Script': {
      const attrs = node.attributes.map(attr => generateCode(attr)).join(' ')
      const attrStr = attrs ? ` ${attrs}` : ''
      return `<script${attrStr}>${node.content}</script>`
    }

    case 'Style': {
      const attrs = node.attributes.map(attr => generateCode(attr)).join(' ')
      const attrStr = attrs ? ` ${attrs}` : ''
      const scopedAttr = node.scoped && !attrStr.includes('scoped') ? ' scoped' : ''
      return `<style${attrStr}${scopedAttr}>${node.content}</style>`
    }

    default:
      return ''
  }
}

// =============================================================================
// Simple Parser (Lexer-based)
// =============================================================================

/**
 * Token types for lexer (reserved for future tokenizer implementation)
 */
type _TokenType =
  | 'TEXT'
  | 'EXPRESSION_ESCAPED'
  | 'EXPRESSION_UNESCAPED'
  | 'DIRECTIVE_START'
  | 'DIRECTIVE_END'
  | 'COMMENT_HTML'
  | 'COMMENT_STX'
  | 'TAG_OPEN'
  | 'TAG_CLOSE'
  | 'TAG_SELF_CLOSE'
  | 'EOF'

interface _Token {
  type: _TokenType
  value: string
  loc: SourceLocation
}

/**
 * Simple template parser
 */
export class TemplateParser {
  private source: string = ''
  private pos: number = 0
  private line: number = 1
  private column: number = 0
  private filePath?: string

  /**
   * Parse a template string into an AST
   */
  parse(template: string, filePath?: string): DocumentNode {
    this.source = template
    this.pos = 0
    this.line = 1
    this.column = 0
    this.filePath = filePath

    const children = this.parseChildren()

    return createDocument(children, {
      start: { line: 1, column: 0 },
      end: { line: this.line, column: this.column },
      source: this.filePath,
    })
  }

  private parseChildren(stopAt?: RegExp): ASTNode[] {
    const children: ASTNode[] = []

    while (this.pos < this.source.length) {
      // Check stop condition
      if (stopAt && stopAt.test(this.source.slice(this.pos))) {
        break
      }

      const node = this.parseNext()
      if (node) {
        children.push(node)
      }
      else {
        break
      }
    }

    return children
  }

  private parseNext(): ASTNode | null {
    if (this.pos >= this.source.length) {
      return null
    }

    const remaining = this.source.slice(this.pos)

    // STX Comment: {{-- ... --}}
    if (remaining.startsWith('{{--')) {
      return this.parseStxComment()
    }

    // Expression escaped: {{ ... }}
    if (remaining.startsWith('{{')) {
      return this.parseExpression(true)
    }

    // Expression unescaped: {!! ... !!}
    if (remaining.startsWith('{!!')) {
      return this.parseExpression(false)
    }

    // Directive: @name
    if (remaining.match(/^@[a-z]/i)) {
      return this.parseDirective()
    }

    // HTML Comment: <!-- ... -->
    if (remaining.startsWith('<!--')) {
      return this.parseHtmlComment()
    }

    // Script tag
    if (remaining.match(/^<script/i)) {
      return this.parseScript()
    }

    // Style tag
    if (remaining.match(/^<style/i)) {
      return this.parseStyle()
    }

    // HTML tag or component
    if (remaining.startsWith('<') && !remaining.startsWith('</')) {
      return this.parseTag()
    }

    // Text
    return this.parseText()
  }

  private parseText(): TextNode | null {
    const start = this.getPosition()
    let value = ''

    while (this.pos < this.source.length) {
      const char = this.source[this.pos]
      const remaining = this.source.slice(this.pos)

      // Stop at special sequences
      if (
        remaining.startsWith('{{')
        || remaining.startsWith('{!!')
        || remaining.match(/^@[a-z]/i)
        || remaining.startsWith('<')
      ) {
        break
      }

      value += char
      this.advance()
    }

    if (value.length === 0) {
      return null
    }

    return createText(value, {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseExpression(escaped: boolean): ExpressionNode {
    const start = this.getPosition()
    const startDelim = escaped ? '{{' : '{!!'
    const endDelim = escaped ? '}}' : '!!}'

    // Skip start delimiter
    this.advance(startDelim.length)

    // Find end delimiter
    let expression = ''
    while (this.pos < this.source.length) {
      if (this.source.slice(this.pos).startsWith(endDelim)) {
        break
      }
      expression += this.source[this.pos]
      this.advance()
    }

    // Skip end delimiter
    this.advance(endDelim.length)

    return createExpression(expression.trim(), escaped, {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseDirective(): DirectiveNode {
    const start = this.getPosition()

    // Skip @
    this.advance()

    // Parse directive name
    let name = ''
    while (this.pos < this.source.length && /[a-z]/i.test(this.source[this.pos])) {
      name += this.source[this.pos]
      this.advance()
    }

    // Parse parameters
    let params: string | null = null
    if (this.source[this.pos] === '(') {
      params = this.parseParenthesized()
    }

    // Check for block directive
    const blockDirectives = new Set([
      'if',
      'unless',
      'isset',
      'empty',
      'auth',
      'guest',
      'env',
      'foreach',
      'for',
      'forelse',
      'while',
      'switch',
      'section',
      'push',
      'prepend',
      'once',
      'component',
      'slot',
      'verbatim',
      'php',
      'js',
      'ts',
    ])

    let body: ASTNode[] | null = null
    if (blockDirectives.has(name)) {
      const endPattern = new RegExp(`^@end${name}\\b`)
      body = this.parseChildren(endPattern)

      // Skip end directive
      const endMatch = this.source.slice(this.pos).match(endPattern)
      if (endMatch) {
        this.advance(endMatch[0].length)
      }
    }

    return createDirective(name, params, body, {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseParenthesized(): string {
    let content = ''
    let depth = 0

    while (this.pos < this.source.length) {
      const char = this.source[this.pos]

      if (char === '(') {
        depth++
        if (depth > 1) {
          content += char
        }
      }
      else if (char === ')') {
        depth--
        if (depth === 0) {
          this.advance()
          break
        }
        content += char
      }
      else {
        if (depth > 0) {
          content += char
        }
      }
      this.advance()
    }

    return content
  }

  private parseStxComment(): CommentNode {
    const start = this.getPosition()

    // Skip {{--
    this.advance(4)

    // Find --}}
    let value = ''
    while (this.pos < this.source.length) {
      if (this.source.slice(this.pos).startsWith('--}}')) {
        break
      }
      value += this.source[this.pos]
      this.advance()
    }

    // Skip --}}
    this.advance(4)

    return createComment(value.trim(), 'stx', {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseHtmlComment(): CommentNode {
    const start = this.getPosition()

    // Skip <!--
    this.advance(4)

    // Find -->
    let value = ''
    while (this.pos < this.source.length) {
      if (this.source.slice(this.pos).startsWith('-->')) {
        break
      }
      value += this.source[this.pos]
      this.advance()
    }

    // Skip -->
    this.advance(3)

    return createComment(value.trim(), 'html', {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseTag(): ElementNode | ComponentNode {
    const start = this.getPosition()

    // Skip <
    this.advance()

    // Parse tag name
    let tagName = ''
    while (this.pos < this.source.length && /[a-z0-9-]/i.test(this.source[this.pos])) {
      tagName += this.source[this.pos]
      this.advance()
    }

    // Parse attributes
    const attributes = this.parseAttributes()

    // Check for self-closing
    this.skipWhitespace()
    const selfClosing = this.source.slice(this.pos).startsWith('/>')
    if (selfClosing) {
      this.advance(2)
    }
    else {
      // Skip >
      this.advance()
    }

    // Determine if it's a component (PascalCase)
    const isComponent = /^[A-Z]/.test(tagName)

    // Check for void elements
    const voidElements = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ])
    const isVoid = voidElements.has(tagName.toLowerCase())

    let children: ASTNode[] = []
    if (!selfClosing && !isVoid) {
      // Parse children until closing tag
      const closePattern = new RegExp(`^</${tagName}>`, 'i')
      children = this.parseChildren(closePattern)

      // Skip closing tag
      const closeMatch = this.source.slice(this.pos).match(closePattern)
      if (closeMatch) {
        this.advance(closeMatch[0].length)
      }
    }

    const loc = {
      start,
      end: this.getPosition(),
      source: this.filePath,
    }

    if (isComponent) {
      return createComponent(tagName, attributes, children, selfClosing, loc)
    }
    else {
      const element = createElement(tagName, attributes, children, loc)
      element.selfClosing = selfClosing || isVoid
      return element
    }
  }

  private parseAttributes(): AttributeNode[] {
    const attributes: AttributeNode[] = []

    while (this.pos < this.source.length) {
      this.skipWhitespace()

      // Check for end of attributes
      if (this.source[this.pos] === '>' || this.source.slice(this.pos).startsWith('/>')) {
        break
      }

      const attr = this.parseAttribute()
      if (attr) {
        attributes.push(attr)
      }
    }

    return attributes
  }

  private parseAttribute(): AttributeNode | null {
    const start = this.getPosition()

    // Parse name
    let name = ''
    while (this.pos < this.source.length && /[a-z0-9-:@.]/i.test(this.source[this.pos])) {
      name += this.source[this.pos]
      this.advance()
    }

    if (!name) {
      return null
    }

    // Check for value
    let value: string | ExpressionNode | null = null
    this.skipWhitespace()

    if (this.source[this.pos] === '=') {
      this.advance()
      this.skipWhitespace()

      const quote = this.source[this.pos]
      if (quote === '"' || quote === '\'') {
        this.advance()
        let attrValue = ''
        while (this.pos < this.source.length && this.source[this.pos] !== quote) {
          attrValue += this.source[this.pos]
          this.advance()
        }
        this.advance() // Skip closing quote

        // Check if value contains expression
        if (attrValue.includes('{{') || attrValue.includes('{!!')) {
          // For simplicity, treat whole value as expression if it contains one
          value = attrValue
        }
        else {
          value = attrValue
        }
      }
    }

    return createAttribute(name, value, {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseScript(): ScriptNode {
    const start = this.getPosition()

    // Skip <script
    this.advance(7)

    // Parse attributes
    const attributes = this.parseAttributes()

    // Skip >
    this.skipWhitespace()
    this.advance()

    // Find </script>
    let content = ''
    while (this.pos < this.source.length) {
      if (this.source.slice(this.pos).match(/^<\/script>/i)) {
        break
      }
      content += this.source[this.pos]
      this.advance()
    }

    // Skip </script>
    this.advance(9)

    return createScript(content, attributes, {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
  }

  private parseStyle(): StyleNode {
    const start = this.getPosition()

    // Skip <style
    this.advance(6)

    // Parse attributes
    const attributes = this.parseAttributes()

    // Check for scoped
    const scoped = attributes.some(attr => attr.name === 'scoped')

    // Skip >
    this.skipWhitespace()
    this.advance()

    // Find </style>
    let content = ''
    while (this.pos < this.source.length) {
      if (this.source.slice(this.pos).match(/^<\/style>/i)) {
        break
      }
      content += this.source[this.pos]
      this.advance()
    }

    // Skip </style>
    this.advance(8)

    return createStyle(content, attributes, scoped, {
      start,
      end: this.getPosition(),
      source: this.filePath,
    })
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

  private skipWhitespace(): void {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.advance()
    }
  }

  private getPosition(): Position {
    return { line: this.line, column: this.column }
  }
}
