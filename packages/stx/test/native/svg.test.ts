/**
 * Vector drawing on native screens (`svg.ts`).
 *
 * The translator kept an `svg`'s box and dropped its shapes, so a chart, a
 * route map or a progress ring on a native screen was an empty rectangle and a
 * screen that had one could not go native at all. Shapes are now IR nodes,
 * and their outline reaches the renderers as one list of absolute commands -
 * the only thing a renderer has to replay.
 */
import { describe, expect, it } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { parseSvgMarkup } from '../../src/native/compiler/svg'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { CLOSE, CUBIC, LINE, MOVE, pathGeometry, svgAnimation, svgGeometry } from '../../src/native/compiler/svg'
import type { STXNode } from '../../src/native/compiler/ir'
import { createNativeHost, type NativeNode } from '../../src/native/runtime/native-host'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'

/** The end point of every command, in order: what the outline passes through. */
function ends(geometry: number[]): Array<[number, number] | 'Z'> {
  const out: Array<[number, number] | 'Z'> = []
  for (let i = 0; i < geometry.length;) {
    const op = geometry[i]
    const size = op === MOVE || op === LINE ? 2 : op === CUBIC ? 6 : op === 3 ? 4 : 0
    if (op === CLOSE) out.push('Z')
    else out.push([geometry[i + size - 1], geometry[i + size]])
    i += size + 1
  }
  return out
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01
}

describe('path data', () => {
  it('turns relative and shorthand commands absolute', () => {
    expect(ends(pathGeometry('M10 10 l5 0 h5 v5 H0 V0 z'))).toEqual([[10, 10], [15, 10], [20, 10], [20, 15], [0, 15], [0, 0], 'Z'])
  })

  it('reads the pairs after a move as line-tos, relative ones too', () => {
    expect(pathGeometry('M0 0 10 10 20 0')).toEqual([MOVE, 0, 0, LINE, 10, 10, LINE, 20, 0])
    expect(pathGeometry('m5 5 10 0')).toEqual([MOVE, 5, 5, LINE, 15, 5])
  })

  it('reads numbers written without separators', () => {
    expect(pathGeometry('M0-5L.5.5')).toEqual([MOVE, 0, -5, LINE, 0.5, 0.5])
  })

  it('reflects the last control point for S and T', () => {
    const smooth = pathGeometry('M0 0 C10 0 20 10 20 20 S30 40 40 40')
    // The reflection of (20,10) about (20,20) is (20,30).
    expect(smooth.slice(11, 13)).toEqual([20, 30])
    const quad = pathGeometry('M0 0 Q10 10 20 0 T40 0')
    expect(quad.slice(9, 11)).toEqual([30, -10])
  })

  it('draws an arc as curves that end where the arc does', () => {
    // A quarter circle of radius 10 from (10,0) to (0,10) around the origin.
    const arc = pathGeometry('M10 0 A10 10 0 0 1 0 10')
    expect(arc[3]).toBe(CUBIC)
    const end = ends(arc).at(-1) as [number, number]
    expect(end).toEqual([0, 10])
    // Its midpoint lies on the circle: the curve is an arc, not a chord.
    const c = arc.slice(4, 10)
    const midX = 0.125 * 10 + 0.375 * c[0] + 0.375 * c[2] + 0.125 * c[4]
    const midY = 0.125 * 0 + 0.375 * c[1] + 0.375 * c[3] + 0.125 * c[5]
    expect(close(Math.hypot(midX, midY), 10)).toBe(true)
  })

  it('reads arc flags written run together', () => {
    expect(ends(pathGeometry('M0 0a5 5 0 1010 0')).at(-1)).toEqual([10, 0])
  })

  it('stops at malformed data, as a browser does', () => {
    expect(pathGeometry('M0 0 L10')).toEqual([MOVE, 0, 0])
    expect(pathGeometry('')).toEqual([])
  })
})

describe('shapes', () => {
  it('line, polyline and polygon', () => {
    expect(svgGeometry('Line', { x1: 0, y1: 150, x2: 320, y2: 150 })).toEqual([MOVE, 0, 150, LINE, 320, 150])
    expect(svgGeometry('Polyline', { points: '0,0 10,5 20,0' })).toEqual([MOVE, 0, 0, LINE, 10, 5, LINE, 20, 0])
    expect(svgGeometry('Polygon', { points: '0 0 10 0 5 5' })?.at(-1)).toBe(CLOSE)
  })

  it('rect, square and rounded', () => {
    expect(ends(svgGeometry('Rect', { x: 2, y: 3, width: 10, height: 4 })!)).toEqual([[2, 3], [12, 3], [12, 7], [2, 7], 'Z'])
    const rounded = svgGeometry('Rect', { x: 0, y: 0, width: 10, height: 10, rx: 50 })!
    // rx is capped at half the width: a circle, starting at the top middle.
    expect(rounded.slice(0, 3)).toEqual([MOVE, 5, 0])
    expect(svgGeometry('Rect', { x: 0, y: 0, width: 0, height: 4 })).toEqual([])
  })

  it('circle and ellipse', () => {
    const circle = svgGeometry('Circle', { cx: 5, cy: 5, r: 5 })!
    expect(ends(circle)).toEqual([[10, 5], [5, 10], [0, 5], [5, 0], [10, 5], 'Z'])
    expect(svgGeometry('Ellipse', { cx: 0, cy: 0, rx: 0, ry: 2 })).toEqual([])
  })

  it('has none for a container', () => {
    expect(svgGeometry('G', {})).toBeNull()
    expect(svgGeometry('Svg', {})).toBeNull()
  })
})

describe('paint classes', () => {
  it('compile fill, stroke and stroke width, with dark variants apart', () => {
    const { style, dark } = compileClassStyles('stroke-slate-200 dark:stroke-slate-800 fill-none stroke-2')
    expect(style).toMatchObject({ stroke: '#e2e8f0', fill: 'none', strokeWidth: 2 })
    expect(dark).toMatchObject({ stroke: '#1e293b' })
  })
})

/** Every node in a tree, flattened. */
function walk(node: STXNode): STXNode[] {
  return [node, ...node.children.filter((child): child is STXNode => typeof child !== 'string').flatMap(walk)]
}

describe('the translator', () => {
  const CHART = `<div>
    <svg viewBox="0 0 320 180" class="w-full" role="img" aria-label="Fitness">
      <title>Fitness</title>
      <defs><linearGradient id="g"><stop offset="0" /></linearGradient></defs>
      <line x1="0" y1="150" x2="320" y2="150" class="stroke-slate-200 dark:stroke-slate-800" stroke-width="1" />
      <line :x1="chart.todayX" :x2="chart.todayX" y1="0" y2="180" stroke-dasharray="2 3" />
      <g fill="none" stroke-linecap="round">
        <path :d="chart.ctl" d="M0 10 L320 20" class="stroke-blue-600" stroke-width="2" />
        <rect x="0" y="160" width="4" height="10" rx="1" />
      </g>
      <text x="0" y="178" font-size="10">Sep</text>
    </svg>
  </div>`

  it('keeps the shapes, in order, as drawing nodes', async () => {
    const { root } = await translateHtmlToIR(CHART)
    const svg = walk(root).find(node => node.type === 'Svg')!
    expect(svg.children.map(child => (child as STXNode).type)).toEqual(['Line', 'Line', 'G', 'SvgText'])
    expect(svg.props.viewBox).toEqual([0, 0, 320, 180])
    expect(svg.props.accessibilityLabel ?? svg.props['aria-label']).toBe('Fitness')
  })

  it('carries each outline as commands, and its bindings', async () => {
    const { root } = await translateHtmlToIR(CHART)
    const nodes = walk(root)
    const [axis, today] = nodes.filter(node => node.type === 'Line')
    expect(axis.props.geometry).toEqual([MOVE, 0, 150, LINE, 320, 150])
    expect(axis.props.strokeWidth).toBe(1)
    expect(axis.style).toMatchObject({ stroke: '#e2e8f0' })
    expect(today.props.strokeDasharray).toEqual([2, 3])
    expect(today.bindings).toMatchObject({ x1: 'chart.todayX', x2: 'chart.todayX' })
    const path = nodes.find(node => node.type === 'Path')!
    expect(path.props.geometry).toEqual([MOVE, 0, 10, LINE, 320, 20])
    expect(path.bindings).toMatchObject({ d: 'chart.ctl' })
    const group = nodes.find(node => node.type === 'G')!
    expect(group.props).toMatchObject({ fill: 'none', strokeLinecap: 'round' })
    const label = nodes.find(node => node.type === 'SvgText')!
    expect(label.children).toEqual(['Sep'])
    expect(label.props).toMatchObject({ x: 0, y: 178, fontSize: 10 })
  })

  it('drops what it does not draw yet, and says so', async () => {
    const { root, diagnostics } = await translateHtmlToIR(CHART)
    const types = walk(root).map(node => node.type)
    expect(types).not.toContain('Text')
    expect(diagnostics).toContainEqual({ kind: 'dropped-subtree', tag: 'defs' })
  })

  it('sizes an icon from its width and height attributes', async () => {
    const { root } = await translateHtmlToIR('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14" /></svg>')
    expect(root.type).toBe('Svg')
    expect(root.style).toMatchObject({ width: 24, height: 24 })
    expect(root.props).toMatchObject({ fill: 'none', stroke: 'currentColor' })
    expect((root.children[0] as STXNode).props.geometry).toEqual([MOVE, 5, 12, LINE, 19, 12])
  })

  it('leaves text outside a drawing alone', async () => {
    const { root } = await translateHtmlToIR('<div><span>a</span><text>plain</text></div>')
    expect(root.children.map(child => (child as STXNode).type)).toEqual(['Text', 'Text'])
  })
})

describe('animation', () => {
  it('keeps an animated outline as keyframes, at its key times', async () => {
    const { root } = await translateHtmlToIR('<svg viewBox="0 0 128 128"><path d="M0 0 L1 1" stroke-width="7"><animate attributeName="d" dur="2.4s" repeatCount="indefinite" values="M0 0 L1 1;M0 0 L5 9;M0 0 L1 1" keyTimes="0;0.25;1" /></path></svg>')
    const path = root.children[0] as STXNode
    expect(path.type).toBe('Path')
    const animate = path.children[0] as STXNode
    expect(animate.type).toBe('Animate')
    expect(animate.props).toMatchObject({ attributeName: 'd', repeatCount: 'indefinite', duration: 2.4, frameTimes: [0, 0.25, 1] })
    expect(animate.props.frames).toEqual([[MOVE, 0, 0, LINE, 1, 1], [MOVE, 0, 0, LINE, 5, 9], [MOVE, 0, 0, LINE, 1, 1]])
  })

  it('spreads frames evenly without usable key times, and plays nothing it cannot', () => {
    expect(svgAnimation({ attributeName: 'd', dur: '300ms', values: 'M0 0L1 1; M0 0L2 2; M0 0L3 3', keyTimes: '0;1' })?.frameTimes).toEqual([0, 0.5, 1])
    expect(svgAnimation({ attributeName: 'd', dur: '300ms', values: 'M0 0L1 1;M0 0L2 2' })?.duration).toBe(0.3)
    // Not path data, one frame, no duration: the shape stays still.
    expect(svgAnimation({ attributeName: 'cx', dur: '1s', values: '1;2' })).toBeNull()
    expect(svgAnimation({ attributeName: 'd', dur: '1s', values: 'M0 0L1 1' })).toBeNull()
    expect(svgAnimation({ attributeName: 'd', dur: 'indefinite', values: 'M0 0L1 1;M0 0L2 2' })).toBeNull()
  })

  it('sends new keyframes when bound values change, and none when they go', () => {
    const batches: NativeMutationOperation[][] = []
    const host = createNativeHost({ send: ops => batches.push(ops), schedule: () => {} })
    const svg: NativeNode = host.adopt({ __stxId: 's1' }, 'Svg')
    const path: NativeNode = host.adopt({ __stxId: 'p1' }, 'Path', svg, { props: { d: 'M0 0 L1 1' }, style: {}, events: {}, children: [] })
    const animate: NativeNode = host.adopt({ __stxId: 'a1' }, 'Animate', path, { props: { attributeName: 'd', dur: '1s' }, style: {}, events: {}, children: [] })
    host.snapshot(svg)
    host.setAttribute(animate, 'values', 'M0 0 L1 1;M0 0 L4 4')
    host.flush()
    const update = batches.flat().find(op => op.op === 'updateNode' && op.id === 'a1') as any
    expect(update.patch.props).toMatchObject({ frames: [[MOVE, 0, 0, LINE, 1, 1], [MOVE, 0, 0, LINE, 4, 4]], frameTimes: [0, 1], duration: 1 })
    host.removeAttribute(animate, 'values')
    host.flush()
    const cleared = batches.flat().filter(op => op.op === 'updateNode' && op.id === 'a1').at(-1) as any
    expect(cleared.patch.props).toMatchObject({ frames: null, frameTimes: null, duration: null })
  })
})

describe('the native host', () => {
  function harness() {
    const batches: NativeMutationOperation[][] = []
    const host = createNativeHost({ send: ops => batches.push(ops), schedule: () => {} })
    return { host, ops: () => batches.flat() }
  }

  it('sends a new outline when a bound attribute changes', () => {
    const { host, ops } = harness()
    const svg: NativeNode = host.adopt({ __stxId: 's1' }, 'Svg')
    const path: NativeNode = host.adopt({ __stxId: 'p1' }, 'Path', svg, { props: { d: 'M0 0 L1 1' }, style: {}, events: {}, children: [] })
    host.snapshot(svg)
    host.setAttribute(path, 'd', 'M0 0 L5 5')
    host.flush()
    const update = ops().find(op => op.op === 'updateNode' && op.id === 'p1') as any
    expect(update.patch.props.geometry).toEqual([MOVE, 0, 0, LINE, 5, 5])
  })

  it('reads a bound dash pattern and a kebab-case width', () => {
    const { host, ops } = harness()
    const line: NativeNode = host.adopt({ __stxId: 'l1' }, 'Line', null, { props: { x1: 0, y1: 0, x2: 1, y2: 0 }, style: {}, events: {}, children: [] })
    host.snapshot(line)
    host.setAttribute(line, 'stroke-dasharray', '4 2')
    host.setAttribute(line, 'x2', 9)
    host.flush()
    const props = ops().filter(op => op.op === 'updateNode').map((op: any) => op.patch.props)
    expect(props).toContainEqual({ strokeDasharray: [4, 2] })
    expect(props.find(patch => 'geometry' in patch)?.geometry).toEqual([MOVE, 0, 0, LINE, 9, 0])
  })

  it('turns runtime SVG markup into native nodes and replaces it reactively', () => {
    const { host, ops } = harness()
    const root: NativeNode = host.adopt({ __stxId: 'root' }, 'View')
    host.snapshot(root)

    host.setMarkup(root, '<svg viewBox="0 0 10 10"><path d="M0 0 L2 2" /><circle cx="5" cy="5" r="2" /></svg>')
    host.flush()
    const first = ops()
    expect(first.filter(op => op.op === 'createNode').map((op: any) => op.node.type)).toEqual(['Svg', 'Path', 'Circle'])
    expect(first.find((op: any) => op.op === 'createNode' && op.node.type === 'Path').node.props.geometry)
      .toEqual([MOVE, 0, 0, LINE, 2, 2])

    host.setMarkup(root, '<svg viewBox="0 0 10 10"><line x1="0" y1="1" x2="9" y2="1" /></svg>')
    host.flush()
    const second = ops().slice(first.length)
    expect(second.some(op => op.op === 'removeNode')).toBe(true)
    expect(second.filter(op => op.op === 'createNode').map((op: any) => op.node.type)).toEqual(['Svg', 'Line'])
  })

  it('parses the same SVG shape vocabulary as inline translation', () => {
    const [root] = parseSvgMarkup('<svg width="24" height="24" viewBox="0 0 24 24"><polyline points="0,1 2,3" /></svg>')
    expect(root.type).toBe('Svg')
    expect(root.style).toMatchObject({ width: 24, height: 24 })
    expect((root.children[0] as STXNode).type).toBe('Polyline')
    expect((root.children[0] as STXNode).props.geometry).toEqual([MOVE, 0, 1, LINE, 2, 3])
  })
})
