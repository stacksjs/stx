/**
 * Tests for the useStorage composable, with a focus on the listener-leak
 * regression from stacksjs/stx#1718.
 *
 * Pre-fix, `window.addEventListener('storage', …)` was attached inline with
 * no `removeEventListener` pair, so every `useStorage()` call leaked a
 * listener for the lifetime of the document — visible across HMR reloads
 * and repeated scope creation (a tight `useStorage` loop, or a route that
 * re-mounts a composable-using component).
 *
 * Post-fix, the handler is hoisted to a named function and an
 * `onDestroy(…)` cleanup is wired up when running inside a signals-runtime
 * scope (i.e. when `globalThis.onDestroy` is available). In raw-module
 * contexts (tests, SSR) there's no scope so the listener stays until the
 * document is gone — fine, because there's no scope to leak into either.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { useStorage } from '../../src/composables/use-storage'

// happy-dom's Window exposes localStorage / sessionStorage on `window.*` but
// the shared test preload (test-utils/happy-dom.ts) doesn't alias them onto
// globalThis. The composable reads `localStorage` / `sessionStorage` as
// bare globals, so we alias them here.
// eslint-disable-next-line ts/no-explicit-any
if (typeof (globalThis as any).localStorage === 'undefined') {
  // eslint-disable-next-line ts/no-explicit-any
  ;(globalThis as any).localStorage = (window as any).localStorage
  // eslint-disable-next-line ts/no-explicit-any
  ;(globalThis as any).sessionStorage = (window as any).sessionStorage
}

function dispatchStorage(key: string, newValue: string | null, area: Storage = localStorage) {
  // happy-dom doesn't expose StorageEvent on globalThis. Synthesize a
  // matching event shape via Event + property assignment — the composable's
  // listener only reads `event.key`, `event.newValue`, `event.storageArea`,
  // so duck typing is sufficient.
  const ev: Event & { key?: string, newValue?: string | null, storageArea?: Storage } = new Event('storage')
  ev.key = key
  ev.newValue = newValue
  ev.storageArea = area
  window.dispatchEvent(ev)
}

describe('useStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    // eslint-disable-next-line ts/no-explicit-any
    delete (globalThis as any).onDestroy
  })

  it('reads + writes localStorage round-trip', () => {
    const v = useStorage('greeting', 'hi')
    expect(v.value).toBe('hi')
    v.value = 'hello'
    expect(v.value).toBe('hello')
    expect(localStorage.getItem('greeting')).toBe(JSON.stringify('hello'))
  })

  it('returns defaultValue when key is missing', () => {
    const v = useStorage('absent', 'fallback')
    expect(v.value).toBe('fallback')
  })

  // Regression for stacksjs/stx#1718. The behavior we care about: every
  // useStorage() pairs its `storage`-event listener with an onDestroy
  // callback (when a scope is active) that removes the listener cleanly.
  describe('storage listener cleanup (#1718)', () => {
    afterEach(() => {
      // eslint-disable-next-line ts/no-explicit-any
      delete (globalThis as any).onDestroy
    })

    it('registers an onDestroy callback when a scope is active', () => {
      const callbacks: Array<() => void> = []
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).onDestroy = (fn: () => void) => { callbacks.push(fn) }

      useStorage('scoped', 'x')
      expect(callbacks).toHaveLength(1)
    })

    it('does NOT register onDestroy when listenToStorageChanges is false', () => {
      const callbacks: Array<() => void> = []
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).onDestroy = (fn: () => void) => { callbacks.push(fn) }

      useStorage('quiet', 'x', { listenToStorageChanges: false })
      expect(callbacks).toHaveLength(0)
    })

    it('stops reacting to storage events after the onDestroy callback fires', () => {
      const callbacks: Array<() => void> = []
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).onDestroy = (fn: () => void) => { callbacks.push(fn) }

      let notified = 0
      const v = useStorage<string>('reactive', 'init')
      v.subscribe(() => { notified++ })
      // subscribe() fires once immediately with the current value
      const initialCalls = notified

      // Dispatch a cross-tab storage event — listener should fire.
      dispatchStorage('reactive', JSON.stringify('from-other-tab'))
      expect(notified).toBeGreaterThan(initialCalls)
      const callsBeforeTeardown = notified

      // Simulate scope teardown — runtime calls all collected onDestroy fns.
      callbacks.forEach(fn => fn())

      // Dispatch another storage event. Pre-fix this would still fire the
      // (leaked) listener; post-fix the listener was removed during
      // teardown, so the count must NOT increase.
      dispatchStorage('reactive', JSON.stringify('after-teardown'))
      expect(notified).toBe(callsBeforeTeardown)
    })

    it('teardown of one instance does not affect a sibling using the same key', () => {
      const callbacks: Array<() => void> = []
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).onDestroy = (fn: () => void) => { callbacks.push(fn) }

      let aNotified = 0
      let bNotified = 0
      const a = useStorage<string>('shared', 'init')
      const b = useStorage<string>('shared', 'init')
      a.subscribe(() => { aNotified++ })
      b.subscribe(() => { bNotified++ })
      const aInitial = aNotified
      const bInitial = bNotified

      // Tear down ONLY instance A's listener. The two onDestroy callbacks
      // are in registration order, so callbacks[0] removes A's listener.
      expect(callbacks).toHaveLength(2)
      callbacks[0]()

      dispatchStorage('shared', JSON.stringify('next'))

      // A's subscriber should no longer fire from cross-tab events; B's
      // still should. (Pre-fix this still worked because nothing was
      // cleaned up at all — but it also tests that we don't accidentally
      // tear down the WRONG listener with the right one.)
      expect(aNotified).toBe(aInitial)
      expect(bNotified).toBeGreaterThan(bInitial)
    })

    it('does not crash when onDestroy is not available (raw module context)', () => {
      // eslint-disable-next-line ts/no-explicit-any
      delete (globalThis as any).onDestroy
      // Composable must still work; it just won't auto-clean (the listener
      // stays for the document lifetime, which is fine when there's no
      // scope to leak into either).
      expect(() => useStorage('no-scope', 'x')).not.toThrow()
    })
  })
})
