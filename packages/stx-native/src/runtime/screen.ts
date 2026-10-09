/* eslint-disable no-console */
/**
 * The JavaScriptCore runtime of a native screen.
 *
 * This used to live inside a template string in the CLI, which meant it was
 * never type-checked, never linted and only testable by compiling a screen
 * first. It is an ordinary module now: `bundle.ts` builds it once per bundle
 * (as the prelude every screen shares) and each screen's compiled module calls
 * `mount()` with its template and its compiled expressions.
 *
 * What a render is:
 *
 * - The template is data (the IR), except that every `{expression}`, handler,
 *   `:if`, `:for`, `:class` and `:style` has been compiled to a real function
 *   in the screen's own module, so it closes over the screen's state the same
 *   way the script's functions do. Nothing is `eval`ed.
 * - `render()` walks the template, evaluates those functions with the current
 *   loop scope (`item`, `index`, a `:for` variable…), and produces a plain tree
 *   of `{ id, type, props, style, events, children }`.
 * - Handlers are closures kept in a table rebuilt on every render, keyed by an
 *   id that is stable for the node (`<nodeId>#onPress`). The host echoes the id
 *   back in `EVENT`, the runtime calls the closure with the scope it captured,
 *   so a FlatList row's `onPress={open(item.id)}` sees its own row.
 * - The first render runs synchronously when the screen script has finished,
 *   so state read at the top level from the host's synchronous storage
 *   (`craft.storage.getSync`, `craft.snapshots.get`) is in the first frame.
 * - Later renders diff against the previous tree and send `MUTATE` batches
 *   when the host speaks the mutation protocol.
 */
import { compileClassStyles } from '../compiler/headwind-to-style'
import { resolveIconName } from '../compiler/icons'

type Any = any // eslint-disable-line ts/no-explicit-any
type Scope = Record<string, Any>
type Expression = (scope: Scope, event?: Any) => Any

/** A template node as `codegen.ts` emits it. Numbers are expression indexes. */
export interface TemplateNode {
  type: string
  key?: Any
  props: Record<string, Any>
  style: Record<string, Any>
  darkStyle?: Record<string, Any>
  events: Record<string, number>
  children: Array<TemplateNode | TemplateText>
  directives?: {
    if?: number
    elseIf?: number
    else?: boolean
    for?: { source: number, item: string, index?: string }
    show?: number
  }
  bindings?: { class?: number, style?: number }
}

/** A text child: a literal, or an expression reference. */
export type TemplateText = string | { $x: number }

export interface ScreenDefinition {
  document: { root: TemplateNode }
  /** Compiled template expressions, indexed by the numbers in the template. */
  expressions: Expression[]
  /** The script's top-level functions, for hosts that dispatch by name. */
  functions?: Record<string, ((event?: Any) => Any) | undefined>
}

export interface RuntimeOptions {
  routeName?: string
  routeNames?: string[]
}

interface OutputNode {
  id: string
  type: string
  props: Record<string, Any>
  style: Record<string, Any>
  events: Record<string, string>
  children: Array<OutputNode | string>
}

const g = globalThis as Any

function isExpressionRef(value: Any): value is { $x: number } {
  return value !== null && typeof value === 'object' && typeof value.$x === 'number' && Object.keys(value).length === 1
}

/** Every prop, style or text value: a literal, or a reference to evaluate. */
function hasExpressions(value: Any): boolean {
  if (isExpressionRef(value)) return true
  if (Array.isArray(value)) return value.some(hasExpressions)
  if (value && typeof value === 'object') return Object.keys(value).some(key => hasExpressions(value[key]))
  return false
}

const classCache = new Map<string, ReturnType<typeof compileClassStyles>>()
function classStyles(classes: string): ReturnType<typeof compileClassStyles> {
  let cached = classCache.get(classes)
  if (!cached) {
    cached = compileClassStyles(classes)
    classCache.set(classes, cached)
  }
  return cached
}

/** `:class` as Vue and Alpine take it: a string, an array, or `{ name: on }`. */
export function normalizeClass(value: Any): string {
  if (value == null || value === false) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(normalizeClass).filter(Boolean).join(' ')
  if (typeof value === 'object') return Object.keys(value).filter(name => value[name]).join(' ')
  return String(value)
}

/** `:style` as an object, or as CSS text (`left: 12px; width: 40%`). */
export function normalizeStyle(value: Any): Record<string, Any> {
  if (!value) return {}
  if (Array.isArray(value)) return Object.assign({}, ...value.map(normalizeStyle))
  if (typeof value === 'object') return value
  const style: Record<string, Any> = {}
  for (const declaration of String(value).split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const property = declaration.slice(0, colon).trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    const raw = declaration.slice(colon + 1).trim()
    if (!property || !raw) continue
    const pixels = /^(-?[\d.]+)(px)?$/.exec(raw)
    style[property] = pixels ? Number.parseFloat(pixels[1]) : raw
  }
  return style
}

export function createRuntime(bridge: Any, options: RuntimeOptions = {}): { mount: (screen: ScreenDefinition) => void } {
  const routeName = options.routeName ?? 'main'
  const routeNames = options.routeNames ?? [routeName]
  const pendingAPI = new Map<string, { resolve: (value: Any) => void, reject: (error: Any) => void, timeout: Any }>()
  const appStateHandlers = new Set<(state: string) => Any>()
  const deepLinkHandlers = new Set<(link: Any) => Any>()
  const navButtonHandlers = new Set<(event: { id: string }) => Any>()
  const navButtonPresses = new Map<string, (event: { id: string }) => Any>()
  const scheduleTimeout = typeof g.setTimeout === 'function' ? g.setTimeout.bind(g) : null
  const cancelTimeout = typeof g.clearTimeout === 'function' ? g.clearTimeout.bind(g) : null
  let currentAppState = ['active', 'inactive', 'background'].includes(bridge.initialAppState) ? bridge.initialAppState : 'active'
  let colorScheme: 'light' | 'dark' = bridge.colorScheme === 'dark' ? 'dark' : 'light'
  let initialDeepLinkClaimed = false
  let sequence = 0

  let screen: ScreenDefinition | null = null
  let handlerTable = new Map<string, (event?: Any) => Any>()
  const mutationProtocolVersion = Number(bridge.mutationProtocolVersion || 0)
  let mutationRevision = 0
  let mutationsEnabled = mutationProtocolVersion === 1
  let previousTree: OutputNode | null = null
  let latestTree: OutputNode | null = null

  function send(type: string, payload: Any, id?: string): string {
    const messageId = id || `js_${++sequence}`
    bridge.postMessage(JSON.stringify({ id: messageId, type, timestamp: Date.now(), payload, source: 'js' }))
    return messageId
  }

  // ---------------------------------------------------------------------------
  // Template evaluation
  // ---------------------------------------------------------------------------

  function evaluate(index: number, scope: Scope, what: string): Any {
    try {
      return screen!.expressions[index](scope)
    }
    catch (error: Any) {
      // One bad expression must not blank the screen: it renders as nothing,
      // and the host's console says which one.
      g.console.error(`[stx-native] ${what} failed: ${error && error.message ? error.message : error}`)
      return undefined
    }
  }

  function resolveValue(value: Any, scope: Scope, what: string): Any {
    if (isExpressionRef(value)) return evaluate(value.$x, scope, what)
    if (Array.isArray(value)) return hasExpressions(value) ? value.map(entry => resolveValue(entry, scope, what)) : value
    if (value && typeof value === 'object' && hasExpressions(value)) {
      const out: Record<string, Any> = {}
      for (const key of Object.keys(value)) out[key] = resolveValue(value[key], scope, what)
      return out
    }
    return value
  }

  function text(value: TemplateText, scope: Scope): string {
    if (typeof value === 'string') return value
    const answer = evaluate(value.$x, scope, 'text')
    return answer == null || answer === false ? '' : String(answer)
  }

  function nodeKey(node: TemplateNode, scope: Scope): string | null {
    const raw = node.key ?? node.props.key ?? node.props.testID ?? null
    const key = resolveValue(raw, scope, 'key')
    return key == null || key === '' ? null : String(key)
  }

  function registerHandlers(node: TemplateNode, id: string, scope: Scope): Record<string, string> {
    const events: Record<string, string> = {}
    for (const name of Object.keys(node.events || {})) {
      const index = node.events[name]
      const handlerId = `${id}#${name}`
      events[name] = handlerId
      handlerTable.set(handlerId, (nativeEvent?: Any) => screen!.expressions[index](scope, nativeEvent))
    }
    return events
  }

  function styleFor(node: TemplateNode, scope: Scope, props: Record<string, Any>): Record<string, Any> {
    let style: Record<string, Any> = node.style || {}
    if (colorScheme === 'dark' && node.darkStyle) style = { ...style, ...node.darkStyle }
    const bindings = node.bindings
    if (bindings && bindings.class !== undefined) {
      const classes = normalizeClass(evaluate(bindings.class, scope, ':class'))
      if (classes) {
        const compiled = classStyles(classes)
        style = { ...style, ...compiled.style }
        if (colorScheme === 'dark' && compiled.dark) style = { ...style, ...compiled.dark }
        if (compiled.numberOfLines !== undefined && props.numberOfLines === undefined) props.numberOfLines = compiled.numberOfLines
        if (node.type === 'Icon' && compiled.icon && props.symbol === undefined) props.symbol = resolveIconName(compiled.icon).symbol
      }
    }
    if (bindings && bindings.style !== undefined) style = { ...style, ...normalizeStyle(evaluate(bindings.style, scope, ':style')) }
    if (node.directives && node.directives.show !== undefined && !evaluate(node.directives.show, scope, ':show'))
      style = { ...style, display: 'none' }
    return resolveValue(style, scope, 'style')
  }

  function iconProps(props: Record<string, Any>, final: boolean): void {
    // A runtime `name` (`<Icon :name="sport.icon">`) maps like a static one.
    if (props.name !== undefined) {
      if (props.symbol === undefined) {
        const icon = resolveIconName(props.name)
        props.symbol = icon.symbol
        if (icon.iconify) props.iconify = icon.iconify
      }
      delete props.name
    }
    if (final && (props.symbol === undefined || props.symbol === null || props.symbol === '')) props.symbol = 'circle'
  }

  /** One template node, without its directives (those are the parent's job). */
  function resolveElement(node: TemplateNode, id: string, scope: Scope): OutputNode {
    const isDataList = node.type === 'FlatList' && node.props.data !== undefined
    const props: Record<string, Any> = {}
    for (const key of Object.keys(node.props || {})) {
      if (key === 'key') continue
      if (isDataList && (key === 'data' || key === 'keyExtractor')) continue
      props[key] = resolveValue(node.props[key], scope, key)
    }
    if (node.type === 'Icon') iconProps(props, false)
    const style = styleFor(node, scope, props)
    if (node.type === 'Icon') iconProps(props, true)
    const events = registerHandlers(node, id, scope)
    if (isDataList) {
      const list = resolveList(node, id, scope, props, style, events)
      if (list) return list
    }
    return { id, type: node.type, props, style, events, children: resolveChildren(node.children || [], id, scope) }
  }

  /**
   * A child list with its directives applied: `:if`/`:else-if`/`:else`
   * chains, `:for` loops and fragments spliced into their parent.
   *
   * Ids are positional in the TEMPLATE, not in the output, so a sibling
   * appearing or disappearing never renames its neighbours: the native views
   * stay where they are and only the changed one is created or removed.
   */
  function resolveChildren(children: Array<TemplateNode | TemplateText>, parentId: string, scope: Scope): Array<OutputNode | string> {
    const out: Array<OutputNode | string> = []
    const elements = children.filter(child => typeof child === 'object' && !isExpressionRef(child)) as TemplateNode[]
    const keyCounts = new Map<string, number>()
    for (const child of elements) {
      if (child.directives && child.directives.for) continue
      const key = nodeKey(child, scope)
      if (key) keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
    }

    let chainOpen = false
    let chainTaken = false
    children.forEach((child, index) => {
      if (typeof child === 'string' || isExpressionRef(child)) {
        out.push(text(child as TemplateText, scope))
        return
      }
      const node = child as TemplateNode
      const directives = node.directives || {}

      if (directives.for) {
        chainOpen = false
        appendLoop(node, `${parentId}/for:${index}`, scope, out)
        return
      }

      // An :if chain. Whitespace between its branches never reaches here
      // (the parser drops it), so siblings of the chain end it.
      if (directives.if !== undefined) {
        chainOpen = true
        chainTaken = false
      }
      else if (directives.elseIf !== undefined || directives.else) {
        if (!chainOpen) {
          g.console.warn('[stx-native] :else without :if')
          return
        }
      }
      else {
        chainOpen = false
      }

      if (directives.if !== undefined || directives.elseIf !== undefined || directives.else) {
        if (chainTaken) return
        const condition = directives.if ?? directives.elseIf
        if (condition !== undefined && !evaluate(condition, scope, ':if')) return
        chainTaken = true
        if (directives.else) chainOpen = false
      }

      const key = nodeKey(node, scope)
      const id = key && keyCounts.get(key) === 1 ? `${parentId}/key:${key}` : `${parentId}/index:${index}`
      appendNode(node, id, scope, out)
    })
    return out
  }

  function appendNode(node: TemplateNode, id: string, scope: Scope, out: Array<OutputNode | string>): void {
    if (node.type === 'Fragment' || node.type === 'template') {
      out.push(...resolveChildren(node.children || [], id, scope))
      return
    }
    out.push(resolveElement(node, id, scope))
  }

  function appendLoop(node: TemplateNode, loopId: string, scope: Scope, out: Array<OutputNode | string>): void {
    const loop = node.directives!.for!
    let source = evaluate(loop.source, scope, ':for')
    if (typeof source === 'number') source = Array.from({ length: Math.max(0, Math.floor(source)) }, (_, i) => i + 1)
    else if (source && typeof source === 'object' && !Array.isArray(source)) {
      source = typeof source[Symbol.iterator] === 'function' ? Array.from(source) : Object.keys(source).map(key => source[key])
    }
    if (!Array.isArray(source)) return
    const seen = new Map<string, number>()
    const inner: TemplateNode = { ...node, directives: { ...node.directives, for: undefined } }
    source.forEach((value: Any, position: number) => {
      const itemScope: Scope = { ...scope, [loop.item]: value }
      if (loop.index) itemScope[loop.index] = position
      // A :for with an :if filters per item.
      if (node.directives!.if !== undefined && !evaluate(node.directives!.if, itemScope, ':if')) return
      let key = nodeKey(node, itemScope)
      if (key == null) key = value && typeof value === 'object' && (value.id ?? value.key) != null ? String(value.id ?? value.key) : String(position)
      const encoded = encodeURIComponent(key)
      const occurrence = seen.get(encoded) || 0
      seen.set(encoded, occurrence + 1)
      const id = `${loopId}/key:${occurrence === 0 ? encoded : `${encoded}#${occurrence}`}`
      appendNode({ ...inner, directives: { ...inner.directives, if: undefined } }, id, itemScope, out)
    })
  }

  function listRole(node: Any): string | null {
    return node && typeof node === 'object' && !isExpressionRef(node) ? (node.props || {}).listRole || null : null
  }

  function resolveList(node: TemplateNode, id: string, scope: Scope, props: Record<string, Any>, style: Record<string, Any>, events: Record<string, string>): OutputNode | null {
    const data = resolveValue(node.props.data, scope, 'data')
    const templates = (node.children || []).filter(child => typeof child === 'object' && !isExpressionRef(child)) as TemplateNode[]
    const itemTemplates = templates.filter(child => listRole(child) === 'item')
    if (!Array.isArray(data) || itemTemplates.length === 0) return null

    const groups = {
      header: templates.filter(child => listRole(child) === 'header'),
      empty: templates.filter(child => listRole(child) === 'empty'),
      separator: templates.filter(child => listRole(child) === 'separator'),
      footer: templates.filter(child => listRole(child) === 'footer'),
    }
    const children: OutputNode[] = []
    const seenKeys = new Map<string, number>()
    function appendTemplates(entries: TemplateNode[], role: string, itemScope: Scope, keyPrefix: string): void {
      entries.forEach((template, templateIndex) => {
        const suffix = entries.length === 1 ? '' : `/template:${templateIndex}`
        const child = resolveElement(template, `${id}/${keyPrefix}${suffix}`, itemScope)
        child.props = { ...child.props, listRole: role }
        children.push(child)
      })
    }
    appendTemplates(groups.header, 'header', { ...scope, item: undefined, index: -1 }, 'header')
    if (data.length === 0) {
      appendTemplates(groups.empty, 'empty', { ...scope, item: undefined, index: -1 }, 'empty')
    }
    else {
      data.forEach((item: Any, index: number) => {
        const itemScope = { ...scope, item, index }
        let key: Any
        if (node.props.keyExtractor === undefined) {
          key = item && (item.key ?? item.id)
        }
        else {
          key = resolveValue(node.props.keyExtractor, itemScope, 'keyExtractor')
          if (typeof key === 'function') key = key(item, index)
        }
        if (key == null || key === '') key = index
        const encodedKey = encodeURIComponent(String(key))
        const occurrence = seenKeys.get(encodedKey) || 0
        seenKeys.set(encodedKey, occurrence + 1)
        const uniqueKey = occurrence === 0 ? encodedKey : `${encodedKey}#${occurrence}`
        itemTemplates.forEach((template, templateIndex) => {
          const suffix = itemTemplates.length === 1 ? '' : `/template:${templateIndex}`
          const child = resolveElement(template, `${id}/key:${uniqueKey}${suffix}`, itemScope)
          child.props = { ...child.props, key: String(key), listRole: 'item' }
          children.push(child)
        })
        if (index < data.length - 1) appendTemplates(groups.separator, 'separator', itemScope, `separator:${uniqueKey}`)
      })
    }
    appendTemplates(groups.footer, 'footer', { ...scope, item: undefined, index: data.length }, 'footer')
    return { id, type: node.type, props: { ...props, itemCount: data.length }, style, events, children }
  }

  // ---------------------------------------------------------------------------
  // Tree diffing and the wire
  // ---------------------------------------------------------------------------

  function nodeValue(node: OutputNode): Any {
    return {
      type: node.type,
      props: node.props || {},
      style: node.style || {},
      events: node.events || {},
      children: (node.children || []).filter(child => typeof child === 'string'),
    }
  }

  function treeValue(node: OutputNode): Any {
    return {
      id: node.id,
      ...nodeValue(node),
      children: (node.children || []).map(child => (typeof child === 'string' ? child : treeValue(child))),
    }
  }

  interface FlatEntry { node: OutputNode, parentId: string | null, index: number, children: string[] }
  function flatten(root: OutputNode): Map<string, FlatEntry> {
    const result = new Map<string, FlatEntry>()
    function visit(node: OutputNode, parentId: string | null, index: number): void {
      const childNodes = (node.children || []).filter(child => typeof child !== 'string') as OutputNode[]
      result.set(node.id, { node, parentId, index, children: childNodes.map(child => child.id) })
      childNodes.forEach((child, childIndex) => visit(child, node.id, childIndex))
    }
    visit(root, null, 0)
    return result
  }

  function createTreeOperations(tree: OutputNode): Any[] {
    const nodes = flatten(tree)
    const operations: Any[] = []
    nodes.forEach((entry, id) => {
      operations.push({ op: 'createNode', id, root: entry.parentId === null, node: nodeValue(entry.node) })
    })
    nodes.forEach((entry, parentId) => {
      entry.children.forEach((childId, index) => operations.push({ op: 'insertChild', parentId, childId, index }))
    })
    return operations
  }

  function equivalent(left: Any, right: Any): boolean {
    return JSON.stringify(left) === JSON.stringify(right)
  }

  function diffTrees(before: OutputNode, after: OutputNode): Any[] {
    const oldNodes = flatten(before)
    const newNodes = flatten(after)
    const typeChanged = Array.from(oldNodes.keys()).some(id => newNodes.has(id) && oldNodes.get(id)!.node.type !== newNodes.get(id)!.node.type)
    if (typeChanged) return [{ op: 'removeNode', id: before.id }].concat(createTreeOperations(after))

    const operations: Any[] = []
    const removed = new Set(Array.from(oldNodes.keys()).filter(id => !newNodes.has(id)))
    oldNodes.forEach((entry, id) => {
      if (!removed.has(id) || (entry.parentId && removed.has(entry.parentId))) return
      operations.push({ op: 'removeNode', id })
    })
    newNodes.forEach((entry, id) => {
      if (!oldNodes.has(id)) operations.push({ op: 'createNode', id, root: entry.parentId === null, node: nodeValue(entry.node) })
    })
    newNodes.forEach((entry, id) => {
      const previous = oldNodes.get(id)
      if (!previous) return
      const oldValue = nodeValue(previous.node)
      const newValue = nodeValue(entry.node)
      const patch: Record<string, Any> = {}
      if (!equivalent(oldValue.props, newValue.props)) patch.props = newValue.props
      if (!equivalent(oldValue.style, newValue.style)) patch.style = newValue.style
      if (!equivalent(oldValue.events, newValue.events)) patch.events = newValue.events
      if (!equivalent(oldValue.children, newValue.children)) patch.children = newValue.children
      if (Object.keys(patch).length) operations.push({ op: 'updateNode', id, patch })
    })
    newNodes.forEach((entry, parentId) => {
      let current: string[] = []
      const previous = oldNodes.get(parentId)
      if (previous) current = previous.children.filter(id => newNodes.has(id) && newNodes.get(id)!.parentId === parentId)
      entry.children.forEach((childId, index) => {
        if (current[index] === childId) return
        const oldIndex = current.indexOf(childId)
        if (oldIndex >= 0) {
          operations.push({ op: 'moveChild', parentId, childId, index })
          current.splice(oldIndex, 1)
          current.splice(index, 0, childId)
        }
        else {
          operations.push({ op: 'insertChild', parentId, childId, index })
          current.splice(index, 0, childId)
        }
      })
    })
    return operations
  }

  function sendRenderFallback(): void {
    send('RENDER', { document: treeValue(latestTree!), mode: 'replace' }, `render_${Date.now()}_${++sequence}`)
  }

  function buildTree(): OutputNode {
    handlerTable = new Map()
    const root = screen!.document.root
    const out: Array<OutputNode | string> = []
    appendNode(root, 'root', {}, out)
    const first = out.find(child => typeof child !== 'string') as OutputNode | undefined
    // A root that is a fragment, or that rendered nothing, still needs a node.
    if (first && out.filter(child => typeof child !== 'string').length === 1) return first
    return { id: 'root', type: 'View', props: {}, style: { flex: 1 }, events: {}, children: out.filter(child => typeof child !== 'string') }
  }

  function render(): void {
    if (!screen) return
    const nextTree = buildTree()
    latestTree = nextTree
    if (!mutationsEnabled || !previousTree) {
      if (mutationsEnabled) previousTree = nextTree
      sendRenderFallback()
      return
    }
    const operations = diffTrees(previousTree, nextTree)
    previousTree = nextTree
    if (!operations.length) return
    const baseRevision = mutationRevision
    mutationRevision += 1
    send('MUTATE', { version: mutationProtocolVersion, batchId: `mutation_${mutationRevision}`, baseRevision, revision: mutationRevision, operations })
  }

  // Top-level async work (a fetch on open, a stored value read back) has no
  // handler to re-render after it. A timer runs once the promise reactions
  // queued by this answer have drained, so the screen's continuation has
  // assigned its state; one render covers answers that arrive together.
  let renderScheduled = false
  function scheduleRender(): void {
    if (renderScheduled) return
    if (!scheduleTimeout) {
      Promise.resolve().then(render)
      return
    }
    renderScheduled = true
    scheduleTimeout(() => {
      renderScheduled = false
      render()
    }, 0)
  }

  // A timer's callback changes state the same way a handler does, so the
  // screen redraws after it (a countdown, a debounce, a delayed reveal). The
  // runtime's own timers use the unwrapped functions captured above.
  function redrawAfter(name: 'setTimeout' | 'setInterval'): void {
    const original = g[name]
    if (typeof original !== 'function' || original.__stxRedraws) return
    const wrapped = function (callback: Any, delay?: number, ...args: Any[]) {
      if (typeof callback !== 'function') return original.call(g, callback, delay, ...args)
      return original.call(g, (...given: Any[]) => {
        try {
          callback(...given)
        }
        finally {
          scheduleRender()
        }
      }, delay, ...args)
    }
    wrapped.__stxRedraws = true
    g[name] = wrapped
  }
  redrawAfter('setTimeout')
  redrawAfter('setInterval')

  /** Run a handler, then render; once more when its promise settles. */
  function runHandler(handler: (event?: Any) => Any, event: Any): Any {
    let result: Any
    try {
      result = handler(event)
    }
    catch (error: Any) {
      g.console.error(`[stx-native] handler failed: ${error && error.message ? error.message : error}`)
      render()
      return undefined
    }
    if (result && typeof result.then === 'function') {
      render()
      return result.then((value: Any) => { render(); return value }, (error: Any) => {
        g.console.error(`[stx-native] handler failed: ${error && error.message ? error.message : error}`)
        render()
      })
    }
    render()
    return result
  }

  // ---------------------------------------------------------------------------
  // Capabilities
  // ---------------------------------------------------------------------------

  function requestAPI(module: string, method: string, args: Any[]): Promise<Any> {
    return new Promise((resolve, reject) => {
      const id = `js_${++sequence}`
      const configuredTimeout = Number(bridge.capabilityTimeoutMs || 30000)
      const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 30000
      const timeout = scheduleTimeout
        ? scheduleTimeout(() => {
          if (!pendingAPI.delete(id)) return
          send('API_CANCEL', { version: 1, requestId: id, reason: 'timeout' })
          const error: Any = new Error('Native API request timed out')
          error.code = 'TIMEOUT'
          reject(error)
          scheduleRender()
        }, timeoutMs)
        : null
      pendingAPI.set(id, { resolve, reject, timeout })
      send('API_REQUEST', { version: 1, module, method, args }, id)
    })
  }

  function dispatchSubscription(handlers: Set<(value: Any) => Any>, value: Any): void {
    if (!handlers.size) return
    handlers.forEach((handler) => {
      const result = handler(value)
      if (result && typeof result.then === 'function') result.then(render, () => {})
    })
    render()
  }

  const craft = g.craft = g.craft || {}
  const nativeCapabilities = new Set(Array.isArray(bridge.capabilities) ? bridge.capabilities : [])
  craft.platform = bridge.platform || 'unknown'
  craft.capabilityProtocolVersion = Number(bridge.capabilityProtocolVersion || 0)
  craft.capabilities = {
    haptics: nativeCapabilities.has('haptics'),
    speechRecognition: false,
    share: false,
    camera: false,
    biometric: nativeCapabilities.has('biometric'),
    pushNotifications: false,
    secureStorage: nativeCapabilities.has('secureStorage'),
    storage: nativeCapabilities.has('storage'),
    localDatabase: nativeCapabilities.has('database'),
    lifecycle: nativeCapabilities.has('lifecycle'),
    geolocation: false,
    clipboard: nativeCapabilities.has('clipboard'),
    contacts: false,
    calendar: false,
    localNotifications: nativeCapabilities.has('notifications'),
    inAppPurchase: false,
    keepAwake: false,
    orientationLock: false,
    deepLinks: nativeCapabilities.has('deepLinks'),
    flashlight: false,
    speech: false,
    network: false,
    deviceInfo: nativeCapabilities.has('device'),
    fetch: nativeCapabilities.has('fetch'),
    badge: false,
    appReview: false,
  }
  craft.route = { name: routeName, params: g.__stxNativeParams || {} }
  craft.appearance = { colorScheme: () => colorScheme }

  function navigate(type: string, target: string, params?: Any): string {
    if (!routeNames.includes(target)) throw new Error(`Unknown native screen: ${target}`)
    if (params !== undefined && (params === null || typeof params !== 'object' || Array.isArray(params)))
      throw new Error('Navigation params must be an object')
    return send(type, { screen: target, params: params || {} })
  }
  /** Functions cannot cross the bridge; a button's `onPress` stays here. */
  function navigationOptions(options: Any): Any {
    if (!options || typeof options !== 'object') throw new TypeError('navigation.setOptions needs an object')
    const payload: Record<string, Any> = {}
    for (const key of Object.keys(options)) {
      if (key === 'rightButtons' && Array.isArray(options.rightButtons)) {
        navButtonPresses.clear()
        payload.rightButtons = options.rightButtons.map((button: Any) => {
          const { onPress, ...rest } = button || {}
          if (typeof onPress === 'function' && rest.id != null) navButtonPresses.set(String(rest.id), onPress)
          return rest
        })
      }
      else if (typeof options[key] !== 'function') {
        payload[key] = options[key]
      }
    }
    return payload
  }
  // The host may already have a synchronous setOptions (Craft installs one
  // before the script runs). Keep it as the transport; otherwise use a message.
  const hostSetOptions = craft.navigation && typeof craft.navigation.setOptions === 'function'
    ? craft.navigation.setOptions.bind(craft.navigation)
    : null
  craft.navigation = Object.assign(craft.navigation || {}, {
    push: (target: string, params?: Any) => navigate('NAVIGATE', target, params),
    replace: (target: string, params?: Any) => navigate('NAVIGATE_REPLACE', target, params),
    back: () => send('NAVIGATE_BACK', {}),
    setOptions: (options: Any) => {
      const payload = navigationOptions(options)
      if (hostSetOptions) return hostSetOptions(payload)
      return send('NAVIGATION_SET_OPTIONS', payload)
    },
    onButton: (callback: (event: { id: string }) => Any) => {
      if (typeof callback !== 'function') throw new TypeError('navigation.onButton needs a function')
      navButtonHandlers.add(callback)
      return () => { navButtonHandlers.delete(callback) }
    },
  })
  craft.device = craft.device || {}
  craft.device.getInfo = () => requestAPI('Device', 'getInfo', [])
  craft.clipboard = {
    write: (value: string) => requestAPI('Clipboard', 'write', [value]),
    read: () => requestAPI('Clipboard', 'read', []),
  }
  craft.haptic = (style?: string) => requestAPI('Haptics', 'impact', [style || 'medium'])
  function hapticFeedback(answer: Promise<Any>): Promise<void> {
    return answer.then(() => {}, (error: Any) => {
      // Match Craft's browser bridge: the high-level feedback helpers are
      // no-ops when disabled, while craft.haptic() rejects with the code.
      if (error.code === 'CAPABILITY_DISABLED') return
      throw error
    })
  }
  craft.haptics = {
    impact: (style?: string) => hapticFeedback(craft.haptic(style)),
    notification: (type?: string) => hapticFeedback(craft.haptic(type === 'error' ? 'heavy' : type === 'warning' ? 'medium' : 'light')),
    selection: () => hapticFeedback(craft.haptic('soft')),
  }
  // Merged, never assigned: the host installs synchronous readers (getSync,
  // setSync, snapshots.get) before this runs, and they must survive.
  const syncFallbacks = { getSync: () => null, setSync: () => undefined }
  craft.storage = Object.assign({}, syncFallbacks, craft.storage || {}, {
    get: (key: string) => requestAPI('Storage', 'get', [key]),
    set: (key: string, value: Any) => requestAPI('Storage', 'set', [key, value]),
    remove: (key: string) => requestAPI('Storage', 'remove', [key]),
    clear: () => requestAPI('Storage', 'clear', []),
    keys: () => requestAPI('Storage', 'keys', []),
  })
  craft.biometrics = {
    isAvailable: () => requestAPI('Biometrics', 'isAvailable', []),
    getBiometricType: () => requestAPI('Biometrics', 'getBiometricType', []),
    authenticate: (reason?: string) => requestAPI('Biometrics', 'authenticate', [reason || 'Authenticate to continue']),
  }
  craft.secureStorage = Object.assign({ getSync: () => null }, craft.secureStorage || {}, {
    set: (key: string, value: string) => requestAPI('SecureStorage', 'set', [key, value]),
    get: (key: string) => requestAPI('SecureStorage', 'get', [key]),
    remove: (key: string) => requestAPI('SecureStorage', 'remove', [key]),
    delete: (key: string) => requestAPI('SecureStorage', 'remove', [key]),
    clear: () => requestAPI('SecureStorage', 'clear', []),
  })
  craft.snapshots = Object.assign({ get: () => null, set: () => Promise.resolve(false) }, craft.snapshots || {})
  craft.db = {
    execute: (sql: string, params?: Any[]) => requestAPI('Database', 'execute', [sql, params || []]),
    query: (sql: string, params?: Any[]) => requestAPI('Database', 'query', [sql, params || []]),
    beginTransaction: () => requestAPI('Database', 'beginTransaction', []),
    commit: () => requestAPI('Database', 'commit', []),
    rollback: () => requestAPI('Database', 'rollback', []),
  }
  function onAppStateChange(callback: (state: string) => Any): () => void {
    if (typeof callback !== 'function') throw new TypeError('lifecycle.onStateChange needs a function')
    appStateHandlers.add(callback)
    return () => { appStateHandlers.delete(callback) }
  }
  craft.lifecycle = { getState: () => currentAppState, onStateChange: onAppStateChange, onChange: onAppStateChange }
  craft.getAppState = craft.lifecycle.getState
  craft.onAppStateChange = onAppStateChange
  craft.deepLinks = {
    getInitialURL: () => {
      initialDeepLinkClaimed = true
      return requestAPI('DeepLinks', 'getInitialURL', [])
    },
    onLink: (callback: (link: Any) => Any) => {
      if (typeof callback !== 'function') throw new TypeError('deepLinks.onLink needs a function')
      deepLinkHandlers.add(callback)
      return () => { deepLinkHandlers.delete(callback) }
    },
  }
  craft.notifications = {
    show: (notification: Any) => requestAPI('Notifications', 'schedule', [notification]),
    schedule: (notification: Any) => requestAPI('Notifications', 'schedule', [notification]),
    cancel: (id: string) => requestAPI('Notifications', 'cancel', [id]),
    cancelAll: () => requestAPI('Notifications', 'cancelAll', []),
    pending: () => requestAPI('Notifications', 'pending', []),
  }
  craft.scheduleNotification = craft.notifications.schedule
  craft.cancelNotification = craft.notifications.cancel
  craft.cancelAllNotifications = craft.notifications.cancelAll
  craft.getPendingNotifications = craft.notifications.pending

  // fetch over the Network capability, for hosts that advertise it.
  // JavaScriptCore has no fetch of its own; the host runs the request and
  // answers with { status, statusText, url, redirected, headers, body }.
  function nativeResponse(data: Any): Any {
    const headers = data && data.headers && typeof data.headers === 'object' ? data.headers : {}
    const body = data && data.body != null ? String(data.body) : ''
    const status = Number(data && data.status) || 0
    let bodyUsed = false
    function consume(): Promise<string> {
      if (bodyUsed) return Promise.reject(new TypeError('Body has already been consumed'))
      bodyUsed = true
      return Promise.resolve(body)
    }
    return {
      type: 'basic',
      url: (data && data.url) || '',
      status,
      statusText: (data && data.statusText) || '',
      ok: status >= 200 && status < 300,
      redirected: Boolean(data && data.redirected),
      headers: {
        get: (name: string) => {
          const value = headers[String(name).toLowerCase()]
          return value == null ? null : String(value)
        },
        has: (name: string) => headers[String(name).toLowerCase()] != null,
        forEach: (callback: (value: string, name: string) => void) => {
          Object.keys(headers).forEach(name => callback(String(headers[name]), name))
        },
      },
      get bodyUsed() { return bodyUsed },
      text: consume,
      json: () => consume().then(value => JSON.parse(value)),
    }
  }
  function nativeFetch(input: Any, init?: Any): Promise<Any> {
    const options = init || {}
    const request = input && typeof input === 'object' ? input : {}
    const url = typeof input === 'string' ? input : String(request.url || input)
    const method = String(options.method || request.method || 'GET').toUpperCase()
    const headers: Record<string, string> = {}
    const source = options.headers || request.headers
    function addHeader(name: string, value: Any): void { headers[String(name).toLowerCase()] = String(value) }
    if (Array.isArray(source)) source.forEach((pair: Any[]) => addHeader(pair[0], pair[1]))
    else if (source && typeof source.forEach === 'function') source.forEach((value: Any, name: string) => addHeader(name, value))
    else if (source && typeof source === 'object') Object.keys(source).forEach(name => addHeader(name, source[name]))
    const body = options.body !== undefined ? options.body : request.body
    if (body != null && typeof body !== 'string')
      return Promise.reject(new TypeError('fetch in a native screen sends string bodies only'))
    if (body != null && (method === 'GET' || method === 'HEAD'))
      return Promise.reject(new TypeError('A GET or HEAD request cannot have a body'))
    return requestAPI('Network', 'fetch', [{ url, method, headers, body: body == null ? null : body }]).then(nativeResponse, (error: Any) => {
      // Match the web: transport failures are TypeErrors, statuses are not.
      if (error && error.code === 'INVALID_ARGUMENT') throw error
      const failure: Any = new TypeError((error && error.message) || 'Network request failed')
      failure.code = (error && error.code) || 'NETWORK_ERROR'
      throw failure
    })
  }
  if (nativeCapabilities.has('fetch') && typeof g.fetch !== 'function') g.fetch = nativeFetch

  // The host provides a console that writes to its log (os_log on iOS). A
  // host without one gets console messages over the bridge instead.
  if (!g.console || typeof g.console.log !== 'function') {
    const forward = (level: string) => (...args: Any[]) => {
      send('CONSOLE', { level, message: args.map(arg => (typeof arg === 'string' ? arg : (() => { try { return JSON.stringify(arg) } catch { return String(arg) } })())).join(' ') })
    }
    g.console = { log: forward('log'), info: forward('info'), warn: forward('warn'), error: forward('error'), debug: forward('debug') }
  }

  function dispatchNavButton(event: Any): void {
    const id = event && event.id != null ? String(event.id) : ''
    const own = navButtonPresses.get(id)
    if (own) runHandler(own, { id })
    navButtonHandlers.forEach(handler => runHandler(handler, { id }))
    const named = screen && screen.functions && screen.functions.navButton
    if (named) runHandler(named, { id })
    if (!own && !navButtonHandlers.size && !named) render()
  }

  bridge.onMessage((raw: Any) => {
    const message = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (message.type === 'EVENT') {
      const name = message.payload.handlerName
      const nativeEvent = message.payload.nativeEvent || {}
      const handler = handlerTable.get(name)
      if (handler) {
        runHandler(handler, nativeEvent)
        return
      }
      if (name === 'navButton') {
        dispatchNavButton(nativeEvent)
        return
      }
      // A host (or an older tree) that dispatches by function name.
      const named = screen && screen.functions && screen.functions[name]
      if (typeof named === 'function') runHandler(named, nativeEvent)
    }
    else if (message.type === 'API_RESPONSE' || message.type === 'API_ERROR') {
      const requestId = message.correlationId || message.payload.requestId
      const pending = pendingAPI.get(requestId)
      if (!pending) return
      pendingAPI.delete(requestId)
      if (pending.timeout !== null && cancelTimeout) cancelTimeout(pending.timeout)
      if (message.type === 'API_RESPONSE') {
        pending.resolve(message.payload.data)
      }
      else {
        const error: Any = new Error(message.payload.message || 'Native API failed')
        error.code = message.payload.code || 'CRAFT_ERROR'
        pending.reject(error)
      }
      scheduleRender()
    }
    else if (message.type === 'APP_STATE') {
      if (message.payload.state === currentAppState) return
      currentAppState = message.payload.state
      dispatchSubscription(appStateHandlers, message.payload.state)
    }
    else if (message.type === 'DEEP_LINK') {
      if (initialDeepLinkClaimed && message.payload.initial) return
      dispatchSubscription(deepLinkHandlers, message.payload)
    }
    else if (message.type === 'APPEARANCE') {
      const next = message.payload && message.payload.colorScheme === 'dark' ? 'dark' : 'light'
      if (next === colorScheme) return
      colorScheme = next
      render()
    }
    else if (message.type === 'MUTATION_ERROR') {
      mutationsEnabled = false
      mutationRevision = 0
      previousTree = null
      sendRenderFallback()
    }
  })

  return {
    mount(definition: ScreenDefinition): void {
      screen = definition
      render()
    },
  }
}

/**
 * The bundle's entry: installs the Craft APIs once, before any screen script
 * runs, and hands each screen a `mount`. Without a bridge (a test importing a
 * screen, a web build) there is nothing to render to, so mount does nothing.
 */
export function installRuntime(options: RuntimeOptions = {}): { mount: (screen: ScreenDefinition) => void } {
  const bridge = g.__stxNativeBridge
  if (typeof bridge === 'undefined' || bridge === null) return { mount() {} }
  return createRuntime(bridge, options)
}
