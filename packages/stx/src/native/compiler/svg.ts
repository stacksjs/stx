import type { STXNode, STXStyle } from './ir'

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

/**
 * Parse an SVG fragment that arrived at runtime into the same IR used for
 * inline SVG. This deliberately has no DOM or Bun dependency: native screens
 * run in JavaScriptCore, where the markup often came from an API response.
 */
export function parseSvgMarkup(markup: string): STXNode[] {
  type Frame = { tag: string, node?: STXNode, dropped: boolean }
  const roots: STXNode[] = []
  const stack: Frame[] = []
  let cursor = 0

  const decode = (value: string): string => value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, '\'')
    .replace(/&amp;/g, '&')

  const camel = (name: string): string => {
    const lower = name.toLowerCase()
    const known: Record<string, string> = {
      viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio',
      'stroke-width': 'strokeWidth', 'stroke-dasharray': 'strokeDasharray',
      'stroke-dashoffset': 'strokeDashoffset', 'stroke-linecap': 'strokeLinecap',
      'stroke-linejoin': 'strokeLinejoin', 'stroke-miterlimit': 'strokeMiterlimit',
      'stroke-opacity': 'strokeOpacity', 'fill-opacity': 'fillOpacity',
      'fill-rule': 'fillRule', 'vector-effect': 'vectorEffect',
      'text-anchor': 'textAnchor', 'dominant-baseline': 'dominantBaseline',
      'font-size': 'fontSize', 'font-weight': 'fontWeight',
    }
    return known[lower] ?? lower.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
  }

  const valueOf = (name: string, value: string): unknown => {
    const decoded = decode(value)
    if (name === 'viewBox') return parseViewBox(decoded) ?? decoded
    if (name === 'strokeDasharray') return decoded.split(/[\s,]+/).map(Number).filter(Number.isFinite)
    if (/^(?:[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)$/i.test(decoded.trim()))
      return Number(decoded)
    return decoded
  }

  const styleOf = (value: string): STXStyle => {
    const style: STXStyle = {}
    const styleRecord = style as Record<string, unknown>
    for (const declaration of decode(value).split(';')) {
      const separator = declaration.indexOf(':')
      if (separator < 1) continue
      const name = camel(declaration.slice(0, separator).trim())
      const raw = declaration.slice(separator + 1).trim()
      styleRecord[name] = /^-?(?:\d+\.?\d*|\.\d+)$/.test(raw) ? Number(raw) : raw
    }
    return style
  }

  const attributesOf = (source: string): { props: Record<string, unknown>, style: STXStyle, classes: string } => {
    const props: Record<string, unknown> = {}
    const style: STXStyle = {}
    let classes = ''
    const attribute = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g
    let match: RegExpExecArray | null
    while ((match = attribute.exec(source))) {
      const rawName = match[1].toLowerCase()
      const rawValue = match[2] ?? match[3] ?? match[4] ?? ''
      if (rawName === 'class') { classes = decode(rawValue); continue }
      if (rawName === 'style') { Object.assign(style, styleOf(rawValue)); continue }
      if (rawName === 'data-native' || rawName.startsWith('data-stx-')) continue
      props[camel(rawName)] = valueOf(camel(rawName), rawValue)
    }
    return { props, style, classes }
  }

  const endOfTag = (start: number): number => {
    let quote = ''
    for (let i = start; i < markup.length; i++) {
      const character = markup[i]
      if (quote) { if (character === quote) quote = ''; continue }
      if (character === '"' || character === '\'') { quote = character; continue }
      if (character === '>') return i
    }
    return markup.length - 1
  }

  const append = (node: STXNode): void => {
    const parent = stack[stack.length - 1]
    if (parent?.node && !parent.dropped) parent.node.children.push(node)
    else if (!parent) roots.push(node)
  }

  while (cursor < markup.length) {
    const open = markup.indexOf('<', cursor)
    if (open === -1) {
      const text = decode(markup.slice(cursor)).replace(/\s+/g, ' ')
      if (text.trim() && stack[stack.length - 1]?.node && !stack[stack.length - 1].dropped)
        stack[stack.length - 1].node!.children.push(text)
      break
    }
    if (open > cursor) {
      const text = decode(markup.slice(cursor, open)).replace(/\s+/g, ' ')
      if (text.trim() && stack[stack.length - 1]?.node && !stack[stack.length - 1].dropped)
        stack[stack.length - 1].node!.children.push(text)
    }
    const close = endOfTag(open + 1)
    const token = markup.slice(open + 1, close).trim()
    cursor = close + 1
    if (!token || token.startsWith('!') || token.startsWith('?')) continue
    if (token.startsWith('/')) {
      const tag = token.slice(1).trim().toLowerCase()
      while (stack.length) {
        const frame = stack.pop()!
        if (frame.tag === tag) break
      }
      continue
    }

    const selfClosing = token.endsWith('/')
    const source = selfClosing ? token.slice(0, -1).trim() : token
    const name = source.match(/^([^\s/>]+)/)?.[1]?.toLowerCase()
    if (!name) continue
    const parentDropped = stack[stack.length - 1]?.dropped ?? false
    const type = SVG_TYPES[name]
    const dropped = parentDropped || SVG_DROPPED.has(name) || !type
    if (dropped) {
      if (!selfClosing) stack.push({ tag: name, dropped: true })
      continue
    }

    const parsed = attributesOf(source.slice(name.length))
    const node = {
      type,
      props: parsed.props,
      style: parsed.style,
      events: {},
      children: [],
      _inlineStyle: { ...parsed.style },
    } as STXNode
    if (parsed.classes) node._classes = parsed.classes
    if (type === 'Svg') {
      for (const axis of ['width', 'height'] as const) {
        if (typeof node.props[axis] === 'number' && node.style[axis] === undefined)
          node.style[axis] = node.props[axis]
        delete node.props[axis]
      }
    }
    const geometry = svgGeometry(type, node.props)
    if (geometry) node.props.geometry = geometry
    append(node)
    if (!selfClosing) stack.push({ tag: name, node, dropped: false })
  }
  return roots
}
