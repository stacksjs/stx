/**
 * Storage guards for `useLocalStorage` / `useSessionStorage` (stacksjs/stx#1793).
 *
 * Three operations in these composables can throw, and before this suite each
 * throw escaped the composable and killed the entire client script for the
 * page — every statement after the `useLocalStorage(...)` call was dead, with
 * no console hint naming the key:
 *
 *   getItem  — SecurityError when storage is disabled or the origin is sandboxed
 *   parse    — any non-JSON value already sitting at the key
 *   setItem  — QuotaExceededError, Safari private mode
 *
 * Both implementations are covered. The module path
 * (`composables/use-storage.ts`) already guarded its read and write paths; the
 * runtime template literal in `signals.ts` did not, so the two disagreed about
 * identical risk. The cross-tab `storage` listener was unguarded on BOTH sides
 * (the module path only when a custom serializer is supplied, since the default
 * one swallows its own parse errors).
 *
 * Note the two impls do NOT share a return shape — the runtime returns a signal
 * (`s()` / `s.set()`), the module returns a StorageRef (`.value` / `.set()`).
 * That divergence predates this issue and is deliberately not papered over
 * here; the tests adapt to each shape and assert the same *behaviour*.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { useLocalStorage as moduleUseLocalStorage } from '../../src/composables/use-storage'
import { generateSignalsRuntimeDev } from '../../src/signals'

// ---------------------------------------------------------------------------
// A Storage stub we can make fail on demand.
//
// very-happy-dom exposes `window.localStorage` but leaves `globalThis.localStorage`
// undefined, and the runtime IIFE (executed via `new Function`) resolves the
// bare `localStorage` identifier through the scope chain to globalThis. So the
// stub has to be installed globally regardless — which conveniently is also the
// only way to simulate a throwing quota or a sandboxed origin.
// ---------------------------------------------------------------------------

class MemoryStorage {
  private map = new Map<string, string>()
  failGet: Error | null = null
  failSet: Error | null = null

  getItem(key: string): string | null {
    if (this.failGet)
      throw this.failGet
    return this.map.has(key) ? this.map.get(key)! : null
  }

  setItem(key: string, value: string): void {
    if (this.failSet)
      throw this.failSet
    this.map.set(key, value)
  }

  removeItem(key: string): void { this.map.delete(key) }
  clear(): void { this.map.clear() }
  seed(key: string, raw: string): void { this.map.set(key, raw) }
  raw(key: string): string | null { return this.map.has(key) ? this.map.get(key)! : null }
}

// eslint-disable-next-line ts/no-explicit-any
const g = globalThis as any

// Installed once for the file and restored in afterAll. Bun shares one process
// across test files, so leaving a stub Storage on globalThis would silently
// change behaviour for every file that runs after this one.
const localStore = new MemoryStorage()
const sessionStore = new MemoryStorage()
const saved: Record<string, unknown> = {}
let warnings: string[]
let originalWarn: typeof console.warn

function installStores(): void {
  saved.globalLocal = g.localStorage
  saved.globalSession = g.sessionStorage
  saved.windowLocal = g.window?.localStorage
  saved.windowSession = g.window?.sessionStorage

  g.localStorage = localStore
  g.sessionStorage = sessionStore
  if (g.window) {
    g.window.localStorage = localStore
    g.window.sessionStorage = sessionStore
  }
}

function restoreStores(): void {
  g.localStorage = saved.globalLocal
  g.sessionStorage = saved.globalSession
  if (g.window) {
    g.window.localStorage = saved.windowLocal
    g.window.sessionStorage = saved.windowSession
  }
}

function resetStores(): void {
  for (const store of [localStore, sessionStore]) {
    store.clear()
    store.failGet = null
    store.failSet = null
  }
}

/**
 * Fire a cross-tab `storage` event at the listeners the composable registered.
 *
 * very-happy-dom has no `StorageEvent` constructor, so build a CustomEvent and
 * decorate it with the three fields the handlers read. `storageArea` is set so
 * the area filter is exercised rather than bypassed by the synthetic-event
 * escape hatch.
 */
function fireStorageEvent(fields: { key: string, newValue: string | null, storageArea?: unknown }): void {
  const evt = new g.CustomEvent('storage') as Record<string, unknown>
  evt.key = fields.key
  evt.newValue = fields.newValue
  evt.storageArea = fields.storageArea
  g.window.dispatchEvent(evt)
}

// eslint-disable-next-line ts/no-explicit-any
type Signal = { (): any, set: (v: any) => void }

let runtimeUseLocalStorage: (key: string, defaultValue: unknown) => Signal
let runtimeUseSessionStorage: (key: string, defaultValue: unknown) => Signal

beforeAll(() => {
  installStores()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  runtimeUseLocalStorage = g.window.stx.useLocalStorage
  runtimeUseSessionStorage = g.window.stx.useSessionStorage
  if (typeof runtimeUseLocalStorage !== 'function')
    throw new TypeError('runtime useLocalStorage unavailable — signals runtime setup failed')
})

afterAll(restoreStores)

beforeEach(() => {
  resetStores()
  warnings = []
  originalWarn = console.warn
  console.warn = mock((...args: unknown[]) => { warnings.push(args.map(String).join(' ')) })
})

afterEach(() => {
  console.warn = originalWarn
})

describe('useLocalStorage guards (runtime impl)', () => {
  it('survives a key already holding a non-JSON value', () => {
    // The exact shape that killed a real page: the key had previously been
    // written as a bare string, so JSON.parse threw and everything after the
    // composable call in that client block never ran.
    localStore.seed('view-mode', 'list')

    let s!: Signal
    expect(() => { s = runtimeUseLocalStorage('view-mode', 'grid') }).not.toThrow()
    // Lenient by design: the legacy value is preserved rather than discarded
    // for the default, so migrating an existing key doesn't need a rename.
    expect(s()).toBe('list')
  })

  it('names the offending key in a console warning', () => {
    localStore.seed('view-mode', 'list')
    runtimeUseLocalStorage('view-mode', 'grid')

    // Diagnosability is the point — a silent fallback would still have left
    // the original "why is my value wrong" question unanswerable.
    expect(warnings.some(w => w.includes('view-mode'))).toBe(true)
    expect(warnings.some(w => w.includes('useLocalStorage'))).toBe(true)
  })

  it('rewrites a legacy raw value as JSON on the next write', () => {
    localStore.seed('view-mode', 'list')
    const s = runtimeUseLocalStorage('view-mode', 'grid')
    s.set('compact')
    expect(localStore.raw('view-mode')).toBe('"compact"')
  })

  it('still parses well-formed JSON', () => {
    localStore.seed('prefs', JSON.stringify({ density: 'compact', pinned: [1, 2] }))
    const s = runtimeUseLocalStorage('prefs', {})
    expect(s()).toEqual({ density: 'compact', pinned: [1, 2] })
  })

  it('returns the default when the key is absent', () => {
    const s = runtimeUseLocalStorage('never-set', 'fallback')
    expect(s()).toBe('fallback')
  })

  it('falls back to the default when getItem itself throws', () => {
    // Sandboxed iframe / storage disabled — getItem throws SecurityError
    // before there is anything to parse.
    localStore.failGet = new Error('SecurityError: storage is disabled')

    let s!: Signal
    expect(() => { s = runtimeUseLocalStorage('anything', 'fallback') }).not.toThrow()
    expect(s()).toBe('fallback')
    expect(warnings.some(w => w.includes('anything'))).toBe(true)
  })

  it('keeps working when setItem throws', () => {
    // Safari private mode / quota exhausted. useColorMode's persist() already
    // tolerated this; useLocalStorage did not, so the same page condition
    // killed one composable's consumers and not the other's.
    localStore.failSet = new Error('QuotaExceededError')

    let s!: Signal
    expect(() => { s = runtimeUseLocalStorage('big', 'seed') }).not.toThrow()
    expect(() => s.set('still-works')).not.toThrow()
    // The write is advisory; the signal remains authoritative in memory.
    expect(s()).toBe('still-works')
    expect(warnings.some(w => w.includes('big'))).toBe(true)
  })

  it('survives a non-JSON value arriving from another tab', () => {
    // Worst blast radius of the three: this throws inside a window listener,
    // at an arbitrary later time, triggered by a different tab — unreproducible
    // by loading the page, with a stack pointing into the runtime.
    const s = runtimeUseLocalStorage('cross-tab', 'default')

    expect(() => fireStorageEvent({ key: 'cross-tab', newValue: 'not-json', storageArea: localStore })).not.toThrow()
    expect(s()).toBe('not-json')
  })

  it('applies a well-formed cross-tab update', () => {
    const s = runtimeUseLocalStorage('cross-tab-ok', 'default')
    fireStorageEvent({ key: 'cross-tab-ok', newValue: JSON.stringify({ n: 7 }), storageArea: localStore })
    expect(s()).toEqual({ n: 7 })
  })

  it('resets to the default when another tab clears the key', () => {
    const s = runtimeUseLocalStorage('cleared', 'default')
    s.set('something')
    fireStorageEvent({ key: 'cleared', newValue: null, storageArea: localStore })
    expect(s()).toBe('default')
  })

  it('ignores a sessionStorage write to the same key name', () => {
    // useSessionStorage filtered on storageArea; this side didn't, so a
    // same-named sessionStorage key in another tab clobbered the signal.
    const s = runtimeUseLocalStorage('shared-name', 'local-value')
    fireStorageEvent({ key: 'shared-name', newValue: '"session-value"', storageArea: sessionStore })
    expect(s()).toBe('local-value')
  })
})

describe('useSessionStorage guards (runtime impl)', () => {
  it('survives a key already holding a non-JSON value', () => {
    sessionStore.seed('step', 'two')
    let s!: Signal
    expect(() => { s = runtimeUseSessionStorage('step', 'one') }).not.toThrow()
    expect(s()).toBe('two')
    expect(warnings.some(w => w.includes('useSessionStorage'))).toBe(true)
  })

  it('falls back to the default when getItem throws', () => {
    sessionStore.failGet = new Error('SecurityError: storage is disabled')
    let s!: Signal
    expect(() => { s = runtimeUseSessionStorage('x', 'fallback') }).not.toThrow()
    expect(s()).toBe('fallback')
  })

  it('keeps working when setItem throws', () => {
    sessionStore.failSet = new Error('QuotaExceededError')
    const s = runtimeUseSessionStorage('y', 'seed')
    expect(() => s.set('still-works')).not.toThrow()
    expect(s()).toBe('still-works')
  })

  it('survives a non-JSON value arriving from another tab', () => {
    const s = runtimeUseSessionStorage('cross', 'default')
    expect(() => fireStorageEvent({ key: 'cross', newValue: 'not-json', storageArea: sessionStore })).not.toThrow()
    expect(s()).toBe('not-json')
  })
})

describe('useLocalStorage guards (module impl)', () => {
  it('survives a key already holding a non-JSON value', () => {
    localStore.seed('view-mode', 'list')
    let ref!: ReturnType<typeof moduleUseLocalStorage<string>>
    expect(() => { ref = moduleUseLocalStorage('view-mode', 'grid') }).not.toThrow()
    // Same lenient contract as the runtime — this is what the runtime was
    // aligned TO, not a behaviour invented for it.
    expect(ref.value).toBe('list')
  })

  it('falls back to the default when getItem throws', () => {
    localStore.failGet = new Error('SecurityError: storage is disabled')
    let ref!: ReturnType<typeof moduleUseLocalStorage<string>>
    expect(() => { ref = moduleUseLocalStorage('anything', 'fallback') }).not.toThrow()
    expect(ref.value).toBe('fallback')
  })

  it('keeps working when setItem throws', () => {
    localStore.failSet = new Error('QuotaExceededError')
    const ref = moduleUseLocalStorage('big', 'seed')
    expect(() => ref.set('still-works')).not.toThrow()
    expect(ref.value).toBe('still-works')
  })

  it('survives a throwing custom serializer on a cross-tab update', () => {
    // The default serializer swallows its own parse errors, so this path only
    // bites with a custom one — but when it does, it throws inside a window
    // listener exactly like the runtime bug did.
    const ref = moduleUseLocalStorage('strict', 'default', {
      serializer: {
        read: (v: string) => JSON.parse(v) as string,
        write: (v: string) => JSON.stringify(v),
      },
    })

    fireStorageEvent({ key: 'strict', newValue: 'not-json', storageArea: localStore })

    // The throw is what's being fixed, but it can't be asserted with
    // `.not.toThrow()`: an exception raised inside a listener does not
    // propagate back to `dispatchEvent`, it surfaces as an uncaught error on
    // the window. So assert on the handled path instead — the warning naming
    // the key is only reachable once the parse is guarded.
    expect(warnings.some(w => w.includes('strict'))).toBe(true)
    // Last known-good value is kept rather than being replaced by garbage.
    expect(ref.value).toBe('default')
  })
})
