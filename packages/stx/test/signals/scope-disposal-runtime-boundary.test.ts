import { describe, expect, it } from 'bun:test'
import { SIGNALS_SCOPE_DISPOSAL_RUNTIME } from '../../src/client/signals-scope-disposal-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals scope-disposal runtime boundary', () => {
  it('assembles the scope-disposal fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_SCOPE_DISPOSAL_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_SCOPE_DISPOSAL_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps effect, lifecycle, registry, and orphan cleanup together', () => {
    expect(SIGNALS_SCOPE_DISPOSAL_RUNTIME).toContain('function disposeSubtreeEffects(root)')
    expect(SIGNALS_SCOPE_DISPOSAL_RUNTIME).toContain('function suspendSubtreeScopes(nodes)')
    expect(SIGNALS_SCOPE_DISPOSAL_RUNTIME).toContain('function resumeSubtreeScopes(nodes)')
    expect(SIGNALS_SCOPE_DISPOSAL_RUNTIME).toContain('function sweepOrphanedScopes()')
  })
})
