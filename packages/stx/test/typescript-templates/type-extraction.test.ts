import { describe, expect, it } from 'bun:test'
import {
  createTypeContext,
  extractTypesFromTemplate,
  processTypesDirective,
} from '../../src/typescript-templates'

describe('extractTypesFromTemplate', () => {
  it('should extract interface from @types block', () => {
    const template = `
      @types
      interface PageContext {
        title: string
        count: number
      }
      @endtypes
      <h1>{{ title }}</h1>
    `
    const result = extractTypesFromTemplate(template)

    expect(result.interfaces).toHaveLength(1)
    expect(result.interfaces[0].name).toBe('PageContext')
    expect(result.interfaces[0].properties.title.type).toEqual({ kind: 'primitive', value: 'string' })
    expect(result.interfaces[0].properties.count.type).toEqual({ kind: 'primitive', value: 'number' })
  })

  it('should detect PageContext as contextType', () => {
    const template = `
      @types
      interface PageContext {
        title: string
      }
      @endtypes
    `
    const result = extractTypesFromTemplate(template)
    expect(result.contextType?.name).toBe('PageContext')
  })

  it('should detect TemplateContext as contextType', () => {
    const template = `
      @types
      interface TemplateContext {
        data: string
      }
      @endtypes
    `
    const result = extractTypesFromTemplate(template)
    expect(result.contextType?.name).toBe('TemplateContext')
  })

  it('should use first interface if no standard context name', () => {
    const template = `
      @types
      interface MyProps {
        value: number
      }
      @endtypes
    `
    const result = extractTypesFromTemplate(template)
    expect(result.contextType?.name).toBe('MyProps')
  })

  it('should extract type aliases', () => {
    const template = `
      @types
      type Status = 'pending' | 'active' | 'complete'
      @endtypes
    `
    const result = extractTypesFromTemplate(template)

    expect(result.typeAliases).toHaveLength(1)
    expect(result.typeAliases[0].name).toBe('Status')
  })

  it('should extract optional properties', () => {
    const template = `
      @types
      interface User {
        name: string
        email?: string
      }
      @endtypes
    `
    const result = extractTypesFromTemplate(template)
    expect(result.interfaces[0].properties.name.optional).toBe(false)
    expect(result.interfaces[0].properties.email.optional).toBe(true)
  })

  it('should handle multiple interfaces', () => {
    const template = `
      @types
      interface User {
        name: string
      }
      interface Post {
        title: string
      }
      @endtypes
    `
    const result = extractTypesFromTemplate(template)
    expect(result.interfaces).toHaveLength(2)
    expect(result.interfaces[0].name).toBe('User')
    expect(result.interfaces[1].name).toBe('Post')
  })

  it('should handle empty template', () => {
    const result = extractTypesFromTemplate('<div>Hello</div>')
    expect(result.interfaces).toHaveLength(0)
    expect(result.typeAliases).toHaveLength(0)
    expect(result.contextType).toBeUndefined()
  })
})

describe('createTypeContext', () => {
  it('should create context from extracted types', () => {
    const extracted = extractTypesFromTemplate(`
      @types
      interface PageContext {
        title: string
      }
      @endtypes
    `)
    const ctx = createTypeContext(extracted)

    expect(ctx.interfaces.has('PageContext')).toBe(true)
    expect(ctx.variables.has('title')).toBe(true)
  })

  it('should infer types from runtime context when no @types', () => {
    const extracted = extractTypesFromTemplate('<div>{{ message }}</div>')
    const ctx = createTypeContext(extracted, { message: 'hello' })

    expect(ctx.variables.has('message')).toBe(true)
    expect(ctx.variables.get('message')).toEqual({ kind: 'primitive', value: 'string' })
  })

  it('should infer array types from runtime context', () => {
    const extracted = extractTypesFromTemplate('<div></div>')
    const ctx = createTypeContext(extracted, { items: [1, 2, 3] })

    expect(ctx.variables.get('items')).toEqual({
      kind: 'array',
      elementType: { kind: 'primitive', value: 'number' },
    })
  })

  it('should infer object types from runtime context', () => {
    const extracted = extractTypesFromTemplate('<div></div>')
    const ctx = createTypeContext(extracted, { user: { name: 'John', age: 30 } })

    const userType = ctx.variables.get('user')
    expect(userType?.kind).toBe('object')
    expect(userType?.properties?.name.type).toEqual({ kind: 'primitive', value: 'string' })
    expect(userType?.properties?.age.type).toEqual({ kind: 'primitive', value: 'number' })
  })
})

describe('processTypesDirective', () => {
  it('should extract types and remove @types block', () => {
    const template = `
      @types
      interface PageContext {
        title: string
      }
      @endtypes
      <h1>{{ title }}</h1>
    `
    const result = processTypesDirective(template)

    expect(result.types.interfaces).toHaveLength(1)
    expect(result.template).not.toContain('@types')
    expect(result.template).not.toContain('@endtypes')
    expect(result.template).toContain('<h1>{{ title }}</h1>')
  })

  it('should handle template without @types', () => {
    const template = '<div>Hello</div>'
    const result = processTypesDirective(template)

    expect(result.types.interfaces).toHaveLength(0)
    expect(result.template).toBe(template)
  })

  it('should handle multiple @types blocks', () => {
    const template = `
      @types
      interface A { x: number }
      @endtypes
      <div>Content</div>
      @types
      interface B { y: string }
      @endtypes
    `
    const result = processTypesDirective(template)

    expect(result.types.interfaces).toHaveLength(2)
    expect(result.template).not.toContain('@types')
  })
})
