import type { ComponentPropsSchema, CustomDirective, PropType } from './types'
import * as path from 'node:path'
import { ErrorCodes, inlineError } from './error-handling'
import { safeEvaluateObject } from './safe-evaluator'
import { renderComponentWithSlot } from './utils'

/**
 * Parse a props string that may contain HTML values
 * Handles complex cases like { content: "<p>Hello</p>", title: "Test" }
 */
function parsePropsString(propsString: string, context: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  // Remove outer braces and trim
  let inner = propsString.trim()
  if (inner.startsWith('{')) inner = inner.slice(1)
  if (inner.endsWith('}')) inner = inner.slice(0, -1)
  inner = inner.trim()

  if (!inner) return props

  // Parse key-value pairs respecting quotes and nested structures
  let pos = 0
  while (pos < inner.length) {
    // Skip whitespace
    while (pos < inner.length && /\s/.test(inner[pos])) pos++
    if (pos >= inner.length) break

    // Find key (identifier or quoted string)
    let key = ''
    if (inner[pos] === '"' || inner[pos] === '\'') {
      const quote = inner[pos]
      pos++
      while (pos < inner.length && inner[pos] !== quote) {
        if (inner[pos] === '\\' && pos + 1 < inner.length) {
          key += inner[pos + 1]
          pos += 2
        } else {
          key += inner[pos]
          pos++
        }
      }
      pos++ // Skip closing quote
    } else {
      while (pos < inner.length && /[\w$]/.test(inner[pos])) {
        key += inner[pos]
        pos++
      }
    }

    // Skip whitespace and colon
    while (pos < inner.length && /\s/.test(inner[pos])) pos++
    if (inner[pos] === ':') pos++
    while (pos < inner.length && /\s/.test(inner[pos])) pos++

    // Parse value
    let value: unknown
    const valueStart = pos

    if (inner[pos] === '"' || inner[pos] === '\'') {
      // Quoted string value - may contain HTML
      const quote = inner[pos]
      pos++
      let strValue = ''
      while (pos < inner.length && inner[pos] !== quote) {
        if (inner[pos] === '\\' && pos + 1 < inner.length) {
          strValue += inner[pos + 1]
          pos += 2
        } else {
          strValue += inner[pos]
          pos++
        }
      }
      pos++ // Skip closing quote
      value = strValue
    } else if (inner[pos] === '{') {
      // Nested object
      let depth = 1
      pos++
      while (pos < inner.length && depth > 0) {
        if (inner[pos] === '{') depth++
        else if (inner[pos] === '}') depth--
        else if (inner[pos] === '"' || inner[pos] === '\'') {
          const q = inner[pos]
          pos++
          while (pos < inner.length && inner[pos] !== q) {
            if (inner[pos] === '\\') pos++
            pos++
          }
        }
        pos++
      }
      const objStr = inner.slice(valueStart, pos)
      value = parsePropsString(objStr, context)
    } else if (inner[pos] === '[') {
      // Array
      let depth = 1
      pos++
      while (pos < inner.length && depth > 0) {
        if (inner[pos] === '[') depth++
        else if (inner[pos] === ']') depth--
        else if (inner[pos] === '"' || inner[pos] === '\'') {
          const q = inner[pos]
          pos++
          while (pos < inner.length && inner[pos] !== q) {
            if (inner[pos] === '\\') pos++
            pos++
          }
        }
        pos++
      }
      const arrStr = inner.slice(valueStart, pos)
      try {
        value = JSON.parse(arrStr.replace(/'/g, '"'))
      } catch {
        value = arrStr
      }
    } else {
      // Primitive value (number, boolean, null, undefined, or variable reference)
      let rawValue = ''
      while (pos < inner.length && inner[pos] !== ',' && !/\s/.test(inner[pos])) {
        rawValue += inner[pos]
        pos++
      }
      rawValue = rawValue.trim()

      // Try to parse as primitive
      if (rawValue === 'true') value = true
      else if (rawValue === 'false') value = false
      else if (rawValue === 'null') value = null
      else if (rawValue === 'undefined') value = undefined
      else if (/^-?\d+(\.\d+)?$/.test(rawValue)) value = Number(rawValue)
      else if (rawValue in context) value = context[rawValue]
      else value = rawValue
    }

    if (key) {
      props[key] = value
    }

    // Skip whitespace and comma
    while (pos < inner.length && /\s/.test(inner[pos])) pos++
    if (inner[pos] === ',') pos++
  }

  return props
}

// =============================================================================
// Component System Documentation
// =============================================================================
//
// COMPONENT RESOLUTION ORDER:
// 1. Check options.componentsDir (configured directory)
// 2. Check components/ directory relative to current template
// 3. Check default components directory from stx.config.ts
//
// SLOT SUPPORT:
// Currently only the default slot is supported.
// Named slots (like Vue's <slot name="header">) are NOT supported.
// The slot content is available via {{ slot }} in the component template.
//
// LIFECYCLE HOOKS:
// Components are stateless templates - no lifecycle hooks are available.
// For SSR with client-side hydration, use web components instead.
//
// PROP VALIDATION:
// Optional prop validation is available by registering component schemas.
// See validateComponentProps() and ComponentPropsSchema type.
//
// CACHING:
// Component templates are cached (not rendered output).
// Same component with different props will re-render but use cached template.
//
// =============================================================================

/**
 * Validate component props against a schema
 *
 * @param props - The props to validate
 * @param schema - The props schema
 * @param componentName - Component name for error messages
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const schema: ComponentPropsSchema = {
 *   title: { type: 'string', required: true },
 *   count: { type: 'number', default: 0 }
 * }
 * const errors = validateComponentProps({ title: 'Hello' }, schema, 'MyComponent')
 * ```
 */
export function validateComponentProps(
  props: Record<string, any>,
  schema: ComponentPropsSchema,
  componentName: string,
): string[] {
  const errors: string[] = []

  for (const [propName, definition] of Object.entries(schema)) {
    const value = props[propName]

    // Check required props
    if (definition.required && (value === undefined || value === null)) {
      errors.push(`Component "${componentName}": Missing required prop "${propName}"`)
      continue
    }

    // Skip validation for undefined optional props
    if (value === undefined || value === null) {
      continue
    }

    // Check type
    const types = Array.isArray(definition.type) ? definition.type : [definition.type]
    if (!types.includes('any')) {
      const actualType = getActualType(value)
      if (!types.includes(actualType as PropType)) {
        errors.push(
          `Component "${componentName}": Prop "${propName}" expected ${types.join(' | ')}, got ${actualType}`,
        )
      }
    }

    // Run custom validator
    if (definition.validator && !definition.validator(value)) {
      errors.push(`Component "${componentName}": Prop "${propName}" failed custom validation`)
    }
  }

  return errors
}

/**
 * Apply default values to props from schema
 */
export function applyPropDefaults(
  props: Record<string, any>,
  schema: ComponentPropsSchema,
): Record<string, any> {
  const result = { ...props }

  for (const [propName, definition] of Object.entries(schema)) {
    if (result[propName] === undefined && definition.default !== undefined) {
      result[propName] = typeof definition.default === 'function'
        ? definition.default()
        : definition.default
    }
  }

  return result
}

/**
 * Get the actual type of a value
 */
function getActualType(value: any): string {
  if (Array.isArray(value))
    return 'array'
  if (value === null)
    return 'null'
  return typeof value
}

export const componentDirective: CustomDirective = {
  name: 'component',
  handler: async (content, params, context, filePath) => {
    if (params.length < 1) {
      return inlineError('Component', 'component directive requires at least the component name', ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
    }

    // Get component name (first parameter)
    const componentName = params[0].replace(/['"]/g, '')

    // Get props object (second parameter) if it exists
    let props: Record<string, unknown> = {}
    if (params.length > 1) {
      try {
        // Extract params as a single string first
        const propsString = params.slice(1).join(',').trim()

        // Check if starts with object literal marker
        if (propsString.startsWith('{')) {
          // Use safe evaluation which handles complex expressions including HTML values
          props = safeEvaluateObject(propsString, context)

          // If safe evaluation returned empty, try parsing with improved JSON handling
          if (Object.keys(props).length === 0) {
            props = parsePropsString(propsString, context)
          }
        }
        else {
          // It might be a variable name
          const varName = propsString.trim()
          const contextValue = context[varName]
          if (contextValue && typeof contextValue === 'object' && !Array.isArray(contextValue)) {
            props = contextValue as Record<string, unknown>
          }
        }
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Component props parsing error:', message)
        return inlineError('Component', `Error parsing component props: ${message}`, ErrorCodes.EVALUATION_ERROR)
      }
    }

    // Get component options from context or use defaults
    const options = context.__stx_options || {}
    const componentsDir = options.componentsDir || 'components'
    const dependencies = new Set<string>()

    // Render the component
    try {
      const rendered = await renderComponentWithSlot(
        componentName,
        props,
        '', // No slot content for @component directive
        componentsDir,
        context,
        filePath,
        options,
        undefined,
        dependencies,
      )

      return rendered
    }
    catch (error: any) {
      console.error('Component rendering error:', error)
      return inlineError('Component', `Error rendering component: ${error.message}`, ErrorCodes.COMPONENT_RENDER_ERROR)
    }
  },
  hasEndTag: false,
}

/**
 * Register component directives
 */
export function registerComponentDirectives(): CustomDirective[] {
  return [componentDirective]
}
