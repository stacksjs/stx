import { describe, expect, it } from 'bun:test'
import { SIGNALS_IF_CHAIN_RUNTIME } from '../../src/client/signals-if-chain-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals if-chain runtime boundary', () => {
  it('assembles the if-chain binder exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_IF_CHAIN_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_IF_CHAIN_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps branch selection, disposal, and reinsertion together', () => {
    expect(SIGNALS_IF_CHAIN_RUNTIME).toContain('function bindIfChain')
    expect(SIGNALS_IF_CHAIN_RUNTIME).toContain('disposeSubtreeEffects')
    expect(SIGNALS_IF_CHAIN_RUNTIME).toContain('hydrateComponentScopes')
  })
})
