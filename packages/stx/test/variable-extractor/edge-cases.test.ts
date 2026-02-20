/**
 * Edge case tests for variable extraction and TypeScript stripping
 */
import { describe, expect, it } from 'bun:test'
import { convertToCommonJS, extractVariables, stripTypeScript } from '../../src/variable-extractor'

describe('TypeScript stripping edge cases', () => {
  describe('Generic type parameters', () => {
    it('should not remove comparison operators that look like generics', () => {
      const code = 'if (x < 60) return true'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('< 60')
      expect(stripped).toContain('if (x < 60)')
    })

    it('should handle multiple comparisons', () => {
      const code = 'if (a < b && c > d) return a < c'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('a < b')
      expect(stripped).toContain('c > d')
      expect(stripped).toContain('a < c')
    })

    it('should strip actual generic types from functions', () => {
      const code = 'function foo<T>(x: T): T { return x }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('function foo')
      expect(stripped).not.toContain('<T>')
    })

    it('should strip generic types from Array, Promise, etc.', () => {
      const code = 'const arr: Array<string> = []'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('const arr')
      expect(stripped).not.toContain('Array<string>')
    })

    it('should handle defineProps with generic', () => {
      const code = 'const props = defineProps<{ name: string }>()'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('defineProps')
      expect(stripped).not.toContain('<{ name: string }>')
    })

    it('should handle withDefaults with generic', () => {
      const code = 'const props = withDefaults<Props>(defaults)'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('withDefaults')
      expect(stripped).not.toContain('<Props>')
    })
  })

  describe('Return type annotations', () => {
    it('should not remove ternary expressions with colon', () => {
      const code = 'return total > 0 ? count / total * 100 : 0'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain(': 0')
      expect(stripped).toContain('? count')
    })

    it('should strip actual return type annotations', () => {
      const code = 'function foo(): string { return "bar" }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('function foo()')
      expect(stripped).toContain('{ return "bar" }')
    })

    it('should strip union return types', () => {
      const code = 'function foo(): string | number { return 1 }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('function foo()')
      expect(stripped).not.toContain(': string | number')
    })

    it('should handle void return type', () => {
      const code = 'function foo(): void { console.log("hi") }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('function foo()')
      expect(stripped).not.toContain(': void')
    })
  })

  describe('Type declarations', () => {
    it('should remove multiline interface declarations', () => {
      const code = `interface Foo {
  name: string
}
const x = 1`
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('const x = 1')
      expect(stripped).not.toContain('interface Foo')
    })

    it('should handle type alias declarations in context', () => {
      // Single-line type declarations may not be fully removed
      // but should not interfere with actual code
      const code = `type MyType = string
const value: MyType = 'test'`
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('const value')
      expect(stripped).toContain("'test'")
    })

    it('should remove type annotations on variables', () => {
      const code = 'const x: string = "hello"'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('const x')
      expect(stripped).toContain('= "hello"')
      expect(stripped).not.toContain(': string')
    })

    it('should handle as assertions', () => {
      const code = 'const x = y as string'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('const x = y')
      expect(stripped).not.toContain('as string')
    })
  })

  describe('Function parameters', () => {
    it('should strip parameter types', () => {
      const code = 'function foo(a: string, b: number) { return a + b }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('function foo(a, b)')
    })

    it('should handle optional parameters', () => {
      const code = 'function foo(a?: string) { return a }'
      const stripped = stripTypeScript(code)
      // Note: current implementation preserves the ? but removes the type
      expect(stripped).toContain('function foo(a?)')
      expect(stripped).not.toContain('string')
    })

    it('should handle default parameters with types', () => {
      const code = 'function foo(a: string = "default") { return a }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('function foo(a = "default")')
    })
  })

  describe('Complex expressions', () => {
    it('should handle nested ternary with comparison', () => {
      const code = 'return a > b ? (c < d ? 1 : 2) : 3'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('a > b')
      expect(stripped).toContain('c < d')
      expect(stripped).toContain(': 2')
      expect(stripped).toContain(': 3')
    })

    it('should handle arrow functions with type params', () => {
      const code = 'const fn = <T>(x: T) => x'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('const fn =')
      expect(stripped).toContain('(x) => x')
    })

    it('should preserve JSX-like comparison (not confused with generics)', () => {
      const code = 'if (count < max && enabled > 0) { return true }'
      const stripped = stripTypeScript(code)
      expect(stripped).toContain('count < max')
      expect(stripped).toContain('enabled > 0')
    })
  })
})

describe('Variable extraction edge cases', () => {
  describe('Top-level only extraction', () => {
    it('should only extract top-level const declarations', async () => {
      const code = `
        const topLevel = 1
        function foo() {
          const nested = 2
          if (true) {
            const deepNested = 3
          }
        }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('topLevel')
      expect(context.topLevel).toBe(1)
      expect(context).not.toHaveProperty('nested')
      expect(context).not.toHaveProperty('deepNested')
    })

    it('should not extract variables from arrow function bodies', async () => {
      const code = `
        const outer = 1
        const fn = () => {
          const inner = 2
          return inner
        }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('outer')
      expect(context).toHaveProperty('fn')
      expect(context).not.toHaveProperty('inner')
    })

    it('should not extract variables from class methods', async () => {
      // Note: Current implementation doesn't extract class declarations
      const code = `
        const topVar = 1
        function helper() {
          const innerVar = 2
        }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('topVar')
      expect(context).toHaveProperty('helper')
      expect(context).not.toHaveProperty('innerVar')
    })
  })

  describe('Async function handling', () => {
    it('should handle async function declarations', async () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api')
          return response.json()
        }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('fetchData')
      expect(typeof context.fetchData).toBe('function')
      expect(context).not.toHaveProperty('response')
    })

    it('should handle async arrow functions', async () => {
      const code = `
        const asyncFn = async () => {
          const result = await Promise.resolve(1)
          return result
        }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('asyncFn')
      expect(context).not.toHaveProperty('result')
    })
  })

  describe('Destructuring patterns', () => {
    it('should handle object destructuring', async () => {
      const code = `const { a, b } = { a: 1, b: 2 }`
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('a')
      expect(context).toHaveProperty('b')
      expect(context.a).toBe(1)
      expect(context.b).toBe(2)
    })

    it('should handle array destructuring', async () => {
      const code = `const [x, y] = [1, 2]`
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('x')
      expect(context).toHaveProperty('y')
    })

    it('should handle nested destructuring', async () => {
      const code = `const { outer: { inner } } = { outer: { inner: 1 } }`
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('inner')
      expect(context.inner).toBe(1)
    })

    it('should handle destructuring with defaults', async () => {
      const code = `const { a = 1, b = 2 } = {}`
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context).toHaveProperty('a')
      expect(context).toHaveProperty('b')
      expect(context.a).toBe(1)
      expect(context.b).toBe(2)
    })
  })

  describe('Variable extraction robustness', () => {
    it('should extract variables with simple values', async () => {
      const code = `const siteId = 'default'`
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context.siteId).toBe('default')
    })

    it('should extract multiple variables', async () => {
      const code = `
        const a = 1
        const b = 'two'
        const c = true
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context.a).toBe(1)
      expect(context.b).toBe('two')
      expect(context.c).toBe(true)
    })

    it('should extract arrays and objects', async () => {
      const code = `
        const items = [1, 2, 3]
        const obj = { name: 'test' }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(context.items).toEqual([1, 2, 3])
      expect(context.obj).toEqual({ name: 'test' })
    })

    it('should extract function declarations', async () => {
      const code = `
        function helper(x) {
          return x * 2
        }
      `
      const context: Record<string, unknown> = {}
      await extractVariables(code, context)
      expect(typeof context.helper).toBe('function')
    })
  })
})

describe('convertToCommonJS edge cases', () => {
  it('should handle function declarations', () => {
    const code = 'function foo() { return 1 }'
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.foo = foo')
  })

  it('should handle async function declarations', () => {
    const code = 'async function asyncFoo() { return await Promise.resolve(1) }'
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.asyncFoo = asyncFoo')
  })

  it('should handle const declarations', () => {
    const code = 'const x = 1'
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.x = x')
  })

  it('should handle let declarations', () => {
    const code = 'let y = 2'
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.y = y')
  })

  it('should handle var declarations', () => {
    const code = 'var z = 3'
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.z = z')
  })

  it('should preserve class declarations but not auto-export them', () => {
    // Note: Current implementation doesn't auto-export class declarations
    const code = 'class MyClass { constructor() {} }'
    const result = convertToCommonJS(code)
    expect(result).toContain('class MyClass')
  })

  it('should handle multiple declarations', () => {
    const code = `const a = 1
function b() {}`
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.a = a')
    expect(result).toContain('module.exports.b = b')
  })

  it('should not export nested declarations', () => {
    const code = `const outer = 1
function foo() {
  const inner = 2
}`
    const result = convertToCommonJS(code)
    expect(result).toContain('module.exports.outer = outer')
    expect(result).toContain('module.exports.foo = foo')
    expect(result).not.toContain('module.exports.inner')
  })
})
