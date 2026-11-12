import type { GraphEdge, GraphNode, Positions } from '../../src/ui/graph-view/core'
import { describe, expect, it } from 'bun:test'
import {
  centreOn,
  clampZoom,
  clipToRect,
  connectedComponents,
  edgeIdOf,
  edgeShape,
  findBackEdges,
  fit,
  fitLabel,
  forceLayout,
  GraphModel,
  labelOf,
  layeredLayout,
  nearestInDirection,
  nearestTo,
  nodeAt,
  nodeSize,
  pan,
  parallelOffsets,
  reveal,
  seededRandom,
  selfLoopShape,
  toGraph,
  toScreen,
  zoomAt,
} from '../../src/ui/graph-view/core'

/** A reproducible graph: a spanning tree, plus extra edges, some pointing back. */
function sample(count: number, extra: number, seed = 7): { nodes: GraphNode[], edges: GraphEdge[] } {
  const random = seededRandom(seed)
  const nodes = Array.from({ length: count }, (_, index) => ({ id: `n${index}`, label: `Node ${index}` }))
  const edges: GraphEdge[] = []
  for (let index = 1; index < count; index++)
    edges.push({ source: `n${Math.floor(random() * index)}`, target: `n${index}` })
  for (let index = 0; index < extra; index++) {
    const a = Math.floor(random() * count)
    const b = Math.floor(random() * count)
    if (a !== b)
      edges.push({ source: `n${a}`, target: `n${b}`, label: `e${index}` })
  }
  return { nodes, edges }
}

function overlaps(graph: GraphModel, positions: Positions, tolerance = 0): string[] {
  const ids = [...positions.keys()]
  const found: string[] = []
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      const pa = positions.get(ids[a])!
      const pb = positions.get(ids[b])!
      const sa = graph.size(ids[a])
      const sb = graph.size(ids[b])
      if (Math.abs(pa.x - pb.x) < (sa.width + sb.width) / 2 - tolerance && Math.abs(pa.y - pb.y) < (sa.height + sb.height) / 2 - tolerance)
        found.push(`${ids[a]}/${ids[b]}`)
    }
  }
  return found
}

const plain = (positions: Positions): Record<string, { x: number, y: number }> => Object.fromEntries(positions)

describe('the model', () => {
  it('keeps nodes and edges, and gives an edge an id when it has none', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b', label: 'Bee' }], [{ source: 'a', target: 'b', label: 'knows' }])

    expect(graph.nodeCount).toBe(2)
    expect(graph.edges[0].id).toBe('a->b:knows')
    expect(edgeIdOf({ source: 'a', target: 'b' })).toBe('a->b')
    expect(edgeIdOf({ id: 'x', source: 'a', target: 'b' })).toBe('x')
    expect(labelOf(graph.node('a')!)).toBe('a')
    expect(labelOf(graph.node('b')!)).toBe('Bee')
  })

  it('refuses a duplicate node, a duplicate edge and an edge with a missing end', () => {
    const graph = new GraphModel([{ id: 'a', label: 'first' }, { id: 'b' }])

    expect(graph.addNode({ id: 'a', label: 'second' })).toBe(false)
    expect(graph.node('a')!.label).toBe('first')
    expect(graph.addNode({ id: '' })).toBe(false)
    expect(graph.addEdge({ source: 'a', target: 'b' })).toBe(true)
    expect(graph.addEdge({ source: 'a', target: 'b' })).toBe(false)
    expect(graph.addEdge({ source: 'a', target: 'b', label: 'other' })).toBe(true)
    expect(graph.addEdge({ source: 'a', target: 'nowhere' })).toBe(false)
    expect(graph.edgeCount).toBe(2)
  })

  it('merges an expansion, reporting only what was new', () => {
    const graph = new GraphModel([{ id: 'user' }, { id: 'post' }], [{ source: 'user', target: 'post' }])
    const added = graph.merge(
      [{ id: 'post' }, { id: 'team' }, { id: 'order' }],
      [{ source: 'user', target: 'post' }, { source: 'user', target: 'team' }, { source: 'order', target: 'user' }],
    )

    expect(added).toEqual({ nodes: ['team', 'order'], edges: ['user->team', 'order->user'] })
    expect(graph.nodeCount).toBe(4)
    expect(graph.edgeCount).toBe(3)
  })

  it('knows who is next to whom, either way round, each once', () => {
    const graph = new GraphModel(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }, { source: 'c', target: 'a' }, { source: 'a', target: 'a' }],
    )

    expect(graph.neighbours('a')).toEqual(['b', 'c'])
    expect(graph.degree('a')).toBe(2)
    expect(graph.neighbours('c')).toEqual(['a'])
    expect(graph.neighbours('missing')).toEqual([])
    expect(graph.edgesOf('a').length).toBe(4)
  })

  it('removes a node together with its edges', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }])

    expect(graph.removeNode('b')).toBe(true)
    expect(graph.removeNode('b')).toBe(false)
    expect(graph.edgeCount).toBe(0)
    expect(graph.neighbours('a')).toEqual([])
    expect(graph.removeEdge('nothing')).toBe(false)
  })

  it('sizes a node from its label without measuring anything', () => {
    expect(nodeSize({ id: 'a', label: 'User' })).toEqual({ width: 52, height: 32 })
    expect(nodeSize({ id: 'a', label: 'x' }).width).toBe(48)
    expect(nodeSize({ id: 'a', label: 'x'.repeat(200) }).width).toBe(220)
    expect(nodeSize({ id: 'a', label: 'User', detail: 'users' }).height).toBe(46)
    expect(nodeSize({ id: 'a', label: 'User', expandable: true }).width).toBe(63)
    expect(fitLabel('abcdef', 4)).toBe('abc…')
    expect(fitLabel('abc', 4)).toBe('abc')
  })

  it('resizes a node whose label changes', () => {
    const graph = new GraphModel([{ id: 'a', label: 'User', expandable: true }])

    expect(graph.updateNode('a', { expandable: false })).toBe(true)
    expect(graph.size('a').width).toBe(52)
    expect(graph.node('a')!.id).toBe('a')
    expect(graph.updateNode('zzz', {})).toBe(false)
  })

  it('finds the box around the graph', () => {
    const graph = new GraphModel([{ id: 'a', label: 'User' }, { id: 'b', label: 'User' }])
    const positions: Positions = new Map([['a', { x: 0, y: 0 }], ['b', { x: 100, y: 50 }]])

    expect(graph.bounds(positions)).toEqual({ x: -26, y: -16, width: 152, height: 82 })
    expect(graph.bounds(new Map())).toBeNull()
  })

  it('draws the same random numbers from the same seed', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    const c = seededRandom(43)
    const first = [a(), a(), a()]

    expect([b(), b(), b()]).toEqual(first)
    expect([c(), c(), c()]).not.toEqual(first)
    expect(first.every(value => value >= 0 && value < 1)).toBe(true)
  })
})

describe('the layered layout', () => {
  it('puts a chain in one layer each, left to right', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }])
    const { positions, layerOf } = layeredLayout(graph)

    expect([layerOf.get('a'), layerOf.get('b'), layerOf.get('c')]).toEqual([0, 1, 2])
    expect(positions.get('a')!.x).toBeLessThan(positions.get('b')!.x)
    expect(positions.get('b')!.x).toBeLessThan(positions.get('c')!.x)
    expect(positions.get('a')!.y).toBe(positions.get('b')!.y)
  })

  it('runs top to bottom when asked', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }])
    const { positions } = layeredLayout(graph, { direction: 'TB' })

    expect(positions.get('a')!.y).toBeLessThan(positions.get('b')!.y)
    expect(positions.get('a')!.x).toBe(positions.get('b')!.x)
  })

  it('breaks a cycle by turning one edge round', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }, { source: 'c', target: 'a' }])

    expect([...findBackEdges(graph)]).toEqual(['c->a'])
    expect([...layeredLayout(graph).reversed]).toEqual(['c->a'])
  })

  it('points every edge forward once the cycles are broken', () => {
    const { nodes, edges } = sample(200, 110)
    const graph = new GraphModel(nodes, edges)
    const { layerOf, reversed, positions } = layeredLayout(graph)

    expect(reversed.size).toBeGreaterThan(0)
    for (const edge of graph.edges) {
      const from = reversed.has(edge.id) ? edge.target : edge.source
      const to = reversed.has(edge.id) ? edge.source : edge.target
      expect(layerOf.get(from)!).toBeLessThan(layerOf.get(to)!)
      expect(positions.get(from)!.x).toBeLessThan(positions.get(to)!.x)
    }
  })

  it('overlaps no two nodes, and leaves the gap asked for inside a layer', () => {
    const { nodes, edges } = sample(200, 110)
    const graph = new GraphModel(nodes, edges)
    const { positions, components } = layeredLayout(graph, { nodeGap: 24 })

    expect(positions.size).toBe(200)
    expect(overlaps(graph, positions)).toEqual([])
    for (const layers of components) {
      for (const layer of layers) {
        for (let index = 1; index < layer.length; index++) {
          const above = positions.get(layer[index - 1])!
          const below = positions.get(layer[index])!
          expect(below.y - above.y).toBeCloseTo((graph.size(layer[index - 1]).height + graph.size(layer[index]).height) / 2 + 24)
        }
      }
    }
  })

  it('comes out the same every time', () => {
    const { nodes, edges } = sample(120, 60)

    expect(plain(layeredLayout(new GraphModel(nodes, edges)).positions)).toEqual(plain(layeredLayout(new GraphModel(nodes, edges)).positions))
  })

  it('uncrosses two edges that start out crossed', () => {
    // a and b in one layer, their targets listed the other way round.
    const graph = new GraphModel(
      [{ id: 'a' }, { id: 'b' }, { id: 'y' }, { id: 'x' }],
      [{ source: 'a', target: 'x' }, { source: 'b', target: 'y' }],
    )
    const joined = new GraphModel(
      [{ id: 'root' }, { id: 'a' }, { id: 'b' }, { id: 'y' }, { id: 'x' }],
      [{ source: 'root', target: 'a' }, { source: 'root', target: 'b' }, { source: 'a', target: 'x' }, { source: 'b', target: 'y' }],
    )
    const { positions } = layeredLayout(joined)

    expect(graph.nodeCount).toBe(4)
    expect(positions.get('a')!.y).toBeLessThan(positions.get('b')!.y)
    expect(positions.get('x')!.y).toBeLessThan(positions.get('y')!.y)
  })

  it('lays unconnected parts out beside each other, never on top', () => {
    const graph = new GraphModel(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'alone' }],
      [{ source: 'a', target: 'b' }, { source: 'c', target: 'd' }],
    )
    const { positions, components } = layeredLayout(graph, { componentGap: 48 })

    expect(connectedComponents(graph)).toEqual([['a', 'b'], ['c', 'd'], ['alone']])
    expect(components.length).toBe(3)
    expect(overlaps(graph, positions)).toEqual([])
    expect(positions.get('c')!.y - positions.get('a')!.y).toBe(32 + 48)
    expect(positions.get('alone')!.y - positions.get('c')!.y).toBe(32 + 48)
  })

  it('ignores a self-loop when layering, and survives an empty graph', () => {
    const graph = new GraphModel([{ id: 'a' }], [{ source: 'a', target: 'a' }])

    expect(layeredLayout(graph).layerOf.get('a')).toBe(0)
    expect(layeredLayout(new GraphModel()).positions.size).toBe(0)
    expect(layeredLayout(new GraphModel()).bounds).toBeNull()
  })

  it('walks a chain deeper than the call stack', () => {
    const nodes = Array.from({ length: 20000 }, (_, index) => ({ id: `n${index}` }))
    const edges = nodes.slice(1).map((node, index) => ({ source: `n${index}`, target: node.id }))
    const graph = new GraphModel(nodes, [...edges, { source: 'n19999', target: 'n0' }])

    expect([...findBackEdges(graph)]).toEqual(['n19999->n0'])
  })
})

describe('the force layout', () => {
  it('comes out the same from the same seed, and differently from another', () => {
    const { nodes, edges } = sample(60, 30)
    const first = plain(forceLayout(new GraphModel(nodes, edges), { seed: 3 }))

    expect(plain(forceLayout(new GraphModel(nodes, edges), { seed: 3 }))).toEqual(first)
    expect(plain(forceLayout(new GraphModel(nodes, edges), { seed: 4 }))).not.toEqual(first)
  })

  it('places every node at a finite point, with no two on top of each other', () => {
    const { nodes, edges } = sample(200, 110)
    const graph = new GraphModel(nodes, edges)
    const positions = forceLayout(graph)

    expect(positions.size).toBe(200)
    for (const point of positions.values()) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
    expect(overlaps(graph, positions, 1)).toEqual([])
  })

  it('keeps connected nodes nearer than unconnected ones', () => {
    const { nodes, edges } = sample(80, 0)
    const graph = new GraphModel(nodes, edges)
    const positions = forceLayout(graph)
    const gap = (a: string, b: string): number => Math.hypot(positions.get(a)!.x - positions.get(b)!.x, positions.get(a)!.y - positions.get(b)!.y)
    const linked = graph.edges.reduce((sum, edge) => sum + gap(edge.source, edge.target), 0) / graph.edgeCount
    let all = 0
    let pairs = 0
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        all += gap(nodes[a].id, nodes[b].id)
        pairs++
      }
    }

    expect(linked).toBeLessThan((all / pairs) * 0.5)
  })

  it('starts warm: an expansion moves what was there only a little', () => {
    const { nodes, edges } = sample(100, 40)
    const graph = new GraphModel(nodes, edges)
    const before = forceLayout(graph)
    const span = graph.bounds(before)!

    const more = Array.from({ length: 10 }, (_, index) => ({ id: `new${index}`, label: `New ${index}` }))
    graph.merge(more, more.map(node => ({ source: 'n5', target: node.id })))
    const after = forceLayout(graph, { positions: before })

    const moves = nodes.map(node => Math.hypot(after.get(node.id)!.x - before.get(node.id)!.x, after.get(node.id)!.y - before.get(node.id)!.y)).sort((a, b) => a - b)
    expect(moves[Math.floor(moves.length / 2)]).toBeLessThan(Math.max(span.width, span.height) * 0.05)
    // The new nodes grow out of the node they came from.
    for (const node of more)
      expect(Math.hypot(after.get(node.id)!.x - after.get('n5')!.x, after.get(node.id)!.y - after.get('n5')!.y)).toBeLessThan(Math.max(span.width, span.height) * 0.4)
    expect(overlaps(graph, after, 1)).toEqual([])
  })

  it('leaves a pinned node exactly where it was put', () => {
    const { nodes, edges } = sample(30, 10)
    const graph = new GraphModel(nodes, edges)
    const positions = forceLayout(graph)
    positions.set('n3', { x: 900, y: -700 })

    expect(forceLayout(graph, { positions, pinned: ['n3'] }).get('n3')).toEqual({ x: 900, y: -700 })
  })

  it('parts nodes that start on the same point, and handles the trivial graphs', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    const stacked: Positions = new Map([['a', { x: 0, y: 0 }], ['b', { x: 0, y: 0 }], ['c', { x: 0, y: 0 }]])

    expect(overlaps(graph, forceLayout(graph, { positions: stacked }), 1)).toEqual([])
    expect(overlaps(graph, forceLayout(graph, { positions: stacked, iterations: 0 }), 1)).toEqual([])
    expect(forceLayout(new GraphModel()).size).toBe(0)
    expect(Number.isFinite(forceLayout(new GraphModel([{ id: 'only' }])).get('only')!.x)).toBe(true)
  })
})

describe('the shape of an edge', () => {
  const size = { width: 60, height: 30 }

  it('clips a line to the border of a box', () => {
    expect(clipToRect({ x: 0, y: 0 }, size, { x: 100, y: 0 })).toEqual({ x: 30, y: 0 })
    expect(clipToRect({ x: 0, y: 0 }, size, { x: 0, y: -100 })).toEqual({ x: 0, y: -15 })
    expect(clipToRect({ x: 0, y: 0 }, size, { x: 100, y: 100 })).toEqual({ x: 15, y: 15 })
    expect(clipToRect({ x: 5, y: 5 }, size, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 })
  })

  it('draws a straight edge from border to border, pointing at the target', () => {
    const shape = edgeShape({ source: { x: 0, y: 0 }, sourceSize: size, target: { x: 200, y: 0 }, targetSize: size })

    expect(shape.d).toBe('M 30 0 L 170 0')
    expect(shape.label).toEqual({ x: 100, y: 0 })
    expect(shape.angle).toBe(0)
    expect(edgeShape({ source: { x: 200, y: 0 }, sourceSize: size, target: { x: 0, y: 0 }, targetSize: size }).angle).toBeCloseTo(Math.PI)
  })

  it('stops short of the target to leave room for an arrowhead', () => {
    const shape = edgeShape({ source: { x: 0, y: 0 }, sourceSize: size, target: { x: 200, y: 0 }, targetSize: size }, { inset: 5 })

    expect(shape.end).toEqual({ x: 165, y: 0 })
  })

  it('leaves and enters a layered edge through the sides that face the flow', () => {
    const ends = { source: { x: 0, y: 0 }, sourceSize: size, target: { x: 200, y: 80 }, targetSize: size }
    const across = edgeShape(ends, { curve: 'bezier', direction: 'LR' })
    const down = edgeShape(ends, { curve: 'bezier', direction: 'TB' })

    expect(across.start).toEqual({ x: 30, y: 0 })
    expect(across.end).toEqual({ x: 170, y: 80 })
    expect(across.d.startsWith('M 30 0 C 100 0, 100 80, 170 80')).toBe(true)
    expect(across.label).toEqual({ x: 100, y: 40 })
    expect(across.angle).toBe(0)
    expect(down.start).toEqual({ x: 0, y: 15 })
    expect(down.end).toEqual({ x: 200, y: 65 })
    expect(down.angle).toBeCloseTo(Math.PI / 2)
  })

  it('draws an edge against the flow out of the back of its node', () => {
    const shape = edgeShape({ source: { x: 200, y: 0 }, sourceSize: size, target: { x: 0, y: 0 }, targetSize: size }, { curve: 'bezier', direction: 'LR' })

    expect(shape.start).toEqual({ x: 170, y: 0 })
    expect(shape.end).toEqual({ x: 30, y: 0 })
    expect(shape.angle).toBeCloseTo(Math.PI)
  })

  it('loops an edge from a node back to itself', () => {
    const shape = selfLoopShape({ x: 0, y: 0 }, size)
    const same = edgeShape({ source: { x: 0, y: 0 }, sourceSize: size, target: { x: 0, y: 0 }, targetSize: size })

    expect(shape.start).toEqual({ x: 15, y: -15 })
    expect(shape.end).toEqual({ x: 30, y: -7.5 })
    expect(shape.d).toContain(' C ')
    expect(shape.label.y).toBeLessThan(-15)
    expect(same.d).toBe(shape.d)
    expect(selfLoopShape({ x: 0, y: 0 }, size, 14).label.y).toBeLessThan(shape.label.y)
  })

  it('bows edges that share both ends apart, whichever way each points', () => {
    const graph = new GraphModel([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [
      { source: 'a', target: 'b', label: 'one' },
      { source: 'b', target: 'a', label: 'two' },
      { source: 'a', target: 'c' },
    ])
    const offsets = parallelOffsets(graph.edges, 14)

    expect(offsets.get('a->b:one')).toBe(-7)
    expect(offsets.get('b->a:two')).toBe(7)
    expect(offsets.has('a->c')).toBe(false)

    const ends = { source: { x: 0, y: 0 }, sourceSize: size, target: { x: 200, y: 0 }, targetSize: size }
    const back = { source: ends.target, sourceSize: size, target: ends.source, targetSize: size }
    const one = edgeShape(ends, { offset: -7 })
    const two = edgeShape(back, { offset: 7 })
    expect(one.d).toContain(' Q ')
    expect(one.label.y).toBe(-7)
    expect(two.label.y).toBe(7)
  })
})

describe('the viewport', () => {
  it('converts between the screen and the graph', () => {
    const view = { x: 50, y: 20, k: 2 }

    expect(toScreen(view, { x: 10, y: 10 })).toEqual({ x: 70, y: 40 })
    expect(toGraph(view, { x: 70, y: 40 })).toEqual({ x: 10, y: 10 })
    expect(pan(view, 5, -5)).toEqual({ x: 55, y: 15, k: 2 })
  })

  it('zooms about a point, which stays where it is', () => {
    const view = { x: 50, y: 20, k: 1 }
    const point = { x: 300, y: 200 }
    const before = toGraph(view, point)
    const next = zoomAt(view, point, 2)

    expect(next.k).toBe(2)
    expect(toGraph(next, point)).toEqual(before)
  })

  it('stops zooming at its limits', () => {
    expect(zoomAt({ x: 0, y: 0, k: 1 }, { x: 0, y: 0 }, 100, 0.1, 4).k).toBe(4)
    expect(zoomAt({ x: 0, y: 0, k: 1 }, { x: 0, y: 0 }, 0.001, 0.1, 4).k).toBe(0.1)
    expect(clampZoom(9, 0.5, 2)).toBe(2)
  })

  it('fits a graph into a box, centred, without zooming in past the limit', () => {
    const big = fit({ x: 0, y: 0, width: 2000, height: 1000 }, { width: 1048, height: 548 }, 24)
    const small = fit({ x: 100, y: 100, width: 50, height: 50 }, { width: 800, height: 600 }, 24)

    expect(big.k).toBe(0.5)
    expect(toScreen(big, { x: 1000, y: 500 })).toEqual({ x: 524, y: 274 })
    expect(small.k).toBe(1)
    expect(toScreen(small, { x: 125, y: 125 })).toEqual({ x: 400, y: 300 })
    expect(fit(null, { width: 800, height: 600 })).toEqual({ x: 0, y: 0, k: 1 })
    expect(fit({ x: 0, y: 0, width: 10, height: 10 }, { width: 0, height: 0 })).toEqual({ x: 0, y: 0, k: 1 })
  })

  it('centres on a point at the zoom it has', () => {
    const next = centreOn({ x: 0, y: 0, k: 2 }, { x: 100, y: 50 }, { width: 800, height: 600 })

    expect(next.k).toBe(2)
    expect(toScreen(next, { x: 100, y: 50 })).toEqual({ x: 400, y: 300 })
  })

  it('pans just far enough to show a box, and not at all when it shows', () => {
    const view = { x: 0, y: 0, k: 1 }
    const size = { width: 400, height: 300 }

    expect(reveal(view, { x: 100, y: 100, width: 50, height: 30 }, size)).toBe(view)
    expect(reveal(view, { x: 380, y: 100, width: 50, height: 30 }, size, 16)).toEqual({ x: -46, y: 0, k: 1 })
    expect(reveal(view, { x: -30, y: -40, width: 50, height: 30 }, size, 16)).toEqual({ x: 46, y: 56, k: 1 })
  })
})

describe('moving between nodes with the arrow keys', () => {
  const positions: Positions = new Map([
    ['centre', { x: 0, y: 0 }],
    ['right', { x: 100, y: 10 }],
    ['far-right', { x: 300, y: 0 }],
    ['up', { x: 0, y: -80 }],
    ['down-left', { x: -40, y: 90 }],
    ['diagonal', { x: 60, y: -200 }],
  ])

  it('goes to the nearest node in that direction', () => {
    expect(nearestInDirection(positions, 'centre', 'right')).toBe('right')
    expect(nearestInDirection(positions, 'right', 'right')).toBe('far-right')
    expect(nearestInDirection(positions, 'centre', 'up')).toBe('up')
    expect(nearestInDirection(positions, 'centre', 'down')).toBe('down-left')
    expect(nearestInDirection(positions, 'far-right', 'left')).toBe('right')
  })

  it('prefers a node straight ahead to a closer one off to the side', () => {
    const fork: Positions = new Map([['from', { x: 0, y: 0 }], ['ahead', { x: 120, y: 0 }], ['aside', { x: 60, y: 55 }]])

    expect(nearestInDirection(fork, 'from', 'right')).toBe('ahead')
  })

  it('stays put at the edge of the graph', () => {
    expect(nearestInDirection(positions, 'far-right', 'right')).toBeNull()
    expect(nearestInDirection(positions, 'centre', 'left')).toBeNull()
    expect(nearestInDirection(positions, 'missing', 'left')).toBeNull()
  })

  it('finds the node nearest a point, and the one under it', () => {
    const graph = new GraphModel([{ id: 'centre' }, { id: 'right' }])

    expect(nearestTo(positions, { x: 90, y: 0 })).toBe('right')
    expect(nearestTo(new Map(), { x: 0, y: 0 })).toBeNull()
    expect(nodeAt(graph, positions, { x: 110, y: 15 })).toBe('right')
    expect(nodeAt(graph, positions, { x: 50, y: 60 })).toBeNull()
  })
})

describe('how long the layouts take', () => {
  it('lays out 200 nodes well inside a few hundred milliseconds', () => {
    const { nodes, edges } = sample(200, 100)
    const graph = new GraphModel(nodes, edges)

    let started = performance.now()
    layeredLayout(graph)
    const layered = performance.now() - started
    started = performance.now()
    forceLayout(graph)
    const force = performance.now() - started

    console.log(`[graph-view core, bun] 200 nodes, ${graph.edgeCount} edges: layered ${layered.toFixed(1)} ms, force ${force.toFixed(1)} ms`)
    expect(layered).toBeLessThan(200)
    expect(force).toBeLessThan(600)
  })
})
