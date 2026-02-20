import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { renderComponentWithSlot, clearComponentCache } from '../../src/utils'
import { validateComponentProps, applyPropDefaults } from '../../src/components'
import type { ComponentPropsSchema } from '../../src/types'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-resolution')
const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')

describe('Component Resolution', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })

    // Create test component files
    await Bun.write(path.join(COMPONENTS_DIR, 'greeting.stx'), `<div class="greeting"><h1>{{ title }}</h1><p>{{ message }}</p></div>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'my-button.stx'), `<button class="btn btn-{{ variant }}">{{ label }}</button>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'slot-card.stx'), `<div class="card"><div class="card-body"><slot /></div></div>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'with-script.stx'), `<script>\nconst computed = "Hello " + name;\n</script>\n<div>{{ computed }}</div>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'wrapper.stx'), `<div class="wrapper"><h2>{{ heading }}</h2><div class="content"><slot /></div></div>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'circular-a.stx'), `<div>A: @component('circular-a')</div>`)
  })

  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  it('should resolve kebab-case component name to file', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'my-button',
      { variant: 'primary', label: 'Click Me' },
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    expect(result).toContain('<button')
    expect(result).toContain('btn-primary')
    expect(result).toContain('Click Me')
  })

  it('should resolve component name and pass props correctly', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'greeting',
      { title: 'Welcome', message: 'Hello World' },
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    expect(result).toContain('<div class="greeting">')
    expect(result).toContain('<h1>Welcome</h1>')
    expect(result).toContain('<p>Hello World</p>')
  })

  it('should make slot content available in component', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'slot-card',
      {},
      '<p>This is slot content</p>',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    expect(result).toContain('<div class="card">')
    expect(result).toContain('<p>This is slot content</p>')
  })

  it('should return error comment when component not found', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'non-existent-component',
      {},
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    expect(result).toContain('non-existent-component')
    // Should contain an error indicator (comment or error message)
    expect(result.toLowerCase()).toMatch(/error|not found|could not|<!--/)
  })

  it('should detect circular component references', async () => {
    const deps = new Set<string>()
    const processed = new Set<string>()
    // Add the component to processed set to simulate it being in the render stack
    const componentPath = path.join(COMPONENTS_DIR, 'circular-a.stx')
    processed.add(componentPath)

    const result = await renderComponentWithSlot(
      'circular-a',
      {},
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      processed,
      deps,
    )

    // Should detect circular reference
    expect(result.toLowerCase()).toMatch(/circular|already|recursive|error/)
  })

  it('should render component with slot wrapper', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'wrapper',
      { heading: 'Section Title' },
      '<p>Inner content here</p>',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    expect(result).toContain('<div class="wrapper">')
    expect(result).toContain('<h2>Section Title</h2>')
    expect(result).toContain('<p>Inner content here</p>')
  })

  it('should pass parent context to component', async () => {
    const deps = new Set<string>()
    const parentContext = { globalVar: 'from-parent' }
    const result = await renderComponentWithSlot(
      'greeting',
      { title: 'Test', message: 'Content' },
      '',
      COMPONENTS_DIR,
      parentContext,
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    expect(result).toContain('<h1>Test</h1>')
  })

  it('should track dependencies', async () => {
    const deps = new Set<string>()
    await renderComponentWithSlot(
      'greeting',
      { title: 'Test', message: 'Content' },
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )

    // Dependencies set should have at least one entry (the component file)
    expect(deps.size).toBeGreaterThanOrEqual(1)
  })
})

describe('validateComponentProps', () => {
  it('should return no errors for valid props', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', required: true },
      count: { type: 'number', default: 0 },
    }

    const errors = validateComponentProps({ title: 'Hello', count: 5 }, schema, 'TestComponent')
    expect(errors).toEqual([])
  })

  it('should detect missing required props', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', required: true },
      name: { type: 'string', required: true },
    }

    const errors = validateComponentProps({}, schema, 'TestComponent')
    expect(errors.length).toBe(2)
    expect(errors[0]).toContain('Missing required prop')
    expect(errors[0]).toContain('title')
    expect(errors[1]).toContain('name')
  })

  it('should detect type mismatches', () => {
    const schema: ComponentPropsSchema = {
      count: { type: 'number' },
      active: { type: 'boolean' },
    }

    const errors = validateComponentProps({ count: 'not a number', active: 'not a boolean' }, schema, 'TestComponent')
    expect(errors.length).toBe(2)
    expect(errors[0]).toContain('expected number')
    expect(errors[1]).toContain('expected boolean')
  })

  it('should allow any type', () => {
    const schema: ComponentPropsSchema = {
      data: { type: 'any' },
    }

    const errors = validateComponentProps({ data: { complex: 'object' } }, schema, 'TestComponent')
    expect(errors).toEqual([])
  })

  it('should support multiple types', () => {
    const schema: ComponentPropsSchema = {
      value: { type: ['string', 'number'] },
    }

    expect(validateComponentProps({ value: 'hello' }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ value: 42 }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ value: true }, schema, 'Test').length).toBe(1)
  })

  it('should validate arrays', () => {
    const schema: ComponentPropsSchema = {
      items: { type: 'array' },
    }

    expect(validateComponentProps({ items: [1, 2, 3] }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ items: 'not array' }, schema, 'Test').length).toBe(1)
  })

  it('should run custom validator', () => {
    const schema: ComponentPropsSchema = {
      age: {
        type: 'number',
        validator: (v: unknown) => typeof v === 'number' && v >= 0 && v <= 150,
      },
    }

    expect(validateComponentProps({ age: 25 }, schema, 'Test')).toEqual([])
    expect(validateComponentProps({ age: -1 }, schema, 'Test').length).toBe(1)
    expect(validateComponentProps({ age: 200 }, schema, 'Test').length).toBe(1)
  })

  it('should skip validation for undefined optional props', () => {
    const schema: ComponentPropsSchema = {
      optional: { type: 'string' },
    }

    const errors = validateComponentProps({}, schema, 'Test')
    expect(errors).toEqual([])
  })
})

describe('applyPropDefaults', () => {
  it('should apply default values for missing props', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', default: 'Default Title' },
      count: { type: 'number', default: 0 },
      active: { type: 'boolean', default: true },
    }

    const result = applyPropDefaults({}, schema)
    expect(result.title).toBe('Default Title')
    expect(result.count).toBe(0)
    expect(result.active).toBe(true)
  })

  it('should not override provided values', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', default: 'Default' },
      count: { type: 'number', default: 0 },
    }

    const result = applyPropDefaults({ title: 'Custom', count: 42 }, schema)
    expect(result.title).toBe('Custom')
    expect(result.count).toBe(42)
  })

  it('should call function defaults', () => {
    const schema: ComponentPropsSchema = {
      items: { type: 'array', default: () => [1, 2, 3] },
      config: { type: 'object', default: () => ({ key: 'value' }) },
    }

    const result = applyPropDefaults({}, schema)
    expect(result.items).toEqual([1, 2, 3])
    expect(result.config).toEqual({ key: 'value' })
  })

  it('should return a new object without mutating original', () => {
    const schema: ComponentPropsSchema = {
      title: { type: 'string', default: 'Default' },
    }

    const original = { existing: 'value' }
    const result = applyPropDefaults(original, schema)

    expect(result).not.toBe(original)
    expect(result.existing).toBe('value')
    expect(result.title).toBe('Default')
    expect(original).not.toHaveProperty('title')
  })

  it('should handle mixed provided and default values', () => {
    const schema: ComponentPropsSchema = {
      a: { type: 'string', default: 'defaultA' },
      b: { type: 'string', default: 'defaultB' },
      c: { type: 'string', default: 'defaultC' },
    }

    const result = applyPropDefaults({ b: 'custom' }, schema)
    expect(result.a).toBe('defaultA')
    expect(result.b).toBe('custom')
    expect(result.c).toBe('defaultC')
  })
})
