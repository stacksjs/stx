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
  it('replaces a canonical destination through the browser host with its query intact', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stx-browser-replace-'))
    folders.push(root)
    writeFileSync(path.join(root, 'Screen.stx'), `<script client>
const craft = globalThis.craft
onMount(() => craft.navigation.replace('/m/claim?kind=club&slug=rappid'))
</script><View><Text>Signed in</Text></View>`)
    writeFileSync(path.join(root, 'platform.ts'), 'export async function createBrowserPlatform() { return {craft:{},capabilities:[],call:async()=>null,navigate(path,replace){globalThis.lastNavigation={path,replace}},dispose(){}} }')
    const compiled = await compileBrowserScreen({ root, source: 'Screen.stx', screen: 'Screen', browser: { screen: 'Screen', container: '#screen', appURL: '/m', routes: { '/m/login': 'Screen', '/m/claim': 'Claim' }, platformModule: path.join(root, 'platform.ts') } })
    const browser = new Window({ url: 'https://fixture.invalid/m/login' })
    const container = browser.document.createElement('div')
    container.id = 'screen'
    browser.document.body.append(container)
    const scope: Record<string, any> = { document: browser.document, navigator: browser.navigator, location: browser.location, history: browser.history, MutationObserver: browser.MutationObserver, matchMedia: browser.matchMedia.bind(browser), addEventListener: browser.addEventListener.bind(browser), removeEventListener: browser.removeEventListener.bind(browser), dispatchEvent: browser.dispatchEvent.bind(browser), console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, URL, URLSearchParams, AbortController }
    scope.window = scope
    try {
      vm.runInNewContext(compiled.code, scope)
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(scope.lastNavigation).toEqual({ path: '/m/claim?kind=club&slug=rappid', replace: true })
    }
    finally { scope.__stxNativeUnmount?.(); browser.close() }
  })
  it('updates live tab captions and avatars without changing navigation or selection, and restores icons', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stx-tab-icons-'))
    folders.push(root)
    writeFileSync(path.join(root, 'Screen.stx'), `<script client>
const craft = globalThis.craft
onMount(() => craft.navigation.setOptions({title:'Health',leftButtons:[{id:'calendar',title:'Calendar',variant:'neutral'}],rightButtons:[{id:'store',title:'Store'}]}))
function rate() { craft.navigation.setOptions({tabItem:{id:'/m/health',iconText:'142',accessibilityLabel:'Heart rate 142 bpm'}}) }
function clear() { craft.navigation.setOptions({tabItem:{id:'/m/health',title:null,iconText:null,iconTint:null,iconPulse:false,accessibilityLabel:null}}) }
function live() { craft.navigation.setOptions({tabItem:{id:'/m/health',title:'142 bpm',iconText:null,iconTint:'#ff3b30',iconPulse:true,accessibilityLabel:'Health, live heart rate, 142 bpm'}}) }
function nextBeat() { craft.navigation.setOptions({tabItem:{id:'/m/health',title:'143 bpm'}}) }
function avatar() { craft.navigation.setOptions({tabItem:{id:'/m/me',image:'https://fixture.invalid/avatar.png'}}) }
function accessory() { craft.navigation.setOptions({tabAccessory:{path:'/m/messages',title:'Messages',symbol:'message',badge:'3'}}) }
function hideAccessory() { craft.navigation.setOptions({tabAccessory:null}) }
</script><View><Button testID="rate" @click="rate()">Rate</Button><Button testID="clear" @click="clear()">Clear</Button><Button testID="live" @click="live()">Live</Button><Button testID="next" @click="nextBeat()">Next</Button><Button testID="avatar" @click="avatar()">Avatar</Button><Button testID="accessory" @click="accessory()">Messages</Button><Button testID="hideAccessory" @click="hideAccessory()">Hide</Button></View>`)
    writeFileSync(path.join(root, 'platform.ts'), 'export async function createBrowserPlatform() { return {craft:{},capabilities:[],call:async()=>null,navigate(path){globalThis.lastNavigation=path},dispose(){}} }')
    const compiled = await compileBrowserScreen({ root, source: 'Screen.stx', screen: 'Screen', browser: { screen: 'Screen', container: '#screen', appURL: '/m', routes: { '/m/health': 'Screen' }, icons: { message: { body: '', width: 24, height: 24 } }, tabs: [{ id: '/m/health', title: 'Health' }, { id: '/m/me', title: 'Me' }], platformModule: path.join(root, 'platform.ts') } })
    const browser = new Window({ url: 'https://fixture.invalid/m/health' })
    let hidden = false
    Object.defineProperty(browser.document, 'hidden', { configurable: true, get: () => hidden })
    const container = browser.document.createElement('div')
    container.id = 'screen'
    browser.document.body.append(container)
    const motionListeners = new Set<() => void>()
    const motion = { matches: false, addEventListener(type: string, fn: () => void) { if (type === 'change') motionListeners.add(fn) }, removeEventListener(type: string, fn: () => void) { if (type === 'change') motionListeners.delete(fn) } }
    const scope: Record<string, any> = { document: browser.document, navigator: browser.navigator, location: browser.location, history: browser.history, MutationObserver: browser.MutationObserver, matchMedia: (query: string) => query.includes('prefers-reduced-motion') ? motion : browser.matchMedia(query), addEventListener: browser.addEventListener.bind(browser), removeEventListener: browser.removeEventListener.bind(browser), dispatchEvent: browser.dispatchEvent.bind(browser), console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, URL, URLSearchParams, AbortController }
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
    expect(browser.document.querySelector('header button[aria-label="Calendar"]')).not.toBeNull()
    expect([...browser.document.querySelector('header')!.children].map(child => child.textContent)).toEqual(['Calendar', 'Health', 'Store'])
    const icon = health.querySelector('[data-tab-icon]') as unknown as HTMLElement
    let pulses = 0
    let cancelled = 0
    ;(icon as any).animate = () => { pulses++; return { cancel() { cancelled++ } } }
    await click('live')
    expect(health.textContent).toBe('142 bpm')
    expect(health.getAttribute('data-testid')).toBe('craft-tab-/m/health')
    expect(health.getAttribute('aria-current')).toBe('page')
    expect(icon.style.color).toBe('#ff3b30')
    expect(pulses).toBe(1)
    await click('next')
    expect(health.textContent).toBe('143 bpm')
    expect(pulses).toBe(1)
    motion.matches = true
    motionListeners.forEach(fn => fn())
    expect(cancelled).toBe(1)
    motion.matches = false
    motionListeners.forEach(fn => fn())
    expect(pulses).toBe(2)
    hidden = true
    browser.document.dispatchEvent(new browser.Event('visibilitychange'))
    expect(cancelled).toBe(2)
    hidden = false
    browser.document.dispatchEvent(new browser.Event('visibilitychange'))
    expect(pulses).toBe(3)
    await click('accessory')
    const accessory = browser.document.querySelector('[data-tab-accessory]')!
    expect(accessory.getAttribute('aria-label')).toBe('Messages, 3')
    expect(accessory.parentElement?.tagName).toBe('NAV')
    expect(health.parentElement).not.toBe(accessory.parentElement)
    expect(browser.document.querySelectorAll('nav a').length).toBe(2)
    ;(accessory as any).onclick()
    expect(scope.lastNavigation).toBe('/m/messages')
    expect(health.getAttribute('aria-current')).toBe('page')
    await click('hideAccessory')
    expect(browser.document.querySelector('[data-tab-accessory]')).toBeNull()
    await click('avatar')
    expect(browser.document.querySelector('nav a[href="/m/me"] img')!.getAttribute('src')).toBe('https://fixture.invalid/avatar.png')
    await click('clear')
    expect(health.textContent).toBe('Health')
    expect(health.hasAttribute('aria-label')).toBe(false)
    expect(icon.style.color).toBe('')
    expect(cancelled).toBe(3)
    await click('live')
    expect(pulses).toBe(4)
    scope.__stxNativeUnmount?.()
    expect(cancelled).toBe(4)
    expect(motionListeners.size).toBe(0)
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
