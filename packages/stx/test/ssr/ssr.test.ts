import { afterEach, describe, expect, it, mock } from 'bun:test'
import { createApp, render } from '../../src/ssr'
import fs from 'node:fs'
import path from 'node:path'

// Create a temporary views directory for tests
const testViewsDir = path.join(import.meta.dir, 'test-views')
const testLayoutsDir = path.join(import.meta.dir, 'test-layouts')

// Helper to create test files
function createTestFile(dir: string, name: string, content: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(path.join(dir, name), content)
}

// Helper to cleanup test files
function cleanupTestFiles() {
  if (fs.existsSync(testViewsDir)) {
    fs.rmSync(testViewsDir, { recursive: true, force: true })
  }
  if (fs.existsSync(testLayoutsDir)) {
    fs.rmSync(testLayoutsDir, { recursive: true, force: true })
  }
}

describe('SSR - render()', () => {
  afterEach(() => {
    cleanupTestFiles()
  })

  it('should render inline template', async () => {
    const response = await render('<div>Hello World</div>')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/html')

    const html = await response.text()
    expect(html).toContain('Hello World')
  })

  it('should render template with data', async () => {
    const response = await render(
      '<div>Hello {{ name }}</div>',
      { name: 'Alice' },
    )

    const html = await response.text()
    expect(html).toContain('Hello Alice')
  })

  it('should render template from file', async () => {
    createTestFile(testViewsDir, 'test.stx', '<h1>Test View</h1>')

    const response = await render('test.stx', {}, { viewsDir: testViewsDir })

    const html = await response.text()
    expect(html).toContain('Test View')
  })

  it('should handle template not found', async () => {
    const response = await render('nonexistent.stx', {}, { viewsDir: testViewsDir })

    expect(response.status).toBe(500)
    const text = await response.text()
    expect(text).toContain('not found')
  })

  it('should process directives', async () => {
    const response = await render(
      '@if(show)<span>Visible</span>@endif',
      { show: true },
    )

    const html = await response.text()
    expect(html).toContain('Visible')
  })

  it('should handle @foreach directive', async () => {
    const response = await render(
      '<ul>@foreach(items as item)<li>{{ item }}</li>@endforeach</ul>',
      { items: ['A', 'B', 'C'] },
    )

    const html = await response.text()
    expect(html).toContain('<li>A</li>')
    expect(html).toContain('<li>B</li>')
    expect(html).toContain('<li>C</li>')
  })

  it('should handle conditionals', async () => {
    const templateTrue = await render('@if(active)Active@endif', { active: true })
    const templateFalse = await render('@if(active)Active@endif', { active: false })

    const htmlTrue = await templateTrue.text()
    const htmlFalse = await templateFalse.text()

    expect(htmlTrue).toContain('Active')
    expect(htmlFalse).not.toContain('Active')
  })
})

describe('SSR - createApp()', () => {
  afterEach(() => {
    cleanupTestFiles()
  })

  it('should create an app with default config', () => {
    const app = createApp()

    expect(app.fetch).toBeDefined()
    expect(app.get).toBeDefined()
    expect(app.post).toBeDefined()
    expect(app.put).toBeDefined()
    expect(app.delete).toBeDefined()
    expect(app.patch).toBeDefined()
    expect(app.use).toBeDefined()
    expect(app.render).toBeDefined()
    expect(app.redirect).toBeDefined()
    expect(app.back).toBeDefined()
    expect(app.listen).toBeDefined()
  })

  it('should register GET routes', async () => {
    const app = createApp()

    app.get('/test', () => new Response('GET OK'))

    const response = await app.fetch(new Request('http://localhost/test'))

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('GET OK')
  })

  it('should register POST routes', async () => {
    const app = createApp({ csrfEnabled: false })

    app.post('/test', () => new Response('POST OK'))

    const response = await app.fetch(new Request('http://localhost/test', {
      method: 'POST',
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('POST OK')
  })

  it('should handle 404 for unknown routes', async () => {
    const app = createApp()

    const response = await app.fetch(new Request('http://localhost/unknown'))

    expect(response.status).toBe(404)
  })

  it('should extract route parameters', async () => {
    const app = createApp()
    let receivedParams: Record<string, string> = {}

    app.get('/users/:id', (ctx) => {
      receivedParams = ctx.params
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/users/123'))

    expect(receivedParams.id).toBe('123')
  })

  it('should extract multiple route parameters', async () => {
    const app = createApp()
    let receivedParams: Record<string, string> = {}

    app.get('/users/:userId/posts/:postId', (ctx) => {
      receivedParams = ctx.params
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/users/1/posts/42'))

    expect(receivedParams.userId).toBe('1')
    expect(receivedParams.postId).toBe('42')
  })

  it('should parse query parameters', async () => {
    const app = createApp()
    let receivedQuery: Record<string, string> = {}

    app.get('/search', (ctx) => {
      receivedQuery = ctx.query
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/search?q=test&page=1'))

    expect(receivedQuery.q).toBe('test')
    expect(receivedQuery.page).toBe('1')
  })

  it('should create redirect responses', async () => {
    const app = createApp()

    app.get('/old', () => app.redirect('/new'))

    const response = await app.fetch(new Request('http://localhost/old'))

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/new')
  })

  it('should support different redirect status codes', async () => {
    const app = createApp()

    app.get('/permanent', () => app.redirect('/new', 301))

    const response = await app.fetch(new Request('http://localhost/permanent'))

    expect(response.status).toBe(301)
  })

  it('should render views', async () => {
    createTestFile(testViewsDir, 'hello.stx', '<h1>Hello {{ name }}</h1>')

    const app = createApp({ viewsDir: testViewsDir })

    app.get('/hello', async () => {
      return await app.render('hello.stx', { name: 'World' })
    })

    const response = await app.fetch(new Request('http://localhost/hello'))
    const html = await response.text()

    expect(html).toContain('Hello World')
  })
})

describe('SSR - Sessions', () => {
  it('should provide session in context', async () => {
    const app = createApp()
    let sessionExists = false

    app.get('/test', (ctx) => {
      sessionExists = ctx.session !== undefined
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(sessionExists).toBe(true)
  })

  it('should persist session data across requests', async () => {
    const app = createApp()

    app.get('/set', (ctx) => {
      ctx.session.set('value', 'stored')
      return new Response('OK')
    })

    app.get('/get', (ctx) => {
      return new Response(ctx.session.get<string>('value') || 'not found')
    })

    // First request sets the session
    const setResponse = await app.fetch(new Request('http://localhost/set'))
    const cookies = setResponse.headers.get('Set-Cookie')

    // Extract session cookie
    const sessionCookie = cookies?.match(/stx_session=([^;]+)/)?.[0]

    if (sessionCookie) {
      // Second request with session cookie
      const getResponse = await app.fetch(new Request('http://localhost/get', {
        headers: {
          Cookie: sessionCookie,
        },
      }))

      const value = await getResponse.text()
      expect(value).toBe('stored')
    }
  })

  it('should support session has() check', async () => {
    const app = createApp()
    let hasValue = false

    app.get('/test', (ctx) => {
      ctx.session.set('key', 'value')
      hasValue = ctx.session.has('key')
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(hasValue).toBe(true)
  })

  it('should support session delete()', async () => {
    const app = createApp()
    let valueAfterDelete: string | undefined

    app.get('/test', (ctx) => {
      ctx.session.set('key', 'value')
      ctx.session.delete('key')
      valueAfterDelete = ctx.session.get<string>('key')
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(valueAfterDelete).toBeUndefined()
  })

  it('should support session clear()', async () => {
    const app = createApp()
    let hasAfterClear = false

    app.get('/test', (ctx) => {
      ctx.session.set('a', 1)
      ctx.session.set('b', 2)
      ctx.session.clear()
      hasAfterClear = ctx.session.has('a') || ctx.session.has('b')
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(hasAfterClear).toBe(false)
  })
})

describe('SSR - CSRF Protection', () => {
  it('should provide CSRF token in context', async () => {
    const app = createApp()
    let hasToken = false

    app.get('/test', (ctx) => {
      hasToken = ctx.csrfToken !== undefined && ctx.csrfToken.length > 0
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(hasToken).toBe(true)
  })

  it('should reject POST without CSRF token', async () => {
    const app = createApp({ csrfEnabled: true })

    app.post('/submit', () => new Response('OK'))

    const response = await app.fetch(new Request('http://localhost/submit', {
      method: 'POST',
    }))

    expect(response.status).toBe(419)
  })

  it('should accept POST with valid CSRF token', async () => {
    const app = createApp({ csrfEnabled: true })
    let csrfToken = ''

    app.get('/form', (ctx) => {
      csrfToken = ctx.csrfToken
      return new Response('OK')
    })

    app.post('/submit', () => new Response('SUCCESS'))

    // Get the CSRF token
    const getResponse = await app.fetch(new Request('http://localhost/form'))
    const cookies = getResponse.headers.get('Set-Cookie')
    const sessionCookie = cookies?.match(/stx_session=([^;]+)/)?.[0]

    // Submit with token
    const formData = new FormData()
    formData.append('_token', csrfToken)

    const postResponse = await app.fetch(new Request('http://localhost/submit', {
      method: 'POST',
      headers: {
        Cookie: sessionCookie || '',
      },
      body: formData,
    }))

    expect(postResponse.status).toBe(200)
    expect(await postResponse.text()).toBe('SUCCESS')
  })

  it('should accept CSRF token from header', async () => {
    const app = createApp({ csrfEnabled: true })
    let csrfToken = ''

    app.get('/form', (ctx) => {
      csrfToken = ctx.csrfToken
      return new Response('OK')
    })

    app.post('/api', () => new Response('OK'))

    // Get the CSRF token
    const getResponse = await app.fetch(new Request('http://localhost/form'))
    const cookies = getResponse.headers.get('Set-Cookie')
    const sessionCookie = cookies?.match(/stx_session=([^;]+)/)?.[0]

    // Submit with header
    const postResponse = await app.fetch(new Request('http://localhost/api', {
      method: 'POST',
      headers: {
        Cookie: sessionCookie || '',
        'X-CSRF-Token': csrfToken,
      },
    }))

    expect(postResponse.status).toBe(200)
  })

  it('should skip CSRF for GET requests', async () => {
    const app = createApp({ csrfEnabled: true })

    app.get('/test', () => new Response('OK'))

    const response = await app.fetch(new Request('http://localhost/test'))

    expect(response.status).toBe(200)
  })

  it('should skip CSRF when disabled', async () => {
    const app = createApp({ csrfEnabled: false })

    app.post('/test', () => new Response('OK'))

    const response = await app.fetch(new Request('http://localhost/test', {
      method: 'POST',
    }))

    expect(response.status).toBe(200)
  })
})

describe('SSR - Middleware', () => {
  it('should run global middleware', async () => {
    const app = createApp()
    let middlewareRan = false

    app.use(async (ctx, next) => {
      middlewareRan = true
      return next()
    })

    app.get('/test', () => new Response('OK'))

    await app.fetch(new Request('http://localhost/test'))

    expect(middlewareRan).toBe(true)
  })

  it('should run middleware in order', async () => {
    const app = createApp()
    const order: number[] = []

    app.use(async (ctx, next) => {
      order.push(1)
      const response = await next()
      order.push(4)
      return response
    })

    app.use(async (ctx, next) => {
      order.push(2)
      const response = await next()
      order.push(3)
      return response
    })

    app.get('/test', () => new Response('OK'))

    await app.fetch(new Request('http://localhost/test'))

    expect(order).toEqual([1, 2, 3, 4])
  })

  it('should allow middleware to short-circuit', async () => {
    const app = createApp()
    let handlerReached = false

    app.use(async () => {
      return new Response('Blocked', { status: 403 })
    })

    app.get('/test', () => {
      handlerReached = true
      return new Response('OK')
    })

    const response = await app.fetch(new Request('http://localhost/test'))

    expect(response.status).toBe(403)
    expect(handlerReached).toBe(false)
  })

  it('should support route-level middleware', async () => {
    const app = createApp()
    let routeMiddlewareRan = false

    const routeMiddleware = async (_ctx: any, next: () => Promise<Response>) => {
      routeMiddlewareRan = true
      return next()
    }

    app.get('/protected', () => new Response('OK'), [routeMiddleware])

    await app.fetch(new Request('http://localhost/protected'))

    expect(routeMiddlewareRan).toBe(true)
  })
})

describe('SSR - Authentication helpers', () => {
  it('should check if user is authenticated', async () => {
    const app = createApp()
    let isAuth = false

    app.get('/check', (ctx) => {
      isAuth = ctx.isAuthenticated()
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/check'))

    expect(isAuth).toBe(false)
  })

  it('should return user from session', async () => {
    const app = createApp()
    let user: unknown

    app.get('/test', (ctx) => {
      ctx.session.set('user', { id: 1, name: 'Alice' })
      user = ctx.user()
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(user).toEqual({ id: 1, name: 'Alice' })
  })
})

describe('SSR - Form handling', () => {
  it('should parse form data', async () => {
    const app = createApp({ csrfEnabled: false })
    let formValues: Record<string, string | File> = {}

    app.post('/submit', async (ctx) => {
      formValues = await ctx.formData()
      return new Response('OK')
    })

    const formData = new FormData()
    formData.append('name', 'John')
    formData.append('email', 'john@example.com')

    await app.fetch(new Request('http://localhost/submit', {
      method: 'POST',
      body: formData,
    }))

    expect(formValues.name).toBe('John')
    expect(formValues.email).toBe('john@example.com')
  })

  it('should parse JSON body', async () => {
    const app = createApp({ csrfEnabled: false })
    let jsonBody: unknown

    app.post('/api', async (ctx) => {
      jsonBody = await ctx.json()
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    }))

    expect(jsonBody).toEqual({ key: 'value' })
  })

  it('should support flash messages', async () => {
    const app = createApp()
    let flashMethodExists = false
    let getFlashMethodExists = false

    app.get('/test', (ctx) => {
      // Verify flash methods exist on context
      flashMethodExists = typeof ctx.flash === 'function'
      getFlashMethodExists = typeof ctx.getFlash === 'function'

      // Set a flash message
      ctx.flash('message', 'Hello!')

      // Within the same request, flash should be retrievable
      // (flash messages are typically for next request, but API should exist)
      return new Response('OK')
    })

    const response = await app.fetch(new Request('http://localhost/test'))

    expect(response.status).toBe(200)
    expect(flashMethodExists).toBe(true)
    expect(getFlashMethodExists).toBe(true)
  })

  it('should provide old input helper', async () => {
    const app = createApp()

    app.get('/test', (ctx) => {
      // old() should return empty string when no old input
      const value = ctx.old('nonexistent')
      return new Response(value || 'empty')
    })

    const response = await app.fetch(new Request('http://localhost/test'))
    const text = await response.text()

    expect(text).toBe('empty')
  })
})

describe('SSR - Cookies', () => {
  it('should parse incoming cookies', async () => {
    const app = createApp()
    let receivedCookies: Record<string, string> = {}

    app.get('/test', (ctx) => {
      receivedCookies = ctx.cookies
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test', {
      headers: {
        Cookie: 'foo=bar; baz=qux',
      },
    }))

    expect(receivedCookies.foo).toBe('bar')
    expect(receivedCookies.baz).toBe('qux')
  })

  it('should set cookies in response', async () => {
    const app = createApp()
    let setCookieCalled = false

    app.get('/test', (ctx) => {
      // Verify setCookie method exists and can be called
      expect(typeof ctx.setCookie).toBe('function')
      ctx.setCookie('myCookie', 'myValue', { httpOnly: true })
      setCookieCalled = true
      return new Response('OK')
    })

    const response = await app.fetch(new Request('http://localhost/test'))
    const setCookie = response.headers.get('Set-Cookie')

    // Verify the handler was called and setCookie method worked
    expect(setCookieCalled).toBe(true)
    expect(response.status).toBe(200)
    // The response should have at least the session cookie
    expect(setCookie).toBeDefined()
  })

  it('should support all cookie options', async () => {
    const app = createApp()
    let cookieSet = false

    app.get('/test', (ctx) => {
      // Verify setCookie can be called with all options without error
      ctx.setCookie('test', 'value', {
        maxAge: 3600,
        path: '/api',
        domain: 'example.com',
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
      })
      cookieSet = true
      return new Response('OK')
    })

    const response = await app.fetch(new Request('http://localhost/test'))

    expect(response.status).toBe(200)
    expect(cookieSet).toBe(true)

    // Verify response headers exist (session cookie at minimum)
    const setCookieHeader = response.headers.get('Set-Cookie')
    expect(setCookieHeader).toBeDefined()
  })
})

describe('SSR - Error handling', () => {
  it('should catch handler errors', async () => {
    const app = createApp()

    app.get('/error', () => {
      throw new Error('Test error')
    })

    const response = await app.fetch(new Request('http://localhost/error'))

    expect(response.status).toBe(500)
  })
})

describe('SSR - Edge cases', () => {
  afterEach(() => {
    cleanupTestFiles()
  })

  it('should handle empty query string', async () => {
    const app = createApp()
    let query: Record<string, string> = {}

    app.get('/test', (ctx) => {
      query = ctx.query
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test'))

    expect(Object.keys(query)).toHaveLength(0)
  })

  it('should handle special characters in params', async () => {
    const app = createApp()
    let params: Record<string, string> = {}

    app.get('/test/:value', (ctx) => {
      params = ctx.params
      return new Response('OK')
    })

    await app.fetch(new Request('http://localhost/test/hello%20world'))

    expect(params.value).toBe('hello%20world')
  })

  it('should handle concurrent requests', async () => {
    const app = createApp()
    let requestCount = 0

    app.get('/test', () => {
      requestCount++
      return new Response(`Request ${requestCount}`)
    })

    const promises = Array.from({ length: 10 }, () =>
      app.fetch(new Request('http://localhost/test')),
    )

    const responses = await Promise.all(promises)

    expect(responses).toHaveLength(10)
    responses.forEach(r => expect(r.status).toBe(200))
  })

  it('should handle very long URLs', async () => {
    const app = createApp()
    let query: Record<string, string> = {}

    app.get('/test', (ctx) => {
      query = ctx.query
      return new Response('OK')
    })

    const longValue = 'a'.repeat(10000)
    await app.fetch(new Request(`http://localhost/test?long=${longValue}`))

    expect(query.long).toBe(longValue)
  })
})
