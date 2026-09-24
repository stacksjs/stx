import { afterEach, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildForProduction } from '../../src/production-builder'
import { startProductionServer } from '../../src/production-server'
import { injectRuntimeConfig, resolveRuntimeConfig, useServerRuntimeConfig, withRuntimeConfig } from '../../src/runtime-config-server'
import { processDirectives } from '../../src/process'
import { defaultConfig } from '../../src/config'
import { useRuntimeConfig } from '../../src/runtime-config'
import { Window } from 'happy-dom'
import { bundleClientScript, clearBundleFailures, getBundleFailures } from '../../src/client-script-bundler'
import { generateRuntimeConfigTypes } from '../../src/runtime-config-loader'

const dirs: string[] = []
const servers: Awaited<ReturnType<typeof startProductionServer>>[] = []
afterEach(async () => {
  for (const server of servers.splice(0)) server.stop()
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true })
  delete process.env.STX_RUNTIME_PUBLIC__API_URL
  delete process.env.STX_RUNTIME_PRIVATE__TOKEN
})
async function fixture(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-runtime-config-'))
  dirs.push(dir)
  return dir
}

it('validates overrides without exposing values in errors and freezes isolated snapshots', async () => {
  const defaults = { public: { apiUrl: '/api', count: 1, enabled: true, nested: { title: 'hi' }, list: [1] }, private: { token: 'secret' } }
  const config = resolveRuntimeConfig(defaults, { STX_RUNTIME_PUBLIC__COUNT: '2', STX_RUNTIME_PUBLIC__ENABLED: 'false', STX_RUNTIME_PUBLIC__NESTED__TITLE: 'new', STX_RUNTIME_PUBLIC__LIST: '[2,3]', STX_RUNTIME_PRIVATE__TOKEN: 'other' })
  expect(config.public).toEqual({ apiUrl: '/api', count: 2, enabled: false, nested: { title: 'new' }, list: [2, 3] })
  expect(defaults.private.token).toBe('secret')
  expect(Object.isFrozen(config.private)).toBe(true)
  expect(() => resolveRuntimeConfig(defaults, { STX_RUNTIME_PUBLIC__COUNT: '"secret-value"' })).toThrow('Wrong runtime config override type: STX_RUNTIME_PUBLIC__COUNT')
  expect(() => resolveRuntimeConfig({ public: { apiUrl: '', api_url: '' } })).toThrow('Ambiguous')
  const results = await Promise.all(['a', 'b'].map(token => withRuntimeConfig(resolveRuntimeConfig({ private: { token } }), async () => {
    await Bun.sleep(1)
    const value = useServerRuntimeConfig()
    expect(JSON.stringify(value)).toBe('{"public":{}}')
    return (value.private as any).token
  })))
  expect(results).toEqual(['a', 'b'])
})

it('serializes only public JSON safely and client reads the newest SPA payload', () => {
  const window = new Window()
  const before = globalThis.document
  try {
    globalThis.document = window.document as any
    const config = resolveRuntimeConfig({ public: { text: '</script><script>bad()</script>' }, private: { token: 'hidden' } })
    const html = injectRuntimeConfig('<html><head></head><body></body></html>', config)
    expect(html).not.toContain('hidden')
    window.document.write(html)
    expect(window.document.querySelectorAll('script').length).toBe(1)
    expect((useRuntimeConfig() as any).text).toBe('</script><script>bad()</script>')
    window.document.body.innerHTML = injectRuntimeConfig('<main>next</main>', resolveRuntimeConfig({ public: { text: 'next' } }))
    expect(useRuntimeConfig()).toEqual({ text: 'next' })
  }
  finally {
    if (before) globalThis.document = before
    else delete (globalThis as any).document
    window.happyDOM.abort()
  }
})

it('renders public config in development without serializing the private section', async () => {
  const html = await processDirectives('<script server>const settings = useServerRuntimeConfig(); const url = useRuntimeConfig().apiUrl</script><main>{{ url }}</main>', {}, '/tmp/runtime-page.stx', { ...defaultConfig, runtimeConfig: { public: { apiUrl: '/dev' }, private: { token: 'private-sentinel' } } }, new Set())
  expect(html).toContain('/dev')
  expect(html).toContain('data-stx-runtime-config')
  expect(html).not.toContain('private-sentinel')
})

it('serves one source-independent build with two simultaneous deployment configurations', async () => {
  const dir = await fixture()
  await Bun.write(path.join(dir, 'stx.config.ts'), `export default { serverApi: true, runtimeConfig: { public: { apiUrl: '/build' }, private: { token: 'build-secret' } } }`)
  await Bun.write(path.join(dir, 'pages/index.stx'), '<script server>const url = useRuntimeConfig().apiUrl; const settings = useServerRuntimeConfig()</script><html><head></head><body><main><p>{{ url }}</p></main></body></html>')
  await Bun.write(path.join(dir, 'pages/static.stx'), '<html><head></head><body><main>Static</main></body></html>')
  const modulePath = path.resolve(import.meta.dir, '../../src/runtime-config-server.ts')
  await Bun.write(path.join(dir, 'server/api/check.get.ts'), `import { useServerRuntimeConfig } from ${JSON.stringify(modulePath)}; export default async () => { await Bun.sleep(2); const c = useServerRuntimeConfig(); return { valid: c.private.token === 'deploy-' + c.public.apiUrl, url: c.public.apiUrl } }`)
  const built = await buildForProduction({ root: dir })
  await rm(path.join(dir, 'pages'), { recursive: true })
  await rm(path.join(dir, 'server'), { recursive: true })
  await rm(path.join(dir, 'stx.config.ts'))
  for (const value of ['one', 'two']) {
    process.env.STX_RUNTIME_PUBLIC__API_URL = value
    process.env.STX_RUNTIME_PRIVATE__TOKEN = `deploy-${value}`
    servers.push(await startProductionServer({ outputDir: built.outputDir, port: 0 }))
  }
  await Promise.all(servers.map(async (server, i) => {
    const value = ['one', 'two'][i]
    for (const pathname of ['/', '/static']) {
      for (const fragment of [false, true]) {
        const response = await fetch(`http://localhost:${server.port}${pathname}`, { headers: fragment ? { 'X-STX-Router': 'true' } : {} })
        const html = await response.text()
        expect(response.status).toBe(200)
        expect(html).toContain(`"apiUrl":"${value}"`)
        expect(html).not.toContain('deploy-')
        expect(html).not.toContain('build-secret')
        if (pathname === '/') expect(html).toContain(`<p>${value}</p>`)
      }
    }
    expect(await (await fetch(`http://localhost:${server.port}/api/check`)).json()).toEqual({ valid: true, url: value })
    expect((await fetch(`http://localhost:${server.port}/server/runtime-config.json`)).status).toBe(404)
  }))
  const types = await Bun.file(path.join(dir, '.stx/runtime-config.d.ts')).text()
  expect(types).toContain('"apiUrl": string')
  expect(types).not.toContain('private')
  expect(types).not.toContain('token')
})

it('rejects config-file and server-accessor imports in browser bundles', async () => {
  const dir = await fixture()
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default { runtimeConfig: { private: { token: "bundled-secret" } } }')
  const file = path.join(dir, 'pages/index.stx')
  for (const specifier of ['../stx.config.ts', path.resolve(import.meta.dir, '../../src/runtime-config-server.ts')]) {
    clearBundleFailures()
    const result = await bundleClientScript(`import value from ${JSON.stringify(specifier)}; console.log(value)`, file)
    expect(result).not.toContain('bundled-secret')
    expect(getBundleFailures().some(failure => failure.message.includes('Server-only API source'))).toBe(true)
  }
  clearBundleFailures()
})

it('generates public-only checked types and bundles no private defaults', async () => {
  const dir = await fixture()
  await generateRuntimeConfigTypes(dir, { public: { apiUrl: '', retries: 3 }, private: { password: 'TYPE_SECRET' } })
  await Bun.write(path.join(dir, 'client.ts'), `import { useRuntimeConfig } from '@stacksjs/stx/runtime-config'
const config = useRuntimeConfig()
const url: string = config.apiUrl
const retries: number = config.retries
// @ts-expect-error private is server-only
config.private
// @ts-expect-error private keys are not flattened into public
config.password
// @ts-expect-error inferred number, not string
const bad: string = config.retries
console.log(url, retries)`)
  await Bun.write(path.join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, target: 'esnext', module: 'esnext', moduleResolution: 'bundler', types: [], lib: ['esnext', 'dom'], paths: { '@stacksjs/stx/runtime-config': [path.resolve(import.meta.dir, '../../src/runtime-config.ts')] } }, files: ['client.ts', '.stx/runtime-config.d.ts'] }))
  const tsc = Bun.spawn(['bun', '--bun', path.resolve(import.meta.dir, '../../../../node_modules/typescript/bin/tsc'), '--project', path.join(dir, 'tsconfig.json')], { stdout: 'pipe', stderr: 'pipe' })
  expect(await new Response(tsc.stdout).text() + await new Response(tsc.stderr).text()).toBe('')
  expect(await tsc.exited).toBe(0)
  const bundle = await Bun.build({ entrypoints: [path.join(dir, 'client.ts')], tsconfig: path.join(dir, 'tsconfig.json'), target: 'browser' })
  expect(bundle.success).toBe(true)
  expect(await bundle.outputs[0].text()).not.toContain('TYPE_SECRET')
})
