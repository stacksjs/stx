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
import { loadStxConfig } from './config'
import { getPublicEnvDefine } from './public-env'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'
import { readSigned, type SignedCacheEntry, sourceSignature, writeSigned } from './source-signature'
import { stripModuleImports, transformStoreImports } from './store-imports'

const _cachedStoreScripts = new Map<string, SignedCacheEntry<string>>()

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

export async function getStoreScript(storesDir?: string): Promise<string | null> {
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
    writeSigned(_cachedStoreScripts, resolvedDir, '', '')
    return null
  }

  // Includes the empty case, so creating the FIRST store file invalidates the
  // `null` that was memoised before it existed.
  const signature = sourceSignature(storeFiles)
  const cached = readSigned(_cachedStoreScripts, resolvedDir, signature)
  if (cached !== undefined) return cached || null

  if (storeFiles.length === 0) {
    writeSigned(_cachedStoreScripts, resolvedDir, signature, '')
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
  const chunks: string[] = []

  // Names the store files declare themselves. A local `const useCookie = …`
  // must win over the runtime global of the same name, exactly as it would in a
  // client script, so those are excluded from the preamble below.
  const declaredNames = new Set<string>()

  const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })

  for (const file of sortedFiles) {
    try {
      let code = await Bun.file(file).text()
      const storeName = path.basename(file, '.ts')

      collectDeclaredNames(code, declaredNames)

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

      chunks.push(`// Store: ${storeName}\n${code.trim()}`)
    }
    catch (e) {
      console.warn(`[stx] Failed to load store ${file}:`, e)
    }
  }

  if (chunks.length === 0) {
    writeSigned(_cachedStoreScripts, resolvedDir, signature, '')
    return null
  }

  // Destructure the runtime globals the store files actually reference.
  //
  // signals.js puts roughly a dozen names directly on `window` — state, effect,
  // batch, navigate, defineStore — but the other ~34 live only on `window.stx`.
  // A <script client> block gets this preamble generated for it, so a bare
  // `useCookie(...)` works there; a store file got none, so the identical line
  // was a ReferenceError (#1838).
  //
  // It failed unreadably, too: store files are stripped of `export` and
  // concatenated into ONE shared IIFE, so the throw aborted every store, not
  // just the one at fault, and the developer saw `Store not found` raised later
  // by an unrelated `useStore(...)` call.
  //
  // Only referenced names are emitted, and locally-declared ones are skipped so
  // a store's own binding still shadows the global. Same construction as
  // composable-loader.ts, deliberately — one mechanism, not two.
  const joinedChunks = chunks.join('\n\n')
  const runtimeBindings = STX_RUNTIME_GLOBALS
    .filter(name => !declaredNames.has(name) && new RegExp(`\\b${name}\\b`).test(joinedChunks))
    .map(name => `var ${name} = __stx[${JSON.stringify(name)}];`)
    .join('\n')

  const code = `;(function(){\nvar __stx = window.stx || {};\n${runtimeBindings}\n${joinedChunks}\n})();`
  writeSigned(_cachedStoreScripts, resolvedDir, signature, code)
  return code
}

/**
 * Clear the cached store script (for dev mode hot reload).
 */
export function clearStoreCache(): void {
  _cachedStoreScripts.clear()
}
