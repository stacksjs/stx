import { WebView } from 'bun'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

// The same HTTP/browser qualification can run against clean npm installs.
const consumer = process.env.STX_HEAD_CONSUMER_ROOT
const servePath = consumer ? path.join(consumer, 'node_modules/bun-plugin-stx/dist/serve.js') : path.join(import.meta.dir, '../src/serve.ts')
const routerPath = consumer ? path.join(consumer, 'node_modules/stx-router/dist/client.js') : path.join(import.meta.dir, '../../router/src/client.ts')
const port = freePort()
const base = `http://127.0.0.1:${port}`
let directory: string
let child: ReturnType<typeof Bun.spawn> | undefined
let output: Promise<string> | undefined
let errors: Promise<string> | undefined

beforeAll(async () => {
  directory = createTempDir('stx-fragment-head-')
  await Bun.write(path.join(directory, 'stx.config.ts'), 'export default { seo: { enabled: false } }')
  const shell = (head: string, label: string) => `<!doctype html><html><head>${head}
<meta name="csrf-token" content="keep"><meta name="theme-color" content="red">
<script src="/__probe-router.js"></script></head><body><script client>const metadataProbe = state(0)</script><main><h1>${label}</h1>
<a id="literal" href="/literal">Literal</a><a id="localized" href="/de/page">Deutsch</a><a id="empty" href="/empty">Empty</a></main></body></html>`
  await Bun.write(path.join(directory, 'views/page.stx'), shell(`<title>{t:title}</title>
<meta name="description" content="{t:description}"><meta property="og:title" content="{t:title}">
<meta name="twitter:card" content="summary"><link rel="canonical" href="https://example.test/page?x=1&amp;y=2">
<link rel="alternate" hreflang="en" href="/page"><link rel="alternate" hreflang="de" href="/de/page">`, '{t:title}'))
  await Bun.write(path.join(directory, 'views/literal.stx'), shell(`<title>Literal &amp;lt; 100%</title>
<meta name="description" content="Literal &quot;你好&quot; &amp; &lt;value&gt;">
<link rel="canonical" href="https://example.test/literal">`, 'Literal'))
  await Bun.write(path.join(directory, 'views/empty.stx'), shell('<title>Empty</title>', 'Empty'))
  const { getRouterScript } = await import(routerPath)
  const router = `window.__stxRouterConfig={interceptAllLinks:true,screens:new URL(location.href).searchParams.has('retained'),prefetch:false,progress:false,viewTransitions:false,revalidate:false,keepOpening:false};\n${getRouterScript()}`
  await Bun.write(path.join(directory, 'public/__probe-router.js'), router)
  await Bun.write(path.join(directory, 'driver.ts'), `import { serve } from ${JSON.stringify(servePath)}
await serve({ patterns: ['views'], port: ${port}, imageWarmup: false,
  i18n: { locales: ['en', 'de'], defaultLocale: 'en', labels: {}, pickerSelector: '#lang-picker',
    translations: { en: { title: 'English & "quoted" 你好', description: 'English & "quoted" <literal>' }, de: { title: 'Deutsch & Grüß', description: 'Deutsch & "zitiert" <literal>' } } }
})`)
  child = Bun.spawn([process.execPath, 'driver.ts'], { cwd: directory, stdout: 'pipe', stderr: 'pipe' })
  output = new Response(child.stdout).text()
  errors = new Response(child.stderr).text()
  for (let i = 0; i < 600; i++) {
    try { await fetch(`${base}/page`); return }
    catch { await Bun.sleep(50) }
  }
  throw new Error('Metadata test server did not start')
}, 35_000)

afterAll(async () => {
  child?.kill()
  if (child) await child.exited
  await output
  await errors
  if (directory) await rm(directory, { recursive: true, force: true })
})

test('real HTTP fragments carry translated, bounded metadata, including an explicit empty set', async () => {
  for (const [route, expected] of [['/page', 'English'], ['/de/page', 'Deutsch'], ['/literal', 'Literal'], ['/empty', 'Empty']]) {
    const response = await fetch(`${base}${route}`, { headers: { 'X-STX-Router': 'true' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('X-STX-Fragment')).toBe('true')
    expect(response.headers.get('Vary')).toContain('X-STX-Router')
    const html = await response.text()
    const payload = html.match(/^<template data-stx-page-head="1">([\s\S]*?)<\/template>/)?.[1]
    expect(payload).toBeDefined()
    expect(payload).toContain(expected)
    expect(payload).not.toContain('{t:')
    expect(payload).not.toContain('csrf-token')
    expect(payload).not.toContain('theme-color')
    expect(payload).not.toContain('<script')
    if (route === '/empty') expect(payload).not.toContain('description')
  }
})

test('site-generated metadata uses the destination route, not body/SVG titles or an old title header', async () => {
  const root = path.join(directory, 'site')
  const sitePort = freePort()
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default { seo: { enabled: false } }')
  await Bun.write(path.join(root, 'views/detail.stx'), '<html><head><title>stx App</title></head><body><main><svg><title>Body title</title></svg>Detail</main></body></html>')
  await Bun.write(path.join(root, 'driver.ts'), `import { serve } from ${JSON.stringify(servePath)}
await serve({patterns:['views'],port:${sitePort},imageWarmup:false,site:{name:'Site',url:'https://example.test',pages:{'/detail':{title:'Detail & "quoted"',description:'Destination description'}}}})`)
  const server = Bun.spawn([process.execPath, 'driver.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  const stdout = new Response(server.stdout).text()
  const stderr = new Response(server.stderr).text()
  try {
    let response: Response | undefined
    for (let i = 0; i < 600; i++) {
      try { response = await fetch(`http://127.0.0.1:${sitePort}/detail`, { headers: { 'X-STX-Router': 'true' } }); break }
      catch { await Bun.sleep(50) }
    }
    expect(response?.status).toBe(200)
    const html = await response!.text()
    const metadata = html.match(/^<template data-stx-page-head="1">([\s\S]*?)<\/template>/)?.[1]
    expect(metadata).toContain('<title>Detail &amp; &quot;quoted&quot;</title>')
    expect(metadata).toContain('href="https://example.test/detail"')
    expect(metadata).toContain('Destination description')
    expect(metadata).not.toContain('Body title')
    expect(decodeURIComponent(response!.headers.get('X-STX-Title')!)).toBe('Detail & "quoted"')
  }
  finally {
    server.kill()
    await server.exited
    await stdout
    await stderr
  }
}, 35_000)

async function until(view: WebView, expression: string): Promise<void> {
  for (let i = 0; i < 300; i++) {
    if (await view.evaluate(expression)) return
    await Bun.sleep(20)
  }
  throw new Error(`Browser did not settle: ${expression}`)
}

for (const retained of [false, true]) {
  test(`real browser metadata survives links, prefetch, locales and back/forward (retained=${retained})`, async () => {
    const view = new WebView({ headless: true })
    const read = `(() => ({title:document.title,description:document.head.querySelector('meta[name="description"]')?.content ?? null,canonical:document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,alternates:document.head.querySelectorAll('link[hreflang]').length,og:document.head.querySelectorAll('meta[property^="og:"]').length,csrf:document.head.querySelector('meta[name="csrf-token"]')===window.keptCsrf}))()`
    try {
      await view.navigate(`${base}/page${retained ? '?retained=1' : ''}`)
      await until(view, '!!window.stxRouter')
      await view.evaluate('(() => {window.keptCsrf=document.head.querySelector(\'meta[name="csrf-token"]\'); window.noReload=true; window.stxRouter.prefetch("/literal")})()')
      await until(view, '!!window.stxRouter.cache["/literal"]')
      expect((await view.evaluate(read) as any).description).toBe('English & "quoted" <literal>')
      await view.evaluate('document.querySelector("#literal").click()')
      await until(view, 'document.title === "Literal &lt; 100%"')
      expect(await view.evaluate(read)).toEqual({ title: 'Literal &lt; 100%', description: 'Literal "你好" & <value>', canonical: 'https://example.test/literal', alternates: 0, og: 0, csrf: true })
      // Explicit locale switches use the same force flag as the lang picker;
      // ordinary links are intentionally localized to the current language.
      await view.evaluate('window.stxRouter.navigate("/de/page",true,true)')
      await until(view, 'document.title === "Deutsch & Grüß"')
      expect((await view.evaluate(read) as any).description).toBe('Deutsch & "zitiert" <literal>')
      expect((await view.evaluate(read) as any).alternates).toBe(2)
      await view.evaluate('history.back()')
      await until(view, 'document.title === "Literal &lt; 100%"')
      expect((await view.evaluate(read) as any).canonical).toBe('https://example.test/literal')
      await view.evaluate('history.forward()')
      await until(view, 'document.title === "Deutsch & Grüß"')
      expect((await view.evaluate(read) as any).description).toBe('Deutsch & "zitiert" <literal>')
      // Use the API here: the locale prefixer deliberately localizes links.
      await view.evaluate('window.stxRouter.navigate("/empty")')
      await until(view, 'document.title === "Empty"')
      expect(await view.evaluate(read)).toEqual({ title: 'Empty', description: null, canonical: null, alternates: 0, og: 0, csrf: true })
      expect(await view.evaluate('window.noReload')).toBe(true)
      expect(await view.evaluate('document.querySelector("template[data-stx-page-head]") === null')).toBe(true)
    }
    finally {
      view.close()
    }
  }, 30_000)
}
