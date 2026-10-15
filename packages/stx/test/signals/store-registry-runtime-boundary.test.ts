import { describe, expect, it } from 'bun:test'
import { SIGNALS_STORE_REGISTRY_RUNTIME } from '../../src/client/signals-store-registry-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals store registry runtime boundary', () => {
  it('assembles the store registry fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_STORE_REGISTRY_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_STORE_REGISTRY_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps store creation, persistence, HMR, and lookup together', () => {
    expect(SIGNALS_STORE_REGISTRY_RUNTIME).toContain('defineStore: function')
    expect(SIGNALS_STORE_REGISTRY_RUNTIME).toContain('var persistCfg = storeOptions && storeOptions.persist')
    expect(SIGNALS_STORE_REGISTRY_RUNTIME).toContain('__hmrReplaceStores: function')
    expect(SIGNALS_STORE_REGISTRY_RUNTIME).toContain('useStore: function')
  })
})
