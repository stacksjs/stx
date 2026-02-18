import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { validateComponentProps, applyPropDefaults, componentDirective } from '../../src/components'
import type { ComponentPropsSchema } from '../../src/types'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-props')
const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')

describe('Props Validation - validateComponentProps', () => {
  it('should return empty array for valid props with required string', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', required: true },
    }
    const errors = validateComponentProps({ title: 'Hello' }, schema, 'MyComponent')
    expect(errors).toEqual([])
  })

  it('should report missing required prop', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', required: true },
    }
    const errors = validateComponentProps({}, schema, 'MyComponent')
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('MyComponent')
    expect(errors[0]).toContain('Missing required prop')
    expect(errors[0]).toContain('title')
  })

  it('should report type mismatch for string prop', () => {
    const schema: ComponentPropsSchema = {
      name: { type: 'string' },
    }
    const errors = validateComponentProps({ name: 123 }, schema, 'Test')
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('expected string')
    expect(errors[0]).toContain('got number')
  })

  it('should report type mismatch for number prop', () => {
    const schema: ComponentPropsSchema = {
      count: { type: 'number' },
    }
    const errors = validateComponentProps({ count: 'five' }, schema, 'Test')
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('expected number')
  })

  it('should report type mismatch for boolean prop', () => {
    const schema: ComponentPropsSchema = {
      active: { type: 'boolean' },
    }
    const errors = validateComponentProps({ active: 'yes' }, schema, 'Test')
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('expected boolean')
  })

  it('should validate array type', () => {
    const schema: ComponentPropsSchema = {
      items: { type: 'array' },
    }
    expect(validateComponentProps({ items: [1, 2] }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ items: 'not-array' }, schema, 'Test').length).toBe(1)
  })

  it('should validate object type', () => {
    const schema: ComponentPropsSchema = {
      config: { type: 'object' },
    }
    expect(validateComponentProps({ config: { key: 'val' } }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ config: 'string' }, schema, 'Test').length).toBe(1)
  })

  it('should accept any type', () => {
    const schema: ComponentPropsSchema = {
      data: { type: 'any' },
    }
    expect(validateComponentProps({ data: 'string' }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ data: 42 }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ data: [1] }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ data: null }, schema, 'Test')).toEqual([])
  })

  it('should support union types (multiple allowed types)', () => {
    const schema: ComponentPropsSchema = {
      value: { type: ['string', 'number'] },
    }
    expect(validateComponentProps({ value: 'text' }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ value: 42 }, schema, 'Test')).toEqual([])
    const errors = validateComponentProps({ value: true }, schema, 'Test')
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('string | number')
  })

  it('should run custom validator and report failure', () => {
    const schema: ComponentPropsSchema = {
      age: {
        type: 'number',
        validator: (v: unknown) => typeof v === 'number' && v >= 0 && v <= 150,
      },
    }
    expect(validateComponentProps({ age: 25 }, schema, 'Test')).toEqual([])
    const errors = validateComponentProps({ age: -5 }, schema, 'Test')
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain('failed custom validation')
  })

  it('should skip validation for undefined optional props', () => {
    const schema: ComponentPropsSchema = {
      optional: { type: 'string' },
    }
    expect(validateComponentProps({}, schema, 'Test')).toEqual([])
  })

  it('should skip validation for null optional props', () => {
    const schema: ComponentPropsSchema = {
      nullable: { type: 'string' },
    }
    expect(validateComponentProps({ nullable: null }, schema, 'Test')).toEqual([])
  })

  it('should report multiple errors at once', () => {
    const schema: ComponentPropsSchema = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
      email: { type: 'string', required: true },
    }
    const errors = validateComponentProps({}, schema, 'UserForm')
    expect(errors.length).toBe(3)
  })
})

describe('Props Validation - applyPropDefaults', () => {
  it('should apply static defaults', () => {
    const schema: ComponentPropsSchema = {
      color: { type: 'string', default: 'blue' },
      size: { type: 'number', default: 16 },
    }
    const result = applyPropDefaults({}, schema)
    expect(result.color).toBe('blue')
    expect(result.size).toBe(16)
  })

  it('should not override provided values with defaults', () => {
    const schema: ComponentPropsSchema = {
      color: { type: 'string', default: 'blue' },
    }
    const result = applyPropDefaults({ color: 'red' }, schema)
    expect(result.color).toBe('red')
  })

  it('should call function defaults', () => {
    let callCount = 0
    const schema: ComponentPropsSchema = {
      items: {
        type: 'array',
        default: () => {
          callCount++
          return ['a', 'b']
        },
      },
    }
    const result = applyPropDefaults({}, schema)
    expect(result.items).toEqual(['a', 'b'])
    expect(callCount).toBe(1)
  })

  it('should return new object without mutating input', () => {
    const schema: ComponentPropsSchema = {
      added: { type: 'string', default: 'new' },
    }
    const original = { existing: 'keep' }
    const result = applyPropDefaults(original, schema)

    expect(result.existing).toBe('keep')
    expect(result.added).toBe('new')
    expect(original).not.toHaveProperty('added')
  })

  it('should handle schema with no defaults', () => {
    const schema: ComponentPropsSchema = {
      required: { type: 'string', required: true },
    }
    const result = applyPropDefaults({ required: 'value' }, schema)
    expect(result.required).toBe('value')
  })

  it('should handle boolean false default', () => {
    const schema: ComponentPropsSchema = {
      disabled: { type: 'boolean', default: false },
    }
    const result = applyPropDefaults({}, schema)
    expect(result.disabled).toBe(false)
  })

  it('should handle zero default', () => {
    const schema: ComponentPropsSchema = {
      count: { type: 'number', default: 0 },
    }
    const result = applyPropDefaults({}, schema)
    expect(result.count).toBe(0)
  })

  it('should handle empty string default', () => {
    const schema: ComponentPropsSchema = {
      label: { type: 'string', default: '' },
    }
    const result = applyPropDefaults({}, schema)
    expect(result.label).toBe('')
  })
})

describe('componentDirective', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })
    await Bun.write(
      path.join(COMPONENTS_DIR, 'simple.stx'),
      '<div class="simple">{{ title }} - {{ subtitle }}</div>',
    )
  })

  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  it('should return error for missing component name', async () => {
    const result = await componentDirective.handler('', [], {}, '/test.stx')
    expect(typeof result).toBe('string')
    expect(result).toContain('error')
  })

  it('should render component with props', async () => {
    const context: Record<string, any> = {
      __stx_options: { componentsDir: COMPONENTS_DIR },
    }

    const result = await componentDirective.handler(
      '',
      ["'simple'", "{ title: 'Hello', subtitle: 'World' }"],
      context,
      path.join(TEMP_DIR, 'test.stx'),
    )

    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('should handle component not found gracefully', async () => {
    const context: Record<string, any> = {
      __stx_options: { componentsDir: COMPONENTS_DIR },
    }

    const result = await componentDirective.handler(
      '',
      ["'nonexistent'"],
      context,
      path.join(TEMP_DIR, 'test.stx'),
    )

    expect(typeof result).toBe('string')
    // Should contain error indicator
    expect(result.toLowerCase()).toMatch(/error|not found|could not/)
  })

  it('should have hasEndTag set to false', () => {
    expect(componentDirective.hasEndTag).toBe(false)
  })

  it('should have name set to component', () => {
    expect(componentDirective.name).toBe('component')
  })
})
