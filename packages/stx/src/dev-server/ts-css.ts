// @ts-nocheck - Skip type checking due to Css type version differences
/**
 * Css CSS Generation Module
 * Provides on-the-fly Tailwind CSS generation using Css
 */

import path from 'node:path'
import { hasLocalConfig } from 'bunfig'
import { mergeCssConfig } from '../ts-css-config'
import { stateDir } from '../state-dir'
import { colors } from './terminal-colors'
import { contentKey, renderMemo } from '../render-memo'

// Type for Css module
interface CssModule {
  CSSGenerator: new (config: CssConfig) => CSSGenerator
  config: CssConfig
  build?: (config: CssConfig) => Promise<CssBuildResult>
  defaultConfig?: CssConfig
  /**
   * Css's own extractor. Preferred over the local fallback below —
   * it is the authority on what counts as a class candidate, and it keeps
   * up with syntax this package would otherwise have to mirror by hand.
   */
  extractClasses?: (content: string) => Set<string>
}

interface CssConfig {
  content?: string[]
  output?: string
  preflight?: boolean
  minify?: boolean
  preflights?: unknown[]
  safelist?: string[]
  [key: string]: unknown
}

interface CssBuildResult {
  css: string
  classes: Set<string>
  duration: number
}

interface CSSGenerator {
  generate(className: string): void
  toCSS(preflight: boolean, minify: boolean): string
}

// Css lazy loading cache
let cssModule: CssModule | null = null
let cssLoadAttempted = false

// Cached config and CSS for dev server
let cachedConfig: CssConfig | null = null
let cachedCSS: string = ''
let isBuilding = false

// Memoize generateCss output by sorted class-set string.
//
// In-memory: a Map keyed on the sorted class set, capped at MAX_CACHE
// entries with LRU eviction (Map iteration order is insertion order,
// so we delete + re-set on hit to refresh recency).
//
// On-disk: each (class set, config-fingerprint) pair gets a deterministic
// hash → `<state-dir>/cache/cw-<hash>.css`. Persisting the result means
// the cache survives `bun --watch` restarts, fresh `git pull`s, and
// CI builds — turning the cold-start CSS regeneration penalty (~50KB
// of utilities, ~30-60ms) into a single file read.
//
// Eviction: 256 entries × ~50KB each ≈ 12MB upper bound. Plenty for a
// real app's distinct page shapes; trims unbounded growth in long-lived
// dev sessions where every navigation adds a new class signature.
const MAX_CACHE = 256
const cssByClassSet = new Map<string, string>()
const serveCssByHash = new Map<string, string>()
let diskCacheRoot: string | null = null
let configFingerprint: string | null = null

/**
 * Compute a stable short hash of a string. Used as the cache file
 * name so different (classes, config) pairs don't collide.
 */
function shortHash(input: string): string {
  // Bun.hash is fast (xxHash64) and deterministic across runs.
  const h = Bun.hash(input).toString(16)
  return h.padStart(16, '0').slice(0, 16)
}

function setLruCache(key: string, value: string): void {
  if (cssByClassSet.has(key))
    cssByClassSet.delete(key)
  else if (cssByClassSet.size >= MAX_CACHE)
    cssByClassSet.delete(cssByClassSet.keys().next().value as string)
  cssByClassSet.set(key, value)
}

function registerServeCss(css: string): string {
  const hash = shortHash(css)
  if (serveCssByHash.has(hash))
    serveCssByHash.delete(hash)
  else if (serveCssByHash.size >= MAX_CACHE)
    serveCssByHash.delete(serveCssByHash.keys().next().value as string)
  serveCssByHash.set(hash, css)
  return hash
}

export function getCssServeAsset(hash: string): string | undefined {
  const css = serveCssByHash.get(hash)
  if (css === undefined)
    return

  serveCssByHash.delete(hash)
  serveCssByHash.set(hash, css)
  return css
}

async function readDiskCache(key: string): Promise<string | null> {
  if (!diskCacheRoot) return null
  try {
    const file = Bun.file(path.join(diskCacheRoot, `cw-${shortHash(key)}.css`))
    if (!(await file.exists())) return null
    return await file.text()
  }
  catch {
    return null
  }
}

async function writeDiskCache(key: string, css: string): Promise<void> {
  if (!diskCacheRoot) return
  try {
    if (!fs.existsSync(diskCacheRoot)) fs.mkdirSync(diskCacheRoot, { recursive: true })
    await Bun.write(path.join(diskCacheRoot, `cw-${shortHash(key)}.css`), css)
  }
  catch {
    // Read-only FS, race, etc. — disk cache is opportunistic.
  }
}

/**
 * Try to dynamically import css from a given path
 */
async function tryImportCss(importPath: string): Promise<CssModule | null> {
  try {
    const pkg = await import(importPath)
    if (pkg && pkg.CSSGenerator) {
      return {
        CSSGenerator: pkg.CSSGenerator,
        config: pkg.config,
        build: pkg.build,
        defaultConfig: pkg.defaultConfig,
        // Named explicitly, like the rest — this adapter deliberately does not
        // spread the module, so anything not listed here is invisible to the
        // caller no matter what the package exports.
        extractClasses: pkg.extractClasses,
      }
    }
  }
  catch {
    // Silently fail, will try next path
  }
  return null
}

/**
 * Where the utility-CSS engine can be found inside a package store.
 *
 * The engine ships inside `@stacksjs/ts-css`, at its `engine` subpath. Both
 * layouts are probed so a source checkout works alongside an installed build.
 */
const ENGINE_PACKAGE_ENTRIES: string[][] = [
  ['@stacksjs', 'ts-css', 'dist', 'engine', 'index.js'],
  ['@stacksjs', 'ts-css', 'src', 'engine', 'index.ts'],
]

/** The same package as bare specifiers, for standard resolution. */
const ENGINE_SPECIFIERS = [
  '@stacksjs/ts-css/engine',
  '@stacksjs/ts-css/dist/engine/index.js',
]

/**
 * Css copies installed by the PROJECT being served, nearest first.
 *
 * These are tried before a bare-specifier import. `import('@stacksjs/ts-css/engine')`
 * resolves relative to this file, so it always finds the copy hoisted next to
 * stx itself and an app's own — usually newer — css was ignored. The
 * engine version decides what CSS a class compiles to, so serving an app with
 * a different version than it declares produced output the app could not
 * reproduce: arbitrary filter values like `blur-[50px]` compiled to
 * `blur(50pxpx)` and `backdrop-saturate-[180%]` to `saturate(NaN)`, both of
 * which a browser drops, so the utility silently did nothing.
 */
function findProjectCssPaths(): string[] {
  const paths: string[] = []

  // Search from current working directory up. Check pantry/ as well as
  // node_modules/ at each level — pantry is Stacks' vendored package
  // store and the only place css lives in pantry-managed projects
  // with no node_modules.
  let currentDir = process.cwd()
  while (currentDir !== path.dirname(currentDir)) {
    for (const store of ['node_modules', 'pantry']) {
      for (const entry of ENGINE_PACKAGE_ENTRIES)
        paths.push(path.join(currentDir, store, ...entry))
    }
    currentDir = path.dirname(currentDir)
  }

  return paths
}

/**
 * Last-resort locations: a ts-css checkout sitting somewhere on this
 * machine. Only reached when neither the project nor stx's own dependency
 * provides one, so a stray checkout can never shadow an installed version.
 */
function findDevCssPaths(): string[] {
  const paths: string[] = []
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''

  // The engine lives under the toolkit package of the ts-css monorepo, whose
  // working-copy directory is still named after the project it grew out of.
  // The repository moved to stacksjs/ts-css; a working copy cloned before the
  // move still sits in a directory named after the project it grew out of, so
  // both spellings are probed.
  const checkouts = [
    homeDir && path.join(homeDir, 'Code', 'Tools', 'ts-css'),
    homeDir && path.join(homeDir, 'Code', 'Tools', 'crosswind'),
    homeDir && path.join(homeDir, 'repos', 'stacks-org', 'ts-css'),
    homeDir && path.join(homeDir, 'repos', 'stacks-org', 'crosswind'),
    path.join(process.cwd(), '..', 'ts-css'),
    path.join(process.cwd(), '..', 'crosswind'),
  ].filter(Boolean) as string[]

  for (const checkout of checkouts) {
    paths.push(path.join(checkout, 'packages', 'toolkit', 'dist', 'engine', 'index.js'))
    paths.push(path.join(checkout, 'packages', 'toolkit', 'src', 'engine', 'index.ts'))
  }

  // stx monorepo's own node_modules
  if (homeDir)
    paths.push(path.join(homeDir, 'Code', 'Tools', 'stx', 'node_modules', '@stacksjs', 'ts-css', 'dist', 'engine', 'index.js'))

  return paths
}

/**
 * Lazily load the Css module
 * Returns null if Css is not installed
 */
export async function loadCssEngine(): Promise<CssModule | null> {
  if (cssLoadAttempted) {
    return cssModule
  }
  cssLoadAttempted = true

  try {
    const loadFrom = async (candidates: string[]): Promise<CssModule | null> => {
      for (const candidate of candidates) {
        if (!await Bun.file(candidate).exists())
          continue
        const result = await tryImportCss(candidate)
        if (result) {
          if (!process.env.STACKS_DEV_QUIET)
            console.log(`${colors.green}[ts-css]${colors.reset} CSS engine loaded from ${path.dirname(path.dirname(candidate))}`)
          return result
        }
      }
      return null
    }

    // Strategy 0: an explicit development checkout. This is opt-in so a
    // machine-local clone never shadows the version declared by an app.
    if (process.env.CROSSWIND_SRC) {
      const explicitPath = path.resolve(process.env.CROSSWIND_SRC)
      const explicitModule = await loadFrom([explicitPath])
      if (!explicitModule)
        throw new Error(`CROSSWIND_SRC did not resolve to a Css module: ${explicitPath}`)
      cssModule = explicitModule
      return cssModule
    }

    // Strategy 1: the css the PROJECT installed. This comes first
    // because a bare import resolves relative to stx, not to the app, so
    // stx's own copy used to win even when the app declared a newer one —
    // and the engine version decides what a class compiles to.
    const projectModule = await loadFrom(findProjectCssPaths())
    if (projectModule) {
      cssModule = projectModule
      return cssModule
    }

    // Strategy 2: stx's own dependency, via standard resolution.
    const importPaths = ENGINE_SPECIFIERS

    for (const importPath of importPaths) {
      const result = await tryImportCss(importPath)
      if (result) {
        cssModule = result
        if (!process.env.STACKS_DEV_QUIET)
          console.log(`${colors.green}[ts-css]${colors.reset} CSS engine loaded`)
        return cssModule
      }
    }

    // Strategy 3: a checkout somewhere on this machine. Last, so a stray
    // clone can never shadow a version the project or stx actually declares.
    const devModule = await loadFrom(findDevCssPaths())
    if (devModule) {
      cssModule = devModule
      return cssModule
    }

    throw new Error('Css CSSGenerator not found in any location')
  }
  catch {
    console.warn(`${colors.yellow}[ts-css] CSS engine not available, Tailwind styles will not be generated${colors.reset}`)
    console.warn(`${colors.yellow}Run 'bun add @stacksjs/ts-css' to enable CSS generation${colors.reset}`)
    return null
  }
}

/**
 * Reset the Css module cache (useful for testing)
 */
export function resetCssCache(): void {
  cssByPage.clear()
  cssByClassSet.clear()
  serveCssByHash.clear()
}

export function resetCssCache(): void {
  cssByPage.clear()
  cssModule = null
  cssLoadAttempted = false
  cachedConfig = null
  cachedCSS = ''
  cssByClassSet.clear()
  serveCssByHash.clear()
  // Don't blow away the on-disk cache here — tests reach for this
  // function to clear in-process state, and nuking the disk cache
  // every time would force every test to re-pay the regen cost. The
  // disk cache invalidates implicitly via configFingerprint in the
  // generator path.
  configFingerprint = null
}

/**
 * Load css config from the working directory.
 *
 * Uses `bunfig` for resolution so css configs compose the same way as
 * `stx.config.ts` and other stacks configs — a single source of truth for
 * config loading across the stack.
 *
 * Pre-check: bunfig's lightweight discovery entry point confirms a matching
 * project-local config exists before we load its full configuration pipeline. When
 * stx is run from a parent repo root (e.g. running an example from the
 * monorepo root, or a page rendered before the app dir is known) bunfig's
 * built-in search would span 250+ paths up the tree and, on miss, log a
 * large stack-style error dump. The file-existence pre-check keeps the
 * common "no config file" case silent and fast.
 */
/**
 * Load the user's css config via bunfig — our shared config loader.
 * `hasLocalConfig` uses the same filename, extension, alias, custom-directory,
 * and resolution-priority rules as bunfig's loader, so this integration never
 * maintains a parallel list of paths. Returns `null`
 * when no config file is present, so callers can fall through to defaults
 * without surfacing a "not found" warning to the user.
 */
/** Deprecation notice for the old config filename is worth saying once. */
let warnedLegacyConfigName = false

export async function loadCssEngineConfig(cwd: string): Promise<CssConfig | null> {
  try {
    // A missing config is the overwhelmingly common path. The discovery
    // subpath is deliberately lightweight, letting us avoid the full loader
    // and its fallback search without duplicating bunfig's resolution rules.
    //
    // `crosswind` is the name this config had before the engine moved into
    // @stacksjs/ts-css. It is still read, because the failure mode of dropping
    // it is silent: bunfig finds nothing, the app falls through to defaults,
    // and the site renders with its theme, fonts and safelist quietly gone.
    const name = hasLocalConfig({ name: 'css', cwd })
      ? 'css'
      : hasLocalConfig({ name: 'crosswind', cwd })
        ? 'crosswind'
        : null

    if (!name)
      return null

    if (name === 'crosswind' && !process.env.STACKS_DEV_QUIET && !warnedLegacyConfigName) {
      warnedLegacyConfigName = true
      console.warn(`${colors.yellow}[ts-css]${colors.reset} Reading the CSS config from a \`crosswind\` file. Rename it to \`css\` (e.g. config/css.ts) — the old name is deprecated.`)
    }

    const { loadConfigWithResult } = await import('bunfig')
    const result = await loadConfigWithResult<CssConfig>({
      name,
      cwd,
      defaultConfig: {} as CssConfig,
      checkEnv: false,
      verbose: false,
    })

    // bunfig returns the resolved file path on `result.path` when it found a
    // real file (vs. defaults). Treat a missing path or an empty config as
    // "no user config" — either way the caller falls through to defaults.
    if (!result?.path || !result.config || Object.keys(result.config).length === 0)
      return null

    const rel = path.relative(cwd, result.path)
    if (!process.env.STACKS_DEV_QUIET)
      console.log(`${colors.green}[ts-css]${colors.reset} Loaded config from ${rel || result.path}`)
    return result.config
  }
  catch (error) {
    // bunfig's strict-mode loader throws ConfigNotFoundError when the project
    // simply doesn't ship a `config/css.ts` (or any other matching name).
    // That is the normal case — the caller falls through to Css's
    // built-in defaults and there's nothing for the user to fix. Don't spam
    // the console with a "Failed to load" warning every time CSS regenerates.
    // Only surface the warning when something genuinely went wrong (syntax
    // error in the user's config, permission denied, etc.).
    if (error instanceof Error && error.name === 'ConfigNotFoundError')
      return null

    console.warn(`${colors.yellow}[ts-css]${colors.reset} Failed to load css config:`, error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Resolve the project's css config the way CSS generation does.
 *
 * Priority: the `css` field of `stx.config.ts` (a path, or an inline object
 * that may itself name a path), then auto-discovery of `css.config.ts`.
 *
 * Extracted so the SSG's cache key can be built from the same resolution the
 * stylesheet is. Two copies of this precedence would drift, and a cache key
 * computed from a *different* config than the CSS is worse than no key at all —
 * it would report freshness it has not checked.
 */
export async function resolveUserCssConfig(resolveRoot: string): Promise<CssConfig | null> {
  let stxCssConfig: CssConfig | null = null
  try {
    const { loadStxConfig } = await import('../config')
    const stxConfig = await loadStxConfig(resolveRoot)
    if (stxConfig.css) {
      if (typeof stxConfig.css === 'string') {
        // Path to css config file
        const configPath = path.isAbsolute(stxConfig.css) ? stxConfig.css : path.resolve(resolveRoot, stxConfig.css)
        if (await Bun.file(configPath).exists()) {
          const mod = await import(configPath)
          stxCssConfig = mod.default || mod
          console.log(`${colors.green}[ts-css]${colors.reset} Loaded config from stx.config.ts → ${stxConfig.css}`)
        }
      }
      else {
        // Inline CSS config object. Spread the whole object first so
        // fields like `theme`, `fonts`, `safelist`, and `shortcuts` survive
        // — previously only content/preflight/minify were carried through,
        // which silently dropped web fonts and theme overrides.
        stxCssConfig = {
          ...stxConfig.css,
          content: stxConfig.css.content || [],
          preflight: stxConfig.css.preflight ?? true,
          minify: stxConfig.css.minify ?? false,
        } as CssConfig
        if (stxConfig.css.config) {
          const configPath = path.isAbsolute(stxConfig.css.config) ? stxConfig.css.config : path.resolve(resolveRoot, stxConfig.css.config)
          if (await Bun.file(configPath).exists()) {
            const mod = await import(configPath)
            const extConfig = mod.default || mod
            stxCssConfig = { ...extConfig, ...stxCssConfig }
          }
        }
        console.log(`${colors.green}[ts-css]${colors.reset} Using inline CSS config from stx.config.ts`)
      }
    }
  }
  catch {}

  return stxCssConfig || await loadCssEngineConfig(resolveRoot)
}

/**
 * A short, stable digest of a resolved css config.
 *
 * Hashes the resolved OBJECT rather than a file, so it covers a config
 * assembled from several files, an inline `css` block in `stx.config.ts`, and a
 * preflight imported from somewhere else — all cases a path mtime would miss.
 *
 * Functions are hashed by source text. `JSON.stringify` drops them entirely,
 * which would make an edit to a function-valued plugin or preflight invisible —
 * the exact silent-staleness this digest exists to prevent. Cycles are replaced
 * rather than thrown on, because throwing here degrades to 'unhashable', and a
 * constant digest is a cache key that never changes.
 */
export function fingerprintConfig(config: unknown): string {
  try {
    const seen = new WeakSet<object>()
    return shortHash(JSON.stringify(config ?? {}, (_key, value) => {
      if (typeof value === 'function')
        return `[fn]${String(value)}`
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value))
          return '[circular]'
        seen.add(value)
      }
      return value
    }) ?? '')
  }
  catch {
    return 'unhashable'
  }
}

/**
 * Build Css CSS using the build() API
 * This scans content files and generates CSS for all used classes
 */
export async function buildCss(cwd: string): Promise<string> {
  if (isBuilding) {
    return cachedCSS
  }
  isBuilding = true

  try {
    const hw = await loadCssEngine()
    if (!hw || !hw.build) {
      isBuilding = false
      return ''
    }

    // Load config if not cached
    if (!cachedConfig) {
      cachedConfig = await loadCssEngineConfig(cwd)
    }

    if (!cachedConfig) {
      // No config file, skip building
      isBuilding = false
      return ''
    }

    // Build with the config - deep merge theme to preserve defaults
    const defaultTheme = hw.defaultConfig?.theme || {}
    const userTheme = cachedConfig.theme || {}
    const config: CssConfig = {
      ...hw.defaultConfig,
      ...cachedConfig,
      theme: {
        ...defaultTheme,
        ...userTheme,
        // Deep merge extend if present
        extend: {
          ...(defaultTheme.extend || {}),
          ...(userTheme.extend || {}),
        },
      },
    }

    const start = performance.now()
    const result = await hw.build(config)
    const duration = performance.now() - start

    cachedCSS = result.css
    console.log(`${colors.cyan}[ts-css]${colors.reset} Built ${result.classes.size} classes in ${duration.toFixed(1)}ms`)

    // Write to output file if specified
    if (config.output) {
      const outputPath = path.isAbsolute(config.output)
        ? config.output
        : path.join(cwd, config.output)

      // Ensure directory exists
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      await Bun.write(outputPath, result.css)
    }

    isBuilding = false
    return result.css
  }
  catch (error) {
    console.error(`${colors.red}[ts-css]${colors.reset} Build error:`, error)
    isBuilding = false
    return cachedCSS
  }
}

/**
 * Rebuild Css CSS (called on file changes)
 */
export async function rebuildCss(cwd: string): Promise<void> {
  // Clear cached config to reload it
  cachedConfig = null
  await buildCss(cwd)
}

/**
 * Get the cached CSS (for serving)
 */
export function getCachedCSS(): string {
  return cachedCSS
}

/**
 * Extract all CSS class names from HTML content.
 *
 * This is the FALLBACK. `generateCss` prefers Css's own
 * `extractClasses`, and the difference is not cosmetic: this function only
 * understands `class=""` and quoted literals inside `x-class` / `:class`, so
 * every class that lives in code — a helper returning a class string, an icon
 * keyed by status, anything inside a `<script client>` block — is invisible to
 * it. Those classes silently generate no CSS and the element renders unstyled,
 * which is what drove projects to pre-generate whole icon stylesheets and ship
 * them alongside the page.
 *
 * Keeping a second, weaker copy of Css's extraction rules in this package
 * is what let the two drift apart in the first place. It stays only for the
 * case where the installed Css predates the export.
 */
export function extractClassNames(htmlContent: string): Set<string> {
  const classes = new Set<string>()

  // Scan static class="" attributes
  const classRegex = /class\s*=\s*["']([^"']+)["']/gi
  let match = classRegex.exec(htmlContent)
  while (match !== null) {
    for (const cls of match[1].split(/\s+/)) {
      if (cls.trim()) classes.add(cls.trim())
    }
    match = classRegex.exec(htmlContent)
  }

  // Scan dynamic x-class / :class expressions — extract quoted string literals
  const dynRegex = /(?:x-class|:class)\s*=\s*"([^"]+)"/gi
  let dynMatch = dynRegex.exec(htmlContent)
  while (dynMatch !== null) {
    const strLiterals = dynMatch[1].match(/'([^']+)'/g)
    if (strLiterals) {
      for (const lit of strLiterals) {
        for (const cls of lit.slice(1, -1).split(/\s+/)) {
          if (cls.trim()) classes.add(cls.trim())
        }
      }
    }
    dynMatch = dynRegex.exec(htmlContent)
  }

  return classes
}

/**
 * Extract utility classes from HTML content and generate CSS using Css
 */
/**
 * CSS by page bytes.
 *
 * The class-set cache below already makes generation itself a lookup, but
 * reaching it meant extracting classes from the whole page — with a component
 * bundle inlined, a few hundred KB — then sorting and joining the set into a
 * key, on every render (#1945). An unchanged page is answered before any of
 * that. Cleared with the other caches.
 */
const cssByPage = renderMemo<string>(64)

export async function generateCss(htmlContent: string, appDir?: string): Promise<string> {
  const remembered = cssByPage.get(contentKey(htmlContent, appDir, configFingerprint))
  if (remembered !== undefined)
    return remembered
  const css = await generateCssUncached(htmlContent, appDir)
  // Only a non-empty result, which is the rule the class-set cache below
  // already follows: it is written on the success path alone. '' is returned
  // both by a page with no utility classes and by a FAILED generation —
  // css unavailable, or the generator throwing — and the two are
  // indistinguishable here. Remembering the second kind would leave that page
  // with no stylesheet for the rest of the process, and because
  // injectCss reads '' as "leave the HTML alone" there would be no
  // second error to explain it. Re-running on a genuinely class-less page
  // costs one extraction.
  //
  // Keyed on the fingerprint as known AFTER generating: the first render
  // learns it, so this is what the next render of the page will look up.
  if (css)
    cssByPage.set(contentKey(htmlContent, appDir, configFingerprint), css)
  return css
}

async function generateCssUncached(htmlContent: string, appDir?: string): Promise<string> {
  try {
    // Load css module
    const hw = await loadCssEngine()
    if (!hw) {
      return ''
    }

    // Css's extractor when the installed version exports it, ours only
    // as a fallback. See `extractClassNames` for why the difference matters.
    const classes = typeof hw.extractClasses === 'function'
      ? hw.extractClasses(htmlContent)
      : extractClassNames(htmlContent)

    if (classes.size === 0) {
      return ''
    }

    // Resolve config search root — prefer the caller-supplied app dir so
    // `stx <app-dir>` from outside the app still finds its css.config.
    // Fallback: `process.cwd()` (legacy behaviour).
    const resolveRoot = appDir ? path.resolve(appDir) : process.cwd()

    // Wire up the on-disk cache root once we know the app directory.
    // Putting it in the state directory's `cache/` keeps it alongside the
    // existing stx page cache and behaves the same way under .gitignore
    // conventions.
    if (!diskCacheRoot)
      diskCacheRoot = stateDir(resolveRoot, 'cache')

    // Cache lookup — keyed on the sorted class set + a fingerprint of
    // the loaded css config. Different config (theme tokens,
    // safelist, shortcuts) needs a different cache slot even with the
    // same class set, otherwise a stale CSS file outlives the config
    // edit that produced it.
    const classSetKey = [...classes].sort().join(' ')
    const cacheKey = `${configFingerprint || 'default'}::${classSetKey}`
    const cached = cssByClassSet.get(cacheKey)
    if (cached !== undefined) {
      // LRU bump — re-insert to mark as most-recently-used.
      setLruCache(cacheKey, cached)
      return cached
    }
    const onDisk = await readDiskCache(cacheKey)
    if (onDisk !== null) {
      setLruCache(cacheKey, onDisk)
      return onDisk
    }

    // Load the project's css config
    // Priority: 1) stx.config.ts css field, 2) css.config.ts auto-discovery
    if (!cachedConfig) {
      cachedConfig = await resolveUserCssConfig(resolveRoot)
      configFingerprint = fingerprintConfig(cachedConfig)
    }

    const baseConfig = hw.defaultConfig || hw.config
    const userConfig = cachedConfig || {}

    // One merge, shared with bun-plugin's serve path (#1867). This used to read
    // only `theme.extend` and pin the result after the user spread, so a
    // project writing `theme: { colors: { … } }` without `extend` lost its
    // whole theme silently — while serve.ts, merging the same key a different
    // way, let it clobber the stock palette instead. `content`/`output` are
    // still stx-owned and still pinned last (#1822); `preflight`/`minify` are
    // still honoured rather than ignored twice over.
    const merged = mergeCssConfig(baseConfig as Record<string, any>, userConfig as Record<string, any>)
    const { safelist, includePreflight, minify, tokenCSS } = merged
    const cssConfig = merged.config as CssConfig

    // Generate CSS using Css's CSSGenerator
    const generator = new hw.CSSGenerator(cssConfig)

    // Generate safelist classes
    for (const cls of safelist) {
      generator.generate(cls)
    }

    for (const className of classes) {
      generator.generate(className)
    }

    let css = generator.toCSS(includePreflight, minify)

    // Generate shortcut CSS rules — CSSGenerator expands shortcuts into
    // individual utility classes but doesn't emit grouped .shortcut { ... } rules
    const shortcuts = cssConfig.shortcuts || (userConfig as any).shortcuts || {}
    for (const [name, classStr] of Object.entries(shortcuts)) {
      if (!classes.has(name) && !safelist.includes(name)) continue
      const parts = (classStr as string).split(/\s+/).filter(Boolean)
      for (const p of parts) generator.generate(p)
    }
    // Re-generate to include any new utility classes from shortcuts
    css = generator.toCSS(includePreflight, minify)

    // Build grouped shortcut rules — extract declarations from generated CSS
    // and combine them under a single .shortcut-name selector
    const cssLines = css.split('\n')
    for (const [name, classStr] of Object.entries(shortcuts)) {
      if (!classes.has(name) && !safelist.includes(name)) continue
      const parts = (classStr as string).split(/\s+/).filter(Boolean)
      const decls: string[] = []
      const darkDecls: string[] = []
      for (const cls of parts) {
        const isDark = cls.startsWith('dark:')
        const actualCls = isDark ? cls.slice(5) : cls
        // Find the CSS rule by looking for the selector line, then collecting declarations
        const escapedCls = actualCls.replace(/\//g, '\\/').replace(/:/g, '\\:').replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/%/g, '\\%')
        const selectorTarget = `.${escapedCls}`
        for (let i = 0; i < cssLines.length; i++) {
          const line = cssLines[i].trim()
          if (line === `${selectorTarget} {` || line.startsWith(`${selectorTarget} {`)) {
            // Collect declarations until closing brace
            let j = i
            let ruleContent = ''
            while (j < cssLines.length) {
              ruleContent += cssLines[j]
              if (cssLines[j].includes('}')) break
              j++
            }
            const declMatch = ruleContent.match(/\{([^}]+)\}/)
            if (declMatch) {
              if (isDark) darkDecls.push(declMatch[1].trim())
              else decls.push(declMatch[1].trim())
            }
            break
          }
        }
      }
      if (decls.length) css += `\n.${name} { ${decls.join(' ')} }`
      if (darkDecls.length) css += `\n@media (prefers-color-scheme: dark) { .dark .${name} { ${darkDecls.join(' ')} } }`
    }

    // Role-token values first, so the utilities below resolve against them and
    // an app's own stylesheet — which comes after — can still override (#1930).
    css = tokenCSS + css

    setLruCache(cacheKey, css)
    // Best-effort persistence so the next request after a server
    // restart (or the next CI build) skips the regeneration cost.
    void writeDiskCache(cacheKey, css)
    return css
  }
  catch (error) {
    console.warn('Failed to generate Css CSS:', error)
    return ''
  }
}

/**
 * Inject generated CSS into HTML content
 * Tries to inject before </head>, falls back to <body> or prepends
 */
export async function injectCss(htmlContent: string, appDir?: string, serveMode = false): Promise<string> {
  // Generate CSS for ALL utility classes in the (possibly shell-composed)
  // content. We must NOT early-return just because a `data-css="generated"`
  // style already exists: when a page is composed into a pre-processed app shell,
  // the shell already carries a generated style covering the SHELL's classes
  // only (its nav/layout used e.g. `gap-4`). Early-returning there drops the
  // page's own utilities — `.grid` / `.grid-cols-*` never get emitted, so the
  // page lays out as `display:block`. Instead we regenerate from the full
  // content and REPLACE the existing style, so the single emitted stylesheet
  // covers the union of shell + page classes — with exactly one Preflight reset.
  // See stacksjs/stx#1749.
  const css = await generateCss(htmlContent, appDir)

  if (!css) {
    // Nothing to emit (no classes, or css unavailable). Leave any existing
    // generated style in place rather than stripping it.
    return htmlContent
  }

  const assetTag = serveMode
    ? `<link data-css="generated" rel="stylesheet" href="/_stx/css.${registerServeCss(css)}.css">`
    : `<style data-css="generated">\n${css}\n</style>`

  // If one or more generated styles already exist (e.g. from the composed
  // shell, or a recursive layout render), replace the first with the complete
  // one and drop any duplicates — keeping a single Preflight reset.
  const existing = /(?:<style\b[^>]*\bdata-css=(?:"generated"|'generated')[^>]*>[\s\S]*?<\/style>|<link\b[^>]*\bdata-css=(?:"generated"|'generated')[^>]*>)/g
  if (existing.test(htmlContent)) {
    let placed = false
    return htmlContent.replace(existing, () => {
      if (placed)
        return ''
      placed = true
      return assetTag
    })
  }

  // Try to inject before </head>
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${assetTag}\n</head>`)
  }

  // Fallback: inject at the beginning of <body> or at the start
  if (htmlContent.includes('<body')) {
    return htmlContent.replace(/<body([^>]*)>/, `<body$1>\n${assetTag}`)
  }

  // Last resort: prepend to content
  return assetTag + htmlContent
}
