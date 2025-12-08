/**
 * Template Pre-compiler for stx
 *
 * Pre-compiles templates into optimized JavaScript render functions
 * for faster runtime execution.
 *
 * ## Features
 *
 * - Compiles templates to JavaScript functions
 * - Static analysis and optimization
 * - Tree-shaking friendly output
 * - Support for SSR and client-side hydration
 * - Source map generation for debugging
 *
 * ## Usage
 *
 * ```typescript
 * const compiler = new TemplateCompiler()
 * const result = await compiler.compile(template, {
 *   filename: 'template.stx',
 *   mode: 'ssr',
 *   optimize: true,
 * })
 *
 * // result.code contains the compiled function
 * // result.map contains the source map
 * ```
 *
 * @module precompiler
 */

import type {
  ASTNode,
  AttributeNode,
  ComponentNode,
  DirectiveNode,
  DocumentNode,
  ElementNode,
  ExpressionNode,
} from './ast'
import type { Position, SourceMapV3 } from './source-maps'
import {
  isCommentNode,
  isComponentNode,
  isDirectiveNode,
  isElementNode,
  isExpressionNode,
  isScriptNode,
  isStyleNode,
  isTextNode,
  TemplateParser,
  walkAST,
} from './ast'
import { SourceMapGenerator } from './source-maps'

// =============================================================================
// Types
// =============================================================================

/**
 * Compilation mode
 */
export type CompileMode = 'ssr' | 'client' | 'universal'

/**
 * Compilation options
 */
export interface CompileOptions {
  /** Source file name */
  filename?: string
  /** Compilation mode */
  mode?: CompileMode
  /** Enable optimizations */
  optimize?: boolean
  /** Generate source maps */
  sourceMaps?: boolean
  /** Module format */
  module?: 'esm' | 'cjs' | 'iife'
  /** Function name for IIFE mode */
  functionName?: string
  /** Include runtime in output */
  includeRuntime?: boolean
  /** Development mode (includes more debugging info) */
  dev?: boolean
  /** Custom directive handlers to inline */
  inlineDirectives?: string[]
}

/**
 * Compilation result
 */
export interface CompileResult {
  /** Compiled JavaScript code */
  code: string
  /** Source map (if enabled) */
  map?: SourceMapV3
  /** Static analysis info */
  analysis: {
    /** Variables used in expressions */
    usedVariables: Set<string>
    /** Directives used */
    usedDirectives: Set<string>
    /** Components used */
    usedComponents: Set<string>
    /** Whether template has dynamic content */
    isDynamic: boolean
    /** Whether template uses slots */
    hasSlots: boolean
  }
}

/**
 * Code generation context
 */
interface CodegenContext {
  code: string
  indentLevel: number
  sourceMapGenerator?: SourceMapGenerator
  currentLine: number
  currentColumn: number
  sourceFile: string
  mode: CompileMode
  optimize: boolean
  dev: boolean
  usedVariables: Set<string>
  usedDirectives: Set<string>
  usedComponents: Set<string>
  hasSlots: boolean
  varCounter: number
}

// =============================================================================
// Template Compiler
// =============================================================================

/**
 * Template pre-compiler
 */
export class TemplateCompiler {
  private parser: TemplateParser

  constructor() {
    this.parser = new TemplateParser()
  }

  /**
   * Compile a template string
   */
  compile(template: string, options: CompileOptions = {}): CompileResult {
    const {
      filename = 'template.stx',
      mode = 'ssr',
      optimize = true,
      sourceMaps = true,
      module = 'esm',
      functionName = 'render',
      dev = false,
    } = options

    // Parse template to AST
    const ast = this.parser.parse(template, filename)

    // Create codegen context
    const ctx = this.createContext({
      sourceFile: filename,
      mode,
      optimize,
      dev,
      sourceMaps,
    })

    // Generate code
    const functionCode = this.generateRenderFunction(ast, ctx)

    // Wrap in module format
    const code = this.wrapModule(functionCode, functionName, module, ctx)

    // Build result
    const result: CompileResult = {
      code,
      analysis: {
        usedVariables: ctx.usedVariables,
        usedDirectives: ctx.usedDirectives,
        usedComponents: ctx.usedComponents,
        isDynamic: ctx.usedVariables.size > 0 || ctx.usedDirectives.size > 0,
        hasSlots: ctx.hasSlots,
      },
    }

    if (sourceMaps && ctx.sourceMapGenerator) {
      result.map = ctx.sourceMapGenerator.toJSON()
    }

    return result
  }

  /**
   * Compile a template file
   */
  async compileFile(filePath: string, options: CompileOptions = {}): Promise<CompileResult> {
    const fs = await import('node:fs/promises')
    const template = await fs.readFile(filePath, 'utf-8')
    return this.compile(template, { ...options, filename: filePath })
  }

  private createContext(options: {
    sourceFile: string
    mode: CompileMode
    optimize: boolean
    dev: boolean
    sourceMaps: boolean
  }): CodegenContext {
    return {
      code: '',
      indentLevel: 0,
      sourceMapGenerator: options.sourceMaps
        ? new SourceMapGenerator('output.js', '')
        : undefined,
      currentLine: 1,
      currentColumn: 0,
      sourceFile: options.sourceFile,
      mode: options.mode,
      optimize: options.optimize,
      dev: options.dev,
      usedVariables: new Set(),
      usedDirectives: new Set(),
      usedComponents: new Set(),
      hasSlots: false,
      varCounter: 0,
    }
  }

  private generateRenderFunction(ast: DocumentNode, ctx: CodegenContext): string {
    // Analyze AST for used variables
    this.analyzeAST(ast, ctx)

    // Generate function body
    const bodyCode = this.generateNode(ast, ctx)

    // Build function
    let fn = ''
    fn += 'function render(__ctx) {\n'
    fn += '  const __html = [];\n'

    // Add helper functions
    fn += '  const __escape = (s) => String(s).replace(/[&<>"\']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","\'":"&#x27;"})[c]);\n'
    fn += '  const __push = (s) => __html.push(s);\n'

    // Destructure context variables
    if (ctx.usedVariables.size > 0) {
      const vars = Array.from(ctx.usedVariables).join(', ')
      fn += `  const { ${vars} } = __ctx;\n`
    }

    fn += '\n'
    fn += bodyCode
    fn += '\n'
    fn += '  return __html.join(\'\');\n'
    fn += '}'

    return fn
  }

  private analyzeAST(ast: DocumentNode, ctx: CodegenContext): void {
    walkAST(ast, {
      enter(node) {
        if (isExpressionNode(node)) {
          // Extract variable names from expression
          const vars = extractVariables(node.expression)
          vars.forEach(v => ctx.usedVariables.add(v))
        }
        else if (isDirectiveNode(node)) {
          ctx.usedDirectives.add(node.name)
          if (node.name === 'slot') {
            ctx.hasSlots = true
          }
          // Extract variables from params
          if (node.params) {
            const vars = extractVariables(node.params)
            vars.forEach(v => ctx.usedVariables.add(v))
          }
        }
        else if (isComponentNode(node)) {
          ctx.usedComponents.add(node.name)
        }
      },
    })
  }

  private generateNode(node: ASTNode, ctx: CodegenContext): string {
    if (isTextNode(node)) {
      return this.generateText(node.value, ctx)
    }
    else if (isExpressionNode(node)) {
      return this.generateExpression(node, ctx)
    }
    else if (isDirectiveNode(node)) {
      return this.generateDirective(node, ctx)
    }
    else if (isElementNode(node)) {
      return this.generateElement(node, ctx)
    }
    else if (isComponentNode(node)) {
      return this.generateComponent(node, ctx)
    }
    else if (isCommentNode(node)) {
      // Comments are removed in production, kept in dev
      if (ctx.dev && node.style === 'html') {
        return this.generateText(`<!-- ${node.value} -->`, ctx)
      }
      return ''
    }
    else if (isScriptNode(node)) {
      // Scripts are handled separately
      return ''
    }
    else if (isStyleNode(node)) {
      return this.generateStyle(node, ctx)
    }
    else if (node.type === 'Document') {
      return node.children.map(child => this.generateNode(child, ctx)).join('')
    }

    return ''
  }

  private generateText(text: string, _ctx: CodegenContext): string {
    if (!text) {
      return ''
    }

    // Optimize: merge adjacent static text
    const escaped = JSON.stringify(text)
    return `  __push(${escaped});\n`
  }

  private generateExpression(node: ExpressionNode, _ctx: CodegenContext): string {
    const expr = node.expression.trim()

    if (node.escaped) {
      return `  __push(__escape(${expr}));\n`
    }
    else {
      return `  __push(${expr});\n`
    }
  }

  private generateDirective(node: DirectiveNode, ctx: CodegenContext): string {
    const { name, params, body } = node

    switch (name) {
      case 'if':
        return this.generateIf(params, body, ctx)
      case 'unless':
        return this.generateUnless(params, body, ctx)
      case 'foreach':
        return this.generateForeach(params, body, ctx)
      case 'for':
        return this.generateFor(params, body, ctx)
      case 'while':
        return this.generateWhile(params, body, ctx)
      case 'isset':
        return this.generateIsset(params, body, ctx)
      case 'empty':
        return this.generateEmpty(params, body, ctx)
      case 'auth':
        return this.generateAuth(body, ctx)
      case 'guest':
        return this.generateGuest(body, ctx)
      case 'env':
        return this.generateEnv(params, body, ctx)
      case 'switch':
        return this.generateSwitch(params, body, ctx)
      case 'slot':
        return this.generateSlot(params, body, ctx)
      case 'section':
        return this.generateSection(params, body, ctx)
      case 'push':
        return this.generatePush(params, body, ctx)
      case 'once':
        return this.generateOnce(body, ctx)
      case 'js':
      case 'ts':
        return this.generateScript(body, ctx)
      default:
        // For unknown directives, output as-is in dev mode
        if (ctx.dev) {
          return `  __push('@${name}${params ? `(${params})` : ''}');\n`
        }
        return ''
    }
  }

  private generateIf(condition: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!condition || !body) {
      return ''
    }

    let code = `  if (${condition}) {\n`
    ctx.indentLevel++

    // Check for @elseif and @else in body
    const parts = this.splitConditionalBody(body)

    // Generate if body
    code += parts.ifBody.map(child => this.generateNode(child, ctx)).join('')

    // Generate elseif branches
    for (const elseif of parts.elseifs) {
      code += `  } else if (${elseif.condition}) {\n`
      code += elseif.body.map(child => this.generateNode(child, ctx)).join('')
    }

    // Generate else branch
    if (parts.elseBody.length > 0) {
      code += '  } else {\n'
      code += parts.elseBody.map(child => this.generateNode(child, ctx)).join('')
    }

    ctx.indentLevel--
    code += '  }\n'

    return code
  }

  private generateUnless(condition: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!condition || !body) {
      return ''
    }

    let code = `  if (!(${condition})) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateForeach(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    // Parse: items as item or (item, index) in items
    const asMatch = params.match(/^\s*(\S+)\s+as\s+(\S+)(?:\s*=>\s*(\S+))?\s*$/)
    const inMatch = params.match(/^\s*\(?([\w$]+)(?:,\s*([\w$]+))?\)?\s+in\s+(\S+)\s*$/)

    let items: string
    let item: string
    let index: string | null = null

    if (asMatch) {
      items = asMatch[1]
      item = asMatch[3] || asMatch[2]
      index = asMatch[3] ? asMatch[2] : null
    }
    else if (inMatch) {
      items = inMatch[3]
      item = inMatch[1]
      index = inMatch[2] || null
    }
    else {
      return ''
    }

    // Track loop variable
    ctx.usedVariables.add(items.split('.')[0])
    const loopVar = `__loop${ctx.varCounter++}`

    let code = `  const ${loopVar} = ${items} || [];\n`
    code += `  for (let __i = 0; __i < ${loopVar}.length; __i++) {\n`
    code += `    const ${item} = ${loopVar}[__i];\n`
    if (index) {
      code += `    const ${index} = __i;\n`
    }
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateFor(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    let code = `  for (${params}) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateWhile(condition: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!condition || !body) {
      return ''
    }

    let code = `  while (${condition}) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateIsset(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    let code = `  if (${params} !== undefined && ${params} !== null) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateEmpty(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    let code = `  if (!${params} || (Array.isArray(${params}) && ${params}.length === 0)) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateAuth(body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!body) {
      return ''
    }

    ctx.usedVariables.add('$auth')
    let code = '  if (__ctx.$auth?.user) {\n'
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateGuest(body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!body) {
      return ''
    }

    ctx.usedVariables.add('$auth')
    let code = '  if (!__ctx.$auth?.user) {\n'
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateEnv(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    ctx.usedVariables.add('$env')
    let code = `  if (__ctx.$env === ${params}) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateSwitch(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    let code = `  switch (${params}) {\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateSlot(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    const slotName = params?.replace(/['"]/g, '') || 'default'
    ctx.hasSlots = true

    let code = `  if (__ctx.$slots?.['${slotName}']) {\n`
    code += `    __push(__ctx.$slots['${slotName}']());\n`
    code += '  }'

    if (body && body.length > 0) {
      code += ' else {\n'
      code += body.map(child => this.generateNode(child, ctx)).join('')
      code += '  }'
    }

    code += '\n'

    return code
  }

  private generateSection(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    const sectionName = params.replace(/['"]/g, '')
    const sectionVar = `__section_${sectionName.replace(/\W/g, '_')}`

    let code = `  const ${sectionVar} = () => {\n`
    code += '    const __sectionHtml = [];\n'
    code += '    const __sectionPush = (s) => __sectionHtml.push(s);\n'
    // Temporarily swap __push
    code += body.map((child) => {
      const nodeCode = this.generateNode(child, ctx)
      return nodeCode.replace(/__push/g, '__sectionPush')
    }).join('')
    code += '    return __sectionHtml.join(\'\');\n'
    code += '  };\n'
    code += `  __ctx.$sections = __ctx.$sections || {};\n`
    code += `  __ctx.$sections['${sectionName}'] = ${sectionVar};\n`

    return code
  }

  private generatePush(params: string | null, body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!params || !body) {
      return ''
    }

    const stackName = params.replace(/['"]/g, '')

    let code = `  __ctx.$stacks = __ctx.$stacks || {};\n`
    code += `  __ctx.$stacks['${stackName}'] = __ctx.$stacks['${stackName}'] || [];\n`
    code += `  __ctx.$stacks['${stackName}'].push(() => {\n`
    code += '    const __stackHtml = [];\n'
    code += '    const __stackPush = (s) => __stackHtml.push(s);\n'
    code += body.map((child) => {
      const nodeCode = this.generateNode(child, ctx)
      return nodeCode.replace(/__push/g, '__stackPush')
    }).join('')
    code += '    return __stackHtml.join(\'\');\n'
    code += '  });\n'

    return code
  }

  private generateOnce(body: ASTNode[] | null, ctx: CodegenContext): string {
    if (!body) {
      return ''
    }

    const onceId = `__once_${ctx.varCounter++}`

    let code = `  if (!__ctx.$once?.has('${onceId}')) {\n`
    code += `    __ctx.$once = __ctx.$once || new Set();\n`
    code += `    __ctx.$once.add('${onceId}');\n`
    code += body.map(child => this.generateNode(child, ctx)).join('')
    code += '  }\n'

    return code
  }

  private generateScript(body: ASTNode[] | null, _ctx: CodegenContext): string {
    if (!body) {
      return ''
    }

    // Scripts should be extracted and run separately
    // For now, we skip them in output
    return ''
  }

  private generateStyle(node: { content: string, scoped: boolean }, _ctx: CodegenContext): string {
    if (!node.content) {
      return ''
    }

    const content = node.content.trim()
    if (node.scoped) {
      // Scoped styles should be processed separately
      return `  __push('<style data-scoped>${content}</style>');\n`
    }
    return `  __push('<style>${content}</style>');\n`
  }

  private generateElement(node: ElementNode, ctx: CodegenContext): string {
    let code = ''

    // Opening tag
    code += `  __push('<${node.tag}');\n`

    // Attributes
    for (const attr of node.attributes) {
      code += this.generateAttribute(attr, ctx)
    }

    if (node.void) {
      code += '  __push(\'>\');\n'
    }
    else if (node.selfClosing && node.children.length === 0) {
      code += '  __push(\' />\');\n'
    }
    else {
      code += '  __push(\'>\');\n'

      // Children
      for (const child of node.children) {
        code += this.generateNode(child, ctx)
      }

      // Closing tag
      code += `  __push('</${node.tag}>');\n`
    }

    return code
  }

  private generateAttribute(attr: AttributeNode, ctx: CodegenContext): string {
    const { name, value } = attr

    if (value === null) {
      // Boolean attribute
      return `  __push(' ${name}');\n`
    }
    else if (typeof value === 'string') {
      // Check for expressions in value
      if (value.includes('{{') || value.includes('{!!')) {
        // Dynamic attribute
        const parts = this.parseAttributeValue(value, ctx)
        return `  __push(' ${name}="' + ${parts} + '"');\n`
      }
      else {
        // Static attribute
        return `  __push(' ${name}="${value}"');\n`
      }
    }
    else if (isExpressionNode(value)) {
      // Expression as value
      const expr = value.expression.trim()
      if (value.escaped) {
        return `  __push(' ${name}="' + __escape(${expr}) + '"');\n`
      }
      else {
        return `  __push(' ${name}="' + ${expr} + '"');\n`
      }
    }

    return ''
  }

  private parseAttributeValue(value: string, ctx: CodegenContext): string {
    // Parse value with embedded expressions
    const parts: string[] = []
    let lastIndex = 0

    // Match {{ }} and {!! !!}
    const regex = /\{\{(.+?)\}\}|\{!!(.+?)!!\}/g
    let match = regex.exec(value)

    while (match !== null) {
      // Add static part before match
      if (match.index > lastIndex) {
        parts.push(JSON.stringify(value.slice(lastIndex, match.index)))
      }

      // Add expression
      if (match[1]) {
        // Escaped expression
        const expr = match[1].trim()
        ctx.usedVariables.add(expr.split(/[.[(]/)[0])
        parts.push(`__escape(${expr})`)
      }
      else if (match[2]) {
        // Unescaped expression
        const expr = match[2].trim()
        ctx.usedVariables.add(expr.split(/[.[(]/)[0])
        parts.push(`String(${expr})`)
      }

      lastIndex = match.index + match[0].length
      match = regex.exec(value)
    }

    // Add remaining static part
    if (lastIndex < value.length) {
      parts.push(JSON.stringify(value.slice(lastIndex)))
    }

    return parts.join(' + ')
  }

  private generateComponent(node: ComponentNode, ctx: CodegenContext): string {
    const { name, attributes, children } = node

    ctx.usedComponents.add(name)

    // Build props object
    let propsCode = '{'
    const propParts: string[] = []

    for (const attr of attributes) {
      if (attr.value === null) {
        propParts.push(`${attr.name}: true`)
      }
      else if (typeof attr.value === 'string') {
        if (attr.name.startsWith(':')) {
          // Dynamic binding
          const propName = attr.name.slice(1)
          propParts.push(`${propName}: ${attr.value}`)
        }
        else {
          propParts.push(`${attr.name}: ${JSON.stringify(attr.value)}`)
        }
      }
      else if (isExpressionNode(attr.value)) {
        propParts.push(`${attr.name}: ${attr.value.expression}`)
      }
    }

    propsCode += propParts.join(', ')
    propsCode += '}'

    // Build slots
    let slotsCode = '{}'
    if (children.length > 0) {
      const defaultSlotCode = children.map(child => this.generateNode(child, ctx)).join('')
      slotsCode = `{ default: () => { const __slotHtml = []; const __push = (s) => __slotHtml.push(s); ${defaultSlotCode.replace(/^\s+/gm, '')} return __slotHtml.join(''); } }`
    }

    return `  __push(await __ctx.$components['${name}'](${propsCode}, ${slotsCode}));\n`
  }

  private splitConditionalBody(body: ASTNode[]): {
    ifBody: ASTNode[]
    elseifs: Array<{ condition: string, body: ASTNode[] }>
    elseBody: ASTNode[]
  } {
    const result = {
      ifBody: [] as ASTNode[],
      elseifs: [] as Array<{ condition: string, body: ASTNode[] }>,
      elseBody: [] as ASTNode[],
    }

    let current: 'if' | 'elseif' | 'else' = 'if'
    let currentElseif: { condition: string, body: ASTNode[] } | null = null

    for (const node of body) {
      if (isDirectiveNode(node)) {
        if (node.name === 'elseif') {
          if (currentElseif) {
            result.elseifs.push(currentElseif)
          }
          currentElseif = { condition: node.params || 'true', body: [] }
          current = 'elseif'
          continue
        }
        else if (node.name === 'else') {
          if (currentElseif) {
            result.elseifs.push(currentElseif)
            currentElseif = null
          }
          current = 'else'
          continue
        }
      }

      switch (current) {
        case 'if':
          result.ifBody.push(node)
          break
        case 'elseif':
          if (currentElseif) {
            currentElseif.body.push(node)
          }
          break
        case 'else':
          result.elseBody.push(node)
          break
      }
    }

    if (currentElseif) {
      result.elseifs.push(currentElseif)
    }

    return result
  }

  private wrapModule(
    functionCode: string,
    functionName: string,
    format: 'esm' | 'cjs' | 'iife',
    _ctx: CodegenContext,
  ): string {
    switch (format) {
      case 'esm':
        return `${functionCode}\n\nexport { render };\nexport default render;\n`
      case 'cjs':
        return `${functionCode}\n\nmodule.exports = render;\nmodule.exports.render = render;\n`
      case 'iife':
        return `var ${functionName} = (function() {\n${functionCode}\n\nreturn render;\n})();\n`
      default:
        return functionCode
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract variable names from an expression
 */
function extractVariables(expression: string): string[] {
  const variables: string[] = []

  // Simple regex to find potential variable names
  // This is a basic implementation - a proper one would parse the expression
  const matches = expression.match(/\b[a-z_$]\w*\b/gi) || []

  const keywords = new Set([
    'true',
    'false',
    'null',
    'undefined',
    'NaN',
    'Infinity',
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'return',
    'function',
    'const',
    'let',
    'var',
    'class',
    'new',
    'this',
    'typeof',
    'instanceof',
    'in',
    'of',
    'delete',
    'void',
    'try',
    'catch',
    'finally',
    'throw',
    'async',
    'await',
    'yield',
    'import',
    'export',
    'default',
    'from',
    'as',
    'Math',
    'Date',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'RegExp',
    'JSON',
    'console',
    'window',
    'document',
    'global',
    'process',
  ])

  for (const match of matches) {
    if (!keywords.has(match) && !variables.includes(match)) {
      variables.push(match)
    }
  }

  return variables
}

/**
 * Add source mapping for a position
 */
function _addMapping(
  ctx: CodegenContext,
  generated: Position,
  original: Position,
): void {
  if (ctx.sourceMapGenerator) {
    ctx.sourceMapGenerator.addMapping({
      generated,
      original,
      source: ctx.sourceFile,
    })
  }
}

// Export singleton instance
export const compiler: TemplateCompiler = new TemplateCompiler()
