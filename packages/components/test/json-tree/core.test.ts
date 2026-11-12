import type { TreeNode } from '../../src/ui/json-tree/core'
import { describe, expect, it } from 'bun:test'
import { formatPath, fromValue, isExpandable, isIndexed, previewOf, nodeToJson, nodeToPlain, TreeModel } from '../../src/ui/json-tree/core'

const sample = (): TreeNode => fromValue({
  name: 'Ada',
  tags: ['a', 'b'],
  address: { city: 'London', 'post code': 'N1', geo: { lat: 51.5, lng: -0.1 } },
  active: true,
})
const labels = (model: TreeModel): string[] => model.rows.map(row => (row.isMore ? `+${row.node.more}` : `${'  '.repeat(row.depth)}${row.node.label ?? '$'}`))
const at = (model: TreeModel, label: string): number => model.rows.findIndex(row => row.node.label === label && !row.isMore)

describe('describing a plain value', () => {
  it('tags every kind of value', () => {
    const node = fromValue({ s: 'x', n: 1, b: false, z: null, u: undefined, big: 10n, d: new Date('2026-01-02T03:04:05.000Z'), r: /a+/g, f() {}, sym: Symbol('q') })
    const kinds = Object.fromEntries((node.children ?? []).map(child => [child.label, child.kind]))

    expect(node.kind).toBe('object')
    expect(kinds).toEqual({ s: 'string', n: 'number', b: 'boolean', z: 'null', u: 'undefined', big: 'bigint', d: 'date', r: 'regexp', f: 'function', sym: 'symbol' })
  })

  it('describes arrays, sets and maps', () => {
    const node = fromValue({ list: [1, 2], set: new Set(['a']), map: new Map<unknown, unknown>([['k', 1], [2, 'two']]) })
    const [list, set, map] = node.children as TreeNode[]

    expect(list.kind).toBe('array')
    expect(list.children?.map(child => child.label)).toEqual(['0', '1'])
    expect(set.kind).toBe('set')
    expect(map.kind).toBe('map')
    expect(map.preview).toBe('Map(2)')
    expect(map.children?.map(child => child.label)).toEqual(['k', '2'])
  })

  it('turns a cycle into a reference to the node it points back to', () => {
    const value: Record<string, unknown> = { name: 'loop' }
    value.self = value
    const node = fromValue(value)
    const self = node.children?.[1] as TreeNode

    expect(self.kind).toBe('ref')
    expect(self.ref).toBe(node.id)
    expect(isExpandable(self)).toBe(false)
  })

  it('counts what it leaves out', () => {
    const node = fromValue(Array.from({ length: 50 }, (_, index) => index), undefined, { maxItems: 10 })

    expect(node.children?.length).toBe(10)
    expect(node.more).toBe(40)
  })

  it('stops at the depth it is given', () => {
    const node = fromValue({ a: { b: { c: 1 } } }, undefined, { maxDepth: 2 })
    const b = node.children?.[0].children?.[0] as TreeNode

    expect(b.children).toBeUndefined()
    expect(b.preview).toBe('Object')
  })

  it('names a class instance by its class', () => {
    class Point { x = 1; y = 2 }

    expect(fromValue(new Point()).preview).toBe('Point {2}')
  })
})

describe('one line for a node', () => {
  it('uses the preview it was given', () => {
    expect(previewOf({ kind: 'model', preview: 'User #1' })).toBe('User #1')
  })

  it('makes one for a scalar', () => {
    expect(previewOf({ kind: 'string', value: 'hi' })).toBe('"hi"')
    expect(previewOf({ kind: 'number', value: 4.5 })).toBe('4.5')
    expect(previewOf({ kind: 'bigint', value: 12n })).toBe('12n')
    expect(previewOf({ kind: 'null', value: null })).toBe('null')
    expect(previewOf({ kind: 'string', value: 'x'.repeat(200) }).length).toBeLessThan(90)
  })

  it('counts a container, missing children included', () => {
    expect(previewOf({ kind: 'array', children: [{ kind: 'number', value: 1 }], more: 4 })).toBe('Array(5)')
    expect(previewOf({ kind: 'set', children: [] })).toBe('Set(0)')
    expect(previewOf({ kind: 'object', children: [] })).toBe('{}')
    expect(previewOf({ kind: 'object', children: [{ kind: 'number', value: 1, label: 'a' }] })).toBe('{1}')
  })

  it('says a cycle is one, and falls back to the kind', () => {
    expect(previewOf({ kind: 'ref', ref: 'v1' })).toBe('[Circular]')
    expect(previewOf({ kind: 'promise' })).toBe('promise')
  })
})

describe('a path as text', () => {
  it('dots identifiers, indexes numbers and quotes the rest', () => {
    expect(formatPath([])).toBe('$')
    expect(formatPath(['users', 0, 'name'])).toBe('$.users[0].name')
    expect(formatPath(['first name'])).toBe('$["first name"]')
    expect(formatPath(['a-b', '0', '$ok', '_x'])).toBe('$["a-b"]["0"].$ok._x')
    expect(formatPath(['say "hi"'])).toBe('$["say \\"hi\\""]')
    expect(formatPath(['rows', 2], 'result')).toBe('result.rows[2]')
  })
})

describe('copying a node as JSON', () => {
  it('rebuilds the value from the description', () => {
    expect(nodeToPlain(sample())).toEqual({ name: 'Ada', tags: ['a', 'b'], address: { city: 'London', 'post code': 'N1', geo: { lat: 51.5, lng: -0.1 } }, active: true })
    expect(nodeToJson(fromValue([1, 'two']))).toBe('[\n  1,\n  "two"\n]')
  })

  it('includes what is present and nothing in place of what is not', () => {
    const node = fromValue([1, 2, 3, 4], undefined, { maxItems: 2 })

    expect(node.more).toBe(2)
    expect(nodeToPlain(node)).toEqual([1, 2])
  })

  it('writes what JSON has no word for as text', () => {
    expect(nodeToPlain({ kind: 'bigint', value: 10n })).toBe('10')
    expect(nodeToPlain({ kind: 'number', value: Number.NaN })).toBe('NaN')
    expect(nodeToPlain({ kind: 'number', value: Number.POSITIVE_INFINITY })).toBe('Infinity')
    expect(nodeToPlain({ kind: 'ref', ref: 'v1' })).toBe('[Circular]')
    expect(nodeToPlain({ kind: 'function', preview: 'ƒ go()' })).toBe('ƒ go()')
    expect(nodeToPlain({ kind: 'promise' })).toBeNull()
    expect(nodeToJson({ kind: 'undefined', value: undefined })).toBe('undefined')
  })

  it('keys an object by key before label', () => {
    const node: TreeNode = { kind: 'map', children: [{ kind: 'number', value: 1, label: '"a"', key: 'a' }, { kind: 'number', value: 2 }] }

    expect(nodeToPlain(node)).toEqual({ a: 1, 1: 2 })
    expect(isIndexed(node)).toBe(false)
  })
})

describe('the visible rows', () => {
  it('opens the root and nothing below it by default', () => {
    const model = new TreeModel(sample())

    expect(labels(model)).toEqual(['$', '  name', '  tags', '  address', '  active'])
    expect(model.rows[0]).toMatchObject({ depth: 0, parent: -1, expandable: true, expanded: true, posInSet: 1, setSize: 1 })
    expect(model.rows[2]).toMatchObject({ depth: 1, parent: 0, expandable: true, expanded: false, posInSet: 2, setSize: 4 })
    expect(model.rows[1].expandable).toBe(false)
  })

  it('opens to the depth it is given', () => {
    expect(new TreeModel(sample(), { depth: 0 }).rows.length).toBe(1)
    expect(labels(new TreeModel(sample(), { depth: 2 }))).toEqual(['$', '  name', '  tags', '    0', '    1', '  address', '    city', '    post code', '    geo', '  active'])
  })

  it('shows nothing for no value, and each of several roots', () => {
    expect(new TreeModel(null).rows).toEqual([])
    const model = new TreeModel([fromValue(1, 'a'), fromValue([2], 'b')])

    expect(labels(model)).toEqual(['a', 'b', '  0'])
    expect(model.rows[1]).toMatchObject({ posInSet: 2, setSize: 2 })
  })

  it('toggles a container and bumps its version', () => {
    const model = new TreeModel(sample())
    const before = model.version
    const tags = model.rows[at(model, 'tags')].id

    expect(model.toggle(tags)).toBe(true)
    expect(labels(model)).toEqual(['$', '  name', '  tags', '    0', '    1', '  address', '  active'])
    expect(model.version).toBeGreaterThan(before)
    expect(model.toggle(tags)).toBe(true)
    expect(model.rows.length).toBe(5)
  })

  it('refuses to toggle a leaf or a row that is not there', () => {
    const model = new TreeModel(sample())

    expect(model.toggle(model.rows[at(model, 'name')].id)).toBe(false)
    expect(model.toggle('nope')).toBe(false)
    expect(model.expand(model.rows[0].id)).toBe(false)
  })

  it('remembers a row closed above the default depth', () => {
    const model = new TreeModel(sample(), { depth: 2 })
    const address = model.rows[at(model, 'address')].id
    model.collapse(address)

    expect(labels(model)).toEqual(['$', '  name', '  tags', '    0', '    1', '  address', '  active'])
    model.expand(address)
    expect(at(model, 'geo')).toBeGreaterThan(0)
  })

  it('keeps what was open inside a container that is closed and opened again', () => {
    const model = new TreeModel(sample())
    const address = model.rows[at(model, 'address')].id
    model.expand(address)
    model.expand(model.rows[at(model, 'geo')].id)
    model.collapse(address)
    model.expand(address)

    expect(at(model, 'lat')).toBeGreaterThan(0)
  })

  it('expands everything, or everything under one row', () => {
    const model = new TreeModel(sample())
    model.expandAll(model.rows[at(model, 'address')].id)

    expect(at(model, 'lng')).toBeGreaterThan(0)
    expect(at(model, '0')).toBe(-1)
    model.expandAll()
    expect(model.rows.length).toBe(12)
    model.collapseAll()
    expect(labels(model)).toEqual(['$'])
    model.expand(model.rows[0].id)
    expect(model.rows.length).toBe(5)
  })

  it('finds a row by id', () => {
    const model = new TreeModel(sample())

    expect(model.indexOf(model.rows[3].id)).toBe(3)
    expect(model.indexOf('nope')).toBe(-1)
  })

  it('walks only what is expanded', () => {
    let read = 0
    const leaf = (index: number): TreeNode => ({ kind: 'number', value: index, label: String(index) })
    const hidden: TreeNode = { kind: 'array', label: 'hidden' }
    Object.defineProperty(hidden, 'children', { get: () => { read++; return Array.from({ length: 1000 }, (_, index) => leaf(index)) }, enumerable: true })
    const model = new TreeModel({ kind: 'object', children: [hidden, leaf(1)] })
    read = 0
    model.toggle(model.rows[2].id)
    model.move(0, 'ArrowDown')

    // The closed container is asked whether it has children, never for them all.
    expect(model.rows.length).toBe(3)
    expect(read).toBeLessThanOrEqual(2)
  })
})

describe('paths of rows', () => {
  it('names each row from the value down', () => {
    const model = new TreeModel(sample())
    model.expandAll()

    expect(formatPath(model.pathOf(0))).toBe('$')
    expect(formatPath(model.pathOf(at(model, 'lat')))).toBe('$.address.geo.lat')
    expect(formatPath(model.pathOf(at(model, 'post code')))).toBe('$.address["post code"]')
    expect(model.pathOf(at(model, '1'))).toEqual(['tags', 1])
  })

  it('addresses each of several roots by position', () => {
    const model = new TreeModel([fromValue({ a: 1 }), fromValue({ b: 2 })])

    expect(formatPath(model.pathOf(at(model, 'b')))).toBe('$[1].b')
  })

  it('uses a key when a node brings one', () => {
    const model = new TreeModel({ kind: 'map', children: [{ kind: 'number', value: 1, label: '"a b"', key: 'a b' }] })

    expect(formatPath(model.pathOf(1))).toBe('$["a b"]')
  })
})

describe('children that were not sent', () => {
  const partial = (): TreeNode => ({ kind: 'array', id: 'list', children: [{ kind: 'number', value: 0 }, { kind: 'number', value: 1 }], more: 3 })

  it('stand as one row after the ones that were', () => {
    const model = new TreeModel(partial())
    const more = model.rows[3]

    expect(model.rows.length).toBe(4)
    expect(more).toMatchObject({ isMore: true, id: 'list.+', parent: 0, depth: 1, expandable: false, posInSet: 3, setSize: 3 })
    expect(model.rows[1].setSize).toBe(3)
    expect(model.pathOf(3)).toEqual([])
  })

  it('are added when they arrive', () => {
    const model = new TreeModel(partial())

    expect(model.appendChildren('list', [{ kind: 'number', value: 2 }], 2)).toBe(true)
    expect(model.rows.length).toBe(5)
    expect(model.rows[4].isMore).toBe(true)
    expect(model.appendChildren('list', [{ kind: 'number', value: 3 }, { kind: 'number', value: 4 }])).toBe(true)
    expect(model.rows.length).toBe(6)
    expect(model.rows.some(row => row.isMore)).toBe(false)
    expect(model.appendChildren('nope', [])).toBe(false)
  })

  it('make a container with none shown expandable', () => {
    expect(isExpandable({ kind: 'array', children: [], more: 5 })).toBe(true)
    expect(isExpandable({ kind: 'array', children: [] })).toBe(false)
  })
})

describe('revealing a row', () => {
  it('expands everything above it, wherever it is', () => {
    const value: Record<string, any> = { a: { b: { c: { name: 'deep' } } } }
    value.a.b.c.back = value.a
    const model = new TreeModel(fromValue(value))
    model.expandAll()
    const back = model.rows[at(model, 'back')]
    const target = back.node.ref as string
    model.collapseAll()

    const index = model.reveal(target)
    expect(index).toBe(1)
    expect(model.rows[index].node.label).toBe('a')
    expect(model.reveal('nope')).toBe(-1)
  })

  it('finds a node by a position id as well', () => {
    const model = new TreeModel(sample())
    model.expandAll()
    const lat = model.rows[at(model, 'lat')].id
    model.collapseAll()

    const index = model.reveal(lat)
    expect(model.rows[index].node.label).toBe('lat')
  })
})

describe('keys', () => {
  const open = (): TreeModel => new TreeModel(sample())

  it('move up and down and stop at the ends', () => {
    const model = open()

    expect(model.move(-1, 'ArrowDown')).toEqual({ index: 0, changed: false })
    expect(model.move(0, 'ArrowDown').index).toBe(1)
    expect(model.move(4, 'ArrowDown').index).toBe(4)
    expect(model.move(0, 'ArrowUp').index).toBe(0)
    expect(model.move(2, 'Home').index).toBe(0)
    expect(model.move(2, 'End').index).toBe(4)
    expect(model.move(0, 'PageDown', 3).index).toBe(3)
    expect(model.move(4, 'PageUp', 3).index).toBe(1)
    expect(model.move(1, 'PageUp', 30).index).toBe(0)
  })

  it('right opens a closed container, then steps into it', () => {
    const model = open()
    const tags = at(model, 'tags')

    expect(model.move(tags, 'ArrowRight')).toEqual({ index: tags, changed: true })
    expect(model.move(tags, 'ArrowRight')).toEqual({ index: tags + 1, changed: false })
    expect(model.move(at(model, 'name'), 'ArrowRight')).toEqual({ index: at(model, 'name'), changed: false })
  })

  it('left closes an open container, then steps out to the parent', () => {
    const model = open()
    const tags = at(model, 'tags')
    model.move(tags, 'ArrowRight')

    expect(model.move(tags + 1, 'ArrowLeft')).toEqual({ index: tags, changed: false })
    expect(model.move(tags, 'ArrowLeft')).toEqual({ index: tags, changed: true })
    expect(model.move(tags, 'ArrowLeft')).toEqual({ index: 0, changed: false })
    expect(model.move(0, 'ArrowLeft')).toEqual({ index: 0, changed: true })
    expect(model.move(0, 'ArrowLeft')).toEqual({ index: 0, changed: false })
  })

  it('star opens every sibling', () => {
    const model = open()
    const move = model.move(at(model, 'name'), '*')

    expect(move.changed).toBe(true)
    expect(model.rows[move.index].node.label).toBe('name')
    expect(labels(model)).toEqual(['$', '  name', '  tags', '    0', '    1', '  address', '    city', '    post code', '    geo', '  active'])
    expect(model.move(1, '*').changed).toBe(false)
  })

  it('leave the cursor alone for a key that means nothing, and for an empty tree', () => {
    expect(open().move(2, 'x')).toEqual({ index: 2, changed: false })
    expect(new TreeModel(null).move(0, 'ArrowDown')).toEqual({ index: -1, changed: false })
  })

  it('typing finds the next label that starts with it', () => {
    const model = open()

    expect(model.typeahead(0, 'a')).toBe(at(model, 'address'))
    expect(model.typeahead(at(model, 'address'), 'a')).toBe(at(model, 'active'))
    expect(model.typeahead(at(model, 'active'), 'a')).toBe(at(model, 'address'))
    expect(model.typeahead(at(model, 'address'), 'ad')).toBe(at(model, 'address'))
    expect(model.typeahead(at(model, 'address'), 'ac')).toBe(at(model, 'active'))
    expect(model.typeahead(0, 'T')).toBe(at(model, 'tags'))
    expect(model.typeahead(0, 'zz')).toBe(-1)
    expect(model.typeahead(0, '')).toBe(-1)
  })
})

describe('a large tree', () => {
  it('flattens five thousand nodes in a few milliseconds', () => {
    const big = fromValue(Array.from({ length: 1000 }, (_, index) => ({ id: index, name: `row ${index}`, tags: ['x'] })), undefined, { maxItems: 5000 })
    const model = new TreeModel(big)
    const started = performance.now()
    model.expandAll()
    const took = performance.now() - started

    expect(model.rows.length).toBe(1 + 1000 * 5)
    expect(took).toBeLessThan(100)
  })
})
