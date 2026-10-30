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
 * The source of a registry build: it imports each module by absolute path (or
 * package name) and stores it under its id. With `names`, a module that has
 * some is imported by those names alone, so the build leaves out the rest of
 * what it exports and whatever only that needed.
 */
function registryEntry(ids: string[], root: string, names: RegistryNames | undefined): string {
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
  let entry = registryEntry(ids, root, options.names)

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
      entry = registryEntry(ids, root, undefined)
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

/** One route's registry: the modules its scripts read, and what they are read for. */
export interface SharedRegistryRoute {
  name: string
  ids: string[]
  names?: RegistryNames
}

export interface SharedRegistries {
  /**
   * The modules more than one route reaches, each chunk a function expression
   * `function (__stxChunk) { … return exports }` by chunk name, run the first
   * time a route (or another chunk) asks for it with `__stxChunk(name)`, so
   * a module's code runs when a route that reaches it does, and once.
   */
  chunks: Map<string, string>
  /** Each route's registry script, which asks the runtime (`__stxNativeRuntime.chunk`) for its chunks. */
  routes: Map<string, string>
  /** The chunks each route runs, those they run in turn included, by route name. */
  reads: Map<string, string[]>
}

interface ParsedModule {
  /** The statements that bind what the file imports from other chunks. */
  reads: string
  /** The chunks it imports, in order. */
  chunks: string[]
  /** The chunks it imports when a call to `import()` runs, not before. */
  lazy: string[]
  /** The file without its chunk imports and its exports. */
  body: string
  /** What it exports: the local binding and the name it goes by. */
  exports: Array<[local: string, name: string]>
}

// `import { a as b } from "./chunk-x.js"`, `import * as ns from …`, `import "./chunk-x.js"`.
const CHUNK_IMPORT = /^import(?:[ \t]*(\{[^}]*\})[ \t]*from|[ \t]*\*[ \t]*as[ \t]+([\w$]+)[ \t]+from)?[ \t]*["']\.\/(chunk-[\w-]+)\.js["'][ \t]*;?[ \t]*$/gm
const MODULE_EXPORT = /^export\s*\{([^}]*)\}\s*;?[ \t]*$/gm
/** Bun's module-preload helpers, which a script has no use for. */
const PRELOAD_HELPERS = new Set(['__preload', '__chunks'])
const NAMED_SPECIFIER = /^("[^"]*"|[\w$]+)(?:\s+as\s+("[^"]*"|[\w$]+))?$/

/** A file of a split build as the pieces a script needs, or null if it has a form this does not handle. */
function parseSplitModule(text: string): ParsedModule {
  const chunks: string[] = []
  const reads: string[] = []
  let ok = true
  // A file that imports a chunk lazily carries a browser's module-preload
  // machinery (`<link rel="modulepreload">` from `import.meta.url`), defined in
  // one chunk and called from the others, which has no place in a script and
  // names the build's temporary files.
  const withoutPreload = text
    .replace(/^var __chunkGraphs;[\s\S]*?^var __chunks = [\s\S]*?^\};[ \t]*\n?/m, '')
    .replace(/^__chunks\(import\.meta\.url,[^\n]*\);[ \t]*\n?/gm, '')
  let body = withoutPreload.replace(CHUNK_IMPORT, (_all, named: string | undefined, namespace: string | undefined, chunk: string) => {
    const variable = `__stxChunkExports${chunks.length}`
    chunks.push(chunk)
    reads.push(`var ${variable} = __stxChunk(${JSON.stringify(chunk)});`)
    if (namespace) {
      reads.push(`var ${namespace} = ${variable};`)
    }
    else if (named) {
      for (const raw of named.slice(1, -1).split(',')) {
        const specifier = raw.trim()
        if (!specifier)
          continue
        const match = NAMED_SPECIFIER.exec(specifier)
        if (!match) {
          ok = false
          continue
        }
        if (PRELOAD_HELPERS.has(match[1]!))
          continue
        const imported = match[1]!.startsWith('"') ? JSON.parse(match[1]!) as string : match[1]!
        const local = match[2] ?? match[1]!
        if (local.startsWith('"')) {
          ok = false
          continue
        }
        reads.push(`var ${local} = ${variable}[${JSON.stringify(imported)}];`)
      }
    }
    return ''
  })
  if (!ok)
    throw new Error('an import it does not read')
  // `import("./chunk-x.js")`, which Bun prints as `(__preload("x"), import("./chunk-x.js"))`.
  const lazy: string[] = []
  body = body.replace(/\(\s*__preload\([^)]*\)\s*,\s*import\(\s*["']\.\/(chunk-[\w-]+)\.js["']\s*\)\s*\)|\bimport\(\s*["']\.\/(chunk-[\w-]+)\.js["']\s*\)/g, (_all, preloaded: string | undefined, plain: string | undefined) => {
    const chunk = (preloaded ?? plain)!
    lazy.push(chunk)
    return `Promise.resolve().then(function () { return __stxChunk(${JSON.stringify(chunk)}); })`
  })
  const exports: Array<[string, string]> = []
  body = body.replace(MODULE_EXPORT, (_all, list: string) => {
    for (const raw of list.split(',')) {
      const specifier = raw.trim()
      if (!specifier)
        continue
      const match = NAMED_SPECIFIER.exec(specifier)
      if (!match || match[1]!.startsWith('"')) {
        ok = false
        continue
      }
      if (PRELOAD_HELPERS.has(match[1]!))
        continue
      const name = match[2] ?? match[1]!
      exports.push([match[1]!, name.startsWith('"') ? JSON.parse(name) as string : name])
    }
    return ''
  })
  // Anything else a module can export, or a chunk import in a form not read above.
  const left = [/\bimport\.meta\b/, /\b__chunks\b/, /\b__preload\b/, /^\s*export\b/m, /\bfrom\s*["']\.\/chunk-/, /^\s*import\s*["']\.\/chunk-/m].find(pattern => pattern.test(body))
  if (!ok || left)
    throw new Error(`${left ? `${left.source} is left in it` : 'an export it does not read'}`)
  return { reads: reads.join('\n'), chunks, lazy, body, exports }
}

/**
 * Whether a source file exports a binding that changes after the module has
 * run (`export let count`, or `let count … export { count }` with an
 * assignment elsewhere). Another chunk reads each export once, as it starts,
 * so such a binding would be read stale; the files a build reads are checked,
 * as the bundler's output has lost which bindings were `let`.
 *
 * A file whose lines are very long (a library's minified dist) is not read
 * for its export list: its short names are reused all over it, and a name
 * match would call nearly every one mutable.
 */
export function exportsMutableBinding(source: string): boolean {
  if (/\bexport\s+(?:let|var)\b/.test(source))
    return true
  if (source.length / Math.max(1, source.split('\n').length) > 200)
    return false
  for (const list of source.matchAll(/\bexport\s*\{([^}]*)\}(?!\s*from\b)/g)) {
    for (const raw of list[1]!.split(',')) {
      const local = raw.trim().split(/\s+as\s+/)[0]!.trim()
      if (!/^[A-Za-z_$][\w$]*$/.test(local))
        continue
      const escaped = local.replace(/[$]/g, '\\$&')
      const declared = new RegExp(`(?<![\\w$.])(?:let|var)\\s+${escaped}(?![\\w$])`, 'g')
      if (!declared.test(source))
        continue
      const assignment = new RegExp(`(?<![\\w$.])${escaped}\\s*(?:=(?![=>])|[-+*/%&|^]=|\\*\\*=|<<=|>>>?=|&&=|\\|\\|=|\\?\\?=|\\+\\+|--)|(?:\\+\\+|--)\\s*${escaped}(?![\\w$])`, 'g')
      const declarations = new RegExp(`(?<![\\w$.])(?:let|var|const)\\s+${escaped}\\s*=`, 'g')
      if ((source.match(assignment)?.length ?? 0) > (source.match(declarations)?.length ?? 0))
        return true
    }
  }
  return false
}

/**
 * Build the registries of several routes together, so the modules more than
 * one of them reaches are in the output once (HQ: its 74 routes each carried
 * their own copy of the same 100 modules, 84% of every registry).
 *
 * A route's own registry is still a script of its own; the modules routes
 * share become chunks, which belong in the runtime they all evaluate first
 * (`__stxNativeRuntime.chunks`). A chunk runs when a route that reaches it
 * first asks for it, in the order ES modules would run, so a module's code
 * runs in a route exactly when it would have in a registry built for that
 * route alone, and once.
 *
 * Returns null when the output has a form this does not handle (a cycle
 * between chunks, an exported binding that changes after it is read, a build
 * error): the caller builds each route's registry alone instead.
 */
export async function buildSharedModuleRegistries(
  routes: SharedRegistryRoute[],
  options: { collectInputs?: string[] } = {},
): Promise<SharedRegistries | null> {
  const wanted = routes.filter(route => route.ids.length > 0)
  if (wanted.length === 0)
    return { chunks: new Map(), routes: new Map(), reads: new Map() }
  const root = process.cwd()
  try {
    const { bundleClientEntriesSplit } = await import('./client-script-bundler')
    const inputs: string[] = []
    const split = await bundleClientEntriesSplit(
      new Map(wanted.map(route => [route.name, registryEntry(route.ids, root, route.names)])),
      { projectRoot: root, filePath: path.join(root, '.stx-module-registry.ts'), collectInputs: inputs },
    )
    options.collectInputs?.push(...inputs)
    const { transformAutoImports, generateAutoImportDestructuring } = await import('./client-script')
    const { transformStoreImports } = await import('./store-imports')

    const parsed = new Map<string, ParsedModule>()
    for (const [name, text] of [...split.chunks, ...split.entries]) {
      try {
        parsed.set(name, parseSplitModule(text))
      }
      catch (error) {
        throw new Error(`cannot read ${name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    // The chunks hand each export over once, as the chunk that imports it
    // starts: a lazily initialised module (`__esm`) or a binding that changes
    // later would be read before it is made, or stale.
    for (const [name, text] of [...split.chunks, ...split.entries]) {
      if (/\b__esm\(/.test(text))
        throw new Error(`${name} initialises a module lazily`)
    }
    for (const input of inputs) {
      if (/\.(?:[cm]?[jt]sx?)$/.test(input) && exportsMutableBinding(await Bun.file(input).text()))
        throw new Error(`${input} exports a binding that changes after it is read`)
    }
    // The chunks form a graph that must have no cycle: a chunk that is
    // reached while it runs would hand out exports it has not made yet.
    const visiting = new Set<string>()
    const settled = new Set<string>()
    const visit = (name: string): void => {
      if (settled.has(name))
        return
      if (visiting.has(name))
        throw new Error(`the chunks import each other (${name})`)
      visiting.add(name)
      for (const dependency of parsed.get(name)?.chunks ?? []) {
        if (!parsed.has(dependency))
          throw new Error(`${name} imports ${dependency}, which was not built`)
        visit(dependency)
      }
      for (const dependency of parsed.get(name)?.lazy ?? []) {
        if (!parsed.has(dependency))
          throw new Error(`${name} imports ${dependency}, which was not built`)
      }
      visiting.delete(name)
      settled.add(name)
    }
    for (const name of parsed.keys())
      visit(name)

    // The modules may import from `stx` or `@stores` / `@composables`: they
    // get the treatment a component script gets after bundling.
    const wrap = (module: ParsedModule): { prelude: string, body: string } => {
      const autoImports = transformAutoImports(module.body)
      return {
        prelude: generateAutoImportDestructuring(autoImports.stxImports, autoImports.browserImports),
        body: transformStoreImports(autoImports.code),
      }
    }
    const chunks = new Map<string, string>()
    for (const name of split.chunks.keys()) {
      const module = parsed.get(name)!
      const { prelude, body } = wrap(module)
      const getters = module.exports.map(([local, exported]) => `get ${JSON.stringify(exported)}() { return ${local}; }`).join(', ')
      chunks.set(name, `function (__stxChunk) {\n${prelude}\n${module.reads}\n${body}\nreturn { ${getters} };\n}`)
    }
    const scripts = new Map<string, string>()
    const reads = new Map<string, string[]>()
    for (const name of split.entries.keys()) {
      const module = parsed.get(name)!
      const { prelude, body } = wrap(module)
      scripts.set(name, `;(function() {\nvar __stxChunk = function (name) { return globalThis.__stxNativeRuntime.chunk(name); };\n${prelude}\n${module.reads}\n${body}\n})();`)
      const reached = new Set<string>()
      const reach = (chunk: string): void => {
        if (reached.has(chunk))
          return
        reached.add(chunk)
        const next = parsed.get(chunk)!
        for (const dependency of [...next.chunks, ...next.lazy])
          reach(dependency)
      }
      for (const chunk of [...module.chunks, ...module.lazy])
        reach(chunk)
      reads.set(name, [...reached].sort())
    }
    return { chunks, routes: scripts, reads }
  }
  catch (error) {
    const { formatBuildFailure } = await import('./build-message')
    console.warn(`[stx] could not share the native routes' modules, building each route's alone: ${formatBuildFailure(error)}`)
    return null
  }
}
