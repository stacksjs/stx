/**
 * Parity tests for the two `useCookie` implementations.
 *
 * stx ships two `useCookie` impls (see stacksjs/stx#1710):
 *   1. `packages/stx/src/composables/use-cookie.ts` — module-import path,
 *      used by tests and code that imports from 'stx' directly.
 *   2. The runtime template literal inside `packages/stx/src/signals.ts`,
 *      injected into client pages as `window.stx.useCookie`.
 *
 * They MUST behave identically so consumers don't get different cookies
 * depending on which entry point their bundle resolves. This file runs the
 * same suite against both and fails if either drifts.
 *
 * Contract pinned here:
 *   - returns a Signal<string> (callable; `c()` reads, `c.set(v)` writes)
 *   - setting to `''` removes the cookie
 *   - missing cookies return `defaultValue` (or '')
 *   - options names: defaultValue, encode, decode, maxAge, path, sameSite, secure
 *   - regex metacharacters in cookie names read safely
 */
import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import * as composableModule from '../../src/composables/use-cookie'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface CookieSignal {
  (): string
  set: (v: string) => void
}

type UseCookieFn = (name: string, opts?: Record<string, unknown>) => CookieSignal

// Populate window.stx by executing the generated runtime in happy-dom. The
// IIFE is idempotent on re-execution because we only need it once per file.
beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

function getImpls(): Record<string, UseCookieFn> {
  // happy-dom puts `window` on globalThis; the runtime IIFE populates
  // `window.stx.useCookie`. Cast via `any` is intentional — globalThis's
  // nominal type doesn't include the happy-dom shape.
  // eslint-disable-next-line ts/no-explicit-any
  const runtimeUseCookie = (globalThis as any).window?.stx?.useCookie as UseCookieFn
  return {
    'composable': composableModule.useCookie as UseCookieFn,
    'runtime': runtimeUseCookie,
  }
}

/**
 * Run `fn` with `document.cookie` assignments recorded.
 *
 * Reading the jar back cannot see this bug: happy-dom drops `Max-Age` and
 * `expires`, so a cookie rewritten with no lifetime looks identical to the
 * persistent one it replaced. The assignment string carries the attributes, so
 * that is what gets asserted.
 *
 * Shadows the accessor with an own property that delegates to the real one, and
 * removes it again in `finally` — so a throw inside `fn` cannot leave the
 * document instrumented for the rest of the file.
 */
function recordCookieWrites<T>(fn: () => T): { writes: string[], result: T } {
  let owner: object | null = document
  let descriptor: PropertyDescriptor | undefined
  while (owner && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(owner, 'cookie')
    owner = Object.getPrototypeOf(owner)
  }
  if (!descriptor?.get || !descriptor?.set)
    throw new Error('document.cookie is not an accessor here — this helper cannot observe writes, and silently returning [] would make every assertion below pass against nothing')

  const writes: string[] = []
  const real = descriptor
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => real.get!.call(document),
    set: (value: string) => {
      writes.push(value)
      real.set!.call(document, value)
    },
  })

  try {
    return { writes, result: fn() }
  }
  finally {
    // eslint-disable-next-line ts/no-explicit-any
    delete (document as any).cookie
  }
}

function wipeAllCookies(): void {
  const all = document.cookie.split(';').map(c => c.trim()).filter(Boolean)
  for (const pair of all) {
    const name = pair.split('=')[0]
    if (name)
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
  }
}

for (const name of ['composable', 'runtime'] as const) {
  describe(`useCookie parity (${name})`, () => {
    let useCookie: UseCookieFn

    beforeAll(() => {
      useCookie = getImpls()[name]
      if (!useCookie)
        throw new Error(`impl ${name} not available — happy-dom or runtime setup failed`)
    })

    beforeEach(wipeAllCookies)

    // ── shape ──
    it('returns a callable signal with a .set method', () => {
      const c = useCookie('shape-test')
      expect(typeof c).toBe('function')
      expect(typeof c.set).toBe('function')
    })

    // ── reads ──
    it('reads an existing cookie at construction time', () => {
      document.cookie = 'session=abc; path=/'
      const c = useCookie('session')
      expect(c()).toBe('abc')
    })

    it('returns defaultValue when the cookie is missing', () => {
      const c = useCookie('missing', { defaultValue: 'fallback' })
      expect(c()).toBe('fallback')
    })

    it('returns empty string when missing and no defaultValue given', () => {
      const c = useCookie('absent')
      expect(c()).toBe('')
    })

    // ── writes ──
    it('persists writes to document.cookie via .set()', () => {
      const c = useCookie('auth-token')
      c.set('xyz')
      expect(document.cookie).toContain('auth-token=xyz')
    })

    it('reflects the new value on subsequent reads', () => {
      const c = useCookie('changing')
      c.set('first')
      expect(c()).toBe('first')
      c.set('second')
      expect(c()).toBe('second')
    })

    // ── encoding ──
    it('URL-encodes special characters by default', () => {
      const c = useCookie('email')
      c.set('a@b.com')
      expect(document.cookie).toContain('email=a%40b.com')
    })

    it('uses custom encode/decode when provided', () => {
      const passthrough = (v: string) => v
      const c = useCookie('raw', { encode: passthrough, decode: passthrough })
      c.set('plain-value')
      expect(document.cookie).toContain('raw=plain-value')

      const c2 = useCookie('raw', { encode: passthrough, decode: passthrough })
      expect(c2()).toBe('plain-value')
    })

    // ── deletion ──
    it('removes the cookie when set to empty string', () => {
      document.cookie = 'tmp=keep; path=/'
      const c = useCookie('tmp')
      expect(c()).toBe('keep')
      c.set('')
      expect(document.cookie).not.toContain('tmp=keep')
    })

    // ── regex safety ──
    it('reads cookies whose names contain regex metacharacters', () => {
      document.cookie = '__Host-session.id=safe; path=/'
      const c = useCookie('__Host-session.id')
      expect(c()).toBe('safe')
    })

    // ── attribute pass-through ──
    it('honors a custom maxAge (value lands; happy-dom does not surface the attr)', () => {
      const c = useCookie('ttl', { maxAge: 60 })
      c.set('v')
      // happy-dom doesn't surface Max-Age via document.cookie; we only verify
      // the value persisted. A regression that dropped attribute building
      // entirely would still let this through, so this is sanity, not strict.
      expect(document.cookie).toContain('ttl=v')
    })

    // ── construction must not write (#1933) ──
    //
    // happy-dom does not surface Max-Age through `document.cookie`, so the
    // downgrade the issue describes cannot be observed by reading the jar back.
    // The write itself can: these assert on what is ASSIGNED to
    // `document.cookie`, which is the thing that carries the attributes and the
    // thing a second declaration was clobbering.
    describe('declaring a cookie', () => {
      it('writes nothing — reading is not a write', () => {
        document.cookie = 'auth=tok; path=/'

        const { writes, result } = recordCookieWrites(() => useCookie('auth'))

        expect(writes).toEqual([])
        // Still seeded from the jar, so the read path is intact. Without this a
        // useCookie that did nothing at all would pass the assertion above.
        expect(result()).toBe('tok')
      })

      it('does not rewrite a cookie another declaration owns', () => {
        // The exact shape from the report: the owner sets a 30-day policy, a
        // second view declares the same cookie only to read it.
        useCookie('auth-token', { maxAge: 60 * 60 * 24 * 30 }).set('tok')

        const { writes } = recordCookieWrites(() => useCookie('auth-token'))

        // Any write here restates the attributes from the READER's options,
        // which carry no lifetime — that is the session-cookie downgrade.
        expect(writes).toEqual([])
      })

      it('still writes on set(), including from a second declaration', () => {
        // The other half: making construction inert must not make writes inert.
        useCookie('shared', { maxAge: 120 }).set('first')

        const { writes } = recordCookieWrites(() => {
          const reader = useCookie('shared')
          reader.set('second')
          return reader
        })

        expect(writes.length).toBe(1)
        expect(writes[0]).toContain('shared=second')
      })
    })

    // ── expires parity (#1933) ──
    it('accepts expires as a Date, as seconds, and as a parsable string', () => {
      // The runtime accepted only a Date and called .toUTCString() on whatever
      // it got, so a number or string produced no expires attribute at all —
      // silently a session cookie, on one impl only.
      const cases: Array<[string, Date | number | string]> = [
        ['exp-date', new Date(Date.now() + 86_400_000)],
        ['exp-secs', 86_400],
        ['exp-str', new Date(Date.now() + 86_400_000).toISOString()],
      ]

      for (const [cookieName, expires] of cases) {
        const { writes } = recordCookieWrites(() => {
          const c = useCookie(cookieName, { expires })
          c.set('v')
          return c
        })

        expect(writes.length).toBe(1)
        expect(writes[0]).toContain('expires=')
      }
    })
  })
}
