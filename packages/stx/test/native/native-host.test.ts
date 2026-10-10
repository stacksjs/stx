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

  it('sets an attribute as a prop patch', () => {
    const { host, node, ops } = harness()
    host.setAttribute(node('n1'), 'accessibilityLabel', 'Sign in')
    host.flush()
    expect(ops()).toEqual([
      { op: 'updateNode', id: 'n1', patch: { props: { accessibilityLabel: 'Sign in' } } },
    ])
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

  it('setVisible speaks the IR\'s own vocabulary for display', () => {
    const { host, node, ops } = harness()
    host.setVisible(node('n1'), false)
    host.flush()
    expect(ops()[0]).toMatchObject({ patch: { style: { display: 'none' } } })
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

    const created = ops().filter(o => o.op === 'createNode')
    expect(created).toHaveLength(2)
    // The descriptor carried over, including the text child.
    expect(created[0]).toMatchObject({ node: { type: 'View', props: { testID: 'row' } } })
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
    host.listen(node('n1'), 'press', payload => seen.push(payload))
    host.flush()

    const patch = (ops()[0] as { patch: { events: Record<string, string> } }).patch
    const handlerId = patch.events.onPress
    expect(handlerId).toBeTruthy()

    host.dispatch(handlerId, { x: 1 })
    expect(seen).toEqual([{ x: 1 }])
  })

  it('maps web events to the names native renderers dispatch', () => {
    const { host, node, ops } = harness()
    host.listen(node('n1'), 'click', () => {})
    host.flush()
    expect(ops()[0]).toMatchObject({ patch: { events: { onPress: expect.any(String) } } })
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
