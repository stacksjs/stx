import { describe, expect, test } from 'bun:test'
import { extractPageResponseStatus } from '../src/page-response'

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

