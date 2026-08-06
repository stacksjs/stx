/**
 * #1873: the devtools store panel was never populated.
 *
 * createStore() registered with state-management's own registry and never with
 * devtools', which is a separate map (devtools.ts:348) that nothing called. The
 * panel reads that map, so it stayed empty no matter how many stores an app
 * defined, and timeTravel -- which looks a store up by id -- had nothing to find.
 *
 * Underneath that, two modules install window.__STX_DEVTOOLS__ with incompatible
 * shapes, and whichever loads last wins: enableDevTools() (devtools.ts:163) owns
 * the panel and has NO onStoreChange, while initDevTools() (state-management.ts)
 * has onStoreChange and no panel. The old unguarded `.onStoreChange(...)` on
 * every store write was therefore a TypeError whenever the panel-owning global
 * had loaded last.
 *
 * Asserted through the public __STX_DEVTOOLS__ surface, which is what the panel
 * itself reads.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { disableDevTools, enableDevTools } from '../../src/devtools'
import { clearStores, createStore, defineStore } from '../../src/state-management'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

function stores(): any[] {
  return window.__STX_DEVTOOLS__.getStores()
}

describe('devtools store registration (#1873)', () => {
  beforeEach(() => {
    clearStores()
    disableDevTools()
    enableDevTools()
  })

  it('exposes the panel API without an onStoreChange hook', () => {
    // This asymmetry is the whole bug: state-management called a method that
    // this shape does not define.
    expect(typeof window.__STX_DEVTOOLS__.getStores).toBe('function')
    expect(window.__STX_DEVTOOLS__.onStoreChange).toBeUndefined()
  })

  it('registers a named store with the registry the panel reads', () => {
    createStore({ count: 0 }, { name: 'counter', devtools: true })
    expect(stores().some(s => s.id === 'counter')).toBe(true)
  })

  it('records a mutation against that store', () => {
    const s = createStore({ count: 0 }, { name: 'counter', devtools: true })
    const before = stores().find(x => x.id === 'counter').history.length
    s.set({ count: 1 })
    expect(stores().find(x => x.id === 'counter').history.length).toBeGreaterThan(before)
  })

  it('does not throw on a write when the panel-owning global is installed', () => {
    const s = createStore({ count: 0 }, { name: 'safe', devtools: true })
    expect(() => s.set({ count: 2 })).not.toThrow()
  })

  it('honours devtools: false for a single store', () => {
    createStore({ count: 0 }, { name: 'quiet', devtools: false })
    expect(stores().some(s => s.id === 'quiet')).toBe(false)
  })

  it('registers a defineStore() store, which opts into devtools by default', () => {
    defineStore('prefs', { state: { theme: 'dark' } })
    expect(stores().some(s => s.id === 'prefs')).toBe(true)
  })

  it('leaves anonymous stores out of the registry', () => {
    const before = stores().length
    createStore({ count: 0 }, { devtools: true })
    expect(stores().length).toBe(before)
  })
})
