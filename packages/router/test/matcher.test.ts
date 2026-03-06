import { describe, expect, test } from 'bun:test'
import { filePathToPattern, matchRoute, patternToRegex } from '../src/matcher'

describe('filePathToPattern', () => {
  const pagesDir = '/app/pages'

  test('converts index.stx to /', () => {
    expect(filePathToPattern('/app/pages/index.stx', pagesDir)).toBe('/')
  })

  test('converts about.stx to /about', () => {
    expect(filePathToPattern('/app/pages/about.stx', pagesDir)).toBe('/about')
  })

  test('converts nested index to directory path', () => {
    expect(filePathToPattern('/app/pages/chat/index.stx', pagesDir)).toBe('/chat')
  })

  test('converts [id].stx to :id dynamic param', () => {
    expect(filePathToPattern('/app/pages/posts/[id].stx', pagesDir)).toBe('/posts/:id')
  })

  test('converts [...slug].stx to :slug* catch-all', () => {
    expect(filePathToPattern('/app/pages/blog/[...slug].stx', pagesDir)).toBe('/blog/:slug*')
  })

  test('converts [[param]].stx to :param? optional', () => {
    expect(filePathToPattern('/app/pages/users/[[id]].stx', pagesDir)).toBe('/users/:id?')
  })

  test('handles .md extension', () => {
    expect(filePathToPattern('/app/pages/readme.md', pagesDir)).toBe('/readme')
  })
})

describe('patternToRegex', () => {
  test('matches static routes', () => {
    const { regex } = patternToRegex('/about')
    expect('/about'.match(regex)).toBeTruthy()
    expect('/other'.match(regex)).toBeNull()
  })

  test('extracts dynamic params', () => {
    const { regex, params } = patternToRegex('/posts/:id')
    expect(params).toEqual(['id'])
    const match = '/posts/123'.match(regex)
    expect(match).toBeTruthy()
    expect(match![1]).toBe('123')
  })

  test('handles optional params', () => {
    const { regex, params } = patternToRegex('/users/:id?')
    expect(params).toEqual(['id'])
    expect('/users'.match(regex)).toBeTruthy()
    expect('/users/42'.match(regex)).toBeTruthy()
  })

  test('handles catch-all params', () => {
    const { regex, params } = patternToRegex('/blog/:slug*')
    expect(params).toEqual(['slug'])
    const match = '/blog/2024/hello-world'.match(regex)
    expect(match).toBeTruthy()
    expect(match![1]).toBe('2024/hello-world')
  })

  test('matches root path', () => {
    const { regex } = patternToRegex('/')
    expect('/'.match(regex)).toBeTruthy()
    expect('/other'.match(regex)).toBeNull()
  })
})

describe('matchRoute', () => {
  const routes = [
    { pattern: '/', ...patternToRegex('/') },
    { pattern: '/about', ...patternToRegex('/about') },
    { pattern: '/posts/:id', ...patternToRegex('/posts/:id') },
    { pattern: '/blog/:slug*', ...patternToRegex('/blog/:slug*') },
  ]

  test('matches static route', () => {
    const result = matchRoute('/about', routes)
    expect(result).not.toBeNull()
    expect(result!.route.pattern).toBe('/about')
    expect(result!.params).toEqual({})
  })

  test('matches dynamic route with params', () => {
    const result = matchRoute('/posts/42', routes)
    expect(result).not.toBeNull()
    expect(result!.params.id).toBe('42')
  })

  test('matches catch-all route', () => {
    const result = matchRoute('/blog/2024/jan/hello', routes)
    expect(result).not.toBeNull()
    expect(result!.params.slug).toBe('2024/jan/hello')
  })

  test('returns null for unmatched paths', () => {
    const result = matchRoute('/nonexistent', routes)
    expect(result).toBeNull()
  })

  test('handles empty pathname as /', () => {
    const result = matchRoute('', routes)
    expect(result).not.toBeNull()
    expect(result!.route.pattern).toBe('/')
  })
})
