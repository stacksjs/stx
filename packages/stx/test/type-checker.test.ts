import { describe, expect, it } from 'bun:test'
import {
  checkTemplate,
  createTypeChecker,
  formatTypeErrors,
} from '../src/type-checker'

describe('Template Type Checker', () => {
  describe('checkTemplate', () => {
    it('should pass for valid template with defined variables', () => {
      const template = `
<script>
const name = 'World'
const count = 42
</script>
<h1>Hello {{ name }}</h1>
<p>Count: {{ count }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect undefined variables', () => {
      const template = `
<script>
const name = 'World'
</script>
<h1>Hello {{ name }}</h1>
<p>{{ undefinedVar }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].message).toContain('undefinedVar')
    })

    it('should infer string type from string literal', () => {
      const template = `
<script>
const message = "Hello"
</script>
<p>{{ message.toUpperCase() }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.variables.get('message')?.value).toBe('string')
    })

    it('should infer number type from number literal', () => {
      const template = `
<script>
const count = 42
</script>
<p>{{ count }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.variables.get('count')?.value).toBe('number')
    })

    it('should infer boolean type', () => {
      const template = `
<script>
const isActive = true
</script>
@if(isActive)
<p>Active</p>
@endif
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.variables.get('isActive')?.value).toBe('boolean')
    })

    it('should infer array type', () => {
      const template = `
<script>
const items = [1, 2, 3]
</script>
<p>{{ items.length }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.variables.get('items')?.kind).toBe('array')
    })

    it('should infer object type with properties', () => {
      const template = `
<script>
const user = { name: 'Alice', age: 30 }
</script>
<p>{{ user.name }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.variables.get('user')?.kind).toBe('object')
    })

    it('should handle typed variables', () => {
      const template = `
<script>
const name: string = 'World'
const count: number = 42
const active: boolean = true
</script>
<p>{{ name }} {{ count }} {{ active }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.variables.get('name')?.value).toBe('string')
      expect(result.variables.get('count')?.value).toBe('number')
      expect(result.variables.get('active')?.value).toBe('boolean')
    })

    it('should check @if directive conditions', () => {
      const template = `
<script>
const show = true
</script>
@if(show)
<p>Visible</p>
@endif
@if(unknownVar)
<p>Hidden</p>
@endif
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('unknownVar'))).toBe(true)
    })

    it('should check @foreach directive', () => {
      const template = `
<script>
const items = ['a', 'b', 'c']
</script>
@foreach(items as item)
<p>{{ item }}</p>
@endforeach
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
    })

    it('should report error for undefined collection in @foreach', () => {
      const template = `
@foreach(unknownList as item)
<p>{{ item }}</p>
@endforeach
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('unknownList'))).toBe(true)
    })

    it('should handle ternary expressions', () => {
      const template = `
<script>
const isAdmin = true
const name = 'User'
</script>
<p>{{ isAdmin ? 'Admin' : name }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
    })

    it('should handle logical operators', () => {
      const template = `
<script>
const a = true
const b = false
</script>
<p>{{ a && b }}</p>
<p>{{ a || b }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
    })

    it('should recognize built-in globals', () => {
      const template = `
<p>{{ Math.PI }}</p>
<p>{{ Math.round(3.14) }}</p>
<p>{{ JSON.stringify({ a: 1 }) }}</p>
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
    })

    it('should recognize loop variable in foreach', () => {
      const template = `
<script>
const items = [1, 2, 3]
</script>
@foreach(items as item)
<p>{{ loop.index }}: {{ item }}</p>
@endforeach
`
      const result = checkTemplate(template)
      expect(result.valid).toBe(true)
    })
  })

  describe('createTypeChecker', () => {
    it('should allow custom types', () => {
      const checker = createTypeChecker({
        customTypes: {
          User: {
            kind: 'object',
            properties: {
              id: { kind: 'primitive', value: 'number' },
              name: { kind: 'primitive', value: 'string' },
            },
          },
        },
      })

      checker.addVariable('currentUser', checker['variables'].get('User')!)
      const result = checker.checkTemplate(`<p>{{ currentUser.name }}</p>`)
      expect(result.valid).toBe(true)
    })

    it('should reset state between checks', () => {
      const checker = createTypeChecker()

      checker.checkTemplate(`<script>const x = 1</script>`)
      expect(checker['variables'].has('x')).toBe(true)

      checker.reset()
      expect(checker['variables'].has('x')).toBe(false)
    })
  })

  describe('formatTypeErrors', () => {
    it('should format errors nicely', () => {
      const result = checkTemplate(`<p>{{ unknownVar }}</p>`)
      const formatted = formatTypeErrors(result)

      expect(formatted).toContain('error')
      expect(formatted).toContain('unknownVar')
    })

    it('should show success message when valid', () => {
      const result = checkTemplate(`
<script>const x = 1</script>
<p>{{ x }}</p>
`)
      const formatted = formatTypeErrors(result)
      expect(formatted).toContain('No type errors found')
    })
  })

  describe('strict mode', () => {
    it('should treat warnings as errors in strict mode', () => {
      const result = checkTemplate(
        `
<script>
const user = { name: 'Alice' }
</script>
<p>{{ user.unknownProp }}</p>
`,
        { strict: true, allowAny: false, checkPropertyAccess: true },
      )
      // In strict mode with allowAny: false, accessing unknown properties should error
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
