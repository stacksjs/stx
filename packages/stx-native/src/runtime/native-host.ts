/**
 * The second implementation of the signals runtime's host interface
 * (stacksjs/stx#1984).
 *
 * The runtime's binding layer writes through a host rather than touching the
 * document, and `signals.ts` ships the DOM one. That alone does not answer the
 * question the spike was for: an interface shaped around the DOM will accept a
 * DOM implementation no matter what. The answer only arrives when something
 * that is NOT a tree of elements implements the same methods, which is what
 * this is -- every host call becomes a `NativeMutationOperation` on the bridge
 * instead of a mutation of anything.
 *
 * Three places the DOM leaks through if you are not careful, and how each one
 * is answered here:
 *
 *   - `setVisible` returns the PREVIOUS visibility, because `bindShow` needs
 *     to know whether it just revealed something. A UIView has no display
 *     value to read back, so the host records it per node and reports what it
 *     replaced.
 *   - `anchor()` is a position in a child list that survives its neighbours
 *     moving. The DOM uses a comment node; there is no such thing natively, so
 *     an anchor here is a logical marker in the host's own ordering and never
 *     reaches the native tree.
 *   - `clone()` cannot deep-copy a view hierarchy. The host materialises a
 *     fresh subtree from the descriptor it recorded when the node was created.
 *
 * None of those needed a change to the binding layer, which is the result the
 * spike was looking for.
 *
 * @module runtime/native-host
 */

import type { NativeMutationOperation } from '../bridge/protocol'

/** A handle on a node in the native tree. Not an element; just an identity. */
export interface NativeNode {
  __stxId: string
  /** Set on a node that owns a scope, so `scopeOf` can answer without a DOM query. */
  __stxScope?: string
  /** The scope this node sits inside, maintained as the tree is built. */
  __stxOwner?: NativeNode | null
  /** A logical position marker; never materialised natively. */
  __stxAnchor?: string
}

interface NodeRecord {
  type: string
  props: Record<string, unknown>
  style: Record<string, unknown>
  events: Record<string, string>
  text?: string
  children: NativeNode[]
  visible: boolean
}

export interface NativeHostOptions {
  /** Called with each batch. One call per flush, never per operation. */
  send: (operations: NativeMutationOperation[]) => void
  /**
   * Schedules a flush. Defaults to a microtask, so a signal update that
   * touches twenty nodes crosses the bridge once rather than twenty times --
   * the bridge is the expensive part, not the bookkeeping.
   */
  schedule?: (flush: () => void) => void
}

export interface NativeHost {
  setText: (node: NativeNode, value: unknown) => void
  setAttribute: (node: NativeNode, name: string, value: unknown) => void
  removeAttribute: (node: NativeNode, name: string) => void
  listen: (node: NativeNode, event: string, handler: (payload?: unknown) => void, options?: unknown) => void
  scopeOf: (node: NativeNode, from?: boolean) => NativeNode | null
  setVisible: (node: NativeNode, visible: boolean) => boolean
  anchor: (label: string) => NativeNode
  clone: (node: NativeNode) => NativeNode
  insert: (parent: NativeNode, node: NativeNode, before?: NativeNode | null) => void
  remove: (node: NativeNode) => void
  /** Register a node the native side already created, so the host can track it. */
  adopt: (node: NativeNode, type: string, owner?: NativeNode | null) => NativeNode
  /** Send whatever is pending now, rather than waiting for the scheduled flush. */
  flush: () => void
  /** Dispatch an event the native side reported, by the id handed to it. */
  dispatch: (handlerId: string, payload?: unknown) => void
  pending: () => number
}

/** Every method the DOM host in `signals.ts` defines. The contract, in one place. */
export const HOST_METHODS: readonly string[] = [
  'setText',
  'setAttribute',
  'removeAttribute',
  'listen',
  'scopeOf',
  'setVisible',
  'anchor',
  'clone',
  'insert',
  'remove',
]

export function createNativeHost(options: NativeHostOptions): NativeHost {
  const records = new Map<string, NodeRecord>()
  const handlers = new Map<string, (payload?: unknown) => void>()
  let queue: NativeMutationOperation[] = []
  let scheduled = false
  let counter = 0

  const schedule = options.schedule ?? ((flush: () => void) => queueMicrotask(flush))

  const nextId = (prefix: string): string => `${prefix}${++counter}`

  function flush(): void {
    scheduled = false
    if (queue.length === 0)
      return
    const batch = queue
    queue = []
    options.send(batch)
  }

  function emit(operation: NativeMutationOperation): void {
    queue.push(operation)
    if (!scheduled) {
      scheduled = true
      schedule(flush)
    }
  }

  function recordOf(node: NativeNode): NodeRecord {
    let record = records.get(node.__stxId)
    if (!record) {
      record = { type: 'View', props: {}, style: {}, events: {}, children: [], visible: true }
      records.set(node.__stxId, record)
    }
    return record
  }

  function adopt(node: NativeNode, type: string, owner?: NativeNode | null): NativeNode {
    records.set(node.__stxId, {
      type,
      props: {},
      style: {},
      events: {},
      children: [],
      visible: true,
    })
    node.__stxOwner = owner ?? null
    return node
  }

  return {
    adopt,
    pending: () => queue.length,
    flush,

    setText(node, value) {
      const text = value == null ? '' : String(value)
      recordOf(node).text = text
      emit({ op: 'updateNode', id: node.__stxId, patch: { children: [text] } })
    },

    setAttribute(node, name, value) {
      recordOf(node).props[name] = value
      emit({ op: 'updateNode', id: node.__stxId, patch: { props: { [name]: value } } })
    },

    removeAttribute(node, name) {
      delete recordOf(node).props[name]
      // Null rather than omitted: a patch is merged on the native side, so an
      // absent key means "unchanged" and would leave the attribute in place.
      emit({ op: 'updateNode', id: node.__stxId, patch: { props: { [name]: null } } })
    },

    listen(node, event, handler) {
      // The handler stays here and the native side is given an id to report
      // back. Sending a function over a bridge is not possible, and the
      // binding layer never needs to know that -- it hands over a closure
      // either way.
      const id = nextId('h')
      handlers.set(id, handler)
      recordOf(node).events[event] = id
      emit({ op: 'updateNode', id: node.__stxId, patch: { events: { [event]: id } } })
    },

    dispatch(handlerId, payload) {
      handlers.get(handlerId)?.(payload)
    },

    scopeOf(node, from) {
      // Walks the ownership the host maintained as the tree was built. No
      // selector, because a native view tree has nothing to match one against.
      let current: NativeNode | null | undefined = from ? node?.__stxOwner : node
      while (current) {
        if (current.__stxScope !== undefined)
          return current
        current = current.__stxOwner
      }
      return null
    },

    setVisible(node, visible) {
      const record = recordOf(node)
      const was = record.visible
      record.visible = visible
      // `display` is how the IR spells it, so the renderers already understand
      // it; the host does not invent a second vocabulary for the same thing.
      emit({ op: 'updateNode', id: node.__stxId, patch: { style: { display: visible ? 'flex' : 'none' } } })
      return was
    },

    anchor(label) {
      // Logical only: it is a position in this host's ordering and is never
      // created on the native side, so it costs no view.
      return { __stxId: nextId('a'), __stxAnchor: label }
    },

    clone(node) {
      const source = records.get(node.__stxId)
      const copy: NativeNode = { __stxId: nextId('n'), __stxOwner: node.__stxOwner }
      if (node.__stxScope !== undefined)
        copy.__stxScope = node.__stxScope

      const descriptor = source ?? { type: 'View', props: {}, style: {}, events: {}, children: [], visible: true }
      records.set(copy.__stxId, {
        type: descriptor.type,
        props: { ...descriptor.props },
        style: { ...descriptor.style },
        events: { ...descriptor.events },
        text: descriptor.text,
        children: [],
        visible: descriptor.visible,
      })

      emit({
        op: 'createNode',
        id: copy.__stxId,
        node: {
          type: descriptor.type,
          props: { ...descriptor.props },
          style: { ...descriptor.style },
          ...(descriptor.text === undefined ? {} : { children: [descriptor.text] }),
        },
      })

      // Materialised from the descriptor, depth first -- a view hierarchy
      // cannot be deep-copied the way a DOM subtree can.
      for (const child of descriptor.children) {
        const childCopy = this.clone(child)
        this.insert(copy, childCopy)
      }
      return copy
    },

    insert(parent, node, before) {
      const record = recordOf(parent)

      /*
       * The node comes OUT of the ordering before the target index is worked
       * out. A move is indexed against the list without the node in it -- that
       * is what the native side will be holding when it applies the operation
       * -- so measuring first reports a position one too far to the right, and
       * a row reordered to the end lands one short of it.
       */
      const existing = record.children.findIndex(child => child.__stxId === node.__stxId)
      if (existing !== -1)
        record.children.splice(existing, 1)

      const index = before
        ? Math.max(0, record.children.findIndex(child => child.__stxId === before.__stxId))
        : record.children.length

      record.children.splice(index, 0, node)
      node.__stxOwner = parent

      // An anchor holds a place in the ordering and nothing else, so moving one
      // is bookkeeping rather than a native operation.
      if (node.__stxAnchor !== undefined)
        return

      emit({
        op: existing === -1 ? 'insertChild' : 'moveChild',
        parentId: parent.__stxId,
        childId: node.__stxId,
        index,
      })
    },

    remove(node) {
      const owner = node.__stxOwner
      if (owner) {
        const record = recordOf(owner)
        const at = record.children.findIndex(child => child.__stxId === node.__stxId)
        if (at !== -1)
          record.children.splice(at, 1)
      }
      node.__stxOwner = null
      records.delete(node.__stxId)
      if (node.__stxAnchor !== undefined)
        return
      emit({ op: 'removeNode', id: node.__stxId })
    },
  }
}
