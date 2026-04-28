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

// Memoize generateCrosswindCSS output by sorted class-set string. The dev
// server runs under `bun --watch`; any source/config edit restarts the
// process, which naturally drops this cache — so we don't need a watcher
// here. Same set of classes + same cached config → identical CSS, so this
// turns the second-and-later renders of the same page into a Map lookup.
const cssByClassSet = new Map<string, string>()

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

  // Search from current working directory up
  let currentDir = process.cwd()
  while (currentDir !== path.dirname(currentDir)) {
    // Try @cwcss/crosswind first (new package name)
    paths.push(path.join(currentDir, 'node_modules', '@cwcss', 'crosswind', 'dist', 'index.js'))
    paths.push(path.join(currentDir, 'node_modules', '@cwcss', 'crosswind', 'src', 'index.ts'))
    // Also try @stacksjs/crosswind (legacy package name)
    paths.push(path.join(currentDir, 'node_modules', '@stacksjs', 'crosswind', 'dist', 'index.js'))
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
    console.log(`${colors.green}[Crosswind]${colors.reset} Loaded config from ${rel || result.path}`)
    return result.config
  }
  catch (error) {
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

    // Cache lookup — same class set always produces the same CSS as long as
    // the cached config + safelist haven't changed. `bun --watch` restarts
    // the process on config/source edits, which clears this map for free.
    const cacheKey = [...classes].sort().join(' ')
    const cached = cssByClassSet.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // Resolve config search root — prefer the caller-supplied app dir so
    // `stx <app-dir>` from outside the app still finds its crosswind.config.
    // Fallback: `process.cwd()` (legacy behaviour).
    const resolveRoot = appDir ? path.resolve(appDir) : process.cwd()

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
            // Inline CSS config object
            stxCssConfig = {
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

    cssByClassSet.set(cacheKey, css)
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
  // Skip if Crosswind CSS already injected (prevents duplicate Preflight resets
  // from recursive processDirectives calls via layout resolution)
  if (htmlContent.includes('data-crosswind="generated"')) {
    return htmlContent
  }

  const css = await generateCrosswindCSS(htmlContent, appDir)

  if (!css) {
    return htmlContent
  }

  // Create a style tag with the generated CSS
  const styleTag = `<style data-crosswind="generated">\n${css}\n</style>`

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
