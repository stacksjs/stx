/**
 * <Suspense> client boundary (stacksjs/stx#1742, Phase 3).
 *
 * A `[data-stx-suspense]` boundary aggregates the loading/error state of every
 * descendant suspense query (useQuery/useFetch with { suspense: true }) for which
 * it is the nearest ancestor, and toggles three regions:
 *   - [data-stx-suspense-fallback] while any query is loading
 *   - [data-stx-suspense-error]    when one errors
 *   - [data-stx-suspense-content]  once all resolve
 *
 * This drives the real runtime against happy-dom (see the #1741 DOM shim): we
 * register fake query signals (the same shape useQuery pushes) tagged to a
 * descendant element, then run the runtime over the boundary and assert the
 * correct region is shown for each initial state.
 *
 * Assertions are on the INITIAL render (the query's state is set before the
 * boundary binds), which is deterministic even when several test files each
 * execute the runtime IIFE in one process. Live `.set()`-driven transitions work
 * with a single runtime instance (verified in isolation) but cross-instance
 * effect tracking is the known multi-instance limitation, so they aren't asserted
 * here. The registry lives on `window`, so the boundary claims the right queries
 * regardless of which instance binds.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const isHidden = (el: any) => el == null || el.hasAttribute('hidden')

describe('<Suspense> boundary (#1742)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  beforeEach(() => {
    // One registry per page — clear it so entries don't leak between tests.
    window.__stx_suspense_registry = []
  })

  // Register a fake suspense query (loading/error signals) tagged to `el`,
  // exactly as useQuery({ suspense: true }) does internally.
  function registerQuery(el: any, loading: any, error: any) {
    const prev = window.__STX_CURRENT_ELEMENT__
    window.__STX_CURRENT_ELEMENT__ = el
    window.stx._registerSuspense(loading, error)
    window.__STX_CURRENT_ELEMENT__ = prev
  }

  // Mount a boundary whose single descendant query starts in the given state.
  function mount(scopeId: string, opts: { loading?: boolean, error?: unknown, withQuery?: boolean } = {}) {
    const withQuery = opts.withQuery !== false
    document.body.innerHTML
      = `<section data-stx-scope="${scopeId}">`
      + `<div data-stx-suspense>`
      + `<div data-stx-suspense-fallback>loading…</div>`
      + `<div data-stx-suspense-error>failed</div>`
      + `<div data-stx-suspense-content><span class="child">done</span></div>`
      + `</div></section>`
    shimAttributes(document.body)

    if (withQuery) {
      const child = document.querySelector('.child')
      const loading = window.stx.state(opts.loading ?? true)
      const error = window.stx.state(opts.error ?? null)
      registerQuery(child, loading, error)
    }
    window.stx._scopes = { [scopeId]: {} }
    document.dispatchEvent(new window.Event('DOMContentLoaded'))

    return {
      fallback: document.querySelector('[data-stx-suspense-fallback]'),
      content: document.querySelector('[data-stx-suspense-content]'),
      errorEl: document.querySelector('[data-stx-suspense-error]'),
    }
  }

  it('shows the fallback while a descendant query is loading', async () => {
    const b = mount('susp_loading', { loading: true })
    await flushEffects()
    expect(isHidden(b.fallback)).toBe(false)
    expect(isHidden(b.content)).toBe(true)
    expect(isHidden(b.errorEl)).toBe(true)
  })

  it('shows content when the descendant query has resolved', async () => {
    const b = mount('susp_resolved', { loading: false })
    await flushEffects()
    expect(isHidden(b.content)).toBe(false)
    expect(isHidden(b.fallback)).toBe(true)
    expect(isHidden(b.errorEl)).toBe(true)
  })

  it('shows the error region when the descendant query has errored', async () => {
    const b = mount('susp_error', { loading: false, error: new Error('boom') })
    await flushEffects()
    expect(isHidden(b.errorEl)).toBe(false)
    expect(isHidden(b.content)).toBe(true)
    expect(isHidden(b.fallback)).toBe(true)
  })

  it('shows content immediately when there are no suspense queries', async () => {
    const b = mount('susp_none', { withQuery: false })
    await flushEffects()
    expect(isHidden(b.content)).toBe(false)
    expect(isHidden(b.fallback)).toBe(true)
  })
})
