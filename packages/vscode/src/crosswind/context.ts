import type { CrosswindConfig } from '@cwcss/crosswind'
import type * as vscode from 'vscode'

// Polyfill Bun APIs for Node.js environment (VSCode extension host)
function setupBunPolyfill() {
  if (typeof globalThis.Bun === 'undefined') {
    (globalThis as any).Bun = {
      Glob: class FakeGlob {
        constructor(_pattern: string) {}
        async* scan(_dir: string): AsyncIterableIterator<string> {
          // No-op: Scanner is not used in VSCode extension
        }
      },
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
let crosswindLoaded = false

async function loadCrosswind() {
  if (crosswindLoaded)
    return

  setupBunPolyfill()

  try {
    const crosswind = await import('@cwcss/crosswind')
    CSSGenerator = crosswind.CSSGenerator
    parseClass = crosswind.parseClass
    builtInRules = crosswind.builtInRules
    crosswindLoaded = true
  }
  catch (error) {
    console.error('[Crosswind] Failed to load @cwcss/crosswind:', error)
    throw new Error(`Cannot load @cwcss/crosswind: ${error}`)
  }
}

/**
 * Manages the Crosswind CSS generator instance
 */
export class CrosswindContext {
  private generator: typeof CSSGenerator | null = null
  private classCache: Map<string, string> = new Map()
  private ready: Promise<void>

  constructor(private config: CrosswindConfig) {
    this.ready = this.initialize()
  }

  async waitReady(): Promise<void> {
    await this.ready
  }

  private async initialize(): Promise<void> {
    try {
      await loadCrosswind()
      this.generator = new CSSGenerator(this.config)
      // eslint-disable-next-line no-console
      console.log('[Crosswind] CSS Generator initialized')
    }
    catch (error) {
      console.error('[Crosswind] Failed to initialize generator:', error)
    }
  }

  async getCSSForClass(className: string): Promise<string | null> {
    await this.waitReady()

    if (!this.generator)
      return null

    if (this.classCache.has(className))
      return this.classCache.get(className)!

    try {
      await loadCrosswind()
      const singleClassGenerator = new CSSGenerator(this.config)
      singleClassGenerator.generate(className)
      const css = singleClassGenerator.toCSS(false, false)

      if (css && css.trim()) {
        this.classCache.set(className, css)
        return css
      }
    }
    catch (error) {
      console.error(`[Crosswind] Error generating CSS for class "${className}":`, error)
    }

    return null
  }

  async generateCSS(classes: string[]): Promise<string> {
    if (!this.generator)
      return ''

    try {
      for (const className of classes) {
        this.generator.generate(className)
      }
      return this.generator.toCSS(false, false)
    }
    catch (error) {
      console.error('[Crosswind] Error generating CSS:', error)
      return ''
    }
  }

  async reload(config: CrosswindConfig): Promise<void> {
    this.config = config
    this.generator = null
    this.classCache.clear()
    await this.initialize()
  }

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

  async matchesRule(className: string): Promise<boolean> {
    try {
      await loadCrosswind()
      const parsed = parseClass(className)

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

  clearCache(): void {
    this.classCache.clear()
  }
}

/**
 * Get default Crosswind configuration
 */
export function getDefaultConfig(vscodeModule: typeof vscode): CrosswindConfig {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath

  return {
    content: workspaceFolder
      ? [`${workspaceFolder}/**/*.{html,js,ts,jsx,tsx,stx,vue,svelte}`]
      : ['**/*.{html,js,ts,jsx,tsx,stx,vue,svelte}'],
    output: '',
    minify: false,
    watch: false,
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
    rules: [],
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
 * Load Crosswind configuration from workspace
 */
export async function loadCrosswindConfig(vscodeModule: typeof vscode): Promise<CrosswindConfig> {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath

  if (!workspaceFolder) {
    return getDefaultConfig(vscodeModule)
  }

  try {
    const configPath = `${workspaceFolder}/crosswind.config`
    const config = await import(configPath)
    return config.default || config
  }
  catch {
    return getDefaultConfig(vscodeModule)
  }
}
