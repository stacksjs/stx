import { describe, expect, it } from 'bun:test'
import { SIGNALS_QUERY_RUNTIME } from '../../src/client/signals-query-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals query runtime boundary', () => {
  it('assembles the query fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_QUERY_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_QUERY_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps query deduplication and mutation invalidation together', () => {
    expect(SIGNALS_QUERY_RUNTIME).toContain('function useQuery(url, options)')
    expect(SIGNALS_QUERY_RUNTIME).toContain('function useMutation(url, options)')
    expect(SIGNALS_QUERY_RUNTIME).toContain('var _queryInflight = {}')
    expect(SIGNALS_QUERY_RUNTIME).toContain('delete _queryCache[key]')
  })
})
