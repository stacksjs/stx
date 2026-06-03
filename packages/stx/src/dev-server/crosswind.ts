// @ts-nocheck - Skip type checking due to Crosswind type version differences
/**
 * Crosswind CSS Generation Module
 * Provides on-the-fly Tailwind CSS generation using Crosswind
 */

import fs from 'node:fs'
import path from 'node:path'
import { colors } from './terminal-colors'

// Type for Crosswind module
interface CrosswindModule {
  CSSGenerator: new (config: CrosswindConfig) => CSSGenerator
  config: CrosswindConfig
  build?: (config: CrosswindConfig) => Promise<CrosswindBuildResult>
  defaultConfig?: CrosswindConfig
}

interface CrosswindConfig {
  content?: string[]
  output?: string
  preflight?: boolean
  minify?: boolean
  preflights?: unknown[]
  safelist?: string[]
  [key: string]: unknown
}

interface CrosswindBuildResult {
  css: string
  classes: Set<string>
  duration: number
}

interface CSSGenerator {
  generate(className: string): void
  toCSS(preflight: boolean, minify: boolean): string
}

// Crosswind lazy loading cache
let crosswindModule: CrosswindModule | null = null
let crosswindLoadAttempted = false

// Cached config and CSS for dev server
let cachedConfig: CrosswindConfig | null = null
let cachedCSS: string = ''
let isBuilding = false

// Memoize generateCrosswindCSS output by sorted class-set string.
//
// In-memory: a Map keyed on the sorted class set, capped at MAX_CACHE
// entries with LRU eviction (Map iteration order is insertion order,
// so we delete + re-set on hit to refresh recency).
//
// On-disk: each (class set, config-fingerprint) pair gets a deterministic
// hash → `<cwd>/.stx/cache/cw-<hash>.css`. Persisting the result means
// the cache survives `bun --watch` restarts, fresh `git pull`s, and
// CI builds — turning the cold-start CSS regeneration penalty (~50KB
// of utilities, ~30-60ms) into a single file read.
//
// Eviction: 256 entries × ~50KB each ≈ 12MB upper bound. Plenty for a
// real app's distinct page shapes; trims unbounded growth in long-lived
// dev sessions where every navigation adds a new class signature.
const MAX_CACHE = 256
const cssByClassSet = new Map<string, string>()
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
 * Try to dynamically import crosswind from a given path
 */
async function tryImportCrosswind(importPath: string): Promise<CrosswindModule | null> {
  try {
    const pkg = await import(importPath)
    if (pkg && pkg.CSSGenerator) {
      return {
        CSSGenerator: pkg.CSSGenerator,
        config: pkg.config,
        build: pkg.build,
        defaultConfig: pkg.defaultConfig,
      }
    }
  }
  catch {
    // Silently fail, will try next path
  }
  return null
}

/**
 * Find potential crosswind paths by searching up the directory tree
 */
function findCrosswindPaths(): string[] {
  const paths: string[] = []
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''

  // Search from current working directory up. Check pantry/ as well as
  // node_modules/ at each level — pantry is Stacks' vendored package
  // store and the only place crosswind lives in pantry-managed projects
  // with no node_modules.
  let currentDir = process.cwd()
  while (currentDir !== path.dirname(currentDir)) {
    // Try @cwcss/crosswind first (new package name), in both stores
    paths.push(path.join(currentDir, 'node_modules', '@cwcss', 'crosswind', 'dist', 'index.js'))
    paths.push(path.join(currentDir, 'node_modules', '@cwcss', 'crosswind', 'src', 'index.ts'))
    paths.push(path.join(currentDir, 'pantry', '@cwcss', 'crosswind', 'dist', 'index.js'))
    paths.push(path.join(currentDir, 'pantry', '@cwcss', 'crosswind', 'src', 'index.ts'))
    // Also try @stacksjs/crosswind (legacy package name)
    paths.push(path.join(currentDir, 'node_modules', '@stacksjs', 'crosswind', 'dist', 'index.js'))
    paths.push(path.join(currentDir, 'pantry', '@stacksjs', 'crosswind', 'dist', 'index.js'))
    currentDir = path.dirname(currentDir)
  }

  // Common development locations (relative to home)
  if (homeDir) {
    const devPaths = [
      // crosswind monorepo (both dist and src)
      path.join(homeDir, 'Code', 'Tools', 'crosswind', 'packages', 'crosswind', 'dist', 'index.js'),
      path.join(homeDir, 'Code', 'Tools', 'crosswind', 'packages', 'crosswind', 'src', 'index.ts'),
      path.join(homeDir, 'repos', 'stacks-org', 'crosswind', 'packages', 'crosswind', 'dist', 'index.js'),
      path.join(homeDir, 'repos', 'stacks-org', 'crosswind', 'packages', 'crosswind', 'src', 'index.ts'),
      // stx monorepo's node_modules
      path.join(homeDir, 'Code', 'Tools', 'stx', 'packages', 'stx', 'node_modules', '@cwcss', 'crosswind', 'dist', 'index.js'),
      path.join(homeDir, 'Code', 'Tools', 'stx', 'packages', 'stx', 'node_modules', '@stacksjs', 'crosswind', 'dist', 'index.js'),
    ]
    paths.push(...devPaths)
  }

  // Also try relative to cwd for linked packages
  paths.push(path.join(process.cwd(), '..', 'crosswind', 'packages', 'crosswind', 'dist', 'index.js'))
  paths.push(path.join(process.cwd(), '..', 'crosswind', 'packages', 'crosswind', 'src', 'index.ts'))

  return paths
}

/**
 * Lazily load the Crosswind module
 * Returns null if Crosswind is not installed
 */
export async function loadCrosswind(): Promise<CrosswindModule | null> {
  if (crosswindLoadAttempted) {
    return crosswindModule
  }
  crosswindLoadAttempted = true

  try {
    // Strategy 1: Standard npm imports
    const importPaths = [
      '@cwcss/crosswind',
      '@cwcss/crosswind/dist/index.js',
      '@stacksjs/crosswind',
      '@stacksjs/crosswind/dist/index.js',
    ]

    for (const importPath of importPaths) {
      const result = await tryImportCrosswind(importPath)
      if (result) {
        crosswindModule = result
        if (!process.env.STACKS_DEV_QUIET)
          console.log(`${colors.green}[Crosswind]${colors.reset} CSS engine loaded`)
        return crosswindModule
      }
    }

    // Strategy 2: Search filesystem for linked packages
    const localPaths = findCrosswindPaths()
    for (const localPath of localPaths) {
      if (await Bun.file(localPath).exists()) {
        const result = await tryImportCrosswind(localPath)
        if (result) {
          crosswindModule = result
          if (!process.env.STACKS_DEV_QUIET)
            console.log(`${colors.green}[Crosswind]${colors.reset} CSS engine loaded from ${path.dirname(path.dirname(localPath))}`)
          return crosswindModule
        }
      }
    }

    throw new Error('Crosswind CSSGenerator not found in any location')
  }
  catch {
    console.warn(`${colors.yellow}[Crosswind] CSS engine not available, Tailwind styles will not be generated${colors.reset}`)
    console.warn(`${colors.yellow}Run 'bun add @stacksjs/crosswind' to enable CSS generation${colors.reset}`)
    return null
  }
}

/**
 * Reset the Crosswind module cache (useful for testing)
 */
export function resetCssCache(): void {
  cssByClassSet.clear()
}

export function resetCrosswindCache(): void {
  crosswindModule = null
  crosswindLoadAttempted = false
  cachedConfig = null
  cachedCSS = ''
  cssByClassSet.clear()
  // Don't blow away the on-disk cache here — tests reach for this
  // function to clear in-process state, and nuking the disk cache
  // every time would force every test to re-pay the regen cost. The
  // disk cache invalidates implicitly via configFingerprint in the
  // generator path.
  configFingerprint = null
}

/**
 * Load crosswind config from the working directory.
 *
 * Uses `bunfig` for resolution so crosswind configs compose the same way as
 * `stx.config.ts` and other stacks configs — a single source of truth for
 * config loading across the stack.
 *
 * Pre-check: we only hand off to bunfig once we've confirmed a
 * `crosswind.config.*` file actually exists in the target directory. When
 * stx is run from a parent repo root (e.g. running an example from the
 * monorepo root, or a page rendered before the app dir is known) bunfig's
 * built-in search would span 250+ paths up the tree and, on miss, log a
 * large stack-style error dump. The file-existence pre-check keeps the
 * common "no config file" case silent and fast.
 */
/**
 * Load the user's crosswind config via bunfig — our shared config loader.
 * bunfig's name-based search already covers `config/crosswind.ts`,
 * `.config/crosswind.ts`, and root-level `crosswind.config.{ts,js,mjs,cjs}`,
 * so we don't need to maintain a parallel list of paths here. Returns `null`
 * when no config file is present, so callers can fall through to defaults
 * without surfacing a "not found" warning to the user.
 */
export async function loadCrosswindConfig(cwd: string): Promise<CrosswindConfig | null> {
  try {
    const { loadConfigWithResult } = await import('bunfig')
    const result = await loadConfigWithResult<CrosswindConfig>({
      name: 'crosswind',
      cwd,
      defaultConfig: {} as CrosswindConfig,
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
      console.log(`${colors.green}[Crosswind]${colors.reset} Loaded config from ${rel || result.path}`)
    return result.config
  }
  catch (error) {
    // bunfig's strict-mode loader throws ConfigNotFoundError when the project
    // simply doesn't ship a `config/crosswind.ts` (or any other matching name).
    // That is the normal case — the caller falls through to Crosswind's
    // built-in defaults and there's nothing for the user to fix. Don't spam
    // the console with a "Failed to load" warning every time CSS regenerates.
    // Only surface the warning when something genuinely went wrong (syntax
    // error in the user's config, permission denied, etc.).
    if (error instanceof Error && error.name === 'ConfigNotFoundError')
      return null

    console.warn(`${colors.yellow}[Crosswind]${colors.reset} Failed to load crosswind config:`, error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Build Crosswind CSS using the build() API
 * This scans content files and generates CSS for all used classes
 */
export async function buildCrosswindCSS(cwd: string): Promise<string> {
  if (isBuilding) {
    return cachedCSS
  }
  isBuilding = true

  try {
    const hw = await loadCrosswind()
    if (!hw || !hw.build) {
      isBuilding = false
      return ''
    }

    // Load config if not cached
    if (!cachedConfig) {
      cachedConfig = await loadCrosswindConfig(cwd)
    }

    if (!cachedConfig) {
      // No config file, skip building
      isBuilding = false
      return ''
    }

    // Build with the config - deep merge theme to preserve defaults
    const defaultTheme = hw.defaultConfig?.theme || {}
    const userTheme = cachedConfig.theme || {}
    const config: CrosswindConfig = {
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
    console.log(`${colors.cyan}[Crosswind]${colors.reset} Built ${result.classes.size} classes in ${duration.toFixed(1)}ms`)

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
    console.error(`${colors.red}[Crosswind]${colors.reset} Build error:`, error)
    isBuilding = false
    return cachedCSS
  }
}

/**
 * Rebuild Crosswind CSS (called on file changes)
 */
export async function rebuildCrosswindCSS(cwd: string): Promise<void> {
  // Clear cached config to reload it
  cachedConfig = null
  await buildCrosswindCSS(cwd)
}

/**
 * Get the cached CSS (for serving)
 */
export function getCachedCSS(): string {
  return cachedCSS
}

/**
 * Extract all CSS class names from HTML content
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
 * Extract utility classes from HTML content and generate CSS using Crosswind
 */
export async function generateCrosswindCSS(htmlContent: string, appDir?: string): Promise<string> {
  try {
    // Load crosswind module
    const hw = await loadCrosswind()
    if (!hw) {
      return ''
    }

    const classes = extractClassNames(htmlContent)

    if (classes.size === 0) {
      return ''
    }

    // Resolve config search root — prefer the caller-supplied app dir so
    // `stx <app-dir>` from outside the app still finds its crosswind.config.
    // Fallback: `process.cwd()` (legacy behaviour).
    const resolveRoot = appDir ? path.resolve(appDir) : process.cwd()

    // Wire up the on-disk cache root once we know the app directory.
    // Putting it in `.stx/cache/` keeps it alongside the existing stx
    // page cache and behaves the same way under .gitignore conventions.
    if (!diskCacheRoot)
      diskCacheRoot = path.join(resolveRoot, '.stx/cache')

    // Cache lookup — keyed on the sorted class set + a fingerprint of
    // the loaded crosswind config. Different config (theme tokens,
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

    // Load the project's crosswind config
    // Priority: 1) stx.config.ts css field, 2) crosswind.config.ts auto-discovery
    if (!cachedConfig) {
      // Check if stx.config.ts specifies a CSS config path
      let stxCssConfig: CrosswindConfig | null = null
      try {
        const { loadStxConfig } = await import('../config')
        const stxConfig = await loadStxConfig(resolveRoot)
        if (stxConfig.css) {
          if (typeof stxConfig.css === 'string') {
            // Path to crosswind config file
            const configPath = path.isAbsolute(stxConfig.css) ? stxConfig.css : path.resolve(resolveRoot, stxConfig.css)
            if (await Bun.file(configPath).exists()) {
              const mod = await import(configPath)
              stxCssConfig = mod.default || mod
              console.log(`${colors.green}[Crosswind]${colors.reset} Loaded config from stx.config.ts → ${stxConfig.css}`)
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
            } as CrosswindConfig
            if (stxConfig.css.config) {
              const configPath = path.isAbsolute(stxConfig.css.config) ? stxConfig.css.config : path.resolve(resolveRoot, stxConfig.css.config)
              if (await Bun.file(configPath).exists()) {
                const mod = await import(configPath)
                const extConfig = mod.default || mod
                stxCssConfig = { ...extConfig, ...stxCssConfig }
              }
            }
            console.log(`${colors.green}[Crosswind]${colors.reset} Using inline CSS config from stx.config.ts`)
          }
        }
      }
      catch {}

      cachedConfig = stxCssConfig || await loadCrosswindConfig(resolveRoot)
      // Compute a fingerprint of the loaded config so cache keys
      // invalidate when the user edits crosswind.config.ts. JSON-stringify
      // is good enough — circular refs would have already broken the
      // config loader, and the fingerprint just needs to change when any
      // theme / safelist / shortcut edit changes.
      try {
        configFingerprint = shortHash(JSON.stringify(cachedConfig ?? {}))
      }
      catch {
        configFingerprint = 'unhashable'
      }
    }

    const baseConfig = hw.defaultConfig || hw.config
    const userConfig = cachedConfig || {}

    // Merge user theme.extend into base theme, preserving extend for CSSGenerator
    const baseTheme = baseConfig.theme || {}
    const userTheme = userConfig.theme || {}
    const userExtend = (userTheme as any).extend || {}

    // Build theme with extend preserved — CSSGenerator's constructor deep-merges extend
    const theme: Record<string, any> = { ...baseTheme }
    if (Object.keys(userExtend).length > 0) {
      theme.extend = userExtend
    }

    // Merge safelist
    const safelist = [
      ...(baseConfig.safelist || []),
      ...(userConfig.safelist || []),
    ]

    // Create config — CSSGenerator constructor handles theme.extend merging
    const crosswindConfig: CrosswindConfig = {
      ...baseConfig,
      ...userConfig,
      content: [],
      output: '',
      preflight: true,
      minify: false,
      theme,
      safelist,
    }

    // Generate CSS using Crosswind's CSSGenerator
    const generator = new hw.CSSGenerator(crosswindConfig)

    // Generate safelist classes
    for (const cls of safelist) {
      generator.generate(cls)
    }

    for (const className of classes) {
      generator.generate(className)
    }

    let css = generator.toCSS(true, false)

    // Generate shortcut CSS rules — CSSGenerator expands shortcuts into
    // individual utility classes but doesn't emit grouped .shortcut { ... } rules
    const shortcuts = crosswindConfig.shortcuts || (userConfig as any).shortcuts || {}
    for (const [name, classStr] of Object.entries(shortcuts)) {
      if (!classes.has(name) && !safelist.includes(name)) continue
      const parts = (classStr as string).split(/\s+/).filter(Boolean)
      for (const p of parts) generator.generate(p)
    }
    // Re-generate to include any new utility classes from shortcuts
    css = generator.toCSS(true, false)

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

    setLruCache(cacheKey, css)
    // Best-effort persistence so the next request after a server
    // restart (or the next CI build) skips the regeneration cost.
    void writeDiskCache(cacheKey, css)
    return css
  }
  catch (error) {
    console.warn('Failed to generate Crosswind CSS:', error)
    return ''
  }
}

/**
 * Inject generated CSS into HTML content
 * Tries to inject before </head>, falls back to <body> or prepends
 */
export async function injectCrosswindCSS(htmlContent: string, appDir?: string): Promise<string> {
  // Generate CSS for ALL utility classes in the (possibly shell-composed)
  // content. We must NOT early-return just because a `data-crosswind="generated"`
  // style already exists: when a page is composed into a pre-processed app shell,
  // the shell already carries a generated style covering the SHELL's classes
  // only (its nav/layout used e.g. `gap-4`). Early-returning there drops the
  // page's own utilities — `.grid` / `.grid-cols-*` never get emitted, so the
  // page lays out as `display:block`. Instead we regenerate from the full
  // content and REPLACE the existing style, so the single emitted stylesheet
  // covers the union of shell + page classes — with exactly one Preflight reset.
  // See stacksjs/stx#1749.
  const css = await generateCrosswindCSS(htmlContent, appDir)

  if (!css) {
    // Nothing to emit (no classes, or crosswind unavailable). Leave any existing
    // generated style in place rather than stripping it.
    return htmlContent
  }

  // Create a style tag with the generated CSS
  const styleTag = `<style data-crosswind="generated">\n${css}\n</style>`

  // If one or more generated styles already exist (e.g. from the composed
  // shell, or a recursive layout render), replace the first with the complete
  // one and drop any duplicates — keeping a single Preflight reset.
  const existing = /<style data-crosswind="generated">[\s\S]*?<\/style>/g
  if (existing.test(htmlContent)) {
    let placed = false
    return htmlContent.replace(existing, () => {
      if (placed)
        return ''
      placed = true
      return styleTag
    })
  }

  // Try to inject before </head>
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${styleTag}\n</head>`)
  }

  // Fallback: inject at the beginning of <body> or at the start
  if (htmlContent.includes('<body')) {
    return htmlContent.replace(/<body([^>]*)>/, `<body$1>\n${styleTag}`)
  }

  // Last resort: prepend to content
  return styleTag + htmlContent
}
