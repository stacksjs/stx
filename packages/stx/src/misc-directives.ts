/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Miscellaneous directive processing module for STX templates.
 *
 * Contains processors for @json, @once, ref attributes, and
 * the x-cloak utility for unresolved expressions.
 */
import { errorLogger } from './error-handling'
import { createSafeFunction, isExpressionSafe } from './safe-evaluator'

/**
 * Process @json directive to output JSON
 */
export function processJsonDirective(template: string, context: Record<string, any>): string {
  // Handle @json(data) and @json(data, pretty) directives using balanced paren matching
  let result = template
  const jsonPat = /@json\s*\(/g
  let jsonMatch: RegExpExecArray | null

  while ((jsonMatch = jsonPat.exec(result)) !== null) {
    const start = jsonMatch.index
    const openParen = start + jsonMatch[0].length - 1
    // Find balanced closing paren
    let depth = 1
    let pos = openParen + 1
    let inStr: string | null = null
    let esc = false
    while (pos < result.length && depth > 0) {
      const c = result[pos]
      if (esc) { esc = false; pos++; continue }
      if (c === '\\' && inStr) { esc = true; pos++; continue }
      if (inStr) { if (c === inStr) inStr = null; pos++; continue }
      if (c === '"' || c === '\'' || c === '`') { inStr = c; pos++; continue }
      if (c === '(') depth++
      else if (c === ')') { depth--; if (depth === 0) break }
      pos++
    }
    if (depth !== 0) break

    const innerArgs = result.substring(openParen + 1, pos).trim()
    const fullMatch = result.substring(start, pos + 1)

    // Split args: find top-level comma separating data from pretty flag
    let commaIdx = -1
    let argDepth = 0
    let argStr: string | null = null
    let argEsc = false
    for (let ai = 0; ai < innerArgs.length; ai++) {
      const ac = innerArgs[ai]
      if (argEsc) { argEsc = false; continue }
      if (ac === '\\' && argStr) { argEsc = true; continue }
      if (argStr) { if (ac === argStr) argStr = null; continue }
      if (ac === '"' || ac === '\'' || ac === '`') { argStr = ac; continue }
      if (ac === '(' || ac === '[' || ac === '{') argDepth++
      else if (ac === ')' || ac === ']' || ac === '}') argDepth--
      if (ac === ',' && argDepth === 0) { commaIdx = ai; break }
    }

    const dataPath = commaIdx >= 0 ? innerArgs.substring(0, commaIdx).trim() : innerArgs
    const pretty = commaIdx >= 0 ? innerArgs.substring(commaIdx + 1).trim() : undefined

    try {
      const trimmedPath = dataPath.trim()
      let data: unknown
      if (isExpressionSafe(trimmedPath)) {
        const evalFn = createSafeFunction(trimmedPath, Object.keys(context))
        data = evalFn(...Object.values(context))
      }
else {
        data = undefined
      }

      let json: string
      if (pretty === 'true') {
        json = JSON.stringify(data, null, 2)
      }
else {
        json = JSON.stringify(data)
      }
      // Escape sequences that could break out of script tags or HTML context
      const escaped = json
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
      result = result.substring(0, start) + escaped + result.substring(pos + 1)
      jsonPat.lastIndex = start + escaped.length
    }
catch (error) {
      errorLogger.log(error instanceof Error ? error : new Error(String(error)), { directive: '@json' }, 'error')
      jsonPat.lastIndex = start + fullMatch.length
    }
  }
  return result
}

/**
 * Process @once directive blocks.
 * Primary deduplication is handled by processIncludes (context.__onceStore).
 * This function only strips remaining @once/@endonce tags, keeping content.
 */
export function processOnceDirective(template: string): string {
  return template.replace(/@once\s*([\s\S]*?)@endonce/g, '$1')
}

/**
 * Process @memo directive — memoize template subtrees.
 *
 * Two shapes are supported:
 *
 * 1. Attribute form on an element:
 *      <div @memo="[count(), name()]">Expensive content</div>
 *    Transforms to `data-stx-memo="[count(), name()]"`. The signals runtime
 *    skips re-processing elements whose deps haven't changed.
 *
 * 2. Blade-style block form wrapping arbitrary markup:
 *      @memo([])
 *        <section>...marketing content...</section>
 *      @endmemo
 *    The block is transformed by injecting `data-stx-memo` onto the first
 *    opening tag inside the block (or wrapping in a <div> if the contents
 *    don't start with a single element). Both `@memo(...)` and `@endmemo`
 *    are stripped from the output.
 */
export function processMemoDirective(template: string): string {
  // 1) Block form first — `@memo(deps)...@endmemo`. Paren-balanced so a deps
  //    expression like `[count(), name()]` works correctly. We do this
  //    before the attribute replacement because after attribute rewriting
  //    the regex below would still match the remaining `@memo(` literal
  //    and leak it into the DOM.
  let output = template
  const openScan = /@memo\s*\(/g
  let match: RegExpExecArray | null
  const edits: Array<{ start: number, end: number, replacement: string }> = []

  // eslint-disable-next-line no-cond-assign
  while ((match = openScan.exec(output)) !== null) {
    const start = match.index
    const exprStart = start + match[0].length
    // Find balanced closing paren for the deps arg
    let depth = 1
    let i = exprStart
    while (i < output.length && depth > 0) {
      if (output[i] === '(') depth++
      else if (output[i] === ')') depth--
      i++
    }
    if (depth !== 0) continue
    const depsExpr = output.slice(exprStart, i - 1).trim()
    const afterOpen = i

    // Find matching @endmemo (innermost, supports no nesting needs — @memo
    // doesn't currently nest in practice, but this tolerates future depth).
    const tail = output.slice(afterOpen)
    const endIdx = tail.indexOf('@endmemo')
    if (endIdx === -1) continue
    const blockInner = tail.slice(0, endIdx)
    const blockEnd = afterOpen + endIdx + '@endmemo'.length

    // Skip leading whitespace and comments (real <!-- --> plus the
    // \x00STX_HTML_COMMENT_N\x00 placeholders that process.ts uses to
    // protect comments from directive expansion — see stacksjs/stx#1699)
    const leading = blockInner.match(/^(\s*(?:(?:<!--[\s\S]*?-->|\x00STX_HTML_COMMENT_\d+\x00)\s*)*)/)
    const leadingLen = leading ? leading[0].length : 0
    const rest = blockInner.slice(leadingLen)
    const trailing = blockInner.match(/(\s*)$/)
    const trailingLen = trailing ? trailing[0].length : 0
    const body = rest.slice(0, rest.length - trailingLen)

    // If body starts with a single opening tag, splice the data-stx-memo
    // attribute in there. Otherwise wrap the whole body in a <div>.
    const firstTagMatch = body.match(/^<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*?)?(\/?)>/)
    let replacement: string
    if (firstTagMatch) {
      const [fullMatch, tagName, attrs = '', selfClose] = firstTagMatch
      const newOpenTag = `<${tagName}${attrs} data-stx-memo="${depsExpr}"${selfClose}>`
      replacement = blockInner.slice(0, leadingLen) + newOpenTag + body.slice(fullMatch.length) + blockInner.slice(leadingLen + body.length)
    }
    else {
      replacement = `${blockInner.slice(0, leadingLen)}<div data-stx-memo="${depsExpr}">${body}</div>${blockInner.slice(leadingLen + body.length)}`
    }

    edits.push({ start, end: blockEnd, replacement })
    // Resume scanning after this block
    openScan.lastIndex = blockEnd
  }

  // Apply edits end-to-start to preserve indices
  for (let k = edits.length - 1; k >= 0; k--) {
    const e = edits[k]
    output = output.slice(0, e.start) + e.replacement + output.slice(e.end)
  }

  // 2) Attribute form — `<div @memo="[...]">` stays as data-stx-memo.
  return output.replace(/@memo="([^"]*)"/g, 'data-stx-memo="$1"')
}

/**
 * Process ref attributes for DOM element references (Vue-style).
 *
 * Transforms:
 *   <input ref="inputRef" />
 *   <input @ref="inputRef" />
 *
 * Into:
 *   <input data-stx-ref="inputRef" />
 *
 * The client-side runtime will automatically bind these to ref objects.
 */
export function processRefAttributes(template: string): string {
  // Match ref="name" (Vue-style) and @ref="name" attributes
  // Use data-stx-ref to avoid conflicts with native ref attribute
  // Only match inside HTML opening tags (preceded by < tagname ... )
  let result = template.replace(/@ref="([^"]+)"/g, 'data-stx-ref="$1"')
  // Match ref="name" only when inside an HTML tag context (preceded by whitespace after other attrs)
  // Avoid matching ref= in text content by ensuring it follows a tag attr pattern
  result = result.replace(/(<[a-zA-Z][a-zA-Z0-9-]*\b[^>]*?)\sref="([^"]+)"/g, '$1 data-stx-ref="$2"')
  return result
}

/**
 * Add x-cloak to HTML elements that contain unresolved {{ }} expressions.
 * These expressions were preserved for client-side evaluation (signals, loop vars, etc.).
 * x-cloak hides them until the JS runtime processes and reveals them — prevents FOUC.
 */
export function addCloakToUnresolvedExpressions(html: string): string {
  // Add x-cloak to elements whose text content contains {{ }} expressions.
  // We parse tag boundaries carefully to avoid breaking attributes that contain ">".
  const tagNames = 'div|span|p|h[1-6]|td|th|li|a|button|label|section|article|header|footer|main|nav|aside|dd|dt|figcaption|summary|caption|blockquote|pre|code|em|strong|small|sub|sup|time|mark|abbr|cite|q|s|u|b|i'
  const tagStartRe = new RegExp(`<(${tagNames})\\b`, 'gi')
  let result = ''
  let lastIndex = 0
  let tagMatch: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((tagMatch = tagStartRe.exec(html)) !== null) {
    const tagOpenStart = tagMatch.index

    // Find the real closing ">" of this opening tag, skipping ">" inside quoted attributes
    let i = tagOpenStart + tagMatch[0].length
    let inSingleQuote = false
    let inDoubleQuote = false
    let tagCloseIdx = -1

    while (i < html.length) {
      const ch = html[i]
      if (inSingleQuote) {
        if (ch === '\'') inSingleQuote = false
      }
      else if (inDoubleQuote) {
        if (ch === '"') inDoubleQuote = false
      }
      else if (ch === '\'') {
        inSingleQuote = true
      }
      else if (ch === '"') {
        inDoubleQuote = true
      }
      else if (ch === '>') {
        tagCloseIdx = i
        break
      }
      i++
    }

    if (tagCloseIdx === -1) continue

    const fullTag = html.slice(tagOpenStart, tagCloseIdx + 1)

    // Skip if already has x-cloak
    if (fullTag.includes('x-cloak')) continue

    // Look at text content after this tag until the next "</" or "<" tag
    const afterTag = html.slice(tagCloseIdx + 1)
    const closingIdx = afterTag.indexOf('</')
    const textContent = closingIdx >= 0 ? afterTag.slice(0, closingIdx) : afterTag.slice(0, 200)

    if (/\{\{[\s\S]*?\}\}/.test(textContent)) {
      // Insert x-cloak before the closing >
      result += html.slice(lastIndex, tagCloseIdx) + ' x-cloak>'
      lastIndex = tagCloseIdx + 1
    }
  }

  result += html.slice(lastIndex)
  return result
}

// Reactive conditional / visibility directives whose elements flash their
// false-branch (or hidden) content before the client runtime processes them.
// Auto-stamping x-cloak on these (paired with the inline cloak <style> shipped
// in the SSR <head>) hides them until the runtime mounts and removes the
// attribute. See stacksjs/stx#1736. `:else-if` MUST precede `:else` in the
// alternation so the longer token wins. `@if` / `@show` here are the
// element-attribute forms (e.g. `<div @if="…">`); the Blade `@if(...)`
// control-flow directive is resolved server-side long before this pass and
// never survives as an attribute.
const CONDITIONAL_DIRECTIVE_RE
  = /(?:^|\s)(?::else-if|:if|:else|:show|x-else-if|x-if|x-else|x-show|@if|@show)(?:=|\s|\/|>|$)/

/**
 * Add x-cloak to every element carrying a reactive conditional / visibility
 * directive (:if, :else, :else-if, :show, x-if, x-else, x-else-if, x-show,
 * and the @if / @show element-attribute forms).
 *
 * Without this, false branches and hidden elements paint before the runtime
 * hides them — the FOUC described in stacksjs/stx#1736. The runtime already
 * strips x-cloak the moment it processes each element, so this is purely an
 * SSR-side additive pass; hand-written x-cloak is preserved (we skip tags
 * that already have it).
 */
export function addCloakToConditionalDirectives(html: string): string {
  const tagStartRe = /<[a-z][\w-]*/gi
  let result = ''
  let lastIndex = 0
  let tagMatch: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((tagMatch = tagStartRe.exec(html)) !== null) {
    const tagOpenStart = tagMatch.index
    const tagName = tagMatch[0].slice(1).toLowerCase()

    // Skip <script> / <style> bodies entirely — their raw JS/CSS text (e.g.
    // `if (a < b)`) can contain `<`-prefixed substrings that look like tags
    // and could trip a conditional-directive false positive. Same lesson as
    // the component-scanner fix in stacksjs/stx#1730. Advance the regex
    // cursor past the matching close tag.
    if (tagName === 'script' || tagName === 'style') {
      const closeTag = `</${tagName}>`
      const closeIdx = html.toLowerCase().indexOf(closeTag, tagOpenStart)
      if (closeIdx !== -1)
        tagStartRe.lastIndex = closeIdx + closeTag.length
      continue
    }

    // Find the real closing ">" of this opening tag, skipping ">" inside
    // quoted attribute values (same boundary logic as the {{ }} pass).
    let i = tagOpenStart + tagMatch[0].length
    let inSingleQuote = false
    let inDoubleQuote = false
    let tagCloseIdx = -1

    while (i < html.length) {
      const ch = html[i]
      if (inSingleQuote) {
        if (ch === '\'') inSingleQuote = false
      }
      else if (inDoubleQuote) {
        if (ch === '"') inDoubleQuote = false
      }
      else if (ch === '\'') {
        inSingleQuote = true
      }
      else if (ch === '"') {
        inDoubleQuote = true
      }
      else if (ch === '>') {
        tagCloseIdx = i
        break
      }
      i++
    }

    if (tagCloseIdx === -1) continue

    // The attribute span is everything between the tag name and the ">".
    const attrSpan = html.slice(tagOpenStart + tagMatch[0].length, tagCloseIdx)

    // Skip if already cloaked or no conditional directive present.
    if (/(?:^|\s)x-cloak(?:=|\s|\/|>|$)/.test(attrSpan)) continue
    if (!CONDITIONAL_DIRECTIVE_RE.test(attrSpan)) continue

    // Self-closing tags end in "/>" — insert x-cloak before the trailing slash.
    const isSelfClosing = html[tagCloseIdx - 1] === '/'
    const insertAt = isSelfClosing ? tagCloseIdx - 1 : tagCloseIdx
    result += `${html.slice(lastIndex, insertAt)} x-cloak${isSelfClosing ? ' ' : ''}`
    lastIndex = insertAt
  }

  result += html.slice(lastIndex)
  return result
}
