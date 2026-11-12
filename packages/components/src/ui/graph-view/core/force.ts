/**
 * A force layout: nodes push each other apart, edges pull their ends together.
 *
 * Fruchterman and Reingold's scheme with a cooling temperature, written over
 * flat arrays. Every pair of nodes is compared on every pass; at a few hundred
 * nodes that is tens of milliseconds, so there is no spatial index to keep
 * correct.
 *
 * It is deterministic: the only randomness is where a node with no position
 * starts, and that comes from a seeded source. Given positions, it starts
 * warm: nodes that already have a place keep it while the new ones find
 * theirs among them, and are then moved only as far as it takes to stop two
 * boxes overlapping. Adding ten nodes to a settled graph nudges the rest
 * instead of throwing everything in the air.
 */
import type { GraphModel, Positions } from './graph'
import { seededRandom } from './graph'

export interface ForceOptions {
  /** Passes over the graph. Default 300 from cold, 80 from warm. */
  iterations?: number
  /** Seeds the starting positions. Default 1. */
  seed?: number
  /** Where nodes already are. Nodes found here start there. */
  positions?: Positions | null
  /** Nodes that must stay where `positions` puts them. */
  pinned?: Iterable<string> | null
  /** The scale of the layout. A typical edge settles at about twice this. Default 90. */
  linkDistance?: number
  /** Clear space kept between two nodes. Default 16. */
  padding?: number
}

/**
 * Every node pushes every other, so in a graph of any size the pushes add up
 * and stretch the edges far past their natural length. Scaled down to this,
 * two hundred nodes settle with edges around twice `linkDistance`.
 */
const REPULSION = 0.15
/** A weak pull to the middle, so unconnected parts do not drift away. */
const GRAVITY = 0.06

export function forceLayout(graph: GraphModel, options: ForceOptions = {}): Positions {
  const nodes = graph.nodes
  const count = nodes.length
  const result: Positions = new Map()
  if (count === 0)
    return result

  const distance = options.linkDistance ?? 90
  const padding = options.padding ?? 16
  const random = seededRandom(options.seed ?? 1)
  const given = options.positions ?? null
  const pinned = new Set(options.pinned ?? [])
  const index = new Map(nodes.map((node, position) => [node.id, position]))

  const x = new Float64Array(count)
  const y = new Float64Array(count)
  const halfWidth = new Float64Array(count)
  const halfHeight = new Float64Array(count)
  const fixed = new Uint8Array(count)
  const placed = new Uint8Array(count)
  /** How much of a step a node takes: all of it when new, none when it already had a place. */
  const mobility = new Float64Array(count).fill(1)
  let known = 0

  nodes.forEach((node, position) => {
    const size = graph.size(node.id)
    halfWidth[position] = size.width / 2
    halfHeight[position] = size.height / 2
    const at = given?.get(node.id)
    if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) {
      x[position] = at.x
      y[position] = at.y
      placed[position] = 1
      fixed[position] = pinned.has(node.id) ? 1 : 0
      mobility[position] = 0
      known++
    }
  })

  // A node with no position starts beside a neighbour that has one, so an
  // expansion grows out of the node it came from. Failing that, on a disc
  // large enough to hold the graph.
  const radius = distance * Math.sqrt(count) * 0.6
  nodes.forEach((node, position) => {
    if (placed[position])
      return
    const anchor = graph.neighbours(node.id).map(id => index.get(id)!).find(other => placed[other])
    const angle = random() * Math.PI * 2
    if (anchor !== undefined) {
      x[position] = x[anchor] + Math.cos(angle) * distance * 0.5
      y[position] = y[anchor] + Math.sin(angle) * distance * 0.5
    }
    else {
      const reach = Math.sqrt(random()) * radius
      x[position] = Math.cos(angle) * reach
      y[position] = Math.sin(angle) * reach
    }
  })
  // Kept apart from `placed`, which the loop above reads: two new nodes must
  // not anchor on each other's guess.
  const settled = Uint8Array.from(placed)

  const warm = known > 0
  const iterations = Math.max(0, options.iterations ?? (warm ? 80 : 300))
  const links: number[] = []
  const seen = new Set<number>()
  for (const edge of graph.edges) {
    const a = index.get(edge.source)!
    const b = index.get(edge.target)!
    if (a === b)
      continue
    const key = a < b ? a * count + b : b * count + a
    if (!seen.has(key)) {
      seen.add(key)
      links.push(a, b)
    }
  }

  const dx = new Float64Array(count)
  const dy = new Float64Array(count)
  const k = distance
  // From warm, the temperature is only what a new node needs to find its place.
  const start = warm ? k * 0.5 : k * 1.5

  for (let pass = 0; pass < iterations; pass++) {
    const temperature = start * (1 - pass / iterations)
    dx.fill(0)
    dy.fill(0)

    for (let a = 0; a < count; a++) {
      for (let b = a + 1; b < count; b++) {
        // Two nodes that both had a place stay as they are to each other;
        // there is nothing to work out between them.
        if (settled[a] && settled[b])
          continue
        let ox = x[a] - x[b]
        let oy = y[a] - y[b]
        let length = Math.sqrt(ox * ox + oy * oy)
        if (length < 0.01) {
          // Exactly on top of each other: part them in a direction that
          // depends only on which two they are.
          const angle = ((a * 31 + b * 17) % 360) * Math.PI / 180
          ox = Math.cos(angle) * 0.01
          oy = Math.sin(angle) * 0.01
          length = 0.01
        }
        // Wide nodes keep more room: the push is measured from their edges.
        const reach = Math.max(1, length - (halfWidth[a] + halfWidth[b]) * 0.5)
        const push = (k * k) * REPULSION / reach / length
        dx[a] += ox * push
        dy[a] += oy * push
        dx[b] -= ox * push
        dy[b] -= oy * push
      }
    }

    for (let link = 0; link < links.length; link += 2) {
      const a = links[link]
      const b = links[link + 1]
      if (settled[a] && settled[b])
        continue
      const ox = x[a] - x[b]
      const oy = y[a] - y[b]
      const length = Math.sqrt(ox * ox + oy * oy) || 0.01
      const rest = (halfWidth[a] + halfWidth[b]) * 0.5
      const stretch = Math.max(0, length - rest)
      const pull = (stretch * stretch) / k / length
      dx[a] -= ox * pull
      dy[a] -= oy * pull
      dx[b] += ox * pull
      dy[b] += oy * pull
    }

    for (let node = 0; node < count; node++) {
      if (fixed[node])
        continue
      if (!settled[node]) {
        dx[node] -= x[node] * GRAVITY
        dy[node] -= y[node] * GRAVITY
      }
      const length = Math.sqrt(dx[node] * dx[node] + dy[node] * dy[node])
      if (length > 0) {
        const step = (Math.min(length, temperature) / length) * mobility[node]
        x[node] += dx[node] * step
        y[node] += dy[node] * step
      }
    }
  }

  separate(x, y, halfWidth, halfHeight, fixed, padding)

  nodes.forEach((node, position) => {
    result.set(node.id, { x: Math.round(x[position] * 100) / 100, y: Math.round(y[position] * 100) / 100 })
  })
  return result
}

/**
 * Push apart any two boxes that still overlap, along whichever axis needs the
 * smaller move. The forces act on centres and know little about a wide label;
 * this is what guarantees two nodes are never drawn over each other.
 */
function separate(x: Float64Array, y: Float64Array, halfWidth: Float64Array, halfHeight: Float64Array, fixed: Uint8Array, padding: number): void {
  const count = x.length
  for (let pass = 0; pass < 40; pass++) {
    let moved = false
    for (let a = 0; a < count; a++) {
      for (let b = a + 1; b < count; b++) {
        const overlapX = halfWidth[a] + halfWidth[b] + padding - Math.abs(x[a] - x[b])
        if (overlapX <= 0)
          continue
        const overlapY = halfHeight[a] + halfHeight[b] + padding - Math.abs(y[a] - y[b])
        if (overlapY <= 0)
          continue
        if (fixed[a] && fixed[b])
          continue
        moved = true
        const shareA = fixed[a] ? 0 : (fixed[b] ? 1 : 0.5)
        const shareB = 1 - shareA
        if (overlapX < overlapY) {
          const sign = x[a] < x[b] || (x[a] === x[b] && a < b) ? -1 : 1
          x[a] += sign * overlapX * shareA
          x[b] -= sign * overlapX * shareB
        }
        else {
          const sign = y[a] < y[b] || (y[a] === y[b] && a < b) ? -1 : 1
          y[a] += sign * overlapY * shareA
          y[b] -= sign * overlapY * shareB
        }
      }
    }
    if (!moved)
      break
  }
}
