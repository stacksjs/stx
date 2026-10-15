import { describe, expect, it } from 'bun:test'
import { SIGNALS_HYDRATION_AUDIT_RUNTIME } from '../../src/client/signals-hydration-audit-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals hydration-audit runtime boundary', () => {
  it('assembles the hydration-audit fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_HYDRATION_AUDIT_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_HYDRATION_AUDIT_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps expression, scope, and moustache diagnostics together', () => {
    expect(SIGNALS_HYDRATION_AUDIT_RUNTIME).toContain('function noteExprFailure(expr, err)')
    expect(SIGNALS_HYDRATION_AUDIT_RUNTIME).toContain('function findLiteralMoustaches(root)')
    expect(SIGNALS_HYDRATION_AUDIT_RUNTIME).toContain('function auditHydration(container, phase)')
    expect(SIGNALS_HYDRATION_AUDIT_RUNTIME).toContain('function auditHydrationUnsafe(container, phase)')
  })
})
