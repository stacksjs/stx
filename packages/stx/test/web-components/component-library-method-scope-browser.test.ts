import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'
import { exerciseMethodScope, methodScopeExpected, methodScopeSource } from '../../test-utils/component-method-scope'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild

// The maintained public contract runs in Chrome from emitted assets after the
// authored source is gone, with no ambient stx or string-execution permission.
for (const bundle of [false, true]) test(`public method render ownership works in ${bundle ? 'standalone' : 'ESM'} Chrome under strict CSP`, async () => {
  const root = createTempDir('stx-method-scope-browser-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    const inputDir = join(root, 'source'), outputDir = join(root, 'dist')
    await Bun.write(join(inputDir, 'Probe.stx'), methodScopeSource)
    const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'browser-method', bundle, progressive: false })
    await rm(inputDir, { recursive: true })
    const emitted = new Map(result.files.filter(file => file.endsWith('.js')).map(file => [`/${relative(outputDir, file).split(sep).join('/')}`, file]))
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
        const pathname = new URL(request.url).pathname
        if (pathname === '/') return new Response(`<!doctype html><link rel="icon" href="/favicon.ico"><script src="/probe.js"></script><script type="module" src="/${bundle ? 'bundle' : 'index'}.js"></script>`, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; img-src 'self'; base-uri 'none'" } })
        if (pathname === '/favicon.ico') return new Response(null, { status: 204 })
        if (pathname === '/probe.js') return new Response(`globalThis.errors=[];globalThis.violations=[];addEventListener('error',event=>errors.push(event.message));addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));addEventListener('securitypolicyviolation',event=>violations.push(event.effectiveDirective));globalThis.exercise=${exerciseMethodScope.toString()}`, { headers: { 'Content-Type': 'text/javascript' } })
        const file = emitted.get(pathname)
        return file ? new Response(Bun.file(file), { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
      } }),
      createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend(process.platform, 'chrome') }),
    })
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor(`!!customElements.get('browser-method-probe')`, value => value === true)).toBe(true)
    expect(JSON.parse(await fixture.view.evaluate<string>(`exercise('browser-method-probe').then(JSON.stringify)`))).toEqual(methodScopeExpected)
    expect(await fixture.view.evaluate('JSON.stringify(errors)')).toBe('[]')
    expect(await fixture.view.evaluate('JSON.stringify(violations)')).toBe('[]')
    expect(await fixture.view.evaluate(`typeof globalThis.stx + ':' + typeof globalThis.defineProps`)).toBe('undefined:undefined')
  }
  finally { fixture?.close(); await rm(root, { recursive: true, force: true }) }
}, 30000)
