import { describe, expect, test } from 'bun:test'
import { deserialize, serialize } from '../src/serialization'

describe('serialization', () => {
  test('round-trips plain objects', () => {
    const data = { name: 'test', count: 42, active: true }
    expect(deserialize(serialize(data))).toEqual(data)
  })

  test('round-trips Date objects', () => {
    const date = new Date('2025-01-15T10:30:00Z')
    const result = deserialize<{ date: Date }>(serialize({ date }))
    expect(result.date).toBeInstanceOf(Date)
    expect(result.date.toISOString()).toBe('2025-01-15T10:30:00.000Z')
  })

  test('round-trips BigInt values', () => {
    const data = { big: BigInt('9007199254740993') }
    const result = deserialize<{ big: bigint }>(serialize(data))
    expect(result.big).toBe(BigInt('9007199254740993'))
  })

  test('round-trips Map objects', () => {
    const map = new Map([['a', 1], ['b', 2]])
    const result = deserialize<{ map: Map<string, number> }>(serialize({ map }))
    expect(result.map).toBeInstanceOf(Map)
    expect(result.map.get('a')).toBe(1)
    expect(result.map.get('b')).toBe(2)
  })

  test('round-trips Set objects', () => {
    const set = new Set([1, 2, 3])
    const result = deserialize<{ set: Set<number> }>(serialize({ set }))
    expect(result.set).toBeInstanceOf(Set)
    expect(result.set.has(1)).toBe(true)
    expect(result.set.size).toBe(3)
  })

  test('round-trips RegExp objects', () => {
    const regex = /hello\s+world/gi
    const result = deserialize<{ regex: RegExp }>(serialize({ regex }))
    expect(result.regex).toBeInstanceOf(RegExp)
    expect(result.regex.source).toBe('hello\\s+world')
    expect(result.regex.flags).toBe('gi')
  })

  test('handles nested structures', () => {
    const data = {
      user: { name: 'Alice', createdAt: new Date('2025-01-01') },
      tags: new Set(['a', 'b']),
    }
    const result = deserialize<typeof data>(serialize(data))
    expect(result.user.createdAt).toBeInstanceOf(Date)
    expect(result.tags).toBeInstanceOf(Set)
  })

  test('handles null and undefined values', () => {
    const data = { a: null, b: undefined }
    const result = deserialize<typeof data>(serialize(data))
    expect(result.a).toBeNull()
    // JSON.stringify drops undefined values
    expect(result.b).toBeUndefined()
  })
})
