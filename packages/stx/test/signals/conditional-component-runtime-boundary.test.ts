import { describe, expect, it } from 'bun:test'
import { SIGNALS_CONDITIONAL_COMPONENT_RUNTIME } from '../../src/client/signals-conditional-component-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals conditional-component runtime boundary', () => {
  it('assembles the conditional-component fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_CONDITIONAL_COMPONENT_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_CONDITIONAL_COMPONENT_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps conditional scopes and setup-script siblings together', () => {
    expect(SIGNALS_CONDITIONAL_COMPONENT_RUNTIME).toContain('function preserveConditionalComponentScopes')
    expect(SIGNALS_CONDITIONAL_COMPONENT_RUNTIME).toContain('function findConditionalComponentSetupSiblings')
    expect(SIGNALS_CONDITIONAL_COMPONENT_RUNTIME).toContain("sibling.hasAttribute('data-stx-scoped')")
  })
})
