import type { TreeNode } from '../../src/ui/json-tree/core'
import type { TinkerValue } from '../../src/ui/json-tree/tinker'
import { describe, expect, it } from 'bun:test'
import { formatPath, nodeToPlain, TreeModel } from '../../src/ui/json-tree/core'
import { fromTinkerValue } from '../../src/ui/json-tree/tinker'

const child = (node: TreeNode, label: string): TreeNode => node.children?.find(entry => entry.label === label) as TreeNode
const str = (v: string): TinkerValue => ({ t: 'string', v })
const num = (v: number): TinkerValue => ({ t: 'number', v })

describe('scalars', () => {
  it('keeps the value and writes it on one line', () => {
    const cases: Array<[TinkerValue, Partial<TreeNode>]> = [
      [{ t: 'undefined' }, { kind: 'undefined', preview: 'undefined', value: undefined }],
      [{ t: 'null' }, { kind: 'null', preview: 'null', value: null }],
      [{ t: 'boolean', v: true }, { kind: 'boolean', preview: 'true', value: true }],
      [{ t: 'number', v: 42 }, { kind: 'number', preview: '42', value: 42 }],
      [{ t: 'bigint', v: '900' }, { kind: 'bigint', preview: '900n', value: '900' }],
      [{ t: 'string', v: 'hi' }, { kind: 'string', preview: '"hi"', value: 'hi' }],
      [{ t: 'symbol', v: 'tag' }, { kind: 'symbol', preview: 'Symbol(tag)' }],
      [{ t: 'date', v: '2026-01-02T03:04:05.000Z' }, { kind: 'date', preview: '2026-01-02T03:04:05.000Z', value: '2026-01-02T03:04:05.000Z' }],
      [{ t: 'date', v: null }, { kind: 'date', preview: 'Invalid Date', value: null }],
      [{ t: 'regexp', v: '/a+/g' }, { kind: 'regexp', preview: '/a+/g' }],
      [{ t: 'url', v: 'https://example.com/' }, { kind: 'url', preview: 'https://example.com/' }],
      [{ t: 'promise' }, { kind: 'promise', preview: 'Promise' }],
    ]

    for (const [value, expected] of cases)
      expect(fromTinkerValue(value)).toMatchObject(expected)
  })

  it('reads the numbers JSON cannot carry', () => {
    expect(Number.isNaN(fromTinkerValue({ t: 'number', v: 'NaN' }).value)).toBe(true)
    expect(fromTinkerValue({ t: 'number', v: 'Infinity' }).value).toBe(Number.POSITIVE_INFINITY)
    expect(fromTinkerValue({ t: 'number', v: '-Infinity' }).value).toBe(Number.NEGATIVE_INFINITY)
    expect(Object.is(fromTinkerValue({ t: 'number', v: '-0' }).value, -0)).toBe(true)
    expect(fromTinkerValue({ t: 'number', v: '-0' }).preview).toBe('-0')
  })

  it('says how much of a cut string is missing, and keeps what came', () => {
    const node = fromTinkerValue({ t: 'string', v: 'abc', truncated: 500 })

    expect(node.preview).toBe('"abc" (500 more characters)')
    expect(node.value).toBe('abc')
  })

  it('shortens a long string on its line but not in its value', () => {
    const node = fromTinkerValue(str('x'.repeat(5000)))

    expect((node.preview as string).length).toBeLessThan(130)
    expect((node.value as string).length).toBe(5000)
  })

  it('names each kind of function', () => {
    expect(fromTinkerValue({ t: 'function', name: 'go', kind: 'function' }).preview).toBe('ƒ go()')
    expect(fromTinkerValue({ t: 'function', name: 'load', kind: 'async' }).preview).toBe('async ƒ load()')
    expect(fromTinkerValue({ t: 'function', name: 'each', kind: 'generator' }).preview).toBe('ƒ* each()')
    expect(fromTinkerValue({ t: 'function', name: 'User', kind: 'class' }).preview).toBe('class User')
  })

  it('shows bytes as their type, length and leading hex', () => {
    expect(fromTinkerValue({ t: 'bytes', ctor: 'Uint8Array', length: 2, hex: 'cafe' }).preview).toBe('Uint8Array(2) <cafe>')
    expect(fromTinkerValue({ t: 'bytes', ctor: 'Buffer', length: 900, hex: 'cafe' }).preview).toBe('Buffer(900) <cafe…>')
  })

  it('carries the label it is given', () => {
    expect(fromTinkerValue(num(1), 'result').label).toBe('result')
    expect('label' in fromTinkerValue(num(1))).toBe(false)
  })

  it('shows a tag it does not know instead of dropping it', () => {
    expect(fromTinkerValue({ t: 'temporal' } as unknown as TinkerValue)).toMatchObject({ kind: 'unknown', preview: 'temporal' })
  })
})

describe('containers', () => {
  it('numbers the items of an array and keeps its id', () => {
    const node = fromTinkerValue({ t: 'array', id: 3, length: 2, items: [num(1), str('b')] })

    expect(node).toMatchObject({ id: 't3', kind: 'array', preview: 'Array(2)' })
    expect(node.children?.map(entry => entry.label)).toEqual(['0', '1'])
    expect(nodeToPlain(node)).toEqual([1, 'b'])
  })

  it('names a typed or subclassed array, and counts what was cut', () => {
    const node = fromTinkerValue({ t: 'array', id: 1, ctor: 'Collection', length: 500, items: [num(1)], more: 499 })

    expect(node.preview).toBe('Collection(500)')
    expect(node.more).toBe(499)
  })

  it('summarizes an object by its first keys', () => {
    const entries = ['a', 'b', 'c', 'd', 'e', 'f'].map(key => [key, num(1)] as [string, TinkerValue])

    expect(fromTinkerValue({ t: 'object', id: 1, entries: entries.slice(0, 2) }).preview).toBe('{a, b}')
    expect(fromTinkerValue({ t: 'object', id: 1, entries }).preview).toBe('{a, b, c, d, e, …}')
    expect(fromTinkerValue({ t: 'object', id: 1, entries: [] }).preview).toBe('{}')
    expect(fromTinkerValue({ t: 'object', id: 1, ctor: 'Point', entries: entries.slice(0, 1), more: 9 })).toMatchObject({ preview: 'Point {a, …}', more: 9 })
    expect(fromTinkerValue({ t: 'object', id: 1, ctor: 'Object', entries: [] }).preview).toBe('{}')
  })

  it('names a map entry by a scalar key and shows both sides of any other', () => {
    const node = fromTinkerValue({
      t: 'map',
      id: 1,
      size: 3,
      entries: [
        [str('first name'), num(1)],
        [num(7), str('seven')],
        [{ t: 'object', id: 2, entries: [['x', num(1)]] }, str('by object')],
      ],
    })
    const model = new TreeModel(node)

    expect(node.preview).toBe('Map(3)')
    expect(node.children?.map(entry => entry.label)).toEqual(['"first name"', '7', '2'])
    expect(formatPath(model.pathOf(1))).toBe('$["first name"]')
    expect(node.children?.[2]).toMatchObject({ kind: 'entry', preview: '{x} => "by object"' })
    expect(node.children?.[2].children?.map(entry => entry.label)).toEqual(['key', 'value'])
  })

  it('numbers the items of a set', () => {
    const node = fromTinkerValue({ t: 'set', id: 4, size: 9, items: [str('a')], more: 8 })

    expect(node).toMatchObject({ id: 't4', kind: 'set', preview: 'Set(9)', more: 8 })
    expect(nodeToPlain(node)).toEqual(['a'])
  })

  it('says why a container was cut', () => {
    expect(fromTinkerValue({ t: 'cut', reason: 'depth', ctor: 'Array' })).toMatchObject({ kind: 'cut', preview: 'Array … (too deep to show)' })
    expect(fromTinkerValue({ t: 'cut', reason: 'nodes' }).preview).toBe('Object … (result too large to show)')
  })
})

describe('cycles', () => {
  const loop: TinkerValue = { t: 'object', id: 1, entries: [['name', str('loop')], ['child', { t: 'object', id: 2, entries: [['parent', { t: 'ref', id: 1 }]] }]] }

  it('point at the node that carries the serializer id', () => {
    const node = fromTinkerValue(loop)
    const back = child(child(node, 'child'), 'parent')

    expect(back).toMatchObject({ kind: 'ref', ref: 't1', preview: '[Circular]' })
    expect(node.id).toBe('t1')
  })

  it('can be followed in a tree', () => {
    const model = new TreeModel(fromTinkerValue(loop), { depth: 0 })

    expect(model.rows.length).toBe(1)
    expect(model.reveal('t2')).toBe(2)
    expect(model.reveal('t1')).toBe(0)
  })

  it('take a prefix so two results do not share ids', () => {
    const node = fromTinkerValue(loop, undefined, { idPrefix: 'run7-' })

    expect(node.id).toBe('run7-1')
    expect(child(child(node, 'child'), 'parent').ref).toBe('run7-1')
  })
})

describe('models', () => {
  const user: TinkerValue = {
    t: 'model',
    id: 1,
    model: 'User',
    table: 'users',
    primaryKey: 'id',
    key: num(7),
    attributes: [['id', num(7)], ['email', str('ada@example.com')]],
    hidden: ['password'],
    loaded: [['posts', { t: 'array', id: 2, length: 1, items: [{ t: 'model', id: 3, model: 'Post', key: str('abc'), attributes: [['title', str('Hello')]] }] }]],
    relations: [{ kind: 'hasMany', model: 'Post', name: 'posts' }, { kind: 'belongsTo', model: 'Team' }],
    more: 2,
  }

  it('show the model, its key and its attributes', () => {
    const node = fromTinkerValue(user)

    expect(node).toMatchObject({ id: 't1', kind: 'model', preview: 'User #7', more: 2, openable: 'graph' })
    expect(node.meta).toEqual({ model: 'User', table: 'users', primaryKey: 'id', hidden: ['password'], relations: [{ kind: 'hasMany', model: 'Post', name: 'posts' }, { kind: 'belongsTo', model: 'Team' }] })
    expect(node.children?.map(entry => entry.label)).toEqual(['id', 'email', 'posts', '[hidden]', '[relations]'])
    expect(child(node, 'email').value).toBe('ada@example.com')
  })

  it('show loaded relations as values, and mark them', () => {
    const posts = child(fromTinkerValue(user), 'posts')

    expect(posts).toMatchObject({ kind: 'array', openable: 'table' })
    expect(posts.children?.[0].preview).toBe('Post #abc')
  })

  it('name hidden attributes without their values', () => {
    const hidden = child(fromTinkerValue(user), '[hidden]')

    expect(hidden).toMatchObject({ kind: 'hidden', preview: 'password' })
    expect(hidden.children?.map(entry => entry.value)).toEqual(['password'])
  })

  it('list the relations the model declares', () => {
    const relations = child(fromTinkerValue(user), '[relations]')

    expect(relations.preview).toBe('2 declared')
    expect(relations.children?.map(entry => [entry.label, entry.preview])).toEqual([['posts', 'hasMany Post'], ['Team', 'belongsTo Team']])
  })

  it('show a model with no row and nothing declared', () => {
    const node = fromTinkerValue({ t: 'model', id: 9, model: 'Draft', attributes: [] })

    expect(node.preview).toBe('Draft')
    expect(node.children).toEqual([])
    expect(node.meta).toEqual({ model: 'Draft', hidden: [], relations: [] })
  })
})

describe('markup', () => {
  it('is a leaf that opens as a preview', () => {
    const node = fromTinkerValue({ t: 'html', kind: 'mail', title: 'Welcome', html: '<p>Hi {{ name }}</p>', text: 'Hi', truncated: 40 })

    expect(node).toMatchObject({ kind: 'html', openable: 'preview', value: '<p>Hi {{ name }}</p>', preview: 'mail: Welcome (20 characters, 40 more cut)' })
    expect(node.meta).toEqual({ kind: 'mail', title: 'Welcome', text: 'Hi', truncated: 40 })
    expect(node.children).toBeUndefined()
  })

  it('needs no title', () => {
    expect(fromTinkerValue({ t: 'html', kind: 'view', html: '<b>x</b>' }).preview).toBe('view (8 characters)')
  })
})

describe('errors', () => {
  it('show the message, the frames, the cause and their own fields', () => {
    const node = fromTinkerValue({
      t: 'error',
      name: 'QueryError',
      message: 'no such table',
      stack: 'QueryError: no such table\n    at run (/app/db.ts:10:5)',
      frames: [{ function: 'run', file: '/app/db.ts', line: 10, column: 5 }, { file: '/app/main.ts', line: 2 }, {}],
      cause: { t: 'error', name: 'Error', message: 'disk' },
      entries: [['code', str('E_TABLE')]],
    })

    expect(node).toMatchObject({ kind: 'error', preview: 'QueryError: no such table' })
    expect(node.children?.map(entry => entry.label)).toEqual(['message', 'stack', 'cause', 'code'])
    expect(child(node, 'stack').children?.map(entry => entry.preview)).toEqual(['run at /app/db.ts:10:5', '/app/main.ts:2', '(unknown)'])
    expect(child(node, 'stack').preview).toBe('3 frames')
    expect(child(node, 'cause').preview).toBe('Error: disk')
    expect(child(node, 'code').value).toBe('E_TABLE')
  })

  it('fall back to the stack text when it could not be parsed', () => {
    const node = fromTinkerValue({ t: 'error', name: 'Error', message: '', stack: 'Error\n  somewhere' })

    expect(node.preview).toBe('Error')
    expect(child(node, 'stack').kind).toBe('string')
  })
})

describe('where a value can be opened', () => {
  const row = (id: number): TinkerValue => ({ t: 'object', id, entries: [['n', num(id)]] })

  it('a list of objects or models opens as a table', () => {
    expect(fromTinkerValue({ t: 'array', id: 1, length: 2, items: [row(2), row(3)] }).openable).toBe('table')
    expect(fromTinkerValue({ t: 'set', id: 1, size: 1, items: [{ t: 'model', id: 2, model: 'User', attributes: [] }] }).openable).toBe('table')
  })

  it('a list of anything else does not', () => {
    expect(fromTinkerValue({ t: 'array', id: 1, length: 2, items: [num(1), num(2)] }).openable).toBeUndefined()
    expect(fromTinkerValue({ t: 'array', id: 1, length: 2, items: [row(2), num(2)] }).openable).toBeUndefined()
    expect(fromTinkerValue({ t: 'array', id: 1, length: 0, items: [] }).openable).toBeUndefined()
  })

  it('an object or map holding containers opens as a graph', () => {
    expect(fromTinkerValue({ t: 'object', id: 1, entries: [['child', row(2)]] }).openable).toBe('graph')
    expect(fromTinkerValue({ t: 'map', id: 1, size: 1, entries: [[str('k'), row(2)]] }).openable).toBe('graph')
    expect(fromTinkerValue(row(1)).openable).toBeUndefined()
    expect(fromTinkerValue({ t: 'map', id: 1, size: 1, entries: [[str('k'), num(2)]] }).openable).toBeUndefined()
  })
})
