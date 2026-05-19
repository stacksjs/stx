/**
 * Tests for `useCookie` — issue #1701. Validates both the runtime exposure
 * (string-level) and the functional behavior (executed against happy-dom's
 * document.cookie via a minimal harness that stubs state/effect/onDestroy).
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// ─── Runtime exposure ──────────────────────────────────────────────────────
describe('useCookie — runtime exposure', () => {
  const runtime = generateSignalsRuntimeDev()

  it('runtime defines a useCookie function', () => {
    expect(runtime).toContain('function useCookie(')
  })

  it('runtime exposes useCookie on window.stx', () => {
    // window.stx = { state, ..., useLocalStorage, useCookie, ... }
    const stxAssign = runtime.match(/window\.stx\s*=\s*\{[\s\S]*?\};/)
    expect(stxAssign).not.toBeNull()
    expect(stxAssign![0]).toContain('useCookie')
  })

  it('includes the cookie deletion path (max-age=0 on empty value)', () => {
    expect(runtime).toContain("'max-age=0'")
  })

  it('defaults SameSite to Lax', () => {
    expect(runtime).toMatch(/SameSite=.*'Lax'/)
  })

  it('escapes regex metacharacters in the cookie name', () => {
    // The implementation must regex-escape the cookie name before building
    // the matcher, or names with `.`/`[`/etc. break the read path. The escape
    // replacement string `\$&` is unique to this code path in the runtime.
    expect(runtime).toContain("'\\$&'")
  })
})

// ─── Functional behavior (extracted into a closure with stubs) ────────────
//
// We pull the useCookie function out of the generated runtime, then re-evaluate
// it in a closure that provides the minimal state/effect/onDestroy stubs it
// depends on. This lets us exercise the real source (no parallel copy) against
// happy-dom's document.cookie.

function extractFunction(src: string, name: string): string {
  const startIdx = src.indexOf(`function ${name}(`)
  if (startIdx === -1) throw new Error(`${name} not found in runtime`)
  let depth = 0
  let i = src.indexOf('{', startIdx)
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) return src.slice(startIdx, i + 1)
    }
  }
  throw new Error(`unbalanced braces while extracting ${name}`)
}

interface CookieSignal {
  (): string
  set: (v: string) => void
}

function buildUseCookie(): (name: string, opts?: Record<string, unknown>) => CookieSignal {
  const runtime = generateSignalsRuntimeDev()
  const src = extractFunction(runtime, 'useCookie')

  function state(initial: string): CookieSignal {
    let value = initial
    const subs: Array<() => void> = []
    const read = (() => value) as CookieSignal
    read.set = (v: string) => {
      value = v
      subs.forEach(s => s())
    }
    // Attach subscriber registration so the local effect() stub can wire up.
    ;(read as unknown as { __subs: Array<() => void> }).__subs = subs
    return read
  }
  function effect(fn: () => void): void {
    // Tracked-effect emulation: run once, then re-run on any tracked signal change.
    // We hijack the current read by snapshotting the most recently created signal.
    fn()
    // Subsequent .set() calls trigger the effect via the subs array we attach
    // below at runtime through a Proxy on the global state factory.
    lastState && lastState.__subs.push(fn)
  }
  function onDestroy(_fn: () => void): void {}

  let lastState: { __subs: Array<() => void> } | null = null
  // Wrap state so we can capture the most-recently-created signal for effect to subscribe to.
  function trackedState(initial: string): CookieSignal {
    const s = state(initial)
    lastState = s as unknown as { __subs: Array<() => void> }
    return s
  }

  // eslint-disable-next-line no-new-func
  const factory = new Function('state', 'effect', 'onDestroy', `${src}\n;return useCookie;`)
  return factory(trackedState, effect, onDestroy) as ReturnType<typeof buildUseCookie>
}

describe('useCookie — functional behavior', () => {
  const useCookie = buildUseCookie()

  beforeEach(() => {
    // Wipe every cookie happy-dom knows about between tests so writes from
    // one test don't bleed into the next.
    const all = document.cookie.split(';').map(c => c.trim()).filter(Boolean)
    for (const pair of all) {
      const name = pair.split('=')[0]
      if (name) document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
    }
  })

  it('reads an existing cookie at construction', () => {
    document.cookie = 'session=abc; path=/'
    const c = useCookie('session')
    expect(c()).toBe('abc')
  })

  it('returns defaultValue when the cookie is missing', () => {
    const c = useCookie('nope', { defaultValue: 'fallback' })
    expect(c()).toBe('fallback')
  })

  it('writes the cookie when the signal is set', () => {
    const c = useCookie('auth-token')
    c.set('xyz')
    expect(document.cookie).toContain('auth-token=xyz')
  })

  it('URL-encodes values containing special characters', () => {
    const c = useCookie('email')
    c.set('a@b.com')
    expect(document.cookie).toContain('email=a%40b.com')
  })

  it('sets max-age=0 when value becomes empty (deletes the cookie)', () => {
    document.cookie = 'tmp=keep; path=/'
    const c = useCookie('tmp')
    expect(c()).toBe('keep')
    c.set('')
    // happy-dom honors max-age=0 by removing the cookie from document.cookie.
    expect(document.cookie).not.toContain('tmp=keep')
  })

  it('reads cookies whose names contain regex metacharacters', () => {
    document.cookie = '__Host-session.id=safe; path=/'
    const c = useCookie('__Host-session.id')
    expect(c()).toBe('safe')
  })

  it('uses custom encode/decode when provided', () => {
    const passthrough = (v: string) => v
    const c = useCookie('raw', { encode: passthrough, decode: passthrough })
    c.set('plain-value')
    expect(document.cookie).toContain('raw=plain-value')
    // Re-read via a fresh signal to confirm decode passthrough round-trips.
    const c2 = useCookie('raw', { encode: passthrough, decode: passthrough })
    expect(c2()).toBe('plain-value')
  })

  it('honors a custom maxAge', () => {
    const c = useCookie('ttl', { maxAge: 60 })
    c.set('v')
    // happy-dom doesn't surface the Max-Age attribute via document.cookie, so
    // we can only verify the value landed. The runtime emits `max-age=60`;
    // a regression that drops attrs entirely would still let the value
    // through, so this test is a sanity check, not a strict serializer test.
    expect(document.cookie).toContain('ttl=v')
  })
})
