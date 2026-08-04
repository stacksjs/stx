/**
 * `:if` over a plain (non-signal) scope value must not throw out of hydration.
 *
 * bindIf resolves a bare-name condition to `fullScope[expr]` and, if it looks
 * like a signal, reads it directly; anything else falls through to evalExpr.
 * The effect got that guard right. A debug `console.log` sitting immediately
 * above it did not — it called `directSignal()` unconditionally, so a truthy
 * non-function value (`:if="isAdmin"` where the scope holds a plain `true`)
 * threw TypeError.
 *
 * The throw escaped bindIf → processElement → the DOMContentLoaded handler, so
 * it did not degrade one conditional, it aborted hydration for the entire page
 * — every binding after it dead, literal {{ }} on screen. And because
 * `stripConsoleLog` removes these logs from the production runtime, it happened
 * ONLY in dev, i.e. only where anyone would have caught it.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

/** Hydrate a scope through the real DOMContentLoaded path. */
function hydrate(scopeId: string, vars: Record<string, unknown>, html: string) {
  g.window.stx._scopes[scopeId] = vars
  g.document.body.innerHTML = `<div data-stx-scope="${scopeId}">${html}</div>`
  g.window.__stxDomReadyHandler()
}

describe(':if over a plain scope value', () => {
  it('does not throw when the condition names a plain boolean', () => {
    expect(() => hydrate('plain_true', { show: true }, '<section :if="show"><p>shown</p></section>')).not.toThrow()
    expect(g.document.querySelector('section')).not.toBeNull()
  })

  it('does not throw when the condition names a plain string', () => {
    expect(() => hydrate('plain_str', { name: 'ada' }, '<section :if="name"><p>shown</p></section>')).not.toThrow()
    expect(g.document.querySelector('section')).not.toBeNull()
  })

  it('still hides the branch for a plain falsy value', () => {
    hydrate('plain_false', { show: false }, '<section :if="show"><p>hidden</p></section>')
    expect(g.document.querySelector('section')).toBeNull()
  })

  it('leaves the rest of the page hydrated', () => {
    // The actual damage: one bad condition took down every later binding.
    hydrate('plain_rest', { show: true, greeting: 'hello' }, '<section :if="show"></section><p :text="greeting"></p>')
    expect(g.document.querySelector('p').textContent).toBe('hello')
  })

  it('reads a real signal directly, as before', () => {
    const flag = g.window.stx.state(true)
    hydrate('plain_signal', { flag }, '<section :if="flag"><p>shown</p></section>')
    expect(g.document.querySelector('section')).not.toBeNull()
  })

  it('never calls the resolved value outside the signal guard', () => {
    // Structural. A scope lookup is not necessarily callable, so every
    // `directSignal()` must sit under an `_isSignal` / `_isDerived` test. A
    // debug log is exactly the kind of edit that adds an unguarded one back,
    // and it would only fail in dev, where the logs survive stripping.
    const runtime = generateSignalsRuntimeDev()
    const unguarded: string[] = []
    for (let i = runtime.indexOf('directSignal()'); i !== -1; i = runtime.indexOf('directSignal()', i + 1)) {
      const preceding = runtime.slice(Math.max(0, i - 200), i)
      if (!preceding.includes('_isSignal'))
        unguarded.push(runtime.slice(runtime.lastIndexOf('\n', i) + 1, i + 14).trim())
    }
    expect(unguarded).toEqual([])
  })
})
