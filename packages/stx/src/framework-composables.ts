/**
 * Ship the framework's own browser-only composables to the client
 * (stacksjs/stx#1805).
 *
 * `src/composables/` exports 149 functions; 120 of them have no counterpart in
 * the client runtime. They are exported from the package, they type-check, they
 * autocomplete — and they are unreachable from the only environment where their
 * underlying API exists. `useClipboard`, `useGeolocation`, `useFullscreen`,
 * `useBattery` and the observer family all wrap browser APIs and all threw
 * `ReferenceError` when called from a `<script client>` block.
 *
 * There are two ways to close that gap. Hand-porting each one into the runtime's
 * template literal duplicates 120 implementations that already exist and would
 * drift the same way the auto-import list did (#1804). Instead this bundles the
 * real modules — one source of truth — and merges them onto `window.stx`.
 *
 * DEMAND-DRIVEN: only composables the page actually references are emitted, so
 * a page calling `useClipboard` ships a couple of KB rather than the whole tree.
 *
 * SKIP, NEVER CLOBBER: a name the runtime already provides wins. The runtime
 * versions are the signal-based ones that #1710/#1726/#1797 unified; replacing
 * them with the module versions would be a regression, not a fix.
 *
 * KNOWN LIMITATION, and it is why this is a bridge rather than the end state:
 * these are pre-unification shapes — a getter plus `subscribe()` plus a manual
 * `stop()`, not signals. So `useClipboard().copy(text)` works, `subscribe()`
 * works, and imperative use is correct; but reading `.copied` in a template does
 * not re-render on its own. Converting them to the Signal contract is the real
 * fix and is tracked separately.
 *
 * @module framework-composables
 */

import path from 'node:path'
import { getPublicEnvDefine } from './public-env'
import { SERVER_ONLY_COMPOSABLES } from './unresolved-identifiers'

/** Cache keyed by the set of names actually requested. */
const _cache = new Map<string, string>()

/** Names the runtime already provides — never shadowed by this bundle. */
const RUNTIME_OWNED = new Set<string>()

const SERVER_ONLY = new Set(SERVER_ONLY_COMPOSABLES)

/** Clear the cache. Dev HMR calls this when composables change on disk. */
export function clearFrameworkComposableCache(): void {
  _cache.clear()
}

/**
 * Choose which files in the composables directory carry runtime code.
 *
 * This ran against a `*.ts` glob, which is only ever right when stx runs from
 * `src/`. A released package runs from `dist/`, where the directory holds 37
 * `.js` files and 37 `.d.ts` files and not one plain `.ts` — so every file the
 * bundler opened was type-only, nothing was ever emitted, and every requested
 * name was reported as unbundlable. The one configuration where the old glob
 * worked is the one the repo's own tests run in, which is why it never showed
 * up here (stacksjs/stx#1832).
 *
 * Two compounding details, both fixed by going through this function:
 *
 *  - `.d.ts` can never contribute runtime code, so it is excluded outright
 *    rather than left to be caught downstream.
 *  - The barrel exclusion compared `endsWith('index.ts')`, and `'index.d.ts'`
 *    does not end with that. The one file the filter existed to skip was the
 *    only one it let through — and being a barrel of `export … from …`, it was
 *    also the one shape the export-stripping below cannot parse.
 *
 * Exported so the selection can be tested against a dist-shaped listing without
 * a built package.
 */
export function selectComposableFiles(files: string[]): string[] {
  const byBase = new Map<string, string>()

  for (const file of files) {
    const base = path.basename(file)
    if (base.endsWith('.d.ts'))
      continue

    const stem = base.replace(/\.[jt]s$/, '')
    if (stem === 'index')
      continue
    if (stem === base)
      continue

    // Source wins when a directory somehow holds both spellings of a module.
    const existing = byBase.get(stem)
    if (existing && !existing.endsWith('.js'))
      continue
    byBase.set(stem, file)
  }

  return [...byBase.values()].sort()
}

/**
 * Does the page declare this name itself?
 *
 * A local definition shadows the auto-import, so warning that it "will throw
 * ReferenceError" is a confident claim about working code — which costs more
 * trust than it saves (cf. #1815).
 */
function declaresLocally(source: string, name: string): boolean {
  const escaped = name.replace(/[$()*+.?[\\\]^{|}-]/g, '\\$&')
  return new RegExp(`(?:^|[^\\w$.])(?:const|let|var|function|class)\\s+${escaped}\\b`).test(source)
}

/**
 * Which framework composables does this source actually call?
 *
 * Restricted to the server-only set, so a page calling `useLocalStorage` (which
 * the runtime provides) never drags in a module copy.
 */
export function referencedFrameworkComposables(source: string): string[] {
  if (!source)
    return []

  // Strip stx-owned script blocks first. The scan otherwise runs over the
  // injected runtime, whose own ~150KB of source mentions plenty of these names
  // followed by a paren — so every page looked like it needed the bundle.
  const authored = source
    .replace(/<script\b[^>]*\bdata-stx-runtime\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\bdata-stx-framework-composables\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\bdata-stx-stores\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\bdata-stx-composables\b[^>]*>[\s\S]*?<\/script>/gi, '')

  const found: string[] = []
  for (const name of SERVER_ONLY) {
    if (RUNTIME_OWNED.has(name))
      continue
    // Called, not merely mentioned — a bare word could be a property or prose.
    const escaped = name.replace(/[$()*+.?[\\\]^{|}-]/g, '\\$&')
    if (new RegExp(`(^|[^\\w$.])${escaped}\\s*\\(`).test(authored))
      found.push(name)
  }
  return found.sort()
}

/**
 * Build a script exposing `names` on `window.stx` and as bare globals.
 *
 * Returns null when nothing is needed.
 */
export async function getFrameworkComposableScript(source: string, composablesDir?: string): Promise<string | null> {
  const names = referencedFrameworkComposables(source)
  if (names.length === 0)
    return null

  const dir = composablesDir ?? path.join(import.meta.dir, 'composables')

  // The directory belongs in the key. The same names resolve to different code
  // in a different directory, and once the directory became a parameter a
  // bundle built from one would have been served for another.
  const key = `${dir}\0${names.join(',')}`
  const cached = _cache.get(key)
  if (cached !== undefined)
    return cached || null

  const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })

  // Find the files that declare the requested names, and take each file whole:
  // a composable routinely leans on helpers its own module defines, so emitting
  // only the exported declaration would ship a body with missing references.
  const wanted = new Set(names)
  const chunks: string[] = []
  const emitted = new Set<string>()

  let files: string[] = []
  try {
    // Both layouts: `.ts` when running from src, `.js` from a built package.
    const glob = new Bun.Glob('*.{ts,js}')
    for await (const file of glob.scan({ cwd: dir, absolute: true }))
      files.push(file)
  }
  catch {
    _cache.set(key, '')
    return null
  }
  files = selectComposableFiles(files)

  for (const file of files) {
    let code: string
    try {
      code = await Bun.file(file).text()
    }
    catch {
      continue
    }

    let exports: string[] = []
    try {
      exports = transpiler.scan(code).exports.filter(n => n !== 'default')
    }
    catch {
      continue
    }
    if (!exports.some(n => wanted.has(n)))
      continue

    try {
      // Imports are stripped rather than resolved: everything these modules
      // import from stx is a runtime global by the time this executes.
      code = code.replace(/^import\s+.*from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
      code = code.replace(/^import\s+type\s+.*$/gm, '')
      // Re-exports and export lists first. Stripping the bare `export ` prefix
      // off `export { a, b } from './x'` leaves `{ a, b } from './x'`, which is
      // not a statement — transformSync throws, the file contributes nothing,
      // and the name is then reported as if the export were simply absent. The
      // names these mention are declared in the sibling modules this same loop
      // visits, so dropping the statements loses nothing.
      code = code.replace(/^export\s+\*\s+(?:as\s+\w+\s+)?from\s*['"][^'"]+['"]\s*;?\s*$/gm, '')
      code = code.replace(/^export\s+(?:type\s+)?\{[\s\S]*?\}\s*(?:from\s*['"][^'"]+['"]\s*)?;?\s*$/gm, '')
      code = code.replace(/^export\s+default\s+/gm, '')
      // Only where a declaration follows, so nothing else can be decapitated.
      code = code.replace(/^export\s+(?=(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\b)/gm, '')
      chunks.push(`// ${path.basename(file).replace(/\.[jt]s$/, '')}\n${transpiler.transformSync(code).trim()}`)
      for (const name of exports) emitted.add(name)
    }
    catch (error) {
      console.warn(`[stx] framework composable ${path.basename(file)} could not be bundled:`, error)
    }
  }

  // Anything asked for that we could not emit WILL still be a ReferenceError at
  // runtime, so say so at compile time with the name and the fix. This replaces
  // the blanket "server-only export" warning: now that these are bundled on
  // demand, only a genuine bundling failure is worth reporting.
  const missing = names.filter(n => !emitted.has(n) && !declaresLocally(source, n))
  if (missing.length > 0) {
    console.warn(
      `[stx] could not bundle ${missing.join(', ')} from @stacksjs/stx/composables — `
      + 'calls to them will throw ReferenceError in the browser. Import them explicitly '
      + 'so the bundler inlines them, or use a runtime equivalent from window.stx.',
    )
  }

  if (chunks.length === 0) {
    _cache.set(key, '')
    return null
  }

  // Per-name try/catch: a file that failed to transpile leaves its declaration
  // missing, and a bare assignment would throw a ReferenceError that takes every
  // other composable in the bundle with it.
  const assignments = [...emitted]
    .map(name => `  try { if (!(${JSON.stringify(name)} in __s)) { __s[${JSON.stringify(name)}] = ${name}; if (!(${JSON.stringify(name)} in window)) window[${JSON.stringify(name)}] = ${name}; } } catch (e) {}`)
    .join('\n')

  const script = `<script data-stx-framework-composables>
;(function(){
  var __s = window.stx = window.stx || {};
${chunks.join('\n\n')}
${assignments}
})();
</script>`

  _cache.set(key, script)
  return script
}

/** @internal test-only — declare names the runtime provides. */
export function __setRuntimeOwnedForTest(names: string[]): void {
  RUNTIME_OWNED.clear()
  for (const n of names) RUNTIME_OWNED.add(n)
}
