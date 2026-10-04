import type { CssConfig } from '@stacksjs/ts-css/engine'
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
let cssLoaded = false

/**
 * Load the utility-CSS engine, the `engine` subpath of `@stacksjs/ts-css`.
 *
 * The specifier is a literal on purpose. The extension ships as a single
 * bundled file with no `node_modules` (`vsce package --no-dependencies`), so
 * the bundler has to see the import to inline the engine. A specifier held in
 * a variable compiled to a runtime `import()` that found nothing in the
 * installed extension, and every utility-class feature failed to activate.
 */
export async function importCssEngine(): Promise<typeof import('@stacksjs/ts-css/engine')> {
  setupBunPolyfill()
  return await import('@stacksjs/ts-css/engine')
}

async function loadCssEngine() {
  if (cssLoaded)
    return

  try {
    const css = await importCssEngine()
    CSSGenerator = css.CSSGenerator
    parseClass = css.parseClass
    builtInRules = css.builtInRules
    cssLoaded = true
  }
  catch (error) {
    console.error('[ts-css] Failed to load the CSS engine from @stacksjs/ts-css/engine:', error)
    throw new Error(`Cannot load the CSS engine: ${error}`)
  }
}

/**
 * Manages the Css CSS generator instance
 */
export class CssContext {
  private generator: typeof CSSGenerator | null = null
  private classCache: Map<string, string> = new Map()
  private ready: Promise<void>

  constructor(private config: CssConfig) {
    this.ready = this.initialize()
  }

  async waitReady(): Promise<void> {
    await this.ready
  }

  private async initialize(): Promise<void> {
    try {
      await loadCssEngine()
      this.generator = new CSSGenerator(this.config)
      // eslint-disable-next-line no-console
      console.log('[ts-css] CSS Generator initialized')
    }
    catch (error) {
      console.error('[ts-css] Failed to initialize generator:', error)
    }
  }

  async getCSSForClass(className: string): Promise<string | null> {
    await this.waitReady()

    if (!this.generator)
      return null

    if (this.classCache.has(className))
      return this.classCache.get(className)!

    try {
      await loadCssEngine()
      const singleClassGenerator = new CSSGenerator(this.config)
      singleClassGenerator.generate(className)
      const css = singleClassGenerator.toCSS(false, false)

      if (css && css.trim()) {
        this.classCache.set(className, css)
        return css
      }
    }
    catch (error) {
      console.error(`[ts-css] Error generating CSS for class "${className}":`, error)
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
      console.error('[ts-css] Error generating CSS:', error)
      return ''
    }
  }

  async reload(config: CssConfig): Promise<void> {
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
      await loadCssEngine()
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
 * Get default Css configuration
 */
export function getDefaultConfig(vscodeModule: typeof vscode): CssConfig {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath

  return {
    content: workspaceFolder
      ? [`${workspaceFolder}/**/*.{html,js,ts,jsx,tsx,stx,vue,svelte}`]
      : ['**/*.{html,js,ts,jsx,tsx,stx,vue,svelte}'],
    output: '',
    minify: true,
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
 * Load Css configuration from workspace
 */
export async function loadCssEngineConfig(vscodeModule: typeof vscode): Promise<CssConfig> {
  const workspaceFolder = vscodeModule.workspace.workspaceFolders?.[0]?.uri.fsPath

  if (!workspaceFolder) {
    return getDefaultConfig(vscodeModule)
  }

  try {
    const configPath = `${workspaceFolder}/css.config`
    const config = await import(configPath)
    return config.default || config
  }
  catch {
    return getDefaultConfig(vscodeModule)
  }
}
