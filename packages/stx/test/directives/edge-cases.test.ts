/**
 * Edge case tests for STX directives
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

describe('Directive edge cases', () => {
  describe('@foreach directive', () => {
    it('should handle empty arrays', async () => {
      const result = await processTemplate(
        `@foreach(items as item)
<div>{{ item }}</div>
@endforeach`,
        { items: [] }
      )
      expect(result.trim()).toBe('')
    })

    it('should handle arrays with single item', async () => {
      const result = await processTemplate(
        `@foreach(items as item)
<div>{{ item }}</div>
@endforeach`,
        { items: ['only'] }
      )
      expect(result).toContain('only')
    })

    it('should handle loop iteration with item access', async () => {
      const result = await processTemplate(
        `@foreach(items as item)
<div>{{ item }}</div>
@endforeach`,
        { items: ['a', 'b', 'c'] }
      )
      expect(result).toContain('<div>a</div>')
      expect(result).toContain('<div>b</div>')
      expect(result).toContain('<div>c</div>')
    })

    it('should handle objects in array', async () => {
      const result = await processTemplate(
        `@foreach(users as user)
<div>{{ user.name }}</div>
@endforeach`,
        { users: [{ name: 'Alice' }, { name: 'Bob' }] }
      )
      expect(result).toContain('Alice')
      expect(result).toContain('Bob')
    })

    it('should handle nested arrays', async () => {
      const result = await processTemplate(
        `@foreach(rows as row)
  @foreach(row as cell)
    <span>{{ cell }}</span>
  @endforeach
@endforeach`,
        { rows: [[1, 2], [3, 4]] }
      )
      expect(result).toContain('<span>1</span>')
      expect(result).toContain('<span>2</span>')
      expect(result).toContain('<span>3</span>')
      expect(result).toContain('<span>4</span>')
    })

    it('should handle variable from context', async () => {
      const result = await processTemplate(
        `@foreach(items as item)
<div>{{ item }}</div>
@endforeach`,
        { items: ['from', 'context'] }
      )
      expect(result).toContain('from')
      expect(result).toContain('context')
    })

    it('should handle complex expressions', async () => {
      const result = await processTemplate(
        `@foreach(items.filter(i => i.active) as item)
<div>{{ item.name }}</div>
@endforeach`,
        { items: [{ name: 'Active', active: true }, { name: 'Inactive', active: false }] }
      )
      expect(result).toContain('Active')
      expect(result).not.toContain('Inactive')
    })

    it('should handle method calls on items', async () => {
      const result = await processTemplate(
        `@foreach(words as word)
<div>{{ word.toUpperCase() }}</div>
@endforeach`,
        { words: ['hello', 'world'] }
      )
      expect(result).toContain('HELLO')
      expect(result).toContain('WORLD')
    })

    it('should preserve whitespace inside loop', async () => {
      const result = await processTemplate(
        `@foreach(items as item)
  <div>
    {{ item }}
  </div>
@endforeach`,
        { items: ['a'] }
      )
      expect(result).toContain('  <div>')
    })
  })

  describe('@if directive', () => {
    it('should handle truthy values', async () => {
      const testCases = [
        { value: true, expected: true },
        { value: 1, expected: true },
        { value: 'string', expected: true },
        { value: [], expected: true },  // Empty array is truthy
        { value: {}, expected: true },  // Empty object is truthy
      ]

      for (const { value, expected } of testCases) {
        const result = await processTemplate(
          `@if(condition)
<div>Shown</div>
@endif`,
          { condition: value }
        )
        if (expected) {
          expect(result).toContain('Shown')
        } else {
          expect(result).not.toContain('Shown')
        }
      }
    })

    it('should handle falsy values', async () => {
      const testCases = [false, 0, '', null, undefined]

      for (const value of testCases) {
        const result = await processTemplate(
          `@if(condition)
<div>Should Not Show</div>
@endif`,
          { condition: value }
        )
        expect(result).not.toContain('Should Not Show')
      }
    })

    it('should handle @else', async () => {
      const trueResult = await processTemplate(
        `@if(condition)
<div>True branch</div>
@else
<div>False branch</div>
@endif`,
        { condition: true }
      )
      expect(trueResult).toContain('True branch')
      expect(trueResult).not.toContain('False branch')

      const falseResult = await processTemplate(
        `@if(condition)
<div>True branch</div>
@else
<div>False branch</div>
@endif`,
        { condition: false }
      )
      expect(falseResult).not.toContain('True branch')
      expect(falseResult).toContain('False branch')
    })

    it('should handle @elseif', async () => {
      const result = await processTemplate(
        `@if(condition === 1)
<div>One</div>
@elseif(condition === 2)
<div>Two</div>
@elseif(condition === 3)
<div>Three</div>
@else
<div>Other</div>
@endif`,
        { condition: 2 }
      )
      expect(result).not.toContain('One')
      expect(result).toContain('Two')
      expect(result).not.toContain('Three')
      expect(result).not.toContain('Other')
    })

    it('should handle nested @if', async () => {
      const result = await processTemplate(
        `@if(outer)
  @if(inner)
    <div>Both true</div>
  @endif
@endif`,
        { outer: true, inner: true }
      )
      expect(result).toContain('Both true')
    })

    it('should handle complex expressions', async () => {
      const result = await processTemplate(
        `@if(user && user.isAdmin && items.length > 0)
<div>Admin with items</div>
@endif`,
        { user: { isAdmin: true }, items: [1, 2, 3] }
      )
      expect(result).toContain('Admin with items')
    })

    it('should handle negation', async () => {
      const result = await processTemplate(
        `@if(!hidden)
<div>Visible</div>
@endif`,
        { hidden: false }
      )
      expect(result).toContain('Visible')
    })

    it('should handle comparison operators', async () => {
      const result = await processTemplate(
        `@if(count < 10)
<div>Less than 10</div>
@endif
@if(count > 5)
<div>Greater than 5</div>
@endif
@if(count === 7)
<div>Exactly 7</div>
@endif`,
        { count: 7 }
      )
      expect(result).toContain('Less than 10')
      expect(result).toContain('Greater than 5')
      expect(result).toContain('Exactly 7')
    })
  })

  describe('@unless directive', () => {
    it('should render when condition is false', async () => {
      const result = await processTemplate(
        `@unless(hidden)
<div>Rendered</div>
@endunless`,
        { hidden: false }
      )
      expect(result).toContain('Rendered')
    })

    it('should not render when condition is true', async () => {
      const result = await processTemplate(
        `@unless(hidden)
<div>Not Rendered</div>
@endunless`,
        { hidden: true }
      )
      expect(result).not.toContain('Not Rendered')
    })
  })

  describe('@empty directive', () => {
    it('should render for empty array', async () => {
      const result = await processTemplate(
        `@empty(items)
<div>Empty</div>
@endempty`,
        { items: [] }
      )
      expect(result).toContain('Empty')
    })

    it('should not render for non-empty array', async () => {
      const result = await processTemplate(
        `@empty(items)
<div>Empty</div>
@endempty`,
        { items: [1, 2, 3] }
      )
      expect(result).not.toContain('Empty')
    })

    it('should render for empty string', async () => {
      const result = await processTemplate(
        `@empty(text)
<div>Empty</div>
@endempty`,
        { text: '' }
      )
      expect(result).toContain('Empty')
    })

    it('should render for null/undefined', async () => {
      const nullResult = await processTemplate(
        `@empty(value)
<div>Empty</div>
@endempty`,
        { value: null }
      )
      expect(nullResult).toContain('Empty')

      const undefinedResult = await processTemplate(
        `@empty(value)
<div>Empty</div>
@endempty`,
        { value: undefined }
      )
      expect(undefinedResult).toContain('Empty')
    })
  })

  describe('@isset directive', () => {
    it('should render when variable is set', async () => {
      const result = await processTemplate(
        `@isset(user)
<div>User exists</div>
@endisset`,
        { user: { name: 'John' } }
      )
      expect(result).toContain('User exists')
    })

    it('should not render when variable is undefined', async () => {
      const result = await processTemplate(
        `@isset(user)
<div>User exists</div>
@endisset`,
        {}
      )
      expect(result).not.toContain('User exists')
    })

    it('should not render when variable is null', async () => {
      const result = await processTemplate(
        `@isset(user)
<div>User exists</div>
@endisset`,
        { user: null }
      )
      expect(result).not.toContain('User exists')
    })
  })

  describe('Interpolation edge cases', () => {
    it('should handle special characters (HTML escaping)', async () => {
      const result = await processTemplate(
        `<div>{{ text }}</div>`,
        { text: '<script>alert("xss")</script>' }
      )
      // Should escape HTML by default
      expect(result).not.toContain('<script>')
    })

    it('should handle unicode characters', async () => {
      const result = await processTemplate(
        `<div>{{ text }}</div>`,
        { text: '你好世界 🌍' }
      )
      expect(result).toContain('你好世界')
      expect(result).toContain('🌍')
    })

    it('should handle null values gracefully', async () => {
      const result = await processTemplate(
        `<div>{{ value }}</div>`,
        { value: null }
      )
      // Should render empty or "null" but not throw
      expect(result).toContain('<div>')
      expect(result).toContain('</div>')
    })

    it('should handle undefined values gracefully', async () => {
      const result = await processTemplate(
        `<div>{{ value }}</div>`,
        { value: undefined }
      )
      expect(result).toContain('<div>')
      expect(result).toContain('</div>')
    })

    it('should handle numeric zero', async () => {
      const result = await processTemplate(
        `<div>{{ count }}</div>`,
        { count: 0 }
      )
      expect(result).toContain('0')
    })

    it('should handle boolean false', async () => {
      const result = await processTemplate(
        `<div>{{ active }}</div>`,
        { active: false }
      )
      expect(result).toContain('false')
    })

    it('should handle arrays in interpolation with join', async () => {
      const result = await processTemplate(
        `<div>{{ items.join(', ') }}</div>`,
        { items: ['a', 'b', 'c'] }
      )
      expect(result).toContain('a, b, c')
    })

    it('should handle object serialization with JSON', async () => {
      const result = await processTemplate(
        `<div>{{ JSON.stringify(data) }}</div>`,
        { data: { key: 'value' } }
      )
      // Quotes may be HTML-escaped in output
      expect(result).toContain('key')
      expect(result).toContain('value')
    })

    it('should handle ternary expressions', async () => {
      const result = await processTemplate(
        `<div>{{ active ? 'Yes' : 'No' }}</div>`,
        { active: true }
      )
      expect(result).toContain('Yes')
    })

    it('should handle template literals', async () => {
      const result = await processTemplate(
        '<div>{{ `Hello ${name}!` }}</div>',
        { name: 'World' }
      )
      expect(result).toContain('Hello World!')
    })
  })

  describe('Whitespace handling', () => {
    it('should trim interpolation whitespace', async () => {
      const result = await processTemplate(
        `<div>{{   name   }}</div>`,
        { name: 'Test' }
      )
      expect(result).toContain('Test')
    })

    it('should preserve significant whitespace in values', async () => {
      const result = await processTemplate(
        `<pre>{{ text }}</pre>`,
        { text: '  indented  ' }
      )
      expect(result).toContain('  indented  ')
    })

    it('should handle multiline interpolation', async () => {
      const result = await processTemplate(
        `<div>{{
          name
        }}</div>`,
        { name: 'Multiline' }
      )
      expect(result).toContain('Multiline')
    })
  })

  describe('Combining directives', () => {
    it('should handle @if inside @foreach', async () => {
      const result = await processTemplate(
        `@foreach(nums as num)
  @if(num % 2 === 0)
    <div>{{ num }} is even</div>
  @endif
@endforeach`,
        { nums: [1, 2, 3, 4] }
      )
      expect(result).not.toContain('1 is even')
      expect(result).toContain('2 is even')
      expect(result).not.toContain('3 is even')
      expect(result).toContain('4 is even')
    })

    it('should handle @foreach inside @if', async () => {
      const result = await processTemplate(
        `@if(showList)
  @foreach(items as item)
    <div>{{ item }}</div>
  @endforeach
@endif`,
        { showList: true, items: ['A', 'B'] }
      )
      expect(result).toContain('A')
      expect(result).toContain('B')
    })

    it('should handle multiple @foreach in sequence', async () => {
      const result = await processTemplate(
        `<div>
  @foreach(first as item)
    <span>{{ item }}</span>
  @endforeach
</div>
<div>
  @foreach(second as item)
    <span>{{ item }}</span>
  @endforeach
</div>`,
        { first: ['A', 'B'], second: ['X', 'Y'] }
      )
      expect(result).toContain('A')
      expect(result).toContain('B')
      expect(result).toContain('X')
      expect(result).toContain('Y')
    })
  })
})
