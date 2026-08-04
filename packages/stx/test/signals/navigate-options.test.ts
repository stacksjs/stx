/**
 * `navigate(url, options)` (stacksjs/stx#1807).
 *
 * The ambient declaration promised `{ replace?: boolean }`. The runtime took a
 * bare `forceReload` boolean. `{ replace: true }` is a truthy object, so the one
 * call the type system invited took the reload branch and did
 * `location.href = url` — a full document load that PUSHES a history entry.
 * The opposite of replace, at the cost of the SPA router, with no error.
 *
 * `replace` was never implementable from the runtime alone: the router's
 * history writes were hardcoded to `pushState` at all three sites. So this is
 * fixed on both sides — the runtime forwards the option, the router honours it.
 *
 * The legacy positional boolean still means "full reload", because that is what
 * actually shipped and docs still show it. It is deliberately kept OUT of the
 * declared type, so nothing that type-checks today changes meaning.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

let hrefWrites: string[] = []
let replaceCalls: string[] = []
let routerCalls: Array<[string, unknown]> = []
let realWindow: any
let stx: any

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realWindow = g.window
  stx = g.window.stx
})

/**
 * Swap the whole `window`, not `window.location`.
 *
 * very-happy-dom's `window.location` setter MERGES the assigned object into the
 * real Location rather than replacing it, so an accessor for `href` is read
 * (not installed) and the write lands on the real location — a stub built that
 * way silently records nothing. `navigate` resolves `window` from the scope
 * chain at call time, so replacing the global outright is both simpler and
 * actually effective.
 */
beforeEach(() => {
  hrefWrites = []
  replaceCalls = []
  routerCalls = []
  g.window = {
    stx,
    location: {
      get href() { return 'http://localhost/current' },
      set href(v: string) { hrefWrites.push(v) },
      replace: (url: string) => { replaceCalls.push(url) },
      pathname: '/current',
      search: '',
      origin: 'http://localhost',
      protocol: 'http:',
    },
  }
})

afterEach(() => {
  g.window = realWindow
})

function withRouter() {
  g.window.stxRouter = {
    navigate: (url: string, options: unknown) => { routerCalls.push([url, options]) },
  }
}

describe('navigate options', () => {
  it('routes through the SPA router by default', () => {
    withRouter()
    stx.navigate('/dashboard')

    expect(routerCalls).toEqual([['/dashboard', { replace: false }]])
    expect(hrefWrites).toEqual([])
  })

  it('forwards replace to the router instead of doing a full load', () => {
    // The exact call the declaration invited, which previously did the opposite.
    withRouter()
    stx.navigate('/dashboard', { replace: true })

    expect(routerCalls).toEqual([['/dashboard', { replace: true }]])
    expect(hrefWrites).toEqual([])
    expect(replaceCalls).toEqual([])
  })

  it('does a full load for reload: true', () => {
    withRouter()
    stx.navigate('/legacy', { reload: true })

    expect(routerCalls).toEqual([])
    expect(hrefWrites).toEqual(['/legacy'])
  })

  it('uses location.replace when both replace and reload are set', () => {
    // No router involved, so the history semantics have to come from the
    // location API — href would push, replace replaces.
    withRouter()
    stx.navigate('/legacy', { replace: true, reload: true })

    expect(routerCalls).toEqual([])
    expect(replaceCalls).toEqual(['/legacy'])
    expect(hrefWrites).toEqual([])
  })

  it('still treats a bare boolean as forceReload', () => {
    // Back-compat with the shape that actually shipped.
    withRouter()
    stx.navigate('/legacy', true)

    expect(routerCalls).toEqual([])
    expect(hrefWrites).toEqual(['/legacy'])
  })

  it('treats a bare false as "use the router"', () => {
    withRouter()
    stx.navigate('/a', false)

    expect(routerCalls).toEqual([['/a', { replace: false }]])
  })

  it('falls back to a full load when no router is present', () => {
    stx.navigate('/somewhere')
    expect(hrefWrites).toEqual(['/somewhere'])
  })

  it('honours replace in the no-router fallback', () => {
    stx.navigate('/somewhere', { replace: true })
    expect(replaceCalls).toEqual(['/somewhere'])
    expect(hrefWrites).toEqual([])
  })
})
