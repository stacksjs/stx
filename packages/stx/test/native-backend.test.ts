import { afterAll, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildNative } from '../src/native-build'

const root = mkdtempSync(join(tmpdir(), 'native-backend-test-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

test.skipIf(process.platform !== 'darwin')('compiled backend works outside the source tree and enforces its session boundary', async () => {
  const template = join(root, 'app.stx')
  const handler = join(root, 'handler.ts')
  await Bun.write(template, '<!doctype html><html><head><title>Local</title></head><body><h1>Embedded UI</h1></body></html>')
  await Bun.write(handler, "export default (request: Request) => new URL(request.url).pathname === '/api' ? Response.json({ works: true }) : null")
  const craftPath = join(root, 'craft-fixture')
  const fixture = join(root, 'craft-fixture.ts')
  await Bun.write(fixture, `if (process.argv.includes('--capabilities')) console.log('{"bundleBackend":true}'); else if (process.argv.includes('--version')) console.log('0.0.279')`)
  const compiled = Bun.spawnSync([process.execPath, 'build', fixture, '--compile', '--outfile', craftPath])
  expect(compiled.exitCode).toBe(0)
  const result = await buildNative({ input: template, output: root, target: 'macos', name: 'Local', window: { frameless: true, transparent: false, cornerRadius: 12 }, craftPath, backend: { entry: handler } })
  expect(result.success, result.error).toBe(true)
  expect(await Bun.file(join(result.outputPath!, 'Contents/Resources/craft.json')).json()).toMatchObject({ backend: { executable: 'stx-backend' }, cornerRadius: 12, transparent: false, frameless: true })
  await Bun.file(template).delete()
  await Bun.file(handler).delete()
  const child = Bun.spawn([join(result.outputPath!, 'Contents/MacOS/stx-backend'), '--serve'], { cwd: tmpdir(), stdout: 'pipe', stderr: 'pipe' })
  let origin = ''
  try {
    const reader = child.stdout.getReader()
    const first = await Promise.race([reader.read(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Backend startup timeout')), 5000))])
    const start = new TextDecoder().decode(first.value).trim()
    origin = new URL(start).origin
    expect((await fetch(`${origin}/api`)).status).toBe(403)
    const login = await fetch(start, { redirect: 'manual' })
    expect(login.status).toBe(303)
    const cookie = login.headers.get('set-cookie')!.split(';')[0]
    expect(login.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Strict')
    expect((await fetch(start, { redirect: 'manual' })).status).toBe(403)
    expect(await (await fetch(`${origin}/api`, { headers: { cookie } })).json()).toEqual({ works: true })
    expect(await (await fetch(origin, { headers: { cookie } })).text()).toContain('Embedded UI')
    expect((await fetch(`${origin}/api`, { headers: { cookie, origin: 'https://attacker.example' } })).status).toBe(403)
    expect((await fetch(`${origin}/api`, { headers: { cookie, 'sec-fetch-site': 'cross-site' } })).status).toBe(403)
    expect((await fetch(`${origin}/missing`, { headers: { cookie } })).status).toBe(404)
  }
  finally { child.kill('SIGTERM'); await child.exited }
  await expect(fetch(origin)).rejects.toThrow()
  const managed = Bun.spawn([join(result.outputPath!, 'Contents/MacOS/stx-backend'), '--serve', '--managed'], { cwd: tmpdir(), stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' })
  try {
    const first = await managed.stdout.getReader().read()
    const managedOrigin = new URL(new TextDecoder().decode(first.value).trim()).origin
    managed.stdin.end()
    expect(await Promise.race([managed.exited, Bun.sleep(5000).then(() => 'timeout')])).toBe(0)
    await expect(fetch(managedOrigin)).rejects.toThrow()
  }
  finally { if (managed.exitCode === null) { managed.kill(); await managed.exited } }
}, 30000)

test('refuses unsupported backend targets and missing source', async () => {
  const template = join(root, 'invalid.stx')
  await Bun.write(template, '<html><body>test</body></html>')
  expect((await buildNative({ input: template, target: 'linux', backend: { entry: 'missing.ts' } })).error).toContain('macOS only')
  expect((await buildNative({ input: template, target: 'macos', backend: { entry: 'missing.ts' } })).error).toContain('Native backend not found')
})

test('rejects invalid native corner radii before building', async () => {
  for (const cornerRadius of [-1, 129, Number.NaN, Number.POSITIVE_INFINITY])
    await expect(buildNative({ input: 'missing.stx', window: { cornerRadius } })).rejects.toThrow('cornerRadius')
})
