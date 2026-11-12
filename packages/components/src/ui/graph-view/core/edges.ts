/**
 * The shape of an edge between two node boxes. No DOM: the answer is a path
 * string and a few points, which the view writes into an SVG.
 */
import type { Point, ResolvedEdge, Size } from './graph'

export type EdgeCurve = 'straight' | 'bezier'

export interface EdgeEnds {
  source: Point
  sourceSize: Size
  target: Point
  targetSize: Size
}

export interface EdgeShapeOptions {
  /** `bezier` leaves and enters through the sides facing the flow. Default `straight`. */
  curve?: EdgeCurve
  /** The flow of a layered layout, which decides the sides a bezier uses. */
  direction?: 'LR' | 'TB'
  /** Sideways shift, for one of several edges between the same two nodes. */
  offset?: number
  /** Stop this far short of the target, to leave room for an arrowhead. */
  inset?: number
}

export interface EdgeShape {
  /** An SVG path. */
  d: string
  start: Point
  end: Point
  /** Where a label goes: the middle of the path. */
  label: Point
  /** The direction the edge arrives from, in radians. An arrowhead points this way. */
  angle: number
}

const round = (value: number): number => Math.round(value * 100) / 100
const at = (point: Point): string => `${round(point.x)} ${round(point.y)}`

/**
 * Where the line from a box's centre towards a point leaves the box.
 * The centre itself when the point is the centre.
 */
export function clipToRect(centre: Point, size: Size, towards: Point): Point {
  const dx = towards.x - centre.x
  const dy = towards.y - centre.y
  if (dx === 0 && dy === 0)
    return { x: centre.x, y: centre.y }
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : (size.width / 2) / Math.abs(dx)
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : (size.height / 2) / Math.abs(dy)
  const scale = Math.min(scaleX, scaleY)
  return { x: centre.x + dx * scale, y: centre.y + dy * scale }
}

function pullBack(end: Point, from: Point, inset: number): Point {
  const dx = end.x - from.x
  const dy = end.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  if (inset <= 0 || length <= inset)
    return end
  return { x: end.x - (dx / length) * inset, y: end.y - (dy / length) * inset }
}

/** An edge from a node to itself: a loop off its top right corner. */
export function selfLoopShape(centre: Point, size: Size, offset = 0): EdgeShape {
  const reach = 26 + Math.abs(offset)
  const start = { x: centre.x + size.width / 4, y: centre.y - size.height / 2 }
  const end = { x: centre.x + size.width / 2, y: centre.y - size.height / 4 }
  const one = { x: start.x, y: start.y - reach }
  const two = { x: end.x + reach, y: end.y }
  return {
    d: `M ${at(start)} C ${at(one)}, ${at(two)}, ${at(end)}`,
    start,
    end,
    label: cubicAt(start, one, two, end, 0.5),
    angle: Math.atan2(end.y - two.y, end.x - two.x),
  }
}

function cubicAt(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}

export function edgeShape(ends: EdgeEnds, options: EdgeShapeOptions = {}): EdgeShape {
  const { source, sourceSize, target, targetSize } = ends
  const offset = options.offset ?? 0
  const inset = options.inset ?? 0

  if (source.x === target.x && source.y === target.y)
    return selfLoopShape(source, sourceSize, offset)

  if (options.curve === 'bezier') {
    // Out of the side that faces the target along the flow, into the side that
    // faces back, with the handles pulled along the flow so the curve leaves
    // and arrives square to the boxes.
    const horizontal = options.direction !== 'TB'
    const sign = (horizontal ? target.x - source.x : target.y - source.y) >= 0 ? 1 : -1
    const start = horizontal
      ? { x: source.x + sign * sourceSize.width / 2, y: source.y }
      : { x: source.x, y: source.y + sign * sourceSize.height / 2 }
    const tip = horizontal
      ? { x: target.x - sign * targetSize.width / 2, y: target.y }
      : { x: target.x, y: target.y - sign * targetSize.height / 2 }
    const span = Math.abs(horizontal ? tip.x - start.x : tip.y - start.y)
    const handle = Math.max(span / 2, 24) * sign
    const end = horizontal ? { x: tip.x - sign * inset, y: tip.y } : { x: tip.x, y: tip.y - sign * inset }
    const one = horizontal ? { x: start.x + handle, y: start.y + offset } : { x: start.x + offset, y: start.y + handle }
    const two = horizontal ? { x: end.x - handle, y: end.y + offset } : { x: end.x + offset, y: end.y - handle }
    return {
      d: `M ${at(start)} C ${at(one)}, ${at(two)}, ${at(end)}`,
      start,
      end,
      label: cubicAt(start, one, two, end, 0.5),
      angle: Math.atan2(end.y - two.y, end.x - two.x),
    }
  }

  const start = clipToRect(source, sourceSize, target)
  const tip = clipToRect(target, targetSize, source)
  if (offset === 0) {
    const end = pullBack(tip, start, inset)
    return {
      d: `M ${at(start)} L ${at(end)}`,
      start,
      end,
      label: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      angle: Math.atan2(end.y - start.y, end.x - start.x),
    }
  }

  // One of several between the same pair: bowed to one side. The normal is
  // taken from the pair in a fixed order, so A to B and B to A bow apart
  // instead of onto each other.
  const flip = source.x < target.x || (source.x === target.x && source.y < target.y) ? 1 : -1
  const dx = (target.x - source.x) * flip
  const dy = (target.y - source.y) * flip
  const length = Math.sqrt(dx * dx + dy * dy) || 1
  const control = { x: (start.x + tip.x) / 2 + (-dy / length) * offset * 2, y: (start.y + tip.y) / 2 + (dx / length) * offset * 2 }
  const end = pullBack(tip, control, inset)
  return {
    d: `M ${at(start)} Q ${at(control)}, ${at(end)}`,
    start,
    end,
    label: { x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x, y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y },
    angle: Math.atan2(end.y - control.y, end.x - control.x),
  }
}

/**
 * A sideways shift for each edge that shares its two ends with another, so
 * they are drawn beside each other. An edge alone between its nodes gets none.
 */
export function parallelOffsets(edges: readonly ResolvedEdge[], spacing = 14): Map<string, number> {
  const groups = new Map<string, ResolvedEdge[]>()
  for (const edge of edges) {
    const key = edge.source < edge.target ? `${edge.source}\u0000${edge.target}` : `${edge.target}\u0000${edge.source}`
    const group = groups.get(key)
    if (group)
      group.push(edge)
    else
      groups.set(key, [edge])
  }

  const offsets = new Map<string, number>()
  for (const group of groups.values()) {
    if (group.length < 2)
      continue
    group.forEach((edge, position) => {
      const shift = (position - (group.length - 1) / 2) * spacing
      // A self-loop grows outwards instead of sideways.
      offsets.set(edge.id, edge.source === edge.target ? position * spacing : shift)
    })
  }
  return offsets
}
