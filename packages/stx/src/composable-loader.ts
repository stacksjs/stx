/**
 * Composable Auto-Loader
 *
 * Discovers .ts files in `composablesDir`, bundles them into a single script,
 * and exposes every exported binding on `window.__composables`. That object is
 * what `import { useThing } from '@composables'` compiles to — store-imports.ts
 * rewrites the import into `const { useThing } = window.__composables`, a plain
 * destructure in the page's own scope, which is exactly where template
 * directives can see it.
 *
 * Before this loader existed the rewrite had nothing feeding it: `@composables`
 * imports compiled to a destructure of `undefined`, so every binding that
 * referenced a composable silently did nothing — `@click` never fired, `@show`
 * never flipped, and there was no console error or build warning to notice.
 * Sharing client logic between pages was effectively impossible, so the same
 * block got copy-pasted into page after page. See #1780.
 *
 * Mirrors store-loader.ts, with one deliberate difference: stores are
 * side-effectful (running `defineStore(...)` registers them globally, so
 * nothing needs to be exported), whereas composables are *values* — their
 * exported names have to be collected and attached to `window.__composables`.
 *
 * @module composable-loader
 */

import path from 'node:path'
import { loadStxConfig } from './config'
import { getPublicEnvDefine } from './public-env'
import { readSigned, type SignedCacheEntry, sourceSignature, writeSigned } from './source-signature'
import { stripModuleImports } from './store-imports'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'
import { transformStoreImports } from './store-imports'
import { getSharedTranspiler } from './utils'

const _cachedComposableScripts = new Map<string, SignedCacheEntry<string>>()

/**
 * Cache of resolved directories, including misses (stored as `null`).
 *
 * Resolution runs before the script cache can be consulted, and for the common
 * case — an app with no composables at all — it would otherwise re-read the
 * config and re-glob every candidate directory on EVERY top-level render.
 */
const _cachedDirs = new Map<string, string | null>()

/**
 * Directory names tried, in order, when no explicit directory is configured.
 *
 * `functions/` is included because it is the convention stx apps already
 * follow for shared composables (see the project layout in CLAUDE.md), so an
 * existing app gets working `@composables` imports without moving any files.
 */
const DEFAULT_DIR_CANDIDATES = ['composables', 'functions'] as const

/** Files that are never composables, even when they live in the directory. */
function isSkippedFile(file: string): boolean {
  const name = path.basename(file, '.ts')
  return name === 'index' || name === 'types' || file.endsWith('.d.ts')
}

/**
 * Resolve the directory to scan: an explicit path wins, otherwise the
 * configured `composablesDir`, otherwise the first default candidate that
 * actually contains composable files.
 */
async function resolveComposablesDir(composablesDir?: string): Promise<string | null> {
  if (composablesDir) return path.resolve(composablesDir)

  const cacheKey = `<default>:${process.cwd()}`
  const cachedDir = _cachedDirs.get(cacheKey)
  if (cachedDir !== undefined) return cachedDir

  const resolved = await probeDefaultDirs()
  // Only a positive result is memoised. Caching the `null` meant that once a
  // process had looked before any composable existed, creating the first one
  // could never be seen without a restart — the same shape as the store memo
  // this fixes (#1877). Re-probing while none exists costs a glob over two
  // candidate directories.
  if (resolved !== null)
    _cachedDirs.set(cacheKey, resolved)
  return resolved
}

/** Read the configured dir, or probe the conventional locations. */
async function probeDefaultDirs(): Promise<string | null> {
  const config = await loadStxConfig()
  const root = config.root || process.cwd()
  const configured = (config as any).composablesDir as string | undefined
  if (configured) return path.resolve(root, configured)

  // No explicit config — probe the conventional locations. Probing (rather than
  // hardcoding one) keeps both `composables/` and the documented `functions/`
  // layout working with zero configuration.
  for (const candidate of DEFAULT_DIR_CANDIDATES) {
    const dir = path.resolve(root, candidate)
    try {
      const glob = new Bun.Glob('**/*.ts')
      for await (const file of glob.scan({ cwd: dir, absolute: true })) {
        if (!isSkippedFile(file)) return dir
      }
    }
    catch {
      // Directory doesn't exist — try the next candidate.
    }
  }
  return null
}

/** One composable file and the names it exports. */
export interface ComposableModule {
  /** Absolute path to the `.ts` file. */
  file: string
  /** Exported binding names, excluding `default`. */
  names: string[]
}

/**
 * Every composable file in the resolved directory, with its exported names.
 *
 * Shared by the two consumers that need the names without the bundle: the
 * typechecker, which has to declare them or an app's own composables read as
 * undefined (#1934), and the per-page pruning that decides which of them a page
 * actually references (#1936).
 *
 * Returns an empty array when there is no composables directory, which is the
 * common case and not an error.
 */
export async function listComposableModules(composablesDir?: string): Promise<ComposableModule[]> {
  const resolvedDir = await resolveComposablesDir(composablesDir)
  if (!resolvedDir) return []

  const files: string[] = []
  try {
    const glob = new Bun.Glob('**/*.ts')
    for await (const file of glob.scan({ cwd: resolvedDir, absolute: true })) {
      if (!isSkippedFile(file)) files.push(file)
    }
  }
  catch {
    return []
  }
  files.sort()

  const transpiler = getSharedTranspiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })
  const modules: ComposableModule[] = []
  for (const file of files) {
    try {
      const code = await Bun.file(file).text()
      const names = transpiler.scan(code).exports.filter(name => name !== 'default')
      if (names.length > 0)
        modules.push({ file, names })
    }
    catch {
      // Unparseable file — it will be reported by the bundling path.
    }
  }
  return modules
}

/**
 * Discover composable files and bundle them into a single script that
 * populates `window.__composables`.
 *
 * Every file is concatenated into ONE IIFE, so composables can call each other
 * directly without importing — their declarations share a scope once the
 * import statements are stripped.
 *
 * Returns `null` when there is nothing to load, so callers can skip injection.
 */
/** Word-boundary test for one identifier, with regex metacharacters escaped. */
function mentions(text: string, name: string): boolean {
  return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)
}

/**
 * The subset of composable files a page can actually reach.
 *
 * Every module used to be injected into every page whole, so the cost of adding
 * a composable was paid by every route including ones that cannot reach it —
 * measured at +3.2KB gzipped on pages referencing none of them, and not just
 * the names: the bodies, so a blog index shipped the publish endpoint and the
 * chart drawing code (#1936).
 *
 * Selection is by mention, then transitively through the composables' own
 * source, because one composable may call another. `pageSource` is the rendered
 * page at injection time, which already contains the stores bundle — so a
 * composable reached only from a store is kept.
 *
 * Over-inclusion is safe and under-inclusion is not, so the test is deliberately
 * loose: a composable named after a common word may be kept by a coincidental
 * mention. The only thing it cannot see is a name assembled at runtime, and such
 * a name could never have resolved as a bare global either.
 */
function selectReachable(
  modules: ComposableModule[],
  codeByFile: Map<string, string>,
  pageSource: string,
): Set<string> {
  const fileForName = new Map<string, string>()
  for (const { file, names } of modules) {
    for (const name of names) {
      if (!fileForName.has(name))
        fileForName.set(name, file)
    }
  }

  const filesMentionedIn = (text: string): string[] => {
    const found: string[] = []
    for (const [name, file] of fileForName) {
      if (mentions(text, name))
        found.push(file)
    }
    return found
  }

  const selected = new Set<string>()
  let frontier = filesMentionedIn(pageSource)
  while (frontier.length > 0) {
    const next: string[] = []
    for (const file of frontier) {
      if (selected.has(file))
        continue
      selected.add(file)
      for (const dependency of filesMentionedIn(codeByFile.get(file) ?? '')) {
        if (!selected.has(dependency))
          next.push(dependency)
      }
    }
    frontier = next
  }
  return selected
}

/**
 * @param pageSource - the rendered page, used to drop composables it cannot
 * reach. Omit to emit every composable, which is what a caller with no page in
 * hand needs.
 */
export async function getComposableScript(composablesDir?: string, pageSource?: string): Promise<string | null> {
  const resolvedDir = await resolveComposablesDir(composablesDir)
  if (!resolvedDir) return null

  // Scan BEFORE the cache lookup so the memo can be keyed on the sources. It
  // used to be permanent, and nothing outside tests called
  // `clearComposableCache()`, so a dev server served the first build for the
  // life of the process (#1877).
  const composableFiles: string[] = []
  try {
    const glob = new Bun.Glob('**/*.ts')
    for await (const file of glob.scan({ cwd: resolvedDir, absolute: true })) {
      if (isSkippedFile(file)) continue
      composableFiles.push(file)
    }
  }
  catch {
    // composablesDir doesn't exist — nothing to load.
    writeSigned(_cachedComposableScripts, resolvedDir, '', '')
    return null
  }

  const signature = sourceSignature(composableFiles)

  if (composableFiles.length === 0) {
    writeSigned(_cachedComposableScripts, resolvedDir, signature, '')
    return null
  }

  // Stable order so the emitted bundle doesn't churn between builds.
  composableFiles.sort()

  const transpiler = getSharedTranspiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })

  // Sources are read before the cache lookup because the selection is part of
  // the key: two pages reaching different subsets must not share an entry.
  const codeByFile = new Map<string, string>()
  const modules: ComposableModule[] = []
  for (const file of composableFiles) {
    try {
      const code = await Bun.file(file).text()
      codeByFile.set(file, code)
      const names = transpiler.scan(code).exports.filter(name => name !== 'default')
      if (names.length > 0)
        modules.push({ file, names })
    }
    catch {
      // Unparseable — the transpile below reports it with the file name.
      codeByFile.set(file, '')
    }
  }

  const selected = pageSource === undefined
    ? new Set(composableFiles)
    : selectReachable(modules, codeByFile, pageSource)

  // A page that reaches none of them gets no script at all, which is the whole
  // point: the previous behaviour shipped every body to every route.
  if (selected.size === 0)
    return null

  const includedFiles = composableFiles.filter(file => selected.has(file))
  const cacheKey = `${resolvedDir}\u0000${includedFiles.join('\u0000')}`
  const cached = readSigned(_cachedComposableScripts, cacheKey, signature)
  if (cached !== undefined) return cached || null

  const chunks: string[] = []
  const exportedNames = new Set<string>()
  const declaredNames = new Set<string>()

  for (const file of includedFiles) {
    try {
      let code = codeByFile.get(file) ?? await Bun.file(file).text()
      const composableName = path.basename(file, '.ts')

      for (const match of code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Z_a-z$][\w$]*)/g)) {
        if (match[1])
          declaredNames.add(match[1])
      }

      // Collect exported bindings BEFORE the export keywords are stripped.
      // `default` is skipped: an anonymous default has no name to destructure
      // through `import { … } from '@composables'`.
      try {
        for (const name of transpiler.scan(code).exports) {
          if (name !== 'default') exportedNames.add(name)
        }
      }
      catch {
        // Unparseable file — fall through; the transpile below will report it.
      }

      // Rewrite `@stores` / `@composables` imports to their runtime globals so a
      // composable can use a store (or another composable) the same way a page can.
      code = transformStoreImports(code)

      // Strip the remaining imports BEFORE transpiling: `state`/`derived`/
      // `defineStore` are runtime globals, not real modules, and leaving the
      // imports in makes the transpiler emit require() calls that fail in the
      // browser. Same rationale as store-loader.
      code = stripModuleImports(code)
      // Strip the export keyword, keeping the declaration itself.
      code = code.replace(/^export\s+(default\s+)?/gm, '')

      // Bun's transpiler strips ALL TypeScript syntax properly — annotations,
      // interfaces, generics, return types — which regex stripping can't.
      code = transpiler.transformSync(code)

      chunks.push(`// Composable: ${composableName}\n${code.trim()}`)
    }
    catch (e) {
      console.warn(`[stx] Failed to load composable ${file}:`, e)
    }
  }

  if (chunks.length === 0 || exportedNames.size === 0) {
    writeSigned(_cachedComposableScripts, cacheKey, signature, '')
    return null
  }

  // Assign through a try/catch per name: a file that failed to transpile leaves
  // its declaration missing, and a bare `{ a, b }` would throw a ReferenceError
  // that takes the whole registration — and every other composable — with it.
  const assignments = [...exportedNames]
    .map(name => `  try { __c[${JSON.stringify(name)}] = ${name}; } catch (e) {}`)
    .join('\n')

  // Publish each composable as a bare global so pages can just call
  // `useThing()` with no import — the ergonomic that makes a composables
  // directory worth having. A page's <script client> destructures the built-ins
  // from window.stx and otherwise resolves free identifiers against the global
  // scope, so a plain `window.<name>` is what makes a bare call bind.
  //
  // Names already taken are SKIPPED, not clobbered. Two cases, both real:
  // a built-in of the same name (useFetch, useToggle, useCounter, …), where the
  // page's local destructure from window.stx would shadow our global anyway so
  // assigning achieves nothing; and a genuine window property (name, status,
  // length), where overwriting would break the page. Either way we warn instead
  // of failing silently, and `import { x } from '@composables'` still resolves
  // to the user's version because that destructure comes after the built-ins.
  const globalNames = JSON.stringify([...exportedNames])
  const joinedChunks = chunks.join('\n\n')
  const runtimeBindings = STX_RUNTIME_GLOBALS
    .filter(name => !declaredNames.has(name) && new RegExp(`\\b${name}\\b`).test(joinedChunks))
    .map(name => `var ${name} = __stx[${JSON.stringify(name)}];`)
    .join('\n')
  const code = `;(function(){
window.__composables = window.__composables || {};
var __c = window.__composables;
var __stx = window.stx || {};
${runtimeBindings}
${joinedChunks}
${assignments}
  var __names = ${globalNames};
  for (var __i = 0; __i < __names.length; __i++) {
    var __n = __names[__i];
    if (!(__n in __c)) continue;
    var __takenByBuiltin = !!(window.stx && __n in window.stx);
    if (__takenByBuiltin || __n in window) {
      console.warn('[stx] composable "' + __n + '" is not available as a bare identifier: '
        + (__takenByBuiltin ? 'a built-in of that name already exists' : 'window already defines that property')
        + '. Rename it, or use: import { ' + __n + ' } from "@composables"');
      continue;
    }
    window[__n] = __c[__n];
  }
})();`

  writeSigned(_cachedComposableScripts, cacheKey, signature, code)
  return code
}

/**
 * Clear the cached composable script (for dev mode hot reload).
 */
export function clearComposableCache(): void {
  _cachedComposableScripts.clear()
  _cachedDirs.clear()
}
