/**
 * Variable extractor bug edge case tests - redistributed from bugs/ directory.
 *
 * Covers: Variable Extractor Edge Cases from deep-edge-cases.ts.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
): Promise<string> {
  const deps = new Set<string>()
  return processDirectives(template, context, 'test.stx', defaultOptions, deps)
}

describe('Variable Extractor Edge Cases (from bugs)', () => {
  it('script with spread in destructuring: const { a, ...rest } = obj', async () => {
    const template = `
      <script server>
      const obj = { a: 1, b: 2, c: 3 }
      const { a, ...rest } = obj
      </script>
      <div>{{ a }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('1')
  })

  it('script with default values: const { a = 1 } = obj', async () => {
    const template = `
      <script server>
      const obj = {}
      const { a = 42 } = obj
      </script>
      <div>{{ a }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('42')
  })

  it('script with regex literal: const re = /test/g', async () => {
    const template = `
      <script server>
      const text = 'test123test'
      const re = /test/g
      const matches = text.match(re)
      const count = matches ? matches.length : 0
      </script>
      <div>{{ count }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('2')
  })

  it('script with comments between declarations', async () => {
    const template = `
      <script server>
      // first variable
      const a = 'hello'
      /* second variable */
      const b = 'world'
      </script>
      <div>{{ a }} {{ b }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('hello')
    expect(result).toContain('world')
  })

  it('script with multiline string', async () => {
    const template = `
      <script server>
      const text = "line1\\nline2\\nline3"
      </script>
      <div>{{ text }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('line1')
  })

  it('script with empty script tag', async () => {
    const template = `
      <script server></script>
      <div>static content</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('static content')
  })

  it('script with computed property: const obj = { [key]: value }', async () => {
    const template = `
      <script server>
      const key = 'name'
      const obj = {}
      obj[key] = 'Alice'
      const name = obj.name
      </script>
      <div>{{ name }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('Alice')
  })

  it('script with arrow function', async () => {
    const template = `
      <script server>
      const double = (x) => x * 2
      const result = double(21)
      </script>
      <div>{{ result }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('42')
  })

  it('script with template literal', async () => {
    const template = `
      <script server>
      const name = 'World'
      const greeting = \`Hello \${name}!\`
      </script>
      <div>{{ greeting }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('Hello World!')
  })

  it('script with array destructuring', async () => {
    const template = `
      <script server>
      const [first, second] = ['one', 'two']
      </script>
      <div>{{ first }} {{ second }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('one')
    expect(result).toContain('two')
  })

  it('script with ternary in variable assignment', async () => {
    const template = `
      <script server>
      const show = true
      const label = show ? 'Visible' : 'Hidden'
      </script>
      <div>{{ label }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('Visible')
  })

  it('script with nested function calls', async () => {
    const template = `
      <script server>
      const nums = [3, 1, 4, 1, 5]
      const sorted = nums.slice().sort((a, b) => a - b)
      const first = sorted[0]
      </script>
      <div>{{ first }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('1')
  })

  it('script with object method shorthand', async () => {
    const template = `
      <script server>
      const obj = {
        greet() { return 'hello' }
      }
      const msg = obj.greet()
      </script>
      <div>{{ msg }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('hello')
  })

  it('script with Map usage', async () => {
    const template = `
      <script server>
      const m = new Map()
      m.set('key', 'value123')
      const val = m.get('key')
      </script>
      <div>{{ val }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('value123')
  })
})
