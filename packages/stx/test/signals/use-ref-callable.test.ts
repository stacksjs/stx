/**
 * A template ref is callable, as well as `.current` / `.value`.
 *
 * `useRef()` returned a plain `{ current, value }` object while every other
 * accessor a script destructures beside it is call-style — `state()`,
 * `derived()`, `useReactiveProp()`. So `myRef()` is what a reader reaches for,
 * and it threw "myRef is not a function".
 *
 * On its own that was survivable, because nothing called the ref. Put it
 * inside an `effect()` and it was not: the first run happens synchronously
 * while the generated `__stx_setup_*()` is still executing, so the TypeError
 * escaped the effect, escaped setup, and left the WHOLE page unhydrated —
 * every `@click` inert, every `{{ }}` unbound, the markup otherwise perfect
 * and the console quiet unless you were already watching DOMContentLoaded.
 * Either API alone worked, which is what made it hard to see.
 *
 * Same reasoning as useCookie becoming a Signal in stacksjs/stx#1710: when two
 * shapes exist for one idea, the one the rest of the API already uses wins.
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

describe('useRef is callable', () => {
  it('reads the bound element when called', () => {
    hydrate('ref_call', {}, '<main ref="shell" data-flag="on"><span>x</span></main>')
    const shell = g.window.stx.useRef('shell')

    expect(typeof shell).toBe('function')
    expect(shell()).toBe(g.document.querySelector('main'))
  })

  it('still reads through .current and .value', () => {
    hydrate('ref_props', {}, '<main ref="shell"></main>')
    const shell = g.window.stx.useRef('shell')

    expect(shell.current).toBe(g.document.querySelector('main'))
    expect(shell.value).toBe(g.document.querySelector('main'))
    expect(shell.current).toBe(shell())
  })

  it('answers null for a name nothing is bound to, by every route', () => {
    hydrate('ref_missing', {}, '<main></main>')
    const missing = g.window.stx.useRef('nothing-here')

    expect(missing()).toBeNull()
    expect(missing.current).toBeNull()
    expect(missing.value).toBeNull()
  })

  it('leaves the rest of the page hydrated', () => {
    // The actual damage. A page setup that calls a ref inside an effect used
    // to throw out of the setup function, so every OTHER binding on the page
    // was never applied either. Modelled through the real [data-stx] path the
    // generated __stx_setup_*() goes through.
    g.document.body.innerHTML = `
      <main ref="shell" data-flag="on">
        <p :text="greeting"></p>
      </main>`
    g.document.body.setAttribute('data-stx', '__stx_setup_ref_page')
    g.window.__stx_setup_ref_page = function () {
      const shell = g.window.stx.useRef('shell')
      g.window.stx.effect(() => {
        if (shell())
          shell().dataset.seen = 'yes'
      })
      return { greeting: 'hello' }
    }

    expect(() => g.window.__stxDomReadyHandler()).not.toThrow()
    expect(g.document.querySelector('p').textContent).toBe('hello')

    g.document.body.removeAttribute('data-stx')
    delete g.window.__stx_setup_ref_page
  })

  it('survives being called from inside an effect', () => {
    // The reported failure. `effect()` runs its body immediately, so this is
    // the setup-time call that used to throw and take the page with it.
    hydrate('ref_effect', {}, '<main ref="shell" data-flag="on"></main>')
    const shell = g.window.stx.useRef('shell')
    let seen: string | null = null

    expect(() => {
      g.window.stx.effect(() => {
        if (shell())
          seen = shell().dataset.flag
      })
    }).not.toThrow()

    expect(seen).toBe('on')
  })
})
