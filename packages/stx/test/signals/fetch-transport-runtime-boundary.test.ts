import { describe, expect, it } from 'bun:test'
import { SIGNALS_FETCH_TRANSPORT_RUNTIME } from '../../src/client/signals-fetch-transport-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals fetch transport runtime boundary', () => {
  it('assembles the fetch transport fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_FETCH_TRANSPORT_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_FETCH_TRANSPORT_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps errors, hooks, CSRF, and transport together', () => {
    expect(SIGNALS_FETCH_TRANSPORT_RUNTIME).toContain('async function __stxHttpError')
    expect(SIGNALS_FETCH_TRANSPORT_RUNTIME).toContain('function configureFetch')
    expect(SIGNALS_FETCH_TRANSPORT_RUNTIME).toContain('async function __stxFetch')
  })
})
