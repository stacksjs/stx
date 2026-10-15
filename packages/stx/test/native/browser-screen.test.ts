import vm from 'node:vm'
import { Window } from 'very-happy-dom'
import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { compileBrowserScreen, renderBrowserScreen } from '../../src/native/compiler/browser'
import { matchBrowserRoute } from '../../src/native/runtime/browser-screen'
import { processScriptSetup } from '../../src/signal-processing'

const folders: string[] = []
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }) })

describe('portable browser screens', () => {
  it('updates tab icons and avatars without changing navigation, labels or selection, and restores icons', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stx-tab-icons-'))
    folders.push(root)
    writeFileSync(path.join(root, 'Screen.stx'), `<script client>
const craft = globalThis.craft
onMount(() => craft.navigation.setOptions({title:'Health',rightButtons:[{id:'store',title:'Store'}]}))
function rate() { craft.navigation.setOptions({tabItem:{id:'/m/health',iconText:'142',accessibilityLabel:'Heart rate 142 bpm'}}) }
function clear() { craft.navigation.setOptions({tabItem:{id:'/m/health',iconText:null,accessibilityLabel:null}}) }
function avatar() { craft.navigation.setOptions({tabItem:{id:'/m/me',image:'https://fixture.invalid/avatar.png'}}) }
</script><View><Button testID="rate" @click="rate()">Rate</Button><Button testID="clear" @click="clear()">Clear</Button><Button testID="avatar" @click="avatar()">Avatar</Button></View>`)
    writeFileSync(path.join(root, 'platform.ts'), 'export async function createBrowserPlatform() { return {craft:{},capabilities:[],call:async()=>null,navigate(){},dispose(){}} }')
    const compiled = await compileBrowserScreen({ root, source: 'Screen.stx', screen: 'Screen', browser: { screen: 'Screen', container: '#screen', appURL: '/m', routes: { '/m/health': 'Screen' }, tabs: [{ id: '/m/health', title: 'Health' }, { id: '/m/me', title: 'Me' }], platformModule: path.join(root, 'platform.ts') } })
    const browser = new Window({ url: 'https://fixture.invalid/m/health' })
    const container = browser.document.createElement('div')
    container.id = 'screen'
    browser.document.body.append(container)
    const scope: Record<string, any> = { document: browser.document, navigator: browser.navigator, location: browser.location, history: browser.history, MutationObserver: browser.MutationObserver, matchMedia: browser.matchMedia.bind(browser), addEventListener: browser.addEventListener.bind(browser), removeEventListener: browser.removeEventListener.bind(browser), dispatchEvent: browser.dispatchEvent.bind(browser), console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, URL, URLSearchParams, AbortController }
    scope.window = scope
    vm.runInNewContext(compiled.code, scope)
    await new Promise(resolve => setTimeout(resolve, 20))
    const click = async (id: string) => {
      container.querySelector(`[data-testid="${id}"]`)!.dispatchEvent(new browser.Event('click'))
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    const health = browser.document.querySelector('nav a[href="/m/health"]')!
    await click('rate')
    expect(health.textContent).toBe('142Health')
    expect(health.getAttribute('aria-label')).toBe('Heart rate 142 bpm')
    expect(health.getAttribute('aria-current')).toBe('page')
    expect(browser.document.querySelector('header h1')!.textContent).toBe('Health')
    expect(browser.document.querySelector('header button[aria-label="Store"]')).not.toBeNull()
    await click('avatar')
    expect(browser.document.querySelector('nav a[href="/m/me"] img')!.getAttribute('src')).toBe('https://fixture.invalid/avatar.png')
    await click('clear')
    expect(health.textContent).toBe('Health')
    expect(health.hasAttribute('aria-label')).toBe(false)
    scope.__stxNativeUnmount?.()
    browser.close()
  })

  it('matches fixed paths before parameters, decodes params and rejects malformed paths', () => {
    const routes = { '/m/store/:slug': 'Product', '/m/store/return': 'Return', '/m/u/:username': 'Profile' }
    expect(matchBrowserRoute('/m/store/return', routes)?.screen).toBe('Return')
    expect(matchBrowserRoute('/m/u/ava%20stone/', routes)?.params).toEqual({ username: 'ava stone' })
    expect(matchBrowserRoute('/m/u/%ff', routes)).toBeNull()
    expect(matchBrowserRoute('/m/store/return/extra', routes)).toBeNull()
  })

  it('hydrates nested keyed rows through the portable host even when a real DOM exists', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stx-browser-rows-'))
    folders.push(root)
    writeFileSync(path.join(root, 'Screen.stx'), `<script client>
const rows = state([{id:1, label:'First', shown:true}, {id:2,label:'Hidden',shown:false}])
function reveal() { rows.set([{id:2,label:'Second',shown:true}, {id:1,label:'First updated',shown:true}]) }
</script><View><View :for="row in rows" :key="row.id"><Text :if="row.shown" :text="row.label" /></View><Button @click="reveal()" testID="reveal">Reveal</Button></View>`)
    writeFileSync(path.join(root, 'platform.ts'), 'export async function createBrowserPlatform() { return {craft:{},capabilities:[],call:async()=>null,navigate(){},dispose(){}} }')
    const compiled = await compileBrowserScreen({ root, source: 'Screen.stx', screen: 'Screen', browser: { screen: 'Screen', container: '#screen', appURL: '/', routes: { '/': 'Screen' }, platformModule: path.join(root, 'platform.ts') } })
    const browser = new Window({ url: 'https://fixture.invalid/' })
    const container = browser.document.createElement('div'); container.id = 'screen'; browser.document.body.append(container)
    const errors: unknown[] = []
    const scope: Record<string, any> = { document: browser.document, navigator: browser.navigator, location: browser.location, history: browser.history, MutationObserver: browser.MutationObserver, matchMedia: browser.matchMedia.bind(browser), addEventListener: browser.addEventListener.bind(browser), removeEventListener: browser.removeEventListener.bind(browser), dispatchEvent: browser.dispatchEvent.bind(browser), console: { ...console, error: (...args: unknown[]) => errors.push(args) }, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, URL, URLSearchParams, AbortController }
    scope.window = scope
    vm.runInNewContext(compiled.code, scope)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(container.textContent).toContain('First')
    expect(container.textContent).not.toContain('Hidden')
    container.querySelector('[data-testid="reveal"]')!.dispatchEvent(new browser.Event('click'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(container.textContent).toContain('Second')
    expect(container.textContent).toContain('First updated')
    expect(errors).toEqual([])
    scope.__stxNativeUnmount?.()
    browser.close()
  })

  it('tracks imported sources and embeds an opaque bundle rather than reprocessing it as a template', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stx-portable-browser-'))
    folders.push(root)
    writeFileSync(path.join(root, 'label.ts'), 'export const label = "Before"')
    writeFileSync(path.join(root, 'Screen.stx'), `<script client>\nimport { label } from './label'\nconst count = state(0)\n</script><View><Text :text="label + count"/><Button @click="count.set(count() + 1)">Add</Button></View>`)
    writeFileSync(path.join(root, 'platform.ts'), 'export async function createBrowserPlatform() { return {} }')
    const options = { root, source: 'Screen.stx', screen: 'Screen', minify: true, browser: { screen: 'Screen', container: '#screen', appURL: '/', routes: { '/': 'Screen' }, platformModule: path.join(root, 'platform.ts') } }
    const before = await compileBrowserScreen(options)
    expect(before.dependencies).toContain(path.join(root, 'label.ts'))
    expect(await compileBrowserScreen(options)).toBe(before)
    writeFileSync(path.join(root, 'label.ts'), 'export const label = "After dependency edit"')
    const after = await compileBrowserScreen(options)
    expect(after).not.toBe(before)
    expect(after.code).toContain('After dependency edit')
    const html = await renderBrowserScreen(options)
    expect(html).toContain('data-stx-scoped data-stx-run="always" data-raw')
    const processed = await processScriptSetup(html, path.join(root, 'Route.stx'))
    expect(processed.output).toBe(html)
    expect(processed.setupCode).toBeNull()
  })
})
