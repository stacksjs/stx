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

const _cachedStoreScripts = new Map<string, string>()

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

  const cached = _cachedStoreScripts.get(resolvedDir)
  if (cached !== undefined) return cached || null

  // Discover store .ts files
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
    _cachedStoreScripts.set(resolvedDir, '')
    return null
  }

  if (storeFiles.length === 0) {
    _cachedStoreScripts.set(resolvedDir, '')
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

  const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })

  for (const file of sortedFiles) {
    try {
      let code = await Bun.file(file).text()
      const storeName = path.basename(file, '.ts')

      // Strip import statements BEFORE transpiling — defineStore/state/derived
      // are runtime globals, not real modules. If we leave them, the transpiler
      // converts them to require() calls that fail in the browser.
      code = code.replace(/^import\s+.*from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
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
    _cachedStoreScripts.set(resolvedDir, '')
    return null
  }

  const code = `;(function(){\n${chunks.join('\n\n')}\n})();`
  _cachedStoreScripts.set(resolvedDir, code)
  return code
}

/**
 * Clear the cached store script (for dev mode hot reload).
 */
export function clearStoreCache(): void {
  _cachedStoreScripts.clear()
}
