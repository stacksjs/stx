/**
 * Vue Template Directive Transformer
 *
 * Pre-processing transform that converts Vue template syntax into existing stx directives.
 * This runs early in the processing pipeline, before any directive processing,
 * allowing users to write Vue-style templates that leverage stx's existing infrastructure.
 *
 * Supported Vue directives:
 * - v-if, v-else-if, v-else → @if/@elseif/@else/@endif
 * - v-for → @foreach/@endforeach
 * - v-show → @show attribute
 * - v-model → @model (native) or :modelValue + @update:modelValue (components)
 * - v-bind: / : → @bind: attribute
 * - v-on: / @ (in Vue context) → @ event directives
 * - v-html → {!! expr !!}
 * - v-text → {{ expr }}
 * - v-pre → data-stx-skip
 * - v-once → @once/@endonce wrapper
 * - v-cloak → preserved, removed by runtime
 * - v-memo → data-stx-memo attribute
 *
 * @module vue-template
 */

// =============================================================================
// Constants
// =============================================================================

/** HTML void elements that don't have closing tags */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/** Native HTML elements (used to distinguish from components for v-model) */
const NATIVE_ELEMENTS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base',
  'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
  'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del',
  'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5',
  'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img',
  'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map',
  'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol',
  'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress',
  'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'search', 'section',
  'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub',
  'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot',
  'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
])

// =============================================================================
// Tag Parsing Utilities
// =============================================================================

interface ParsedTag {
  /** Full match string */
  full: string
  /** Tag name */
  tag: string
  /** Raw attributes string */
  attrs: string
  /** Whether self-closing */
  selfClosing: boolean
  /** Start index in source */
  start: number
  /** End index in source (exclusive) */
  end: number
}

/**
 * Find the next HTML opening tag starting from a given position.
 * Returns the parsed tag info or null if none found.
 */
function findNextOpenTag(html: string, startFrom: number): ParsedTag | null {
  // The attribute pattern handles > inside quoted strings: [^>"'] or "..." or '...'
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)?)(\s*\/?)>/g
  tagRegex.lastIndex = startFrom

  const match = tagRegex.exec(html)
  if (!match)
    return null

  return {
    full: match[0],
    tag: match[1],
    attrs: match[2],
    selfClosing: match[3].includes('/') || VOID_ELEMENTS.has(match[1].toLowerCase()),
    start: match.index,
    end: match.index + match[0].length,
  }
}

/**
 * Find the closing tag that matches an opening tag, handling nesting.
 * Returns the end index (after the closing tag) or -1 if not found.
 */
function findClosingTag(html: string, tagName: string, afterOpenTag: number): number {
  let depth = 1
  let pos = afterOpenTag
  const openPattern = new RegExp(`<${tagName}(?:\\s(?:[^>"']|"[^"]*"|'[^']*')*)?>`, 'gi')
  const closePattern = new RegExp(`</${tagName}\\s*>`, 'gi')

  while (depth > 0 && pos < html.length) {
    openPattern.lastIndex = pos
    closePattern.lastIndex = pos

    const nextOpen = openPattern.exec(html)
    const nextClose = closePattern.exec(html)

    if (!nextClose)
      return -1

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++
      pos = nextOpen.index + nextOpen[0].length
    }
    else {
      depth--
      if (depth === 0) {
        return nextClose.index + nextClose[0].length
      }
      pos = nextClose.index + nextClose[0].length
    }
  }

  return -1
}

/**
 * Get the full outer HTML of an element (opening tag through closing tag).
 */
function getElementRange(html: string, parsed: ParsedTag): { outerStart: number, outerEnd: number, innerHTML: string } {
  if (parsed.selfClosing) {
    return {
      outerStart: parsed.start,
      outerEnd: parsed.end,
      innerHTML: '',
    }
  }

  const closeEnd = findClosingTag(html, parsed.tag, parsed.end)
  if (closeEnd === -1) {
    // Treat as self-closing if no closing tag found
    return {
      outerStart: parsed.start,
      outerEnd: parsed.end,
      innerHTML: '',
    }
  }

  return {
    outerStart: parsed.start,
    outerEnd: closeEnd,
    innerHTML: html.slice(parsed.end, closeEnd - `</${parsed.tag}>`.length),
  }
}

// =============================================================================
// Attribute Parsing
// =============================================================================

/**
 * Check if an attribute string contains a specific Vue directive.
 */
function hasVueDirective(attrs: string, directive: string): boolean {
  return new RegExp(`(?:^|\\s)${directive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:=|\\s|$|>|/)`).test(attrs)
    || attrs.includes(` ${directive}=`)
    || attrs.includes(` ${directive} `)
    || attrs.trimEnd().endsWith(` ${directive}`)
}

/**
 * Extract the value of a Vue directive from an attribute string.
 * Returns the value or null if not found.
 */
function extractDirectiveValue(attrs: string, directive: string): string | null {
  // Match directive="value" or directive='value'
  const escapedDirective = directive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = attrs.match(new RegExp(`${escapedDirective}="([^"]*)"`, 's'))
    || attrs.match(new RegExp(`${escapedDirective}='([^']*)'`, 's'))
  return match ? match[1] : null
}

/**
 * Remove a Vue directive from an attribute string.
 */
function removeDirective(attrs: string, directive: string): string {
  const escapedDirective = directive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return attrs
    .replace(new RegExp(`\\s*${escapedDirective}="[^"]*"`, 'g'), '')
    .replace(new RegExp(`\\s*${escapedDirective}='[^']*'`, 'g'), '')
    .replace(new RegExp(`\\s*${escapedDirective}(?=\\s|$|>|/)`, 'g'), '')
}

/**
 * Replace the attributes portion of a tag in the source HTML.
 */
function replaceTagAttrs(html: string, parsed: ParsedTag, newAttrs: string): string {
  const selfClose = parsed.selfClosing ? ' /' : ''
  const newTag = `<${parsed.tag}${newAttrs}${selfClose}>`
  return html.slice(0, parsed.start) + newTag + html.slice(parsed.end)
}

// =============================================================================
// Core Transformers
// =============================================================================

/**
 * Check if template contains any Vue-style directives.
 * Quick check to avoid unnecessary processing.
 */
export function hasVueTemplateSyntax(template: string): boolean {
  return /\bv-(?:if|else-if|else|for|show|model|html|text|pre|once|cloak|memo|bind|on|slot)\b/.test(template)
}

/**
 * Transform v-for directives into @foreach blocks.
 *
 * Vue syntax: `<div v-for="item in items">` or `<div v-for="(item, index) in items">`
 * stx syntax: `@foreach(items as item)` or `@foreach(items as index => item)`
 */
function transformVFor(html: string): string {
  let result = html
  let searchFrom = 0

  while (searchFrom < result.length) {
    const tag = findNextOpenTag(result, searchFrom)
    if (!tag)
      break

    const vForValue = extractDirectiveValue(tag.attrs, 'v-for')
    if (vForValue === null) {
      searchFrom = tag.end
      continue
    }

    // Parse v-for expression: "item in items" or "(item, index) in items" or "(value, key, index) in object"
    const forMatch = vForValue.match(/^\s*\(?([^)]+)\)?\s+(?:in|of)\s+(.+)\s*$/)
    if (!forMatch) {
      searchFrom = tag.end
      continue
    }

    const iterVars = forMatch[1].trim()
    const collection = forMatch[2].trim()

    // Convert Vue for syntax to stx foreach syntax
    let foreachExpr: string
    if (iterVars.includes(',')) {
      // (item, index) in items → items as index => item
      const parts = iterVars.split(',').map(s => s.trim())
      const item = parts[0]
      const index = parts[1]
      foreachExpr = `${collection} as ${index} => ${item}`
    }
    else {
      // item in items → items as item
      foreachExpr = `${collection} as ${iterVars}`
    }

    // Remove v-for from attributes
    const newAttrs = removeDirective(tag.attrs, 'v-for')

    // Also check for :key and remove it (stx handles keys differently)
    const cleanAttrs = removeDirective(newAttrs, ':key')
      .replace(/\s*v-bind:key="[^"]*"/g, '')

    // Get the element range
    const range = getElementRange(result, tag)

    // Build the replacement: wrap the element in @foreach
    const element = result.slice(range.outerStart, range.outerEnd)
    // Rebuild element with cleaned attributes
    const tagWithNewAttrs = replaceTagAttrs(element, {
      ...tag,
      start: 0,
      end: tag.end - tag.start,
    }, cleanAttrs)

    const foreachPrefix = `@foreach(${foreachExpr})\n`
    const replacement = `${foreachPrefix}${tagWithNewAttrs}\n@endforeach`

    result = result.slice(0, range.outerStart) + replacement + result.slice(range.outerEnd)
    // Advance past the @foreach prefix so inner v-for directives are still found
    searchFrom = range.outerStart + foreachPrefix.length
  }

  return result
}

/**
 * Transform v-if/v-else-if/v-else chains into @if/@elseif/@else/@endif blocks.
 *
 * This handles consecutive sibling elements with v-if, v-else-if, v-else.
 */
function transformVIfChain(html: string): string {
  let result = html
  let searchFrom = 0

  while (searchFrom < result.length) {
    const tag = findNextOpenTag(result, searchFrom)
    if (!tag)
      break

    const vIfValue = extractDirectiveValue(tag.attrs, 'v-if')
    if (vIfValue === null) {
      searchFrom = tag.end
      continue
    }

    // Found a v-if element - collect the chain
    const chain: Array<{
      type: 'if' | 'else-if' | 'else'
      expr?: string
      outerStart: number
      outerEnd: number
      element: string
      parsedTag: ParsedTag
    }> = []

    // First element (v-if)
    const ifRange = getElementRange(result, tag)
    const ifAttrs = removeDirective(tag.attrs, 'v-if')
    const ifElement = replaceTagAttrs(result.slice(ifRange.outerStart, ifRange.outerEnd), {
      ...tag,
      start: 0,
      end: tag.end - tag.start,
    }, ifAttrs)

    chain.push({
      type: 'if',
      expr: vIfValue,
      outerStart: ifRange.outerStart,
      outerEnd: ifRange.outerEnd,
      element: ifElement,
      parsedTag: tag,
    })

    // Look for consecutive v-else-if and v-else siblings
    let nextSearchPos = ifRange.outerEnd
    let chainContinues = true

    while (chainContinues) {
      // Skip whitespace and newlines between siblings
      const afterWhitespace = result.slice(nextSearchPos).match(/^\s*/)
      const wsLength = afterWhitespace ? afterWhitespace[0].length : 0

      const nextTag = findNextOpenTag(result, nextSearchPos + wsLength)
      if (!nextTag) {
        chainContinues = false
        break
      }

      const elseIfValue = extractDirectiveValue(nextTag.attrs, 'v-else-if')
      const hasElse = hasVueDirective(nextTag.attrs, 'v-else')

      if (elseIfValue !== null) {
        const elseIfRange = getElementRange(result, nextTag)
        const elseIfAttrs = removeDirective(nextTag.attrs, 'v-else-if')
        const elseIfElement = replaceTagAttrs(result.slice(elseIfRange.outerStart, elseIfRange.outerEnd), {
          ...nextTag,
          start: 0,
          end: nextTag.end - nextTag.start,
        }, elseIfAttrs)

        chain.push({
          type: 'else-if',
          expr: elseIfValue,
          outerStart: nextSearchPos,
          outerEnd: elseIfRange.outerEnd,
          element: elseIfElement,
          parsedTag: nextTag,
        })
        nextSearchPos = elseIfRange.outerEnd
      }
      else if (hasElse) {
        const elseRange = getElementRange(result, nextTag)
        const elseAttrs = removeDirective(nextTag.attrs, 'v-else')
        const elseElement = replaceTagAttrs(result.slice(elseRange.outerStart, elseRange.outerEnd), {
          ...nextTag,
          start: 0,
          end: nextTag.end - nextTag.start,
        }, elseAttrs)

        chain.push({
          type: 'else',
          outerStart: nextSearchPos,
          outerEnd: elseRange.outerEnd,
          element: elseElement,
          parsedTag: nextTag,
        })
        chainContinues = false
      }
      else {
        chainContinues = false
      }
    }

    // Build the replacement
    const parts: string[] = []
    for (const item of chain) {
      if (item.type === 'if') {
        parts.push(`@if(${item.expr})\n${item.element}`)
      }
      else if (item.type === 'else-if') {
        parts.push(`@elseif(${item.expr})\n${item.element}`)
      }
      else {
        parts.push(`@else\n${item.element}`)
      }
    }
    parts.push('@endif')

    const replacement = parts.join('\n')
    const chainStart = chain[0].outerStart
    const chainEnd = chain[chain.length - 1].outerEnd

    result = result.slice(0, chainStart) + replacement + result.slice(chainEnd)
    searchFrom = chainStart + replacement.length
  }

  return result
}

/**
 * Transform v-show directives into @show attributes.
 */
function transformVShow(html: string): string {
  return html.replace(
    /\bv-show="([^"]*)"/g,
    '@show="$1"',
  )
}

/**
 * Transform v-model directives.
 * - On native elements: converts to @model="expr"
 * - On components: converts to :modelValue="expr" @update:modelValue="expr = $event"
 * - Named v-model: v-model:name="expr" → :name="expr" @update:name="expr = $event"
 */
function transformVModel(html: string): string {
  let result = html
  let searchFrom = 0

  while (searchFrom < result.length) {
    const tag = findNextOpenTag(result, searchFrom)
    if (!tag)
      break

    // Check for named v-model(s): v-model:name="expr"
    // Process ALL named v-models on this tag before moving on
    let currentAttrs = tag.attrs
    let hadNamedVModel = false
    const namedVModelRegex = /v-model:([a-zA-Z_][a-zA-Z0-9_]*)(?:\.([a-zA-Z.]+))?\s*=\s*"([^"]*)"/
    let namedMatch = currentAttrs.match(namedVModelRegex)
    while (namedMatch) {
      hadNamedVModel = true
      const propName = namedMatch[1]
      const _modifiers = namedMatch[2] // Future: handle .trim, .number, .lazy
      const expr = namedMatch[3]

      currentAttrs = currentAttrs.replace(namedMatch[0], '')
      currentAttrs += ` :${propName}="${expr}" @update:${propName}="${expr} = $event"`
      namedMatch = currentAttrs.match(namedVModelRegex)
    }

    if (hadNamedVModel) {
      const range = getElementRange(result, tag)
      const element = result.slice(range.outerStart, range.outerEnd)
      const newElement = replaceTagAttrs(element, {
        ...tag,
        start: 0,
        end: tag.end - tag.start,
      }, currentAttrs)

      result = result.slice(0, range.outerStart) + newElement + result.slice(range.outerEnd)
      searchFrom = range.outerStart + newElement.length
      continue
    }

    // Check for basic v-model="expr"
    const modelValue = extractDirectiveValue(tag.attrs, 'v-model')
    if (modelValue === null) {
      searchFrom = tag.end
      continue
    }

    const isNative = NATIVE_ELEMENTS.has(tag.tag.toLowerCase())

    if (isNative) {
      // Native element: convert to @model
      const newAttrs = tag.attrs
        .replace(/\s*v-model="[^"]*"/g, '')
        + ` @model="${modelValue}"`

      const range = getElementRange(result, tag)
      const element = result.slice(range.outerStart, range.outerEnd)
      const newElement = replaceTagAttrs(element, {
        ...tag,
        start: 0,
        end: tag.end - tag.start,
      }, newAttrs)

      result = result.slice(0, range.outerStart) + newElement + result.slice(range.outerEnd)
      searchFrom = range.outerStart + newElement.length
    }
    else {
      // Component: convert to :modelValue + @update:modelValue
      let newAttrs = tag.attrs
        .replace(/\s*v-model="[^"]*"/g, '')
      newAttrs += ` :modelValue="${modelValue}" @update:modelValue="${modelValue} = $event"`

      const range = getElementRange(result, tag)
      const element = result.slice(range.outerStart, range.outerEnd)
      const newElement = replaceTagAttrs(element, {
        ...tag,
        start: 0,
        end: tag.end - tag.start,
      }, newAttrs)

      result = result.slice(0, range.outerStart) + newElement + result.slice(range.outerEnd)
      searchFrom = range.outerStart + newElement.length
    }
  }

  return result
}

/**
 * Transform v-bind:attr="expr" (explicit prefix form only) into @bind:attr="expr".
 *
 * Note: The `:attr="expr"` shorthand is NOT transformed here because stx already
 * natively supports it in the component system and loop processing (processPropBindings).
 * Only the explicit `v-bind:attr` prefix form is transformed.
 */
function transformVBind(html: string): string {
  // Only transform explicit v-bind:attr="expr" → @bind:attr="expr"
  return html.replace(/\bv-bind:([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*"([^"]*)"/g, '@bind:$1="$2"')
}

/**
 * Transform v-on: and Vue @ shorthand into stx event directives.
 * Note: stx already uses @ for both directives and events, so v-on: is the main transform.
 */
function transformVOn(html: string): string {
  // v-on:event="handler" → @event="handler"
  return html.replace(/\bv-on:([a-zA-Z_][a-zA-Z0-9_.-]*)\s*=\s*"([^"]*)"/g, '@$1="$2"')
}

/**
 * Transform v-html directives.
 * Replaces element content with raw expression output.
 */
function transformVHtml(html: string): string {
  let result = html
  let searchFrom = 0

  while (searchFrom < result.length) {
    const tag = findNextOpenTag(result, searchFrom)
    if (!tag)
      break

    const vHtmlValue = extractDirectiveValue(tag.attrs, 'v-html')
    if (vHtmlValue === null) {
      searchFrom = tag.end
      continue
    }

    if (tag.selfClosing) {
      searchFrom = tag.end
      continue
    }

    const range = getElementRange(result, tag)
    const newAttrs = removeDirective(tag.attrs, 'v-html')
    const selfClose = tag.selfClosing ? ' /' : ''
    const newElement = `<${tag.tag}${newAttrs}${selfClose}>{!! ${vHtmlValue} !!}</${tag.tag}>`

    result = result.slice(0, range.outerStart) + newElement + result.slice(range.outerEnd)
    searchFrom = range.outerStart + newElement.length
  }

  return result
}

/**
 * Transform v-text directives.
 * Replaces element content with escaped expression output.
 */
function transformVText(html: string): string {
  let result = html
  let searchFrom = 0

  while (searchFrom < result.length) {
    const tag = findNextOpenTag(result, searchFrom)
    if (!tag)
      break

    const vTextValue = extractDirectiveValue(tag.attrs, 'v-text')
    if (vTextValue === null) {
      searchFrom = tag.end
      continue
    }

    if (tag.selfClosing) {
      searchFrom = tag.end
      continue
    }

    const range = getElementRange(result, tag)
    const newAttrs = removeDirective(tag.attrs, 'v-text')
    const selfClose = tag.selfClosing ? ' /' : ''
    const newElement = `<${tag.tag}${newAttrs}${selfClose}>{{ ${vTextValue} }}</${tag.tag}>`

    result = result.slice(0, range.outerStart) + newElement + result.slice(range.outerEnd)
    searchFrom = range.outerStart + newElement.length
  }

  return result
}

/**
 * Transform v-pre directives.
 * Marks elements as skip for directive processing.
 */
function transformVPre(html: string): string {
  return html.replace(
    /(<[a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*?)\s+v-pre([^>]*>)/g,
    '$1$2 data-stx-skip$3',
  ).replace(
    /(<[a-zA-Z][a-zA-Z0-9-]*)\s+v-pre(\s[^>]*>|>)/g,
    '$1 data-stx-skip$2',
  )
}

/**
 * Transform v-once directives.
 * Wraps element in @once/@endonce block.
 */
function transformVOnce(html: string): string {
  let result = html
  let searchFrom = 0

  while (searchFrom < result.length) {
    const tag = findNextOpenTag(result, searchFrom)
    if (!tag)
      break

    if (!hasVueDirective(tag.attrs, 'v-once')) {
      searchFrom = tag.end
      continue
    }

    const newAttrs = removeDirective(tag.attrs, 'v-once')
    const range = getElementRange(result, tag)
    const element = result.slice(range.outerStart, range.outerEnd)
    const cleanElement = replaceTagAttrs(element, {
      ...tag,
      start: 0,
      end: tag.end - tag.start,
    }, newAttrs)

    const replacement = `@once\n${cleanElement}\n@endonce`

    result = result.slice(0, range.outerStart) + replacement + result.slice(range.outerEnd)
    searchFrom = range.outerStart + replacement.length
  }

  return result
}

/**
 * Transform v-memo directives into data-stx-memo attributes.
 */
function transformVMemo(html: string): string {
  return html.replace(
    /\bv-memo="([^"]*)"/g,
    'data-stx-memo="$1"',
  )
}

/**
 * Transform v-slot and # shorthand syntax.
 * This is already supported in stx, but ensure v-slot: prefix works.
 */
function transformVSlot(html: string): string {
  // v-slot:name="props" → #name="props" (stx already handles #name)
  return html.replace(/\bv-slot:([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*"([^"]*)"/g, '#$1="$2"')
    .replace(/\bv-slot:([a-zA-Z_][a-zA-Z0-9_-]*)(?=[\s>])/g, '#$1')
    .replace(/\bv-slot\s*=\s*"([^"]*)"/g, '#default="$1"')
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Process Vue template syntax and convert to stx directives.
 *
 * This is designed to be called early in the processing pipeline,
 * before any stx directive processing. It transforms Vue-style syntax
 * into stx's native directive format.
 *
 * @param template - The template string potentially containing Vue directives
 * @returns The template with Vue directives converted to stx equivalents
 */
export function processVueTemplate(template: string): string {
  // Quick check - skip processing if no Vue syntax found
  if (!hasVueTemplateSyntax(template)) {
    return template
  }

  let result = template

  // Order matters:
  // 1. v-for first (wraps elements in blocks)
  // 2. v-if/v-else-if/v-else chains (wraps elements in blocks)
  // 3. Simple attribute transforms
  // 4. Content transforms (v-html, v-text)

  // Structural directives
  result = transformVFor(result)
  result = transformVIfChain(result)
  result = transformVOnce(result)

  // Binding directives
  result = transformVBind(result)
  result = transformVOn(result)
  result = transformVModel(result)
  result = transformVShow(result)
  result = transformVSlot(result)

  // Content directives
  result = transformVHtml(result)
  result = transformVText(result)

  // Attribute directives
  result = transformVPre(result)
  result = transformVMemo(result)

  // v-cloak is left as-is — it's a CSS-based directive handled by the runtime
  // Just ensure the CSS is injected (done in signals runtime)

  return result
}
