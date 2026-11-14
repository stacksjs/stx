import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { scanHtmlScriptElements } from '../../src/html-masking'
import { generateStaticSite } from '../../src/ssg'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture } from '../../test-utils/browser-fixture'

/** The shipping SSG path, not renderTemplate or a hand-written approximation. */
test('SSG keeps unused modules out and awaits real ESM dependencies on cold and SPA visits', async () => {
  const root = createTempDir('stx-composable-esm-browser-'), previous = process.cwd()
  let fixture: ReturnType<typeof createBrowserFixture> | undefined, fragmentMode = false, fragments = 0
  try {
    const pages = join(root, 'pages'), out = join(root, 'dist'), functions = join(root, 'functions')
    for (const directory of ['partials','components','layouts']) mkdirSync(join(root,directory), { recursive: true })
    await Bun.write(join(root, 'stx.config.ts'), `export default { composablesDir: ${JSON.stringify(functions)}, router: { enabled: true, container: 'main', viewTransitions: false, progress: false, prefetch: false, cache: false } }`)
    await Bun.write(join(functions, 'loader.ts'), `throw new Error('UNUSED_SUPPORT_MODULE_EXECUTED'); export const support = { url: import.meta.url }`)
    await Bun.write(join(root, 'dependency.ts'), `await new Promise(resolve => setTimeout(resolve, 120)); export const accountLabel = 'ESM dependency ready'; export const receiptLabel = 'Imported ESM ready'`)
    await Bun.write(join(functions, 'account.ts'), `import { accountLabel } from '../dependency'; export function accountDetails() { return { label: accountLabel, url: import.meta.url } }`)
    const shell = (body: string) => `<!doctype html><html><head><title>Module boundary</title></head><body><nav><a data-stx-link href="/">Home</a><a data-stx-link href="/account">Account</a></nav><main>${body}</main></body></html>`
    await Bun.write(join(pages, 'index.stx'), shell(`<script client>const greeting = state('hq.support')</script><h1 :text="greeting()"></h1><link href="/support.css">`))
    await Bun.write(join(pages, 'account.stx'), shell(`<script client>import { receiptLabel } from '../dependency'; const receipt = state(receiptLabel); const details = accountDetails(); const label = state(details.label); const url = state(details.url)</script><h1 :text="label()"></h1><output :text="url()"></output><footer :text="receipt()"></footer>`))
    process.chdir(root)
    const result = await generateStaticSite({ pagesDir: pages, outputDir: out, sitemap: false, cache: false, cleanOutput: true, minify: true })
    process.chdir(previous)
    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(2)
    const home = await Bun.file(join(out, 'index.html')).text()
    expect(home).not.toContain('UNUSED_SUPPORT_MODULE_EXECUTED')
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
        const pathname = new URL(request.url).pathname
        if (pathname === '/support.css') return new Response('', { headers: { 'Content-Type': 'text/css' } })
        const file = Bun.file(join(out, pathname === '/' ? 'index.html' : pathname.includes('.') ? pathname : pathname.slice(1) + '.html'))
        if (!await file.exists()) return new Response('Not found', { status: 404 })
        let response = new Response(file)
        if (file.type.startsWith('text/html')) {
          let html = await file.text()
          if (fragmentMode && request.headers.get('X-STX-Router')) {
            fragments++
            const scripts = scanHtmlScriptElements(html).filter(script => /data-stx-scoped/.test(script.attrs)).map(script => html.slice(script.start,script.end)).join('\n')
            const body = html.match(/<main>([\s\S]*?)<\/main>/)![1]!
            return new Response(scripts + body, {headers:{'Content-Type':'text/html','X-STX-Fragment':'true','X-STX-Runtime':'true'}})
          }
          // Install error capture before any emitted code. This is test-only
          // instrumentation; all functional code is the actual SSG artifact.
          html = html.replace('<head>', '<head><script>window.proofErrors=[];console.error=(...args)=>proofErrors.push(args.map(String).join(" "));addEventListener("error",e=>proofErrors.push(e.message));addEventListener("unhandledrejection",e=>proofErrors.push(String(e.reason)))</script>')
          response = new Response(html, { headers: { 'Content-Type': 'text/html' } })
        }
        return response
      } }),
      createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
      overallTimeoutMs: 25_000,
    })
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'hq.support')).toBe('hq.support')
    expect(await fixture.view.evaluate('JSON.stringify(proofErrors)')).toBe('[]')
    expect(await fixture.waitFor('!!window.stxRouter', value => value === true)).toBe(true)
    await fixture.view.evaluate(`(()=>{window.proofDocument='home';document.querySelector('a[href="/account"]').click()})()`)
    const arrived = await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'ESM dependency ready')
    expect(arrived).toBe('ESM dependency ready')
    expect(await fixture.view.evaluate('window.proofDocument')).toBe('home')
    expect(await fixture.view.evaluate(`document.querySelector('output').textContent.startsWith(location.origin)`)).toBe(true)
    expect(await fixture.view.evaluate(`document.querySelector('footer').textContent`)).toBe('Imported ESM ready')
    expect(await fixture.view.evaluate(`typeof window.accountLabel`)).toBe('undefined')
    expect(await fixture.view.evaluate('JSON.stringify(proofErrors)')).toBe('[]')
    await fixture.view.navigate(new URL('/account', fixture.url).href)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'ESM dependency ready')).toBe('ESM dependency ready')
    expect(await fixture.view.evaluate('JSON.stringify(proofErrors)')).toBe('[]')
    expect(await fixture.waitFor('!!window.stxRouter', value => value === true)).toBe(true)
    await fixture.view.evaluate(`(()=>{window.proofDocument='account';document.querySelector('a[href="/"]').click()})()`)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'hq.support')).toBe('hq.support')
    await fixture.view.evaluate(`document.querySelector('a[href="/account"]').click()`)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'ESM dependency ready')).toBe('ESM dependency ready')
    expect(await fixture.view.evaluate('JSON.stringify(proofErrors)')).toBe('[]')
    expect(await fixture.view.evaluate('window.proofDocument')).toBe('account')
    fragmentMode = true
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor('!!window.stxRouter', value => value === true)).toBe(true)
    await fixture.view.evaluate(`(()=>{window.proofDocument='fragment';document.querySelector('a[href="/account"]').click()})()`)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'ESM dependency ready')).toBe('ESM dependency ready')
    expect(await fixture.view.evaluate('window.proofDocument')).toBe('fragment')
    expect(fragments).toBe(1)
    expect(await fixture.view.evaluate('JSON.stringify(proofErrors)')).toBe('[]')
    fragmentMode = false
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor('!!window.stxRouter', value => value === true)).toBe(true)
    await fixture.view.evaluate(`document.querySelector('a[href="/account"]').click()`)
    expect(await fixture.waitFor(`location.pathname`, value => value === '/account')).toBe('/account')
    expect(await fixture.view.evaluate('Object.keys(window.__stxModuleJobs||{}).length > 0')).toBe(true)
    await fixture.view.evaluate(`document.querySelector('a[href="/"]').click()`)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'hq.support')).toBe('hq.support')
    await fixture.view.evaluate(`document.querySelector('a[href="/account"]').click()`)
    expect(await fixture.waitFor(`document.querySelector('h1')?.textContent`, value => value === 'ESM dependency ready')).toBe('ESM dependency ready')
    expect(await fixture.view.evaluate('JSON.stringify(proofErrors)')).toBe('[]')


  }
  finally { process.chdir(previous); fixture?.close(); rmSync(root, { recursive: true, force: true }) }
}, 45_000)

/** Nonces are hidden from Attr.value/getAttribute after a script enters the document. */
test('ordered external classic and ESM scripts retain their nonce under strict CSP', async () => {
  const { orderPageModules } = await import('../../src/page-module-order')
  const nonce = 'stx-order-proof'
  const html = orderPageModules(`<!doctype html><html><head><script nonce="${nonce}">globalThis.violations=[];addEventListener('securitypolicyviolation',event=>violations.push(event.violatedDirective))</script><script data-stx-scoped nonce="${nonce}" type="module">await new Promise(resolve=>setTimeout(resolve,20));globalThis.firstReady=true;</script><script data-stx-scoped nonce="${nonce}" src="/classic.js"></script><script data-stx-scoped nonce="${nonce}" type="module" src="/module.js"></script></head><body><h1>Ordered external scripts</h1></body></html>`)
  const fixture = createBrowserFixture({
    createServer: () => Bun.serve({ hostname:'127.0.0.1',port:0,fetch(request) {
      const path = new URL(request.url).pathname
      if (path === '/classic.js') return new Response('globalThis.classicReady=globalThis.firstReady;', {headers:{'Content-Type':'text/javascript'}})
      if (path === '/module.js') return new Response('await new Promise(resolve=>setTimeout(resolve,20));globalThis.externalModuleReady=globalThis.classicReady;', {headers:{'Content-Type':'text/javascript'}})
      return new Response(html, {headers:{'Content-Type':'text/html','Content-Security-Policy':`script-src 'nonce-${nonce}'`}})
    } }),
    createView: () => new WebView({headless:true,backend:{type:'chrome',url:false}}),
  })
  try {
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor('globalThis.externalModuleReady', value => value === true)).toBe(true)
    expect(await fixture.view.evaluate('JSON.stringify(violations)')).toBe('[]')
  }
  finally {fixture.close()}
},30_000)
