import { describe, expect, it } from 'bun:test'
import { SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME } from '../../src/client/signals-loop-component-remap-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals loop component remap runtime boundary', () => {
  it('assembles the loop component remap fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps template traversal and scope-id rewriting together', () => {
    expect(SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME).toContain('function forEachGroupElement')
    expect(SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME).toContain('function remapForComponentScopes')
    expect(SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME).toContain('data-stx-template-scope')
  })
})
