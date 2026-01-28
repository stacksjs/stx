// @ts-nocheck - Skip type checking due to Headwind type version differences
/**
 * Headwind CSS Generation Module
 * Provides on-the-fly Tailwind CSS generation using Headwind
 */

import fs from 'node:fs'
import path from 'node:path'
import { colors } from './terminal-colors'

// Type for Headwind module
interface HeadwindModule {
  CSSGenerator: new (config: HeadwindConfig) => CSSGenerator
  config: HeadwindConfig
  build?: (config: HeadwindConfig) => Promise<HeadwindBuildResult>
  defaultConfig?: HeadwindConfig
}

interface HeadwindConfig {
  content?: string[]
  output?: string
  preflight?: boolean
  minify?: boolean
  preflights?: unknown[]
  safelist?: string[]
  [key: string]: unknown
}

interface HeadwindBuildResult {
  css: string
  classes: Set<string>
  duration: number
}

interface CSSGenerator {
  generate(className: string): void
  toCSS(preflight: boolean, minify: boolean): string
}

// Headwind lazy loading cache
let headwindModule: HeadwindModule | null = null
let headwindLoadAttempted = false

// Cached config and CSS for dev server
let cachedConfig: HeadwindConfig | null = null
let cachedCSS: string = ''
let isBuilding = false

/**
 * Lazily load the Headwind module
 * Returns null if Headwind is not installed
 */
export async function loadHeadwind(): Promise<HeadwindModule | null> {
  if (headwindLoadAttempted) {
    return headwindModule
  }
  headwindLoadAttempted = true

  try {
    // Dynamic import to make headwind optional
    // Try multiple resolution strategies for linked packages
    let HeadwindPkg

    // Strategy 1: Standard import
    try {
      HeadwindPkg = await import('@stacksjs/headwind')
    }
    catch {
      // Strategy 2: Try importing from dist directly
      try {
        HeadwindPkg = await import('@stacksjs/headwind/dist/index.js')
      }
      catch {
        // Strategy 3: Resolve from this package's node_modules (for linked packages)
        // This handles cases where stx is linked and headwind is in stx's node_modules
        const stxDir = path.dirname(path.dirname(path.dirname(new URL(import.meta.url).pathname)))
        const headwindPath = path.join(stxDir, 'node_modules', '@stacksjs', 'headwind', 'dist', 'index.js')
        if (fs.existsSync(headwindPath)) {
          HeadwindPkg = await import(headwindPath)
        }
      }
    }

    if (HeadwindPkg && HeadwindPkg.CSSGenerator) {
      headwindModule = {
        CSSGenerator: HeadwindPkg.CSSGenerator,
        config: HeadwindPkg.config,
        build: HeadwindPkg.build,
        defaultConfig: HeadwindPkg.defaultConfig,
      }
      console.log(`${colors.green}[Headwind]${colors.reset} CSS engine loaded`)
      return headwindModule
    }
    throw new Error('Headwind CSSGenerator not found')
  }
  catch {
    console.warn(`${colors.yellow}[Headwind] CSS engine not available, Tailwind styles will not be generated${colors.reset}`)
    console.warn(`${colors.yellow}Run 'bun add @stacksjs/headwind' to enable CSS generation${colors.reset}`)
    return null
  }
}

/**
 * Reset the Headwind module cache (useful for testing)
 */
export function resetHeadwindCache(): void {
  headwindModule = null
  headwindLoadAttempted = false
  cachedConfig = null
  cachedCSS = ''
}

/**
 * Load headwind config from the working directory
 */
export async function loadHeadwindConfig(cwd: string): Promise<HeadwindConfig | null> {
  const configFiles = [
    'headwind.config.ts',
    'headwind.config.js',
    'headwind.config.mjs',
  ]

  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile)
    if (fs.existsSync(configPath)) {
      try {
        const configModule = await import(configPath)
        const config = configModule.default || configModule
        console.log(`${colors.green}[Headwind]${colors.reset} Loaded config from ${configFile}`)
        return config
      }
      catch (error) {
        console.warn(`${colors.yellow}[Headwind]${colors.reset} Failed to load ${configFile}:`, error)
      }
    }
  }

  return null
}

/**
 * Build Headwind CSS using the build() API
 * This scans content files and generates CSS for all used classes
 */
export async function buildHeadwindCSS(cwd: string): Promise<string> {
  if (isBuilding) {
    return cachedCSS
  }
  isBuilding = true

  try {
    const hw = await loadHeadwind()
    if (!hw || !hw.build) {
      isBuilding = false
      return ''
    }

    // Load config if not cached
    if (!cachedConfig) {
      cachedConfig = await loadHeadwindConfig(cwd)
    }

    if (!cachedConfig) {
      // No config file, skip building
      isBuilding = false
      return ''
    }

    // Build with the config - deep merge theme to preserve defaults
    const defaultTheme = hw.defaultConfig?.theme || {}
    const userTheme = cachedConfig.theme || {}
    const config: HeadwindConfig = {
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
    console.log(`${colors.cyan}[Headwind]${colors.reset} Built ${result.classes.size} classes in ${duration.toFixed(1)}ms`)

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
    console.error(`${colors.red}[Headwind]${colors.reset} Build error:`, error)
    isBuilding = false
    return cachedCSS
  }
}

/**
 * Rebuild Headwind CSS (called on file changes)
 */
export async function rebuildHeadwindCSS(cwd: string): Promise<void> {
  // Clear cached config to reload it
  cachedConfig = null
  await buildHeadwindCSS(cwd)
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
 * Extract utility classes from HTML content and generate CSS using Headwind
 */
export async function generateHeadwindCSS(htmlContent: string): Promise<string> {
  try {
    // Load headwind module
    const hw = await loadHeadwind()
    if (!hw) {
      return ''
    }

    const classes = extractClassNames(htmlContent)

    if (classes.size === 0) {
      return ''
    }

    // Load the project's Headwind config (or use defaults)
    const projectConfig = hw.config

    // Create a Headwind config for on-the-fly generation
    const headwindConfig: HeadwindConfig = {
      ...projectConfig,
      content: [],
      output: '',
      preflight: true,
      minify: false,
    }

    // Generate CSS using Headwind's CSSGenerator
    const generator = new hw.CSSGenerator(headwindConfig)

    for (const className of classes) {
      generator.generate(className)
    }

    return generator.toCSS(true, false)
  }
  catch (error) {
    console.warn('Failed to generate Headwind CSS:', error)
    return ''
  }
}

/**
 * Inject generated CSS into HTML content
 * Tries to inject before </head>, falls back to <body> or prepends
 */
export async function injectHeadwindCSS(htmlContent: string): Promise<string> {
  const css = await generateHeadwindCSS(htmlContent)

  if (!css) {
    return htmlContent
  }

  // Create a style tag with the generated CSS
  const styleTag = `<style data-headwind="generated">\n${css}\n</style>`

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
