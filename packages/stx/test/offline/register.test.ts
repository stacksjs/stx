/**
 * The register tag every page carries: when it registers the worker, how a
 * waiting build is let take over, and how the worker's news reaches the page.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { OFFLINE_REGISTER_SCRIPT, registerOfflineWorker } from '../../src/offline/app-service-worker'
import { applyOfflineUpdate, onOfflineUpdateReady } from '../../src/composables/use-offline'

const g = globalThis as any
const saved = { navigator: globalThis.navigator, raf: g.requestAnimationFrame }
afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', { value: saved.navigator, configurable: true, writable: true })
  g.requestAnimationFrame = saved.raf
  delete g.window.stxOffline
})

class Target {
  listeners: Record<string, Array<(event: any) => void>> = {}
  addEventListener(type: string, fn: (event: any) => void) { (this.listeners[type] ||= []).push(fn) }
  emit(type: string, event: any = {}) { for (const fn of this.listeners[type] || []) fn(event) }
}

function fakeWorker(state = 'installed') {
  const worker = new Target() as Target & { state: string, messages: any[], postMessage: (m: unknown) => void }
  worker.state = state
  worker.messages = []
  worker.postMessage = (m: unknown) => { worker.messages.push(m) }
  return worker
}

function setUp(options: { controller: boolean, waiting?: boolean }) {
  const registration = new Target() as any
  registration.waiting = options.waiting ? fakeWorker() : null
  registration.installing = null
  const container = new Target() as any
  container.controller = options.controller ? {} : null
  container.registered = [] as string[]
  container.register = async (path: string) => {
    container.registered.push(path)
    return registration
  }
  Object.defineProperty(globalThis, 'navigator', { configurable: true, writable: true, value: { serviceWorker: container } })
  g.requestAnimationFrame = (fn: () => void) => setTimeout(fn, 0)
  return { container, registration }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 10))

describe('the register tag', () => {
  it('ships the registration as a script that calls it with the worker\'s path', () => {
    expect(OFFLINE_REGISTER_SCRIPT.startsWith('<script data-stx-offline>(')).toBe(true)
    expect(OFFLINE_REGISTER_SCRIPT.endsWith(')("/_stx/sw.js")</script>')).toBe(true)
    // eslint-disable-next-line no-new-func
    expect(() => new Function(OFFLINE_REGISTER_SCRIPT.replace(/^<script[^>]*>|<\/script>$/g, ''))).not.toThrow()
  })

  it('registers after the first frame on a return visit, never in front of it', async () => {
    const { container } = setUp({ controller: true })
    registerOfflineWorker('/_stx/sw.js')
    expect(container.registered).toEqual([])
    await settle()
    expect(container.registered).toEqual(['/_stx/sw.js'])
  })

  it('turns the worker\'s news into a window event', async () => {
    const { container } = setUp({ controller: true })
    registerOfflineWorker('/_stx/sw.js')
    const heard: any[] = []
    const listener = (event: any) => heard.push(event.detail)
    g.window.addEventListener('stx:updated', listener)
    container.emit('message', { data: { type: 'stx:updated', url: 'http://app.test/api/x', kind: 'api' } })
    g.window.removeEventListener('stx:updated', listener)
    expect(heard).toEqual([{ url: 'http://app.test/api/x', kind: 'api', fragment: false }])
  })

  it('says a new build is ready, and lets it take over when the page loads or hides', async () => {
    const { registration } = setUp({ controller: true, waiting: true })
    registerOfflineWorker('/_stx/sw.js')
    let told = 0
    onOfflineUpdateReady(() => told++)
    await settle()
    expect(g.window.stxOffline.updateReady).toBe(true)
    expect(told).toBe(1)
    expect(registration.waiting.messages).toEqual([{ type: 'stx:activate-update', reason: 'load' }])

    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    delete (document as any).visibilityState
    expect(registration.waiting.messages[1]).toEqual({ type: 'stx:activate-update', reason: 'hidden' })

    // Asked for after it was ready, the callback runs at once.
    let late = 0
    onOfflineUpdateReady(() => late++)
    expect(late).toBe(1)
  })

  it('hears of a build found while the page is open', async () => {
    const { registration } = setUp({ controller: true })
    registerOfflineWorker('/_stx/sw.js')
    await settle()
    expect(g.window.stxOffline.updateReady).toBe(false)
    const installing = fakeWorker('installing')
    registration.installing = installing
    registration.emit('updatefound')
    installing.state = 'installed'
    registration.waiting = installing
    installing.emit('statechange')
    expect(g.window.stxOffline.updateReady).toBe(true)
  })

  it('has nothing to update on the first install', async () => {
    setUp({ controller: false, waiting: true })
    registerOfflineWorker('/_stx/sw.js')
    expect(g.window.stxOffline.updateReady).toBe(false)
  })

  it('applies an update on request', async () => {
    const { registration } = setUp({ controller: true, waiting: true })
    registerOfflineWorker('/_stx/sw.js')
    expect(applyOfflineUpdate()).toBe(false)
    await settle()
    expect(applyOfflineUpdate()).toBe(true)
    expect(registration.waiting.messages.at(-1)).toEqual({ type: 'stx:activate-update', force: true })
  })
})
