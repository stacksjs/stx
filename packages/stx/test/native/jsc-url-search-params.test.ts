/**
 * URLSearchParams on a native screen. JavaScriptCore has no web APIs, and a
 * helper shared with the web pages (a store's catalog query) built its query
 * string with this one and threw. It must answer as a browser's does.
 */
import { describe, expect, it } from 'bun:test'
import { installJSCGlobals, NativeURLSearchParams } from '../../src/native/runtime/jsc-globals'

describe('URLSearchParams in JSC', () => {
  it('encodes as a browser does', () => {
    const params = new NativeURLSearchParams()
    params.set('q', 'zone 2 & hills!')
    params.set('type', 'training_plan')
    const browser = new URLSearchParams()
    browser.set('q', 'zone 2 & hills!')
    browser.set('type', 'training_plan')
    expect(params.toString()).toBe(browser.toString())
  })

  it('reads a query string, plus and percent decoding included', () => {
    const params = new NativeURLSearchParams('?q=a+b%26c&tag=x&tag=y&empty')
    expect(params.get('q')).toBe('a b&c')
    expect(params.getAll('tag')).toEqual(['x', 'y'])
    expect(params.get('empty')).toBe('')
    expect(params.has('missing')).toBe(false)
    expect([...params.keys()]).toEqual(['q', 'tag', 'tag', 'empty'])
  })

  it('set replaces every earlier value, delete removes them', () => {
    const params = new NativeURLSearchParams([['a', '1'], ['a', '2'], ['b', '3']])
    params.set('a', 9)
    expect(params.toString()).toBe('a=9&b=3')
    params.delete('b')
    expect(params.size).toBe(1)
  })

  it('is installed for a native screen, and leaves one already there alone', () => {
    const target: Record<string, any> = { setTimeout, clearTimeout }
    installJSCGlobals(target)
    expect(new target.URLSearchParams({ x: 'y z' }).toString()).toBe('x=y+z')
    const own = class {}
    const withOwn: Record<string, any> = { setTimeout, clearTimeout, URLSearchParams: own }
    installJSCGlobals(withOwn)
    expect(withOwn.URLSearchParams).toBe(own)
  })
})
