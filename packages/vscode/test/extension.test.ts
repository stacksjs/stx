import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

// Mock VSCode API
const mockVscode = {
  workspace: {
    getConfiguration: () => ({
      get: () => {},
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
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
  },
  languages: {
    registerCompletionItemProvider: () => ({ dispose: () => {} }),
    registerHoverProvider: () => ({ dispose: () => {} }),
    registerDefinitionProvider: () => ({ dispose: () => {} }),
    registerDocumentLinkProvider: () => ({ dispose: () => {} }),
  },
  Disposable: {
    from: (...disposables: any[]) => ({
      dispose: () => disposables.forEach(d => d?.dispose?.()),
    }),
  },
  CompletionItemKind: {
    Snippet: 'snippet',
    Function: 'function',
    Variable: 'variable',
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
}

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-vscode')

// Get the correct package root - test file is in /packages/vscode/test/
const PACKAGE_ROOT = path.join(import.meta.dir, '..')

describe('VSCODE: Extension Tests', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    // Mock the VSCode module
    ;(globalThis as any).vscode = mockVscode
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
    // @ts-expect-error - vscode is not defined in global scope during cleanup
    delete globalThis.vscode
  })

  test('should have extension entry point', async () => {
    const extensionPath = path.join(PACKAGE_ROOT, 'src/extension.ts')
    const exists = await Bun.file(extensionPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(extensionPath).text()
    expect(content).toContain('activate')
    expect(content).toContain('deactivate')
  })

  test('should have proper package.json configuration', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const exists = await Bun.file(packagePath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    expect(packageJson.name).toBeDefined()
    expect(packageJson.displayName).toBeDefined()
    expect(packageJson.version).toBeDefined()
  })

  test('should register stx language configuration', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    expect(packageJson.contributes.languages).toBeDefined()
    const stxLanguage = packageJson.contributes.languages.find((lang: any) => lang.id === 'stx')
    expect(stxLanguage).toBeDefined()
    expect(stxLanguage.extensions).toContain('.stx')
  })

  test('should have language configuration file', async () => {
    const configPath = path.join(PACKAGE_ROOT, 'src/languages/stx.configuration.json')
    const exists = await Bun.file(configPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(configPath).text()
    const config = JSON.parse(content)
    expect(config.comments).toBeDefined()
    expect(config.brackets).toBeDefined()
    expect(config.autoClosingPairs).toBeDefined()
  })

  test('should have TextMate grammar file', async () => {
    const grammarPath = path.join(PACKAGE_ROOT, 'src/syntaxes/stx.tmLanguage.json')
    const exists = await Bun.file(grammarPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(grammarPath).text()
    const grammar = JSON.parse(content)
    expect(grammar.scopeName).toBeDefined()
    expect(grammar.name).toBeDefined()
    expect(grammar.patterns).toBeDefined()
  })

  test('should have completion provider', async () => {
    const completionPath = path.join(PACKAGE_ROOT, 'src/providers/completionProvider.ts')
    const exists = await Bun.file(completionPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(completionPath).text()
    expect(content).toContain('CompletionItemProvider')
    expect(content).toContain('provideCompletionItems')
  })

  test('should have hover provider', async () => {
    const hoverPath = path.join(PACKAGE_ROOT, 'src/providers/hoverProvider.ts')
    const exists = await Bun.file(hoverPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(hoverPath).text()
    expect(content).toContain('HoverProvider')
    expect(content).toContain('provideHover')
  })

  test('should have definition provider', async () => {
    const definitionPath = path.join(PACKAGE_ROOT, 'src/providers/definitionProvider.ts')
    const exists = await Bun.file(definitionPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(definitionPath).text()
    expect(content).toContain('DefinitionProvider')
    expect(content).toContain('provideDefinition')
  })

  test('should have document link provider', async () => {
    const linkPath = path.join(PACKAGE_ROOT, 'src/providers/documentLinkProvider.ts')
    const exists = await Bun.file(linkPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(linkPath).text()
    expect(content).toContain('DocumentLinkProvider')
    expect(content).toContain('provideDocumentLinks')
  })

  test('should have TypeScript stx plugin', async () => {
    const tsPluginPath = path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')
    const exists = await Bun.file(tsPluginPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(tsPluginPath).text()
    expect(content).toMatch(/LanguageServicePlugin|typescript/)
  })

  test('should have utility modules', async () => {
    const utilityPaths = [
      'src/utils/cssUtils.ts',
      'src/utils/stxUtils.ts',
      'src/utils/templateUtils.ts',
      'src/utils/jsdocUtils.ts',
    ].map(p => path.join(PACKAGE_ROOT, p))

    for (const utilPath of utilityPaths) {
      const exists = await Bun.file(utilPath).exists()
      expect(exists).toBe(true)

      const content = await Bun.file(utilPath).text()
      expect(content).toContain('export')
      expect(content.length).toBeGreaterThan(0)
    }
  })

  // UnoCSS has been replaced with Headwind - see headwind.test.ts for Headwind tests
  test('should NOT have UnoCSS integration (migrated to Headwind)', async () => {
    const unoIndexPath = path.join(PACKAGE_ROOT, 'src/styles-uno/index.ts')
    const exists = await Bun.file(unoIndexPath).exists()
    expect(exists).toBe(false)
  })

  test('should have snippet files', async () => {
    const snippetPath = path.join(PACKAGE_ROOT, 'src/snippets/stx.json')

    const exists = await Bun.file(snippetPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(snippetPath).text()
    const snippets = JSON.parse(content) as Record<string, { description?: string }>
    expect(Object.keys(snippets).length).toBeGreaterThan(0)

    // Verify we have both component and directive snippets
    expect(Object.values(snippets).some(s => s.description?.toLowerCase().includes('component'))).toBe(true)
    expect(Object.values(snippets).some(s => s.description?.toLowerCase().includes('directive'))).toBe(true)
  })

  test('should have example stx files', async () => {
    const examplePaths = [
      'examples/hello-world.stx',
      'examples/components/component-example.stx',
      'examples/directives/directives-example.stx',
      'examples/template-demo.stx',
    ].map(p => path.join(PACKAGE_ROOT, p))

    for (const examplePath of examplePaths) {
      const exists = await Bun.file(examplePath).exists()
      expect(exists).toBe(true)

      const content = await Bun.file(examplePath).text()
      expect(content.length).toBeGreaterThan(0)
    }
  })

  test('should validate extension icons', async () => {
    const iconPath = path.join(PACKAGE_ROOT, 'images/icon.png')
    const exists = await Bun.file(iconPath).exists()
    expect(exists).toBe(true)

    const logoPath = path.join(PACKAGE_ROOT, 'logo.png')
    const logoExists = await Bun.file(logoPath).exists()
    expect(logoExists).toBe(true)
  })

  test('should have proper build configuration', async () => {
    const buildPath = path.join(PACKAGE_ROOT, 'build.ts')
    const exists = await Bun.file(buildPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(buildPath).text()
    expect(content).toMatch(/build|Bun\.build|compile/)
  })

  test('should have proper TypeScript configuration', async () => {
    const tsconfigPath = path.join(PACKAGE_ROOT, 'tsconfig.json')
    const exists = await Bun.file(tsconfigPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(tsconfigPath).text()
    const tsconfig = JSON.parse(content)
    expect(tsconfig.compilerOptions).toBeDefined()
    expect(tsconfig.compilerOptions.target).toBeDefined()
    expect(tsconfig.compilerOptions.module).toBeDefined()
  })

  test('should have change log', async () => {
    const changelogPath = path.join(PACKAGE_ROOT, 'CHANGELOG.md')
    const exists = await Bun.file(changelogPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(changelogPath).text()
    // Changelog may be empty initially
    expect(content.length).toBeGreaterThanOrEqual(0)
  })

  test('should have proper VSCode ignore file', async () => {
    const vscodeignorePath = path.join(PACKAGE_ROOT, '.vscodeignore')
    const exists = await Bun.file(vscodeignorePath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(vscodeignorePath).text()
    expect(content).toContain('.vscode')
    expect(content.length).toBeGreaterThan(0)
  })

  test('should validate interface definitions', async () => {
    const interfacePaths = [
      'src/interfaces/index.ts',
      'src/interfaces/animation-types.ts',
    ].map(p => path.join(PACKAGE_ROOT, p))

    for (const interfacePath of interfacePaths) {
      const exists = await Bun.file(interfacePath).exists()
      expect(exists).toBe(true)

      const content = await Bun.file(interfacePath).text()
      expect(content).toMatch(/interface|type|export/)
    }
  })

  test('should have launch configuration for debugging', async () => {
    const launchPath = path.join(PACKAGE_ROOT, '.vscode/launch.json')
    const exists = await Bun.file(launchPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(launchPath).text()
    // Launch config may have comments, so just check for basic structure
    expect(content).toContain('configurations')
    expect(content).toContain('name')
    expect(content.length).toBeGreaterThan(0)
  })
})
