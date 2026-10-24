import { describe, expect, it } from 'bun:test'
import { SIGNALS_MANIFEST_HYDRATION_RUNTIME } from '../../src/client/signals-manifest-hydration-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals manifest-hydration runtime boundary', () => {
  it('assembles the manifest-hydration fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_MANIFEST_HYDRATION_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_MANIFEST_HYDRATION_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps manifest walking and native host hydration together', () => {
    expect(SIGNALS_MANIFEST_HYDRATION_RUNTIME).toContain('function processFromManifest')
    expect(SIGNALS_MANIFEST_HYDRATION_RUNTIME).toContain('function hydrateHost')
    expect(SIGNALS_MANIFEST_HYDRATION_RUNTIME).toContain('processElement(node, node.__stx_parent_scope || scope, true)')
    expect(SIGNALS_MANIFEST_HYDRATION_RUNTIME).toContain('return function disposeHost()')
  })
})
