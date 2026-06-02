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
import { processClientScript } from './client-script'
import { processExpressions, unescapeHtml } from './expressions'
import { transformStoreImports } from './store-imports'
import { LRUCache } from './performance-utils'
import { processDirectives } from './process'
import { getPublicEnvDefine } from './public-env'
import { processScopedStyles } from './style-scoping'

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
let scopeIdCounter = 0

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
    const transpiler = new Bun.Transpiler({
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
  push(path.join(path.dirname(parentFilePath), 'components'))
  push(options.componentsDir)
  const pluginDirs = (options as any)._pluginComponentDirs
  if (Array.isArray(pluginDirs)) {
    for (const dir of pluginDirs) push(typeof dir === 'string' ? dir : null)
  }
  // Convention fallbacks — only within a configured project root, and never stx's
  // own `import.meta.dir/components` (where built-ins live).
  if (configuredRoot) {
    push(path.resolve(configuredRoot, 'resources/views/components'))
    push(path.resolve(configuredRoot, 'resources/components'))
    push(path.resolve(configuredRoot, 'src/components'))
    push(path.resolve(configuredRoot, 'components'))
  }

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
  const { extractVariables } = await import('./variable-extractor')

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
      const parentRelative = path.join(path.dirname(parentFilePath), 'components')
      if (!searchDirs.includes(parentRelative)) {
        searchDirs.push(parentRelative)
      }
      if (options.componentsDir && options.componentsDir !== componentsDir && !searchDirs.includes(options.componentsDir)) {
        searchDirs.push(options.componentsDir)
      }

      // Plugin-registered component directories (e.g. `@stacksjs/components`'s
      // `src/ui/` exposed by a stx plugin shim). Populated by config.ts when
      // each plugin is loaded; consume it here so `<Notification>` etc.
      // resolve out of installed packages without forcing the project to
      // copy or re-export them.
      const pluginDirs = (options as any)._pluginComponentDirs
      if (Array.isArray(pluginDirs)) {
        for (const dir of pluginDirs) {
          if (typeof dir === 'string' && !searchDirs.includes(dir))
            searchDirs.push(dir)
        }
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

      const normalizedSearchDirs = [...new Set(searchDirs.map((dir) => {
        if (!dir)
          return dir

        return path.isAbsolute(dir)
          ? dir
          : path.resolve(resolveBase, dir)
      }))]
      searchDirs.length = 0
      searchDirs.push(...normalizedSearchDirs)

      // If path starts with ./ or ../, resolve from current template directory
      if (baseName.startsWith('./') || baseName.startsWith('../')) {
        componentFilePath = path.resolve(path.dirname(parentFilePath), `${baseName}.stx`)
        triedPaths.push(componentFilePath)
      }
      else {
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
    const internalKeysToPreserve = new Set(['__originalFilePath', '__importedComponents'])
    const filteredParentContext: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(parentContext)) {
      if (!key.startsWith('__') || internalKeysToPreserve.has(key)) {
        filteredParentContext[key] = val
      }
    }
    const componentContext: Record<string, unknown> = {
      ...filteredParentContext,
      ...props,
      props, // Allow `props.foo` syntax in addition to just `foo`
      slot: slotContent,
      __processedComponents: branchComponents,
      // Clear __sections so {{ slot }} in the component template is resolved as an
      // expression (using the `slot` variable above) rather than being replaced by
      // the parent page's @section('content') content
      __sections: {},
    }

    // Fill in `defineProps` destructuring defaults for any prop the caller
    // omitted, so server-side template evaluation sees them (the component's
    // `<script>` runs client-side only). Must run after `...props` above so
    // caller-provided values are never overwritten.
    applyDestructuredPropDefaults(componentContent, componentContext)

    // SFC Support: Extract <template>, <script>, and <style> sections
    let workingContent = componentContent

    // Extract <template> content if present (Vue-style SFC)
    // Preserve templates with id, x-for, x-if, @for, @if, :for, :if — those are client-side elements
    const templateMatch = workingContent.match(/<template\b(?![^>]*\b(?:id|x-for|x-if|@for|@if|:for|:if)\s*=)[^>]*>([\s\S]*?)<\/template>/i)
    if (templateMatch) {
      workingContent = templateMatch[1].trim()
    }

    // Extract all script content from the component (SFC support)
    // Look in original content since template section won't have scripts
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    const scriptMatches = [...componentContent.matchAll(scriptRegex)]
    const clientScripts: string[] = []

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
        if (cleanContent.includes('{{') && cleanContent.includes('}}'))
          cleanContent = processExpressions(cleanContent, componentContext, componentFilePath)
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
    const { extractSlotContent, applySlots } = await import('./slots')
    const { defaultSlot, namedSlots } = extractSlotContent(slotContent)

    // Apply slots to the template (handles named slots, scoped slots, and default slots)
    templateContent = await applySlots(templateContent, defaultSlot || slotContent, namedSlots, componentContext)

    // Handle HTML content in component props
    for (const [key, value] of Object.entries(componentContext)) {
      if (typeof value === 'string') {
        // Check if the content looks like HTML (has tags)
        if (
          (value.includes('<') && value.includes('>'))
          || value.includes('&lt;')
          || value.includes('&quot;')
        ) {
          // If this is a content prop, we need to make sure it's not double-escaped
          const unescaped = unescapeHtml(value)
          componentContext[key] = unescaped
        }
      }
    }

    // Check if component has signal scripts - if so, skip event directive processing
    // because the runtime will handle @click, @keydown etc. via processElement()
    const hasSignalScripts = clientScripts.some(s => /\b(state|derived|effect)\s*(?:<[^<>()]*>)?\s*\(/.test(s))

    // First, process any nested components in this component
    const componentOptions = {
      ...options,
      componentsDir: path.dirname(componentFilePath),
      // Skip runtime injection for nested components - parent will inject it
      skipSignalsRuntime: true,
      // Skip event directive processing for signal components - runtime handles @click etc.
      skipEventDirectives: hasSignalScripts,
      // Components must never get auto-layout wrapping — they are fragments, not pages
      defaultLayout: undefined,
    }

    // Mark as non-top-level so Crosswind CSS isn't injected per-component
    // (only the top-level page call should inject Crosswind)
    componentContext.__stxProcessingDepth = (parentContext.__stxProcessingDepth as number || 0) + 1

    // Process the component content recursively with the new context
    // eslint-disable-next-line ts/no-top-level-await
    const result = await processDirectives(templateContent, componentContext, componentFilePath, componentOptions, dependencies)

    // Generate unique scope ID for this component instance
    const scopeId = `stx_${baseName.replace(/[^a-zA-Z0-9]/g, '_')}_${++scopeIdCounter}_${Math.random().toString(36).slice(2, 8)}`

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
      output = `<div data-stx-scope="${scopeId}"${propsJson}>${result}</div>`

      // Modify client scripts to register variables in this scope
      const scopedScripts = clientScripts.map(script => {
        // Extract script content
        const scriptMatch = script.match(/<script([^>]*)>([\s\S]*)<\/script>/i)
        if (!scriptMatch) return script

        const [, attrs, rawContent] = scriptMatch
        // Transform store imports before IIFE wrapping (import statements can't be inside functions)
        const content = transformStoreImports(rawContent)
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
        const wrappedContent = `
(function() {
  const { state, derived, effect, batch, defineEmits, defineExpose, defineSlots, defineProps, withDefaults, useStore, useFetch, useRef, useQuery, useMutation, useOptimistic, useDebounce, useDebouncedValue, useThrottle, useInterval, useTimeout, useToggle, useCounter, useClickOutside, useFocus, useAsync, useLocalStorage, useEventListener, useWebSocket, useColorMode, useDark, useHead, useSeoMeta, definePageMeta, useRoute, useSearchParams, navigate, goBack, goForward, provide, inject, ref, reactive, computed, watch, watchEffect, nextTick } = window.stx;
  const __scope = window.stx._scopes = window.stx._scopes || {};
  const __scopeVars = __scope['${scopeId}'] = __scope['${scopeId}'] || {};

  // Scope-specific lifecycle callbacks
  __scopeVars.__mountCallbacks = __scopeVars.__mountCallbacks || [];
  __scopeVars.__destroyCallbacks = __scopeVars.__destroyCallbacks || [];
  const onMount = (fn) => __scopeVars.__mountCallbacks.push(fn);
  const onDestroy = (fn) => __scopeVars.__destroyCallbacks.push(fn);

${content}

  // Register all defined signals and functions in this scope
  const __localVars = {};
  try {
    ${extractVariableNames(content).map(v => `if (typeof ${v} !== 'undefined') __localVars['${v}'] = ${v};`).join('\n    ')}
  }
catch (e) {}
  Object.assign(__scopeVars, __localVars);
})();`
        return `<script data-stx-scoped${attrs}>${wrappedContent}</script>`
      })

      // Prepend scoped scripts BEFORE HTML so scope is registered before DOMContentLoaded processes elements
      // Append preserved style after HTML
      output = scopedScripts.join('\n') + '\n' + output
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
        const transformedScripts = await Promise.all(clientScripts.map(async (fullScript: string) => {
          const contentMatch = fullScript.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)
          if (!contentMatch) return fullScript
          return await processClientScript(contentMatch[1], { eventBindings, templateContent: output, filePath: componentFilePath, projectRoot: process.cwd() })
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

    return output
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

  const trustedDirs = [options.root, options.layoutsDir, options.componentsDir, options.partialsDir, options.pagesDir]
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

  // Handle special case for layouts — walk up directory tree to find layouts/
  // This allows pages/requests/[id].stx to find pages/layouts/default.stx
  let layoutsDir = ''
  let searchDir = path.resolve(dirPath)
  const rootDir = process.cwd()
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(searchDir, 'layouts')
    let candidateExists = false
    try { candidateExists = fs.statSync(candidate, { throwIfNoEntry: false })?.isDirectory() ?? false } catch {}
    if (candidateExists) {
      layoutsDir = candidate
      break
    }
    const parent = path.dirname(searchDir)
    if (parent === searchDir || parent.length < rootDir.length) break
    searchDir = parent
  }
  if (layoutsDir) {
    // Strip layouts/ prefix if present — @extends('layouts/default') + layoutsDir='pages/layouts'
    // should resolve to pages/layouts/default, not pages/layouts/layouts/default
    const layoutTemplatePath = templatePath.startsWith('layouts/') ? templatePath.slice(8) : templatePath
    const fromCurrentLayouts = path.join(layoutsDir, layoutTemplatePath)
    if (await fileExists(fromCurrentLayouts)) {
      if (options.debug) {
        console.log(`Found in current layouts dir: ${fromCurrentLayouts}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(fromCurrentLayouts)
      }
      return fromCurrentLayouts
    }

    // With extension
    if (!layoutTemplatePath.endsWith('.stx')) {
      const fromCurrentLayoutsWithExt = `${fromCurrentLayouts}.stx`
      if (await fileExists(fromCurrentLayoutsWithExt)) {
        if (options.debug) {
          console.log(`Found in current layouts dir with extension: ${fromCurrentLayoutsWithExt}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(fromCurrentLayoutsWithExt)
        }
        return fromCurrentLayoutsWithExt
      }
    }
  }

  // Check options.layoutsDir if specified (for projects like voide that set layoutsDir)
  if (options.layoutsDir) {
    // Resolve relative layoutsDir paths relative to cwd or the file's parent directory
    const resolvedLayoutsDir = path.isAbsolute(options.layoutsDir)
      ? options.layoutsDir
      : path.resolve(process.cwd(), options.layoutsDir)

    // Strip 'layouts/' prefix if present — same logic as the directory-walk
    // layoutsDir resolution above. Without this, @extends('layouts/soon')
    // with layoutsDir='resources/layouts' would resolve to
    // 'resources/layouts/layouts/soon' (doubled prefix).
    const strippedPath = templatePath.startsWith('layouts/') ? templatePath.slice(8) : templatePath
    const fromLayoutsDir = path.join(resolvedLayoutsDir, strippedPath)
    if (await fileExists(fromLayoutsDir)) {
      if (options.debug) {
        console.log(`Found in options.layoutsDir: ${fromLayoutsDir}`)
      }
      if (dependencies) {
        dependencies.add(fromLayoutsDir)
      }
      return fromLayoutsDir
    }

    // With extension
    if (!templatePath.endsWith('.stx')) {
      const fromLayoutsDirWithExt = `${fromLayoutsDir}.stx`
      if (await fileExists(fromLayoutsDirWithExt)) {
        if (options.debug) {
          console.log(`Found in options.layoutsDir with extension: ${fromLayoutsDirWithExt}`)
        }
        if (dependencies) {
          dependencies.add(fromLayoutsDirWithExt)
        }
        return fromLayoutsDirWithExt
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
    layoutsDir = path.join(options.partialsDir, 'layouts')
    if (await fileExists(layoutsDir)) {
      const fromPartialsLayouts = path.join(layoutsDir, templatePath)
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
