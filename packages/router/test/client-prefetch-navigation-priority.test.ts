import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const names = ['window', 'document', 'location', 'history', 'fetch', 'navigator', 'CustomEvent', 'Event', 'DOMParser'] as const
const originals = Object.fromEntries(names.map(name => [name, (globalThis as any)[name]]))
afterEach(() => { Object.assign(globalThis, originals) })

const tick = () => new Promise(resolve => setTimeout(resolve, 25))

function install(retained = false) {
  const window: any = new Window({ url: 'http://localhost/home' })
  window.history.pushState(null, '', 'http://localhost/home')
  window.document.write('<html><head><meta name="stx-layout" content="layouts/app.stx"></head><body><main>Home</main><nav><a href="/a" data-stx-link id="a">A</a><a href="/b" data-stx-link id="b">B</a><a href="/c" data-stx-link id="c">C</a><a href="/target" data-stx-link id="target">Target</a></nav></body></html>')
  window.stx = retained ? { _cleanupContainer() {} } : {}
  window.__stxRouterConfig = { screens: retained, navDuration: 0, cache: true, prefetch: true, progress: false, viewTransitions: false, prefetchVisible: false, revalidate: false, keepOpening: false, announceRoute: false }
  const requested: string[] = []
  const pending = new Map<string, () => void>()
  Object.assign(globalThis, {
    window, document: window.document, location: window.location, history: window.history,
    navigator: window.navigator, CustomEvent: window.CustomEvent, Event: window.Event, DOMParser: window.DOMParser,
    fetch: (url: string) => {
      const path = new URL(String(url), window.location.href).pathname
      requested.push(path)
      return new Promise<Response>((resolve) => {
        pending.set(path, () => resolve(new Response(`<section>${path}</section>`, {
          headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx' },
        })))
      })
    },
  })
  new Function(getRouterScript())()
  const hover = (id: string) => window.document.getElementById(id).dispatchEvent(new window.Event('mouseover', { bubbles: true }))
  const release = (path: string) => { expect(pending.has(path)).toBe(true); pending.get(path)!() }
  const drain = async () => {
    for (let i = 0; i < 5; i++) {
      for (const resolve of pending.values()) resolve()
      await tick()
    }
  }
  return { window, requested, hover, release, drain }
}

describe('foreground navigation takes priority over speculative HTML', () => {
  it('lets retained Back win over a promoted prefetch and resumes other queued work', async () => {
    const app = install(true)
    let navigation: Promise<unknown> | undefined
    try {
      const first = app.window.stxRouter.navigate('/one')
      app.release('/one')
      await first
      app.hover('a'); app.hover('b'); app.hover('target'); app.hover('c')
      navigation = app.window.stxRouter.navigate('/target')
      app.release('/a'); app.release('/b')
      await tick()
      expect(app.requested).not.toContain('/c')
      app.window.history.back()
      await new Promise(resolve => setTimeout(resolve, 80))
      expect(app.window.location.pathname).toBe('/home')
      expect(app.requested).toContain('/c')
      app.release('/target')
      await navigation
      expect(app.window.location.pathname).toBe('/home')
    }
    finally { await app.drain(); await navigation }
  })

  it('resumes queued work when Back cancels a pending navigation into a retained screen', async () => {
    const app = install(true)
    let navigation: Promise<unknown> | undefined
    try {
      const first = app.window.stxRouter.navigate('/one')
      app.release('/one')
      await first
      expect(app.window.document.querySelectorAll('[data-stx-screen]').length).toBe(2)
      app.hover('a'); app.hover('b'); app.hover('c')
      navigation = app.window.stxRouter.navigate('/target')
      app.release('/a'); app.release('/b')
      await tick()
      expect(app.requested).not.toContain('/c')
      app.window.history.back()
      await new Promise(resolve => setTimeout(resolve, 80))
      expect(app.window.location.pathname).toBe('/home')
      expect(app.requested).toContain('/c')
    }
    finally { await app.drain(); await navigation }
  })

  it('does not start queued prefetches while a foreground response is pending', async () => {
    const app = install()
    let navigation: Promise<unknown> | undefined
    try {
      app.hover('a'); app.hover('b'); app.hover('c')
      expect(app.requested).toEqual(['/a', '/b'])
      navigation = app.window.stxRouter.navigate('/target')
      expect(app.requested).toContain('/target')
      app.release('/a')
      app.release('/b')
      await tick()
      expect(app.requested).not.toContain('/c')
      app.release('/target')
      await navigation
      await tick()
      expect(app.requested).toContain('/c')
    }
    finally { await app.drain(); await navigation }
  })

  it('holds new speculation even when a slot is free during navigation', async () => {
    const app = install()
    let navigation: Promise<unknown> | undefined
    try {
      navigation = app.window.stxRouter.navigate('/target')
      app.hover('a')
      expect(app.requested).toEqual(['/target'])
      app.release('/target')
      await navigation
      await tick()
      expect(app.requested).toContain('/a')
    }
    finally { await app.drain(); await navigation }
  })

  it('promotes the requested prefetch while keeping unrelated queued work paused', async () => {
    const app = install()
    let navigation: Promise<unknown> | undefined
    try {
      app.hover('a'); app.hover('b'); app.hover('target'); app.hover('c')
      expect(app.requested).toEqual(['/a', '/b'])
      navigation = app.window.stxRouter.navigate('/target')
      expect(app.requested).toContain('/target')
      app.release('/a')
      app.release('/b')
      await tick()
      expect(app.requested).not.toContain('/c')
      app.release('/target')
      await navigation
      await tick()
      expect(app.requested).toContain('/c')
      expect(app.requested.filter(path => path === '/target')).toHaveLength(1)
    }
    finally { await app.drain(); await navigation }
  })
})
