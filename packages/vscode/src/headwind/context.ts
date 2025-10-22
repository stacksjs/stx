import type { HeadwindConfig } from '@stacksjs/headwind'
import type * as vscode from 'vscode'

// Polyfill Bun APIs for Node.js environment (VSCode extension host)
function setupBunPolyfill() {
  if (typeof globalThis.Bun === 'undefined') {
    // Minimal Bun polyfill - only what @stacksjs/headwind needs
    (globalThis as any).Bun = {
      // Glob is used by Scanner class which we don't use in VSCode
      Glob: class FakeGlob {
        constructor(_pattern: string) {}
        async *scan(_dir: string): AsyncIterableIterator<string> {
          // No-op: We don't use Scanner in VSCode extension
        }
      },
      // file() is used by Scanner to read files - we don't need it
      file: (_path: string) => ({
        text: async () => '',
        exists: async () => false,
      }),
    }
  }
}

// Lazy load for ESM module compatibility
let CSSGenerator: any
let parseClass: any
let builtInRules: any
let headwindLoaded = false

async function loadHeadwind() {
  if (headwindLoaded) return

  // Setup Bun polyfill before importing headwind
  setupBunPolyfill()

  try {
    // Try dynamic import first for ESM module compatibility
    const headwind = await import('@stacksjs/headwind')
    CSSGenerator = headwind.CSSGenerator
    parseClass = headwind.parseClass
    builtInRules = headwind.builtInRules
    headwindLoaded = true
  } catch (error) {
    // Fallback to require for CommonJS bundled context
    try {
      const headwind = require('@stacksjs/headwind')
      CSSGenerator = headwind.CSSGenerator
      parseClass = headwind.parseClass
      builtInRules = headwind.builtInRules
      headwindLoaded = true
    } catch (requireError) {
      console.error('[Headwind] Failed to load @stacksjs/headwind:', error)
      throw new Error(`Cannot load @stacksjs/headwind: ${error}`)
    }
  }
}

/**
 * Manages the Headwind CSS generator instance
 */
export class HeadwindContext {
  private generator: CSSGenerator | null = null
  private generatedCSS: string = ''
  private classCache: Map<string, string> = new Map()

  private ready: Promise<void>

  constructor(private config: HeadwindConfig) {
    this.ready = this.initialize()
  }

  async waitReady(): Promise<void> {
    await this.ready
  }

  /**
   * Initialize the CSS generator
   */
  private async initialize(): Promise<void> {
    try {
      await loadHeadwind()
      this.generator = new CSSGenerator(this.config)
      console.log('[Headwind] CSS Generator initialized')
    }
    catch (error) {
      console.error('[Headwind] Failed to initialize generator:', error)
    }
  }

  /**
   * Get generated CSS for a specific utility class
   */
  async getCSSForClass(className: string): Promise<string | null> {
    await this.waitReady()

    if (!this.generator)
      return null

    // Check cache first
    if (this.classCache.has(className))
      return this.classCache.get(className)!

    try {
      await loadHeadwind()

      // Create a new generator instance for this single class
      // This ensures we only get CSS for the requested class
      const singleClassGenerator = new CSSGenerator(this.config)

      // Generate the class
      singleClassGenerator.generate(className)

      // Get CSS output (without preflight, not minified)
      const css = singleClassGenerator.toCSS(false, false)

      if (css && css.trim()) {
        this.classCache.set(className, css)
        return css
      }
    }
    catch (error) {
      console.error(`[Headwind] Error generating CSS for class "${className}":`, error)
    }

    return null
  }

  /**
   * Generate CSS for multiple classes
   */
  async generateCSS(classes: string[]): Promise<string> {
    if (!this.generator)
      return ''

    try {
      // Generate all classes
      for (const className of classes) {
        this.generator.generate(className)
      }

      // Get CSS output
      return this.generator.toCSS(false, false)
    }
    catch (error) {
      console.error('[Headwind] Error generating CSS:', error)
      return ''
    }
  }

  /**
   * Reload configuration
   */
  async reload(config: HeadwindConfig): Promise<void> {
    this.config = config
    this.generator = null
    this.classCache.clear()
    await this.initialize()
  }

  /**
   * Get all utility rules
   */
  getRules(): any[] {
    if (!this.generator)
      return []

    try {
      return (this.generator as any).rules || []
    }
    catch {
      return []
    }
  }

  /**
   * Check if a class name matches any rules
   */
  async matchesRule(className: string): Promise<boolean> {
    try {
      await loadHeadwind()

      // Parse the class
      const parsed = parseClass(className)

      // Test against all built-in rules (builtInRules is an array, not a function)
      for (const rule of builtInRules) {
        const result = rule(parsed, this.config)
        if (result) {
          return true
        }
      }

      return false
    }
    catch {
      return false
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.classCache.clear()
  }
}

/**
 * Get default Headwind configuration
 */
export function getDefaultConfig(vscodeModule: typeof vscode): HeadwindConfig {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath

  return {
    content: workspaceFolder
      ? [`${workspaceFolder}/**/*.{html,js,ts,jsx,tsx,stx,vue,svelte}`]
      : ['**/*.{html,js,ts,jsx,tsx,stx,vue,svelte}'],
    output: '', // We don't need file output for IDE features
    minify: false,
    watch: false, // Not needed for VSCode extension
    theme: {
      colors: {},
      spacing: {},
      fontSize: {},
      fontFamily: {},
      screens: {},
      borderRadius: {},
      boxShadow: {},
    },
    shortcuts: {},
    rules: [], // Empty array - will use built-in rules
    variants: {
      'responsive': true,
      'hover': true,
      'focus': true,
      'active': true,
      'disabled': true,
      'dark': true,
      'group': true,
      'peer': true,
      'before': true,
      'after': true,
      'marker': true,
      'first': true,
      'last': true,
      'odd': true,
      'even': true,
      'first-of-type': true,
      'last-of-type': true,
      'visited': true,
      'checked': true,
      'focus-within': true,
      'focus-visible': true,
      'placeholder': true,
      'selection': true,
      'file': true,
      'required': true,
      'valid': true,
      'invalid': true,
      'read-only': true,
      'autofill': true,
      'open': true,
      'closed': true,
      'empty': true,
      'enabled': true,
      'only': true,
      'target': true,
      'indeterminate': true,
      'default': true,
      'optional': true,
      'print': true,
      'rtl': true,
      'ltr': true,
      'motion-safe': true,
      'motion-reduce': true,
      'contrast-more': true,
      'contrast-less': true,
    },
    safelist: [],
    blocklist: [],
    preflights: [],
    presets: [],
  }
}

/**
 * Load Headwind configuration from workspace
 */
export async function loadHeadwindConfig(vscodeModule: typeof vscode): Promise<HeadwindConfig> {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath

  if (!workspaceFolder) {
    return getDefaultConfig(vscodeModule)
  }

  // Try to load headwind.config.ts or headwind.config.js
  try {
    const configPath = `${workspaceFolder}/headwind.config`
    const config = await import(configPath)
    return config.default || config
  }
  catch {
    // Fallback to default config
    return getDefaultConfig(vscodeModule)
  }
}
