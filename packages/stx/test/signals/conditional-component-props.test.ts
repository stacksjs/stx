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

  it('falls native events through signal component wrappers without duplicating emitted events', async () => {
    const nativeClicks = window.stx.state(0)
    const submitted = window.stx.state(0)
    const handleClick = () => nativeClicks.update((value: number) => value + 1)
    const handleSubmit = () => submitted.update((value: number) => value + 1)

    window.__stx_setup_component_events = () => ({ handleClick, handleSubmit })
    window.stx._scopes.event_button = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }
    window.stx._scopes.event_form = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.body.innerHTML = `
      <main data-stx="__stx_setup_component_events">
        <div data-stx-scope="event_button" data-stx-parent-events="click">
          <button type="button">Open</button>
        </div>
        <div data-stx-scope="event_form" data-stx-parent-events="submit">
          <form><button type="submit">Save</button></form>
        </div>
      </main>
    `
    const buttonComponent = document.querySelector('[data-stx-scope="event_button"]')
    const formComponent = document.querySelector('[data-stx-scope="event_form"]')
    buttonComponent.setAttribute('@click', 'handleClick')
    formComponent.setAttribute('@submit', 'handleSubmit')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    buttonComponent.querySelector('button').dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(nativeClicks()).toBe(1)

    const previousElement = window.__STX_CURRENT_ELEMENT__
    window.__STX_CURRENT_ELEMENT__ = formComponent
    const emit = window.stx.defineEmits()
    window.__STX_CURRENT_ELEMENT__ = previousElement

    emit('submit', { id: 1 })
    formComponent.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true }))
    expect(submitted()).toBe(1)
  })
})
