import { describe, expect, it } from 'bun:test'
import {
  createEdgeHandler,
  createStreamingResponse,
  jsonResponse,
  notFound,
  parseCookies,
  redirect,
  stringToStream,
} from '../../src/edge-runtime'

describe('createEdgeHandler', () => {
  it('should create a handler function', () => {
    const handler = createEdgeHandler({
      render: async () => 'Hello World',
    })

    expect(typeof handler).toBe('function')
  })

  it('should handle string responses', async () => {
    const handler = createEdgeHandler({
      render: async () => 'Hello World',
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hello World')
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
  })

  it('should handle Response objects', async () => {
    const handler = createEdgeHandler({
      render: async () => new Response('Custom response', {
        status: 201,
        headers: { 'X-Custom': 'header' },
      }),
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(response.status).toBe(201)
    expect(await response.text()).toBe('Custom response')
    expect(response.headers.get('X-Custom')).toBe('header')
  })

  it('should add X-Request-Id header', async () => {
    const handler = createEdgeHandler({
      render: async () => 'Test',
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(response.headers.get('X-Request-Id')).toBeDefined()
  })

  it('should add X-Response-Time header', async () => {
    const handler = createEdgeHandler({
      render: async () => 'Test',
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    const responseTime = response.headers.get('X-Response-Time')
    expect(responseTime).toBeDefined()
    expect(responseTime).toContain('ms')
  })

  it('should pass context to render function', async () => {
    let receivedContext: any

    const handler = createEdgeHandler({
      render: async (_request, context) => {
        receivedContext = context
        return 'OK'
      },
    })

    const request = new Request('http://localhost/')
    await handler(request)

    expect(receivedContext.runtime).toBeDefined()
    expect(receivedContext.requestId).toBeDefined()
    expect(receivedContext.timing).toBeDefined()
    expect(receivedContext.env).toBeDefined()
  })

  it('should handle errors with custom error handler', async () => {
    const handler = createEdgeHandler({
      render: async () => {
        throw new Error('Test error')
      },
      onError: (error) => {
        return new Response(`Error: ${error.message}`, { status: 500 })
      },
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Error: Test error')
  })

  it('should handle errors with default error handler', async () => {
    const handler = createEdgeHandler({
      render: async () => {
        throw new Error('Something went wrong')
      },
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(response.status).toBe(500)
    expect(await response.text()).toContain('Something went wrong')
  })

  it('should handle CORS preflight', async () => {
    const handler = createEdgeHandler({
      render: async () => 'OK',
      cors: {
        origins: '*',
        methods: ['GET', 'POST'],
        headers: ['Content-Type'],
      },
    })

    const request = new Request('http://localhost/', {
      method: 'OPTIONS',
    })
    const response = await handler(request)

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })

  it('should apply CORS headers to responses', async () => {
    const handler = createEdgeHandler({
      render: async () => 'OK',
      cors: {
        origins: '*',
      },
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('should execute middleware', async () => {
    const order: number[] = []

    const handler = createEdgeHandler({
      render: async () => {
        order.push(3)
        return 'OK'
      },
      middleware: [
        async (_req, _ctx, next) => {
          order.push(1)
          const response = await next()
          order.push(4)
          return response
        },
        async (_req, _ctx, next) => {
          order.push(2)
          const response = await next()
          order.push(5)
          return response
        },
      ],
    })

    const request = new Request('http://localhost/')
    await handler(request)

    expect(order).toEqual([1, 2, 3, 5, 4])
  })

  it('should allow middleware to modify response', async () => {
    const handler = createEdgeHandler({
      render: async () => 'Original',
      middleware: [
        async (_req, _ctx, next) => {
          const response = await next()
          return new Response('Modified', response)
        },
      ],
    })

    const request = new Request('http://localhost/')
    const response = await handler(request)

    expect(await response.text()).toBe('Modified')
  })
})

describe('parseCookies', () => {
  it('should parse cookies from request', () => {
    const request = new Request('http://localhost/', {
      headers: {
        Cookie: 'name=value; other=test',
      },
    })

    const cookies = parseCookies(request)

    expect(cookies.name).toBe('value')
    expect(cookies.other).toBe('test')
  })

  it('should return empty object for no cookies', () => {
    const request = new Request('http://localhost/')
    const cookies = parseCookies(request)

    expect(cookies).toEqual({})
  })

  it('should decode URL-encoded values', () => {
    const request = new Request('http://localhost/', {
      headers: {
        Cookie: 'name=hello%20world',
      },
    })

    const cookies = parseCookies(request)
    expect(cookies.name).toBe('hello world')
  })
})

describe('jsonResponse', () => {
  it('should create JSON response', async () => {
    const response = jsonResponse({ message: 'Hello' })

    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    expect(await response.json()).toEqual({ message: 'Hello' })
  })

  it('should accept custom init options', () => {
    const response = jsonResponse({ data: 'test' }, { status: 201 })

    expect(response.status).toBe(201)
  })
})

describe('redirect', () => {
  it('should create redirect response with default 302', () => {
    const response = redirect('http://example.com')

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('http://example.com')
  })

  it('should accept custom status codes', () => {
    const response = redirect('http://example.com', 301)

    expect(response.status).toBe(301)
  })
})

describe('notFound', () => {
  it('should create 404 response', async () => {
    const response = notFound()

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Not Found')
  })

  it('should accept custom message', async () => {
    const response = notFound('Page not found')

    expect(await response.text()).toBe('Page not found')
  })
})

describe('createStreamingResponse', () => {
  it('should create streaming response', () => {
    const stream = new ReadableStream<Uint8Array>()
    const response = createStreamingResponse(stream)

    expect(response.body).toBeDefined()
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(response.headers.get('Transfer-Encoding')).toBe('chunked')
  })
})

describe('stringToStream', () => {
  it('should convert async iterable to stream', async () => {
    async function* strings() {
      yield 'Hello '
      yield 'World'
    }

    const stream = stringToStream(strings())
    const reader = stream.getReader()
    const chunks: string[] = []
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break
      chunks.push(decoder.decode(value))
    }

    expect(chunks.join('')).toBe('Hello World')
  })
})
