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
import { transformStoreImports } from './store-imports'

const _cachedComposableScripts = new Map<string, string>()

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
export async function getComposableScript(composablesDir?: string): Promise<string | null> {
  const resolvedDir = await resolveComposablesDir(composablesDir)
  if (!resolvedDir) return null

  const cached = _cachedComposableScripts.get(resolvedDir)
  if (cached !== undefined) return cached || null

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
    _cachedComposableScripts.set(resolvedDir, '')
    return null
  }

  if (composableFiles.length === 0) {
    _cachedComposableScripts.set(resolvedDir, '')
    return null
  }

  // Stable order so the emitted bundle doesn't churn between builds.
  composableFiles.sort()

  const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })
  const chunks: string[] = []
  const exportedNames = new Set<string>()

  for (const file of composableFiles) {
    try {
      let code = await Bun.file(file).text()
      const composableName = path.basename(file, '.ts')

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
      code = code.replace(/^import\s+.*from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
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
    _cachedComposableScripts.set(resolvedDir, '')
    return null
  }

  // Assign through a try/catch per name: a file that failed to transpile leaves
  // its declaration missing, and a bare `{ a, b }` would throw a ReferenceError
  // that takes the whole registration — and every other composable — with it.
  const assignments = [...exportedNames]
    .map(name => `  try { __c[${JSON.stringify(name)}] = ${name}; } catch (e) {}`)
    .join('\n')

  const code = `;(function(){
window.__composables = window.__composables || {};
var __c = window.__composables;
${chunks.join('\n\n')}
${assignments}
})();`

  _cachedComposableScripts.set(resolvedDir, code)
  return code
}

/**
 * Clear the cached composable script (for dev mode hot reload).
 */
export function clearComposableCache(): void {
  _cachedComposableScripts.clear()
  _cachedDirs.clear()
}
