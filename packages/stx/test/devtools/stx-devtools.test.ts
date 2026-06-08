/**
 * window.__stxDevtools — Phase 1 introspection API (stacksjs/stx#1747).
 *
 * Drives the real runtime via the #1741 DOM shim: builds a scope registry +
 * matching DOM and asserts the inspector reports the component tree (nested by
 * DOM ancestry) and classifies each scope var (signal / derived / store / method
 * / value), reading values via peek (so inspecting never subscribes an effect).
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('window.__stxDevtools (#1747 Phase 1)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('is exposed on window', () => {
    expect(typeof window.__stxDevtools).toBe('object')
    expect(window.__stxDevtools.version).toBe(4)
  })

  it('builds a component tree nested by DOM ancestry', () => {
    document.body.innerHTML
      = '<div data-stx-scope="Outer">'
      + '<section data-stx-scope="Inner"><span data-stx-scope="Leaf"></span></section>'
      + '</div>'
      + '<aside data-stx-scope="Sibling"></aside>'
    shimAttributes(document.body)
    window.stx._scopes = { Outer: {}, Inner: {}, Leaf: {}, Sibling: {} }

    const tree = window.__stxDevtools.tree()
    expect(tree.map((n: any) => n.scopeId).sort()).toEqual(['Outer', 'Sibling'])
    const outer = tree.find((n: any) => n.scopeId === 'Outer')
    expect(outer.children.map((n: any) => n.scopeId)).toEqual(['Inner'])
    expect(outer.children[0].children.map((n: any) => n.scopeId)).toEqual(['Leaf'])
    expect(outer.tag).toBe('div')
  })

  it('classifies scope vars and reads current values', () => {
    const count = window.stx.state(7)
    const doubled = window.stx.derived(() => count() * 2)
    window.stx._scopes = {
      C: {
        count,
        doubled,
        label: 'hi', // plain value
        greet: () => 'hello', // method
        __mountCallbacks: [], // internal — skipped
      },
    }
    const s = window.__stxDevtools.scope('C')
    expect(s.signals.count).toBe(7)
    expect(s.derived.doubled).toBe(14)
    expect(s.values.label).toBe('hi')
    expect(s.methods).toContain('greet')
    // internals are not surfaced
    expect(Object.keys(s.values)).not.toContain('__mountCallbacks')
  })

  it('reading a signal via the inspector does not subscribe an effect', () => {
    const n = window.stx.state(1)
    window.stx._scopes = { E: { n } }
    let runs = 0
    // An effect that would re-run if inspecting subscribed it to `n`.
    window.stx.effect(() => {
      runs++
      window.__stxDevtools.scope('E') // read n() via peek inside
    })
    const before = runs
    n.set(2)
    // If the inspector leaked a subscription, runs would increase on n.set.
    expect(runs).toBe(before)
  })

  it('inspect(el) resolves the nearest enclosing scope', () => {
    document.body.innerHTML = '<div data-stx-scope="P"><button class="b">x</button></div>'
    shimAttributes(document.body)
    window.stx._scopes = { P: { flag: true } }
    const s = window.__stxDevtools.inspect(document.querySelector('.b'))
    expect(s.values.flag).toBe(true)
  })

  it('returns null for an unknown scope', () => {
    expect(window.__stxDevtools.scope('nope')).toBeNull()
  })

  it('store(id) classifies a store\'s state / getters / actions', () => {
    const items = window.stx.state([{ id: 1 }])
    const total = window.stx.derived(() => items().length)
    window.stx._stores.set('cart', { items, total, add: () => {}, label: 'Cart' })

    const s = window.__stxDevtools.store('cart')
    expect(Array.isArray(s.signals.items)).toBe(true)
    expect(s.derived.total).toBe(1)
    expect(s.methods).toContain('add')
    expect(s.values.label).toBe('Cart')
    expect(window.__stxDevtools.store('missing')).toBeNull()
  })

  // ── Phase 2: reactivity instrumentation ──

  it('toggles tracking on and off', () => {
    window.__stxDevtools.disable()
    expect(window.__stxDevtools.tracking()).toBe(false)
    window.__stxDevtools.enable()
    expect(window.__stxDevtools.tracking()).toBe(true)
  })

  it('counts signal sets + effect runs while enabled, and resetStats zeroes them', () => {
    window.__stxDevtools.enable()
    window.__stxDevtools.resetStats()

    const s = window.stx.state(0)
    window.stx.effect(() => { s() }) // immediate run (1), subscribes to s
    s.set(1) // change → re-run
    s.set(2) // change → re-run

    const stats = window.__stxDevtools.stats()
    expect(stats.signalSets).toBe(2)
    expect(stats.effectRuns).toBeGreaterThanOrEqual(3) // initial + 2 re-runs
    expect(s._setCount).toBe(2)

    window.__stxDevtools.resetStats()
    expect(window.__stxDevtools.stats().signalSets).toBe(0)
  })

  it('does NOT count while disabled (the gate — zero overhead in prod)', () => {
    window.__stxDevtools.disable()
    window.__stxDevtools.resetStats()

    const s = window.stx.state(0)
    window.stx.effect(() => { s() })
    s.set(1)
    s.set(2)

    expect(window.__stxDevtools.stats().signalSets).toBe(0)
    expect(window.__stxDevtools.stats().effectRuns).toBe(0)
    expect(s._setCount).toBe(0)
  })

  it('mutations() logs each state change with prev/next, attributed to its scope', async () => {
    window.__stxDevtools.enable()
    window.__stxDevtools.resetStats()
    const open = window.stx.state(false)
    window.stx._scopes = { Drawer: { open } }

    open.set(true)
    open.set(false)

    const muts = window.__stxDevtools.mutations()
    expect(muts.length).toBe(2)
    expect(muts[0]).toMatchObject({ name: 'open', scope: 'Drawer', prev: false, next: true })
    expect(muts[1]).toMatchObject({ name: 'open', prev: true, next: false })

    // attributes a store signal to its store
    const count = window.stx.state(0)
    window.stx._stores.set('counter', { count })
    window.__stxDevtools.resetStats()
    count.set(5)
    expect(window.__stxDevtools.mutations()[0]).toMatchObject({ name: 'count', scope: 'store:counter', prev: 0, next: 5 })
  })

  it('graph() reports each scope signal with value, setCount, and subscriber count', () => {
    window.__stxDevtools.enable()
    const count = window.stx.state(5)
    const doubled = window.stx.derived(() => count() * 2)
    window.stx._scopes = { G: { count, doubled } }
    window.stx.effect(() => { count() }) // a subscriber on count (braces → no cleanup)
    count.set(6)

    const g = window.__stxDevtools.graph().find((x: any) => x.scopeId === 'G')
    expect(g).toBeTruthy()
    const c = g.nodes.find((n: any) => n.name === 'count')
    expect(c.type).toBe('signal')
    expect(c.value).toBe(6) // read via peek
    expect(c.setCount).toBeGreaterThanOrEqual(1)
    expect(c.subscribers).toBeGreaterThanOrEqual(1) // the effect + derived read it
    const d = g.nodes.find((n: any) => n.name === 'doubled')
    expect(d.type).toBe('derived')
  })

  // ── Phase 3: :if decision trace + query timeline ──

  it('ifTrace() records the picked branch for a reactive :if chain', async () => {
    window.__stxDevtools.enable()
    window.__stxDevtools.resetStats()
    const flag = window.stx.state(true)
    window.stx._scopes = { IF: { flag } }
    document.body.innerHTML = '<div data-stx-scope="IF"><p class="a" :if="flag">YES</p><p class="b" :else>NO</p></div>'
    shimAttributes(document.body)

    window.stx.hydrate(document.querySelector('[data-stx-scope="IF"]'))
    await flushEffects()

    const trace = window.__stxDevtools.ifTrace()
    expect(trace.length).toBeGreaterThanOrEqual(1)
    const last = trace[trace.length - 1]
    expect(last.branches).toEqual([':if', ':else'])
    expect(typeof last.picked).toBe('number')
  })

  it('queries() records a useFetch timeline entry (source, status, ms)', async () => {
    window.__stxDevtools.enable()
    window.__stxDevtools.resetStats()
    const origFetch = globalThis.fetch
    // eslint-disable-next-line ts/no-explicit-any
    globalThis.fetch = (async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ x: 1 }) })) as any
    try {
      const r = window.stx.useFetch('/api/thing', { immediate: false })
      await r.refetch()

      const rec = window.__stxDevtools.queries().find((x: any) => x.url === '/api/thing')
      expect(rec).toBeTruthy()
      expect(rec.source).toBe('useFetch')
      expect(rec.status).toBe(200)
      expect(rec.ok).toBe(true)
      expect(typeof rec.ms).toBe('number')
    }
    finally {
      globalThis.fetch = origFetch
    }
  })

  it('records nothing into the trace buffers while disabled', async () => {
    window.__stxDevtools.disable()
    window.__stxDevtools.resetStats()
    const origFetch = globalThis.fetch
    // eslint-disable-next-line ts/no-explicit-any
    globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => ({}) })) as any
    try {
      await window.stx.useFetch('/api/off', { immediate: false }).refetch()
      expect(window.__stxDevtools.queries()).toEqual([])
      expect(window.__stxDevtools.ifTrace()).toEqual([])
    }
    finally {
      globalThis.fetch = origFetch
    }
  })
})
