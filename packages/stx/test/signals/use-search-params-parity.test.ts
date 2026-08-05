/**
 * `useSearchParams` — runtime and module agree (stacksjs/stx#1806).
 *
 * The ambient declaration was wrong in BOTH directions: it promised `delete`
 * and `has`, which did not exist at runtime, and omitted `setAll` and `data`,
 * which did. The compiler endorsed two calls that threw in the browser and
 * rejected two that worked.
 *
 * There was a third shape as well. `composables/use-router.ts` exported a
 * `useSearchParams` that was a server stub in EVERY environment, browser
 * included — every write silently did nothing. Its sibling `useRoute` delegates
 * to the runtime, so the stub was an oversight rather than a design. That
 * matters because a `functions/` composable — the layout the docs prescribe —
 * imports from the module path, not the ambient global.
 *
 * Both impls are exercised here, per CLAUDE.md item 40: the surface has to be
 * the same whichever entry point you came through.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

let realWindow: any
let stx: any
let pushed: string[] = []
let replaced: string[] = []

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realWindow = g.window
  stx = g.window.stx
})

/**
 * A window whose location and history are ours.
 *
 * very-happy-dom's history.pushState leaves location.search untouched, so the
 * composable's syncFromUrl would always read an empty query and none of this
 * would be observable. Here pushState rewrites the search string, which is what
 * a browser does.
 */
function installWindow(search: string, withRuntime = true) {
  const loc = {
    href: `http://localhost/page${search}`,
    search,
    pathname: '/page',
    origin: 'http://localhost',
  }
  g.window = {
    ...(withRuntime ? { stx } : {}),
    location: loc,
    history: {
      pushState: (_s: unknown, _t: string, url: unknown) => {
        const next = new URL(String(url), 'http://localhost')
        loc.href = next.href
        loc.search = next.search
        pushed.push(next.search)
      },
      // Recorded separately so a test can tell "the URL changed" from "the URL
      // changed AND the old one is still reachable with Back" — which is the
      // whole distinction #1825 is about.
      replaceState: (_s: unknown, _t: string, url: unknown) => {
        const next = new URL(String(url), 'http://localhost')
        loc.href = next.href
        loc.search = next.search
        replaced.push(next.search)
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  g.location = loc
}

beforeEach(() => { pushed = []; replaced = [] })
afterEach(() => {
  g.window = realWindow
  delete g.location
})

/** Both implementations of the same composable. */
const impls: Array<[string, () => any]> = [
  ['runtime', () => stx.useSearchParams()],
  ['module (delegating to the runtime)', () => {
    // eslint-disable-next-line ts/no-require-imports
    const { useSearchParams } = require('../../src/composables/use-router')
    return useSearchParams()
  }],
  // The module's OWN implementation, with no runtime to delegate to. This is
  // the path a `functions/` composable takes when it runs before the runtime is
  // on the page — and the path that used to be an inert stub in the browser.
  ['module (own implementation)', () => {
    delete g.window.stx
    // eslint-disable-next-line ts/no-require-imports
    const { useSearchParams } = require('../../src/composables/use-router')
    return useSearchParams()
  }],
]

for (const [name, create] of impls) {
  describe(`useSearchParams (${name})`, () => {
    it('reads a present param', () => {
      installWindow('?page=2&sort=asc')
      const sp = create()
      expect(sp.get('page')).toBe('2')
      expect(sp.get('sort')).toBe('asc')
    })

    it('returns undefined for a missing param, not null', () => {
      // The declaration said `string | null`; the runtime and the docs have
      // always said undefined.
      installWindow('?page=2')
      expect(create().get('nope')).toBeUndefined()
    })

    it('does not leak Object.prototype members', () => {
      // The backing object comes from Object.fromEntries, so an unguarded
      // params()[key] returned a FUNCTION for these — neither a string nor
      // undefined, and matching no declared return type.
      installWindow('?page=2')
      const sp = create()
      for (const key of ['toString', 'constructor', 'valueOf', 'hasOwnProperty']) {
        expect(sp.get(key)).toBeUndefined()
        expect(sp.has(key)).toBe(false)
      }
    })

    it('answers has() for present and absent keys', () => {
      // Declared, and absent at runtime — the compiler endorsed a TypeError.
      installWindow('?page=2')
      const sp = create()
      expect(sp.has('page')).toBe(true)
      expect(sp.has('missing')).toBe(false)
    })

    it('sets a param and writes it to the URL', () => {
      installWindow('?page=2')
      const sp = create()
      sp.set('page', '9')
      expect(sp.get('page')).toBe('9')
      expect(pushed.at(-1)).toContain('page=9')
    })

    it('deletes a param', () => {
      // The other declared-but-absent method.
      installWindow('?page=2&sort=asc')
      const sp = create()
      sp.delete('page')
      expect(sp.get('page')).toBeUndefined()
      expect(sp.has('sort')).toBe(true)
      expect(pushed.at(-1)).not.toContain('page')
    })

    it('sets several params at once', () => {
      // Present at runtime, absent from the declaration — TS2339 on a call
      // that worked.
      installWindow('?page=1')
      const sp = create()
      sp.setAll({ page: '3', q: 'shoes' })
      expect(sp.get('page')).toBe('3')
      expect(sp.get('q')).toBe('shoes')
    })

    it('exposes the backing signal as data', () => {
      installWindow('?a=1')
      const sp = create()
      expect(typeof sp.data).toBe('function')
      expect(sp.data()).toEqual({ a: '1' })
    })

    it('keeps data in step with a write', () => {
      // A module impl that stubs everything would pass every test above by
      // doing nothing; this one pins that writes actually land.
      installWindow('?a=1')
      const sp = create()
      sp.set('b', '2')
      expect(sp.data()).toEqual({ a: '1', b: '2' })
    })

    // ---- history semantics (#1825) ----
    //
    // The canonical reason to delete a param is to CONSUME a one-shot value —
    // an OAuth callback result, ?checkout=success, a flash token. Under the
    // default pushState the pre-delete URL, still carrying the param, becomes
    // the previous history entry, so Back replays the callback.

    it('pushes by default, so today\'s behaviour is unchanged', () => {
      installWindow('?code=abc')
      const sp = create()
      sp.delete('code')
      expect(pushed).toEqual([''])
      expect(replaced).toEqual([])
    })

    it('replaces the entry when asked, so Back cannot replay the param', () => {
      installWindow('?code=abc')
      const sp = create()
      sp.delete('code', { replace: true })
      expect(replaced).toEqual([''])
      expect(pushed).toEqual([])
      expect(sp.has('code')).toBe(false)
    })

    it('honours replace on set', () => {
      installWindow('?a=1')
      create().set('a', '2', { replace: true })
      expect(replaced).toEqual(['?a=2'])
      expect(pushed).toEqual([])
    })

    it('honours replace on setAll', () => {
      installWindow('?a=1')
      create().setAll({ a: '9', b: '8' }, { replace: true })
      expect(replaced).toEqual(['?a=9&b=8'])
      expect(pushed).toEqual([])
    })

    it('treats an options bag without `replace` as a push', () => {
      installWindow('?a=1')
      create().delete('a', {})
      expect(pushed).toEqual([''])
      expect(replaced).toEqual([])
    })

    // A truthy-property test — `options && options.replace` — reads as "did the
    // caller ask to replace" and actually asks "does this value have a .replace
    // property". Every string has String.prototype.replace, so `'push'` would
    // have replaced. `''` was worse: it diverged BETWEEN the two
    // implementations, because optional chaining short-circuits on null and
    // undefined only. Anything that is not an options object pushes.
    it.each([
      ['a string that says the opposite', 'push'],
      ['the word replace as a bare string', 'replace'],
      ['an empty string', ''],
      ['a bare true', true],
      ['a number', 1],
      ['null', null],
      ['undefined', undefined],
    ])('pushes for %s', (_label, arg) => {
      installWindow('?a=1')
      create().delete('a', arg as any)
      expect(replaced).toEqual([])
      expect(pushed).toEqual([''])
    })

    it('replaces for any truthy `replace` inside a real options object', () => {
      installWindow('?a=1')
      create().delete('a', { replace: 1 } as any)
      expect(replaced).toEqual([''])
      expect(pushed).toEqual([])
    })
  })
}

describe('useSearchParams — the two impls expose the same surface', () => {
  it('offers the same members', () => {
    installWindow('?a=1')
    const runtime = stx.useSearchParams()
    // eslint-disable-next-line ts/no-require-imports
    const { useSearchParams } = require('../../src/composables/use-router')
    const module_ = useSearchParams()

    const surface = (o: object) => Object.keys(o).sort()
    expect(surface(module_)).toEqual(surface(runtime))
  })
})
