/**
 * A graph: nodes, the edges between them, and who is next to whom. No DOM.
 *
 * Everything the layouts and the view need to ask ("what does this node
 * connect to", "how big is it") is answered here, so neither of them keeps a
 * second copy of the structure that could disagree with the first.
 */

export interface GraphNode {
  id: string
  /** What is written in the node. The id when left out. */
  label?: string
  /** A free word the stylesheet can colour by: `model`, `object`, `array`. */
  kind?: string
  /** A second, quieter line under the label. */
  detail?: string
  /** False for a node with nothing further to load. Anything else can be expanded. */
  expandable?: boolean
  /** Whatever the host wants back with the node's events. */
  data?: unknown
}

export interface GraphEdge {
  /** Left out, it is made from the two ends and the label. */
  id?: string
  source: string
  target: string
  label?: string
  /** Draws an arrowhead at the target. Default true. */
  directed?: boolean
}

/** An edge once it is in a graph: it always has an id. */
export interface ResolvedEdge extends GraphEdge {
  id: string
}

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** A box by its top left corner. */
export interface Rect extends Point, Size {}

/** How a label becomes a size. No measuring: a character is so many pixels. */
export interface NodeMetrics {
  charWidth: number
  paddingX: number
  minWidth: number
  maxWidth: number
  height: number
  /** Added to the height of a node that has a detail line. */
  detailHeight: number
}

export const defaultNodeMetrics: NodeMetrics = {
  charWidth: 7,
  paddingX: 12,
  minWidth: 48,
  maxWidth: 220,
  height: 32,
  detailHeight: 14,
}

/** Positions are node centres, by node id. */
export type Positions = Map<string, Point>

export function labelOf(node: GraphNode): string {
  return node.label == null || node.label === '' ? node.id : String(node.label)
}

/** The id an edge gets when it did not bring one. */
export function edgeIdOf(edge: GraphEdge): string {
  return edge.id != null && edge.id !== '' ? String(edge.id) : `${edge.source}->${edge.target}${edge.label ? `:${edge.label}` : ''}`
}

/** The size of a node, from the length of what is written in it. */
export function nodeSize(node: GraphNode, metrics: NodeMetrics = defaultNodeMetrics): Size {
  const longest = Math.max(labelOf(node).length, node.detail ? node.detail.length * 0.85 : 0)
  // A node that says it can be expanded carries a small mark, and needs room for it.
  const mark = node.expandable === true ? metrics.charWidth + 4 : 0
  const width = Math.min(metrics.maxWidth, Math.max(metrics.minWidth, Math.ceil(longest * metrics.charWidth) + metrics.paddingX * 2 + mark))
  return { width, height: metrics.height + (node.detail ? metrics.detailHeight : 0) }
}

/** How many characters of a label fit in a node of the widest size. */
export function maxLabelLength(metrics: NodeMetrics = defaultNodeMetrics): number {
  return Math.floor((metrics.maxWidth - metrics.paddingX * 2) / metrics.charWidth)
}

/** A label cut to fit, with an ellipsis where it was cut. */
export function fitLabel(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, Math.max(1, limit - 1))}…`
}

export class GraphModel {
  private readonly nodeMap = new Map<string, GraphNode>()
  private readonly edgeMap = new Map<string, ResolvedEdge>()
  /** Edge ids touching each node, in the order they were added. */
  private readonly incident = new Map<string, Set<string>>()
  private readonly sizes = new Map<string, Size>()

  constructor(nodes: readonly GraphNode[] = [], edges: readonly GraphEdge[] = [], readonly metrics: NodeMetrics = defaultNodeMetrics) {
    this.merge(nodes, edges)
  }

  get nodes(): GraphNode[] {
    return [...this.nodeMap.values()]
  }

  get edges(): ResolvedEdge[] {
    return [...this.edgeMap.values()]
  }

  get nodeCount(): number {
    return this.nodeMap.size
  }

  get edgeCount(): number {
    return this.edgeMap.size
  }

  has(id: string): boolean {
    return this.nodeMap.has(id)
  }

  node(id: string): GraphNode | undefined {
    return this.nodeMap.get(id)
  }

  edge(id: string): ResolvedEdge | undefined {
    return this.edgeMap.get(id)
  }

  /** False when a node with that id is already there; the first one is kept. */
  addNode(node: GraphNode): boolean {
    if (!node || node.id == null || node.id === '')
      return false
    const id = String(node.id)
    if (this.nodeMap.has(id))
      return false
    const kept = { ...node, id }
    this.nodeMap.set(id, kept)
    this.incident.set(id, new Set())
    this.sizes.set(id, nodeSize(kept, this.metrics))
    return true
  }

  /** False for a duplicate, or an edge whose ends are not both in the graph. */
  addEdge(edge: GraphEdge): boolean {
    if (!edge)
      return false
    const source = String(edge.source)
    const target = String(edge.target)
    if (!this.nodeMap.has(source) || !this.nodeMap.has(target))
      return false
    const id = edgeIdOf({ ...edge, source, target })
    if (this.edgeMap.has(id))
      return false
    this.edgeMap.set(id, { ...edge, id, source, target })
    this.incident.get(source)!.add(id)
    this.incident.get(target)!.add(id)
    return true
  }

  /** Change what a node says about itself, such as `expandable` once it has been expanded. */
  updateNode(id: string, patch: Partial<Omit<GraphNode, 'id'>>): boolean {
    const node = this.nodeMap.get(id)
    if (!node)
      return false
    const next = { ...node, ...patch, id }
    this.nodeMap.set(id, next)
    this.sizes.set(id, nodeSize(next, this.metrics))
    return true
  }

  /** Takes the node's edges with it. */
  removeNode(id: string): boolean {
    if (!this.nodeMap.has(id))
      return false
    for (const edgeId of [...this.incident.get(id)!])
      this.removeEdge(edgeId)
    this.nodeMap.delete(id)
    this.incident.delete(id)
    this.sizes.delete(id)
    return true
  }

  removeEdge(id: string): boolean {
    const edge = this.edgeMap.get(id)
    if (!edge)
      return false
    this.edgeMap.delete(id)
    this.incident.get(edge.source)?.delete(id)
    this.incident.get(edge.target)?.delete(id)
    return true
  }

  /**
   * Add what is new and ignore what is already there. This is what expanding a
   * node does: the answer usually names nodes the graph has, and they must not
   * be added twice. Returns the ids that were actually added.
   */
  merge(nodes: readonly GraphNode[] = [], edges: readonly GraphEdge[] = []): { nodes: string[], edges: string[] } {
    const added = { nodes: [] as string[], edges: [] as string[] }
    for (const node of nodes) {
      if (this.addNode(node))
        added.nodes.push(String(node.id))
    }
    for (const edge of edges) {
      if (this.addEdge(edge))
        added.edges.push(edgeIdOf({ ...edge, source: String(edge.source), target: String(edge.target) }))
    }
    return added
  }

  /** The edges touching a node, either way round. */
  edgesOf(id: string): ResolvedEdge[] {
    const ids = this.incident.get(id)
    return ids ? [...ids].map(edgeId => this.edgeMap.get(edgeId)!) : []
  }

  /** The nodes one edge away, each once, without the node itself. */
  neighbours(id: string): string[] {
    const seen = new Set<string>()
    for (const edge of this.edgesOf(id)) {
      const other = edge.source === id ? edge.target : edge.source
      if (other !== id)
        seen.add(other)
    }
    return [...seen]
  }

  degree(id: string): number {
    return this.neighbours(id).length
  }

  size(id: string): Size {
    return this.sizes.get(id) ?? { width: this.metrics.minWidth, height: this.metrics.height }
  }

  /** The box around every node at the given positions. Null for an empty graph. */
  bounds(positions: Positions): Rect | null {
    let left = Number.POSITIVE_INFINITY
    let top = Number.POSITIVE_INFINITY
    let right = Number.NEGATIVE_INFINITY
    let bottom = Number.NEGATIVE_INFINITY
    for (const [id, point] of positions) {
      if (!this.nodeMap.has(id))
        continue
      const size = this.size(id)
      left = Math.min(left, point.x - size.width / 2)
      right = Math.max(right, point.x + size.width / 2)
      top = Math.min(top, point.y - size.height / 2)
      bottom = Math.max(bottom, point.y + size.height / 2)
    }
    return Number.isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : null
  }
}

/** A small, fast, seeded random source. The same seed gives the same layout. */
export function seededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 1
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
