import { beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
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

    expect(names).toEqual(['STX_EXTENSION_ID', 'STACKS_EXTENSION_ID', 'activateStxLanguage', 'deactivateStxLanguage'])
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
  })

  test('is versioned with the extension it is built from', () => {
    expect(pkg.version).toBe(extensionManifest.version)
    expect(pkg.dependencies).toEqual(extensionManifest.dependencies)
  })
})
