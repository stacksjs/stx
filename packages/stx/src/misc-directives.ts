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
 * Transforms @memo="[dep1, dep2]" on elements to data-stx-memo attributes.
 * The signals runtime skips re-processing elements whose memo deps haven't changed.
 *
 * Usage:
 *   <div @memo="[count(), name()]">Expensive content</div>
 */
export function processMemoDirective(template: string): string {
  return template.replace(/@memo="([^"]*)"/g, 'data-stx-memo="$1"')
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
