/**
 * Vector drawing for native screens: `<svg>` and the shapes inside it.
 *
 * The translator used to keep an `svg`'s box and drop everything in it, on the
 * grounds that the IR had no way to say "a path". That left every chart, route
 * map and progress ring on a native screen as an empty rectangle - a screen
 * with a fitness chart could not go native at all.
 *
 * The shapes now become IR nodes of their own (`Svg`, `G`, `Path`, `Line`,
 * `Rect`, `Circle`, `Ellipse`, `Polyline`, `Polygon`, `SvgText`), so a `:for`
 * over bars or a `:d` bound to a signal is reactive through the ordinary
 * mutation protocol. What a renderer would otherwise have to understand three
 * times over - path data with its relative commands, smooth curves and
 * elliptical arcs, and the seven shape elements - is reduced here, once, to a
 * single flat list of absolute commands in viewBox units:
 *
 *   0 x y            move to
 *   1 x y            line to
 *   2 x1 y1 x2 y2 x y  cubic curve to
 *   3 x1 y1 x y      quadratic curve to
 *   4                close
 *
 * carried as the shape's `geometry` prop. A renderer replays it, scaled from
 * the `Svg`'s viewBox to its frame, and paints it with the fill and stroke the
 * shape inherits down the tree. The compiler sets `geometry` for the
 * attributes a template writes; the native host recomputes it whenever a bound
 * attribute changes.
 *
 * @module native/compiler/svg
 */

/** An element inside `<svg>`, by tag, to the IR type that draws it. */
export const SVG_TYPES: Record<string, string> = {
  svg: 'Svg',
  g: 'G',
  path: 'Path',
  line: 'Line',
  rect: 'Rect',
  circle: 'Circle',
  ellipse: 'Ellipse',
  polyline: 'Polyline',
  polygon: 'Polygon',
  text: 'SvgText',
  tspan: 'SvgText',
}

/** Every IR type a vector drawing is made of. */
export const SVG_NODE_TYPES = new Set(Object.values(SVG_TYPES))

/** The types `geometry` is computed for. */
export const SVG_SHAPE_TYPES = new Set(['Path', 'Line', 'Rect', 'Circle', 'Ellipse', 'Polyline', 'Polygon'])

/**
 * Elements inside `<svg>` that are not drawn: definitions, metadata, and what
 * the renderers do not implement yet (gradients, masks, clips, markers). Their
 * subtree is dropped and reported, rather than drawn wrong.
 */
export const SVG_DROPPED = new Set([
  'defs', 'title', 'desc', 'metadata', 'style', 'symbol', 'use', 'clippath', 'mask',
  'lineargradient', 'radialgradient', 'stop', 'pattern', 'marker', 'filter', 'foreignobject',
])

/**
 * SVG attribute names in the camel case the renderers read. The HTML parser
 * lowercases `viewBox`, and a template writes `stroke-width`; both arrive as
 * the one spelling.
 */
export const SVG_PROP_NAMES = [
  'viewBox', 'preserveAspectRatio', 'strokeWidth', 'strokeDasharray', 'strokeDashoffset',
  'strokeLinecap', 'strokeLinejoin', 'strokeMiterlimit', 'strokeOpacity', 'fillOpacity',
  'fillRule', 'vectorEffect', 'textAnchor', 'dominantBaseline', 'fontSize', 'fontWeight',
] as const

/** The attributes `geometry` is read from, per shape. */
export const SVG_GEOMETRY_ATTRIBUTES: Record<string, readonly string[]> = {
  Path: ['d'],
  Line: ['x1', 'y1', 'x2', 'y2'],
  Rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  Circle: ['cx', 'cy', 'r'],
  Ellipse: ['cx', 'cy', 'rx', 'ry'],
  Polyline: ['points'],
  Polygon: ['points'],
}

export const MOVE = 0
export const LINE = 1
export const CUBIC = 2
export const QUAD = 3
export const CLOSE = 4

function num(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** `"0 0 320 180"` (or with commas) to four numbers, or null. */
export function parseViewBox(value: unknown): [number, number, number, number] | null {
  if (Array.isArray(value) && value.length === 4 && value.every(item => Number.isFinite(Number(item))))
    return value.map(Number) as [number, number, number, number]
  const parts = String(value ?? '').trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part)) || parts[2] <= 0 || parts[3] <= 0)
    return null
  return parts as [number, number, number, number]
}

/** `"1,2 3,4"` to [1, 2, 3, 4]. An odd count drops the last coordinate. */
function parsePoints(value: unknown): number[] {
  const list = String(value ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite)
  return list.length % 2 ? list.slice(0, -1) : list
}

const COMMAND = /[MLHVCSQTAZ]/i
const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

/** Path data split into commands and their numbers, flags included. */
function tokenize(d: string): Array<{ command: string, args: number[] }> {
  const commands: Array<{ command: string, args: number[] }> = []
  let rest = d
  let match = COMMAND.exec(rest)
  while (match) {
    const start = match.index
    rest = rest.slice(start)
    const command = rest[0]
    rest = rest.slice(1)
    const next = COMMAND.exec(rest)
    const body = next ? rest.slice(0, next.index) : rest
    let args: number[]
    if (command === 'A' || command === 'a') {
      // Arc flags may be written without separators: "a1 1 0 011 1".
      args = []
      let i = 0
      const text = body.trim()
      let position = 0
      while (position < text.length) {
        const slot = i % 7
        const remaining = text.slice(position).replace(/^[\s,]+/, '')
        position = text.length - remaining.length
        if (!remaining) break
        if (slot === 3 || slot === 4) {
          args.push(remaining[0] === '1' ? 1 : 0)
          position += 1
        }
        else {
          NUMBER.lastIndex = 0
          const found = NUMBER.exec(remaining)
          if (!found || found.index !== 0) break
          args.push(Number.parseFloat(found[0]))
          position += found[0].length
        }
        i++
      }
    }
    else {
      args = (body.match(NUMBER) || []).map(Number.parseFloat)
    }
    commands.push({ command, args })
    match = next
  }
  return commands
}

/**
 * An elliptical arc, endpoint form, as cubic curves (SVG 1.1 F.6.5 to the
 * centre form, then one cubic per quarter turn at most).
 */
function arcToCubics(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  rotation: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number,
): number[] {
  if (x1 === x2 && y1 === y2) return []
  let rx = Math.abs(rxIn)
  let ry = Math.abs(ryIn)
  if (!rx || !ry) return [LINE, x2, y2]
  const phi = rotation * Math.PI / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  let factor = Math.sqrt(Math.max(0, numerator / denominator))
  if (largeArc === sweep) factor = -factor
  const cxp = factor * (rx * y1p) / ry
  const cyp = factor * -(ry * x1p) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1
    const dot = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))
    return sign * Math.acos(Math.min(1, Math.max(-1, dot)))
  }
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  if (sweep && delta < 0) delta += 2 * Math.PI

  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)))
  const step = delta / segments
  const k = 4 / 3 * Math.tan(step / 4)
  const out: number[] = []
  const point = (t: number) => {
    const ex = rx * Math.cos(t)
    const ey = ry * Math.sin(t)
    return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]
  }
  const derivative = (t: number) => {
    const ex = -rx * Math.sin(t)
    const ey = ry * Math.cos(t)
    return [cos * ex - sin * ey, sin * ex + cos * ey]
  }
  let t = theta1
  for (let i = 0; i < segments; i++) {
    const t2 = t + step
    const [px1, py1] = point(t)
    const [dx1, dy1] = derivative(t)
    const [px2, py2] = point(t2)
    const [dx2, dy2] = derivative(t2)
    out.push(CUBIC, px1 + k * dx1, py1 + k * dy1, px2 - k * dx2, py2 - k * dy2, i === segments - 1 ? x2 : px2, i === segments - 1 ? y2 : py2)
    t = t2
  }
  return out
}

/** Path data to absolute commands. Unknown or malformed parts end the path, as a browser does. */
export function pathGeometry(d: string): number[] {
  const out: number[] = []
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  // The last control point, for S and T.
  let cubicX = 0
  let cubicY = 0
  let quadX = 0
  let quadY = 0
  let previous = ''

  for (const { command, args } of tokenize(String(d ?? ''))) {
    const relative = command === command.toLowerCase()
    const upper = command.toUpperCase()
    const ox = () => (relative ? x : 0)
    const oy = () => (relative ? y : 0)
    let i = 0
    const take = (count: number) => {
      if (i + count > args.length) return null
      const slice = args.slice(i, i + count)
      i += count
      return slice
    }
    if (upper === 'Z') {
      out.push(CLOSE)
      x = startX
      y = startY
      previous = 'Z'
      continue
    }
    let first = true
    while (i < args.length || (first && upper === 'Z')) {
      switch (upper) {
        case 'M': {
          const a = take(2)
          if (!a) return out
          x = a[0] + ox()
          y = a[1] + oy()
          if (first) {
            out.push(MOVE, x, y)
            startX = x
            startY = y
          }
          else {
            // Pairs after the first are implicit line-tos.
            out.push(LINE, x, y)
          }
          previous = first ? 'M' : 'L'
          break
        }
        case 'L': {
          const a = take(2)
          if (!a) return out
          x = a[0] + ox()
          y = a[1] + oy()
          out.push(LINE, x, y)
          previous = 'L'
          break
        }
        case 'H': {
          const a = take(1)
          if (!a) return out
          x = a[0] + ox()
          out.push(LINE, x, y)
          previous = 'L'
          break
        }
        case 'V': {
          const a = take(1)
          if (!a) return out
          y = a[0] + oy()
          out.push(LINE, x, y)
          previous = 'L'
          break
        }
        case 'C': {
          const a = take(6)
          if (!a) return out
          const x1 = a[0] + ox()
          const y1 = a[1] + oy()
          cubicX = a[2] + ox()
          cubicY = a[3] + oy()
          x = a[4] + ox()
          y = a[5] + oy()
          out.push(CUBIC, x1, y1, cubicX, cubicY, x, y)
          previous = 'C'
          break
        }
        case 'S': {
          const a = take(4)
          if (!a) return out
          const x1 = previous === 'C' ? 2 * x - cubicX : x
          const y1 = previous === 'C' ? 2 * y - cubicY : y
          cubicX = a[0] + ox()
          cubicY = a[1] + oy()
          x = a[2] + ox()
          y = a[3] + oy()
          out.push(CUBIC, x1, y1, cubicX, cubicY, x, y)
          previous = 'C'
          break
        }
        case 'Q': {
          const a = take(4)
          if (!a) return out
          quadX = a[0] + ox()
          quadY = a[1] + oy()
          x = a[2] + ox()
          y = a[3] + oy()
          out.push(QUAD, quadX, quadY, x, y)
          previous = 'Q'
          break
        }
        case 'T': {
          const a = take(2)
          if (!a) return out
          quadX = previous === 'Q' ? 2 * x - quadX : x
          quadY = previous === 'Q' ? 2 * y - quadY : y
          x = a[0] + ox()
          y = a[1] + oy()
          out.push(QUAD, quadX, quadY, x, y)
          previous = 'Q'
          break
        }
        case 'A': {
          const a = take(7)
          if (!a) return out
          const endX = a[5] + ox()
          const endY = a[6] + oy()
          out.push(...arcToCubics(x, y, a[0], a[1], a[2], a[3], a[4], endX, endY))
          x = endX
          y = endY
          previous = 'A'
          break
        }
        default:
          return out
      }
      first = false
    }
  }
  return out.map(value => round(value))
}

/** The four quarter-ellipse cubics around (cx, cy). */
function ellipseGeometry(cx: number, cy: number, rx: number, ry: number): number[] {
  if (rx <= 0 || ry <= 0) return []
  const k = 0.5522847498
  return [
    MOVE, cx + rx, cy,
    CUBIC, cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry,
    CUBIC, cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy,
    CUBIC, cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry,
    CUBIC, cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy,
    CLOSE,
  ].map(round)
}

/**
 * A shape's outline as absolute commands, from its attributes. Null for a
 * type that has none (`Svg`, `G`, `SvgText`).
 */
export function svgGeometry(type: string, props: Record<string, unknown>): number[] | null {
  switch (type) {
    case 'Path':
      return pathGeometry(String(props.d ?? ''))
    case 'Line':
      return [MOVE, num(props.x1), num(props.y1), LINE, num(props.x2), num(props.y2)].map(round)
    case 'Rect': {
      const x = num(props.x)
      const y = num(props.y)
      const width = num(props.width)
      const height = num(props.height)
      if (width <= 0 || height <= 0) return []
      let rx = props.rx === undefined ? num(props.ry) : num(props.rx)
      let ry = props.ry === undefined ? rx : num(props.ry)
      rx = Math.min(Math.max(0, rx), width / 2)
      ry = Math.min(Math.max(0, ry), height / 2)
      if (!rx || !ry)
        return [MOVE, x, y, LINE, x + width, y, LINE, x + width, y + height, LINE, x, y + height, CLOSE].map(round)
      const k = 0.5522847498
      return [
        MOVE, x + rx, y,
        LINE, x + width - rx, y,
        CUBIC, x + width - rx + k * rx, y, x + width, y + ry - k * ry, x + width, y + ry,
        LINE, x + width, y + height - ry,
        CUBIC, x + width, y + height - ry + k * ry, x + width - rx + k * rx, y + height, x + width - rx, y + height,
        LINE, x + rx, y + height,
        CUBIC, x + rx - k * rx, y + height, x, y + height - ry + k * ry, x, y + height - ry,
        LINE, x, y + ry,
        CUBIC, x, y + ry - k * ry, x + rx - k * rx, y, x + rx, y,
        CLOSE,
      ].map(round)
    }
    case 'Circle':
      return ellipseGeometry(num(props.cx), num(props.cy), num(props.r), num(props.r))
    case 'Ellipse':
      return ellipseGeometry(num(props.cx), num(props.cy), num(props.rx), num(props.ry))
    case 'Polyline':
    case 'Polygon': {
      const points = parsePoints(props.points)
      if (points.length < 4) return []
      const out: number[] = [MOVE, points[0], points[1]]
      for (let i = 2; i < points.length; i += 2) out.push(LINE, points[i], points[i + 1])
      if (type === 'Polygon') out.push(CLOSE)
      return out.map(round)
    }
    default:
      return null
  }
}

/** Whether changing `attribute` on a `type` node changes its outline. */
export function affectsGeometry(type: string, attribute: string): boolean {
  return SVG_GEOMETRY_ATTRIBUTES[type]?.includes(attribute) ?? false
}
