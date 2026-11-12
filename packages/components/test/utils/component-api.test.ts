import { afterEach, describe, expect, it } from 'bun:test'
import { componentApi } from '../../src/utils/component-api'

/** A component as stx renders one: a scope wrapper holding the methods, around the component's own root. */
function mount(id: string, api: Record<string, unknown> | null): { wrapper: HTMLElement, root: HTMLElement } {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-stx-scope', `scope_${id}`)
  const root = document.createElement('div')
  root.id = id
  root.className = 'widget'
  wrapper.appendChild(root)
  if (api)
    (wrapper as any).__stx_exposed = api
  document.body.appendChild(wrapper)
  return { wrapper, root }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('componentApi', () => {
  it('finds a component\'s methods from its own element, its id, or a selector', () => {
    const api = { reload: () => 'reloaded' }
    const { root, wrapper } = mount('preview', api)

    expect(componentApi(root)).toBe(api)
    expect(componentApi(wrapper)).toBe(api)
    expect(componentApi('preview')).toBe(api)
    expect(componentApi('#preview')).toBe(api)
    expect(componentApi('.widget')).toBe(api)
  })

  it('finds the component inside an element that is around it', () => {
    const api = { open: () => true }
    const { wrapper } = mount('menu', api)
    const around = document.createElement('section')
    document.body.appendChild(around)
    around.appendChild(wrapper)

    expect(componentApi(around)).toBe(api)
  })

  it('tells two components on a page apart', () => {
    const first = { name: () => 'first' }
    const second = { name: () => 'second' }
    mount('one', first)
    mount('two', second)

    expect(componentApi('one')).toBe(first)
    expect(componentApi('two')).toBe(second)
  })

  it('reaches the nearest component from inside a nested one', () => {
    const outer = { which: () => 'outer' }
    const inner = { which: () => 'inner' }
    const a = mount('outer', outer)
    const b = mount('inner', inner)
    a.root.appendChild(b.wrapper)

    // By element: the DOM emulator loses an id's entry when its node is moved.
    expect(componentApi(b.root)).toBe(inner)
    expect(componentApi(a.root)).toBe(outer)
  })

  it('is null where there is nothing to find', () => {
    mount('bare', null)
    document.body.appendChild(document.createElement('p'))

    expect(componentApi('bare')).toBeNull()
    expect(componentApi('missing')).toBeNull()
    expect(componentApi('p')).toBeNull()
    expect(componentApi('[[not a selector')).toBeNull()
    expect(componentApi(null)).toBeNull()
    expect(componentApi(undefined)).toBeNull()
    expect(componentApi('')).toBeNull()
  })
})
