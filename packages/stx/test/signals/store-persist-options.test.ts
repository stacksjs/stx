/**
 * #1872: `persist` accepted only key / storage / pick.
 *
 * Everything went into one JSON blob under one key, the codec was hardcoded to
 * JSON, and there was no cookie backend. An app whose SERVER renders
 * owner-scoped pages cannot read localStorage, so it had to keep several bare
 * localStorage signals plus a hand-written cookie-mirroring effect outside the
 * store entirely.
 *
 * The JSON-only codec is its own hazard: a string persisted through JSON comes
 * back quoted, so a signed-out token stored as '""' is two characters and
 * TRUTHY. A pre-paint auth guard testing the raw value lets a signed-out visitor
 * straight through.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

function boot(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

/** Persist writes on a 100ms debounce; per-field writes are immediate. */
function settle(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 160))
}

describe('store persist options (#1872)', () => {
  beforeEach(() => {
    boot()
    window.localStorage?.clear?.()
    window.sessionStorage?.clear?.()
    document.cookie = ''
  })

  it('still writes one blob when no per-field mapping is given', async () => {
    const store = window.stx.defineStore('blob', () => ({
      a: window.stx.state('one'),
      b: window.stx.state('two'),
    }), { persist: { key: 'k-blob' } })

    store.a.set('changed')
    await settle()

    const raw = window.localStorage.getItem('k-blob')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw)).toMatchObject({ a: 'changed', b: 'two' })
  })

  it('gives a mapped field its own key and keeps it out of the blob', async () => {
    const store = window.stx.defineStore('mapped', () => ({
      token: window.stx.state('abc'),
      other: window.stx.state('kept'),
    }), { persist: { key: 'k-mapped', keys: { token: 'my_token' } } })

    store.token.set('xyz')
    await settle()

    expect(JSON.parse(window.localStorage.getItem('my_token'))).toBe('xyz')
    // The blob must not carry a second, divergent copy.
    const blob = JSON.parse(window.localStorage.getItem('k-mapped'))
    expect(blob.token).toBeUndefined()
    expect(blob.other).toBe('kept')
  })

  it('honours a custom serializer, so a string persists unquoted', async () => {
    const raw = { serialize: (v: any) => String(v ?? ''), deserialize: (s: string) => s }
    const store = window.stx.defineStore('codec', () => ({
      token: window.stx.state(''),
    }), { persist: { keys: { token: { key: 'tok', serialize: raw.serialize, deserialize: raw.deserialize } } } })

    store.token.set('plain-value')
    await settle()

    // The whole point: no surrounding quotes.
    expect(window.localStorage.getItem('tok')).toBe('plain-value')
  })

  it('a signed-out empty string does not persist as truthy \'""\'', async () => {
    const store = window.stx.defineStore('signedout', () => ({
      token: window.stx.state('something'),
    }), { persist: { keys: { token: { key: 'tok2', serialize: (v: any) => String(v ?? ''), deserialize: (s: string) => s } } } })

    store.token.set('')
    await settle()

    const stored = window.localStorage.getItem('tok2')
    expect(stored).toBe('')
    // Under the old JSON-only codec this was '""' — two characters, truthy.
    expect(Boolean(stored)).toBe(false)
  })

  it('restores a mapped field from its own key on init', () => {
    window.localStorage.setItem('preset', JSON.stringify('from-storage'))
    const store = window.stx.defineStore('restore', () => ({
      token: window.stx.state('default'),
    }), { persist: { keys: { token: 'preset' } } })

    expect(store.token()).toBe('from-storage')
  })

  it('routes a mapped field to sessionStorage when asked', async () => {
    const store = window.stx.defineStore('sess', () => ({
      tmp: window.stx.state('x'),
    }), { persist: { keys: { tmp: { key: 'tmp_key', storage: 'session' } } } })

    store.tmp.set('y')
    await settle()

    expect(JSON.parse(window.sessionStorage.getItem('tmp_key'))).toBe('y')
    expect(window.localStorage.getItem('tmp_key')).toBeNull()
  })

  it('persists a mapped field to a cookie the server can read', async () => {
    const store = window.stx.defineStore('cookiestore', () => ({
      mirror: window.stx.state(''),
    }), {
      persist: {
        keys: {
          mirror: {
            key: 'app_token',
            storage: 'cookie',
            maxAge: 2592000,
            sameSite: 'Lax',
            serialize: (v: any) => String(v ?? ''),
            deserialize: (s: string) => s,
          },
        },
      },
    })

    store.mirror.set('server-visible')
    await settle()

    expect(document.cookie).toContain('app_token=server-visible')
  })

  it('warns rather than throwing when persist.keys names a non-signal', () => {
    const warnings: string[] = []
    const orig = console.warn
    console.warn = (...args: any[]) => { warnings.push(args.join(' ')) }
    try {
      window.stx.defineStore('badkey', () => ({
        real: window.stx.state(1),
      }), { persist: { keys: { nope: 'nope_key' } } })
    }
    finally {
      console.warn = orig
    }
    expect(warnings.some(w => w.includes('not a signal'))).toBe(true)
  })
})
