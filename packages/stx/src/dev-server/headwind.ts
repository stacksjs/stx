/**
 * Headwind CSS Generation Module
 * Provides on-the-fly Tailwind CSS generation using Headwind
 */

import { colors } from './terminal-colors'

// Type for Headwind module
interface HeadwindModule {
  CSSGenerator: new (config: HeadwindConfig) => CSSGenerator
  config: HeadwindConfig
}

interface HeadwindConfig {
  content?: string[]
  output?: string
  preflight?: boolean
  minify?: boolean
  [key: string]: unknown
}

interface CSSGenerator {
  generate(className: string): void
  toCSS(preflight: boolean, minify: boolean): string
}

// Headwind lazy loading cache
let headwindModule: HeadwindModule | null = null
let headwindLoadAttempted = false

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
    const HeadwindPkg = await import('@stacksjs/headwind')
    if (HeadwindPkg && HeadwindPkg.CSSGenerator) {
      headwindModule = {
        CSSGenerator: HeadwindPkg.CSSGenerator,
        config: HeadwindPkg.config,
      }
      console.log(`${colors.green}[Headwind] CSS engine loaded successfully${colors.reset}`)
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
