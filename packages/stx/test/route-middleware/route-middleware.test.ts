import { describe, test, expect, beforeEach } from 'bun:test'
import {
  defineMiddleware,
  navigateTo,
  abortNavigation,
  registerMiddleware,
  clearMiddleware,
  getMiddleware,
  hasMiddleware,
  runMiddleware,
  createMiddlewareContext,
  createRouteLocation,
  createServerCookieManager,
  createClientCookieManager,
  createStorageManager,
  type MiddlewareContext,
  type RouteMiddlewareDefinition,
} from '../../src/route-middleware'

describe('Route Middleware', () => {
  beforeEach(() => {
    clearMiddleware()
  })

  describe('defineMiddleware', () => {
    test('creates middleware with default universal mode', () => {
      const middleware = defineMiddleware(async () => {})

      expect(middleware.mode).toBe('universal')
      expect(typeof middleware.handler).toBe('function')
    })

    test('creates middleware with specified mode', () => {
      const serverMiddleware = defineMiddleware(async () => {}, { mode: 'server' })
      const clientMiddleware = defineMiddleware(async () => {}, { mode: 'client' })

      expect(serverMiddleware.mode).toBe('server')
      expect(clientMiddleware.mode).toBe('client')
    })
  })

  describe('navigateTo', () => {
    test('creates redirect result with default options', () => {
      const result = navigateTo('/login')

      expect(result.type).toBe('redirect')
      expect(result.path).toBe('/login')
      expect(result.options.replace).toBe(false)
      expect(result.options.external).toBe(false)
      expect(result.options.redirectCode).toBe(302)
    })

    test('creates redirect result with custom options', () => {
      const result = navigateTo('/dashboard', {
        replace: true,
        external: true,
        redirectCode: 301,
      })

      expect(result.options.replace).toBe(true)
      expect(result.options.external).toBe(true)
      expect(result.options.redirectCode).toBe(301)
    })
  })

  describe('abortNavigation', () => {
    test('creates abort result from string', () => {
      const result = abortNavigation('Not authorized')

      expect(result.type).toBe('abort')
      expect(result.error.statusCode).toBe(500)
      expect(result.error.message).toBe('Not authorized')
    })

    test('creates abort result from error object', () => {
      const result = abortNavigation({ statusCode: 403, message: 'Forbidden' })

      expect(result.error.statusCode).toBe(403)
      expect(result.error.message).toBe('Forbidden')
    })
  })

  describe('Middleware Registry', () => {
    test('registers and retrieves middleware', () => {
      const middleware = defineMiddleware(async () => {})

      registerMiddleware('auth', middleware)

      expect(hasMiddleware('auth')).toBe(true)
      expect(getMiddleware('auth')).toBe(middleware)
    })

    test('returns undefined for unregistered middleware', () => {
      expect(hasMiddleware('nonexistent')).toBe(false)
      expect(getMiddleware('nonexistent')).toBeUndefined()
    })

    test('clears all middleware', () => {
      registerMiddleware('auth', defineMiddleware(async () => {}))
      registerMiddleware('admin', defineMiddleware(async () => {}))

      clearMiddleware()

      expect(hasMiddleware('auth')).toBe(false)
      expect(hasMiddleware('admin')).toBe(false)
    })
  })

  describe('createRouteLocation', () => {
    test('creates route location with basic path', () => {
      const location = createRouteLocation('/dashboard', {}, {})

      expect(location.path).toBe('/dashboard')
      expect(location.params).toEqual({})
      expect(location.query).toEqual({})
      expect(location.fullPath).toBe('/dashboard')
    })

    test('creates route location with params', () => {
      const location = createRouteLocation('/user/123', { id: '123' }, {})

      expect(location.path).toBe('/user/123')
      expect(location.params).toEqual({ id: '123' })
    })

    test('creates route location with query string', () => {
      const location = createRouteLocation('/search', {}, {}, 'q=test&page=1')

      expect(location.query).toEqual({ q: 'test', page: '1' })
      expect(location.fullPath).toBe('/search?q=test&page=1')
    })

    test('includes page meta', () => {
      const meta = { middleware: ['auth'], title: 'Dashboard' }
      const location = createRouteLocation('/dashboard', {}, meta)

      expect(location.meta).toEqual(meta)
    })
  })

  describe('createMiddlewareContext', () => {
    test('creates context with route information', () => {
      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)

      expect(context.to).toBe(to)
      expect(context.from).toBeNull()
      expect(context.state).toEqual({})
      expect(typeof context.cookies).toBe('object')
      expect(typeof context.storage).toBe('object')
    })

    test('creates context with previous route', () => {
      const to = createRouteLocation('/dashboard', {}, {})
      const from = createRouteLocation('/login', {}, {})
      const context = createMiddlewareContext(to, from)

      expect(context.from).toBe(from)
    })

    test('sets environment flags correctly', () => {
      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)

      // In Bun test environment with Happy DOM, window is defined
      // so isClient is true and isServer is false
      expect(typeof context.isServer).toBe('boolean')
      expect(typeof context.isClient).toBe('boolean')
      expect(context.isServer).toBe(!context.isClient)
    })
  })

  describe('runMiddleware', () => {
    test('runs middleware and passes', async () => {
      let executed = false
      const middleware = defineMiddleware(async () => {
        executed = true
      })

      registerMiddleware('test', middleware)

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('test', context)

      expect(executed).toBe(true)
      expect(result.passed).toBe(true)
    })

    test('runs multiple middleware in order', async () => {
      const order: string[] = []

      registerMiddleware('first', defineMiddleware(async () => {
        order.push('first')
      }))
      registerMiddleware('second', defineMiddleware(async () => {
        order.push('second')
      }))

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      await runMiddleware(['first', 'second'], context)

      expect(order).toEqual(['first', 'second'])
    })

    test('handles redirect from middleware', async () => {
      const middleware = defineMiddleware(async () => {
        return navigateTo('/login')
      })

      registerMiddleware('auth', middleware)

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('auth', context)

      expect(result.passed).toBe(false)
      expect(result.redirect?.path).toBe('/login')
    })

    test('handles abort from middleware', async () => {
      const middleware = defineMiddleware(async () => {
        return abortNavigation({ statusCode: 403, message: 'Forbidden' })
      })

      registerMiddleware('admin', middleware)

      const to = createRouteLocation('/admin', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('admin', context)

      expect(result.passed).toBe(false)
      expect(result.abort?.error.statusCode).toBe(403)
    })

    test('stops execution after redirect', async () => {
      const order: string[] = []

      registerMiddleware('first', defineMiddleware(async () => {
        order.push('first')
        return navigateTo('/login')
      }))
      registerMiddleware('second', defineMiddleware(async () => {
        order.push('second')
      }))

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      await runMiddleware(['first', 'second'], context)

      expect(order).toEqual(['first'])
    })

    test('accumulates state from middleware', async () => {
      registerMiddleware('state1', defineMiddleware(async (ctx) => {
        ctx.state.user = { id: 1 }
      }))
      registerMiddleware('state2', defineMiddleware(async (ctx) => {
        ctx.state.theme = 'dark'
      }))

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware(['state1', 'state2'], context)

      expect(result.state).toEqual({ user: { id: 1 }, theme: 'dark' })
    })

    test('skips server-only middleware on client', async () => {
      // This test simulates client-side by creating a custom context
      const serverMiddleware = defineMiddleware(async () => {
        throw new Error('Should not run on client')
      }, { mode: 'server' })

      registerMiddleware('serverOnly', serverMiddleware)

      const to = createRouteLocation('/dashboard', {}, {})
      // Create a client-side context manually
      const context: MiddlewareContext = {
        to,
        from: null,
        isClient: true,
        isServer: false,
        cookies: createClientCookieManager(),
        storage: createStorageManager(),
        state: {},
        responseHeaders: new Headers(),
      }

      const result = await runMiddleware('serverOnly', context)

      // Should pass because server-only middleware was skipped
      expect(result.passed).toBe(true)
    })

    test('handles middleware errors gracefully', async () => {
      const middleware = defineMiddleware(async () => {
        throw new Error('Something went wrong')
      })

      registerMiddleware('error', middleware)

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('error', context)

      expect(result.passed).toBe(false)
      expect(result.abort?.error.statusCode).toBe(500)
      expect(result.abort?.error.message).toBe('Something went wrong')
    })

    test('warns and continues for missing middleware', async () => {
      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('nonexistent', context)

      // Should pass because missing middleware is skipped with warning
      expect(result.passed).toBe(true)
    })
  })

  describe('Cookie Manager', () => {
    test('server cookie manager parses cookies from request', () => {
      const request = new Request('http://localhost/', {
        headers: {
          cookie: 'token=abc123; user=john',
        },
      })
      const responseHeaders = new Headers()
      const cookies = createServerCookieManager(request, responseHeaders)

      expect(cookies.get('token')).toBe('abc123')
      expect(cookies.get('user')).toBe('john')
      expect(cookies.get('missing')).toBeUndefined()
    })

    test('server cookie manager gets all cookies', () => {
      const request = new Request('http://localhost/', {
        headers: {
          cookie: 'a=1; b=2',
        },
      })
      const responseHeaders = new Headers()
      const cookies = createServerCookieManager(request, responseHeaders)

      expect(cookies.getAll()).toEqual({ a: '1', b: '2' })
    })

    test('server cookie manager sets cookies', () => {
      const request = new Request('http://localhost/')
      const responseHeaders = new Headers()
      const cookies = createServerCookieManager(request, responseHeaders)

      cookies.set('newToken', 'xyz789', { httpOnly: true, path: '/' })

      const setCookie = responseHeaders.get('Set-Cookie')
      expect(setCookie).toContain('newToken=xyz789')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('Path=/')
    })

    test('server cookie manager deletes cookies', () => {
      const request = new Request('http://localhost/', {
        headers: {
          cookie: 'token=abc123',
        },
      })
      const responseHeaders = new Headers()
      const cookies = createServerCookieManager(request, responseHeaders)

      cookies.delete('token')

      const setCookie = responseHeaders.get('Set-Cookie')
      expect(setCookie).toContain('token=')
      expect(setCookie).toContain('Expires=')
    })
  })

  describe('Storage Manager', () => {
    test('provides storage interface', () => {
      const storage = createStorageManager()

      // In Bun test environment with Happy DOM, localStorage is available
      expect(typeof storage.isAvailable).toBe('function')
      expect(typeof storage.get).toBe('function')
      expect(typeof storage.set).toBe('function')
      expect(typeof storage.remove).toBe('function')
    })

    test('can store and retrieve values when available', () => {
      const storage = createStorageManager()

      if (storage.isAvailable()) {
        storage.set('testKey', 'testValue')
        expect(storage.get('testKey')).toBe('testValue')
        storage.remove('testKey')
        expect(storage.get('testKey')).toBeNull()
      }
    })
  })

  describe('Async Middleware', () => {
    test('supports async operations in middleware', async () => {
      const middleware = defineMiddleware(async (ctx) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        ctx.state.asyncResult = 'completed'
      })

      registerMiddleware('async', middleware)

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('async', context)

      expect(result.passed).toBe(true)
      expect(result.state.asyncResult).toBe('completed')
    })

    test('handles async errors', async () => {
      const middleware = defineMiddleware(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        throw new Error('Async error')
      })

      registerMiddleware('asyncError', middleware)

      const to = createRouteLocation('/dashboard', {}, {})
      const context = createMiddlewareContext(to, null)
      const result = await runMiddleware('asyncError', context)

      expect(result.passed).toBe(false)
      expect(result.abort?.error.message).toBe('Async error')
    })
  })

  describe('Context Access', () => {
    test('middleware can access route params', async () => {
      let capturedParams: Record<string, string> = {}

      const middleware = defineMiddleware(async (ctx) => {
        capturedParams = ctx.to.params
      })

      registerMiddleware('params', middleware)

      const to = createRouteLocation('/user/123', { id: '123', name: 'test' }, {})
      const context = createMiddlewareContext(to, null)
      await runMiddleware('params', context)

      expect(capturedParams).toEqual({ id: '123', name: 'test' })
    })

    test('middleware can access query params', async () => {
      let capturedQuery: Record<string, string> = {}

      const middleware = defineMiddleware(async (ctx) => {
        capturedQuery = ctx.to.query
      })

      registerMiddleware('query', middleware)

      const to = createRouteLocation('/search', {}, {}, 'q=test&page=2')
      const context = createMiddlewareContext(to, null)
      await runMiddleware('query', context)

      expect(capturedQuery).toEqual({ q: 'test', page: '2' })
    })

    test('middleware can access cookies via server cookie manager', async () => {
      let capturedToken: string | undefined

      const middleware = defineMiddleware(async (ctx) => {
        capturedToken = ctx.cookies.get('auth_token')
        if (!capturedToken) {
          return navigateTo('/login')
        }
      })

      registerMiddleware('auth', middleware)

      // Create a context with server cookie manager directly for testing
      const request = new Request('http://localhost/', {
        headers: {
          cookie: 'auth_token=secret123',
        },
      })
      const to = createRouteLocation('/dashboard', {}, {})
      const responseHeaders = new Headers()

      // Directly create context with server cookie manager to test cookie functionality
      const context: MiddlewareContext = {
        to,
        from: null,
        isClient: false,
        isServer: true,
        cookies: createServerCookieManager(request, responseHeaders),
        storage: createStorageManager(),
        state: {},
        request,
        responseHeaders,
      }

      const result = await runMiddleware('auth', context)

      expect(capturedToken).toBe('secret123')
      expect(result.passed).toBe(true)
    })
  })
})
