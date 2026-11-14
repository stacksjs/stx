import { expect, test } from 'bun:test'
import { malformedRequestResponse } from '../src/serve'

test('a request whose URL cannot be parsed is answered 400, not thrown on', async () => {
  for (const url of ['/', '/login?next=%2F', '', '//']) {
    const response = malformedRequestResponse({ url })
    expect(response?.status).toBe(400)
    expect(response?.headers.get('cache-control')).toBe('no-store')
    expect(await response?.text()).toBe('Bad Request')
  }
})

test('an ordinary request is left to the handler', () => {
  expect(malformedRequestResponse({ url: 'http://localhost:3000/' })).toBeNull()
  expect(malformedRequestResponse(new Request('https://example.com/a?b=1'))).toBeNull()
})
