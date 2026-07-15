/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Includes Module
 *
 * Processes include, partial, and stack directives for template composition.
 * This module enables building complex templates from reusable pieces.
 *
 * ## Include Directives
 *
 * | Directive | Description |
 * |-----------|-------------|
 * | `@include('path')` | Include a partial template |
 * | `@include('path', { vars })` | Include with local variables |
 * | `@partial('path')` | Alias for @include |
 * | `@includeIf('path')` | Include only if file exists |
 * | `@includeWhen(cond, 'path')` | Include if condition is true |
 * | `@includeUnless(cond, 'path')` | Include if condition is false |
 * | `@includeFirst(['a','b'])` | Include first existing file |
 * | `@once...@endonce` | Include content only once per request |
 *
 * ## Stack Directives
 *
 * | Directive | Description |
 * |-----------|-------------|
 * | `@push('name')...@endpush` | Add content to end of stack |
 * | `@prepend('name')...@endprepend` | Add content to start of stack |
 * | `@stack('name')` | Output stack contents |
 *
 * ## Path Resolution
 *
 * Paths are resolved in this order:
 * 1. If path starts with `./` or `../`: Relative to current template
 * 2. Otherwise: Relative to `partialsDir` (from config)
 *
 * Paths without `.stx` extension automatically get it appended.
 *
 * ## Security
 *
 * Path traversal attacks are blocked. Includes must resolve to:
 * - The configured partials directory, OR
 * - The directory containing the current template
 *
 * Uses safe evaluation for expression evaluation to prevent code injection.
 *
 * ## @once Directive
 *
 * The `@once` directive ensures content is only rendered once per request.
 * This is useful for including scripts or styles that should not be duplicated.
 *
 * **Important**: In server environments, use request-scoped tracking:
 *
 * ```typescript
 * // Option 1: Clear global store per request
 * app.use((req, res, next) => {
 *   clearOnceStore()
 *   next()
 * })
 *
 * // Option 2: Use request-scoped store (recommended)
 * const context = {
 *   __onceStore: new Set<string>(),
 *   ...otherData
 * }
 * ```
 *
 * @module includes
 */

import type { StxOptions } from './types'
import path from 'node:path'
import { processConditionals } from './conditionals'
import { isProduction, isTest } from './env'
import { processExpressions, usesSignalsInScript } from './expressions'
import { LRUCache } from './performance-utils'
import { createSafeFunction, isExpressionSafe, safeEvaluate, safeEvaluateObject } from './safe-evaluator'
import { transformStoreImports } from './store-imports'
import { createDetailedErrorMessage, fileExists, shouldTranspileTypeScript, transpileTypeScript } from './utils'

// =============================================================================
// Balanced Parsing Helpers
// =============================================================================

/**
 * Find the end of a balanced brace expression starting at `{`.
 * Returns the index after the closing `}`, or -1 if unbalanced.
 */
function findBalancedBraces(str: string, start: number): number {
  if (str[start] !== '{') return -1
  let depth = 1
  let pos = start + 1
  while (pos < str.length && depth > 0) {
    if (str[pos] === '{') depth++
    else if (str[pos] === '}') depth--
    pos++
  }
  return depth === 0 ? pos : -1
}

/**
 * Find the next comma at the top level (not inside parens/brackets/braces),
 * starting from the given position within a parenthesized directive.
 */
function findTopLevelComma(str: string, start: number): number {
  let depth = 0
  for (let i = start; i < str.length; i++) {
    const ch = str[i]
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') depth--
    else if (ch === ',' && depth === 0) return i
  }
  return -1
}

/**
 * Replace @directive(...) with @newName(...) using balanced paren matching.
 * This handles nested objects and expressions inside the parentheses.
 */
function replaceDirectiveBalanced(template: string, directive: string, newName: string): string {
  let result = template
  const pattern = new RegExp(`${directive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`, 'g')
  let match = pattern.exec(result)
  while (match) {
    const start = match.index
    const openParen = start + match[0].length - 1
    let depth = 1
    let pos = openParen + 1
    while (pos < result.length && depth > 0) {
      if (result[pos] === '(') depth++
      else if (result[pos] === ')') depth--
      pos++
    }
    if (depth !== 0) break
    const inner = result.substring(openParen + 1, pos - 1)
    const replacement = `${newName}(${inner})`
    result = result.substring(0, start) + replacement + result.substring(pos)
    pattern.lastIndex = start + replacement.length
    match = pattern.exec(result)
  }
  return result
}

// =============================================================================
// Signal Script Processing for Included Components
// =============================================================================

/**
 * Check if script content uses signal APIs (state, derived, effect)
 */
function hasSignalApis(scriptContent: string): boolean {
  return /\b(state|derived|effect)\s*(?:<[^<>()]*>)?\s*\(/.test(scriptContent)
}

/**
 * Extract top-level variable/function names from script for scope registration.
 * Only extracts TOP-LEVEL declarations, not variables inside nested functions.
 */
function extractExports(setupContent: string): string {
  const code = setupContent
  const names: string[] = []
  const seen = new Set<string>()

  let depth = 0
  let i = 0
  const len = code.length

  const skipString = (quote: string): void => {
    i++
    while (i < len) {
      if (code[i] === '\\') { i += 2; continue }
      if (code[i] === quote) { i++; return }
      i++
    }
  }

  const skipTemplateLiteral = (): void => {
    i++
    while (i < len) {
      if (code[i] === '\\') { i += 2; continue }
      if (code[i] === '`') { i++; return }
      if (code[i] === '$' && code[i + 1] === '{') {
        i += 2
        let templateDepth = 1
        while (i < len && templateDepth > 0) {
          if (code[i] === '{') { templateDepth++; i++ }
          else if (code[i] === '}') { templateDepth--; i++ }
          else if (code[i] === '\'' || code[i] === '"') skipString(code[i])
          else if (code[i] === '`') skipTemplateLiteral()
          else i++
        }
        continue
      }
      i++
    }
  }

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

  const checkDeclaration = (): void => {
    if (depth !== 0) return
    const declMatch = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)
    if (declMatch) {
      const varName = declMatch[2]
      if (!seen.has(varName)) { names.push(varName); seen.add(varName) }
      return
    }
    const funcMatch = code.slice(i).match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      if (!seen.has(funcName)) { names.push(funcName); seen.add(funcName) }
      return
    }
    const asyncMatch = code.slice(i).match(/^async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (asyncMatch) {
      const funcName = asyncMatch[1]
      if (!seen.has(funcName)) { names.push(funcName); seen.add(funcName) }
    }
  }

  while (i < len) {
    if (skipComment()) continue
    if (code[i] === '\'' || code[i] === '"') { skipString(code[i]); continue }
    if (code[i] === '`') { skipTemplateLiteral(); continue }
    if (code[i] === '{') { depth++; i++; continue }
    if (code[i] === '}') { depth--; i++; continue }
    if (depth === 0 && /[a-z]/i.test(code[i]) && (i === 0 || /\s|[;{}()]/.test(code[i - 1]))) {
      checkDeclaration()
    }
    i++
  }

  return names.join(', ')
}

/**
 * Transform a signal script into a scope-registering IIFE.
 * This allows the STX runtime to pick up component variables.
 */
/**
 * Wrap user client-script content in the standard stx IIFE shell:
 * destructure the stx runtime globals from `window.stx` (so user code
 * can write `useRef(...)` / `onMount(...)` without explicit imports),
 * stage a `__destroyHooks` channel so framework cleanup runs at
 * teardown, and isolate everything in an IIFE so multiple component
 * scripts on the same page don't collide on top-level identifiers.
 *
 * Returns the bare wrapper — used by both `transformSignalScript`
 * (which then appends scope registration) and the non-signal branch
 * (which just needs the runtime globals available). Keeping the
 * destructure list in one place means a new global only needs to be
 * added here, not in two parallel sites.
 */
function wrapClientScript(scriptContent: string, tail = ''): string {
  return `
(function() {
  var { state, derived, effect, batch, onMount, onDestroy, defineStore, useStore, useFetch, useRef, useQuery, useMutation, useOptimistic, useDebounce, useDebouncedValue, useThrottle, useInterval, useTimeout, useToggle, useCounter, useClickOutside, useFocus, useAsync, useLocalStorage, useSessionStorage, useCookie, useReactiveProp, useEventListener, useWebSocket, useColorMode, useDark, useHead, useSeoMeta, definePageMeta, useRoute, useSearchParams, navigate, goBack, goForward, provide, ref, reactive, computed, watch, watchEffect, defineProps, withDefaults, defineEmits, defineExpose, defineSlots } = window.stx;
  var __destroyHooks = [];
  var __origOnDestroy = onDestroy;
  onDestroy = function(fn) { __origOnDestroy(fn); __destroyHooks.push(fn); };

${scriptContent}
${tail}})();
`
}

function transformSignalScript(scriptContent: string, scopeId: string): string {
  const exports = extractExports(scriptContent)
  const exportNames = exports.split(',').map(s => s.trim()).filter(Boolean)

  // Build the scope assignment defensively. `extractExports` is a
  // heuristic walker — when client scripts include bundled third-party
  // sources (e.g. `ts-medium-editor` inlined via Bun.build) the depth
  // tracker can mis-identify inner-scope vars as top-level, putting
  // names like `message`, `parent`, `frag` into the export list. Doing
  // `{ message, ... }` then throws `ReferenceError: message is not
  // defined` at hydration and kills the whole scope's registration.
  // Wrap each property in a try/catch so a stray harvested name turns
  // into `undefined` instead of a fatal ReferenceError.
  const scopeAssign = exportNames.map(name =>
    `  try { __scopeRegistration[${JSON.stringify(name)}] = ${name}; } catch (e) { /* not actually top-level */ }`,
  ).join('\n')

  // Use real window.stx APIs (signals runtime is injected in <head>, runs before this script).
  // No polyfill fallbacks — they create signals without ._isSignal which breaks auto-unwrap
  // and effect tracking in the signals runtime.
  const tail = `
  // Register scope variables for STX runtime
  if (!window.stx._scopes) window.stx._scopes = {};
  var __scopeRegistration = { __destroyCallbacks: __destroyHooks };
${scopeAssign}
  // #1767: when the bundler renamed a component const that collided with an
  // inlined import (foo -> foo2), rebind the ORIGINAL template name to the
  // renamed declaration so it resolves to the component's value, not the
  // shadowing import. __stxScopeRenames is emitted by bundleClientScript.
  try { if (typeof __stxScopeRenames !== 'undefined' && __stxScopeRenames) { for (var __stxRK in __stxScopeRenames) __scopeRegistration[__stxRK] = __stxScopeRenames[__stxRK]; } } catch (e) { /* no renames */ }
  window.stx._scopes['${scopeId}'] = __scopeRegistration;
`
  // Set __STX_CURRENT_ELEMENT__ to this scope's root element while the body runs,
  // so element-aware primitives invoked at partial-scope time — useQuery/useFetch
  // ({ suspense: true }) registering with the nearest <Suspense> boundary,
  // defineProps/defineEmits — resolve against the right element (#1742). The
  // scope element is already in the DOM when this inline script executes. The
  // try/finally wraps the IIFE call so __STX_CURRENT_ELEMENT__ is always restored.
  const head = `
(function() {
  var __stxScopeEl = (typeof document !== 'undefined') ? document.querySelector('[data-stx-scope="${scopeId}"]') : null;
  var __stxPrevEl = (typeof window !== 'undefined') ? window.__STX_CURRENT_ELEMENT__ : undefined;
  if (__stxScopeEl && typeof window !== 'undefined') window.__STX_CURRENT_ELEMENT__ = __stxScopeEl;
  try {`
  const foot = `
  } finally {
    if (typeof window !== 'undefined') window.__STX_CURRENT_ELEMENT__ = __stxPrevEl;
  }
})();`
  return head + wrapClientScript(scriptContent, tail) + foot
}

/**
 * Add data-stx-scope attribute to the first element in HTML content
 */
function addScopeToRootElement(html: string, scopeId: string): { html: string, mergedIntoExisting: string | null } {
  // Skip comments (real <!-- --> and masked \x00STX_HTML_COMMENT_N\x00
  // placeholders from process.ts), whitespace, and find the first real element
  const elementMatch = html.match(/^(\s*(?:(?:<!--[\s\S]*?-->|\x00STX_HTML_COMMENT_\d+\x00)\s*)*)(<[a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*>|>)/s)
  if (elementMatch) {
    const rootTag = elementMatch[2] + elementMatch[3]
    // Check if root element already has data-stx-scope (from x-data reactive bridge)
    const existingScope = rootTag.match(/data-stx-scope="([^"]*)"/)
    if (existingScope) {
      // Don't add a duplicate — return the existing scope ID so the caller
      // can register signals under that scope instead
      return { html, mergedIntoExisting: existingScope[1] }
    }
    const before = elementMatch[1]
    const tagStart = elementMatch[2]
    const afterTag = elementMatch[3]
    return {
      html: `${before}${tagStart} data-stx-scope="${scopeId}"${afterTag}${html.slice(elementMatch[0].length)}`,
      mergedIntoExisting: null,
    }
  }
  return { html, mergedIntoExisting: null }
}

// Counter for generating unique scope IDs
let scopeIdCounter = 0

// Cache for partials to avoid repeated file reads (LRU with max 500 entries)
export const partialsCache: LRUCache<string, string> = new LRUCache<string, string>(500)

// Global store to track what has been included via @once
// WARNING: This persists across requests in long-running servers!
// Use clearOnceStore() at the start of each request, or use request-scoped tracking via context.__onceStore
export const onceStore: Set<string> = new Set()

/**
 * Clear the @once store - useful for testing and resetting state
 *
 * IMPORTANT: In server environments, call this at the start of each request
 * to prevent @once content from being incorrectly skipped across requests.
 *
 * Alternatively, use request-scoped tracking by setting `context.__onceStore = new Set()`
 * before processing templates. The processor will use context.__onceStore if available.
 *
 * @example
 * ```typescript
 * // Option 1: Clear global store per request
 * app.use((req, res, next) => {
 *   clearOnceStore()
 *   next()
 * })
 *
 * // Option 2: Use request-scoped store (preferred)
 * const context = {
 *   __onceStore: new Set<string>(),
 *   ...otherData
 * }
 * await processDirectives(template, context, filePath, options)
 * ```
 */
export function clearOnceStore(): void {
  onceStore.clear()
}

/**
 * Get the @once store to use - prefers request-scoped if available
 */
function getOnceStore(context: Record<string, any>): Set<string> {
  // Prefer request-scoped store if available
  if (context.__onceStore instanceof Set) {
    return context.__onceStore
  }
  // Fall back to global store (with warning in debug mode)
  return onceStore
}

/**
 * Process @include, @partial, @includeIf, @includeWhen, @includeUnless,
 * @includeFirst, and @once directives.
 *
 * This is the main function for include processing. It handles all include
 * variants and the @once directive for deduplication.
 *
 * @param template - The template string to process
 * @param context - Template context with variables
 * @param filePath - Path to the current template file
 * @param options - STX processing options
 * @param dependencies - Set to track included file dependencies (for caching)
 * @returns The processed template with includes resolved
 *
 * @example
 * ```typescript
 * const deps = new Set<string>()
 * const result = await processIncludes(
 *   '@include("header") <main>Content</main> @include("footer")',
 *   { title: 'My Page' },
 *   '/app/views/home.stx',
 *   options,
 *   deps
 * )
 * // deps now contains paths to header.stx and footer.stx
 * ```
 */
export async function processIncludes(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
  includeStack: Set<string> = new Set(),
): Promise<string> {
  // Get the partials directory and resolve to absolute path if needed
  let partialsDir = options.partialsDir || path.join(path.dirname(filePath), 'partials')

  // Resolve relative paths against the app cwd (not the stx package root).
  if (partialsDir && !path.isAbsolute(partialsDir)) {
    partialsDir = path.resolve(process.cwd(), partialsDir)
  }

  // First handle partial alias (replace @partial with @include) using balanced parsing
  let output = replaceDirectiveBalanced(template, '@partial', '@include')

  // Process @once directive - content that should only be included once per request
  // Uses request-scoped store if available (context.__onceStore), otherwise falls back to global
  const activeOnceStore = getOnceStore(context)

  // eslint-disable-next-line pickier/no-unused-vars
  output = output.replace(/@once([\s\S]*?)@endonce/g, (match, content, _offset) => {
    // Create a unique key for this @once block based on content hash
    const contentHash = content.trim()
    const onceKey = `${filePath}:${contentHash}`

    if (activeOnceStore.has(onceKey)) {
      // Already included, return empty string
      return ''
    }

    // Mark as included and return the content
    activeOnceStore.add(onceKey)
    return content
  })

  // Process special include directives first
  // Process @includeIf directive — rewrite to @include if file exists (balanced parsing)
  {
    const pat = /@includeIf\s*\(/g
    let m: RegExpExecArray | null
    while ((m = pat.exec(output)) !== null) {
      const start = m.index
      const oP = start + m[0].length - 1
      let d = 1, p = oP + 1
      while (p < output.length && d > 0) { if (output[p] === '(') d++; else if (output[p] === ')') d--; p++ }
      if (d !== 0) break
      const inner = output.substring(oP + 1, p - 1)
      const pm = inner.match(/^\s*['"]([^'"]+)['"]/)
      if (!pm) { pat.lastIndex = p; continue }
      const incPath = pm[1]
      const incFile = resolvePath(incPath, partialsDir, filePath)
      let replacement = ''
      if (incFile && await Bun.file(incFile).exists()) {
        dependencies.add(incFile)
        replacement = `@include(${inner})`
      }
      output = output.substring(0, start) + replacement + output.substring(p)
      pat.lastIndex = 0
    }
  }

  // Process @includeWhen/@includeUnless using balanced parsing
  // Handles conditions with commas (e.g., items.slice(0, 5).length > 0)
  for (const [directive, invert] of [['@includeWhen', false], ['@includeUnless', true]] as const) {
    const pat = new RegExp(`${directive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`, 'g')
    let m: RegExpExecArray | null
    while ((m = pat.exec(output)) !== null) {
      const start = m.index
      const oP = start + m[0].length - 1
      // Find balanced closing paren
      let d = 1, p = oP + 1
      while (p < output.length && d > 0) { if (output[p] === '(') d++; else if (output[p] === ')') d--; p++ }
      if (d !== 0) break
      const inner = output.substring(oP + 1, p - 1)

      // Find the first top-level comma that separates condition from path
      const commaIdx = findTopLevelComma(inner, 0)
      if (commaIdx === -1) { pat.lastIndex = p; continue }

      const condition = inner.substring(0, commaIdx).trim()
      const rest = inner.substring(commaIdx + 1).trim()
      const pathMatch = rest.match(/^\s*['"]([^'"]+)['"]/)
      if (!pathMatch) { pat.lastIndex = p; continue }

      const includePath = pathMatch[1]
      const afterPath = rest.substring(pathMatch[0].length)
      let varsString: string | undefined
      const varsComma = findTopLevelComma(afterPath, 0)
      if (varsComma !== -1) {
        varsString = afterPath.substring(varsComma + 1).trim()
      }

      try {
        const condExpr = `Boolean(${condition})`
        let condResult: boolean
        if (isExpressionSafe(condExpr)) {
          const condFn = createSafeFunction(condExpr, Object.keys(context))
          condResult = Boolean(condFn(...Object.values(context)))
        }
else {
          condResult = Boolean(safeEvaluate(condExpr, context))
        }

        const shouldInclude = invert ? !condResult : condResult
        let replacement = ''
        if (shouldInclude) {
          const incFile = resolvePath(includePath, partialsDir, filePath)
          if (incFile && await Bun.file(incFile).exists()) dependencies.add(incFile)
          replacement = `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`
        }
        output = output.substring(0, start) + replacement + output.substring(p)
        pat.lastIndex = 0
      }
catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errHtml = createDetailedErrorMessage('Include', `Error evaluating ${directive} condition: ${errorMessage}`, filePath, template, start)
        output = output.substring(0, start) + errHtml + output.substring(p)
        pat.lastIndex = 0
      }
    }
  }

  // Process @each directive: @each('partial', items, 'itemVar', 'emptyPartial')
  // Renders a partial for each item, or empty partial if array is empty
  {
    const eachPat = /@each\s*\(/g
    let eachMatch: RegExpExecArray | null
    while ((eachMatch = eachPat.exec(output)) !== null) {
      const eStart = eachMatch.index
      const openP = eStart + eachMatch[0].length - 1
      let d = 1, ep = openP + 1
      while (ep < output.length && d > 0) { if (output[ep] === '(') d++; else if (output[ep] === ')') { d--; if (d === 0) break } ep++ }
      if (d !== 0) break
      const innerArgs = output.substring(openP + 1, ep)
      const fullMatch = output.substring(eStart, ep + 1)

      // Parse args: 'partial', arrayExpr, 'itemVar', optional 'emptyPartial'
      const argsMatch = innerArgs.match(/^\s*['"]([^'"]+)['"]\s*,\s*([^,]+)\s*,\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?\s*$/)
      if (!argsMatch) { eachPat.lastIndex = 0; output = output.replace(fullMatch, ''); continue }

      const [, partialName, arrayExpr, itemVar, emptyPartial] = argsMatch

      try {
        // Evaluate the array expression
        let array: unknown
        const trimmedExpr = arrayExpr.trim()
        if (isExpressionSafe(trimmedExpr)) {
          const fn = createSafeFunction(trimmedExpr, Object.keys(context))
          array = fn(...Object.values(context))
        }
else {
          array = safeEvaluate(trimmedExpr, context)
        }

        let replacement = ''
        if (Array.isArray(array) && array.length > 0) {
          for (const item of array) {
            const itemContext = { ...context, [itemVar]: item }
            const processed = await processIncludeHelper(partialName, itemContext, template, eStart)
            replacement += processed
          }
        }
else if (emptyPartial) {
          replacement = await processIncludeHelper(emptyPartial, {}, template, eStart)
        }

        output = output.substring(0, eStart) + replacement + output.substring(ep + 1)
        eachPat.lastIndex = 0
      }
catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        output = output.substring(0, eStart) + createDetailedErrorMessage('Each', `Error in @each: ${errorMessage}`, filePath, template, eStart) + output.substring(ep + 1)
        eachPat.lastIndex = 0
      }
    }
  }

  // Process @includeFirst directive with balanced parenthesis matching
  // This tries multiple includes and uses the first one that exists
  // Supports optional fallback: @includeFirst(['a', 'b'], {}, 'fallback content')
  {
  const includeFirstPat = /@includeFirst\s*\(/g
  let includeFirstMatch: RegExpExecArray | null

  while ((includeFirstMatch = includeFirstPat.exec(output)) !== null) {
    const matchOffset = includeFirstMatch.index
    const openP = matchOffset + includeFirstMatch[0].length - 1
    let d = 1, p = openP + 1
    while (p < output.length && d > 0) { if (output[p] === '(') d++; else if (output[p] === ')') { d--; if (d === 0) break } p++ }
    if (d !== 0) break
    const innerArgs = output.substring(openP + 1, p)
    const fullMatch = output.substring(matchOffset, p + 1)

    // Parse: arrayString, optional varsString, optional fallbackString
    const arrMatch = innerArgs.match(/^\s*(\[[^\]]+\])/)
    if (!arrMatch) { includeFirstPat.lastIndex = 0; output = output.replace(fullMatch, ''); continue }
    const pathArrayString = arrMatch[1]
    let remaining = innerArgs.slice(arrMatch[0].length)

    // Extract vars object using balanced braces
    let varsString: string | undefined
    const varsMatch = remaining.match(/^\s*,\s*\{/)
    if (varsMatch) {
      remaining = remaining.slice(varsMatch[0].length - 1) // keep the {
      let bd = 1, bi = 1
      while (bi < remaining.length && bd > 0) { if (remaining[bi] === '{') bd++; else if (remaining[bi] === '}') { bd--; if (bd === 0) break } bi++ }
      varsString = remaining.substring(0, bi + 1)
      remaining = remaining.slice(bi + 1)
    }

    // Extract fallback
    let fallbackContent: string | undefined
    const fbMatch = remaining.match(/^\s*,\s*['"]([^'"]*)['"]\s*$/)
    if (fbMatch) fallbackContent = fbMatch[1]

    try {
      // Parse the array of paths
      const pathArray = JSON.parse(pathArrayString.replace(/'/g, '"'))

      // Parse local variables if provided using safe evaluation
      let localVars: Record<string, unknown> = {}
      if (varsString) {
        try {
          localVars = safeEvaluateObject(varsString, context)
        }
        catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
          // In production, use fallback; in debug mode, show error
          if (options.debug) {
            const errMsg = createDetailedErrorMessage(
                'Include',
                `Error parsing includeFirst variables: ${errorMessage}`,
                filePath,
                template,
                matchOffset,
                fullMatch,
              )
            output = output.replace(fullMatch, () => errMsg)
          }
          else {
            output = output.replace(fullMatch, () => fallbackContent || '')
          }
          continue
        }
      }

      // Try each path in order
      let foundValidPath = false
      for (const includePath of pathArray) {
        // Get the actual file path
        const includeFilePath = resolvePath(includePath, partialsDir, filePath)
        if (!includeFilePath) {
          continue // Skip to next path
        }

        // Check if file exists
        if (await fileExists(includeFilePath)) {
          // Process the include with our helper function
          const processed = await processIncludeHelper(includePath, localVars, template, matchOffset)
          // Use callback to avoid $ pattern interpretation in replacement
          output = output.replace(fullMatch, () => processed)
          foundValidPath = true
          break
        }
      }

      // No valid include found - use fallback or show error based on debug mode
      if (!foundValidPath) {
        if (fallbackContent !== undefined) {
          // Use provided fallback content (callback to avoid $ pattern interpretation)
          output = output.replace(fullMatch, () => fallbackContent!)
        }
        else if (options.debug) {
          // Show detailed error in debug mode
          const debugMsg = createDetailedErrorMessage(
              'Include',
              `None of the includeFirst paths exist: ${pathArrayString}`,
              filePath,
              template,
              matchOffset,
              fullMatch,
            )
          output = output.replace(fullMatch, () => debugMsg)
        }
        else {
          // In production without fallback, silently remove the directive
          // to prevent breaking the page layout
          output = output.replace(fullMatch, '')
        }
      }
    }
    catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errMsg = createDetailedErrorMessage(
          'Include',
          `Error processing @includeFirst: ${errorMessage}`,
          filePath,
          template,
          matchOffset,
          fullMatch,
        )
      output = output.replace(fullMatch, () => errMsg)
    }

    // Reset regex to start from beginning since we've modified the string
    includeFirstPat.lastIndex = 0
  }
  }

  // Helper function to resolve paths with path traversal protection
  function resolvePath(includePath: string, partialsDir: string, filePath: string): string | null {
    try {
      // Determine the actual file path
      let includeFilePath = includePath

      // If it doesn't end with .stx, add the extension
      if (!includePath.endsWith('.stx')) {
        includeFilePath = `${includePath}.stx`
      }

      // Normalize the partials directory and template directory for comparison
      const normalizedPartialsDir = path.resolve(partialsDir)
      const templateDir = path.resolve(path.dirname(filePath))

      let resolvedPath: string

      // If it's a relative path without ./ or ../, assume it's in the partials directory
      if (!includeFilePath.startsWith('./') && !includeFilePath.startsWith('../')) {
        resolvedPath = path.resolve(partialsDir, includeFilePath)
      }
      else {
        // Otherwise, resolve from the current template directory
        resolvedPath = path.resolve(templateDir, includeFilePath)
      }

      // Normalize the resolved path
      const normalizedResolvedPath = path.normalize(resolvedPath)

      // Security: Prevent path traversal attacks
      // The resolved path must be within:
      // 1. The partials directory, OR
      // 2. The template directory, OR
      // 3. Any sibling directory within 3 parent levels (for typical app structures)
      const isWithinPartialsDir = normalizedResolvedPath.startsWith(normalizedPartialsDir + path.sep)
        || normalizedResolvedPath === normalizedPartialsDir
      const isWithinTemplateDir = normalizedResolvedPath.startsWith(templateDir + path.sep)
        || normalizedResolvedPath === templateDir

      // Check if within sibling directories (up to 1 level up from template dir)
      // Tightened from 3 levels to prevent reaching project root (.env, configs, etc.)
      let isWithinProjectScope = false
      const projectDir = path.dirname(templateDir)
      if (normalizedResolvedPath.startsWith(projectDir + path.sep)) {
        // Additional safety: reject paths to dotfiles and common sensitive files
        const relPath = path.relative(projectDir, normalizedResolvedPath)
        const segments = relPath.split(path.sep)
        const hasDotSegment = segments.some(s => s.startsWith('.') && s !== '.' && s !== '..')
        if (!hasDotSegment) {
          isWithinProjectScope = true
        }
      }

      if (!isWithinPartialsDir && !isWithinTemplateDir && !isWithinProjectScope) {
        console.error(`Security: Path traversal attempt blocked for include path: ${includePath}`)
        console.error(`  Resolved to: ${normalizedResolvedPath}`)
        console.error(`  Allowed dirs: ${normalizedPartialsDir}, ${templateDir}`)
        return null
      }

      return normalizedResolvedPath
    }
    catch (error) {
      console.error(`Error resolving path ${includePath}: ${error}`)
      return null
    }
  }

  // Add current file to include stack for circular detection
  // Use resolved absolute path for accurate tracking across recursive calls
  const currentFilePath = path.resolve(filePath)
  includeStack.add(currentFilePath)

  // Define a helper function to process a single include
  async function processIncludeHelper(includePath: string, localVars: Record<string, any> = {}, templateStr: string, offsetPos: number): Promise<string> {
    // Get resolved path first to check for circular includes
    const includeFilePath = resolvePath(includePath, partialsDir, filePath)
    if (!includeFilePath) {
      return createDetailedErrorMessage(
        'Include',
        `Could not resolve path for include: ${includePath}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }

    // Check for circular includes using resolved absolute path
    const resolvedIncludePath = path.resolve(includeFilePath)
    if (includeStack.has(resolvedIncludePath)) {
      // Build the include chain for a helpful error message
      const chain = [...includeStack, resolvedIncludePath].map(p => path.basename(p)).join(' -> ')
      return createDetailedErrorMessage(
        'Include',
        `Circular include detected: ${chain}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }

    try {
      // Track dependency
      dependencies.add(includeFilePath)

      // Check if the partial is cached
      // Always read from disk in dev mode — partials may have changed
      // The LRU cache is only useful for production builds
      let partialContent: string | undefined

      if (!partialContent) {
        try {
          partialContent = await Bun.file(includeFilePath).text()
        }
        catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
          return createDetailedErrorMessage(
            'Include',
            `Error loading include file ${includePath}: ${errorMessage}`,
            filePath,
            templateStr,
            offsetPos,
          )
        }
      }

      // Streaming SSR (#1746): extract @stream boundaries from the RAW partial
      // before any of the partial's own processing (expressions, loops,
      // conditionals) runs — so each boundary's inner template is captured
      // un-evaluated and can be re-rendered later with $boundary data. Leaves a
      // data-suspense placeholder + fallback in the partial. No-op without @stream.
      if (partialContent && partialContent.includes('@stream')) {
        const { processStreamDirectives } = await import('./streaming')
        partialContent = processStreamDirectives(partialContent, context)
      }

      // #1769: dev-mode tag-balance heads-up on the RAW partial, before SFC
      // extraction / directive processing auto-closes anything. A dropped
      // </div> silently re-parents following siblings and blanks the page with
      // no error at any layer; a coarse per-tag open/close count catches it.
      // On by default in development; opt-in via `debug` elsewhere; off in prod
      // + the test runner. Pre-gated so the dynamic import is dev-only.
      if (partialContent && (options.debug || (!isProduction() && !isTest()))) {
        try {
          const { warnUnbalancedTags } = await import('./template-tag-balance')
          warnUnbalancedTags(partialContent, includeFilePath)
        }
        catch {}
      }

      // SFC Support: Extract <template>, <script>, and <style> sections
      let workingContent = partialContent

      // Register component tags imported by the partial's own <script> blocks
      // (e.g. `import { Dialog } from '@stacksjs/components'`). Without this
      // step, the import is later stripped during signal-script transformation
      // and the resolver never learns Dialog is a component — so a <Dialog>
      // tag in the partial body falls through to file lookup and errors with
      // `ENOENT: open 'dialog'`. Page-level imports already register via
      // processESImports in the first processComponents pass; this extends
      // that registration into @include'd partials so the second pass picks
      // up tags resolved from partial-scoped imports. See stacksjs/stx#1705.
      try {
        const { processESImports } = await import('./component-renderer')
        await processESImports(partialContent, context, includeFilePath, options, dependencies)
      }
      catch (err) {
        if (options.debug)
          console.warn(`[stx] partial ES import extraction skipped for ${includeFilePath}:`, err instanceof Error ? err.message : err)
      }

      // Extract <template> content if present (Vue-style SFC)
      // Only match <template> WITHOUT id, x-for, x-if, @for, @if, :for, :if attributes.
      // Templates with those attributes are client-side loop/conditional elements that must be preserved.
      const templateMatch = workingContent.match(/<template\b(?![^>]*(?:\b(?:id|x-for|x-if|@for|@if|:for|:if)\s*=|\s#[\w-]|\bv-slot|\bslot\s*=))[^>]*>([\s\S]*?)<\/template>/i)
      if (templateMatch) {
        workingContent = templateMatch[1].trim()
      }

      // Strip script blocks first, then extract / remove styles. The
      // `<style>` extractor below uses a regex that doesn't understand
      // script-tag boundaries, so a literal `<style…>` substring inside
      // a `<script>` comment (`// <style data-x>` etc.) used to match
      // as if it were a real opening tag and slurp everything up to the
      // next real `</style>` — leaking the script body + downstream
      // markup into `preservedStyle`. Stripping scripts first guarantees
      // the style regex only ever sees real style tags.
      const partialContentNoScripts = partialContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

      // Extract <style> content
      const styleMatch = partialContentNoScripts.match(/<style\b([^>]*)>([\s\S]*?)<\/style>/i)
      let preservedStyle = ''
      if (styleMatch) {
        preservedStyle = `<style${styleMatch[1]}>${styleMatch[2]}</style>`
      }

      // Remove script and style tags from working content
      workingContent = workingContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      workingContent = workingContent.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

      // Create a new context with local variables
      // Make sure parent variables are accessible in includes
      const includeContext = { ...context }

      // Add local variables to the context, ensuring array references are preserved
      for (const [key, value] of Object.entries(localVars)) {
        includeContext[key] = value
      }

      // Extract <script> content (look in original content)
      // Handle server-side, client-side, and signal scripts
      const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
      const scriptMatches = [...partialContent.matchAll(scriptRegex)]
      let preservedScript = ''
      let signalScopeId: string | null = null

      for (const scriptMatch of scriptMatches) {
        const scriptAttrs = scriptMatch[1] || ''
        let scriptContent = scriptMatch[2] || ''

        const isServerScript = scriptAttrs.includes('server')
        const shouldTranspile = shouldTranspileTypeScript(scriptAttrs)

        // Vendor CSS side-effect imports MUST be extracted BEFORE
        // `transpileTypeScript` runs — Bun.Transpiler tree-shakes
        // side-effect imports that have no JS bindings, so `import
        // 'foo.css'` would be dropped silently before we ever see it.
        // Pull them out first; the rest of the pipeline operates on the
        // stripped code. Shared with `processClientScript`'s top-level
        // `<script client>` flow via the same exported helpers.
        let vendorStyleTags = ''
        try {
          const { extractAndStripCssImports, renderVendorStyleTags } = await import('./client-script')
          const cssExtraction = extractAndStripCssImports(scriptContent, {
            filePath: includeFilePath,
            projectRoot: process.cwd(),
          })
          scriptContent = cssExtraction.code
          vendorStyleTags = renderVendorStyleTags(cssExtraction.styles)
        }
        catch (err) {
          if (options.debug)
            console.warn(`[stx] vendor-css extractor skipped for ${includeFilePath}:`, err instanceof Error ? err.message : err)
        }

        // Transpile TypeScript if needed
        if (shouldTranspile && scriptContent.trim()) {
          scriptContent = transpileTypeScript(scriptContent)
        }

        // Bundle user imports (`import x from '~/...' | '@/...' | npm packages`)
        // for ALL client-side scripts, not just signal-API ones. Without this
        // step, any bare-spec import surviving into the IIFE wrap crashes the
        // browser with "Cannot use import statement outside a module" — and
        // that's true whether the script uses `state()` or just `useRef()`,
        // since the scope-id hoisting that gates the signal branch isn't what
        // makes imports invalid inside `(function(){…})()`. Hoisted out of
        // the branch below for that reason.
        if (!isServerScript) {
          try {
            const { hasUserImports, bundleClientScript } = await import('./client-script-bundler')
            if (hasUserImports(scriptContent)) {
              scriptContent = await bundleClientScript(scriptContent, includeFilePath, {
                projectRoot: process.cwd(),
              })
            }
          }
          catch (err) {
            if (options.debug)
              console.warn(`[stx] bundler skipped for ${includeFilePath}:`, err instanceof Error ? err.message : err)
          }
        }

        const isSignalScript = hasSignalApis(scriptContent)

        // Handle signal scripts - transform them for client-side reactivity
        if (isSignalScript && !isServerScript) {
          // Generate unique scope ID for this component
          signalScopeId = `stx_scope_${path.basename(includeFilePath, '.stx').replace(/[^a-zA-Z0-9]/g, '_')}_${++scopeIdCounter}`

          // Transform store imports after bundling (the bundler leaves @stores
          // imports external; this rewrites them to the runtime store accessor).
          const resolvedContent = transformStoreImports(scriptContent)
          // Transform the script to register scope variables
          // Add data-stx-scoped attribute to prevent re-processing by processScriptSetup
          const transformedScript = transformSignalScript(resolvedContent, signalScopeId)
          preservedScript += `${vendorStyleTags}<script data-stx-scoped>${transformedScript}</script>\n`
          continue
        }

        if (isServerScript) {
          // Process server-side script to extract variables into includeContext
          // Only <script server> runs on the server — bare <script> is client-side
          try {
            const { extractVariables } = await import('./variable-extractor')
            await extractVariables(scriptContent, includeContext, includeFilePath)
          }
catch (e) {
            // Script may contain unsupported syntax, continue without extracted variables
            if (options.debug) {
              console.warn(`Warning: Could not extract variables from server script in ${includeFilePath}:`, e)
            }
          }
        }

        // Preserve client-side scripts (non-signal)
        // Bare <script> and <script client> are both client-side — only <script server> runs on server
        // Wrap with data-stx-scoped to prevent re-processing in the parent template's
        // client script pipeline, which would otherwise merge them with other scripts.
        // Same vendor-style prefix as the signal branch — the bundler step above
        // already stripped CSS imports; emit the resolved `<style>` blocks here too.
        if (!isServerScript && !isSignalScript) {
          const extraAttrs = scriptAttrs.replace(/\bclient\b/i, '').trim()
          // Generate the same kind of scope ID the signal branch uses.
          // Non-signal scripts that call `useRef`/`useEventListener`/etc.
          // still need a `data-stx-scope` root for the runtime to bind
          // refs and events into — without it, `useRef("foo").current`
          // is always null because nothing populates `componentScope.$refs`
          // for this subtree. The scope vars object can be empty (we
          // have no top-level reactive declarations to register), but it
          // MUST be registered, since the runtime's scope walker
          // short-circuits on a missing entry in `window.stx._scopes`.
          signalScopeId = `stx_scope_${path.basename(includeFilePath, '.stx').replace(/[^a-zA-Z0-9]/g, '_')}_${++scopeIdCounter}`

          // Pass through transformStoreImports for parity — non-signal scripts
          // may still `import { x } from '@stores'`, which the bundler marks
          // external and this rewrites to the runtime store accessor.
          const resolvedContent = transformStoreImports(scriptContent)
          // Wrap in the same IIFE-with-stx-globals shell the signal branch
          // uses. Without this wrapper, top-level `useRef`/`onMount` calls
          // in user code lookup against the page's global scope and crash
          // with `ReferenceError: useRef is not defined` — those names live
          // on `window.stx`, not the bare global. The empty-but-present
          // scope registration in the tail is what makes ref binding
          // actually happen at runtime.
          // Match the signal branch's single-quote `window.stx._scopes['...']`
          // format verbatim. The downstream `preservedScript.replace()` that
          // merges scopes into an existing `data-stx-scope` uses single
          // quotes in its search pattern, so deviating here would silently
          // skip the merge step.
          const tail = `
  if (!window.stx._scopes) window.stx._scopes = {};
  window.stx._scopes['${signalScopeId}'] = { __destroyCallbacks: __destroyHooks };
`
          const wrapped = wrapClientScript(resolvedContent, tail)
          preservedScript += `${vendorStyleTags}<script data-stx-scoped${extraAttrs ? ` ${extraAttrs}` : ''}>${wrapped}</script>\n`
        }
      }

      // If we have a signal script, add data-stx-scope to the root element
      // If the root already has a scope (from x-data), merge into that scope ID
      if (signalScopeId) {
        const scopeResult = addScopeToRootElement(workingContent, signalScopeId)
        workingContent = scopeResult.html
        if (scopeResult.mergedIntoExisting) {
          // Root element already has a scope — update the script to register
          // signals under the existing scope ID instead of the new one
          preservedScript = preservedScript.replace(
            `window.stx._scopes['${signalScopeId}']`,
            `window.stx._scopes['${scopeResult.mergedIntoExisting}']`,
          )
          signalScopeId = scopeResult.mergedIntoExisting
        }
      }

      // Process the partial content
      // Process any nested includes first, passing the includeStack for circular detection
      if (workingContent.includes('@include') || workingContent.includes('@partial')) {
        workingContent = await processIncludes(workingContent, includeContext, includeFilePath, options, dependencies, includeStack)
      }

      // Process loops first to handle array iterations
      const { processLoops } = await import('./loops')
      let processedContent = processLoops(workingContent, includeContext, includeFilePath)

      // Process conditionals
      processedContent = processConditionals(processedContent, includeContext, includeFilePath)

      // Process expressions.
      // The partial's <script> was stripped above (line ~925) so the style/script
      // extractors and the parent's client-script pipeline don't double-process it.
      // That also hides the partial's own state()/derived() from processExpressions'
      // usesSignalsInScript gate, which would then evaluate `{{ signalCall() }}`
      // server-side (undefined → emptied) and consume the marker, leaving nothing
      // for the runtime to bind — the partial renders permanently blank. Recover the
      // gate from the FULL partial content so a partial with a client signal script
      // preserves {{ }} just like a top-level page. See stacksjs/stx#1758.
      const partialHasSignals = usesSignalsInScript(partialContent)
      processedContent = processExpressions(processedContent, includeContext, includeFilePath, { forceSignals: partialHasSignals })

      // Append preserved style and script for SFC support
      if (preservedStyle) {
        processedContent += '\n' + preservedStyle
      }
      if (preservedScript) {
        processedContent += '\n' + preservedScript
      }

      return processedContent
    }
    catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createDetailedErrorMessage(
        'Include',
        `Error processing include ${includePath}: ${errorMessage}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }
  }

  // Find all includes using balanced parsing (handles nested objects in variables)
  const includePattern = /@include\s*\(/g
  let includeMatch: RegExpExecArray | null

  while ((includeMatch = includePattern.exec(output)) !== null) {
    const matchStart = includeMatch.index
    const openParen = matchStart + includeMatch[0].length - 1

    // Find balanced closing paren
    let depth = 1
    let pos = openParen + 1
    while (pos < output.length && depth > 0) {
      if (output[pos] === '(') depth++
      else if (output[pos] === ')') depth--
      pos++
    }
    if (depth !== 0) break

    const fullMatch = output.substring(matchStart, pos)
    const inner = output.substring(openParen + 1, pos - 1)

    // Parse: 'path' or "path" optionally followed by , { vars }
    const pathMatch = inner.match(/^\s*['"]([^'"]+)['"]/)
    if (!pathMatch) {
      includePattern.lastIndex = pos
      continue
    }

    const includePath = pathMatch[1]
    let varsString: string | undefined

    // Check for comma + vars after path
    const afterPath = inner.substring(pathMatch[0].length)
    const commaIdx = findTopLevelComma(afterPath, 0)
    if (commaIdx !== -1) {
      varsString = afterPath.substring(commaIdx + 1).trim()
    }

    let localVars: Record<string, unknown> = {}
    if (varsString) {
      try {
        localVars = safeEvaluateObject(varsString, context)
      }
      catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        output = output.replace(
          fullMatch,
          createDetailedErrorMessage(
            'Include',
            `Error parsing include variables for ${includePath}: ${errorMessage}`,
            filePath,
            template,
            matchStart,
          ),
        )
        includePattern.lastIndex = 0
        continue
      }
    }

    const processedContent = await processIncludeHelper(includePath, localVars, template, matchStart)
    output = output.substring(0, matchStart) + processedContent + output.substring(pos)
    includePattern.lastIndex = 0
  }

  return output
}

// =============================================================================
// Stack Directives
// =============================================================================

/**
 * Process @push and @prepend directives to collect content into named stacks.
 *
 * This function extracts stack content and removes the directives from output.
 * The collected content is stored in the `stacks` object for later rendering.
 *
 * @param template - The template string to process
 * @param stacks - Object to collect stack content (mutated)
 * @returns Template with @push/@prepend directives removed
 *
 * @example
 * ```typescript
 * const stacks: Record<string, string[]> = {}
 * const result = processStackPushDirectives(`
 *   @push('scripts')
 *     <script src="app.js"></script>
 *   @endpush
 *   <div>Content</div>
 * `, stacks)
 * // result = '\n  <div>Content</div>\n'
 * // stacks = { scripts: ['<script src="app.js"></script>'] }
 * ```
 */
export function processStackPushDirectives(template: string, stacks: Record<string, string[]>): string {
  let result = template

  // Process @push directives with balanced parsing
  function processStackDirective(src: string, directive: string, endDirective: string, prepend: boolean): string {
    let out = src
    let processedAny = true
    while (processedAny) {
      processedAny = false
      const pat = new RegExp(`@${directive}\\(['"]([^'"]+)['"]\\)`)
      const m = out.match(pat)
      if (!m || m.index === undefined) break
      const startPos = m.index
      const name = m[1]
      const contentStart = startPos + m[0].length

      // Find matching end tag using balanced depth
      const openRe = new RegExp(`@${directive}\\(`)
      const closeRe = new RegExp(`@${endDirective}(?![a-z])`)
      let depth = 1
      let searchPos = contentStart
      let endPos = -1
      while (depth > 0 && searchPos < out.length) {
        const rem = out.slice(searchPos)
        const nextOpenMatch = rem.match(openRe)
        const nextCloseMatch = rem.match(closeRe)
        const nextOpen = nextOpenMatch ? searchPos + nextOpenMatch.index! : Infinity
        const nextClose = nextCloseMatch ? searchPos + nextCloseMatch.index! : Infinity
        if (nextOpen < nextClose) { depth++; searchPos = nextOpen + (nextOpenMatch![0].length || 1) }
        else if (nextClose < Infinity) {
          depth--
          if (depth === 0) { endPos = nextClose; break }
          searchPos = nextClose + endDirective.length + 1
        } else break
      }
      if (endPos === -1) break

      const content = out.slice(contentStart, endPos)
      if (!stacks[name]) stacks[name] = []
      if (prepend) stacks[name].unshift(content)
      else stacks[name].push(content)

      out = out.substring(0, startPos) + out.substring(endPos + `@${endDirective}`.length)
      processedAny = true
    }
    return out
  }

  result = processStackDirective(result, 'push', 'endpush', false)
  result = processStackDirective(result, 'prepend', 'endprepend', true)

  return result
}

/**
 * Process @stack directives by replacing them with collected stack content.
 *
 * This should be called AFTER `processStackPushDirectives` has collected
 * all @push and @prepend content.
 *
 * @param template - The template string with @stack directives
 * @param stacks - Object containing collected stack content
 * @returns Template with @stack directives replaced by their content
 *
 * @example
 * ```typescript
 * const stacks = {
 *   scripts: ['<script src="a.js"></script>', '<script src="b.js"></script>'],
 *   styles: ['<link rel="stylesheet" href="app.css">']
 * }
 * const result = processStackReplacements(`
 *   <head>@stack('styles')</head>
 *   <body>...@stack('scripts')</body>
 * `, stacks)
 * ```
 */
export function processStackReplacements(template: string, stacks: Record<string, string[]>): string {
  // Replace @stack directives with their content
  // eslint-disable-next-line pickier/no-unused-vars
  return template.replace(/@stack\(['"]([^'"]+)['"]\)/g, (match, name) => {
    // No content? Return empty string
    if (!stacks[name] || stacks[name].length === 0) {
      return ''
    }

    // Join all stack entries with newlines to preserve formatting
    return stacks[name].join('\n')
  })
}

// expandStxLinks and buildStxLinkAnchor removed — StxLink is now a builtin
// component handled by component-renderer.ts via the ComponentRegistry
