import { describe, expect, it } from 'bun:test'
import { SIGNALS_STORAGE_RUNTIME } from '../../src/client/signals-storage-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals storage runtime boundary', () => {
  it('assembles the storage fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_STORAGE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_STORAGE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps guarded reads, writes, and cross-tab listeners together', () => {
    expect(SIGNALS_STORAGE_RUNTIME).toContain('function stxStorageRead(store, key, fallback, label)')
    expect(SIGNALS_STORAGE_RUNTIME).toContain('function stxStorageWrite(store, key, value, label)')
    expect(SIGNALS_STORAGE_RUNTIME).toContain('function useLocalStorage(key, defaultValue)')
    expect(SIGNALS_STORAGE_RUNTIME).toContain('function useSessionStorage(key, defaultValue)')
  })
})
