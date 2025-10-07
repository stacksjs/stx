import { describe, expect, it } from 'bun:test'
import { parse, stringify } from '../src/yaml'

describe('yaml parser', () => {
  it('should parse simple key-value pairs', () => {
    const yaml = `
name: John Doe
age: 30
active: true
`
    const result = parse(yaml)

    expect(result.name).toBe('John Doe')
    expect(result.age).toBe(30)
    expect(result.active).toBe(true)
  })

  it('should parse nested objects', () => {
    const yaml = `
person:
  name: John
  age: 30
  address:
    street: 123 Main St
    city: New York
`
    const result = parse(yaml)

    expect(result.person.name).toBe('John')
    expect(result.person.age).toBe(30)
    expect(result.person.address.street).toBe('123 Main St')
    expect(result.person.address.city).toBe('New York')
  })

  it('should parse arrays', () => {
    const yaml = `
fruits:
  - apple
  - banana
  - orange
`
    const result = parse(yaml)

    expect(Array.isArray(result.fruits)).toBe(true)
    expect(result.fruits).toEqual(['apple', 'banana', 'orange'])
  })

  it('should parse boolean values', () => {
    const yaml = `
enabled: true
disabled: false
yes_value: yes
no_value: no
`
    const result = parse(yaml)

    expect(result.enabled).toBe(true)
    expect(result.disabled).toBe(false)
    expect(result.yes_value).toBe(true)
    expect(result.no_value).toBe(false)
  })

  it('should parse numbers', () => {
    const yaml = `
integer: 42
float: 3.14
negative: -10
`
    const result = parse(yaml)

    expect(result.integer).toBe(42)
    expect(result.float).toBe(3.14)
    expect(result.negative).toBe(-10)
  })

  it('should handle null values', () => {
    const yaml = `
value: null
empty:
tilde: ~
`
    const result = parse(yaml)

    expect(result.value).toBeNull()
    expect(result.empty).toBeNull()
    expect(result.tilde).toBeNull()
  })

  it('should stringify objects to YAML', () => {
    const obj = {
      name: 'John',
      age: 30,
      active: true,
    }

    const result = stringify(obj)

    expect(result).toContain('name: John')
    expect(result).toContain('age: 30')
    expect(result).toContain('active: true')
  })

  it('should handle empty input', () => {
    const result = parse('')
    expect(result).toEqual({})
  })

  it('should skip comments', () => {
    const yaml = `
# This is a comment
name: John
# Another comment
age: 30
`
    const result = parse(yaml)

    expect(result.name).toBe('John')
    expect(result.age).toBe(30)
  })
})
