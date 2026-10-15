import { describe, expect, it } from 'bun:test'
import { SIGNALS_COMPONENT_HYDRATION_RUNTIME } from '../../src/client/signals-component-hydration-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals component hydration runtime boundary', () => {
  it('assembles the component hydration fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_COMPONENT_HYDRATION_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_COMPONENT_HYDRATION_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps setup compilation and component lifecycle hydration together', () => {
    expect(SIGNALS_COMPONENT_HYDRATION_RUNTIME).toContain('function hydrateComponentScopes')
    expect(SIGNALS_COMPONENT_HYDRATION_RUNTIME).toContain('__forComponentSetupFactories')
    expect(SIGNALS_COMPONENT_HYDRATION_RUNTIME).toContain('runMountCallbacks')
  })
})
