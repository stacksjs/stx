import { describe, expect, it } from 'bun:test'
import { parseDefaults } from '../../src/component-library'

describe('parseDefaults', () => {
  it('reads simple defaults', () => {
    expect(parseDefaults('{ id: \'login\', active: false }')).toEqual([
      ['id', '\'login\''],
      ['active', 'false'],
    ])
  })

  it('keeps a comma that belongs to the string', () => {
    // This is the whole bug: the value was cut at its own comma and emitted as
    // `'To begin`, so the generated render failed to parse.
    expect(parseDefaults('{ subtitle: \'To begin, click your user name\' }')).toEqual([
      ['subtitle', '\'To begin, click your user name\''],
    ])
  })

  it('keeps a comma inside double quotes, template literals and escapes', () => {
    expect(parseDefaults('{ a: "one, two", b: `three, four`, c: \'it\\\'s, fine\' }')).toEqual([
      ['a', '"one, two"'],
      ['b', '`three, four`'],
      ['c', '\'it\\\'s, fine\''],
    ])
  })

  it('keeps a nested object, array or call intact', () => {
    expect(parseDefaults('{ opts: { a: 1, b: 2 }, list: [1, 2], made: fn(1, 2) }')).toEqual([
      ['opts', '{ a: 1, b: 2 }'],
      ['list', '[1, 2]'],
      ['made', 'fn(1, 2)'],
    ])
  })

  it('tolerates a trailing comma and an empty object', () => {
    expect(parseDefaults('{ a: 1, }')).toEqual([['a', '1']])
    expect(parseDefaults('{}')).toEqual([])
    expect(parseDefaults('')).toEqual([])
  })
})
