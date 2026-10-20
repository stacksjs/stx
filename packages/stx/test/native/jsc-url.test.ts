/**
 * URL on a native screen. JavaScriptCore has no web APIs, and sign-in code
 * shared with the web pages (an authorize URL's query, the address a sign-in
 * sheet came back to) built and read addresses with it, and threw. Each case
 * is checked against Bun's own URL, which follows the URL standard.
 */
import { describe, expect, it } from 'bun:test'
import { runInNewContext } from 'node:vm'
import { installJSCGlobals, NativeURL } from '../../src/native/runtime/jsc-globals'

const FIELDS = ['href', 'protocol', 'username', 'password', 'host', 'hostname', 'port', 'pathname', 'search', 'hash', 'origin'] as const

function same(input: string, base?: string) {
  const ours = new NativeURL(input, base)
  const theirs = new URL(input, base)
  for (const field of FIELDS) expect([field, ours[field]]).toEqual([field, theirs[field]])
}

describe('URL in JSC', () => {
  it('parses absolute addresses as a browser does', () => {
    for (const input of [
      'https://hq.training/api/auth/social/google?next=%2Fm&remember=1#top',
      'HTTPS://User:Pa%20ss@HQ.Training:443/a/./b/../c?q=a b',
      'http://localhost:3008/m/login',
      'https://example.com',
      'https://[::1]:8443/x',
      'hqtraining://m/login?social=1&next=%2Fm#stx_session=abc',
      'mailto:pawel@hq.training?subject=Hi',
      'file:///Users/chris/a.txt',
      'https://hq.training/café?q=ü',
    ]) same(input)
  })

  it('resolves relative addresses against a base', () => {
    const base = 'https://hq.training/m/store/item?x=1#h'
    for (const input of ['/api/og', 'other', '../up', '?y=2', '#frag', '', '//cdn.example.com/a.png', 'https:relative', './a/../b'])
      same(input, base)
    same('/m', 'hqtraining://m/login?x=1')
    same('sub', 'hqtraining://m/login/')
  })

  it('refuses what a browser refuses', () => {
    for (const [input, base] of [['nope'], ['https://'], ['https://a:99999/'], ['http://a b/'], ['x', 'mailto:a@b']] as Array<[string, string?]>) {
      expect(() => new URL(input, base)).toThrow()
      expect(() => new NativeURL(input, base)).toThrow(TypeError)
    }
    expect(NativeURL.canParse('https://hq.training')).toBe(true)
    expect(NativeURL.canParse('hq.training')).toBe(false)
    expect(NativeURL.parse('hq.training')).toBeNull()
    expect(NativeURL.parse('/m', 'https://hq.training')?.href).toBe('https://hq.training/m')
  })

  it('keeps searchParams and the address in step, both ways', () => {
    const url = new NativeURL('https://hq.training/api/auth/social/google?next=%2Fm')
    url.searchParams.set('app', 'abc 123')
    url.searchParams.append('remember', '1')
    expect(url.href).toBe('https://hq.training/api/auth/social/google?next=%2Fm&app=abc+123&remember=1')
    url.search = '?only=1'
    expect(url.searchParams.get('only')).toBe('1')
    expect(url.searchParams.get('app')).toBeNull()
    url.searchParams.delete('only')
    expect(url.href).toBe('https://hq.training/api/auth/social/google')
  })

  it('changes parts with its setters', () => {
    const ours = new NativeURL('https://hq.training/a?b=1#c')
    const theirs = new URL('https://hq.training/a?b=1#c')
    for (const url of [ours, theirs]) {
      url.pathname = '/x y'
      url.hash = 'top'
      url.port = '8443'
      url.hostname = 'Staging.HQ.training'
    }
    for (const field of FIELDS) expect([field, ours[field]]).toEqual([field, theirs[field]])
    expect(String(ours)).toBe(theirs.href)
    expect(JSON.stringify({ ours })).toBe(JSON.stringify({ ours: theirs }))
  })

  it('replaces native-host diagnostic constructors with working URL and UTF-8 APIs', () => {
    // Craft installs diagnostics before the shared runtime. These throw
    // ReferenceError instead of leaving the web API absent, in another realm.
    const unavailable = runInNewContext('(function () { throw new ReferenceError("Web API is not available on a native screen") })')
    const target: Record<string, any> = { setTimeout, clearTimeout, URL: unavailable, URLSearchParams: unavailable, TextEncoder: unavailable }
    installJSCGlobals(target)
    expect(new target.URL('/api/exercise-videos/demo.mp4', 'https://hq.training/api').href).toBe('https://hq.training/api/exercise-videos/demo.mp4')
    expect(new target.URLSearchParams({ exercise: 'side bends' }).toString()).toBe('exercise=side+bends')
    expect(Array.from(new target.TextEncoder().encode('Grüße'))).toEqual(Array.from(new TextEncoder().encode('Grüße')))
    expect(new target.TextDecoder().decode(new target.TextEncoder().encode('HQ ✓'))).toBe('HQ ✓')
  })

  it('preserves host constructors with their own validation errors', () => {
    const existing = class { constructor() { throw new TypeError('host validation') } }
    const target: Record<string, any> = { setTimeout, clearTimeout, URL: existing }
    installJSCGlobals(target)
    expect(target.URL).toBe(existing)
    expect(() => new target.URL()).toThrow('host validation')
  })

  it('is installed for a native screen, and leaves one already there alone', () => {
    const target: Record<string, any> = { setTimeout, clearTimeout }
    installJSCGlobals(target)
    expect(new target.URL('/m', 'https://hq.training').href).toBe('https://hq.training/m')
    const existing = class {}
    const host: Record<string, any> = { setTimeout, clearTimeout, URL: existing }
    installJSCGlobals(host)
    expect(host.URL).toBe(existing)
  })
})
