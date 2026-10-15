import { describe, expect, it } from 'bun:test'
import { SIGNALS_CONDITIONAL_CHAIN_RUNTIME } from '../../src/client/signals-conditional-chain-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals conditional chain runtime boundary', () => {
  it('assembles the conditional-chain fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_CONDITIONAL_CHAIN_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_CONDITIONAL_CHAIN_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps chain discovery and branch attribute parsing together', () => {
    expect(SIGNALS_CONDITIONAL_CHAIN_RUNTIME).toContain('function getElseAttrInfo')
    expect(SIGNALS_CONDITIONAL_CHAIN_RUNTIME).toContain('function findIfChain')
    expect(SIGNALS_CONDITIONAL_CHAIN_RUNTIME).toContain("el.hasAttribute('@else')")
  })
})
