/**
 * Server-Side Attribute Binding Resolution
 *
 * Resolves `:attr="expr"` bindings server-side when the expression can be
 * evaluated in the server context. This allows Vue-style shorthand binding
 * syntax to work in server-rendered templates without client-side JS.
 *
 * Supported patterns:
 * - `:src="imageUrl"` → `src="https://example.com/image.png"`
 * - `:href="link.url"` → `href="/about"`
 * - `:class="isActive ? 'active' : ''"` → `class="active"`
 * - `:class="{ active: isActive, hidden: !show }"` → `class="active"`
 * - `:class="[baseClass, isActive && 'active']"` → `class="btn active"`
 * - `:disabled="isLoading"` → `disabled` (boolean attributes)
 * - `:id="'item-' + item.id"` → `id="item-42"`
 *
 * Bindings that can't be resolved server-side (e.g., referencing signals or
 * undefined variables) are left intact for client-side processing.
 *
 * @module server-bindings
 */

/** Boolean HTML attributes that should render as attribute-present/absent */
const BOOLEAN_ATTRS = new Set([
  'disabled', 'checked', 'readonly', 'required', 'autofocus', 'autoplay',
  'controls', 'default', 'defer', 'formnovalidate', 'hidden', 'ismap',
  'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open',
  'playsinline', 'reversed', 'selected',
])

/**
 * Resolve a :class binding value to a class string.
 * Supports object syntax, array syntax, and string expressions.
 */
function resolveClassBinding(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(v => resolveClassBinding(v)).join(' ')
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, active]) => active)
      .map(([className]) => className)
      .join(' ')
  }
  return value ? String(value) : ''
}

/**
 * Process server-side `:attr="expr"` bindings in a template.
 *
 * Called after server scripts have executed and before expression processing,
 * so the context contains all server-side variables.
 */
export function processServerBindings(
  template: string,
  context: Record<string, any>,
): string {
  // Quick check — skip if no colon-bindings exist
  if (!/:[\w-]+=/.test(template)) {
    return template
  }

  // Match :attr="value" on HTML elements, but NOT inside <script> or <style> blocks
  // and NOT inside {{ }} expressions. Also skip ::pseudo-elements in CSS.
  let output = template
  const scriptStyleRegex = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi
  const protectedRanges: Array<[number, number]> = []

  let match: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((match = scriptStyleRegex.exec(template)) !== null) {
    protectedRanges.push([match.index, match.index + match[0].length])
  }

  function isProtected(pos: number): boolean {
    return protectedRanges.some(([start, end]) => pos >= start && pos < end)
  }

  // Process :attr="expr" bindings on HTML elements
  // Match opening tags with colon-prefixed attributes
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+(?:[^>"']|"[^"]*"|'[^']*'))*)\s*\/?>/g
  const replacements: Array<{ start: number, end: number, replacement: string }> = []

  // eslint-disable-next-line no-cond-assign
  while ((match = tagRegex.exec(output)) !== null) {
    if (isProtected(match.index)) continue

    const fullTag = match[0]
    const attrs = match[2]
    if (!attrs || !attrs.includes(':')) continue

    // Find all :attr="expr" in this tag's attributes
    const bindingRegex = /\s:([a-zA-Z_][\w-]*)\s*=\s*"([^"]*)"/g
    let attrMatch: RegExpExecArray | null
    let newAttrs = attrs
    let hadReplacement = false

    // eslint-disable-next-line no-cond-assign
    while ((attrMatch = bindingRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1]
      const expression = attrMatch[2]

      // Skip bindings that look like they're for client-side (signal calls, $store, etc.)
      if (expression.includes('()') && !expression.includes('.get(')
        || expression.includes('$store')
        || expression.includes('$ref')) {
        continue
      }

      try {
        const contextKeys = Object.keys(context)
        const contextValues = Object.values(context)

        // Check if the expression references any known context variable
        const identMatch = expression.match(/^([a-zA-Z_$][\w$]*)/)
        if (identMatch && !contextKeys.includes(identMatch[1])
          && !['true', 'false', 'null', 'undefined', 'Math', 'JSON', 'String', 'Number', 'Array', 'Object', 'Date', 'parseInt', 'parseFloat'].includes(identMatch[1])) {
          // Root identifier not in context — leave for client-side
          continue
        }

        // Evaluate the expression
        // eslint-disable-next-line no-new-func
        const fn = new Function(...contextKeys, `return (${expression})`)
        const value = fn(...contextValues)

        // Handle :class specially (supports object/array syntax)
        if (attrName === 'class') {
          const classStr = resolveClassBinding(value)
          if (classStr) {
            // Merge with existing static class if present
            const existingClassMatch = newAttrs.match(/\sclass="([^"]*)"/)
            if (existingClassMatch) {
              newAttrs = newAttrs.replace(
                existingClassMatch[0],
                ` class="${existingClassMatch[1]} ${classStr}"`,
              )
            }
            else {
              newAttrs = newAttrs.replace(attrMatch[0], ` class="${classStr}"`)
            }
          }
          else {
            newAttrs = newAttrs.replace(attrMatch[0], '')
          }
          hadReplacement = true
          continue
        }

        // Handle boolean attributes
        if (BOOLEAN_ATTRS.has(attrName)) {
          if (value) {
            newAttrs = newAttrs.replace(attrMatch[0], ` ${attrName}`)
          }
          else {
            newAttrs = newAttrs.replace(attrMatch[0], '')
          }
          hadReplacement = true
          continue
        }

        // Handle regular attributes
        if (value === null || value === undefined || value === false) {
          newAttrs = newAttrs.replace(attrMatch[0], '')
        }
        else {
          const escaped = String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          newAttrs = newAttrs.replace(attrMatch[0], ` ${attrName}="${escaped}"`)
        }
        hadReplacement = true
      }
      catch {
        // Expression can't be evaluated server-side — leave for client
        continue
      }
    }

    if (hadReplacement) {
      const selfClose = fullTag.endsWith('/>') ? ' /' : ''
      const tagName = match[1]
      const newTag = `<${tagName}${newAttrs}${selfClose}>`
      replacements.push({
        start: match.index,
        end: match.index + fullTag.length,
        replacement: newTag,
      })
    }
  }

  // Apply replacements in reverse order to preserve positions
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i]
    output = output.slice(0, start) + replacement + output.slice(end)
  }

  return output
}
