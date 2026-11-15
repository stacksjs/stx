import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture } from '../../test-utils/browser-fixture'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild

// Actual Chrome, strict script CSP and distributed files catch ambient globals,
// dynamic string execution, shadow event propagation and slot regressions.
for (const bundle of [true, false]) test(`typed emit buttons work from ${bundle ? 'standalone' : 'ESM'} elements under CSP with shadow slots`, async () => {
  const root = createTempDir('stx-emits-browser-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined, browser: WebView | undefined
  try {
    const inputDir = join(root, 'source'), outputDir = join(root, 'dist')
    await Bun.write(join(inputDir, 'helpers.ts'), `export const suffix = 'from-module'`)
    await Bun.write(join(inputDir, 'Panel.stx'), `<script component type="application/json">{"shadowDOM":"open"}</script>
<script server>const secret = 'PRIVATE-event-server'</script>
<script>
import { suffix } from './helpers'
import { defineProps, defineEmits, withDefaults } from 'stx'
interface PanelProps { id: string; submitHandler?: string }
interface Detail { id: string; submitHandler: string; suffix: string }
const { id, submitHandler } = withDefaults(defineProps<PanelProps>(), { submitHandler: 'globalThis.INERT_EXECUTED=true' })
const emit = defineEmits<{ submit: [detail: Detail]; close: [detail: { id: string }] }>()
function submit(): void { emit('submit', { id, submitHandler, suffix }) }
</script>
<template><button id="submit" @click="submit">{{ id }}</button><button id="close" @click="emit('close', { id })">Close</button><slot name="header"></slot><slot></slot></template>`)
    const ssr = await processDirectives('<Panel id="ordinary-SSR"><b slot="header">SSR header</b><p>SSR body</p></Panel>', {}, join(root, 'index.stx'), { root, componentsDir: inputDir, cache: false }, new Set())
    expect(ssr).toContain('ordinary-SSR')
    expect(ssr).toContain('SSR header')
    expect(ssr.match(/<button[^>]*id="submit"[^>]*>(.*?)<\/button>/)?.[1]).toBe('ordinary-SSR')
    expect((globalThis as { INERT_EXECUTED?: boolean }).INERT_EXECUTED).toBeUndefined()
    const ordinaryHtml = await processDirectives('<html><head><link rel="icon" href="/favicon.ico"><script src="/probe.js"></script></head><body><Panel id="ordinary-browser"/></body></html>', {}, join(root, 'ordinary.stx'), { root, componentsDir: inputDir, cache: false }, new Set())
    const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'event-browser', bundle })
    for (const file of result.files.filter(file => file.endsWith('.js'))) expect(await Bun.file(file).text()).not.toContain('PRIVATE-event-server')
    await rm(inputDir, { recursive: true })
    const emitted = new Map(result.files.filter(file => file.endsWith('.js')).map(file => [`/${relative(outputDir, file).split(sep).join('/')}`, file]))
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
        const pathname = new URL(request.url).pathname
        if (pathname === '/') return new Response(`<!doctype html><link rel="icon" href="/favicon.ico"><script src="/probe.js"></script><event-browser-panel id="first&amp;quot;'"><b slot="header">Header</b><p>Body</p></event-browser-panel><event-browser-panel id="second"></event-browser-panel><script type="module" src="/${bundle ? 'bundle' : 'index'}.js"></script>`, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; img-src 'self'; base-uri 'none'" } })
        if (pathname === '/ordinary') return new Response(ordinaryHtml, { headers: { 'Content-Type': 'text/html' } })
        if (pathname === '/favicon.ico') return new Response(null, { status: 204 })
        if (pathname === '/probe.js') return new Response(`globalThis.errors=[];globalThis.violations=[];globalThis.events=[];addEventListener('error',event=>errors.push(event.message));addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));addEventListener('securitypolicyviolation',event=>violations.push(event.effectiveDirective));for(const name of ['submit','close'])document.addEventListener(name,event=>events.push({name,detail:event.detail,bubbles:event.bubbles,composed:event.composed,cancelable:event.cancelable}));`, { headers: { 'Content-Type': 'text/javascript' } })
        const file = emitted.get(pathname)
        return file ? new Response(Bun.file(file), { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
      } }),
      createView: () => browser = new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
    })
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor(`document.querySelector('event-browser-panel')?.shadowRoot?.querySelectorAll('button').length`, value => value === 2)).toBe(2)
    expect(await fixture.view.evaluate('JSON.stringify(errors)')).toBe('[]')
    expect(await fixture.view.evaluate(`typeof globalThis.stx + ':' + typeof globalThis.defineEmits`)).toBe('undefined:undefined')
    expect(await fixture.view.evaluate(`JSON.stringify([...document.querySelector('event-browser-panel').shadowRoot.querySelectorAll('slot')].map(slot=>slot.assignedElements().map(element=>element.textContent)))`)).toBe('[["Header"],["Body"]]')
    await fixture.view.evaluate(`document.querySelector('event-browser-panel').setAttribute('id', ${JSON.stringify(`first'quoted"`)})`)
    expect(await fixture.waitFor(`document.querySelector('event-browser-panel').shadowRoot.querySelector('#submit').textContent`, value => value === `first'quoted"`)).toBe(`first'quoted"`)
    // Keyboard activation is a genuine browser input, not a synthetic .click().
    await fixture.view.evaluate(`document.querySelector('event-browser-panel').shadowRoot.querySelector('#submit').focus()`)
    await browser!.press('Enter')
    await fixture.view.evaluate(`document.querySelector('event-browser-panel').shadowRoot.querySelector('#close').focus()`)
    await browser!.press('Enter')
    expect(JSON.parse(await fixture.view.evaluate<string>('JSON.stringify(events)'))).toEqual([
      { name: 'submit', detail: { id: `first'quoted"`, submitHandler: 'globalThis.INERT_EXECUTED=true', suffix: 'from-module' }, bubbles: true, composed: true, cancelable: true },
      { name: 'close', detail: { id: `first'quoted"` }, bubbles: true, composed: true, cancelable: true },
    ])
    expect(await fixture.view.evaluate(`typeof globalThis.INERT_EXECUTED`)).toBe('undefined')
    expect(await fixture.view.evaluate(`document.querySelectorAll('event-browser-panel')[1].shadowRoot.querySelector('#submit').textContent`)).toBe('second')
    expect(await fixture.view.evaluate('JSON.stringify(errors)')).toBe('[]')
    expect(await fixture.view.evaluate('JSON.stringify(violations)')).toBe('[]')
    await fixture.view.navigate(new URL('/ordinary', fixture.url).href)
    expect(await fixture.waitFor(`typeof window.stx === 'object' && !!document.querySelector('#submit')`, value => value === true)).toBe(true)
    await fixture.view.evaluate(`document.querySelector('#submit').focus()`)
    await browser!.press('Enter')
    expect(JSON.parse(await fixture.view.evaluate<string>('JSON.stringify(events.map(event=>({name:event.name,detail:event.detail})))'))).toEqual([{ name: 'submit', detail: { id: 'ordinary-browser', submitHandler: 'globalThis.INERT_EXECUTED=true', suffix: 'from-module' } }])
    expect(await fixture.view.evaluate('JSON.stringify(errors)')).toBe('[]')
    expect(await fixture.view.evaluate(`typeof globalThis.INERT_EXECUTED`)).toBe('undefined')
  }
  finally { fixture?.close(); await rm(root, { recursive: true, force: true }) }
}, 30000)
