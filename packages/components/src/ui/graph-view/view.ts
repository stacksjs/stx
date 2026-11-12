/**
 * A graph in the DOM: an SVG that can be panned, zoomed and walked by keyboard.
 *
 * One group carries the pan and zoom, so moving the view is a single attribute
 * however many nodes there are. Edges sit under nodes, and edge labels over
 * both layers of lines so a label is never struck through.
 *
 * Text only ever arrives through `textContent`. A label is data.
 */
import type { EdgeShape, GraphEdge, GraphNode, Heading, LayeredDirection, Point, Positions, ResolvedEdge, Size, Viewport } from './core'
import { centreOn, edgeShape, fit, fitLabel, forceLayout, GraphModel, labelOf, layeredLayout, maxLabelLength, nearestInDirection, nearestTo, pan, parallelOffsets, reveal, toGraph, zoomAt } from './core'

export type GraphLayoutName = 'layered' | 'force'

export interface GraphCanvasOptions {
  nodes?: readonly GraphNode[]
  edges?: readonly GraphEdge[]
  layout?: GraphLayoutName
  direction?: LayeredDirection
  /** The id of the node to start selected. */
  selected?: string | null
  minZoom?: number
  maxZoom?: number
  /** The accessible name of the graph. */
  label?: string
  /** Suppress the browser's own menu on a right click, for a host that shows its own. */
  contextMenu?: boolean
  /** Move nodes to a new layout over a moment, rather than at once. Default true. */
  animate?: boolean
}

export interface GraphSelectDetail {
  node: GraphNode | null
  neighbours: GraphNode[]
}

export interface GraphCanvasCallbacks {
  onSelect?: (detail: GraphSelectDetail) => void
  onExpand?: (detail: { node: GraphNode }) => void
  onOpen?: (detail: { node: GraphNode }) => void
  onMove?: (detail: { node: GraphNode, x: number, y: number }) => void
  onViewport?: (detail: Viewport) => void
  onContext?: (detail: { node: GraphNode | null, x: number, y: number }) => void
  onLayout?: (detail: { layout: GraphLayoutName }) => void
}

const SVG = 'http://www.w3.org/2000/svg'
const DRAG_THRESHOLD = 3
const DOUBLE_CLICK = 350
const MOVE_TIME = 240
const LABEL_CHAR = 6.2

interface EdgeParts {
  group: SVGGElement
  path: SVGPathElement
  label: SVGGElement | null
}

interface Gesture {
  pointer: number
  node: string | null
  startX: number
  startY: number
  origin: Point
  view: Viewport
  moved: boolean
}

function make<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG, name)
  for (const key in attributes)
    element.setAttribute(key, String(attributes[key]))
  return element
}

let instances = 0

export class GraphCanvas {
  /** How long the last layout and the last full draw took, in milliseconds. */
  readonly timings = { layout: 0, render: 0 }

  private model = new GraphModel()
  /** Where each node belongs. */
  private positions: Positions = new Map()
  /** Where each node is drawn right now, which differs while nodes are moving. */
  private shown: Positions = new Map()
  private readonly pinned = new Set<string>()
  private view: Viewport = { x: 0, y: 0, k: 1 }
  private size: Size = { width: 0, height: 0 }
  private layoutName: GraphLayoutName
  private direction: LayeredDirection
  private selected: string | null = null
  private autoFit = true
  private animate: boolean
  private minZoom: number
  private maxZoom: number
  private readonly contextMenu: boolean

  private readonly prefix: string
  private readonly surface: HTMLElement
  private readonly status: HTMLElement | null
  private readonly svg: SVGSVGElement
  private readonly stage: SVGGElement
  private readonly edgeLayer: SVGGElement
  private readonly nodeLayer: SVGGElement
  private readonly labelLayer: SVGGElement
  private readonly nodeEls = new Map<string, SVGGElement>()
  private readonly edgeEls = new Map<string, EdgeParts>()
  private readonly idOf = new WeakMap<Element, string>()
  private offsets = new Map<string, number>()
  private serial = 0

  private gesture: Gesture | null = null
  private pinch: { k: number, x: number, y: number } | null = null
  private lastClick = { id: '', at: 0 }
  private lastExpand = 0
  private frame = 0
  private observer: ResizeObserver | null = null
  private readonly disposers: Array<() => void> = []

  constructor(private readonly root: HTMLElement, options: GraphCanvasOptions = {}, private readonly callbacks: GraphCanvasCallbacks = {}) {
    this.prefix = `${root.id || 'graph'}-${++instances}`
    this.layoutName = options.layout === 'force' ? 'force' : 'layered'
    this.direction = options.direction === 'TB' ? 'TB' : 'LR'
    this.minZoom = options.minZoom ?? 0.1
    this.maxZoom = options.maxZoom ?? 4
    this.contextMenu = Boolean(options.contextMenu)
    this.animate = options.animate !== false

    this.surface = root.querySelector<HTMLElement>('[data-gv="surface"]') ?? root
    this.status = root.querySelector<HTMLElement>('[data-gv="status"]')
    if (options.label)
      this.surface.setAttribute('aria-label', options.label)

    this.svg = make('svg', { 'class': 'stx-gv-svg', 'aria-hidden': 'false', 'focusable': 'false' })
    // Whatever is written under here is data, never a template to evaluate.
    ;(this.svg as unknown as { __stx_inert_content: boolean }).__stx_inert_content = true
    const defs = make('defs')
    for (const name of ['arrow', 'arrow-active']) {
      const marker = make('marker', { id: `${this.prefix}-${name}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', class: `stx-gv-${name}` })
      marker.append(make('path', { d: 'M 0 0 L 10 5 L 0 10 z' }))
      defs.append(marker)
    }
    this.stage = make('g', { class: 'stx-gv-stage' })
    this.edgeLayer = make('g', { class: 'stx-gv-edges' })
    this.nodeLayer = make('g', { class: 'stx-gv-nodes' })
    this.labelLayer = make('g', { class: 'stx-gv-edge-labels' })
    this.stage.append(this.edgeLayer, this.nodeLayer, this.labelLayer)
    this.svg.append(defs, this.stage)
    this.surface.append(this.svg)

    this.listen()
    this.measure()
    this.setGraph(options.nodes ?? [], options.edges ?? [])
    if (options.selected)
      this.select(options.selected, { silent: true })

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => {
        this.measure()
        if (this.autoFit)
          this.fit()
      })
      this.observer.observe(this.surface)
    }
    root.setAttribute('data-gv-ready', '')
  }

  /** The model behind the drawing. */
  graph(): GraphModel {
    return this.model
  }

  getViewport(): Viewport {
    return { ...this.view }
  }

  getLayout(): GraphLayoutName {
    return this.layoutName
  }

  getSelected(): string | null {
    return this.selected
  }

  /** Where every node belongs, as a plain object. */
  getPositions(): Record<string, Point> {
    return Object.fromEntries([...this.positions].map(([id, point]) => [id, { ...point }]))
  }

  /** Replace the whole graph. */
  setGraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): void {
    this.stop()
    this.model = new GraphModel(nodes ?? [], edges ?? [])
    this.positions = new Map()
    this.pinned.clear()
    if (this.selected && !this.model.has(this.selected))
      this.selected = null
    this.layout(false)
    this.shown = new Map(this.positions)
    this.render()
    this.autoFit = true
    this.fit()
    this.mark()
  }

  /**
   * Add to the graph around a node: the answer to an expand. What the graph
   * already has is ignored. The new nodes grow out of the node they came from.
   */
  addNeighbours(id: string, nodes: readonly GraphNode[], edges: readonly GraphEdge[]): { nodes: string[], edges: string[] } {
    const added = this.model.merge(nodes ?? [], edges ?? [])
    if (added.nodes.length === 0 && added.edges.length === 0)
      return added

    const from = this.shown.get(id) ?? this.positions.get(id) ?? toGraph(this.view, { x: this.size.width / 2, y: this.size.height / 2 })
    for (const node of added.nodes)
      this.shown.set(node, { ...from })
    this.layout(true)
    this.sync()
    this.moveToPlace()
    this.mark()
    if (added.nodes.length)
      this.announce(`${added.nodes.length} ${added.nodes.length === 1 ? 'node' : 'nodes'} added${this.model.has(id) ? ` to ${labelOf(this.model.node(id)!)}` : ''}`)
    return added
  }

  /** Change what a node says about itself, such as `expandable`. */
  updateNode(id: string, patch: Partial<Omit<GraphNode, 'id'>>): void {
    if (!this.model.updateNode(id, patch))
      return
    const old = this.nodeEls.get(id)
    if (old) {
      old.remove()
      this.nodeEls.delete(id)
    }
    this.sync()
    this.draw()
    this.mark()
  }

  setLayout(name: GraphLayoutName): void {
    const next = name === 'force' ? 'force' : 'layered'
    if (next === this.layoutName)
      return
    this.layoutName = next
    this.relayout()
    this.callbacks.onLayout?.({ layout: next })
  }

  setDirection(direction: LayeredDirection): void {
    const next = direction === 'TB' ? 'TB' : 'LR'
    if (next === this.direction)
      return
    this.direction = next
    if (this.layoutName === 'layered')
      this.relayout()
  }

  /** Select a node, or nothing with null. Says who it connects to. */
  select(id: string | null, options: { silent?: boolean } = {}): void {
    const next = id != null && this.model.has(id) ? id : null
    if (next === this.selected)
      return
    this.selected = next
    this.mark()
    if (next)
      this.describe(next)
    if (!options.silent)
      this.callbacks.onSelect?.(this.selection())
  }

  /** Select a node and bring it to the middle. */
  focusNode(id: string): void {
    if (!this.model.has(id))
      return
    this.select(id)
    const at = this.positions.get(id)
    if (at) {
      this.autoFit = false
      this.setView(centreOn(this.view, at, this.size))
    }
  }

  /** Show the whole graph. */
  fit(): void {
    this.measure()
    this.setView(fit(this.model.bounds(this.positions), this.size, 32, this.minZoom, Math.min(1, this.maxZoom)))
    this.autoFit = true
  }

  zoomIn(): void {
    this.zoomBy(1.25)
  }

  zoomOut(): void {
    this.zoomBy(0.8)
  }

  /** Zoom by a factor about a point on screen, the middle when none is given. */
  zoomBy(factor: number, point?: Point): void {
    this.autoFit = false
    this.setView(zoomAt(this.view, point ?? { x: this.size.width / 2, y: this.size.height / 2 }, factor, this.minZoom, this.maxZoom))
  }

  panBy(dx: number, dy: number): void {
    this.autoFit = false
    this.setView(pan(this.view, dx, dy))
  }

  setZoomLimits(min: number, max: number): void {
    this.minZoom = min
    this.maxZoom = max
  }

  destroy(): void {
    this.stop()
    this.observer?.disconnect()
    for (const dispose of this.disposers) dispose()
    this.svg.remove()
    this.root.removeAttribute('data-gv-ready')
  }

  private selection(): GraphSelectDetail {
    const node = this.selected ? this.model.node(this.selected) ?? null : null
    return { node, neighbours: node ? this.model.neighbours(node.id).map(id => this.model.node(id)!) : [] }
  }

  private measure(): void {
    const box = this.surface.getBoundingClientRect()
    this.size = { width: box.width, height: box.height }
  }

  /** Work out where every node belongs. `warm` keeps what is already placed. */
  private layout(warm: boolean): void {
    const started = performance.now()
    if (this.layoutName === 'layered') {
      this.positions = layeredLayout(this.model, { direction: this.direction }).positions
    }
    else {
      this.positions = forceLayout(this.model, {
        positions: warm && this.positions.size ? this.positions : null,
        pinned: warm ? this.pinned : null,
      })
    }
    this.timings.layout = performance.now() - started
  }

  private relayout(): void {
    this.pinned.clear()
    this.layout(false)
    this.sync()
    this.moveToPlace()
    if (this.autoFit)
      this.fit()
  }

  /** Create and remove elements until the SVG holds exactly the graph, then draw. */
  private render(): void {
    const started = performance.now()
    this.sync()
    this.draw()
    this.timings.render = performance.now() - started
  }

  private sync(): void {
    const limit = maxLabelLength(this.model.metrics)

    for (const [id, element] of this.nodeEls) {
      if (!this.model.has(id)) {
        element.remove()
        this.nodeEls.delete(id)
      }
    }
    for (const node of this.model.nodes) {
      let group = this.nodeEls.get(node.id)
      if (!group) {
        group = this.buildNode(node, limit)
        this.nodeEls.set(node.id, group)
        this.idOf.set(group, node.id)
        this.nodeLayer.append(group)
      }
      const degree = this.model.degree(node.id)
      group.setAttribute('aria-label', `${labelOf(node)}, ${degree} ${degree === 1 ? 'connection' : 'connections'}`)
    }

    for (const [id, parts] of this.edgeEls) {
      if (!this.model.edge(id)) {
        parts.group.remove()
        parts.label?.remove()
        this.edgeEls.delete(id)
      }
    }
    for (const edge of this.model.edges) {
      if (!this.edgeEls.has(edge.id))
        this.edgeEls.set(edge.id, this.buildEdge(edge))
    }
    this.offsets = parallelOffsets(this.model.edges)
  }

  private buildNode(node: GraphNode, limit: number): SVGGElement {
    const size = this.model.size(node.id)
    const group = make('g', { 'class': 'stx-gv-node', 'id': `${this.prefix}-node-${this.serial++}`, 'role': 'group', 'data-node': node.id })
    if (node.kind)
      group.setAttribute('data-kind', node.kind)
    if (node.expandable === true)
      group.setAttribute('data-expandable', '')

    const title = make('title')
    title.textContent = node.detail ? `${labelOf(node)}: ${node.detail}` : labelOf(node)
    const box = make('rect', { x: -size.width / 2, y: -size.height / 2, width: size.width, height: size.height, rx: 6, ry: 6 })
    const mark = node.expandable === true ? (this.model.metrics.charWidth + 4) / 2 : 0
    const label = make('text', { 'class': 'stx-gv-node-label', 'x': -mark, 'y': node.detail ? -6 : 0, 'text-anchor': 'middle', 'dominant-baseline': 'central' })
    label.textContent = fitLabel(labelOf(node), limit)
    group.append(title, box, label)

    if (node.detail) {
      const detail = make('text', { 'class': 'stx-gv-node-detail', 'x': -mark, 'y': 9, 'text-anchor': 'middle', 'dominant-baseline': 'central' })
      detail.textContent = fitLabel(node.detail, Math.floor(limit / 0.85))
      group.append(detail)
    }
    if (node.expandable === true) {
      const plus = make('text', { 'class': 'stx-gv-node-mark', 'x': size.width / 2 - 10, 'y': 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'aria-hidden': 'true' })
      plus.textContent = '+'
      group.append(plus)
    }
    return group
  }

  private buildEdge(edge: ResolvedEdge): EdgeParts {
    const group = make('g', { 'class': 'stx-gv-edge', 'data-edge': edge.id })
    const path = make('path', { fill: 'none' })
    if (edge.directed !== false)
      path.setAttribute('marker-end', `url(#${this.prefix}-arrow)`)
    group.append(path)
    this.edgeLayer.append(group)

    let label: SVGGElement | null = null
    if (edge.label) {
      const text = fitLabel(String(edge.label), 32)
      const width = Math.ceil(text.length * LABEL_CHAR) + 8
      label = make('g', { 'class': 'stx-gv-edge-label', 'data-edge': edge.id })
      const plate = make('rect', { x: -width / 2, y: -8, width, height: 16, rx: 3, ry: 3 })
      const words = make('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' })
      words.textContent = text
      label.append(plate, words)
      this.labelLayer.append(label)
    }
    return { group, path, label }
  }

  /** Write every node and edge at where it is shown. */
  private draw(): void {
    for (const [id, group] of this.nodeEls) {
      const at = this.shown.get(id) ?? this.positions.get(id)
      if (at)
        group.setAttribute('transform', `translate(${at.x} ${at.y})`)
    }
    for (const edge of this.model.edges)
      this.drawEdge(edge)
  }

  private shape(edge: ResolvedEdge): EdgeShape | null {
    const source = this.shown.get(edge.source) ?? this.positions.get(edge.source)
    const target = this.shown.get(edge.target) ?? this.positions.get(edge.target)
    if (!source || !target)
      return null
    return edgeShape(
      { source, sourceSize: this.model.size(edge.source), target, targetSize: this.model.size(edge.target) },
      { curve: this.layoutName === 'layered' ? 'bezier' : 'straight', direction: this.direction, offset: this.offsets.get(edge.id) ?? 0, inset: edge.directed !== false ? 1 : 0 },
    )
  }

  private drawEdge(edge: ResolvedEdge): void {
    const parts = this.edgeEls.get(edge.id)
    const shape = parts && this.shape(edge)
    if (!parts || !shape)
      return
    parts.path.setAttribute('d', shape.d)
    parts.label?.setAttribute('transform', `translate(${Math.round(shape.label.x * 10) / 10} ${Math.round(shape.label.y * 10) / 10})`)
  }

  /** Move the nodes from where they are shown to where they belong. */
  private moveToPlace(): void {
    this.stop()
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!this.animate || still || typeof requestAnimationFrame !== 'function') {
      this.shown = new Map(this.positions)
      this.draw()
      return
    }

    const from = new Map<string, Point>()
    for (const [id, to] of this.positions)
      from.set(id, this.shown.get(id) ?? to)
    const started = performance.now()
    const step = (now: number): void => {
      const t = Math.min(1, (now - started) / MOVE_TIME)
      const eased = 1 - (1 - t) ** 3
      for (const [id, to] of this.positions) {
        const a = from.get(id)!
        this.shown.set(id, { x: a.x + (to.x - a.x) * eased, y: a.y + (to.y - a.y) * eased })
      }
      this.draw()
      this.frame = t < 1 ? requestAnimationFrame(step) : 0
      if (t >= 1)
        this.shown = new Map(this.positions)
    }
    this.frame = requestAnimationFrame(step)
  }

  private stop(): void {
    if (this.frame)
      cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private setView(next: Viewport): void {
    this.view = next
    this.stage.setAttribute('transform', `translate(${next.x} ${next.y}) scale(${next.k})`)
    this.callbacks.onViewport?.({ ...next })
  }

  /** Mark the selected node, its edges and its neighbours; the stylesheet dims the rest. */
  private mark(): void {
    const selected = this.selected
    const near = new Set(selected ? this.model.neighbours(selected) : [])
    this.root.toggleAttribute('data-has-selection', Boolean(selected))
    for (const [id, group] of this.nodeEls) {
      group.toggleAttribute('data-selected', id === selected)
      group.toggleAttribute('data-neighbour', near.has(id))
      if (id === selected)
        group.setAttribute('aria-current', 'true')
      else
        group.removeAttribute('aria-current')
    }
    for (const edge of this.model.edges) {
      const parts = this.edgeEls.get(edge.id)
      if (!parts)
        continue
      const active = selected != null && (edge.source === selected || edge.target === selected)
      parts.group.toggleAttribute('data-active', active)
      parts.label?.toggleAttribute('data-active', active)
      if (edge.directed !== false)
        parts.path.setAttribute('marker-end', `url(#${this.prefix}-${active ? 'arrow-active' : 'arrow'})`)
    }
    const element = selected ? this.nodeEls.get(selected) : null
    if (element)
      this.surface.setAttribute('aria-activedescendant', element.id)
    else
      this.surface.removeAttribute('aria-activedescendant')
  }

  private describe(id: string): void {
    const node = this.model.node(id)
    if (!node)
      return
    const names = this.model.neighbours(id).map(other => labelOf(this.model.node(other)!))
    const shown = names.slice(0, 5).join(', ')
    const rest = names.length > 5 ? ` and ${names.length - 5} more` : ''
    this.announce(names.length === 0
      ? `${labelOf(node)}, no connections`
      : `${labelOf(node)}, ${names.length} ${names.length === 1 ? 'connection' : 'connections'}: ${shown}${rest}`)
  }

  private announce(text: string): void {
    if (this.status)
      this.status.textContent = text
  }

  private expand(id: string, open = false): void {
    const node = this.model.node(id)
    if (!node)
      return
    this.lastExpand = performance.now()
    // A node with nothing more to load is opened instead.
    if (open || node.expandable === false)
      this.callbacks.onOpen?.({ node })
    else
      this.callbacks.onExpand?.({ node })
  }

  private nodeUnder(target: EventTarget | null): string | null {
    const element = target instanceof Element ? target.closest('.stx-gv-node') : null
    return element ? this.idOf.get(element) ?? null : null
  }

  private local(event: { clientX: number, clientY: number }): Point {
    const box = this.surface.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
  }

  private listen(): void {
    const on = <K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions): void => {
      this.surface.addEventListener(type, handler as EventListener, options)
      this.disposers.push(() => this.surface.removeEventListener(type, handler as EventListener, options))
    }

    on('pointerdown', event => this.onPointerDown(event))
    on('pointermove', event => this.onPointerMove(event))
    on('pointerup', event => this.onPointerUp(event))
    on('pointercancel', () => this.endGesture())
    on('dblclick', (event) => {
      // The pointer handlers already saw a double click made with a pointer.
      const id = this.nodeUnder(event.target)
      if (id && performance.now() - this.lastExpand > DOUBLE_CLICK)
        this.expand(id, event.metaKey || event.ctrlKey)
    })
    on('wheel', event => this.onWheel(event), { passive: false })
    on('keydown', event => this.onKeyDown(event))
    on('contextmenu', (event) => {
      if (this.contextMenu)
        event.preventDefault()
      const id = this.nodeUnder(event.target)
      if (id)
        this.select(id)
      this.callbacks.onContext?.({ node: id ? this.model.node(id)! : null, x: event.clientX, y: event.clientY })
    })

    // A trackpad pinch in WebKit arrives as gesture events, not as a wheel.
    const gesture = (type: string, handler: (event: Event & { scale: number, clientX: number, clientY: number }) => void): void => {
      this.surface.addEventListener(type, handler as EventListener)
      this.disposers.push(() => this.surface.removeEventListener(type, handler as EventListener))
    }
    gesture('gesturestart', (event) => {
      event.preventDefault()
      const point = this.local(event)
      this.pinch = { k: this.view.k, x: point.x, y: point.y }
    })
    gesture('gesturechange', (event) => {
      if (!this.pinch)
        return
      event.preventDefault()
      this.zoomBy((this.pinch.k * event.scale) / this.view.k, { x: this.pinch.x, y: this.pinch.y })
    })
    gesture('gestureend', () => {
      this.pinch = null
    })
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0)
      return
    const node = this.nodeUnder(event.target)
    this.surface.focus({ preventScroll: true })
    try {
      this.surface.setPointerCapture(event.pointerId)
    }
    catch {}
    this.gesture = {
      pointer: event.pointerId,
      node,
      startX: event.clientX,
      startY: event.clientY,
      origin: node ? { ...(this.positions.get(node) ?? { x: 0, y: 0 }) } : { x: 0, y: 0 },
      view: { ...this.view },
      moved: false,
    }
  }

  private onPointerMove(event: PointerEvent): void {
    const gesture = this.gesture
    if (!gesture || event.pointerId !== gesture.pointer)
      return
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    if (!gesture.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD)
        return
      gesture.moved = true
      this.stop()
      this.shown = new Map(this.positions)
      this.root.setAttribute('data-dragging', gesture.node ? 'node' : 'pan')
    }

    if (gesture.node) {
      const at = { x: gesture.origin.x + dx / this.view.k, y: gesture.origin.y + dy / this.view.k }
      this.positions.set(gesture.node, at)
      this.shown.set(gesture.node, at)
      this.nodeEls.get(gesture.node)?.setAttribute('transform', `translate(${at.x} ${at.y})`)
      for (const edge of this.model.edgesOf(gesture.node))
        this.drawEdge(edge)
    }
    else {
      this.autoFit = false
      this.setView(pan(gesture.view, dx, dy))
    }
  }

  private onPointerUp(event: PointerEvent): void {
    const gesture = this.gesture
    if (!gesture || event.pointerId !== gesture.pointer)
      return
    this.endGesture()

    if (gesture.moved) {
      if (gesture.node) {
        // A node put somewhere by hand stays there when the forces run again.
        this.pinned.add(gesture.node)
        this.autoFit = false
        const at = this.positions.get(gesture.node)!
        this.callbacks.onMove?.({ node: this.model.node(gesture.node)!, x: at.x, y: at.y })
      }
      return
    }

    if (!gesture.node) {
      this.select(null)
      return
    }
    const now = performance.now()
    const double = this.lastClick.id === gesture.node && now - this.lastClick.at < DOUBLE_CLICK
    this.lastClick = double ? { id: '', at: 0 } : { id: gesture.node, at: now }
    this.select(gesture.node)
    if (double)
      this.expand(gesture.node, event.metaKey || event.ctrlKey)
  }

  private endGesture(): void {
    const gesture = this.gesture
    this.gesture = null
    this.root.removeAttribute('data-dragging')
    if (gesture) {
      try {
        this.surface.releasePointerCapture(gesture.pointer)
      }
      catch {}
    }
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      // A pinch arrives as a wheel with Control held, in small steps.
      this.zoomBy(Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.01)), this.local(event))
      return
    }
    const unit = event.deltaMode === 1 ? 16 : 1
    this.panBy(-event.deltaX * unit, -event.deltaY * unit)
  }

  private onKeyDown(event: KeyboardEvent): void {
    const headings: Record<string, Heading> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
    const heading = headings[event.key]

    if (heading) {
      event.preventDefault()
      const next = this.selected
        ? nearestInDirection(this.positions, this.selected, heading)
        : nearestTo(this.positions, toGraph(this.view, { x: this.size.width / 2, y: this.size.height / 2 }))
      if (next) {
        this.select(next)
        this.bringIntoView(next)
      }
      return
    }

    const mod = event.metaKey || event.ctrlKey
    if (event.key === 'Enter' || event.key === ' ') {
      if (!this.selected)
        return
      event.preventDefault()
      this.expand(this.selected, mod)
    }
    else if (mod || event.altKey) {
      // Everything below is a bare key; leave the browser's shortcuts alone.
    }
    else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      this.zoomIn()
    }
    else if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      this.zoomOut()
    }
    else if (event.key === '0') {
      event.preventDefault()
      this.fit()
    }
    else if (event.key === 'f' || event.key === 'F') {
      if (!this.selected)
        return
      event.preventDefault()
      this.focusNode(this.selected)
    }
    else if (event.key === 'o' || event.key === 'O') {
      if (!this.selected)
        return
      event.preventDefault()
      this.expand(this.selected, true)
    }
    else if (event.key === 'Escape' && this.selected) {
      event.preventDefault()
      this.select(null)
    }
  }

  private bringIntoView(id: string): void {
    const at = this.positions.get(id)
    if (!at)
      return
    const size = this.model.size(id)
    const next = reveal(this.view, { x: at.x - size.width / 2, y: at.y - size.height / 2, width: size.width, height: size.height }, this.size)
    if (next !== this.view) {
      this.autoFit = false
      this.setView(next)
    }
  }
}
