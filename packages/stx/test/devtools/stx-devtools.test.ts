/**
 * window.__stxDevtools — Phase 1 introspection API (stacksjs/stx#1747).
 *
 * Drives the real runtime via the #1741 DOM shim: builds a scope registry +
 * matching DOM and asserts the inspector reports the component tree (nested by
 * DOM ancestry) and classifies each scope var (signal / derived / store / method
 * / value), reading values via peek (so inspecting never subscribes an effect).
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('window.__stxDevtools (#1747 Phase 1)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('is exposed on window', () => {
    expect(typeof window.__stxDevtools).toBe('object')
    expect(window.__stxDevtools.version).toBe(1)
  })

  it('builds a component tree nested by DOM ancestry', () => {
    document.body.innerHTML
      = '<div data-stx-scope="Outer">'
      + '<section data-stx-scope="Inner"><span data-stx-scope="Leaf"></span></section>'
      + '</div>'
      + '<aside data-stx-scope="Sibling"></aside>'
    shimAttributes(document.body)
    window.stx._scopes = { Outer: {}, Inner: {}, Leaf: {}, Sibling: {} }

    const tree = window.__stxDevtools.tree()
    expect(tree.map((n: any) => n.scopeId).sort()).toEqual(['Outer', 'Sibling'])
    const outer = tree.find((n: any) => n.scopeId === 'Outer')
    expect(outer.children.map((n: any) => n.scopeId)).toEqual(['Inner'])
    expect(outer.children[0].children.map((n: any) => n.scopeId)).toEqual(['Leaf'])
    expect(outer.tag).toBe('div')
  })

  it('classifies scope vars and reads current values', () => {
    const count = window.stx.state(7)
    const doubled = window.stx.derived(() => count() * 2)
    window.stx._scopes = {
      C: {
        count,
        doubled,
        label: 'hi', // plain value
        greet: () => 'hello', // method
        __mountCallbacks: [], // internal — skipped
      },
    }
    const s = window.__stxDevtools.scope('C')
    expect(s.signals.count).toBe(7)
    expect(s.derived.doubled).toBe(14)
    expect(s.values.label).toBe('hi')
    expect(s.methods).toContain('greet')
    // internals are not surfaced
    expect(Object.keys(s.values)).not.toContain('__mountCallbacks')
  })

  it('reading a signal via the inspector does not subscribe an effect', () => {
    const n = window.stx.state(1)
    window.stx._scopes = { E: { n } }
    let runs = 0
    // An effect that would re-run if inspecting subscribed it to `n`.
    window.stx.effect(() => {
      runs++
      window.__stxDevtools.scope('E') // read n() via peek inside
    })
    const before = runs
    n.set(2)
    // If the inspector leaked a subscription, runs would increase on n.set.
    expect(runs).toBe(before)
  })

  it('inspect(el) resolves the nearest enclosing scope', () => {
    document.body.innerHTML = '<div data-stx-scope="P"><button class="b">x</button></div>'
    shimAttributes(document.body)
    window.stx._scopes = { P: { flag: true } }
    const s = window.__stxDevtools.inspect(document.querySelector('.b'))
    expect(s.values.flag).toBe(true)
  })

  it('returns null for an unknown scope', () => {
    expect(window.__stxDevtools.scope('nope')).toBeNull()
  })
})
