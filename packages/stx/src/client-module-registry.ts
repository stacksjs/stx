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

/** What each registered module is read for, by id: its names, or null for the whole module. */
export type RegistryNames = ReadonlyMap<string, ReadonlySet<string> | null>

/**
 * What each registered module is read for: the names its readers take from it,
 * by module id, or `null` for a module read whole (a namespace, a read of
 * anything but a named export, or a read this cannot make sense of).
 *
 * `rewriteRegistryImports` binds a module once, `var __stxMod0 = …["id"]`, and
 * every use after it is `__stxMod0["name"]` (`.default` for a default import),
 * so the names are read off the code that was emitted. A page serves one
 * registry for every script it will ever run, so only a host that builds a
 * registry for fixed code (a native route) can use it to leave names out.
 */
export function registeredModuleNamesIn(...sources: Array<string | null | undefined>): Map<string, Set<string> | null> {
  const result = new Map<string, Set<string> | null>()
  const read = (id: string, names: Iterable<string> | null): void => {
    const current = result.get(id)
    if (current === null) return
    if (names === null) {
      result.set(id, null)
      return
    }
    const into = current ?? new Set<string>()
    for (const name of names) into.add(name)
    result.set(id, into)
  }
  for (const source of sources) {
    if (!source || !source.includes('__stxModules['))
      continue
    // `var __stxMod0 = globalThis.__stxModules && globalThis.__stxModules["id"]`.
    // Several bundles are concatenated into one script and each numbers its
    // bindings from 0, so a name means the id of the binding before it.
    const bindings: Array<{ variable: string, id: string, start: number, end: number }> = []
    for (const match of source.matchAll(/([\w$]+)\s*=\s*globalThis\.__stxModules\s*&&\s*globalThis\.__stxModules\["((?:[^"\\]|\\.)*)"\]/g)) {
      let id: string
      try {
        id = JSON.parse(`"${match[2]}"`) as string
      }
      catch {
        continue
      }
      bindings.push({ variable: match[1]!, id, start: match.index! + match[0].length, end: source.length })
    }
    const total = source.match(/__stxModules\["(?:[^"\\]|\\.)*"\]/g)?.length ?? 0
    if (bindings.length === 0 || total !== bindings.length) {
      for (const id of registeredModuleIdsIn(source)) read(id, null)
      continue
    }
    for (const [at, binding] of bindings.entries()) {
      const next = bindings.slice(at + 1).find(other => other.variable === binding.variable)
      binding.end = next ? next.start : source.length
    }
    for (const binding of bindings) {
      const names = new Set<string>()
      let whole = false
      const escaped = binding.variable.replace(/[$]/g, '\\$&')
      const region = source.slice(binding.start, binding.end)
      for (const use of region.matchAll(new RegExp(`(?<![\\w$.])${escaped}(?![\\w$])`, 'g'))) {
        const rest = region.slice(use.index! + binding.variable.length, use.index! + binding.variable.length + 200)
        const named = /^\s*\[\s*(["'])([A-Za-z_$][\w$]*)\1\s*\]/.exec(rest) ?? /^\s*\.\s*([A-Za-z_$][\w$]*)/.exec(rest)
        if (named) {
          names.add(named[named.length - 1]!)
          continue
        }
        // The check that the binding found its module.
        if (/^\s*[!=]==?\s*(?:undefined|void 0)\b/.test(rest))
          continue
        whole = true
        break
      }
      read(binding.id, whole ? null : names)
    }
  }
  return result
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
  options: {
    minify?: boolean
    /**
     * What each module is read for (`registeredModuleNamesIn`). A module with
     * names is registered with those alone, so the build leaves out the rest
     * of what it exports and whatever only that needed. Only for a registry
     * built for fixed code: a page's registry serves scripts it has not seen.
     */
    names?: RegistryNames
    /**
     * Receives the files the registry was built from - the modules' own
     * sources, `node_modules` included. The registry is inlined into the
     * page, so the page depends on them; a caller caching the page has to
     * know, or upgrading a package leaves the page serving the old one.
     */
    collectInputs?: string[]
  } = {},
): Promise<string | null> {
  if (ids.length === 0)
    return null

  // Ids are encoded against process.cwd() by the bundler; decode the same way.
  const root = process.cwd()
  const entryFor = (names: RegistryNames | undefined): string => {
    const imports: string[] = []
    const registrations: string[] = []
    ids.forEach((id, index) => {
      const specifier = id.startsWith('npm:') ? id.slice(4) : path.resolve(root, id)
      const local = `__stxRegistered${index}`
      const key = JSON.stringify(id)
      const wanted = names?.get(id)
      if (wanted && [...wanted].every(name => /^[A-Za-z_$][\w$]*$/.test(name))) {
        const list = [...wanted].sort()
        const bindings = list.map((name, at) => `${name} as ${local}_${at}`)
        imports.push(list.length > 0
          ? `import { ${bindings.join(', ')} } from ${JSON.stringify(specifier)};`
          : `import ${JSON.stringify(specifier)};`)
        const getters = list.map((name, at) => `get ${JSON.stringify(name)}() { return ${local}_${at}; }`).join(', ')
        registrations.push(`if (!globalThis.__stxModules[${key}]) globalThis.__stxModules[${key}] = { ${getters} };`)
        return
      }
      imports.push(`import * as ${local} from ${JSON.stringify(specifier)};`)
      registrations.push(`if (!globalThis.__stxModules[${key}]) globalThis.__stxModules[${key}] = ${local};`)
    })
    return [
      ...imports,
      'globalThis.__stxModules = globalThis.__stxModules || {};',
      ...registrations,
    ].join('\n')
  }
  let entry = entryFor(options.names)

  let code: string
  try {
    const { bundleClientScript } = await import('./client-script-bundler')
    // Inline, not externalised: this bundle is where the modules actually live.
    const bundle = (): Promise<string> => bundleClientScript(entry, path.join(root, '.stx-module-registry.ts'), {
      projectRoot: root,
      minify: options.minify,
      externalizeUserModules: false,
      collectInputs: options.collectInputs,
      throwOnFailure: true,
    })
    try {
      code = await bundle()
    }
    catch (error) {
      // A name read that the module does not export (a type, a re-export the
      // build cannot follow) fails only the narrowed build: serve the modules whole.
      if (!options.names) throw error
      entry = entryFor(undefined)
      code = await bundle()
    }
  }
  catch (error) {
    // Said in the browser too, where the failure shows. Without it every
    // module on the page reports only that it "is not registered", which
    // names the symptom on each one and the cause on none - a module the
    // registry imports that cannot run in a browser (a Node builtin, say)
    // takes every other module down with it.
    const { formatBuildFailure } = await import('./build-message')
    const failure = formatBuildFailure(error)
    console.warn(`[stx] could not build the page module registry (#1957): ${failure}`)
    const message = `[stx] the page module registry did not build, so ${ids.join(', ')} cannot load (#1957): ${failure}`
    return `;console.error(${JSON.stringify(message)});`
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
