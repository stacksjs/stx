import { describe, expect, it } from 'bun:test'
import { signalsKeptRuntime } from '../../src/client/signals-kept-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { createKeptStore, indexedDbBackend } from '../../src/offline/kept-store'
import { createQueryCache, queryTargetMatches } from '../../src/offline/query-cache'
import { sharedRequest } from '../../src/shared-request'

function keptRuntime(): string {
  return signalsKeptRuntime(
    createKeptStore.toString(),
    indexedDbBackend.toString(),
    createQueryCache.toString(),
    queryTargetMatches.toString(),
    sharedRequest.toString(),
  )
}

describe('signals kept-state runtime boundary', () => {
  it('assembles the kept-state fragment exactly once', () => {
    const fragment = keptRuntime()
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(fragment)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(fragment, first + 1)).toBe(-1)
  })

  it('keeps persistence scope and cached queries together', () => {
    const fragment = keptRuntime()

    expect(fragment).toContain("var STX_KEPT_PREFIX = 'stx:kept:'")
    expect(fragment).toContain('function keptState(name, initialValue, options)')
    expect(fragment).toContain('function forgetKeptState(scope)')
    expect(fragment).toContain('function cachedQuery(key, options)')
  })
})
