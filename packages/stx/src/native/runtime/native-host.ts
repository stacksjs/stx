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
import { ACCESSIBILITY_FIELDS, accessibilityChanges, authoredAccessibilityProps, isAccessibilityAttribute, projectAccessibility } from '../accessibility'
import { type NativeClassTable, seedClassTable } from '../compiler/class-table'
import { compileClassStyles, NATIVE_STATE_VARIANTS } from '../compiler/headwind-to-style'
import { resolveIconName } from '../compiler/icons'
import { applyNativeLayoutDefaults, parseNativeStyleLayers } from '../compiler/inline-style'
import { createStyleVariables, type NativeStyleVariables } from '../compiler/style-variables'
import type { NativeStylesheetTheme } from '../compiler/stylesheet-theme'
import type { NativeStylesheetRules } from '../compiler/stylesheet-rules'
import { affectsGeometry, applySvgAnimation, parseSvgMarkup, parseViewBox, SVG_ANIMATION_ATTRIBUTES, SVG_NODE_TYPES, svgGeometry } from '../compiler/svg'
import { NATIVE_EVENT_NAMES } from '../event-names'
import { nativePropName } from '../prop-names'
import { authoredTextEntryProps, projectTextEntry, TEXT_ENTRY_SOURCES, textEntryChanges } from '../text-entry'
import { BindingElement, cloneNativeBindingNode, cloneNativeBindingNodeWith, type BindingElementClass, type NativeBindingNode } from './binding-tree'
import { NATIVE_FORM_ENTRIES } from './jsc-globals'
import { createNativeOverlayPresenter, type NativeOverlayEntry } from './overlay-presenter'
import { prepareInitialMedia } from './initial-media-mutations'
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
  layoutDefaults?: STXStyle
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
  /** The current unmapped icon, so style refreshes do not repeat its warning. */
  reportedIcon?: string
  focused?: boolean
  focusWithin?: boolean
  focusListenersInstalled?: boolean
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
  /** This node's `divide-*` classes, as the border each later child draws. */
  divide?: { style: STXStyle, dark?: STXStyle }
  /** The border its parent's `divide-*` gives this node, when it is not the first child shown. */
  dividerStyle?: Record<string, unknown>
  /** Its children have been given divider styles (it had `divide-*` classes at some point). */
  hadDividers?: boolean
  /** How many of its children are views rather than anchors; worked out when first needed. */
  viewCount?: number
  /**
   * Its style waits for it to be created on the native side. A node not yet
   * materialised has nobody to show a style to, so the bindings, classes and
   * parents that change it while a row is built only say so; materialize
   * resolves it once.
   */
  styleDirty?: boolean
  /** The last compiled classes (classStylesOf). */
  classMemo?: { source: string, variables: NativeStyleVariables | undefined, scheme: string, style?: ReturnType<typeof compileClassStyles>, props?: ReturnType<typeof compileClassStyles> }
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
  /**
   * The screen's width in points, for `sm:`/`md:`/`lg:` classes; later changes
   * arrive through VIEWPORT. Unknown (0) is a phone: the base styles only.
   */
  viewportWidth?: number
  stylesheetTheme?: NativeStylesheetTheme
  /** The page's own class rules, read with the utilities when a class changes. */
  stylesheetRules?: NativeStylesheetRules
  /** The screen's class lists as the build compiled them, seeded into the class cache (class-table.ts). */
  classTable?: NativeClassTable
  /**
   * The host has a pointer (a Mac): `hover:` and `active:` classes travel with
   * the node as `hoverStyle` and `pressStyle` for the host to apply as the
   * pointer moves, and `transition`/`duration-*` become `transitionDuration`.
   */
  pointer?: boolean
  /** Called with each batch. One call per flush, never per operation. */
  send: (operations: NativeMutationOperation[]) => void
  /**
   * Schedules a flush. Defaults to a microtask, so a signal update that
   * touches twenty nodes crosses the bridge once rather than twenty times --
   * the bridge is the expensive part, not the bookkeeping.
   */
  schedule?: (flush: () => void) => void
  /**
   * A pressed link's default action, after its listeners ran and none
   * prevented it: the screen moves to `href`, as a browser follows a link.
   */
  followLink?: (href: string) => void
  /**
   * Whether a link points at the screen being shown (web-navigation.ts
   * `nativeLinkState`): a `<StxLink>` takes its active and exact-active
   * classes from it, as the web router gives them.
   */
  linkState?: (href: string, match: string | null) => { active: boolean, exact: boolean } | null
}

export interface NativeHost {
  /** Native mutations and binding registration must reach one bridge batch. */
  readonly isNative: true
  /** The element class a binding tree builds this screen's nodes from. */
  readonly bindingElement?: BindingElementClass
  focus: (node: NativeNode, options?: NativeFocusOptions) => Promise<true>
  measure: (node: NativeNode) => Promise<NativeViewBounds>
  syncOverlays: (entries: NativeOverlayEntry[]) => void
  parent: (node: NativeNode) => NativeNode | null
  getAttribute: (node: NativeNode, name: string) => string | null
  observeChildren: (node: NativeNode, callback: () => void) => (() => void)
  setColorScheme: (scheme: 'light' | 'dark') => void
  /** The screen's width changed (rotation, a resized window, split view). */
  setViewportWidth: (width: number) => void
  setText: (node: NativeNode, value: unknown) => void
  setMarkup: (node: NativeNode, value: unknown) => void
  setAttribute: (node: NativeNode, name: string, value: unknown) => void
  removeAttribute: (node: NativeNode, name: string) => void
  observeAttributes: (node: NativeNode, names: string[], callback: () => void) => (() => void)
  /** Imperative calls patch styles; :style replaces its own layer and preserves authored defaults. */
  setStyle: (node: NativeNode, value: unknown, replaceBinding?: boolean) => void
  listen: (node: NativeNode, event: string, handler: (payload?: unknown) => void, options?: unknown) => (() => void)
  emitComponentEvent: (node: NativeNode, event: Event) => boolean
  onFormReset: (node: NativeNode, callback: () => void) => (() => void)
  scopeOf: (node: NativeNode, from?: boolean) => NativeNode | null
  setVisible: (node: NativeNode, visible: boolean) => boolean
  anchor: (label: string) => NativeNode
  clone: (node: NativeNode) => NativeNode
  /**
   * One node of a template, without its children, carrying `attributes`
   * instead of the template's: a native loop row builds its rows node by
   * node and leaves out what it has already bound.
   */
  cloneElement: (node: NativeNode, attributes: Array<{ name: string, value: string }>) => NativeNode
  /**
   * Place a node made by `cloneElement` (or an anchor) last under a parent
   * that is itself still being built off the screen. The general insert's
   * work (moving, styles, focus, observers, dividers) has nothing to do there;
   * anything else takes the general insert.
   */
  append: (parent: NativeNode, node: NativeNode) => void
  insert: (parent: NativeNode, node: NativeNode, before?: NativeNode | null) => void
  remove: (node: NativeNode) => void
  descendants: (node: NativeNode) => NativeNode[]
  scopesIn: (node: NativeNode) => string[]
  /** Register a node the native side already created, so the host can track it. */
  adopt: (node: NativeNode, type: string, owner?: NativeNode | null, descriptor?: Pick<STXNode, 'key' | 'props' | 'style' | 'events' | 'children' | '_classes' | '_inlineStyle' | '_layoutDefaults' | '_styleSource' | '_styleAncestors'>) => NativeNode
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

/**
 * The words of a list attribute (`data-stx-native-forward`, a wrapper's parent
 * bindings), remembered: every bound attribute write asks, and a regular
 * expression split is among the slowest things an interpreted engine does.
 */
const wordLists = new Map<string, string[]>()
function words(text: string): string[] {
  let list = wordLists.get(text)
  if (list === undefined) {
    list = text.split(/\s+/).filter(Boolean)
    if (wordLists.size >= 2000) wordLists.clear()
    wordLists.set(text, list)
  }
  return list
}
const flatNames = new Map<string, string>()
function flatName(name: string): string {
  let flat = flatNames.get(name)
  if (flat === undefined) {
    flat = name.replace(/-/g, '').toLowerCase()
    if (flatNames.size >= 2000) flatNames.clear()
    flatNames.set(name, flat)
  }
  return flat
}

/** The host's name for an event a binding listens for (`press` -> `onPress`), remembered. */
const nativeEventNames = new Map<string, string>()
function nativeEventName(event: string): string {
  let name = nativeEventNames.get(event)
  if (name === undefined) {
    name = NATIVE_EVENT_NAMES[event.toLowerCase()] ?? event
    if (nativeEventNames.size >= 2000) nativeEventNames.clear()
    nativeEventNames.set(event, name)
  }
  return name
}

/** Whether an event name is one no native host emits: not in the platform map, not spelled as a native prop (`onX`). */
const scriptEventNames = new Map<string, boolean>()
function scriptOnlyEvent(event: string): boolean {
  let only = scriptEventNames.get(event)
  if (only === undefined) {
    only = NATIVE_EVENT_NAMES[event.toLowerCase()] === undefined && !/^on[A-Z]/.test(event)
    if (scriptEventNames.size >= 2000) scriptEventNames.clear()
    scriptEventNames.set(event, only)
  }
  return only
}

/** A link's own press listener: the press handler's default action follows it. */
function followsHref(): void {}

export function createNativeHost(options: NativeHostOptions): NativeHost {
  const records = new Map<string, NodeRecord>()
  const attributeObservers = new WeakMap<NativeNode, Set<{ names: string[], notify: () => void }>>()
  const childObservers = new WeakMap<NativeNode, Set<() => void>>()
  const handlers = new Map<string, (payload?: unknown) => void>()
  const eventRegistrations = new WeakMap<NativeNode, Map<string, string>>()
  const componentListeners = new WeakMap<NativeNode, Array<{ event: string, handler: (payload?: unknown) => void, once: boolean, capture: boolean }>>()
  const controlsWithDefaultListeners = new WeakSet<NativeNode>()
  const implicitSubmitListeners = new WeakMap<NativeNode, { listener: (event: unknown) => void, stop: () => void }>()
  const formResetCallbacks = new WeakMap<NativeNode, Set<() => void>>()
  // Whether a template node binds its href, by node: asked for every copy.
  const boundHrefs = new WeakMap<NativeNode, boolean>()
  let queue: NativeMutationOperation[] = []
  let mediaFlushTimer: ReturnType<typeof setTimeout> | undefined
  let scheduled = false
  let counter = 0
  let colorScheme = options.colorScheme ?? 'light'
  let viewportWidth = Number.isFinite(options.viewportWidth) ? Math.max(0, options.viewportWidth!) : 0
  // Every width a layer on screen starts or stops at: a resize that crosses none changes no style.
  const widthBounds = { min: new Set<number>(), max: new Set<number>() }
  const crossesWidthBound = (from: number, to: number): boolean => {
    for (const min of widthBounds.min) if ((from >= min) !== (to >= min)) return true
    for (const max of widthBounds.max) if ((from <= max) !== (to <= max)) return true
    return false
  }
  let stylesheetVariables = createStyleVariables(options.stylesheetTheme?.[colorScheme] ?? []).computed()
  if (options.classTable) seedClassTable(options.classTable, colorScheme, stylesheetVariables, options.stylesheetRules)
  let disposed = false

  const schedule = options.schedule ?? ((flush: () => void) => queueMicrotask(flush))
  const followLink = options.followLink
  const linkState = options.linkState

  const nextId = (prefix: string): string => `${prefix}${++counter}`

  function notifyAttributes(node: NativeNode, name: string): void {
    for (const observer of attributeObservers.get(node) ?? []) {
      if (observer.names.includes(name)) observer.notify()
    }
  }

  /**
   * `divide-y` and its kin: every child shown after the first draws the
   * parent's divider as its own leading border, as the web's sibling selector
   * does. Run when the parent's classes or its children change, or a child is
   * shown or hidden.
   */
  function refreshDividers(parent: NativeNode | null | undefined): void {
    const record = parent && descriptorOf(parent)
    if (record) refreshDividersOf(record)
  }

  function viewCountOf(record: NodeRecord): number {
    if (record.viewCount === undefined) {
      let count = 0
      for (const child of record.children) if (child.__stxAnchor === undefined) count++
      record.viewCount = count
    }
    return record.viewCount
  }

  /** A child's position, searched from the end: rows go in before a loop's closing anchor, its last child. */
  function lastIndexOfChild(children: NativeNode[], id: string): number {
    for (let i = children.length - 1; i >= 0; i--) if (children[i]!.__stxId === id) return i
    return -1
  }

  function refreshDividersOf(record: NodeRecord): void {
    // A list without `divide-*` whose children never had a divider has nothing
    // to refresh. This runs on every insert, so without the check filling a
    // list walked every sibling each time: quadratic in the list's length.
    if (!record.divide && !record.hadDividers) return
    if (record.divide) record.hadDividers = true
    let first = true
    for (const child of record.children) {
      if (child.__stxAnchor !== undefined) continue
      const childRecord = descriptorOf(child)
      if (!childRecord) continue
      const divider = record.divide && !first
        ? { ...record.divide.style, ...(colorScheme === 'dark' ? record.divide.dark : {}) } as Record<string, unknown>
        : undefined
      if (childRecord.visible) first = false
      if (JSON.stringify(divider) === JSON.stringify(childRecord.dividerStyle)) continue
      childRecord.dividerStyle = divider
      applyClasses(child.__stxId, childRecord, true)
    }
  }

  function notifyChildren(node: NativeNode | null | undefined): void {
    refreshDividers(node)
    for (let current = node; current; current = current.__stxOwner) {
      for (const notify of childObservers.get(current) ?? []) notify()
    }
  }

  function flush(): void {
    if (mediaFlushTimer !== undefined) clearTimeout(mediaFlushTimer)
    mediaFlushTimer = undefined
    scheduled = false
    if (queue.length === 0)
      return
    const batch = queue
    queue = []
    options.send(prepareInitialMedia(batch))
  }

  function scheduledFlush(): void {
    // A remounted component replays parent props through attribute observers.
    // Let the current microtask turn finish before creating media: unlike
    // DOM media, its native loader starts inside createNode. Existing-media
    // updates and every other batch keep the ordinary microtask schedule.
    if (typeof setTimeout === 'function' && typeof clearTimeout === 'function' && queue.some(op => op.op === 'createNode' && (op.node.type === 'Image' || op.node.type === 'Video')))
      mediaFlushTimer = setTimeout(flush, 0)
    else flush()
  }

  function emit(operation: NativeMutationOperation): void {
    if (disposed) return
    queue.push(operation)
    if (!scheduled) {
      scheduled = true
      schedule(scheduledFlush)
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

  /** The first nonempty href/to, including current bindings, as on the native host. */
  function linkHref(node: NativeNode): string | null {
    const props = descriptorOf(node)?.props
    for (const value of [props?.href, props?.to]) {
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return null
  }

  /**
   * A link is pressable with no @click of its own: the press handler's
   * default action follows its href (`followLink`). Installed for every
   * link adopted or cloned, since a :for row's copy of the template's
   * handler would follow the template's href.
   */
  function installLinkListener(node: NativeNode, authored: NativeNode = node): void {
    markCurrentLink(node)
    if (!followLink) return
    // The authored node's attributes say whether the href is bound: a copy
    // made by cloneElement no longer carries the bindings its row applies.
    // A template is cloned for every row, so its answer is kept.
    let bound = boundHrefs.get(authored)
    if (bound === undefined || authored === node) {
      bound = isBindingNode(authored) && authored.attributes.some(attribute => attribute.name.endsWith('href') && /^(?::|x-bind:|@bind:|x-)href$/.test(attribute.name))
      if (authored !== node) boundHrefs.set(authored, bound)
    }
    if (bound || typeof descriptorOf(node)?.props.href === 'string')
      host.listen(node, 'click', followsHref)
  }

  /** A `<StxLink>`'s active and exact-active classes, for where it points now. */
  function markCurrentLink(node: NativeNode): void {
    const record = descriptorOf(node)
    if (!linkState || !record || record.props['data-stx-link'] === undefined) return
    const href = linkHref(node)
    const state = href === null ? null : linkState(href, typeof record.props['data-stx-active-match'] === 'string' ? record.props['data-stx-active-match'] : null)
    if (!state) return
    const words = (value: unknown, fallback: string): string[] => String(typeof value === 'string' ? value : fallback).split(/\s+/).filter(Boolean)
    const active = words(record.props['data-stx-active-class'], 'active')
    const exact = words(record.props['data-stx-exact-active-class'], 'exact-active')
    const kept = record.classes.split(/\s+/).filter(word => word && !active.includes(word) && !exact.includes(word))
    const next = [...kept, ...(state.exact ? exact : []), ...(state.active ? active : [])].filter((word, index, all) => all.indexOf(word) === index).join(' ')
    if (next === record.classes) return
    record.classes = next
    applyClasses(node.__stxId, record)
  }

  function retainDetachedDescriptors(node: NativeNode): void {
    const record = records.get(node.__stxId)
    if (!record)
      return
    // Removing a native view removes its whole subtree. A nested :for or
    // :if can dispose its own children afterwards; those views are already
    // gone and must not send another removeNode to the strict native host.
    record.materialized = false
    record.focused = false
    record.focusWithin = false
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
    const own = descriptorOf(node)
    // Nearly every node is neither a control nor a form: nothing to decorate.
    if (type !== 'TextInput' && type !== 'Picker' && type !== 'Checkbox' && own?.props.type !== 'hidden' && !own?.props['data-stx-form'])
      return
    const htmlCheckbox = type === 'Checkbox' && own?.props.type === 'checkbox'
    const hidden = own?.props.type === 'hidden'
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

  /** A node's props as the host reads them: authored, plus the ARIA and text-field projections. */
  function hostProps(record: NodeRecord): Record<string, unknown> {
    return { ...record.props, ...projectAccessibility(record.props, record.type), ...projectTextEntry(record.type, record.props) }
  }

  /**
   * The props a node is created with on the native side: the host's, less
   * what only the binding layer reads (`data-stx-parent-bindings`,
   * `-native-forward`, `-scope`, the node's own id, ...). No native host
   * reads them, they were close to half of every row's createNode, and the
   * bridge's cost grows with the text it carries. A component wrapper keeps
   * its marker: Craft lays a component's single root out through it.
   */
  function createdProps(record: NodeRecord): Record<string, unknown> {
    // One pass over the authored props, which also says whether there is
    // anything to project: every accessibility source starts with `a` or
    // `r` (aria-*, accessibility*, role), and only an image or a text field
    // derives props from anything else. hostProps' spreads and a later
    // delete per binding-layer key cost a row's nodes more than the rest of
    // their createNode together.
    const props = record.props
    const created: Record<string, unknown> = {}
    let accessible = record.type === 'Image'
    const names = Object.keys(props)
    for (let i = 0; i < names.length; i++) {
      const name = names[i]!
      const first = name.charCodeAt(0)
      if (first === 100 ? name.startsWith('data-stx-') && name !== 'data-stx-component-wrapper' : name === '__stxId') continue
      if (!accessible && (first === 97 || first === 114)) accessible = isAccessibilityAttribute(name) || (ACCESSIBILITY_FIELDS as readonly string[]).includes(name)
      created[name] = props[name]
    }
    if (accessible) Object.assign(created, projectAccessibility(props, record.type))
    if (record.type === 'TextInput') Object.assign(created, projectTextEntry(record.type, props))
    return created
  }

  /** An ARIA state attribute that is on: `aria-selected="true"`, as the web's variant matches it. */
  function ariaState(value: unknown): boolean {
    return value === true || value === 'true'
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
    syncImplicitSubmit(node)
    // Track even when no focus class exists yet: a reactive :class can add
    // one while the field is already focused. Use the existing multiplexer
    // so authored focus/blur listeners retain their handler and ordering.
    if (record?.type === 'TextInput' && !record.focusListenersInstalled) {
      record.focusListenersInstalled = true
      host.listen(node, 'focus', () => {})
      host.listen(node, 'blur', () => {})
    }
    if (!record || controlsWithDefaultListeners.has(node)) return
    // Only a control has a default listener to install; everything else
    // would walk its ancestors twice for nothing.
    const pressable = record.type === 'Button' || record.type === 'Pressable'
    if (!pressable && record.type !== 'TextInput' && record.type !== 'Picker' && record.type !== 'Checkbox') return
    let delegatedPress = false
    if (pressable) {
      for (let owner = node.__stxOwner; owner; owner = owner.__stxOwner) {
        if (componentListeners.get(owner)?.some(listener => nativeEventName(listener.event) === 'onPress')) {
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

  /** A keyboard return has the same default form action as browser Enter. */
  function syncImplicitSubmit(node: NativeNode): void {
    const record = descriptorOf(node)
    if (record?.type !== 'TextInput') return
    const eligible = !!formOwner(node) && !record.props.multiline && hostProps(record).returnKeyType !== 'next'
    const previous = implicitSubmitListeners.get(node)
    if (eligible && !previous) {
      const listener = () => {}
      implicitSubmitListeners.set(node, { listener, stop: host.listen(node, 'submit-editing', listener) })
    }
    else if (!eligible && previous) {
      previous.stop()
      implicitSubmitListeners.delete(node)
      const authored = componentListeners.get(node)?.some(listener => nativeEventName(listener.event) === 'onSubmitEditing')
      if (!authored) {
        const id = record.events.onSubmitEditing
        if (id) handlers.delete(id)
        eventRegistrations.get(node)?.delete('onSubmitEditing')
        delete record.events.onSubmitEditing
        if (record.materialized) emit({ op: 'updateNode', id: node.__stxId, patch: { events: { onSubmitEditing: '' } } })
      }
    }
  }

  function materialize(node: NativeNode, inherited: NativeStyleVariables | undefined): void {
    const record = recordOf(node)
    if (record.materialized || node.__stxAnchor !== undefined)
      return
    installControlListeners(node)
    // Resolved once, now, against the parent it is created under: what was
    // deferred while it was detached (see styleDirty), and what its classes
    // say about its props (an icon, a line limit).
    if (inherited !== undefined) record.inheritedVariables = inherited
    record.styleDirty = false
    resolveClasses(node.__stxId, record, false)
    record.materialized = true
    emit({
      op: 'createNode',
      id: node.__stxId,
      node: {
        type: record.type,
        ...(record.key === undefined ? {} : { key: record.key }),
        props: createdProps(record),
        style: { ...record.style },
        ...(Object.keys(record.events).length ? { events: { ...record.events } } : {}),
        ...(record.text === undefined ? {} : { children: [record.text] }),
      },
    })
    let index = 0
    for (const child of record.children) {
      if (child.__stxAnchor !== undefined)
        continue
      materialize(child, record.variables)
      emit({ op: 'insertChild', parentId: node.__stxId, childId: child.__stxId, index: index++ })
    }
  }

  // The node resolveStyle is on, for its diagnostics: one reporter for every
  // call rather than a closure made for each, on a path every node takes.
  let resolvingId = ''
  const reportStyle = (diagnostic: { kind: string, name: string }): void => {
    console.warn(`[STX Native] ${diagnostic.kind}: ${resolvingId}: ${diagnostic.name}`)
  }
  const NO_LAYERS: never[] = []

  /**
   * A node's compiled classes: for its style (in this appearance, with its
   * pointer layers) or for what they say about its props. Both are asked at
   * every resolve, and a node's classes and variables rarely change between
   * two, so the last answers are kept on the record.
   */
  const classMemos = new Map<string, NonNullable<NodeRecord['classMemo']>>()
  function classStylesOf(record: NodeRecord, forStyle: boolean): ReturnType<typeof compileClassStyles> {
    const classes = record.forwardedClasses === undefined ? `${record.classes} ` : `${record.classes} ${record.forwardedClasses}`
    // A text field's classes compile with focus layers of their own.
    const source = record.type === 'TextInput' ? `\u0001${classes}` : classes
    let memo = record.classMemo
    if (!memo || memo.source !== source || memo.variables !== record.variables || memo.scheme !== colorScheme) {
      // Shared by every node with the same classes under the same variables:
      // a list's rows, mostly.
      memo = classMemos.get(source)
      if (!memo || memo.variables !== record.variables || memo.scheme !== colorScheme) {
        memo = { source, variables: record.variables, scheme: colorScheme }
        if (classMemos.size >= 2000) classMemos.clear()
        classMemos.set(source, memo)
      }
      record.classMemo = memo
    }
    if (forStyle)
      return memo.style ??= compileClassStyles(classes, record.variables, { focus: record.type === 'TextInput', focusWithin: true, rules: options.stylesheetRules, appearance: colorScheme, pointer: options.pointer === true })
    return memo.props ??= compileClassStyles(classes, record.variables, { focus: record.type === 'TextInput', focusWithin: true, rules: options.stylesheetRules })
  }

  function resolveStyle(record: NodeRecord, id: string): Record<string, unknown> {
    resolvingId = id
    const report = reportStyle
    let inherited = record.inheritedVariables
    const ancestors = record.styleAncestors
    if (ancestors) for (let i = 0; i < ancestors.length; i++) inherited = parseNativeStyleLayers([ancestors[i]], inherited, report).variables
    const resolved = parseNativeStyleLayers([record.styleSource, record.boundStyle, record.forwardedStyle], inherited, report)
    record.variables = resolved.variables
    const classes = classStylesOf(record, true)
    // A node whose style comes only from its classes and its style layers
    // (no width, state, disabled or focus layer, no divider, no inline base)
    // has the style every node with the same compiled classes and the same
    // translated layers has: the rows of a list, mostly. Those are shared
    // objects (classStylesOf, parseNativeStyleLayers), so the answer is kept
    // by them; the caller gets its own copy.
    const plain = !classes.responsive?.length && !classes.states && !classes.disabled && !record.focusWithin && !record.focused
      && record.dividerStyle === undefined && isBlank(record.layoutDefaults) && isBlank(record.baseStyle) && !isHiddenInput(record)
    let kept: Map<string, Record<string, unknown>> | undefined
    // The appearance decides which of the compiled layers apply (`dark`), and a
    // class table can give both appearances the same compiled object.
    const keptAs = `${colorScheme}${record.visible ? 1 : 0}`
    if (plain) {
      let byFirst = resolvedStyles.get(classes)
      if (!byFirst) resolvedStyles.set(classes, byFirst = new WeakMap())
      const first = layerKey(resolved.styles[0])
      let bySecond = byFirst.get(first)
      if (!bySecond) byFirst.set(first, bySecond = new WeakMap())
      const second = layerKey(resolved.styles[1])
      let byThird = bySecond.get(second)
      if (!byThird) bySecond.set(second, byThird = new WeakMap())
      const third = layerKey(resolved.styles[2])
      kept = byThird.get(third)
      if (!kept) byThird.set(third, kept = new Map())
      const known = kept.get(keptAs)
      if (known) return { ...known }
    }
    const classStyle = { ...classes.style }
    // Width layers apply smallest first, as min-width media queries cascade.
    for (const layer of classes.responsive ?? []) {
      widthBounds.min.add(layer.min)
      if (layer.max !== undefined) widthBounds.max.add(layer.max)
    }
    const responsive = classes.responsive?.length ? classes.responsive.filter(layer => viewportWidth >= layer.min && (layer.max === undefined || viewportWidth <= layer.max)) : NO_LAYERS
    for (const layer of responsive) Object.assign(classStyle, layer.style)
    // ts-css emits `.dark .dark:utility`: that selector outranks a plain
    // responsive utility even when its media rule comes later. Semantic
    // theme defaults are already in each ordinary layer, not in this tier.
    if (colorScheme === 'dark') {
      Object.assign(classStyle, classes.dark)
      for (const layer of responsive) Object.assign(classStyle, layer.dark)
    }
    // `aria-selected:` and its kin, while the node says so. Before
    // `disabled:`, as Tailwind orders the two variants.
    if (classes.states) for (const [attribute, layer] of Object.entries(classes.states)) {
      if (ariaState(record.props[attribute])) Object.assign(classStyle, layer.style, colorScheme === 'dark' ? layer.dark : {})
    }
    if (classes.disabled && disabled(record)) Object.assign(classStyle, classes.disabled.style, colorScheme === 'dark' ? classes.disabled.dark : {})
    // Like utility variant ordering, direct focus overrides focus-within;
    // authored inline/bound styles still win over both layers below.
    if (record.focusWithin || record.focused) for (const layer of [record.focusWithin && classes.focusWithin, record.focused && classes.focus]) {
      if (!layer) continue
      const focused = { ...layer.style, ...(colorScheme === 'dark' ? layer.dark : {}) }
      if (classStyle.transform && focused.transform) {
        const overridden = new Set(focused.transform.flatMap(step => Object.keys(step)))
        focused.transform = [...classStyle.transform.filter(step => !Object.keys(step).some(key => overridden.has(key))), ...focused.transform]
      }
      Object.assign(classStyle, focused)
    }
    // One new object, written in place: a spread per layer was a large share
    // of a node's creation in an interpreted engine.
    const style = applyNativeLayoutDefaults({ ...record.layoutDefaults, ...classStyle, ...record.dividerStyle, ...resolved.styles[0], ...record.baseStyle, ...resolved.styles[1], ...resolved.styles[2] } as STXStyle) as Record<string, unknown>
    const hover = classes.pointer?.hover
    const active = classes.pointer?.active
    if (hover) style.hoverStyle = { ...hover.style, ...(colorScheme === 'dark' ? hover.dark : {}) }
    if (active) style.pressStyle = { ...active.style, ...(colorScheme === 'dark' ? active.dark : {}) }
    if (!record.visible || isHiddenInput(record)) style.display = 'none'
    if (kept) kept.set(keptAs, { ...style })
    return style
  }

  // Resolved styles by compiled classes, then by each style layer's
  // translation (an empty layer counts as one), then by appearance and visibility.
  const resolvedStyles = new WeakMap<object, WeakMap<object, WeakMap<object, WeakMap<object, Map<string, Record<string, unknown>>>>>>()
  const BLANK_LAYER = {}
  function layerKey(style: object | undefined): object {
    return !style || isBlank(style) ? BLANK_LAYER : style
  }
  // Object.keys, not for...in: an interpreter builds an iterator for the
  // latter even over an empty object.
  function isBlank(value: object | undefined | null): boolean {
    return !value || Object.keys(value).length === 0
  }

  function refreshFocusChain(node: NativeNode | null | undefined): void {
    for (let current = node; current; current = current.__stxOwner) {
      const record = descriptorOf(current)
      if (!record) continue
      const within = record.visible && (record.focused === true || record.children.some(child => descriptorOf(child)?.focusWithin === true))
      const changed = record.focusWithin !== within
      record.focusWithin = within
      if (current.__stxAnchor === undefined && (changed || current === node))
        applyClasses(current.__stxId, record, true)
    }
  }

  function refreshStyleTree(node: NativeNode, inherited = node.__stxOwner ? descriptorOf(node.__stxOwner)?.variables : stylesheetVariables, appearanceChanged = false): void {
    if (node.__stxAnchor !== undefined) return
    const record = recordOf(node)
    const before = record.variables
    record.inheritedVariables = inherited
    if (!record.materialized) {
      // Its children are resolved from its variables when it is created.
      record.styleDirty = true
      return
    }
    applyClasses(node.__stxId, record, true)
    const after = record.variables!
    if (!appearanceChanged && before !== undefined && sameVariables(before, after)) return
    for (const child of record.children) refreshStyleTree(child, after, appearanceChanged)
  }

  function sameVariables(before: NativeStyleVariables, after: NativeStyleVariables): boolean {
    if (before === after) return true
    if (before.size !== after.size) return false
    for (const [name, value] of after) if (!before.has(name) || before.get(name) !== value) return false
    return true
  }

  function forwardedHostRoot(node: NativeNode, name: string): NativeNode | undefined {
    if (!isBindingNode(node)) return
    const forward = node.getAttribute('data-stx-native-forward')
    if (!forward || !words(forward).includes(name))
      return
    const find = (candidate: NativeNode): NativeNode | undefined => {
      if (candidate !== node && isBindingNode(candidate) && candidate.hasAttribute('data-stx-native-host-owner'))
        return
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

  /** Whether `name` is one of the caller's bindings a component wrapper holds for its component. */
  function callerBindingOnWrapper(node: NativeNode, name: string): boolean {
    if (!isBindingNode(node) || !node.hasAttribute('data-stx-component-wrapper')) return false
    const bindings = node.getAttribute('data-stx-parent-bindings')
    if (!bindings) return false
    const wanted = flatName(name)
    const names = words(bindings)
    for (let i = 0; i < names.length; i++) if (flatName(names[i]!) === wanted) return true
    return false
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
    if (!record.materialized) {
      record.styleDirty = true
      return
    }
    resolveClasses(id, record, onlyIfChanged)
  }

  function resolveClasses(id: string, record: NodeRecord, onlyIfChanged: boolean): void {
    const style = resolveStyle(record, id)
    if (record.materialized) {
      // Keys the style no longer has are cleared on the native view.
      const patch: Record<string, null> = {}
      for (const key in record.style) if (!(key in style)) patch[key] = null
      const changed = !onlyIfChanged || JSON.stringify(record.style) !== JSON.stringify(style)
      if (changed) emit({ op: 'updateNode', id, patch: { style: { ...patch, ...style } } })
    }
    record.style = style
    const classes = classStylesOf(record, false)
    // Re-checked on every application while there is a divider, since an
    // appearance change recolours it without changing the classes.
    const divideChanged = classes.divide !== record.divide && JSON.stringify(classes.divide) !== JSON.stringify(record.divide)
    record.divide = classes.divide
    if (divideChanged || record.divide) refreshDividersOf(record)
    // Nearly every node knows all its classes: no set to make for it.
    if (classes.unknown.length || record.reportedClasses?.size) {
      const unsupported = new Set(classes.unknown)
      for (const name of unsupported) {
        if (!record.reportedClasses?.has(name))
          console.warn(`[STX Native] unknown-class: ${id}: ${name}`)
      }
      record.reportedClasses = unsupported
    }
    if (record.type === 'Icon' && classes.icon) {
      const icon = resolveNodeIcon(id, record, classes.icon)
      record.props.symbol = icon.symbol
      record.props.iconify = icon.iconify
      if (record.materialized) emit({ op: 'updateNode', id, patch: { props: { symbol: record.props.symbol, iconify: icon.iconify } } })
    }
    if (classes.numberOfLines !== undefined) {
      record.props.numberOfLines = classes.numberOfLines
      if (record.materialized) emit({ op: 'updateNode', id, patch: { props: { numberOfLines: classes.numberOfLines } } })
    }
    // `object-cover` on an <img> or <video>: how it fills its box.
    if (classes.resizeMode && (record.type === 'Image' || record.type === 'ImageBackground' || record.type === 'Video') && record.props.resizeMode !== classes.resizeMode) {
      record.props.resizeMode = classes.resizeMode
      if (record.materialized) emit({ op: 'updateNode', id, patch: { props: { resizeMode: classes.resizeMode } } })
    }
  }

  function resolveNodeIcon(id: string, record: NodeRecord, name: string) {
    const icon = resolveIconName(name)
    const unknown = !icon.known && name.trim() ? name : undefined
    if (unknown && record.reportedIcon !== unknown)
      console.warn(`[STX Native] unknown-icon: ${id}: ${unknown}; no native symbol mapping; using ${icon.symbol}. Use an explicit Icon symbol or add a collection mapping.`)
    record.reportedIcon = unknown
    return icon
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

  /** A component event on the component's wrapper, heard only in script (see listen). */
  function componentEventOnly(node: NativeNode, event: string): boolean {
    return isBindingNode(node) && node.hasAttribute('data-stx-component-wrapper') && scriptOnlyEvent(event)
  }

  function isBindingNode(node: NativeNode): node is NativeBindingNode {
    return (node as NativeBindingNode).nodeType === 1
  }

  function nextSiblingOf(node: NativeNode): NativeNode | null {
    const owner = node.__stxOwner
    if (!owner) return null
    const siblings = recordOf(owner).children
    const index = lastIndexOfChild(siblings, node.__stxId)
    return index === -1 ? null : siblings[index + 1] ?? null
  }

  function nextElementSiblingOf(node: NativeNode): NativeBindingNode | null {
    let sibling = nextSiblingOf(node)
    while (sibling && !isBindingNode(sibling))
      sibling = nextSiblingOf(sibling)
    return sibling
  }

  // A node's position helpers live on prototypes made once per screen: the
  // screen's element class, and the prototypes its anchors and plain nodes are
  // made from. Five closures and a defineProperties per node were a tenth of
  // mounting a list in an interpreter. The methods read `this`, so they are
  // called on the node (`node.measure()`), as a DOM element's are.
  const positionDescriptors: PropertyDescriptorMap = {
    focus: { configurable: true, writable: true, value(this: NativeNode, focusOptions?: NativeFocusOptions) { return host.focus(this, focusOptions) } },
    measure: { configurable: true, writable: true, value(this: NativeNode) { return host.measure(this) } },
    // Layout is an invalidation signal, not viewport bounds. Call measure()
    // after it, and retain polling for scroll/transform-only movement.
    observeLayout: { configurable: true, writable: true, value(this: NativeNode, callback: () => void) { return host.listen(this, 'layout', callback) } },
    nextSibling: { configurable: true, get(this: NativeNode) { return nextSiblingOf(this) } },
    nextElementSibling: { configurable: true, get(this: NativeNode) { return nextElementSiblingOf(this) } },
    __stxPositionDecorated: { configurable: true, writable: true, value: true },
  }

  class HostElement extends BindingElement {
    protected override classChanged(value: string): void {
      host.setAttribute(this as unknown as NativeNode, 'class', value)
    }
  }
  Object.defineProperties(HostElement.prototype, positionDescriptors)

  const plainNodePrototype: object = Object.create(Object.prototype, positionDescriptors)
  // Structural bindings use a placeholder's parent on reinsertion, just as
  // they do for a DOM comment. Anchors have no native view but still belong
  // to the logical tree, including after a move or removal.
  const anchorPrototype: object = Object.create(plainNodePrototype, {
    parentNode: { configurable: true, get(this: NativeNode) { return this.__stxOwner ?? null } },
    parentElement: { configurable: true, get(this: NativeNode) { return this.__stxOwner ?? null } },
  })

  function plainNode(id: string, prototype: object = plainNodePrototype): NativeNode {
    const node = Object.create(prototype) as NativeNode
    node.__stxId = id
    return node
  }

  function decoratePosition(node: NativeNode): void {
    if ((node as NativeNode & { __stxPositionDecorated?: boolean }).__stxPositionDecorated)
      return
    Object.defineProperties(node, positionDescriptors)
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

  function adopt(node: NativeNode, type: string, owner?: NativeNode | null, descriptor?: Pick<STXNode, 'key' | 'props' | 'style' | 'events' | 'children' | '_classes' | '_inlineStyle' | '_layoutDefaults' | '_styleSource' | '_styleAncestors' | '_accessibilitySource' | '_textEntrySource'>): NativeNode {
    // Keep nextId() past any id adopted from elsewhere: its trailing number.
    const id = node.__stxId
    let digits = id.length
    while (digits > 0 && id.charCodeAt(digits - 1) >= 48 && id.charCodeAt(digits - 1) <= 57) digits--
    if (digits < id.length)
      counter = Math.max(counter, Number(id.slice(digits)))
    const classes = descriptor?._classes ?? ''
    const compiledClasses = compileClassStyles(classes)
    const classStyle = compiledClasses.style as Record<string, unknown>
    const baseStyle = descriptor?._styleSource !== undefined ? {} : descriptor?._inlineStyle ? { ...descriptor._inlineStyle } : Object.fromEntries(Object.entries(descriptor?.style ?? {}).filter(([key, value]) => classStyle[key] !== value))
    const record: NodeRecord = {
      type,
      key: descriptor?.key,
      props: authoredTextEntryProps(authoredAccessibilityProps(descriptor?.props ?? {}, descriptor?._accessibilitySource), descriptor?._textEntrySource),
      style: { ...(descriptor?.style ?? {}) },
      baseStyle,
      layoutDefaults: descriptor?._layoutDefaults,
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
      divide: compiledClasses.divide,
    }
    // Children are adopted in order, so a divided parent that already holds
    // a shown child gives this one its divider before its first render.
    const ownerRecord = owner ? descriptorOf(owner) : undefined
    if (ownerRecord?.divide && ownerRecord.children.some(child => child.__stxAnchor === undefined && descriptorOf(child)?.visible)) {
      record.dividerStyle = { ...ownerRecord.divide.style, ...(colorScheme === 'dark' ? ownerRecord.divide.dark : {}) }
      ownerRecord.hadDividers = true
    }
    record.style = resolveStyle(record, node.__stxId)
    if (descriptor) descriptor.style = { ...record.style } as STXNode['style']
    records.set(node.__stxId, record)
    decorateControl(node, type)
    decoratePosition(node)
    const previousOwner = node.__stxOwner
    node.__stxOwner = owner ?? null
    if (owner) {
      const ownerRecord = recordOf(owner)
      const children = ownerRecord.children
      // Only a node this owner already held can be among its children, so a
      // new one skips the scan, which made adopting a long list quadratic.
      if (previousOwner !== owner || lastIndexOfChild(children, node.__stxId) === -1) {
        children.push(node)
        ownerRecord.viewCount = undefined
      }
    }
    installControlListeners(node)
    installLinkListener(node)
    return node
  }

  /**
   * Whether a node can go into this unmaterialised parent with nothing but
   * its place recorded: no `divide-*` to restyle siblings, nobody observing
   * the children of it or of anything around it.
   */
  function placesQuietly(parent: NativeNode, record: NodeRecord, node: NativeNode): boolean {
    if (record.divide || record.hadDividers) return false
    if (node.__stxAnchor === undefined) {
      const own = descriptorOf(node)
      if (own && (own.materialized || own.focusWithin)) return false
    }
    for (let current: NativeNode | null | undefined = parent; current; current = current.__stxOwner)
      if (childObservers.has(current)) return false
    return true
  }

  /** Put a node with no owner at `index` under an unmaterialised parent, as insert would. */
  function placeDetached(parent: NativeNode, record: NodeRecord, node: NativeNode, index: number): void {
    record.children.splice(index, 0, node)
    const isView = node.__stxAnchor === undefined
    if (isView && record.viewCount !== undefined) record.viewCount++
    node.__stxOwner = parent
    if (isView) {
      // Back in the records if it was parked by a removal, and resolved
      // against this parent when it is created (materialize).
      const own = recordOf(node)
      own.inheritedVariables = record.variables
      own.styleDirty = true
    }
    insertIntoBindingParent(parent, node, index)
    // Nothing to disconnect: a node placed here has no owner and was never
    // created natively (placesQuietly), so it is a fresh copy or a removed
    // node, and remove, copyNode and insert under an unmaterialised parent
    // each leave a whole subtree disconnected.
  }

  /**
   * A prop the host only stores and sends on: not an accessibility source, a
   * text-entry trait, a control state, a state variant, an icon name, a link,
   * nor a drawing attribute (setAttribute's special cases).
   */
  const plainProps = new Map<string, boolean>()
  function plainProp(prop: string, type: string): boolean {
    const key = `${type}\u0001${prop}`
    let plain = plainProps.get(key)
    if (plain === undefined) {
      plain = !((type === 'Image' && prop === 'alt') || prop === 'role' || prop.startsWith('aria-') || prop.startsWith('accessibility')
        || TEXT_ENTRY_SOURCES.has(prop) || prop === 'multiline' || prop === 'disabled' || NATIVE_STATE_VARIANTS.has(prop)
        || (type === 'Icon' && prop === 'name') || prop === 'href' || SVG_NODE_TYPES.has(type))
      plainProps.set(key, plain)
    }
    return plain
  }

  /** A detached copy of one node and its record, without its children. */
  function copyNode(node: NativeNode, source: NodeRecord | undefined, copy: NativeNode): NativeNode {
    if (!isBindingNode(node)) copy.__stxOwner = node.__stxOwner
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
      layoutDefaults: descriptor.layoutDefaults === undefined ? undefined : { ...descriptor.layoutDefaults },
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
      divide: descriptor.divide,
      styleDirty: true,
    })
    decorateControl(copy, descriptor.type)
    // A copy has no children yet; a binding copy is made disconnected.
    if (!isBindingNode(copy) || copy.isConnected) setConnected(copy, false)
    installLinkListener(copy, node)
    return copy
  }

  const overlayPresenter = createNativeOverlayPresenter({
    canFocus: options.views?.capabilities.focus === true,
    canPresentNonModal: options.views?.capabilities.nonModalPresentation === true,
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
    bindingElement: HostElement,
    focus: (node, focusOptions) => withMountedView(node, views => views.focus(node.__stxId, focusOptions)),
    measure: node => withMountedView(node, views => views.measure(node.__stxId)),
    syncOverlays: entries => overlayPresenter.sync(entries),
    parent(node) { return node?.__stxOwner ?? null },
    getAttribute(node, name) {
      if (!node) return null
      if (isBindingNode(node)) return node.getAttribute(name)
      const record = descriptorOf(node)
      const value = record?.props[nativePropName(name, record.type)]
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
      if (options.classTable) seedClassTable(options.classTable, scheme, stylesheetVariables, options.stylesheetRules, false)
      // Traverse parent-first: cloned/reinserted nodes need not occur in map
      // insertion order. Each descendant inherits the new computed parent map.
      const children = new Set([...records.values()].flatMap(record => record.children.map(child => child.__stxId)))
      for (const id of records.keys()) if (!children.has(id)) refreshStyleTree({ __stxId: id }, stylesheetVariables, true)
    },
    setViewportWidth(width) {
      const next = Number.isFinite(width) ? Math.max(0, width) : 0
      if (next === viewportWidth) return
      const crossed = crossesWidthBound(viewportWidth, next)
      viewportWidth = next
      // A Mac window resizing reports every frame; only a step over a breakpoint restyles.
      if (!crossed) return
      // Shortcuts can hide a width layer, so every node is resolved again;
      // applyClasses sends a patch only where the style changed.
      const children = new Set([...records.values()].flatMap(record => record.children.map(child => child.__stxId)))
      for (const id of records.keys()) if (!children.has(id)) refreshStyleTree({ __stxId: id }, stylesheetVariables, true)
    },
    pending: () => queue.length,
    flush,
    dispose() {
      if (mediaFlushTimer !== undefined) clearTimeout(mediaFlushTimer)
      mediaFlushTimer = undefined
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
          props: hostProps(record),
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
          const child = plainNode(nextId('n'))
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
        // A host root forwarding to itself was reflected just now.
        if (forwarded !== node) reflectAttribute(forwarded, name, value)
        if (applyForwardedStyle(forwarded, name, value)) return
        node = forwarded
      }
      // A component's wrapper carries its caller's bindings for the component
      // to read (useReactiveProp reads the attribute set above). They are the
      // component's props, not the wrapper view's: sent to the host as well,
      // a row's testID landed on the view around it too, and a test pressed
      // whichever of the two it found first.
      else if (callerBindingOnWrapper(node, name)) return
      if (name === 'class' || name === 'className') {
        const record = recordOf(node)
        record.classes = String(value ?? '')
        applyClasses(node.__stxId, record)
        return
      }
      const record = recordOf(node)
      const prop = nativePropName(name, record.type)
      // Most props carry no meaning to the host beyond their value: nothing
      // to project, no state class, no control behaviour. Written directly.
      if (plainProp(prop, record.type)) {
        record.props[prop] = value
        if (record.focused && disabled(record)) {
          record.focused = false
          refreshFocusChain(node)
        }
        if (record.materialized)
          emit({ op: 'updateNode', id: node.__stxId, patch: { props: { [prop]: value } } })
        return
      }
      const accessibilityBefore = (record.type === 'Image' && prop === 'alt') || prop === 'role' || prop.startsWith('aria-') || prop.startsWith('accessibility') ? projectAccessibility(record.props, record.type) : undefined
      const textEntryBefore = TEXT_ENTRY_SOURCES.has(prop) ? projectTextEntry(record.type, record.props) : undefined
      const wasDisabled = disabled(record)
      record.props[prop] = value
      if (TEXT_ENTRY_SOURCES.has(prop) || prop === 'multiline') syncImplicitSubmit(node)
      if (record.focused && disabled(record)) {
        record.focused = false
        refreshFocusChain(node)
      }
      // `disabled:` classes follow the control's state, and `aria-selected:`
      // and its kin follow their attribute.
      if (prop === 'disabled' && wasDisabled !== disabled(record)) applyClasses(node.__stxId, record, true)
      else if (NATIVE_STATE_VARIANTS.has(prop)) applyClasses(node.__stxId, record, true)
      if (record.type === 'Icon' && prop === 'name') {
        const icon = resolveNodeIcon(node.__stxId, record, String(value ?? ''))
        this.setAttribute(node, 'iconify', icon.iconify ?? null)
        this.setAttribute(node, 'symbol', icon.symbol)
      }
      if (prop === 'href') markCurrentLink(node)
      const patch: Record<string, unknown> = { [prop]: value }
      if (accessibilityBefore)
        Object.assign(patch, accessibilityChanges(record.props, accessibilityBefore, prop, record.type))
      if (textEntryBefore) {
        Object.assign(patch, textEntryChanges(record.type, record.props, textEntryBefore))
        // A field written in HTML's words (`autocapitalize="off"`) reaches the host translated.
        const projected = projectTextEntry(record.type, record.props)
        if (prop in projected) patch[prop] = projected[prop]
      }
      // A drawing's bound attribute: the renderers read the outline as
      // commands (svg.ts), so a new `d` or `x1` is a new `geometry`.
      if (SVG_NODE_TYPES.has(record.type)) {
        if (prop === 'strokeDasharray' && value != null && !Array.isArray(value))
          patch[prop] = record.props[prop] = String(value).split(/[\s,]+/).map(Number).filter(Number.isFinite)
        if (record.type === 'Svg' && prop === 'viewBox')
          patch[prop] = record.props[prop] = parseViewBox(value)
        if (affectsGeometry(record.type, prop))
          patch.geometry = record.props.geometry = svgGeometry(record.type, record.props)
        // A bound `values` (an exercise's keyframes) is new keyframes.
        if (record.type === 'Animate' && SVG_ANIMATION_ATTRIBUTES.includes(prop))
          Object.assign(patch, applySvgAnimation(record.props))
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
      const record = recordOf(node)
      const prop = nativePropName(name, record.type)
      const accessibilityBefore = (record.type === 'Image' && prop === 'alt') || prop === 'role' || prop.startsWith('aria-') || prop.startsWith('accessibility') ? projectAccessibility(record.props, record.type) : undefined
      const textEntryBefore = TEXT_ENTRY_SOURCES.has(prop) ? projectTextEntry(record.type, record.props) : undefined
      delete record.props[prop]
      // Null rather than omitted: a patch is merged on the native side, so an
      // absent key means "unchanged" and would leave the attribute in place.
      const patch: Record<string, unknown> = { [prop]: null }
      if (accessibilityBefore)
        Object.assign(patch, accessibilityChanges(record.props, accessibilityBefore, prop, record.type))
      if (textEntryBefore)
        Object.assign(patch, textEntryChanges(record.type, record.props, textEntryBefore))
      if (affectsGeometry(record.type, prop))
        patch.geometry = record.props.geometry = svgGeometry(record.type, record.props)
      if (record.type === 'Animate' && SVG_ANIMATION_ATTRIBUTES.includes(prop))
        Object.assign(patch, applySvgAnimation(record.props))
      if (record.materialized)
        emit({ op: 'updateNode', id: node.__stxId, patch: { props: patch } })
      if (NATIVE_STATE_VARIANTS.has(prop)) applyClasses(node.__stxId, record, true)
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
      if (disposed) return () => {}
      const listenerOptions = options as { once?: boolean, capture?: boolean } | undefined
      let listeners = componentListeners.get(node)
      if (!listeners) componentListeners.set(node, listeners = [])
      const listener = { event, handler, once: !!listenerOptions?.once, capture: !!listenerOptions?.capture }
      listeners.push(listener)
      // Removing a subscription must not remove an authored handler sharing
      // the same native event ID. Keep that bounded per-node dispatcher until
      // node teardown; reopening adds no new dispatcher or retained callback.
      const unsubscribe = () => {
        const index = listeners.indexOf(listener)
        if (index !== -1) listeners.splice(index, 1)
      }
      // The handler stays here and the native side is given an id to report
      // back. Sending a function over a bridge is not possible, and the
      // binding layer never needs to know that -- it hands over a closure
      // either way.
      // A component's own event (`select`, `rename`) on its wrapper is
      // emitted and heard in script (emitComponentEvent): no native view
      // sends it, so it takes no handler id and stays out of the node's
      // native events. Anything a native host could send keeps one.
      if (componentEventOnly(node, event)) return unsubscribe
      const nativeEvent = nativeEventName(event)
      const record = recordOf(node)
      // A renderer holds one handler id per event. Multiplex all listeners
      // behind that id, rather than replacing the previous registration.
      let registrations = eventRegistrations.get(node)
      if (!registrations) eventRegistrations.set(node, registrations = new Map<string, string>())
      const existing = registrations.get(nativeEvent)
      if (existing && handlers.has(existing)) return unsubscribe
      const id = nextId('h')
      registrations.set(nativeEvent, id)
      handlers.set(id, (payload) => {
        if (record.type === 'TextInput' && (nativeEvent === 'onFocus' || nativeEvent === 'onBlur')) {
          let focused = nativeEvent === 'onFocus' && !disabled(record)
          for (let current: NativeNode | null | undefined = node; focused && current; current = current.__stxOwner) {
            const ancestor = descriptorOf(current)
            if (!ancestor?.materialized || !ancestor.visible || ancestor.style.display === 'none') focused = false
          }
          if (record.focused !== focused) {
            record.focused = focused
            refreshFocusChain(node)
          }
        }
        if (disabled(record)) return
        if (nativeEvent === 'onChangeText' || nativeEvent === 'onValueChange') {
          const data = payload && typeof payload === 'object' ? payload as Record<string, any> : {}
          const value = data.text ?? data.value ?? data.nativeEvent?.text ?? data.nativeEvent?.value
          const record = recordOf(node)
          if (record.type === 'Checkbox' && value !== undefined)
            (node as NativeNode & { checked: boolean }).checked = Boolean(value)
          const eventCount = data.eventCount ?? data.nativeEvent?.eventCount
          const acknowledgesEdit = record.type === 'TextInput' && Number.isSafeInteger(eventCount) && eventCount >= 0
          if (acknowledgesEdit) record.props.mostRecentEventCount = eventCount
          if (value !== undefined && (acknowledgesEdit || !Object.is(record.props.value, value)) && (record.type === 'TextInput' || record.type === 'Picker' || record.type === 'SegmentedControl' || record.type === 'Switch')) {
            record.props.value = value
            // The platform already displays the edit, but its retained tree
            // must receive it too. Otherwise the next unrelated mutation
            // reconciles against the old value and erases the user's input.
            if (record.materialized) emit({ op: 'updateNode', id: node.__stxId, patch: { props: acknowledgesEdit ? { value, mostRecentEventCount: eventCount } : { value } } })
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
            if (nativeEventName(current.event) !== nativeEvent || current.capture !== capture) continue
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
        // A press inside a link follows it, as a click does in a browser.
        if (nativeEvent === 'onPress' && !physical?.defaultPrevented && followLink) {
          for (let at: NativeNode | null | undefined = node; at; at = at.__stxOwner) {
            const href = linkHref(at)
            if (href === null) continue
            followLink(href)
            break
          }
        }
        const form = formOwner(node)
        if (form && nativeEvent === 'onSubmitEditing' && !physical?.defaultPrevented && !record.props.multiline && hostProps(record).returnKeyType !== 'next') {
          const implicit = implicitSubmitListeners.get(node)
          const authored = componentListeners.get(node)?.some(listener => nativeEventName(listener.event) === 'onSubmitEditing' && listener.handler !== implicit?.listener)
          if (implicit && !authored) {
            const submitter = collectDescendants(form).find(control => {
              const candidate = descriptorOf(control)
              return candidate?.materialized && ['Button', 'Pressable'].includes(candidate.type) && candidate.props.type === 'submit' && formOwner(control) === form
            })
            if (submitter) {
              const candidate = descriptorOf(submitter)!
              if (!disabled(candidate) && candidate.events.onPress) host.dispatch(candidate.events.onPress, {})
            }
            else host.emitComponentEvent(form, eventAt({}, form, 'submit') as Event)
          }
        }
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
      if (nativeEvent === 'onPress' && record.children.length) {
        for (const child of collectDescendants(node)) {
          if (['Button', 'Pressable'].includes(descriptorOf(child)?.type ?? '')) installControlListeners(child)
        }
      }
      return unsubscribe
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
      // A :show effect may rerun for another dependency without changing
      // visibility. Avoid walking its chart subtree and relaying out UIKit.
      if (was === visible) return was
      record.visible = visible
      if (!visible) {
        for (const target of [node, ...collectDescendants(node)]) {
          const child = descriptorOf(target)
          if (!child?.focused) continue
          child.focused = false
          refreshFocusChain(target)
        }
      }
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
      if (record.materialized) {
        record.style = resolveStyle(record, node.__stxId)
        const display = visible ? irDisplay(record.style.display) : 'none'
        emit({ op: 'updateNode', id: node.__stxId, patch: { style: { display } } })
      }
      else record.styleDirty = true
      // Which child is the first one shown decides where dividers go.
      if (was !== visible) refreshDividers(node.__stxOwner)
      return was
    },

    anchor(label) {
      // Logical only: it is a position in this host's ordering and is never
      // created on the native side, so it costs no view.
      const anchor = plainNode(nextId('a'), anchorPrototype)
      anchor.__stxAnchor = label
      return anchor
    },

    clone(node) {
      const source = descriptorOf(node)
      const copy = copyNode(node, source, isBindingNode(node)
        ? cloneNativeBindingNode(node, nextId('n'), undefined, HostElement)
        : plainNode(nextId('n')))

      // Materialised from the descriptor, depth first -- a view hierarchy
      // cannot be deep-copied the way a DOM subtree can.
      for (const child of source?.children ?? []) {
        const childCopy = this.clone(child)
        this.insert(copy, childCopy)
      }
      return copy
    },

    append(parent, node) {
      this.insert(parent, node)
    },

    cloneElement(node, attributes) {
      const source = descriptorOf(node)
      return copyNode(node, source, isBindingNode(node)
        ? cloneNativeBindingNodeWith(node, nextId('n'), attributes, HostElement)
        : plainNode(nextId('n')))
    },

    insert(parent, node, before) {
      const record = recordOf(parent)
      const oldOwner = node.__stxOwner
      // A new node going into a parent that is itself still off the screen
      // (a loop row or :if branch being built): only the ordering changes.
      if (!oldOwner && !record.materialized && placesQuietly(parent, record, node)) {
        placeDetached(parent, record, node, before ? Math.max(0, lastIndexOfChild(record.children, before.__stxId)) : record.children.length)
        return
      }

      /*
       * The node comes OUT of the ordering before the target index is worked
       * out. A move is indexed against the list without the node in it -- that
       * is what the native side will be holding when it applies the operation
       * -- so measuring first reports a position one too far to the right, and
       * a row reordered to the end lands one short of it.
       */
      // A node that was never placed (a new row) has nothing to take out.
      const isView = node.__stxAnchor === undefined
      const existing = oldOwner === parent ? record.children.findIndex(child => child.__stxId === node.__stxId) : -1
      if (existing !== -1) {
        record.children.splice(existing, 1)
        if (isView && record.viewCount !== undefined) record.viewCount--
      }
      else if (oldOwner && oldOwner !== parent) {
        const oldRecord = recordOf(oldOwner)
        const oldIndex = oldRecord.children.findIndex(child => child.__stxId === node.__stxId)
        if (oldIndex !== -1) {
          oldRecord.children.splice(oldIndex, 1)
          if (isView && oldRecord.viewCount !== undefined) oldRecord.viewCount--
        }
      }
      removeFromBindingParent(node)

      const index = before
        ? Math.max(0, lastIndexOfChild(record.children, before.__stxId))
        : record.children.length

      record.children.splice(index, 0, node)
      if (isView && record.viewCount !== undefined) record.viewCount++
      node.__stxOwner = parent
      refreshStyleTree(node, record.variables)
      insertIntoBindingParent(parent, node, index)
      setConnected(node, record.materialized)
      // A focused keyed subtree can move between owners without being
      // recreated. Its old ancestors must lose focus-within, its new ones gain it.
      if (descriptorOf(node)?.focusWithin) {
        if (oldOwner && oldOwner !== parent) refreshFocusChain(oldOwner)
        refreshFocusChain(parent)
      }
      if (oldOwner && oldOwner !== parent) notifyChildren(oldOwner)
      notifyChildren(parent)

      // An anchor holds a place in the ordering and nothing else, so moving one
      // is bookkeeping rather than a native operation.
      if (node.__stxAnchor !== undefined || !record.materialized)
        return

      materialize(node, record.variables)

      /*
       * The native parent holds views, never anchors (materialize skips them),
       * so the position it is told counts only the views before this one. The
       * binding layer's index counts the anchors too: every `:if` puts one in
       * front of its element, so showing a branch said "index 2" to a parent
       * holding no views, the host refused the whole batch as INVALID_INDEX,
       * and a screen stayed on its first branch for good.
       */
      // Counted from the nearer end: filling a list counted every row before
      // each new one, and a list of n rows cost n squared.
      let nativeIndex = 0
      if (index <= record.children.length >> 1) {
        for (let i = 0; i < index; i++) {
          if (record.children[i]!.__stxAnchor === undefined)
            nativeIndex++
        }
      }
      else {
        let viewsAfter = 0
        for (let i = record.children.length - 1; i > index; i--) {
          if (record.children[i]!.__stxAnchor === undefined)
            viewsAfter++
        }
        nativeIndex = viewCountOf(record) - 1 - viewsAfter
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
      const hadFocus = descriptorOf(node)?.focusWithin === true
      const owner = node.__stxOwner
      if (owner) {
        const record = recordOf(owner)
        const at = lastIndexOfChild(record.children, node.__stxId)
        if (at !== -1) {
          record.children.splice(at, 1)
          if (node.__stxAnchor === undefined && record.viewCount !== undefined) record.viewCount--
        }
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
      if (hadFocus) refreshFocusChain(owner)
      notifyChildren(owner)
      if (node.__stxAnchor !== undefined || !wasMaterialized)
        return
      emit({ op: 'removeNode', id: node.__stxId })
    },
  }
  return host
}
