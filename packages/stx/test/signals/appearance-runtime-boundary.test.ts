import { describe, expect, it } from 'bun:test'
import { SIGNALS_APPEARANCE_RUNTIME } from '../../src/client/signals-appearance-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals appearance runtime boundary', () => {
  it('assembles the appearance fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_APPEARANCE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_APPEARANCE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps browser appearance observers with their cleanup paths', () => {
    expect(SIGNALS_APPEARANCE_RUNTIME).toContain('function useColorMode(options)')
    expect(SIGNALS_APPEARANCE_RUNTIME).toContain('function useMediaQuery(query)')
    expect(SIGNALS_APPEARANCE_RUNTIME).toContain('function useDocumentVisibility()')
    expect(SIGNALS_APPEARANCE_RUNTIME).toContain('function useScrollLock(target)')
  })
})
