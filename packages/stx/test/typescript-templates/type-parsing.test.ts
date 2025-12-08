import { describe, expect, it } from 'bun:test'
import {
  parseTypeAnnotation,
  typeToString,
} from '../../src/typescript-templates'

describe('parseTypeAnnotation', () => {
  describe('primitive types', () => {
    it('should parse string type', () => {
      const result = parseTypeAnnotation('string')
      expect(result).toEqual({ kind: 'primitive', value: 'string' })
    })

    it('should parse number type', () => {
      const result = parseTypeAnnotation('number')
      expect(result).toEqual({ kind: 'primitive', value: 'number' })
    })

    it('should parse boolean type', () => {
      const result = parseTypeAnnotation('boolean')
      expect(result).toEqual({ kind: 'primitive', value: 'boolean' })
    })

    it('should parse null type', () => {
      const result = parseTypeAnnotation('null')
      expect(result).toEqual({ kind: 'primitive', value: 'null' })
    })

    it('should parse undefined type', () => {
      const result = parseTypeAnnotation('undefined')
      expect(result).toEqual({ kind: 'primitive', value: 'undefined' })
    })

    it('should parse any type', () => {
      const result = parseTypeAnnotation('any')
      expect(result).toEqual({ kind: 'primitive', value: 'any' })
    })

    it('should parse unknown type', () => {
      const result = parseTypeAnnotation('unknown')
      expect(result).toEqual({ kind: 'primitive', value: 'unknown' })
    })

    it('should parse void type', () => {
      const result = parseTypeAnnotation('void')
      expect(result).toEqual({ kind: 'primitive', value: 'void' })
    })

    it('should parse never type', () => {
      const result = parseTypeAnnotation('never')
      expect(result).toEqual({ kind: 'primitive', value: 'never' })
    })
  })

  describe('array types', () => {
    it('should parse string[] syntax', () => {
      const result = parseTypeAnnotation('string[]')
      expect(result).toEqual({
        kind: 'array',
        elementType: { kind: 'primitive', value: 'string' },
      })
    })

    it('should parse Array<string> syntax', () => {
      const result = parseTypeAnnotation('Array<string>')
      expect(result).toEqual({
        kind: 'array',
        elementType: { kind: 'primitive', value: 'string' },
      })
    })

    it('should parse nested arrays', () => {
      const result = parseTypeAnnotation('string[][]')
      expect(result).toEqual({
        kind: 'array',
        elementType: {
          kind: 'array',
          elementType: { kind: 'primitive', value: 'string' },
        },
      })
    })
  })

  describe('union types', () => {
    it('should parse simple union', () => {
      const result = parseTypeAnnotation('string | number')
      expect(result).toEqual({
        kind: 'union',
        types: [
          { kind: 'primitive', value: 'string' },
          { kind: 'primitive', value: 'number' },
        ],
      })
    })

    it('should parse nullable type', () => {
      const result = parseTypeAnnotation('string | null')
      expect(result).toEqual({
        kind: 'union',
        types: [
          { kind: 'primitive', value: 'string' },
          { kind: 'primitive', value: 'null' },
        ],
      })
    })
  })

  describe('intersection types', () => {
    it('should parse intersection', () => {
      const result = parseTypeAnnotation('A & B')
      expect(result).toEqual({
        kind: 'intersection',
        types: [
          { kind: 'reference', value: 'A' },
          { kind: 'reference', value: 'B' },
        ],
      })
    })
  })

  describe('literal types', () => {
    it('should parse string literal with single quotes', () => {
      const result = parseTypeAnnotation('\'hello\'')
      expect(result).toEqual({ kind: 'literal', literalValue: 'hello' })
    })

    it('should parse string literal with double quotes', () => {
      const result = parseTypeAnnotation('"hello"')
      expect(result).toEqual({ kind: 'literal', literalValue: 'hello' })
    })

    it('should parse number literal', () => {
      const result = parseTypeAnnotation('42')
      expect(result).toEqual({ kind: 'literal', literalValue: 42 })
    })

    it('should parse true literal', () => {
      const result = parseTypeAnnotation('true')
      expect(result).toEqual({ kind: 'literal', literalValue: true })
    })

    it('should parse false literal', () => {
      const result = parseTypeAnnotation('false')
      expect(result).toEqual({ kind: 'literal', literalValue: false })
    })
  })

  describe('object types', () => {
    it('should parse empty object', () => {
      const result = parseTypeAnnotation('{}')
      expect(result).toEqual({ kind: 'object', properties: {} })
    })

    it('should parse simple object', () => {
      const result = parseTypeAnnotation('{ name: string }')
      expect(result).toEqual({
        kind: 'object',
        properties: {
          name: {
            type: { kind: 'primitive', value: 'string' },
            optional: false,
            readonly: false,
          },
        },
      })
    })

    it('should parse optional property', () => {
      const result = parseTypeAnnotation('{ name?: string }')
      expect(result).toEqual({
        kind: 'object',
        properties: {
          name: {
            type: { kind: 'primitive', value: 'string' },
            optional: true,
            readonly: false,
          },
        },
      })
    })

    it('should parse readonly property', () => {
      const result = parseTypeAnnotation('{ readonly id: number }')
      expect(result).toEqual({
        kind: 'object',
        properties: {
          id: {
            type: { kind: 'primitive', value: 'number' },
            optional: false,
            readonly: true,
          },
        },
      })
    })

    it('should parse multiple properties', () => {
      const result = parseTypeAnnotation('{ name: string; age: number }')
      expect(result.kind).toBe('object')
      expect(result.properties).toBeDefined()
      expect(result.properties!.name.type).toEqual({ kind: 'primitive', value: 'string' })
      expect(result.properties!.age.type).toEqual({ kind: 'primitive', value: 'number' })
    })
  })

  describe('function types', () => {
    it('should parse simple function', () => {
      const result = parseTypeAnnotation('() => void')
      expect(result).toEqual({
        kind: 'function',
        parameters: [],
        returnType: { kind: 'primitive', value: 'void' },
      })
    })

    it('should parse function with parameters', () => {
      const result = parseTypeAnnotation('(x: number) => string')
      expect(result).toEqual({
        kind: 'function',
        parameters: [
          { name: 'x', type: { kind: 'primitive', value: 'number' }, optional: false, rest: false },
        ],
        returnType: { kind: 'primitive', value: 'string' },
      })
    })

    it('should parse function with optional parameter', () => {
      const result = parseTypeAnnotation('(x?: number) => void')
      expect(result.kind).toBe('function')
      expect(result.parameters![0].optional).toBe(true)
    })

    it('should parse function with rest parameter', () => {
      const result = parseTypeAnnotation('(...args: string[]) => void')
      expect(result.kind).toBe('function')
      expect(result.parameters![0].rest).toBe(true)
    })
  })

  describe('generic types', () => {
    it('should parse generic type', () => {
      const result = parseTypeAnnotation('Promise<string>')
      expect(result).toEqual({
        kind: 'generic',
        value: 'Promise',
        typeArguments: [{ kind: 'primitive', value: 'string' }],
      })
    })

    it('should parse Map type', () => {
      const result = parseTypeAnnotation('Map<string, number>')
      expect(result).toEqual({
        kind: 'generic',
        value: 'Map',
        typeArguments: [
          { kind: 'primitive', value: 'string' },
          { kind: 'primitive', value: 'number' },
        ],
      })
    })
  })

  describe('reference types', () => {
    it('should parse type reference', () => {
      const result = parseTypeAnnotation('MyInterface')
      expect(result).toEqual({ kind: 'reference', value: 'MyInterface' })
    })
  })
})

describe('typeToString', () => {
  it('should convert primitive to string', () => {
    expect(typeToString({ kind: 'primitive', value: 'string' })).toBe('string')
  })

  it('should convert array to string', () => {
    expect(typeToString({
      kind: 'array',
      elementType: { kind: 'primitive', value: 'number' },
    })).toBe('Array<number>')
  })

  it('should convert union to string', () => {
    expect(typeToString({
      kind: 'union',
      types: [
        { kind: 'primitive', value: 'string' },
        { kind: 'primitive', value: 'number' },
      ],
    })).toBe('string | number')
  })

  it('should convert object to string', () => {
    expect(typeToString({
      kind: 'object',
      properties: {
        name: { type: { kind: 'primitive', value: 'string' }, optional: false, readonly: false },
      },
    })).toBe('{ name: string }')
  })

  it('should convert function to string', () => {
    expect(typeToString({
      kind: 'function',
      parameters: [{ name: 'x', type: { kind: 'primitive', value: 'number' }, optional: false, rest: false }],
      returnType: { kind: 'primitive', value: 'string' },
    })).toBe('(x: number) => string')
  })

  it('should convert literal to string', () => {
    expect(typeToString({ kind: 'literal', literalValue: 'hello' })).toBe('\'hello\'')
    expect(typeToString({ kind: 'literal', literalValue: 42 })).toBe('42')
    expect(typeToString({ kind: 'literal', literalValue: true })).toBe('true')
  })
})
