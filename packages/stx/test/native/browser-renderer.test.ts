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
  it('adds safe-area env insets to authored padding and honors selected edges', () => {
    const { renderer, container, node } = fixture()
    const safeRoot = node('root', 'SafeAreaView', [node('content', 'View')], { edges: ['top', 'bottom'] })
    safeRoot.style = { padding: '8px 10px' }
    renderer.render(safeRoot)
    const root = container.querySelector<HTMLElement>('[data-stx-node="root"]')!
    renderer.mutate({ version: 1, batchId: 'safe-area', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'root', patch: { props: { edges: ['top', 'bottom'] } } }] })
    expect(root.style.paddingTop).toBe('calc(env(safe-area-inset-top, 0px) + 8px)')
    expect(root.style.paddingBottom).toBe('calc(env(safe-area-inset-bottom, 0px) + 8px)')
    expect(root.style.paddingLeft).toBe('10px')
    expect(root.style.paddingRight).toBe('10px')
    renderer.mutate({ version: 1, batchId: 'all-edges', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'root', patch: { props: { edges: null } } }] })
    expect(root.style.paddingLeft).toBe('calc(env(safe-area-inset-left, 0px) + 10px)')
  })

  it('previews platform segments with live values and per-option disabled state', () => {
    const { renderer, container, node, events } = fixture()
    renderer.render(node('period', 'SegmentedControl', [], {
      value: 'day', items: [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month', disabled: true }],
    }, { onValueChange: 'choose' }))
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true')
    expect(buttons[2]!.disabled).toBe(true)
    buttons[2]!.click()
    expect(events).toEqual([])
    buttons[1]!.click()
    expect(events).toEqual([{ id: 'choose', payload: { value: 'week', index: 1 } }])
    renderer.mutate({ version: 1, batchId: 'selected', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'period', patch: { props: { value: 'week', items: [{ value: 'week', label: 'This week' }] } } }] })
    expect(container.querySelectorAll('button')).toHaveLength(1)
    expect(container.querySelector('button')!.textContent).toBe('This week')
    expect(container.querySelector('button')!.getAttribute('aria-pressed')).toBe('true')
    expect(events).toHaveLength(1)
  })

  it('reports parent-relative layout frames and tears the observer down', () => {
    const { renderer, container, node, window, events } = fixture()
    let notify: (() => void) | undefined
    const observed: Element[] = []
    class FakeResizeObserver {
      constructor(callback: () => void) { notify = callback }
      observe(element: Element) { observed.push(element) }
      disconnect() { notify = undefined }
    }
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: FakeResizeObserver })
    renderer.render(node('root', 'View', [node('card', 'View', ['Measured'], {}, { onLayout: 'measure' })]))
    const root = container.querySelector('[data-stx-node="root"]')!
    const card = container.querySelector('[data-stx-node="card"]')!
    Object.defineProperty(root, 'getBoundingClientRect', { value: () => ({ left: 10, top: 20, width: 300, height: 400 }) })
    Object.defineProperty(card, 'getBoundingClientRect', { value: () => ({ left: 22, top: 35, width: 120, height: 48 }) })
    expect(observed.slice(-2)).toEqual([card, root])
    notify?.()
    expect(events).toEqual([{ id: 'measure', payload: { layout: { x: 12, y: 15, width: 120, height: 48 } } }])
    renderer.mutate({ version: 1, batchId: 'remove-handler', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'card', patch: { events: { onLayout: null } } }] })
    notify?.()
    expect(events).toHaveLength(1)
  })

  it('renders Link as an anchor, preserves its destination, and prevents disabled navigation', () => {
    const { renderer, container, node, window, events } = fixture()
    renderer.render(node('root', 'View', [node('link', 'Link', ['Open'], { href: '/details', disabled: true }, { onPress: 'open' })]))
    const link = container.querySelector<HTMLAnchorElement>('a')!
    expect(link.getAttribute('href')).toBe('/details')
    expect(link.getAttribute('role')).toBe('link')
    const click = new window.MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(events).toEqual([])
    renderer.mutate({ version: 1, batchId: 'enable', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'link', patch: { props: { href: '/summary', disabled: false } } }] })
    expect(link.getAttribute('href')).toBe('/summary')
    link.click()
    expect(events).toEqual([{ id: 'open', payload: {} }])
  })

  it.each(['Pressable', 'TouchableOpacity', 'TouchableHighlight'])('infers link roles for %s and preserves an authored role across destination changes', (type) => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View', [node('control', type, ['Open'], { href: '/details' })]))
    const control = container.querySelector('[data-stx-node="control"]')!
    expect(control.getAttribute('role')).toBe('link')
    renderer.mutate({ version: 1, batchId: 'clear', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'control', patch: { props: { href: null } } }] })
    expect(control.getAttribute('role')).toBeNull()
    expect(control.tagName).toBe('BUTTON')
    renderer.mutate({ version: 1, batchId: 'authored', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'control', patch: { props: { to: '/details', accessibilityRole: 'button' } } }] })
    expect(control.getAttribute('role')).toBe('button')
  })

  it('renders native button titles, reconciles them and keeps disabled actions inert', () => {
    const { renderer, container, node, window, events } = fixture()
    renderer.render(node('root', 'View', [node('save', 'Button', ['Fallback'], { title: 'Save' }, { onPress: 'save' })]))
    const button = container.querySelector<HTMLButtonElement>('button')!
    expect(button.textContent).toBe('Save')
    button.click()
    expect(events.map(event => event.id)).toEqual(['save'])
    renderer.mutate({ version: 1, batchId: 'busy', baseRevision: 0, revision: 1, operations: [{ op: 'updateNode', id: 'save', patch: { props: { title: 'Saving…', disabled: true } } }] })
    expect(button.textContent).toBe('Saving…')
    expect(button.disabled).toBe(true)
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    expect(events).toHaveLength(1)
    renderer.mutate({ version: 1, batchId: 'fallback', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'save', patch: { props: { title: null, disabled: false }, children: ['Try again'] } }] })
    expect(button.textContent).toBe('Try again')
  })

  it('renders canonical native picker items and selection through bridge mutations', () => {
    const { renderer, container, node, window, events } = fixture()
    renderer.render(node('root', 'View'))
    renderer.mutate({ version: 1, batchId: 'picker', baseRevision: 0, revision: 1, operations: [
      { op: 'createNode', id: 'pick', node: { type: 'Picker', props: { items: [{ value: '', label: 'Choose' }, { value: 'rx', label: 'Rx' }], value: '', disabled: true }, events: { onValueChange: 'pick' } } },
      { op: 'insertChild', parentId: 'root', childId: 'pick', index: 0 },
    ] })
    const picker = container.querySelector<HTMLSelectElement>('select')!
    expect([...picker.options].map(option => [option.value, option.textContent])).toEqual([['', 'Choose'], ['rx', 'Rx']])
    expect(picker.value).toBe('')
    picker.value = 'rx'
    picker.dispatchEvent(new window.Event('change'))
    expect(events).toEqual([])
    renderer.mutate({ version: 1, batchId: 'enable', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'pick', patch: { props: { selectedValue: 'rx', disabled: false } } }] })
    expect(picker.value).toBe('rx')
    picker.dispatchEvent(new window.Event('change'))
    expect(events).toEqual([{ id: 'pick', payload: { value: 'rx', text: 'rx' } }])
    renderer.mutate({ version: 1, batchId: 'empty', baseRevision: 2, revision: 3, operations: [{ op: 'updateNode', id: 'pick', patch: { props: { items: [], selectedValue: '' } } }] })
    expect(picker.options).toHaveLength(0)
  })

  it('gives titles precedence over bridge text children, including an intentionally empty title', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View'))
    renderer.mutate({ version: 1, batchId: 'button', baseRevision: 0, revision: 1, operations: [
      { op: 'createNode', id: 'save', node: { type: 'Button', props: { title: 'Save' }, children: ['Fallback'] } },
      { op: 'insertChild', parentId: 'root', childId: 'save', index: 0 },
    ] })
    const button = container.querySelector('button')!
    expect(button.textContent).toBe('Save')
    renderer.mutate({ version: 1, batchId: 'clear', baseRevision: 1, revision: 2, operations: [{ op: 'updateNode', id: 'save', patch: { props: { title: '' } } }] })
    expect(button.textContent).toBe('')
  })

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

  it('scrolls a sideways row on one axis and hides the indicator the host hides', () => {
    const { renderer, container, node } = fixture()
    const chips = node('chips', 'ScrollView', [node('chip', 'View', ['All'])], { horizontal: true, showsHorizontalScrollIndicator: false })
    const list = node('list', 'ScrollView', [chips])
    renderer.render(node('screen', 'View', [list]))
    const row = container.querySelector<HTMLElement>('[data-stx-node="chips"]')!
    expect(row.style.getPropertyValue('overflow-x')).toBe('auto')
    expect(row.style.getPropertyValue('overflow-y')).toBe('hidden')
    expect(row.style.getPropertyValue('scrollbar-width')).toBe('none')
    const page = container.querySelector<HTMLElement>('[data-stx-node="list"]')!
    expect(page.style.getPropertyValue('overflow-y')).toBe('auto')
    expect(page.style.getPropertyValue('scrollbar-width')).toBe('')
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

  it('draws a filled platform symbol with its outline\'s glyph when the set has no filled one', () => {
    const window = new Window()
    const container = window.document.createElement('div')
    window.document.body.appendChild(container)
    const icons = { heart: { body: '<path data-glyph="heart"/>', width: 24, height: 24 }, star: { body: '<path data-glyph="star"/>', width: 24, height: 24 }, 'star.fill': { body: '<path data-glyph="star.fill"/>', width: 24, height: 24 } }
    const renderer = new BrowserScreenRenderer(container as unknown as HTMLElement, { icons, event() {} })
    const glyph = (id: string) => decodeURIComponent(container.querySelector(`[data-stx-node="${id}"]`)!.getAttribute('style') || '').match(/data-glyph="([^"]+)"/)?.[1]
    renderer.render({ id: 'root', type: 'View', props: {}, style: {}, events: {}, children: [
      { id: 'heart', type: 'Icon', props: { symbol: 'heart.fill' }, style: {}, events: {}, children: [] },
      { id: 'star', type: 'Icon', props: { symbol: 'star.fill' }, style: {}, events: {}, children: [] },
    ] })
    expect(glyph('heart')).toBe('heart')
    // A filled glyph the set does have is the one drawn.
    expect(glyph('star')).toBe('star.fill')
    expect(() => renderer.render({ id: 'root', type: 'View', props: {}, style: {}, events: {}, children: [{ id: 'gone', type: 'Icon', props: { symbol: 'missing.fill' }, style: {}, events: {}, children: [] }] })).toThrow('No browser icon registered')
  })

  it('animates an outline in the preview with the browser\'s own SMIL', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View', [{ ...node('art', 'Svg', [{ ...node('limb', 'Path', [{ ...node('move', 'Animate'), props: { attributeName: 'd', values: 'M0 0L1 1;M0 0L2 2', dur: '2.4s', keyTimes: '0;1', repeatCount: 'indefinite', frames: [[0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 2, 2]], frameTimes: [0, 1], duration: 2.4 } }]), props: { d: 'M0 0L1 1' } }]), props: { viewBox: [0, 0, 128, 128] } }]))
    const animate = container.querySelector('[data-stx-node="move"]')!
    expect(animate.tagName.toLowerCase()).toBe('animate')
    expect(animate.getAttribute('attributeName')).toBe('d')
    expect(animate.getAttribute('values')).toBe('M0 0L1 1;M0 0L2 2')
    expect(animate.getAttribute('keyTimes')).toBe('0;1')
    // The native keyframes are the renderers' business, not attributes.
    expect(animate.hasAttribute('frames')).toBe(false)
    expect(animate.hasAttribute('duration')).toBe(false)
  })

  it('draws each icon that shares a platform symbol with its own glyph', () => {
    const window = new Window()
    const container = window.document.createElement('div')
    window.document.body.appendChild(container)
    const icons = { leaf: { body: '<path data-glyph="leaf"/>', width: 24, height: 24 }, salad: { body: '<path data-glyph="salad"/>', width: 24, height: 24 }, apple: { body: '<path data-glyph="apple"/>', width: 24, height: 24 } }
    const renderer = new BrowserScreenRenderer(container as unknown as HTMLElement, { icons, event() {} })
    const glyph = (id: string) => decodeURIComponent(container.querySelector(`[data-stx-node="${id}"]`)!.getAttribute('style') || '').match(/data-glyph="([^"]+)"/)?.[1]
    renderer.render({ id: 'root', type: 'View', props: {}, style: {}, events: {}, children: [
      { id: 'salad', type: 'Icon', props: { iconify: 'i-lucide-salad', symbol: 'leaf' }, style: {}, events: {}, children: [] },
      { id: 'apple', type: 'Icon', props: { iconify: 'i-lucide-apple', symbol: 'leaf' }, style: {}, events: {}, children: [] },
      // A bare symbol draws the icon of its own name, not the last one mapped to it.
      { id: 'leaf', type: 'Icon', props: { symbol: 'leaf' }, style: {}, events: {}, children: [] },
    ] })
    expect(glyph('salad')).toBe('salad')
    expect(glyph('apple')).toBe('apple')
    expect(glyph('leaf')).toBe('leaf')
  })

  it('draws nothing for a picture that cannot load, and shows the next one that does', () => {
    const { renderer, container, node, window } = fixture()
    renderer.render(node('root', 'View', [node('avatar', 'Image', [], { source: { uri: 'https://fixture.invalid/missing.png' }, accessibilityLabel: 'Pawel' })]))
    const image = container.querySelector('img') as unknown as HTMLImageElement
    image.dispatchEvent(new window.Event('error'))
    // The browser's broken-image mark and its alt text over the initials under it.
    expect(image.style.visibility).toBe('hidden')
    renderer.render(node('root', 'View', [node('avatar', 'Image', [], { source: { uri: 'https://fixture.invalid/found.png' }, accessibilityLabel: 'Pawel' })]))
    const next = container.querySelector('img') as unknown as HTMLImageElement
    expect(next.getAttribute('data-source')).toBe('https://fixture.invalid/found.png')
    expect(next.style.visibility).toBe('')
    next.dispatchEvent(new window.Event('error'))
    next.dispatchEvent(new window.Event('load'))
    expect(next.style.visibility).toBe('')
  })

  it('places an absolute child against its own parent, as native layout does', () => {
    const { renderer, container, node } = fixture()
    renderer.render(node('root', 'View', [node('phone', 'View', [{ ...node('ring', 'View'), style: { position: 'absolute', left: 10, top: 20 } }])]))
    const phone = container.querySelector('[data-stx-node="phone"]') as unknown as HTMLElement
    const ring = container.querySelector('[data-stx-node="ring"]') as unknown as HTMLElement
    expect(phone.style.position).toBe('relative')
    expect(ring.style.position).toBe('absolute')
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
