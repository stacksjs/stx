import { afterEach, describe, expect, test } from 'bun:test'
import {
  abortNavigation,
  clearMiddleware,
  createMiddlewareContext,
  createRouteLocation,
  defineMiddleware,
  getMiddleware,
  hasMiddleware,
  navigateTo,
  registerMiddleware,
  runMiddleware,
} from '../src/middleware'

describe('navigateTo', () => {
  test('creates redirect result', () => {
    const result = navigateTo('/login')
    expect(result.type).toBe('redirect')
    expect(result.path).toBe('/login')
    expect(result.options.redirectCode).toBe(302)
  })

  test('supports custom redirect code', () => {
    const result = navigateTo('/new-url', { redirectCode: 301, replace: true })
    expect(result.options.redirectCode).toBe(301)
    expect(result.options.replace).toBe(true)
  })
})

describe('abortNavigation', () => {
  test('creates abort result from string', () => {
    const result = abortNavigation('Not allowed')
    expect(result.type).toBe('abort')
    expect(result.error.statusCode).toBe(500)
    expect(result.error.message).toBe('Not allowed')
  })

  test('creates abort result from error object', () => {
    const result = abortNavigation({ statusCode: 403, message: 'Forbidden' })
    expect(result.error.statusCode).toBe(403)
  })
})

describe('defineMiddleware', () => {
  test('creates middleware with default mode', () => {
    const mw = defineMiddleware(() => {})
    expect(mw.mode).toBe('universal')
    expect(typeof mw.handler).toBe('function')
  })

  test('creates middleware with specified mode', () => {
    const mw = defineMiddleware(() => {}, { mode: 'server' })
    expect(mw.mode).toBe('server')
  })
})

describe('middleware registry', () => {
  afterEach(() => {
    clearMiddleware()
  })

  test('registers and retrieves middleware', () => {
    const mw = defineMiddleware(() => {})
    registerMiddleware('auth', mw)
    expect(hasMiddleware('auth')).toBe(true)
    expect(getMiddleware('auth')).toBe(mw)
  })

  test('returns undefined for unknown middleware', () => {
    expect(getMiddleware('unknown')).toBeUndefined()
    expect(hasMiddleware('unknown')).toBe(false)
  })
})

describe('runMiddleware', () => {
  afterEach(() => {
    clearMiddleware()
  })

  test('runs middleware chain and passes', async () => {
    registerMiddleware('test', defineMiddleware(() => {}))
    const to = createRouteLocation('/dashboard', {}, {})
    const ctx = createMiddlewareContext(to, null)
    const result = await runMiddleware('test', ctx)
    expect(result.passed).toBe(true)
  })

  test('stops on redirect', async () => {
    registerMiddleware('auth', defineMiddleware(() => navigateTo('/login')))
    registerMiddleware('log', defineMiddleware(() => {}))

    const to = createRouteLocation('/dashboard', {}, {})
    const ctx = createMiddlewareContext(to, null)
    const result = await runMiddleware(['auth', 'log'], ctx)

    expect(result.passed).toBe(false)
    expect(result.redirect?.path).toBe('/login')
  })

  test('stops on abort', async () => {
    registerMiddleware('guard', defineMiddleware(() =>
      abortNavigation({ statusCode: 403, message: 'Forbidden' }),
    ))

    const to = createRouteLocation('/admin', {}, {})
    const ctx = createMiddlewareContext(to, null)
    const result = await runMiddleware('guard', ctx)

    expect(result.passed).toBe(false)
    expect(result.abort?.error.statusCode).toBe(403)
  })

  test('accumulates state across middleware', async () => {
    registerMiddleware('a', defineMiddleware((ctx) => { ctx.state.a = 1 }))
    registerMiddleware('b', defineMiddleware((ctx) => { ctx.state.b = 2 }))

    const to = createRouteLocation('/', {}, {})
    const ctx = createMiddlewareContext(to, null)
    const result = await runMiddleware(['a', 'b'], ctx)

    expect(result.passed).toBe(true)
    expect(result.state).toEqual({ a: 1, b: 2 })
  })

  test('skips unknown middleware with warning', async () => {
    const to = createRouteLocation('/', {}, {})
    const ctx = createMiddlewareContext(to, null)
    const result = await runMiddleware('nonexistent', ctx)
    expect(result.passed).toBe(true)
  })
})
