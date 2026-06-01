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
 * `./signals` is mocked with counting generators so we can distinguish a cache
 * hit from a regeneration by call count (the real generators are deterministic,
 * so output alone can't tell them apart). `@stacksjs/ts-i18n` is stubbed only
 * because caching.ts → utils.ts → process.ts → i18n.ts pulls it in transitively
 * via a workspace file: link that isn't present in clean checkouts.
 */
import { describe, expect, it, mock } from 'bun:test'

mock.module('@stacksjs/ts-i18n', () => ({ loadLocale: async () => ({}) }))

let prodGenCount = 0
let devGenCount = 0
mock.module('../src/signals', () => ({
  generateSignalsRuntime: () => { prodGenCount++; return 'PROD_RUNTIME' },
  generateSignalsRuntimeDev: () => { devGenCount++; return 'DEV_RUNTIME' },
}))

const { getCachedSignalsRuntime, clearDevCaches } = await import('../src/caching')

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
