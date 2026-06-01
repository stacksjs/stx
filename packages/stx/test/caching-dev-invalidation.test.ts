/**
 * Dev-cache invalidation behavior for the signals runtime (stacksjs/stx#1745
 * item C). The serve file-watcher now calls `clearDevCaches()` on every source
 * edit so framework-level caches (fileContentCache, the signals runtime, the
 * router script) don't survive an edit the way they used to until a full
 * process restart.
 *
 * These tests pin the cache semantics the watcher relies on:
 *   - getCachedSignalsRuntime(false) memoizes — generates once, reuses after.
 *   - clearDevCaches() forces the next call to regenerate.
 *   - getCachedSignalsRuntime(true) (debug) never memoizes — always fresh.
 *
 * The generators are stubbed with counting fns so we can distinguish a cache
 * hit from a regeneration by call count (the real generators are deterministic,
 * so output alone can't tell them apart).
 *
 * CRITICAL — mock isolation: we do NOT use Bun's `mock.module('../src/signals',
 * …)` for this. mock.module is process-global, import resolution happens during
 * collection (before any hook runs), and it isn't restored at file boundaries —
 * so the stub leaked into every signals test file loaded afterwards (dropping
 * `state`/`derived`/`effect`/the whole runtime), failing ~200 of them in the
 * full `bun test` run while they passed in isolation. Instead we inject the
 * stub through caching.ts's `__setSignalsGeneratorsForTest` seam, which is plain
 * module state cleared in `afterAll`, so it can never escape this file. (i18n no
 * longer needs stubbing either — src/i18n.ts resolves @stacksjs/ts-i18n via a
 * guarded dynamic import with a built-in fallback, so the transitive import
 * can't crash a clean checkout.)
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { __setSignalsGeneratorsForTest, clearDevCaches, getCachedSignalsRuntime } from '../src/caching'

let prodGenCount = 0
let devGenCount = 0

beforeAll(() => {
  __setSignalsGeneratorsForTest({
    generateSignalsRuntime: () => { prodGenCount++; return 'PROD_RUNTIME' },
    generateSignalsRuntimeDev: () => { devGenCount++; return 'DEV_RUNTIME' },
  })
})

afterAll(() => {
  // Restore real generators + drop the stubbed 'PROD_RUNTIME' from the cache.
  __setSignalsGeneratorsForTest(null)
  clearDevCaches()
})

describe('signals runtime cache + clearDevCaches (stacksjs/stx#1745 item C)', () => {
  it('memoizes the prod runtime, then regenerates after clearDevCaches()', async () => {
    clearDevCaches() // reset any state inherited from earlier test files
    prodGenCount = 0

    const a = await getCachedSignalsRuntime(false)
    const b = await getCachedSignalsRuntime(false)
    expect(a).toBe('PROD_RUNTIME')
    expect(b).toBe('PROD_RUNTIME')
    expect(prodGenCount).toBe(1) // generated once, second call is a cache hit

    clearDevCaches()
    const c = await getCachedSignalsRuntime(false)
    expect(c).toBe('PROD_RUNTIME')
    expect(prodGenCount).toBe(2) // regenerated after invalidation
  })

  it('debug mode never memoizes — every call regenerates', async () => {
    devGenCount = 0
    await getCachedSignalsRuntime(true)
    await getCachedSignalsRuntime(true)
    await getCachedSignalsRuntime(true)
    expect(devGenCount).toBe(3)
  })

  it('clearDevCaches() is idempotent and safe to call with an empty cache', () => {
    expect(() => { clearDevCaches(); clearDevCaches() }).not.toThrow()
  })
})
