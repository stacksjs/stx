import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { BrowserScreenRenderer } from '../../src/native/runtime/browser-renderer'
import type { STXNode } from '../../src/native/compiler/ir'
import { compileHeadwindToStyle } from '../../src/native/compiler/headwind-to-style'

function fixture() {
  const window = new Window()
  const container = window.document.createElement('div')
  window.document.body.appendChild(container)
  const events: Array<{ id: string, payload: Record<string, unknown> }> = []
  const renderer = new BrowserScreenRenderer(container as unknown as HTMLElement, { event: (id, payload) => events.push({ id, payload }) })
  const node = (id: string, type: string, children: Array<STXNode | string> = [], props: Record<string, unknown> = {}, events: Record<string, string> = {}): STXNode => ({ id, type, children, props, events, style: {} })
  return { window, container, renderer, events, node }
}

describe('the browser peer of the native screen renderer', () => {
  it('retains an auto basis when compiled flex-none overrides a scroller default', () => {
    const { renderer, container, node } = fixture()
    const choice = node('choice', 'View', ['Athletes'])
    choice.style = compileHeadwindToStyle('min-h-[44px] px-3')
    const tabs = node('tabs', 'ScrollView', [choice], { horizontal: true })
    tabs.style = compileHeadwindToStyle('flex-none flex-row')
    renderer.render(node('screen', 'View', [tabs]))
    const scroller = container.querySelector<HTMLElement>('[data-stx-node="tabs"]')!
    expect(scroller.style.getPropertyValue('flex')).toBe('1 1 auto')
    expect(scroller.style.getPropertyValue('flex-grow')).toBe('0')
    expect(scroller.style.getPropertyValue('flex-shrink')).toBe('0')
    renderer.mutate({ version: 1, batchId: 'fill', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'tabs', patch: { style: compileHeadwindToStyle('flex-1') } }] })
    expect(scroller.style.getPropertyValue('flex-basis')).toBe('0px')
  })

  it('keeps zero-flex horizontal scrollers at their intrinsic content size', () => {
    const { renderer, container, node } = fixture()
    const tabs = node('tabs', 'ScrollView', [node('choice', 'View', ['Athletes'], {}, { onPress: 'pick' })], { horizontal: true })
    tabs.style = { flex: 0, flexDirection: 'row' }
    tabs.children[0] = { ...tabs.children[0] as STXNode, style: { minHeight: 44 } }
    renderer.render(node('screen', 'View', [tabs]))
    const scroller = container.querySelector<HTMLElement>('[data-stx-node="tabs"]')!
    expect(scroller.style.getPropertyValue('flex')).toBe('0 0 auto')
    renderer.mutate({ version: 1, batchId: 'expand', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'tabs', patch: { style: { flex: 1 } } }] })
    expect(scroller.style.getPropertyValue('flex')).toBe('1')
    renderer.mutate({ version: 1, batchId: 'intrinsic', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'tabs', patch: { style: { flex: 0 } } }] })
    expect(scroller.style.getPropertyValue('flex')).toBe('0 0 auto')
  })

  it('uses real form controls, normalized edits and accessible labels', () => {
    const { renderer, container, node, events } = fixture()
    renderer.render(node('root', 'View', [node('input', 'TextInput', [], { value: 'Seed', accessibilityLabel: 'Name' }, { onChangeText: 'edit' }), node('toggle', 'Switch', [], { value: true }, { onValueChange: 'toggle' }), node('picker', 'Picker', [], { value: 'b', options: [{ value: 'a', label: 'One' }, { value: 'b', label: 'Two' }] }, { onValueChange: 'pick' })]))
    const input = container.querySelector('input')!
    expect(input.getAttribute('aria-label')).toBe('Name')
    expect(input.value).toBe('Seed')
    input.value = 'Changed'
    input.dispatchEvent(new Event('input'))
    expect(events).toContainEqual({ id: 'edit', payload: { text: 'Changed', value: 'Changed' } })
    expect(container.querySelector('select')?.value).toBe('b')
    expect(container.querySelector('[role="switch"]')).not.toBeNull()
  })

  it('moves keyed rows without replacing the input or losing edits', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'ScrollView', [node('a', 'View', [node('input', 'TextInput', [], { value: 'A' })]), node('b', 'View', [node('label', 'Text', ['B'])])]))
    const input = container.querySelector('input')!
    input.value = 'Unsaved edit'
    renderer.mutate({ version: 1, batchId: '1', baseRevision: 0, revision: 1, operations: [{ op: 'moveChild', parentId: 'root', childId: 'b', index: 0 }, { op: 'updateNode', id: 'label', patch: { children: ['B updated'] } }] })
    expect(container.querySelector('input')).toBe(input)
    expect(input.value).toBe('Unsaved edit')
    expect(container.querySelector('[data-stx-node="root"]')?.firstElementChild?.getAttribute('data-stx-node')).toBe('b')
    expect(container.textContent).toContain('B updated')
  })

  it('rejects invalid batches before applying any of their changes', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View', [node('text', 'Text', ['Original'])]))
    expect(() => renderer.mutate({ version: 1, batchId: 'bad', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'text', patch: { children: ['Partial'] } }, { op: 'insertChild', parentId: 'missing', childId: 'text', index: 0 }] })).toThrow('Missing mutation node')
    expect(container.textContent).toBe('Original')
    renderer.mutate({ version: 1, batchId: 'good', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'text', patch: { children: ['Committed'] } }] })
    expect(container.textContent).toBe('Committed')
  })

  it('rejects an unrenderable icon before committing a batch or replacing a valid screen', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View', [node('text', 'Text', ['Original'])]))
    expect(() => renderer.mutate({ version: 1, batchId: 'bad-icon', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'text', patch: { children: ['Partial'] } }, { op: 'createNode', id: 'icon', node: { type: 'Icon', props: { name: 'missing' } } }] })).toThrow('No browser icon registered')
    expect(container.textContent).toBe('Original')
    expect(() => renderer.render(node('new', 'View', [node('bad', 'Icon', [], { name: 'missing' })]))).toThrow('No browser icon registered')
    expect(container.textContent).toBe('Original')
  })

  it('does not activate a disabled view button from the keyboard', () => {
    const { renderer, container, node, events, window } = fixture()
    renderer.render(node('root', 'View', [node('button', 'View', ['Disabled'], { disabled: true }, { onPress: 'press' })]))
    container.querySelector('[data-stx-node="button"]')!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }))
    expect(events).toEqual([])
  })

  it('reconciles native accessibility states and suppresses disabled actions', () => {
    const { renderer, container, node, events, window } = fixture()
    renderer.render(node('root', 'View', [node('tab', 'View', ['Range'], { accessibilityRole: 'tab', accessibilityHint: 'Choose a range', accessibilityState: { selected: true, disabled: true, checked: 'mixed', expanded: false, busy: false } }, { onPress: 'pick' })]))
    const tab = container.querySelector('[role="tab"]')!
    expect(tab.getAttribute('aria-selected')).toBe('true')
    expect(tab.getAttribute('aria-checked')).toBe('mixed')
    expect(tab.getAttribute('aria-disabled')).toBe('true')
    expect(tab.getAttribute('aria-expanded')).toBe('false')
    expect(tab.getAttribute('aria-busy')).toBe('false')
    expect(tab.getAttribute('tabindex')).toBe('-1')
    tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    tab.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }))
    expect(events).toEqual([])
    renderer.mutate({ version: 1, batchId: 'enable', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'tab', patch: { props: { accessibilityRole: 'tab', accessibilityHint: null, accessibilityState: { selected: false, disabled: false, expanded: true, busy: true } } } }] })
    expect(tab.getAttribute('aria-selected')).toBe('false')
    expect(tab.getAttribute('aria-disabled')).toBe('false')
    expect(tab.getAttribute('aria-expanded')).toBe('true')
    expect(tab.getAttribute('aria-busy')).toBe('true')
    expect(tab.getAttribute('aria-checked')).toBeNull()
    expect(tab.getAttribute('aria-description')).toBeNull()
    expect(tab.getAttribute('tabindex')).toBe('0')
    tab.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }))
    expect(events).toEqual([{ id: 'pick', payload: {} }])
    renderer.mutate({ version: 1, batchId: 'clear', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'tab', patch: { props: { accessibilityState: null } } }] })
    for (const key of ['selected', 'checked', 'disabled', 'expanded', 'busy']) expect(tab.hasAttribute(`aria-${key}`)).toBe(false)
    renderer.dispose()
    tab.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }))
    expect(events).toHaveLength(1)
  })

  it('does not activate an ancestor when a nested control is pressed from the keyboard', () => {
    const { renderer, container, node, events, window } = fixture()
    renderer.render(node('parent', 'View', [node('child', 'View', ['Child'], {}, { onPress: 'child' })], {}, { onPress: 'parent' }))
    container.querySelector('[data-stx-node="child"]')!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(events).toEqual([{ id: 'child', payload: {} }])
  })

  it('applies accessibility disabled state to form controls and ignores disabled edits', () => {
    const { renderer, container, node, events, window } = fixture()
    renderer.render(node('root', 'View', [node('input', 'TextInput', [], { value: 'Original', accessibilityState: { disabled: true } }, { onChangeText: 'edit' })]))
    const input = container.querySelector('input')!
    expect(input.disabled).toBe(true)
    input.value = 'Disabled edit'
    input.dispatchEvent(new window.Event('input'))
    expect(events).toEqual([])
    renderer.mutate({ version: 1, batchId: 'enable-input', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'input', patch: { props: { value: 'Original', accessibilityState: { disabled: false } } } }] })
    expect(input.disabled).toBe(false)
    input.value = 'Enabled edit'
    input.dispatchEvent(new window.Event('input'))
    expect(events).toEqual([{ id: 'edit', payload: { text: 'Enabled edit', value: 'Enabled edit' } }])
  })

  it('preserves SVG geometry and clears detached node handlers', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View', [node('svg', 'Svg', [node('path', 'Path', [], { d: 'M0 0L10 10', strokeWidth: 2 })], { viewBox: [0, 0, 10, 10] }), node('button', 'Button', ['Press'], {}, { onPress: 'press' })]))
    expect(container.querySelector('path')?.getAttribute('stroke-width')).toBe('2')
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 10 10')
    renderer.mutate({ version: 1, batchId: '1', baseRevision: 0, revision: 1, operations: [{ op: 'removeNode', id: 'button' }] })
    expect(renderer.nodes.has('button')).toBe(false)
    renderer.dispose()
    expect(renderer.nodes.size).toBe(0)
    expect(container.textContent).toBe('')
  })
})
