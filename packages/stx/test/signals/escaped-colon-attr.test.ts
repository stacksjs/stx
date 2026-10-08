/**
 * `::attr` is the escape for a literal colon attribute.
 *
 * stx already has this convention for directives -- `@@if` renders `@if` --
 * and the runtime has a deliberate exclusion for `::` in its generic attribute
 * path, so the intent was clearly there. The implementation was not: a name
 * beginning with two colons also begins with one, so the event catch-all
 * claimed it, registered a listener for an event named `:attr`, and removed
 * the attribute. The author got neither a binding nor their attribute -- it
 * disappeared, with no error, and nothing took its place.
 *
 * Found by comparing the binding manifest against what the runtime actually
 * consumes (#1984); `::` appeared exactly once in the whole runtime, with no
 * test and no documentation anywhere in the repo.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
let booted = 0

async function boot(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `esc_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

/** Attribute names and values on the probe element, after hydration. */
function attributes(): Record<string, string> {
  const el = document.querySelector('[data-id="probe"]')
  const out: Record<string, string> = {}
  // eslint-disable-next-line ts/no-explicit-any
  for (const attr of [...el.attributes] as any[])
    out[attr.name] = attr.value
  return out
}

describe('an escaped colon attribute', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    delete window.__stx_host
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('renders as a literal single-colon attribute', async () => {
    const n = window.stx.state(1)
    await boot('<div data-id="probe" ::foo="bar" :text="n"></div>', { n })
    expect(attributes()[':foo']).toBe('bar')
  })

  it('leaves the doubled form behind', async () => {
    const n = window.stx.state(1)
    await boot('<div data-id="probe" ::foo="bar" :text="n"></div>', { n })
    expect(attributes()['::foo']).toBeUndefined()
  })

  it('does not disappear, which is what it used to do', async () => {
    // The regression this file exists for. Asserted on its own so a future
    // change that strips the attribute again fails with the right name.
    const n = window.stx.state(1)
    await boot('<div data-id="probe" ::foo="bar" :text="n"></div>', { n })
    const names = Object.keys(attributes())
    expect(names.some(name => name.endsWith('foo'))).toBe(true)
  })

  it('does not evaluate the value as an expression', async () => {
    // `:foo="bar"` would have thrown on an undefined `bar`; the escape means
    // the value is text, so an unresolvable name is simply the string.
    const n = window.stx.state(1)
    await boot('<div data-id="probe" ::title="undefinedName()" :text="n"></div>', { n })
    expect(attributes()[':title']).toBe('undefinedName()')
  })

  it('does not bind an event for it', async () => {
    let fired = 0
    const n = window.stx.state(1)
    await boot('<button data-id="probe" ::click="go()" :text="n"></button>', { n, go: () => { fired++ } })
    const el = document.querySelector('[data-id="probe"]')
    el.dispatchEvent(new window.Event('click'))
    el.dispatchEvent(new window.Event(':click'))
    await settle()
    expect(fired).toBe(0)
    expect(attributes()[':click']).toBe('go()')
  })

  it('leaves the real bindings on the same element working', async () => {
    const n = window.stx.state('first')
    await boot('<div data-id="probe" ::foo="bar" :text="n"></div>', { n })
    expect(document.querySelector('[data-id="probe"]').textContent).toBe('first')

    n.set('second')
    await settle()
    expect(document.querySelector('[data-id="probe"]').textContent).toBe('second')
    expect(attributes()[':foo']).toBe('bar')
  })

  it('handles more than one on an element', async () => {
    const n = window.stx.state(1)
    await boot('<div data-id="probe" ::a="1" ::b="2" :text="n"></div>', { n })
    const attrs = attributes()
    expect(attrs[':a']).toBe('1')
    expect(attrs[':b']).toBe('2')
  })

  it('escapes a name the runtime would otherwise treat as a directive', async () => {
    // The case the escape is actually for: a consumer that wants a literal
    // `:class` or `:if` attribute rather than stx's meaning for it.
    const n = window.stx.state(1)
    await boot('<div data-id="probe" ::class="raw" :text="n"></div>', { n })
    expect(attributes()[':class']).toBe('raw')
  })
})
