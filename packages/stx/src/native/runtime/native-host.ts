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
import type { STXNode, STXStyle } from '../compiler/ir'
import { accessibilityChanges, authoredAccessibilityProps, projectAccessibility } from '../accessibility'
import { compileClassStyles } from '../compiler/headwind-to-style'
import { resolveIconName } from '../compiler/icons'
import { applyNativeLayoutDefaults, parseNativeStyleLayers } from '../compiler/inline-style'
import { createStyleVariables, type NativeStyleVariables } from '../compiler/style-variables'
import type { NativeStylesheetTheme } from '../compiler/stylesheet-theme'
import { affectsGeometry, parseSvgMarkup, parseViewBox, SVG_NODE_TYPES, svgGeometry } from '../compiler/svg'
import { NATIVE_EVENT_NAMES } from '../event-names'
import { nativePropName } from '../prop-names'
import { cloneNativeBindingNode, type NativeBindingNode } from './binding-tree'
import { NATIVE_FORM_ENTRIES } from './jsc-globals'
import { createNativeOverlayPresenter, type NativeOverlayEntry } from './overlay-presenter'
import { nativeViewError, type NativeFocusOptions, type NativeViewBounds, type NativeViewOperations } from './view-operations'

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
  key?: string
  props: Record<string, unknown>
  style: Record<string, unknown>
  baseStyle: Record<string, unknown>
  styleSource?: string
  styleAncestors?: string[]
  inheritedVariables?: NativeStyleVariables
  variables?: NativeStyleVariables
  /** Reactive :style replaces this layer without destroying authored inline styles. */
  boundStyle?: unknown
  classes: string
  /** Caller classes override, but never replace, the component's own classes. */
  forwardedClasses?: string
  forwardedStyle?: unknown
  /** Current unsupported classes, bounded by this node's current class list. */
  reportedClasses?: Set<string>
  /** Reject results requested before a node was removed, even if it is reinserted. */
  viewEpoch?: number
  events: Record<string, string>
  text?: string
  children: NativeNode[]
  visible: boolean
  /** The node's own `display` (from its inline style) while :if hides it. */
  shownDisplay?: unknown
  materialized: boolean
  /** Handlers taken out of service while the node is off the screen. */
  parkedHandlers?: Map<string, (payload?: unknown) => void>
  /** Last runtime markup assigned through a native `:html` binding. */
  markup?: string
  controlDefaults?: { value: unknown, checked: unknown }
}

interface RetainedNativeNode extends NativeNode {
  __stxDetachedRecord?: NodeRecord
}

function isHiddenInput(record: NodeRecord): boolean {
  return record.type === 'View' && record.props.type === 'hidden'
}

/**
 * A native event says what happened (a value, a position) but not where:
 * the node listening is where, as `target` and `currentTarget` are in a
 * browser. Without them the runtime could not tell a press on a control an
 * `:if` has just shown from the click that showed it, and dropped it for
 * 50ms; a `.self` handler never ran at all.
 */
/**
 * The display a shown node takes, in the IR's own words: what its classes and
 * style resolve to (`hidden dark:flex` stays `none` in light), else `flex`.
 * The resolved style is an open record, so the value is checked rather than
 * asserted: anything the renderers do not understand reads as `flex`.
 */
function irDisplay(value: unknown): NonNullable<STXStyle['display']> {
  return value === 'none' || value === 'grid' || value === 'flex' ? value : 'flex'
}

function eventAt(payload: unknown, node: NativeNode, type = ''): unknown {
  if (payload != null && (typeof payload !== 'object' || Array.isArray(payload)))
    return payload
  return {
    ...(payload as Record<string, unknown> | null),
    type, target: node, currentTarget: node, bubbles: true,
    cancelBubble: false, defaultPrevented: false,
    preventDefault(this: { defaultPrevented: boolean }) { this.defaultPrevented = true },
    stopPropagation(this: { cancelBubble: boolean }) { this.cancelBubble = true },
  }
}

export interface NativeHostOptions {
  views?: NativeViewOperations
  /** Initial native appearance; later changes arrive through APPEARANCE. */
  colorScheme?: 'light' | 'dark'
  stylesheetTheme?: NativeStylesheetTheme
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
  /** Native mutations and binding registration must reach one bridge batch. */
  readonly isNative: true
  focus: (node: NativeNode, options?: NativeFocusOptions) => Promise<true>
  measure: (node: NativeNode) => Promise<NativeViewBounds>
  syncOverlays: (entries: NativeOverlayEntry[]) => void
  parent: (node: NativeNode) => NativeNode | null
  getAttribute: (node: NativeNode, name: string) => string | null
  observeChildren: (node: NativeNode, callback: () => void) => (() => void)
  setColorScheme: (scheme: 'light' | 'dark') => void
  setText: (node: NativeNode, value: unknown) => void
  setMarkup: (node: NativeNode, value: unknown) => void
  setAttribute: (node: NativeNode, name: string, value: unknown) => void
  removeAttribute: (node: NativeNode, name: string) => void
  observeAttributes: (node: NativeNode, names: string[], callback: () => void) => (() => void)
  /** Imperative calls patch styles; :style replaces its own layer and preserves authored defaults. */
  setStyle: (node: NativeNode, value: unknown, replaceBinding?: boolean) => void
  listen: (node: NativeNode, event: string, handler: (payload?: unknown) => void, options?: unknown) => void
  emitComponentEvent: (node: NativeNode, event: Event) => boolean
  onFormReset: (node: NativeNode, callback: () => void) => (() => void)
  scopeOf: (node: NativeNode, from?: boolean) => NativeNode | null
  setVisible: (node: NativeNode, visible: boolean) => boolean
  anchor: (label: string) => NativeNode
  clone: (node: NativeNode) => NativeNode
  insert: (parent: NativeNode, node: NativeNode, before?: NativeNode | null) => void
  remove: (node: NativeNode) => void
  descendants: (node: NativeNode) => NativeNode[]
  scopesIn: (node: NativeNode) => string[]
  /** Register a node the native side already created, so the host can track it. */
  adopt: (node: NativeNode, type: string, owner?: NativeNode | null, descriptor?: Pick<STXNode, 'key' | 'props' | 'style' | 'events' | 'children' | '_classes' | '_inlineStyle' | '_styleSource' | '_styleAncestors'>) => NativeNode
  /** Send whatever is pending now, rather than waiting for the scheduled flush. */
  flush: () => void
  /** Dispatch an event the native side reported, by the id handed to it. */
  dispatch: (handlerId: string, payload?: unknown) => void
  pending: () => number
  /** Release a screen's callbacks and retained descriptors permanently. */
  dispose: () => void
  /**
   * The tree as this host holds it now, from `root`, in the shape a RENDER
   * takes: every node with its id, so later mutations name the same nodes.
   * Pending operations are dropped, since the tree already includes them.
   */
  snapshot: (root: NativeNode) => STXNode
}

/** Every method the DOM host in `signals.ts` defines. The contract, in one place. */
export const HOST_METHODS: readonly string[] = [
  'parent',
  'getAttribute',
  'observeChildren',
  'setText',
  'setMarkup',
  'setAttribute',
  'removeAttribute',
  'observeAttributes',
  'setStyle',
  'listen',
  'emitComponentEvent',
  'onFormReset',
  'scopeOf',
  'setVisible',
  'anchor',
  'clone',
  'insert',
  'remove',
  'descendants',
  'scopesIn',
]

export function createNativeHost(options: NativeHostOptions): NativeHost {
  const records = new Map<string, NodeRecord>()
  const attributeObservers = new WeakMap<NativeNode, Set<{ names: string[], notify: () => void }>>()
  const childObservers = new WeakMap<NativeNode, Set<() => void>>()
  const handlers = new Map<string, (payload?: unknown) => void>()
  const eventRegistrations = new WeakMap<NativeNode, Map<string, string>>()
  const componentListeners = new WeakMap<NativeNode, Array<{ event: string, handler: (payload?: unknown) => void, once: boolean, capture: boolean }>>()
  const controlsWithDefaultListeners = new WeakSet<NativeNode>()
  const formResetCallbacks = new WeakMap<NativeNode, Set<() => void>>()
  let queue: NativeMutationOperation[] = []
  let scheduled = false
  let counter = 0
  let colorScheme = options.colorScheme ?? 'light'
  let stylesheetVariables = createStyleVariables(options.stylesheetTheme?.[colorScheme] ?? []).computed()
  let disposed = false

  const schedule = options.schedule ?? ((flush: () => void) => queueMicrotask(flush))

  const nextId = (prefix: string): string => `${prefix}${++counter}`

  function notifyAttributes(node: NativeNode, name: string): void {
    for (const observer of attributeObservers.get(node) ?? []) {
      if (observer.names.includes(name)) observer.notify()
    }
  }

  function notifyChildren(node: NativeNode | null | undefined): void {
    for (let current = node; current; current = current.__stxOwner) {
      for (const notify of childObservers.get(current) ?? []) notify()
    }
  }

  function flush(): void {
    scheduled = false
    if (queue.length === 0)
      return
    const batch = queue
    queue = []
    options.send(batch)
  }

  function emit(operation: NativeMutationOperation): void {
    if (disposed) return
    queue.push(operation)
    if (!scheduled) {
      scheduled = true
      schedule(flush)
    }
  }

  function recordOf(node: NativeNode): NodeRecord {
    let record = records.get(node.__stxId) ?? revive(node)
    if (!record) {
      record = { type: 'View', props: {}, style: {}, baseStyle: {}, classes: '', events: {}, children: [], visible: true, materialized: true }
      records.set(node.__stxId, record)
    }
    return record
  }

  function descriptorOf(node: NativeNode): NodeRecord | undefined {
    return records.get(node.__stxId) ?? (node as RetainedNativeNode).__stxDetachedRecord
  }

  function retainDetachedDescriptors(node: NativeNode): void {
    const record = records.get(node.__stxId)
    if (!record)
      return
    // Removing a native view removes its whole subtree. A nested :for or
    // :if can dispose its own children afterwards; those views are already
    // gone and must not send another removeNode to the strict native host.
    record.materialized = false
    ;(node as RetainedNativeNode).__stxDetachedRecord = record
    record.children.forEach(retainDetachedDescriptors)
    records.delete(node.__stxId)
  }

  /*
   * A removed node is often shown again: an `:if` hides the very node it
   * later re-inserts. Its handlers are parked on its record rather than
   * dropped, so the node answers presses again once it is back, and the
   * closures go with the node when nothing holds it any more.
   */
  function releaseHandlers(node: NativeNode): void {
    const record = descriptorOf(node)
    if (!record)
      return
    record.viewEpoch = (record.viewEpoch ?? 0) + 1
    for (const handlerId of Object.values(record.events)) {
      const handler = handlers.get(handlerId)
      if (!handler)
        continue
      ;(record.parkedHandlers ??= new Map()).set(handlerId, handler)
      handlers.delete(handlerId)
    }
    record.children.forEach(releaseHandlers)
  }

  /*
   * The record of a node removed earlier, back in service. The native side
   * dropped the node and its whole subtree when it was removed, so it is no
   * longer materialised: inserting it again creates it afresh from what the
   * record kept (type, props, style, text, events, children). Its children
   * come back the same way as they are reached.
   */
  function revive(node: NativeNode): NodeRecord | undefined {
    const retained = node as RetainedNativeNode
    const record = retained.__stxDetachedRecord
    if (!record)
      return undefined
    delete retained.__stxDetachedRecord
    record.materialized = false
    if (record.parkedHandlers) {
      for (const [handlerId, handler] of record.parkedHandlers) handlers.set(handlerId, handler)
      record.parkedHandlers = undefined
    }
    records.set(node.__stxId, record)
    return record
  }

  function decorateControl(node: NativeNode, type: string): void {
    const htmlCheckbox = type === 'Checkbox' && descriptorOf(node)?.props.type === 'checkbox'
    const hidden = descriptorOf(node)?.props.type === 'hidden'
    if (type === 'TextInput' || type === 'Picker' || htmlCheckbox || hidden) {
      // The shared x-model binder reads/writes a control's live value. A
      // native handle needs that property too, and writes must cross the
      // mutation bridge (including resets coming from application state).
      Object.defineProperty(node, 'value', {
        configurable: true,
        enumerable: true,
        get: () => descriptorOf(node)?.props[type === 'Checkbox' ? 'formValue' : 'value'] ?? '',
        set: (value: unknown) => {
          const record = recordOf(node)
          const prop = type === 'Checkbox' ? 'formValue' : 'value'
          if (Object.is(record.props[prop], value)) return
          record.props[prop] = value
          if (record.materialized) emit({ op: 'updateNode', id: node.__stxId, patch: { props: { [prop]: value } } })
        },
      })
      Object.defineProperty(node, 'type', { configurable: true, get: () => descriptorOf(node)?.props.type ?? 'text' })
      Object.defineProperty(node, 'name', { configurable: true, get: () => descriptorOf(node)?.props.name ?? '' })
    }
    if (type === 'Checkbox') {
      Object.defineProperty(node, 'checked', {
        configurable: true,
        get: () => Boolean(descriptorOf(node)?.props.checked ?? descriptorOf(node)?.props.value),
        set: (value: unknown) => {
          const record = recordOf(node)
          const checked = Boolean(value)
          if (record.props.checked === checked && record.props.value === checked) return
          record.props.checked = checked
          record.props.value = checked
          if (record.materialized) emit({ op: 'updateNode', id: node.__stxId, patch: { props: { checked, value: checked } } })
        },
      })
    }
    if (descriptorOf(node)?.props['data-stx-form']) {
      Object.defineProperty(node, NATIVE_FORM_ENTRIES, { configurable: true, value: () => formEntries(node) })
      Object.defineProperty(node, 'reset', { configurable: true, value: () => resetForm(node) })
    }
  }

  function formOwner(node: NativeNode): NativeNode | null {
    for (let current = node.__stxOwner; current; current = current.__stxOwner) {
      if (descriptorOf(current)?.props['data-stx-form']) return current
    }
    return null
  }

  function disabled(record: NodeRecord): boolean {
    return record.props.disabled === true || record.props.disabled === '' || record.props.disabled === 'true'
  }

  function formEntries(form: NativeNode): Array<[string, unknown]> {
    const values: Array<[string, unknown]> = []
    for (const node of collectDescendants(form)) {
      const record = descriptorOf(node)
      if (!record?.materialized) continue
      const name = record.props.name
      if (!name || disabled(record) || formOwner(node) !== form) continue
      if (!['TextInput', 'Picker', 'Checkbox'].includes(record.type) && record.props.type !== 'hidden') continue
      if (['submit', 'reset', 'button', 'file'].includes(String(record.props.type))) continue
      if (record.type === 'Checkbox' && !(node as NativeNode & { checked: boolean }).checked) continue
      const value = record.type === 'Checkbox' ? record.props.formValue ?? 'on' : record.props.value ?? ''
      for (const item of Array.isArray(value) ? value : [value]) values.push([String(name), item])
    }
    return values
  }

  function resetForm(form: NativeNode): void {
    if (!host.emitComponentEvent(form, eventAt(null, form, 'reset') as Event)) return
    for (const node of collectDescendants(form)) {
      const record = descriptorOf(node)
      if (!record?.materialized || !record.controlDefaults || formOwner(node) !== form || (!('value' in node) && record.type !== 'Checkbox')) continue
      const control = node as NativeNode & { value: unknown, checked: unknown }
      if (record.type === 'Checkbox') control.checked = record.controlDefaults.checked
      else control.value = record.controlDefaults.value
    }
    for (const node of collectDescendants(form)) {
      if (formOwner(node) !== form) continue
      for (const callback of formResetCallbacks.get(node) ?? []) callback()
    }
  }

  function installControlListeners(node: NativeNode): void {
    const record = descriptorOf(node)
    if (!record || controlsWithDefaultListeners.has(node)) return
    let delegatedPress = false
    if (record.type === 'Button' || record.type === 'Pressable') {
      for (let owner = node.__stxOwner; owner; owner = owner.__stxOwner) {
        if (componentListeners.get(owner)?.some(listener => (NATIVE_EVENT_NAMES[listener.event.toLowerCase()] ?? listener.event) === 'onPress')) {
          delegatedPress = true
          break
        }
      }
    }
    if (!formOwner(node) && !delegatedPress) return
    controlsWithDefaultListeners.add(node)
    // Even an unbound field must report edits to the form's delegated
    // listeners. A bare submit button likewise needs a platform handler id.
    if (record.type === 'TextInput' || record.type === 'Picker' || record.type === 'Checkbox') {
      host.listen(node, record.type === 'TextInput' ? 'input' : 'change', () => {})
      host.listen(node, 'focusout', () => {})
    }
    if (record.type === 'Button' || record.type === 'Pressable') host.listen(node, 'click', () => {})
  }

  function materialize(node: NativeNode): void {
    const record = recordOf(node)
    if (record.materialized || node.__stxAnchor !== undefined)
      return
    installControlListeners(node)
    record.style = resolveStyle(record, node.__stxId)
    record.materialized = true
    emit({
      op: 'createNode',
      id: node.__stxId,
      node: {
        type: record.type,
        ...(record.key === undefined ? {} : { key: record.key }),
        props: { ...record.props, ...projectAccessibility(record.props) },
        style: { ...record.style },
        ...(Object.keys(record.events).length ? { events: { ...record.events } } : {}),
        ...(record.text === undefined ? {} : { children: [record.text] }),
      },
    })
    let index = 0
    for (const child of record.children) {
      if (child.__stxAnchor !== undefined)
        continue
      materialize(child)
      emit({ op: 'insertChild', parentId: node.__stxId, childId: child.__stxId, index: index++ })
    }
  }

  function resolveStyle(record: NodeRecord, id: string): Record<string, unknown> {
    const report = (diagnostic: { kind: string, name: string }): void => {
      console.warn(`[STX Native] ${diagnostic.kind}: ${id}: ${diagnostic.name}`)
    }
    let inherited = record.inheritedVariables
    for (const source of record.styleAncestors ?? []) inherited = parseNativeStyleLayers([source], inherited, report).variables
    const resolved = parseNativeStyleLayers([record.styleSource, record.boundStyle, record.forwardedStyle], inherited, report)
    record.variables = resolved.variables
    const classes = compileClassStyles(`${record.classes} ${record.forwardedClasses ?? ''}`, record.variables)
    const style = applyNativeLayoutDefaults({ ...classes.style, ...(colorScheme === 'dark' ? classes.dark : {}), ...resolved.styles[0], ...record.baseStyle, ...resolved.styles[1], ...resolved.styles[2] } as STXStyle)
    return { ...style, ...(record.visible && !isHiddenInput(record) ? {} : { display: 'none' }) }
  }

  function refreshStyleTree(node: NativeNode, inherited = node.__stxOwner ? descriptorOf(node.__stxOwner)?.variables : stylesheetVariables, appearanceChanged = false): void {
    if (node.__stxAnchor !== undefined) return
    const record = recordOf(node)
    const before = record.variables
    record.inheritedVariables = inherited
    applyClasses(node.__stxId, record, true)
    const after = record.variables!
    if (!appearanceChanged && before?.size === after.size && [...after].every(([name, value]) => before.has(name) && before.get(name) === value)) return
    for (const child of record.children) refreshStyleTree(child, after, appearanceChanged)
  }

  function forwardedHostRoot(node: NativeNode, name: string): NativeNode | undefined {
    if (!isBindingNode(node) || !(node.getAttribute('data-stx-native-forward') ?? '').split(/\s+/).includes(name))
      return
    const find = (candidate: NativeNode): NativeNode | undefined => {
      if (isBindingNode(candidate) && candidate.hasAttribute('data-stx-native-host-root'))
        return candidate
      for (const child of recordOf(candidate).children) {
        // Another component owns its own forwarding policy.
        if (isBindingNode(child) && child.hasAttribute('data-stx-component-wrapper'))
          continue
        const match = find(child)
        if (match) return match
      }
    }
    return find(node)
  }

  function applyForwardedStyle(node: NativeNode, name: string, value: unknown): boolean {
    const record = recordOf(node)
    if (name === 'class' || name === 'class-name' || name === 'className') {
      record.forwardedClasses = Array.isArray(value)
        ? value.filter(Boolean).join(' ')
        : value && typeof value === 'object'
          ? Object.entries(value).filter(([, enabled]) => enabled).map(([classes]) => classes).join(' ')
          : String(value ?? '')
    }
    else if (name === 'style')
      record.forwardedStyle = value
    else
      return false
    refreshStyleTree(node)
    return true
  }

  function reflectAttribute(node: NativeNode, name: string, value: unknown, remove = false): void {
    if (!isBindingNode(node) || name === 'class' || name === 'className') return
    if (remove) {
      if (!node.hasAttribute(name)) return
      node.removeAttribute(name)
    }
    else {
      const serialized = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
      if (node.getAttribute(name) === serialized) return
      node.setAttribute(name, serialized)
    }
    notifyAttributes(node, name)
  }

  function applyClasses(id: string, record: NodeRecord, onlyIfChanged = false): void {
    const style = resolveStyle(record, id)
    const patch = Object.fromEntries(Object.keys(record.style).filter(key => !(key in style)).map(key => [key, null]))
    const changed = !onlyIfChanged || JSON.stringify(record.style) !== JSON.stringify(style)
    record.style = style
    if (record.materialized && changed) emit({ op: 'updateNode', id, patch: { style: { ...patch, ...style } } })
    const classes = compileClassStyles(`${record.classes} ${record.forwardedClasses ?? ''}`, record.variables)
    const unsupported = new Set(classes.unknown)
    for (const name of unsupported) {
      if (!record.reportedClasses?.has(name))
        console.warn(`[STX Native] unknown-class: ${id}: ${name}`)
    }
    record.reportedClasses = unsupported
    if (record.type === 'Icon' && classes.icon) {
      const icon = resolveIconName(classes.icon)
      record.props.symbol = icon.symbol
      record.props.iconify = icon.iconify
      if (record.materialized) emit({ op: 'updateNode', id, patch: { props: { symbol: record.props.symbol, iconify: icon.iconify } } })
    }
    if (classes.numberOfLines !== undefined) {
      record.props.numberOfLines = classes.numberOfLines
      if (record.materialized) emit({ op: 'updateNode', id, patch: { props: { numberOfLines: classes.numberOfLines } } })
    }
  }

  /** Every node under this one, read off the parentage the host recorded. */
  function collectDescendants(node: NativeNode): NativeNode[] {
    const out: NativeNode[] = []
    const visit = (current: NativeNode): void => {
      const record = records.get(current.__stxId)
      if (!record)
        return
      for (const child of record.children) {
        out.push(child)
        visit(child)
      }
    }
    if (node)
      visit(node)
    return out
  }

  function isBindingNode(node: NativeNode): node is NativeBindingNode {
    return (node as NativeBindingNode).nodeType === 1
  }

  function decoratePosition(node: NativeNode): void {
    const target = node as NativeNode & { __stxPositionDecorated?: boolean }
    if (target.__stxPositionDecorated)
      return
    Object.defineProperties(target, {
      focus: { configurable: true, value: (focusOptions?: NativeFocusOptions) => host.focus(node, focusOptions) },
      measure: { configurable: true, value: () => host.measure(node) },
      nextSibling: {
        configurable: true,
        get() {
          const owner = target.__stxOwner
          if (!owner) return null
          const siblings = recordOf(owner).children
          const index = siblings.findIndex(candidate => candidate.__stxId === target.__stxId)
          return index === -1 ? null : siblings[index + 1] ?? null
        },
      },
      nextElementSibling: {
        configurable: true,
        get() {
          let sibling = (target as any).nextSibling as NativeNode | null
          while (sibling && !isBindingNode(sibling))
            sibling = (sibling as any).nextSibling as NativeNode | null
          return sibling
        },
      },
    })
    target.__stxPositionDecorated = true
  }

  async function withMountedView<T>(node: NativeNode, request: (views: NativeViewOperations) => Promise<T>): Promise<T> {
    // onMount runs during hydration, before the initial RENDER. A microtask
    // lets mount finish and any immediately queued structural updates run.
    await Promise.resolve()
    if (disposed) throw nativeViewError('SCREEN_CLOSED', 'The native screen has closed')
    const record = records.get(node.__stxId)
    if (!record?.materialized || node.__stxAnchor !== undefined || (isBindingNode(node) && !node.isConnected))
      throw nativeViewError('VIEW_NOT_MOUNTED', `Native view ${node.__stxId} is not mounted`)
    if (!options.views) throw nativeViewError('UNSUPPORTED', 'Native view operations are unavailable')
    const epoch = record.viewEpoch ?? 0
    flush()
    const result = await request(options.views)
    if (disposed) throw nativeViewError('SCREEN_CLOSED', 'The native screen has closed')
    if (records.get(node.__stxId) !== record || (record.viewEpoch ?? 0) !== epoch)
      throw nativeViewError('VIEW_NOT_MOUNTED', `Native view ${node.__stxId} changed while the operation was pending`)
    return result
  }

  function setConnected(node: NativeNode, connected: boolean): void {
    if ('isConnected' in node)
      (node as NativeBindingNode).isConnected = connected
    // A node shown again still has its subtree parked on its detached record
    // (revived only when it materialises, after this). Reading the live
    // records alone stopped at the node itself, so everything under a
    // re-inserted branch stayed "disconnected": a nested :if shown with it
    // waited for a reconnect that never came, and its :for never rendered.
    descriptorOf(node)?.children.forEach(child => setConnected(child, connected))
  }

  function removeFromBindingParent(node: NativeNode): void {
    const owner = node.__stxOwner
    if (!owner || !isBindingNode(owner))
      return
    owner.childNodes = owner.childNodes.filter(child => child.__stxId !== node.__stxId)
    owner.children = owner.children.filter(child => child.__stxId !== node.__stxId)
  }

  function insertIntoBindingParent(parent: NativeNode, node: NativeNode, index: number): void {
    if (!isBindingNode(parent))
      return
    parent.childNodes.splice(index, 0, node)
    parent.children.splice(index, 0, node)
    if (isBindingNode(node)) {
      node.parentNode = parent
      node.parentElement = parent
    }
  }

  function adopt(node: NativeNode, type: string, owner?: NativeNode | null, descriptor?: Pick<STXNode, 'key' | 'props' | 'style' | 'events' | 'children' | '_classes' | '_inlineStyle' | '_styleSource' | '_styleAncestors' | '_accessibilitySource'>): NativeNode {
    const suffix = /(?:^|\D)(\d+)$/.exec(node.__stxId)?.[1]
    if (suffix)
      counter = Math.max(counter, Number(suffix))
    const classes = descriptor?._classes ?? ''
    const classStyle = compileClassStyles(classes).style as Record<string, unknown>
    const baseStyle = descriptor?._styleSource !== undefined ? {} : descriptor?._inlineStyle ? { ...descriptor._inlineStyle } : Object.fromEntries(Object.entries(descriptor?.style ?? {}).filter(([key, value]) => classStyle[key] !== value))
    const record: NodeRecord = {
      type,
      key: descriptor?.key,
      props: authoredAccessibilityProps(descriptor?.props ?? {}, descriptor?._accessibilitySource),
      style: { ...(descriptor?.style ?? {}) },
      baseStyle,
      styleSource: descriptor?._styleSource,
      styleAncestors: descriptor?._styleAncestors,
      inheritedVariables: owner ? descriptorOf(owner)?.variables : stylesheetVariables,
      classes,
      events: { ...(descriptor?.events ?? {}) },
      text: descriptor?.children?.find(child => typeof child === 'string') as string | undefined,
      children: [],
      visible: true,
      materialized: true,
      controlDefaults: { value: descriptor?.props.value ?? '', checked: descriptor?.props.checked ?? descriptor?.props.value ?? false },
    }
    record.style = resolveStyle(record, node.__stxId)
    if (descriptor) descriptor.style = { ...record.style } as STXNode['style']
    records.set(node.__stxId, record)
    decorateControl(node, type)
    decoratePosition(node)
    node.__stxOwner = owner ?? null
    if (owner) {
      const children = recordOf(owner).children
      if (!children.some(child => child.__stxId === node.__stxId))
        children.push(node)
    }
    installControlListeners(node)
    return node
  }

  const overlayPresenter = createNativeOverlayPresenter({
    canFocus: options.views?.capabilities.focus === true,
    focus: (node, focusOptions) => host.focus(node, focusOptions),
    descendants: collectDescendants,
    hasAutofocus: node => {
      const value = descriptorOf(node)?.props.autoFocus
      return value === true || value === '' || value === 'true'
    },
    isAvailable: node => {
      if (!records.has(node.__stxId) || disabled(recordOf(node))) return false
      for (let current: NativeNode | null = node; current; current = current.__stxOwner ?? null) {
        const record = records.get(current.__stxId)
        if (!record?.materialized || !record.visible || record.style.display === 'none' || (record.type === 'Modal' && (record.props.visible === false || record.props.visible === 'false')))
          return false
      }
      return true
    },
    type: node => descriptorOf(node)?.type,
    setAttribute: (node, name, value) => host.setAttribute(node, name, value),
    setStyle: (node, value) => host.setStyle(node, value),
    listen: (node, event, callback) => host.listen(node, event, callback),
  })

  const host: NativeHost = {
    isNative: true as const,
    focus: (node, focusOptions) => withMountedView(node, views => views.focus(node.__stxId, focusOptions)),
    measure: node => withMountedView(node, views => views.measure(node.__stxId)),
    syncOverlays: entries => overlayPresenter.sync(entries),
    parent(node) { return node?.__stxOwner ?? null },
    getAttribute(node, name) {
      if (!node) return null
      if (isBindingNode(node)) return node.getAttribute(name)
      const value = descriptorOf(node)?.props[nativePropName(name)]
      return value == null || value === false ? null : value === true ? '' : String(value)
    },
    observeChildren(node, callback) {
      const observers = childObservers.get(node) ?? new Set()
      childObservers.set(node, observers)
      let active = true
      let pending = false
      const notify = (): void => {
        if (!active || pending || disposed) return
        pending = true
        queueMicrotask(() => {
          pending = false
          if (active && !disposed) callback()
        })
      }
      observers.add(notify)
      return () => { active = false; observers.delete(notify) }
    },
    adopt,
    setColorScheme(scheme) {
      if (scheme === colorScheme) return
      colorScheme = scheme
      stylesheetVariables = createStyleVariables(options.stylesheetTheme?.[scheme] ?? []).computed()
      // Traverse parent-first: cloned/reinserted nodes need not occur in map
      // insertion order. Each descendant inherits the new computed parent map.
      const children = new Set([...records.values()].flatMap(record => record.children.map(child => child.__stxId)))
      for (const id of records.keys()) if (!children.has(id)) refreshStyleTree({ __stxId: id }, stylesheetVariables, true)
    },
    pending: () => queue.length,
    flush,
    dispose() {
      overlayPresenter.dispose()
      disposed = true
      queue = []
      handlers.clear()
      records.clear()
    },

    snapshot(root) {
      queue = []
      const describe = (node: NativeNode): STXNode => {
        const record = recordOf(node)
        if (!record.materialized)
          record.style = resolveStyle(record, node.__stxId)
        record.materialized = true
        const children = record.children
          .filter(child => child.__stxAnchor === undefined)
          .map(describe)
        return {
          id: node.__stxId,
          type: record.type,
          props: { ...record.props, ...projectAccessibility(record.props) },
          style: { ...record.style } as STXNode['style'],
          events: { ...record.events },
          children: record.text === undefined ? children : [record.text],
        }
      }
      return describe(root)
    },

    setText(node, value) {
      const text = value == null ? '' : String(value)
      const record = recordOf(node)
      record.text = text
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { children: [text] } })
    },

    setMarkup(node, value) {
      const record = recordOf(node)
      const markup = value == null ? '' : String(value)
      if (record.markup === markup)
        return
      for (const child of [...record.children])
        this.remove(child)
      record.markup = markup
      for (const source of parseSvgMarkup(markup)) {
        const materializeMarkup = (parent: NativeNode, descriptor: STXNode): void => {
          const child = { __stxId: nextId('n') } as NativeNode
          decoratePosition(child)
          adopt(child, descriptor.type, null, descriptor)
          records.get(child.__stxId)!.materialized = false
          this.insert(parent, child)
          for (const nested of descriptor.children) {
            if (typeof nested !== 'string')
              materializeMarkup(child, nested)
          }
        }
        materializeMarkup(node, source)
      }
    },

    setAttribute(node, name, value) {
      const forwarded = forwardedHostRoot(node, name)
      // Binding metadata is the shared runtime's read side. Keep it in step
      // with the typed renderer prop, as DOM getAttribute follows a write.
      reflectAttribute(node, name, value)
      if (forwarded) {
        reflectAttribute(forwarded, name, value)
        if (applyForwardedStyle(forwarded, name, value)) return
        node = forwarded
      }
      if (name === 'class' || name === 'className') {
        const record = recordOf(node)
        record.classes = String(value ?? '')
        applyClasses(node.__stxId, record)
        return
      }
      const prop = nativePropName(name)
      const record = recordOf(node)
      const accessibilityBefore = prop === 'role' || prop.startsWith('aria-') || prop.startsWith('accessibility') ? projectAccessibility(record.props) : undefined
      record.props[prop] = value
      if (record.type === 'Icon' && prop === 'name') {
        const icon = resolveIconName(String(value ?? ''))
        this.setAttribute(node, 'iconify', icon.iconify ?? null)
        this.setAttribute(node, 'symbol', icon.symbol)
      }
      const patch: Record<string, unknown> = { [prop]: value }
      if (accessibilityBefore)
        Object.assign(patch, accessibilityChanges(record.props, accessibilityBefore, prop))
      // A drawing's bound attribute: the renderers read the outline as
      // commands (svg.ts), so a new `d` or `x1` is a new `geometry`.
      if (SVG_NODE_TYPES.has(record.type)) {
        if (prop === 'strokeDasharray' && value != null && !Array.isArray(value))
          patch[prop] = record.props[prop] = String(value).split(/[\s,]+/).map(Number).filter(Number.isFinite)
        if (record.type === 'Svg' && prop === 'viewBox')
          patch[prop] = record.props[prop] = parseViewBox(value)
        if (affectsGeometry(record.type, prop))
          patch.geometry = record.props.geometry = svgGeometry(record.type, record.props)
      }
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { props: patch } })
    },

    removeAttribute(node, name) {
      const forwarded = forwardedHostRoot(node, name)
      reflectAttribute(node, name, undefined, true)
      if (forwarded) {
        reflectAttribute(forwarded, name, undefined, true)
        if (applyForwardedStyle(forwarded, name, undefined)) return
        node = forwarded
      }
      if (name === 'class' || name === 'className') { this.setAttribute(node, name, ''); return }
      const prop = nativePropName(name)
      const record = recordOf(node)
      const accessibilityBefore = prop === 'role' || prop.startsWith('aria-') || prop.startsWith('accessibility') ? projectAccessibility(record.props) : undefined
      delete record.props[prop]
      // Null rather than omitted: a patch is merged on the native side, so an
      // absent key means "unchanged" and would leave the attribute in place.
      const patch: Record<string, unknown> = { [prop]: null }
      if (accessibilityBefore)
        Object.assign(patch, accessibilityChanges(record.props, accessibilityBefore, prop))
      if (affectsGeometry(record.type, prop))
        patch.geometry = record.props.geometry = svgGeometry(record.type, record.props)
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { props: patch } })
    },

    observeAttributes(node, names, callback) {
      const observers = attributeObservers.get(node) ?? new Set()
      attributeObservers.set(node, observers)
      let active = true
      let pending = false
      const observer = { names, notify() {
        if (pending || !active) return
        pending = true
        queueMicrotask(() => {
          pending = false
          if (active && !disposed) callback()
        })
      } }
      observers.add(observer)
      return () => { active = false; observers.delete(observer) }
    },

    setStyle(node, value, replaceBinding = false) {
      const record = recordOf(node)
      if (replaceBinding) {
        record.boundStyle = value
        refreshStyleTree(node)
        return
      }
      // Internal imperative patches may contain null to clear a host field.
      // Reactive bindings instead own a normalized, replaceable style layer.
      if (typeof value !== 'object' || value === null || Array.isArray(value))
        return
      const style = { ...value as Record<string, unknown>, ...(isHiddenInput(record) ? { display: 'none' as const } : {}) }
      Object.assign(record.baseStyle, style)
      Object.assign(record.style, style)
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { style } })
    },

    emitComponentEvent(node, event) {
      if (disposed || !descriptorOf(node)?.materialized) return true
      const ancestors: NativeNode[] = []
      for (let current: NativeNode | null | undefined = node; current; current = current.__stxOwner)
        ancestors.push(current)
      Object.defineProperty(event, 'target', { configurable: true, value: node })
      const invoke = (current: NativeNode, capture: boolean): void => {
        Object.defineProperty(event, 'currentTarget', { configurable: true, value: current })
        const listeners = componentListeners.get(current) ?? []
        for (const listener of [...listeners]) {
          if (listener.event !== event.type || listener.capture !== capture) continue
          if (listener.once) listeners.splice(listeners.indexOf(listener), 1)
          listener.handler(event)
        }
      }
      try {
        for (const current of ancestors.slice(1).reverse()) {
          invoke(current, true)
          if (event.cancelBubble) return !event.defaultPrevented
        }
        // Stopping propagation does not stop other listeners on the target.
        invoke(node, true)
        invoke(node, false)
        if (!event.bubbles || event.cancelBubble) return !event.defaultPrevented
        for (const current of ancestors.slice(1)) {
          invoke(current, false)
          if (event.cancelBubble) break
        }
        return !event.defaultPrevented
      }
      finally { Object.defineProperty(event, 'currentTarget', { configurable: true, value: null }) }
    },

    onFormReset(node, callback) {
      const callbacks = formResetCallbacks.get(node) ?? new Set<() => void>()
      formResetCallbacks.set(node, callbacks)
      callbacks.add(callback)
      return () => { callbacks.delete(callback) }
    },

    listen(node, event, handler, options) {
      const listenerOptions = options as { once?: boolean, capture?: boolean } | undefined
      const listeners = componentListeners.get(node) ?? []
      const listener = { event, handler, once: !!listenerOptions?.once, capture: !!listenerOptions?.capture }
      listeners.push(listener)
      componentListeners.set(node, listeners)
      // The handler stays here and the native side is given an id to report
      // back. Sending a function over a bridge is not possible, and the
      // binding layer never needs to know that -- it hands over a closure
      // either way.
      const nativeEvent = NATIVE_EVENT_NAMES[event.toLowerCase()] ?? event
      const record = recordOf(node)
      // A renderer holds one handler id per event. Multiplex all listeners
      // behind that id, rather than replacing the previous registration.
      const registrations = eventRegistrations.get(node) ?? new Map<string, string>()
      eventRegistrations.set(node, registrations)
      const existing = registrations.get(nativeEvent)
      if (existing && handlers.has(existing)) return
      const id = nextId('h')
      registrations.set(nativeEvent, id)
      handlers.set(id, (payload) => {
        if (disabled(record)) return
        if (nativeEvent === 'onChangeText' || nativeEvent === 'onValueChange') {
          const data = payload && typeof payload === 'object' ? payload as Record<string, any> : {}
          const value = data.text ?? data.value ?? data.nativeEvent?.text ?? data.nativeEvent?.value
          const record = recordOf(node)
          if (record.type === 'Checkbox' && value !== undefined)
            (node as NativeNode & { checked: boolean }).checked = Boolean(value)
          if (value !== undefined && !Object.is(record.props.value, value) && (record.type === 'TextInput' || record.type === 'Picker' || record.type === 'Switch')) {
            record.props.value = value
            // The platform already displays the edit, but its retained tree
            // must receive it too. Otherwise the next unrelated mutation
            // reconciles against the old value and erases the user's input.
            if (record.materialized) emit({ op: 'updateNode', id: node.__stxId, patch: { props: { value } } })
          }
        }
        const delivered = eventAt(payload, node, event)
        const physical = delivered && typeof delivered === 'object' ? delivered as Event : null
        const ancestors: NativeNode[] = [node]
        if (physical && ['onPress', 'onChangeText', 'onValueChange', 'onBlur', 'onFocus'].includes(nativeEvent)) {
          for (let owner = node.__stxOwner; owner; owner = owner.__stxOwner) ancestors.push(owner)
        }
        const invoke = (target: NativeNode, capture: boolean): void => {
          if (physical) Object.defineProperty(physical, 'currentTarget', { configurable: true, value: target })
          const group = componentListeners.get(target) ?? []
          for (const current of [...group]) {
            if ((NATIVE_EVENT_NAMES[current.event.toLowerCase()] ?? current.event) !== nativeEvent || current.capture !== capture) continue
            if (target !== node && (current.event === 'blur' || current.event === 'focus')) continue
            if (!group.includes(current)) continue
            if (current.once) group.splice(group.indexOf(current), 1)
            current.handler(delivered)
          }
        }
        let reachedTarget = true
        for (const target of ancestors.slice(1).reverse()) {
          invoke(target, true)
          if (physical?.cancelBubble) { reachedTarget = false; break }
        }
        if (reachedTarget) {
          invoke(node, true)
          invoke(node, false)
        }
        if (!physical?.cancelBubble) {
          for (const target of ancestors.slice(1)) {
            invoke(target, false)
            if (physical?.cancelBubble) break
          }
        }
        if (physical) Object.defineProperty(physical, 'currentTarget', { configurable: true, value: node })
        // A native picker/checkbox reports a value change once. Browsers
        // also send input, which shared forms use for change validation.
        if (nativeEvent === 'onValueChange' && (record.type === 'Picker' || record.type === 'Checkbox'))
          host.emitComponentEvent(node, eventAt(payload, node, 'input') as Event)
        const form = formOwner(node)
        if (form && nativeEvent === 'onPress' && !physical?.defaultPrevented && !disabled(record)) {
          if (record.props.type === 'submit') host.emitComponentEvent(form, eventAt({ submitter: node }, form, 'submit') as Event)
          if (record.props.type === 'reset') resetForm(form)
        }
      })
      record.events[nativeEvent] = id
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { events: { [nativeEvent]: id } } })
      // A delegated listener needs the pressed control's identity, not a
      // gesture attached only to the ancestor. New/cloned controls take the
      // same path when materialized, so runtime tab lists remain interactive.
      if (nativeEvent === 'onPress') {
        for (const child of collectDescendants(node)) {
          if (['Button', 'Pressable'].includes(descriptorOf(child)?.type ?? '')) installControlListeners(child)
        }
      }
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
      // Hiding is an override on top of the node; showing takes it off again,
      // so the node's own display comes back — its inline style, else its
      // classes in this appearance (`hidden dark:flex` stays hidden in light).
      // Forcing 'flex' on show drew a dark-only logo in light mode.
      if (!visible) {
        if (was) record.shownDisplay = record.baseStyle.display
        record.baseStyle.display = 'none'
      }
      else if (!was) {
        if (record.shownDisplay === undefined) delete record.baseStyle.display
        else record.baseStyle.display = record.shownDisplay
        record.shownDisplay = undefined
      }
      // `display` is how the IR spells it, so the renderers already understand
      // it; the host does not invent a second vocabulary for the same thing.
      record.style = resolveStyle(record, node.__stxId)
      const display = visible ? irDisplay(record.style.display) : 'none'
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { style: { display } } })
      return was
    },

    anchor(label) {
      // Logical only: it is a position in this host's ordering and is never
      // created on the native side, so it costs no view.
      const anchor = { __stxId: nextId('a'), __stxAnchor: label }
      decoratePosition(anchor)
      return anchor
    },

    clone(node) {
      const source = descriptorOf(node)
      const id = nextId('n')
      const copy: NativeNode = isBindingNode(node)
        ? cloneNativeBindingNode(node, id, value => this.setAttribute(copy, 'class', value))
        : { __stxId: id, __stxOwner: node.__stxOwner }
      decoratePosition(copy)
      if (node.__stxScope !== undefined)
        copy.__stxScope = node.__stxScope

      const descriptor: NodeRecord = source ?? {
        type: 'View',
        props: {},
        style: {},
        baseStyle: {},
        classes: '',
        events: {},
        children: [],
        visible: true,
        materialized: true,
      }
      records.set(copy.__stxId, {
        type: descriptor.type,
        key: descriptor.key,
        props: { ...descriptor.props, __stxId: copy.__stxId },
        style: { ...descriptor.style },
        baseStyle: { ...descriptor.baseStyle },
        styleSource: descriptor.styleSource,
        styleAncestors: descriptor.styleAncestors,
        inheritedVariables: descriptor.inheritedVariables,
        variables: descriptor.variables,
        boundStyle: descriptor.boundStyle,
        classes: descriptor.classes,
        forwardedClasses: descriptor.forwardedClasses,
        forwardedStyle: descriptor.forwardedStyle,
        events: { ...descriptor.events },
        text: descriptor.text,
        children: [],
        visible: descriptor.visible,
        materialized: false,
        controlDefaults: descriptor.controlDefaults,
      })
      decorateControl(copy, descriptor.type)
      setConnected(copy, false)

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
      const oldOwner = node.__stxOwner

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
      else if (oldOwner) {
        const oldRecord = recordOf(oldOwner)
        const oldIndex = oldRecord.children.findIndex(child => child.__stxId === node.__stxId)
        if (oldIndex !== -1)
          oldRecord.children.splice(oldIndex, 1)
      }
      removeFromBindingParent(node)

      const index = before
        ? Math.max(0, record.children.findIndex(child => child.__stxId === before.__stxId))
        : record.children.length

      record.children.splice(index, 0, node)
      node.__stxOwner = parent
      refreshStyleTree(node, record.variables)
      insertIntoBindingParent(parent, node, index)
      setConnected(node, record.materialized)
      if (oldOwner && oldOwner !== parent) notifyChildren(oldOwner)
      notifyChildren(parent)

      // An anchor holds a place in the ordering and nothing else, so moving one
      // is bookkeeping rather than a native operation.
      if (node.__stxAnchor !== undefined || !record.materialized)
        return

      materialize(node)

      /*
       * The native parent holds views, never anchors (materialize skips them),
       * so the position it is told counts only the views before this one. The
       * binding layer's index counts the anchors too: every `:if` puts one in
       * front of its element, so showing a branch said "index 2" to a parent
       * holding no views, the host refused the whole batch as INVALID_INDEX,
       * and a screen stayed on its first branch for good.
       */
      let nativeIndex = 0
      for (let i = 0; i < index; i++) {
        if (record.children[i].__stxAnchor === undefined)
          nativeIndex++
      }

      emit({
        op: existing === -1 ? 'insertChild' : 'moveChild',
        parentId: parent.__stxId,
        childId: node.__stxId,
        index: nativeIndex,
      })
    },

    /*
     * Teardown reaches a subtree by asking, not by searching.
     *
     * Both disposal paths in the runtime used to run a selector query -- one
     * for every descendant, one for `[data-stx-scope]`. A view hierarchy has
     * neither, and the host already recorded the parentage as the tree was
     * built, so answering is a walk over its own map rather than a search.
     *
     * An anchor is included: it is a node the binding layer holds and hangs
     * state on, even though it never becomes a view.
     */
    descendants: collectDescendants,

    /*
     * Scope IDS, not scope nodes: the only thing the runtime does with them is
     * look the scope up in its own registry and delete it. Returning a node
     * would make the caller ask it for its id, which is the attribute read
     * this removes.
     */
    scopesIn(node) {
      const ids: string[] = []
      if (!node)
        return ids
      if (node.__stxScope !== undefined)
        ids.push(node.__stxScope)
      for (const child of collectDescendants(node))
        if (child.__stxScope !== undefined)
          ids.push(child.__stxScope)
      return ids
    },

    remove(node) {
      const wasMaterialized = descriptorOf(node)?.materialized === true
      const owner = node.__stxOwner
      if (owner) {
        const record = recordOf(owner)
        const at = record.children.findIndex(child => child.__stxId === node.__stxId)
        if (at !== -1)
          record.children.splice(at, 1)
      }
      removeFromBindingParent(node)
      node.__stxOwner = null
      if (isBindingNode(node)) {
        node.parentNode = null
        node.parentElement = null
      }
      setConnected(node, false)
      releaseHandlers(node)
      retainDetachedDescriptors(node)
      notifyChildren(owner)
      if (node.__stxAnchor !== undefined || !wasMaterialized)
        return
      emit({ op: 'removeNode', id: node.__stxId })
    },
  }
  return host
}
