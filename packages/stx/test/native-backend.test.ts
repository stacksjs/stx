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
  const result = await buildNative({ input: template, output: root, target: 'macos', name: 'Local', craftPath: '/usr/bin/true', backend: { entry: handler } })
  expect(result.success).toBe(true)
  await Bun.file(template).delete()
  await Bun.file(handler).delete()
  const child = Bun.spawn([join(result.outputPath!, 'Contents/MacOS/Local'), '--serve'], { cwd: tmpdir(), stdout: 'pipe', stderr: 'pipe' })
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
  expect(fetch(origin)).rejects.toThrow()
}, 30000)

test('refuses unsupported backend targets and missing source', async () => {
  const template = join(root, 'invalid.stx')
  await Bun.write(template, '<html><body>test</body></html>')
  expect((await buildNative({ input: template, target: 'linux', backend: { entry: 'missing.ts' } })).error).toContain('macOS only')
  expect((await buildNative({ input: template, target: 'macos', backend: { entry: 'missing.ts' } })).error).toContain('Native backend not found')
})
