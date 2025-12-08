/**
 * STX Story - Component analyzer
 * Extracts props, slots, and metadata from .stx components
 * Uses the parser module for accurate tokenization
 */

import type { AnalyzedComponent, AnalyzedSlot, DirectiveUsage, StoryAnalyzedProp } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import { parseScriptDeclarations } from '../../parser'

/**
 * Analyze a component file and extract metadata
 */
export async function analyzeComponentFile(filePath: string): Promise<AnalyzedComponent> {
  const content = await fs.promises.readFile(filePath, 'utf-8')
  const name = path.basename(filePath, '.stx')

  return analyzeComponent(content, name, filePath)
}

/**
 * Analyze component content and extract metadata
 */
export function analyzeComponent(
  content: string,
  name: string,
  filePath: string,
): AnalyzedComponent {
  const props = extractProps(content)
  const slots = extractSlots(content)
  const description = extractDescription(content)
  const dependencies = extractDependencies(content)
  const cssClasses = extractCssClasses(content)
  const directives = extractDirectives(content)

  return {
    name,
    path: filePath,
    description,
    props,
    slots,
    dependencies,
    cssClasses,
    directives,
  }
}

/**
 * Extract props from script tags using proper tokenization
 */
export function extractProps(content: string): StoryAnalyzedProp[] {
  const props: StoryAnalyzedProp[] = []

  // Find script tags
  const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  if (!scriptMatch)
    return props

  const scriptContent = scriptMatch[1]

  // Use the parser module for accurate declaration extraction
  try {
    const declarations = parseScriptDeclarations(scriptContent)

    for (const decl of declarations) {
      // Skip internal variables (starting with _ or __)
      if (decl.name.startsWith('_'))
        continue

      // Skip functions (we want props/state, not methods)
      if (decl.type === 'function')
        continue

      // Extract JSDoc from the content before the declaration
      const jsdoc = extractJsDocBefore(scriptContent, decl.start)

      const prop: StoryAnalyzedProp = {
        name: decl.name,
        type: inferType(decl.value || '', undefined, jsdoc),
        required: false,
        default: decl.value ? parseDefaultValue(decl.value) : undefined,
      }

      // Extract JSDoc info
      if (jsdoc) {
        const typeMatch = jsdoc.match(/@type\s+\{([^}]+)\}/i)
        if (typeMatch) {
          prop.type = typeMatch[1].trim()
          // Check for union types (enums)
          if (prop.type.includes('|')) {
            prop.options = prop.type
              .split('|')
              .map((t: string) => t.trim().replace(/['"]/g, ''))
              .filter((t: string) => t !== '')
          }
        }

        const requiredMatch = jsdoc.match(/@required/i)
        if (requiredMatch) {
          prop.required = true
        }

        // Extract description (lines without @ tags)
        const descLines = jsdoc
          .split('\n')
          .map((line: string) => line.trim().replace(/^\*\s*/, ''))
          .filter((line: string) => !line.startsWith('@') && line.length > 0)
        if (descLines.length > 0) {
          prop.description = descLines.join(' ').trim()
        }
      }

      props.push(prop)
    }
  }
  catch {
    // Fallback to regex-based extraction if parser fails
    return extractPropsRegex(scriptContent)
  }

  return props
}

/**
 * Extract JSDoc comment before a position
 */
function extractJsDocBefore(content: string, position: number): string | undefined {
  // Look backwards from position for /** ... */
  const before = content.slice(0, position)
  const match = before.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/)
  return match ? match[1] : undefined
}

/**
 * Fallback regex-based prop extraction
 */
function extractPropsRegex(scriptContent: string): StoryAnalyzedProp[] {
  const props: StoryAnalyzedProp[] = []

  // Match variable declarations with optional JSDoc
  const propRegex = /(?:\/\*\*\s*([\s\S]*?)\s*\*\/\s*)?(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*([^=]+))?\s*=\s*([^;\n]+)/g

  let match = propRegex.exec(scriptContent)
  while (match !== null) {
    const [, jsdoc, propName, typeAnnotation, defaultValue] = match

    if (propName.startsWith('_'))
      continue

    const prop: StoryAnalyzedProp = {
      name: propName,
      type: inferType(defaultValue, typeAnnotation, jsdoc),
      required: false,
      default: parseDefaultValue(defaultValue),
    }

    if (jsdoc) {
      const typeMatch = jsdoc.match(/@type\s+\{([^}]+)\}/i)
      if (typeMatch) {
        prop.type = typeMatch[1].trim()
        if (prop.type.includes('|')) {
          prop.options = prop.type
            .split('|')
            .map(t => t.trim().replace(/['"]/g, ''))
            .filter(t => t !== '')
        }
      }

      const requiredMatch = jsdoc.match(/@required/i)
      if (requiredMatch) {
        prop.required = true
      }

      const descLines = jsdoc
        .split('\n')
        .map(line => line.trim().replace(/^\*\s*/, ''))
        .filter(line => !line.startsWith('@') && line.length > 0)
      if (descLines.length > 0) {
        prop.description = descLines.join(' ').trim()
      }
    }

    props.push(prop)
    match = propRegex.exec(scriptContent)
  }

  return props
}

/**
 * Infer type from default value
 */
function inferType(defaultValue: string, typeAnnotation?: string, jsdoc?: string): string {
  // Check JSDoc first
  if (jsdoc) {
    const typeMatch = jsdoc.match(/@type\s+\{([^}]+)\}/i)
    if (typeMatch)
      return typeMatch[1].trim()
  }

  // Check TypeScript annotation
  if (typeAnnotation) {
    return typeAnnotation.trim()
  }

  // Infer from default value
  const trimmed = defaultValue.trim()

  if (trimmed === 'true' || trimmed === 'false')
    return 'boolean'
  if (/^['"`]/.test(trimmed))
    return 'string'
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed))
    return 'number'
  if (trimmed.startsWith('['))
    return 'array'
  if (trimmed.startsWith('{'))
    return 'object'
  if (trimmed === 'null')
    return 'null'
  if (trimmed === 'undefined')
    return 'undefined'

  return 'any'
}

/**
 * Parse default value from code
 */
function parseDefaultValue(value: string): any {
  const trimmed = value.trim()

  try {
    // Handle simple literals
    if (trimmed === 'true')
      return true
    if (trimmed === 'false')
      return false
    if (trimmed === 'null')
      return null
    if (trimmed === 'undefined')
      return undefined

    // Handle numbers
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return Number(trimmed)
    }

    // Handle strings
    const isString = /^['"`].*['"`]$/.test(trimmed)
    if (isString) {
      return trimmed.slice(1, -1)
    }

    // Handle arrays and objects (simple cases)
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      // Try to parse as JSON (convert single quotes to double)
      const jsonStr = trimmed.replace(/'/g, '"')
      try {
        return JSON.parse(jsonStr)
      }
      catch {
        return trimmed
      }
    }

    return trimmed
  }
  catch {
    return trimmed
  }
}

/**
 * Extract slots from template
 */
export function extractSlots(content: string): AnalyzedSlot[] {
  const slots: AnalyzedSlot[] = []
  const seenSlots = new Set<string>()

  // Match {{ slot }} for default slot
  if (/\{\{\s*slot\s*\}\}/.test(content)) {
    slots.push({ name: 'default' })
    seenSlots.add('default')
  }

  // Match <slot> tags
  const slotTagRegex = /<slot\s*(?:name\s*=\s*["']([^"']+)["'])?\s*\/?>/gi
  let match = slotTagRegex.exec(content)
  while (match !== null) {
    const slotName = match[1] || 'default'
    if (!seenSlots.has(slotName)) {
      slots.push({ name: slotName })
      seenSlots.add(slotName)
    }
    match = slotTagRegex.exec(content)
  }

  return slots
}

/**
 * Extract component description from comments
 */
export function extractDescription(content: string): string | undefined {
  // Look for HTML comment at the top
  const htmlCommentMatch = content.match(/^\s*<!--\s*([\s\S]*?)\s*-->/)
  if (htmlCommentMatch) {
    return htmlCommentMatch[1].trim()
  }

  // Look for JSDoc in script tag
  const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  if (scriptMatch) {
    const jsdocMatch = scriptMatch[1].match(/^\s*\/\*\*\s*([\s\S]*?)\s*\*\//)
    if (jsdocMatch) {
      // Extract description (lines without @ tags)
      const descLines = jsdocMatch[1]
        .split('\n')
        .map(line => line.trim().replace(/^\*\s*/, ''))
        .filter(line => !line.startsWith('@') && line.length > 0)
      if (descLines.length > 0) {
        return descLines.join(' ').trim()
      }
    }
  }

  return undefined
}

/**
 * Extract component dependencies (other components used)
 */
export function extractDependencies(content: string): string[] {
  const deps: string[] = []
  const seen = new Set<string>()

  // Match import statements
  const importRegex = /import\s+(\w+)\s+from\s+['"][^'"]+\.stx['"]/g
  let match = importRegex.exec(content)
  while (match !== null) {
    const componentName = match[1]
    if (!seen.has(componentName)) {
      deps.push(componentName)
      seen.add(componentName)
    }
    match = importRegex.exec(content)
  }

  // Match PascalCase component tags in template
  const componentTagRegex = /<([A-Z][a-zA-Z0-9]*)\b/g
  match = componentTagRegex.exec(content)
  while (match !== null) {
    const componentName = match[1]
    if (!seen.has(componentName)) {
      deps.push(componentName)
      seen.add(componentName)
    }
    match = componentTagRegex.exec(content)
  }

  // Match @component directives
  const componentDirectiveRegex = /@component\s*\(\s*['"]([^'"]+)['"]/g
  match = componentDirectiveRegex.exec(content)
  while (match !== null) {
    const componentName = match[1]
    if (!seen.has(componentName)) {
      deps.push(componentName)
      seen.add(componentName)
    }
    match = componentDirectiveRegex.exec(content)
  }

  return deps
}

/**
 * Extract CSS classes from template (for Headwind integration)
 */
export function extractCssClasses(content: string): string[] {
  const classes: string[] = []
  const seen = new Set<string>()

  // Match class attributes
  const classRegex = /class\s*=\s*["']([^"']+)["']/gi
  let match = classRegex.exec(content)
  while (match !== null) {
    const classValue = match[1]
    for (const cls of classValue.split(/\s+/)) {
      const trimmed = cls.trim()
      // Skip template expressions
      if (trimmed && !trimmed.includes('{{') && !seen.has(trimmed)) {
        classes.push(trimmed)
        seen.add(trimmed)
      }
    }
    match = classRegex.exec(content)
  }

  return classes
}

/**
 * Extract directive usage from template
 */
export function extractDirectives(content: string): DirectiveUsage[] {
  const directives: Map<string, number> = new Map()

  // Common STX directives to detect
  const directivePatterns = [
    '@if',
    '@else',
    '@elseif',
    '@endif',
    '@unless',
    '@endunless',
    '@foreach',
    '@endforeach',
    '@for',
    '@endfor',
    '@while',
    '@endwhile',
    '@switch',
    '@case',
    '@default',
    '@endswitch',
    '@component',
    '@endcomponent',
    '@slot',
    '@endslot',
    '@include',
    '@extends',
    '@section',
    '@endsection',
    '@yield',
    '@push',
    '@endpush',
    '@stack',
    '@once',
    '@endonce',
    '@auth',
    '@endauth',
    '@guest',
    '@endguest',
    '@can',
    '@endcan',
    '@cannot',
    '@endcannot',
    '@env',
    '@endenv',
    '@production',
    '@endproduction',
    '@js',
    '@endjs',
    '@ts',
    '@endts',
    '@css',
    '@endcss',
    '@json',
    '@class',
    '@style',
    '@checked',
    '@selected',
    '@disabled',
    '@readonly',
    '@required',
  ]

  for (const directive of directivePatterns) {
    // Count occurrences (case-insensitive)
    const regex = new RegExp(directive.replace('@', '@'), 'gi')
    const matches = content.match(regex)
    if (matches && matches.length > 0) {
      const name = directive.slice(1) // Remove @ prefix
      // Only count opening directives, not closing ones
      if (!name.startsWith('end')) {
        directives.set(name, (directives.get(name) || 0) + matches.length)
      }
    }
  }

  // Convert to array
  const result: DirectiveUsage[] = []
  for (const [name, count] of directives) {
    result.push({ name, count })
  }

  // Sort by count descending
  result.sort((a, b) => b.count - a.count)

  return result
}
