import { describe, expect, test } from 'bun:test'
import { createHandlerContext, createHandlerContextWithBody, defineHandler } from '../src'

describe('defineHandler', () => {
  test('returns the handler config as-is', () => {
    const config = defineHandler({
      handler: ctx => ({ message: 'hello' }),
    })
    expect(config.handler).toBeDefined()
  })

  test('preserves middleware and input config', () => {
    const config = defineHandler({
      handler: ctx => null,
      middleware: ['auth'],
      input: { parse: data => data },
    })
    expect(config.middleware).toEqual(['auth'])
    expect(config.input).toBeDefined()
  })
})

describe('createHandlerContext', () => {
  test('extracts url from request', () => {
    const request = new Request('http://localhost:3000/api/posts?page=1')
    const ctx = createHandlerContext(request)
    expect(ctx.url.pathname).toBe('/api/posts')
    expect(ctx.url.searchParams.get('page')).toBe('1')
  })

  test('extracts headers from request', () => {
    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'X-Custom': 'value' },
    })
    const ctx = createHandlerContext(request)
    expect(ctx.headers.get('X-Custom')).toBe('value')
  })

  test('includes provided params', () => {
    const request = new Request('http://localhost:3000/api/posts/42')
    const ctx = createHandlerContext(request, { id: '42' })
    expect(ctx.params.id).toBe('42')
  })

  test('defaults to empty params', () => {
    const request = new Request('http://localhost:3000/api/test')
    const ctx = createHandlerContext(request)
    expect(ctx.params).toEqual({})
  })
})

describe('createHandlerContextWithBody', () => {
  test('parses JSON body', async () => {
    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hello' }),
    })
    const ctx = await createHandlerContextWithBody(request)
    expect(ctx.body).toEqual({ title: 'Hello' })
  })

  test('body is null for non-json content', async () => {
    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      body: 'plain text',
    })
    const ctx = await createHandlerContextWithBody(request)
    expect(ctx.body).toBeNull()
  })
})

describe('handler execution', () => {
  test('handler receives context and returns data', async () => {
    const config = defineHandler({
      handler: (ctx) => {
        return { id: ctx.params.id, method: ctx.request.method }
      },
    })

    const request = new Request('http://localhost:3000/api/posts/5', { method: 'GET' })
    const ctx = createHandlerContext(request, { id: '5' })
    const result = await config.handler(ctx)
    expect(result).toEqual({ id: '5', method: 'GET' })
  })
})
