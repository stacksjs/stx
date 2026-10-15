import { describe, expect, it } from 'bun:test'
import { SIGNALS_IF_RUNTIME } from '../../src/client/signals-if-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals if runtime boundary', () => {
  it('assembles the conditional binder exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_IF_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_IF_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps detached-branch resumption and conditional binding together', () => {
    expect(SIGNALS_IF_RUNTIME).toContain('const detachedBranches = new Set()')
    expect(SIGNALS_IF_RUNTIME).toContain('function resumeDetachedBranches')
    expect(SIGNALS_IF_RUNTIME).toContain('function bindIf(')
  })
})
