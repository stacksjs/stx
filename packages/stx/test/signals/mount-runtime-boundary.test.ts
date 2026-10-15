import { describe, expect, it } from 'bun:test'
import { SIGNALS_MOUNT_RUNTIME } from '../../src/client/signals-mount-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals mount runtime boundary', () => {
  it('assembles the mount fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_MOUNT_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_MOUNT_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps selector and script-relative mounting together', () => {
    expect(SIGNALS_MOUNT_RUNTIME).toContain('mountEl: function')
    expect(SIGNALS_MOUNT_RUNTIME).toContain('mount: function')
    expect(SIGNALS_MOUNT_RUNTIME).toContain('function awaitingReactiveInit')
    expect(SIGNALS_MOUNT_RUNTIME).toContain('mountQueue.push(doMount)')
  })
})
