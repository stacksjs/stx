import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('component lifecycle ownership', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line ts/no-explicit-any
    ;(globalThis as any).MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('keeps composable cleanup scoped to a component during SPA load', async () => {
    document.body.innerHTML = `
      <main data-stx-content>
        <div id="rates" data-stx-scope="rates_table"></div>
      </main>
    `
    shimAttributes(document.body)

    const root = document.querySelector('#rates')
    window.stx._scopes.rates_table = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    window.__STX_CURRENT_ELEMENT__ = root
    const rates = window.stx.useReactiveProp('rates', [])
    window.__STX_CURRENT_ELEMENT__ = null

    window.dispatchEvent(new window.Event('stx:load'))
    await new Promise(resolve => setTimeout(resolve, 20))

    root.setAttribute('rates', JSON.stringify([{ id: 1 }, { id: 2 }]))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(rates()).toEqual([{ id: 1 }, { id: 2 }])
    expect(window.stx._scopes.rates_table.__destroyCallbacks).toHaveLength(1)
  })

  it('tracks kebab-case DOM attributes for camelCase component props', async () => {
    document.body.innerHTML = `
      <main data-stx-content>
        <div id="sidebar" data-stx-scope="mail_sidebar"></div>
      </main>
    `
    shimAttributes(document.body)

    const root = document.querySelector('#sidebar')
    window.stx._scopes.mail_sidebar = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    window.__STX_CURRENT_ELEMENT__ = root
    const unreadCounts = window.stx.useReactiveProp('unreadCounts', {})
    window.__STX_CURRENT_ELEMENT__ = null

    root.setAttribute('unread-counts', JSON.stringify({ inbox: 15 }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(unreadCounts()).toEqual({ inbox: 15 })
  })
})
