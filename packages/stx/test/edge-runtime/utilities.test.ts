import { describe, expect, it } from 'bun:test'
import {
  createCloudflareHandler,
  createCookie,
  createDenoHandler,
  createNetlifyHandler,
  createTextEncoderStream,
  createVercelHandler,
} from '../../src/edge-runtime'

describe('createCookie', () => {
  it('should create basic cookie', () => {
    const cookie = createCookie('name', 'value')
    expect(cookie).toBe('name=value')
  })

  it('should encode special characters', () => {
    const cookie = createCookie('name', 'value with spaces')
    expect(cookie).toBe('name=value%20with%20spaces')
  })

  it('should add Max-Age', () => {
    const cookie = createCookie('name', 'value', { maxAge: 3600 })
    expect(cookie).toContain('Max-Age=3600')
  })

  it('should add Expires', () => {
    const date = new Date('2024-12-31T00:00:00Z')
    const cookie = createCookie('name', 'value', { expires: date })
    expect(cookie).toContain('Expires=')
    expect(cookie).toContain('Dec')
  })

  it('should add Path', () => {
    const cookie = createCookie('name', 'value', { path: '/app' })
    expect(cookie).toContain('Path=/app')
  })

  it('should add Domain', () => {
    const cookie = createCookie('name', 'value', { domain: 'example.com' })
    expect(cookie).toContain('Domain=example.com')
  })

  it('should add Secure flag', () => {
    const cookie = createCookie('name', 'value', { secure: true })
    expect(cookie).toContain('Secure')
  })

  it('should add HttpOnly flag', () => {
    const cookie = createCookie('name', 'value', { httpOnly: true })
    expect(cookie).toContain('HttpOnly')
  })

  it('should add SameSite', () => {
    const cookie = createCookie('name', 'value', { sameSite: 'Strict' })
    expect(cookie).toContain('SameSite=Strict')
  })

  it('should combine multiple options', () => {
    const cookie = createCookie('session', 'abc123', {
      maxAge: 86400,
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    })

    expect(cookie).toContain('session=abc123')
    expect(cookie).toContain('Max-Age=86400')
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
  })
})

describe('createTextEncoderStream', () => {
  it('should create a transform stream', () => {
    const stream = createTextEncoderStream()
    expect(stream).toBeInstanceOf(TransformStream)
    expect(stream.readable).toBeDefined()
    expect(stream.writable).toBeDefined()
  })

  it('should encode strings to Uint8Array', async () => {
    const stream = createTextEncoderStream()
    const writer = stream.writable.getWriter()
    const reader = stream.readable.getReader()

    writer.write('Hello')
    writer.close()

    const { value } = await reader.read()
    expect(value).toBeInstanceOf(Uint8Array)

    const decoder = new TextDecoder()
    expect(decoder.decode(value)).toBe('Hello')
  })
})

describe('platform-specific handler creators', () => {
  it('should create Cloudflare handler', () => {
    const handler = createCloudflareHandler({
      render: async () => 'Hello',
    })

    expect(handler.fetch).toBeDefined()
    expect(typeof handler.fetch).toBe('function')
  })

  it('should create Deno handler', () => {
    const handler = createDenoHandler({
      render: async () => 'Hello',
    })

    expect(typeof handler).toBe('function')
  })

  it('should create Vercel handler', () => {
    const handler = createVercelHandler({
      render: async () => 'Hello',
    })

    expect(typeof handler).toBe('function')
  })

  it('should create Netlify handler', () => {
    const handler = createNetlifyHandler({
      render: async () => 'Hello',
    })

    expect(typeof handler).toBe('function')
  })

  describe('Cloudflare handler', () => {
    it('should invoke fetch with request and env', async () => {
      let receivedEnv: any

      const handler = createCloudflareHandler({
        render: async (_request, context) => {
          receivedEnv = context.platform
          return 'OK'
        },
      })

      const request = new Request('http://localhost/')
      const env = { API_KEY: 'secret', KV: {} }
      const ctx = { waitUntil: () => {} }

      await handler.fetch(request, env, ctx)

      expect(receivedEnv.env).toBe(env)
    })
  })
})
