/**
 * Page-level module registry (stacksjs/stx#1957).
 *
 * A component's `<script client>` bundle no longer inlines the modules it
 * imports. Its direct imports become reads of `globalThis.__stxModules[id]`
 * (see `rewriteRegistryImports` in client-script-bundler.ts), and this module
 * builds the ONE bundle per page that fills that registry. Every imported
 * module is therefore bundled once and evaluated once, so module state -- a
 * cache, a session, a list of registered hooks -- is page-wide, the way
 * `@stores` and `@composables` already are.
 *
 * Which modules a page needs is read from the page's own output, not tracked
 * while it renders. Component bundles are cached per script, and a cache hit
 * never runs the build that would have reported its imports; the reads it
 * emitted are in the HTML either way.
 *
 * @module client-module-registry
 */

import path from 'node:path'

/**
 * The read `rewriteRegistryImports` emits. Its exact shape is the contract:
 * `globalThis.__stxModules["<json-escaped id>"]`. Ids always contain `/`, `.`
 * or `:`, so a minifier cannot turn the bracket into dot access and hide it.
 */
const REGISTRY_READ = /__stxModules\["((?:[^"\\]|\\.)*)"\]/g

/** Module ids read anywhere in `sources`, sorted so the bundle key is stable. */
export function registeredModuleIdsIn(...sources: Array<string | null | undefined>): string[] {
  const ids = new Set<string>()
  for (const source of sources) {
    if (!source || !source.includes('__stxModules['))
      continue
    for (const match of source.matchAll(REGISTRY_READ)) {
      try {
        ids.add(JSON.parse(`"${match[1]}"`) as string)
      }
      catch {
        // Not one of ours; a hand-written read with an escape we did not emit.
      }
    }
  }
  return [...ids].sort()
}

/**
 * Build the script that registers every module in `ids`.
 *
 * Each module is imported as a namespace and stored under its id if nothing is
 * there yet, so re-running the script keeps the instance components already
 * hold. The whole bundle is additionally guarded by its own key: SPA
 * navigation re-executes page scripts, and without the guard every module's
 * top-level code would run again on each navigation.
 *
 * Returns null when there is nothing to register, and on a failed build --
 * the components then throw naming the missing module, which is the failure a
 * developer can act on, rather than the page silently losing its bundles.
 */
export async function buildModuleRegistryScript(
  ids: string[],
  options: { minify?: boolean } = {},
): Promise<string | null> {
  if (ids.length === 0)
    return null

  // Ids are encoded against process.cwd() by the bundler; decode the same way.
  const root = process.cwd()
  const imports: string[] = []
  const registrations: string[] = []
  ids.forEach((id, index) => {
    const specifier = id.startsWith('npm:') ? id.slice(4) : path.resolve(root, id)
    const local = `__stxRegistered${index}`
    const key = JSON.stringify(id)
    imports.push(`import * as ${local} from ${JSON.stringify(specifier)};`)
    registrations.push(`if (!globalThis.__stxModules[${key}]) globalThis.__stxModules[${key}] = ${local};`)
  })
  const entry = [
    ...imports,
    'globalThis.__stxModules = globalThis.__stxModules || {};',
    ...registrations,
  ].join('\n')

  let code: string
  try {
    const { bundleClientScript } = await import('./client-script-bundler')
    // Inline, not externalised: this bundle is where the modules actually live.
    code = await bundleClientScript(entry, path.join(root, '.stx-module-registry.ts'), {
      projectRoot: root,
      minify: options.minify,
      externalizeUserModules: false,
    })
  }
  catch (error) {
    console.warn('[stx] could not build the page module registry (#1957):', error)
    return null
  }

  // The modules may import from `stx` or `@stores` / `@composables`. Give them
  // the same treatment a component script gets after bundling.
  const { transformAutoImports, generateAutoImportDestructuring } = await import('./client-script')
  const autoImports = transformAutoImports(code)
  const prelude = generateAutoImportDestructuring(autoImports.stxImports, autoImports.browserImports)
  const { transformStoreImports } = await import('./store-imports')
  code = transformStoreImports(autoImports.code)

  const bundleKey = JSON.stringify(new Bun.CryptoHasher('md5').update(entry).digest('hex').slice(0, 12))
  return [
    ';(function() {',
    `  var __stxBundles = globalThis.__stxModuleBundles || (globalThis.__stxModuleBundles = {});`,
    `  if (__stxBundles[${bundleKey}]) return;`,
    `  __stxBundles[${bundleKey}] = true;`,
    prelude,
    code,
    '})();',
  ].join('\n')
}
