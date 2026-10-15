import { describe, expect, it } from 'bun:test'
import { SIGNALS_COMPONENT_API_RUNTIME } from '../../src/client/signals-component-api-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals component API runtime boundary', () => {
  it('assembles the component API fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_COMPONENT_API_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_COMPONENT_API_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps props, emits, expose, and slots together', () => {
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('defineProps: function')
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('defineEmits: function')
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('defineExpose: function')
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('useSlots: function')
  })
})
