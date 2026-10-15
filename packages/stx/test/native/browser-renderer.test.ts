import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { BrowserScreenRenderer } from '../../src/native/runtime/browser-renderer'
import type { STXNode } from '../../src/native/compiler/ir'

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
