/**
 * Behavioral (real-DOM-driven) tests for the SPA scope-registry orphan sweep
 * (stacksjs/stx#1775), and a regression guard that the sweep does NOT reclaim
 * scopes a live conditional still owns (#1737).
 *
 * Background: cleanupContainer → disposeSubtreeScopes only deletes scopes found
 * UNDER the swap container, so a component rendered outside it (an @include in
 * the layout, above <main>) — or one already detached before the walk ran — kept
 * its window.stx._scopes entry forever. Each SPA round-trip re-ran the include
 * scripts under fresh scope ids, so the registry grew ~4 entries per hop,
 * unbounded, each retaining that scope's vars, signals and closures.
 *
 * The sweep is conservative on purpose: deleting a scope that a conditional
 * later re-shows is #1737, which is strictly worse than leaking. These tests pin
 * both directions — orphans are reclaimed, retained scopes survive.
 *
 * Drives the FULL signals runtime against happy-dom via the dom-runtime-shim,
 * the same harness if-else-chain-dom.test.ts uses.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

/** Build a document with a swap container plus a scope element outside it, and
 *  let the runtime's DOMContentLoaded walk bind (and record) each scope. */
async function mountScopes(bodyHtml: string, scopes: Record<string, unknown>) {
  window.stx._scopes = { ...scopes }
  document.body.innerHTML = bodyHtml
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(r => setTimeout(r, 50))
}

const scopeIds = (): string[] => Object.keys(window.stx._scopes || {})

describe('stx#1775: SPA cleanup reclaims orphaned scope registry entries', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('reclaims a scope whose element is gone (rendered OUTSIDE the swap container)', async () => {
    await mountScopes(
      `<div data-stx-scope="outside_1">shell</div><main><div data-stx-scope="inside_1">page</div></main>`,
      { outside_1: { __destroyCallbacks: [] }, inside_1: { __destroyCallbacks: [] } },
    )
    expect(scopeIds()).toContain('outside_1')

    // Simulate the swap: the shell component's element is replaced/removed, and
    // the container's content goes too. Neither is under `main` at cleanup time.
    document.querySelector('[data-stx-scope="outside_1"]').remove()
    const main = document.querySelector('main')
    main.innerHTML = ''
    window.stx._cleanupContainer(main)

    // Both entries are dead: their elements are detached and unretained.
    expect(scopeIds()).not.toContain('outside_1')
    expect(scopeIds()).not.toContain('inside_1')
  })

  it('keeps a scope whose element is still connected (persistent shell)', async () => {
    await mountScopes(
      `<div data-stx-scope="persist_1">nav</div><main><div data-stx-scope="page_1">page</div></main>`,
      { persist_1: { __destroyCallbacks: [] }, page_1: { __destroyCallbacks: [] } },
    )
    const main = document.querySelector('main')
    main.innerHTML = ''
    window.stx._cleanupContainer(main)

    // The nav element never left the document — its scope must survive the nav.
    expect(scopeIds()).toContain('persist_1')
    expect(scopeIds()).not.toContain('page_1')
  })

  it('#1737 guard — does NOT reclaim a scope retained by a hidden :if', async () => {
    await mountScopes(
      `<main><div id="cond"><div data-stx-scope="under_if_1">branch</div></div></main>`,
      { under_if_1: { __destroyCallbacks: [] } },
    )
    // Reproduce what bindIf does when the condition flips false: mark the
    // element as if-bound and detach it, keeping the node for a later re-show.
    const cond = document.getElementById('cond')
    cond.__stx_if_bound = true
    cond.remove()

    window.stx._cleanupContainer(document.querySelector('main'))

    // The branch can be re-shown, and its setup IIFE only ran once — deleting
    // the registration would leave the re-shown subtree with dead bindings.
    expect(scopeIds()).toContain('under_if_1')
  })

  it('fires __destroyCallbacks when reclaiming an orphan', async () => {
    let destroyed = 0
    await mountScopes(
      `<main></main><div data-stx-scope="with_destroy_1">x</div>`,
      { with_destroy_1: { __destroyCallbacks: [() => { destroyed++ }] } },
    )
    document.querySelector('[data-stx-scope="with_destroy_1"]').remove()
    window.stx._cleanupContainer(document.querySelector('main'))

    expect(scopeIds()).not.toContain('with_destroy_1')
    expect(destroyed).toBe(1)
  })

  it('leaves an unbound registration alone (element never processed)', async () => {
    // A scope whose element still sits inside untouched <template> content is
    // never walked, so no __el is recorded. We cannot prove it is dead, and a
    // later clone re-uses the registration — it must survive the sweep.
    await mountScopes(`<main></main>`, { never_bound_1: { __destroyCallbacks: [] } })
    window.stx._cleanupContainer(document.querySelector('main'))
    expect(scopeIds()).toContain('never_bound_1')
  })
})
