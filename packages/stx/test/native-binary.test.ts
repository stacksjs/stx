import { afterAll, expect, test } from 'bun:test'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildNative, findCraftBinary } from '../src/native-build'

const root = mkdtempSync(join(tmpdir(), 'stx-native-binary-'))
const project = join(root, 'apps/sample')
const managed = join(root, 'managed/craft')
const checkout = join(root, 'craft/packages/zig/zig-out/bin/craft')
for (const file of [managed, checkout]) {
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, '#!/bin/sh\nexit 0\n')
  chmodSync(file, 0o755)
}
mkdirSync(project, { recursive: true })
afterAll(() => rmSync(root, { recursive: true, force: true }))

test('uses the installed runtime rather than a neighboring Craft checkout', () => {
  const previous = { cwd: process.cwd(), path: process.env.PATH, override: process.env.CRAFT_BIN }
  try {
    process.chdir(project)
    process.env.PATH = join(root, 'managed')
    delete process.env.CRAFT_BIN
    expect(findCraftBinary()).toBe(managed)
    expect(findCraftBinary('webview')).toBeNull()
    const webview = join(root, 'managed/craft-webview')
    writeFileSync(webview, '#!/bin/sh\nexit 0\n', { mode: 0o755 })
    expect(findCraftBinary('webview')).toBe(webview)
    expect(findCraftBinary()).toBe(managed)
    process.env.PATH = ''
    expect(findCraftBinary()).toBeNull()
    process.env.CRAFT_BIN = checkout
    expect(findCraftBinary()).toBe(checkout)
    process.env.CRAFT_BIN = join(root, 'missing')
    expect(() => findCraftBinary()).toThrow('CRAFT_BIN points to a missing file')
  }
  finally {
    process.chdir(previous.cwd)
    if (previous.path === undefined) delete process.env.PATH
    else process.env.PATH = previous.path
    if (previous.override === undefined) delete process.env.CRAFT_BIN
    else process.env.CRAFT_BIN = previous.override
  }
})


test('a requested webview profile refuses a full runtime rather than silently substituting it', async () => {
  const template = join(root, 'profile.stx')
  const full = join(root, 'full-runtime')
  writeFileSync(template, '<html><body>Profile check</body></html>')
  writeFileSync(full, '#!/bin/sh\nprintf "full\\n"\n', { mode: 0o755 })
  const result = await buildNative({ input: template, target: 'macos', output: join(root, 'out'), craftPath: full, runtimeProfile: 'webview' })
  expect(result.success).toBe(false)
  expect(result.error).toContain('requested Craft webview runtime is unavailable')
})

test.skipIf(process.platform !== 'darwin')('bundles the Pantry provider instead of its installation-relative activation launcher', () => {
  const managedBin = join(root, 'activation-bin')
  mkdirSync(managedBin)
  const template = join(root, 'activation.stx')
  const args = join(root, 'provider-arguments')
  writeFileSync(template, '<html><body>Relocatable native app</body></html>')
  writeFileSync(join(managedBin, 'craft'), '#!/bin/sh\nexec "$PROVIDER_FILE" "$@"\n', { mode: 0o755 })
  writeFileSync(join(managedBin, 'pantry'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$ARGUMENTS_FILE"\nprintf "%s\\n" "$PROVIDER_FILE"\n', { mode: 0o755 })
  const result = Bun.spawnSync([process.execPath, '-e', `
    import { buildNative } from ${JSON.stringify(join(import.meta.dir, '../src/native-build.ts'))};
    const result = await buildNative({ input: ${JSON.stringify(template)}, output: ${JSON.stringify(join(root, 'relocated'))}, name: 'Relocated', target: 'macos', bundleStyle: 'executable' });
    if (!result.success) throw new Error(result.error);
  `], { env: { ...process.env, CRAFT_BIN: undefined, PATH: `${managedBin}:/usr/bin:/bin`, PROVIDER_FILE: process.execPath, ARGUMENTS_FILE: args } })
  expect(result.exitCode, result.stderr.toString()).toBe(0)
  expect(readFileSync(args, 'utf8')).toBe('which\ncraft\n--resolve\n')
  const relocated = Bun.spawnSync([join(root, 'relocated/Relocated.app/Contents/MacOS/Relocated'), '--version'], { env: { PATH: '' } })
  expect(relocated.exitCode, relocated.stderr.toString()).toBe(0)
  expect(relocated.stdout.toString().trim()).toBe(Bun.version)
}, 30000)

test.skipIf(process.platform !== 'darwin')('a background tray bundle retains its window and hides its Dock identity in both bundle formats', async () => {
  const template = join(root, 'background.stx')
  writeFileSync(template, '<html><body>Background palette</body></html>')
  for (const bundleStyle of ['executable', 'launcher'] as const) {
    const result = await buildNative({ input: template, output: join(root, bundleStyle), name: 'Background', target: 'macos', craftPath: process.execPath, bundleStyle, systemTray: true, menubarOnly: false, hideDockIcon: true, window: { startHidden: true } })
    expect(result.success, result.error).toBe(true)
    const contents = join(result.outputPath!, 'Contents')
    const plist = Bun.spawnSync(['/usr/bin/plutil', '-convert', 'json', '-o', '-', join(contents, 'Info.plist')])
    expect(JSON.parse(plist.stdout.toString()).LSUIElement).toBe(true)
    if (bundleStyle === 'executable') {
      const manifest = await Bun.file(join(contents, 'Resources/craft.json')).json()
      expect(manifest).toMatchObject({ html: 'index.html', systemTray: true, hideDockIcon: true, headless: true })
      expect(manifest.menubarOnly).toBeUndefined()
    }
    else {
      const launcher = readFileSync(join(contents, 'MacOS/Background'), 'utf8')
      expect(launcher).toContain('--system-tray')
      expect(launcher).toContain('--hide-dock-icon')
      expect(launcher).toContain('--headless')
      expect(launcher).not.toContain('--menubar-only')
    }
  }
}, 30000)
