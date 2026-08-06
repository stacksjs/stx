/**
 * A store edit is applied without throwing the page away
 * (stacksjs/stx#1877 ask 4 — the Pinia `acceptHMRUpdate` contract).
 *
 * Store edits used to reach the browser only as `location.reload()`, which
 * resets every signal on the page — the exact state the SPA exists to preserve.
 *
 * The design decision worth recording is which object survives. Patching the
 * OLD store in place (keeping its signals) is the obvious reading of "hot swap",
 * and it is wrong here: a setup-style store's actions close over the signals
 * created in that same run, so new actions would write to signals nothing is
 * watching — an edit that silently does nothing, which is worse than the reload
 * it replaces. So the new store wins, its signals are seeded from the old
 * values, and the caller re-renders so components rebind.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

/** Define a counter store whose action closes over its own signal. */
function counterBundle(step: number): string {
  return `window.stx.defineStore('counter', function () {
    var count = window.stx.state(0);
    var label = window.stx.derived(function () { return 'n=' + count(); });
    function bump() { count.set(count() + ${step}); }
    return { count: count, label: label, bump: bump };
  });`
}

describe('replacing a store definition', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  beforeEach(() => {
    window.stx._stores.clear()
    // eslint-disable-next-line no-eval
    ;(0, eval)(counterBundle(1))
  })

  it('keeps the state a running page had accumulated', async () => {
    const before = window.stx.useStore('counter')
    before.bump()
    before.bump()
    expect(before.count()).toBe(2)

    window.stx.__hmrReplaceStores(counterBundle(10))

    expect(window.stx.useStore('counter').count()).toBe(2)
  })

  it('runs the NEW action body, not the old one', async () => {
    window.stx.useStore('counter').bump()

    window.stx.__hmrReplaceStores(counterBundle(10))
    const after = window.stx.useStore('counter')
    after.bump()

    // 1 from the old definition, then +10 from the edited one.
    expect(after.count()).toBe(11)
  })

  it('leaves the new action writing to the signal the store exposes', async () => {
    // The failure mode of patching the old store instead: bump() would mutate a
    // signal that is no longer the one anybody reads.
    window.stx.__hmrReplaceStores(counterBundle(10))
    const store = window.stx.useStore('counter')

    store.bump()

    expect(store.count()).toBe(10)
  })

  it('recomputes derived values from the seeded state', async () => {
    const before = window.stx.useStore('counter')
    before.bump()
    before.bump()
    before.bump()

    window.stx.__hmrReplaceStores(counterBundle(1))

    // Seeded to 3, and the derived label reflects it rather than its default.
    expect(window.stx.useStore('counter').label()).toBe('n=3')
  })

  it('keeps a new key that the edit introduced', async () => {
    window.stx.useStore('counter').bump()

    window.stx.__hmrReplaceStores(`window.stx.defineStore('counter', function () {
      var count = window.stx.state(0);
      var extra = window.stx.state('added');
      return { count: count, extra: extra };
    });`)

    const store = window.stx.useStore('counter')
    expect(store.count()).toBe(1)
    expect(store.extra()).toBe('added')
  })

  it('survives an edit that removes a key', async () => {
    window.stx.useStore('counter').bump()

    const ok = window.stx.__hmrReplaceStores(`window.stx.defineStore('counter', function () {
      var other = window.stx.state('only');
      return { other: other };
    });`)

    expect(ok).toBe(true)
    expect(window.stx.useStore('counter').other()).toBe('only')
  })

  it('reports a bundle that does not evaluate instead of half-applying it', async () => {
    const ok = window.stx.__hmrReplaceStores('this is not valid javascript (')

    // The HMR client falls back to a reload on false — better than a page
    // holding a store that was replaced halfway.
    expect(ok).toBe(false)
    expect(window.stx.useStore('counter').count()).toBe(0)
  })

  it('does not leave the replacement flag set', async () => {
    // A stuck flag would make every later defineStore() call redefine rather
    // than return the existing store.
    window.stx.__hmrReplaceStores(counterBundle(1))

    expect(window.stx.__hmrStoreReplacing).toBe(false)
    expect(window.stx.__hmrStoreSeed).toBeNull()
  })

  it('still short-circuits a normal duplicate definition', async () => {
    const first = window.stx.useStore('counter')
    first.bump()

    // Outside an HMR pass, a second defineStore for the same id must return the
    // SAME store, not rebuild it.
    // eslint-disable-next-line no-eval
    ;(0, eval)(counterBundle(1))

    expect(window.stx.useStore('counter')).toBe(first)
    expect(window.stx.useStore('counter').count()).toBe(1)
  })
})
