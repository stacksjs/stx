/**
 * The host interface, implemented by something that is not a DOM
 * (stacksjs/stx#1984).
 *
 * The runtime's binding layer already writes through a host, and `signals.ts`
 * ships the DOM one. That on its own does not answer the spike: an interface
 * shaped around the DOM will accept a DOM implementation however leaky it is.
 * The answer arrives only when a second implementation that owns no elements
 * satisfies the same methods -- here, by turning every host call into a
 * `NativeMutationOperation` on the bridge.
 *
 * The three places the DOM could have leaked, and what each one proves:
 *
 *   - `setVisible` returns the PREVIOUS visibility, which a UIView cannot be
 *     asked for. Recorded per node instead, so the binder reads nothing.
 *   - `anchor()` is a comment node in the document. Here it is a position in
 *     the host's own ordering that never reaches the native tree.
 *   - `clone()` deep-copies a DOM subtree. A view hierarchy cannot be copied,
 *     so it is materialised from the recorded descriptor.
 *
 * None of the three required a change to the binding layer, which is the
 * go/no-go this issue asked for.
 */
import { describe, expect, it } from 'bun:test'
import { createNativeHost, HOST_METHODS, type NativeNode } from '../../src/native/runtime/native-host'
import { materializeNativeBindingTree } from '../../src/native/runtime/binding-tree'
import { createDocument, createNode } from '../../src/native/compiler/ir'
import { generateSignalsRuntimeDev } from '../../src/signals'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'

/** A host whose batches are collected rather than sent, flushed on demand. */
function harness() {
  const batches: NativeMutationOperation[][] = []
  const host = createNativeHost({
    send: ops => batches.push(ops),
    // Flush explicitly in tests, so batching is observable rather than timing.
    schedule: () => {},
  })
  const node = (id: string, type = 'View'): NativeNode =>
    host.adopt({ __stxId: id }, type)
  return { host, batches, node, ops: () => batches.flat() }
}

describe('the native host satisfies the same contract as the DOM one', () => {
  it('implements every method the runtime calls', () => {
    const { host } = harness()
    for (const method of HOST_METHODS)
      expect(typeof (host as unknown as Record<string, unknown>)[method]).toBe('function')
  })

  it('declares the same methods the runtime\'s DOM host defines', () => {
    /*
     * Read out of the generated runtime rather than hardcoded, so the two
     * cannot drift: a method added to the DOM host without a native one fails
     * here, which is the whole reason for having an interface rather than a
     * convention.
     */
    const runtime = generateSignalsRuntimeDev()
    const start = runtime.indexOf('var stxHost = window.__stx_host || {')
    expect(start).toBeGreaterThan(-1)
    const body = runtime.slice(start, runtime.indexOf('\n  };', start))

    const defined = new Set(
      [...body.matchAll(/^\s{4}(\w+):\s*function/gm)].map(m => m[1]),
    )
    // Every method the DOM host defines must be in the shared contract.
    for (const method of defined)
      expect(HOST_METHODS).toContain(method)
  })
})

describe('host calls become bridge operations', () => {
  it('updates pointer policies and clears the bound style through the mutation protocol', () => {
    const { host, node, ops } = harness()
    const overlay = node('overlay')
    for (const pointerEvents of ['auto', 'none', 'box-none', 'box-only']) {
      host.setStyle(overlay, { pointerEvents }, true)
      host.flush()
      expect(host.snapshot(overlay).style.pointerEvents).toBe(pointerEvents)
      expect(ops().at(-1)).toMatchObject({ op: 'updateNode', id: 'overlay', patch: { style: { pointerEvents } } })
    }
    host.setStyle(overlay, null, true)
    host.flush()
    expect(host.snapshot(overlay).style.pointerEvents).toBeUndefined()
    expect(ops().at(-1)).toMatchObject({ op: 'updateNode', id: 'overlay', patch: { style: { pointerEvents: null } } })
  })

  it('skips stateless child attribute targets when forwarding a parent update', () => {
    const { host } = harness()
    const nested = createNode('View', { 'data-stx-native-host-owner': true }, {}, {}, [
      createNode('Button', { 'data-stx-native-host-root': true, accessibilityLabel: 'Child' }),
    ])
    const own = createNode('Button', { 'data-stx-native-host-root': true })
    const root = createNode('View', { 'data-stx-native-forward': 'accessibility-label', 'data-stx-native-host-owner': true }, {}, {}, [nested, own])
    const tree = materializeNativeBindingTree(createDocument(root, { exports: {}, functions: [], code: '' }), { entries: [] }, host)
    host.setAttribute(tree.root, 'accessibility-label', 'Parent')
    const snapshot = host.snapshot(tree.root)
    expect((snapshot.children[1] as typeof own).props.accessibilityLabel).toBe('Parent')
    expect(((snapshot.children[0] as typeof nested).children[0] as typeof own).props.accessibilityLabel).toBe('Child')
  })

  it('reflects forwarded attributes on both the component scope and the physical control', async () => {
    const { host } = harness()
    const control = createNode('Pressable', { 'data-stx-native-host-root': true })
    const root = createNode('View', { 'data-stx-native-forward': 'test-id', 'data-stx-component-wrapper': true }, {}, {}, [control])
    const tree = materializeNativeBindingTree(createDocument(root, { exports: {}, functions: [], code: '' }), { entries: [] }, host)
    const target = host.descendants(tree.root)[0]
    const observed: Array<string | null> = []
    host.observeAttributes(target, ['test-id'], () => observed.push(host.getAttribute(target, 'test-id')))
    host.setAttribute(tree.root, 'test-id', 'physical')
    await Promise.resolve()
    expect(host.getAttribute(tree.root, 'test-id')).toBe('physical')
    expect(host.getAttribute(target, 'test-id')).toBe('physical')
    const snapshot = host.snapshot(tree.root)
    expect(snapshot.props.testID).toBeUndefined()
    expect((snapshot.children[0] as typeof control).props.testID).toBe('physical')
    host.removeAttribute(tree.root, 'test-id')
    await Promise.resolve()
    expect(host.getAttribute(tree.root, 'test-id')).toBeNull()
    expect(host.getAttribute(target, 'test-id')).toBeNull()
    expect(observed).toEqual(['physical', null])
  })

  it('retains component caller metadata and static attributes on binding handles', () => {
    const { host } = harness()
    const tree = materializeNativeBindingTree(createDocument(createNode('View', {
      'data-stx-parent-events': 'saved update:modelValue',
      'data-stx-parent-bindings': 'modelValue',
      name: 'email',
    }), { exports: {}, functions: [], code: '' }), { entries: [] }, host)
    expect(tree.root.getAttribute('data-stx-parent-events')).toBe('saved update:modelValue')
    expect(tree.root.getAttribute('data-stx-parent-bindings')).toBe('modelValue')
    expect(tree.root.getAttribute('name')).toBe('email')
  })
  it('observes prop writes in batches and cancels pending callbacks on disposal', async () => {
    const { host } = harness()
    const tree = materializeNativeBindingTree(createDocument(createNode('View'), { exports: {}, functions: [], code: '' }, { source: 'test' }), { entries: [] }, host)
    const values: Array<string | null> = []
    const stop = host.observeAttributes(tree.root, ['value'], () => values.push(tree.root.getAttribute('value')))
    host.setAttribute(tree.root, 'other', 'ignored')
    host.setAttribute(tree.root, 'value', 'first')
    host.setAttribute(tree.root, 'value', 'last')
    await Promise.resolve()
    expect(values).toEqual(['last'])
    host.removeAttribute(tree.root, 'value')
    await Promise.resolve()
    expect(values).toEqual(['last', null])
    host.setAttribute(tree.root, 'value', 'cancelled')
    stop()
    await Promise.resolve()
    expect(values).toEqual(['last', null])
  })
  it('removes a subtree once when nested bindings dispose after their parent', () => {
    const { host, node, batches, ops } = harness()
    const parent = node('parent')
    const child = node('child')
    host.insert(parent, child)
    host.flush()
    batches.length = 0
    host.remove(parent)
    host.remove(child)
    host.flush()
    expect(ops()).toEqual([{ op: 'removeNode', id: 'parent' }])
    // Kept descriptors still recreate the removed views on a later insertion.
    const root = node('root')
    host.insert(parent, child)
    host.insert(root, parent)
    host.flush()
    expect(ops().filter(op => op.op === 'createNode').map(op => op.id)).toEqual(['parent', 'child'])
  })
  it('turns setText into an updateNode carrying the text', () => {
    const { host, node, ops } = harness()
    host.setText(node('n1', 'Text'), 'Wildloop')
    host.flush()
    expect(ops()).toEqual([
      { op: 'updateNode', id: 'n1', patch: { children: ['Wildloop'] } },
    ])
  })

  it('coerces a non-string the way the DOM would', () => {
    const { host, node, ops } = harness()
    host.setText(node('n1', 'Text'), 42)
    host.setText(node('n2', 'Text'), null)
    host.flush()
    expect(ops()[0]).toMatchObject({ patch: { children: ['42'] } })
    expect(ops()[1]).toMatchObject({ patch: { children: [''] } })
  })

  it('turns a style binding into a native style patch', () => {
    const { host, node, ops } = harness()
    host.setStyle(node('n1', 'Image'), { width: 24, tintColor: '#2563eb' })
    host.flush()
    expect(ops()).toEqual([{
      op: 'updateNode',
      id: 'n1',
      patch: { style: { width: 24, tintColor: '#2563eb' } },
    }])
  })

  it('replaces bound styles without losing authored styles or revealing a hidden node', () => {
    const host = createNativeHost({ send() {} })
    const node = host.adopt({ __stxId: 'field' }, 'View', null, {
      props: {}, events: {}, children: [], _classes: 'p-4 bg-white dark:bg-slate-950',
      style: { padding: 16, paddingLeft: 9, width: 18 }, _inlineStyle: { paddingLeft: 9, width: 18 },
    })
    host.setStyle(node, { paddingLeft: 7, paddingBottom: 5 }, true)
    expect(host.snapshot(node).style).toMatchObject({ padding: 16, paddingLeft: 7, paddingBottom: 5, width: 18 })
    const clone = host.clone(node)
    host.setStyle(clone, {}, true)
    expect(host.snapshot(clone).style.paddingLeft).toBe(9)
    expect(host.snapshot(node).style.paddingLeft).toBe(7)
    host.setVisible(node, false)
    host.setStyle(node, { display: 'flex' }, true)
    host.setColorScheme('dark')
    expect(host.snapshot(node).style).toMatchObject({ display: 'none', paddingLeft: 9, width: 18, backgroundColor: '#020617' })
    expect(host.snapshot(node).style.paddingBottom).toBeUndefined()
    host.setStyle(node, null, true)
    host.setVisible(node, true)
    expect(host.snapshot(node).style.display).not.toBe('none')
    expect(host.snapshot(node).style.paddingLeft).toBe(9)
    host.dispose()
  })

  it('changes appearance without revealing hidden native nodes or losing inline styles', () => {
    const { host, ops } = harness()
    const node = host.adopt({ __stxId: 'themed' }, 'View', null, {
      props: {}, style: { backgroundColor: '#ffffff', width: 42 }, events: {}, children: [], _classes: 'bg-white dark:bg-slate-950',
    })
    host.setVisible(node, false)
    host.setColorScheme('dark')
    host.flush()
    expect(ops().at(-1)).toMatchObject({ patch: { style: { backgroundColor: '#020617', width: 42, display: 'none' } } })
    host.setColorScheme('light')
    host.flush()
    expect(ops().at(-1)).toMatchObject({ patch: { style: { backgroundColor: '#ffffff', width: 42, display: 'none' } } })
  })

  it('sets an attribute as a prop patch', () => {
    const { host, node, ops } = harness()
    host.setAttribute(node('n1'), 'accessibilityLabel', 'Sign in')
    host.flush()
    expect(ops()).toEqual([
      { op: 'updateNode', id: 'n1', patch: { props: { accessibilityLabel: 'Sign in' } } },
    ])
  })

  it('keeps structured native props structured across the bridge', () => {
    const { host, node, ops } = harness()
    host.setAttribute(node('n1', 'Image'), 'source', { uri: 'avatar.png' })
    host.flush()
    expect(ops()).toEqual([{
      op: 'updateNode',
      id: 'n1',
      patch: { props: { source: { uri: 'avatar.png' } } },
    }])
  })

  it('removes an attribute with an explicit null, not an omitted key', () => {
    // A patch is merged natively, so an absent key means "unchanged" and would
    // leave the attribute in place.
    const { host, node, ops } = harness()
    host.removeAttribute(node('n1'), 'disabled')
    host.flush()
    expect(ops()).toEqual([
      { op: 'updateNode', id: 'n1', patch: { props: { disabled: null } } },
    ])
  })
})

describe('the three operations a DOM shape would have leaked through', () => {
  it('setVisible reports the previous state without reading the node', () => {
    const { host, node } = harness()
    const n = node('n1')

    // Starts visible, so hiding reports "was visible".
    expect(host.setVisible(n, false)).toBe(true)
    expect(host.setVisible(n, false)).toBe(false)
    expect(host.setVisible(n, true)).toBe(false)
    expect(host.setVisible(n, true)).toBe(true)
  })

  it('unchanged visibility sends no native layout mutations', () => {
    const { host, node, ops } = harness()
    const n = node('n1')
    host.setVisible(n, true)
    host.flush()
    expect(ops()).toEqual([])
    host.setVisible(n, false)
    host.flush()
    expect(ops()).toHaveLength(1)
    host.setVisible(n, false)
    host.flush()
    expect(ops()).toHaveLength(1)
    host.setVisible(n, true)
    host.flush()
    expect(ops()).toHaveLength(2)
  })

  it('setVisible speaks the IR\'s own vocabulary for display', () => {
    const { host, node, ops } = harness()
    host.setVisible(node('n1'), false)
    host.flush()
    expect(ops()[0]).toMatchObject({ patch: { style: { display: 'none' } } })
  })

  it('showing a node again gives back its own display, not flex', () => {
    // An :if branch classed `hidden dark:flex` (a dark-only logo) was shown
    // with display: flex in light mode too.
    const { host, ops } = harness()
    const logo = host.adopt({ __stxId: 'logo' }, 'Image', null, {
      props: {}, style: { display: 'none', height: 48 }, events: {}, children: [], _classes: 'hidden dark:flex h-12',
    })
    host.setVisible(logo, false)
    host.setVisible(logo, true)
    host.flush()
    expect(ops().at(-1)).toMatchObject({ patch: { style: { display: 'none' } } })
    host.setColorScheme('dark')
    host.flush()
    expect(ops().at(-1)).toMatchObject({ patch: { style: { display: 'flex' } } })
    // An inline display survives a hide and a show.
    const row = host.adopt({ __stxId: 'row' }, 'View', null, {
      props: {}, style: { display: 'flex', width: 10 }, events: {}, children: [], _classes: '', _inlineStyle: { display: 'flex', width: 10 },
    } as any)
    host.setVisible(row, false)
    host.setVisible(row, true)
    host.flush()
    expect(ops().filter(op => op.id === 'row').at(-1)).toMatchObject({ patch: { style: { display: 'flex' } } })
  })

  it('an anchor holds a position and never reaches the native tree', () => {
    const { host, node, ops } = harness()
    const parent = node('p1')
    const a = host.anchor('for-end')
    host.insert(parent, a)
    host.insert(parent, node('n1'), a)
    host.flush()

    // Only the real node was inserted; the anchor cost no operation at all.
    expect(ops()).toEqual([
      { op: 'insertChild', parentId: 'p1', childId: 'n1', index: 0 },
    ])
  })

  it('removing an anchor is bookkeeping, not an operation', () => {
    const { host, node, ops } = harness()
    const parent = node('p1')
    const a = host.anchor('for-end')
    host.insert(parent, a)
    host.flush()
    host.remove(a)
    host.flush()
    expect(ops()).toEqual([])
  })

  it('clone materialises a fresh subtree rather than copying views', () => {
    const { host, node, ops } = harness()
    const parent = node('parent')
    const row = node('row', 'View')
    host.setAttribute(row, 'testID', 'row')
    const label = node('label', 'Text')
    host.setText(label, 'first')
    host.insert(row, label)
    host.flush()

    const copy = host.clone(row)
    host.flush()

    // A new identity, not the one it was made from.
    expect(copy.__stxId).not.toBe('row')
    // Detached clones are runtime templates, not protocol nodes. Sending one
    // would make the host reject the atomic batch as an unreachable tree.
    expect(ops().filter(o => o.op === 'createNode')).toHaveLength(0)

    host.insert(parent, copy)
    host.flush()

    const created = ops().filter(o => o.op === 'createNode')
    expect(created).toHaveLength(2)
    // The descriptor carried over, including the text child.
    expect(created[0]).toMatchObject({ id: copy.__stxId, node: { type: 'View', props: { testID: 'row', __stxId: copy.__stxId } } })
    expect(created[1]).toMatchObject({ node: { type: 'Text', children: ['first'] } })
  })
})

describe('structure', () => {
  it('inserts at the end by default and before a sibling when asked', () => {
    const { host, node, ops } = harness()
    const parent = node('p1')
    const a = node('a')
    const b = node('b')
    host.insert(parent, a)
    host.insert(parent, b, a)
    host.flush()

    expect(ops()).toEqual([
      { op: 'insertChild', parentId: 'p1', childId: 'a', index: 0 },
      { op: 'insertChild', parentId: 'p1', childId: 'b', index: 0 },
    ])
  })

  it('re-inserting an existing child is a move, not a second insert', () => {
    // bindFor reorders rows; emitting insertChild twice would duplicate them.
    const { host, node, ops } = harness()
    const parent = node('p1')
    const a = node('a')
    const b = node('b')
    host.insert(parent, a)
    host.insert(parent, b)
    host.flush()
    host.insert(parent, a)
    host.flush()

    expect(ops().at(-1)).toEqual({ op: 'moveChild', parentId: 'p1', childId: 'a', index: 1 })
  })

  it('removes a node by id', () => {
    const { host, node, ops } = harness()
    const parent = node('p1')
    const a = node('a')
    host.insert(parent, a)
    host.flush()
    host.remove(a)
    host.flush()
    expect(ops().at(-1)).toEqual({ op: 'removeNode', id: 'a' })
  })
})

describe('listeners and scope, without the DOM', () => {
  it('sends an id for a handler and calls back on dispatch', () => {
    // A closure cannot cross a bridge. The binding layer hands one over
    // either way and never learns the difference.
    const { host, node, ops } = harness()
    const seen: unknown[] = []
    const pressed = node('n1')
    host.listen(pressed, 'press', payload => seen.push(payload))
    host.flush()

    const patch = (ops()[0] as { patch: { events: Record<string, string> } }).patch
    const handlerId = patch.events.onPress
    expect(handlerId).toBeTruthy()

    // What native reports, at the node listening: its target, as in a browser.
    host.dispatch(handlerId, { x: 1 })
    host.dispatch(handlerId)
    host.dispatch(handlerId, 0.5)
    expect(seen).toEqual([
      expect.objectContaining({ x: 1, type: 'press', target: pressed, currentTarget: pressed }),
      expect.objectContaining({ type: 'press', target: pressed, currentTarget: pressed }),
      0.5,
    ])
    const event = seen[0] as Event
    event.preventDefault()
    event.stopPropagation()
    expect(event.defaultPrevented).toBe(true)
    expect(event.cancelBubble).toBe(true)
  })

  it('maps web events to the names native renderers dispatch', () => {
    const { host, node, ops } = harness()
    host.listen(node('n1'), 'click', () => {})
    host.flush()
    expect(ops()[0]).toMatchObject({ patch: { events: { onPress: expect.any(String) } } })
  })

  it('maps native-specific stx events to bridge event names', () => {
    const { host, node, ops } = harness()
    const cases = [
      ['press-in', 'onPressIn'],
      ['press-out', 'onPressOut'],
      ['layout', 'onLayout'],
      ['end-reached', 'onEndReached'],
      ['show', 'onShow'],
      ['dismiss', 'onDismiss'],
      ['request-close', 'onRequestClose'],
      ['sliding-complete', 'onSlidingComplete'],
      ['load-start', 'onLoadStart'],
      ['load', 'onLoad'],
      ['load-end', 'onLoadEnd'],
      ['error', 'onError'],
      ['end-editing', 'onEndEditing'],
      ['submit-editing', 'onSubmitEditing'],
      ['value-change', 'onValueChange'],
    ] as const

    for (const [event] of cases)
      host.listen(node(event), event, () => {})
    host.flush()

    for (const [event, native] of cases) {
      const operation = ops().find(candidate => candidate.op === 'updateNode' && candidate.id === event)
      expect(operation).toMatchObject({ patch: { events: { [native]: expect.any(String) } } })
    }
  })

  it('delivers video playback callbacks through the canonical native event names', () => {
    const { host, node, ops } = harness()
    const seen: Array<[string, number]> = []
    const cases = [
      ['play', 'onPlay'],
      ['playing', 'onPlay'],
      ['pause', 'onPause'],
      ['ended', 'onEnd'],
      ['end', 'onEnd'],
      ['timeupdate', 'onProgress'],
      ['progress', 'onProgress'],
      ['loadedmetadata', 'onLoad'],
      ['enterpictureinpicture', 'onPictureInPictureStart'],
      ['leavepictureinpicture', 'onPictureInPictureStop'],
    ] as const
    for (const [event, canonical] of cases) {
      host.listen(node(event, 'Video'), event, payload => seen.push([event, (payload as { currentTime: number }).currentTime]))
      host.flush()
      const operation = ops().find(candidate => candidate.op === 'updateNode' && candidate.id === event)
      const handlerId = (operation as { patch: { events: Record<string, string> } }).patch.events[canonical]!
      expect(operation).toMatchObject({ patch: { events: { [canonical]: expect.any(String) } } })
      host.dispatch(handlerId, { currentTime: 8, duration: 8 })
    }
    expect(seen).toEqual(cases.map(([event]) => [event, 8]))
  })

  it('delivers map camera callbacks using the compiler’s canonical event names', () => {
    const { host, node, ops } = harness()
    const seen: number[] = []
    for (const event of ['region-change-complete', 'regionchangecomplete']) {
      host.listen(node(event, 'Map'), event, payload => seen.push((payload as { pitch: number }).pitch))
      host.flush()
      const operation = ops().find(candidate => candidate.op === 'updateNode' && candidate.id === event)
      const handlerId = (operation as { patch: { events: Record<string, string> } }).patch.events.onRegionChangeComplete!
      expect(operation).toMatchObject({ patch: { events: { onRegionChangeComplete: expect.any(String) } } })
      host.dispatch(handlerId, { pitch: 45 })
    }
    expect(seen).toEqual([45, 45])
  })

  it('finds a scope by ownership rather than by selector', () => {
    const { host, node } = harness()
    const scope = node('s1')
    scope.__stxScope = 'stx_scope_1'
    const middle = node('m1')
    const leaf = node('l1')
    host.insert(scope, middle)
    host.insert(middle, leaf)

    expect(host.scopeOf(leaf)?.__stxId).toBe('s1')
    expect(host.scopeOf(scope)?.__stxId).toBe('s1')
    // `from` skips the node itself, which the ref path needs.
    expect(host.scopeOf(scope, true)).toBeNull()
  })

  it('answers null rather than throwing outside any scope', () => {
    const { host, node } = harness()
    expect(host.scopeOf(node('n1'))).toBeNull()
  })
})

describe('materializing rendered IR for shared-runtime hydration', () => {
  it('builds a manifest lookup without selectors and shares ids with the native protocol', () => {
    const { host } = harness()
    const label = createNode('Text')
    label.bindingId = 0
    const button = createNode('Button')
    button.bindingId = 1
    const root = createNode('View', {}, {}, {}, [label, button])
    const document = createDocument(root, { exports: {}, functions: [], code: '' })
    const tree = materializeNativeBindingTree(document, {
      entries: [
        { id: 0, bindings: [{ name: ':text', value: 'count', kind: 'text' }] },
        { id: 1, bindings: [{ name: '@click', value: 'increment()', kind: 'event' }] },
      ],
    }, host)

    expect(tree.nodes.get(0)?.getAttribute(':text')).toBe('count')
    expect(tree.nodes.get(1)?.getAttribute('@click')).toBe('increment()')
    expect(root.id).toBe(tree.root.__stxId)
    expect(label.id).toBe(tree.nodes.get(0)?.__stxId)
    expect(button.id).toBe(tree.nodes.get(1)?.__stxId)
    expect(label.props.__stxId).toBe(tree.nodes.get(0)?.__stxId)
    expect(button.props.__stxId).toBe(tree.nodes.get(1)?.__stxId)
    expect(host.descendants(tree.root).map(node => node.__stxId)).toEqual([
      tree.nodes.get(0)?.__stxId,
      tree.nodes.get(1)?.__stxId,
    ])
  })
})

describe('batching', () => {
  it('sends one batch per flush, not one per operation', () => {
    const { host, node, batches } = harness()
    const n = node('n1', 'Text')
    host.setText(n, 'a')
    host.setAttribute(n, 'testID', 'x')
    host.setVisible(n, false)
    expect(batches).toHaveLength(0)
    expect(host.pending()).toBe(3)

    host.flush()
    expect(batches).toHaveLength(1)
    expect(batches[0]).toHaveLength(3)
  })

  it('flushing with nothing pending sends nothing', () => {
    const { host, batches } = harness()
    host.flush()
    expect(batches).toEqual([])
  })

  it('schedules itself when no scheduler is supplied', async () => {
    const sent: NativeMutationOperation[][] = []
    const host = createNativeHost({ send: ops => sent.push(ops) })
    host.setText(host.adopt({ __stxId: 'n1' }, 'Text'), 'hello')
    expect(sent).toHaveLength(0)
    await Promise.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(sent).toHaveLength(1)
  })
})

/**
 * Teardown reaching a subtree, which was the last DOM assumption in the
 * binding layer (#1984).
 *
 * Both disposal paths in the runtime ran a selector query -- one for every
 * descendant, one for `[data-stx-scope]`. A view hierarchy has neither
 * selectors nor attributes to match, so the host answers from the parentage it
 * recorded while building the tree.
 */
describe('reaching a subtree without a selector', () => {
  /** root > [a > [a1], b], plus an anchor, with a scope on `a`. */
  function tree() {
    const { host, ops, batches } = harness()
    const root = host.adopt({ __stxId: 'root' }, 'View')
    const a = host.adopt({ __stxId: 'a' }, 'View')
    const a1 = host.adopt({ __stxId: 'a1' }, 'Text')
    const b = host.adopt({ __stxId: 'b' }, 'Text')
    host.insert(root, a)
    host.insert(a, a1)
    host.insert(root, b)
    a.__stxScope = 'scope_a'
    return { host, root, a, a1, b, ops, batches }
  }

  it('reports every node under one, depth first', () => {
    const { host, root } = tree()
    expect(host.descendants(root).map(node => node.__stxId)).toEqual(['a', 'a1', 'b'])
  })

  it('does not report the node itself', () => {
    const { host, root, a } = tree()
    expect(host.descendants(root).some(node => node.__stxId === 'root')).toBe(false)
    expect(host.descendants(a).map(node => node.__stxId)).toEqual(['a1'])
  })

  it('reports nothing for a leaf', () => {
    const { host, b } = tree()
    expect(host.descendants(b)).toEqual([])
  })

  it('includes an anchor, which the binding layer holds even though it is not a view', () => {
    const { host, root } = tree()
    const anchor = host.anchor('stx-for')
    host.insert(root, anchor)
    expect(host.descendants(root).some(node => node.__stxId === anchor.__stxId)).toBe(true)
  })

  it('reports the scope ids in a subtree, this node included', () => {
    const { host, root, a } = tree()
    root.__stxScope = 'scope_root'
    expect(host.scopesIn(root)).toEqual(['scope_root', 'scope_a'])
    expect(host.scopesIn(a)).toEqual(['scope_a'])
  })

  it('reports ids, not nodes, because a node cannot be asked for its attribute', () => {
    const { host, root } = tree()
    for (const id of host.scopesIn(root))
      expect(typeof id).toBe('string')
  })

  it('reads nothing off a node the host never adopted', () => {
    const { host } = tree()
    expect(host.descendants({ __stxId: 'ghost' })).toEqual([])
    expect(host.scopesIn({ __stxId: 'ghost' })).toEqual([])
  })

  it('answers when the methods are taken off the host', () => {
    // The runtime calls these as `stxHost.scopesIn(root)`, but nothing in the
    // contract says it must: a method that needs `this` is a trap for the next
    // caller, and this host's walk is a free function for that reason.
    const { host, root } = tree()
    const { descendants, scopesIn } = host
    expect(descendants(root).map(node => node.__stxId)).toEqual(['a', 'a1', 'b'])
    expect(scopesIn(root)).toEqual(['scope_a'])
  })

  it('stops reporting a node that was removed', () => {
    const { host, root, a } = tree()
    host.remove(a)
    expect(host.descendants(root).map(node => node.__stxId)).toEqual(['b'])
    expect(host.scopesIn(root)).toEqual([])
  })

  it('costs no bridge traffic, because it is a question and not a mutation', () => {
    const { host, root, batches } = tree()
    host.flush()
    batches.length = 0
    host.descendants(root)
    host.scopesIn(root)
    host.flush()
    expect(batches).toEqual([])
  })
})


describe('native text edit acknowledgements', () => {
  it('acknowledges each edit and keeps the count on intentional controlled updates', () => {
    const { host, node, ops } = harness()
    const input = node('search', 'TextInput')
    host.setAttribute(input, 'value', '')
    host.listen(input, 'input', () => {})
    host.flush()
    const registration = ops().find(op => op.op === 'updateNode' && op.patch.events?.onChangeText)
    const id = (registration as { patch: { events: Record<string, string> } }).patch.events.onChangeText!
    host.dispatch(id, { nativeEvent: { text: 'Pl', eventCount: 2 } })
    host.dispatch(id, { nativeEvent: { text: 'Pla', eventCount: 3 } })
    host.flush()
    const echoes = ops().filter(op => op.op === 'updateNode' && op.patch.props?.mostRecentEventCount !== undefined)
    expect(echoes).toMatchObject([
      { patch: { props: { value: 'Pl', mostRecentEventCount: 2 } } },
      { patch: { props: { value: 'Pla', mostRecentEventCount: 3 } } },
    ])
    expect(host.snapshot(input).props).toMatchObject({ value: 'Pla', mostRecentEventCount: 3 })
    expect(ops().at(-1)).toMatchObject({ patch: { props: { value: 'Pla', mostRecentEventCount: 3 } } })
    host.dispatch(id, { nativeEvent: { text: 'Pla', eventCount: 4 } })
    host.flush()
    expect(ops().at(-1)).toMatchObject({ patch: { props: { value: 'Pla', mostRecentEventCount: 4 } } })
    host.setAttribute(input, 'value', '')
    expect(host.snapshot(input).props).toMatchObject({ value: '', mostRecentEventCount: 4 })
    host.dispatch(id, { nativeEvent: { text: 'Legacy' } })
    expect(host.snapshot(input).props.value).toBe('Legacy')
  })
})
