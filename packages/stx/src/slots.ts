/**
 * STX Slots Module
 *
 * Provides Vue-style named slots and scoped slots support.
 *
 * @module slots
 *
 * ## Named Slots
 *
 * Parent component:
 * ```html
 * <Card>
 *   <template #header>
 *     <h1>Title</h1>
 *   </template>
 *
 *   <p>Default slot content</p>
 *
 *   <template #footer>
 *     <button>Submit</button>
 *   </template>
 * </Card>
 * ```
 *
 * Child component (Card.stx):
 * ```html
 * <div class="card">
 *   <header>
 *     <slot name="header">Default Header</slot>
 *   </header>
 *   <main>
 *     <slot />
 *   </main>
 *   <footer>
 *     <slot name="footer" />
 *   </footer>
 * </div>
 * ```
 *
 * ## Scoped Slots
 *
 * Parent component:
 * ```html
 * <DataTable :items="users">
 *   <template #row="{ item, index }">
 *     <td>{{ index + 1 }}</td>
 *     <td>{{ item.name }}</td>
 *   </template>
 * </DataTable>
 * ```
 *
 * Child component (DataTable.stx):
 * ```html
 * <table>
 *   @foreach (items as item, index)
 *     <tr>
 *       <slot name="row" :item="item" :index="index">
 *         <td>{{ item }}</td>
 *       </slot>
 *     </tr>
 *   @endforeach
 * </table>
 * ```
 */

import type { StxOptions } from './types'

// =============================================================================
// Types
// =============================================================================

export interface SlotDefinition {
  /** Slot name (empty string for default slot) */
  name: string
  /** Slot content (the template) */
  content: string
  /** Scoped slot props binding (e.g., "{ item, index }") */
  propsBinding?: string
}

export interface SlotProps {
  [key: string]: unknown
}

export interface ParsedSlots {
  /** Default slot content */
  default: string
  /** Named slots */
  named: Map<string, SlotDefinition>
}

// =============================================================================
// Slot Parsing
// =============================================================================

/**
 * Parse slot content from component children.
 *
 * Extracts:
 * - Default slot content (anything not in a template#name)
 * - Named slots from <template #name> or <template v-slot:name>
 * - Scoped slot bindings from <template #name="{ props }">
 */
export function parseSlots(childContent: string): ParsedSlots {
  const result: ParsedSlots = {
    default: '',
    named: new Map(),
  }

  let workingContent = childContent

  // Match named slot templates: <template #name="binding"> or <template v-slot:name="binding">
  // Patterns:
  // - <template #header>...</template>
  // - <template #row="{ item }">...</template>
  // - <template v-slot:header>...</template>
  // - <template slot="header">...</template>
  const namedSlotRegex = /<template\s+(?:#([a-zA-Z][\w-]*)|v-slot:([a-zA-Z][\w-]*)|slot="([a-zA-Z][\w-]*)")(?:\s*=\s*"([^"]*)")?[^>]*>([\s\S]*?)<\/template>/gi

  let match
  while ((match = namedSlotRegex.exec(childContent)) !== null) {
    const [fullMatch, hashName, vSlotName, slotAttrName, propsBinding, content] = match
    const slotName = hashName || vSlotName || slotAttrName

    result.named.set(slotName, {
      name: slotName,
      content: content.trim(),
      propsBinding: propsBinding || undefined,
    })

    // Remove this template from working content (leaving default slot)
    workingContent = workingContent.replace(fullMatch, '')
  }

  // Remaining content is the default slot
  result.default = workingContent.trim()

  return result
}

/**
 * Parse slot props from a slot element.
 *
 * Parses: <slot name="row" :item="item" :index="index" />
 * Returns: { name: 'row', props: { item: 'item', index: 'index' } }
 */
export function parseSlotElement(slotTag: string): {
  name: string
  props: Record<string, string>
  defaultContent: string
} {
  // Extract slot name
  const nameMatch = slotTag.match(/name\s*=\s*["']([^"']+)["']/)
  const name = nameMatch ? nameMatch[1] : ''

  // Extract props (attributes starting with :)
  const props: Record<string, string> = {}
  const propsRegex = /:([a-zA-Z][\w-]*)\s*=\s*["']([^"']+)["']/g
  let propMatch
  while ((propMatch = propsRegex.exec(slotTag)) !== null) {
    props[propMatch[1]] = propMatch[2]
  }

  // Extract default content (for <slot>default</slot>)
  const contentMatch = slotTag.match(/<slot[^>]*>([\s\S]*?)<\/slot>/i)
  const defaultContent = contentMatch ? contentMatch[1].trim() : ''

  return { name, props, defaultContent }
}

// =============================================================================
// Slot Rendering
// =============================================================================

/**
 * Render a slot with its content and props.
 *
 * @param slotDef - The slot definition from the parent
 * @param slotProps - Props passed from the child's <slot :prop="value">
 * @param defaultContent - Default content if no slot provided
 * @param context - The current template context
 */
export async function renderSlot(
  slotDef: SlotDefinition | undefined,
  slotProps: SlotProps,
  defaultContent: string,
  context: Record<string, unknown>,
): Promise<string> {
  // If no slot provided, use default content
  if (!slotDef) {
    return defaultContent
  }

  let content = slotDef.content

  // If this is a scoped slot, we need to inject the props into the content
  if (slotDef.propsBinding && Object.keys(slotProps).length > 0) {
    // Parse the props binding (e.g., "{ item, index }" or "props")
    const binding = slotDef.propsBinding.trim()

    // Create a new context with the slot props
    const slotContext = { ...context }

    if (binding.startsWith('{') && binding.endsWith('}')) {
      // Destructured binding: { item, index }
      const propNames = binding
        .slice(1, -1)
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)

      for (const propName of propNames) {
        // Handle renaming: { item: myItem }
        const [key, alias] = propName.split(':').map(s => s.trim())
        const actualKey = alias || key
        if (slotProps[key] !== undefined) {
          slotContext[actualKey] = slotProps[key]
        }
      }
    } else {
      // Single binding: slotProps or props
      slotContext[binding] = slotProps
    }

    // Process the content with the slot context
    // We need to replace {{ expressions }} with the slot props
    content = processSlotExpressions(content, slotContext)
  }

  return content
}

/**
 * Process expressions in slot content with the slot context.
 */
function processSlotExpressions(
  content: string,
  context: Record<string, unknown>,
): string {
  // Replace {{ expression }} with evaluated values
  return content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr: string) => {
    try {
      // Simple property access and expressions
      const trimmedExpr = expr.trim()

      // Handle simple property access (item.name, index + 1, etc.)
      const result = evaluateSimpleExpression(trimmedExpr, context)
      return String(result ?? '')
    } catch {
      // If evaluation fails, return the original expression
      return `{{ ${expr} }}`
    }
  })
}

/**
 * Evaluate a simple expression in a context.
 */
function evaluateSimpleExpression(
  expr: string,
  context: Record<string, unknown>,
): unknown {
  // Handle simple cases without creating a function
  // Property access: item.name
  if (/^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)*$/.test(expr)) {
    const parts = expr.split('.')
    let value: unknown = context
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }
    return value
  }

  // Simple arithmetic: index + 1
  const arithmeticMatch = expr.match(/^([a-zA-Z_$][\w$]*)\s*([+\-*/])\s*(\d+)$/)
  if (arithmeticMatch) {
    const [, varName, op, numStr] = arithmeticMatch
    const varValue = context[varName]
    const num = parseInt(numStr, 10)
    if (typeof varValue === 'number') {
      switch (op) {
        case '+': return varValue + num
        case '-': return varValue - num
        case '*': return varValue * num
        case '/': return varValue / num
      }
    }
  }

  // For more complex expressions, use Function (carefully)
  try {
    const keys = Object.keys(context)
    const values = Object.values(context)
    const fn = new Function(...keys, `return ${expr}`)
    return fn(...values)
  } catch {
    return undefined
  }
}

// =============================================================================
// Slot Processing in Templates
// =============================================================================

/**
 * Process all slots in a component template.
 *
 * Replaces <slot> elements with the appropriate content from parsed slots.
 */
export async function processSlots(
  template: string,
  parsedSlots: ParsedSlots,
  context: Record<string, unknown>,
): Promise<string> {
  let result = template

  // Process named slots with props: <slot name="row" :item="item" :index="index">default</slot>
  const namedSlotRegex = /<slot\s+name\s*=\s*["']([^"']+)["']([^>]*?)(?:\/>|>([\s\S]*?)<\/slot>)/gi

  result = await replaceAsync(result, namedSlotRegex, async (match, name, attrs, defaultContent) => {
    const slotDef = parsedSlots.named.get(name)
    const defaultFallback = defaultContent?.trim() || ''

    // Parse props from the slot element
    const propsStr = attrs || ''
    const props: SlotProps = {}
    const propsRegex = /:([a-zA-Z_$][\w$-]*)\s*=\s*["']([^"']+)["']/g
    let propMatch
    while ((propMatch = propsRegex.exec(propsStr)) !== null) {
      const propName = propMatch[1]
      const propExpr = propMatch[2]
      // Evaluate the prop expression in the current context
      props[propName] = evaluateSimpleExpression(propExpr, context)
    }

    return await renderSlot(slotDef, props, defaultFallback, context)
  })

  // Process default slot: <slot /> or <slot></slot> or <slot>default</slot>
  const defaultSlotRegex = /<slot\s*(?:\/>|>([\s\S]*?)<\/slot>)/gi

  result = result.replace(defaultSlotRegex, (match, defaultContent) => {
    // Check if this is NOT a named slot (we already processed those)
    if (match.includes('name=')) return match

    const fallback = defaultContent?.trim() || ''
    return parsedSlots.default || fallback
  })

  return result
}

/**
 * Helper for async regex replacement.
 */
async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (...args: string[]) => Promise<string>,
): Promise<string> {
  const promises: Promise<string>[] = []
  const matches: { match: string; index: number }[] = []

  str.replace(regex, (match, ...args) => {
    const index = args[args.length - 2] as number
    matches.push({ match, index })
    promises.push(asyncFn(match, ...args.slice(0, -2)))
    return match
  })

  const results = await Promise.all(promises)

  // Replace in reverse order to preserve indices
  let result = str
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match, index } = matches[i]
    result = result.slice(0, index) + results[i] + result.slice(index + match.length)
  }

  return result
}

// =============================================================================
// Integration with Component Rendering
// =============================================================================

/**
 * Extract named slots from component children content.
 * This is called when processing a component to separate slot content.
 */
export function extractSlotContent(childContent: string): {
  defaultSlot: string
  namedSlots: Map<string, SlotDefinition>
} {
  const parsed = parseSlots(childContent)
  return {
    defaultSlot: parsed.default,
    namedSlots: parsed.named,
  }
}

/**
 * Apply slots to a component template.
 * This replaces <slot> elements with the provided slot content.
 */
export async function applySlots(
  componentTemplate: string,
  defaultSlotContent: string,
  namedSlots: Map<string, SlotDefinition>,
  context: Record<string, unknown>,
): Promise<string> {
  const parsedSlots: ParsedSlots = {
    default: defaultSlotContent,
    named: namedSlots,
  }

  return await processSlots(componentTemplate, parsedSlots, context)
}
