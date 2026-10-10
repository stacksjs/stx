/**
 * Hydration driven by the server's list instead of by walking (#1984).
 *
 * `processElement` finds its work by recursing over childNodes and reading every
 * element's attributes. A native host cannot do that -- a view hierarchy has no
 * attributes to read and no selector to match -- and on the web it is discovery
 * repeated in every browser for an answer the server already had.
 *
 * With `window.__stx_bindings` present the runtime stops searching: it resolves
 * each id, binds that element, and never touches its children. The tests below
 * have to show BOTH halves of that, because a manifest path that quietly falls
 * back to the walk would pass a test that only checks the bindings work.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { extractBindingManifest } from '../../src/binding-manifest'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 40))

let booted = 0
/** Render markup through the manifest extractor, then hydrate what it produced. */
async function hydrateWithManifest(
  markup: string,
  scope: Record<string, unknown>,
  { shipManifest = true }: { shipManifest?: boolean } = {},
): Promise<void> {
  const { html, manifest } = extractBindingManifest(markup)
  const name = `mf_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  // The native adapter carries the compiled document shape, while browser
  // output may carry the entries array directly. Other tests below pin the
  // array path; use the document shape here so both contracts stay covered.
  window.__stx_bindings = shipManifest ? manifest : undefined
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${html}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

const text = (selector: string): string => document.querySelector(selector)?.textContent ?? ''

describe('hydration driven by the binding manifest', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  afterEach(() => {
    delete window.__stx_bindings
  })

  it('binds a nested element the walk would have had to recurse to reach', async () => {
    const label = window.stx.state('first')
    await hydrateWithManifest(
      '<section><div><p data-id="deep" :text="label"></p></div></section>',
      { label },
    )
    expect(text('[data-id="deep"]')).toBe('first')

    label.set('second')
    await settle()
    expect(text('[data-id="deep"]')).toBe('second')
  })

  it('binds only what the manifest lists — proving the walk did not run', async () => {
    const label = window.stx.state('bound')
    const { html, manifest } = extractBindingManifest(
      '<p data-id="listed" :text="label"></p><p data-id="hidden" :text="label"></p>',
    )
    // Drop the second entry. If the runtime still walked, it would find and
    // bind that element anyway, and this test would not be able to tell the
    // two paths apart.
    const name = `mf_partial_${++booted}`
    window[`__stx_setup_${name}`] = () => ({ label })
    window.__stx_bindings = manifest.entries.slice(0, 1)
    document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${html}</main>`
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await settle()

    expect(text('[data-id="listed"]')).toBe('bound')
    expect(text('[data-id="hidden"]')).toBe('')
    // And the unbound one still carries its directive, untouched.
    expect(document.querySelector('[data-id="hidden"]').getAttribute(':text')).toBe('label')
  })

  it('falls back to the walk when the page ships no manifest', async () => {
    const label = window.stx.state('walked')
    await hydrateWithManifest(
      '<section><p data-id="nolist" :text="label"></p></section>',
      { label },
      { shipManifest: false },
    )
    expect(text('[data-id="nolist"]')).toBe('walked')
  })

  it('carries events and attribute bindings, not just text', async () => {
    let clicks = 0
    const hint = window.stx.state('press me')
    const { html, manifest } = extractBindingManifest(
      '<button data-id="go" :title="hint"></button>',
    )
    const name = `mf_evt_${++booted}`
    window[`__stx_setup_${name}`] = () => ({ hint, go: () => { clicks += 1 } })
    document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${html}</main>`
    // @-attributes cannot survive this parser, so the click is attached and
    // its manifest entry extended the same way the server would have listed it.
    document.querySelector('[data-id="go"]').setAttribute('@click', 'go()')
    manifest.entries[0].bindings.push({ name: '@click', value: 'go()', kind: 'event' })
    window.__stx_bindings = manifest.entries
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await settle()

    expect(document.querySelector('[data-id="go"]').getAttribute('title')).toBe('press me')
    document.querySelector('[data-id="go"]').click()
    await settle()
    expect(clicks).toBe(1)
  })

  it('still renders a :for, whose rows are not in the manifest at all', async () => {
    const rows = window.stx.state([{ id: 1, label: 'a' }, { id: 2, label: 'b' }])
    await hydrateWithManifest(
      '<ul><li data-row :for="row in rows" :key="row.id" :text="row.label"></li></ul>',
      { rows },
    )
    // The row template is one manifest entry; the two rendered rows are clones
    // that never existed when the manifest was built.
    const rendered = [...document.querySelectorAll('[data-row]')]
      // eslint-disable-next-line ts/no-explicit-any
      .filter((n: any) => n.isConnected)
      // eslint-disable-next-line ts/no-explicit-any
      .map((n: any) => n.textContent)
    expect(rendered).toEqual(['a', 'b'])
  })
})
