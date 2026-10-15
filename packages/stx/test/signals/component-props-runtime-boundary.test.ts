import { describe, expect, it } from 'bun:test'
import { SIGNALS_COMPONENT_PROPS_RUNTIME } from '../../src/client/signals-component-props-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals component-props runtime boundary', () => {
  it('assembles the component-props fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_COMPONENT_PROPS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_COMPONENT_PROPS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps parent bindings and caller-scope resolution together', () => {
    expect(SIGNALS_COMPONENT_PROPS_RUNTIME).toContain('function bindParentComponentProps')
    expect(SIGNALS_COMPONENT_PROPS_RUNTIME).toContain('syncComponentPropSignal(el, name, value)')
    expect(SIGNALS_COMPONENT_PROPS_RUNTIME).toContain('function resolveComponentCallerScope')
  })
})
