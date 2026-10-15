import { describe, expect, it } from 'bun:test'
import { SIGNALS_COMPONENT_API_RUNTIME } from '../../src/client/signals-component-api-runtime'
import { signalsPublicApiRuntime } from '../../src/client/signals-public-api-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals public API runtime boundary', () => {
  const fragment = signalsPublicApiRuntime(SIGNALS_COMPONENT_API_RUNTIME)

  it('assembles the public API fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(fragment)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(fragment, first + 1)).toBe(-1)
  })

  it('keeps the stable window object, composables, and registries together', () => {
    expect(fragment).toContain('window.stx = Object.assign(window.stx || {}, {')
    expect(fragment).toContain('useFetch,')
    expect(fragment).toContain(SIGNALS_COMPONENT_API_RUNTIME)
    expect(fragment).toContain('_stores: new Map()')
  })
})
