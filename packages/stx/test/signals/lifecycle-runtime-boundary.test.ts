import { describe, expect, it } from 'bun:test'
import { SIGNALS_LIFECYCLE_RUNTIME } from '../../src/client/signals-lifecycle-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadLifecycle(windowValue: Record<string, unknown>): Record<string, any> {
  const runtime = `${SIGNALS_LIFECYCLE_RUNTIME}\nreturn { mountCallbacks, destroyCallbacks, onMount, onDestroy, runMountCallbacks }`
  return new Function('window', runtime)(windowValue) as Record<string, any>
}

describe('signals lifecycle runtime boundary', () => {
  it('assembles the lifecycle fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_LIFECYCLE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_LIFECYCLE_RUNTIME, first + 1)).toBe(-1)
  })

  it('drains early hooks and owns cleanups returned by mount hooks', () => {
    let cleaned = false
    const lifecycle = loadLifecycle({
      __stx_early_mounts: [() => () => { cleaned = true }],
      __stx_early_destroys: [],
    })

    lifecycle.runMountCallbacks(lifecycle.mountCallbacks)
    expect(lifecycle.mountCallbacks).toHaveLength(0)
    expect(lifecycle.destroyCallbacks).toHaveLength(1)

    lifecycle.destroyCallbacks[0]()
    expect(cleaned).toBe(true)
  })
})
