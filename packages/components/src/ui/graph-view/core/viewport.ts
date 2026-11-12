/**
 * Where the graph is on screen: a pan and a zoom. No DOM.
 *
 * A point on screen is the graph point times `k`, plus `x` and `y`.
 */
import type { GraphModel, Point, Positions, Rect, Size } from './graph'

export interface Viewport {
  x: number
  y: number
  k: number
}

export type Heading = 'left' | 'right' | 'up' | 'down'

export const identityViewport: Viewport = { x: 0, y: 0, k: 1 }

export function clampZoom(k: number, min: number, max: number): number {
  return Math.min(Math.max(k, min), max)
}

export function toScreen(view: Viewport, point: Point): Point {
  return { x: point.x * view.k + view.x, y: point.y * view.k + view.y }
}

export function toGraph(view: Viewport, point: Point): Point {
  return { x: (point.x - view.x) / view.k, y: (point.y - view.y) / view.k }
}

export function pan(view: Viewport, dx: number, dy: number): Viewport {
  return { x: view.x + dx, y: view.y + dy, k: view.k }
}

/** Zoom by a factor, keeping the graph point under a screen point where it is. */
export function zoomAt(view: Viewport, point: Point, factor: number, min = 0.1, max = 4): Viewport {
  const k = clampZoom(view.k * factor, min, max)
  const ratio = k / view.k
  return { x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio, k }
}

/**
 * The view that shows all of `bounds` in a box of `size`, centred, with
 * `padding` clear on every side. It never zooms in past `max`, so a graph of
 * three nodes is not blown up to fill the window.
 */
export function fit(bounds: Rect | null, size: Size, padding = 24, min = 0.1, max = 1): Viewport {
  if (!bounds || size.width <= 0 || size.height <= 0)
    return { ...identityViewport }
  const roomX = Math.max(1, size.width - padding * 2)
  const roomY = Math.max(1, size.height - padding * 2)
  const k = clampZoom(Math.min(roomX / Math.max(1, bounds.width), roomY / Math.max(1, bounds.height)), min, max)
  return {
    x: size.width / 2 - (bounds.x + bounds.width / 2) * k,
    y: size.height / 2 - (bounds.y + bounds.height / 2) * k,
    k,
  }
}

/** The view with a graph point in the middle of the box, at the same zoom. */
export function centreOn(view: Viewport, point: Point, size: Size): Viewport {
  return { x: size.width / 2 - point.x * view.k, y: size.height / 2 - point.y * view.k, k: view.k }
}

/** The smallest pan that brings a graph box fully inside the screen box. */
export function reveal(view: Viewport, box: Rect, size: Size, margin = 16): Viewport {
  const left = box.x * view.k + view.x
  const top = box.y * view.k + view.y
  const right = left + box.width * view.k
  const bottom = top + box.height * view.k
  let dx = 0
  let dy = 0
  if (left < margin)
    dx = margin - left
  else if (right > size.width - margin)
    dx = size.width - margin - right
  if (top < margin)
    dy = margin - top
  else if (bottom > size.height - margin)
    dy = size.height - margin - bottom
  return dx === 0 && dy === 0 ? view : pan(view, dx, dy)
}

/**
 * The node an arrow key moves to: the nearest one that way, where a node
 * straight ahead beats a closer one off to the side. Null at the edge of the
 * graph.
 */
export function nearestInDirection(positions: Positions, from: string, heading: Heading): string | null {
  const origin = positions.get(from)
  if (!origin)
    return null
  const ux = heading === 'left' ? -1 : heading === 'right' ? 1 : 0
  const uy = heading === 'up' ? -1 : heading === 'down' ? 1 : 0

  let best: string | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (const [id, point] of positions) {
    if (id === from)
      continue
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    const ahead = dx * ux + dy * uy
    if (ahead <= 0.5)
      continue
    const aside = Math.abs(dx * uy) + Math.abs(dy * ux)
    // Nothing more than about 63 degrees off the heading counts as "that way".
    if (aside > ahead * 2)
      continue
    const score = ahead + aside * 2
    if (score < bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}

/** The node whose centre is nearest a graph point. For a first focus. */
export function nearestTo(positions: Positions, point: Point): string | null {
  let best: string | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const [id, at] of positions) {
    const distance = (at.x - point.x) ** 2 + (at.y - point.y) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = id
    }
  }
  return best
}

/** The node box under a graph point, the one added last when two overlap. */
export function nodeAt(graph: GraphModel, positions: Positions, point: Point): string | null {
  let hit: string | null = null
  for (const [id, at] of positions) {
    const size = graph.size(id)
    if (Math.abs(point.x - at.x) <= size.width / 2 && Math.abs(point.y - at.y) <= size.height / 2)
      hit = id
  }
  return hit
}
