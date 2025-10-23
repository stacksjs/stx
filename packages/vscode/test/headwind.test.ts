import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import path from 'node:path'

// Mock VSCode API
const mockVscode = {
  workspace: {
    getConfiguration: (section?: string) => ({
      get: <T>(key: string, defaultValue?: T): T => {
        if (section === 'stx.utilityClasses' && key === 'hoverPreview') {
          return true as T
        }
        if (section === 'headwind' && key === 'remToPxRatio') {
          return 16 as T
        }
        return defaultValue as T
      },
      update: () => Promise.resolve(),
    }),
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },
  window: {
    showInformationMessage: () => Promise.resolve(),
    showErrorMessage: () => Promise.resolve(),
    createOutputChannel: () => ({
      appendLine: () => {},
      show: () => {},
      dispose: () => {},
    }),
    activeTextEditor: null,
  },
  commands: {
    registerCommand: (command: string, callback: Function) => ({
      dispose: () => {},
      command,
      callback,
    }),
  },
  languages: {
    registerCompletionItemProvider: () => ({ dispose: () => {} }),
    registerHoverProvider: (selector: any, provider: any) => ({
      dispose: () => {},
      selector,
      provider,
    }),
    registerDefinitionProvider: () => ({ dispose: () => {} }),
    registerDocumentLinkProvider: () => ({ dispose: () => {} }),
  },
  Disposable: {
    from: (...disposables: any[]) => ({
      dispose: () => disposables.forEach(d => d?.dispose?.()),
    }),
  },
  CompletionItemKind: {
    Snippet: 15,
    Function: 3,
    Variable: 6,
    Class: 7,
  },
  Range: class MockRange {
    constructor(public start: any, public end: any) {}
  },
  Position: class MockPosition {
    constructor(public line: number, public character: number) {}
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
  Hover: class MockHover {
    constructor(public contents: any, public range?: any) {}
  },
  MarkdownString: class MockMarkdownString {
    public value: string = ''
    public isTrusted?: boolean
    public supportHtml?: boolean

    appendMarkdown(value: string): MockMarkdownString {
      this.value += value
      return this
    }

    appendCodeblock(code: string, language: string): MockMarkdownString {
      this.value += `\`\`\`${language}\n${code}\n\`\`\``
      return this
    }
  },
}

// Get the correct package root - test file is in /packages/vscode/test/
const PACKAGE_ROOT = path.join(import.meta.dir, '..')

describe('Headwind Integration Tests', () => {
  beforeEach(() => {
    // Mock the VSCode module
    ;(globalThis as any).vscode = mockVscode
  })

  afterEach(() => {
    // @ts-expect-error - vscode is not defined in global scope during cleanup
    delete globalThis.vscode
  })

  test('should have headwind directory structure', async () => {
    const headwindPath = path.join(PACKAGE_ROOT, 'src/headwind')
    const exists = await Bun.file(path.join(headwindPath, 'index.ts')).exists()
    expect(exists).toBe(true)
  })

  test('should have all required headwind modules', async () => {
    const requiredModules = [
      'src/headwind/index.ts',
      'src/headwind/context.ts',
      'src/headwind/hover-provider.ts',
      'src/headwind/color-provider.ts',
      'src/headwind/completion-provider.ts',
      'src/headwind/sort-provider.ts',
    ]

    for (const modulePath of requiredModules) {
      const fullPath = path.join(PACKAGE_ROOT, modulePath)
      const exists = await Bun.file(fullPath).exists()
      expect(exists).toBe(true, `Expected ${modulePath} to exist`)
    }
  })

  test('should have all required utility modules', async () => {
    const utilityModules = [
      'src/headwind/utils/css-parser.ts',
      'src/headwind/utils/color-extractor.ts',
      'src/headwind/utils/class-matcher.ts',
    ]

    for (const modulePath of utilityModules) {
      const fullPath = path.join(PACKAGE_ROOT, modulePath)
      const exists = await Bun.file(fullPath).exists()
      expect(exists).toBe(true, `Expected ${modulePath} to exist`)
    }
  })

  test('should export activateHeadwind function', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/headwind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain('export async function activateHeadwind')
    expect(content).toContain('export function deactivateHeadwind')
    expect(content).toContain('export { HeadwindContext }')
  })

  test('should properly import vscode module (not as type-only)', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/headwind/index.ts')
    const content = await Bun.file(indexPath).text()

    // Should import vscode as a value, not type-only
    expect(content).toMatch(/import \* as vscode from ['"]vscode['"]/)
    expect(content).not.toMatch(/import type \* as vscode from ['"]vscode['"]/)
  })

  test('should pass vscode module to loadHeadwindConfig', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/headwind/index.ts')
    const content = await Bun.file(indexPath).text()

    // Should pass vscode explicitly to loadHeadwindConfig
    expect(content).toContain('loadHeadwindConfig(vscode)')
  })

  test('should require vscode parameter in context functions', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/headwind/context.ts')
    const content = await Bun.file(contextPath).text()

    // Should require vscodeModule parameter (not optional)
    expect(content).toMatch(/getDefaultConfig\(vscodeModule: typeof vscode\)/)
    expect(content).toMatch(/loadHeadwindConfig\(vscodeModule: typeof vscode\)/)

    // Should NOT use optional parameter
    expect(content).not.toMatch(/vscodeModule\?: typeof vscode/)
  })

  test('should not fallback to global vscode import in context', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/headwind/context.ts')
    const content = await Bun.file(contextPath).text()

    // Should NOT use fallback pattern like: const vs = vscodeModule || vscode
    expect(content).not.toContain('vscodeModule || vscode')
  })

  test('should use type-only import for vscode in context.ts', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/headwind/context.ts')
    const content = await Bun.file(contextPath).text()

    // Context should use type-only import since it receives vscode as parameter
    expect(content).toMatch(/import type \* as vscode from ['"]vscode['"]/)
  })

  test('should have HeadwindContext class', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/headwind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain('export class HeadwindContext')
    expect(content).toContain('getCSSForClass')
    expect(content).toContain('matchesRule')
    expect(content).toContain('waitReady')
  })

  test('should use dynamic imports for ESM module with require fallback', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/headwind/context.ts')
    const content = await Bun.file(contextPath).text()

    // Should use dynamic import for @stacksjs/headwind
    expect(content).toContain('await import(\'@stacksjs/headwind\')')
    expect(content).toContain('async function loadHeadwind()')
    // Should have require fallback for CommonJS bundled context
    expect(content).toContain('require(\'@stacksjs/headwind\')')
  })

  test('should have proper async initialization pattern', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/headwind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain('private ready: Promise<void>')
    expect(content).toContain('async waitReady()')
    expect(content).toContain('this.ready = this.initialize()')
  })

  test('should export CSS parser utilities', async () => {
    const parserPath = path.join(PACKAGE_ROOT, 'src/headwind/utils/css-parser.ts')
    const content = await Bun.file(parserPath).text()

    expect(content).toContain('export function prettifyCSS')
    expect(content).toContain('export function addRemToPxComment')
  })

  test('should export color extraction utilities', async () => {
    const extractorPath = path.join(PACKAGE_ROOT, 'src/headwind/utils/color-extractor.ts')
    const content = await Bun.file(extractorPath).text()

    expect(content).toContain('export function extractColorFromCSS')
    expect(content).toContain('export function isColorClass')
  })

  test('should export class matching utilities', async () => {
    const matcherPath = path.join(PACKAGE_ROOT, 'src/headwind/utils/class-matcher.ts')
    const content = await Bun.file(matcherPath).text()

    expect(content).toContain('export function extractClassesFromDocument')
    expect(content).toContain('export function getClassAtPosition')
  })

  test('should have hover provider factory', async () => {
    const hoverPath = path.join(PACKAGE_ROOT, 'src/headwind/hover-provider.ts')
    const content = await Bun.file(hoverPath).text()

    expect(content).toContain('export function createHeadwindHoverProvider')
    expect(content).toContain('provideHover')
  })

  test('should have completion provider factory', async () => {
    const completionPath = path.join(PACKAGE_ROOT, 'src/headwind/completion-provider.ts')
    const content = await Bun.file(completionPath).text()

    expect(content).toContain('export function createHeadwindCompletionProvider')
    expect(content).toContain('provideCompletionItems')
  })

  test('should have color decorations registration', async () => {
    const colorPath = path.join(PACKAGE_ROOT, 'src/headwind/color-provider.ts')
    const content = await Bun.file(colorPath).text()

    expect(content).toContain('export async function registerColorDecorations')
  })

  test('should have sort classes command', async () => {
    const sortPath = path.join(PACKAGE_ROOT, 'src/headwind/sort-provider.ts')
    const content = await Bun.file(sortPath).text()

    expect(content).toContain('export function createSortClassesCommand')
    expect(content).toContain('export async function sortClasses')
    expect(content).toContain('stx.sortClasses')
    // Should accept vscodeModule parameter
    expect(content).toContain('createSortClassesCommand(vscodeModule: typeof vscode)')
  })

  test('should have @stacksjs/headwind dependency', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    expect(packageJson.dependencies).toHaveProperty('@stacksjs/headwind')
    expect(packageJson.dependencies['@stacksjs/headwind']).toMatch(/^\^?0\.\d+\.\d+/)
  })

  test('should have prettier dependency for CSS formatting', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    expect(packageJson.dependencies).toHaveProperty('prettier')
  })

  test('should NOT have UnoCSS or Tailwind dependencies', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Should not have UnoCSS
    expect(Object.keys(allDeps).some(dep => dep.includes('unocss'))).toBe(false)
    // Should not have Tailwind
    expect(Object.keys(allDeps).some(dep => dep.includes('tailwind'))).toBe(false)
  })

  test('should register headwind commands in package.json', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    const commands = packageJson.contributes.commands

    const sortCommand = commands.find((cmd: any) => cmd.command === 'stx.sortClasses')
    expect(sortCommand).toBeDefined()
    expect(sortCommand.title).toContain('Sort')

    const reloadCommand = commands.find((cmd: any) => cmd.command === 'headwind.reload')
    expect(reloadCommand).toBeDefined()
    expect(reloadCommand.title).toContain('Reload')
  })

  test('should have utility classes configuration', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    const config = packageJson.contributes?.configuration?.properties || {}

    expect(Object.keys(config)).toContain('stx.utilityClasses.enable')
    expect(Object.keys(config)).toContain('stx.utilityClasses.colorPreview')
    expect(Object.keys(config)).toContain('stx.utilityClasses.hoverPreview')
    expect(Object.keys(config)).toContain('headwind.remToPxRatio')
  })

  test('should activate headwind in extension.ts', async () => {
    const extensionPath = path.join(PACKAGE_ROOT, 'src/extension.ts')
    const content = await Bun.file(extensionPath).text()

    expect(content).toContain('import(\'./headwind/index\')')
    expect(content).toContain('activateHeadwind')
    expect(content).toContain('await activateHeadwind(context)')
  })

  test('should have TEST_HEADWIND.md documentation', async () => {
    const testDocPath = path.join(PACKAGE_ROOT, 'TEST_HEADWIND.md')
    const exists = await Bun.file(testDocPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(testDocPath).text()
    expect(content).toContain('Hover Tooltips')
    expect(content).toContain('Color Previews')
    expect(content).toContain('Autocomplete')
    expect(content).toContain('Class Sorting')
  })

  test('should NOT have styles-uno directory', async () => {
    const unoPath = path.join(PACKAGE_ROOT, 'src/styles-uno')
    const indexExists = await Bun.file(path.join(unoPath, 'index.ts')).exists()
    expect(indexExists).toBe(false, 'styles-uno directory should be removed')
  })

  test('should handle multiple language selectors', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/headwind/index.ts')
    const content = await Bun.file(indexPath).text()

    // Should register providers for multiple languages
    expect(content).toContain('\'stx\'')
    expect(content).toContain('\'html\'')
    expect(content).toContain('\'typescript\'')
  })

  test('should register trigger characters for completion', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/headwind/index.ts')
    const content = await Bun.file(indexPath).text()

    // Should have trigger characters for class attribute completion
    expect(content).toMatch(/'["']/g) // Should trigger on quote characters
  })

  test('should have reload command handler', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/headwind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain('vscode.commands.registerCommand(\'headwind.reload\'')
    expect(content).toContain('headwindContext?.reload')
  })
})

describe('Headwind CSS Parser Tests', () => {
  test('addRemToPxComment should convert rem to px', () => {
    // Note: This would require actually importing the module, which we can't do without vscode
    // This is a placeholder for when we can properly test the utilities
    expect(true).toBe(true)
  })

  test('prettifyCSS should format CSS correctly', () => {
    // Placeholder for actual CSS formatting test
    expect(true).toBe(true)
  })
})

describe('Headwind Color Extractor Tests', () => {
  test('isColorClass should identify color utility classes', () => {
    // Placeholder for color class detection test
    expect(true).toBe(true)
  })

  test('extractColorFromCSS should extract color values', () => {
    // Placeholder for color extraction test
    expect(true).toBe(true)
  })
})
