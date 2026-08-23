import { describe, expect, test } from 'bun:test'
import {
  extractPageResponseStatus,
  isHttpStatus,
  readResponseHeaders,
  readResponseStatus,
  recordResponseStatus,
  syncRecordedResponse,
} from '../src/page-response'

describe('page response metadata', () => {
  test('extracts a static HTTP status from definePageMeta', () => {
    expect(extractPageResponseStatus(`
      <script server>
      definePageMeta({
        title: 'Missing',
        status: 404,
      })
      </script>
    `)).toBe(404)
  })

  test('ignores absent, dynamic, and invalid statuses', () => {
    expect(extractPageResponseStatus('definePageMeta({ title: "Home" })')).toBeUndefined()
    expect(extractPageResponseStatus('definePageMeta({ status: response.status })')).toBeUndefined()
    expect(extractPageResponseStatus('definePageMeta({ status: 999 })')).toBeUndefined()
  })
})

describe('isHttpStatus', () => {
  test('accepts the range a response can actually carry', () => {
    expect([100, 200, 301, 404, 410, 599].every(isHttpStatus)).toBe(true)
  })

  test('rejects everything else, so a typo cannot become a 500 downstream', () => {
    for (const bad of [99, 600, 0, -1, 1.5, Number.NaN, '404', null, undefined, {}])
      expect(isHttpStatus(bad)).toBe(false)
  })
})

describe('recordResponseStatus', () => {
  test('takes a numeric string, because a directive argument arrives as text', () => {
    const ctx: Record<string, any> = {}
    expect(recordResponseStatus(ctx, ' 410 ')).toBe(true)
    expect(readResponseStatus(ctx)).toBe(410)
  })

  test('reports what it refused, so a caller can say so', () => {
    const ctx: Record<string, any> = {}
    expect(recordResponseStatus(ctx, 9999)).toBe(false)
    expect(readResponseStatus(ctx)).toBeUndefined()
  })

  test('is a no-op without a context rather than a throw', () => {
    expect(recordResponseStatus(undefined, 404)).toBe(false)
  })
})

describe('readResponseStatus', () => {
  test('distinguishes "said 200" from "said nothing"', () => {
    // The distinction is what lets an outer status — an error page's
    // definePageMeta — survive a page that never spoke.
    expect(readResponseStatus({})).toBeUndefined()
    expect(readResponseStatus({ __stxResponseStatus: 200 })).toBe(200)
  })

  test('refuses a value that is not a status, however it got there', () => {
    expect(readResponseStatus({ __stxResponseStatus: 'gone' })).toBeUndefined()
  })
})

describe('syncRecordedResponse', () => {
  test('carries a status from the render context out to the caller\'s', () => {
    // Renderers build a fresh internal context from the caller's, so without
    // this the page's intent dies inside the render.
    const internal: Record<string, any> = { __stxResponseStatus: 404 }
    const caller: Record<string, any> = {}
    syncRecordedResponse(internal, caller)

    expect(readResponseStatus(caller)).toBe(404)
  })

  test('merges headers rather than replacing them', () => {
    const internal: Record<string, any> = { __stxResponseHeaders: { 'X-Robots-Tag': 'noindex' } }
    const caller: Record<string, any> = { __stxResponseHeaders: { Location: '/features' } }
    syncRecordedResponse(internal, caller)

    expect(readResponseHeaders(caller)).toEqual({ 'Location': '/features', 'X-Robots-Tag': 'noindex' })
  })

  test('leaves the target alone when the render asked for nothing', () => {
    const caller: Record<string, any> = { __stxResponseStatus: 410 }
    syncRecordedResponse({}, caller)

    expect(readResponseStatus(caller)).toBe(410)
  })
})
