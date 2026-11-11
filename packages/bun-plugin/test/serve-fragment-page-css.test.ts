import { WebView } from 'bun'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

// A page reached by a link click used to render with the previous page's
// stylesheets and none of its own: the fragment is the container's inner
// content, so the <link rel="stylesheet"> its head declares never came along.
// Seen as home.css still being the only page sheet after Home -> Format.
const servePath = path.join(import.meta.dir, '../src/serve.ts')
const routerPath = path.join(import.meta.dir, '../../router/src/client.ts')
const port = freePort()
const base = `http://127.0.0.1:${port}`
let directory: string
let child: ReturnType<typeof Bun.spawn> | undefined
let output: Promise<string> | undefined
let errors: Promise<string> | undefined

beforeAll(async () => {
  directory = createTempDir('stx-fragment-page-css-')
  await Bun.write(path.join(directory, 'stx.config.ts'), 'export default { seo: { enabled: false } }')
  const shell = (head: string, label: string) => `<!doctype html><html><head><title>${label}</title>${head}
<link rel="stylesheet" href="/assets/styles/production/app.css">
<script src="/__probe-router.js"></script></head><body><script client>const cssProbe = state(0)</script><main><h1>${label}</h1>
<a id="home" href="/home">Home</a><a id="format" href="/docs/format">Format</a><a id="plain" href="/plain">Plain</a></main></body></html>`
  await Bun.write(path.join(directory, 'views/home.stx'), shell('<link rel="stylesheet" href="/assets/styles/production/home.css">', 'Home'))
  // One root path, one relative to the page that declares it, one with a media query.
  await Bun.write(path.join(directory, 'views/docs/format.stx'), shell(`<link rel="stylesheet" href="/assets/styles/production/format.css">
<link rel="stylesheet" href="local.css"><link rel="stylesheet" href="/assets/styles/production/print.css" media="print">`, 'Format'))
  await Bun.write(path.join(directory, 'views/plain.stx'), shell('', 'Plain'))
  await Bun.write(path.join(directory, 'public/assets/styles/production/app.css'), 'main { display: block }')
  await Bun.write(path.join(directory, 'public/assets/styles/production/home.css'), 'h1 { color: rgb(10, 20, 30) }')
  await Bun.write(path.join(directory, 'public/assets/styles/production/format.css'), 'h1 { letter-spacing: 7px }')
  await Bun.write(path.join(directory, 'public/assets/styles/production/print.css'), 'h1 { text-indent: 9px }')
  await Bun.write(path.join(directory, 'public/docs/local.css'), 'h1 { word-spacing: 5px }')
  const { getRouterScript } = await import(routerPath)
  const router = `window.__stxRouterConfig={interceptAllLinks:true,screens:false,prefetch:false,progress:false,viewTransitions:false,revalidate:false,keepOpening:false};\n${getRouterScript()}`
  await Bun.write(path.join(directory, 'public/__probe-router.js'), router)
  // i18n on, so the fragment also goes through the locale post-processing
  // that takes the metadata template off and puts it back.
  await Bun.write(path.join(directory, 'driver.ts'), `import { serve } from ${JSON.stringify(servePath)}
await serve({ patterns: ['views'], port: ${port}, imageWarmup: false,
  i18n: { locales: ['en', 'de'], defaultLocale: 'en', labels: {}, pickerSelector: '#lang-picker', translations: { en: {}, de: {} } }
})`)
  child = Bun.spawn([process.execPath, 'driver.ts'], { cwd: directory, stdout: 'pipe', stderr: 'pipe' })
  output = new Response(child.stdout).text()
  errors = new Response(child.stderr).text()
  for (let i = 0; i < 600; i++) {
    try { await fetch(`${base}/home`); return }
    catch { await Bun.sleep(50) }
  }
  throw new Error('Page stylesheet test server did not start')
}, 35_000)

afterAll(async () => {
  child?.kill()
  if (child) await child.exited
  await output
  await errors
  if (directory) await rm(directory, { recursive: true, force: true })
})

test('real HTTP fragments list the page stylesheets right behind the metadata, generated sheets excluded', async () => {
  const lists: Record<string, string | undefined> = {}
  for (const route of ['/home', '/docs/format', '/de/docs/format', '/plain']) {
    const response = await fetch(`${base}${route}`, { headers: { 'X-STX-Router': 'true' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('X-STX-Fragment')).toBe('true')
    const html = await response.text()
    const payload = /^<template data-stx-page-head="1">[\s\S]*?<\/template>\n?<template data-stx-page-css="1">([\s\S]*?)<\/template>\n/.exec(html)
    expect(payload).not.toBeNull()
    lists[route] = payload![1]
    expect(payload![1]).not.toContain('data-css')
    // The metadata contract is unchanged: no asset inside it.
    expect(/^<template data-stx-page-head="1">([\s\S]*?)<\/template>/.exec(html)![1]).not.toContain('stylesheet')
  }
  expect(lists['/home']).toBe('<link rel="stylesheet" href="/assets/styles/production/home.css"><link rel="stylesheet" href="/assets/styles/production/app.css">')
  expect(lists['/docs/format']).toBe('<link rel="stylesheet" href="/assets/styles/production/format.css"><link rel="stylesheet" href="local.css">'
    + '<link rel="stylesheet" href="/assets/styles/production/print.css" media="print"><link rel="stylesheet" href="/assets/styles/production/app.css">')
  expect(lists['/de/docs/format']).toBe(lists['/docs/format'])
  expect(lists['/plain']).toBe('<link rel="stylesheet" href="/assets/styles/production/app.css">')
})

async function until(view: WebView, expression: string): Promise<void> {
  for (let i = 0; i < 300; i++) {
    if (await view.evaluate(expression)) return
    await Bun.sleep(20)
  }
  throw new Error(`Browser did not settle: ${expression}`)
}

test('real browser gets the destination stylesheets on a link click, once, and keeps them across history', async () => {
  const view = new WebView({ headless: true })
  // Every non-generated stylesheet in <head>: where it points, and whether it applies on screen.
  const read = `(() => ({
    sheets: [...document.head.querySelectorAll('link[rel="stylesheet"]')].filter(l => !l.hasAttribute('data-css')).map(l => new URL(l.href).pathname + (l.media ? ' @' + l.media : '')),
    pending: document.head.querySelectorAll('link[data-stx-css-pending]').length,
    heading: document.querySelector('main h1').textContent,
    color: getComputedStyle(document.querySelector('main h1')).color,
    letterSpacing: getComputedStyle(document.querySelector('main h1')).letterSpacing,
    wordSpacing: getComputedStyle(document.querySelector('main h1')).wordSpacing,
    textIndent: getComputedStyle(document.querySelector('main h1')).textIndent,
    leaked: document.querySelectorAll('template[data-stx-page-css],main link').length,
    noReload: window.noReload === true,
  }))()`
  const home = ['/assets/styles/production/home.css', '/assets/styles/production/app.css']
  const format = [...home, '/assets/styles/production/format.css', '/docs/local.css', '/assets/styles/production/print.css @print']
  try {
    await view.navigate(`${base}/home`)
    await until(view, '!!window.stxRouter')
    await view.evaluate('window.noReload = true')
    expect(await view.evaluate(read)).toMatchObject({ sheets: home, heading: 'Home', color: 'rgb(10, 20, 30)', letterSpacing: 'normal', wordSpacing: '0px' })

    await view.evaluate('document.querySelector("#format").click()')
    await until(view, 'document.querySelector("main h1").textContent === "Format"')
    // The page's own CSS is in and applied by the time its markup is; the
    // print sheet is there under its own media, so it does not style the screen.
    expect(await view.evaluate(read)).toEqual({ sheets: format, pending: 0, heading: 'Format', color: 'rgb(10, 20, 30)', letterSpacing: '7px', wordSpacing: '5px', textIndent: '0px', leaked: 0, noReload: true })

    // Additive: going on, back and forward never removes one or adds a second.
    await view.evaluate('document.querySelector("#plain").click()')
    await until(view, 'document.querySelector("main h1").textContent === "Plain"')
    expect((await view.evaluate(read) as any).sheets).toEqual(format)
    await view.evaluate('history.back()')
    await until(view, 'document.querySelector("main h1").textContent === "Format"')
    await view.evaluate('document.querySelector("#home").click()')
    await until(view, 'document.querySelector("main h1").textContent === "Home"')
    await view.evaluate('document.querySelector("#format").click()')
    await until(view, 'document.querySelector("main h1").textContent === "Format"')
    expect(await view.evaluate(read)).toEqual({ sheets: format, pending: 0, heading: 'Format', color: 'rgb(10, 20, 30)', letterSpacing: '7px', wordSpacing: '5px', textIndent: '0px', leaked: 0, noReload: true })
  }
  finally {
    view.close()
  }
}, 30_000)
