import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('conditional component props', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('preserves a nested component caller scope before an initially false branch detaches', async () => {
    const show = window.stx.state(false)
    const selected = window.stx.state('')
    const options = [
      { value: 'production', label: 'Production' },
      { value: 'staging', label: 'Staging' },
    ]
    const handleSelect = (value: string) => selected.set(value)

    window.__stx_setup_conditional_props = () => ({})
    window.stx._scopes.deployment_controls = {
      handleSelect,
      show,
      options,
      selected,
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }
    window.stx._scopes.deployment_modal = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }
    window.stx._scopes.deployment_select = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.body.innerHTML = `
      <main data-stx="__stx_setup_conditional_props">
        <div data-stx-scope="deployment_controls">
          <section data-stx-scope="deployment_modal" :if="show()">
            <div
              data-stx-scope="deployment_select"
              data-stx-parent-events="select"
              data-stx-parent-bindings="options"
              @select="handleSelect"
              :options="options"
            ></div>
          </section>
        </div>
      </main>
    `
    const select = document.querySelector('[data-stx-scope="deployment_select"]')
    select.setAttribute('@select', 'handleSelect')
    select.setAttribute(':options', 'options')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(select.__stx_parent_scope.handleSelect).toBe(handleSelect)
    expect(select.__stx_parent_scope.options).toEqual(options)
    expect(select.getAttribute('options')).toBe(JSON.stringify(options))

    show.set(true)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(select.isConnected).toBe(true)
    expect(select.getAttribute('options')).toBe(JSON.stringify(options))

    select.dispatchEvent(new window.CustomEvent('select', { detail: 'staging' }))
    expect(selected()).toBe('staging')
  })
})
