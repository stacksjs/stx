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

describe('proxy receivers and immutable descriptors', () => {
  for (const runtime of ['browser', 'module'] as const) {
    it(`${runtime} preserves class identity, including private fields`, async () => {
      const reactive = runtime === 'browser' ? stx.reactive : (await import('../../src/reactivity')).reactive
      class Counter {
        #count = 42
        get count() { return this.#count }
      }
      const counter = new Counter()
      const dates = new Map([['now', new Date(0)]])
      expect(reactive(counter)).toBe(counter)
      expect(reactive({ counter }).counter.count).toBe(42)
      expect(reactive({ dates }).dates.get('now')).toEqual(new Date(0))
    })

    it(`${runtime} reads locked object properties without violating proxy invariants`, async () => {
      const reactive = runtime === 'browser' ? stx.reactive : (await import('../../src/reactivity')).reactive
      const nested = { count: 42 }
      const frozen = reactive(Object.freeze({ nested }))
      expect(frozen.nested).toBe(nested)
      expect(Reflect.set(frozen, 'nested', {})).toBe(false)
      expect(Reflect.deleteProperty(frozen, 'nested')).toBe(false)
      expect(frozen.nested.count).toBe(42)
    })
  }
})

for (const runtime of ['browser', 'module'] as const) {
  describe(`structural reactive tracking (${runtime})`, () => {
    async function getRuntime() {
      return runtime === 'browser' ? stx : {
        reactive: (await import('../../src/reactivity')).reactive,
        effect: (await import('../../src/signals-api')).effect,
      }
    }

    it('tracks value, presence, and enumerable keys independently', async () => {
      const { reactive, effect } = await getRuntime()
      const record = reactive({ field: undefined as number | undefined })
      delete (record as Partial<typeof record>).field
      const values: unknown[] = []
      const presence: boolean[] = []
      const keys: string[][] = []
      const stops = [
        effect(() => { values.push(record.field) }),
        effect(() => { presence.push('field' in record) }),
        effect(() => { keys.push(Object.keys(record)) }),
      ]
      record.field = 1
      record.field = 2
      delete (record as Partial<typeof record>).field
      Object.defineProperty(record, 'field', { value: 3, enumerable: false, configurable: true })
      Object.defineProperty(record, 'field', { enumerable: true })
      expect(values).toEqual([undefined, 1, 2, undefined, 3])
      expect(presence).toEqual([false, true, false, true])
      expect(keys).toEqual([[], ['field'], [], [], ['field']])
      stops.forEach(stop => stop())
    })

    it('tracks nested sparse arrays, including implicit growth and truncation', async () => {
      const { reactive, effect } = await getRuntime()
      const model = reactive({ rows: [] as number[] })
      const snapshots: unknown[][] = []
      const stop = effect(() => {
        snapshots.push([model.rows.length, model.rows[2], 2 in model.rows, Object.keys(model.rows)])
      })
      model.rows[2] = 7
      model.rows.length = 1
      model.rows.push(3)
      Object.defineProperty(model.rows, '2', { value: 9, configurable: true, enumerable: true })
      expect(snapshots).toEqual([
        [0, undefined, false, []], [3, 7, true, ['2']], [1, undefined, false, []],
        [2, undefined, false, ['1']], [3, 9, true, ['1', '2']],
      ])
      expect(reactive(model.rows)).toBe(model.rows)
      stop()
    })
  })
}
