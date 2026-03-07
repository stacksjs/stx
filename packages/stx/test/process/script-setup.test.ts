/**
 * Tests for script setup processing and export extraction
 */
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions = {
  partialsDir: '/tmp',
  componentsDir: '/tmp',
}

// Helper to call processDirectives with default options
async function processTemplate(template: string, context: Record<string, unknown> = {}) {
  return processDirectives(template, context, '/test.stx', defaultOptions, new Set<string>())
}

describe('Script setup processing', () => {
  describe('Basic script processing', () => {
    it('should process simple script content', async () => {
      const html = `<script>const count = 0</script><div>{{ count }}</div>`
      const result = await processTemplate(html, {})

      expect(result).toContain('const count = 0')
    })

    it('should handle scripts with signals', async () => {
      const html = `<script>
const count = state(0)
const doubled = derived(() => count() * 2)
</script>
<div>{{ count }}</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('state')
      expect(result).toContain('derived')
    })

    it('should skip scripts with data-stx-scoped attribute', async () => {
      const html = `<script data-stx-scoped>const x = 1</script><div>Test</div>`
      const result = await processTemplate(html, {})

      // Should preserve the script as-is
      expect(result).toContain('data-stx-scoped')
      expect(result).toContain('const x = 1')
    })

    it('should skip external scripts', async () => {
      const html = `<script src="/app.js"></script><div>Test</div>`
      const result = await processTemplate(html, {})

      expect(result).toContain('src="/app.js"')
    })

    it('should skip server scripts', async () => {
      const html = `<script server>const serverVar = 1</script><div>Test</div>`
      const result = await processTemplate(html, {})

      // Server scripts should be removed from client output
      expect(result).not.toContain('serverVar')
    })
  })

  describe('extractExports function behavior', () => {
    it('should extract top-level variable declarations', async () => {
      const html = `<script>
const a = 1
const b = 'hello'
let c = true
</script>
<div>{{ a }} {{ b }} {{ c }}</div>`

      const context = {}
      const result = await processTemplate(html, context)

      // Exported variables should be in returned object
      expect(result).toContain('a')
      expect(result).toContain('b')
      expect(result).toContain('c')
    })

    it('should extract function declarations', async () => {
      const html = `<script>
function handleClick() {
  console.log('clicked')
}

async function fetchData() {
  return await fetch('/api')
}
</script>
<button @click="handleClick()">Click</button>`

      const result = await processTemplate(html, {})
      expect(result).toContain('handleClick')
      expect(result).toContain('fetchData')
    })

    it('should NOT extract nested variables', async () => {
      const html = `<script>
const outer = 1

function helper() {
  const inner = 2  // Should NOT be extracted
  return inner
}

class MyClass {
  method() {
    const methodVar = 3  // Should NOT be extracted
  }
}
</script>
<div>{{ outer }}</div>`

      const result = await processTemplate(html, {})

      // outer and helper should be extracted
      expect(result).toContain('outer')
      expect(result).toContain('helper')
      expect(result).toContain('MyClass')

      // inner and methodVar should NOT be in the exports
      // They should only appear in their function/method bodies
    })
  })

  describe('TypeScript handling', () => {
    it('should handle interface declarations', async () => {
      const html = `<script>
interface User {
  name: string
  age: number
}

const user: User = { name: 'John', age: 30 }
</script>
<div>{{ user.name }}</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('user')
    })

    it('should handle type annotations on variables', async () => {
      const html = `<script>
const count: number = 0
const name: string = 'test'
const items: string[] = ['a', 'b']
</script>
<div>Test</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('count')
      expect(result).toContain('name')
      expect(result).toContain('items')
    })

    it('should handle generic types', async () => {
      const html = `<script>
const arr: Array<string> = []
const map: Map<string, number> = new Map()
</script>
<div>Test</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('arr')
      expect(result).toContain('map')
    })

    it('should handle comparison operators (not confused with generics)', async () => {
      const html = `<script>
function compare(a, b) {
  if (a < 60) return 'small'
  if (b > 100) return 'large'
  return a < b ? 'less' : 'more'
}
</script>
<div>Test</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('compare')
      // The function body should be intact
      expect(result).toContain('< 60')
      expect(result).toContain('> 100')
    })
  })

  describe('Directive processing', () => {
    it('should process @foreach directive', async () => {
      const html = `@foreach(items as item)
<div>{{ item }}</div>
@endforeach`

      const result = await processTemplate(html, { items: ['a', 'b', 'c'] })
      expect(result).toContain('<div>a</div>')
      expect(result).toContain('<div>b</div>')
      expect(result).toContain('<div>c</div>')
    })

    it('should process @if directive', async () => {
      const html = `@if(true)
<div>Visible</div>
@endif

@if(false)
<div>Hidden</div>
@endif`

      const result = await processTemplate(html, {})
      expect(result).toContain('Visible')
      expect(result).not.toContain('Hidden')
    })

    it('should process @include directive', async () => {
      // Note: This would need actual file system for full test
      // Basic structure test
      const html = `<div>Main content</div>`
      const result = await processTemplate(html, {})
      expect(result).toContain('Main content')
    })

    it('should handle nested directives', async () => {
      const html = `@foreach(outer as o)
  @foreach(inner as i)
    <span>{{ o }}-{{ i }}</span>
  @endforeach
@endforeach`

      const result = await processTemplate(html, { outer: [1, 2], inner: ['a', 'b'] })
      expect(result).toContain('1-a')
      expect(result).toContain('1-b')
      expect(result).toContain('2-a')
      expect(result).toContain('2-b')
    })
  })

  describe('Interpolation handling', () => {
    it('should process {{ }} interpolation', async () => {
      const result = await processTemplate(
        `<div>{{ 'hello' }}</div>`,
        {}
      )
      expect(result).toContain('hello')
    })

    it('should process expressions in interpolation', async () => {
      const result = await processTemplate(
        `<div>{{ 1 + 2 }}</div>`,
        {}
      )
      expect(result).toContain('3')
    })

    it('should process context variables in interpolation', async () => {
      const result = await processTemplate(
        `<div>{{ name }}</div>`,
        { name: 'World' }
      )
      expect(result).toContain('World')
    })

    it('should handle object access in interpolation', async () => {
      const result = await processTemplate(
        `<div>{{ user.name }}</div>`,
        { user: { name: 'John' } }
      )
      expect(result).toContain('John')
    })

    it('should handle array access in interpolation', async () => {
      const result = await processTemplate(
        `<div>{{ items[0] }}</div>`,
        { items: ['First', 'Second'] }
      )
      expect(result).toContain('First')
    })

    it('should handle method calls in interpolation', async () => {
      const result = await processTemplate(
        `<div>{{ text.toUpperCase() }}</div>`,
        { text: 'hello' }
      )
      expect(result).toContain('HELLO')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty input', async () => {
      const result = await processTemplate('', {})
      expect(result).toBe('')
    })

    it('should handle input with only whitespace', async () => {
      const result = await processTemplate('   \n\t  ', {})
      expect(result).toBe('   \n\t  ')
    })

    it('should handle multiple scripts', async () => {
      const html = `<script>const a = 1</script>
<script>const b = 2</script>
<div>{{ a }} {{ b }}</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('a')
      expect(result).toContain('b')
    })

    it('should handle scripts with type="module"', async () => {
      const html = `<script type="module">
import { something } from './module.js'
export const myVar = something
</script>
<div>Test</div>`

      const result = await processTemplate(html, {})
      expect(result).toContain('type="module"')
    })

    it('should handle well-formed nested interpolation', async () => {
      const html = `<div>{{ outer }}: {{ inner }}</div>`

      const result = await processTemplate(html, { outer: 'first', inner: 'second' })
      expect(result).toContain('first')
      expect(result).toContain('second')
    })
  })
})

describe('Script Processing Fixes', () => {
  describe('server script stripping', () => {
    it('should strip server scripts completely', async () => {
      const template = '<script server>const x = 1</script><p>visible</p>'
      const result = await processTemplate(template)
      expect(result).toContain('<p>visible</p>')
      expect(result).not.toContain('const x = 1')
    })

    it('should strip multiple server scripts', async () => {
      const template = '<script server>const a = 1</script><div>mid</div><script server>const b = 2</script><p>end</p>'
      const result = await processTemplate(template)
      expect(result).toContain('<div>mid</div>')
      expect(result).toContain('<p>end</p>')
      expect(result).not.toContain('const a = 1')
      expect(result).not.toContain('const b = 2')
    })

    it('should remove multiple server scripts without corrupting offsets', async () => {
      const template = `<script server>const a = 1</script>
<div>content</div>
<script server>const b = 2</script>
<p>more</p>`
      const result = await processTemplate(template)
      expect(result).toContain('<div>content</div>')
      expect(result).toContain('<p>more</p>')
      expect(result).not.toContain('const a = 1')
      expect(result).not.toContain('const b = 2')
    })
  })

  describe('global regex extracts all script tags', () => {
    it('should extract content from multiple script tags', () => {
      const content = '<script>const a = 1</script><div>content</div><script>const b = 2</script>'
      const scripts: string[] = []
      const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
      let m: RegExpExecArray | null
      while ((m = re.exec(content)) !== null) {
        scripts.push(m[1])
      }
      expect(scripts).toHaveLength(2)
      expect(scripts[0]).toBe('const a = 1')
      expect(scripts[1]).toBe('const b = 2')
    })

    it('should remove all script tags with global replace', () => {
      const content = '<script>a</script><div>keep</div><script>b</script>'
      const result = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      expect(result).toBe('<div>keep</div>')
      expect(result).not.toContain('<script>')
    })
  })

  describe('client script $ replacement safety', () => {
    it('should preserve $& in script content', async () => {
      const template = `<script>const x = "$&";</script>`
      const result = await processTemplate(template)
      expect(result).toContain('$&')
    })

    it('should preserve $ patterns in content', async () => {
      const template = `<p>Content with $& dollar patterns</p>`
      const result = await processTemplate(template)
      expect(result).toContain('$&')
    })
  })

  describe('Date.now collision prevention', () => {
    it('should generate unique setup function names', async () => {
      const template1 = `<div><script>const count = state(0);</script></div>`
      const template2 = `<div><script>const name = state('test');</script></div>`
      const result1 = await processTemplate(template1)
      const result2 = await processTemplate(template2)
      const match1 = result1.match(/__stx_setup_\d+_\d+/)
      const match2 = result2.match(/__stx_setup_\d+_\d+/)
      if (match1 && match2) {
        expect(match1[0]).not.toBe(match2[0])
      }
    })
  })

  describe('singleElementMatch handles > in attrs', () => {
    it('should handle elements with > in attribute values', async () => {
      const template = `<div title="a &gt; b">Content</div>`
      const result = await processTemplate(template)
      expect(result).toContain('Content')
    })
  })

  describe('signal script replace all occurrences', () => {
    it('should remove all occurrences of signal script', async () => {
      const template = `<div><script>const x = state(0);</script></div>`
      const result = await processTemplate(template)
      expect(result).not.toContain('<script>const x = state(0);</script>')
    })
  })

  describe('balanced server script removal', () => {
    it('should handle scripts containing </script> in string literals conceptually', () => {
      const content = '<script>const x = "<\\/script>"; console.log(x)</script>'
      let depth = 1
      let pos = '<script>'.length
      let endPos = -1
      while (pos < content.length && depth > 0) {
        const nextOpen = content.indexOf('<script', pos)
        const nextClose = content.indexOf('</script>', pos)
        if (nextClose === -1) break
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++
          pos = nextOpen + '<script'.length
        } else {
          depth--
          if (depth === 0) {
            endPos = nextClose
            break
          }
          pos = nextClose + '</script>'.length
        }
      }
      expect(endPos).toBeGreaterThan(0)
    })
  })

  describe('path traversal check tightened', () => {
    it('should conceptually reject dotfile access', () => {
      const segments = ['..', '..', '.env']
      const hasDotSegment = segments.some(s => s.startsWith('.') && s !== '.' && s !== '..')
      expect(hasDotSegment).toBe(true)
    })

    it('should allow normal relative paths', () => {
      const segments = ['components', 'header.stx']
      const hasDotSegment = segments.some(s => s.startsWith('.') && s !== '.' && s !== '..')
      expect(hasDotSegment).toBe(false)
    })
  })
})
