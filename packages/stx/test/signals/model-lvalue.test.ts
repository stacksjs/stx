/**
 * `x-model` writes THROUGH a signal, never over it (stacksjs/stx#1883).
 *
 * The read path resolves an expression through an auto-unwrap proxy. The write
 * path did not — it destructured the scope into plain function parameters, so
 * an lvalue like `store.title` assigned onto the raw object and REPLACED the
 * signal with a raw string.
 *
 * Everything else bound to that signal then stopped updating, its `.set` was
 * gone so the next write threw TypeError, and nothing warned. The field the
 * user typed into was the only thing on the page that still looked right,
 * which is why this reads as "some bindings are flaky" rather than as a bug
 * with a location.
 *
 * The proxy's `set` trap already did the correct thing — call `.set()` on a
 * signal-valued property — and was simply never reached from the write path.
 * This is wiring, not new behaviour.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

let seq = 0

/** Mount an input bound to `expr` over a scope, through the normal hydration path. */
async function mount(expr: string, scope: Record<string, unknown>, initial = '') {
  const setupName = `__stx_setup_lvalue_${++seq}`
  window[setupName] = () => scope

  document.body.innerHTML = `<main data-stx="${setupName}"><input id="ctl" value="${initial}"></main>`
  document.querySelector('#ctl').setAttribute('x-model', expr)
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 20))

  return document.querySelector('#ctl')
}

/** What a browser does on a keystroke. */
async function type(el: any, value: string) {
  el.value = value
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
  await new Promise(resolve => setTimeout(resolve, 20))
}

describe('x-model over a store property (#1883)', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('calls .set() instead of replacing the signal', async () => {
    const title = window.stx.state('t0')
    const store = { _isStxStore: true, title }

    const el = await mount('store.title', { store }, 't0')
    await type(el, 't1')

    // The property must still BE the signal, and hold the new value.
    expect(typeof store.title).toBe('function')
    expect(store.title._isSignal).toBe(true)
    expect(store.title).toBe(title)
    expect(title()).toBe('t1')
  })

  it('keeps other subscribers of that signal alive', async () => {
    // The real damage: replacing the signal silently orphans every other
    // binding and effect that was reading it.
    const title = window.stx.state('t0')
    const store = { _isStxStore: true, title }

    const seen: string[] = []
    window.stx.effect(() => { seen.push(title()) })
    expect(seen).toEqual(['t0'])

    const el = await mount('store.title', { store }, 't0')
    await type(el, 't1')

    expect(seen).toEqual(['t0', 't1'])
  })

  it('leaves the signal usable for a second write', async () => {
    // Once the signal was replaced by a string, `.set` was gone and the next
    // write threw TypeError.
    const title = window.stx.state('t0')
    const store = { _isStxStore: true, title }

    const el = await mount('store.title', { store }, 't0')
    await type(el, 't1')
    expect(() => store.title.set('t2')).not.toThrow()
    expect(title()).toBe('t2')
  })
})

describe('x-model over a plain signal still works (#1883)', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('control: the top-level fast path is unchanged', async () => {
    // This branch never went through the broken code and must keep working —
    // it is what nearly every existing template uses.
    const text = window.stx.state('a')
    const el = await mount('text', { text }, 'a')
    await type(el, 'b')

    expect(text()).toBe('b')
    expect(typeof text).toBe('function')
  })

  it('writes to a nested signal held on a plain object', async () => {
    const inner = window.stx.state('x')
    const bag = { inner }

    const el = await mount('bag.inner', { bag }, 'x')
    await type(el, 'y')

    expect(typeof bag.inner).toBe('function')
    expect(inner()).toBe('y')
  })

  it('descends into a signal holding an object, not onto the signal function', async () => {
    // The worst variant, and one the issue does not mention: over
    // state({...}) the write landed on the signal FUNCTION OBJECT, so the
    // typed value was not merely un-notified, it was unrecoverable — form()
    // still returned the original object.
    const form = window.stx.state({ email: 'e0' })

    const el = await mount('form.email', { form }, 'e0')
    await type(el, 'e1')

    expect(form().email).toBe('e1')
    // Nothing should have been stamped onto the signal itself.
    expect(Object.prototype.hasOwnProperty.call(form, 'email')).toBe(false)
  })

  it('still stores a value on a plain non-signal property', async () => {
    // No signal involved: the write must land, even though nothing re-renders.
    // Regressing this to a no-op would be worse than the original bug.
    const draft: Record<string, unknown> = { title: 'd0' }

    const el = await mount('draft.title', { draft }, 'd0')
    await type(el, 'd1')

    expect(draft.title).toBe('d1')
  })

  it('handles a scope key that is not a valid identifier', async () => {
    // The old write path destructured every scope key into a function
    // parameter, so a key like 'my-thing' made the whole write a SyntaxError.
    // Nothing destructures now.
    //
    // The expression has to be a PATH, not a bare name: a bare name is served
    // by the top-level fast path and never reaches the branch this covers, so
    // testing it with `text` would pass either way and assert nothing.
    const inner = window.stx.state('a')
    const bag = { inner }
    const el = await mount('bag.inner', { 'bag': bag, 'my-thing': 1 }, 'a')
    await type(el, 'b')

    expect(inner()).toBe('b')
    expect(typeof bag.inner).toBe('function')
  })
})
