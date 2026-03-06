import { describe, expect, test } from 'bun:test'
import { createTestRequest, createTestResponse } from '../src/request'

describe('createTestRequest', () => {
  test('creates request with defaults', () => {
    const req = createTestRequest()
    expect(req.method).toBe('GET')
    expect(req.url).toBe('/')
    expect(req.params).toEqual({})
    expect(req.query).toEqual({})
    expect(req.cookies).toEqual({})
    expect(req.body).toBeUndefined()
    expect(req.headers).toBeInstanceOf(Headers)
  })

  test('accepts method override', () => {
    const req = createTestRequest({ method: 'POST' })
    expect(req.method).toBe('POST')
  })

  test('accepts url override', () => {
    const req = createTestRequest({ url: '/users/1' })
    expect(req.url).toBe('/users/1')
  })

  test('accepts params override', () => {
    const req = createTestRequest({ params: { id: '42' } })
    expect(req.params).toEqual({ id: '42' })
  })

  test('accepts query override', () => {
    const req = createTestRequest({ query: { page: '2' } })
    expect(req.query).toEqual({ page: '2' })
  })

  test('accepts body override', () => {
    const req = createTestRequest({ body: { name: 'Alice' } })
    expect(req.body).toEqual({ name: 'Alice' })
  })

  test('accepts cookies override', () => {
    const req = createTestRequest({ cookies: { session: 'abc123' } })
    expect(req.cookies).toEqual({ session: 'abc123' })
  })

  test('accepts headers override', () => {
    const headers = new Headers({ 'X-Custom': 'value' })
    const req = createTestRequest({ headers })
    expect(req.headers.get('X-Custom')).toBe('value')
  })
})

describe('createTestResponse', () => {
  test('creates response with defaults', () => {
    const res = createTestResponse()
    expect(res.status).toBe(200)
    expect(res.body).toBe('')
    expect(res.headers).toBeInstanceOf(Headers)
  })

  test('accepts status override', () => {
    const res = createTestResponse({ status: 404 })
    expect(res.status).toBe(404)
  })

  test('accepts headers override', () => {
    const res = createTestResponse({ headers: { 'Content-Type': 'application/json' } })
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })

  test('accepts body override', () => {
    const res = createTestResponse({ body: { result: true } })
    expect(res.body).toEqual({ result: true })
  })

  test('text() returns string body as-is', () => {
    const res = createTestResponse({ body: 'hello' })
    expect(res.text()).toBe('hello')
  })

  test('text() stringifies non-string body', () => {
    const res = createTestResponse({ body: { a: 1 } })
    expect(res.text()).toBe('{"a":1}')
  })

  test('json() parses string body', () => {
    const res = createTestResponse({ body: '{"a":1}' })
    expect(res.json()).toEqual({ a: 1 })
  })

  test('json() returns object body directly', () => {
    const data = { a: 1 }
    const res = createTestResponse({ body: data })
    expect(res.json()).toEqual({ a: 1 })
  })

  test('isOk() returns true for 2xx status', () => {
    expect(createTestResponse({ status: 200 }).isOk()).toBe(true)
    expect(createTestResponse({ status: 201 }).isOk()).toBe(true)
    expect(createTestResponse({ status: 299 }).isOk()).toBe(true)
  })

  test('isOk() returns false for non-2xx status', () => {
    expect(createTestResponse({ status: 301 }).isOk()).toBe(false)
    expect(createTestResponse({ status: 404 }).isOk()).toBe(false)
    expect(createTestResponse({ status: 500 }).isOk()).toBe(false)
  })

  test('isRedirect() returns true for 3xx status', () => {
    expect(createTestResponse({ status: 301 }).isRedirect()).toBe(true)
    expect(createTestResponse({ status: 302 }).isRedirect()).toBe(true)
    expect(createTestResponse({ status: 307 }).isRedirect()).toBe(true)
  })

  test('isRedirect() returns false for non-3xx status', () => {
    expect(createTestResponse({ status: 200 }).isRedirect()).toBe(false)
    expect(createTestResponse({ status: 404 }).isRedirect()).toBe(false)
  })

  test('redirectUrl() returns location header for redirects', () => {
    const res = createTestResponse({
      status: 302,
      headers: { location: '/dashboard' },
    })
    expect(res.redirectUrl()).toBe('/dashboard')
  })

  test('redirectUrl() returns null for non-redirects', () => {
    const res = createTestResponse({ status: 200 })
    expect(res.redirectUrl()).toBeNull()
  })
})
