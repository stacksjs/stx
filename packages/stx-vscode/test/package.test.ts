import { beforeAll, describe, expect, test } from 'bun:test'
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { builtinModules, createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// `@stacksjs/stx-vscode` is the npm build of the stx extension's language
// support, which the Stacks extension embeds (stacksjs/stx#2020). These pin the
// built package: what it exports, what it imports, and that the manifest
// contributions it hands to an embedding extension point at files it ships.

const root = join(import.meta.dir, '..')
const dist = join(root, 'dist')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const extensionManifest = JSON.parse(readFileSync(join(root, '../vscode/package.json'), 'utf8'))

beforeAll(() => {
  const build = Bun.spawnSync(['bun', 'build.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  if (build.exitCode !== 0)
    throw new Error(`build failed: ${build.stderr.toString()}`)
}, 60_000)

function runtimeExports(): string[] {
  const source = readFileSync(join(dist, 'index.js'), 'utf8')
  const list = source.match(/export\s*\{([^}]*)\};?\s*$/)?.[1] ?? ''
  return list.split(',').map(entry => entry.trim().split(/\s+as\s+/).pop()!).filter(Boolean)
}

describe('@stacksjs/stx-vscode', () => {
  test('exports the embedding API it declares', () => {
    const declared = readFileSync(join(dist, 'index.d.ts'), 'utf8')
    const names = [...declared.matchAll(/export declare (?:const|function) (\w+)/g)].map(match => match[1])

    expect(names).toEqual([
      'STX_EXTENSION_ID',
      'STACKS_EXTENSION_ID',
      'activateStxLanguage',
      'deactivateStxLanguage',
      'TS_PLUGIN_NAME',
      'TS_PLUGIN_SETTINGS',
      'TYPESCRIPT_EXTENSION_ID',
      'configureTypeScriptPlugin',
    ])
    expect(runtimeExports()).toEqual(expect.arrayContaining(names))
  })

  test('imports only vscode, Node built-ins and its declared dependencies', () => {
    const source = readFileSync(join(dist, 'index.js'), 'utf8')
    const specifiers = new Set([...source.matchAll(/(?:from\s*|import\()\s*"([^"]+)"/g)].map(match => match[1]))
    const allowed = (specifier: string) =>
      specifier === 'vscode'
      || specifier.startsWith('node:')
      || builtinModules.includes(specifier)
      || Object.keys(pkg.dependencies).some(dependency => specifier === dependency || specifier.startsWith(`${dependency}/`))

    expect([...specifiers].filter(specifier => !allowed(specifier))).toEqual([])
  })

  test('ships every asset its manifest contributions point at', () => {
    const contributes = JSON.parse(readFileSync(join(dist, 'contributes.json'), 'utf8'))
    const paths = [
      ...contributes.languages.map((language: any) => language.configuration),
      ...contributes.grammars.map((grammar: any) => grammar.path),
      ...contributes.snippets.map((snippet: any) => snippet.path),
    ]

    expect(paths.length).toBeGreaterThan(0)
    for (const path of paths)
      expect(existsSync(join(dist, 'assets', path))).toBe(true)
  })

  test('contributes exactly what the stx extension contributes', () => {
    const contributes = JSON.parse(readFileSync(join(dist, 'contributes.json'), 'utf8'))
    const source = extensionManifest.contributes

    expect(contributes.languages.map((language: any) => language.id)).toEqual(source.languages.map((language: any) => language.id))
    expect(contributes.grammars.map((grammar: any) => grammar.scopeName)).toEqual(source.grammars.map((grammar: any) => grammar.scopeName))
    expect(contributes.commands).toEqual(source.commands)
    expect(contributes.configuration).toEqual(source.configuration)
    expect(contributes.typescriptServerPlugins).toEqual(source.typescriptServerPlugins)
  })

  test('is versioned with the extension it is built from', () => {
    expect(pkg.version).toBe(extensionManifest.version)
    expect(pkg.dependencies).toEqual(extensionManifest.dependencies)
  })
})

// The Stacks extension builds stx support in and installs no other extension,
// so it contributes the TypeScript server plugin itself, from this package
// (stacksjs/stx#2028). tsserver loads a plugin by package name from
// `<extension>/node_modules` and calls `module.exports` as the factory.
describe('the TypeScript server plugin', () => {
  const plugin = join(dist, 'typescript-plugin')
  const contributes = () => JSON.parse(readFileSync(join(dist, 'contributes.json'), 'utf8'))

  test('is a package named what contributes.json contributes', () => {
    const manifest = JSON.parse(readFileSync(join(plugin, 'package.json'), 'utf8'))
    expect(contributes().typescriptServerPlugins.map((entry: { name: string }) => entry.name)).toEqual([manifest.name])
    expect(manifest.name).toBe('@stacksjs/stx-typescript-plugin')
    expect(manifest.version).toBe(pkg.version)
    expect(pkg.exports['./typescript-plugin/*']).toBe('./dist/typescript-plugin/*')
  })

  test('requires only Node built-ins at runtime', () => {
    const bundle = readFileSync(join(plugin, 'typescript-stx-plugin.js'), 'utf8')
    const specifiers = new Set([...bundle.matchAll(/\brequire\("([^"]+)"\)/g)].map(match => match[1]))
    expect([...specifiers].filter(specifier => !specifier.startsWith('node:') && !builtinModules.includes(specifier))).toEqual([])
  })

  test('loads from an extension\'s node_modules the way tsserver loads it, and finds its declarations', () => {
    // Real path: require() resolves symlinks, and macOS's tmpdir is one.
    const extension = realpathSync(mkdtempSync(join(tmpdir(), 'stx-vscode-plugin-')))
    try {
      cpSync(plugin, join(extension, 'node_modules/@stacksjs/stx-typescript-plugin'), { recursive: true })
      const factory = createRequire(join(extension, 'node_modules', 'index.js'))('@stacksjs/stx-typescript-plugin')
      expect(typeof factory).toBe('function')

      const text = '<script client>\nconst n = state(0)\n</script>\n'
      const snapshot = (value: string) => ({ getText: (start: number, end: number) => value.slice(start, end), getLength: () => value.length, getChangeRange: () => undefined })
      const host: Record<string, any> = { getScriptSnapshot: () => snapshot(text), getScriptVersion: () => '1' }
      factory({ typescript: { ScriptSnapshot: { fromString: snapshot } } })
        .create({ languageService: {}, languageServiceHost: host, project: { projectService: { logger: { info: () => {} } } } })

      const buffer = host.getScriptSnapshot('/tmp/page.stx')
      const referenced = /^\/\/\/ <reference path="(.+)" \/>$/.exec(buffer.getText(0, buffer.getLength()).split('\n')[0])?.[1]
      const types = join(extension, 'node_modules/@stacksjs/stx-typescript-plugin/types')
      expect(referenced).toBe(join(types, 'stx-module.d.ts'))
      expect(existsSync(join(types, 'stx.d.ts'))).toBe(true)
    }
    finally {
      rmSync(extension, { recursive: true, force: true })
    }
  })
})
