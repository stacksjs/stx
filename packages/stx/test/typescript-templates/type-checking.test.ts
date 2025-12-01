import { describe, expect, it } from 'bun:test'
import {
  typeCheckExpression,
  validateTemplateTypes,
  compileTimeTypeCheck,
  createTypeContext,
  extractTypesFromTemplate,
  inferTypeFromValue,
} from '../../src/typescript-templates'

describe('inferTypeFromValue', () => {
  it('should infer string type', () => {
    expect(inferTypeFromValue('hello')).toEqual({ kind: 'primitive', value: 'string' })
  })

  it('should infer number type', () => {
    expect(inferTypeFromValue(42)).toEqual({ kind: 'primitive', value: 'number' })
  })

  it('should infer boolean type', () => {
    expect(inferTypeFromValue(true)).toEqual({ kind: 'primitive', value: 'boolean' })
  })

  it('should infer null type', () => {
    expect(inferTypeFromValue(null)).toEqual({ kind: 'primitive', value: 'null' })
  })

  it('should infer undefined type', () => {
    expect(inferTypeFromValue(undefined)).toEqual({ kind: 'primitive', value: 'undefined' })
  })

  it('should infer function type', () => {
    const result = inferTypeFromValue(() => {})
    expect(result.kind).toBe('function')
  })

  it('should infer array type with element type', () => {
    const result = inferTypeFromValue([1, 2, 3])
    expect(result.kind).toBe('array')
    expect(result.elementType).toEqual({ kind: 'primitive', value: 'number' })
  })

  it('should infer empty array as any[]', () => {
    const result = inferTypeFromValue([])
    expect(result.kind).toBe('array')
    expect(result.elementType).toEqual({ kind: 'primitive', value: 'any' })
  })

  it('should infer object type', () => {
    const result = inferTypeFromValue({ name: 'John' })
    expect(result.kind).toBe('object')
    expect(result.properties?.name.type).toEqual({ kind: 'primitive', value: 'string' })
  })
})

describe('typeCheckExpression', () => {
  it('should type-check simple variable', () => {
    const extracted = extractTypesFromTemplate(`
      @types
      interface PageContext {
        title: string
      }
      @endtypes
    `)
    const ctx = createTypeContext(extracted)

    const result = typeCheckExpression('title', ctx)
    expect(result).toEqual({ kind: 'primitive', value: 'string' })
  })

  it('should return error for unknown variable', () => {
    const extracted = extractTypesFromTemplate(`
      @types
      interface PageContext {
        title: string
      }
      @endtypes
    `)
    const ctx = createTypeContext(extracted)

    const result = typeCheckExpression('unknown', ctx)
    expect('message' in result).toBe(true)
    expect((result as any).message).toContain('Unknown variable')
  })

  it('should type-check property access', () => {
    const extracted = extractTypesFromTemplate(`
      @types
      interface PageContext {
        user: { name: string; age: number }
      }
      @endtypes
    `)
    const ctx = createTypeContext(extracted)

    const result = typeCheckExpression('user.name', ctx)
    expect(result).toEqual({ kind: 'primitive', value: 'string' })
  })

  it('should return error for unknown property', () => {
    const extracted = extractTypesFromTemplate(`
      @types
      interface PageContext {
        user: { name: string }
      }
      @endtypes
    `)
    const ctx = createTypeContext(extracted)

    const result = typeCheckExpression('user.email', ctx)
    expect('message' in result).toBe(true)
    expect((result as any).message).toContain('Property')
  })

  it('should handle array length property', () => {
    const extracted = extractTypesFromTemplate(`
      @types
      interface PageContext {
        items: string[]
      }
      @endtypes
    `)
    const ctx = createTypeContext(extracted)

    const result = typeCheckExpression('items.length', ctx)
    expect(result).toEqual({ kind: 'primitive', value: 'number' })
  })

  it('should return any for complex expressions', () => {
    const ctx = createTypeContext(extractTypesFromTemplate(''))
    const result = typeCheckExpression('a + b', ctx)
    expect(result).toEqual({ kind: 'primitive', value: 'any' })
  })
})

describe('validateTemplateTypes', () => {
  it('should find errors in template expressions', () => {
    const template = `
      @types
      interface PageContext {
        title: string
      }
      @endtypes
      <h1>{{ title }}</h1>
      <p>{{ unknownVar }}</p>
    `
    const extracted = extractTypesFromTemplate(template)
    const ctx = createTypeContext(extracted)
    const errors = validateTemplateTypes(template, ctx)

    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('unknownVar')
  })

  it('should not report errors for valid expressions', () => {
    const template = `
      @types
      interface PageContext {
        title: string
        count: number
      }
      @endtypes
      <h1>{{ title }}</h1>
      <p>{{ count }}</p>
    `
    const extracted = extractTypesFromTemplate(template)
    const ctx = createTypeContext(extracted)
    const errors = validateTemplateTypes(template, ctx)

    expect(errors).toHaveLength(0)
  })

  it('should skip expressions with filters', () => {
    const template = `
      @types
      interface PageContext {
        date: string
      }
      @endtypes
      <p>{{ date | format }}</p>
    `
    const extracted = extractTypesFromTemplate(template)
    const ctx = createTypeContext(extracted)
    const errors = validateTemplateTypes(template, ctx)

    // Should not error on filter expressions
    expect(errors).toHaveLength(0)
  })
})

describe('compileTimeTypeCheck', () => {
  it('should perform full type check on template', () => {
    const template = `
      @types
      interface PageContext {
        message: string
      }
      @endtypes
      <div>{{ message }}</div>
    `
    const result = compileTimeTypeCheck(template)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect type errors', () => {
    const template = `
      @types
      interface PageContext {
        message: string
      }
      @endtypes
      <div>{{ wrongName }}</div>
    `
    const result = compileTimeTypeCheck(template)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should use runtime context for type inference', () => {
    const template = '<div>{{ message }}</div>'
    const result = compileTimeTypeCheck(template, { message: 'hello' })

    // With runtime context, message is known so no error
    expect(result.errors).toHaveLength(0)
  })

  it('should work with nested objects', () => {
    const template = `
      @types
      interface PageContext {
        user: { profile: { avatar: string } }
      }
      @endtypes
      <img src="{{ user.profile.avatar }}">
    `
    const result = compileTimeTypeCheck(template)
    expect(result.errors).toHaveLength(0)
  })
})
