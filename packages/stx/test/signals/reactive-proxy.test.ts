/**
 * The runtime's `reactive()` is a real proxy (stacksjs/stx#1885).
 *
 * It used to be a bare alias of `state()`, which made it the most dangerous
 * name in the runtime — `state({n:0})` returns a SIGNAL, so the Vue shape
 * everyone reaches for did nothing at all:
 *
 *   const s = reactive({ count: 0 })
 *   s.count            // undefined — a signal has no such property
 *   s.count++          // writes an expando onto a function object
 *   {{ s.count }}      // renders empty, forever, with no warning
 *
 * Measured on the old runtime: `typeof reactive({n:0})` was `function`,
 * `Object.keys(...)` returned `["set","update","subscribe","_isSignal",…]`,
 * and `JSON.stringify(...)` returned `undefined`.
 *
 * Backed by one signal PER PROPERTY so an effect that reads `a` does not
 * re-run when `b` changes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { generateSignalsRuntimeDev } from '../../src/signals'

const saved = { ...globalThis } as any
let stx: any

beforeAll(() => {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write('<html><head></head><body><main></main></body></html>')
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle,
  })
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  stx = (globalThis as any).window.stx
})

afterAll(() => {
  Object.assign(globalThis, {
    window: saved.window,
    document: saved.document,
    location: saved.location,
    history: saved.history,
  })
})

describe('reactive() behaves like an object (#1885)', () => {
  it('is an object, not a signal function', () => {
    const s = stx.reactive({ n: 0 })
    expect(typeof s).toBe('object')
    expect(s._isSignal).toBeUndefined()
  })

  it('reads a property', () => {
    expect(stx.reactive({ n: 0, label: 'hi' }).n).toBe(0)
  })

  it('enumerates and serialises', () => {
    // Both returned signal internals / undefined before.
    const s = stx.reactive({ n: 0, label: 'hi' })
    expect(Object.keys(s)).toEqual(['n', 'label'])
    expect(JSON.stringify(s)).toBe('{"n":0,"label":"hi"}')
  })

  it('writes a property', () => {
    const s = stx.reactive({ n: 0 })
    s.n = 5
    expect(s.n).toBe(5)
  })

  it('leaves a primitive alone', () => {
    // reactive(0) must not silently become an object.
    expect(stx.reactive(0)).toBe(0)
    expect(stx.reactive('x')).toBe('x')
    expect(stx.reactive(null)).toBe(null)
  })

  it('returns the same proxy for the same target', () => {
    // A fresh proxy per call would break === and defeat keyed list reuse.
    const raw = { n: 0 }
    expect(stx.reactive(raw)).toBe(stx.reactive(raw))
  })
})

describe('reactive() drives effects (#1885)', () => {
  it('re-runs an effect when a property changes', () => {
    // The headline: this combination was completely inert.
    const s = stx.reactive({ n: 0 })
    const seen: number[] = []
    stx.effect(() => { seen.push(s.n) })
    s.n = 1
    expect(seen).toEqual([0, 1])
  })

  it('tracks per property, not per object', () => {
    // One signal per property is the point — writing b must not re-run an
    // effect that only read a.
    const s = stx.reactive({ a: 0, b: 0 })
    const seen: number[] = []
    stx.effect(() => { seen.push(s.a) })
    s.b = 99
    expect(seen).toEqual([0])
    s.a = 1
    expect(seen).toEqual([0, 1])
  })

  it('works through watchEffect too', () => {
    const s = stx.reactive({ n: 0 })
    const seen: number[] = []
    stx.watchEffect(() => { seen.push(s.n) })
    s.n = 1
    expect(seen).toEqual([0, 1])
  })

  it('tracks a nested object', () => {
    const s = stx.reactive({ user: { name: 'a' } })
    const seen: string[] = []
    stx.effect(() => { seen.push(s.user.name) })
    s.user.name = 'b'
    expect(seen).toEqual(['a', 'b'])
  })

  it('keeps nested proxy identity stable', () => {
    const s = stx.reactive({ user: { name: 'a' } })
    expect(s.user).toBe(s.user)
  })

  it('notifies on delete', () => {
    const s = stx.reactive({ n: 1 })
    const seen: unknown[] = []
    stx.effect(() => { seen.push(s.n) })
    delete s.n
    expect(seen).toEqual([1, undefined])
  })

  it('supports arrays by index', () => {
    const s = stx.reactive({ items: ['a', 'b'] })
    const seen: string[] = []
    stx.effect(() => { seen.push(s.items[0]) })
    s.items[0] = 'z'
    expect(seen).toEqual(['a', 'z'])
  })

  it('does not track symbol or inherited access', () => {
    // Tracking Symbol.iterator or toJSON would make every effect depend on
    // the whole object and create a signal per method lookup.
    const s = stx.reactive({ items: [1, 2, 3] })
    expect([...s.items]).toEqual([1, 2, 3])
    expect(s.items.length).toBe(3)
  })
})

describe('ref() is unaffected (#1885)', () => {
  it('still returns a signal with .value', () => {
    // ref = state survives: a signal carries a .value accessor, so the Vue
    // shape already worked for ref. Only reactive was wrong.
    const r = stx.ref(0)
    expect(r.value).toBe(0)
    const seen: number[] = []
    stx.effect(() => { seen.push(r.value) })
    r.value = 1
    expect(seen).toEqual([0, 1])
  })
})
