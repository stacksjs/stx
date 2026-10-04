import { describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { builtinModules, createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { packageExtension } from '../scripts/package'
import { TS_PLUGIN_BUNDLE, TS_PLUGIN_DIR, TS_PLUGIN_PACKAGE, tsPluginPackageFiles } from '../scripts/ts-plugin-package'
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

/** packages/vscode's own dependencies are installed (see the note below). */
const INSTALLED = existsSync(path.join(PACKAGE_ROOT, 'node_modules/prettier'))

let built = false
function build(): void {
  if (built)
    return
  const result = Bun.spawnSync(['bun', 'build.ts'], { cwd: PACKAGE_ROOT, stdout: 'pipe', stderr: 'pipe' })
  expect(result.exitCode).toBe(0)
  built = true
}

/**
 * Load a TypeScript server plugin the way tsserver does: `require()` the name
 * from `<probe location>/node_modules` (VS Code passes the extension root as
 * the probe location) and take `module.exports` as the factory, unwrapped.
 */
function loadLikeTsserver(extensionRoot: string, name: string): unknown {
  return createRequire(path.join(extensionRoot, 'node_modules', 'index.js'))(name)
}

/**
 * The plugin, loaded the way tsserver loads it from `extensionRoot`, finds the
 * declaration files it references from every `.stx` buffer (stacksjs/stx#2028).
 *
 * Asserted through the buffer it serves rather than by looking at dist/: the
 * bundle cannot locate them by itself (Bun inlines `__dirname` at build time),
 * so what matters is that the package's `index.js` tells it where they are.
 */
function expectDeclarationsFound(extensionRoot: string): void {
  const factory = loadLikeTsserver(extensionRoot, TS_PLUGIN_PACKAGE) as (modules: { typescript: unknown }) => { create: (info: unknown) => unknown }
  const text = '<script client>\nconst n = state(0)\n</script>\n'
  const host: Record<string, unknown> = {
    getScriptSnapshot: () => ({ getText: (start: number, end: number) => text.slice(start, end), getLength: () => text.length, getChangeRange: () => undefined }),
    getScriptVersion: () => '1',
  }
  const service = {}
  factory({
    typescript: { ScriptSnapshot: { fromString: (value: string) => ({ getText: (start: number, end: number) => value.slice(start, end), getLength: () => value.length, getChangeRange: () => undefined }) } },
  }).create({ languageService: service, languageServiceHost: host, project: { projectService: { logger: { info: () => {} } } } })

  const snapshot = (host.getScriptSnapshot as (file: string) => { getText: (s: number, e: number) => string, getLength: () => number })('/tmp/page.stx')
  const firstLine = snapshot.getText(0, snapshot.getLength()).split('\n')[0]
  const referenced = /^\/\/\/ <reference path="(.+)" \/>$/.exec(firstLine)?.[1]
  expect(referenced).toBe(path.join(extensionRoot, 'dist', 'types', 'stx-module.d.ts'))
  expect(existsSync(path.join(extensionRoot, 'dist', 'types', 'stx.d.ts'))).toBe(true)
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

  test('packages without node_modules, so the bundle carries its dependencies', async () => {
    expect(manifest.scripts.package).toBe('bun scripts/package.ts')
    expect(manifest.scripts.release).toBe('bun scripts/package.ts --publish')
    expect(await Bun.file(path.join(PACKAGE_ROOT, 'scripts/package.ts')).text()).toContain(`'vsce', 'package', '--no-dependencies'`)
    expect(manifest.scripts['vscode:prepublish']).toBe('bun run build')
  })

  // packages/vscode is outside the root workspace, so its dependencies are
  // only present after `bun install` in this directory. The VS Code extension
  // workflow installs them and runs this file before every publish.
  test.skipIf(!INSTALLED)('the built extension requires only vscode and Node built-ins', async () => {
    build()

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

// tsserver loads a plugin only by package name, resolved from the extension's
// node_modules, and calls `module.exports` as the factory. The plugin was
// contributed as `./dist/typescript-stx-plugin.js`, which tsserver refuses
// ("only package name is allowed plugin name"), and its bundle exported
// `{ default }`, which it would have skipped too. VS Code 1.128's log showed
// the first; these tests pin both, and that the VSIX carries the package.
describe('VSCODE: TypeScript server plugin', () => {
  const contributed = manifest.contributes.typescriptServerPlugins.map((plugin: { name: string }) => plugin.name)

  test('is contributed by package name, which tsserver accepts', () => {
    expect(contributed).toEqual([TS_PLUGIN_PACKAGE])

    // The rule tsserver applies before loading anything (requestEnablePlugin).
    for (const name of contributed) {
      expect(name).not.toMatch(/^(?:\.\.?(?:\/|$)|\/|[a-z]:)/i)
      expect(name).not.toMatch(/[\\/]\.\.?(?:$|[\\/])/)
    }
  })

  test('claims the stx language, or VS Code never sends a .stx file to tsserver', () => {
    // Without `languages` the plugin loaded and then type-checked nothing:
    // VS Code only syncs documents whose language tsserver or a plugin claims
    // (stacksjs/stx#2028).
    for (const plugin of manifest.contributes.typescriptServerPlugins)
      expect(plugin.languages).toEqual(['stx'])
    expect(manifest.contributes.languages.map((language: { id: string }) => language.id)).toContain('stx')
  })

  test('declares the setting that switches it off', () => {
    expect(manifest.contributes.configuration.properties['stxTypescriptPlugin.enabled'].default).toBe(true)
  })

  test('the package is named what the manifest contributes', () => {
    expect(JSON.parse(tsPluginPackageFiles('1.0.0')['package.json']).name).toBe(TS_PLUGIN_PACKAGE)
  })

  test.skipIf(!INSTALLED)('the build writes a package tsserver can load', () => {
    build()

    expect(existsSync(path.join(PACKAGE_ROOT, TS_PLUGIN_DIR, 'package.json'))).toBe(true)
    const factory = loadLikeTsserver(PACKAGE_ROOT, TS_PLUGIN_PACKAGE)

    expect(typeof factory).toBe('function')
    const plugin = (factory as (modules: { typescript: unknown }) => { create: unknown, getExternalFiles: unknown })({ typescript: {} })
    expect(typeof plugin.create).toBe('function')
    expect(existsSync(path.join(PACKAGE_ROOT, TS_PLUGIN_BUNDLE))).toBe(true)
    expectDeclarationsFound(PACKAGE_ROOT)
  }, 60_000)

  // vsce runs `vscode:prepublish` through npm, so this needs npm on PATH; the
  // VS Code extension workflow has it.
  test.skipIf(!INSTALLED || !Bun.which('npm') || !Bun.which('zip') || !Bun.which('unzip'))('the VSIX carries the package, and it loads from the installed layout', () => {
    // Real path: require() resolves symlinks, and macOS's tmpdir is one.
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'stx-vsix-test-')))
    try {
      const vsix = packageExtension(path.join(dir, 'stx.vsix'))
      const unzip = Bun.spawnSync(['unzip', '-q', vsix, 'extension/*', '-d', dir])
      expect(unzip.exitCode).toBe(0)

      const installed = path.join(dir, 'extension')
      const factory = loadLikeTsserver(installed, TS_PLUGIN_PACKAGE)
      expect(typeof factory).toBe('function')
      // The declarations ride in dist/types, which .vscodeignore's `**/*.ts`
      // would drop without its exception.
      expectDeclarationsFound(installed)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 120_000)
})
