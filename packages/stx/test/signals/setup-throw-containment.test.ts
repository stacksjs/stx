/**
 * A throwing page setup must not take down the rest of the document
 * (stacksjs/stx#1805).
 *
 * The reported symptom was that calling one unavailable composable
 * (`useClipboard()`, which never reached the client runtime) rendered the whole
 * page as literal `{{ }}`. The missing name is one bug; the escalation from
 * "this call fails" to "nothing on the page hydrates" is a separate one, and it
 * is the one that turns any authoring mistake into a blank page.
 *
 * The page-setup loop in the DOMContentLoaded handler invoked
 * `window[setupName]()` with no try/catch, unlike the two sibling setup call
 * sites which both wrap it. A throw — from ANY cause, not just a missing
 * import — escaped the forEach and aborted every step after it: the remaining
 * roots, the mount queue, and the binding pass.
 *
 * Containing it does not make the broken call work. It limits the damage to the
 * root that actually broke, and leaves a message naming it.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

let errors: string[] = []
const realError = console.error

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

beforeEach(() => {
  g.document.body.innerHTML = ''
  errors = []
})

/** Run the real DOMContentLoaded path, collecting console.error output. */
function hydrate(html: string): void {
  g.document.body.innerHTML = html
  console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')) }
  try {
    g.window.__stxDomReadyHandler()
  }
  finally {
    console.error = realError
  }
}

describe('a page setup that throws', () => {
  it('does not stop a later root from hydrating', () => {
    // The exact damage: one broken root, every other root dead behind it.
    g.window.__stx_setup_bad = () => { throw new ReferenceError('useClipboard is not defined') }
    g.window.__stx_setup_good = () => ({ greeting: 'hello' })

    hydrate(
      '<main data-stx="__stx_setup_bad"><p id="a" :text="whatever"></p></main>'
      + '<main data-stx="__stx_setup_good"><p id="b" :text="greeting"></p></main>',
    )

    expect(g.document.querySelector('#b').textContent).toBe('hello')
  })

  it('reports the error naming the setup that threw', () => {
    g.window.__stx_setup_named = () => { throw new ReferenceError('useGeolocation is not defined') }
    hydrate('<main data-stx="__stx_setup_named"><p>x</p></main>')

    const reported = errors.filter(e => e.includes('__stx_setup_named'))
    expect(reported).toHaveLength(1)
    expect(reported[0]).toContain('useGeolocation is not defined')
    // Says what it cost, so the console explains the blank area on screen.
    expect(reported[0]).toContain('will not hydrate')
  })

  it('still runs the binding pass for the throwing root itself', () => {
    // Setup failed, so its own signals are missing — but anything resolvable
    // from the ambient scope should still bind rather than staying raw.
    g.window.stx._scopes.amb = { label: 'from ambient' }
    g.window.__stx_setup_partial = () => { throw new Error('boom') }

    hydrate(
      '<main data-stx="__stx_setup_partial"><p>y</p></main>'
      + '<div data-stx-scope="amb"><p id="c" :text="label"></p></div>',
    )

    expect(g.document.querySelector('#c').textContent).toBe('from ambient')
  })

  it('contains a throw from any cause, not just a missing name', () => {
    // The guard is about blast radius, so it must not key off ReferenceError.
    g.window.__stx_setup_type = () => { throw new TypeError('cannot read x of undefined') }
    g.window.__stx_setup_after = () => ({ n: 42 })

    hydrate(
      '<main data-stx="__stx_setup_type"><p>x</p></main>'
      + '<main data-stx="__stx_setup_after"><p id="d" :text="n"></p></main>',
    )

    expect(g.document.querySelector('#d').textContent).toBe('42')
  })

  it('leaves a working page untouched', () => {
    g.window.__stx_setup_ok = () => ({ title: 'fine' })
    hydrate('<main data-stx="__stx_setup_ok"><p id="e" :text="title"></p></main>')

    expect(g.document.querySelector('#e').textContent).toBe('fine')
    expect(errors.filter(e => e.includes('will not hydrate'))).toHaveLength(0)
  })
})
