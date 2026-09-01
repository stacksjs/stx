/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Client Script Processor
 *
 * Transforms <script client> blocks in SFC (.stx) components:
 * 1. Auto-imports from 'stx' and '@stacksjs/browser' (no import statements needed)
 * 2. Resolves `import { store } from '@stores'` to runtime store access
 * 3. Transpiles TypeScript to JavaScript (strips type annotations, interfaces, import type)
 * 4. Injects event binding code (from @click, @input, etc.) into the script scope
 * 5. Auto-wraps in a scoped IIFE for isolation
 *
 * This enables clean component authoring:
 * ```stx
 * <template>
 *   <button @click="handleClick()">Count: {{ count() }}</button>
 * </template>
 *
 * <script>
 * // No imports needed! state, onMount, Trail, etc. are auto-imported
 * const count = state(0)
 *
 * onMount(async () => {
 *   const trails = await Trail.all()
 *   console.log(trails)
 * })
 *
 * function handleClick() {
 *   count.set(count() + 1)
 * }
 * </script>
 * ```
 *
 * @module client-script
 */

import path from 'node:path'
import fs from 'node:fs'
import type { ParsedEvent, EventModifiers } from './events'
import { asInvocableStatement } from './events'
import { transformStoreImports } from './store-imports'
import { findInterpolationEnd, stripCommentsAndLiterals } from './strip-literals'
// Re-exported from its old home. It moved to `strip-literals.ts` so the
// editor-facing extractor could share it without pulling the bundler in behind
// it, and the runtime bridge and `stx typecheck` MUST agree on what counts as a
// reference (#1868 ask 4). Anything importing it from here keeps working.
export { findInterpolationEnd, stripCommentsAndLiterals } from './strip-literals'
import { shouldTranspileTypeScript, transpileTypeScript } from './utils'
import { importOnce } from './lazy-module'
import { STX_RUNTIME_GLOBALS, usesReactiveRuntime } from './runtime-globals'
import { escapeScriptBody } from './script-emit'

// =============================================================================
// Vendor CSS Side-Effect Imports
// =============================================================================

// Matches side-effect imports targeting `.css` files. Trailing `;` and any
// `?query`/`#hash` suffix are tolerated so callers can disambiguate variants
// the same way they would with a bundler (`?inline`, `?raw`, etc. — the
// suffix doesn't change resolution, just round-trips into the emitted
// `data-stx-vendor` attribute for traceability).
const CSS_SIDE_EFFECT_IMPORT_REGEX = /^[ \t]*import\s+['"]([^'"]+?\.css)(\?[^'"]*)?['"]\s*;?\s*$/gm

export interface VendorCssImport {
  /** The original specifier as written in the import — kept verbatim for the data attribute. */
  source: string
  /** The resolved absolute filesystem path — used for dedupe and reads. */
  resolvedPath: string
  /** The CSS file contents at build time. */
  contents: string
}

/**
 * Split a bare specifier into `{ pkg, subpath }`. Handles scoped names
 * (`@scope/name/...`) and the no-subpath case (`pkg` alone).
 *
 * Returns null for relative/absolute paths — those don't need package
 * resolution and the caller handles them directly.
 */
function splitBareSpecifier(spec: string): { pkg: string, subpath: string } | null {
  if (spec.startsWith('.') || spec.startsWith('/'))
    return null
  if (spec.startsWith('@')) {
    const m = spec.match(/^(@[^/]+\/[^/]+)(\/.*)?$/)
    if (!m) return null
    return { pkg: m[1], subpath: m[2] || '' }
  }
  const m = spec.match(/^([^/]+)(\/.*)?$/)
  if (!m) return null
  return { pkg: m[1], subpath: m[2] || '' }
}

/**
 * Walk up from `fromDir` looking for `node_modules/<pkg>/package.json`.
 * Returns the package directory (the parent of `package.json`) or null.
 *
 * Stops at `/` and at filesystem roots that change device (cheap guard
 * against an infinite loop on weird mount setups).
 */
function findPackageDir(pkg: string, fromDir: string): string | null {
  let dir = fromDir
  while (true) {
    const candidate = path.join(dir, 'node_modules', pkg, 'package.json')
    if (fs.existsSync(candidate))
      return path.dirname(candidate)
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * Match a request against a package.json `exports` map and return the
 * relative target path, or null if nothing matched.
 *
 * Supports the subset Bun.resolveSync misses for CSS-style entries:
 *  - exact-string keys (`./css/medium-editor.css`)
 *  - single-star wildcards (`./css/*` → `./dist/css/*`)
 *  - conditional objects (picks the `import` / `default` condition; the
 *    `types` and `node` conditions are intentionally ignored here since
 *    this resolver is only called for CSS at build time).
 *
 * Doesn't try to be a complete Node ESM resolver — it covers the patterns
 * UI library authors actually ship for stylesheet entry points.
 */
function resolveExportsSubpath(exports: any, request: string): string | null {
  if (!exports || typeof exports !== 'object')
    return null

  const pickTarget = (target: any): string | null => {
    if (typeof target === 'string')
      return target
    if (target && typeof target === 'object') {
      if (typeof target.import === 'string') return target.import
      if (typeof target.default === 'string') return target.default
      if (typeof target.import === 'object') return pickTarget(target.import)
      if (typeof target.default === 'object') return pickTarget(target.default)
    }
    return null
  }

  // 1. Exact-string match
  if (Object.prototype.hasOwnProperty.call(exports, request)) {
    return pickTarget((exports as any)[request])
  }

  // 2. Wildcard match — longest pattern wins (Node's algorithm)
  let bestMatch: { pattern: string, prefix: string, suffix: string } | null = null
  for (const pattern of Object.keys(exports)) {
    const starIdx = pattern.indexOf('*')
    if (starIdx === -1) continue
    const prefix = pattern.slice(0, starIdx)
    const suffix = pattern.slice(starIdx + 1)
    if (!request.startsWith(prefix) || !request.endsWith(suffix)) continue
    if (request.length < prefix.length + suffix.length) continue
    if (!bestMatch || prefix.length > bestMatch.prefix.length)
      bestMatch = { pattern, prefix, suffix }
  }
  if (bestMatch) {
    const matchedInner = request.slice(bestMatch.prefix.length, request.length - bestMatch.suffix.length)
    const target = pickTarget((exports as any)[bestMatch.pattern])
    if (target) return target.replace('*', matchedInner)
  }

  return null
}

/**
 * Manual resolution for a bare specifier when `Bun.resolveSync` declines —
 * the typical case being package.json `exports` wildcard patterns like
 * `"./css/*": "./dist/css/*"`, which Bun's sync resolver doesn't always
 * expand at the time of writing. Reads the package's own `package.json`,
 * runs the exports request against it, and returns an absolute path.
 */
function resolveByPackageExports(spec: string, fromDir: string): string | null {
  const split = splitBareSpecifier(spec)
  if (!split || !split.subpath) return null

  const pkgDir = findPackageDir(split.pkg, fromDir)
  if (!pkgDir) return null

  let manifest: any
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
  }
  catch {
    return null
  }

  // Request is `./<subpath>` against the exports map
  const request = `.${split.subpath}`
  const target = resolveExportsSubpath(manifest.exports, request)
  if (!target) return null

  const abs = path.resolve(pkgDir, target)
  return fs.existsSync(abs) ? abs : null
}

/**
 * Strip side-effect `.css` imports from a `<script client>` body and read
 * their contents off disk.
 *
 * Bun.build doesn't know what to do with `import 'foo.css'` in a JS entry —
 * it either errors or returns the original code unchanged, which leaks the
 * unresolved import into the browser payload. So we intercept those imports
 * before bundling, resolve them ourselves (bare specifiers via Bun's resolver,
 * relative paths against the template's directory), and surface the file
 * contents to the caller so they can be emitted as `<style>` tags wrapped in
 * `@layer vendor { … }`.
 *
 * Missing or unresolvable files emit a single warn-level log and are left
 * out of the result; the original import is still stripped so the bundler
 * never sees it. The trade-off is a silent style miss vs. a broken JS bundle —
 * the former is recoverable, the latter takes the whole component down.
 *
 * Dedupe is by absolute resolved path, so two components importing the same
 * `medium-editor.css` only emit one `<style>` block per `processClientScript`
 * call. Cross-component dedupe still relies on the caller's HTML response
 * (CSS rules collapse harmlessly at the browser level either way).
 */
export function extractAndStripCssImports(
  code: string,
  options: { filePath?: string, projectRoot?: string },
): { code: string, styles: VendorCssImport[] } {
  const templateDir = options.filePath ? path.dirname(options.filePath) : (options.projectRoot || process.cwd())
  const projectRoot = options.projectRoot || process.cwd()
  const seen = new Set<string>()
  const styles: VendorCssImport[] = []

  const stripped = code.replace(CSS_SIDE_EFFECT_IMPORT_REGEX, (_match, spec: string) => {
    let resolvedPath: string
    try {
      if (spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/')) {
        resolvedPath = spec.startsWith('/') ? spec : path.resolve(templateDir, spec)
        if (!fs.existsSync(resolvedPath))
          throw new Error(`file not found: ${resolvedPath}`)
      }
      else {
        // Try Bun's resolver first — it covers the simple cases (main entry,
        // explicit subpath in `exports`) and respects the install layout.
        let resolved: string | null = null
        try {
          resolved = Bun.resolveSync(spec, projectRoot)
        }
        catch {
          // Bun.resolveSync currently misses wildcard `exports` patterns like
          // `"./css/*": "./dist/css/*"` — common in libraries that ship
          // multiple stylesheets. Fall back to a manual exports-aware walk
          // so consumers can use the documented public CSS entry points
          // without inlining the package's internal `dist/` path.
          resolved = resolveByPackageExports(spec, projectRoot)
        }
        if (!resolved)
          throw new Error(`could not resolve ${spec} (Bun.resolveSync + exports fallback both failed)`)
        resolvedPath = resolved
      }
    }
    catch (err: any) {
      console.warn(`[stx:vendor-css] could not resolve ${JSON.stringify(spec)} (from ${options.filePath || '<unknown>'}): ${err?.message || err}`)
      return ''
    }

    if (seen.has(resolvedPath))
      return ''
    seen.add(resolvedPath)

    try {
      const contents = fs.readFileSync(resolvedPath, 'utf8')
      styles.push({ source: spec, resolvedPath, contents })
    }
    catch (err: any) {
      console.warn(`[stx:vendor-css] could not read ${resolvedPath}: ${err?.message || err}`)
    }
    return ''
  })

  return { code: stripped, styles }
}

/**
 * Escape a string for safe use inside an HTML double-quoted attribute value.
 * Kept narrow on purpose — the only callers feed it filesystem paths and
 * package specifiers, never user-controlled data.
 */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Render collected vendor CSS as one `<style>` tag per resolved source,
 * each wrapped in `@layer vendor { … }` so the styles can never out-specificity
 * utility classes (assuming the consuming app declares the layer order in
 * its global stylesheet, e.g. `@layer vendor, components, utilities;`).
 *
 * Wrapping in a layer at emit time means consumers get correct ordering even
 * if they forget to declare the layer order — anonymous layers still rank
 * below un-layered rules, so vendor styles default to lowest precedence.
 */
export function renderVendorStyleTags(styles: VendorCssImport[]): string {
  if (styles.length === 0)
    return ''
  return `${styles.map((s) => {
    return `<style data-stx-vendor="${escapeAttr(s.source)}" data-stx-layer="vendor">
@layer vendor {
${s.contents}
}
</style>`
  }).join('\n')}\n`
}

// =============================================================================
// Auto-Import Configuration
// =============================================================================

/**
 * Exports from 'stx' auto-imported into classic `<script>` / `<script client>`
 * blocks.
 *
 * Derived from {@link STX_RUNTIME_GLOBALS} rather than hand-maintained (#1804).
 * This was a separate 82-name literal, and it had drifted: 16 of those names
 * were not on `window.stx` at all. Because the generated prologue destructures
 * (`var { … } = window.stx`), a missing name is not an error — it binds
 * `undefined`, and the author sees "undefined is not a function" at the call
 * site with nothing naming the identifier or saying why. `provide` worked and
 * `inject` did not; `onMounted` worked and `onUpdated` did not.
 *
 * Five of the 16 (`isDerived`, `inject`, `useSlots`, `watchMultiple`,
 * `onBeforeMount`) are now implemented in the runtime and live in the shared
 * list. The remaining 11 are server- or compile-time only — `h` and `Fragment`
 * belong to the JSX runtime, `useMeta`/`getCurrentInstance`/`useAttrs`/
 * `onErrorCaptured`/`onBeforeUpdate`/`onUpdated`/`createStore`/`createSelector`
 * are module exports with no client counterpart, and `action` has no
 * implementation anywhere — so they are no longer offered. A `ReferenceError`
 * naming the identifier beats a silent `undefined`.
 */
export const STX_AUTO_IMPORTS: readonly string[] = STX_RUNTIME_GLOBALS


/**
 * Core exports from '@stacksjs/browser' that are auto-imported.
 * App-specific models are detected dynamically (PascalCase identifiers
 * used with query methods like .all(), .find(), .where(), etc.)
 */
export { BROWSER_CORE_IMPORTS } from './browser-core-imports'
import { BROWSER_CORE_IMPORTS } from './browser-core-imports'

export interface BrowserCoreAutoImportResult {
  code: string
  imports: string[]
  models: string[]
}

/**
 * Turn bare core browser helper usage into a real module import before the
 * client bundler runs.
 *
 * Inline signal scripts execute synchronously while the document is parsed.
 * Loading `window.StacksBrowser` from a later module script is therefore too
 * late. A real import lets Bun inline and tree-shake the selected browser
 * helpers together with the component, exactly like an explicit user import.
 */
export function injectBrowserCoreAutoImports(code: string): BrowserCoreAutoImportResult {
  // Detection reads the code with comments and literals blanked out. A helper
  // name is only an import if it is actually called — matching the bare word
  // anywhere pulled packages in off prose, and the copy "Your Mac can sleep"
  // was enough to add an `@stacksjs/browser` import that a compiled binary
  // cannot resolve, taking the whole client bundle down with it.
  const searchable = stripCommentsAndLiterals(code)

  const explicitlyImported = new Set<string>()
  for (const match of code.matchAll(/^\s*import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm)) {
    for (const specifier of match[1].split(',')) {
      const localName = specifier.trim().split(/\s+as\s+/).pop()?.replace(/^type\s+/, '').trim()
      if (localName)
        explicitlyImported.add(localName)
    }
  }

  const locallyDeclared = new Set<string>()
  for (const match of searchable.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))
    locallyDeclared.add(match[1])
  for (const match of searchable.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g)) {
    for (const binding of match[1].split(',')) {
      const localName = binding.trim().split(/[:=]/).pop()?.trim()
      if (localName)
        locallyDeclared.add(localName)
    }
  }

  const imports = BROWSER_CORE_IMPORTS.filter((symbol) => {
    if (explicitlyImported.has(symbol) || locallyDeclared.has(symbol))
      return false
    // Followed by a `(` — a call, not a mention.
    return new RegExp(`\\b${symbol}\\s*\\(`).test(searchable)
  })

  const models = detectModelUsage(searchable).filter(model =>
    !explicitlyImported.has(model) && !locallyDeclared.has(model))

  if (imports.length === 0 && models.length === 0)
    return { code, imports, models }

  const browserImports = [
    imports.length > 0
      ? `import { ${imports.join(', ')} } from '@stacksjs/browser'`
      : '',
    // App models are registered as a side effect of the package bootstrap,
    // then transformAutoImports binds the detected names from StacksBrowser.
    models.length > 0
      ? `import '@stacksjs/browser'`
      : '',
    models.length > 0
      ? `const { ${models.join(', ')} } = window.StacksBrowser || {}`
      : '',
  ].filter(Boolean).join('\n')

  return {
    code: `${browserImports}\n${code}`,
    imports,
    models,
  }
}

/**
 * Detect model usage in code.
 * Models are PascalCase identifiers used with query methods.
 * Returns array of detected model names.
 */
// JS built-ins that are PascalCase and could match model patterns
// e.g., Promise.all(), Object.keys(), Array.from(), Map.get(), Set.delete()
const JS_BUILTINS = new Set([
  'Promise', 'Object', 'Array', 'Map', 'Set', 'Date', 'Error', 'JSON', 'Math',
  'Number', 'String', 'RegExp', 'Symbol', 'WeakMap', 'WeakSet', 'Proxy', 'Reflect',
  'Intl', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response',
  'AbortController', 'EventTarget', 'Element', 'Document', 'Node', 'Window',
  'Console', 'Storage', 'Navigator', 'Blob', 'File', 'FileReader', 'HTMLElement',
  'SVGElement', 'Event', 'CustomEvent', 'DOMParser', 'XMLSerializer', 'WebSocket',
  'Worker', 'SharedWorker', 'IntersectionObserver', 'MutationObserver',
  'ResizeObserver', 'PerformanceObserver', 'Notification', 'Bun', 'Buffer', 'Process',
  'Modal', 'Intl',
])


function detectModelUsage(code: string): string[] {
  const models: Set<string> = new Set()

  // Pattern: PascalCase identifier followed by query method
  // e.g., Trail.all(), User.find(1), Activity.where('type', 'run')
  const modelPattern = /\b([A-Z][a-zA-Z0-9]*)\s*\.\s*(all|find|first|get|where|orderBy|orderByDesc|limit|select|pluck|create|update|delete)\s*\(/g

  let match
  while ((match = modelPattern.exec(code)) !== null) {
    // Skip JS built-ins that happen to have matching method names
    if (!JS_BUILTINS.has(match[1])) {
      models.add(match[1])
    }
  }

  return Array.from(models)
}

// =============================================================================
// Types
// =============================================================================

export interface ClientScriptOptions {
  /** Event bindings collected from template @event attributes */
  eventBindings?: ParsedEvent[]
  /** Whether to enable auto-imports (default: true) */
  autoImports?: boolean
  /** Original script tag attributes (e.g., 'type="module"') */
  attrs?: string
  /** Whether the component template contains : prefix directives */
  hasColonDirectives?: boolean
  /** Template HTML content for auto-binding analysis (Phase 2: auto-detect which scripts need stx.mount()) */
  templateContent?: string
  /** File path of the template (for relative import resolution in bundler) */
  filePath?: string
  /** Project root directory (for @/ path resolution in bundler) */
  projectRoot?: string
  /** Whether this is a production build (enables minification in bundler) */
  production?: boolean
  /**
   * Server → client data bridge. Top-level `<script server>` variables (and
   * other template-context values) made available to `<script client>` code:
   * any JSON-serializable value referenced — but not redeclared — by the client
   * script is serialized into the client bundle, so reactive state can be seeded
   * from build-time data (e.g. `const items = state(serverItems)`) without a
   * round-trip fetch. Functions/non-serializable values are skipped.
   */
  serverData?: Record<string, unknown>
}

// =============================================================================
// Auto-Import Transformation
// =============================================================================

interface AutoImportResult {
  code: string
  stxImports: string[]
  browserImports: string[]
}

function collectLocalBindings(code: string): Set<string> {
  const bindings = new Set<string>()

  for (const match of code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))
    bindings.add(match[1])

  for (const match of code.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g)) {
    for (const binding of match[1].split(',')) {
      const localName = binding.trim().split(/[:=]/).pop()?.trim()
      if (localName && /^[A-Za-z_$][\w$]*$/.test(localName))
        bindings.add(localName)
    }
  }

  return bindings
}

/**
 * Transform auto-imports from 'stx' and '@stacksjs/browser'
 *
 * This detects usage of auto-importable symbols and generates the
 * necessary import statements if they're not already present.
 *
 * Users can write code without imports:
 * ```
 * const count = state(0)  // 'state' is auto-imported from 'stx'
 * const trails = await Trail.all()  // 'Trail' is auto-imported from '@stacksjs/browser'
 * ```
 */
export function transformAutoImports(code: string): AutoImportResult {
  const usedStxImports: Set<string> = new Set()
  const usedBrowserImports: Set<string> = new Set()
  let transformedCode = code

  // Strip all `import type` statements from any source — these are type-only
  // and will be erased during TypeScript transpilation, but we strip them early
  // to prevent interference with auto-import detection and IIFE wrapping
  transformedCode = transformedCode.replace(
    /^\s*import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm,
    '// [type import stripped]',
  )

  // Track existing imports to avoid duplicates
  const existingImports = new Set<string>()

  // Pattern to match import statements from the stx runtime or browser
  // package. Both `stx` and its canonical package name resolve to the same
  // injected browser runtime.
  const importRegex = /^\s*import\s+(?:type\s+)?{\s*([^}]+)\s*}\s+from\s+['"](@stacksjs\/browser|@stacksjs\/stx|stx)['"]\s*;?\s*$/gm

  let match
  while ((match = importRegex.exec(code)) !== null) {
    const imports = match[1]
    const source = match[2]

    // Skip type-only imports
    if (match[0].includes('import type')) {
      continue
    }

    // Parse imported names
    const aliases: string[] = []
    for (const rawSpecifier of imports.split(',')) {
      const specifier = rawSpecifier.trim()
      if (!specifier || specifier.startsWith('type '))
        continue

      const aliasMatch = specifier.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/)
      if (!aliasMatch)
        continue

      const importedName = aliasMatch[1]
      const localName = aliasMatch[2] || importedName
      existingImports.add(importedName)
      existingImports.add(localName)
      if (source === 'stx' || source === '@stacksjs/stx') {
        usedStxImports.add(importedName)
      }
      else {
        usedBrowserImports.add(importedName)
      }

      if (localName !== importedName)
        aliases.push(`${localName} = ${importedName}`)
    }

    // External imports produced by Bun can be renamed to avoid a collision
    // inside the bundle, for example `ref as ref91`. The generated bundle
    // calls the renamed binding, so stripping the whole import loses the
    // alias and crashes hydration. Bind aliases to the canonical runtime
    // symbol after the wrapper destructures it from window.stx.
    const replacement = aliases.length > 0
      ? `var ${aliases.join(', ')}; /* [auto-import processed] */`
      : '// [auto-import processed]'
    transformedCode = transformedCode.replace(match[0], replacement)
  }

  const locallyDeclared = collectLocalBindings(transformedCode)

  // Detect usage of auto-importable symbols that weren't explicitly imported
  for (const symbol of STX_AUTO_IMPORTS) {
    if (existingImports.has(symbol) || locallyDeclared.has(symbol)) continue
    // Check if symbol is used in code (as identifier boundary).
    //
    // The `(?:<[^>]*>)?` segment lets a TypeScript-typed call count as a call.
    // This ran before transpilation, so `useQuery<Foo>('/api/x')` still carried
    // its type argument here and `name\s*\(` did not match — the name was left
    // out of the `window.stx` destructure while the body still called it, and
    // the page threw ReferenceError with no build error (stacksjs/stx#1880).
    //
    // Only bit a script that touches none of SIGNAL_API_RE's names, since one
    // of those triggers a blanket destructure that happens to rescue the rest.
    // runtime-globals.ts:162 and signal-processing.ts:1165 already spell it
    // this way; this was the third copy and the one that drifted.
    const symbolRegex = new RegExp(`\\b${symbol}\\s*(?:<[^>]*>)?\\s*\\(`, 'g')
    if (symbolRegex.test(transformedCode)) {
      usedStxImports.add(symbol)
    }
  }

  // Check core browser utilities.
  //
  // Read with comments and string literals blanked out, for the same reason
  // injectBrowserCoreAutoImports does it one screen down: a bare word match
  // over raw source counts prose. A component whose comment mentioned
  // useTimeoutFn, or whose copy said "Your Mac can sleep", got that name added
  // to the destructure — and since nothing actually called it, neither the
  // real-import conversion nor the bootstrap ever supplied it. The page then
  // shipped `var { useTimeoutFn } = window.StacksBrowser || {}` for a symbol it
  // never used, and reported it on every navigation through the auto-import
  // guard as a name the client runtime does not provide. True, and unfixable
  // from the other end: no export could satisfy a reference nothing needed.
  //
  // Still a bare word rather than a call, unlike the injector: these are not
  // all functions. BrowserQueryError is a class, reached through `instanceof`
  // and `new`, and requiring `(` would drop the legitimate uses along with the
  // prose.
  const searchableForBrowser = stripCommentsAndLiterals(transformedCode)
  for (const symbol of BROWSER_CORE_IMPORTS) {
    if (existingImports.has(symbol) || locallyDeclared.has(symbol)) continue
    const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'g')
    if (symbolRegex.test(searchableForBrowser)) {
      usedBrowserImports.add(symbol)
    }
  }

  // Dynamically detect app-specific models (PascalCase with query methods)
  const detectedModels = detectModelUsage(transformedCode)
  for (const model of detectedModels) {
    if (!existingImports.has(model) && !locallyDeclared.has(model)) {
      usedBrowserImports.add(model)
    }
  }

  return {
    code: transformedCode,
    stxImports: Array.from(usedStxImports),
    browserImports: Array.from(usedBrowserImports),
  }
}

/**
 * Generate destructuring statements for auto-imported symbols
 * These access globals set up by the STX runtime and @stacksjs/browser
 */
export function generateAutoImportDestructuring(stxImports: string[], browserImports: string[]): string {
  const lines: string[] = []

  // STX symbols come from window.stx (set up by signals runtime)
  // They're also exposed directly on window (state, derived, effect, etc.)
  if (stxImports.length > 0) {
    lines.push(`  var { ${stxImports.join(', ')} } = window.stx || window;`)
  }

  // Browser symbols come from window.StacksBrowser (set up by @stacksjs/browser auto-init)
  if (browserImports.length > 0) {
    lines.push(`  var { ${browserImports.join(', ')} } = window.StacksBrowser || {};`)
  }

  if (lines.length > 0) {
    return `  // STX: auto-imported from stx and @stacksjs/browser\n${lines.join('\n')}\n${generateAutoImportGuard(stxImports, browserImports)}`
  }

  return ''
}

/**
 * Generate the browser-runtime bindings needed by a signal setup wrapper.
 *
 * Signal pages and Vue-like signal components use specialized scoped wrappers
 * instead of {@link processClientScript}. They already pull every STX runtime
 * global from `window.stx`, but still need the selected Stacks browser helpers
 * used by their script. Keeping detection here makes classic scripts, signal
 * pages, and signal components share the same browser auto-import contract.
 */
export function generateBrowserAutoImportDestructuring(
  code: string,
  exclude: readonly string[] = [],
): string {
  const { browserImports } = transformAutoImports(code)
  const excluded = new Set(exclude)
  return generateAutoImportDestructuring(
    [],
    browserImports.filter(name => !excluded.has(name)),
  )
}

/**
 * Report auto-imported symbols the client runtime never actually provided.
 *
 * Destructuring a name that is absent from `window.stx` or
 * `window.StacksBrowser` yields `undefined` in silence. The script then ships,
 * and the first call fails deep inside an event handler as
 * `x is not a function` - or, when the name is referenced bare, as
 * `x is not defined`. Neither says which import was wrong, so the message that
 * reaches the person using the page is a puzzle, and the one that reaches the
 * developer is barely better.
 *
 * The names are known at build time and their availability is knowable the
 * moment the script runs, so say it there: name the symbol, name where it was
 * expected to come from, and say what to do about it. Checking a handful of
 * bindings once per script is not a cost worth optimising away.
 */
function generateAutoImportGuard(stxImports: string[], browserImports: string[]): string {
  const entries = [
    ...stxImports.map(name => `['${name}', typeof ${name}, 'stx']`),
    ...browserImports.map(name => `['${name}', typeof ${name}, '@stacksjs/browser']`),
  ]

  if (entries.length === 0)
    return ''

  return `  // STX: report auto-imports the client runtime did not provide\n`
    + `  [${entries.join(', ')}].forEach(function (e) {\n`
    + `    if (e[1] !== 'undefined') return;\n`
    + `    console.error(\n`
    + `      '[stx] "' + e[0] + '" is used in this client script and auto-imported from ' + e[2] + ', '\n`
    + `      + 'but the client runtime does not provide it. Either it is not exported to the browser, '\n`
    + `      + 'or it should be imported from a relative path so the bundler includes it.'\n`
    + `    );\n`
    + `  });\n`
}

/**
 * Build the server → client bridge payload from a template context: the
 * top-level, JSON-serializable values (excluding internal `__`/`$` keys and
 * functions) that a `<script client>` may seed reactive state from. Pass the
 * result as {@link ClientScriptOptions.serverData}.
 */
export function extractBridgeData(context: Record<string, unknown>): Record<string, unknown> {
  // An explicit `defineClientPayload({ … })` in a server block wins outright.
  // The declared set is published in full and nothing else crosses, so a name
  // is either declared or absent — never "present because the client source
  // happened to mention it" (#1868). That determinism is the point: it is what
  // lets a client block drop its `typeof x === 'number' ? x : 0` guard.
  const declared = context.__stxClientPayload
  if (declared && typeof declared === 'object') {
    const picked: Record<string, unknown> = {}
    for (const key in declared as Record<string, unknown>) {
      const value = (declared as Record<string, unknown>)[key]
      if (typeof value === 'function')
        continue
      picked[key] = value
    }
    // Reserved marker so the emitter knows not to also require a textual
    // reference. It is `__`-prefixed, so the emitter's existing opt-out skips
    // it and it never reaches the page.
    picked.__stxDeclaredPayload = true
    return picked
  }

  const out: Record<string, unknown> = {}
  for (const key in context) {
    if (key.startsWith('__') || key.startsWith('$'))
      continue
    const value = context[key]
    if (typeof value === 'function')
      continue
    out[key] = value
  }
  return out
}

/**
 * Return the local bindings introduced by a destructuring declaration.
 *
 * The bridge only needs this to avoid emitting a same-named `var`, so being
 * conservative for nested patterns is preferable to generating invalid
 * JavaScript. Object aliases use their local name (`source: local`), while
 * defaults are removed from either form.
 */
function extractDestructuredBindings(pattern: string, objectPattern: boolean): Set<string> {
  const bindings = new Set<string>()
  for (const rawPart of pattern.split(',')) {
    let part = rawPart.trim().replace(/^\.\.\./, '').trim()
    if (!part)
      continue

    if (objectPattern) {
      const colon = part.lastIndexOf(':')
      if (colon !== -1)
        part = part.slice(colon + 1).trim()
    }

    part = part.split('=')[0].trim()
    if (/^[A-Za-z_$][\w$]*$/.test(part))
      bindings.add(part)
  }
  return bindings
}

/**
 * Detect whether client code already owns an identifier.
 *
 * Direct declarations were always handled, but Vue-style prop declarations
 * are normally destructured. Without this check the bridge emitted
 * `var title = ...` immediately before
 * `const { title } = defineProps()`, which is a parse-time error.
 */
function declaresClientIdentifier(code: string, name: string): boolean {
  if (new RegExp(`(?:const|let|var|function|class)\\s+${name}\\b`).test(code))
    return true

  for (const match of code.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) {
    if (extractDestructuredBindings(match[1], true).has(name))
      return true
  }
  for (const match of code.matchAll(/(?:const|let|var)\s*\[([^\]]*)\]/g)) {
    if (extractDestructuredBindings(match[1], false).has(name))
      return true
  }
  return false
}

/**
 * Does the client script use `name` as a free identifier?
 *
 * Anything reached through a `.` is somebody else's property, not this binding:
 * `session.token()` names a method on a store, and treating it as a reference
 * published the server's unrelated `token` into the page. `#` covers private
 * fields for the same reason.
 *
 * An object-literal KEY (`{ token: 1 }`) still counts, since it is
 * indistinguishable here from the shorthand `{ token }` — that errs toward
 * publishing, which is the pre-existing behaviour rather than a new leak.
 *
 * `name` is validated as an identifier by the caller, so it carries no regex
 * metacharacters.
 */
function referencesIdentifier(searchable: string, name: string): boolean {
  return new RegExp(`(?<![.#\\w$])${name}(?![\\w$])`).test(searchable)
}

/**
 * Names that read like a credential. Bridging one is usually a mistake — the
 * value lands in the response body, where HAR exports, disk cache, "save page
 * as", session-replay tools and a screenshot of view-source all capture it,
 * none of which is true of the cookie it was probably read from.
 */
const CREDENTIAL_NAME = /token|secret|passw|apikey|api_key|privatekey|private_key|credential|webhook|bearer|jwt|signature/i

/** Warn once per name, so a dev server does not repeat it on every render. */
const warnedBridgeKeys = new Set<string>()

function warnAboutBridgedValue(name: string, json: string): void {
  const credential = CREDENTIAL_NAME.test(name)
  const oversized = json.length > 32_768
  if (!credential && !oversized)
    return
  if (warnedBridgeKeys.has(name))
    return
  warnedBridgeKeys.add(name)

  if (credential) {
    console.warn(
      `[stx] server→client bridge is publishing "${name}" into the page body. `
      + `If it holds a credential, rename it with a "__" prefix (never bridged) `
      + `and pass only what the template needs. See stacksjs/stx#1831.`,
    )
  }
  if (oversized) {
    console.warn(
      `[stx] server→client bridge is publishing ${(json.length / 1024).toFixed(1)}KB `
      + `under "${name}". Every byte ships in the HTML on each request; prefix the `
      + `binding with "__" and project just the fields the client reads.`,
    )
  }
}

/**
 * Generate the server → client data bridge: `var <name> = <json>;` for each
 * template-context value referenced — but NOT redeclared — by the client script.
 * Lets `<script client>` seed reactive state from `<script server>` data without
 * a fetch. Only JSON-serializable values cross the boundary; declared names are
 * skipped so client-owned variables are never clobbered.
 */
export function generateServerDataBridge(code: string, serverData?: Record<string, unknown>): string {
  if (!serverData)
    return ''
  // Reference detection reads the code with comments and string literals
  // blanked. Matching raw text meant a name only had to APPEAR somewhere to be
  // published — a word in a comment, a segment of a URL — and the value went
  // into the response body whether or not any client code could use it
  // (stacksjs/stx#1831).
  const searchable = stripCommentsAndLiterals(code)
  const declaredPayload = serverData.__stxDeclaredPayload === true
  const lines: string[] = []
  for (const [name, value] of Object.entries(serverData)) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name))
      continue
    // The documented opt-out, re-checked here. extractBridgeData already drops
    // these, but this is the function that decides what reaches the page, and
    // an author told to prefix a credential with `__` should get that guarantee
    // from whichever path assembles the bridge (#1831).
    if (name.startsWith('__') || name.startsWith('$'))
      continue
    // Only bridge identifiers the client actually references as a NAME.
    // A word boundary alone also matched a property, so reading an unrelated
    // `session.token()` published the server's `token` binding beside it.
    //
    // Skipped when the page DECLARED its payload: the declaration is the
    // contract, so a declared name is published whether or not the client
    // mentions it. Requiring both would reintroduce exactly the uncertainty
    // the declaration exists to remove (#1868).
    if (!declaredPayload && !referencesIdentifier(searchable, name))
      continue
    // …and does not itself declare (never clobber a client-owned name).
    if (declaresClientIdentifier(code, name))
      continue
    let json: string | undefined
    try {
      json = JSON.stringify(value)
    }
    catch {
      continue
    }
    if (json === undefined)
      continue
    warnAboutBridgedValue(name, json)
    // Escape `<` so a value containing markup (e.g. `</script>`) can't break out
    // of the surrounding tag, AND so the generated text never contains a literal
    // `<script…>` that a downstream tag scanner would treat as a real boundary.
    lines.push(`  var ${name} = ${json.replace(/</g, '\\u003c')};`)
  }
  if (lines.length === 0)
    return ''
  // NB: keep this comment free of any `<script…>`-like text — the merged setup
  // block is re-scanned for script tags downstream, and a literal tag here would
  // be mistaken for a real boundary, swallowing the rest of the document.
  return `  // stx: server -> client data bridge (seeded from server scope)\n${lines.join('\n')}\n`
}

// =============================================================================
// Mouse button map (mirrors events.ts)
// =============================================================================

const MOUSE_BUTTONS: Record<string, number> = {
  left: 0,
  middle: 1,
  right: 2,
}

// =============================================================================
// Event Binding Code Generation
// =============================================================================

/**
 * Generate modifier checks for an event handler.
 * Produces guard statements like `if (!$event.ctrlKey) return`.
 */
function generateModifierChecks(modifiers: EventModifiers): string {
  const checks: string[] = []

  if (modifiers.self) {
    checks.push('if ($event.target !== $el) return')
  }

  for (const key of modifiers.systemKeys) {
    checks.push(`if (!$event.${key}Key) return`)
  }

  if (modifiers.keys.length > 0) {
    const keyChecks = modifiers.keys.map(k => `$event.key === '${k}'`).join(' || ')
    checks.push(`if (!(${keyChecks})) return`)
  }

  if (modifiers.mouse !== null) {
    const button = MOUSE_BUTTONS[modifiers.mouse]
    checks.push(`if ($event.button !== ${button}) return`)
  }

  if (modifiers.prevent) {
    checks.push('$event.preventDefault()')
  }
  if (modifiers.stop) {
    checks.push('$event.stopPropagation()')
  }

  return checks.join('; ')
}

/**
 * Generate inline event binding code for a single event.
 * This code lives inside the component's script scope,
 * so it can directly call functions defined in the script.
 */
// eslint-disable-next-line pickier/no-unused-vars
function generateSingleEventBinding(binding: ParsedEvent, index: number): string {
  const { elementId, event, modifiers } = binding
  // `@click="doThing"` names a function and must be invoked, matching what the
  // declarative runtime does (#1695). This path evaluated it as a bare
  // identifier, so the reference form silently did nothing here while working
  // on any page the runtime happened to bind (#1824).
  const handler = asInvocableStatement(binding.handler)
  const checks = generateModifierChecks(modifiers)

  const options: string[] = []
  if (modifiers.once) options.push('once: true')
  if (modifiers.capture) options.push('capture: true')
  if (modifiers.passive) options.push('passive: true')
  const optionsStr = options.length > 0 ? `, { ${options.join(', ')} }` : ''

  // Build the handler body
  let handlerBody = ''
  if (checks) {
    handlerBody += `${checks}; `
  }

  // Escape handler for use in string context (scope.__stx_execute calls)
  const escapedHandler = handler.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const emitHelper = `var $emit = function(name, detail) {
        $el.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true, cancelable: true }))
      };`

  // Helper: wrap handler to check for reactive scope (x-data) before bare execution
  function scopeAwareHandler(h: string): string {
    if (/\$emit\s*\(/.test(h)) {
      return `${emitHelper}
      ${h}`
    }

    return `var scope = $el.closest('[data-stx-scope]');
      if (scope && scope.__stx_execute) {
        scope.__stx_execute('${escapedHandler}', $event, $el);
      }
else {
        ${h}
      }`
  }

  // Wrap handler in debounce/throttle if specified
  if (modifiers.debounce !== null) {
    return `  ;(function() {
    // eslint-disable-next-line pickier/no-unused-vars
    var $el = document.getElementById('${elementId}')
    if (!$el) return
    var __timer
    $el.addEventListener('${event}', function($event) {
      ${checks ? checks + '; ' : ''}clearTimeout(__timer)
      __timer = setTimeout(function() { ${scopeAwareHandler(handler)} }, ${modifiers.debounce})
    }${optionsStr})
  })()`
  }

  if (modifiers.throttle !== null) {
    return `  ;(function() {
    // eslint-disable-next-line pickier/no-unused-vars
    var $el = document.getElementById('${elementId}')
    if (!$el) return
    var __last = 0
    $el.addEventListener('${event}', function($event) {
      ${checks ? checks + '; ' : ''}var __now = Date.now()
      if (__now - __last >= ${modifiers.throttle}) {
        __last = __now
        ${scopeAwareHandler(handler)}
      }
    }${optionsStr})
  })()`
  }

  // Standard event binding — check for reactive scope (x-data) first
  if (/\$emit\s*\(/.test(handler)) {
    return `  var $el = document.getElementById('${elementId}')
  if ($el) $el.addEventListener('${event}', function($event) {
    ${handlerBody}${emitHelper}
    ${handler}
  }${optionsStr})`
  }

  return `  var $el = document.getElementById('${elementId}')
  if ($el) $el.addEventListener('${event}', function($event) {
    ${handlerBody}var scope = $el.closest('[data-stx-scope]');
    if (scope && scope.__stx_execute) {
      scope.__stx_execute('${escapedHandler}', $event, $el);
    }
else {
      ${handler}
    }
  }${optionsStr})`
}

/**
 * Generate all inline event bindings for injection into the client script scope.
 */
function generateInlineEventBindings(bindings: ParsedEvent[]): string {
  if (bindings.length === 0) return ''

  const code = bindings.map((b, i) => generateSingleEventBinding(b, i)).join('\n')

  return `\n  // STX: auto-generated event bindings\n${code}`
}

// =============================================================================
// Top-Level Declaration Extraction (for stx.mount() return statement)
// =============================================================================

/**
 * Extract top-level variable/function declarations from script code.
 * Used to auto-generate the return statement for stx.mount() wrappers.
 */
function extractTopLevelDeclarations(code: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  // Remove import lines (handled separately by transform)
  const cleaned = code.replace(/^\s*import\s+.*$/gm, '')

  // Track brace/paren depth to only capture top-level declarations
  let depth = 0
  const len = cleaned.length
  let i = 0

  while (i < len) {
    const ch = cleaned[i]

    // Skip string literals
    if (ch === '\'' || ch === '"' || ch === '`') {
      const quote = ch
      i++
      if (quote === '`') {
        // Template literal with nested expressions
        let tplDepth = 0
        while (i < len) {
          if (cleaned[i] === '\\') { i += 2; continue }
          if (cleaned[i] === '`' && tplDepth === 0) { i++; break }
          if (cleaned[i] === '$' && cleaned[i + 1] === '{') { tplDepth++; i += 2; continue }
          if (cleaned[i] === '}' && tplDepth > 0) { tplDepth--; i++; continue }
          i++
        }
      }
      else {
        while (i < len) {
          if (cleaned[i] === '\\') { i += 2; continue }
          if (cleaned[i] === quote) { i++; break }
          i++
        }
      }
      continue
    }

    // Skip comments
    if (ch === '/' && cleaned[i + 1] === '/') {
      while (i < len && cleaned[i] !== '\n') i++
      continue
    }
    if (ch === '/' && cleaned[i + 1] === '*') {
      i += 2
      while (i < len - 1 && !(cleaned[i] === '*' && cleaned[i + 1] === '/')) i++
      i += 2
      continue
    }

    // Track brace depth
    if (ch === '{') { depth++; i++; continue }
    if (ch === '}') { depth--; i++; continue }

    // Only extract declarations at depth 0
    if (depth === 0) {
      const rest = cleaned.slice(i)

      // Simple declarations: const x = ..., let x = ..., var x = ...
      const simpleMatch = rest.match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*(?::[^=]*)?=/)
      if (simpleMatch) {
        const name = simpleMatch[1]
        if (!name.startsWith('_') && !seen.has(name)) { names.push(name); seen.add(name) }
        i += simpleMatch[0].length
        continue
      }

      // Destructured: const { a, b: alias } = ...
      const destructMatch = rest.match(/^(?:const|let|var)\s+\{([^}]+)\}\s*=/)
      if (destructMatch) {
        destructMatch[1].split(',').forEach(s => {
          const trimmed = s.trim()
          // Handle rename: "data: stats" -> use "stats", "loading" -> use "loading"
          const colonIdx = trimmed.indexOf(':')
          const name = colonIdx >= 0 ? trimmed.slice(colonIdx + 1).trim().split(/[\s=]/)[0] : trimmed.split(/[\s=]/)[0]
          if (name && !name.startsWith('_') && !seen.has(name)) { names.push(name); seen.add(name) }
        })
        i += destructMatch[0].length
        continue
      }

      // Function declarations: function x() { ... }
      const fnMatch = rest.match(/^(?:async\s+)?function\s+([a-zA-Z_$]\w*)/)
      if (fnMatch) {
        const name = fnMatch[1]
        if (!name.startsWith('_') && !seen.has(name)) { names.push(name); seen.add(name) }
        i += fnMatch[0].length
        continue
      }
    }

    i++
  }

  return names
}

// =============================================================================
// Template Reference Analyzer (Phase 2: Auto-Binding)
// =============================================================================

/**
 * JS keywords and built-ins to exclude from template reference extraction.
 * These appear in expressions but are not user-defined identifiers.
 */
const JS_KEYWORDS = new Set([
  'if', 'else', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  'in', 'of', 'new', 'this', 'return', 'void', 'delete', 'throw', 'switch',
  'case', 'break', 'continue', 'for', 'while', 'do', 'try', 'catch', 'finally',
  'const', 'let', 'var', 'function', 'class', 'import', 'export', 'default',
  'async', 'await', 'yield', 'with', 'debugger',
  // Common globals that aren't user declarations
  'console', 'window', 'document', 'Math', 'JSON', 'Date', 'Array', 'Object',
  'String', 'Number', 'Boolean', 'Symbol', 'Map', 'Set', 'Promise', 'Error',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'fetch', 'alert', 'confirm', 'prompt', 'event',
])

/**
 * Extract all identifiers referenced in template binding expressions.
 *
 * Scans for:
 * - {{ expression }} mustache expressions
 * - :attribute="expression" bindings (:class, :style, :if, :show, etc.)
 * - @event="handler" event handlers (@click, @input, etc.)
 * - @model="value" two-way bindings
 * - @for="item in items" loop directives (extracts the iterable)
 *
 * Returns a Set of identifier names (excluding JS keywords/built-ins).
 */
function extractTemplateReferences(templateHtml: string): Set<string> {
  const refs = new Set<string>()
  const identifierRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g

  function addIdentifiers(expr: string) {
    let match
    while ((match = identifierRegex.exec(expr)) !== null) {
      const name = match[0]
      if (!JS_KEYWORDS.has(name)) {
        refs.add(name)
      }
    }
  }

  // {{ expression }}
  const mustacheRegex = /\{\{([\s\S]*?)\}\}/g
  let m
  while ((m = mustacheRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // :attribute="expression" (covers :class, :style, :if, :show, :bind, etc.)
  const colonBindRegex = /:[a-z][\w.-]*\s*=\s*"([^"]*)"/gi
  while ((m = colonBindRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }
  const colonBindSingleRegex = /:[a-z][\w.-]*\s*=\s*'([^']*)'/gi
  while ((m = colonBindSingleRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // @event="handler" (covers @click, @input, @submit.prevent, etc.)
  const eventRegex = /@[a-z]+(?:\.[a-z]+)*\s*=\s*"([^"]*)"/gi
  while ((m = eventRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }
  const eventSingleRegex = /@[a-z]+(?:\.[a-z]+)*\s*=\s*'([^']*)'/gi
  while ((m = eventSingleRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // @model="value"
  const modelRegex = /@model\s*=\s*["']([^"']*)["']/gi
  while ((m = modelRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // @for="item in items" — extract the iterable (right side of 'in')
  const forRegex = /@for\s*=\s*["'][^"']*\bin\s+([^"']+)["']/gi
  while ((m = forRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  return refs
}

// =============================================================================
// Main Processing Function
// =============================================================================

/**
 * Transform a <script client> block's content into a fully processed <script> tag.
 *
 * - Auto-imports from 'stx' and '@stacksjs/browser' (no explicit imports needed)
 * - Resolves `import { x } from '@stores'` to runtime store access
 * - Appends event binding code inside the script scope
 * - Wraps everything in a scoped IIFE
 *
 * @param scriptContent - The raw content inside <script client>...</script>
 * @param options - Event bindings and other processing options
 * @returns A complete `<script>...</script>` tag ready for browser injection
 */
export async function processClientScript(
  scriptContent: string,
  options: ClientScriptOptions = {},
): Promise<string> {
  let code = scriptContent
  let autoImportCode = ''
  let wasBundled = false
  let bundledBrowserImports: string[] = []

  // 0a. Extract side-effect CSS imports BEFORE the bundler sees them.
  // Bun.build has no `.css` loader configured here and would either crash
  // or pass the import through unresolved into the browser payload. We
  // resolve, read, and surface them as `<style>` tags wrapped in
  // `@layer vendor { … }` — emitted alongside the transformed `<script>`.
  const cssExtraction = extractAndStripCssImports(code, {
    filePath: options.filePath,
    projectRoot: options.projectRoot,
  })
  code = cssExtraction.code
  const vendorStyleTags = renderVendorStyleTags(cssExtraction.styles)

  // Browser helpers are bundle inputs so inline scripts can use them
  // synchronously without waiting for a global module bootstrap.
  const browserCoreImports = injectBrowserCoreAutoImports(code)
  code = browserCoreImports.code
  bundledBrowserImports = [...browserCoreImports.imports, ...browserCoreImports.models]

  // 0b. Bundle user imports via Bun.build (if any detected)
  const { hasUserImports, bundleClientScript } = await importOnce('stx/client-script-bundler', () => import('./client-script-bundler'))
  if (hasUserImports(code)) {
    code = await bundleClientScript(code, options.filePath || '', {
      projectRoot: options.projectRoot,
      minify: options.production,
    })
    wasBundled = true
  }

  // 1. Transform auto-imports from 'stx' and '@stacksjs/browser'
  if (options.autoImports !== false) {
    const autoImportResult = transformAutoImports(code)
    code = autoImportResult.code
    autoImportCode = generateAutoImportDestructuring(
      autoImportResult.stxImports,
      autoImportResult.browserImports.filter(name => !bundledBrowserImports.includes(name)),
    )
  }

  // 1b. Server → client data bridge: seed client scope with referenced
  // <script server> values so reactive state can initialize from build-time
  // data. Runs after auto-imports so it can be detected against the user code.
  autoImportCode = `${generateServerDataBridge(code, options.serverData)}${autoImportCode}`

  // 2. Transform store imports
  code = transformStoreImports(code)

  // 3. Transpile TypeScript to JavaScript (strips type annotations, interfaces, etc.)
  // Skip if Bun.build already handled TS, or if attrs indicate plain JS
  if (!wasBundled && shouldTranspileTypeScript(options.attrs || '')) {
    code = transpileTypeScript(code)
  }

  // 4. Generate event binding code
  const eventCode = generateInlineEventBindings(options.eventBindings || [])

  // 5. Build the output script tag
  const attrs = (options.attrs || '').trim()
  const isModule = /\btype\s*=\s*["']module["']/i.test(attrs)

  if (isModule) {
    // Module scripts: preserve type="module", no IIFE wrapping
    const extraAttrs = attrs.replace(/\btype\s*=\s*["']module["']/i, '').trim()
    const attrStr = `type="module" data-stx-scoped${extraAttrs ? ` ${extraAttrs}` : ''}`
    return `${vendorStyleTags}<script ${attrStr}>
${escapeScriptBody(`${autoImportCode}${code}\n${eventCode}`)}
</script>`
  }

  // 6. Determine wrapping strategy:
  //    - Explicit stx.mount()/stx.mountEl() → don't double-wrap (IIFE)
  //    - SFC __stx_setup_ wrapped → don't double-wrap (IIFE)
  //    - Uses signal APIs → auto-mount (existing behavior)
  //    - Has template-referenced declarations → auto-mount (Phase 2: auto-binding)
  //    - Otherwise → legacy IIFE
  // Derived from the runtime globals, not a hand-maintained alternation
  // (#1819). The literal listed 36 names against 71 globals, so a client block
  // built out of useStore/useQuery/useMutation/useCookie and friends was
  // classified as "not using signals", skipped the stx.mount() wrapper, and
  // fell through to the legacy IIFE path with no reactivity.
  const usesSignals = usesReactiveRuntime(scriptContent)
  const isSfcWrapped = /function __stx_setup_/.test(code)
  const alreadyMounts = /\bstx\.mount\s*\(|\bstx\.mountEl\s*\(/.test(scriptContent)

  // Helper: generate stx.mount() wrapper with auto-extracted return statement
  function wrapInMount(declarations: string[]): string {
    const returnStmt = declarations.length > 0
      ? `\n  return { ${declarations.join(', ')} };`
      : ''

    return `${vendorStyleTags}<script data-stx-scoped data-stx-run="always">
window.stx.mount(function() {
  'use strict';
${escapeScriptBody(`${autoImportCode}${code}\n${eventCode}${returnStmt}`)}
})</script>`
  }

  // Don't double-wrap scripts that already call mount or are SFC-wrapped
  if (!alreadyMounts && !isSfcWrapped) {
    // Scripts using signal APIs → always auto-mount
    if (usesSignals) {
      return wrapInMount(extractTopLevelDeclarations(scriptContent))
    }

    // Phase 2 auto-binding: non-signal scripts with template-referenced declarations
    if (options.templateContent) {
      const declarations = extractTopLevelDeclarations(scriptContent)
      if (declarations.length > 0) {
        const templateRefs = extractTemplateReferences(options.templateContent)
        const hasMatchingBindings = declarations.some(name => templateRefs.has(name))
        if (hasMatchingBindings) {
          return wrapInMount(declarations)
        }
      }
    }
  }

  // Fallback: legacy IIFE (no template bindings, or explicit mount, or SFC-wrapped)
  return `${vendorStyleTags}<script data-stx-scoped data-stx-run="always">
;(function() {
  'use strict';
${escapeScriptBody(`${autoImportCode}${code}\n${eventCode}`)}
})()</script>`
}
