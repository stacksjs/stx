/**
 * TypeScript-First Templates Module
 *
 * Provides compile-time type checking and TypeScript support for stx templates.
 *
 * ## Features
 *
 * 1. **Type-Safe Context** - Define typed interfaces for template context
 * 2. **Compile-Time Checking** - Validate expressions against context types
 * 3. **Type Inference** - Infer types from script blocks
 * 4. **Type Generation** - Generate TypeScript definitions from templates
 * 5. **IDE Support** - Enable autocomplete and type hints in editors
 *
 * ## Usage
 *
 * ```html
 * <!-- Define context type at top of template -->
 * @types
 * interface PageContext {
 *   title: string
 *   items: Array<{ id: number; name: string }>
 *   user?: { name: string; role: 'admin' | 'user' }
 * }
 * @endtypes
 *
 * <h1>{{ title }}</h1>
 * @foreach(items as item)
 *   <p>{{ item.name }}</p>  <!-- Type-checked! -->
 * @endforeach
 * ```
 *
 * @module typescript-templates
 */

// =============================================================================
// Types
// =============================================================================

/** Supported TypeScript primitive types */
export type TSPrimitiveType = 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'any' | 'unknown' | 'never' | 'void'

/** TypeScript type representation */
export interface TSType {
  kind: 'primitive' | 'array' | 'object' | 'union' | 'intersection' | 'literal' | 'function' | 'generic' | 'reference'
  value?: TSPrimitiveType | string
  elementType?: TSType // For arrays
  properties?: Record<string, TSTypeProperty> // For objects
  types?: TSType[] // For unions/intersections
  literalValue?: string | number | boolean // For literals
  parameters?: TSFunctionParam[] // For functions
  returnType?: TSType // For functions
  typeArguments?: TSType[] // For generics
  optional?: boolean
}

/** Object property with type */
export interface TSTypeProperty {
  type: TSType
  optional: boolean
  readonly: boolean
  description?: string
}

/** Function parameter */
export interface TSFunctionParam {
  name: string
  type: TSType
  optional: boolean
  rest: boolean
}

/** Interface definition */
export interface TSInterface {
  name: string
  properties: Record<string, TSTypeProperty>
  extends?: string[]
  description?: string
}

/** Type alias definition */
export interface TSTypeAlias {
  name: string
  type: TSType
  description?: string
}

/** Template type context */
export interface TemplateTypeContext {
  interfaces: Map<string, TSInterface>
  typeAliases: Map<string, TSTypeAlias>
  variables: Map<string, TSType>
  errors: TypeCheckError[]
  warnings: TypeCheckWarning[]
}

/** Type check error */
export interface TypeCheckError {
  message: string
  line?: number
  column?: number
  expression?: string
  expectedType?: string
  actualType?: string
}

/** Type check warning */
export interface TypeCheckWarning {
  message: string
  line?: number
  column?: number
  suggestion?: string
}

/** Type extraction result */
export interface TypeExtractionResult {
  interfaces: TSInterface[]
  typeAliases: TSTypeAlias[]
  contextType?: TSInterface
  errors: string[]
}

/** Generated type definition file content */
export interface GeneratedTypes {
  content: string
  filename: string
}

// =============================================================================
// Type Parsing
// =============================================================================

/**
 * Parse a TypeScript type annotation string into a TSType structure.
 *
 * @example
 * parseTypeAnnotation('string') // { kind: 'primitive', value: 'string' }
 * parseTypeAnnotation('string[]') // { kind: 'array', elementType: { kind: 'primitive', value: 'string' } }
 * parseTypeAnnotation('{ name: string }') // { kind: 'object', properties: { name: { type: ..., optional: false } } }
 */
export function parseTypeAnnotation(typeStr: string): TSType {
  const trimmed = typeStr.trim()

  // Primitive types
  const primitives: TSPrimitiveType[] = ['string', 'number', 'boolean', 'null', 'undefined', 'any', 'unknown', 'never', 'void']
  if (primitives.includes(trimmed as TSPrimitiveType)) {
    return { kind: 'primitive', value: trimmed as TSPrimitiveType }
  }

  // Array types: Type[] or Array<Type>
  if (trimmed.endsWith('[]')) {
    return {
      kind: 'array',
      elementType: parseTypeAnnotation(trimmed.slice(0, -2)),
    }
  }
  if (trimmed.startsWith('Array<') && trimmed.endsWith('>')) {
    return {
      kind: 'array',
      elementType: parseTypeAnnotation(trimmed.slice(6, -1)),
    }
  }

  // Union types: Type1 | Type2
  if (trimmed.includes('|') && !trimmed.startsWith('{') && !trimmed.startsWith('(')) {
    const types = splitByOperator(trimmed, '|').map(t => parseTypeAnnotation(t))
    return { kind: 'union', types }
  }

  // Intersection types: Type1 & Type2
  if (trimmed.includes('&') && !trimmed.startsWith('{') && !trimmed.startsWith('(')) {
    const types = splitByOperator(trimmed, '&').map(t => parseTypeAnnotation(t))
    return { kind: 'intersection', types }
  }

  // Literal types: 'value' or 123 or true/false
  if ((trimmed.startsWith('\'') && trimmed.endsWith('\'')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return { kind: 'literal', literalValue: trimmed.slice(1, -1) }
  }
  if (/^\d+$/.test(trimmed)) {
    return { kind: 'literal', literalValue: Number.parseInt(trimmed) }
  }
  if (trimmed === 'true' || trimmed === 'false') {
    return { kind: 'literal', literalValue: trimmed === 'true' }
  }

  // Object types: { prop: Type }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseObjectType(trimmed)
  }

  // Function types: (params) => ReturnType
  if (trimmed.includes('=>')) {
    return parseFunctionType(trimmed)
  }

  // Generic types: Type<Args>
  if (trimmed.includes('<') && trimmed.endsWith('>')) {
    const baseEnd = trimmed.indexOf('<')
    const baseName = trimmed.slice(0, baseEnd)
    const argsStr = trimmed.slice(baseEnd + 1, -1)
    const typeArgs = splitByComma(argsStr).map(t => parseTypeAnnotation(t))
    return { kind: 'generic', value: baseName, typeArguments: typeArgs }
  }

  // Reference to another type (interface/type alias)
  return { kind: 'reference', value: trimmed }
}

/**
 * Parse an object type like { name: string; age?: number }
 */
function parseObjectType(typeStr: string): TSType {
  const inner = typeStr.slice(1, -1).trim()
  const properties: Record<string, TSTypeProperty> = {}

  if (!inner)
    return { kind: 'object', properties }

  // Split by semicolons or newlines, handling nested braces
  const members = splitObjectMembers(inner)

  for (const member of members) {
    const trimmedMember = member.trim()
    if (!trimmedMember)
      continue

    // Parse: readonly? name?: Type
    const readonlyMatch = trimmedMember.startsWith('readonly ')
    const withoutReadonly = readonlyMatch ? trimmedMember.slice(9) : trimmedMember

    const colonIndex = withoutReadonly.indexOf(':')
    if (colonIndex === -1)
      continue

    let propName = withoutReadonly.slice(0, colonIndex).trim()
    const propType = withoutReadonly.slice(colonIndex + 1).trim()

    const optional = propName.endsWith('?')
    if (optional) {
      propName = propName.slice(0, -1)
    }

    properties[propName] = {
      type: parseTypeAnnotation(propType),
      optional,
      readonly: readonlyMatch,
    }
  }

  return { kind: 'object', properties }
}

/**
 * Parse a function type like (x: number) => string
 */
function parseFunctionType(typeStr: string): TSType {
  const arrowIndex = typeStr.indexOf('=>')
  const paramsStr = typeStr.slice(0, arrowIndex).trim()
  const returnStr = typeStr.slice(arrowIndex + 2).trim()

  const parameters: TSFunctionParam[] = []

  // Parse parameters
  if (paramsStr.startsWith('(') && paramsStr.endsWith(')')) {
    const inner = paramsStr.slice(1, -1)
    const params = splitByComma(inner)

    for (const param of params) {
      const trimmed = param.trim()
      if (!trimmed)
        continue

      const rest = trimmed.startsWith('...')
      const withoutRest = rest ? trimmed.slice(3) : trimmed

      const colonIndex = withoutRest.indexOf(':')
      if (colonIndex === -1) {
        parameters.push({
          name: withoutRest,
          type: { kind: 'primitive', value: 'any' },
          optional: false,
          rest,
        })
      }
      else {
        let name = withoutRest.slice(0, colonIndex).trim()
        const type = withoutRest.slice(colonIndex + 1).trim()
        const optional = name.endsWith('?')
        if (optional)
          name = name.slice(0, -1)

        parameters.push({
          name,
          type: parseTypeAnnotation(type),
          optional,
          rest,
        })
      }
    }
  }

  return {
    kind: 'function',
    parameters,
    returnType: parseTypeAnnotation(returnStr),
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Split a type string by operator (| or &) respecting nesting
 */
function splitByOperator(str: string, operator: string): string[] {
  const results: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (char === '<' || char === '(' || char === '{' || char === '[') {
      depth++
      current += char
    }
    else if (char === '>' || char === ')' || char === '}' || char === ']') {
      depth--
      current += char
    }
    else if (char === operator && depth === 0) {
      results.push(current.trim())
      current = ''
    }
    else {
      current += char
    }
  }

  if (current.trim()) {
    results.push(current.trim())
  }

  return results
}

/**
 * Split by comma respecting nesting
 */
function splitByComma(str: string): string[] {
  return splitByOperator(str, ',')
}

/**
 * Split object members by semicolon or newline
 */
function splitObjectMembers(str: string): string[] {
  const results: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (char === '<' || char === '(' || char === '{' || char === '[') {
      depth++
      current += char
    }
    else if (char === '>' || char === ')' || char === '}' || char === ']') {
      depth--
      current += char
    }
    else if ((char === ';' || char === '\n') && depth === 0) {
      if (current.trim()) {
        results.push(current.trim())
      }
      current = ''
    }
    else {
      current += char
    }
  }

  if (current.trim()) {
    results.push(current.trim())
  }

  return results
}

/**
 * Parse interface declarations handling nested braces properly
 */
function parseInterfaceDeclarations(content: string): Array<{ name: string, body: string, extends?: string[] }> {
  const results: Array<{ name: string, body: string, extends?: string[] }> = []
  const interfaceKeyword = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*\{/g
  let match

  // Find all interface declarations using regex for the header
  // eslint-disable-next-line no-cond-assign
  while ((match = interfaceKeyword.exec(content)) !== null) {
    const name = match[1]
    const extendsClause = match[2]
    const startBrace = match.index + match[0].length - 1 // Position of opening {

    // Find matching closing brace, counting depth
    let depth = 1
    let pos = startBrace + 1

    while (pos < content.length && depth > 0) {
      if (content[pos] === '{')
        depth++
      else if (content[pos] === '}')
        depth--
      pos++
    }

    const body = content.slice(startBrace + 1, pos - 1)

    results.push({
      name,
      body,
      extends: extendsClause ? extendsClause.split(',').map(s => s.trim()) : undefined,
    })
  }

  return results
}

// =============================================================================
// Type Extraction from Templates
// =============================================================================

/**
 * Extract type definitions from a template's @types block.
 *
 * @example
 * ```typescript
 * const result = extractTypesFromTemplate(`
 *   @types
 *   interface PageContext {
 *     title: string
 *   }
 *   @endtypes
 *   <h1>{{ title }}</h1>
 * `)
 * // result.interfaces[0].name === 'PageContext'
 * ```
 */
export function extractTypesFromTemplate(template: string): TypeExtractionResult {
  const interfaces: TSInterface[] = []
  const typeAliases: TSTypeAlias[] = []
  const errors: string[] = []
  let contextType: TSInterface | undefined

  // Find @types blocks
  const typesBlockRegex = /@types\s*([\s\S]*?)@endtypes/g
  const typesBlocks = template.matchAll(typesBlockRegex)

  for (const match of typesBlocks) {
    const content = match[1]

    // Parse interface declarations - use a function to handle nested braces
    const interfaceParsed = parseInterfaceDeclarations(content)

    for (const parsed of interfaceParsed) {
      const parsedType = parseObjectType(`{${parsed.body}}`)
      const iface: TSInterface = {
        name: parsed.name,
        properties: parsedType.properties || {},
        extends: parsed.extends,
      }

      interfaces.push(iface)

      // If this is named PageContext, TemplateContext, or Context, use it as the main context type
      if (parsed.name === 'PageContext' || parsed.name === 'TemplateContext' || parsed.name === 'Context') {
        contextType = iface
      }
    }

    // Parse type alias declarations
    const typeAliasRegex = /type\s+(\w+)\s*=\s*([^;]+);?/g
    const typeAliasMatches = content.matchAll(typeAliasRegex)

    for (const typeMatch of typeAliasMatches) {
      const name = typeMatch[1]
      const typeStr = typeMatch[2].trim()

      typeAliases.push({
        name,
        type: parseTypeAnnotation(typeStr),
      })
    }
  }

  // If no explicit context type, use the first interface
  if (!contextType && interfaces.length > 0) {
    contextType = interfaces[0]
  }

  return { interfaces, typeAliases, contextType, errors }
}

// =============================================================================
// Type Checking
// =============================================================================

/**
 * Create a type context from extracted types and runtime context.
 */
export function createTypeContext(
  extracted: TypeExtractionResult,
  runtimeContext?: Record<string, unknown>,
): TemplateTypeContext {
  const ctx: TemplateTypeContext = {
    interfaces: new Map(),
    typeAliases: new Map(),
    variables: new Map(),
    errors: [],
    warnings: [],
  }

  // Add extracted interfaces
  for (const iface of extracted.interfaces) {
    ctx.interfaces.set(iface.name, iface)
  }

  // Add extracted type aliases
  for (const alias of extracted.typeAliases) {
    ctx.typeAliases.set(alias.name, alias)
  }

  // Add context variables from the main context type
  if (extracted.contextType) {
    for (const [name, prop] of Object.entries(extracted.contextType.properties)) {
      ctx.variables.set(name, prop.type)
    }
  }

  // Infer types from runtime context if no explicit types
  if (runtimeContext && ctx.variables.size === 0) {
    for (const [name, value] of Object.entries(runtimeContext)) {
      ctx.variables.set(name, inferTypeFromValue(value))
    }
  }

  return ctx
}

/**
 * Infer a TSType from a runtime value.
 */
export function inferTypeFromValue(value: unknown): TSType {
  if (value === null)
    return { kind: 'primitive', value: 'null' }
  if (value === undefined)
    return { kind: 'primitive', value: 'undefined' }

  const type = typeof value

  if (type === 'string')
    return { kind: 'primitive', value: 'string' }
  if (type === 'number')
    return { kind: 'primitive', value: 'number' }
  if (type === 'boolean')
    return { kind: 'primitive', value: 'boolean' }
  if (type === 'function')
    return { kind: 'function', parameters: [], returnType: { kind: 'primitive', value: 'any' } }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { kind: 'array', elementType: { kind: 'primitive', value: 'any' } }
    }
    // Infer from first element
    return { kind: 'array', elementType: inferTypeFromValue(value[0]) }
  }

  if (type === 'object') {
    const properties: Record<string, TSTypeProperty> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = {
        type: inferTypeFromValue(val),
        optional: false,
        readonly: false,
      }
    }
    return { kind: 'object', properties }
  }

  return { kind: 'primitive', value: 'any' }
}

/**
 * Type-check an expression against the type context.
 *
 * @returns The inferred type of the expression, or an error
 */
export function typeCheckExpression(
  expression: string,
  context: TemplateTypeContext,
): TSType | TypeCheckError {
  const trimmed = expression.trim()

  // Simple variable access
  if (/^\w+$/.test(trimmed)) {
    const varType = context.variables.get(trimmed)
    if (!varType) {
      return {
        message: `Unknown variable '${trimmed}'`,
        expression: trimmed,
      }
    }
    return varType
  }

  // Property access: obj.prop
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.')
    let currentType: TSType | undefined = context.variables.get(parts[0])

    if (!currentType) {
      return {
        message: `Unknown variable '${parts[0]}'`,
        expression: trimmed,
      }
    }

    for (let i = 1; i < parts.length; i++) {
      const prop = parts[i]

      // Handle optional chaining marker
      const propName = prop.endsWith('?') ? prop.slice(0, -1) : prop

      if (currentType.kind === 'object' && currentType.properties) {
        const propDef = currentType.properties[propName]
        if (!propDef) {
          return {
            message: `Property '${propName}' does not exist on type`,
            expression: trimmed,
          }
        }
        currentType = propDef.type
      }
      else if (currentType.kind === 'reference') {
        // Look up the referenced type
        const iface = context.interfaces.get(currentType.value!)
        if (iface && iface.properties[propName]) {
          currentType = iface.properties[propName].type
        }
        else {
          return {
            message: `Property '${propName}' does not exist on type '${currentType.value}'`,
            expression: trimmed,
          }
        }
      }
      else if (currentType.kind === 'array' && propName === 'length') {
        currentType = { kind: 'primitive', value: 'number' }
      }
      else {
        return {
          message: `Cannot access property '${propName}' on type`,
          expression: trimmed,
        }
      }
    }

    return currentType
  }

  // For complex expressions, return any (would need full parser)
  return { kind: 'primitive', value: 'any' }
}

/**
 * Validate all expressions in a template.
 */
export function validateTemplateTypes(
  template: string,
  context: TemplateTypeContext,
): TypeCheckError[] {
  const errors: TypeCheckError[] = []

  // Find all {{ expression }} blocks
  const exprRegex = /\{\{([^}]+)\}\}/g
  const matches = template.matchAll(exprRegex)

  for (const match of matches) {
    const expression = match[1].trim()

    // Skip if it contains filters (handled separately)
    if (expression.includes('|'))
      continue

    const result = typeCheckExpression(expression, context)
    if ('message' in result) {
      errors.push(result)
    }
  }

  return errors
}

// =============================================================================
// Type Definition Generation
// =============================================================================

/**
 * Generate TypeScript definition file for a template.
 *
 * This creates a .d.ts file that provides type information for IDE support.
 */
export function generateTypeDefinitions(
  templatePath: string,
  extracted: TypeExtractionResult,
): GeneratedTypes {
  const lines: string[] = [
    '// Auto-generated by stx - DO NOT EDIT',
    `// Source: ${templatePath}`,
    '',
    'declare module "*.stx" {',
  ]

  // Add interfaces
  for (const iface of extracted.interfaces) {
    lines.push(`  export interface ${iface.name} {`)
    for (const [propName, prop] of Object.entries(iface.properties)) {
      const optional = prop.optional ? '?' : ''
      const readonly = prop.readonly ? 'readonly ' : ''
      lines.push(`    ${readonly}${propName}${optional}: ${typeToString(prop.type)};`)
    }
    lines.push('  }')
    lines.push('')
  }

  // Add type aliases
  for (const alias of extracted.typeAliases) {
    lines.push(`  export type ${alias.name} = ${typeToString(alias.type)};`)
  }

  // Add render function type
  if (extracted.contextType) {
    lines.push('')
    lines.push(`  export function render(context: ${extracted.contextType.name}): Promise<string>;`)
  }
  else {
    lines.push('')
    lines.push('  export function render(context: Record<string, unknown>): Promise<string>;')
  }

  lines.push('}')

  const filename = templatePath.replace(/\.stx$/, '.d.ts')

  return {
    content: lines.join('\n'),
    filename,
  }
}

/**
 * Convert a TSType back to a TypeScript string representation.
 */
export function typeToString(type: TSType): string {
  switch (type.kind) {
    case 'primitive':
      return type.value || 'any'

    case 'array':
      return `Array<${typeToString(type.elementType!)}>`

    case 'object': {
      if (!type.properties || Object.keys(type.properties).length === 0) {
        return '{}'
      }
      const props = Object.entries(type.properties)
        .map(([name, prop]) => {
          const opt = prop.optional ? '?' : ''
          const ro = prop.readonly ? 'readonly ' : ''
          return `${ro}${name}${opt}: ${typeToString(prop.type)}`
        })
        .join('; ')
      return `{ ${props} }`
    }

    case 'union':
      return type.types!.map(t => typeToString(t)).join(' | ')

    case 'intersection':
      return type.types!.map(t => typeToString(t)).join(' & ')

    case 'literal':
      if (typeof type.literalValue === 'string') {
        return `'${type.literalValue}'`
      }
      return String(type.literalValue)

    case 'function': {
      const params = (type.parameters || [])
        .map((p) => {
          const opt = p.optional ? '?' : ''
          const rest = p.rest ? '...' : ''
          return `${rest}${p.name}${opt}: ${typeToString(p.type)}`
        })
        .join(', ')
      return `(${params}) => ${typeToString(type.returnType!)}`
    }

    case 'generic':
      return `${type.value}<${type.typeArguments!.map(t => typeToString(t)).join(', ')}>`

    case 'reference':
      return type.value || 'unknown'

    default:
      return 'unknown'
  }
}

// =============================================================================
// Template Processing with Types
// =============================================================================

/**
 * Process @types directive - extracts and removes type definitions.
 */
export function processTypesDirective(template: string): {
  template: string
  types: TypeExtractionResult
} {
  const types = extractTypesFromTemplate(template)

  // Remove @types blocks from template
  const cleanedTemplate = template.replace(/@types\s*[\s\S]*?@endtypes/g, '')

  return { template: cleanedTemplate, types }
}

/**
 * Compile-time type check a template.
 *
 * @returns Array of errors/warnings, empty if valid
 */
export function compileTimeTypeCheck(
  template: string,
  runtimeContext?: Record<string, unknown>,
): { errors: TypeCheckError[], warnings: TypeCheckWarning[] } {
  const { types } = processTypesDirective(template)
  const context = createTypeContext(types, runtimeContext)

  const errors = validateTemplateTypes(template, context)

  return { errors, warnings: context.warnings }
}
