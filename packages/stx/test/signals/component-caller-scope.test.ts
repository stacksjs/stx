import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('component caller scope ownership', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
    // Re-evaluation is valid under HMR and embedded test harnesses. The latest
    // runtime must replace the previous DOM and router event listeners.
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('keeps a forwarded prop bound to the parent when the child uses the same name', async () => {
    const parentTotal = window.stx.state(10)
    const childTotal = window.stx.state(0)

    window.__stx_setup_caller_scope = () => ({
      totalItems: parentTotal,
    })
    window.stx._scopes.caller_scope_child = {
      totalItems: childTotal,
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.body.innerHTML = `
      <main data-stx="__stx_setup_caller_scope">
        <div
          data-stx-scope="caller_scope_child"
          data-stx-parent-bindings="total-items"
          :total-items="totalItems"
        ></div>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const child = document.querySelector('[data-stx-scope="caller_scope_child"]')
    expect(child.__stx_parent_scope.totalItems()).toBe(10)
    expect(child.getAttribute('total-items')).toBe('10')

    parentTotal.set(14)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(child.getAttribute('total-items')).toBe('14')
  })
})
