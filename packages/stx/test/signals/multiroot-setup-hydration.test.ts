/**
 * Multi-root setup-fragment hydration.
 *
 * A no-<body> `<script client>` page is tagged with `data-stx` on only its FIRST
 * top-level element (signal-processing.ts marks one element). Before the fix,
 * sibling root elements were orphaned — their `{{ }}` / `:if` / `:for` / x-text
 * never hydrated, which surfaced downstream as "{{ }} doesn't work under
 * :if/:for". The runtime now processes sibling roots under the shared
 * componentScope after the setup runs.
 *
 * Driven through the real signals runtime against happy-dom (the DOMContentLoaded
 * setup path). happy-dom can't iterate :for, but it renders text interpolation
 * in a sibling root, which is exactly the orphaned-hydration path this guards.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('multi-root setup-fragment hydration', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('hydrates {{ }} in sibling root elements, not just the first', async () => {
    // The merged setup function the server would emit for `<script client>`.
    window.__stx_setup_mr = () => ({
      title: window.stx.state('Hello'),
      subtitle: window.stx.state('World'),
    })
    // First root carries data-stx; the <p>/<div> siblings are orphaned roots.
    document.body.innerHTML
      = `<ul data-stx="__stx_setup_mr"><li>list</li></ul>`
      + `<p id="sib1">{{ title }}</p>`
      + `<div id="sib2">{{ subtitle }}</div>`
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(r => setTimeout(r, 50))

    // Both siblings render the SETUP's signal values — proving they hydrate
    // under the shared setup scope, not a fresh/empty one. (Cross-instance
    // reactivity is covered by the real-browser run; asserting it here is flaky
    // under the full suite's shared window.stx realm.)
    expect((document.getElementById('sib1').textContent || '').trim()).toBe('Hello')
    expect((document.getElementById('sib2').textContent || '').trim()).toBe('World')
  })
})
