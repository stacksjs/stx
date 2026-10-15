import { describe, expect, it } from 'bun:test'
import { SIGNALS_CONTAINER_CLEANUP_RUNTIME } from '../../src/client/signals-container-cleanup-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals container-cleanup runtime boundary', () => {
  it('assembles the container-cleanup fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_CONTAINER_CLEANUP_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_CONTAINER_CLEANUP_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps scope reset and subtree cleanup in one operation', () => {
    expect(SIGNALS_CONTAINER_CLEANUP_RUNTIME).toContain('function cleanupContainer(container)')
    expect(SIGNALS_CONTAINER_CLEANUP_RUNTIME).toContain('disposeSubtreeEffects(container)')
    expect(SIGNALS_CONTAINER_CLEANUP_RUNTIME).toContain('disposeSubtreeScopes(container)')
    expect(SIGNALS_CONTAINER_CLEANUP_RUNTIME).toContain('sweepOrphanedScopes()')
  })
})
