/**
 * #1850: after a mutation there was no way to re-render server-rendered content.
 *
 * The router grew refresh()/invalidate() (cda75d5dab), but they lived only on
 * window.stxRouter — nothing in the authoring surface reached them, so a
 * <script client> block still had no way to say "the mutation changed what the
 * server rendered". Apps kept calling location.reload() and discarded every
 * signal on the page, which is the exact thing the SPA exists to avoid.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { STX_RUNTIME_GLOBALS } from '../../src/runtime-globals'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

function boot(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

describe('refresh() / invalidateRoute() authoring surface (#1850)', () => {
  beforeEach(() => {
    boot()
    delete window.stxRouter
  })

  it('exposes both on the stx runtime', () => {
    expect(typeof window.stx.refresh).toBe('function')
    expect(typeof window.stx.invalidateRoute).toBe('function')
  })

  it('lists them as auto-importable, so a bare call resolves in a client script', () => {
    // Without this a page writing `refresh()` gets a bare ReferenceError.
    expect(STX_RUNTIME_GLOBALS).toContain('refresh')
    expect(STX_RUNTIME_GLOBALS).toContain('invalidateRoute')
  })

  it('delegates to the router when one is present', () => {
    let called = 0
    window.stxRouter = { refresh: () => { called++; return Promise.resolve(true) } }
    window.stx.refresh()
    expect(called).toBe(1)
  })

  it('does not reload the document when the router handles it', () => {
    let reloaded = 0
    window.stxRouter = { refresh: () => Promise.resolve(true) }
    const origReload = window.location.reload
    window.location.reload = () => { reloaded++ }
    try {
      window.stx.refresh()
    }
    finally {
      window.location.reload = origReload
    }
    expect(reloaded).toBe(0)
  })

  it('falls back to a real reload when no router booted', () => {
    let reloaded = 0
    const origReload = window.location.reload
    window.location.reload = () => { reloaded++ }
    try {
      window.stx.refresh()
    }
    finally {
      window.location.reload = origReload
    }
    expect(reloaded).toBe(1)
  })

  it('forwards invalidateRoute to the router with the url', () => {
    const seen: any[] = []
    window.stxRouter = { invalidate: (u: string) => seen.push(u) }
    window.stx.invalidateRoute('/projects')
    expect(seen).toEqual(['/projects'])
  })

  it('invalidateRoute is a no-op rather than a throw without a router', () => {
    expect(() => window.stx.invalidateRoute('/projects')).not.toThrow()
  })
})
