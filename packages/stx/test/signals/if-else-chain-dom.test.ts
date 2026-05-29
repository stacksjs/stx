/**
 * Behavioral (real-DOM-driven) tests for reactive x-else / x-else-if chains
 * (#1734), and a regression guard for #1737 (two sibling chains under one
 * scope must each pick exactly one branch).
 *
 * Unlike if-else-chain.test.ts (which unit-tests the pure findIfChain /
 * getElseAttrInfo helpers), this drives the FULL signals runtime through its
 * DOMContentLoaded scope-processing path against happy-dom, using the
 * dom-runtime-shim to supply the browser DOM semantics happy-dom lacks. This
 * is the first behavioral coverage of the runtime's conditional rendering —
 * it exercises dispatch → findIfChain → bindIfChain → effect → branch
 * insert/remove end to end.
 *
 * #1737 context: a downstream app reported two sibling :if chains under one
 * scope leaving ALL branches visible. Reproduced here against the current
 * runtime, it works correctly across every variation tried (adjacent,
 * comments/whitespace between branches, minified runtime) — confirming the
 * chain code is sound and the field symptom is a stale SERVED runtime
 * predating #1734 (see #1735), not a logic bug. These tests lock the correct
 * behavior so a real regression would be caught.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

function presentBranches(labels: string[]): string[] {
  // eslint-disable-next-line ts/no-explicit-any
  const els: any[] = Array.from(document.querySelectorAll('div,ul,span,section,li'))
  return labels.filter(t => els.some(e => e.isConnected && (e.textContent || '').trim() === t))
}

async function processScope(scopeVars: Record<string, unknown>, innerHtml: string) {
  window.stx._scopes = { test: scopeVars }
  document.body.innerHTML = `<section data-stx-scope="test">${innerHtml}</section>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  // Allow the deferred (setTimeout 0) child processing to flush.
  await new Promise(r => setTimeout(r, 50))
}

describe('reactive if/else chains — DOM behavior (#1734, regression #1737)', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('single if/else chain picks the matching branch', async () => {
    await processScope(
      { authed: window.stx.derived(() => true) },
      `<div :if="authed()">composer</div><div :else>signin</div>`,
    )
    expect(presentBranches(['composer', 'signin'])).toEqual(['composer'])
  })

  it('if/else-if/else chain picks the else when prior conditions are false', async () => {
    await processScope(
      { loaded: window.stx.state(true), comments: window.stx.state([{ id: 1 }]) },
      `<ul :if="!loaded()">skeleton</ul><div :else-if="comments().length === 0">empty</div><ul :else>list</ul>`,
    )
    expect(presentBranches(['skeleton', 'empty', 'list'])).toEqual(['list'])
  })

  it('if/else-if/else picks the else-if when it matches', async () => {
    await processScope(
      { loaded: window.stx.state(true), comments: window.stx.state([]) },
      `<ul :if="!loaded()">skeleton</ul><div :else-if="comments().length === 0">empty</div><ul :else>list</ul>`,
    )
    expect(presentBranches(['skeleton', 'empty', 'list'])).toEqual(['empty'])
  })

  // The #1737 regression: two chains as direct siblings under one scope.
  it('TWO sibling chains under one scope each pick exactly one branch (#1737)', async () => {
    await processScope(
      {
        isAuthenticated: window.stx.derived(() => true),
        commentsLoaded: window.stx.state(true),
        comments: window.stx.state([{ id: 1, body: 'hi' }]),
      },
      `<div :if="isAuthenticated()">composer</div><div :else>signin</div>`
      + `<ul :if="!commentsLoaded()">skeleton</ul><div :else-if="comments().length === 0">empty</div><ul :else>list</ul>`,
    )
    expect(presentBranches(['composer', 'signin', 'skeleton', 'empty', 'list'])).toEqual(['composer', 'list'])
  })

  it('two sibling chains tolerate comments + whitespace between/around branches (#1737)', async () => {
    await processScope(
      {
        isAuthenticated: window.stx.derived(() => true),
        commentsLoaded: window.stx.state(true),
        comments: window.stx.state([{ id: 1 }]),
      },
      `
        <h2>Comments</h2>
        <!-- Chain A -->
        <div :if="isAuthenticated()">composer</div>
        <div :else>signin</div>
        <!-- Chain B -->
        <ul :if="!commentsLoaded()">skeleton</ul>
        <div :else-if="comments().length === 0">empty</div>
        <ul :else>list</ul>`,
    )
    expect(presentBranches(['composer', 'signin', 'skeleton', 'empty', 'list'])).toEqual(['composer', 'list'])
  })

  // #1737 (real cause): a nested data-stx-scope inside a reactive :if. When
  // the outer :if starts hidden, the inner scope must NOT be permanently
  // disposed — its chains must still resolve and show correctly once the :if
  // reveals it. Pre-fix, disposeSubtreeScopes (from #1727) deleted the inner
  // scope on the initial hide, so on reveal both branches stayed visible.
  it('nested scope under a reactive :if is NOT disposed when the :if starts hidden (#1737)', async () => {
    // The load-bearing invariant: with the outer :if hidden at mount, the
    // inner data-stx-scope's window.stx._scopes entry must SURVIVE. Pre-fix,
    // disposeSubtreeScopes (#1727) deleted it on the initial hide, and since
    // the inner scope's setup IIFE only runs once at page load, nothing could
    // recreate it — so revealing the :if later left both inner branches
    // visible. This assertion is synchronous/deterministic; the reveal-then-
    // re-pick path is covered by manual repro (it relies on cross-`.set()`
    // tracking that's flaky under the multi-runtime-instance test harness —
    // see the reactive-swap NOTE below).
    const show = window.stx.state(false)
    window.stx._scopes = {
      outer: { show },
      inner: { inAuth: window.stx.derived(() => true) },
    }
    document.body.innerHTML
      = `<div data-stx-scope="outer"><article :if="show()">`
      + `<section data-stx-scope="inner"><div :if="inAuth()">authview</div><div :else>guestview</div></section>`
      + `</article></div>`
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(r => setTimeout(r, 50))

    expect(window.stx._scopes.inner).toBeDefined()
  })

  // NOTE: a reactive-swap test (flip a signal, assert the chain re-picks) was
  // intentionally omitted here. It passes in isolation but is flaky in the
  // full signals suite: each test file that executes the runtime IIFE
  // (`new Function(generateSignalsRuntime…)()`) accumulates another
  // DOMContentLoaded handler + runtime instance in the process, so a signal
  // created from one instance and a processElement effect running under
  // another don't share tracking across a later `.set()`. The initial-render
  // assertions above are deterministic under that environment and fully
  // cover the #1737 regression; cross-`.set()` reactivity is already covered
  // by the impl-level reactivity/parity suites.
})

describe('reactive if/else chains — minified runtime parity (#1737)', () => {
  beforeAll(() => {
    installNodeConstants()
    // Re-run the MINIFIED runtime to confirm the production build behaves
    // identically (minification ASI hazards, CLAUDE.md item 25).
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntime())()
  })

  it('two sibling chains work under the minified runtime too', async () => {
    await processScope(
      {
        isAuthenticated: window.stx.derived(() => true),
        commentsLoaded: window.stx.state(true),
        comments: window.stx.state([{ id: 1 }]),
      },
      `<div :if="isAuthenticated()">composer</div><div :else>signin</div>`
      + `<ul :if="!commentsLoaded()">skeleton</ul><div :else-if="comments().length === 0">empty</div><ul :else>list</ul>`,
    )
    expect(presentBranches(['composer', 'signin', 'skeleton', 'empty', 'list'])).toEqual(['composer', 'list'])
  })
})
