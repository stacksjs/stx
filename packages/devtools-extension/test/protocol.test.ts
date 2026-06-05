/**
 * The DevTools extension ↔ page protocol (stacksjs/stx#1747). Pins the pure
 * request→response mapping against a mock `__stxDevtools` so the contract is
 * verified without a browser.
 */
import { describe, expect, it } from 'bun:test'
import type { StxDevtoolsApi } from '../src/protocol'
import { handleDevtoolsRequest } from '../src/protocol'

function mockDevtools(overrides: Partial<StxDevtoolsApi> = {}): StxDevtoolsApi {
  let tracking = false
  return {
    version: 2,
    tree: () => [{ scopeId: 'A', tag: 'div', children: [] }],
    scope: (id: string) => ({ id, signals: { n: 1 } }),
    stores: () => ({ cart: true }),
    enable: () => { tracking = true },
    disable: () => { tracking = false },
    tracking: () => tracking,
    stats: () => ({ signalSets: 3, effectRuns: 8, tracking }),
    resetStats: () => {},
    graph: () => [{ scopeId: 'A', nodes: [{ name: 'n', type: 'signal', value: 1, setCount: 3, subscribers: 2 }] }],
    ifTrace: () => [{ scopeId: 'A', branches: [':if', ':else'], picked: 0 }],
    queries: () => [{ source: 'useFetch', url: '/api', method: 'GET', status: 200, ok: true, ms: 12 }],
    ...overrides,
  }
}

describe('handleDevtoolsRequest', () => {
  it('routes read requests to the matching __stxDevtools call', () => {
    const dt = mockDevtools()
    expect(handleDevtoolsRequest(dt, { id: 1, type: 'version' })).toEqual({ id: 1, ok: true, result: 2 })
    expect(handleDevtoolsRequest(dt, { id: 2, type: 'tree' }).result).toEqual([{ scopeId: 'A', tag: 'div', children: [] }])
    expect(handleDevtoolsRequest(dt, { id: 3, type: 'graph' }).ok).toBe(true)
    expect((handleDevtoolsRequest(dt, { id: 4, type: 'queries' }).result as any[])[0].status).toBe(200)
    expect((handleDevtoolsRequest(dt, { id: 5, type: 'ifTrace' }).result as any[])[0].picked).toBe(0)
    expect(handleDevtoolsRequest(dt, { id: 6, type: 'stores' }).result).toEqual({ cart: true })
  })

  it('passes payload args (scope → scopeId)', () => {
    const dt = mockDevtools()
    const res = handleDevtoolsRequest(dt, { id: 7, type: 'scope', payload: { scopeId: 'X' } })
    expect((res.result as any).id).toBe('X')
  })

  it('enable/disable toggle tracking and report it back', () => {
    const dt = mockDevtools()
    expect((handleDevtoolsRequest(dt, { id: 8, type: 'enable' }).result as any).tracking).toBe(true)
    expect(dt.tracking()).toBe(true)
    expect((handleDevtoolsRequest(dt, { id: 9, type: 'disable' }).result as any).tracking).toBe(false)
  })

  it('errors (not throws) when devtools is absent', () => {
    const res = handleDevtoolsRequest(null, { id: 10, type: 'tree' })
    expect(res.ok).toBe(false)
    expect(res.error).toContain('not found')
    expect(res.id).toBe(10)
  })

  it('errors on an unknown request type', () => {
    // eslint-disable-next-line ts/no-explicit-any
    const res = handleDevtoolsRequest(mockDevtools(), { id: 11, type: 'bogus' as any })
    expect(res.ok).toBe(false)
    expect(res.error).toContain('unknown request type')
  })

  it('surfaces a throwing call as an error response, never throwing', () => {
    const dt = mockDevtools({ graph: () => { throw new Error('boom') } })
    const res = handleDevtoolsRequest(dt, { id: 12, type: 'graph' })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('boom')
  })
})
