/**
 * Store Auto-Loader
 *
 * Discovers .ts files in storesDir, bundles them with Bun.build,
 * and returns a <script> tag to inject into the page. Stores are
 * registered before any <script client> blocks run, so useStore()
 * always finds them.
 *
 * @module store-loader
 */

import path from 'node:path'
import { bundleClientScript, clientBundleDependencies, hasUserImports, moduleSubstitutionKey } from './client-script-bundler'
import { loadStxConfig } from './config'
import { isProduction, minifyClassicScript } from './env'
import { getPublicEnvDefine } from './public-env'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'
import { stripStxRuntimeImports } from './signal-processing'
import { clearSourceSignatures, readSigned, type SignedCacheEntry, sourceSignature, writeSigned } from './source-signature'
import { stripModuleImports, transformStoreImports } from './store-imports'
import { getSharedTranspiler } from './utils'

/**
 * Discover store files from storesDir and bundle them into a single
 * script that can be injected into the page.
 *
 * The bundle runs `defineStore(...)` for each store — since the signals
 * runtime is already loaded, `defineStore`/`state`/`derived` are globals.
 *
 * Pass an absolute `storesDir` to look up stores there. When omitted, falls
 * back to reading `storesDir` from the stx config at the current working
 * directory — which is only correct when run from the app's own root.
 */
/**
 * Every name a store file binds at the top level.
 *
 * Destructuring has to be covered, not just `const x = …`. The pattern this
 * exists to catch is exactly how apps reach a `window.stx`-only composable
 * today — `const { useColorMode, state } = window.stx` — and missing it is
 * worse than not emitting the preamble at all: the generated
 * `var useColorMode = …` and the store's own `const { useColorMode }` land in
 * the SAME IIFE, which is a duplicate declaration, which is a SyntaxError, which
 * takes every store on the page down.
 */
function collectDeclaredNames(code: string, into: Set<string>): void {
  // Plain bindings: const x, let y, function f, class C.
  for (const match of code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Z_a-z$][\w$]*)/g)) {
    if (match[1])
      into.add(match[1])
  }

  // Object destructuring: the LOCAL name is what matters, so `a: b` binds `b`,
  // `a = 1` binds `a`, and `...rest` binds `rest`.
  for (const match of code.matchAll(/\b(?:const|let|var)\s*\{([^{}]*)\}\s*=/g)) {
    for (const part of (match[1] ?? '').split(',')) {
      const local = part.includes(':') ? part.split(':').pop() : part
      const name = (local ?? '').replace(/=.*$/s, '').replace(/^\s*\.\.\./, '').trim()
      if (/^[A-Z_a-z$][\w$]*$/.test(name))
        into.add(name)
    }
  }

  // Array destructuring: `const [a, , b] = …`. Holes produce empty entries.
  for (const match of code.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]\s*=/g)) {
    for (const part of (match[1] ?? '').split(',')) {
      const name = part.replace(/=.*$/s, '').replace(/^\s*\.\.\./, '').trim()
      if (/^[A-Z_a-z$][\w$]*$/.test(name))
        into.add(name)
    }
  }
}

/** One store file, built: what it defines, the names it binds itself, and its code. */
interface StoreChunk {
  /** The file's name without `.ts`. */
  name: string
  /** The ids its `defineStore("id", …)` calls name. Empty when a call names its store some other way. */
  ids: string[]
  /** The names the file binds at the top level. */
  declared: Set<string>
  /** The store, built and ready to be concatenated into the shared IIFE. */
  code: string
}

interface StoreChunks {
  chunks: StoreChunk[]
}

const _cachedStoreChunks = new Map<string, SignedCacheEntry<StoreChunks>>()

/** Every store file's chunk, in dependency order; null when the directory holds none. */
async function loadStoreChunks(storesDir?: string, sharedModules: boolean = isProduction()): Promise<StoreChunks | null> {
  let resolvedDir: string
  if (storesDir) {
    resolvedDir = path.resolve(storesDir)
  }
  else {
    const config = await loadStxConfig()
    resolvedDir = path.resolve(
      config.root || process.cwd(),
      (config as any).storesDir || 'stores',
    )
  }

  // Discover store .ts files. The scan happens BEFORE the cache lookup so the
  // memo can be keyed on the sources: it used to be permanent, and since
  // nothing outside tests ever called `clearStoreCache()`, a dev server held
  // the first result — usually `null`, from before any store existed — for the
  // life of the process (#1877).
  // Stores bundled under module substitutes (the native compiler's) are
  // another build of the same files.
  const cacheKey = `${resolvedDir}\u0000${moduleSubstitutionKey()}\u0000${sharedModules ? 'shared' : 'inline'}`
  const glob = new Bun.Glob('*.ts')
  const storeFiles: string[] = []

  try {
    for await (const file of glob.scan({ cwd: resolvedDir, absolute: true })) {
      // Skip index.ts, type files, and Stacks boilerplate
      const name = path.basename(file, '.ts')
      if (['index', 'types'].includes(name)) continue
      if (file.includes('.d.ts')) continue
      storeFiles.push(file)
    }
  }
  catch {
    // storesDir doesn't exist — no stores to load
    writeSigned(_cachedStoreChunks, cacheKey, '', { chunks: [] })
    return null
  }

  // Includes the empty case, so creating the FIRST store file invalidates the
  // `null` that was memoised before it existed.
  const storeInputs = () => [...new Set([
    ...storeFiles,
    ...storeFiles.flatMap(file => clientBundleDependencies(file)),
  ])]
  let signature = sourceSignature(storeInputs())
  const cached = readSigned(_cachedStoreChunks, cacheKey, signature)
  if (cached !== undefined) return cached.chunks.length > 0 ? cached : null

  if (storeFiles.length === 0) {
    writeSigned(_cachedStoreChunks, cacheKey, signature, { chunks: [] })
    return null
  }

  // Sort stores by dependency: stores that call useStore() depend on other
  // stores, so they must load AFTER the stores they reference. Stores with
  // no useStore() calls (like auth) load first.
  const filesWithDeps: Array<{ file: string, hasUseStore: boolean }> = []
  for (const file of storeFiles) {
    const content = await Bun.file(file).text()
    filesWithDeps.push({
      file,
      hasUseStore: /useStore\s*\(/.test(content),
    })
  }
  // Independent stores first, dependent stores after
  filesWithDeps.sort((a, b) => {
    if (a.hasUseStore === b.hasUseStore) return 0
    return a.hasUseStore ? 1 : -1
  })
  const sortedFiles = filesWithDeps.map(f => f.file)

  // Read each store file, strip imports/exports, and concatenate.
  // Store files use `import { defineStore, state, derived } from '@stacksjs/stx'`
  // but in the browser these are already globals — just strip the imports.
  const chunks: StoreChunk[] = []

  const transpiler = getSharedTranspiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })

  for (const file of sortedFiles) {
    try {
      let code = await Bun.file(file).text()
      const storeName = path.basename(file, '.ts')

      // Names the store file declares itself. A local `const useCookie = …`
      // must win over the runtime global of the same name, exactly as it would
      // in a client script, so those are excluded from the preamble.
      const declared = new Set<string>()
      collectDeclaredNames(code, declared)
      const ids = [...code.matchAll(/\bdefineStore\s*(?:<[^>()]*>)?\(\s*(['"`])([^'"`$\\]+)\1/g)].map(match => match[2]!)
      // A call whose id is not a literal makes the file's ids unknown.
      const definitions = code.match(/\bdefineStore\s*(?:<[^>()]*>)?\(/g)?.length ?? 0

      // A store is browser code just like a <script client> block. Explicit
      // imports from installed packages and local helpers therefore need the
      // same Bun bundle pass; stripping every import left those bindings as
      // runtime ReferenceErrors. STX runtime imports remain external and are
      // resolved from window.stx by the existing transform below.
      if (hasUserImports(code))
        // In development, inlined rather than served by the page module
        // registry (#1957): the store bundle is also fetched on its own for
        // store HMR (/_stx/stores.js), where a store edited to add an import
        // would read a module the running page never registered. Production
        // has no store HMR, and inlining gave every store its own copy of
        // every helper it imports: hq.training's thirty stores came to 2.9 MB
        // on every page, i18n and request helpers repeated in each. There the
        // page registry, which already reads the store code, holds one copy.
        code = await bundleClientScript(code, file, { projectRoot: process.cwd(), externalizeUserModules: sharedModules })

      // A bundled dependency may import the same STX runtime names as the
      // store entry. Bun keeps that external import and renames the dependency
      // binding (for example `defineStore as defineStore2`). A plain import
      // strip loses the alias and leaves the bundled body calling an undefined
      // identifier. Preserve those mappings against the canonical runtime
      // globals before the generic import cleanup below.
      code = stripStxRuntimeImports(code)

      // Rewrite `@stores` / `@composables` imports to their runtime globals, so
      // a store can use another store or a composable the same way a page can.
      // The transform named for stores was applied only by the composable
      // loader; stores themselves never got it (#1838).
      code = transformStoreImports(code)

      // Strip import statements BEFORE transpiling — defineStore/state/derived
      // are runtime globals, not real modules. If we leave them, the transpiler
      // converts them to require() calls that fail in the browser.
      code = stripModuleImports(code)
      // Strip export statements (keep the content)
      code = code.replace(/^export\s+(default\s+)?/gm, '')

      // Use Bun's transpiler to strip ALL TypeScript syntax properly —
      // type annotations, interfaces, generics, return types, etc.
      // This is 100% reliable vs fragile regex stripping.
      code = transpiler.transformSync(code)

      chunks.push({ name: storeName, ids: ids.length === definitions ? ids : [], declared, code: `// Store: ${storeName}\n${code.trim()}` })
    }
    catch (e) {
      console.warn(`[stx] Failed to load store ${file}:`, e)
    }
  }

  if (chunks.length === 0) {
    writeSigned(_cachedStoreChunks, cacheKey, signature, { chunks: [] })
    return null
  }

  // The first cold bundle discovers its transitive inputs. Sign the cached
  // aggregate with that complete graph so editing an imported helper
  // invalidates the store script on the next read.
  signature = sourceSignature(storeInputs())
  const built = { chunks }
  writeSigned(_cachedStoreChunks, cacheKey, signature, built)
  return built
}

/**
 * Concatenate store chunks into the one script a page loads.
 *
 * Destructures the runtime globals the store files actually reference.
 *
 * signals.js puts roughly a dozen names directly on `window` — state, effect,
 * batch, navigate, defineStore — but the other ~34 live only on `window.stx`.
 * A <script client> block gets this preamble generated for it, so a bare
 * `useCookie(...)` works there; a store file got none, so the identical line
 * was a ReferenceError (#1838).
 *
 * It failed unreadably, too: store files are stripped of `export` and
 * concatenated into ONE shared IIFE, so the throw aborted every store, not
 * just the one at fault, and the developer saw `Store not found` raised later
 * by an unrelated `useStore(...)` call.
 *
 * Only referenced names are emitted, and locally-declared ones are skipped so
 * a store's own binding still shadows the global. Same construction as
 * composable-loader.ts, deliberately — one mechanism, not two.
 */
function assembleStoreScript(chunks: StoreChunk[]): string {
  const declaredNames = new Set<string>()
  for (const chunk of chunks) for (const name of chunk.declared) declaredNames.add(name)
  const joinedChunks = chunks.map(chunk => chunk.code).join('\n\n')
  const runtimeBindings = STX_RUNTIME_GLOBALS
    .filter(name => !declaredNames.has(name) && new RegExp(`\\b${name}\\b`).test(joinedChunks))
    .map(name => `var ${name} = __stx[${JSON.stringify(name)}];`)
    .join('\n')

  const assembled = `;(function(){\nvar __stx = window.stx || {};\n${runtimeBindings}\n${joinedChunks}\n})();`
  // Production ships it minified, as one script: it is every page's.
  return isProduction() ? minifyClassicScript(assembled) : assembled
}

/** The names a built store binds at its top level (not indented: Bun prints them at the start of a line). */
function topLevelNames(code: string): Set<string> {
  const names = new Set<string>()
  for (const match of code.matchAll(/^(?:export\s+)?(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Z_a-z$][\w$]*)/gm))
    names.add(match[1]!)
  for (const match of code.matchAll(/^(?:const|let|var)\s*[{[]([^=]*)[}\]]\s*=/gm)) {
    for (const part of (match[1] ?? '').split(',')) {
      const name = (part.includes(':') ? part.split(':').pop()! : part).replace(/=.*$/s, '').replace(/^\s*\.\.\./, '').trim()
      if (/^[A-Z_a-z$][\w$]*$/.test(name)) names.add(name)
    }
  }
  return names
}

/**
 * Each store as a function of its own (`function() { … }`), which runs it as
 * the shared script would: with the runtime names it reads bound first. A
 * screen's stores can then be held once for every screen that defines them
 * (the native runtime prelude). Null when a store reads a name another one
 * binds, which only their shared scope gives it.
 */
function storeFunctions(chunks: StoreChunk[]): string[] | null {
  const bound = chunks.map(chunk => topLevelNames(chunk.code))
  for (const [index, chunk] of chunks.entries()) {
    for (const [other, names] of bound.entries()) {
      if (other === index) continue
      for (const name of names) {
        if (bound[index]!.has(name) || chunk.declared.has(name)) continue
        if (new RegExp(`(?<![\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`).test(chunk.code)) return null
      }
    }
  }
  return chunks.map((chunk, index) => {
    const own = new Set([...chunk.declared, ...bound[index]!])
    const bindings = STX_RUNTIME_GLOBALS
      .filter(name => !own.has(name) && new RegExp(`\\b${name}\\b`).test(chunk.code))
      .map(name => `var ${name} = __stx[${JSON.stringify(name)}];`)
      .join('\n')
    return `function() {\nvar __stx = window.stx || {};\n${bindings}\n${chunk.code}\n}`
  })
}

/** The assembled script of every store, kept for as long as the chunks it was built from. */
const _assembledStoreScripts = new WeakMap<StoreChunks, string>()

export async function getStoreScript(storesDir?: string): Promise<string | null> {
  const built = await loadStoreChunks(storesDir)
  if (!built) return null
  let code = _assembledStoreScripts.get(built)
  if (code === undefined) {
    code = assembleStoreScript(built.chunks)
    _assembledStoreScripts.set(built, code)
  }
  return code
}

/**
 * Every store a piece of code reads by name: `useStore("auth")`.
 *
 * `all` is set when it cannot tell: a call whose name is not a literal, or a
 * look into the registry itself. Such code may read any store.
 */
export function storesRead(...sources: Array<string | null | undefined>): { names: Set<string>, all: boolean } {
  const names = new Set<string>()
  let all = false
  for (const source of sources) {
    if (!source) continue
    if (/__STX_STORES__|\b_stores\b/.test(source)) all = true
    const calls = source.match(/\buseStore\s*(?:<[^>()]*>)?\(/g)?.length ?? 0
    if (calls === 0) continue
    let literal = 0
    for (const match of source.matchAll(/\buseStore\s*(?:<[^>()]*>)?\(\s*(['"`])([^'"`$\\]+)\1\s*[,)]/g)) {
      names.add(match[2]!)
      literal++
    }
    if (literal !== calls) all = true
  }
  return { names, all }
}

/**
 * The store script for code that reads only some of the stores: those it names
 * with `useStore("…")`, and those the stores it names read in turn. A page
 * that loads every store defines thirty of them (HQ's phone screens: ~140 KB of
 * every route), each running its setup, for one or two it uses.
 *
 * `usedBy` is all the code that will run beside the stores (the page's
 * scripts, its modules). With code that may read any store, or a store file
 * whose ids cannot be read, every store is kept. `stores` names the files
 * kept, for the caller to rebuild what depends on them.
 *
 * `sharedModules`: the stores' imports are left to the page's module registry
 * (what production does) instead of inlined in each store. Defaults to
 * production's.
 */
export async function getStoreScriptFor(
  storesDir: string | undefined,
  usedBy: Array<string | null | undefined>,
  options: { sharedModules?: boolean } = {},
): Promise<{ code: string, stores: string[], functions: string[] | null } | null> {
  const built = await loadStoreChunks(storesDir, options.sharedModules)
  if (!built) return null
  const { chunks } = built
  const wanted = storesRead(...usedBy)
  let kept: StoreChunk[]
  if (wanted.all || chunks.some(chunk => chunk.ids.length === 0)) {
    kept = chunks
  }
  else {
    const byId = new Map<string, StoreChunk>()
    for (const chunk of chunks) for (const id of chunk.ids) byId.set(id, chunk)
    const included = new Set<StoreChunk>()
    const queue = [...wanted.names]
    let everything = false
    while (queue.length > 0 && !everything) {
      const chunk = byId.get(queue.pop()!)
      // A name no store defines is for something else to answer.
      if (!chunk || included.has(chunk)) continue
      included.add(chunk)
      const next = storesRead(chunk.code)
      if (next.all) everything = true
      else queue.push(...next.names)
    }
    kept = everything ? chunks : chunks.filter(chunk => included.has(chunk))
  }
  if (kept.length === 0) return null
  return { code: assembleStoreScript(kept), stores: kept.map(chunk => chunk.name), functions: storeFunctions(kept) }
}

/**
 * Clear the cached store script (for dev mode hot reload).
 */
export function clearStoreCache(): void {
  _cachedStoreChunks.clear()
  clearSourceSignatures()
}
