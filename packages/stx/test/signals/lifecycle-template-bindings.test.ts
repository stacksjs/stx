import { afterAll, afterEach, beforeAll, expect, test } from 'bun:test'
import { scopeObject, scopePropertyDescriptor } from '../../src/client-scope-bindings'
import { boot, closeBrowser, layout, page, renderApp, settle, type SpaApp } from '../router/spa-harness'

const body = `<script client>
const hits = state(0)
const shown = state(false)
const rows = state([{ id: 7 }])
let controller = null
onMount(() => {
  controller = { save(value = 1) { hits.update(n => n + value) } }
  shown.set(true)
})
</script>
<div>
  <button class="direct" @click="controller?.save()">Save</button>
  <section :if="shown()"><button class="conditional" @click="controller?.save(2)">Save</button></section>
  <button :for="row in rows()" class="row" @click="controller?.save(row.id)">Save row</button>
  <output :text="hits()"></output>
</div>`
const bundledBody = body.replace('<script client>', `<script client>\nimport { make } from '../controller'`).replace('controller = { save(value = 1) { hits.update(n => n + value) } }', 'controller = make((value = 1) => hits.update(n => n + value))')
let app: SpaApp
beforeAll(async () => {
  app = await renderApp({
    'layouts/default.stx': layout(''),
    'controller.ts': 'export function make(save: (value?: number) => void) { return { save } }',
    'pages/aliases.stx': page('default', `<script client>
const hits = state(0)
const rows = state([{ id: 1 }, { id: 2 }])
let row = null
let idx = 99
</script>
<div><button :for="(row, idx) in rows()" class="alias" @click="hits.set(row.id + idx)">Pick</button><output :text="hits() + ':' + (row === null ? 'outer' : 'mutated') + ':' + idx"></output></div>`),
    'pages/empty.stx': page('default', '<script client>const shellReady = state(true)</script><p>Another page</p>'),
    'pages/index.stx': page('default', body),
    'pages/bundled.stx': page('default', bundledBody),
    'components/Controller.stx': body,
    'components/BundledController.stx': bundledBody,
    'pages/bundled-component.stx': page('default', '<BundledController />'),
    'partials/bundled-controller.stx': bundledBody,
    'pages/bundled-include.stx': page('default', "@include('bundled-controller')"),
    'pages/component.stx': page('default', '<Controller />'),
    'partials/controller.stx': body,
    'pages/include.stx': page('default', "@include('controller')"),
  }, { '/aliases': 'pages/aliases.stx', '/empty': 'pages/empty.stx', '/': 'pages/index.stx', '/bundled': 'pages/bundled.stx', '/component': 'pages/component.stx', '/bundled-component': 'pages/bundled-component.stx', '/bundled-include': 'pages/bundled-include.stx', '/include': 'pages/include.stx' })
})
afterAll(async () => { await app?.dispose() })
afterEach(closeBrowser)
for (const mode of ['cold', 'navigation']) for (const route of ['/', '/bundled', '/component', '/include', '/bundled-component', '/bundled-include']) test(`lifecycle assignments remain live in direct, conditional and row handlers at ${route} after ${mode}`, async () => {
  const browser = await boot(app, mode === 'cold' ? route : '/empty', { history: true, globals: { STX_ROUTER_OPTIONS: { navDuration: 0, revalidate: false, prefetchVisible: false } } })
  await settle()
  if (mode === 'navigation') await browser.navigate(route)
  await settle()
  for (const selector of ['.direct', '.conditional', '.row']) {
    const button = browser.document.querySelector(selector)
    expect(button).not.toBeNull()
    button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    await settle()
  }
  expect(browser.document.querySelector('output')?.textContent).toBe('10')
  expect(browser.errors).toEqual([])
})


test('generated accessors update a lexical binding named value', () => {
  for (const expression of [scopeObject('let value = 1'), `Object.defineProperty({}, 'value', ${scopePropertyDescriptor('value')})`]) {
    const scope = new Function(`let value = 1; return ${expression}`)()
    scope.value = 2
    expect(scope.value).toBe(2)
  }
})


test('loop item and index aliases shadow outer mutable bindings', async () => {
  const browser = await boot(app, '/aliases')
  await settle()
  browser.document.querySelector('.alias').dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
  await settle()
  expect(browser.document.querySelector('output')?.textContent).toBe('1:outer:99')
  expect(browser.errors).toEqual([])
})

test('diagnostic strings and comments do not create bundle metadata', () => {
  const source = "const diagnostic = '__stxLiveBindings'; let controller = null; // __stxLiveBindings"
  const scope = new Function(`${source}\nreturn ${scopeObject(source)}`)()
  expect(scope.controller).toBeNull()
  expect(scope.diagnostic).toBe('__stxLiveBindings')
})
