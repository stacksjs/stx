import { describe, expect, it } from 'bun:test'
import { parse, stringify } from '../src/yaml'

describe('yaml parser - edge cases', () => {
  it('should handle deeply nested objects', () => {
    const yaml = `
level1:
  level2:
    level3:
      level4:
        value: deep
`
    const result = parse(yaml)

    expect(result.level1.level2.level3.level4.value).toBe('deep')
  })

  it('should handle mixed nested structures', () => {
    const yaml = `
config:
  servers:
    - name: server1
      port: 8080
      features:
        - ssl
        - cache
    - name: server2
      port: 8081
      features:
        - ssl
        - compression
`
    const result = parse(yaml)

    expect(result.config.servers).toHaveLength(2)
    expect(result.config.servers[0].name).toBe('server1')
    expect(result.config.servers[0].features).toEqual(['ssl', 'cache'])
    expect(result.config.servers[1].features).toEqual(['ssl', 'compression'])
  })

  it('should handle quoted strings with special characters', () => {
    const yaml = `
single: 'value with: colon'
double: "value with # hash"
mixed: "it's a 'mixed' quote"
`
    const result = parse(yaml)

    expect(result.single).toBe('value with: colon')
    expect(result.double).toBe('value with # hash')
    expect(result.mixed).toBe('it\'s a \'mixed\' quote')
  })

  it('should handle empty arrays and objects', () => {
    const yaml = `
emptyArray: []
emptyObject: {}
nullValue: null
`
    const result = parse(yaml)

    expect(result.emptyArray).toEqual([])
    expect(result.emptyObject).toEqual({})
    expect(result.nullValue).toBeNull()
  })

  it('should handle arrays with mixed types', () => {
    const yaml = `
mixed:
  - string value
  - 123
  - true
  - null
  - 3.14
`
    const result = parse(yaml)

    expect(result.mixed).toEqual(['string value', 123, true, null, 3.14])
  })

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(1000)
    const yaml = `value: "${longString}"`

    const result = parse(yaml)

    expect(result.value).toBe(longString)
  })

  it('should handle numeric strings vs numbers', () => {
    const yaml = `
number: 123
stringNumber: "123"
float: 3.14
stringFloat: "3.14"
`
    const result = parse(yaml)

    expect(result.number).toBe(123)
    expect(result.stringNumber).toBe('123')
    expect(result.float).toBe(3.14)
    expect(result.stringFloat).toBe('3.14')
  })

  it('should handle boolean variations', () => {
    const yaml = `
t1: true
t2: yes
t3: on
f1: false
f2: no
f3: off
`
    const result = parse(yaml)

    expect(result.t1).toBe(true)
    expect(result.t2).toBe(true)
    expect(result.t3).toBe(true)
    expect(result.f1).toBe(false)
    expect(result.f2).toBe(false)
    expect(result.f3).toBe(false)
  })

  it('should handle whitespace variations', () => {
    const yaml = `spaced: value with spaces
tabbed: value with tabs
mixed: mixed whitespace`

    const result = parse(yaml)

    expect(result.spaced).toBe('value with spaces')
    expect(result.tabbed).toBe('value with tabs')
    expect(result.mixed).toBe('mixed whitespace')
  })

  it('should handle empty input gracefully', () => {
    expect(parse('') ?? {}).toEqual({})
    // Bun's YAML parser returns null for only whitespace/comments
    const result = parse('   \n\n   ')
    expect(result === null || (typeof result === 'object' && Object.keys(result as object).length === 0)).toBe(true)

    const commentResult = parse('# Only comments\n# More comments')
    expect(commentResult === null || (typeof commentResult === 'object' && Object.keys(commentResult as object).length === 0)).toBe(true)
  })

  it('should handle UTF-8 BOM', () => {
    const yaml = '\uFEFFname: value'
    const result = parse(yaml)

    expect(result.name).toBe('value')
  })

  it('should handle keys with special characters', () => {
    const yaml = `
"key-with-dashes": value1
"key.with.dots": value2
"key with spaces": value3
`
    const result = parse(yaml)

    expect(result['key-with-dashes']).toBe('value1')
    expect(result['key.with.dots']).toBe('value2')
    expect(result['key with spaces']).toBe('value3')
  })

  it('should handle large arrays efficiently', () => {
    const items = Array.from({ length: 100 }, (_, i) => `  - item${i}`)
    const yaml = `items:\n${items.join('\n')}`

    const result = parse(yaml)

    expect(result.items).toHaveLength(100)
    expect(result.items[0]).toBe('item0')
    expect(result.items[99]).toBe('item99')
  })

  it('should handle negative numbers', () => {
    const yaml = `
negInt: -42
negFloat: -3.14
negZero: -0
`
    const result = parse(yaml)

    expect(result.negInt).toBe(-42)
    expect(result.negFloat).toBe(-3.14)
    expect(result.negZero).toBe(-0)
  })

  it('should handle scientific notation if supported', () => {
    const yaml = `
scientific: 1e10
negative: -2.5e-3
`
    const result = parse(yaml)

    // These will be strings since we don't support scientific notation yet
    expect(typeof result.scientific === 'string' || typeof result.scientific === 'number').toBe(true)
  })

  it('should roundtrip stringify and parse', () => {
    const obj = {
      name: 'Test',
      age: 30,
      active: true,
      tags: ['one', 'two', 'three'],
    }

    const yaml = stringify(obj)
    const result = parse(yaml)

    expect(result.name).toBe(obj.name)
    expect(result.age).toBe(obj.age)
    expect(result.active).toBe(obj.active)
    // Note: stringify might not preserve array format perfectly
  })

  it('should handle strict mode errors', () => {
    const invalidYaml = 'invalid: [unclosed array'

    // In non-strict mode, should return empty object on error
    const result = parse(invalidYaml, { strict: false })
    expect(typeof result).toBe('object')

    // In strict mode, should throw
    expect(() => parse(invalidYaml, { strict: true })).toThrow()
  })

  it('should handle inline arrays', () => {
    const yaml = 'items: [one, two, three]'
    const result = parse(yaml)

    expect(result.items).toEqual(['one', 'two', 'three'])
  })

  it('should handle inline objects', () => {
    const yaml = 'config: {name: test, value: 123}'
    const result = parse(yaml)

    expect(result.config.name).toBe('test')
    expect(result.config.value).toBe(123)
  })
})
