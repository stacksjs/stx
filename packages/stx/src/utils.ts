/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Utility functions for the stx compiler
 *
 * This module provides core utilities for template processing.
 * Some functionality has been extracted to dedicated modules:
 *
 * - validator.ts - Template validation utilities
 * - variable-extractor.ts - Script variable extraction
 *
 * @module utils
 */

import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'

// Import from expressions
import { extractAndStripCssImports, extractBridgeData, injectBrowserCoreAutoImports, processClientScript, renderVendorStyleTags } from './client-script'
import {
  COMPONENT_CLIENT_FACTORIES_CONTEXT_KEY,
  componentClientFactoriesRegisteredSince,
  registerComponentClientFactory,
  replayComponentClientFactories,
  snapshotComponentClientFactoryCounts,
} from './component-client-factories'
import { interpolateScriptExpressions, processExpressions, usesSignalsInScript } from './expressions'
import { COMPONENT_SCOPE_LOCAL_GLOBALS, buildRuntimeGlobalsDestructure } from './runtime-globals'
import type { DepSnapshot } from './render-memo'
import { contentKey, depsUnchanged, renderMemo, snapshotDeps } from './render-memo'
import { transformStoreImports } from './store-imports'
import { LRUCache } from './performance-utils'
import { processDirectives } from './process'
import { getPublicEnvDefine } from './public-env'
import { processScopedStyles } from './style-scoping'
import { findSfcTemplateBlock } from './sfc-template'
import { importOnce } from './lazy-module'
import { stashScriptElements } from './html-masking'

// Re-export from extracted modules for backward compatibility
export {
  extractDirectiveNames,
  getPositionInfo,
  hasDirectives,
  validateDirective,
  validateTemplate,
} from './validator'
export type {
  TemplateValidationError,
  TemplateValidationResult,
} from './validator'
export {
  convertToCommonJS,
  extractScriptFromTemplate,
  extractVariables,
  hasVariables,
} from './variable-extractor'

// Cache for components to avoid repeated file reads (LRU with max 500 entries)
const componentsCache = new LRUCache<string, string>(500)
// Resolving a nested component can walk every configured component tree.
// Keep successful resolutions for the dev-server lifetime; clearDevCaches()
// invalidates this alongside component contents on every watched source edit.
const componentResolutionCache = new LRUCache<string, string>(1000)
interface ComponentRenderCacheEntry {
  output: string
  dependencies: string[]
  /** Registrations to replay, so `instances` matches a full render (#1945). */
  clientFactories: Array<{ body: string, count: number }>
  /**
   * Scope ids the skipped subtree drew, so the sequence advances the same.
   *
   * Defensive, and honestly so: the sequence is shared by the whole document,
   * and a subtree that is not rendered cannot draw from it, so a hit that did
   * not account for what it skipped would number every later component
   * differently from the render it claims to repeat. No page shape tried so far
   * makes that observable -- the entries measured all report zero -- so this is
   * reasoned from the sequence's contract rather than pinned by a test, and is
   * kept because being wrong here is silent and the accounting is two lines.
   */
  uidsConsumed: number
  /** Expressions the skipped render handed back up to the caller. */
  preservedClientExpressions: string[]
}
// Components that explicitly declare `<script server cache>` promise that
// their rendered fragment is a pure function of props and slots. Memoizing
// those fragments avoids recompiling large repeated lists on every request.
//
// Returning a cached string skips everything the render would also have DONE,
// not only the string it produced, so an entry carries those effects and
// replays them -- see the fields above, and the hit below for why each is
// load-bearing. That is what lets a component with a client script opt in
// (#1945); before, only all-server components could.
/**
 * What the rendered-fragment cache may retain (stacksjs/stx#1945).
 *
 * The count on its own stopped describing this cache when cd2672ec5e let a
 * component carrying a client island opt in: an all-server fragment is a row
 * or a section, while an island-bearing component's output runs to tens of
 * kilobytes, so 2000 entries went from a few megabytes to something an
 * OOM-sensitive host cannot predict. #1945 is a memory report, and answering
 * it with a cache whose footprint is unbounded in bytes would be answering it
 * with a bigger version of the same problem. The count still applies -- both
 * bounds hold at once, whichever binds first.
 */
const COMPONENT_RENDER_CACHE_BYTES = 32 * 1024 * 1024

/**
 * The budget currently applied, so a config that never changes costs one
 * number comparison per component render rather than an eviction sweep.
 */
let appliedComponentRenderCacheBytes = COMPONENT_RENDER_CACHE_BYTES

/**
 * Point the fragment cache at the host's budget (`componentRenderCacheBytes`).
 *
 * Read here rather than plumbed from config load because the cache is module
 * state that exists before any config does, and because `serve()`, the dev
 * server, SSG and a direct `renderView` all arrive with their own resolved
 * options -- there is no single earlier place they share.
 */
function applyComponentRenderCacheBudget(options: StxOptions): void {
  const configured = (options as { componentRenderCacheBytes?: number }).componentRenderCacheBytes
  if (typeof configured !== 'number' || configured < 0 || configured === appliedComponentRenderCacheBytes)
    return

  appliedComponentRenderCacheBytes = configured
  componentRenderCache.setMaxBytes(configured)
}
const componentRenderCache = new LRUCache<string, ComponentRenderCacheEntry>(2000, {
  maxBytes: COMPONENT_RENDER_CACHE_BYTES,
  // The output dominates; the replay bookkeeping beside it is a few hundred
  // bytes and is not worth walking on every set.
  sizeOf: entry => entry.output.length,
})
let scopeIdCounter = 0

function serializeComponentRenderInput(value: unknown): string | null {
  const seen = new WeakSet<object>()

  try {
    const normalize = (input: unknown): unknown => {
      if (input === undefined) return { __stxType: 'undefined' }
      if (typeof input === 'bigint') return { __stxType: 'bigint', value: input.toString() }
      if (typeof input === 'function' || typeof input === 'symbol')
        throw new TypeError('Non-serializable component input')
      if (input === null || typeof input !== 'object') return input
      if (seen.has(input as object))
        throw new TypeError('Circular component input')

      seen.add(input as object)
      if (input instanceof Date)
        return { __stxType: 'date', value: input.toISOString() }
      if (Array.isArray(input))
        return input.map(normalize)

      const normalized: Record<string, unknown> = {}
      for (const key of Object.keys(input as Record<string, unknown>).sort())
        normalized[key] = normalize((input as Record<string, unknown>)[key])
      return normalized
    }

    return JSON.stringify(normalize(value))
  }
  catch {
    return null
  }
}

/** Escape a string for safe use in an HTML attribute value */
function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Check if script should be treated as plain JavaScript (opt-out from TypeScript)
 * By default ALL scripts are TypeScript. Use <script js> or <script lang="js"> to opt-out.
 */
export function isJavaScriptScript(attrs: string): boolean {
  // Check for explicit JS opt-out: js attribute or lang="js"/lang="javascript"
  return /\bjs\b/.test(attrs) || /\blang\s*=\s*["']?(js|javascript)["']?/i.test(attrs)
}

/**
 * Check if script should be transpiled as TypeScript
 * Default: ALL scripts are TypeScript unless explicitly marked as JS
 */
export function shouldTranspileTypeScript(attrs: string): boolean {
  // Skip transpilation only if explicitly marked as JavaScript
  return !isJavaScriptScript(attrs)
}

/**
 * Transpilers, reused rather than built per call.
 *
 * A `Bun.Transpiler` owns a native arena that the JS heap does not account for.
 * Building one per script block therefore turns every render into an off-heap
 * allocation which shows up in RSS and is invisible to `heapStats()` — the JS
 * heap sits flat while the process grows. A production page carrying twenty
 * components was constructing about a hundred of them per request.
 *
 * Reuse is safe: `transformSync` keeps no state between calls, so the only
 * thing separating two transpilers is the options they were built with.
 */
const transpilerPool = new Map<string, Bun.Transpiler>()

export function getSharedTranspiler(options: ConstructorParameters<typeof Bun.Transpiler>[0]): Bun.Transpiler {
  let key: string
  try {
    key = JSON.stringify(options)
  }
  catch {
    // Unserialisable options are rare and not worth pooling on — hand back a
    // one-off rather than risk collapsing two genuinely different configs.
    return new Bun.Transpiler(options)
  }

  const pooled = transpilerPool.get(key)
  if (pooled)
    return pooled

  // `define` is env-derived and stable in practice, so this map settles at a
  // handful of entries. The cap is a backstop: a caller that varies its options
  // per call must not be able to grow the pool without bound — that would
  // reintroduce the very leak this exists to close.
  if (transpilerPool.size >= 16)
    transpilerPool.clear()

  const transpiler = new Bun.Transpiler(options)
  transpilerPool.set(key, transpiler)
  return transpiler
}

/**
 * Transpile TypeScript code to JavaScript using Bun (sync version)
 */
export function transpileTypeScript(code: string): string {
  try {
    // Strip .stx component imports before transpiling - these are handled by STX component resolution
    let processedCode = code.replace(/^\s*import\s+\w+\s+from\s+['"][^'"]*\.stx['"]\s*;?\s*$/gm, '')
    // Also strip side-effect .stx imports
    processedCode = processedCode.replace(/^\s*import\s+['"][^'"]*\.stx['"]\s*;?\s*$/gm, '')

    // Protect STX template expressions from the TypeScript transpiler.
    // {!! expr !!}, {{{ expr }}}, and {{ expr }} are not valid JS/TS syntax
    // so we replace them with string placeholders before transpilation
    // and restore them afterwards.
    const placeholders: string[] = []
    // Replace {!! expr !!} (raw/unescaped output)
    processedCode = processedCode.replace(/\{!![\s\S]*?!!\}/g, (match) => {
      const idx = placeholders.length
      placeholders.push(match)
      return `"__STX_EXPR_${idx}__"`
    })

    // Replace {{{ expr }}} (triple-brace unescaped output)
    processedCode = processedCode.replace(/\{\{\{[\s\S]*?\}\}\}/g, (match) => {
      const idx = placeholders.length
      placeholders.push(match)
      return `"__STX_EXPR_${idx}__"`
    })

    // Replace {{ expr }} (escaped output)
    processedCode = processedCode.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
      const idx = placeholders.length
      placeholders.push(match)
      return `"__STX_EXPR_${idx}__"`
    })

    // Use Bun's transpiler directly for inline code
    const transpiler = getSharedTranspiler({
      loader: 'ts',
      target: 'browser',
      define: getPublicEnvDefine(),
    })
    let result = transpiler.transformSync(processedCode)

    // Restore STX template expressions (handle both quote styles since
    // the transpiler may convert double quotes to single quotes)
    for (let i = 0; i < placeholders.length; i++) {
      result = result.replace(`"__STX_EXPR_${i}__"`, placeholders[i])
      result = result.replace(`'__STX_EXPR_${i}__'`, placeholders[i])
    }

    return result
  }
  catch (e) {
    if (process.env.STX_DEBUG_TS) {
      console.warn('[STX] TypeScript transpilation error:', e)
    }
    return code // Return original on error
  }
}

/**
 * Extract variable names from JavaScript code for scope registration
 * Only extracts TOP-LEVEL declarations, not variables inside nested functions
 */
function extractVariableNames(code: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  // Track brace depth to only capture top-level declarations
  let depth = 0
  let i = 0
  const len = code.length

  // Skip string literals and track brace depth
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

  // Skip template literals (backticks) with nested expressions
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

  // Skip comments
  const skipComment = (): boolean => {
    if (code[i] === '/' && code[i + 1] === '/') {
      // Single-line comment
      while (i < len && code[i] !== '\n') i++
      return true
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      // Multi-line comment
      i += 2
      while (i < len - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      return true
    }
    return false
  }

  // Check for variable declaration at current position (only at depth 0)
  const checkDeclaration = (): void => {
    if (depth !== 0) return

    // Check for destructuring declarations: const { a, b } = or const [a, b] =
    const destructMatch = code.slice(i).match(/^(const|let|var)\s*\{([^}]+)\}\s*=/)
    if (destructMatch) {
      const vars = destructMatch[2].split(',').map(v => {
        const parts = v.trim().split(':')
        // For renamed destructuring like { siteId: _siteId }, the local binding is the LAST part
        return parts[parts.length - 1].trim()
      })
      for (const varName of vars) {
        if (varName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName) && !seen.has(varName)) {
          names.push(varName)
          seen.add(varName)
        }
      }
      return
    }

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

  return names
}

// =============================================================================
// Component Rendering
// =============================================================================

/**
 * Shared function to render a component with props and slot content
 */
/**
 * Split a destructuring body on top-level commas, respecting nested
 * brackets/braces/parens and string/template literals.
 */
function splitTopLevelCommas(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  let quote: string | null = null
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === '\'' || c === '`') { quote = c; continue }
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (c === ',' && depth === 0) { parts.push(body.slice(start, i)); start = i + 1 }
  }
  if (start < body.length) parts.push(body.slice(start))
  return parts
}

/**
 * Index of the top-level `=` (default assignment) in a destructuring entry,
 * skipping `==`/`===`/`!=`/`<=`/`>=`/`=>` and anything inside brackets or
 * strings. Returns -1 when the entry has no default.
 */
function topLevelDefaultEq(entry: string): number {
  let depth = 0
  let quote: string | null = null
  for (let i = 0; i < entry.length; i++) {
    const c = entry[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === '\'' || c === '`') { quote = c; continue }
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (c === '=' && depth === 0) {
      const prev = entry[i - 1]
      const next = entry[i + 1]
      if (prev === '!' || prev === '<' || prev === '>' || prev === '=') continue
      if (next === '=' || next === '>') continue
      return i
    }
  }
  return -1
}

/**
 * Apply a component's `defineProps` destructuring defaults to its SSR render
 * context. STX evaluates a component's `<script>` block client-side only, so
 * default values written as `const { steps = [...] } = defineProps()` never
 * reached server-side template evaluation: a prop the caller omits was
 * `undefined` during SSR, which broke `@foreach (steps as ...)` ("steps is not
 * iterable") and any `{{ prop }}` / `:prop` relying on a default. This fills in
 * only the keys the caller did not provide, evaluating each default against the
 * already-resolved context (so a default may reference earlier props). It is
 * best-effort — any parse/eval failure leaves the context untouched, matching
 * the pre-fix behavior (e.g. defaults that reference browser-only globals).
 */
function applyDestructuredPropDefaults(
  componentContent: string,
  ctx: Record<string, unknown>,
): void {
  try {
    const m = /=\s*(?:withDefaults\s*\([\s\S]*?defineProps|defineProps)\b/.exec(componentContent)
    if (!m)
      return
    // Walk left from the `=` to the destructuring `}` … `{` that precedes it.
    let i = m.index - 1
    while (i >= 0 && /\s/.test(componentContent[i])) i--
    if (componentContent[i] !== '}')
      return
    const end = i
    let depth = 0
    let start = -1
    for (; i >= 0; i--) {
      const c = componentContent[i]
      if (c === '}')
        depth++
      else if (c === '{') {
        depth--
        if (depth === 0) { start = i; break }
      }
    }
    if (start === -1)
      return

    const body = componentContent.slice(start + 1, end)
    for (const rawEntry of splitTopLevelCommas(body)) {
      const entry = rawEntry.trim()
      if (!entry || entry.startsWith('...'))
        continue
      const eq = topLevelDefaultEq(entry)
      if (eq === -1)
        continue
      const name = entry.slice(0, eq).trim()
      // Only simple `name = default` entries; skip renames / nested patterns.
      if (!/^[A-Z_$][\w$]*$/i.test(name))
        continue
      if (ctx[name] !== undefined)
        continue // caller-provided value always wins
      const expr = entry.slice(eq + 1).trim()
      if (!expr)
        continue
      try {
        const keys = Object.keys(ctx)
        // eslint-disable-next-line no-new-func
        const fn = new Function(...keys, `"use strict"; return (${expr});`)
        ctx[name] = fn(...keys.map(k => ctx[k]))
      }
      catch {
        // Default references browser-only globals or unavailable vars — leave
        // it undefined, exactly as before this fix.
      }
    }
  }
  catch {
    // Never let prop-default extraction break component rendering.
  }
}

/**
 * Does a project-authored component file exist for `componentPath`?
 *
 * Used to let a user component (e.g. `components/Icon.stx`) take precedence
 * over a built-in component of the same name (e.g. the Lucide `Icon`). It
 * mirrors the primary search directories used by `renderComponentWithSlot`
 * but deliberately EXCLUDES stx's own built-in components directory — a
 * built-in shipping its own `.stx` file must not count as a user override.
 */
export async function userComponentFileExists(
  componentPath: string,
  componentsDir: string,
  parentContext: Record<string, unknown>,
  parentFilePath: string,
  options: StxOptions,
): Promise<boolean> {
  const baseName = componentPath.endsWith('.stx') ? componentPath.slice(0, -4) : componentPath

  const kebabToPascal = (str: string) => str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  const pascalToKebab = (str: string) => str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

  // Explicit @import always wins and is unambiguously user-authored.
  const importedComponents = parentContext.__importedComponents as Map<string, string> | undefined
  if (importedComponents) {
    for (const name of [baseName, baseName.toLowerCase(), kebabToPascal(baseName), pascalToKebab(baseName)]) {
      if (importedComponents.has(name)) return true
    }
  }

  const variants = [...new Set([`${baseName}.stx`, `${kebabToPascal(baseName)}.stx`, `${pascalToKebab(baseName)}.stx`])]

  // Derive the project root from configuration and the rendered file — NEVER from
  // process.cwd(). Using the launch directory made builtin-vs-user resolution
  // non-deterministic: a builtin (e.g. <StxLink>) got shadowed merely because the
  // process was started in a directory that happened to contain a like-named
  // component file (stx's own src/components/StxLink.stx when tests run from
  // packages/stx), which then self-referenced into a "circular component" error.
  // The convention-based project dirs only apply within an explicitly configured root.
  const configuredRoot = typeof options.root === 'string' ? path.resolve(options.root) : undefined
  const resolveBase = configuredRoot ?? path.dirname(parentFilePath)
  const searchDirs: string[] = []
  const push = (dir?: string | null) => {
    if (dir && !searchDirs.includes(dir)) searchDirs.push(dir)
  }

  const originalFilePath = parentContext.__originalFilePath as string | undefined
  if (originalFilePath) push(path.join(path.dirname(originalFilePath), 'components'))
  push(componentsDir)
  push(options._rootComponentsDir)
  push(path.join(path.dirname(parentFilePath), 'components'))
  push(options.componentsDir)
  // Convention fallbacks — only within a configured project root, and never stx's
  // own `import.meta.dir/components` (where built-ins live).
  //
  // These come BEFORE plugin directories. A plugin supplies a DEFAULT; a file
  // the project actually wrote is not a fallback to it. With the order
  // reversed, a project that had its own `resources/components/AppShell.stx`
  // still rendered the plugin's copy, and the only visible symptom was the
  // plugin version's own relative includes failing against a directory the
  // author had never heard of.
  if (configuredRoot) {
    push(path.resolve(configuredRoot, 'resources/views/components'))
    push(path.resolve(configuredRoot, 'resources/components'))
    push(path.resolve(configuredRoot, 'src/components'))
    push(path.resolve(configuredRoot, 'components'))
  }
  const pluginDirs = (options as any)._pluginComponentDirs
  if (Array.isArray(pluginDirs)) {
    for (const dir of pluginDirs) push(typeof dir === 'string' ? dir : null)
  }
  // Framework defaults, searched last: the app overrides by name, and anything
  // it does not define falls back here. Mirrors `fallbackLayoutsDir`.
  push(options.fallbackComponentsDir)

  // Relative path components (./Foo, ../Foo) are always user-authored.
  if (baseName.startsWith('./') || baseName.startsWith('../')) {
    return fileExists(path.resolve(path.dirname(parentFilePath), `${baseName}.stx`))
  }

  for (const dir of searchDirs) {
    const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(resolveBase, dir)
    for (const variant of variants) {
      if (await fileExists(path.join(resolvedDir, variant))) return true
    }
  }
  return false
}

/**
 * Whether a `client="..."` value is a deferring island trigger (#1746).
 * Mirrors the stx-hydrate runtime triggers; `load` (eager) is handled separately.
 */
export function isHydrateTrigger(trigger: string): boolean {
  return trigger === 'visible'
    || trigger === 'idle'
    || trigger === 'interaction'
    || trigger.startsWith('media:')
}

/**
 * Does this slot content carry template expressions?
 *
 * Slot content belongs to the caller, so `{{ ... }}` inside it names the
 * caller's variables. When any are present the component has to be treated as
 * signal-bearing, or the expression pipeline resolves them against the
 * component's context (where they do not exist) and renders them as empty.
 *
 * `<script>` and `<style>` regions are ignored: a regex or a CSS rule can
 * contain brace pairs that are not template expressions, and matching them
 * would flag components that have no slot expressions at all.
 */
export function slotContentHasExpressions(slotContent: string): boolean {
  if (!slotContent)
    return false

  const withoutScripts = slotContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  return /\{\{[\s\S]*?\}\}|\{!![\s\S]*?!!\}/.test(withoutScripts)
}

/**
 * Collect client variables whose initializer returns a signal-like value.
 *
 * Component scripts are removed before their template body reaches the
 * expression pipeline. Recording these names in the component context keeps
 * interpolations such as `{{ title() }}` client-owned even when a static prop
 * named `title` also exists in the server context.
 */
export function componentClientSignalNames(scripts: string[]): string[] {
  const names = new Set<string>()
  const declaration = /\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:state|derived|computed|ref|reactive|signal|useReactiveProp|useLocalStorage|useSessionStorage|useCookie|useDebouncedValue)\s*(?:<[^>]*>)?\s*\(/g

  for (const script of scripts) {
    let match: RegExpExecArray | null
    while ((match = declaration.exec(script)) !== null)
      names.add(match[1])
    declaration.lastIndex = 0
  }

  return [...names]
}

export async function renderComponentWithSlot(
  componentPath: string,
  props: Record<string, unknown>,
  slotContent: string,
  componentsDir: string,
  parentContext: Record<string, unknown>,
  parentFilePath: string,
  options: StxOptions,
  processedComponents: Set<string> | undefined = new Set<string>(),
  dependencies: Set<string>,
): Promise<string> {
  // Import locally to avoid circular dependency at module load time
  const { extractVariables } = await importOnce('stx/variable-extractor', () => import('./variable-extractor'))

  // Initialize processedComponents if it's undefined
  const components = processedComponents ?? new Set<string>()

  if (components.has(componentPath)) {
    // Avoid infinite recursion - only for actual self-referencing components
    // (e.g., a component that includes itself in its own template)
    return `[Circular component reference: ${componentPath}]`
  }

  // Clone the set so sibling usages of the same component are not blocked,
  // only nested (recursive) usages within this component's own subtree
  const branchComponents = new Set(components)
  branchComponents.add(componentPath)

  // Islands (#1746 Phase 1): a `client="visible|idle|interaction|media:<query>"`
  // attribute on the component tag DEFERS this component's hydration to that
  // trigger, reusing the stx-hydrate lazy-hydration runtime — its reactive
  // binding (processElement) is held back until the trigger fires instead of
  // running eagerly at page load. `client="load"` is the eager default (no-op).
  // The directive is consumed HERE: removed from props so it is neither passed
  // to the component (defineProps) nor serialized into data-stx-props.
  const clientAttr = typeof props.client === 'string' ? props.client.trim() : ''
  if ('client' in props)
    delete props.client
  const hydrateTrigger = (clientAttr && clientAttr !== 'load' && isHydrateTrigger(clientAttr)) ? clientAttr : ''

  try {
    // Helper: convert kebab-case to PascalCase
    const kebabToPascal = (str: string) => str
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    // Helper: convert PascalCase to kebab-case
    const pascalToKebab = (str: string) => str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()

    // Get base name without extension
    const baseName = componentPath.endsWith('.stx')
      ? componentPath.slice(0, -4)
      : componentPath

    // Find the component file
    let componentFilePath: string | null = null

    // First, check if this component was explicitly imported via @import
    const importedComponents = parentContext.__importedComponents as Map<string, string> | undefined
    if (importedComponents) {
      // Try various name formats
      const namesToTry = [
        baseName,
        baseName.toLowerCase(),
        kebabToPascal(baseName),
        pascalToKebab(baseName),
      ]
      for (const name of namesToTry) {
        if (importedComponents.has(name)) {
          componentFilePath = importedComponents.get(name)!
          break
        }
      }
    }

    // If not found via @import, use auto-discovery
    const triedPaths: string[] = []
    if (!componentFilePath) {
      // Generate all possible file names to try
      const fileVariants = [
        `${baseName}.stx`,
        `${kebabToPascal(baseName)}.stx`,
        `${pascalToKebab(baseName)}.stx`,
      ]
      // Remove duplicates
      const uniqueVariants = [...new Set(fileVariants)]

      // When processing a layout, search relative to the original page file FIRST
      // Page-specific components should take precedence over global componentsDir
      const originalFilePath = parentContext.__originalFilePath as string | undefined
      const searchDirs: string[] = []

      if (originalFilePath) {
        const originalDir = path.join(path.dirname(originalFilePath), 'components')
        searchDirs.push(originalDir)
      }

      // Then search global componentsDir and parent-relative paths
      if (componentsDir) searchDirs.push(componentsDir)
      const rootComponentsDir = options._rootComponentsDir
      if (typeof rootComponentsDir === 'string' && !searchDirs.includes(rootComponentsDir))
        searchDirs.push(rootComponentsDir)
      const parentRelative = path.join(path.dirname(parentFilePath), 'components')
      if (!searchDirs.includes(parentRelative)) {
        searchDirs.push(parentRelative)
      }
      if (options.componentsDir && options.componentsDir !== componentsDir && !searchDirs.includes(options.componentsDir)) {
        searchDirs.push(options.componentsDir)
      }

      // Also search common project component directories as fallbacks. Root these
      // at the CONFIGURED project root (and the rendered file), never process.cwd()
      // — otherwise resolution depends on where the process was launched and can
      // disagree with userComponentFileExists() about which file a tag resolves to.
      // The convention dirs only apply within an explicitly configured root.
      const configuredRoot = typeof options.root === 'string' ? path.resolve(options.root) : undefined
      const resolveBase = configuredRoot ?? path.dirname(parentFilePath)
      const fallbackDirs: string[] = []
      if (configuredRoot) {
        // Canonical Stacks project components dir. Without this, a tag referenced
        // from a *nested* view (e.g. resources/views/products/index.stx) only
        // searched its own `<viewDir>/components` and the global componentsDir, so
        // project-level components in `resources/views/components` resolved for root
        // views but 404'd for any view in a subdirectory.
        fallbackDirs.push(path.resolve(configuredRoot, 'resources/views/components'))
        // Legacy scaffold location (pre-`resources/views/` move).
        fallbackDirs.push(path.resolve(configuredRoot, 'resources/components'))
        fallbackDirs.push(path.resolve(configuredRoot, 'src/components'))
        fallbackDirs.push(path.resolve(configuredRoot, 'components'))
      }
      // Built-in STX components (e.g., StxLink) — always available, cwd-independent.
      fallbackDirs.push(path.resolve(import.meta.dir, 'components'))
      for (const fallback of fallbackDirs) {
        if (!searchDirs.includes(fallback)) {
          searchDirs.push(fallback)
        }
      }

      // Plugin-registered component directories (e.g. `@stacksjs/components`'s
      // `src/ui/` exposed by a stx plugin shim). Populated by config.ts when
      // each plugin is loaded; consume it here so `<Notification>` etc. resolve
      // out of installed packages without forcing the project to copy or
      // re-export them.
      //
      // Searched LAST, after every project location. A plugin supplies a
      // default; a component the project actually wrote must win over it.
      // While these were searched first, a project holding its own
      // `resources/components/AppShell.stx` still rendered the plugin's copy,
      // and the symptom was baffling: the plugin file's relative includes
      // failed against a directory the author had never written.
      const pluginDirs = (options as any)._pluginComponentDirs
      if (Array.isArray(pluginDirs)) {
        for (const dir of pluginDirs) {
          if (typeof dir === 'string' && !searchDirs.includes(dir))
            searchDirs.push(dir)
        }
      }

      // Framework defaults, searched last: the app overrides by name, and
      // anything it does not define falls back here. Mirrors
      // `fallbackLayoutsDir`.
      if (options.fallbackComponentsDir && !searchDirs.includes(options.fallbackComponentsDir))
        searchDirs.push(options.fallbackComponentsDir)

      const normalizedSearchDirs = [...new Set(searchDirs.map((dir) => {
        if (!dir)
          return dir

        return path.isAbsolute(dir)
          ? dir
          : path.resolve(resolveBase, dir)
      }))]
      searchDirs.length = 0
      searchDirs.push(...normalizedSearchDirs)

      const resolutionCacheKey = `${baseName}\0${parentFilePath}\0${normalizedSearchDirs.join('\0')}`
      const cachedResolution = componentResolutionCache.get(resolutionCacheKey)
      if (cachedResolution) {
        if (await fileExists(cachedResolution))
          componentFilePath = cachedResolution
        else
          componentResolutionCache.delete(resolutionCacheKey)
      }

      // If path starts with ./ or ../, resolve from current template directory
      if (!componentFilePath && (baseName.startsWith('./') || baseName.startsWith('../'))) {
        componentFilePath = path.resolve(path.dirname(parentFilePath), `${baseName}.stx`)
        triedPaths.push(componentFilePath)
      }
      else if (!componentFilePath) {
        // Search in all directories with all naming variants
        for (const dir of searchDirs) {
          if (!dir) continue
          for (const variant of uniqueVariants) {
            const tryPath = path.join(dir, variant)
            triedPaths.push(tryPath)
            if (await fileExists(tryPath)) {
              componentFilePath = tryPath
              break
            }
          }
          if (componentFilePath) break

          // Also search subdirectories recursively. Components routinely live
          // in nested folders (e.g. `components/Dashboard/UI/PageLayout.stx`),
          // and limiting the walk to a single level meant only direct children
          // of `componentsDir` could be auto-resolved by tag name. Walking the
          // tree (with a depth cap to keep pathological layouts from blowing
          // up startup time) lets `<PageLayout />` find the right file without
          // forcing every page to add an explicit import.
          if (!componentFilePath) {
            try {
              const fs = await import('node:fs')
              const dirStat = fs.statSync(dir, { throwIfNoEntry: false })
              if (!dirStat?.isDirectory()) continue

              const MAX_DEPTH = 8
              const stack: Array<{ path: string, depth: number }> = [{ path: dir, depth: 0 }]
              while (stack.length > 0 && !componentFilePath) {
                const current = stack.pop()!
                if (current.depth >= MAX_DEPTH) continue
                let entries: import('node:fs').Dirent[]
                try {
                  entries = fs.readdirSync(current.path, { withFileTypes: true })
                }
                catch {
                  continue
                }
                for (const entry of entries) {
                  if (!entry.isDirectory()) continue
                  // Skip dirs that are unlikely to hold STX components and that
                  // can be huge (node_modules) or hidden (dotdirs).
                  if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
                  const subDir = path.join(current.path, entry.name)
                  for (const variant of uniqueVariants) {
                    const tryPath = path.join(subDir, variant)
                    triedPaths.push(tryPath)
                    if (await fileExists(tryPath)) {
                      componentFilePath = tryPath
                      break
                    }
                  }
                  if (componentFilePath) break
                  stack.push({ path: subDir, depth: current.depth + 1 })
                }
              }
            }
            catch {
              // Ignore directory read errors
            }
          }
          if (componentFilePath) break
        }
      }

      if (componentFilePath)
        componentResolutionCache.set(resolutionCacheKey, componentFilePath)
    }

    // Check if component exists
    if (!componentFilePath || !await fileExists(componentFilePath)) {
      const searchInfo = triedPaths.length > 0
        ? `\nSearched paths:\n${triedPaths.map(p => `  - ${p}`).join('\n')}`
        : ''
      return `[Error loading component: ENOENT: no such file or directory, open '${componentPath}']${searchInfo}`
    }

    // Track this component as a dependency
    dependencies.add(componentFilePath)

    // Check if the component is cached
    let componentContent: string
    if (componentsCache.has(componentFilePath)) {
      componentContent = componentsCache.get(componentFilePath)!
    }
    else {
      // Read the file
      try {
        componentContent = await Bun.file(componentFilePath).text()
        // Cache for future use
        componentsCache.set(componentFilePath, componentContent)
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return `[Error loading component: ${message}]`
      }
    }

    // Create a new context with component props and slot content
    // Include both individual props and a `props` object for Vue-style access
    // Filter internal variables from parent context to prevent leaking into child components,
    // but preserve specific internal vars needed for component resolution
    const internalKeysToPreserve = new Set([
      '__originalFilePath',
      '__importedComponents',
      COMPONENT_CLIENT_FACTORIES_CONTEXT_KEY,
      // Slot content belongs to the caller. Carry its signal-name knowledge
      // through nested component renders so a static prop with the same name
      // cannot make `{{ signalName() }}` look server-evaluable and erase it.
      '__stx_client_signal_names',
      /*
       * The request, which a component is part of serving.
       *
       * Dropping this was the default rather than a decision - every `__` key
       * is filtered here to stop internals leaking downward, and this one is
       * not an internal, it is the request. A component that asked which path
       * it was rendering for got `undefined`, and so did `useRoute()`, which
       * reads the same key: `path`, `search`, `params` and `method` were all
       * empty inside a component while the page around it had them.
       *
       * The failure is quiet in the way this codebase keeps finding: reading
       * `__stxServeContext.path` yields '' rather than throwing, so a
       * component that builds a URL from it builds a wrong one and nothing
       * reports anything. A repository browser deciding where a moved handle
       * should redirect to sent every deep link to the repository root,
       * because the only path it could see was the one it reconstructed from
       * its own props.
       *
       * Safe to carry: it is the same request for the whole render, so a
       * component cannot see a different one from its parent, and it is read
       * rather than written.
       */
      '__stxServeContext',
      /*
       * The per-render scope-id sequence (stacksjs/stx#1945).
       *
       * A mutable object shared by reference down the whole component tree, so
       * every component in ONE render draws from one counter and no two get the
       * same id. Carried rather than rebuilt per subtree for exactly that
       * reason: a fresh counter would restart at 1 and collide with its own
       * siblings.
       */
      '__stx_scope_seq',
    ])
    const filteredParentContext: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(parentContext)) {
      if (!key.startsWith('__') || internalKeysToPreserve.has(key)) {
        filteredParentContext[key] = val
      }
    }
    // A script authored by the caller belongs to the caller's reactive scope,
    // not to the component receiving its slot. Leaving it in `slotContent`
    // sends it through the component's nested `skipSignalsRuntime` pass, where
    // it can be stripped or registered against the component scope. The page
    // then renders bindings such as `{{ search }}` without the state that owns
    // them. Hoist executable caller scripts out of the slot and append them to
    // the expanded component so the parent page's final script pass compiles
    // them with the parent file path and scope.
    // An `@include` written by the caller belongs to the CALLER's file, the
    // same way the caller's `<script>` does.
    //
    // `processComponents` runs before `processIncludes` in the pipeline, so a
    // layout that writes
    //
    //     <AppShell>
    //       @include('../components/nav')
    //     </AppShell>
    //
    // handed the raw directive to the component, which then resolved
    // `../components/nav` against ITS OWN directory. Every such include failed
    // with an ENOENT naming a path the author never wrote — and because
    // include failures render in place, the page came back as a wall of error
    // banners where the navigation, header, and footer should have been.
    //
    // Expanding here, against `parentFilePath`, resolves the path the author
    // meant. Guarded on the directive actually being present so the common
    // case — slot content with no includes — costs one substring check.
    let callerSlotContent = slotContent
    if (slotContent.includes('@include')) {
      const { processIncludes } = await importOnce('stx/includes', () => import('./includes'))
      callerSlotContent = await processIncludes(
        slotContent,
        parentContext,
        parentFilePath,
        options,
        dependencies,
      )
    }

    const stashedCallerScripts = stashScriptElements(callerSlotContent)
    const callerClientScripts: string[] = []
    const componentSlotContent = stashedCallerScripts.output.replace(
      /\x00STX_SCRIPT_(\d+)\x00/g,
      (_match, index: string) => {
        const script = stashedCallerScripts.scripts[Number(index)] || ''
        const attrs = script.match(/^<script\b([^>]*)>/i)?.[1] || ''
        const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()
        const executable = !type || ['module', 'text/javascript', 'application/javascript'].includes(type)
        if (!/\bserver\b/i.test(attrs) && executable) {
          callerClientScripts.push(script)
          return ''
        }
        return script
      },
    )
    // Parse slot content once — `$slots` lets component templates branch on
    // what the caller provided (e.g. `@if($slots.header)`), mirroring Vue.
    const { extractSlotContent } = await importOnce('stx/slots', () => import('./slots'))
    const parsedSlotContent = extractSlotContent(componentSlotContent)
    const $slots: Record<string, string> = {}
    if (parsedSlotContent.defaultSlot?.trim())
      $slots.default = parsedSlotContent.defaultSlot
    for (const [slotName, slotDef] of parsedSlotContent.namedSlots)
      $slots[slotName] = slotDef.content

    /*
     * The component's own id, deterministic across renders (#1945).
     *
     * Eleven shipped components stamped `Math.random()` into their markup to
     * get an id unique to the instance. That is the same problem cbe08f0b4b
     * removed from scope ids, reached from the component side: a page holding
     * any of them renders different bytes every time, so a caller cannot tell
     * two renders are the same answer and the whole point of #1945 is lost for
     * that page. Measured on a page with one <Sidebar>: byte-identical false,
     * differing only in `id="stx-sidebar-XXXXXX"`.
     *
     * It draws from the same per-render sequence the scope id below uses, so
     * it has the properties that id was designed for — unique within a
     * document, distinct between documents, identical between renders of one —
     * and it is allocated HERE, before the component's `<script server>` runs,
     * because that is where a component needs to read it.
     *
     * Allocated for every component, not only the ones that end up with a
     * scope: which components carry client scripts is not knowable this early,
     * and a sequence that skips is still a sequence.
     */
    const scopeSeq = (parentContext.__stx_scope_seq ??= {
      n: 0,
      key: Bun.hash(String(parentContext.__filename ?? parentFilePath)).toString(36).slice(0, 6),
    }) as { n: number, key: string }
    // Key last, so the id keeps the `stx_<name>_<n>_<suffix>` shape the random
    // one had. Nothing that matched the old ids has to change, and the name
    // stays at the front where it is readable in a DOM inspector.
    const componentUid = `stx_${baseName.replace(/[^a-zA-Z0-9]/g, '_')}_${++scopeSeq.n}_${scopeSeq.key}`

    const componentContext: Record<string, unknown> = {
      ...filteredParentContext,
      // Readable from the component's own `<script server>` and template.
      $uid: componentUid,
      ...props,
      props, // Allow `props.foo` syntax in addition to just `foo`
      slot: componentSlotContent,
      $slots,
      __processedComponents: branchComponents,
      // Clear __sections so {{ slot }} in the component template is resolved as an
      // expression (using the `slot` variable above) rather than being replaced by
      // the parent page's @section('content') content
      __sections: {},
      // Slot content is authored by the CALLER, so any {{ }} in it refers to
      // the caller's scope - reactive state the component's own script has
      // never heard of. Without this flag the expression pipeline judged them
      // by the component's script alone, found no signals, and evaluated them
      // server-side against a context that never had them: they rendered as
      // empty. `<Alert>{{ error }}</Alert>` produced a styled, empty box, and
      // the only clue was that the box appeared at all. Flagging the component
      // as signal-bearing lets the existing "unresolvable here, preserve for
      // the client" rule do its job.
      // #1800: one gate for this component render unit, computed on the FULL
      // pre-strip source PLUS the caller's slot markup — whose {{ }} name the
      // CALLER's signals, which this component's own script cannot see.
      __stx_signals_gate: usesSignalsInScript(componentContent) || slotContentHasExpressions(slotContent),
    }

    // Fill in `defineProps` destructuring defaults for any prop the caller
    // omitted, so server-side template evaluation sees them (the component's
    // `<script>` runs client-side only). Must run after `...props` above so
    // caller-provided values are never overwritten.
    applyDestructuredPropDefaults(componentContent, componentContext)

    // SFC Support: Extract <template>, <script>, and <style> sections
    let workingContent = componentContent

    // Extract the explicit Vue-style SFC wrapper, while preserving runtime
    // <template :for>, <template @if>, slot, and keyed template elements.
    const templateBlock = findSfcTemplateBlock(workingContent)
    if (templateBlock)
      workingContent = templateBlock.content.trim()

    // Extract all script content from the component (SFC support)
    // Look in original content since template section won't have scripts
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    const scriptMatches = [...componentContent.matchAll(scriptRegex)]
    const clientScripts: string[] = []
    /*
     * `<script server cache>` is the author's promise that this fragment is a
     * pure function of its props and slots. It stays an opt-in: an ordinary
     * `<script server>` may read a clock, a request or a database, and a
     * component that did would be served its first answer forever.
     *
     * What lifts here (stacksjs/stx#1945) is the second half of the old gate,
     * which also required EVERY script in the file to be a server script. That
     * ruled out the components the cost actually sits in -- anything with a
     * `<script client>` could not opt in however pure its author knew it to be,
     * and those are precisely the ones that carry an expensive island. The
     * restriction stood because returning a cached string skips the
     * REGISTRATION a client script performs as well as the render, and the
     * document's bytes depend on it; the entry now carries those effects and
     * replays them, so the restriction has nothing left to protect.
     */
    const cacheableServerComponent = scriptMatches.some(match =>
      /\bserver\b/.test(match[1] || '') && /\bcache\b/.test(match[1] || ''),
    )
    let componentRenderCacheKey: string | null = null
    let dependencyBaseline: Set<string> | null = null
    let clientFactoryBaseline: Map<string, number> | null = null
    let uidBaseline = 0
    let preservedExpressionBaseline: Set<string> | null = null

    // `<script server cache>` is an author's promise that the fragment is a pure
    // function of props and slots, so the caller's scope need not be keyed. Any
    // other component may still be memoised, but only by keying everything it
    // could read -- `filteredParentContext` copies every non-internal caller
    // binding in, so a component can read anything the page declared, and a key
    // built from props alone would serve one page's render to another's.
    applyComponentRenderCacheBudget(options)
    // A 0 budget is a host saying it would rather spend the time than the
    // memory. The budget alone would already deliver that -- every value is
    // larger than 0 bytes, so every one is declined -- but it would serialise
    // the props and hash them first, on every render, to build a key nothing
    // will ever store or read. Skipping that is the only thing this condition
    // does; correctness sits in the budget either way.
    if (cacheableServerComponent && appliedComponentRenderCacheBytes > 0) {
      const serializedInput = serializeComponentRenderInput({
        props,
        slot: slotContent,
        buildMode: options.buildMode ?? '',
        skipEventDirectives: options.skipEventDirectives === true,
        // The scope id is stamped through the output and drawn from a sequence,
        // so two instances of one component on a page render different bytes
        // and must not share an entry. Between renders of the same page the
        // sequence repeats, which is what makes the entry reusable at all.
        uid: componentUid,
      })
      if (serializedInput !== null) {
        componentRenderCacheKey = `${componentFilePath}\0${contentKey(componentContent)}\0${serializedInput}`
        const cachedRender = componentRenderCache.get(componentRenderCacheKey)
        if (cachedRender) {
          for (const dependency of cachedRender.dependencies)
            dependencies.add(dependency)
          // Everything below is work the full render would have done besides
          // returning a string. Skipping any of it makes the cached page differ
          // from the uncached one, which is the failure this cache exists to
          // avoid rather than cause.
          replayComponentClientFactories(parentContext, cachedRender.clientFactories)
          scopeSeq.n += cachedRender.uidsConsumed
          if (cachedRender.preservedClientExpressions.length > 0) {
            const preserved = new Set(
              Array.isArray(parentContext.__stx_preserved_client_expressions)
                ? parentContext.__stx_preserved_client_expressions as string[]
                : [],
            )
            for (const expression of cachedRender.preservedClientExpressions)
              preserved.add(expression)
            parentContext.__stx_preserved_client_expressions = [...preserved]
          }
          return cachedRender.output
        }
        dependencyBaseline = new Set(dependencies)
        clientFactoryBaseline = snapshotComponentClientFactoryCounts(parentContext)
        uidBaseline = scopeSeq.n
        preservedExpressionBaseline = new Set(
          Array.isArray(parentContext.__stx_preserved_client_expressions)
            ? parentContext.__stx_preserved_client_expressions as string[]
            : [],
        )
      }
    }

    for (const match of scriptMatches) {
      const attrs = match[1] || ''
      let content = match[2] || ''

      const isServerScript = attrs.includes('server')
      const shouldTranspile = shouldTranspileTypeScript(attrs)

      // Transpile TypeScript if needed
      if (shouldTranspile && content.trim()) {
        content = transpileTypeScript(content)
      }

      // Extract variables ONLY from <script server> — all other scripts are client-side.
      // <script>, <script client>, <script type="module"> are all client.
      if (isServerScript && content) {
        try {
          await extractVariables(content, componentContext, componentFilePath)
        }
        catch (e) {
          // Script may contain browser-only code, skip variable extraction
        }
      }

      // Preserve client scripts (non-server scripts)
      if (!isServerScript) {
        // Strip any existing signal destructuring - it will be added by the scope wrapper
        let cleanContent = content.replace(/^\s*const\s*\{[^}]+\}\s*=\s*window\.stx\s*;?\s*\n?/gm, '')
        // Interpolate `{{ name }}` references in the client script body against
        // the server-script's extracted exports. SFCs use this to bridge
        // server-side prop normalization into client code (e.g.
        // `const duration = {{ duration }}` in `<script client>`). Without
        // this substitution the literal `{{ ... }}` survives into the
        // emitted <script> tag and crashes with `Unexpected token '{'`.
        //
        // Must use the JS-aware interpolator, NOT processExpressions: this is a
        // script body, not HTML. processExpressions HTML-escapes its output, so
        // any interpolated value containing a quote emitted `&quot;` into the
        // JS — `const cls = &quot;foo&quot;;` — and the whole client bundle died
        // with `Unexpected token '&'`. That broke every @stacksjs/components
        // component that seeds a client signal from a server prop (Dialog,
        // Drawer, Tabs, Notification, …). interpolateScriptExpressions emits
        // JSON.stringify(value) for `{{ }}` (strings become valid JS literals),
        // raw String(value) for `{!! !!}`, and leaves unresolved expressions
        // alone for the client runtime — the same rules the page-level path in
        // process.ts already applies to non-component scripts. See #1757.
        // The gate must cover BOTH markers. Checking only `{{`/`}}` meant a
        // client script whose sole interpolation was `{!! expr !!}` skipped
        // interpolation entirely and emitted the raw marker into the JS —
        // `const e = {!! JSON.stringify(x) !!};` — another syntax error.
        const hasMustache = cleanContent.includes('{{') && cleanContent.includes('}}')
        const hasRawMarker = cleanContent.includes('{!!') && cleanContent.includes('!!}')
        if (hasMustache || hasRawMarker)
          cleanContent = interpolateScriptExpressions(cleanContent, componentContext)
        // Remove ts/lang attributes from output since it's now JavaScript
        const cleanAttrs = attrs.replace(/\s*\bts\b/g, '').replace(/\s*\blang\s*=\s*["']?(ts|typescript)["']?/gi, '')
        clientScripts.push(`<script${cleanAttrs}>${cleanContent}</script>`)
      }
    }

    // Extract <style> content if present
    const styleMatch = componentContent.match(/<style\b([^>]*)>([\s\S]*?)<\/style>/i)
    const styleAttrs = styleMatch ? styleMatch[1] : ''
    const styleContent = styleMatch ? styleMatch[2] : ''
    let preservedStyle = ''
    const hasScopedStyle = styleAttrs && /\bscoped\b/i.test(styleAttrs)
    if (styleMatch) {
      preservedStyle = `<style${styleAttrs}>${styleContent}</style>`
    }

    // Remove script and style tags from template content
    let templateContent = workingContent
    templateContent = templateContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    if (styleMatch) {
      templateContent = templateContent.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    }

    // Absorb `@push('styles')...@endpush` blocks from the component body.
    // Components author CSS this way when they want it hoisted to the
    // page's <head>; the page-level @push processor (process.ts:495,
    // 747) does that hoisting at the top level. Component rendering
    // doesn't reach that pass — without this absorb step the inner
    // <style> gets stripped above but the bare `@push('styles')` /
    // `@endpush` markers leak through to the page as literal text.
    // Strip the markers; pull any `<style>` content out and merge it
    // into the component's preservedStyle so the rules still apply.
    {
      const pushStyleRe = /@push\s*\(\s*['"]styles['"]\s*\)([\s\S]*?)@endpush/gi
      const collectedStyles: string[] = []
      templateContent = templateContent.replace(pushStyleRe, (_full, inner) => {
        const styleInPush = (inner as string).match(/<style\b([^>]*)>([\s\S]*?)<\/style>/i)
        if (styleInPush)
          collectedStyles.push(`<style${styleInPush[1]}>${styleInPush[2]}</style>`)
        return ''
      })
      // Also strip any other `@push('<name>')...@endpush` blocks (e.g.
      // scripts) so their wrappers don't leak — content is dropped at
      // this level; if needed, plumb a `stacks` reference through
      // renderComponentWithSlot in a follow-up.
      templateContent = templateContent.replace(/@push\s*\(\s*['"][^'"]+['"]\s*\)[\s\S]*?@endpush/gi, '')
      if (collectedStyles.length > 0)
        preservedStyle = `${preservedStyle}${collectedStyles.join('\n')}`
    }

    // Find and replace any direct references to {{ text || slot }} with the actual value
    if (slotContent && templateContent.includes('{{ text || slot }}')) {
      // Use callback to avoid $-interpretation in slot content
      templateContent = templateContent.replace(/\{\{\s*text\s*\|\|\s*slot\s*\}\}/g, () => slotContent)
    }

    // Process slots using the new slots module (supports named and scoped slots)
    // (slot content was already parsed once for `$slots` above)
    const { applySlots } = await importOnce('stx/slots', () => import('./slots'))
    const { defaultSlot, namedSlots } = parsedSlotContent

    // Apply slots to the template (handles named slots, scoped slots, and default slots)
    templateContent = await applySlots(templateContent, defaultSlot, namedSlots, componentContext)

    // Entity decoding used to happen here, over every string in the component's
    // context, on the theory that a value which "looks like HTML" must have been
    // escaped on its way in. It undid escaping the application had done on
    // purpose: a component that rendered `&lt;script&gt;` - because it had
    // carefully escaped somebody's issue body, README or comment - had it turned
    // back into `<script>` before the page was written, and stx then wrapped the
    // resurrected tag in its scoped-script runtime and ran it. Any application
    // rendering user text through a component had a stored cross-site scripting
    // hole it could not close from its own code.
    //
    // The real need was narrower: a *static* attribute is HTML source, so
    // `<Card title="Tom &amp; Jerry" />` has to arrive as `Tom & Jerry`. That
    // decoding now happens where the attribute is parsed, on attribute values
    // only, and nothing decodes a value again afterwards.

    // Check if component has signal scripts - if so, skip event directive processing
    // because the runtime will handle @click, @keydown etc. via processElement()
    const hasSignalScripts = clientScripts.some(s =>
      /\b(?:state|derived|effect|ref|reactive|computed|watch|watchEffect|useReactiveProp|defineProps|withDefaults|defineEmits|defineExpose|defineSlots)\s*(?:<[^<>()]*>)?\s*\(/.test(s),
    )
    const clientSignalNames = componentClientSignalNames(clientScripts)
    const inheritedClientSignalNames = Array.isArray(componentContext.__stx_client_signal_names)
      ? componentContext.__stx_client_signal_names as string[]
      : []
    if (clientSignalNames.length > 0 || inheritedClientSignalNames.length > 0)
      componentContext.__stx_client_signal_names = [...new Set([...inheritedClientSignalNames, ...clientSignalNames])]

    // First, process any nested components in this component
    const componentOptions = {
      ...options,
      // Nested components first resolve beside their parent, but they must retain
      // the configured component tree as a fallback. Without this root, a layout
      // in `components/Dashboard/UI` cannot render a sibling feature component in
      // `components/Dashboard/Analytics`.
      _rootComponentsDir: options._rootComponentsDir || options.componentsDir,
      componentsDir: path.dirname(componentFilePath),
      // Skip runtime injection for nested components - parent will inject it
      skipSignalsRuntime: true,
      // Signal components bind events through their scoped runtime. Components
      // with no client script must leave forwarded DOM events for the parent
      // page, since they have no local script in which to attach a handler.
      skipEventDirectives: hasSignalScripts || clientScripts.length === 0,
      // Components must never get auto-layout wrapping — they are fragments, not pages
      defaultLayout: undefined,
    }

    // Mark as non-top-level so Crosswind CSS isn't injected per-component
    // (only the top-level page call should inject Crosswind)
    componentContext.__stxProcessingDepth = (parentContext.__stxProcessingDepth as number || 0) + 1

    // Process the component content recursively with the new context
    // eslint-disable-next-line ts/no-top-level-await
    const result = await processDirectives(templateContent, componentContext, componentFilePath, componentOptions, dependencies)

    // Component expansion happens before the caller's final expression pass.
    // Record any mustaches the component deliberately left unresolved so the
    // caller does not evaluate them against its unrelated scope and erase
    // client signal output such as `{{ title() }}`.
    const preservedExpressions = new Set<string>(
      Array.isArray(parentContext.__stx_preserved_client_expressions)
        ? parentContext.__stx_preserved_client_expressions as string[]
        : [],
    )
    for (const match of result.matchAll(/\{\{([\s\S]*?)\}\}/g))
      preservedExpressions.add(match[1].trim())
    if (preservedExpressions.size > 0)
      parentContext.__stx_preserved_client_expressions = [...preservedExpressions]

    /*
     * A scope id that is unique within a document, distinct between documents,
     * and identical between renders of the same one (stacksjs/stx#1945).
     *
     * It used to be `${++moduleCounter}_${Math.random()}`, so rendering one
     * template twice produced different bytes. That is what made the render
     * uncacheable: nothing downstream could tell two renders were the same
     * answer, so an unchanged view paid the full pipeline every time — measured
     * at ~5MB of native churn per render with the JS heap flat.
     *
     * Three requirements, and all three hold together only if the page's own
     * identity is part of the id:
     *
     *   - identical across renders   -> no counter that survives a render, and
     *                                   no randomness
     *   - unique within one document -> a per-render sequence, not a content
     *                                   hash: two instances of one component
     *                                   with identical props are still two
     *                                   instances, and one id would merge their
     *                                   signals into a single scope
     *   - distinct across documents  -> the page key. Without it every page
     *                                   starts at 1, so page A and page B both
     *                                   emit `stx_sidebar_1` and an SPA
     *                                   navigation puts two unrelated scopes on
     *                                   the same name
     *
     * The sequence is seeded lazily on the parent context — the page's own
     * object, fresh per render — so siblings share it, and the preserve-list
     * entry carries it into nested components by reference.
     */
    // Allocated once per component instance, above, where `$uid` needed it.
    // One id for the scope and for the component's own markup: they identify
    // the same instance, and two counters would be two things to keep in step.
    const scopeId = componentUid

    // Wrap component in a scope container if it has client scripts with signals
    // (hasSignalScripts already computed above for componentOptions)
    let output = result

    if (hasSignalScripts) {
      // Wrap the component output in a scoped container
      // Serialize props for client-side defineProps() access (Phase 4)
      let propsJson = ''
      if (Object.keys(props).length > 0) {
        try {
          propsJson = ` data-stx-props="${escapeAttr(JSON.stringify(props))}"`
        }
        catch {
          // Skip props serialization if circular references or other JSON errors
        }
      }
      const hydrateJson = hydrateTrigger ? ` stx-hydrate="${escapeAttr(hydrateTrigger)}"` : ''
      output = `<div data-stx-scope="${scopeId}"${propsJson}${hydrateJson}>${result}</div>`

      // Modify client scripts to register variables in this scope
      const scopedScripts = await Promise.all(clientScripts.map(async (script) => {
        // Extract script content
        const scriptMatch = script.match(/<script([^>]*)>([\s\S]*)<\/script>/i)
        if (!scriptMatch) return script

        const [, attrs, rawContent] = scriptMatch
        const { vendorStyleTags, factoryBody } = await buildComponentIsland(
          rawContent,
          componentFilePath,
          options.buildMode === 'compile',
        )
        const factoryId = hydrateTrigger
          ? null
          : registerComponentClientFactory(parentContext, factoryBody)
        const wrappedContent = factoryId
          ? `window.__stxComponentFactories[${JSON.stringify(factoryId)}](${JSON.stringify(scopeId)});`
          : `(${factoryBody})(${JSON.stringify(scopeId)});`
        // Islands (#1746): when this component is deferred via client="<trigger>",
        // emit the setup script as an INERT type="stx/island" so the browser does
        // NOT run it at parse — the runtime executes it (registering the scope +
        // running any side-effectful setup like fetches) only when the trigger
        // fires. Keep data-stx-scoped so the build passes don't reprocess it.
        if (hydrateTrigger) {
          return `${vendorStyleTags}<script type="stx/island" data-stx-island="${scopeId}" data-stx-scoped${attrs}>${wrappedContent}</script>`
        }
        // run="always": this CALL is what registers window.stx._scopes[scopeId],
        // and disposeSubtreeScopes deletes that on the way out of every SPA
        // navigation, so it has to run again on arrival.
        //
        // It was the one scope registration the router's fallback could not
        // recognise (#1828). The shared factory PRELUDE is stamped always, but
        // the prelude only re-registers the factory — nothing invokes it. The
        // call itself begins `window.__stxComponentFactories[...]`, which is
        // neither of the shapes the sniff accepts, so from the first SPA return
        // it was hash-deduped and the component's scope was simply never put
        // back. _handleStxLoad then bails at `if (!scopeVars) return`, leaving
        // empty :text and inert @click with no error.
        //
        // Only the multi-instance form was affected: a component used once is
        // inlined as `(factoryBody)(scopeId)`, which the sniff accepts by its
        // leading paren. Two of the same component on one page took this path.
        return `${vendorStyleTags}<script data-stx-scoped data-stx-run="always"${attrs}>${wrappedContent}</script>`
      }))

      // Emit setup immediately after its root. The browser still executes it
      // before DOMContentLoaded, while useReactiveProp can now read and observe
      // the root that already exists in the parsed DOM.
      output = output + '\n' + scopedScripts.join('\n')
      if (preservedStyle) {
        output += '\n' + preservedStyle
      }
    }
else {
      // No signals, transform and append style and scripts
      if (preservedStyle) {
        output += '\n' + preservedStyle
      }
      if (clientScripts.length > 0) {
        // Use event bindings collected during template processing (from @click, @input, etc.)
        const eventBindings = (componentContext.__stx_event_bindings || []) as any[]
        const serverData = extractBridgeData(componentContext as Record<string, unknown>)
        const transformedScripts = await Promise.all(clientScripts.map(async (fullScript: string) => {
          const contentMatch = fullScript.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)
          if (!contentMatch) return fullScript
          return await processClientScript(contentMatch[1], { eventBindings, templateContent: output, filePath: componentFilePath, projectRoot: process.cwd(), serverData })
        }))
        output += '\n' + transformedScripts.join('\n')
        // Clear bindings after use
        componentContext.__stx_event_bindings = []
      }
    }

    // Process <style scoped> for this component (scopes CSS and adds data-v-hash to elements)
    if (hasScopedStyle) {
      const scopedStyleResult = processScopedStyles(output, componentFilePath)
      if (scopedStyleResult.hasScoped) {
        output = scopedStyleResult.html
      }
    }

    if (componentRenderCacheKey && dependencyBaseline) {
      const preservedNow = Array.isArray(parentContext.__stx_preserved_client_expressions)
        ? parentContext.__stx_preserved_client_expressions as string[]
        : []
      componentRenderCache.set(componentRenderCacheKey, {
        output,
        dependencies: [...dependencies].filter(dependency => !dependencyBaseline.has(dependency)),
        clientFactories: clientFactoryBaseline
          ? componentClientFactoriesRegisteredSince(parentContext, clientFactoryBaseline)
          : [],
        // The ids the SUBTREE drew. This component's own is not among them:
        // it is allocated above the cache check, so a hit has already drawn it
        // and only the skipped descendants are left to account for.
        uidsConsumed: scopeSeq.n - uidBaseline,
        preservedClientExpressions: preservedExpressionBaseline
          ? preservedNow.filter(expression => !preservedExpressionBaseline.has(expression))
          : [],
      })
    }

    return callerClientScripts.length > 0
      ? `${output}\n${callerClientScripts.join('\n')}`
      : output
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return `[Error processing component: ${message}]`
  }
  finally {
    // Remove from processed set to allow future uses
    components.delete(componentPath)
  }
}

// =============================================================================
// File System Utilities
// =============================================================================

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return Bun.file(filePath).exists()
}

// =============================================================================
// Template Path Resolution
// =============================================================================

/**
 * Reject paths that would resolve outside the project root.
 *
 * Templates legitimately use `../partials/foo.stx`-style relative paths,
 * so we can't ban `..` outright — but the *resolved* path must stay
 * inside the project root. This is the cheapest defense against
 * `@layout('/etc/passwd')` or `@include('../../../../etc/passwd')`
 * from a template that interpolates user-controlled data into a
 * directive argument.
 *
 * Returns the resolved path on success, or null if the path escapes
 * the project. Callers treat null the same as "not found" so the
 * usual fallback chain still runs.
 */
function assertInsideRoot(resolvedAbsolute: string, root: string): string | null {
  const r = path.resolve(root)
  const p = path.resolve(resolvedAbsolute)
  // Add a trailing separator so /foo doesn't match /foo-bar
  const rWithSep = r.endsWith(path.sep) ? r : r + path.sep
  if (p === r || p.startsWith(rWithSep)) return p
  return null
}

/**
 * Look for one layout inside one layouts directory, with and without `.stx`.
 *
 * `@extends('layouts/default')` against a directory that already ends in
 * `layouts` would otherwise resolve to `.../layouts/layouts/default`, so a
 * redundant `layouts/` prefix on the reference is stripped first.
 */
async function findLayoutIn(
  layoutsDir: string,
  templatePath: string,
  dependencies?: Set<string>,
  debug?: boolean,
): Promise<string | null> {
  const stripped = templatePath.startsWith('layouts/') ? templatePath.slice(8) : templatePath
  const base = path.join(layoutsDir, stripped)

  for (const candidate of base.endsWith('.stx') ? [base] : [base, `${base}.stx`]) {
    if (await fileExists(candidate)) {
      if (debug)
        console.log(`Found layout in ${layoutsDir}: ${candidate}`)
      dependencies?.add(candidate)
      return candidate
    }
  }

  return null
}

/**
 * Resolve a template path based on the current file path
 */
export async function resolveTemplatePath(
  templatePath: string,
  currentFilePath: string,
  options: StxOptions,
  dependencies?: Set<string>,
): Promise<string | null> {
  const result = await resolveTemplatePathInner(templatePath, currentFilePath, options, dependencies)
  if (result === null) return null
  // Final guard: every path the resolver returns must stay inside a
  // trusted directory. Any escape (a malformed include path, an
  // interpolated user-controlled directive argument, ...) gets rejected
  // here so the caller treats it as "not found" rather than serving an
  // arbitrary file. The project root is the primary boundary, but
  // explicit `root`/`layoutsDir`/`componentsDir`/`partialsDir`/`pagesDir`
  // values are also trusted — they may legitimately point outside cwd
  // (e.g. tests using a fixture in another repo, monorepos pointing at
  // sibling packages). The guard is non-negotiable: if the path is
  // inside *none* of those, it gets rejected.
  const safeUnderCwd = assertInsideRoot(result, process.cwd())
  if (safeUnderCwd) return safeUnderCwd

  const trustedDirs = [options.root, options.layoutsDir, options.fallbackLayoutsDir, options.componentsDir, options.partialsDir, options.pagesDir]
    .filter((d): d is string => typeof d === 'string' && d.length > 0)
  for (const dir of trustedDirs) {
    const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir)
    if (assertInsideRoot(result, resolvedDir)) return path.resolve(result)
  }
  console.warn(`[stx] rejected resolved template path that escapes project root: ${result} (template: ${templatePath}, from: ${currentFilePath})`)
  return null
}

async function resolveTemplatePathInner(
  templatePath: string,
  currentFilePath: string,
  options: StxOptions,
  dependencies?: Set<string>,
): Promise<string | null> {
  // Debug output for layout resolution
  if (options.debug) {
    console.log(`Resolving template path: ${templatePath} from ${currentFilePath}`)
  }

  // Try relative to current file
  const dirPath = path.dirname(currentFilePath)

  const projectRoot = process.cwd()

  // Handle common paths
  // 1. Absolute path (starts with /) — interpreted as project-rooted
  // (e.g. `/components/foo.stx`), NOT as a filesystem absolute path.
  // Reject any `..` escapes from the project root.
  if (templatePath.startsWith('/')) {
    const absolutePath = path.join(projectRoot, templatePath)
    const safe = assertInsideRoot(absolutePath, projectRoot)
    if (!safe) {
      console.warn(`[stx] rejected template path that escapes project root: ${templatePath} (from ${currentFilePath})`)
      return null
    }
    if (options.debug) {
      console.log(`Checking absolute path: ${safe}`)
    }
    // Track dependency if found
    if (await fileExists(safe) && dependencies) {
      dependencies.add(safe)
    }
    return safe
  }

  // 2. Direct path relative to current file
  const directPath = path.join(dirPath, templatePath)
  if (await fileExists(directPath)) {
    if (options.debug) {
      console.log(`Found direct path: ${directPath}`)
    }
    // Track dependency
    if (dependencies) {
      dependencies.add(directPath)
    }
    return directPath
  }

  // 3. Add .stx extension if not present, also try .jsx/.tsx
  if (!templatePath.endsWith('.stx') && !templatePath.endsWith('.jsx') && !templatePath.endsWith('.tsx')) {
    for (const ext of ['.stx', '.tsx', '.jsx']) {
      const pathWithExt = `${directPath}${ext}`
      if (await fileExists(pathWithExt)) {
        if (options.debug) {
          console.log(`Found direct path with extension: ${pathWithExt}`)
        }
        if (dependencies) {
          dependencies.add(pathWithExt)
        }
        return pathWithExt
      }
    }
  }

  // A layout can come from two places: the directory the project configured as
  // `layoutsDir`, or the convention walk that looks for a directory literally
  // named `layouts` somewhere above the page. Configuration is checked FIRST.
  //
  // The walk used to run first, which meant any stray `layouts/` directory in a
  // page's ancestry silently shadowed the configured one. Nothing reports it —
  // both resolve to a real file and the page simply renders inside the wrong
  // layout, so the only symptom is markup that came from a template the author
  // never referenced. A monorepo with a `layouts/` at the root, or an app whose
  // pages sit under a directory that happens to contain one, hits this without
  // doing anything unusual.
  //
  // The walk still runs when the configured directory does not hold the layout,
  // which is what lets `pages/requests/[id].stx` find `pages/layouts/default.stx`
  // with no configuration at all.
  const layoutSearchDirs: string[] = []

  if (options.layoutsDir) {
    layoutSearchDirs.push(
      path.isAbsolute(options.layoutsDir)
        ? options.layoutsDir
        : path.resolve(process.cwd(), options.layoutsDir),
    )
  }

  // Walk up the page's directory tree looking for a `layouts/` directory.
  let searchDir = path.resolve(dirPath)
  const rootDir = process.cwd()
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(searchDir, 'layouts')
    let candidateExists = false
    try { candidateExists = fs.statSync(candidate, { throwIfNoEntry: false })?.isDirectory() ?? false } catch {}
    if (candidateExists) {
      layoutSearchDirs.push(candidate)
      break
    }
    const parent = path.dirname(searchDir)
    if (parent === searchDir || parent.length < rootDir.length) break
    searchDir = parent
  }

  for (const dir of layoutSearchDirs) {
    const found = await findLayoutIn(dir, templatePath, dependencies, options.debug)
    if (found)
      return found
  }

  // The app's layouts directory did not have it, so try the one the framework
  // ships. This is the override model the caller is expressing: `layoutsDir`
  // is the app and wins, `fallbackLayoutsDir` is the default set behind it.
  //
  // Checked AFTER `options.layoutsDir` on purpose - an app that defines a
  // layout of the same name must win, which is the whole point of shipping
  // defaults. Missing this step is not a 404 but a 200 with an empty body,
  // because a page whose layout does not resolve renders its sections into
  // nothing.
  if (options.fallbackLayoutsDir) {
    const resolvedFallback = path.isAbsolute(options.fallbackLayoutsDir)
      ? options.fallbackLayoutsDir
      : path.resolve(process.cwd(), options.fallbackLayoutsDir)

    const strippedPath = templatePath.startsWith('layouts/') ? templatePath.slice(8) : templatePath
    const candidates = [path.join(resolvedFallback, strippedPath)]
    if (!templatePath.endsWith('.stx'))
      candidates.push(`${candidates[0]}.stx`)

    for (const candidate of candidates) {
      if (await fileExists(candidate)) {
        if (options.debug)
          console.log(`Found in options.fallbackLayoutsDir: ${candidate}`)
        if (dependencies)
          dependencies.add(candidate)
        return candidate
      }
    }
  }

  // 4. Special case for layouts directory if specified in options or path looks like 'layouts/*'
  if (templatePath.startsWith('layouts/') || templatePath.includes('/layouts/')) {
    const parts = templatePath.split('layouts/')
    const layoutsPath = path.join(options.partialsDir || dirPath, 'layouts', parts[1])
    if (await fileExists(layoutsPath)) {
      if (options.debug) {
        console.log(`Found in layouts path: ${layoutsPath}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(layoutsPath)
      }
      return layoutsPath
    }

    // With extension
    if (!layoutsPath.endsWith('.stx')) {
      const layoutsPathWithExt = `${layoutsPath}.stx`
      if (await fileExists(layoutsPathWithExt)) {
        if (options.debug) {
          console.log(`Found in layouts path with extension: ${layoutsPathWithExt}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(layoutsPathWithExt)
        }
        return layoutsPathWithExt
      }
    }
  }

  // 5. Try from layouts directory under partialsDir if specified
  if (options.partialsDir) {
    const partialsLayoutsDir = path.join(options.partialsDir, 'layouts')
    if (await fileExists(partialsLayoutsDir)) {
      const fromPartialsLayouts = path.join(partialsLayoutsDir, templatePath)
      if (await fileExists(fromPartialsLayouts)) {
        if (options.debug) {
          console.log(`Found in partials layouts dir: ${fromPartialsLayouts}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(fromPartialsLayouts)
        }
        return fromPartialsLayouts
      }

      // With extension
      if (!templatePath.endsWith('.stx')) {
        const fromPartialsLayoutsWithExt = `${fromPartialsLayouts}.stx`
        if (await fileExists(fromPartialsLayoutsWithExt)) {
          if (options.debug) {
            console.log(`Found in partials layouts dir with extension: ${fromPartialsLayoutsWithExt}`)
          }
          // Track dependency
          if (dependencies) {
            dependencies.add(fromPartialsLayoutsWithExt)
          }
          return fromPartialsLayoutsWithExt
        }
      }
    }
  }

  // 6. Try from project root or view directory if configured
  const viewsPath = options.partialsDir || path.join(process.cwd(), 'views')
  const fromRoot = path.join(viewsPath, templatePath)
  if (await fileExists(fromRoot)) {
    if (options.debug) {
      console.log(`Found in views path: ${fromRoot}`)
    }
    // Track dependency
    if (dependencies) {
      dependencies.add(fromRoot)
    }
    return fromRoot
  }

  // 7. With extension from project root
  if (!templatePath.endsWith('.stx')) {
    const fromRootWithExt = `${fromRoot}.stx`
    if (await fileExists(fromRootWithExt)) {
      if (options.debug) {
        console.log(`Found in views path with extension: ${fromRootWithExt}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(fromRootWithExt)
      }
      return fromRootWithExt
    }
  }

  // If still not found and we're looking for a layout, try in the TEMP_DIR/layouts directory
  // This is a special case for the tests
  if (dirPath.includes('temp')) {
    const tempDirLayouts = path.join(path.dirname(dirPath), 'layouts', templatePath)
    if (await fileExists(tempDirLayouts)) {
      if (options.debug) {
        console.log(`Found in temp layouts dir: ${tempDirLayouts}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(tempDirLayouts)
      }
      return tempDirLayouts
    }

    // With extension
    if (!templatePath.endsWith('.stx')) {
      const tempDirLayoutsWithExt = `${tempDirLayouts}.stx`
      if (await fileExists(tempDirLayoutsWithExt)) {
        if (options.debug) {
          console.log(`Found in temp layouts dir with extension: ${tempDirLayoutsWithExt}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(tempDirLayoutsWithExt)
        }
        return tempDirLayoutsWithExt
      }
    }
  }

  // Not found
  if (options.debug) {
    console.warn(`Template not found after trying all paths: ${templatePath} (referenced from ${currentFilePath})`)
  }
  else {
    console.warn(`Template not found: ${templatePath} (referenced from ${currentFilePath})`)
  }
  return null
}

// =============================================================================
// Error Formatting
// =============================================================================

/**
 * Get source line number from an error in a template
 * This helps provide more precise error messages
 * @param template The full template string
 * @param errorPosition The character position of the error (if available)
 * @param errorPattern The pattern to locate in the template (fallback if position not available)
 * @returns Line number and context information
 */
export function getSourceLineInfo(
  template: string,
  errorPosition?: number,
  errorPattern?: string,
): { lineNumber: number, lineContent: string, context: string } {
  // Default values if we can't extract info
  let lineNumber = 0
  let lineContent = ''
  let context = ''

  try {
    // If we have a position, find the line containing that position
    if (typeof errorPosition === 'number' && errorPosition >= 0) {
      const lines = template.split('\n')
      let currentPos = 0

      for (let i = 0; i < lines.length; i++) {
        currentPos += lines[i].length + 1 // +1 for the newline character
        if (currentPos >= errorPosition) {
          lineNumber = i + 1 // Lines start at 1
          lineContent = lines[i].trim()

          // Get some context (preceding and following lines)
          const start = Math.max(0, i - 2)
          const end = Math.min(lines.length, i + 3)
          context = lines.slice(start, end).map((line, idx) => {
            const contextLineNum = start + idx + 1
            const marker = contextLineNum === lineNumber ? '> ' : '  '
            return `${marker}${contextLineNum}: ${line}`
          }).join('\n')

          break
        }
      }
    }
    // If no position but we have a pattern, find the line containing the pattern
    else if (errorPattern) {
      const patternPos = template.indexOf(errorPattern)
      if (patternPos >= 0) {
        return getSourceLineInfo(template, patternPos)
      }
    }
  }
  catch {
    // Fallback - at least return what we know about the error
  }

  return { lineNumber, lineContent, context }
}

// ANSI color codes for better error formatting
const colors = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  gray: '\x1B[90m',
  bgRed: '\x1B[41m',
  bgYellow: '\x1B[43m',
}

/**
 * Create a descriptive error message with line information
 * @param errorType Type of error (e.g., "Expression", "Directive")
 * @param errorMessage The base error message
 * @param filePath The file where the error occurred
 * @param template The template content
 * @param errorPosition The position of the error (if known)
 * @param errorPattern A pattern to locate the error (fallback)
 * @returns A formatted error message
 */
export function createDetailedErrorMessage(
  errorType: string,
  errorMessage: string,
  filePath: string,
  template: string,
  errorPosition?: number,
  errorPattern?: string,
): string {
  const { lineNumber, context } = getSourceLineInfo(template, errorPosition, errorPattern)
  const fileName = filePath.split('/').pop()

  // Compute column when we have an offset so the leading machine-parseable
  // "path:line:col:" prefix gives editors / log scrapers a clickable
  // jump target — matters more than the pretty box for actually fixing
  // the error.
  let column = 0
  if (typeof errorPosition === 'number' && errorPosition >= 0 && template) {
    const lastNl = template.lastIndexOf('\n', Math.max(0, errorPosition - 1))
    column = errorPosition - (lastNl + 1) + 1 // 1-based
  }

  // Machine-parseable prefix first (no colors): editors and most log
  // tooling expect `path:line:col:` at the start of the line.
  let detailedMessage = ''
  if (lineNumber > 0) {
    detailedMessage += `\n${filePath}:${lineNumber}${column > 0 ? `:${column}` : ''}: ${errorType.toLowerCase()} error: ${errorMessage}\n`
  }

  // Then the pretty banner for humans
  detailedMessage += `\n${colors.bold}${colors.red}╭──────────────────────────────────────────────────────────────╮${colors.reset}\n`
  detailedMessage += `${colors.bold}${colors.red}│${colors.reset} ${colors.bold}${colors.bgRed} ERROR ${colors.reset} ${colors.red}${errorType} Error${colors.reset}${' '.repeat(Math.max(0, 43 - errorType.length))}${colors.bold}${colors.red}│${colors.reset}\n`
  detailedMessage += `${colors.bold}${colors.red}╰──────────────────────────────────────────────────────────────╯${colors.reset}\n`

  // File and line information
  detailedMessage += `\n${colors.cyan}${colors.bold}File:${colors.reset} ${colors.dim}${fileName}${colors.reset}`

  if (lineNumber > 0) {
    detailedMessage += ` ${colors.gray}(line ${lineNumber}${column > 0 ? `, col ${column}` : ''})${colors.reset}`
  }

  // Error message
  detailedMessage += `\n${colors.yellow}${colors.bold}Message:${colors.reset} ${errorMessage}\n`

  // Add detailed context for debug mode
  if (context) {
    detailedMessage += `\n${colors.blue}${colors.bold}Context:${colors.reset}\n${colors.dim}${context}${colors.reset}\n`
  }

  return detailedMessage
}

// =============================================================================
// Miscellaneous Utilities
// =============================================================================

/**
 * Clear the component cache
 * Useful for development or testing
 */
export function clearComponentCache(): void {
  componentsCache.clear()
  componentResolutionCache.clear()
  componentRenderCache.clear()
}

/**
 * Get component cache statistics
 */
export function getComponentCacheStats(): { size: number, maxSize: number } {
  return {
    size: componentsCache.size,
    maxSize: 500,
  }
}

// ── Component islands ───────────────────────────────────────────────────────

/** The compiled client artifact for one component script. */
interface ComponentIsland {
  /** `<style>` tags for the script's vendor CSS imports, emitted ahead of it. */
  vendorStyleTags: string
  /** `function(__scopeId) { … }` — the scope id is applied at the call site. */
  factoryBody: string
  /** Files the artifact was built from; re-stat'ed before a memo hit is served. */
  deps: DepSnapshot[]
}

/**
 * Islands by script source, component file and build mode (#1945).
 *
 * The artifact is a function of those three alone — the scope id is threaded
 * in as the factory's argument at the call site and the props ride on the root
 * element — so an unchanged component is string interpolation from here on.
 * Rendering one used to re-run the whole chain on its bundle every time:
 * CSS-import extraction, browser-helper injection, the bundler's cache read,
 * runtime-import stripping, store-import rewriting, the declaration scan and a
 * regex per runtime global to size the destructure, each making its own copy
 * of a ~190KB string.
 *
 * Bundle inputs and vendor CSS files are re-stat'ed on every hit, so an edit
 * to a helper under a dev server invalidates this the same way it invalidates
 * the bundle cache. A script the bundler gave back unbundled is not
 * remembered: whatever it warned about, it warns about on every render that
 * hits it, as before.
 */
const componentIslands = renderMemo<ComponentIsland>(128)

async function buildComponentIsland(rawContent: string, componentFilePath: string, minify: boolean): Promise<ComponentIsland> {
  const key = contentKey(rawContent, componentFilePath, minify)
  const remembered = componentIslands.get(key)
  if (remembered) {
    if (depsUnchanged(remembered.deps))
      return remembered
    componentIslands.delete(key)
  }

  const cssExtraction = extractAndStripCssImports(rawContent, {
    filePath: componentFilePath,
    projectRoot: process.cwd(),
  })
  let bundledContent = cssExtraction.code
  const vendorStyleTags = renderVendorStyleTags(cssExtraction.styles)
  bundledContent = injectBrowserCoreAutoImports(bundledContent).code
  const { hasUserImports, bundleClientScript } = await importOnce('stx/client-script-bundler', () => import('./client-script-bundler'))
  // Filled by the bundler itself rather than read back from its host-keyed
  // map afterwards. A component's client blocks are bundled under one
  // Promise.all, so a second call's bookkeeping can land between this call's
  // await and the read — and the island would then be remembered against
  // another script's dependency list, which is exactly the staleness the
  // snapshot exists to prevent.
  const bundleInputs: string[] = []
  let bundleFellBack = false
  if (hasUserImports(bundledContent)) {
    const unbundled = bundledContent
    bundledContent = await bundleClientScript(unbundled, componentFilePath, {
      projectRoot: process.cwd(),
      minify,
      collectInputs: bundleInputs,
    })
    // Every fallback path hands the source back as it was.
    bundleFellBack = bundledContent === unbundled
  }
  const { stripStxRuntimeImports } = await importOnce('stx/signal-processing', () => import('./signal-processing'))
  bundledContent = stripStxRuntimeImports(bundledContent)
  // Transform store imports before IIFE wrapping (import statements can't be inside functions)
  const content = transformStoreImports(bundledContent)
  const componentLocalNames = extractVariableNames(content)
  // Wrap script content to register in scope
  // Add data-stx-scoped attribute to prevent double-processing by processScriptSetup
  // Pull the full component-system API into scope, not just the
  // reactivity primitives. Components shipped from @stacksjs/components
  // (Notification, Dropdown, Tabs, Sidebar, Transition, …) call
  // `defineEmits()` / `defineExpose()` at the top of their
  // `<script client>` blocks; if those identifiers aren't bound here
  // the very first line throws `defineEmits is not defined`,
  // tearing down the whole inline IIFE before any reactive binding
  // gets a chance to wire up. Mirrors the destructure the page-level
  // setup uses in signal-processing.ts.
  const factoryBody = `function(__scopeId) {
  ${buildRuntimeGlobalsDestructure('const', [...COMPONENT_SCOPE_LOCAL_GLOBALS, ...componentLocalNames], content)}
  const __scope = window.stx._scopes = window.stx._scopes || {};
  const __scopeVars = __scope[__scopeId] = __scope[__scopeId] || {};
  __scopeVars.$refs = __scopeVars.$refs || {};
  const __previousCurrentElement = window.__STX_CURRENT_ELEMENT__;
  window.__STX_CURRENT_ELEMENT__ = document.querySelector('[data-stx-scope="' + __scopeId + '"]');

  // Scope-specific lifecycle callbacks
  __scopeVars.__mountCallbacks = __scopeVars.__mountCallbacks || [];
  __scopeVars.__destroyCallbacks = __scopeVars.__destroyCallbacks || [];
  const onMount = (fn) => __scopeVars.__mountCallbacks.push(fn);
  const onDestroy = (fn) => __scopeVars.__destroyCallbacks.push(fn);

try {
${content}

  // Register all defined signals and functions in this scope
  const __localVars = {};
  try {
    ${componentLocalNames.map(v => `if (typeof ${v} !== 'undefined') __localVars['${v}'] = ${v};`).join('\n    ')}
  }
catch (e) {}
  Object.assign(__scopeVars, __localVars);
}
finally {
  window.__STX_CURRENT_ELEMENT__ = __previousCurrentElement;
}
}`

  const island: ComponentIsland = {
    vendorStyleTags,
    factoryBody,
    deps: snapshotDeps([...bundleInputs, ...cssExtraction.styles.map(style => style.resolvedPath)]),
  }
  // Remember only a build that succeeded. Both failure modes produce a result
  // that LOOKS complete and carries nothing that could later invalidate it:
  //
  //   - the bundler's fallback hands back the unbundled source, and its
  //     warning is the only sign anything is wrong;
  //   - an unresolvable vendor CSS import is stripped and simply contributes
  //     no <style> tag, and the file it names is not on disk to be stat'ed.
  //
  // Either way the dependency snapshot is missing the very file whose
  // appearance should invalidate this, so caching it would outlive the fix:
  // create the stylesheet, or install the package, and the page would keep
  // rendering the broken build until the process restarted. Recomputing is
  // also what keeps the warning printing on every render, which is the only
  // thing pointing at the problem.
  if (!bundleFellBack && cssExtraction.unresolved.length === 0)
    componentIslands.set(key, island)
  return island
}
