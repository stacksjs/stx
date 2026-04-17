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

let _cachedStoreScript: string | null = null

/**
 * Discover store files from storesDir and bundle them into a single
 * script that can be injected into the page.
 *
 * The bundle runs `defineStore(...)` for each store — since the signals
 * runtime is already loaded, `defineStore`/`state`/`derived` are globals.
 */
export async function getStoreScript(): Promise<string | null> {
  if (_cachedStoreScript !== null) return _cachedStoreScript || null

  const config = await loadStxConfig()
  const storesDir = path.resolve(
    config.root || process.cwd(),
    (config as any).storesDir || 'stores',
  )

  // Discover store .ts files
  const glob = new Bun.Glob('*.ts')
  const storeFiles: string[] = []

  try {
    for await (const file of glob.scan({ cwd: storesDir, absolute: true })) {
      // Skip index.ts, type files, and Stacks boilerplate
      const name = path.basename(file, '.ts')
      if (['index', 'types'].includes(name)) continue
      if (file.includes('.d.ts')) continue
      storeFiles.push(file)
    }
  }
  catch {
    // storesDir doesn't exist — no stores to load
    _cachedStoreScript = ''
    return null
  }

  if (storeFiles.length === 0) {
    _cachedStoreScript = ''
    return null
  }

  // Read each store file, strip imports/exports, and concatenate.
  // Store files use `import { defineStore, state, derived } from '@stacksjs/stx'`
  // but in the browser these are already globals — just strip the imports.
  const chunks: string[] = []

  const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser' })

  for (const file of storeFiles) {
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
    _cachedStoreScript = ''
    return null
  }

  const code = `;(function(){\n${chunks.join('\n\n')}\n})();`
  _cachedStoreScript = code
  return code
}

/**
 * Clear the cached store script (for dev mode hot reload).
 */
export function clearStoreCache(): void {
  _cachedStoreScript = null
}
