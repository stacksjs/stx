/**
 * Comprehensive tests for the variable extractor module
 *
 * Tests cover:
 * - extractScriptFromTemplate
 * - extractDeclaredVariableNames (via convertToCommonJS + extractVariables)
 * - convertToCommonJS
 * - stripTypeScript
 * - hasVariables
 * - extractVariables (integration)
 */
import { describe, expect, it } from 'bun:test'
import {
  convertToCommonJS,
  extractScriptFromTemplate,
  extractVariables,
  hasVariables,
  stripTypeScript,
} from '../../src/variable-extractor'

// =============================================================================
// extractScriptFromTemplate
// =============================================================================

describe('extractScriptFromTemplate', () => {
  it('should extract a basic script block', () => {
    const template = '<script>const x = 1</script><div>{{ x }}</div>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('const x = 1')
    expect(result.templateWithoutScript).toBe('<div>{{ x }}</div>')
  })

  it('should extract script with server attribute', () => {
    const template = '<script server>const data = "hello"</script><p>{{ data }}</p>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('const data = "hello"')
  })

  it('should extract script with client attribute', () => {
    const template = '<script client>const x = 1</script><div></div>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('const x = 1')
  })

  it('should return empty scriptContent when no script tag', () => {
    const template = '<div>No script here</div>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('')
    expect(result.templateWithoutScript).toBe('<div>No script here</div>')
  })

  it('should handle empty script tags', () => {
    const template = '<script></script><div>hello</div>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('')
  })

  it('should extract multiline script content', () => {
    const template = `<script>
const title = 'Hello'
const count = 42
</script>
<h1>{{ title }}</h1>`
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toContain("const title = 'Hello'")
    expect(result.scriptContent).toContain('const count = 42')
  })

  it('should remove the script tag from the template', () => {
    const template = '<script>const x = 1</script><div>content</div>'
    const result = extractScriptFromTemplate(template)
    expect(result.templateWithoutScript).not.toContain('<script>')
    expect(result.templateWithoutScript).not.toContain('</script>')
    expect(result.templateWithoutScript).toContain('<div>content</div>')
  })

  it('should handle script with lang attribute', () => {
    const template = '<script lang="ts">const x: number = 1</script><div></div>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('const x: number = 1')
  })

  it('should only extract the first script block', () => {
    const template = '<script>const a = 1</script><script>const b = 2</script>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('const a = 1')
  })

  it('should handle script tag with type attribute', () => {
    const template = '<script type="module">export const x = 1</script><div></div>'
    const result = extractScriptFromTemplate(template)
    expect(result.scriptContent).toBe('export const x = 1')
  })
})

// =============================================================================
// convertToCommonJS
// =============================================================================

describe('convertToCommonJS', () => {
  describe('export variable declarations', () => {
    it('should convert export const to module.exports', () => {
      const result = convertToCommonJS('export const x = 1')
      expect(result).toContain('const x = 1;')
      expect(result).toContain('module.exports.x = x;')
    })

    it('should convert export let to module.exports', () => {
      const result = convertToCommonJS('export let y = "hello"')
      expect(result).toContain('let y = "hello";')
      expect(result).toContain('module.exports.y = y;')
    })

    it('should convert export var to module.exports', () => {
      const result = convertToCommonJS('export var z = true')
      expect(result).toContain('var z = true;')
      expect(result).toContain('module.exports.z = z;')
    })
  })

  describe('export function declarations', () => {
    it('should convert export function to module.exports', () => {
      const result = convertToCommonJS('export function greet() { return "hi" }')
      expect(result).toContain('function greet()')
      expect(result).toContain('module.exports.greet = greet;')
      expect(result).not.toContain('export function')
    })

    it('should convert export async function to module.exports', () => {
      const result = convertToCommonJS('export async function fetchData() { return 1 }')
      expect(result).toContain('async function fetchData()')
      expect(result).toContain('module.exports.fetchData = fetchData;')
    })
  })

  describe('non-exported declarations (auto-export)', () => {
    it('should auto-export const declarations', () => {
      const result = convertToCommonJS('const title = "hello"')
      expect(result).toContain('const title = "hello";')
      expect(result).toContain('module.exports.title = title;')
    })

    it('should auto-export let declarations', () => {
      const result = convertToCommonJS('let count = 0')
      expect(result).toContain('let count = 0;')
      expect(result).toContain('module.exports.count = count;')
    })

    it('should auto-export var declarations', () => {
      const result = convertToCommonJS('var flag = false')
      expect(result).toContain('var flag = false;')
      expect(result).toContain('module.exports.flag = flag;')
    })

    it('should auto-export function declarations', () => {
      const result = convertToCommonJS('function add(a, b) { return a + b }')
      expect(result).toContain('function add(a, b)')
      expect(result).toContain('module.exports.add = add;')
    })

    it('should auto-export async function declarations', () => {
      const result = convertToCommonJS('async function getData() { return [] }')
      expect(result).toContain('async function getData()')
      expect(result).toContain('module.exports.getData = getData;')
    })
  })

  describe('multi-line values', () => {
    it('should handle multi-line object values', () => {
      const code = `const config = {
  title: 'Hello',
  count: 42
}`
      const result = convertToCommonJS(code)
      expect(result).toContain('module.exports.config = config;')
    })

    it('should handle multi-line array values', () => {
      const code = `const items = [
  'apple',
  'banana',
  'cherry'
]`
      const result = convertToCommonJS(code)
      expect(result).toContain('module.exports.items = items;')
    })
  })

  describe('preserving existing module.exports', () => {
    it('should keep existing module.exports statements', () => {
      const code = 'module.exports.x = 42'
      const result = convertToCommonJS(code)
      expect(result).toContain('module.exports.x = 42')
    })
  })

  describe('multiple declarations', () => {
    it('should handle multiple const declarations', () => {
      const code = `const a = 1
const b = 2
const c = 3`
      const result = convertToCommonJS(code)
      expect(result).toContain('module.exports.a = a;')
      expect(result).toContain('module.exports.b = b;')
      expect(result).toContain('module.exports.c = c;')
    })
  })

  describe('arrow functions assigned to const', () => {
    it('should handle arrow function in const', () => {
      const code = 'const greet = (name) => `Hello ${name}`'
      const result = convertToCommonJS(code)
      expect(result).toContain('const greet =')
      expect(result).toContain('module.exports.greet = greet;')
    })
  })

  describe('comments and blank lines', () => {
    it('should skip comment-only lines', () => {
      const code = `// this is a comment
const x = 1`
      const result = convertToCommonJS(code)
      expect(result).not.toContain('// this is a comment')
      expect(result).toContain('module.exports.x = x;')
    })

    it('should skip blank lines', () => {
      const code = `const a = 1

const b = 2`
      const result = convertToCommonJS(code)
      expect(result).toContain('module.exports.a = a;')
      expect(result).toContain('module.exports.b = b;')
    })
  })
})

// =============================================================================
// stripTypeScript
// =============================================================================

describe('stripTypeScript', () => {
  describe('import removal', () => {
    it('should remove named imports', () => {
      const code = "import { ref } from 'stx'"
      const result = stripTypeScript(code)
      expect(result.trim()).toBe('')
    })

    it('should remove default imports', () => {
      const code = "import Vue from 'vue'"
      const result = stripTypeScript(code)
      expect(result.trim()).toBe('')
    })

    it('should remove side-effect imports', () => {
      const code = "import 'styles.css'"
      const result = stripTypeScript(code)
      expect(result.trim()).toBe('')
    })
  })

  describe('type annotation removal', () => {
    it('should remove type annotation from const', () => {
      const code = "const x: string = 'hello'"
      const result = stripTypeScript(code)
      expect(result).toContain('const x')
      expect(result).toContain("= 'hello'")
      expect(result).not.toContain(': string')
    })

    it('should remove type annotation from let', () => {
      const code = 'let count: number = 42'
      const result = stripTypeScript(code)
      expect(result).toContain('let count')
      expect(result).toContain('= 42')
    })

    it('should remove array type annotation', () => {
      const code = 'const items: string[] = []'
      const result = stripTypeScript(code)
      expect(result).toContain('const items')
      expect(result).toContain('= []')
    })

    it('should remove type from destructured variable', () => {
      const code = 'const { a, b }: Props = obj'
      const result = stripTypeScript(code)
      expect(result).toContain('const { a, b }')
      expect(result).toContain('= obj')
    })

    it('should remove type from export const', () => {
      const code = "export const title: string = 'hello'"
      const result = stripTypeScript(code)
      expect(result).toContain('export const title')
      expect(result).not.toContain(': string')
    })
  })

  describe('function parameter type removal', () => {
    it('should remove parameter types from function declaration', () => {
      const code = 'function greet(name: string, age: number) { return name }'
      const result = stripTypeScript(code)
      expect(result).toContain('function greet(name, age)')
    })

    it('should preserve default values when removing types', () => {
      const code = "function foo(x: string = 'hi') { return x }"
      const result = stripTypeScript(code)
      expect(result).toContain("x = 'hi'")
    })

    it('should remove types from arrow function parameters', () => {
      const code = '(a: string, b: number) => a + b'
      const result = stripTypeScript(code)
      expect(result).toContain('(a, b) =>')
    })
  })

  describe('return type removal', () => {
    it('should remove return type from function', () => {
      const code = 'function foo(): string {'
      const result = stripTypeScript(code)
      expect(result).toContain('function foo()')
      expect(result).toContain('{')
      expect(result).not.toContain(': string')
    })

    it('should remove void return type', () => {
      const code = 'function doStuff(): void {'
      const result = stripTypeScript(code)
      expect(result).toContain('function doStuff()')
      expect(result).not.toContain(': void')
    })
  })

  describe('interface and type removal', () => {
    it('should remove interface declarations', () => {
      const code = `interface User {
  name: string
  age: number
}`
      const result = stripTypeScript(code)
      expect(result).not.toContain('interface User')
      expect(result).not.toContain('name: string')
    })

    it('should remove type alias declarations', () => {
      const code = `type Status = 'active' | 'inactive'
const x = 1`
      const result = stripTypeScript(code)
      expect(result).not.toContain("type Status = 'active'")
    })
  })

  describe('generic type removal', () => {
    it('should remove generics from function declarations', () => {
      const code = 'function identity<T>(x) { return x }'
      const result = stripTypeScript(code)
      expect(result).toContain('function identity')
      expect(result).not.toContain('<T>')
    })

    it('should remove generics from common types like Array', () => {
      const code = 'const arr = Array<string>()'
      const result = stripTypeScript(code)
      expect(result).not.toContain('<string>')
    })

    it('should remove generics from Promise', () => {
      const code = 'const p = Promise<void>()'
      const result = stripTypeScript(code)
      expect(result).not.toContain('<void>')
    })

    it('should remove generics from defineProps', () => {
      const code = 'const props = defineProps<{ name: string }>()'
      const result = stripTypeScript(code)
      expect(result).toContain('defineProps')
      expect(result).not.toContain('<{ name: string }>')
    })
  })

  describe('as assertions', () => {
    it('should remove "as Type" assertions', () => {
      const code = 'const x = value as string'
      const result = stripTypeScript(code)
      expect(result).not.toContain('as string')
      expect(result).toContain('const x = value')
    })

    it('should remove "as Type[]" assertions', () => {
      const code = 'const arr = data as number[]'
      const result = stripTypeScript(code)
      expect(result).not.toContain('as number[]')
    })
  })

  describe('preserving runtime code', () => {
    it('should preserve regular JavaScript', () => {
      const code = "const x = 'hello'\nconst y = x.toUpperCase()"
      const result = stripTypeScript(code)
      expect(result).toContain("const x = 'hello'")
      expect(result).toContain('const y = x.toUpperCase()')
    })

    it('should not modify comparison operators', () => {
      const code = 'if (x < 10 && y > 5) return true'
      const result = stripTypeScript(code)
      expect(result).toContain('x < 10')
      expect(result).toContain('y > 5')
    })

    it('should preserve template literals', () => {
      const code = 'const msg = `Hello ${name}`'
      const result = stripTypeScript(code)
      expect(result).toContain('`Hello ${name}`')
    })

    it('should preserve arrow functions', () => {
      const code = 'const fn = () => 42'
      const result = stripTypeScript(code)
      expect(result).toContain('() => 42')
    })
  })
})

// =============================================================================
// hasVariables
// =============================================================================

describe('hasVariables', () => {
  it('should return true for const declarations', () => {
    expect(hasVariables('const x = 1')).toBe(true)
  })

  it('should return true for let declarations', () => {
    expect(hasVariables('let y = 2')).toBe(true)
  })

  it('should return true for var declarations', () => {
    expect(hasVariables('var z = 3')).toBe(true)
  })

  it('should return true for function declarations', () => {
    expect(hasVariables('function foo() {}')).toBe(true)
  })

  it('should return false for empty string', () => {
    expect(hasVariables('')).toBe(false)
  })

  it('should return false for whitespace only', () => {
    expect(hasVariables('   \n\t  ')).toBe(false)
  })

  it('should return false for plain text without declarations', () => {
    expect(hasVariables('hello world')).toBe(false)
  })

  it('should return true when comment contains declaration-like text (regex-based check)', () => {
    // hasVariables uses a simple regex that does not parse comments,
    // so commented-out declarations still match
    expect(hasVariables('// const x = 1')).toBe(true)
  })
})

// =============================================================================
// extractVariables (integration tests)
// =============================================================================

describe('extractVariables', () => {
  it('should extract simple const declaration', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables("const title = 'Hello'", context, 'test.stx')
    expect(context.title).toBe('Hello')
  })

  it('should extract simple let declaration', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('let count = 42', context, 'test.stx')
    expect(context.count).toBe(42)
  })

  it('should extract numeric values', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('const num = 3.14', context, 'test.stx')
    expect(context.num).toBe(3.14)
  })

  it('should extract boolean values', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('const flag = true', context, 'test.stx')
    expect(context.flag).toBe(true)
  })

  it('should extract array values', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables("const items = ['a', 'b', 'c']", context, 'test.stx')
    expect(context.items).toEqual(['a', 'b', 'c'])
  })

  it('should extract object values', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables("const config = { name: 'test', value: 1 }", context, 'test.stx')
    const config = context.config as Record<string, unknown>
    expect(config.name).toBe('test')
    expect(config.value).toBe(1)
  })

  it('should extract exported const declaration', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables("export const greeting = 'Hi'", context, 'test.stx')
    expect(context.greeting).toBe('Hi')
  })

  it('should extract function declarations', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('function add(a, b) { return a + b }', context, 'test.stx')
    expect(typeof context.add).toBe('function')
    expect((context.add as Function)(2, 3)).toBe(5)
  })

  it('should extract multiple declarations', async () => {
    const context: Record<string, unknown> = {}
    const script = `const a = 1
const b = 2
const c = 3`
    await extractVariables(script, context, 'test.stx')
    expect(context.a).toBe(1)
    expect(context.b).toBe(2)
    expect(context.c).toBe(3)
  })

  it('should handle empty script content', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('', context, 'test.stx')
    expect(Object.keys(context).length).toBe(0)
  })

  it('should handle whitespace-only script content', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('   \n\t  ', context, 'test.stx')
    expect(Object.keys(context).length).toBe(0)
  })

  it('should extract template literal values', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('const name = "World"\nconst msg = `Hello ${name}!`', context, 'test.stx')
    expect(context.msg).toBe('Hello World!')
  })

  it('should extract arrow functions assigned to const', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('const double = (x) => x * 2', context, 'test.stx')
    expect(typeof context.double).toBe('function')
    expect((context.double as Function)(5)).toBe(10)
  })

  it('should extract async function declarations', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('async function fetchData() { return 42 }', context, 'test.stx')
    expect(typeof context.fetchData).toBe('function')
  })

  it('should handle TypeScript type annotations', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables("const name: string = 'typed'", context, 'test.stx')
    expect(context.name).toBe('typed')
  })

  it('should handle multi-line objects', async () => {
    const context: Record<string, unknown> = {}
    const script = `const user = {
  name: 'Alice',
  age: 30,
  active: true
}`
    await extractVariables(script, context, 'test.stx')
    const user = context.user as Record<string, unknown>
    expect(user.name).toBe('Alice')
    expect(user.age).toBe(30)
    expect(user.active).toBe(true)
  })

  it('should handle multi-line arrays', async () => {
    const context: Record<string, unknown> = {}
    const script = `const colors = [
  'red',
  'green',
  'blue'
]`
    await extractVariables(script, context, 'test.stx')
    expect(context.colors).toEqual(['red', 'green', 'blue'])
  })

  it('should handle destructuring from object', async () => {
    const context: Record<string, unknown> = {}
    const script = `const obj = { a: 1, b: 2 }
const { a, b } = obj`
    await extractVariables(script, context, 'test.stx')
    expect(context.a).toBe(1)
    expect(context.b).toBe(2)
  })

  it('should handle export function with module.exports', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables("export function hello() { return 'world' }", context, 'test.stx')
    expect(typeof context.hello).toBe('function')
    expect((context.hello as Function)()).toBe('world')
  })

  it('should handle computed values', async () => {
    const context: Record<string, unknown> = {}
    const script = `const base = 10
const doubled = base * 2`
    await extractVariables(script, context, 'test.stx')
    expect(context.doubled).toBe(20)
  })

  it('should handle null and undefined', async () => {
    const context: Record<string, unknown> = {}
    const script = `const nothing = null
const undef = undefined`
    await extractVariables(script, context, 'test.stx')
    expect(context.nothing).toBeNull()
    expect(context.undef).toBeUndefined()
  })

  it('should handle existing context variables', async () => {
    const context: Record<string, unknown> = { existing: 'preserved' }
    await extractVariables("const added = 'new'", context, 'test.stx')
    expect(context.existing).toBe('preserved')
    expect(context.added).toBe('new')
  })

  it('should handle Math and built-in functions', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('const pi = Math.PI', context, 'test.stx')
    expect(context.pi).toBe(Math.PI)
  })

  it('should handle ternary expressions', async () => {
    const context: Record<string, unknown> = {}
    const script = `const x = 5
const result = x > 3 ? 'big' : 'small'`
    await extractVariables(script, context, 'test.stx')
    expect(context.result).toBe('big')
  })

  it('should handle string concatenation', async () => {
    const context: Record<string, unknown> = {}
    const script = `const first = 'Hello'
const second = ' World'
const full = first + second`
    await extractVariables(script, context, 'test.stx')
    expect(context.full).toBe('Hello World')
  })

  it('should handle Date objects', async () => {
    const context: Record<string, unknown> = {}
    await extractVariables('const now = new Date(0)', context, 'test.stx')
    expect(context.now).toBeInstanceOf(Date)
  })

  it('should handle TypeScript interface removal before extraction', async () => {
    const context: Record<string, unknown> = {}
    const script = `interface User {
  name: string
}
const userName = 'Alice'`
    await extractVariables(script, context, 'test.stx')
    expect(context.userName).toBe('Alice')
  })
})

// =============================================================================
// stripTypeScript complex generics (from discovered-bugs)
// =============================================================================

describe('stripTypeScript complex generics', () => {
  it('should strip Record<string, any> from function params', () => {
    const result = stripTypeScript('function foo(x: Record<string, any>): void { return }')
    expect(result).not.toContain('any>')
    expect(result).not.toContain('Record')
  })

  it('should strip Map<string, number> from function params', () => {
    const result = stripTypeScript('function bar(m: Map<string, number>): void {}')
    expect(result).not.toContain('Map<')
    expect(result).not.toContain('number>')
  })

  it('should strip Promise<Array<string>> from function params', () => {
    const result = stripTypeScript('async function baz(p: Promise<Array<string>>): Promise<void> {}')
    expect(result).not.toContain('Promise<')
    expect(result).not.toContain('Array<')
  })

  it('should handle multiple params with generics', () => {
    const result = stripTypeScript('function multi(a: Map<string, any>, b: Set<number>): void {}')
    expect(result).not.toContain('Map<')
    expect(result).not.toContain('Set<')
    expect(result).toContain('function multi(a, b)')
  })
})

// =============================================================================
// stripTypeScript additional edge cases (from discovered-bugs)
// =============================================================================

describe('stripTypeScript additional edge cases', () => {
  it('should strip union types from declarations', () => {
    const r = stripTypeScript('const x: string | number = 42')
    expect(r.trim()).toBe('const x= 42')
  })

  it('should strip array types', () => {
    const r = stripTypeScript('const items: string[] = []')
    expect(r.trim()).toBe('const items= []')
  })

  it('should strip tuple types', () => {
    const r = stripTypeScript('const pair: [string, number] = ["a", 1]')
    expect(r.trim()).toBe('const pair= ["a", 1]')
  })

  it('should strip intersection types', () => {
    const r = stripTypeScript('const x: TypeA & TypeB = val')
    expect(r).not.toContain('TypeA')
    expect(r).not.toContain('TypeB')
  })

  it('should strip optional parameter marker', () => {
    const r = stripTypeScript('function foo(x?: string) {}')
    expect(r).toContain('function foo(x)')
    expect(r).not.toContain('?')
  })

  it('should strip readonly modifier', () => {
    const r = stripTypeScript('const arr: readonly string[] = []')
    expect(r).not.toContain('readonly')
  })

  it('angle bracket type assertions are a known limitation (ambiguous with JSX)', () => {
    const r = stripTypeScript('const x = <string>someValue')
    expect(typeof r).toBe('string')
  })

  it('should strip enum declarations', () => {
    const r = stripTypeScript('enum Color { Red, Green, Blue }')
    expect(r.trim()).not.toContain('enum')
  })

  it('should strip non-null assertion operator', () => {
    const r = stripTypeScript('const x = obj!.property')
    expect(r).not.toContain('!')
    expect(r).toContain('obj.property')
  })

  it('should strip satisfies keyword', () => {
    const r = stripTypeScript('const x = { a: 1 } satisfies Config')
    expect(r).not.toContain('satisfies')
  })
})

// =============================================================================
// convertToCommonJS bugs (from discovered-bugs)
// =============================================================================

describe('convertToCommonJS edge cases', () => {
  it('should export class declarations', () => {
    const r = convertToCommonJS('class MyClass { constructor() {} }')
    expect(r).toContain('module.exports.MyClass')
  })

  it('should handle export default', () => {
    const r = convertToCommonJS('export default function greet() { return "hi" }')
    expect(r).toContain('module.exports.default')
  })

  it('should export async function declarations', () => {
    const r = convertToCommonJS('async function fetchData() { return [] }')
    expect(r).toContain('module.exports.fetchData')
  })

  it('should export arrow functions assigned to const', () => {
    const r = convertToCommonJS('const greet = (name) => `Hello ${name}`')
    expect(r).toContain('module.exports.greet')
  })

  it('should export all declarations', () => {
    const r = convertToCommonJS('const a = 1\nlet b = 2\nvar c = 3')
    expect(r).toContain('module.exports.a')
    expect(r).toContain('module.exports.b')
    expect(r).toContain('module.exports.c')
  })
})
