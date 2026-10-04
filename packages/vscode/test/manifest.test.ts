import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { STACKS_EXTENSION_ID, STX_EXTENSION_ID } from '../src/ids'

const PACKAGE_ROOT = path.join(import.meta.dir, '..')

// The Stacks framework extension (STACKS_EXTENSION_ID), published from
// stacksjs/stacks, embeds this extension's stx support. The two must never
// share an ID: a publish under the same ID replaces the other extension for
// everyone who installed it (stacksjs/stx#2020).

const manifest = await Bun.file(path.join(PACKAGE_ROOT, 'package.json')).json()

function extensionId(pkg: { publisher: string, name: string }): string {
  return `${pkg.publisher}.${pkg.name}`
}

function floor(range: string): number[] {
  const match = range.match(/(\d+)\.(\d+)\.(\d+)/)
  if (!match)
    throw new Error(`No version in range "${range}"`)
  return match.slice(1).map(Number)
}

describe('VSCODE: marketplace identity', () => {
  test('publishes as Stacks.vscode-stx', () => {
    expect(STX_EXTENSION_ID).toBe('Stacks.vscode-stx')
    expect(STACKS_EXTENSION_ID).toBe('Stacks.vscode-stacks')
    expect(extensionId(manifest)).toBe(STX_EXTENSION_ID)
  })

  test('does not share an ID with the Stacks extension', () => {
    // Marketplace IDs are case-insensitive.
    expect(extensionId(manifest).toLowerCase()).not.toBe(STACKS_EXTENSION_ID.toLowerCase())
  })

  test('presents itself as stx, not as Stacks', () => {
    expect(manifest.displayName).toMatch(/^stx\b/)
    expect(manifest.contributes.configuration.title).toBe('stx')
    expect(manifest.contributes.languages.find((language: any) => language.id === 'stx').aliases[0]).toBe('stx')
  })

  test('is a language extension, not an extension pack', () => {
    expect(manifest.categories).not.toContain('Extension Packs')
    expect(manifest.extensionPack).toBeUndefined()
  })

  test('contributes nothing in the Stacks extension\'s namespaces', () => {
    const settings = Object.keys(manifest.contributes.configuration.properties)
    const commands = manifest.contributes.commands.map((command: any) => command.command)

    expect(settings.filter(key => key.toLowerCase().startsWith('stacks.'))).toEqual([])
    expect(commands.filter((id: string) => id.toLowerCase().startsWith('stacks.'))).toEqual([])
  })

  test('every contributed command is registered by the extension', async () => {
    const glob = new Bun.Glob('src/**/*.ts')
    let source = ''
    for await (const file of glob.scan(PACKAGE_ROOT))
      source += await Bun.file(path.join(PACKAGE_ROOT, file)).text()

    for (const { command } of manifest.contributes.commands)
      expect(source).toContain(`registerCommand('${command}'`)
  })
})

describe('VSCODE: installability', () => {
  test('engines.vscode is the API floor @types/vscode compiles against', () => {
    // vsce refuses an @types/vscode newer than engines.vscode, and an engine
    // floor above every released editor (an automated bump once wrote
    // ^1.999.0) makes the extension uninstallable everywhere.
    expect(floor(manifest.engines.vscode)).toEqual(floor(manifest.devDependencies['@types/vscode']))
  })

  test('packages without node_modules, so the bundle carries its dependencies', () => {
    expect(manifest.scripts.package).toContain('--no-dependencies')
    expect(manifest.scripts.release).toContain('--no-dependencies')
    expect(manifest.scripts['vscode:prepublish']).toBe('bun run build')
  })

  // packages/vscode is outside the root workspace, so its dependencies are
  // only present after `bun install` in this directory. The VS Code extension
  // workflow installs them and runs this file before every publish.
  test.skipIf(!existsSync(path.join(PACKAGE_ROOT, 'node_modules/prettier')))('the built extension requires only vscode and Node built-ins', async () => {
    const build = Bun.spawnSync(['bun', 'build.ts'], { cwd: PACKAGE_ROOT, stdout: 'pipe', stderr: 'pipe' })
    expect(build.exitCode).toBe(0)

    const bundle = await Bun.file(path.join(PACKAGE_ROOT, 'dist/extension.js')).text()
    const specifiers = new Set([...bundle.matchAll(/\b(?:require|import)\("([^"]+)"\)/g)].map(match => match[1]))
    const builtins = new Set(builtinModules)
    const unresolvable = [...specifiers].filter(specifier =>
      specifier !== 'vscode' && specifier !== 'bunfig' && !specifier.startsWith('node:') && !builtins.has(specifier),
    )

    expect(unresolvable).toEqual([])

    // VS Code loads the extension as CommonJS on Node. Parse it inside the
    // same kind of function wrapper Node uses: an `import.meta` or a
    // module-scope `await` anywhere in the bundle is a syntax error there, and
    // Node then refuses the file ("module is not defined in ES module scope").
    // eslint-disable-next-line no-new-func
    expect(() => new Function('exports', 'require', 'module', '__filename', '__dirname', bundle)).not.toThrow()
  }, 60_000)
})
