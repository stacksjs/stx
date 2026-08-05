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

function escapeHtmlComment(value: string): string {
  return value
    .replace(/--/g, '- -')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * HTML elements `<component :is>` may resolve to.
 *
 * The polymorphic-`as` pattern the shipped component library is built on names
 * an ELEMENT, not a component: 26 of the 91 components in @stacksjs/components
 * render `<component :is="{{ as }}">` where `as` defaults to `div` (13 of them),
 * `button` (4), `ul`, `li`, `label`, `span`, `p` or `h3`. Not one of them names a
 * component file. Before this list existed there was no element path at all, so
 * every one of those resolved to a "could not resolve" comment that also
 * swallowed its slot content (stacksjs/stx#1826).
 *
 * Membership here decides ELEMENT vs COMPONENT, and it is checked first, so a
 * component file named `div.stx` is unreachable through `:is`. That is the
 * deliberate trade: an element name in `:is` is the documented pattern and a
 * lowercase component file shadowing an HTML tag is not.
 */
const HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del',
  'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'iframe',
  'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'mark', 'menu', 'meter', 'nav',
  'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt',
  'ruby', 's', 'samp', 'section', 'select', 'small', 'span', 'strong', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'video',
])

/** Elements that must not be given a closing tag. */
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

/**
 * Resolve the `:is` expression to a name.
 *
 * `safeEvaluate` reads the expression as a VARIABLE, which is right for
 * `:is="as"` but wrong for `:is="div"` — and `:is="div"` is what the template
 * pipeline produces, because `:is="{{ as }}"` has already been interpolated by
 * the time this module runs. That case evaluated to undefined and took the
 * "could not resolve" branch, which is #1826.
 *
 * So: try the variable first (an app may legitimately hold a name in one), and
 * fall back to the literal text when the expression is itself a bare
 * tag/component identifier.
 */
function resolveIsName(expr: string, context: Record<string, any>): string | null {
  const evaluated = safeEvaluate<string>(expr, context)
  if (evaluated && typeof evaluated === 'string')
    return evaluated

  // Only a known element name is taken literally. Widening this to any bare
  // identifier would turn a typo — `:is="nope"` — into a component lookup whose
  // failure is a rendered "[Error loading component: ENOENT … open 'nope']"
  // string carrying an absolute filesystem path into the page. Unresolvable
  // stays unresolvable, and keeps the placeholder comment it always had.
  const literal = expr.trim()
  return HTML_TAGS.has(literal) ? literal : null
}

/**
 * Render `name` as a plain HTML element carrying the tag's attributes.
 *
 * Attributes are passed through verbatim rather than re-serialized from the
 * parsed prop map: the map lowercases nothing, drops valueless attributes, and
 * cannot represent a binding, so rebuilding from it loses `aria-hidden`,
 * `:class` and friends. The one thing that must go is the `:is` binding itself.
 */
function renderAsElement(name: string, attrs: string, slotContent: string): string {
  const cleanedAttrs = attrs.replace(/\s*(?::is|v-bind:is)\s*=\s*"[^"]*"/gi, '').trim()
  const open = cleanedAttrs ? `<${name} ${cleanedAttrs}>` : `<${name}>`
  if (VOID_TAGS.has(name))
    return cleanedAttrs ? `<${name} ${cleanedAttrs}>` : `<${name}>`
  return `${open}${slotContent}</${name}>`
}

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
      const componentName = resolveIsName(m.expr, context)

      if (!componentName || typeof componentName !== 'string') {
        // Could not resolve — leave a placeholder comment
        const replacement = `<!-- dynamic component: could not resolve "${escapeHtmlComment(m.expr)}" -->`
        result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
        continue
      }

      // An element, not a component: emit real markup and keep the slot.
      if (HTML_TAGS.has(componentName)) {
        const rendered = renderAsElement(componentName, m.attrs, m.slotContent)
        result = result.slice(0, m.index) + rendered + result.slice(m.index + m.full.length)
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
      const replacement = `<!-- dynamic component error: ${escapeHtmlComment(errorMsg)} -->`
      result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
    }
  }

  // Also handle self-closing <component :is="expr" />
  // eslint-disable-next-line ts/no-top-level-await
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
      const componentName = resolveIsName(m.expr, context)

      if (!componentName || typeof componentName !== 'string') {
        const replacement = `<!-- dynamic component: could not resolve "${escapeHtmlComment(m.expr)}" -->`
        result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
        continue
      }

      // Self-closing form has no slot; DialogBackdrop is written this way.
      if (HTML_TAGS.has(componentName)) {
        const rendered = renderAsElement(componentName, m.attrs, '')
        result = result.slice(0, m.index) + rendered + result.slice(m.index + m.full.length)
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
      const replacement = `<!-- dynamic component error: ${escapeHtmlComment(errorMsg)} -->`
      result = result.slice(0, m.index) + replacement + result.slice(m.index + m.full.length)
    }
  }

  return result
}
