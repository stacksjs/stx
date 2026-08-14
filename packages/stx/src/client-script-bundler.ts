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

import path from 'node:path'
import fs from 'node:fs' // kept for mkdir/rmSync (no Bun equivalent for dir ops)
import type { BunPlugin } from 'bun'
import type { BuildFailureDetail } from './build-message'
import { getPublicEnvDefine } from './public-env'
import { stateDir } from './state-dir'
import { describeBuildFailure, formatBuildFailure } from './build-message'
import { config } from './config'

const BUNDLE_CACHE_VERSION = 5
const BUNDLE_CACHE_METADATA_VERSION = 1

interface BundleCacheMetadata {
  metadataVersion: number
  files: Array<{ path: string, mtimeMs: number }>
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
  const sideEffectRegex = /^[ \t]*import[ \t]+['"]([^'"]+)['"]/gm
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
  inputFiles: Set<string>,
): BunPlugin {
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
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate, { throwIfNoEntry: false })?.isFile())
          return candidate
      }
      catch {}
    }
    return resolved
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
        if (fs.existsSync(args.path))
          return { path: args.path }

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
            logBundlerDiagnostic(`resolved ${args.path[0]}/ import:`, args.path, '→', candidate)
            inputFiles.add(candidate)
            return { path: candidate }
          }
        }
        console.warn(`[stx:bundler] could not resolve ${args.path[0]}/ import:`, args.path)
        return { path: resolved }
      })

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
  } = {},
): Promise<string> {
  const projectRoot = options.projectRoot || process.cwd()
  const minify = options.minify ?? false
  const cacheDir = options.cacheDir || stateDir(projectRoot, 'bundle-cache')

  // Content-hash for caching and temp file naming. The hash covers only
  // the script source + host file path — transitive imports (e.g.
  // `import { x } from '@/functions/helper'`) are NOT in the hash because
  // they can't be known before Bun.build runs. We instead persist the
  // resolved input file list with their mtimes alongside the cached
  // output (`.deps.json` sidecar) and re-validate on lookup — same
  // pattern as the SSG build cache fix in stacksjs/stx#1717. See
  // stacksjs/stx#1723 for the bug this addresses (helper edits silently
  // failed to invalidate the bundle).
  const hasher = new Bun.CryptoHasher('md5')
  hasher.update(`${BUNDLE_CACHE_VERSION}\0${code}\0${filePath}`)
  const hash = hasher.digest('hex').slice(0, 12)

  // Check cache. A cache hit requires both the bundled JS to exist AND
  // every recorded transitive dep's mtime to be unchanged since the
  // bundle was built.
  const cachePath = path.join(cacheDir, `${hash}.js`)
  const depsPath = path.join(cacheDir, `${hash}.deps.json`)
  const cacheFile = Bun.file(cachePath)
  if (await cacheFile.exists()) {
    const depsFile = Bun.file(depsPath)
    let depsValid = true
    if (await depsFile.exists()) {
      try {
        const stored = JSON.parse(await depsFile.text()) as BundleCacheMetadata
        if (stored.metadataVersion !== BUNDLE_CACHE_METADATA_VERSION || !Array.isArray(stored.files))
          depsValid = false

        for (const dep of Array.isArray(stored.files) ? stored.files : []) {
          try {
            const current = fs.statSync(dep.path).mtimeMs
            if (current !== dep.mtimeMs) {
              depsValid = false
              break
            }
          }
          catch {
            // Dep file was deleted since last build — treat as invalid.
            depsValid = false
            break
          }
        }
      }
      catch {
        // Corrupt sidecar — rebundle.
        depsValid = false
      }
    }
    if (depsValid) {
      logBundlerDiagnostic('cache hit:', hash)
      return await cacheFile.text()
    }
    logBundlerDiagnostic('cache invalidated by dep change:', hash)
  }

  // Share a single build between concurrent callers for the same script.
  const running = inFlightBundles.get(hash)
  if (running)
    return await running

  const build = queueClientBundleBuild(() =>
    buildBundle(code, filePath, { projectRoot, minify, cacheDir, hash, cachePath, depsPath }),
  )
  inFlightBundles.set(hash, build)
  try {
    return await build
  }
  finally {
    inFlightBundles.delete(hash)
  }
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
  },
): Promise<string> {
  const { projectRoot, minify, cacheDir, hash, cachePath, depsPath } = options

  // Write temp entry file (Bun.build needs a real file)
  const tmpDir = stateDir(projectRoot, 'bundle-tmp')
  const tmpEntry = path.join(tmpDir, `${hash}.ts`)
  const tmpOutDir = path.join(tmpDir, 'out', hash)

  fs.mkdirSync(tmpDir, { recursive: true })
  fs.mkdirSync(tmpOutDir, { recursive: true })

  // Resolve relative imports from the template's directory
  const templateDir = path.dirname(filePath)

  // Prevent tree-shaking: Bun.build with format:'esm' removes unexported declarations.
  // Add a catch-all export so all top-level const/let/var/function survive bundling.
  // We strip the exports from the output after bundling. Skip names that are
  // already exported — re-exporting them causes `Multiple exports with the same
  // name` errors at bundle time.
  const declNames: string[] = []
  const declRegex = /^(export\s+)?(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))/gm
  const funcRegex = /^(export\s+)?(?:async\s+)?function\s+(\w+)/gm
  let dm: RegExpExecArray | null
  while ((dm = declRegex.exec(code)) !== null) {
    if (dm[1]) continue // already exported — don't duplicate
    if (dm[2]) {
      // Destructured: const { a, b } = ...
      dm[2].split(',').forEach(n => { const t = n.split(':')[0].trim(); if (t) declNames.push(t) })
    }
    else if (dm[3]) declNames.push(dm[3])
  }
  while ((dm = funcRegex.exec(code)) !== null) {
    if (dm[1]) continue // already exported
    declNames.push(dm[2])
  }
  const exportLine = declNames.length > 0 ? `\nexport { ${declNames.join(', ')} }` : ''

  await Bun.write(tmpEntry, code + exportLine)

  logBundlerDiagnostic('bundling:', hash, 'from:', path.basename(filePath))

  // Collected during build by the plugin's onResolve hooks. Each entry
  // is an absolute path that contributed to the bundle; we snapshot
  // their mtimes after a successful build to gate future cache hits.
  const inputFiles = new Set<string>()

  try {
    const result = await Bun.build({
      entrypoints: [tmpEntry],
      outdir: tmpOutDir,
      target: 'browser',
      format: 'esm',
      minify,
      plugins: [createBundlePlugin(projectRoot, templateDir, tmpEntry, inputFiles)],
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
      if (resolveBundlerFallback() === 'error')
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

    // External runtime imports must remain at top level so the downstream
    // auto-import transform can replace them with window.stx bindings.
    const externalImports = bundled.match(/^\s*import\s+[^;]+;?\s*$/gm) || []

    // Isolate every Bun bundle in its own function scope. Layout and page
    // scripts are bundled independently, and Bun commonly assigns identical
    // internal names such as `state2` in each output. Concatenating those
    // outputs into one stx setup function otherwise causes a parse-time
    // duplicate declaration. Only the entry's explicit public bindings are
    // re-exposed outside the closure, using `var` so separate setup blocks can
    // intentionally share a public name without creating a syntax error.
    bundled = bundled
      .replace(/^\s*import\s+[^;]+;?\s*$/gm, '')
      .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '')
      .replace(/^\s*export\s+default\s+.*$/gm, '')
      .trim()

    const namespace = `__stxBundle_${hash}`
    const returnedBindings = exposedBindings
      .map(([publicName, localName]) => `${JSON.stringify(publicName)}: ${localName}`)
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
${bundled}
return { ${returnedBindings} };
})();
${publicAssignments}`.trim()

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
    if (declNames.length > 0 && exposedBindings.length === 0) {
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
    const depsSnapshot = Array.from(inputFiles).map((p) => {
      try {
        return { path: p, mtimeMs: fs.statSync(p).mtimeMs }
      }
      catch {
        return null
      }
    }).filter((d): d is { path: string, mtimeMs: number } => d !== null)
    await Bun.write(depsPath, JSON.stringify({
      metadataVersion: BUNDLE_CACHE_METADATA_VERSION,
      files: depsSnapshot,
    } satisfies BundleCacheMetadata))

    return bundled
  }
  catch (error) {
    // Bun.build throws an AggregateError whose `errors[]` holds BuildMessages;
    // formatBuildFailure unwraps those and recovers the line/column Bun put on
    // `position` and left off `message` (#1810).
    //
    // The source path must be threaded in: the entrypoint here is a temp file
    // under .stx/bundle-tmp, so Bun reports THAT, sending the reader to a
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
    if (resolveBundlerFallback() === 'error')
      throw error

    // Fall back to original code
    return code
  }
  finally {
    // Clean up temp files
    try {
      fs.rmSync(tmpEntry, { force: true })
      fs.rmSync(tmpOutDir, { recursive: true, force: true })
    }
    catch {}
  }
}
