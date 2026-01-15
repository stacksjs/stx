/**
 * Template Type Checker
 *
 * Provides TypeScript-style type checking for stx templates.
 * Extracts types from <script> blocks and validates template expressions.
 *
 * Features:
 * - Type inference from variable declarations
 * - Expression validation against inferred types
 * - Property access validation
 * - Function call signature checking
 * - Helpful error messages with line/column info
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Primitive types supported by the type checker
 */
export type PrimitiveType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'any'
  | 'unknown'
  | 'void'
  | 'never'

/**
 * Type definition for a variable or expression
 */
export interface TypeDefinition {
  kind: 'primitive' | 'object' | 'array' | 'function' | 'union' | 'intersection' | 'literal'
  name?: string
  value?: PrimitiveType | string
  properties?: Record<string, TypeDefinition>
  elementType?: TypeDefinition
  params?: Array<{ name: string, type: TypeDefinition, optional?: boolean }>
  returnType?: TypeDefinition
  types?: TypeDefinition[]
}

/**
 * Type error reported by the checker
 */
export interface TypeCheckError {
  message: string
  file: string
  line: number
  column: number
  expression: string
  expected?: string
  received?: string
  severity: 'error' | 'warning'
}

/**
 * Type check result
 */
export interface TypeCheckResult {
  valid: boolean
  errors: TypeCheckError[]
  warnings: TypeCheckError[]
  variables: Map<string, TypeDefinition>
}

/**
 * Options for the type checker
 */
export interface TypeCheckerOptions {
  /** Strict mode - treat warnings as errors */
  strict?: boolean
  /** Allow any type to be used */
  allowAny?: boolean
  /** Check for undefined property access */
  checkPropertyAccess?: boolean
  /** Check function call signatures */
  checkFunctionCalls?: boolean
  /** Include built-in globals (console, Math, etc.) */
  includeBuiltins?: boolean
  /** Custom type definitions */
  customTypes?: Record<string, TypeDefinition>
  /** Base directory for resolving imports */
  baseDir?: string
}

/**
 * Default options
 */
const defaultOptions: TypeCheckerOptions = {
  strict: false,
  allowAny: true,
  checkPropertyAccess: true,
  checkFunctionCalls: true,
  includeBuiltins: true,
}

/**
 * Built-in global types
 */
const builtinTypes: Record<string, TypeDefinition> = {
  console: {
    kind: 'object',
    properties: {
      log: { kind: 'function', params: [{ name: 'message', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'primitive', value: 'void' } },
      error: { kind: 'function', params: [{ name: 'message', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'primitive', value: 'void' } },
      warn: { kind: 'function', params: [{ name: 'message', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'primitive', value: 'void' } },
    },
  },
  Math: {
    kind: 'object',
    properties: {
      abs: { kind: 'function', params: [{ name: 'x', type: { kind: 'primitive', value: 'number' } }], returnType: { kind: 'primitive', value: 'number' } },
      floor: { kind: 'function', params: [{ name: 'x', type: { kind: 'primitive', value: 'number' } }], returnType: { kind: 'primitive', value: 'number' } },
      ceil: { kind: 'function', params: [{ name: 'x', type: { kind: 'primitive', value: 'number' } }], returnType: { kind: 'primitive', value: 'number' } },
      round: { kind: 'function', params: [{ name: 'x', type: { kind: 'primitive', value: 'number' } }], returnType: { kind: 'primitive', value: 'number' } },
      max: { kind: 'function', params: [{ name: 'values', type: { kind: 'primitive', value: 'number' } }], returnType: { kind: 'primitive', value: 'number' } },
      min: { kind: 'function', params: [{ name: 'values', type: { kind: 'primitive', value: 'number' } }], returnType: { kind: 'primitive', value: 'number' } },
      random: { kind: 'function', params: [], returnType: { kind: 'primitive', value: 'number' } },
      PI: { kind: 'primitive', value: 'number' },
      E: { kind: 'primitive', value: 'number' },
    },
  },
  JSON: {
    kind: 'object',
    properties: {
      stringify: { kind: 'function', params: [{ name: 'value', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'primitive', value: 'string' } },
      parse: { kind: 'function', params: [{ name: 'text', type: { kind: 'primitive', value: 'string' } }], returnType: { kind: 'primitive', value: 'any' } },
    },
  },
  Date: {
    kind: 'function',
    returnType: {
      kind: 'object',
      properties: {
        getTime: { kind: 'function', params: [], returnType: { kind: 'primitive', value: 'number' } },
        toISOString: { kind: 'function', params: [], returnType: { kind: 'primitive', value: 'string' } },
        toLocaleDateString: { kind: 'function', params: [], returnType: { kind: 'primitive', value: 'string' } },
      },
    },
  },
  Array: {
    kind: 'object',
    properties: {
      isArray: { kind: 'function', params: [{ name: 'value', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'primitive', value: 'boolean' } },
      from: { kind: 'function', params: [{ name: 'arrayLike', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'array', elementType: { kind: 'primitive', value: 'any' } } },
    },
  },
  Object: {
    kind: 'object',
    properties: {
      keys: { kind: 'function', params: [{ name: 'obj', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'array', elementType: { kind: 'primitive', value: 'string' } } },
      values: { kind: 'function', params: [{ name: 'obj', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'array', elementType: { kind: 'primitive', value: 'any' } } },
      entries: { kind: 'function', params: [{ name: 'obj', type: { kind: 'primitive', value: 'any' } }], returnType: { kind: 'array', elementType: { kind: 'primitive', value: 'any' } } },
    },
  },
  String: {
    kind: 'function',
    params: [{ name: 'value', type: { kind: 'primitive', value: 'any' } }],
    returnType: { kind: 'primitive', value: 'string' },
  },
  Number: {
    kind: 'function',
    params: [{ name: 'value', type: { kind: 'primitive', value: 'any' } }],
    returnType: { kind: 'primitive', value: 'number' },
  },
  Boolean: {
    kind: 'function',
    params: [{ name: 'value', type: { kind: 'primitive', value: 'any' } }],
    returnType: { kind: 'primitive', value: 'boolean' },
  },
  // Template-specific globals
  props: { kind: 'object', properties: {} },
  slot: { kind: 'primitive', value: 'string' },
  loop: {
    kind: 'object',
    properties: {
      index: { kind: 'primitive', value: 'number' },
      iteration: { kind: 'primitive', value: 'number' },
      first: { kind: 'primitive', value: 'boolean' },
      last: { kind: 'primitive', value: 'boolean' },
      even: { kind: 'primitive', value: 'boolean' },
      odd: { kind: 'primitive', value: 'boolean' },
      count: { kind: 'primitive', value: 'number' },
      remaining: { kind: 'primitive', value: 'number' },
      depth: { kind: 'primitive', value: 'number' },
      parent: { kind: 'object', properties: {} },
    },
  },
}

/**
 * Template Type Checker class
 */
export class TemplateTypeChecker {
  private options: TypeCheckerOptions
  private variables: Map<string, TypeDefinition> = new Map()
  private errors: TypeCheckError[] = []
  private warnings: TypeCheckError[] = []
  private currentFile: string = ''

  constructor(options: TypeCheckerOptions = {}) {
    this.options = { ...defaultOptions, ...options }

    if (this.options.includeBuiltins) {
      Object.entries(builtinTypes).forEach(([name, type]) => {
        this.variables.set(name, type)
      })
    }

    if (this.options.customTypes) {
      Object.entries(this.options.customTypes).forEach(([name, type]) => {
        this.variables.set(name, type)
      })
    }
  }

  /**
   * Check a template file
   */
  checkFile(filePath: string): TypeCheckResult {
    this.currentFile = filePath
    this.errors = []
    this.warnings = []

    if (!existsSync(filePath)) {
      this.errors.push({
        message: `File not found: ${filePath}`,
        file: filePath,
        line: 0,
        column: 0,
        expression: '',
        severity: 'error',
      })
      return this.getResult()
    }

    const content = readFileSync(filePath, 'utf-8')
    return this.checkTemplate(content, filePath)
  }

  /**
   * Check a template string
   */
  checkTemplate(template: string, filePath: string = '<inline>'): TypeCheckResult {
    this.currentFile = filePath
    this.errors = []
    this.warnings = []

    // Extract and analyze script block
    const scriptMatch = template.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      this.analyzeScript(scriptMatch[1], template.indexOf(scriptMatch[0]))
    }

    // Check directive expressions first (adds loop variables to scope)
    this.checkDirectives(template)

    // Check template expressions (after directives add variables)
    this.checkExpressions(template)

    return this.getResult()
  }

  /**
   * Analyze script block and extract types
   */
  private analyzeScript(script: string, scriptOffset: number): void {
    const lines = script.split('\n')
    let lineOffset = this.getLineNumber(scriptOffset)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = lineOffset + i

      // Extract variable declarations with type annotations
      this.extractTypedVariables(line, lineNum)

      // Extract interface definitions
      this.extractInterfaces(line, lines, i, lineNum)

      // Extract type aliases
      this.extractTypeAliases(line, lineNum)
    }
  }

  /**
   * Extract variables with type annotations
   */
  private extractTypedVariables(line: string, lineNum: number): void {
    // Match: const/let/var name: Type = value
    const typedMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*:\s*([^=]+?)\s*=/)
    if (typedMatch) {
      const [, name, typeAnnotation] = typedMatch
      const type = this.parseTypeAnnotation(typeAnnotation.trim())
      this.variables.set(name, type)
      return
    }

    // Match: const/let/var name = value (infer type)
    const inferMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(.+)/)
    if (inferMatch) {
      const [, name, value] = inferMatch
      const type = this.inferType(value.trim())
      this.variables.set(name, type)
      return
    }

    // Match: function name(params): ReturnType
    const funcMatch = line.match(/(?:export\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?/)
    if (funcMatch) {
      const [, name, paramsStr, returnTypeStr] = funcMatch
      const params = this.parseParams(paramsStr)
      const returnType = returnTypeStr
        ? this.parseTypeAnnotation(returnTypeStr)
        : { kind: 'primitive' as const, value: 'any' as PrimitiveType }
      this.variables.set(name, { kind: 'function', params, returnType })
    }
  }

  /**
   * Extract interface definitions
   */
  private extractInterfaces(line: string, lines: string[], index: number, lineNum: number): void {
    const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)\s*\{/)
    if (interfaceMatch) {
      const [, name] = interfaceMatch
      const properties: Record<string, TypeDefinition> = {}

      // Parse interface body
      let braceCount = 1
      let i = index + 1
      while (i < lines.length && braceCount > 0) {
        const propLine = lines[i].trim()

        if (propLine.includes('{'))
          braceCount++
        if (propLine.includes('}'))
          braceCount--

        // Match property: name: Type
        const propMatch = propLine.match(/(\w+)\??\s*:\s*([^;]+)/)
        if (propMatch && braceCount > 0) {
          const [, propName, propType] = propMatch
          properties[propName] = this.parseTypeAnnotation(propType.trim())
        }

        i++
      }

      this.variables.set(name, { kind: 'object', name, properties })
    }
  }

  /**
   * Extract type aliases
   */
  private extractTypeAliases(line: string, lineNum: number): void {
    const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)\s*=\s*(.+)/)
    if (typeMatch) {
      const [, name, typeExpr] = typeMatch
      const type = this.parseTypeAnnotation(typeExpr.trim())
      type.name = name
      this.variables.set(name, type)
    }
  }

  /**
   * Parse a TypeScript type annotation
   */
  private parseTypeAnnotation(annotation: string): TypeDefinition {
    const trimmed = annotation.trim()

    // Union type
    if (trimmed.includes('|')) {
      const types = trimmed.split('|').map(t => this.parseTypeAnnotation(t.trim()))
      return { kind: 'union', types }
    }

    // Intersection type
    if (trimmed.includes('&')) {
      const types = trimmed.split('&').map(t => this.parseTypeAnnotation(t.trim()))
      return { kind: 'intersection', types }
    }

    // Array type
    if (trimmed.endsWith('[]')) {
      const elementType = this.parseTypeAnnotation(trimmed.slice(0, -2))
      return { kind: 'array', elementType }
    }

    // Array<T> type
    const arrayMatch = trimmed.match(/^Array<(.+)>$/)
    if (arrayMatch) {
      const elementType = this.parseTypeAnnotation(arrayMatch[1])
      return { kind: 'array', elementType }
    }

    // Object literal type
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const properties: Record<string, TypeDefinition> = {}
      const inner = trimmed.slice(1, -1).trim()
      if (inner) {
        const propParts = this.splitByComma(inner)
        for (const part of propParts) {
          const propMatch = part.match(/(\w+)\??\s*:\s*(.+)/)
          if (propMatch) {
            const [, propName, propType] = propMatch
            properties[propName] = this.parseTypeAnnotation(propType.trim())
          }
        }
      }
      return { kind: 'object', properties }
    }

    // Literal types
    if (trimmed.startsWith('"') || trimmed.startsWith('\'')) {
      return { kind: 'literal', value: trimmed.slice(1, -1) }
    }
    if (/^\d+$/.test(trimmed)) {
      return { kind: 'literal', value: trimmed }
    }
    if (trimmed === 'true' || trimmed === 'false') {
      return { kind: 'literal', value: trimmed }
    }

    // Primitive types
    const primitives: PrimitiveType[] = ['string', 'number', 'boolean', 'null', 'undefined', 'any', 'unknown', 'void', 'never']
    if (primitives.includes(trimmed as PrimitiveType)) {
      return { kind: 'primitive', value: trimmed as PrimitiveType }
    }

    // Reference to existing type
    if (this.variables.has(trimmed)) {
      return this.variables.get(trimmed)!
    }

    // Unknown type - treat as any
    return { kind: 'primitive', value: 'any' }
  }

  /**
   * Infer type from a value expression
   */
  private inferType(value: string): TypeDefinition {
    const trimmed = value.trim().replace(/;$/, '')

    // String literal
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('\'') && trimmed.endsWith('\'')) ||
        (trimmed.startsWith('`') && trimmed.endsWith('`'))) {
      return { kind: 'primitive', value: 'string' }
    }

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return { kind: 'primitive', value: 'number' }
    }

    // Boolean literal
    if (trimmed === 'true' || trimmed === 'false') {
      return { kind: 'primitive', value: 'boolean' }
    }

    // Null/undefined
    if (trimmed === 'null') {
      return { kind: 'primitive', value: 'null' }
    }
    if (trimmed === 'undefined') {
      return { kind: 'primitive', value: 'undefined' }
    }

    // Array literal
    if (trimmed.startsWith('[')) {
      // Try to infer element type from first element
      const inner = trimmed.slice(1, -1).trim()
      if (inner) {
        const firstElement = this.splitByComma(inner)[0]
        if (firstElement) {
          const elementType = this.inferType(firstElement.trim())
          return { kind: 'array', elementType }
        }
      }
      return { kind: 'array', elementType: { kind: 'primitive', value: 'any' } }
    }

    // Object literal
    if (trimmed.startsWith('{')) {
      const properties: Record<string, TypeDefinition> = {}
      const inner = this.extractObjectLiteral(trimmed)
      for (const [key, val] of Object.entries(inner)) {
        properties[key] = this.inferType(val)
      }
      return { kind: 'object', properties }
    }

    // Arrow function
    if (trimmed.includes('=>')) {
      const arrowMatch = trimmed.match(/^\(([^)]*)\)\s*(?::\s*(\w+))?\s*=>/)
      if (arrowMatch) {
        const params = this.parseParams(arrowMatch[1])
        const returnType = arrowMatch[2]
          ? this.parseTypeAnnotation(arrowMatch[2])
          : { kind: 'primitive' as const, value: 'any' as PrimitiveType }
        return { kind: 'function', params, returnType }
      }
    }

    // Variable reference
    if (/^\w+$/.test(trimmed) && this.variables.has(trimmed)) {
      return this.variables.get(trimmed)!
    }

    // Property access
    if (trimmed.includes('.')) {
      return this.resolvePropertyAccess(trimmed)
    }

    // Function call
    if (trimmed.includes('(')) {
      const funcName = trimmed.split('(')[0]
      const funcType = this.variables.get(funcName)
      if (funcType?.kind === 'function' && funcType.returnType) {
        return funcType.returnType
      }
    }

    // Default to any
    return { kind: 'primitive', value: 'any' }
  }

  /**
   * Parse function parameters
   */
  private parseParams(paramsStr: string): Array<{ name: string, type: TypeDefinition, optional?: boolean }> {
    if (!paramsStr.trim())
      return []

    const params: Array<{ name: string, type: TypeDefinition, optional?: boolean }> = []
    const parts = this.splitByComma(paramsStr)

    for (const part of parts) {
      const trimmed = part.trim()
      const optional = trimmed.includes('?')
      const paramMatch = trimmed.match(/(\w+)\??\s*(?::\s*([^=]+))?(?:\s*=)?/)
      if (paramMatch) {
        const [, name, typeStr] = paramMatch
        const type = typeStr
          ? this.parseTypeAnnotation(typeStr.trim())
          : { kind: 'primitive' as const, value: 'any' as PrimitiveType }
        params.push({ name, type, optional })
      }
    }

    return params
  }

  /**
   * Check template expressions {{ }}
   */
  private checkExpressions(template: string): void {
    const expressionRegex = /\{\{([\s\S]*?)\}\}/g
    let match

    while ((match = expressionRegex.exec(template)) !== null) {
      const expression = match[1].trim()
      const position = match.index
      const lineNum = this.getLineNumber(position, template)
      const column = this.getColumn(position, template)

      // Skip empty expressions
      if (!expression)
        continue

      // Skip raw expressions {!! !!}
      if (expression.startsWith('!') || expression.endsWith('!'))
        continue

      this.checkExpression(expression, lineNum, column)
    }

    // Check raw expressions
    const rawRegex = /\{!!([\s\S]*?)!!\}/g
    while ((match = rawRegex.exec(template)) !== null) {
      const expression = match[1].trim()
      const position = match.index
      const lineNum = this.getLineNumber(position, template)
      const column = this.getColumn(position, template)

      if (!expression)
        continue

      this.checkExpression(expression, lineNum, column)
    }
  }

  /**
   * Check a single expression
   */
  private checkExpression(expression: string, line: number, column: number): void {
    // Handle ternary operator
    if (expression.includes('?') && expression.includes(':')) {
      const parts = expression.split('?')
      this.checkExpression(parts[0].trim(), line, column)
      const elseParts = parts.slice(1).join('?').split(':')
      if (elseParts.length >= 2) {
        this.checkExpression(elseParts[0].trim(), line, column)
        this.checkExpression(elseParts.slice(1).join(':').trim(), line, column)
      }
      return
    }

    // Handle logical operators
    for (const op of ['&&', '||', '??']) {
      if (expression.includes(op)) {
        const parts = expression.split(op)
        parts.forEach(p => this.checkExpression(p.trim(), line, column))
        return
      }
    }

    // Handle comparison operators
    for (const op of ['===', '!==', '==', '!=', '>=', '<=', '>', '<']) {
      if (expression.includes(op)) {
        const parts = expression.split(op)
        parts.forEach(p => this.checkExpression(p.trim(), line, column))
        return
      }
    }

    // Handle negation
    if (expression.startsWith('!')) {
      this.checkExpression(expression.slice(1).trim(), line, column)
      return
    }

    // Skip literals
    if (this.isLiteral(expression))
      return

    // Check function calls
    const funcCallMatch = expression.match(/^(\w+(?:\.\w+)*)\s*\(/)
    if (funcCallMatch) {
      const funcPath = funcCallMatch[1]
      const type = this.resolvePropertyAccess(funcPath)

      if (type.kind !== 'function' && type.value !== 'any') {
        this.addWarning(
          `'${funcPath}' is not a function`,
          line,
          column,
          expression,
        )
      }
      return
    }

    // Check property access
    if (expression.includes('.')) {
      const type = this.resolvePropertyAccess(expression)
      if (type.value === 'undefined' && this.options.checkPropertyAccess) {
        this.addWarning(
          `Property access '${expression}' may be undefined`,
          line,
          column,
          expression,
        )
      }
      return
    }

    // Check simple variable reference
    const varName = expression.match(/^\w+/)?.[0]
    if (varName && !this.variables.has(varName)) {
      this.addError(
        `Variable '${varName}' is not defined`,
        line,
        column,
        expression,
      )
    }
  }

  /**
   * Check directive expressions
   */
  private checkDirectives(template: string): void {
    // Check @if conditions
    const ifRegex = /@if\s*\(([^)]+)\)/g
    let match

    while ((match = ifRegex.exec(template)) !== null) {
      const condition = match[1].trim()
      const position = match.index
      const lineNum = this.getLineNumber(position, template)
      const column = this.getColumn(position, template)

      this.checkExpression(condition, lineNum, column)
    }

    // Check @foreach loops
    const foreachRegex = /@foreach\s*\((\w+)\s+(?:as|in)\s+(\w+)(?:\s*,\s*(\w+))?\)/g
    while ((match = foreachRegex.exec(template)) !== null) {
      const [, collection, item, index] = match
      const position = match.index
      const lineNum = this.getLineNumber(position, template)
      const column = this.getColumn(position, template)

      // Check collection exists
      if (!this.variables.has(collection)) {
        this.addError(
          `Collection '${collection}' is not defined`,
          lineNum,
          column,
          match[0],
        )
      }
      else {
        // Add loop variables to scope
        const collectionType = this.variables.get(collection)!
        if (collectionType.kind === 'array' && collectionType.elementType) {
          this.variables.set(item, collectionType.elementType)
        }
        else {
          this.variables.set(item, { kind: 'primitive', value: 'any' })
        }

        if (index) {
          this.variables.set(index, { kind: 'primitive', value: 'number' })
        }
      }
    }

    // Check @unless conditions
    const unlessRegex = /@unless\s*\(([^)]+)\)/g
    while ((match = unlessRegex.exec(template)) !== null) {
      const condition = match[1].trim()
      const position = match.index
      const lineNum = this.getLineNumber(position, template)
      const column = this.getColumn(position, template)

      this.checkExpression(condition, lineNum, column)
    }

    // Check @switch expressions
    const switchRegex = /@switch\s*\(([^)]+)\)/g
    while ((match = switchRegex.exec(template)) !== null) {
      const expr = match[1].trim()
      const position = match.index
      const lineNum = this.getLineNumber(position, template)
      const column = this.getColumn(position, template)

      this.checkExpression(expr, lineNum, column)
    }
  }

  /**
   * Resolve property access chain (e.g., user.profile.name)
   */
  private resolvePropertyAccess(expr: string): TypeDefinition {
    const parts = expr.split('.')
    let currentType: TypeDefinition = this.variables.get(parts[0]) || { kind: 'primitive', value: 'any' }

    for (let i = 1; i < parts.length; i++) {
      const prop = parts[i].replace(/\(\)$/, '') // Remove function call parentheses

      if (currentType.kind === 'object' && currentType.properties) {
        if (currentType.properties[prop]) {
          currentType = currentType.properties[prop]
        }
        else if (!this.options.allowAny) {
          return { kind: 'primitive', value: 'undefined' }
        }
        else {
          currentType = { kind: 'primitive', value: 'any' }
        }
      }
      else if (currentType.kind === 'array' && currentType.elementType) {
        // Array methods
        if (['length'].includes(prop)) {
          currentType = { kind: 'primitive', value: 'number' }
        }
        else if (['map', 'filter', 'find', 'forEach', 'some', 'every', 'reduce'].includes(prop)) {
          currentType = { kind: 'function', returnType: { kind: 'primitive', value: 'any' } }
        }
        else if (['join'].includes(prop)) {
          currentType = { kind: 'function', returnType: { kind: 'primitive', value: 'string' } }
        }
        else {
          currentType = { kind: 'primitive', value: 'any' }
        }
      }
      else if (currentType.kind === 'primitive' && currentType.value === 'string') {
        // String methods
        if (['length'].includes(prop)) {
          currentType = { kind: 'primitive', value: 'number' }
        }
        else if (['toUpperCase', 'toLowerCase', 'trim', 'slice', 'substring'].includes(prop)) {
          currentType = { kind: 'function', returnType: { kind: 'primitive', value: 'string' } }
        }
        else if (['split'].includes(prop)) {
          currentType = { kind: 'function', returnType: { kind: 'array', elementType: { kind: 'primitive', value: 'string' } } }
        }
        else {
          currentType = { kind: 'primitive', value: 'any' }
        }
      }
      else {
        currentType = { kind: 'primitive', value: 'any' }
      }
    }

    return currentType
  }

  /**
   * Check if expression is a literal
   */
  private isLiteral(expr: string): boolean {
    const trimmed = expr.trim()

    // String literal
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('\'') && trimmed.endsWith('\'')) ||
        (trimmed.startsWith('`') && trimmed.endsWith('`'))) {
      return true
    }

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return true
    }

    // Boolean literal
    if (trimmed === 'true' || trimmed === 'false') {
      return true
    }

    // Null/undefined
    if (trimmed === 'null' || trimmed === 'undefined') {
      return true
    }

    return false
  }

  /**
   * Extract object literal properties
   */
  private extractObjectLiteral(expr: string): Record<string, string> {
    const result: Record<string, string> = {}
    const inner = expr.slice(1, -1).trim()
    if (!inner)
      return result

    const parts = this.splitByComma(inner)
    for (const part of parts) {
      const colonIdx = part.indexOf(':')
      if (colonIdx > 0) {
        const key = part.slice(0, colonIdx).trim()
        const value = part.slice(colonIdx + 1).trim()
        result[key] = value
      }
    }

    return result
  }

  /**
   * Split by comma, respecting nested structures
   */
  private splitByComma(str: string): string[] {
    const parts: string[] = []
    let current = ''
    let depth = 0
    let inString: string | null = null

    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      const prevChar = i > 0 ? str[i - 1] : ''

      // Handle string boundaries
      if ((char === '"' || char === '\'' || char === '`') && prevChar !== '\\') {
        if (inString === char) {
          inString = null
        }
        else if (!inString) {
          inString = char
        }
      }

      if (!inString) {
        if (char === '{' || char === '[' || char === '(')
          depth++
        if (char === '}' || char === ']' || char === ')')
          depth--

        if (char === ',' && depth === 0) {
          parts.push(current.trim())
          current = ''
          continue
        }
      }

      current += char
    }

    if (current.trim()) {
      parts.push(current.trim())
    }

    return parts
  }

  /**
   * Get line number from character position
   */
  private getLineNumber(position: number, template?: string): number {
    const content = template || ''
    const beforePos = content.slice(0, position)
    return (beforePos.match(/\n/g) || []).length + 1
  }

  /**
   * Get column from character position
   */
  private getColumn(position: number, template: string): number {
    const beforePos = template.slice(0, position)
    const lastNewline = beforePos.lastIndexOf('\n')
    return position - lastNewline
  }

  /**
   * Add an error
   */
  private addError(message: string, line: number, column: number, expression: string, expected?: string, received?: string): void {
    this.errors.push({
      message,
      file: this.currentFile,
      line,
      column,
      expression,
      expected,
      received,
      severity: 'error',
    })
  }

  /**
   * Add a warning
   */
  private addWarning(message: string, line: number, column: number, expression: string, expected?: string, received?: string): void {
    const error: TypeCheckError = {
      message,
      file: this.currentFile,
      line,
      column,
      expression,
      expected,
      received,
      severity: 'warning',
    }

    if (this.options.strict) {
      this.errors.push(error)
    }
    else {
      this.warnings.push(error)
    }
  }

  /**
   * Get the type check result
   */
  private getResult(): TypeCheckResult {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      variables: new Map(this.variables),
    }
  }

  /**
   * Add a variable to the type context
   */
  addVariable(name: string, type: TypeDefinition): void {
    this.variables.set(name, type)
  }

  /**
   * Clear the checker state
   */
  reset(): void {
    this.errors = []
    this.warnings = []
    this.variables.clear()

    if (this.options.includeBuiltins) {
      Object.entries(builtinTypes).forEach(([name, type]) => {
        this.variables.set(name, type)
      })
    }
  }
}

/**
 * Create a type checker instance
 */
export function createTypeChecker(options?: TypeCheckerOptions): TemplateTypeChecker {
  return new TemplateTypeChecker(options)
}

/**
 * Check a template file
 */
export function checkTemplateFile(filePath: string, options?: TypeCheckerOptions): TypeCheckResult {
  const checker = createTypeChecker(options)
  return checker.checkFile(filePath)
}

/**
 * Check a template string
 */
export function checkTemplate(template: string, options?: TypeCheckerOptions): TypeCheckResult {
  const checker = createTypeChecker(options)
  return checker.checkTemplate(template)
}

/**
 * Format type check errors for display
 */
export function formatTypeErrors(result: TypeCheckResult): string {
  const lines: string[] = []

  for (const error of result.errors) {
    lines.push(`\x1B[31merror\x1B[0m: ${error.message}`)
    lines.push(`  --> ${error.file}:${error.line}:${error.column}`)
    if (error.expression) {
      lines.push(`   |`)
      lines.push(`   | ${error.expression}`)
      lines.push(`   |`)
    }
    if (error.expected && error.received) {
      lines.push(`  expected: ${error.expected}`)
      lines.push(`  received: ${error.received}`)
    }
    lines.push('')
  }

  for (const warning of result.warnings) {
    lines.push(`\x1B[33mwarning\x1B[0m: ${warning.message}`)
    lines.push(`  --> ${warning.file}:${warning.line}:${warning.column}`)
    if (warning.expression) {
      lines.push(`   |`)
      lines.push(`   | ${warning.expression}`)
      lines.push(`   |`)
    }
    lines.push('')
  }

  if (result.valid) {
    lines.push(`\x1B[32m✓ No type errors found\x1B[0m`)
  }
  else {
    lines.push(`\x1B[31m✗ Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)\x1B[0m`)
  }

  return lines.join('\n')
}
