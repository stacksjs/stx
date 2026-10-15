import { describe, expect, it } from 'bun:test'
import { SIGNALS_CLOAK_RUNTIME, SIGNALS_PREAMBLE_RUNTIME } from '../../src/client/signals-bootstrap-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals bootstrap runtime boundary', () => {
  it('assembles each bootstrap fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()

    for (const fragment of [SIGNALS_PREAMBLE_RUNTIME, SIGNALS_CLOAK_RUNTIME]) {
      const first = runtime.indexOf(fragment)
      expect(first).toBeGreaterThan(-1)
      expect(runtime.indexOf(fragment, first + 1)).toBe(-1)
    }
  })

  it('keeps the early lifecycle queues available before the runtime loads', () => {
    const windowValue: Record<string, any> = {}
    const preamble = SIGNALS_PREAMBLE_RUNTIME.slice(0, SIGNALS_PREAMBLE_RUNTIME.indexOf('(function() {'))

    new Function('window', preamble)(windowValue)
    windowValue.onMount(() => {})
    windowValue.onDestroy(() => {})

    expect(windowValue.__stx_early_mounts).toHaveLength(1)
    expect(windowValue.__stx_early_destroys).toHaveLength(1)
  })
})
