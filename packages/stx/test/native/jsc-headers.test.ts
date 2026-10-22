/**
 * Headers on a native screen. JavaScriptCore has no web APIs, and a web view
 * drawn natively that sends a request with a bearer token (an app's auth
 * store: `new Headers(options.headers)`, then `headers.set('Authorization',
 * ...)`) threw "Headers is not defined" before it asked anything. It must
 * answer as a browser's does, and native fetch must send what it holds.
 */
import { describe, expect, it } from 'bun:test'
import { installJSCGlobals, NativeHeaders } from '../../src/native/runtime/jsc-globals'

describe('Headers in JSC', () => {
  it('folds names to lower case and joins repeated values, as a browser does', () => {
    const headers = new NativeHeaders({ Accept: 'application/json' })
    headers.append('X-Tag', 'a')
    headers.append('x-tag', 'b')
    const browser = new Headers({ Accept: 'application/json' })
    browser.append('X-Tag', 'a')
    browser.append('x-tag', 'b')
    expect([...headers.entries()]).toEqual([...browser.entries()])
    expect(headers.get('ACCEPT')).toBe('application/json')
    expect(headers.get('missing')).toBeNull()
  })

  it('set replaces, delete removes, has answers', () => {
    const headers = new NativeHeaders([['Content-Type', 'text/plain']])
    headers.set('content-type', 'application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.has('Content-Type')).toBe(true)
    headers.delete('CONTENT-TYPE')
    expect(headers.has('content-type')).toBe(false)
  })

  it('copies another Headers, and iterates in name order', () => {
    const first = new NativeHeaders({ b: '2', a: '1' })
    const copy = new NativeHeaders(first)
    copy.set('c', '3')
    expect([...copy]).toEqual([['a', '1'], ['b', '2'], ['c', '3']])
    expect([...first.keys()]).toEqual(['a', 'b'])
    const seen: string[] = []
    copy.forEach((value, name) => seen.push(`${name}=${value}`))
    expect(seen).toEqual(['a=1', 'b=2', 'c=3'])
  })

  it('is installed for a native screen, and leaves one already there alone', () => {
    const target: Record<string, any> = { setTimeout, clearTimeout }
    installJSCGlobals(target)
    const headers = new target.Headers({ Accept: 'application/json' })
    headers.set('Authorization', 'Bearer t')
    expect(headers.get('authorization')).toBe('Bearer t')
    class Own {}
    const host: Record<string, any> = { setTimeout, clearTimeout, Headers: Own }
    installJSCGlobals(host)
    expect(host.Headers).toBe(Own)
  })
})

describe('a web view\'s request with Headers, drawn natively', () => {
  it('sends the headers it built, the bearer token included, and reads the answer\'s', async () => {
    const { mountWebView, webApp } = await import('./web-view-app')
    const root = webApp({
      'views/gear.stx': `<script client>
  const answer = state('')
  async function load() {
    const headers = new Headers({ Accept: 'application/json' })
    headers.set('Authorization', 'Bearer fixture')
    const res = await fetch('https://fixture.invalid/api/gear', { headers })
    answer.set((await res.json()).name + ' as ' + res.headers.get('Content-Type'))
  }
  onMount(() => { void load() })
</script>
<p :text="answer">-</p>
`,
    })
    const seen: Array<Record<string, string>> = []
    const phone = await mountWebView(root, { Gear: 'views/gear.stx' }, 'Gear', {
      apiBase: 'https://fixture.invalid/api',
      api: (path, init) => {
        seen.push({ path, ...init.headers })
        return { name: 'Bands' }
      },
    })
    await phone.settle(10)
    // The kit answers as Craft's fetch does: with headers to read.
    expect(phone.texts()).toContain('Bands as application/json')
    expect(seen).toEqual([{ path: '/gear', accept: 'application/json', authorization: 'Bearer fixture' }])
  })
})
