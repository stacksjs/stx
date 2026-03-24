import { describe, expect, test } from 'bun:test'
import path from 'node:path'

const PACKAGE_ROOT = path.join(import.meta.dir, '..')

describe('Crosswind Integration Tests', () => {
  test('should have crosswind directory structure', async () => {
    const crosswindPath = path.join(PACKAGE_ROOT, 'src/crosswind')
    const exists = await Bun.file(path.join(crosswindPath, 'index.ts')).exists()
    expect(exists).toBe(true)
  })

  test('should have all required crosswind modules', async () => {
    const requiredModules = [
      'src/crosswind/index.ts',
      'src/crosswind/context.ts',
      'src/crosswind/hover-provider.ts',
      'src/crosswind/color-provider.ts',
      'src/crosswind/completion-provider.ts',
      'src/crosswind/sort-provider.ts',
    ]

    for (const modulePath of requiredModules) {
      const fullPath = path.join(PACKAGE_ROOT, modulePath)
      const exists = await Bun.file(fullPath).exists()
      expect(exists).toBe(true)
    }
  })

  test('should have all required utility modules', async () => {
    const utilityModules = [
      'src/crosswind/utils/css-parser.ts',
      'src/crosswind/utils/color-extractor.ts',
      'src/crosswind/utils/class-matcher.ts',
    ]

    for (const modulePath of utilityModules) {
      const fullPath = path.join(PACKAGE_ROOT, modulePath)
      const exists = await Bun.file(fullPath).exists()
      expect(exists).toBe(true)
    }
  })

  test('should export activateCrosswind function', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/crosswind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain('export async function activateCrosswind')
    expect(content).toContain('export function deactivateCrosswind')
    expect(content).toContain('export { CrosswindContext }')
  })

  test('should properly import vscode module (not as type-only)', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/crosswind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toMatch(/import \* as vscode from ['"]vscode['"]/)
    expect(content).not.toMatch(/import type \* as vscode from ['"]vscode['"]/)
  })

  test('should pass vscode module to loadCrosswindConfig', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/crosswind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain('loadCrosswindConfig(vscode)')
  })

  test('should require vscode parameter in context functions', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toMatch(/getDefaultConfig\(vscodeModule: typeof vscode\)/)
    expect(content).toMatch(/loadCrosswindConfig\(vscodeModule: typeof vscode\)/)
    expect(content).not.toMatch(/vscodeModule\?: typeof vscode/)
  })

  test('should not fallback to global vscode import in context', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).not.toContain('vscodeModule || vscode')
  })

  test('should use type-only import for vscode in context.ts', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toMatch(/import type \* as vscode from ['"]vscode['"]/)
  })

  test('should have CrosswindContext class', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain('export class CrosswindContext')
    expect(content).toContain('getCSSForClass')
    expect(content).toContain('matchesRule')
    expect(content).toContain('waitReady')
  })

  test('should use dynamic imports for ESM module', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain("await import('@cwcss/crosswind')")
    expect(content).toContain('async function loadCrosswind()')
  })

  test('should have proper async initialization pattern', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain('private ready: Promise<void>')
    expect(content).toContain('async waitReady()')
    expect(content).toContain('this.ready = this.initialize()')
  })

  test('should export CSS parser utilities', async () => {
    const parserPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/css-parser.ts')
    const content = await Bun.file(parserPath).text()

    expect(content).toContain('export function prettifyCSS')
    expect(content).toContain('export function addRemToPxComment')
  })

  test('should export color extraction utilities', async () => {
    const extractorPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/color-extractor.ts')
    const content = await Bun.file(extractorPath).text()

    expect(content).toContain('export function extractColorFromCSS')
    expect(content).toContain('export function isColorClass')
  })

  test('should export class matching utilities', async () => {
    const matcherPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/class-matcher.ts')
    const content = await Bun.file(matcherPath).text()

    expect(content).toContain('export function extractClassesFromDocument')
    expect(content).toContain('export function getClassAtPosition')
  })

  test('should have hover provider factory', async () => {
    const hoverPath = path.join(PACKAGE_ROOT, 'src/crosswind/hover-provider.ts')
    const content = await Bun.file(hoverPath).text()

    expect(content).toContain('export function createCrosswindHoverProvider')
    expect(content).toContain('provideHover')
  })

  test('should have completion provider factory', async () => {
    const completionPath = path.join(PACKAGE_ROOT, 'src/crosswind/completion-provider.ts')
    const content = await Bun.file(completionPath).text()

    expect(content).toContain('export function createCrosswindCompletionProvider')
    expect(content).toContain('provideCompletionItems')
  })

  test('should have color decorations registration', async () => {
    const colorPath = path.join(PACKAGE_ROOT, 'src/crosswind/color-provider.ts')
    const content = await Bun.file(colorPath).text()

    expect(content).toContain('export async function registerColorDecorations')
  })

  test('should have sort classes command', async () => {
    const sortPath = path.join(PACKAGE_ROOT, 'src/crosswind/sort-provider.ts')
    const content = await Bun.file(sortPath).text()

    expect(content).toContain('export function createSortClassesCommand')
    expect(content).toContain('export async function sortClasses')
    expect(content).toContain('stx.sortClasses')
    expect(content).toContain('createSortClassesCommand(vscodeModule: typeof vscode)')
  })

  test('should have @cwcss/crosswind dependency', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    expect(packageJson.dependencies).toHaveProperty('@cwcss/crosswind')
    expect(packageJson.dependencies['@cwcss/crosswind']).toMatch(/^\^?0\.\d+\.\d+/)
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

    expect(Object.keys(allDeps).some(dep => dep.includes('unocss'))).toBe(false)
    expect(Object.keys(allDeps).some(dep => dep.includes('tailwind'))).toBe(false)
  })

  test('should register crosswind commands in package.json', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    const commands = packageJson.contributes.commands

    const sortCommand = commands.find((cmd: any) => cmd.command === 'stx.sortClasses')
    expect(sortCommand).toBeDefined()
    expect(sortCommand.title).toContain('Sort')

    const reloadCommand = commands.find((cmd: any) => cmd.command === 'crosswind.reload')
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
    expect(Object.keys(config)).toContain('crosswind.remToPxRatio')
  })

  test('should activate crosswind in extension.ts', async () => {
    const extensionPath = path.join(PACKAGE_ROOT, 'src/extension.ts')
    const content = await Bun.file(extensionPath).text()

    expect(content).toContain("import('./crosswind/index')")
    expect(content).toContain('activateCrosswind')
    expect(content).toContain('await activateCrosswind(context)')
  })

  test('should NOT have styles-uno directory', async () => {
    const unoPath = path.join(PACKAGE_ROOT, 'src/styles-uno')
    const indexExists = await Bun.file(path.join(unoPath, 'index.ts')).exists()
    expect(indexExists).toBe(false)
  })

  test('should handle multiple language selectors', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/crosswind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain("'stx'")
    expect(content).toContain("'html'")
    expect(content).toContain("'typescript'")
  })

  test('should register trigger characters for completion', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/crosswind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain("'\"'")
    expect(content).toContain("'\\''")
    expect(content).toContain("' '")
  })

  test('should have reload command handler', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/crosswind/index.ts')
    const content = await Bun.file(indexPath).text()

    expect(content).toContain("vscode.commands.registerCommand('crosswind.reload'")
    expect(content).toContain('crosswindContext?.reload')
  })

  test('should NOT have any Headwind references in source', async () => {
    const files = [
      'src/crosswind/index.ts',
      'src/crosswind/context.ts',
      'src/crosswind/hover-provider.ts',
      'src/crosswind/completion-provider.ts',
      'src/crosswind/sort-provider.ts',
      'src/crosswind/color-provider.ts',
    ]

    for (const filePath of files) {
      const fullPath = path.join(PACKAGE_ROOT, filePath)
      const content = await Bun.file(fullPath).text()
      expect(content).not.toContain('Headwind')
      expect(content).not.toContain('headwind')
      expect(content).not.toContain('HeadwindContext')
      expect(content).not.toContain('activateHeadwind')
    }
  })

  test('should load crosswind config from crosswind.config file', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain('crosswind.config')
    expect(content).not.toContain('headwind.config')
  })

  test('should use CrosswindConfig type from @cwcss/crosswind', async () => {
    const contextPath = path.join(PACKAGE_ROOT, 'src/crosswind/context.ts')
    const content = await Bun.file(contextPath).text()

    expect(content).toContain("CrosswindConfig } from '@cwcss/crosswind'")
    expect(content).not.toContain('HeadwindConfig')
  })
})

describe('Crosswind CSS Parser Tests', () => {
  test('addRemToPxComment should be exported', async () => {
    const parserPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/css-parser.ts')
    const content = await Bun.file(parserPath).text()
    expect(content).toContain('export function addRemToPxComment')
  })

  test('prettifyCSS should be exported', async () => {
    const parserPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/css-parser.ts')
    const content = await Bun.file(parserPath).text()
    expect(content).toContain('export function prettifyCSS')
  })
})

describe('Crosswind Color Extractor Tests', () => {
  test('isColorClass should be exported', async () => {
    const extractorPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/color-extractor.ts')
    const content = await Bun.file(extractorPath).text()
    expect(content).toContain('export function isColorClass')
  })

  test('extractColorFromCSS should be exported', async () => {
    const extractorPath = path.join(PACKAGE_ROOT, 'src/crosswind/utils/color-extractor.ts')
    const content = await Bun.file(extractorPath).text()
    expect(content).toContain('export function extractColorFromCSS')
  })
})
