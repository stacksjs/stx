/**
 * A layered layout: every edge points the same way, as far as the graph allows.
 *
 * The classic four steps, each kept small. Break cycles by turning round the
 * edges a depth-first walk finds pointing back at its own path. Give each node
 * the layer one past its deepest predecessor. Reorder each layer by where its
 * neighbours sit, a few times each way, keeping the order with the fewest
 * crossings. Then space the layers out and centre each one.
 *
 * Nothing here is random, so the same graph always comes out the same.
 */
import type { GraphModel, Positions, Rect } from './graph'

export type LayeredDirection = 'LR' | 'TB'

export interface LayeredOptions {
  /** `LR` runs left to right, `TB` top to bottom. Default `LR`. */
  direction?: LayeredDirection
  /** Space between two nodes in the same layer. Default 24. */
  nodeGap?: number
  /** Space between two layers. Default 80. */
  layerGap?: number
  /** Space between two unconnected parts of the graph. Default 48. */
  componentGap?: number
  /** Passes of reordering, each one down and up. Default 4. */
  sweeps?: number
}

export interface LayeredResult {
  positions: Positions
  /** The layer of each node, counted within its own connected part. */
  layerOf: Map<string, number>
  /** Edges drawn against the flow because they closed a cycle. */
  reversed: Set<string>
  /** The connected parts, each as its layers in drawing order. */
  components: string[][][]
  bounds: Rect | null
}

interface Link {
  from: string
  to: string
}

/** The connected parts of the graph, in the order their first node was added. */
export function connectedComponents(graph: GraphModel): string[][] {
  const seen = new Set<string>()
  const parts: string[][] = []
  for (const node of graph.nodes) {
    if (seen.has(node.id))
      continue
    const part: string[] = []
    const queue = [node.id]
    seen.add(node.id)
    while (queue.length) {
      const id = queue.shift()!
      part.push(id)
      for (const next of graph.neighbours(id)) {
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    parts.push(part)
  }
  // Insertion order inside each part too, so the result does not depend on
  // which node the walk happened to reach first.
  const order = new Map(graph.nodes.map((node, index) => [node.id, index]))
  for (const part of parts)
    part.sort((a, b) => order.get(a)! - order.get(b)!)
  return parts
}

/**
 * The edges that have to be turned round for the graph to have no cycle: the
 * ones a depth-first walk finds leading back to a node it is still inside.
 */
export function findBackEdges(graph: GraphModel): Set<string> {
  const out = new Map<string, Array<{ id: string, to: string }>>()
  for (const node of graph.nodes)
    out.set(node.id, [])
  for (const edge of graph.edges) {
    if (edge.source !== edge.target)
      out.get(edge.source)!.push({ id: edge.id, to: edge.target })
  }

  const reversed = new Set<string>()
  const state = new Map<string, 1 | 2>()
  for (const root of graph.nodes) {
    if (state.has(root.id))
      continue
    // An explicit stack: an object graph can be deeper than the call stack.
    const stack: Array<{ id: string, next: number }> = [{ id: root.id, next: 0 }]
    state.set(root.id, 1)
    while (stack.length) {
      const frame = stack[stack.length - 1]
      const edges = out.get(frame.id)!
      if (frame.next >= edges.length) {
        state.set(frame.id, 2)
        stack.pop()
        continue
      }
      const edge = edges[frame.next++]
      const seen = state.get(edge.to)
      if (seen === 1)
        reversed.add(edge.id)
      else if (seen === undefined) {
        state.set(edge.to, 1)
        stack.push({ id: edge.to, next: 0 })
      }
    }
  }
  return reversed
}

/** Crossings between the links of two neighbouring layers, for a given order. */
function crossings(links: Link[], place: Map<string, number>): number {
  const pairs = links.map(link => [place.get(link.from)!, place.get(link.to)!] as const).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  let count = 0
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      if (pairs[i][0] < pairs[j][0] && pairs[i][1] > pairs[j][1])
        count++
    }
  }
  return count
}

export function layeredLayout(graph: GraphModel, options: LayeredOptions = {}): LayeredResult {
  const direction = options.direction === 'TB' ? 'TB' : 'LR'
  const nodeGap = options.nodeGap ?? 24
  const layerGap = options.layerGap ?? 80
  const componentGap = options.componentGap ?? 48
  const sweeps = options.sweeps ?? 4
  const horizontal = direction === 'LR'

  const reversed = findBackEdges(graph)
  // The acyclic version of the graph: one link per pair, each pointing forward.
  const links: Link[] = []
  const seenLinks = new Set<string>()
  for (const edge of graph.edges) {
    if (edge.source === edge.target)
      continue
    const from = reversed.has(edge.id) ? edge.target : edge.source
    const to = reversed.has(edge.id) ? edge.source : edge.target
    const key = `${from}\u0000${to}`
    if (!seenLinks.has(key)) {
      seenLinks.add(key)
      links.push({ from, to })
    }
  }
  const forward = new Map<string, string[]>()
  const backward = new Map<string, string[]>()
  for (const node of graph.nodes) {
    forward.set(node.id, [])
    backward.set(node.id, [])
  }
  for (const link of links) {
    forward.get(link.from)!.push(link.to)
    backward.get(link.to)!.push(link.from)
  }

  // Longest path: a node goes one layer past its deepest predecessor.
  const layerOf = new Map<string, number>()
  const waiting = new Map<string, number>()
  const ready: string[] = []
  for (const node of graph.nodes) {
    waiting.set(node.id, backward.get(node.id)!.length)
    if (backward.get(node.id)!.length === 0) {
      ready.push(node.id)
      layerOf.set(node.id, 0)
    }
  }
  for (let cursor = 0; cursor < ready.length; cursor++) {
    const id = ready[cursor]
    for (const next of forward.get(id)!) {
      layerOf.set(next, Math.max(layerOf.get(next) ?? 0, layerOf.get(id)! + 1))
      const left = waiting.get(next)! - 1
      waiting.set(next, left)
      if (left === 0)
        ready.push(next)
    }
  }

  const positions: Positions = new Map()
  const components: string[][][] = []
  let offset = 0

  for (const part of connectedComponents(graph)) {
    const layers: string[][] = []
    for (const id of part) {
      const layer = layerOf.get(id) ?? 0
      while (layers.length <= layer)
        layers.push([])
      layers[layer].push(id)
    }

    const inPart = new Set(part)
    const adjacent = links.filter(link => inPart.has(link.from) && layerOf.get(link.to)! - layerOf.get(link.from)! === 1)
    const place = new Map<string, number>()
    const index = (): void => {
      for (const layer of layers)
        layer.forEach((id, position) => place.set(id, layer.length > 1 ? position / (layer.length - 1) : 0.5))
    }
    const reorder = (layer: string[], others: Map<string, string[]>): void => {
      const weight = new Map<string, number>()
      layer.forEach((id, position) => {
        const around = others.get(id)!
        const here = layer.length > 1 ? position / (layer.length - 1) : 0.5
        weight.set(id, around.length ? around.reduce((sum, other) => sum + place.get(other)!, 0) / around.length : here)
      })
      const before = new Map(layer.map((id, position) => [id, position]))
      layer.sort((a, b) => weight.get(a)! - weight.get(b)! || before.get(a)! - before.get(b)!)
      layer.forEach((id, position) => place.set(id, layer.length > 1 ? position / (layer.length - 1) : 0.5))
    }

    index()
    let best = layers.map(layer => [...layer])
    let fewest = crossings(adjacent, place)
    for (let sweep = 0; sweep < sweeps && fewest > 0; sweep++) {
      for (let layer = 1; layer < layers.length; layer++)
        reorder(layers[layer], backward)
      for (let layer = layers.length - 2; layer >= 0; layer--)
        reorder(layers[layer], forward)
      const count = crossings(adjacent, place)
      if (count < fewest) {
        fewest = count
        best = layers.map(layer => [...layer])
      }
    }

    // Along the flow, a layer is as thick as its thickest node. Across it, the
    // nodes are stacked with a gap and the stack is centred on the part's axis.
    const along = (id: string): number => (horizontal ? graph.size(id).width : graph.size(id).height)
    const across = (id: string): number => (horizontal ? graph.size(id).height : graph.size(id).width)
    const extents = best.map(layer => layer.reduce((sum, id) => sum + across(id), 0) + nodeGap * Math.max(0, layer.length - 1))
    const widest = Math.max(0, ...extents)
    let flow = 0
    best.forEach((layer, layerIndex) => {
      const thickness = Math.max(0, ...layer.map(along))
      let cursor = offset + (widest - extents[layerIndex]) / 2
      for (const id of layer) {
        const centre = cursor + across(id) / 2
        positions.set(id, horizontal ? { x: flow + thickness / 2, y: centre } : { x: centre, y: flow + thickness / 2 })
        cursor += across(id) + nodeGap
      }
      flow += thickness + layerGap
    })

    components.push(best)
    offset += widest + componentGap
  }

  return { positions, layerOf, reversed, components, bounds: graph.bounds(positions) }
}
