/**
 * Dynamic Component Support
 *
 * Handles `<component :is="expr">` syntax for runtime component switching.
 * Server-side: evaluates the expression and resolves the component.
 * Client-side: signals runtime watches :is binding and swaps content.
 *
 * @module dynamic-components
 */

import { renderComponentWithSlot, resolveTemplatePath } from './utils'
import { safeEvaluate } from './safe-evaluator'
import type { StxOptions } from './types'

// =============================================================================
// Server-Side Processing
// =============================================================================

/**
 * Process `<component :is="expr">` tags in the template.
 * Evaluates the :is expression against the context to determine which
 * component to render, then resolves and renders that component inline.
 *
 * @param template - The template string
 * @param context - Current template context
 * @param filePath - Current file path
 * @param options - stx options
 * @param dependencies - Dependency tracking set
 * @returns Processed template with dynamic components resolved
 */
export async function processDynamicComponents(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies?: Set<string>,
): Promise<string> {
  let result = template

  // Match <component :is="expr"> or <component v-bind:is="expr">
  const componentPattern = /<component\s+(?::is|v-bind:is)\s*=\s*"([^"]*)"([^>]*)>([\s\S]*?)<\/component>/gi

  const matches: Array<{
    full: string
    expr: string
    attrs: string
    slotContent: string
    index: number
  }> = []

  let match: RegExpExecArray | null
  while ((match = componentPattern.exec(result)) !== null) {
    matches.push({
      full: match[0],
      expr: match[1],
      attrs: match[2],
      slotContent: match[3],
      index: match.index,
    })
  }

  // Process matches in reverse order to preserve indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]

    try {
      // Evaluate the :is expression
      const componentName = safeEvaluate<string>(m.expr, context)

      if (!componentName || typeof componentName !== 'string') {
        // Could not resolve — leave a placeholder comment
        const replacement = `<!-- dynamic component: could not resolve "${m.expr}" -->`
        result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
        continue
      }

      // Parse additional props from attributes
      const propsStr = m.attrs.trim()
      const props: Record<string, any> = {}
      const propsPattern = /(?::([a-zA-Z_][a-zA-Z0-9_-]*)|([a-zA-Z_][a-zA-Z0-9_-]*))\s*=\s*"([^"]*)"/g
      let propMatch: RegExpExecArray | null
      while ((propMatch = propsPattern.exec(propsStr)) !== null) {
        const propName = propMatch[1] || propMatch[2]
        const propValue = propMatch[3]

        if (propMatch[1]) {
          // Dynamic prop (bound with :)
          try {
            props[propName] = safeEvaluate(propValue, context)
          }
          catch {
            props[propName] = propValue
          }
        }
        else {
          // Static prop
          props[propName] = propValue
        }
      }

      // Render the resolved component
      const componentsDir = options.componentsDir || 'components'
      const rendered = await renderComponentWithSlot(
        componentName,
        props,
        m.slotContent,
        componentsDir,
        context,
        filePath,
        options,
        new Set(),
        dependencies ?? new Set(),
      )

      result = result.slice(0, m.index) + rendered + result.slice(m.index + m.full.length)
    }
    catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const replacement = `<!-- dynamic component error: ${errorMsg} -->`
      result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
    }
  }

  // Also handle self-closing <component :is="expr" />
  result = await processSelfClosingDynamicComponents(result, context, filePath, options, dependencies)

  return result
}

/**
 * Process self-closing `<component :is="expr" />` tags.
 */
async function processSelfClosingDynamicComponents(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies?: Set<string>,
): Promise<string> {
  let result = template

  const pattern = /<component\s+(?::is|v-bind:is)\s*=\s*"([^"]*)"([^>]*?)\/>/gi
  const matches: Array<{ full: string, expr: string, attrs: string, index: number }> = []

  let match: RegExpExecArray | null
  while ((match = pattern.exec(result)) !== null) {
    matches.push({
      full: match[0],
      expr: match[1],
      attrs: match[2],
      index: match.index,
    })
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]

    try {
      const componentName = safeEvaluate<string>(m.expr, context)

      if (!componentName || typeof componentName !== 'string') {
        const replacement = `<!-- dynamic component: could not resolve "${m.expr}" -->`
        result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
        continue
      }

      const componentsDir = options.componentsDir || 'components'
      const rendered = await renderComponentWithSlot(
        componentName,
        {},
        '',
        componentsDir,
        context,
        filePath,
        options,
        new Set(),
        dependencies ?? new Set(),
      )

      result = result.slice(0, m.index) + rendered + result.slice(m.index + m.full.length)
    }
    catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const replacement = `<!-- dynamic component error: ${errorMsg} -->`
      result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
    }
  }

  return result
}
