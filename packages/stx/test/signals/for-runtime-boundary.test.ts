import { describe, expect, it } from 'bun:test'
import { SIGNALS_FOR_RUNTIME } from '../../src/client/signals-for-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals for runtime boundary', () => {
  it('assembles the list-binding fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_FOR_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_FOR_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps keyed rows, component hydration, and transitions together', () => {
    expect(SIGNALS_FOR_RUNTIME).toContain('function bindFor')
    expect(SIGNALS_FOR_RUNTIME).toContain('hydrateComponentScopes')
    expect(SIGNALS_FOR_RUNTIME).toContain('tgFlip(newElements')
  })
})
