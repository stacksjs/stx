import { describe, expect, it } from 'bun:test'
import { SIGNALS_CONTEXT_RUNTIME } from '../../src/client/signals-context-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals context runtime boundary', () => {
  it('assembles the context fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_CONTEXT_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_CONTEXT_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps computed helpers and value sharing together', () => {
    expect(SIGNALS_CONTEXT_RUNTIME).toContain('function $computed(fn)')
    expect(SIGNALS_CONTEXT_RUNTIME).toContain('function $watch(deps, fn)')
    expect(SIGNALS_CONTEXT_RUNTIME).toContain('function provide(name, value)')
    expect(SIGNALS_CONTEXT_RUNTIME).toContain('function inject(name, defaultValue)')
  })
})
