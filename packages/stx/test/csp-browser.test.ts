import { expect, it } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openBrowserPage } from '../../components/test/support/browser-page'
import { hashedCspHeader, finalizeCspDocument } from '../src/csp-hashes'
import { generateCspHeader } from '../src/csp'
import { findContainerRegion } from '../src/fragment-container'
import { scanHtmlScriptElements } from '../src/html-masking'
import { parseAttributes } from '../src/component-processing'
import { processDirectives } from '../src/process'
import { injectRouterScript } from '../src/runtime-injection'

it.each([false, true])('hydrates, updates rows and handles models with eval forbidden (minify=%s)', async minify => {
  const csp = { enabled: true, precompile: true, useHashes: true, addMetaTag: true, directives: { 'default-src': ["'self'"], 'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'"] } }
  const page = await openBrowserPage({ name: 'csp-bindings-' + minify, renderOptions: { csp, minifyClient: minify, debug: !minify }, headers: html => ({ 'Content-Security-Policy': hashedCspHeader(html, csp) }), ready: 'window.probe && document.querySelector("#count")?.textContent === "1"', body: String.raw`<script client>
const count = state(1); const shown = state(true); const rows = state([{id:1,label:'first'}]); const form = {title: state('initial')}
const optionsReady = state(false); function optionsWhenReady() { return optionsReady() ? ['Ready choice'] : undefined }
window.probe = { count, shown, rows, form, optionsReady }
window.warnings = []; console.warn = (...args) => window.warnings.push(args.map(String).join(' '))
window.cspBlocked = false
try { new Function('return 1')() } catch { window.cspBlocked = true }
</script>
<button id="increment" @click="count = count + 1">More</button>
<span id="count" :class="{active: count > 1}" :style="{opacity: count > 1 ? '1' : '0.5'}" :title="'n=' + count" @bind:data-total="count + 10" x-text="count"></span>
<input id="model" x-model="form.title" />
<b id="named-entity" x-text="'&copy;'"></b><b id="nested-entity" x-text="'A &amp;amp; B'"></b>
<b id="escaped-binding" :text="'Postline\'s path is C:\\posts'"></b>
<div :if="shown"><span id="conditional">{{ count() + 2 }}</span></div>
<div :for="row in rows" :key="row.id"><span class="row" x-text="row.label"></span><button class="pick" @click="form.title.set(row.label)">Pick</button></div>
<span :for="option in optionsWhenReady()" :if="optionsReady" class="choice" :text="option"></span>
<span :for="option in optionsWhenReady?.()" :if="optionsReady" class="optional-choice" :text="option"></span>` })
  try {
    expect(await page.json('return window.cspBlocked')).toBe(true)
    expect(await page.json('return document.querySelector("#named-entity").textContent')).toBe('©')
    expect(await page.json('return document.querySelector("#nested-entity").textContent')).toBe('A & B')
    expect(await page.json('return document.querySelector("#escaped-binding").textContent')).toBe("Postline's path is C:\\posts")
    await page.run("document.querySelector('#increment').click()")
    expect(await page.json('return {count: probe.count(), warnings: window.warnings, errors: window.__errors}')).toMatchObject({ count: 2, warnings: [], errors: [] })
    await page.run('probe.optionsReady.set(true)')
    expect(await page.until('document.querySelector(".choice")?.textContent === "Ready choice" && document.querySelector(".optional-choice")?.textContent === "Ready choice"')).toBe(true)
    expect(await page.json('return window.warnings')).toEqual([])
    expect(await page.until('document.querySelector("#count").textContent === "2"')).toBe(true)
    expect(await page.json('return document.querySelector("#count").title')).toBe('n=2')
    expect(await page.json('return document.querySelector("#count").getAttribute("data-total")')).toBe('12')
    expect(await page.json('return document.querySelector("#count").classList.contains("active")')).toBe(true)
    expect(await page.until('document.querySelector("#conditional").textContent === "4"')).toBe(true)
    await page.run("document.querySelector('#model').value='edited';document.querySelector('#model').dispatchEvent(new Event('input',{bubbles:true}))")
    expect(await page.json('return probe.form.title()')).toBe('edited')
    await page.run("probe.rows.set([{id:2,label:'second'},{id:3,label:'third'}]);probe.shown.set(false)")
    expect(await page.until('document.querySelectorAll(".row").length === 2 && !document.querySelector("#conditional")')).toBe(true)
    await page.run("document.querySelector('.pick').click();probe.shown.set(true)")
    expect(await page.json('return probe.form.title()')).toBe('second')
    expect(await page.until('!!document.querySelector("#conditional")')).toBe(true)
    await page.run("const extra=document.createElement('div');extra.id='uncompiled';extra.setAttribute('x-text','Math.random() + 700000011');document.body.appendChild(extra);window.stx.hydrate(extra)")
    expect(await page.json('return document.querySelector("#uncompiled").textContent')).toBe('')
    expect(await page.json('return warnings.some(message => message.includes("Uncompiled binding"))')).toBe(true)
    expect((await page.errors()).filter(error => !error.includes('unsafe-eval'))).toEqual([])
  }
  finally { page.close() }
}, 60_000)

it.each([false, true])('hydrates x-data initializers, methods and model writes (precompile=%s)', async precompile => {
  const csp = { enabled: true, precompile, directives: { 'script-src': precompile ? ["'self'"] : ["'self'", "'unsafe-eval'"] } }
  const page = await openBrowserPage({ name: 'csp-xdata', renderOptions: { csp }, headers: html => ({ 'Content-Security-Policy': hashedCspHeader(html, csp) }), ready: 'document.querySelector("#legacy-count")?.textContent === "3"', body: `<div x-data="{ count: 1, title: 'old', init(){ this.count++ }, more(){ this.count++ } }" x-init="count++"><b id="legacy-count" x-text="count"></b><button id="legacy-more" @click="more()">More</button><input id="legacy-model" x-model="title" /><span id="legacy-title" x-text="title"></span></div>` })
  try {
    await page.run("window.legacyWarnings=[];console.warn=(...args)=>legacyWarnings.push(args.map(String).join(' '));document.querySelector('#legacy-more').click();const field=document.querySelector('#legacy-model');field.value='new';field.dispatchEvent(new Event('input',{bubbles:true}))")
    expect(await page.json('return {text:document.querySelector("#legacy-count").textContent,title:document.querySelector("#legacy-title").textContent,warnings:window.legacyWarnings}')).toEqual({text:'4',title:'new',warnings:[]})
    expect(await page.until('document.querySelector("#legacy-count").textContent === "4" && document.querySelector("#legacy-title").textContent === "new"')).toBe(true)
    expect(await page.errors()).toEqual([])
  }
  finally { page.close() }
}, 60_000)

it.each([false,true])('hydrates cloned component scopes and deferred islands (precompile=%s)', async precompile => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-csp-component-'))
  writeFileSync(join(dir, 'CspCard.stx'), `<script server>export const label = $props.label || 'item'</script><script client>const label = useReactiveProp('label', {{ label }}); const clicks=state(0); function press(){clicks.update(n=>n+1)}</script><button class="card" @click="press()"><span x-text="label"></span>:<b x-text="clicks"></b></button>`)
  writeFileSync(join(dir, 'CspLazy.stx'), `<script client>window.lazyCspSetups=(window.lazyCspSetups||0)+1;const clicks=state(0);function press(){clicks.update(n=>n+1)}</script><button class="card" @click="press()">lazy:<b x-text="clicks"></b></button>`)
  const csp = { enabled: true, precompile, directives: { 'script-src': precompile ? ["'self'"] : ["'self'", "'unsafe-eval'"] } }
  try {
    const page = await openBrowserPage({ name: 'csp-component', renderOptions: { csp, componentsDir: dir }, headers: html => ({ 'Content-Security-Policy': hashedCspHeader(html, csp) }), ready: 'window.cspRows', body: `<script client>const rows=state(['first','second']);window.cspRows=rows</script><div :for="row in rows"><CspCard :label="row" /></div><div id="island"><CspLazy client="interaction" /></div>` })
    try {
      expect(await page.json('return window.lazyCspSetups || 0')).toBe(0)
      await page.run("document.querySelector('.card').click(); cspRows.set(['third','fourth','fifth'])")
      expect(await page.until('Array.from(document.querySelectorAll(".card")).some(node => node.textContent.includes("fifth"))')).toBe(true)
      await page.run("document.querySelectorAll('.card')[1].click()")
      expect(await page.json('return document.querySelectorAll(".card")[1].textContent')).toContain(':1')
      await page.run("document.querySelector('#island .card').dispatchEvent(new MouseEvent('mouseenter',{bubbles:true}));document.querySelector('#island .card').click()")
      expect(await page.until('document.querySelector("#island .card").textContent.includes(":1")')).toBe(true)
      expect(await page.json('return window.lazyCspSetups')).toBe(1)
      expect(await page.errors()).toEqual([])
    }
    finally { page.close() }
  }
  finally { rmSync(dir, { recursive: true, force: true }) }
}, 60_000)

it.each(['document', 'fragment', 'nonce-document', 'nonce-fragment'])('preserves CSP authorization on SPA navigation and return (%s)', async mode => {
  const nonce = mode.startsWith('nonce')
  const fragment = mode.endsWith('fragment')
  const csp = { enabled: true, precompile: true, useNonce: nonce, nonceGenerator: () => 'c3R4LWZpcnN0LWRvY3VtZW50', directives: { 'script-src': ["'self'"] } }
  const body = (name: string) => `<main data-stx-content><script client>const n=state(1);window.routeProbe={name:'${name}',n}</script><button id="route-add" @click="n += 2">More</button><span id="route-value" x-text="${name === 'two' ? 'n * 10' : 'n'}"></span><StxLink to="/two">Two</StxLink><StxLink to="/">One</StxLink></main>`
  const nextCsp = { ...csp, nonceGenerator: () => 'c3R4LXNlY29uZC1kb2N1bWVudA==' }
  const second = finalizeCspDocument(await injectRouterScript(await processDirectives(`<!doctype html><html><head></head><body>${body('two')}</body></html>`, {}, join(tmpdir(), 'csp-two.stx'), { csp: nextCsp, cache: false, debug: false } as any, new Set())), nextCsp)
  const region = findContainerRegion(second)!
  const outside = scanHtmlScriptElements(second).filter(script => (script.start < region.start || script.start > region.end) && /data-stx-(?:csp\b|scoped\b)/.test(script.attrs) && !/data-stx-(?:router|runtime)/.test(script.attrs)).map(script => second.slice(script.start, script.end)).join('\n')
  const response = fragment ? outside + second.slice(region.start, region.end) : second
  let policy = ''
  const page = await openBrowserPage({ name: 'csp-navigation-' + mode, renderOptions: { csp }, transformHtml: async html => finalizeCspDocument(await injectRouterScript(html), csp), headers: html => ({ 'Content-Security-Policy': policy = nonce ? generateCspHeader(csp.directives, csp.nonceGenerator()) : hashedCspHeader(html + second, csp) }), route: request => new URL(request.url).pathname === '/two' ? new Response(response, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': policy, ...(fragment ? { 'X-STX-Fragment': 'true' } : {}) } }) : undefined, ready: 'window.routeProbe && document.querySelector("#route-value")?.textContent === "1"', body: body('one') })
  try {
    await page.run("document.querySelector('a[href=\"/two\"]').click()")
    expect(await page.until('window.routeProbe.name === "two"')).toBe(true)
    await page.run("document.querySelector('#route-add').click()")
    expect(await page.until('document.querySelector("#route-value").textContent === "30"')).toBe(true)
    await page.run("document.querySelector('a[href=\"/\"]').click()")
    expect(await page.until('window.routeProbe.name === "one"')).toBe(true)
    expect(await page.errors()).toEqual([])
  }
  finally { page.close() }
}, 60_000)

it('shares one fresh document nonce with component scripts on repeated cached renders', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-csp-nonce-'))
  const nonces: string[] = []
  writeFileSync(join(dir, 'NonceCard.stx'), `<script server cache>export const label = $props.label || 'card'</script><script client>const n=state(0);function press(){n.update(v=>v+1)}</script><button class="nonce-card" @click="press()"><span>{{ label }}</span><b x-text="n"></b></button>`)
  const csp = { enabled: true, precompile: true, useNonce: true, directives: { 'script-src': ["'self'"] } }
  try {
    for (let render = 0; render < 2; render++) {
      let scriptNonces: Array<string | true | undefined> = []
      const page = await openBrowserPage({ name: 'csp-nonce-component', renderOptions: { csp, componentsDir: dir }, headers: html => {
        const scripts = scanHtmlScriptElements(html).map(script => Object.fromEntries(parseAttributes(script.attrs).map(attr => [attr.name, attr.value])))
        const nonce = scripts.find(attrs => 'data-stx-csp' in attrs)!.nonce as string
        nonces[render] = nonce
        scriptNonces = scripts.filter(attrs => !attrs.src).map(attrs => attrs.nonce)
        return { 'Content-Security-Policy': generateCspHeader(csp.directives, nonce) }
      }, ready: 'window.stx && document.querySelector(".nonce-card")', body: '<NonceCard label="same" />' })
      try {
        expect(scriptNonces.length).toBeGreaterThan(1)
        expect(scriptNonces.every(nonce => nonce === nonces[render])).toBe(true)
        await page.run('document.querySelector(".nonce-card").click()')
        expect(await page.until('document.querySelector(".nonce-card b").textContent === "1"')).toBe(true)
        expect(await page.errors()).toEqual([])
      }
      finally { page.close() }
    }
    expect(nonces[0]).not.toBe(nonces[1])
  }
  finally { rmSync(dir, { recursive: true, force: true }) }
}, 60_000)
