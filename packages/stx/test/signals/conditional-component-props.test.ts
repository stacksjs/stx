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
    globalThis.MutationObserver = window.MutationObserver
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

  it('does not subscribe a parent binding effect to the child prop it synchronizes', async () => {
    const source = window.stx.state([{ value: 'production', label: 'Production' }])
    const freshOptions = () => source().map((option: { value: string, label: string }) => ({ ...option }))
    window.__stx_setup_fresh_component_props = () => ({ freshOptions })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_fresh_component_props">
        <div
          data-stx-scope="fresh_options_select"
          data-stx-parent-bindings="options"
          :options="freshOptions()"
        ></div>
      </main>
    `
    const component = document.querySelector('[data-stx-scope="fresh_options_select"]')
    shimAttributes(document.body)

    const previousElement = window.__STX_CURRENT_ELEMENT__
    window.__STX_CURRENT_ELEMENT__ = component
    const options = window.stx.useReactiveProp('options', [])
    window.__STX_CURRENT_ELEMENT__ = previousElement
    window.stx._scopes.fresh_options_select = {
      options,
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(options()).toEqual([{ value: 'production', label: 'Production' }])

    source.set([{ value: 'staging', label: 'Staging' }])
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(options()).toEqual([{ value: 'staging', label: 'Staging' }])
    expect(component.getAttribute('options')).toBe(JSON.stringify(options()))
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

  it('keeps a named component model synchronized through a child select', async () => {
    const environment = window.stx.state('production')
    window.__stx_setup_named_select_model = () => ({ environment })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_named_select_model">
        <div data-stx-scope="named_select_model" data-stx-parent-events="update:value" data-stx-parent-bindings="value">
          <select x-model="liveValue">
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </div>
      </main>
    `
    const component = document.querySelector('[data-stx-scope="named_select_model"]')
    const select = component.querySelector('select')
    component.setAttribute('@update:value', 'environment = $event')
    component.setAttribute(':value', 'environment')
    select.setAttribute('@change', 'handleChange')
    shimAttributes(document.body)

    const previousElement = window.__STX_CURRENT_ELEMENT__
    window.__STX_CURRENT_ELEMENT__ = component
    const liveValue = window.stx.useReactiveProp('value', '')
    const emit = window.stx.defineEmits()
    window.__STX_CURRENT_ELEMENT__ = previousElement
    window.stx._scopes.named_select_model = {
      liveValue,
      handleChange(event: Event) {
        emit('update:value', (event.target as HTMLSelectElement).value)
      },
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(select.value).toBe('production')

    select.value = 'staging'
    select.dispatchEvent(new window.Event('change', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(environment()).toBe('staging')
    expect(liveValue()).toBe('staging')
    expect(select.value).toBe('staging')
  })

  it('hydrates component scopes cloned from an active template conditional', async () => {
    const show = window.stx.state(true)
    const parentStatus = window.stx.state('attention')
    window.__stx_setup_template_conditional_component = () => ({ parentStatus, show })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_template_conditional_component">
        <template :if="show()">
          <section>
            <div
              data-stx-scope="conditional_badge"
              data-stx-parent-bindings="status"
              :status="parentStatus()"
            >
              <span class="label">{{ label() }}</span>
            </div>
            <script data-stx-scoped>
              (function() {
                var scopes = window.stx._scopes = window.stx._scopes || {}
                var scope = scopes.conditional_badge = scopes.conditional_badge || {}
                var previousElement = window.__STX_CURRENT_ELEMENT__
                window.__STX_CURRENT_ELEMENT__ = document.querySelector('[data-stx-scope="conditional_badge"]')
                try {
                  var status = window.stx.useReactiveProp('status', 'configured')
                  var label = window.stx.derived(function() { return status() })
                  Object.assign(scope, {
                    status: status,
                    label: label,
                    __mountCallbacks: scope.__mountCallbacks || [],
                    __destroyCallbacks: scope.__destroyCallbacks || [],
                  })
                }
                finally {
                  window.__STX_CURRENT_ELEMENT__ = previousElement
                }
              })()
            </script>
          </section>
        </template>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const badge = document.querySelector('[data-stx-scope="conditional_badge"]')
    expect(badge).not.toBeNull()
    expect(badge.getAttribute('status')).toBe('attention')
    expect(badge.__stx_parent_scope.parentStatus).toBe(parentStatus)
    expect(badge.querySelector('.label').textContent).toBe('attention')
    expect(window.stx._scopes.conditional_badge.status()).toBe('attention')

    parentStatus.set('deployed')
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(badge.querySelector('.label').textContent).toBe('deployed')
  })

  it('finishes hydrating a direct conditional component after its sibling setup registers', async () => {
    const show = window.stx.state(true)
    const parentTitle = window.stx.state('Ready')
    window.__stx_setup_direct_conditional_component = () => ({ parentTitle, show })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_direct_conditional_component">
        <div
          data-stx-scope="direct_conditional_card"
          data-stx-parent-bindings="title"
          :if="show()"
          :title="parentTitle()"
        >
          <span class="title">{{ liveTitle() }}</span>
        </div>
        <script data-stx-scoped>
          (function() {
            var scopes = window.stx._scopes = window.stx._scopes || {}
            var scope = scopes.direct_conditional_card = scopes.direct_conditional_card || {}
            var previousElement = window.__STX_CURRENT_ELEMENT__
            window.__STX_CURRENT_ELEMENT__ = document.querySelector('[data-stx-scope="direct_conditional_card"]')
            try {
              var liveTitle = window.stx.useReactiveProp('title', '')
              Object.assign(scope, {
                liveTitle: liveTitle,
                __mountCallbacks: scope.__mountCallbacks || [],
                __destroyCallbacks: scope.__destroyCallbacks || [],
              })
            }
            finally {
              window.__STX_CURRENT_ELEMENT__ = previousElement
            }
          })()
        </script>
      </main>
    `
    shimAttributes(document.body)
    const card = document.querySelector('[data-stx-scope="direct_conditional_card"]')
    const setupScript = document.querySelector('script[data-stx-scoped]')
    const previousElement = window.__STX_CURRENT_ELEMENT__
    window.__STX_CURRENT_ELEMENT__ = card
    const liveTitle = window.stx.useReactiveProp('title', '')
    window.__STX_CURRENT_ELEMENT__ = previousElement
    window.stx._scopes.direct_conditional_card = {
      liveTitle,
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(card).not.toBeNull()
    expect(card.getAttribute('title')).toBe('Ready')
    expect(card.querySelector('.title').textContent).toBe('Ready')
    expect(window.stx._scopes.direct_conditional_card.liveTitle()).toBe('Ready')

    parentTitle.set('Deployed')
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(card.querySelector('.title').textContent).toBe('Deployed')

    show.set(false)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(card.isConnected).toBe(false)
    expect(setupScript.isConnected).toBe(false)

    show.set(true)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(card.isConnected).toBe(true)
    expect(setupScript.isConnected).toBe(true)
    expect(card.querySelector('.title').textContent).toBe('Deployed')
  })

  it('hydrates a component selected by an if/else-if chain with caller-owned slot state', async () => {
    const loading = window.stx.state(false)
    const ready = window.stx.state(true)
    const saving = window.stx.state(false)
    window.__stx_setup_chain_component = () => ({ loading, ready, saving })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_chain_component">
        <section :if="loading()">Loading</section>
        <section :else-if="ready()">
          <div data-stx-scope="chain_button">
            <button :disabled="liveDisabled()">
              {{ saving() ? 'Saving...' : 'Save changes' }}
            </button>
            <script data-stx-scoped>
              (function() {
                var scopes = window.stx._scopes = window.stx._scopes || {}
                var scope = scopes.chain_button = scopes.chain_button || {}
                var previousElement = window.__STX_CURRENT_ELEMENT__
                window.__STX_CURRENT_ELEMENT__ = document.querySelector('[data-stx-scope="chain_button"]')
                try {
                  var liveDisabled = window.stx.state(false)
                  Object.assign(scope, {
                    liveDisabled: liveDisabled,
                    __mountCallbacks: scope.__mountCallbacks || [],
                    __destroyCallbacks: scope.__destroyCallbacks || [],
                  })
                }
                finally {
                  window.__STX_CURRENT_ELEMENT__ = previousElement
                }
              })()
            </script>
          </div>
        </section>
        <section :else>Unavailable</section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const buttonComponent = document.querySelector('[data-stx-scope="chain_button"]')
    const button = buttonComponent.querySelector('button')
    expect(buttonComponent.__stx_parent_scope.saving).toBe(saving)
    expect(window.stx._scopes.chain_button.liveDisabled()).toBe(false)
    expect(button.hasAttribute(':disabled')).toBe(false)
    expect(button.textContent.trim()).toBe('Save changes')
    expect(button.textContent).not.toContain('{{')

    saving.set(true)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(button.textContent.trim()).toBe('Saving...')
  })

  it('hydrates projected slot conditionals when an initially hidden parent opens', async () => {
    const editing = window.stx.state(false)
    const saving = window.stx.state(false)
    window.__stx_setup_hidden_slot_component = () => ({ editing, saving })
    window.stx._scopes.hidden_slot_button = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
    }

    document.body.innerHTML = `
      <main data-stx="__stx_setup_hidden_slot_component">
        <section :if="editing()">
          <div data-stx-scope="hidden_slot_button">
            <button>
              <span :if="!saving()">Save metadata</span>
              <span :if="saving()">Saving...</span>
            </button>
          </div>
        </section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    editing.set(true)
    await new Promise(resolve => setTimeout(resolve, 20))

    const button = document.querySelector('[data-stx-scope="hidden_slot_button"] button')
    expect(button.textContent.trim()).toBe('Save metadata')

    saving.set(true)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(button.textContent.trim()).toBe('Saving...')
  })
})
