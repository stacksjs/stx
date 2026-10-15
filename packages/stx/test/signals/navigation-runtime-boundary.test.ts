import { describe, expect, it } from 'bun:test'
import { SIGNALS_NAVIGATION_RUNTIME } from '../../src/client/signals-navigation-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals navigation runtime boundary', () => {
  it('assembles the navigation fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_NAVIGATION_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_NAVIGATION_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps the template-literal fragment free of backticks', () => {
    expect(SIGNALS_NAVIGATION_RUNTIME).not.toContain(String.fromCharCode(96))
  })

  it('keeps navigation, route params, and search params in one boundary', () => {
    expect(SIGNALS_NAVIGATION_RUNTIME).toContain('function navigate(url, options)')
    expect(SIGNALS_NAVIGATION_RUNTIME).toContain('function useRouteParams()')
    expect(SIGNALS_NAVIGATION_RUNTIME).toContain('function useSearchParams()')
  })
})
