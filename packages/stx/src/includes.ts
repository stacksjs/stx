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
import fs from 'node:fs'
import path from 'node:path'
import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'
import { LRUCache } from './performance-utils'
import { createSafeFunction, isExpressionSafe, safeEvaluate, safeEvaluateObject } from './safe-evaluator'
import { transformStoreImports } from './state-management'
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
  return /\b(state|derived|effect)\s*\(/.test(scriptContent)
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
function transformSignalScript(scriptContent: string, scopeId: string): string {
  const exports = extractExports(scriptContent)

  return `
(function() {
  var __stx = window.stx || {};
  var state = __stx.state || function(v) { var s = function() { return s._v; }; s._v = v; s.set = function(nv) { s._v = nv; }; s.update = function(fn) { s._v = fn(s._v); }; return s; };
  var derived = __stx.derived || function(fn) { return fn; };
  var effect = __stx.effect || function(fn) { fn(); return function() {}; };
  var batch = __stx.batch || function(fn) { fn(); };
  var onMount = __stx.onMount || function(fn) { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); } else { fn(); } };
  var __destroyHooks = [];
  var onDestroy = function(fn) { if (__stx.onDestroy) __stx.onDestroy(fn); __destroyHooks.push(fn); };

${scriptContent}

  // Register scope variables for STX runtime
  if (!window.stx) window.stx = { _scopes: {} };
  if (!window.stx._scopes) window.stx._scopes = {};
  window.stx._scopes['${scopeId}'] = { ${exports}, __destroyCallbacks: __destroyHooks };
})();
`
}

/**
 * Add data-stx-scope attribute to the first element in HTML content
 */
function addScopeToRootElement(html: string, scopeId: string): string {
  // Skip comments, whitespace, and find the first real element
  const elementMatch = html.match(/^(\s*(?:<!--[\s\S]*?-->\s*)*)(<[a-zA-Z][a-zA-Z0-9-]*)([\s>])/s)
  if (elementMatch) {
    const [, before, tagStart, afterTag] = elementMatch
    // Check if it already has data-stx-scope
    if (html.includes('data-stx-scope')) {
      return html
    }
    return `${before}${tagStart} data-stx-scope="${scopeId}"${afterTag}${html.slice(elementMatch[0].length)}`
  }
  return html
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

  // Resolve relative paths to absolute - check if it's already absolute
  if (partialsDir && !path.isAbsolute(partialsDir)) {
    // Resolve relative to the directory containing the stx package
    // This handles cases like '../../examples/components' in stx.config.ts
    const configDir = path.resolve(__dirname, '..')
    partialsDir = path.resolve(configDir, partialsDir)
  }

  // First handle partial alias (replace @partial with @include) using balanced parsing
  let output = replaceDirectiveBalanced(template, '@partial', '@include')

  // Process @once directive - content that should only be included once per request
  // Uses request-scoped store if available (context.__onceStore), otherwise falls back to global
  const activeOnceStore = getOnceStore(context)

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
      if (incFile && fs.existsSync(incFile)) {
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
        } else {
          condResult = Boolean(safeEvaluate(condExpr, context))
        }

        const shouldInclude = invert ? !condResult : condResult
        let replacement = ''
        if (shouldInclude) {
          const incFile = resolvePath(includePath, partialsDir, filePath)
          if (incFile && fs.existsSync(incFile)) dependencies.add(incFile)
          replacement = `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`
        }
        output = output.substring(0, start) + replacement + output.substring(p)
        pat.lastIndex = 0
      } catch (error: unknown) {
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
        } else {
          array = safeEvaluate(trimmedExpr, context)
        }

        let replacement = ''
        if (Array.isArray(array) && array.length > 0) {
          for (const item of array) {
            const itemContext = { ...context, [itemVar]: item }
            const processed = await processIncludeHelper(partialName, { [itemVar]: item }, template, eStart)
            replacement += processed
          }
        } else if (emptyPartial) {
          replacement = await processIncludeHelper(emptyPartial, {}, template, eStart)
        }

        output = output.substring(0, eStart) + replacement + output.substring(ep + 1)
        eachPat.lastIndex = 0
      } catch (error: unknown) {
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
            output = output.replace(
              fullMatch,
              createDetailedErrorMessage(
                'Include',
                `Error parsing includeFirst variables: ${errorMessage}`,
                filePath,
                template,
                matchOffset,
                fullMatch,
              ),
            )
          }
          else {
            output = output.replace(fullMatch, fallbackContent || '')
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
          output = output.replace(fullMatch, processed)
          foundValidPath = true
          break
        }
      }

      // No valid include found - use fallback or show error based on debug mode
      if (!foundValidPath) {
        if (fallbackContent !== undefined) {
          // Use provided fallback content
          output = output.replace(fullMatch, fallbackContent)
        }
        else if (options.debug) {
          // Show detailed error in debug mode
          output = output.replace(
            fullMatch,
            createDetailedErrorMessage(
              'Include',
              `None of the includeFirst paths exist: ${pathArrayString}`,
              filePath,
              template,
              matchOffset,
              fullMatch,
            ),
          )
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
      output = output.replace(
        fullMatch,
        createDetailedErrorMessage(
          'Include',
          `Error processing @includeFirst: ${errorMessage}`,
          filePath,
          template,
          matchOffset,
          fullMatch,
        ),
      )
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

      // Check if within sibling directories (up to 3 levels up)
      let isWithinProjectScope = false
      let parentDir = templateDir
      for (let i = 0; i < 3; i++) {
        parentDir = path.dirname(parentDir)
        if (normalizedResolvedPath.startsWith(parentDir + path.sep)) {
          isWithinProjectScope = true
          break
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
      // Path already resolved above, no need to resolve again
      if (!includeFilePath) {
        return createDetailedErrorMessage(
          'Include',
          `Could not resolve path for include: ${includePath}`,
          filePath,
          templateStr,
          offsetPos,
        )
      }

      // Track dependency
      dependencies.add(includeFilePath)

      // Check if the partial is cached
      let partialContent = partialsCache.get(includeFilePath)

      if (!partialContent) {
        // Read the file
        try {
          partialContent = await Bun.file(includeFilePath).text()
          // Cache for future use
          partialsCache.set(includeFilePath, partialContent)
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

      // SFC Support: Extract <template>, <script>, and <style> sections
      let workingContent = partialContent

      // Extract <template> content if present (Vue-style SFC)
      // Only match <template> WITHOUT an id attribute - templates with id are HTML template elements
      // that should be preserved (used for client-side JS template cloning)
      const templateMatch = workingContent.match(/<template\b(?![^>]*\bid\s*=)[^>]*>([\s\S]*?)<\/template>/i)
      if (templateMatch) {
        workingContent = templateMatch[1].trim()
      }

      // Extract <style> content
      const styleMatch = partialContent.match(/<style\b([^>]*)>([\s\S]*?)<\/style>/i)
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
        const isClientScript = scriptAttrs.includes('client') || scriptAttrs.includes('type="module"')
        const shouldTranspile = shouldTranspileTypeScript(scriptAttrs)

        // Transpile TypeScript if needed
        if (shouldTranspile && scriptContent.trim()) {
          scriptContent = transpileTypeScript(scriptContent)
        }

        const isSignalScript = hasSignalApis(scriptContent)

        // Handle signal scripts - transform them for client-side reactivity
        if (isSignalScript && !isServerScript) {
          // Generate unique scope ID for this component
          signalScopeId = `stx_scope_${path.basename(includeFilePath, '.stx').replace(/[^a-zA-Z0-9]/g, '_')}_${++scopeIdCounter}`

          // Transform store imports before IIFE wrapping (import statements can't be inside functions)
          const resolvedContent = transformStoreImports(scriptContent)
          // Transform the script to register scope variables
          // Add data-stx-scoped attribute to prevent re-processing by processScriptSetup
          const transformedScript = transformSignalScript(resolvedContent, signalScopeId)
          preservedScript += `<script data-stx-scoped>${transformedScript}</script>\n`
          continue
        }

        if (isServerScript || (!isClientScript && !scriptAttrs.includes('src') && !isSignalScript)) {
          // Process server-side script to extract variables into includeContext
          try {
            const { extractVariables } = await import('./variable-extractor')
            await extractVariables(scriptContent, includeContext, includeFilePath)
          } catch (e) {
            // Script may contain unsupported syntax, continue without extracted variables
            if (options.debug) {
              console.warn(`Warning: Could not extract variables from server script in ${includeFilePath}:`, e)
            }
          }
        }

        // Preserve client-only scripts (non-signal)
        if (isClientScript && !isSignalScript) {
          preservedScript += `<script${scriptAttrs}>${scriptContent}</script>\n`
        }
      }

      // If we have a signal script, add data-stx-scope to the root element
      if (signalScopeId) {
        workingContent = addScopeToRootElement(workingContent, signalScopeId)
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

      // Process expressions
      processedContent = processExpressions(processedContent, includeContext, includeFilePath)

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
  return template.replace(/@stack\(['"]([^'"]+)['"]\)/g, (match, name) => {
    // No content? Return empty string
    if (!stacks[name] || stacks[name].length === 0) {
      return ''
    }

    // Join all stack entries with newlines to preserve formatting
    return stacks[name].join('\n')
  })
}
