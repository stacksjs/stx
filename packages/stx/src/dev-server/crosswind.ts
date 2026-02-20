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
      if (fs.existsSync(localPath)) {
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
export function resetCrosswindCache(): void {
  crosswindModule = null
  crosswindLoadAttempted = false
  cachedConfig = null
  cachedCSS = ''
}

/**
 * Load crosswind config from the working directory
 */
export async function loadCrosswindConfig(cwd: string): Promise<CrosswindConfig | null> {
  const configFiles = [
    'crosswind.config.ts',
    'crosswind.config.js',
    'crosswind.config.mjs',
  ]

  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile)
    if (fs.existsSync(configPath)) {
      try {
        const configModule = await import(configPath)
        const config = configModule.default || configModule
        console.log(`${colors.green}[Crosswind]${colors.reset} Loaded config from ${configFile}`)
        return config
      }
      catch (error) {
        console.warn(`${colors.yellow}[Crosswind]${colors.reset} Failed to load ${configFile}:`, error)
      }
    }
  }

  return null
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

      fs.writeFileSync(outputPath, result.css)
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
  const classRegex = /class\s*=\s*["']([^"']+)["']/gi
  const classes = new Set<string>()

  let match = classRegex.exec(htmlContent)
  while (match !== null) {
    const classValue = match[1]
    // Split by whitespace and add each class
    for (const cls of classValue.split(/\s+/)) {
      if (cls.trim()) {
        classes.add(cls.trim())
      }
    }
    match = classRegex.exec(htmlContent)
  }

  return classes
}

/**
 * Extract utility classes from HTML content and generate CSS using Crosswind
 */
export async function generateCrosswindCSS(htmlContent: string): Promise<string> {
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

    // Load the project's crosswind.config.ts (or use module defaults)
    if (!cachedConfig) {
      cachedConfig = await loadCrosswindConfig(process.cwd())
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

    return generator.toCSS(true, false)
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
export async function injectCrosswindCSS(htmlContent: string): Promise<string> {
  const css = await generateCrosswindCSS(htmlContent)

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
