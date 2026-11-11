import assert from 'node:assert/strict'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createTempDir, removeTempDir } from '../packages/stx/src/temp-dir'
import { verifyPublicTypes } from './public-types-consumer'
import { packageCandidateRegistry } from './package-candidate-registry'

const root = process.cwd()
// Removed when the smoke passes, and on exit or interrupt when it does not.
const smokeRoot = createTempDir('installed-smoke')

async function run(cmd: string[], cwd = smokeRoot): Promise<void> {
  const child = Bun.spawn(cmd, { cwd, stdout: 'pipe', stderr: 'pipe', timeout: 120_000 })
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
  if (code !== 0) {
    console.error(stdout)
    console.error(stderr)
    throw new Error(`${cmd.join(' ')} failed with exit code ${code}`)
  }
}

mkdirSync(join(smokeRoot, 'pages'), { recursive: true })
mkdirSync(join(smokeRoot, 'node_modules'), { recursive: true })

const dependencies: Record<string, string> = {}
const publicTypeArchives: Array<{ name: string; archive: string }> = []
const archives = join(process.env.STX_TYPE_SDK_EVIDENCE ?? smokeRoot, 'archives')
mkdirSync(archives, { recursive: true })
for (const directory of ['desktop', 'sanitizer', 'router', 'bun-plugin', 'stx', 'components']) {
  const packageDir = join(root, 'packages', directory)
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  const archive = join(archives, `${directory}.tgz`)
  publicTypeArchives.push({ name: manifest.name, archive })
  await run([process.execPath, 'pm', 'pack', '--ignore-scripts', '--filename', archive], packageDir)
  const archiveFiles = await new Bun.Archive(await Bun.file(archive).bytes()).files()
  // The MIT notice must travel with the actual archive. Bun's pack command
  // silently omits a missing files entry; Pantry's publisher correctly rejects it.
  if (manifest.files?.includes('LICENSE.md')) {
    assert.equal(
      await archiveFiles.get('package/LICENSE.md')!.text(),
      readFileSync(join(root, 'LICENSE.md'), 'utf8'),
      `${manifest.name} must ship the repository license`,
    )
  }
  const packedManifest = await archiveFiles.get('package/package.json')!.json()
  assert.equal(packedManifest.name, manifest.name)
  assert.equal(packedManifest.version, manifest.version)
  dependencies[manifest.name] = packedManifest.version
}
writeFileSync(join(smokeRoot, 'package.json'), JSON.stringify({
  name: 'stx-installed-smoke',
  type: 'module',
  private: true,
  dependencies,
  devDependencies: { typescript: '7.0.2', '@types/bun': '1.4.4' },
}, null, 2))
writeFileSync(join(smokeRoot, 'bunfig.toml'), '[install]\nlinker = "hoisted"\n')
// Install the actual publishable archives. Checkout symlinks accidentally make
// unshipped source files visible and cannot prove a published consumer works.
await using registry = await packageCandidateRegistry(publicTypeArchives)
const scopes = [...new Set(publicTypeArchives.map(owner => owner.name.startsWith('@') ? owner.name.split('/')[0] : '').filter(Boolean))]
writeFileSync(join(smokeRoot, '.npmrc'), [`registry=${registry.url}`, 'always-auth=false', ...scopes.map(scope => `${scope}:registry=${registry.url}`), ''].join('\n'))
let normalLock: string | undefined
for (const flags of [[], ['--frozen-lockfile']]) {
  await run([process.execPath, '--no-env-file', 'install', `--registry=${registry.url}`, ...flags])
  assert.equal(existsSync(join(smokeRoot, 'node_modules/@dtsx/bun')), false, 'Published SDK consumers must not install the declaration producer as a workspace development dependency')
  const lock = new Bun.CryptoHasher('sha256').update(readFileSync(join(smokeRoot, 'bun.lock'))).digest('hex')
  if (normalLock) assert.equal(lock, normalLock, 'Frozen install changed the qualified lockfile')
  else normalLock = lock
  await verifyPublicTypes(smokeRoot, publicTypeArchives, flags.length ? 'frozen' : 'normal', { kind: 'prepublication-original-archives', url: registry.url, requests: registry.requests })
}

// #2109: public native exports and shared imports must work from the archives,
// not only from the source tree. Only test fixtures/assertions are copied;
// every compiler, signal and host-runtime module comes from installed STX.
mkdirSync(join(smokeRoot, 'fixtures'))
for (const file of ['native-hud-device.stx', 'NativeHudPanel.stx', 'native-hud-model.ts'])
  copyFileSync(join(root, 'packages/stx/test/native/fixtures', file), join(smokeRoot, 'fixtures', file))
copyFileSync(join(root, 'scripts/native-hud-package-probe.ts'), join(smokeRoot, 'native-hud-package-probe.ts'))
await run([process.execPath, 'native-hud-package-probe.ts'])

// #2155: run maintained parser and reactive-bundle contracts against the
// untouched package archives. Only test imports change to public entry points.
for (const [fixture, sourceImport, installedImport] of [
  ['inline-style-cache.test.ts', '../../src/native/compiler/inline-style', '@stacksjs/stx/native/compiler/inline-style'],
  ['reactive-inline-style.test.ts', '../../src/native/testing', '@stacksjs/stx/native/testing'],
]) {
  const source = readFileSync(join(root, 'packages/stx/test/native', fixture), 'utf8')
  if (!source.includes(sourceImport)) throw new Error(`Missing native fixture import: ${fixture}`)
  writeFileSync(join(smokeRoot, fixture), source.replace(sourceImport, installedImport))
}
await run([process.execPath, 'test', './inline-style-cache.test.ts', './reactive-inline-style.test.ts'])

writeFileSync(join(smokeRoot, 'pages', 'index.stx'), `<script server>
export const products = [
  { name: 'Cedar Wick Candle', price: '$28' },
  { name: 'Botanical Gift Box', price: '$54' },
  { name: 'Mineral Bath Salts', price: '$18' },
]
</script>

<!doctype html>
<html>
<head><title>Lumen & Lather Smoke</title></head>
<body>
  <main>
    <h1>Lumen & Lather</h1>
    @foreach(products as product)
      <article>
        <h2>{{ product.name }}</h2>
        <p>{{ product.price }}</p>
      </article>
    @endforeach
  </main>
</body>
</html>`)


await run([process.execPath, '-e', `
const stx = await import('@stacksjs/stx')
const expressions = await import('@stacksjs/stx/expressions')
const tokenizer = await import('@stacksjs/stx/parser/tokenizer')
const router = await import('stx-router/layout-metadata')
const plugin = await import('bun-plugin-stx/serve')
const desktop = await import('@stacksjs/stx/desktop')
const updates = await import('@stacksjs/desktop')
const status = await updates.createNativeUpdateApi({ repository: 'example/app', currentVersion: '1.0.0' })(new Request('http://localhost/api/updates'))
if (!(status instanceof Response) || (await status.json()).currentVersion !== '1.0.0') throw new Error('bad packaged native updater API')
if (typeof stx.processDirectives !== 'function') throw new Error('missing processDirectives')
if (typeof expressions.processExpressions !== 'function') throw new Error('missing processExpressions')
if (typeof tokenizer.findMatchingDelimiter !== 'function') throw new Error('missing tokenizer')
if (router.deriveLayoutGroup('layouts/shop/product.stx') !== 'shop') throw new Error('bad layout group')
if (!plugin) throw new Error('missing bun-plugin serve export')
if (typeof desktop.macOSRuntimeExecutablePath !== 'function') throw new Error('missing native agent packaging export')
if (desktop.macOSRuntimeExecutablePath('/Example.app') !== '/Example.app/Contents/Helpers/CraftRuntime.app/Contents/MacOS/craft') throw new Error('bad native agent packaging contract')
`])

// #2107: dist/signals.js is a server-side generator, not the browser asset.
// Inspect what the archived package emits, not debug strings in its sources.
await run([process.execPath, '-e', `
const { generateSignalsRuntime, generateSignalsRuntimeDev } = await import('@stacksjs/stx/signals')
const { buildRuntimeAsset } = await import('@stacksjs/stx/build-assets')
for (const runtime of [generateSignalsRuntime(), buildRuntimeAsset().content]) {
  if (/console\\s*\\.\\s*log\\s*\\(/.test(runtime)) throw new Error('Published production runtime leaks console.log (#2107)')
  if (!runtime.includes('console.warn(') || !runtime.includes('console.error(')) throw new Error('Published runtime lost diagnostics')
}
if (!generateSignalsRuntimeDev().includes('console.log(')) throw new Error('Explicit debug runtime lost its logs')
`])

// The STX checker intentionally reports only its own generated buffers. An
// ordinary tsc consumer must also reject errors inside shipped .ts sources.
writeFileSync(join(smokeRoot, 'mouse-consumer.ts'), `import '@stacksjs/stx'

import type { NativeBuildConfig, PlistValue } from '@stacksjs/stx/native-build'
const services = [{ NSMenuItem: { default: 'Search' }, NSMessage: 'search', NSSendTypes: ['public.utf8-plain-text'] }] as const
const nativeConfig = { input: 'app.stx', infoPlist: { NSServices: services, Ratio: 2.5, Enabled: true, Empty: {} } } satisfies NativeBuildConfig
const nested: PlistValue = ['x', 2, false, { child: [] }]
// @ts-expect-error null is not a supported plist value
const nullPlist: PlistValue = null
// @ts-expect-error functions cannot be serialized into a plist
const callbackPlist: PlistValue = () => 1
// @ts-expect-error undefined dictionary values are unsupported
const missingPlist: PlistValue = { missing: undefined }
void [nativeConfig, nested, nullPlist, callbackPlist, missingPlist]

import type { NativeCraft, NativePasskeyCreationOptions, NativePasskeyRequestOptions, NativePasskeyCredential } from '@stacksjs/stx/native'
async function passkeyTypes(craft: NativeCraft) {
  if (!craft.passkeys || !await craft.passkeys.isAvailable()) return
  const creation = { challenge: '_-AA', user: { id: '_-BB', name: 'Member' } } satisfies NativePasskeyCreationOptions
  const registration = await craft.passkeys.create(creation)
  const attestation: string = registration.response.attestationObject
  const request = { challenge: '_-CC', allowCredentials: [{ id: registration.id }] } as const satisfies NativePasskeyRequestOptions
  const assertion = await craft.passkeys.get(request)
  const signature: string = assertion.response.signature
  const userHandle: string | undefined = assertion.response.userHandle
  const credential: NativePasskeyCredential = assertion
  // @ts-expect-error Native challenges are base64url strings
  craft.passkeys.create({ challenge: new Uint8Array(), user: { id: 'id', name: 'Member' } })
  // @ts-expect-error A registration response is not a signature response
  registration.response.signature
  // @ts-expect-error An assertion response is not an attestation response
  assertion.response.attestationObject
  void [attestation, signature, userHandle, credential]
}
void passkeyTypes

import { $path, definePageMeta, type CheckHref } from '@stacksjs/stx'
import { createChat } from '@stacksjs/components/chat'
import { createNativeUpdateApi, applicationDataDirectory, type NativeUpdateState } from '@stacksjs/desktop'
const updateApi: (request: Request) => Promise<Response | null> = createNativeUpdateApi({ repository: 'example/app', currentVersion: '1.0.0' })
const updateState: NativeUpdateState = { currentVersion: '1.0.0', phase: 'checking' }
const dataPath: string = applicationDataDirectory('Example', { bundleIdentifier: 'com.example.app' })
void [updateApi, updateState, dataPath]
import { closeOverlay, openOverlay, openOverlays } from '@stacksjs/components/overlays'
const href: CheckHref<'/calendar'> = '/calendar'
$path('/athletes/:id', { id: '42' })
definePageMeta({ layout: false })
const chat = createChat({ selfId: () => 1, scopeKey: () => 'athlete', request: async () => Response.json({}) })
const unread: number = chat.unread()
openOverlay('profile', { panel: '#profile' })
const overlays: string[] = openOverlays()
closeOverlay('profile')
// @ts-expect-error an overlay panel cannot be a number
openOverlay('profile', { panel: 42 })
// @ts-expect-error the signed-in chat identity must be a function
createChat({ selfId: 1, scopeKey: () => 'athlete', request: async () => Response.json({}) })
console.log(href, unread, overlays)
declare const possibleSignal: unknown
if (isSignal(possibleSignal)) {
  const value: unknown = possibleSignal()
  possibleSignal.set(value)
}
declare const possibleDerived: unknown
if (isDerived(possibleDerived)) {
  const value: unknown = possibleDerived()
  // @ts-expect-error derived signals are read-only
  possibleDerived.set(value)
}
const mouse = useMouse({ touch: false, resetOnLeave: true })
mouse.subscribe(({ clientX, clientY, isInside }) => {
  const x: number = clientX
  const y: number = clientY
  const inside: boolean = isInside
  console.log(x, y, inside)
})`)
writeFileSync(join(smokeRoot, 'mouse-tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ESNext', module: 'ESNext', moduleResolution: 'bundler',
    lib: ['ESNext', 'DOM', 'DOM.Iterable'], types: [],
    strict: true, noUncheckedIndexedAccess: true, skipLibCheck: true, noEmit: true,
  },
  files: ['mouse-consumer.ts'],
}, null, 2))
await run([process.execPath, '--bun', join(smokeRoot, 'node_modules/typescript/bin/tsc'), '--project', 'mouse-tsconfig.json'])

writeFileSync(join(smokeRoot, 'mouse-good.stx'), `<script client>
const mouse = useMouse({ touch: false, resetOnLeave: true })
mouse.subscribe(({ clientX, clientY, isInside }) => {
  const x: number = clientX
  const y: number = clientY
  const inside: boolean = isInside
  console.log(x, y, inside)
})
</script>`)
writeFileSync(join(smokeRoot, 'mouse-bad.stx'), `<script client>
useMouse({ touch: 'yes' })
useMouse().subscribe(point => console.log(point.clientX.toUpperCase(), point.nonexistent))
</script>`)
await run([process.execPath, '-e', `
const { typecheckStxFiles } = await import('@stacksjs/stx/typecheck')
const { resolve } = await import('node:path')
const good = resolve('mouse-good.stx')
const bad = resolve('mouse-bad.stx')
const result = await typecheckStxFiles([good, bad], { templates: false, compilerOptions: { noUncheckedIndexedAccess: true } })
if (result.failure) throw new Error(result.failure)
const goodErrors = result.diagnostics.filter(d => d.file !== bad && d.category === 'error')
if (goodErrors.length) throw new Error('Published mouse types rejected the real card subscription: ' + JSON.stringify(goodErrors))
const invalid = result.diagnostics.filter(d => d.file === bad && d.category === 'error')
if (!invalid.some(d => d.code === 2322) || invalid.filter(d => d.code === 2339).length !== 2)
  throw new Error('Published mouse types failed to reject invalid options/properties: ' + JSON.stringify(invalid))
`])

await run([process.execPath, 'node_modules/@stacksjs/stx/dist/cli.js', 'build', '--pages', 'pages', '--out', 'dist', '--no-minify'])
await run([process.execPath, '-e', `
const html = await Bun.file('dist/index.html').text()
if (!html.includes('Lumen & Lather')) throw new Error('missing page title')
if (!html.includes('Cedar Wick Candle')) throw new Error('missing rendered product')
`])

await registry.stop()
removeTempDir(smokeRoot)
console.log('installed package smoke passed')
