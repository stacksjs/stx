/**
 * Parity tests for the two `useLocalStorage` / `useSessionStorage` impls
 * (stacksjs/stx#1797).
 *
 * stx ships two:
 *   1. `packages/stx/src/composables/use-storage.ts` — module-import path,
 *      reachable as `@stacksjs/stx` and `@stacksjs/stx/composables`.
 *   2. The runtime template literal inside `packages/stx/src/signals.ts`,
 *      injected into client pages as `window.stx.useLocalStorage`.
 *
 * They returned DIFFERENT SHAPES: a `StorageRef` (`.value`) from the module and
 * a Signal (`s()`) from the runtime, while the ambient `stx.d.ts` declared the
 * Signal for both. So `.value` worked or silently yielded `undefined` purely
 * according to which entry point an import resolved — and the same identifier
 * had five shapes once `browser-composables.ts`, `packages/components` and
 * `@stacksjs/composables` were counted.
 *
 * Both now return a Signal, following the precedent #1710 set when it converted
 * `useCookie` from a Vue-style `CookieRef` to a Signal. The richer object API
 * lives on under its own name, `useStorage`, which is unchanged and covered
 * separately.
 *
 * Contract pinned here:
 *   - returns a Signal<T> (callable; `s()` reads, `s.set(v)` writes)
 *   - the write persists, JSON-serialised
 *   - a missing key yields defaultValue
 *   - a stored non-JSON value is returned as a raw string, not thrown on
 *   - cross-tab `storage` events update the signal, filtered by storageArea
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import * as composableModule from '../../src/composables/use-storage'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

interface StorageSignal<T> {
  (): T
  set: (v: T) => void
}

type UseStorageFn = <T>(key: string, defaultValue: T) => StorageSignal<T>

class MemoryStorage {
  private data = new Map<string, string>()
  get length(): number { return this.data.size }
  key(i: number): string | null { return Array.from(this.data.keys())[i] ?? null }
  getItem(k: string): string | null { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string): void { this.data.set(k, String(v)) }
  removeItem(k: string): void { this.data.delete(k) }
  clear(): void { this.data.clear() }
}

const local = new MemoryStorage()
const session = new MemoryStorage()
const saved: Record<string, any> = {}

beforeAll(() => {
  saved.localStorage = g.localStorage
  saved.sessionStorage = g.sessionStorage
  saved.windowLocal = g.window?.localStorage
  saved.windowSession = g.window?.sessionStorage

  g.localStorage = local
  g.sessionStorage = session
  if (g.window) {
    g.window.localStorage = local
    g.window.sessionStorage = session
  }

  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterAll(() => {
  g.localStorage = saved.localStorage
  g.sessionStorage = saved.sessionStorage
  if (g.window) {
    g.window.localStorage = saved.windowLocal
    g.window.sessionStorage = saved.windowSession
  }
})

beforeEach(() => {
  local.clear()
  session.clear()
})

/** Dispatch a cross-tab storage event the way a browser would. */
function fireStorage(key: string, newValue: string | null, area: MemoryStorage): void {
  const event: any = new g.window.Event('storage')
  event.key = key
  event.newValue = newValue
  event.storageArea = area
  g.window.dispatchEvent(event)
}

const IMPLS: Array<[string, { localFn: UseStorageFn, sessionFn: UseStorageFn }]> = [
  ['module (composables)', {
    localFn: composableModule.useLocalStorage as UseStorageFn,
    sessionFn: composableModule.useSessionStorage as UseStorageFn,
  }],
  ['runtime (window.stx)', {
    get localFn() { return g.window.stx.useLocalStorage as UseStorageFn },
    get sessionFn() { return g.window.stx.useSessionStorage as UseStorageFn },
  } as any],
]

for (const [name, impl] of IMPLS) {
  describe(`useLocalStorage parity (${name})`, () => {
    it('returns a callable signal, not a ref object', () => {
      // The whole point of #1797 — a StorageRef fails `typeof === function`.
      const s = impl.localFn('k', 'fallback')
      expect(typeof s).toBe('function')
      expect(s()).toBe('fallback')
      expect((s as any)._isSignal).toBe(true)
    })

    it('does not carry the StorageRef-only methods', () => {
      const s = impl.localFn('k', 'a') as any
      expect(s.get).toBeUndefined()
      expect(s.remove).toBeUndefined()
    })

    it('keeps .value working, so most existing reads survive the change', () => {
      // Signal already carries a Vue-compatible `.value` accessor, which is
      // why this shape change is far narrower than it looks: `.value` reads,
      // `.value = x` writes and `.set()` are all common to both shapes. Only
      // `.get()` and `.remove()` actually needed migrating.
      const s = impl.localFn('k', 'a') as any
      expect(s.value).toBe('a')
      s.value = 'b'
      expect(s()).toBe('b')
      expect(local.getItem('k')).toBe('"b"')
    })

    it('exposes .set for writes', () => {
      const s = impl.localFn('k', 'a')
      s.set('b')
      expect(s()).toBe('b')
    })

    it('persists the write, JSON-serialised', () => {
      const s = impl.localFn('k', 'a')
      s.set('b')
      expect(local.getItem('k')).toBe('"b"')
    })

    it('reads an existing value', () => {
      local.setItem('k', JSON.stringify({ a: 1 }))
      expect(impl.localFn<any>('k', null)()).toEqual({ a: 1 })
    })

    it('falls back when the key is missing', () => {
      expect(impl.localFn('missing', 42)()).toBe(42)
    })

    it('round-trips objects and arrays', () => {
      const s = impl.localFn<any>('k', null)
      s.set({ list: [1, 2, 3] })
      expect(impl.localFn<any>('k', null)()).toEqual({ list: [1, 2, 3] })
    })

    it('returns a stored non-JSON value as a raw string', () => {
      // Legacy plain-string keys migrate instead of throwing (#1793).
      local.setItem('k', 'plain-not-json')
      expect(impl.localFn('k', 'fallback')()).toBe('plain-not-json')
    })

    it('updates from a cross-tab write', () => {
      const s = impl.localFn('k', 'a')
      fireStorage('k', JSON.stringify('from-other-tab'), local)
      expect(s()).toBe('from-other-tab')
    })

    it('ignores a sessionStorage event for the same key name', () => {
      const s = impl.localFn('k', 'a')
      fireStorage('k', JSON.stringify('session-write'), session)
      expect(s()).toBe('a')
    })

    it('ignores an event for a different key', () => {
      const s = impl.localFn('k', 'a')
      fireStorage('other', JSON.stringify('nope'), local)
      expect(s()).toBe('a')
    })
  })

  describe(`useSessionStorage parity (${name})`, () => {
    it('returns a callable signal', () => {
      const s = impl.sessionFn('k', 'fallback')
      expect(typeof s).toBe('function')
      expect(s()).toBe('fallback')
    })

    it('writes to sessionStorage, not localStorage', () => {
      impl.sessionFn('k', 'a').set('b')
      expect(session.getItem('k')).toBe('"b"')
      expect(local.getItem('k')).toBeNull()
    })

    it('ignores a localStorage event for the same key name', () => {
      const s = impl.sessionFn('k', 'a')
      fireStorage('k', JSON.stringify('local-write'), local)
      expect(s()).toBe('a')
    })
  })
}

describe('useStorage keeps the richer object API', () => {
  it('still returns a StorageRef', () => {
    // Unchanged on purpose: options, custom serializers, remove() and
    // subscribe() are genuinely a different thing from a signal, so they keep
    // their own name rather than being folded in.
    const ref = composableModule.useStorage('k', 'a')
    expect(typeof ref).toBe('object')
    expect(ref.value).toBe('a')
    ref.value = 'b'
    expect(ref.get()).toBe('b')
    expect(typeof ref.remove).toBe('function')
    expect(typeof ref.subscribe).toBe('function')
  })
})
