/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Signal Processing Module
 *
 * Handles detection, conversion, and setup of STX signals in templates.
 * Converts directive-style syntax (@if, @for) to attribute-style for the
 * client-side signals runtime, and wraps signal scripts in setup functions.
 *
 * @module signal-processing
 */

import type { StxOptions } from './types'
import { transformStoreImports } from './store-imports'
import { shouldTranspileTypeScript, transpileTypeScript } from './utils'
import { injectSignalsRuntime, injectBrowserRuntime } from './runtime-injection'

// Counter for unique signal setup function names (avoids Date.now() collisions)
let signalSetupCounter = 0

/**
 * Scan a template for `<script>` tags in browser order: each opening tag is
 * closed by the **first** subsequent `</script>` (case-insensitive), and the
 * scanner then continues from after that close tag. This matches how HTML
 * parsers tokenize `<script>` as a RAWTEXT element — they don't re-scan the
 * body for more `<script` openings.
 *
 * A plain regex like `/<script[^>]*>([\s\S]*?)<\/script>/g` doesn't give you
 * this property: if a script body contains the literal text `<script client>`
 * (e.g. inside a JS comment), the regex matches it as a fresh script tag,
 * which breaks downstream TypeScript transpilation and directive parsing.
 *
 * `skipAttrs` lets callers drop tags whose attribute string contains certain
 * patterns (e.g. `server`, `src=`, `data-stx-scoped`).
 */
export function scanScriptTags(
  html: string,
  opts: { skipAttrs?: RegExp } = {},
): Array<{ fullMatch: string, attrs: string, body: string, start: number, end: number }> {
  const out: Array<{ fullMatch: string, attrs: string, body: string, start: number, end: number }> = []
  const openRe = /<script\b([^>]*)>/gi
  let m: RegExpExecArray | null
  while ((m = openRe.exec(html)) !== null) {
    const attrs = m[1]
    const bodyStart = m.index + m[0].length
    const closeIdx = html.toLowerCase().indexOf('</script>', bodyStart)
    if (closeIdx === -1) break // unclosed — stop scanning
    const end = closeIdx + '</script>'.length
    if (opts.skipAttrs && opts.skipAttrs.test(attrs)) {
      // Still advance past the close tag so we don't match nested openings.
      openRe.lastIndex = end
      continue
    }
    out.push({
      fullMatch: html.slice(m.index, end),
      attrs,
      body: html.slice(bodyStart, closeIdx),
      start: m.index,
      end,
    })
    openRe.lastIndex = end
  }
  return out
}

/**
 * Parsed form of a loop expression (`@for` / `@foreach` argument).
 *
 * `style: 'as'` — "iterable as item" / "iterable as idx => item" / "iterable as (item, idx)"
 * `style: 'in'` — "item in iterable" / "(item, idx) in iterable" / "item of iterable"
 * `style: 'unknown'` — fell through all parsers; iterable is `null`
 */
export interface ParsedLoopExpression {
  style: 'as' | 'in' | 'unknown'
  iterable: string | null
  itemVar: string | null
  indexVar: string | null
}

/**
 * Parse a loop argument — accepts every syntax stx supports at runtime.
 *
 * ```
 * parseLoopExpression('items as item')                → { style:'as', iterable:'items',     itemVar:'item', indexVar:null }
 * parseLoopExpression('items as idx => item')         → { style:'as', iterable:'items',     itemVar:'item', indexVar:'idx' }
 * parseLoopExpression('items as item, idx')           → { style:'as', iterable:'items',     itemVar:'item', indexVar:'idx' }
 * parseLoopExpression('items as (item, idx)')         → { style:'as', iterable:'items',     itemVar:'item', indexVar:'idx' }
 * parseLoopExpression('obj.list as item')             → { style:'as', iterable:'obj.list',  itemVar:'item', indexVar:null }
 * parseLoopExpression('item in items')                → { style:'in', iterable:'items',     itemVar:'item', indexVar:null }
 * parseLoopExpression('(item, idx) in items')         → { style:'in', iterable:'items',     itemVar:'item', indexVar:'idx' }
 * parseLoopExpression('item of items')                → { style:'in', iterable:'items',     itemVar:'item', indexVar:null }
 * ```
 */
export function parseLoopExpression(expr: string): ParsedLoopExpression {
  const trimmed = expr.trim()

  // Blade-style: <iterable> as <item-spec>
  // The item-spec is parsed permissively (anything goes) — we split it afterwards.
  const asMatch = trimmed.match(/^([\s\S]+?)\s+as\s+(.+)$/)
  if (asMatch) {
    const iterable = asMatch[1].trim()
    const spec = asMatch[2].trim()
    const { itemVar, indexVar } = parseItemSpec(spec)
    if (itemVar) {
      return { style: 'as', iterable, itemVar, indexVar }
    }
  }

  // JS-style: <item-spec> in <iterable> | <item-spec> of <iterable>
  const inMatch = trimmed.match(/^(\([^)]+\)|\w+(?:\s*,\s*\w+)?)\s+(?:in|of)\s+([\s\S]+)$/)
  if (inMatch) {
    const spec = inMatch[1].trim()
    const iterable = inMatch[2].trim()
    const { itemVar, indexVar } = parseItemSpec(spec)
    if (itemVar) {
      return { style: 'in', iterable, itemVar, indexVar }
    }
  }

  return { style: 'unknown', iterable: null, itemVar: null, indexVar: null }
}

/**
 * Parse the item portion of a loop expression (everything after `as` or before `in`).
 * Supports:
 *   - `item`               → { itemVar: 'item', indexVar: null }
 *   - `idx => item`        → { itemVar: 'item', indexVar: 'idx' }
 *   - `item, idx`          → { itemVar: 'item', indexVar: 'idx' }
 *   - `(item, idx)`        → { itemVar: 'item', indexVar: 'idx' }
 */
function parseItemSpec(spec: string): { itemVar: string | null, indexVar: string | null } {
  const trimmed = spec.trim()

  // `idx => item` — Blade-style "key => value"
  const arrow = trimmed.match(/^(\w+)\s*=>\s*(\w+)$/)
  if (arrow) return { itemVar: arrow[2], indexVar: arrow[1] }

  // `(item, idx)` — parenthesized
  const paren = trimmed.match(/^\(\s*(\w+)(?:\s*,\s*(\w+))?\s*\)$/)
  if (paren) return { itemVar: paren[1], indexVar: paren[2] || null }

  // `item, idx` — JS destructure-ish
  const pair = trimmed.match(/^(\w+)\s*,\s*(\w+)$/)
  if (pair) return { itemVar: pair[1], indexVar: pair[2] }

  // `item` — just a name
  const single = trimmed.match(/^(\w+)$/)
  if (single) return { itemVar: single[1], indexVar: null }

  return { itemVar: null, indexVar: null }
}

/**
 * Check if template uses STX signals syntax.
 *
 * STX directives work seamlessly on both server and client:
 * - `@if`, `@else` - Conditional rendering
 * - `@for` - List iteration
 * - `@show` - Toggle visibility (keeps element in DOM)
 * - `@model` - Two-way binding
 * - `@bind:attr` - Dynamic attribute binding
 * - `@class`, `@style` - Dynamic class/style binding
 * - `@click`, `@submit` - Event handling
 * - Scripts containing `state(`, `derived(`, `effect(` - Signal APIs
 *
 * Server-side directives are processed at build time.
 * Remaining directives with reactive values are handled by the client runtime.
 */
export function hasSignalsSyntax(template: string): boolean {
  // Check for STX reactive syntax that needs client runtime
  const signalsPatterns = [
    /@if\s*=/, // @if="condition"
    /@for\s*=/, // @for="item in items"
    /@show\s*=/, // @show="visible"
    /@model\s*=/, // @model="value"
    /@bind:/, // @bind:attr="value"
    /@class\s*=/, // @class="{ active: isActive }"
    /@style\s*=/, // @style="{ color: textColor }"
    /\bx-data\s*=/, // x-data="{ ... }" Alpine-style (reactive bridge needs signals runtime)
    /\bstate\s*(?:<[^>]*>)?\s*\(/, // state() signal API
    /\bderived\s*(?:<[^>]*>)?\s*\(/, // derived() signal API
    /\beffect\s*(?:<[^>]*>)?\s*\(/, // effect() signal API
    /\bref\s*(?:<[^>]*>)?\s*\(/, // ref() Vue-compat alias
    /\bcomputed\s*(?:<[^>]*>)?\s*\(/, // computed() Vue-compat alias
    /\breactive\s*(?:<[^>]*>)?\s*\(/, // reactive() Vue-compat alias
    /\bwatch\s*(?:<[^>]*>)?\s*\(/, // watch() Vue-compat alias
    /\bwatchEffect\s*(?:<[^>]*>)?\s*\(/, // watchEffect() Vue-compat alias
    /data-stx(?:-auto)?(?![-\w])/, // data-stx or data-stx-auto (not data-stx-ref, data-stx-id, etc.)
    /data-stx-scoped/, // client scripts need the signals runtime
  ]

  return signalsPatterns.some(pattern => pattern.test(template))
}

/**
 * Scan content (the inside of an @if/@endif block) for a top-level @else or
 * @elseif. Nested @if ... @endif blocks are skipped so their inner @else
 * doesn't count as a branch for the outer block.
 */
function hasTopLevelElseBranch(content: string): boolean {
  const tokenRegex = /@(if\s*\(|endif|elseif\s*\(|else\b)/g
  let depth = 0
  let m: RegExpExecArray | null
  while ((m = tokenRegex.exec(content)) !== null) {
    const tok = m[1]
    if (tok.startsWith('if')) depth++
    else if (tok === 'endif') depth--
    else if (depth === 0) return true // @else or @elseif at top level
  }
  return false
}

/**
 * Convert @if(expr)...@endif directive blocks to attribute-style for signal templates.
 *
 * This allows the signals runtime to handle reactive conditionals instead of
 * evaluating them at build time with mock values.
 *
 * Converts:
 *   @if(loading())
 *     <div>Loading...</div>
 *   @endif
 *
 * To:
 *   <template @if="loading()">
 *     <div>Loading...</div>
 *   </template>
 *
 * Note: Uses <template> wrapper for blocks with multiple children or text nodes.
 */
export function convertSignalDirectivesToAttributes(template: string): string {
  let output = template

  // Pattern to match @if(expr)...@endif blocks (handles nested parens in expr)
  // We use a simpler approach: find @if( and then parse balanced parens
  const ifDirectiveStart = /@if\s*\(/g
  let match: RegExpExecArray | null
  const replacements: Array<{ start: number, end: number, replacement: string }> = []

  while ((match = ifDirectiveStart.exec(output)) !== null) {
    const startIdx = match.index
    const exprStart = startIdx + match[0].length

    // Find balanced closing paren for the condition
    let depth = 1
    let i = exprStart
    while (i < output.length && depth > 0) {
      if (output[i] === '(') depth++
      else if (output[i] === ')') depth--
      i++
    }

    if (depth !== 0) continue // Unbalanced parens, skip

    const condition = output.substring(exprStart, i - 1).trim()
    const afterCondition = i

    // Find the matching @endif (handle nested @if)
    let ifDepth = 1
    let endIdx = afterCondition
    const endifRegex = /@(if\s*\(|endif)/g
    endifRegex.lastIndex = afterCondition

    let endMatch: RegExpExecArray | null
    while ((endMatch = endifRegex.exec(output)) !== null) {
      if (endMatch[1].startsWith('if')) {
        ifDepth++
      }
      else if (endMatch[1] === 'endif') {
        ifDepth--
        if (ifDepth === 0) {
          endIdx = endMatch.index + endMatch[0].length
          break
        }
      }
    }

    if (ifDepth !== 0) continue // No matching @endif, skip

    // Extract content between ) and @endif
    const content = output.substring(afterCondition, endIdx - '@endif'.length).trim()

    // Skip blocks containing @else / @elseif — the reactive attribute form is
    // a simple boolean show/hide, while branching requires the full server-side
    // conditional processor. Leave these for `processConditionals` to handle.
    // We scan at the top level only (ignoring @else inside nested @if blocks).
    if (hasTopLevelElseBranch(content)) continue

    // Check if content is a single element or needs wrapper
    // Handle > in attribute values by matching quoted attrs properly
    const singleElementMatch = content.match(/^<([a-zA-Z][a-zA-Z0-9-]*)\b((?:\s+[^=\s>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*)>([\s\S]*)<\/\1>$/s)

    let replacement: string
    if (singleElementMatch) {
      // Single root element - add @if attribute directly
      const [, tag, attrs, innerContent] = singleElementMatch
      // Escape double quotes in condition to avoid breaking the attribute
      const escapedCondition = condition.replace(/"/g, '&quot;')
      replacement = `<${tag}${attrs} @if="${escapedCondition}">${innerContent}</${tag}>`
    }
    else {
      // Multiple elements or text - wrap in template
      const escapedCondition = condition.replace(/"/g, '&quot;')
      replacement = `<template @if="${escapedCondition}">${content}</template>`
    }

    replacements.push({ start: startIdx, end: endIdx, replacement })
  }

  // Apply replacements from end to start to preserve indices
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i]
    output = output.substring(0, start) + replacement + output.substring(end)
  }

  return output
}

/**
 * Convert @for(item in items())...@endfor directive blocks to attribute-style.
 *
 * Converts:
 *   @for(item in items())
 *     <div>{{ item.name }}</div>
 *   @endfor
 *
 * To:
 *   <template @for="item in items()">
 *     <div>{{ item.name }}</div>
 *   </template>
 */
export function convertSignalLoopsToAttributes(template: string, context?: Record<string, any>): string {
  let output = template

  // Pattern to match @for(expr)...@endfor or @foreach(expr)...@endforeach
  const forDirectiveStart = /@(for|foreach)\s*\(/g
  let match: RegExpExecArray | null
  const replacements: Array<{ start: number, end: number, replacement: string }> = []

  while ((match = forDirectiveStart.exec(output)) !== null) {
    const directive = match[1] // 'for' or 'foreach'
    const startIdx = match.index
    const exprStart = startIdx + match[0].length

    // Find balanced closing paren
    let depth = 1
    let i = exprStart
    while (i < output.length && depth > 0) {
      if (output[i] === '(') depth++
      else if (output[i] === ')') depth--
      i++
    }

    if (depth !== 0) continue

    let expr = output.substring(exprStart, i - 1).trim()
    const afterExpr = i

    // Parse the loop expression to get the iterable side.
    // Accepts ALL common forms:
    //   Blade-style "iterable as item"
    //   Blade-style "iterable as idx => item"
    //   Blade-style "iterable as (item, idx)"           (Vue/Alpine parenthesized)
    //   Blade-style "iterable as item, idx"             (JS destructure-ish)
    //   JS-style    "item in iterable"
    //   JS-style    "(item, idx) in iterable"
    //   JS-style    "item of iterable"
    //
    // Previously the "as" regex accepted only "item" or "item, idx" — so
    // `idx => item` / `(item, idx)` fell through to client-side conversion
    // even when the iterable was server-side data. See tests in
    // test/signal-processing.test.ts.
    const parsed = parseLoopExpression(expr)

    if (parsed.iterable) {
      const iter = parsed.iterable.trim()
      // Literal iterables (array/object/string/number) are self-contained and
      // always resolvable server-side — let processLoops handle them.
      if (iter.startsWith('[') || iter.startsWith('{') || iter.startsWith('\'') || iter.startsWith('"') || iter.startsWith('`') || /^-?\d/.test(iter)) {
        continue
      }
      if (context) {
        // Extract the root variable name (e.g. "items" from "items" or "obj.items")
        const rootVar = iter.split(/[.[(]/)[0].trim()
        if (rootVar && rootVar in context) {
          // This iterable is server-side data — skip conversion, let processLoops handle it
          continue
        }
      }
    }

    // Convert Blade-style "iterable as item" / "iterable as idx => item" to
    // JS-style "item in iterable" / "(item, idx) in iterable" for the client runtime
    if (parsed.style === 'as') {
      expr = parsed.indexVar
        ? `(${parsed.itemVar}, ${parsed.indexVar}) in ${parsed.iterable}`
        : `${parsed.itemVar} in ${parsed.iterable}`
    }

    // Find matching @endfor or @endforeach
    const endTag = directive === 'for' ? '@endfor' : '@endforeach'
    let forDepth = 1
    let endIdx = afterExpr
    const endRegex = directive === 'for'
      ? new RegExp(`@(for(?!each)\\s*\\(|endfor(?!each))`, 'g')
      : new RegExp(`@(${directive}\\s*\\(|end${directive})`, 'g')
    endRegex.lastIndex = afterExpr

    let endMatch: RegExpExecArray | null
    while ((endMatch = endRegex.exec(output)) !== null) {
      if (endMatch[1].startsWith(directive)) {
        forDepth++
      }
      else {
        forDepth--
        if (forDepth === 0) {
          endIdx = endMatch.index + endMatch[0].length
          break
        }
      }
    }

    if (forDepth !== 0) continue

    const content = output.substring(afterExpr, endIdx - endTag.length).trim()

    // Check for single root element
    // Handle > in attribute values by matching quoted attrs properly
    const singleElementMatch = content.match(/^<([a-zA-Z][a-zA-Z0-9-]*)\b((?:\s+[^=\s>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*)>([\s\S]*)<\/\1>$/s)

    let replacement: string
    if (singleElementMatch) {
      const [, tag, attrs, innerContent] = singleElementMatch
      replacement = `<${tag}${attrs} @for="${expr}">${innerContent}</${tag}>`
    }
    else {
      replacement = `<template @for="${expr}">${content}</template>`
    }

    replacements.push({ start: startIdx, end: endIdx, replacement })
  }

  // Apply replacements from end to start
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i]
    output = output.substring(0, start) + replacement + output.substring(end)
  }

  return output
}

/**
 * Process scripts that use STX signal APIs.
 *
 * Automatically detects scripts using state(), derived(), effect() and
 * transforms them into setup functions for the signals runtime.
 *
 * ```html
 * <script>
 *   const count = state(0)
 *   const doubled = derived(() => count() * 2)
 * </script>
 * ```
 */
// Strip duplicate top-level const/let/var declarations. When merging multiple
// signal scripts (layout + page), the same name can be declared twice — e.g.
// both calling useStore('favorites'). We keep the first occurrence and
// replace later duplicates with a marker comment so `const` doesn't clash.
// The scanner walks brace depth (so `const x` inside a function body isn't
// counted as top-level), tracks string literals, and skips entire statements
// it has already seen at top level.
function dedupeTopLevelDeclarations(code: string): string {
  const seen = new Set<string>()
  const out: string[] = []

  let i = 0
  let depth = 0 // brace depth — top-level means depth === 0
  const len = code.length

  const skipString = (quote: string): number => {
    let j = i + 1
    while (j < len) {
      const ch = code[j]
      if (ch === '\\') { j += 2; continue }
      if (ch === quote) return j + 1
      j++
    }
    return len
  }

  const skipLineComment = (): number => {
    let j = i + 2
    while (j < len && code[j] !== '\n') j++
    return j
  }

  const skipBlockComment = (): number => {
    let j = i + 2
    while (j < len - 1) {
      if (code[j] === '*' && code[j + 1] === '/') return j + 2
      j++
    }
    return len
  }

  // Finds the end of a statement starting at `i` (just past the declarator
  // keyword). Walks until a top-level `;` or a newline that looks safe —
  // matching braces/brackets/parens and skipping strings and comments along
  // the way so function expressions and object literals inside the value
  // don't fool us.
  const findStatementEnd = (start: number): number => {
    let j = start
    let d = 0 // local depth for (), [], {}
    while (j < len) {
      const ch = code[j]
      if (ch === '/' && code[j + 1] === '/') {
        let k = j + 2
        while (k < len && code[k] !== '\n') k++
        j = k; continue
      }
      if (ch === '/' && code[j + 1] === '*') {
        let k = j + 2
        while (k < len - 1 && !(code[k] === '*' && code[k + 1] === '/')) k++
        j = k + 2; continue
      }
      if (ch === '"' || ch === '\'' || ch === '`') {
        let k = j + 1
        while (k < len) {
          if (code[k] === '\\') { k += 2; continue }
          if (code[k] === ch) { k++; break }
          k++
        }
        j = k; continue
      }
      if (ch === '(' || ch === '[' || ch === '{') { d++; j++; continue }
      if (ch === ')' || ch === ']' || ch === '}') { d--; j++; continue }
      if (ch === ';' && d === 0) return j + 1
      // Avoid false-positives on newlines — the statement might span lines
      // (e.g. a multi-line object literal). Only terminate on ';' at d === 0.
      j++
    }
    return len
  }

  while (i < len) {
    const ch = code[i]

    // Comments
    if (ch === '/' && code[i + 1] === '/') {
      const end = skipLineComment()
      out.push(code.slice(i, end))
      i = end
      continue
    }
    if (ch === '/' && code[i + 1] === '*') {
      const end = skipBlockComment()
      out.push(code.slice(i, end))
      i = end
      continue
    }

    // Strings — treat as opaque so `const x = "foo"` doesn't get confused.
    if (ch === '"' || ch === '\'' || ch === '`') {
      const end = skipString(ch)
      out.push(code.slice(i, end))
      i = end
      continue
    }

    // Brace depth
    if (ch === '{') { depth++; out.push(ch); i++; continue }
    if (ch === '}') { depth--; out.push(ch); i++; continue }

    // Only handle declarators at top level.
    if (depth === 0) {
      // Must be at a statement boundary — previous non-whitespace char is ;, {, } or start of file
      // Simplest: require word boundary (previous char is whitespace or nothing).
      const prev = i > 0 ? code[i - 1] : ''
      const atBoundary = prev === '' || /\s/.test(prev) || prev === ';' || prev === '}' || prev === '{'

      if (atBoundary) {
        const m = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/)
        if (m) {
          const name = m[2]
          const stmtEnd = findStatementEnd(i + m[0].length)
          if (seen.has(name)) {
            // Strip the whole statement, replacing with a comment so source
            // maps and line counts stay roughly stable.
            out.push(`/* stx: deduped const ${name} */`)
            i = stmtEnd
            continue
          }
          seen.add(name)
          out.push(code.slice(i, stmtEnd))
          i = stmtEnd
          continue
        }
      }
    }

    out.push(ch)
    i++
  }

  return out.join('')
}

export async function processScriptSetup(template: string, filePath?: string): Promise<{ output: string, setupCode: string | null }> {
  // Walk the template like a browser: find each `<script>` opening tag, then
  // the FIRST `</script>` that closes it — don't re-scan for nested `<script`
  // substrings inside script bodies. This prevents false matches against
  // literal `<script>` text inside comments or string literals in an
  // already-emitted signals runtime (e.g. a comment like `// partial <script client> blocks`).
  const scripts = scanScriptTags(template, {
    skipAttrs: /\bserver\b|\bsrc\s*=|\bdata-stx-scoped\b|\bdata-stx-router\b/,
  })

  // Broader signal-API detection — layout scripts may use store/composable
  // APIs without bare state/derived calls, and we still want those merged
  // into the single setup function so their reactivity wires into the same
  // componentScope as the page's bindings.
  const SIGNAL_API_RE = /\b(?:state|derived|effect|ref|reactive|computed|watch|watchEffect|useStore|useLocalStorage|useSessionStorage|useFetch|useRef|useEventListener|useDebounce|useDebouncedValue|useThrottle|useInterval|useTimeout|useToggle|useCounter|useClickOutside|useFocus|useAsync|useColorMode|useDark|useWebSocket|useRoute|useSearchParams|onMount|onDestroy)\s*(?:<[^>]*>)?\s*\(/

  // Collect every signal-using script in document order (layout first, page
  // last). They'll all be merged into a single __stx_setup_ function so every
  // signal declaration ends up in the same componentScope. This replaces the
  // old first-script-only behavior that left subsequent signal scripts for
  // processClientScript to stx.mount() wrap — which set __stx_scope on the
  // sibling <main> and blocked processElement from walking page content.
  const signalScripts: { fullMatch: string, attrs: string, content: string }[] = []

  for (const s of scripts) {
    let content = s.body
    if (shouldTranspileTypeScript(s.attrs)) {
      content = transpileTypeScript(content)
    }
    if (SIGNAL_API_RE.test(content)) {
      signalScripts.push({ fullMatch: s.fullMatch, attrs: s.attrs, content })
    }
  }

  if (signalScripts.length === 0) {
    return { output: template, setupCode: null }
  }

  const setupFnName = `__stx_setup_${Date.now()}_${signalSetupCounter++}`

  // Bundle user imports and resolve store imports for each script, then
  // concatenate. Scripts are processed in document order, so later scripts
  // (usually the page) can see earlier declarations (usually the layout).
  const { hasUserImports, bundleClientScript } = await import('./client-script-bundler')
  const resolvedParts: string[] = []
  for (let i = 0; i < signalScripts.length; i++) {
    let scriptContent = signalScripts[i].content
    if (hasUserImports(scriptContent)) {
      console.log('[stx:bundler] bundling signal script imports')
      scriptContent = await bundleClientScript(scriptContent, filePath || '', {
        projectRoot: process.cwd(),
      })
    }
    const resolved = transformStoreImports(scriptContent)
    resolvedParts.push(`// ── merged signal script #${i + 1} ──\n${resolved}`)
  }
  let mergedContent = resolvedParts.join('\n\n')

  // Dedup top-level `const/let/var NAME = …` across merged scripts. When
  // layout and page both declare `const favorites = useStore('favorites')`,
  // plain concatenation would throw "Identifier 'favorites' has already been
  // declared". We keep the first declaration and strip later duplicates —
  // this is safe for the common useStore()/useLocalStorage() case where both
  // sides resolve to the same singleton. (Intentional shadowing across
  // scripts is a user anti-pattern; name them differently.)
  mergedContent = dedupeTopLevelDeclarations(mergedContent)
  const mergedExports = extractExports(mergedContent)

  // Generate the setup function that provides signal APIs. Mark the script
  // with data-stx-scoped so the client-script loop skips it.
  const setupCode = `
<script data-stx-scoped>
function ${setupFnName}() {
  const { state, derived, effect, batch, onMount, onDestroy, defineStore, useStore, useFetch, useRef, useQuery, useMutation, useDebounce, useDebouncedValue, useThrottle, useInterval, useTimeout, useToggle, useCounter, useClickOutside, useFocus, useAsync, useLocalStorage, useEventListener, useWebSocket, useColorMode, useDark, useHead, useSeoMeta, useRoute, useSearchParams, navigate, goBack, goForward, provide, ref, reactive, computed, watch, watchEffect } = window.stx;
${mergedContent}
  return { ${mergedExports} };
}
if(window.stx)window.stx._latestSetup=${setupFnName};
</script>`

  // Remove ALL matched original scripts, then tag body with data-stx so the
  // runtime invokes the merged setup once on DOMContentLoaded.
  let output = template
  for (const s of signalScripts) {
    output = output.split(s.fullMatch).join('')
  }

  if (output.includes('<body')) {
    output = output.replace(/<body([^>]*)>/, `<body$1 data-stx="${setupFnName}">`)
  }
  else {
    const skipTags = ['script', 'style', 'html', 'head', 'meta', 'link', 'title', '!doctype']
    output = output.replace(/<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/i, (match, tag, attrs) => {
      if (skipTags.includes(tag.toLowerCase())) return match
      return `<${tag}${attrs} data-stx="${setupFnName}">`
    })
  }

  return { output, setupCode }
}

/**
 * Extract exported variable names from setup script.
 * Returns variables that should be exposed to the template.
 * Only extracts TOP-LEVEL declarations, not variables inside nested functions.
 */
export function extractExports(setupContent: string): string {
  const code = setupContent
  const names: string[] = []
  const seen = new Set<string>()

  // Track brace depth to only capture top-level declarations
  let depth = 0
  let i = 0
  const len = code.length

  // Skip string literals
  const skipString = (quote: string): void => {
    i++ // Skip opening quote
    while (i < len) {
      if (code[i] === '\\') {
        i += 2 // Skip escaped character
        continue
      }
      if (code[i] === quote) {
        i++ // Skip closing quote
        return
      }
      i++
    }
  }

  // Skip template literals with nested expressions
  const skipTemplateLiteral = (): void => {
    i++ // Skip opening backtick
    while (i < len) {
      if (code[i] === '\\') {
        i += 2
        continue
      }
      if (code[i] === '`') {
        i++
        return
      }
      if (code[i] === '$' && code[i + 1] === '{') {
        i += 2
        let templateDepth = 1
        while (i < len && templateDepth > 0) {
          if (code[i] === '{') templateDepth++
          else if (code[i] === '}') templateDepth--
          else if (code[i] === '\'' || code[i] === '"') skipString(code[i])
          else if (code[i] === '`') skipTemplateLiteral()
          else i++
        }
        continue
      }
      i++
    }
  }

  // Skip comments
  const skipComment = (): boolean => {
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < len && code[i] !== '\n') i++
      return true
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2
      while (i < len - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      return true
    }
    return false
  }

  // Check for variable/function declaration at current position (only at depth 0)
  const checkDeclaration = (): void => {
    if (depth !== 0) return

    // Check for const/let/var declarations
    const declMatch = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)
    if (declMatch) {
      const varName = declMatch[2]
      if (!seen.has(varName)) {
        names.push(varName)
        seen.add(varName)
      }
      return
    }

    // Check for function declarations
    const funcMatch = code.slice(i).match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
      return
    }

    // Check for async function declarations
    const asyncMatch = code.slice(i).match(/^async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (asyncMatch) {
      const funcName = asyncMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
    }
  }

  while (i < len) {
    // Skip comments
    if (skipComment()) continue

    // Skip string literals
    if (code[i] === '\'' || code[i] === '"') {
      skipString(code[i])
      continue
    }

    // Skip template literals
    if (code[i] === '`') {
      skipTemplateLiteral()
      continue
    }

    // Track brace depth
    if (code[i] === '{') {
      depth++
      i++
      continue
    }
    if (code[i] === '}') {
      depth--
      i++
      continue
    }

    // Check for declarations at word boundaries (only at depth 0)
    if (depth === 0 && /[a-z]/i.test(code[i]) && (i === 0 || /\s|[;{}()]/.test(code[i - 1]))) {
      checkDeclaration()
    }

    i++
  }

  return names.join(', ')
}

/**
 * Main orchestrator for signal processing.
 *
 * Detects signal syntax, wraps scripts in setup functions,
 * injects the signals runtime and browser runtime.
 */
export async function processSignals(template: string, options: StxOptions, filePath?: string): Promise<string> {
  if (!hasSignalsSyntax(template)) {
    return template
  }

  let output = template

  // Skip full processing for nested components - they just keep their scripts
  // The parent template will inject the runtime once
  if (options.skipSignalsRuntime) {
    return output
  }

  // Process <script setup> blocks
  const { output: processedOutput, setupCode } = await processScriptSetup(output, filePath)
  output = processedOutput

  // Inject the signals runtime
  output = await injectSignalsRuntime(output, options)

  // Inject browser runtime if needed (for auto-imports from @stacksjs/browser)
  output = injectBrowserRuntime(output)

  // Inject setup code after runtime
  if (setupCode) {
    if (output.includes('</head>')) {
      output = output.replace('</head>', `${setupCode}\n</head>`)
    }
    else if (output.includes('<body')) {
      output = output.replace(/<body([^>]*)>/, `<body$1>\n${setupCode}`)
    }
    else {
      output = output + '\n' + setupCode
    }
  }

  // If no setup code but has signals syntax, add data-stx-auto to body for auto-processing
  // Check if body already has data-stx attribute (not just any occurrence in the template)
  const bodyMatch = output.match(/<body([^>]*)>/i)
  const bodyHasDataStx = bodyMatch && /data-stx/.test(bodyMatch[1])

  if (!setupCode && !bodyHasDataStx) {
    if (output.includes('<body') && bodyMatch && !/data-stx-auto/.test(bodyMatch[1])) {
      output = output.replace(/<body([^>]*)>/, '<body$1 data-stx-auto>')
    }
  }

  return output
}
