import { afterEach, describe, expect, test } from 'bun:test'
import { defineRoute, defineRoutes, resetRoutes, route, setAppUrl } from '../src/named-routes'

describe('named routes', () => {
  afterEach(() => {
    resetRoutes()
  })

  test('defines and resolves a named route', () => {
    defineRoute('home', '/')
    expect(route('home')).toBe('/')
  })

  test('substitutes parameters', () => {
    defineRoute('post', '/posts/:id')
    expect(route('post', { id: '42' })).toBe('/posts/42')
  })

  test('adds extra params as query string', () => {
    defineRoute('search', '/search')
    expect(route('search', { q: 'hello' })).toBe('/search?q=hello')
  })

  test('returns #undefined-route for unknown names', () => {
    expect(route('unknown')).toBe('#undefined-route')
  })

  test('supports absolute URLs', () => {
    setAppUrl('https://example.com')
    defineRoute('about', '/about')
    expect(route('about', {}, true)).toBe('https://example.com/about')
  })

  test('defineRoutes registers multiple routes', () => {
    defineRoutes({
      home: '/',
      about: '/about',
      contact: { path: '/contact', params: { ref: 'nav' } },
    })

    expect(route('home')).toBe('/')
    expect(route('about')).toBe('/about')
    expect(route('contact')).toBe('/contact?ref=nav')
  })

  test('encodes parameter values', () => {
    defineRoute('user', '/users/:name')
    expect(route('user', { name: 'hello world' })).toBe('/users/hello%20world')
  })
})
