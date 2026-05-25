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
  })
}
