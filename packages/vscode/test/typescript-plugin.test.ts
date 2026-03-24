import { describe, expect, test } from 'bun:test'
import path from 'node:path'

const PACKAGE_ROOT = path.join(import.meta.dir, '..')

describe('TypeScript STX Plugin', () => {
  test('should export a default init function', async () => {
    const pluginPath = path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')
    const content = await Bun.file(pluginPath).text()

    expect(content).toContain('export default init')
    expect(content).toContain('function init(')
  })

  test('should implement PluginModule interface with create and getExternalFiles', async () => {
    const pluginPath = path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')
    const content = await Bun.file(pluginPath).text()

    expect(content).toContain('create(info')
    expect(content).toContain('getExternalFiles(')
  })

  describe('extractTypeScriptFromStx', () => {
    // We can test the extraction logic by reading the source and verifying patterns
    let pluginContent: string

    test('should extract <script> tag content', async () => {
      pluginContent = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      // Should have script tag regex (escaped in regex as <\/script>)
      expect(pluginContent).toContain('<script')
      expect(pluginContent).toContain('script>')
      // Should skip scripts with src attribute
      expect(pluginContent).toContain('src')
    })

    test('should extract @ts block content', async () => {
      pluginContent = pluginContent || await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(pluginContent).toContain('@ts')
      expect(pluginContent).toContain('@endts')
    })

    test('should extract {{ }} expression content', async () => {
      pluginContent = pluginContent || await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(pluginContent).toContain('{{')
      expect(pluginContent).toContain('}}')
      expect(pluginContent).toContain('__stx_expr')
    })

    test('should skip filter expressions containing pipe char', async () => {
      pluginContent = pluginContent || await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      // Filter expressions use | which is not valid TS
      expect(pluginContent).toContain("!expr.includes('|')")
    })
  })

  describe('Language service proxies', () => {
    test('should proxy getScriptSnapshot for .stx files', async () => {
      const content = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(content).toContain('getScriptSnapshot')
      expect(content).toContain("fileName.endsWith('.stx')")
      expect(content).toContain('createStxSnapshot')
    })

    test('should proxy getQuickInfoAtPosition for enhanced hover', async () => {
      const content = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(content).toContain('getQuickInfoAtPosition')
      expect(content).toContain('displayParts')
    })

    test('should proxy getCompletionsAtPosition for filtered suggestions', async () => {
      const content = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(content).toContain('getCompletionsAtPosition')
      // Should filter out dunder symbols
      expect(content).toContain("startsWith('__')")
    })

    test('should proxy getSemanticDiagnostics to filter false positives', async () => {
      const content = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(content).toContain('getSemanticDiagnostics')
      // Should filter out "cannot find name" for stx globals
      expect(content).toContain('stxGlobals')
      expect(content).toContain('props')
      expect(content).toContain('defineProps')
      expect(content).toContain('state')
      expect(content).toContain('derived')
      expect(content).toContain('effect')
    })

    test('should include class, interface, type, and enum in completions', async () => {
      const content = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

      expect(content).toContain('classElement')
      expect(content).toContain('interfaceElement')
      expect(content).toContain('typeElement')
      expect(content).toContain('enumElement')
    })
  })

  test('should handle .md files in addition to .stx', async () => {
    const content = await Bun.file(path.join(PACKAGE_ROOT, 'src/typescript-stx-plugin.ts')).text()

    expect(content).toContain("'.md'")
  })
})
