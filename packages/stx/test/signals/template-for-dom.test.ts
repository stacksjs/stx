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

    // The setup body is compiled once and reused for each row. Per-instance
    // script clones are removed after their independent scopes register.
    expect(document.querySelectorAll('section > script[data-stx-scoped]')).toHaveLength(0)
  })

  it('hydrates projected text slots inside component conditions for every loop row', async () => {
    const pages = window.stx.state([1, 2, 3])
    const current = window.stx.state(1)
    const selected = window.stx.state(0)
    const select = (page: number) => selected.set(page)
    window.__stx_setup_conditional_loop_components = () => ({ current, pages, select, selected })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_conditional_loop_components">
        <nav>
          <template :for="page in pages()">
            <template :if="page === current()">
              <div
                data-stx-scope="compiled_active_button"
                data-stx-parent-events="click"
                @click="select(page)"
              ><button>{{ page }}</button></div>
              <script data-stx-scoped>
                window.stx._scopes.compiled_active_button = {
                  __mountCallbacks: [],
                  __destroyCallbacks: []
                }
              </script>
            </template>
            <template :if="page !== current()">
              <div
                data-stx-scope="compiled_inactive_button"
                data-stx-parent-events="click"
                @click="select(page)"
              ><button>{{ page }}</button></div>
              <script data-stx-scoped>
                window.stx._scopes.compiled_inactive_button = {
                  __mountCallbacks: [],
                  __destroyCallbacks: []
                }
              </script>
            </template>
          </template>
        </nav>
      </main>
    `
    const loopTemplate = document.querySelector('template')
    loopTemplate.content.querySelectorAll('[data-stx-scope]').forEach((root: HTMLElement) => {
      root.setAttribute('@click', 'select(page)')
    })
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))

    const immediateButtons = [...document.querySelectorAll('nav [data-stx-scope] button')] as HTMLButtonElement[]
    expect(immediateButtons.map(button => button.textContent?.trim())).toEqual(['1', '2', '3'])

    await new Promise(resolve => setTimeout(resolve, 50))

    const roots = [...document.querySelectorAll('nav [data-stx-scope]')] as HTMLElement[]
    const buttons = roots.map(root => root.querySelector('button') as HTMLButtonElement)
    const scopeIds = roots.map(root => root.getAttribute('data-stx-scope'))
    expect(buttons.map(button => button.textContent?.trim())).toEqual(['1', '2', '3'])
    expect(new Set(scopeIds).size).toBe(3)
    expect(scopeIds.every(scopeId => scopeId?.includes('_for_'))).toBe(true)
    expect(roots.map(root => (root as any).__stx_parent_scope.page())).toEqual([1, 2, 3])

    buttons[1].dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(selected()).toBe(2)
  })

  it('hydrates projected slots after a cloned component registers reactive props', async () => {
    const pages = window.stx.state([1, 2, 3])
    const current = window.stx.state(1)
    const selected = window.stx.state(0)
    const select = (page: number) => selected.set(page)
    window.__stx_setup_reactive_button_loop = () => ({})
    window.stx._scopes.compiled_reactive_pagination = {
      __mountCallbacks: [],
      __destroyCallbacks: [],
      current,
      pages,
      select,
      selected,
    }

    const setupScript = (scopeId: string) => `
      <script data-stx-scoped>
        (function() {
          const { useReactiveProp } = window.stx
          const scopes = window.stx._scopes = window.stx._scopes || {}
          const scope = scopes['${scopeId}'] = scopes['${scopeId}'] || {}
          const previousElement = window.__STX_CURRENT_ELEMENT__
          window.__STX_CURRENT_ELEMENT__ = document.querySelector('[data-stx-scope="${scopeId}"]')
          try {
            const liveLoading = useReactiveProp('loading', false)
            Object.assign(scope, {
              __mountCallbacks: [],
              __destroyCallbacks: [],
              liveLoading,
            })
          }
          finally {
            window.__STX_CURRENT_ELEMENT__ = previousElement
          }
        })()
      <\/script>
    `

    document.body.innerHTML = `
      <main data-stx="__stx_setup_reactive_button_loop">
        <div data-stx-scope="compiled_reactive_pagination"><nav>
          <template :for="page in pages()">
            <template :if="page === current()">
              <div
                data-stx-scope="compiled_reactive_active_button"
                data-stx-parent-events="click"
                @click="select(page)"
              >
                <button>
                  <template :if="liveLoading()"><span>Loading</span></template>
                  <span>{{ page }}</span>
                </button>
              </div>
              ${setupScript('compiled_reactive_active_button')}
            </template>
            <template :if="page !== current()">
              <div
                data-stx-scope="compiled_reactive_inactive_button"
                data-stx-parent-events="click"
                @click="select(page)"
              >
                <button>
                  <template :if="liveLoading()"><span>Loading</span></template>
                  {{ page }}
                </button>
              </div>
              ${setupScript('compiled_reactive_inactive_button')}
            </template>
          </template>
        </nav></div>
      </main>
    `
    const loopTemplate = document.querySelector('template')
    loopTemplate.content.querySelectorAll('[data-stx-scope]').forEach((root: HTMLElement) => {
      root.setAttribute('@click', 'select(page)')
    })
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 50))

    const roots = [...document.querySelectorAll('nav [data-stx-scope]')] as HTMLElement[]
    const buttons = roots.map(root => root.querySelector('button') as HTMLButtonElement)
    expect(buttons.map(button => button.textContent?.trim())).toEqual(['1', '2', '3'])
    expect(roots.map(root => (root as any).__stx_parent_scope.page())).toEqual([1, 2, 3])

    buttons[2].dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(selected()).toBe(3)
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

  it('forwards nested component events with each loop item payload', async () => {
    const rows = window.stx.state([])
    const selected = window.stx.state(null)
    const canUpdate = window.stx.state(true)
    window.__stx_setup_loop_component_events = () => ({
      canUpdate,
      rows,
      selected,
      selectRow(row: { id: number }) {
        selected.set(row)
      },
    })

    window.__stxComponentFactories = window.__stxComponentFactories || {}
    window.__stxComponentFactories.loopButton = (scopeId: string) => {
      const scopes = window.stx._scopes = window.stx._scopes || {}
      const scope = scopes[scopeId] = scopes[scopeId] || {}
      const previousElement = window.__STX_CURRENT_ELEMENT__
      window.__STX_CURRENT_ELEMENT__ = document.querySelector(`[data-stx-scope="${scopeId}"]`)
      try {
        const liveDisabled = window.stx.useReactiveProp('disabled', false)
        const liveAriaLabel = window.stx.useReactiveProp('ariaLabel', '')
        Object.assign(scope, {
          liveDisabled,
          liveAriaLabel,
          __mountCallbacks: [],
          __destroyCallbacks: [],
        })
      }
      finally {
        window.__STX_CURRENT_ELEMENT__ = previousElement
      }
    }
    const setupScript = (scopeId: string) => `<script data-stx-scoped>window.__stxComponentFactories.loopButton("${scopeId}")<\/script>`

    document.body.innerHTML = `
      <main data-stx="__stx_setup_loop_component_events">
        <template :for="row in rows()">
          <div
            data-stx-scope="compiled_row_actions"
            data-stx-parent-bindings="record can-update"
            data-stx-parent-events="edit"
            :record="row"
            :can-update="canUpdate()"
            @edit="selectRow"
          >
            <template :if="canUpdate()">
              <div
                data-stx-scope="compiled_row_button"
                data-stx-parent-events="click"
                @click="emit('edit', record())"
              ><button>Edit</button></div>
              ${setupScript('compiled_row_button')}
            </template>
          </div>
          <script data-stx-scoped>
            (function() {
              const scopes = window.stx._scopes = window.stx._scopes || {}
              const scope = scopes.compiled_row_actions = scopes.compiled_row_actions || {}
              const previousElement = window.__STX_CURRENT_ELEMENT__
              window.__STX_CURRENT_ELEMENT__ = document.querySelector('[data-stx-scope="compiled_row_actions"]')
              try {
                const record = window.stx.useReactiveProp('record', {})
                const canUpdate = window.stx.useReactiveProp('canUpdate', false)
                const emit = window.stx.defineEmits()
                Object.assign(scope, {
                  record,
                  canUpdate,
                  emit,
                  __mountCallbacks: [],
                  __destroyCallbacks: []
                })
              }
              finally {
                window.__STX_CURRENT_ELEMENT__ = previousElement
              }
            })()
          <\/script>
        </template>
      </main>
    `
    const eventLoopTemplate = document.querySelector('template')
    eventLoopTemplate.content.querySelector('[data-stx-parent-events="edit"]')?.setAttribute('@edit', 'selectRow')
    eventLoopTemplate.content.querySelector('[data-stx-parent-events="click"]')?.setAttribute('@click', "emit('edit', record())")
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))
    rows.set([{ id: 11 }, { id: 22 }])
    await new Promise(resolve => setTimeout(resolve, 50))

    const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
    expect(buttons).toHaveLength(2)
    const revealedRow = buttons[1]!.closest('[data-stx-parent-events="edit"]') as HTMLElement & { __stx_shown_at: number }
    revealedRow.__stx_shown_at = performance.now()
    expect(performance.now() - revealedRow.__stx_shown_at).toBeLessThan(50)
    buttons[1]!.dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(selected()).toEqual({ id: 22 })
  })

  it('binds object props when a signal component is its own loop root', async () => {
    const originalWarn = console.warn
    const warnings: string[] = []
    console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(' '))

    const dnsResource = { id: 'dns', name: 'stacksjs.com', status: 'configured', value: '4 records' }
    const loadBalancerResource = { id: 'load-balancer', name: 'Load balancer', status: 'attention', value: '2 targets' }
    const groups = window.stx.state([
      {
        label: 'Network',
        resources: [dnsResource, loadBalancerResource],
      },
    ])
    window.__stx_setup_component_root_loop = () => ({ groups })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_component_root_loop">
        <section :for="group in groups()">
          <h2>{{ group.label }}</h2>
          <div
            data-stx-scope="compiled_resource_scope"
            data-stx-parent-bindings="item value"
            :for="resource in group.resources"
            :item="resource"
            :value="resource.value"
          >
            <button>
              <span :text="item()?.name || 'Unnamed resource'"></span>
              <strong :text="item()?.status || 'inactive'"></strong>
              <em :text="value()"></em>
            </button>
          </div>
          <script data-stx-scoped>
            var root = document.querySelector('[data-stx-scope="compiled_resource_scope"]')
            window.__STX_CURRENT_ELEMENT__ = root
            var item = window.stx.useReactiveProp('item', null)
            var value = window.stx.useReactiveProp('value', '')
            window.stx._scopes.compiled_resource_scope = {
              item: item,
              value: value,
              __mountCallbacks: [],
              __destroyCallbacks: []
            }
            window.__STX_CURRENT_ELEMENT__ = null
          </script>
        </section>
      </main>
    `
    shimAttributes(document.body)
    let originalScopeDestroyed = false
    window.stx._scopes.compiled_resource_scope = {
      __mountCallbacks: [],
      __destroyCallbacks: [() => {
        originalScopeDestroyed = true
      }],
    }
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const children = Array.from(document.querySelectorAll('[data-stx-scope^="compiled_resource_scope_for_"]')) as HTMLElement[]
    expect(originalScopeDestroyed).toBeTrue()
    expect(window.stx._scopes.compiled_resource_scope).toBeUndefined()
    expect(children).toHaveLength(2)
    expect(children.map(child => child.querySelector('span')?.textContent)).toEqual(['stacksjs.com', 'Load balancer'])
    expect(children.map(child => child.querySelector('strong')?.textContent)).toEqual(['configured', 'attention'])
    expect(children.map(child => child.querySelector('em')?.textContent)).toEqual(['4 records', '2 targets'])
    expect(warnings).toEqual([])
    expect(children.map(child => child.getAttribute('value'))).toEqual(['4 records', '2 targets'])
    expect(window.stx._scopes[children[0]?.getAttribute('data-stx-scope')]?.item()).toBe(dnsResource)
    expect(window.stx._scopes[children[1]?.getAttribute('data-stx-scope')]?.item()).toBe(loadBalancerResource)
    expect(children.every(child => child.hasAttribute('data-stx-deferred-parent-bindings'))).toBeFalse()
    console.warn = originalWarn
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

  it('binds checkbox indeterminate state through the live DOM property', async () => {
    const mixed = window.stx.state(true)
    window.__stx_setup_checkbox_indeterminate = () => ({ mixed })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_checkbox_indeterminate">
        <input id="mixed-checkbox" type="checkbox" :indeterminate="mixed()">
      </main>
    `
    const checkbox = document.querySelector('#mixed-checkbox') as HTMLInputElement
    Object.defineProperty(checkbox, 'indeterminate', {
      configurable: true,
      value: false,
      writable: true,
    })
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(checkbox.indeterminate).toBe(true)
    expect(checkbox.hasAttribute('indeterminate')).toBe(false)

    mixed.set(false)
    expect(checkbox.indeterminate).toBe(false)
  })
})
