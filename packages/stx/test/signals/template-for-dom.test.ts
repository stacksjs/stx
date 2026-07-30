import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('template for DOM binding', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('binds structural directives after each template child is inserted', async () => {
    const pages = window.stx.state([1])
    const selectedMethod = window.stx.state(1)
    window.__stx_setup_template_for = () => ({
      methods: window.stx.derived(() => [
        { id: 1, name: 'Ground' },
        { id: 2, name: 'Express' },
      ]),
      pages,
      selectedMethod,
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_template_for">
        <nav>
          <template :for="page in pages">
            <button :if="page !== 2">{{ page }}</button>
            <span :if="page === 2">{{ page }}</span>
          </template>
        </nav>
        <select>
          <option :for="method in methods">{{ method.name }}</option>
        </select>
        <select id="model-select" x-model.number="selectedMethod">
          <option value="1">Ground</option>
          <option value="2">Express</option>
        </select>
      </main>
    `
    const parsedModelSelect = document.querySelector('#model-select')
    parsedModelSelect.removeAttribute('x-model')
    parsedModelSelect.setAttribute('x-model.number', 'selectedMethod')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    pages.set([1, 2])
    await new Promise(resolve => setTimeout(resolve, 20))

    const nav = document.querySelector('nav')
    const liveElements = Array.from(nav.childNodes).filter((node: any) => node.nodeType === 1)
    const buttons = liveElements.filter((node: any) => node.tagName === 'BUTTON')
    const spans = liveElements.filter((node: any) => node.tagName === 'SPAN')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toBe('1')
    expect(spans).toHaveLength(1)
    expect(spans[0]?.textContent).toBe('2')
    expect(nav.textContent).not.toContain('{{ page }}')

    const options = Array.from(document.querySelector('select').childNodes)
      .filter((node: any) => node.nodeType === 1 && node.tagName === 'OPTION')
    expect(options.map((option: any) => option.textContent)).toEqual(['Ground', 'Express'])

    selectedMethod.set(2)
    await new Promise(resolve => setTimeout(resolve, 0))
    const modelSelect = document.querySelector('#model-select')
    expect(modelSelect.value).toBe('2')
    modelSelect.value = '1'
    modelSelect.dispatchEvent(new window.Event('change'))
    expect(selectedMethod()).toBe(1)
  })

  it('keeps static siblings before nested template loop rows after outer updates', async () => {
    const groups = window.stx.state([
      { type: 'First', items: [{ id: 1, title: 'One' }] },
    ])
    window.__stx_setup_nested_template_for = () => ({ groups })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_nested_template_for">
        <section>
          <template :for="group in groups()">
            <h3>{{ group.type }}</h3>
            <template :for="item in group.items">
              <button>{{ item.title }}</button>
            </template>
          </template>
        </section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    groups.set([
      { type: 'Second', items: [{ id: 2, title: 'Two' }, { id: 3, title: 'Three' }] },
    ])
    await new Promise(resolve => setTimeout(resolve, 20))

    const elements = Array.from(document.querySelector('section').children) as HTMLElement[]
    expect(elements.map(element => element.tagName)).toEqual(['H3', 'BUTTON', 'BUTTON'])
    expect(elements.map(element => element.textContent?.trim())).toEqual(['Second', 'Two', 'Three'])
  })

  it('gives repeated signal components independent scopes and caller props', async () => {
    const fields = window.stx.state([
      { label: 'Name' },
      { label: 'Status' },
    ])
    window.__stx_setup_repeated_components = () => ({ fields })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_repeated_components">
        <section>
          <template :for="field in fields()">
            <div
              data-stx-scope="compiled_child_scope"
              data-stx-parent-bindings="label"
              :label="field.label"
            >
              <span :text="field.label"></span>
            </div>
            <script data-stx-scoped>
              window.stx._scopes.compiled_child_scope = {
                __mountCallbacks: [],
                __destroyCallbacks: []
              }
            </script>
          </template>
        </section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const children = Array.from(document.querySelectorAll('section > [data-stx-scope]')) as HTMLElement[]
    const scopeIds = children.map(child => child.getAttribute('data-stx-scope'))
    expect(children).toHaveLength(2)
    expect(new Set(scopeIds).size).toBe(2)
    expect(scopeIds.every(scopeId => scopeId?.startsWith('compiled_child_scope_for_'))).toBe(true)
    expect(children.map(child => child.getAttribute('label'))).toEqual(['Name', 'Status'])
    expect(children.map(child => child.textContent?.trim())).toEqual(['Name', 'Status'])

    const scripts = Array.from(document.querySelectorAll('section > script[data-stx-scoped]')) as HTMLScriptElement[]
    expect(scripts).toHaveLength(2)
    expect(scripts[0]?.textContent).toContain(scopeIds[0]!)
    expect(scripts[1]?.textContent).toContain(scopeIds[1]!)
  })

  it('binds a nested signal component prop from an element loop item', async () => {
    const deployments = window.stx.state([])
    const loading = window.stx.state(true)
    window.__stx_setup_element_loop_component = () => ({ deployments, loading })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_element_loop_component">
        <section :if="!loading()">
          <button :for="deployment in deployments()">
            <span>{{ deployment.name }}</span>
            <div
              data-stx-scope="compiled_status_scope"
              data-stx-parent-bindings="status"
              :status="deployment.status"
            >
              <span :text="status()"></span>
            </div>
            <script>window.__stx_unrelated_component_runtime = true</script>
            <script data-stx-scoped>
              var root = document.querySelector('[data-stx-scope="compiled_status_scope"]')
              window.__STX_CURRENT_ELEMENT__ = root
              var status = window.stx.useReactiveProp('status', 'configured')
              window.stx._scopes.compiled_status_scope = {
                status: status,
                __mountCallbacks: [],
                __destroyCallbacks: []
              }
              window.__STX_CURRENT_ELEMENT__ = null
            </script>
          </button>
        </section>
      </main>
    `
    shimAttributes(document.body)
    const deferredChild = document.querySelector('[data-stx-scope="compiled_status_scope"]')
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    deferredChild.removeAttribute(':status')
    deployments.set([{ name: 'production', status: 'attention' }])
    loading.set(false)
    await new Promise(resolve => setTimeout(resolve, 20))

    const child = document.querySelector('[data-stx-scope^="compiled_status_scope_for_"]')
    expect(child).not.toBeNull()
    expect(child.getAttribute('status')).toBe('attention')
    const scopeId = child.getAttribute('data-stx-scope')
    const childScope = window.stx._scopes[scopeId]
    expect(childScope.status()).toBe('attention')
    expect(child.querySelector('span')?.textContent).toBe('attention')
    expect(child.hasAttribute('data-stx-deferred-parent-bindings')).toBeFalse()
  })

  it('reapplies a select value after reactive options are inserted', async () => {
    window.__stx_setup_dynamic_select = () => ({
      selected: window.stx.state('2'),
    })
    document.body.innerHTML = `
      <main data-stx="__stx_setup_dynamic_select">
        <select id="dynamic-select" :value="selected()"></select>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 0))

    const select = document.querySelector('#dynamic-select')
    const first = document.createElement('option')
    first.value = '1'
    first.textContent = 'Ground'
    const second = document.createElement('option')
    second.value = '2'
    second.textContent = 'Express'
    select.append(first, second)
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(select.value).toBe('2')
  })

  it('reapplies an x-model select value after reactive options are inserted', async () => {
    const selected = window.stx.state('2')
    window.__stx_setup_dynamic_model_select = () => ({ selected })
    document.body.innerHTML = `
      <main data-stx="__stx_setup_dynamic_model_select">
        <select id="dynamic-model-select" x-model="selected"></select>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 0))

    const select = document.querySelector('#dynamic-model-select')
    const first = document.createElement('option')
    first.value = '1'
    first.textContent = 'Ground'
    const second = document.createElement('option')
    second.value = '2'
    second.textContent = 'Express'
    select.append(first, second)
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(select.value).toBe('2')
    select.value = '1'
    select.dispatchEvent(new window.Event('change'))
    expect(selected()).toBe('1')
  })

  it('preserves an explicitly empty value on an option binding', async () => {
    window.__stx_setup_empty_option = () => ({
      optionValue: window.stx.state(''),
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_empty_option">
        <select>
          <option :value="optionValue">All statuses</option>
        </select>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const option = document.querySelector('option')
    expect(option.hasAttribute('value')).toBe(true)
    expect(option.getAttribute('value')).toBe('')
    expect(option.value).toBe('')
  })

  it('binds events on nodes created by a template loop inside an if chain', async () => {
    const selected = window.stx.state<string[]>([])
    window.__stx_setup_loop_event = () => ({
      categories: window.stx.state([{ id: '4', name: 'Clothing' }]),
      categoryIds: selected,
      formOpen: window.stx.state(true),
      toggleCategory(event: Event) {
        const input = event.target as HTMLInputElement
        selected.set(input.checked ? [input.value] : [])
      },
    })

    // HappyDOM strips @ attributes inside template.content, while :change
    // exercises the same runtime event branch used by @change in browsers.
    document.body.innerHTML = `
      <main data-stx="__stx_setup_loop_event">
        <section :if="formOpen()">
          <div :if="categories().length === 0">No categories</div>
          <div :else>
            <template :for="category in categories()">
              <label>
                <input
                  type="checkbox"
                  :value="category.id"
                  :checked="categoryIds().includes(category.id)"
                  :change="toggleCategory($event)"
                >
                <span>{{ category.name }}</span>
              </label>
            </template>
          </div>
        </section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const checkbox = document.querySelector('input')
    expect(checkbox).not.toBeNull()
    checkbox.checked = true
    checkbox.dispatchEvent(new window.Event('change'))

    expect(selected()).toEqual(['4'])
    expect(checkbox.checked).toBe(true)

    selected.set([])
    expect(checkbox.checked).toBe(false)
    selected.set(['4'])
    expect(checkbox.checked).toBe(true)
  })

  it('binds checkbox arrays with x-model inside template loops', async () => {
    const selected = window.stx.state<string[]>(['2'])
    window.__stx_setup_checkbox_model = () => ({
      categories: window.stx.state([
        { id: '1', name: 'First' },
        { id: '2', name: 'Second' },
      ]),
      selected,
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_checkbox_model">
        <section :if="categories().length > 0">
          <div :if="categories().length === 0">No categories</div>
          <div :else>
            <template :for="category in categories()">
              <label>
                <input type="checkbox" :value="category.id" x-model="selected">
                <span>{{ category.name }}</span>
              </label>
            </template>
          </div>
        </section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const checkboxes = Array.from(document.querySelectorAll('input')) as HTMLInputElement[]
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]?.checked).toBe(false)
    expect(checkboxes[1]?.checked).toBe(true)

    checkboxes[0]!.checked = true
    checkboxes[0]!.dispatchEvent(new window.Event('change'))
    expect(selected()).toEqual(['2', '1'])

    checkboxes[1]!.checked = false
    checkboxes[1]!.dispatchEvent(new window.Event('change'))
    expect(selected()).toEqual(['1'])
  })
})
