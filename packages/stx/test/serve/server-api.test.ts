import path from 'node:path'
import { mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { apiFetch } from '../../src/api-client'
import { bundleClientScript, clearBundleFailures, getBundleFailures } from '../../src/client-script-bundler'
import { buildForProduction } from '../../src/production-builder'
import { startProductionServer } from '../../src/production-server'
import { serve } from '../../src/serve'
import { createServerApi, discoverServerApi, generateApiTypes } from '../../src/server-api'

let root = ''
const stops: Array<() => void> = []
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'stx-api-'))
  await Bun.write(path.join(root, 'pages/index.stx'), '<main>Home</main>')
})
afterEach(async () => {
  for (const stop of stops.splice(0)) stop()
  await rm(root, { recursive: true, force: true })
})
const endpoint = (name: string, source: string): Promise<number> => Bun.write(path.join(root, 'server/api', name), source)

describe('file API discovery', () => {
  it('treats prototype-like parameter names as own data, never inherited properties', async () => {
    await endpoint('[__proto__].get.ts', 'export default (_request: Request, { params }: { params: Record<string, string> }) => params')
    const handler = await createServerApi(root, true)
    expect(await (await handler(new Request('http://localhost/api/value')))!.text()).toBe('{"__proto__":"value"}')
    await expect(apiFetch('GET /api/:constructor')).rejects.toThrow('Missing API route parameter')
  })
  it('is opt-in and detects methods, params, index routes and catch-alls', async () => {
    await endpoint('index.ts', 'export default () => ({ ok: true })')
    await endpoint('users/[id].get.ts', 'export default () => ({ ok: true })')
    await endpoint('files/[...path].post.ts', 'export default () => ({ ok: true })')
    expect(await (await createServerApi(root, false))(new Request('http://localhost/api'))).toBeNull()
    expect(discoverServerApi(root).map(route => `${route.method} ${route.pattern}`).sort()).toEqual(['GET /api', 'GET /api/users/:id', 'POST /api/files/:path*'].sort())
  })

  it('rejects ambiguous endpoints and unsupported methods before starting', async () => {
    await endpoint('users/[id].get.ts', 'export default () => 1')
    await endpoint('users/[name].get.ts', 'export default () => 2')
    expect(() => discoverServerApi(root)).toThrow('Ambiguous API route')
    await rm(path.join(root, 'server/api/users/[name].get.ts'))
    await endpoint('users.trace.ts', 'export default () => 3')
    expect(() => discoverServerApi(root)).toThrow('Unsupported API method')
  })

  it('refreshes additions, removals and transitive helper changes in development', async () => {
    await Bun.write(path.join(root, 'server/helper.ts'), "export const version = 'first'")
    await endpoint('version.get.ts', "import { version } from '../helper'; export default () => ({ version })")
    const handler = await createServerApi(root, true)
    const get = async (url = '/api/version'): Promise<Response | null> => handler(new Request(`http://localhost${url}`))
    expect(await (await get())!.json()).toEqual({ version: 'first' })
    await Bun.write(path.join(root, 'server/helper.ts'), "export const version = 'second'")
    expect(await (await get())!.json()).toEqual({ version: 'second' })
    await endpoint('new.get.ts', 'export default () => ({ added: true })')
    expect(await (await get('/api/new'))!.json()).toEqual({ added: true })
    expect(await Bun.file(path.join(root, '.stx/api-types.d.ts')).text()).toContain('GET /api/new')
    await rm(path.join(root, 'server/api/new.get.ts'))
    expect(await get('/api/new')).toBeNull()
    expect(await Bun.file(path.join(root, '.stx/api-types.d.ts')).text()).not.toContain('GET /api/new')
  })
})

for (const mode of ['development', 'production'] as const) {
  it(`${mode}: shared HTTP contract, precedence, methods, encoding and server-only packaging`, async () => {
    await Bun.write(path.join(root, 'server/helper.ts'), "export const label = 'packaged helper'")
    await endpoint('users/[id].get.ts', "import { label } from '../../helper'; export default (request: Request, { params }: { params: Record<string, string> }) => ({ id: params.id, label, query: new URL(request.url).searchParams.get('q') })")
    await endpoint('users/[name].post.ts', 'export default async (request: Request, { params }: { params: Record<string, string> }) => ({ name: params.name, body: await request.json() })')
    await endpoint('users/new.get.ts', "export default () => ({ id: 'new' })")
    await endpoint('files/[...path].get.ts', 'export default (_request: Request, { params }: { params: Record<string, string> }) => params.path')
    await endpoint('manual.get.ts', "export default () => 'discovered'")
    await endpoint('router.get.ts', "export default () => 'discovered'")
    await endpoint('fail.get.ts', "export default () => { throw new Error('SERVER_SECRET_MARKER') }")
    const manual = { '/api/manual': () => Response.json('manual') }
    const apiRouter = { handleRequest: (request: Request) => new URL(request.url).pathname === '/api/router' ? Response.json('router') : new Response(null, { status: 404 }) }
    let baseURL: string
    if (mode === 'development') {
      await symlink(path.join(root, 'server/api/fail.get.ts'), path.join(root, 'leaked.js'))
      const server = await serve({ root, configDir: root, port: 0, watch: false, stxOptions: { serverApi: true, apiRoutes: manual, apiRouter } })
      stops.push(server.stop)
      baseURL = server.url.replace(/\/$/, '')
    }
    else {
      const built = await buildForProduction({ root, serverApi: true })
      // A deployment with NO original source still executes imported helpers.
      await rm(path.join(root, 'server'), { recursive: true })
      const server = await startProductionServer({ outputDir: built.outputDir, port: 0, apiRoutes: manual, apiRouter })
      stops.push(server.stop)
      baseURL = `http://localhost:${server.port}`
      for (const file of new Bun.Glob('**/*').scanSync({ cwd: path.join(built.outputDir, 'public'), onlyFiles: true }))
        expect(await Bun.file(path.join(built.outputDir, 'public', file)).text()).not.toContain('SERVER_SECRET_MARKER')
    }
    expect(await apiFetch('GET /api/users/:id', { params: { id: 'a b' }, query: { q: 'hello world' }, baseURL })).toEqual({ id: 'a b', label: 'packaged helper', query: 'hello world' })
    expect(await apiFetch('POST /api/users/:name', { params: { name: 'alice' }, body: JSON.stringify({ age: 20 }), baseURL })).toEqual({ name: 'alice', body: { age: 20 } })
    expect(await apiFetch('GET /api/files/:path*', { params: { path: 'a/b c' }, baseURL })).toBe('a/b c')
    expect(await apiFetch('GET /api/manual', { baseURL })).toBe('manual')
    expect(await apiFetch('GET /api/router', { baseURL })).toBe('router')
    expect(await apiFetch('GET /api/users/new', { baseURL })).toEqual({ id: 'new' })
    const wrongMethod = await fetch(`${baseURL}/api/users/new`, { method: 'POST' })
    expect(wrongMethod.status).toBe(405)
    expect(wrongMethod.headers.get('Allow')).toBe('GET, HEAD, OPTIONS')
    expect((await fetch(`${baseURL}/api/users/alice`, { method: 'OPTIONS' })).status).toBe(204)
    expect(await (await fetch(`${baseURL}/api/users/alice`, { method: 'HEAD' })).text()).toBe('')
    expect((await fetch(`${baseURL}/api/users/%ZZ`)).status).toBe(400)
    expect((await fetch(`${baseURL}/api/missing`)).status).toBe(404)
    expect((await fetch(`${baseURL}/server/api/fail.get.ts`)).status).toBe(404)
    expect((await fetch(`${baseURL}/leaked.js`)).status).toBe(404)
    const failed = await fetch(`${baseURL}/api/fail`)
    expect(failed.status).toBe(500)
    expect(await failed.text()).not.toContain('SERVER_SECRET_MARKER')
  })
}

it('generates real checked response/parameter types and a browser bundle without endpoint implementations', async () => {
  await endpoint('users/[id].get.ts', `const secret = 'SERVER_SECRET_MARKER'
export default (_request: Request) => ({ id: 42, createdAt: new Date(), name: secret })`)
  await generateApiTypes(root, discoverServerApi(root))
  const clientSource = path.resolve(import.meta.dir, '../../src/api-client.ts')
  await Bun.write(path.join(root, 'client.ts'), `import { apiFetch } from '@stacksjs/stx/api-client'
async function check() {
  const user = await apiFetch('GET /api/users/:id', { params: { id: '1' } })
  const id: number = user.id
  const date: string = user.createdAt
  // @ts-expect-error response property is a number
  const invalid: string = user.id
  // @ts-expect-error route typo
  await apiFetch('GET /api/uesrs/:id', { params: { id: '1' } })
  // @ts-expect-error missing params
  await apiFetch('GET /api/users/:id')
  // @ts-expect-error wrong param name
  await apiFetch('GET /api/users/:id', { params: { slug: '1' } })
  // @ts-expect-error method not defined
  await apiFetch('POST /api/users/:id', { params: { id: '1' } })
  return { id, date }
}
void check()`)
  await Bun.write(path.join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, target: 'esnext', module: 'esnext', moduleResolution: 'bundler', types: [], lib: ['esnext', 'dom'], skipLibCheck: false, allowImportingTsExtensions: true, paths: { '@stacksjs/stx/api-client': [clientSource] } }, files: ['client.ts', '.stx/api-types.d.ts'] }))
  const tsc = Bun.spawn(['bun', '--bun', path.resolve(import.meta.dir, '../../../../node_modules/typescript/bin/tsc'), '--project', path.join(root, 'tsconfig.json')], { stdout: 'pipe', stderr: 'pipe' })
  const diagnostics = await new Response(tsc.stdout).text() + await new Response(tsc.stderr).text()
  expect(diagnostics).toBe('')
  expect(await tsc.exited).toBe(0)
  const bundle = await Bun.build({ entrypoints: [path.join(root, 'client.ts')], target: 'browser', tsconfig: path.join(root, 'tsconfig.json') })
  expect(bundle.success).toBe(true)
  const text = await bundle.outputs[0].text()
  expect(text).toContain('fetch(')
  expect(text).not.toContain('SERVER_SECRET_MARKER')
  expect(text).not.toContain('server/api')
})

it('rejects accidental endpoint imports in both inline and registry client bundles', async () => {
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default { serverApi: true }')
  await endpoint('private.get.ts', "export default () => 'SERVER_SECRET_MARKER'")
  const code = "import handler from '../server/api/private.get'; console.log(handler())"
  for (const externalizeUserModules of [false, true]) {
    clearBundleFailures()
    const result = await bundleClientScript(code, path.join(root, 'pages/index.stx'), { projectRoot: root, externalizeUserModules })
    expect(result).not.toContain('SERVER_SECRET_MARKER')
    expect(getBundleFailures().some(failure => failure.message.includes('Server-only API source'))).toBe(true)
  }
  clearBundleFailures()
})

it('does not reuse a browser bundle after an embedded host discovers that source as an endpoint', async () => {
  await endpoint('private.get.ts', "export default () => 'SERVER_SECRET_MARKER'")
  const code = "import handler from '../server/api/private.get'; console.log(handler())"
  const file = path.join(root, 'pages/index.stx')
  const options = { projectRoot: root, externalizeUserModules: false }
  expect(await bundleClientScript(code, file, options)).toContain('SERVER_SECRET_MARKER')
  await createServerApi(root, true)
  clearBundleFailures()
  expect(await bundleClientScript(code, file, options)).not.toContain('SERVER_SECRET_MARKER')
  expect(getBundleFailures().some(failure => failure.message.includes('Server-only API source'))).toBe(true)
  clearBundleFailures()
})

for (const entry of ['app', 'file'] as const) {
  it(`the ${entry} dev-server entry point discovers configured endpoints and never serves their source`, async () => {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default { serverApi: { dir: "backend/endpoints" }, shell: false }')
    await Bun.write(path.join(root, 'backend/endpoints/ping.get.ts'), 'export default () => ({ pong: true })')
    const probe = Bun.serve({ port: 0, fetch: () => new Response('probe') })
    const port = probe.port!
    probe.stop(true)
    await Bun.write(path.join(root, 'index.stx'), '<main>Home</main>')
    const appServer = path.resolve(import.meta.dir, `../../src/dev-server/serve-${entry}.ts`)
    const functionName = entry === 'app' ? 'serveApp' : 'serveStxFile'
    const input = entry === 'app' ? root : path.join(root, 'index.stx')
    await Bun.write(path.join(root, 'start.ts'), `import { ${functionName} } from ${JSON.stringify(appServer)}; await ${functionName}(${JSON.stringify(input)}, { port: ${port}, watch: false, hotReload: false })`)
    const child = Bun.spawn(['bun', path.join(root, 'start.ts')], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    const output = new Response(child.stdout).text()
    const errors = new Response(child.stderr).text()
    try {
      let response: Response | undefined
      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          response = await fetch(`http://localhost:${port}/api/ping`)
          break
        }
        catch { await Bun.sleep(50) }
        if (child.exitCode !== null)
          throw new Error(await output + await errors)
      }
      expect(response?.status).toBe(200)
      expect(await response?.json()).toEqual({ pong: true })
      expect((await fetch(`http://localhost:${port}/backend/endpoints/ping.get.ts`)).status).toBe(404)
    }
    finally {
      child.kill()
      await child.exited
      await Promise.all([output, errors])
    }
  }, 15000)
}
