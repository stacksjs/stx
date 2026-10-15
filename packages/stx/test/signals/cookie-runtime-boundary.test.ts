import { describe, expect, it } from 'bun:test'
import { SIGNALS_COOKIE_RUNTIME } from '../../src/client/signals-cookie-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals cookie runtime boundary', () => {
  it('assembles the cookie fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_COOKIE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_COOKIE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps cookie parsing, attributes, and deletion together', () => {
    expect(SIGNALS_COOKIE_RUNTIME).toContain('function useCookie(name, opts)')
    expect(SIGNALS_COOKIE_RUNTIME).toContain("parts.push('max-age=0')")
    expect(SIGNALS_COOKIE_RUNTIME).toContain("parts.push('SameSite=' + (opts.sameSite || 'Lax'))")
    expect(SIGNALS_COOKIE_RUNTIME).toContain('document.cookie = serialise(value)')
  })
})
