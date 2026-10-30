/**
 * Client Script Bundler
 *
 * Uses Bun.build to resolve and bundle imports in `<script client>` blocks.
 * Only activates when real user imports are detected (local files, npm packages).
 * stx runtime, @stores, and @composables are marked as external — handled
 * by existing auto-import and store-import transforms.
 *
 * @module client-script-bundler
 */

import { extractExports as scopeExports } from './client-scope-bindings'
import path from 'node:path'
import fs from 'node:fs' // kept for mkdir/rmSync (no Bun equivalent for dir ops)
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { BunPlugin } from 'bun'
import type { BuildFailureDetail } from './build-message'
import { getPublicEnvDefine } from './public-env'
import { stateDir } from './state-dir'
import { cacheEngineFingerprint } from './engine-fingerprint'
import { describeBuildFailure, formatBuildFailure } from './build-message'
import { config, loadStxConfig } from './config'
import { isServerApiSource, type ServerApiOptions } from './server-api'
import type { DepSnapshot } from './render-memo'
import { depsUnchanged, renderMemo, snapshotDeps } from './render-memo'
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'

// 7: bundles written on Bun 1.3 before normalizeRegistrySpecifiers kept their
// imports raw, and the cache served them after the fix — the upgrade looked
// like it had changed nothing. A new version is the only thing that retires
// them, because the key is the source and that did not change.
// 8: server API sources must not survive in an older browser bundle cache.
// 11: bundle namespaces preserve live exports assigned by lifecycle hooks.
const BUNDLE_CACHE_VERSION = 11

function isPrivateClientSource(file: string, root: string, serverApi: boolean | ServerApiOptions | undefined): boolean {
  return /^(?:(?:stx|ui)\.config\.[cm]?[jt]s|runtime-config-(?:server|loader)\.[cm]?[jt]s)$/.test(path.basename(file))
    || isServerApiSource(file, root, serverApi)
}
// 2: inputs recorded relative to the project, with their size and content
// hash, so the cache survives a move to another directory (a deploy's next
// release) instead of starting cold in every one.
const BUNDLE_CACHE_METADATA_VERSION = 2

/** An input as the sidecar keeps it: portable across project directories. */
interface CachedInput {
  /** Relative to the project root when `inRoot`, absolute otherwise. */
  path: string
  inRoot?: true
  mtimeMs: number
  size: number
  hash: string
}

interface BundleCacheMetadata {
  metadataVersion: number
  files: CachedInput[]
}

/**
 * Where the bundle cache lives. `STX_BUNDLE_CACHE_DIR` puts it outside the
 * project, so a deploy that unpacks every release into a new directory can
 * share one cache between them; the entries are portable (see `CachedInput`).
 */
export function bundleCacheDir(projectRoot: string): string {
  const shared = process.env.STX_BUNDLE_CACHE_DIR?.trim()
  return shared ? path.resolve(shared) : stateDir(projectRoot, 'bundle-cache')
}

/**
 * `text` with the project root written as a marker, so two copies of a project
 * key alike. Both spellings of the root: the path it was reached by and the
 * real one, which differ through a symlink (macOS's /var -> /private/var).
 */
function withoutProjectRoot(text: string, projectRoot: string): string {
  let result = text
  for (const root of projectRootSpellings(projectRoot)) {
    if (root !== path.sep)
      result = result.split(root).join('\0root')
  }
  return result
}

const rootSpellings = new Map<string, string[]>()

function projectRootSpellings(projectRoot: string): string[] {
  const resolved = path.resolve(projectRoot)
  let spellings = rootSpellings.get(resolved)
  if (!spellings) {
    let real = resolved
    try {
      real = fs.realpathSync(resolved)
    }
    catch {}
    // Longest first, so one spelling never leaves half of another behind.
    spellings = [...new Set([resolved, real])].sort((a, b) => b.length - a.length)
    rootSpellings.set(resolved, spellings)
  }
  return spellings
}

function cachedInput(file: string, projectRoot: string): CachedInput | null {
  try {
    const stat = fs.statSync(file)
    const root = path.resolve(projectRoot)
    const inRoot = file.startsWith(`${root}${path.sep}`)
    return {
      path: inRoot ? path.relative(root, file) : file,
      ...(inRoot ? { inRoot: true as const } : {}),
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      hash: Bun.hash(fs.readFileSync(file)).toString(36),
    }
  }
  catch {
    return null
  }
}

function resolveCachedInput(input: CachedInput, projectRoot: string): string {
  return input.inRoot ? path.join(path.resolve(projectRoot), input.path) : input.path
}

/**
 * Whether every input still holds what the bundle was built from. The mtime
 * settles it when it matches; when it does not (the same file unpacked into a
 * new release, a fresh checkout), the content does. A missing input counts
 * as changed.
 */
function cachedInputsUnchanged(inputs: CachedInput[], projectRoot: string): boolean {
  for (const input of inputs) {
    const file = resolveCachedInput(input, projectRoot)
    try {
      const stat = fs.statSync(file)
      if (stat.size !== input.size)
        return false
      if (stat.mtimeMs !== input.mtimeMs && Bun.hash(fs.readFileSync(file)).toString(36) !== input.hash)
        return false
    }
    catch {
      return false
    }
  }
  return true
}

/**
 * What each host file's client bundle was built from.
 *
 * The bundle cache re-validates its own inputs (#1723), so an edit to an
 * imported helper always produces a fresh bundle. That is not enough on its
 * own: the SSG caches the *rendered page* a level above, keyed on the `.stx`
 * file and the dependencies collected while rendering it - which are the
 * `@include`d partials and nothing else. A page whose `<script client>`
 * imports a helper therefore stayed cached when the helper changed, the
 * bundler was never asked, and the build reported "Cached: 306" while serving
 * the previous build's JavaScript.
 *
 * That is a bad failure to debug, because everything downstream looks correct:
 * the source is right, the build is green, and the browser is running code
 * that no longer exists on disk.
 *
 * So the bundler publishes what it resolved, and the SSG folds it into the
 * dependency list it already keeps. Recorded on a cache hit as well as a fresh
 * build - a cache hit is exactly when the SSG most needs to know, because
 * nothing else in that path touches the helper.
 */
const bundleInputs = new Map<string, string[]>()

/** Every file the client bundle for `filePath` was built from. */
/**
 * Keep the bundle cache from growing forever.
 *
 * Every distinct `(source, host file)` pair gets its own `{hash}.js` and
 * `{hash}.deps.json`, and nothing ever removed the ones that stopped being
 * reachable. A cache entry is only useful while some file still hashes to it,
 * so editing a `<script client>` in a loop leaves one dead pair behind per
 * edit. On the app this was written for that reached 5,895 files and 2.2GB -
 * enough to fill the disk and stop the build with ENOSPC, which reads as a
 * machine problem rather than a cache that was never swept.
 *
 * By modified time rather than by reachability, because reachability is not
 * knowable from here: this process only sees the pages it happens to build,
 * and a partial build would evict everything it did not touch. Time is a
 * proxy, and the entries this keeps are the ones something asked for most
 * recently.
 *
 * Swept on the first write to a cache and every `SWEEP_EVERY` writes after,
 * per directory. Not once per process: a dev server writes bundles for hours,
 * and a single sweep at startup would let it grow unbounded for the rest of
 * the run - which is the same bug with a longer fuse. Counting per directory
 * rather than globally so one project's builds cannot postpone another's
 * sweep. Growth is bounded at the limit plus one sweep interval.
 *
 * The cost is one `readdir` and a sort, which is why it is not on every write.
 */
const SWEEP_EVERY = 100

/**
 * How many bundles a cache keeps: `STX_BUNDLE_CACHE_LIMIT`, or 2000.
 *
 * It was 600. HQ's 152 static pages alone use 498 distinct bundles, and with
 * its dynamic pages and signed-in variants a full warm-up needs more than 600:
 * a pass over a working set bigger than the cache evicts each entry shortly
 * before it is needed again, so an unchanged release rebuilt nearly every
 * bundle. 2000 keeps a large site's set with room for a release's changes
 * (an entry is a few hundred KB).
 */
export function bundleCacheEntryLimit(env: Record<string, string | undefined> = process.env): number {
  const configured = Number(env.STX_BUNDLE_CACHE_LIMIT)
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 2000
}

const writesSinceSweep = new Map<string, number>()

async function pruneBundleCache(cacheDir: string): Promise<void> {
  const since = writesSinceSweep.get(cacheDir) ?? 0

  if (since > 0 && since < SWEEP_EVERY) {
    writesSinceSweep.set(cacheDir, since + 1)
    return
  }

  writesSinceSweep.set(cacheDir, 1)

  try {
    const names = (await fs.promises.readdir(cacheDir)).filter(name => name.endsWith('.js'))

    const limit = bundleCacheEntryLimit()
    if (names.length <= limit)
      return

    const entries = await Promise.all(names.map(async (name) => {
      try {
        return { name, at: (await fs.promises.stat(path.join(cacheDir, name))).mtimeMs }
      }
      catch {
        return null
      }
    }))

    const alive = entries.filter((entry): entry is { name: string, at: number } => entry !== null)
    alive.sort((a, b) => b.at - a.at)

    for (const entry of alive.slice(limit)) {
      const base = entry.name.slice(0, -3)

      // The sidecar goes with it. Left behind, it is a dependency list for a
      // bundle that no longer exists.
      await fs.promises.rm(path.join(cacheDir, `${base}.js`), { force: true })
      await fs.promises.rm(path.join(cacheDir, `${base}.deps.json`), { force: true })
    }

    logBundlerDiagnostic('pruned bundle cache to', limit, 'entries')
  }
  catch {
    // A cache that cannot be swept is not a reason to fail a build.
  }
}

export function clientBundleDependencies(filePath: string): string[] {
  return bundleInputs.get(filePath) ?? []
}

function recordBundleInputs(filePath: string, files: string[]): void {
  if (filePath)
    bundleInputs.set(filePath, files)
}

export function shouldLogBundlerDiagnostics(
  environment: { STX_DEBUG?: string } = process.env as { STX_DEBUG?: string },
): boolean {
  return environment.STX_DEBUG === 'true' || environment.STX_DEBUG === '1'
}

function logBundlerDiagnostic(...message: unknown[]): void {
  if (shouldLogBundlerDiagnostics())
    console.log('[stx:bundler]', ...message)
}

/**
 * Client-script bundle failures recorded during the current process.
 *
 * When a `<script client>` block fails to bundle, the bundler falls back to
 * shipping the ORIGINAL, unbundled source so the page still renders. That is a
 * reasonable dev-server behaviour and a terrible build behaviour: imports never
 * resolve, bindings silently do nothing, and `stx build` still exited 0, so CI
 * published a broken page as a success.
 *
 * Nothing was counting these. `ssg.failedCount` only ever saw render-time throws,
 * never a bundle failure, because the fallback swallowed it and returned a
 * string. The registry gives the build a way to ask, without the bundler having
 * to know whether it is running under a dev server or a build. See #1884.
 */
export interface BundleFailure {
  filePath: string
  message: string
  /**
   * The same failure with its position intact, for a dev-server overlay to
   * draw a code frame from. Absent only when the thrower gave no position.
   */
  details?: BuildFailureDetail[]
}

const _bundleFailures: BundleFailure[] = []

/** Record a bundle failure. Called from the bundler's fallback path. */
export function recordBundleFailure(
  filePath: string,
  message: string,
  details?: BuildFailureDetail[],
): void {
  _bundleFailures.push({ filePath: filePath || '<inline>', message, details })
}

/** Every bundle failure since the last reset. */
export function getBundleFailures(): BundleFailure[] {
  return _bundleFailures.slice()
}

/** Drop recorded failures — call at the start of a build, and in tests. */
export function clearBundleFailures(): void {
  _bundleFailures.length = 0
}

/** What to do when a client script will not bundle. */
export type BundlerFallbackMode = 'warn' | 'error'

let _fallbackOverride: BundlerFallbackMode | undefined

/**
 * Override the configured fallback mode, for tests and embedders.
 *
 * Pass `undefined` to go back to reading `strict.bundlerFallback` from config.
 */
export function setBundlerFallbackMode(mode: BundlerFallbackMode | undefined): void {
  _fallbackOverride = mode
}

/**
 * The effective fallback mode.
 *
 * Read lazily rather than captured at import time: config is loaded after this
 * module is first imported, so a value read at import time is always the
 * default.
 */
export function resolveBundlerFallback(): BundlerFallbackMode {
  if (_fallbackOverride)
    return _fallbackOverride
  try {
    // `strict` is `boolean | StrictModeConfig`; only the object form carries a
    // fallback mode. `strict: true` means "validate DOM usage", not "refuse an
    // unbundled script", so it must not be read as one.
    const strict = (config as { strict?: boolean | { bundlerFallback?: BundlerFallbackMode } }).strict

    return typeof strict === 'object' && strict !== null
      ? strict.bundlerFallback ?? 'warn'
      : 'warn'
  }
  catch {
    // Config not loaded yet, or unreadable. The fallback is the safe default.
    return 'warn'
  }
}

// Known imports that are NOT user imports — handled by other transforms.
//
// `@stacksjs/browser` is deliberately NOT here. It used to be, on the grounds
// that its symbols are auto-imported from `window.StacksBrowser`, but that
// conflates two different things:
//
//   - No import statement at all, symbol used bare. That IS the auto-import
//     path, and it still resolves off the runtime global.
//   - `import { thing } from '@stacksjs/browser'`. The author named a module
//     and asked for one binding from it.
//
// Treating the second case as external dropped the import and left the page
// calling a function nothing defined — but only for bindings the runtime
// global happened not to expose, so it broke silently and selectively. It is
// an ordinary installed package; an explicit import of it gets bundled like
// any other.
//
// `stx` and `@stacksjs/stx` stay external because they genuinely are the
// injected runtime rather than a package to bundle.
const EXTERNAL_PATTERNS = [
  /^stx$/,
  /^@stacksjs\/stx$/,
  /^@stores$/,
  /^stx\/stores$/,
  /^@composables$/,
]

/**
 * Check if a script has user imports that need Bun.build bundling.
 *
 * Returns false for:
 * - `import type { ... }` (type-only — stripped by TS transpiler)
 * - `import { ... } from 'stx'` (auto-imported from window.stx)
 * - `import '@stacksjs/browser'` (the framework-injected module bootstrap)
 * - `import { ... } from '@stores'` (handled by transformStoreImports)
 * - `import { ... } from '@composables'` (handled by transformStoreImports)
 */
export function hasUserImports(code: string): boolean {
  // Check each value import. The declaration body is deliberately multiline:
  // formatters commonly expand a named import list across several lines.
  // The old `.*?` stopped at the first newline, so those valid imports skipped
  // bundling and leaked into a classic browser script.
  const fullImportRegex = /^[ \t]*import[ \t]+(?!type(?:[ \t]|{))[\s\S]*?\s+from\s+['"]([^'"]+)['"][ \t]*;?/gm
  let match: RegExpExecArray | null
  while ((match = fullImportRegex.exec(code)) !== null) {
    const source = match[1]
    const isExternal = EXTERNAL_PATTERNS.some(p => p.test(source))
    if (!isExternal) {
      logBundlerDiagnostic('detected user import:', source)
      return true
    }
  }

  // Also check for bare `import 'module'` (side-effect imports).
  // `.css` side-effect imports are handled by the vendor-CSS extractor in
  // `client-script.ts` BEFORE bundling and stripped from the code we see
  // here. Belt-and-suspenders: filter them out anyway so a future caller
  // that bypasses the extractor can't trip Bun.build with an unsupported
  // loader. The `?inline`/`?raw` query suffix is tolerated to match how
  // bundlers conventionally disambiguate CSS variants.
  // Bun's transpiler prints one with no space (`import"./steps";`), so the
  // space is optional here and in every later pass that reads these.
  const sideEffectRegex = /^[ \t]*import[ \t]*['"]([^'"]+)['"]/gm
  while ((match = sideEffectRegex.exec(code)) !== null) {
    const source = match[1]
    if (/\.css(?:\?.*)?$/.test(source))
      continue
    const isExternal = EXTERNAL_PATTERNS.some(p => p.test(source))
    if (!isExternal) {
      logBundlerDiagnostic('detected side-effect import:', source)
      return true
    }
  }

  return false
}

/**
 * Specifier prefix for an import the PAGE serves rather than the bundle
 * inlines (stacksjs/stx#1957).
 *
 * Every component's `<script client>` used to be bundled with its imports
 * inlined, one Bun.build per script. Two components importing one module each
 * carried their own copy of it, so module state -- a cache, a registry, an
 * in-flight promise -- existed once per component instead of once per page,
 * and the page shipped the same code several times. A real page made five
 * `GET /api/me` calls on load because its auth module had five copies.
 *
 * A component's direct imports are now externalised to `stx-module:<id>` and
 * rewritten into reads of `globalThis.__stxModules`, which one page-level
 * bundle populates (see client-module-registry.ts): each imported module is
 * bundled once and evaluated once per page.
 *
 * The id is the path relative to the project root, or `npm:<specifier>` for a
 * package. Never an absolute path: that would put the server's filesystem
 * layout into every page's HTML.
 */
export const MODULE_SPECIFIER_PREFIX = 'stx-module:'

/** What the registry serves: JS/TS and JSON. Anything else stays inlined. */
const REGISTRY_MODULE_EXTENSION = /\.(?:[cm]?[jt]sx?|json)$/i

export function registryIdForPath(projectRoot: string, resolved: string): string {
  return path.relative(projectRoot, resolved).split(path.sep).join('/')
}

/**
 * Put the `stx-module:` specifier back on imports Bun printed with the one the
 * source was written with.
 *
 * The plugin sends a direct import to the registry by resolving it to
 * `{ path: "stx-module:<id>", external: true }`. Bun 1.4 prints that path in
 * the bundle; Bun 1.3 prints the ORIGINAL specifier (`./first`,
 * `@stacksjs/mobile`) instead. rewriteRegistryImports only recognises the
 * former, so on 1.3 every import survived as a bare ES import inside a
 * classic `<script>` — "Cannot use import statement outside a module", and a
 * page where nothing hydrated. The plugin records what it resolved, keyed by
 * the specifier as written, and this maps each such import onto its registry
 * specifier, so the output is the same whichever form Bun printed.
 *
 * Only import statements are touched, and only specifiers the plugin itself
 * sent to the registry: an import it left alone (stx, a store, a browser URL)
 * keeps the form the later passes expect.
 */
export function normalizeRegistrySpecifiers(code: string, registered: ReadonlyMap<string, string>): string {
  if (registered.size === 0)
    return code
  return code.replace(
    /^([ \t]*import(?:(?:\s+|(?=[{*]))[^;"']*?\s*from\s*|\s*))(["'])([^"']+)\2/gm,
    (whole, head: string, quote: string, spec: string) => {
      const target = registered.get(spec)
      return target && !spec.startsWith(MODULE_SPECIFIER_PREFIX) ? `${head}${quote}${target}${quote}` : whole
    },
  )
}

/**
 * Rewrite each `import … from "stx-module:<id>"` Bun left in a bundle into
 * reads of the page registry, returning the declarations to put at the top
 * of the bundle's scope. The page collects the ids it has to serve by scanning
 * for these reads, so their shape -- `globalThis.__stxModules["<id>"]` -- is a
 * contract with client-module-registry.ts.
 *
 * A missing entry throws with the id named: a component whose module never
 * loaded should fail at its first line, not later with an undefined binding.
 */
export function rewriteRegistryImports(code: string, reads: string[]): string {
  let counter = 0
  const moduleVar = (id: string): string => {
    const name = `__stxMod${counter++}`
    const key = JSON.stringify(id)
    reads.push(
      `var ${name} = globalThis.__stxModules && globalThis.__stxModules[${key}];`,
      `if (${name} === undefined) throw new Error("[stx] module " + ${JSON.stringify(key)} + " is not registered on this page (#1957)");`,
    )
    return name
  }
  const bindNamed = (list: string, mod: string): void => {
    for (const raw of list.split(',')) {
      const part = raw.trim()
      if (!part)
        continue
      const match = part.match(/^("(?:[^"\\]|\\.)*"|[\w$]+)(?:\s+as\s+([\w$]+))?$/)
      if (!match)
        continue
      const imported = match[1].startsWith('"') ? JSON.parse(match[1]) as string : match[1]
      const local = match[2] ?? imported
      reads.push(`var ${local} = ${mod}[${JSON.stringify(imported)}];`)
    }
  }

  code = code.replace(/^[ \t]*import(?:\s+|(?=[{*]))([^;"']+?)\s*from\s*["'](stx-module:[^"']+)["'];?[ \t]*$/gm, (_all, rawClause: string, spec: string) => {
    const id = spec.slice(MODULE_SPECIFIER_PREFIX.length)
    const mod = moduleVar(id)
    let clause = rawClause.trim()
    const leadingDefault = clause.match(/^([\w$]+)\s*(?:,\s*|$)/)
    if (leadingDefault && !clause.startsWith('{') && !clause.startsWith('*')) {
      reads.push(`var ${leadingDefault[1]} = ${mod}.default;`)
      clause = clause.slice(leadingDefault[0].length).trim()
    }
    const namespace = clause.match(/^\*\s*as\s+([\w$]+)$/)
    if (namespace)
      reads.push(`var ${namespace[1]} = ${mod};`)
    else if (clause.startsWith('{'))
      bindNamed(clause.replace(/^\{|\}$/g, ''), mod)
    return ''
  })
  // A side-effect import: the page bundle already evaluated it, so only the
  // presence check is emitted.
  code = code.replace(/^[ \t]*import\s*["'](stx-module:[^"']+)["'];?[ \t]*$/gm, (_all, spec: string) => {
    moduleVar(spec.slice(MODULE_SPECIFIER_PREFIX.length))
    return ''
  })
  return code
}

/**
 * The file an import specifier actually names, or undefined.
 *
 * A specifier rarely carries its extension, so the bare path is tried first
 * and then the standard JS/TS ones, then `index.*` for a directory. Shared by
 * the relative and absolute resolvers so both agree on what "this module
 * exists" means — they disagreed once, and an absolute path to a real module
 * was silently externalised.
 */
function probeModuleFile(basePath: string): string | undefined {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.jsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ]

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate, { throwIfNoEntry: false })?.isFile())
        return candidate
    }
    catch {}
  }

  return undefined
}

interface ModuleSubstitutes {
  modules: ReadonlyMap<string, string>
  key: string
}
const moduleSubstitutes = new AsyncLocalStorage<ModuleSubstitutes>()

/**
 * Bundle the client scripts `run` builds with some modules standing in for
 * others: `modules` maps a module's absolute path to the JavaScript bundled
 * in its place. The native compiler uses it to leave each language's
 * messages out of route files (`compileNativeBundle`'s `messages`), for the
 * screens', components' and composables' scripts alike. Scoped to `run`'s
 * own async work, so a build beside it bundles the real modules, and part of
 * every cache key below, so neither build is ever served the other's code.
 */
export function withModuleSubstitutes<T>(modules: ReadonlyMap<string, string>, run: () => Promise<T>): Promise<T> {
  const hasher = new Bun.CryptoHasher('md5')
  for (const [file, contents] of [...modules].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
    hasher.update(`${file}\0${contents}\0`)
  return moduleSubstitutes.run({ modules, key: hasher.digest('hex').slice(0, 12) }, run)
}

/** The substitutes in force (`withModuleSubstitutes`), as part of a cache key: empty with none. */
export function moduleSubstitutionKey(): string {
  return moduleSubstitutes.getStore()?.key ?? ''
}

/**
 * Create the Bun.build plugin that marks stx/stores as external,
 * resolves @/ paths to the project root, and — critically — rebases
 * `./` and `../` imports against the original `<script client>`
 * file's directory rather than the temp entry file's directory.
 *
 * Without the relative-import rebase, every `import { useFoo } from
 * '../../functions/foo'` in a feature page fails to resolve at
 * bundle time because the temp entry file lives under the state
 * directory's `bundle-tmp/`, not next to the page source.
 */
function createBundlePlugin(
  projectRoot: string,
  templateDir: string,
  tmpEntry: string,
  entrySource: string,
  inputFiles: Set<string>,
  externalizeUserModules: boolean,
  registrySpecifiers: Map<string, string> = new Map(),
  serverApi?: boolean | ServerApiOptions,
  substitutes?: ReadonlyMap<string, string>,
): BunPlugin {
  // A direct import of the script being bundled goes to the page registry
  // instead of being inlined (#1957). Only the ENTRY's imports: the modules
  // themselves are never loaded here, so nothing transitive reaches this.
  // Still recorded as an input so HMR keeps watching the file.
  const toRegistry = (importer: string, resolved: string, specifier: string): { path: string, external: true } | null => {
    // Let onLoad reject it now, rather than externalizing a private endpoint
    // into a later registry build with a potentially different project root.
    if (isPrivateClientSource(resolved, projectRoot, serverApi))
      return null
    if (!externalizeUserModules || importer !== tmpEntry || !REGISTRY_MODULE_EXTENSION.test(resolved))
      return null
    try {
      if (!fs.statSync(resolved, { throwIfNoEntry: false })?.isFile())
        return null
    }
    catch {
      return null
    }
    inputFiles.add(resolved)
    // Encoded against process.cwd(), not projectRoot: the page registry
    // decodes ids against the same root, and callers do not all agree on
    // projectRoot. Every caller passes cwd today; pinning it here makes the
    // pair correct even if one stops.
    const registryPath = `${MODULE_SPECIFIER_PREFIX}${registryIdForPath(process.cwd(), resolved)}`
    // What the source wrote, for the Bun versions that print it instead of
    // the path returned here (see normalizeRegistrySpecifiers).
    registrySpecifiers.set(specifier, registryPath)
    return { path: registryPath, external: true }
  }

  // Resolve a relative import against `templateDir`, returning the
  // first existing file with one of the standard JS/TS extensions or
  // an `index.{ts,js}` fallback. Falls back to the bare path so
  // Bun.build can surface a normal "module not found" if nothing
  // matches.
  const resolveRelative = (importer: string, request: string): string => {
    // The temp entry's importer is itself, so any `./x` from the
    // page-originated body should resolve from `templateDir`. For
    // imports inside a transitively-bundled module we honor the
    // module's own dirname — only the entry's relatives get rebased.
    const fromDir = importer === tmpEntry ? templateDir : path.dirname(importer)
    const resolved = path.resolve(fromDir, request)
    return probeModuleFile(resolved) ?? resolved
  }

  return {
    name: 'stx-client-bundle',
    setup(build) {
      // stx runtime — external, handled by auto-import destructuring.
      // `@stacksjs/browser` is not listed: see EXTERNAL_PATTERNS above for why
      // an explicit import of it is bundled rather than left to the runtime.
      build.onResolve({ filter: /^(stx|@stacksjs\/stx)$/ }, (args) => ({
        path: args.path,
        external: true,
      }))

      // Stores/composables — external, handled by transformStoreImports
      build.onResolve({ filter: /^(@stores|@composables|stx\/stores)$/ }, (args) => ({
        path: args.path,
        external: true,
      }))

      // Browser-rooted URLs belong to the host application, not the local
      // filesystem. Keep imports such as `/__deps/charts.js` in the generated
      // browser bundle so the application's HTTP server can resolve them.
      // Preserve genuine absolute filesystem imports when the target exists.
      build.onResolve({ filter: /^\// }, (args) => {
        if (args.path === tmpEntry) return { path: tmpEntry }
        // Extensions are probed, not just the literal path. A specifier
        // written `../composables/useApp` and pinned to an absolute path (see
        // `absolutizeTemplateImports`, which is how a layout's imports survive
        // being merged into a page) names a real module with no extension on
        // it. Matching only the exact path left those marked external, so the
        // browser was handed a filesystem path to fetch — a 404 at runtime in
        // place of a resolution error at build time.
        const resolved = probeModuleFile(args.path)
        if (resolved) {
          const registered = toRegistry(args.importer, resolved, args.path)
          if (registered)
            return registered
          // Not the temp entry. Bun resolves the entrypoint through this hook
          // too, and it is an absolute path that exists — recording it would
          // put a file whose name changes every build into the cache-key
          // inputs, so no cached bundle could ever be reused.
          if (resolved !== tmpEntry)
            inputFiles.add(resolved)
          return { path: resolved }
        }

        // Browser-rooted URLs belong to the host application, not the local
        // filesystem: `/__deps/charts.js` stays in the bundle for the app's
        // HTTP server to answer.
        return {
          path: args.path,
          external: true,
        }
      })

      // Relative imports (`./x`, `../x`) — rebase against the original
      // `<script client>` source file, not the temp entry's directory.
      // Record resolved paths so the bundler can fold their mtimes into
      // the cache key (stacksjs/stx#1723).
      build.onResolve({ filter: /^\.\.?\// }, (args) => {
        const resolved = resolveRelative(args.importer, args.path)
        const registered = toRegistry(args.importer, resolved, args.path)
        if (registered)
          return registered
        inputFiles.add(resolved)
        return { path: resolved }
      })

      // @/ and ~/ path aliases → project root. Both prefixes are
      // common in Vite/Stacks-style configs; tsconfig path mappings
      // are not picked up automatically by Bun.build for temp entry
      // files generated under the state directory, so the plugin
      // resolves them explicitly here.
      build.onResolve({ filter: /^[@~]\// }, (args) => {
        const resolved = path.resolve(projectRoot, args.path.slice(2))
        const candidates = [
          resolved,
          `${resolved}.ts`,
          `${resolved}.tsx`,
          `${resolved}.js`,
          `${resolved}.mjs`,
          `${resolved}.jsx`,
          path.join(resolved, 'index.ts'),
          path.join(resolved, 'index.tsx'),
          path.join(resolved, 'index.js'),
          path.join(resolved, 'index.mjs'),
        ]
        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()) {
            const registered = toRegistry(args.importer, candidate, args.path)
            if (registered)
              return registered
            logBundlerDiagnostic(`resolved ${args.path[0]}/ import:`, args.path, '→', candidate)
            inputFiles.add(candidate)
            return { path: candidate }
          }
        }
        console.warn(`[stx:bundler] could not resolve ${args.path[0]}/ import:`, args.path)
        return { path: resolved }
      })

      // A bare package import from the script itself goes to the page registry
      // too, keyed by its specifier (#1957): two components importing one
      // package share one instance, exactly as for a local module. Registered
      // after the stx, @stores, alias and path hooks, which all take priority.
      //
      // Only when this build externalizes. The registry's own build, which
      // inlines the packages, used to register it anyway and pass every bare
      // import through with `undefined` - and Bun 1.4.0, handed that back for
      // a re-export out of a `sideEffects: false` package, bundled the
      // re-exporting module without the package behind it. @stacksjs/browser
      // re-exports its composables from @stacksjs/composables: the registry
      // bundle called useStorage() at load with nothing defining it, threw
      // before registering, and every page auto-importing a browser
      // composable (useDocumentVisibility, useIntervalFn, ...) failed to
      // hydrate on "module is not registered on this page".
      if (externalizeUserModules) {
        build.onResolve({ filter: /^(?!node:|bun:)(?:@[\w.-]+\/)?[\w.-]/ }, (args) => {
          if (args.importer !== tmpEntry)
            return undefined
          const registryPath = `${MODULE_SPECIFIER_PREFIX}npm:${args.path}`
          registrySpecifiers.set(args.path, registryPath)
          return { path: registryPath, external: true }
        })
      }

      // Feed source modules to Bun from a normal filesystem read. Bun's
      // internal reader can intermittently report "Unseekable reading file"
      // for generated JavaScript inside linked workspace packages, even when
      // the same file is immediately readable through node:fs. Dashboard
      // bundles commonly traverse those links through @stacksjs/browser.
      //
      // This also records package-resolved and nested inputs, not only the
      // relative and aliased imports handled above, so their mtimes participate
      // in cache validation.
      build.onLoad({ filter: /\.(?:[cm]?[jt]sx?|json)$/ }, (args) => {
        if (args.path === tmpEntry) return { contents: entrySource, loader: 'ts' }
        if (isPrivateClientSource(args.path, projectRoot, serverApi))
          throw new Error(`Server-only API source cannot be imported by a client script: ${args.path}`)
        const extension = path.extname(args.path).toLowerCase()
        const loader = extension === '.json'
          ? 'json'
          : extension === '.tsx'
            ? 'tsx'
            : extension === '.jsx'
              ? 'jsx'
              : extension === '.ts' || extension === '.mts' || extension === '.cts'
                ? 'ts'
                : 'js'

        // The generated entry is deleted after every build. Recording it in
        // the persistent dependency sidecar makes every later lookup miss,
        // because cache validation correctly sees that the file disappeared.
        // Track only durable source inputs.
        if (args.path !== tmpEntry)
          inputFiles.add(args.path)
        const substitute = substitutes?.get(args.path)
        if (substitute !== undefined)
          return { contents: substitute, loader: 'js' }
        return {
          contents: fs.readFileSync(args.path, 'utf8'),
          loader,
        }
      })
    },
  }
}

/**
 * Bundle a client script using Bun.build.
 *
 * Resolves local imports (@/, ./), npm packages, and tree-shakes unused exports.
 * stx runtime, @stores, and @composables are marked as external.
 *
 * @param code - The script content (may contain import statements)
 * @param filePath - The .stx template file path (for relative import resolution)
 * @param options - Bundling options
 * @returns Bundled code with all imports resolved and inlined
 */
/**
 * Bundles currently in flight, keyed by cache hash.
 *
 * A dev server renders several pages at once and they all extend the same
 * layout, so the identical script is bundled concurrently. Each of those builds
 * used to write the same temp entry and the same output directory, and each
 * removed both in its `finally` — so one build's cleanup deleted another's
 * inputs mid-flight. The loser produced an empty bundle, and the empty bundle
 * was then written to the cache, where it stayed: every later request got a
 * layout whose entire controller had silently vanished, with no error anywhere.
 *
 * Sharing one promise per hash removes the collision at the source rather than
 * making the temp paths unique and leaving the duplicated work in place.
 */
const inFlightBundles = new Map<string, Promise<string>>()

/**
 * Bundles this process has already produced or read back, by cache hash.
 *
 * The on-disk cache hit on every render and still cost every render: the
 * ~190KB output was read from disk and its sidecar parsed again each time
 * (#1945). The deps are re-stat'ed on a hit exactly as the disk path does, so
 * an edited helper invalidates the same way; only the read is skipped.
 */
const bundleMemo = renderMemo<{ code: string, files: DepSnapshot[] }>(64)
const CLIENT_BUNDLE_QUEUE = Symbol.for('stx.client-bundle-build-queue')

interface ClientBundleGlobal {
  [CLIENT_BUNDLE_QUEUE]?: Promise<void>
}

/**
 * Run one client bundle build at a time.
 *
 * Bun.build can return transient "Unseekable reading file" failures when
 * separate builds concurrently traverse the same linked workspace dependency.
 * Dashboard renders commonly compile the layout and page controllers together,
 * so distinct content hashes still share much of their dependency graph.
 *
 * Cache reads remain concurrent and identical builds still share one promise.
 * Only cold Bun.build work is queued, and a rejected task cannot stall the next
 * build.
 */
export function queueClientBundleBuild<T>(task: () => Promise<T>): Promise<T> {
  const shared = globalThis as ClientBundleGlobal
  const queue = shared[CLIENT_BUNDLE_QUEUE] ?? Promise.resolve()
  const result = queue.then(task, task)
  shared[CLIENT_BUNDLE_QUEUE] = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

export async function bundleClientScript(
  code: string,
  filePath: string,
  options: {
    projectRoot?: string
    minify?: boolean
    cacheDir?: string
    /**
     * Receives the files this bundle was built from, for a caller that needs
     * them for its own cache key.
     *
     * `clientBundleDependencies()` answers the same question from a map keyed
     * by host file path, which is only correct while calls for one host are
     * serialized. They are not: a component with two bundling `<script client>`
     * blocks builds them under one `Promise.all`, so the second call's
     * `recordBundleInputs` can land between the first's await and its read, and
     * the first caller gets the second's file list. That map is a
     * process-global keyed on the host, so it cannot distinguish them; this
     * hands each caller its own answer.
     */
    collectInputs?: string[]
    /**
     * Serve the script's own imports from the page registry instead of
     * inlining them (#1957). Default true; the registry's own build turns it
     * off, since that bundle is where the modules are actually inlined.
     */
    externalizeUserModules?: boolean
    /**
     * Re-expose only these names outside the bundle's closure. By default every
     * top-level binding of the script comes back, imports included, because a
     * page's template reads whatever its script declared. A composable is
     * concatenated with the others into one scope instead, and publishes only
     * its exports: re-declaring a name it merely imported collided with the
     * composable that owns it (`var X` here, `const X` there, a SyntaxError
     * that took every composable on the page down).
     */
    expose?: readonly string[]
    /**
     * Throw on a failed build instead of returning the script unbundled.
     *
     * The unbundled fallback keeps a dev server usable for a page's own
     * script. It is no use to a caller whose source is nothing BUT imports -
     * the page registry's entry is `import * as m from '...'` lines that only
     * mean something once bundled, so falling back shipped them inside an IIFE,
     * a SyntaxError, and the build error never reached the browser.
     */
    throwOnFailure?: boolean
  } = {},
): Promise<string> {
  const projectRoot = options.projectRoot || process.cwd()
  const serverApi = (await loadStxConfig(projectRoot)).serverApi
  const minify = options.minify ?? false
  const externalizeUserModules = options.externalizeUserModules ?? true
  const expose = options.expose?.length ? [...new Set(options.expose)].sort() : undefined
  const cacheDir = options.cacheDir || bundleCacheDir(projectRoot)
  // Read now: the build itself may run later, from the queue.
  const substituted = moduleSubstitutes.getStore()

  // Content-hash for caching and temp file naming. The hash covers only
  // the script source + host file path — transitive imports (e.g.
  // `import { x } from '@/functions/helper'`) are NOT in the hash because
  // they can't be known before Bun.build runs. We instead persist the
  // resolved input file list with their mtimes alongside the cached
  // output (`.deps.json` sidecar) and re-validate on lookup — same
  // pattern as the SSG build cache fix in stacksjs/stx#1717. See
  // stacksjs/stx#1723 for the bug this addresses (helper edits silently
  // failed to invalidate the bundle).
  //
  // Keyed on the stx that built it, too. Every input file can be unchanged
  // while the bundler that read them is not: a registry bundle built by a
  // release with a resolution bug kept being served after the fix shipped,
  // because nothing it recorded had moved.
  const hasher = new Bun.CryptoHasher('md5')
  // Minified or not is part of what was built: a readable bundle cached by a
  // development render was served to production renders asking for minified.
  hasher.update(`${BUNDLE_CACHE_VERSION}\0${cacheEngineFingerprint()}\0${JSON.stringify(serverApi ?? false)}\0${externalizeUserModules ? 'registry' : 'inline'}\0${expose ? expose.join(',') : '*'}\0${minify ? 'minified' : 'readable'}\0${substituted?.key ?? ''}\0${withoutProjectRoot(code, projectRoot)}\0${withoutProjectRoot(filePath, projectRoot)}`)
  const hash = hasher.digest('hex').slice(0, 12)

  // Check cache. A cache hit requires both the bundled JS to exist AND
  // every recorded transitive dep's mtime to be unchanged since the
  // bundle was built.
  const cachePath = path.join(cacheDir, `${hash}.js`)

  // Already produced or read back by this process: stat the deps, skip the read.
  //
  // Keyed on the cache PATH rather than the hash. `hash` covers the source and
  // the host file but not `cacheDir`, and the on-disk cache leans on the
  // directory to keep two projects — or a test's isolated cache — apart. A
  // process-global map keyed on the hash alone would lose that partition and
  // hand one project's bundle to another. The path carries both.
  const remembered = bundleMemo.get(cachePath)
  if (remembered) {
    if (depsUnchanged(remembered.files) && remembered.files.every(dep => !isPrivateClientSource(dep.path, projectRoot, serverApi))) {
      logBundlerDiagnostic('memo hit:', hash)
      const paths = remembered.files.map(dep => dep.path)
      recordBundleInputs(filePath, paths)
      options.collectInputs?.push(...paths)
      return remembered.code
    }
    bundleMemo.delete(cachePath)
    logBundlerDiagnostic('memo invalidated by dep change:', hash)
  }
  const depsPath = path.join(cacheDir, `${hash}.deps.json`)
  const cacheFile = Bun.file(cachePath)
  if (await cacheFile.exists()) {
    const depsFile = Bun.file(depsPath)
    let depsValid = false
    // What the sidecar recorded, kept for the memo so a later hit re-stats the
    // same files without opening the sidecar again.
    let storedFiles: DepSnapshot[] | null = null
    if (await depsFile.exists()) {
      try {
        const stored = JSON.parse(await depsFile.text()) as BundleCacheMetadata
        if (stored.metadataVersion === BUNDLE_CACHE_METADATA_VERSION && Array.isArray(stored.files) && cachedInputsUnchanged(stored.files, projectRoot)) {
          // This project's own copies, with their mtimes now, for the memo.
          storedFiles = snapshotDeps(stored.files.map(input => resolveCachedInput(input, projectRoot)))
          depsValid = storedFiles.length === stored.files.length
            && !storedFiles.some(dep => isPrivateClientSource(dep.path, projectRoot, serverApi))
        }
      }
      catch {
        // Corrupt sidecar — rebundle.
        depsValid = false
      }
    }
    if (depsValid) {
      logBundlerDiagnostic('cache hit:', hash)
      // No sidecar to read: the page keeps the deps it already had, which is
      // no worse than before this existed.
      if (storedFiles) {
        recordBundleInputs(filePath, storedFiles.map(dep => dep.path))
        options.collectInputs?.push(...storedFiles.map(dep => dep.path))
      }
      const code = await cacheFile.text()
      // A hit is a use: refresh the entry's mtime so the sweep, which keeps
      // the most recent, keeps what is being used and not only what was
      // written last. Without it a warm-up pass over a working set near the
      // limit evicted the very entries it was about to read.
      const now = new Date()
      fs.promises.utimes(cachePath, now, now).catch(() => {})
      // Only with a sidecar. Without one there is nothing to re-stat, and an
      // entry with an empty dep list is re-validated by checking nothing — so
      // it would be served for the rest of the process no matter what happened
      // on disk. Re-reading the file each render, as before, is both cheaper
      // than being wrong and self-correcting once the sidecar reappears.
      if (storedFiles)
        bundleMemo.set(cachePath, { code, files: storedFiles })
      return code
    }
    logBundlerDiagnostic('cache invalidated by dep change:', hash)
  }

  // Share a single build between concurrent callers for the same script.
  const running = inFlightBundles.get(hash)
  if (running) {
    const shared = await running
    // The build that actually ran pushed into ITS caller's array, not ours, so
    // take the inputs from what it recorded. Without this a caller that merely
    // joined an in-flight build is handed an empty dependency list and would
    // remember its own artifact with nothing able to invalidate it.
    if (options.collectInputs)
      options.collectInputs.push(...(bundleMemo.get(cachePath)?.files ?? []).map(dep => dep.path))
    return shared
  }

  const build = queueClientBundleBuild(() =>
    buildBundle(code, filePath, { projectRoot, minify, cacheDir, hash, cachePath, depsPath, collectInputs: options.collectInputs, externalizeUserModules, serverApi, expose, throwOnFailure: options.throwOnFailure, substitutes: substituted?.modules }),
  )
  inFlightBundles.set(hash, build)
  try {
    return await build
  }
  finally {
    inFlightBundles.delete(hash)
  }
}

/**
 * The name one build's virtual entry and output directory go by: the script's
 * hash, this process and a fresh token. Workers and separately loaded copies
 * share a PID but have independent counters and build queues, so a module-local
 * counter let one isolate remove another's output while it was being read.
 */
export function tempBuildName(hash: string): string {
  return `${hash}-${process.pid}-${randomUUID()}`
}

async function buildBundle(
  code: string,
  filePath: string,
  options: {
    projectRoot: string
    minify: boolean
    cacheDir: string
    hash: string
    cachePath: string
    depsPath: string
    collectInputs?: string[]
    externalizeUserModules: boolean
    serverApi?: boolean | ServerApiOptions
    expose?: readonly string[]
    throwOnFailure?: boolean
    substitutes?: ReadonlyMap<string, string>
  },
): Promise<string> {
  const { projectRoot, minify, cacheDir, hash, cachePath, depsPath, externalizeUserModules } = options

  // Keep the virtual entry in the project so Bun resolves bare packages
  // with its browser conditions even when STX_DIR points outside the checkout.
  // The plugin supplies its contents; no generated file touches source folders.
  // Only build outputs live in the configured state directory.
  const tmpDir = stateDir(projectRoot, 'bundle-tmp')
  const tmpName = tempBuildName(hash)
  const tmpEntry = path.join(projectRoot, `.stx-client-${tmpName}.ts`)
  const tmpOutDir = path.join(tmpDir, 'out', tmpName)
  fs.mkdirSync(tmpOutDir, { recursive: true })

  // Resolve relative imports from the template's directory
  const templateDir = path.dirname(filePath)

  // Prevent tree-shaking: Bun.build with format:'esm' removes unexported declarations.
  // Add a catch-all export so all top-level const/let/var/function survive bundling.
  // We strip the exports from the output after bundling. Skip names that are
  // already exported — re-exporting them causes `Multiple exports with the same
  // name` errors at bundle time.
  //
  // A Set, because the same name can legitimately be written twice in one
  // script: a top-level binding and a local inside a callback, or two locals
  // in two different functions. The scan cannot tell those apart — see the
  // note on indentation below — so it finds both, and a list with a name in it
  // twice is exactly the `Multiple exports with the same name` error this
  // comment warns about, arrived at from the other direction.
  //
  // The consequence is not a warning. The bundle fails, the raw `import`
  // survives into the inline script, the browser throws `Cannot use import
  // statement outside a module`, and the page renders blank — a whole page
  // lost to one repeated `const`.
  const declNames = new Set<string>()
  // `[ \t]*` after the line anchor is load-bearing. A `<script client>` body
  // is indented inside its template, and only some call paths dedent it before
  // getting here — the signal-aware path transpiles first, the plain one does
  // not. Anchoring hard at column 0 therefore found ZERO declarations for any
  // view whose script never calls a reactive primitive directly (one that gets
  // all of its state from a composable, say). Nothing was exported, Bun
  // tree-shook the entry down to its side effects, and the page rendered with
  // every expression referring to an undefined name.
  //
  // But indentation cannot say whether a declaration is TOP-LEVEL, and only a
  // top-level one can be exported (stacksjs/stx#1959). A local on its own line
  // inside a callback matched too, and a script whose top level was only a
  // call -- `onMount(async () => {` with `const data = …` inside, the ordinary
  // shape -- had its nested local put in the export list. Bun exposes nothing
  // for it, so the check below read that as a build that dropped every
  // binding, served the unbundled source, and the browser rejected the whole
  // script on its raw `import`.
  //
  // So the scan runs over the comment- and literal-stripped text and keeps a
  // match only at bracket depth zero. When the brackets do not balance -- a
  // regex literal can hold a brace the stripper does not know about -- depth
  // is not trusted and every match is kept, which is what this did before:
  // never worse than the old scan, only better when it can be sure.
  const declRegex = /^[ \t]*(export\s+)?(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))/gm
  const funcRegex = /^[ \t]*(export\s+)?(?:async\s+)?function\s+(\w+)/gm
  const strippedForScan = stripCommentsAndLiterals(code)
  const { depths: scanDepths, balanced: scanBalanced } = bracketDepths(strippedForScan)
  // A match's index is the start of its line, and only spaces or tabs precede
  // the keyword, so the depth there is the keyword's depth.
  const isTopLevel = (index: number): boolean => !scanBalanced || scanDepths[index] === 0
  let dm: RegExpExecArray | null
  while ((dm = declRegex.exec(strippedForScan)) !== null) {
    if (dm[1]) continue // already exported — don't duplicate
    if (!isTopLevel(dm.index)) continue
    if (dm[2]) {
      // Destructured: const { a, b: renamed, c = 1, ...rest } = ...
      dm[2].split(',').forEach((n) => { const t = destructuredLocalName(n); if (t) declNames.add(t) })
    }
    else if (dm[3]) declNames.add(dm[3])
  }
  while ((dm = funcRegex.exec(strippedForScan)) !== null) {
    if (dm[1]) continue // already exported
    if (!isTopLevel(dm.index)) continue
    declNames.add(dm[2])
  }
  // Imports are also local template bindings. Without exporting them, a
  // helper used only in :text is tree-shaken away, leaving that label blank.
  // Type-only imports do not create runtime bindings.
  //
  // `[ \t]+` after `import`, not `\s+`: the scan runs over literal-stripped
  // text, where a side-effect import (`import './catalog'`) is `import`
  // followed by blanks. With `\s+` the pattern ran on to the next line and
  // read its `import` keyword as a default binding, so `import` landed in the
  // generated export list and the whole bundle failed to parse.
  const importRegex = /^[ \t]*import[ \t]+(?!type\b)(?:(\w+)\s*(?:,\s*)?)?(?:\*\s+as\s+(\w+)|\{([^}]+)\})?\s+from\b/gm
  while ((dm = importRegex.exec(strippedForScan)) !== null) {
    if (!isTopLevel(dm.index)) continue
    const source = /^\s*['"]([^'"]+)['"]/.exec(code.slice(dm.index + dm[0].length))?.[1]
    if (source && EXTERNAL_PATTERNS.some(pattern => pattern.test(source))) continue
    if (dm[1]) declNames.add(dm[1])
    if (dm[2]) declNames.add(dm[2])
    for (const entry of (dm[3] ?? '').split(',')) {
      const binding = entry.trim()
      if (!binding || /^type\s/.test(binding)) continue
      const local = /\bas\s+(\w+)\s*$/.exec(binding)?.[1] ?? /^\w+$/.exec(binding)?.[0]
      if (local) declNames.add(local)
    }
  }
  for (const declaration of strippedForScan.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const entry of declaration[1].split(',')) {
      const publicName = /\bas\s+(\w+)\s*$/.exec(entry)?.[1] ?? /^\s*(\w+)\s*$/.exec(entry)?.[1]
      if (publicName) declNames.delete(publicName)
    }
  }
  const exportLine = declNames.size > 0 ? `\nexport { ${[...declNames].join(', ')} }` : ''

  logBundlerDiagnostic('bundling:', hash, 'from:', path.basename(filePath))

  // Collected during build by the plugin's onResolve hooks. Each entry
  // is an absolute path that contributed to the bundle; we snapshot
  // their mtimes after a successful build to gate future cache hits.
  const inputFiles = new Set<string>()
  // Specifier as written → `stx-module:` path, filled by the same hooks.
  const registrySpecifiers = new Map<string, string>()

  try {
    const result = await Bun.build({
      entrypoints: [tmpEntry],
      outdir: tmpOutDir,
      target: 'browser',
      format: 'esm',
      // Never whitespace: a fully minified bundle is ONE line, and every pass
      // below reads statements line by line (the registry rewrite, the
      // external-import hoist, the export capture). On one line none of them
      // matched, the export capture found nothing, and the script shipped
      // unbundled with raw imports in a classic <script>.
      minify: minify ? { whitespace: false, identifiers: true, syntax: true } : false,
      plugins: [createBundlePlugin(projectRoot, templateDir, tmpEntry, code + exportLine, inputFiles, externalizeUserModules, registrySpecifiers, options.serverApi, options.substitutes)],
      define: {
        'process.env.NODE_ENV': minify ? '"production"' : '"development"',
        ...getPublicEnvDefine(),
      },
      // Anchor the bundler at the project root. The plugin above is
      // what actually rebases `./` and `../` imports against the
      // page source dir, so `root` only needs to keep the chunk
      // output path inside the project — pointing it at templateDir
      // produced "AccessDenied creating outdir
      // ../../../../../.stx/bundle-tmp" because Bun computed the out
      // dir relative to that deep template directory.
      root: projectRoot,
    })

    if (!result.success) {
      const errors = result.logs.filter(l => l.level === 'error').map(l => l.message).join(', ')
      const failure = errors || `Unable to bundle ${path.basename(filePath)}`
      const details = describeBuildFailure(result.logs, filePath || undefined)
      console.warn('[stx:bundler] build failed:', failure)
      recordBundleFailure(filePath || '', failure, details)
      if (options.throwOnFailure || resolveBundlerFallback() === 'error')
        throw new Error(failure)
      // Fall back to original code — let existing pipeline handle it
      return code
    }

    // Read the bundled output
    let bundled = ''
    for (const output of result.outputs) {
      bundled = await output.text()
      break
    }

    // Capture entry exports before stripping them. Bun may rename a page
    // declaration when it shadows an imported module binding (`items2 as
    // items`), so retain both the public name and its actual local binding.
    const exposedBindings: Array<[string, string]> = []
    for (const exp of bundled.matchAll(/^\s*export\s*\{([^}]*)\}\s*;?\s*$/gm)) {
      for (const spec of exp[1].split(',')) {
        const asMatch = spec.trim().match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/)
        if (asMatch) {
          exposedBindings.push([asMatch[2], asMatch[1]])
          continue
        }

        const name = spec.trim()
        if (/^[A-Za-z_$][\w$]*$/.test(name))
          exposedBindings.push([name, name])
      }
    }
    if (options.expose) {
      const wanted = new Set(options.expose)
      for (let i = exposedBindings.length - 1; i >= 0; i--) {
        if (!wanted.has(exposedBindings[i][0])) exposedBindings.splice(i, 1)
      }
    }

    // Registry imports become reads of the page registry (#1957). Done before
    // the external-import extraction below, which would otherwise hoist them
    // out of the bundle scope as imports the browser cannot resolve.
    const registryReads: string[] = []
    bundled = rewriteRegistryImports(normalizeRegistrySpecifiers(bundled, registrySpecifiers), registryReads)

    // External runtime imports must remain at top level so the downstream
    // auto-import transform can replace them with window.stx bindings.
    const externalImports = bundled.match(/^\s*import(?:\s+|(?=["'{*]))[^;]+;?\s*$/gm) || []

    // Isolate every Bun bundle in its own function scope. Layout and page
    // scripts are bundled independently, and Bun commonly assigns identical
    // internal names such as `state2` in each output. Concatenating those
    // outputs into one stx setup function otherwise causes a parse-time
    // duplicate declaration. Only the entry's explicit public bindings are
    // re-exposed outside the closure, using `var` so separate setup blocks can
    // intentionally share a public name without creating a syntax error.
    bundled = bundled
      .replace(/^\s*import(?:\s+|(?=["'{*]))[^;]+;?\s*$/gm, '')
      .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '')
      .replace(/^\s*export\s+default\s+.*$/gm, '')
      .trim()

    // The whitespace the build kept (see its `minify`), dropped now that
    // nothing reads the body by lines. Only the body: the hoisted imports
    // above still go to passes that do.
    if (minify && bundled) {
      try {
        bundled = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true }).transformSync(bundled)
      }
      catch {
        // Readable is still correct.
      }
    }

    const namespace = `__stxBundle_${hash}`
    const mutableBindings = new Set(scopeExports(code, true).split(',').map(name => name.trim()))
    const returnedBindings = exposedBindings
      .map(([publicName, localName]) => `get ${JSON.stringify(publicName)}() { return ${localName} }${mutableBindings.has(publicName) ? `, set ${JSON.stringify(publicName)}(__stxValue_${localName}) { ${localName} = __stxValue_${localName} }` : ''}`)
      .join(', ')
    // Declare the public bindings before the generated bundle body. The
    // component scope registrar scans this output for top-level declarations,
    // and arbitrary inlined code can contain regex or template syntax that
    // makes a lightweight declaration scanner lose track of brace depth.
    // Initializing these bindings up front keeps the public contract visible
    // without exposing the bundle's internal declarations.
    const publicDeclarations = exposedBindings
      .map(([publicName]) => `var ${publicName} = undefined;`)
      .join('\n')
    const publicAssignments = exposedBindings
      .map(([publicName]) => `${publicName} = ${namespace}[${JSON.stringify(publicName)}];`)
      .join('\n')

    bundled = `${externalImports.join('\n')}
${publicDeclarations}
var ${namespace} = (function() {
${registryReads.join('\n')}
${bundled}
return { ${returnedBindings} };
})();
${publicAssignments}
var __stxLiveBindings = typeof __stxLiveBindings === 'undefined' ? {} : __stxLiveBindings;
Object.keys(${namespace}).forEach(function(name) {
  if (!Object.prototype.hasOwnProperty.call(__stxLiveBindings, name))
    Object.defineProperty(__stxLiveBindings, name, Object.getOwnPropertyDescriptor(${namespace}, name));
});`.trim()

    // External imports stay intact for transformAutoImports and
    // transformStoreImports, which run after this bundling step.

    logBundlerDiagnostic('bundled:', hash, 'output:', bundled.length, 'bytes')

    // A script that declared something must come back with it. Losing every
    // binding means the build produced nothing usable — a tree-shake that took
    // the whole entry, or an output file that was not there to read — and the
    // page will render with its controller silently missing.
    //
    // Returning the unbundled source degrades to "imports unresolved" rather
    // than "script absent", which is the failure the caller can actually see.
    // Not caching it is the important half: an empty bundle written to disk
    // outlives whatever transient condition caused it, and every later request
    // is served the same emptiness with no error to explain it.
    if (declNames.size > 0 && exposedBindings.length === 0) {
      console.warn(
        `[stx:bundler] dropped every binding for ${path.basename(filePath)} (${hash}); `
        + 'serving the unbundled source and not caching this result',
      )
      return code
    }

    // Cache the result + the dependency snapshot. The sidecar lists
    // every input file resolved through the plugin (relative imports
    // + @/ + ~/ aliased imports) with its mtime at build time. On the
    // next lookup, we re-stat those files and miss if any mtime
    // changed.
    fs.mkdirSync(cacheDir, { recursive: true })
    await Bun.write(cachePath, bundled)
    const depsSnapshot = snapshotDeps(inputFiles)
    await Bun.write(depsPath, JSON.stringify({
      metadataVersion: BUNDLE_CACHE_METADATA_VERSION,
      files: depsSnapshot.map(dep => cachedInput(dep.path, projectRoot)).filter((input): input is CachedInput => input !== null),
    } satisfies BundleCacheMetadata))

    recordBundleInputs(filePath, depsSnapshot.map(dep => dep.path))
    options.collectInputs?.push(...depsSnapshot.map(dep => dep.path))
    bundleMemo.set(cachePath, { code: bundled, files: depsSnapshot })

    // After writing, not before: the entry just written is the most recent, so
    // it survives its own sweep. Awaited rather than left running, because a
    // build that exits first leaves the sweep half done - and the one time
    // that matters is the build that filled the disk.
    await pruneBundleCache(cacheDir)

    return bundled
  }
  catch (error) {
    // Bun.build throws an AggregateError whose `errors[]` holds BuildMessages;
    // formatBuildFailure unwraps those and recovers the line/column Bun put on
    // `position` and left off `message` (#1810).
    //
    // The source path must be threaded in: the entrypoint here is virtual,
    // so Bun reports THAT, sending the reader to a
    // generated file instead of their view. A BuildMessage also fails
    // `instanceof Error`, so the usual message-or-String idiom reduced it to a
    // bare "Unexpected ===" with no location at all.
    const details = describeBuildFailure(error, filePath || undefined)
    const failure = formatBuildFailure(error, filePath || undefined)
    console.warn(`[stx:bundler] error: ${failure}`)
    // Recorded so a BUILD can fail on this. The fallback below keeps a dev
    // server usable, but it used to be the only outcome: `stx build` shipped the
    // unbundled source and exited 0, so the first sign of trouble was a page
    // whose bindings quietly did nothing. See #1884.
    recordBundleFailure(filePath || '', failure, details)

    // Opt out of the fallback entirely. The default stays 'warn' because
    // shipping the unbundled source is what keeps a dev server usable while you
    // fix the import; 'error' is for anyone who would rather nothing rendered
    // than something that renders with its bindings quietly doing nothing.
    if (options.throwOnFailure || resolveBundlerFallback() === 'error')
      throw error

    // Fall back to original code
    return code
  }
  finally {
    // Clean up temp files
    try {
      fs.rmSync(tmpOutDir, { recursive: true, force: true })
    }
    catch {}
  }
}

/**
 * The local binding a destructuring entry introduces.
 *
 * The name that must be exported is the one the surrounding code can actually
 * refer to, which for a renamed entry is the half AFTER the colon:
 * `{ board: recordBoard }` binds `recordBoard`, and exporting `board` names
 * something that does not exist — Bun then drops the whole export list and the
 * template sees none of the script's bindings.
 *
 * Defaults (`a = 1`) and rest elements (`...rest`) bind their own name too.
 * A nested pattern (`{ a: { b } }`) binds nothing at this level, so it is
 * skipped rather than guessed at.
 */
function destructuredLocalName(entry: string): string | null {
  let name = entry.trim()
  if (!name) return null
  // Strip a default before looking at the rename: `{ a: b = 1 }` binds `b`.
  const eq = name.indexOf('=')
  if (eq !== -1) name = name.slice(0, eq).trim()
  const colon = name.indexOf(':')
  if (colon !== -1) name = name.slice(colon + 1).trim()
  if (name.startsWith('...')) name = name.slice(3).trim()
  // Anything left that is not a plain identifier is a nested pattern.
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : null
}
