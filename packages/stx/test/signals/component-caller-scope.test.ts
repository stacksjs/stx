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

describe('queued layout mounts and page declarations', () => {
  it('keeps page collections and flags ahead of unrelated layout locals on first load', async () => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
    const items = window.stx.state([{ id: 1, name: 'Fifty-mile club' }])
    window.__stx_setup_awards_scope = () => ({ items, loading: window.stx.state(false) })
    document.body.innerHTML = `<header id="layout-bell"></header><script id="layout-setup"></script>
      <main data-stx="__stx_setup_awards_scope"><span :for="item in items" :key="item.id" :text="item.name"></span><p id="empty-awards" :if="!items.length">Empty</p><p id="page-loading" :if="loading">Loading</p></main>`
    shimAttributes(document.body)
    const readyState = Object.getOwnPropertyDescriptor(document, 'readyState')
    const currentScript = Object.getOwnPropertyDescriptor(document, 'currentScript')
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' })
    Object.defineProperty(document, 'currentScript', { configurable: true, value: document.querySelector('#layout-setup') })
    try {
      window.stx.mount(() => ({ items: window.stx.state([]), loading: window.stx.state(true) }))
    }
    finally {
      if (readyState) Object.defineProperty(document, 'readyState', readyState)
      else delete document.readyState
      if (currentScript) Object.defineProperty(document, 'currentScript', currentScript)
      else delete document.currentScript
    }
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(document.querySelector('main').textContent).toContain('Fifty-mile club')
    expect(document.querySelector('#empty-awards')).toBeNull()
    expect(document.querySelector('#page-loading')).toBeNull()
    items.set([{ id: 2, name: 'Your longest run' }])
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.querySelector('main').textContent).toContain('Your longest run')
  })
})
