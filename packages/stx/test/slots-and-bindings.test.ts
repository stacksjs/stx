import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { parseSlots } from '../src/slots'
import { processLoops } from '../src/loops'

/**
 * Tests for:
 * - Slot parsing with nested templates
 * - Dynamic prop binding processing in loops
 * - Shorthand prop binding syntax (:prop -> :prop="prop")
 * - Processing order (loops before components)
 */

describe('Slot Parsing', () => {
  describe('parseSlots', () => {
    it('should parse default slot content', () => {
      const content = '<p>Default content</p>'
      const result = parseSlots(content)
      
      expect(result.default).toBe('<p>Default content</p>')
      expect(result.named.size).toBe(0)
    })

    it('should parse named slots with # syntax', () => {
      const content = `
        <template #header>
          <h1>Header Content</h1>
        </template>
        <p>Default content</p>
        <template #footer>
          <p>Footer Content</p>
        </template>
      `
      const result = parseSlots(content)
      
      expect(result.default.trim()).toBe('<p>Default content</p>')
      expect(result.named.has('header')).toBe(true)
      expect(result.named.has('footer')).toBe(true)
      expect(result.named.get('header')?.content).toContain('Header Content')
      expect(result.named.get('footer')?.content).toContain('Footer Content')
    })

    it('should parse scoped slots with props binding', () => {
      const content = `
        <template #row="{ item, index }">
          <td>{{ item.name }}</td>
        </template>
      `
      const result = parseSlots(content)
      
      expect(result.named.has('row')).toBe(true)
      const rowSlot = result.named.get('row')
      expect(rowSlot?.propsBinding).toBe('{ item, index }')
      expect(rowSlot?.content).toContain('{{ item.name }}')
    })

    it('should handle nested template tags correctly', () => {
      const content = `
        <template #card>
          <div class="card">
            <template v-if="showHeader">
              <h2>Nested Header</h2>
            </template>
            <p>Card content</p>
          </div>
        </template>
        <p>Default slot</p>
      `
      const result = parseSlots(content)
      
      expect(result.named.has('card')).toBe(true)
      const cardSlot = result.named.get('card')
      // The nested template should be preserved in the content
      expect(cardSlot?.content).toContain('v-if="showHeader"')
      expect(cardSlot?.content).toContain('Nested Header')
      expect(result.default.trim()).toBe('<p>Default slot</p>')
    })

    it('should handle deeply nested template tags', () => {
      const content = `
        <template #complex>
          <div>
            <template v-for="item in items">
              <template v-if="item.visible">
                <span>{{ item.name }}</span>
              </template>
            </template>
          </div>
        </template>
      `
      const result = parseSlots(content)
      
      expect(result.named.has('complex')).toBe(true)
      const complexSlot = result.named.get('complex')
      // All nested templates should be preserved
      expect(complexSlot?.content).toContain('v-for="item in items"')
      expect(complexSlot?.content).toContain('v-if="item.visible"')
      expect(complexSlot?.content).toContain('{{ item.name }}')
    })

    it('should parse v-slot: syntax', () => {
      const content = `
        <template v-slot:header>
          <h1>V-Slot Header</h1>
        </template>
      `
      const result = parseSlots(content)
      
      expect(result.named.has('header')).toBe(true)
      expect(result.named.get('header')?.content).toContain('V-Slot Header')
    })

    it('should parse slot="" attribute syntax', () => {
      const content = `
        <template slot="header">
          <h1>Slot Attr Header</h1>
        </template>
      `
      const result = parseSlots(content)
      
      expect(result.named.has('header')).toBe(true)
      expect(result.named.get('header')?.content).toContain('Slot Attr Header')
    })
  })
})

describe('Loop Processing with Bindings', () => {
  describe('Dynamic Prop Binding', () => {
    it('should process :prop="expression" bindings', () => {
      const template = `@foreach (items as item)
<Card :name="item.name" />
@endforeach`
      
      const context = {
        items: [
          { name: 'First' },
          { name: 'Second' }
        ]
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      // The :name="item.name" should be converted to __stx_name with serialized value
      expect(result).toContain('__stx_name="&quot;First&quot;"')
      expect(result).toContain('__stx_name="&quot;Second&quot;"')
    })

    it('should process shorthand :prop syntax', () => {
      const template = `@foreach (trails as trail)
<TrailCard :trail />
@endforeach`
      
      const context = {
        trails: [
          { id: 1, name: 'Mountain Trail' },
          { id: 2, name: 'Forest Path' }
        ]
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      // The :trail shorthand should be expanded to :trail="trail" and then processed
      expect(result).toContain('__stx_trail=')
      expect(result).toContain('Mountain Trail')
      expect(result).toContain('Forest Path')
    })

    it('should handle complex objects in bindings', () => {
      const template = `@foreach (users as user)
<UserCard :user="user" />
@endforeach`
      
      const context = {
        users: [
          { id: 1, name: 'John', email: 'john@example.com', active: true }
        ]
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      // The serialized JSON should contain all properties
      expect(result).toContain('__stx_user=')
      expect(result).toContain('John')
      expect(result).toContain('john@example.com')
    })

    it('should handle expressions in bindings', () => {
      const template = `@foreach (items as index => item)
<Card :position="index + 1" />
@endforeach`
      
      const context = {
        items: ['a', 'b', 'c']
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      // index + 1 should be evaluated
      expect(result).toContain('__stx_position="1"')
      expect(result).toContain('__stx_position="2"')
      expect(result).toContain('__stx_position="3"')
    })

    it('should preserve bindings that fail evaluation', () => {
      const template = `@foreach (items as item)
<Card :data="unknownVar.property" />
@endforeach`
      
      const context = {
        items: ['a']
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      // Unknown variables should keep the original binding
      expect(result).toContain(':data="unknownVar.property"')
    })
  })

  describe('Mixed bindings and regular attributes', () => {
    it('should process :prop bindings while preserving static attributes', () => {
      const template = `@foreach (items as item)
<Card class="card" :data="item" id="card-{{ loop.index }}" />
@endforeach`
      
      const context = {
        items: [{ value: 1 }, { value: 2 }]
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      // Static class should be preserved
      expect(result).toContain('class="card"')
      // Dynamic binding should be processed
      expect(result).toContain('__stx_data=')
      // Loop expression should be evaluated
      expect(result).toContain('id="card-0"')
      expect(result).toContain('id="card-1"')
    })
  })

  describe('Nested loops with bindings', () => {
    it('should process bindings in nested loops', () => {
      const template = `@foreach (categories as category)
<Category :category="category">
  @foreach (category.items as item)
  <Item :item="item" />
  @endforeach
</Category>
@endforeach`
      
      const context = {
        categories: [
          { name: 'Cat1', items: [{ name: 'Item1' }] },
          { name: 'Cat2', items: [{ name: 'Item2' }] }
        ]
      }
      
      const result = processLoops(template, context, 'test.stx')
      
      expect(result).toContain('__stx_category=')
      expect(result).toContain('__stx_item=')
      expect(result).toContain('Cat1')
      expect(result).toContain('Item1')
      expect(result).toContain('Cat2')
      expect(result).toContain('Item2')
    })
  })
})

describe('Shorthand Binding Expansion', () => {
  it('should expand :prop when variable exists in context', () => {
    const template = `@foreach (items as item)
<Card :item :extra="item.extra" />
@endforeach`
    
    const context = {
      items: [{ name: 'Test', extra: 'data' }]
    }
    
    const result = processLoops(template, context, 'test.stx')
    
    // Both shorthand and explicit should be processed
    expect(result).toContain('__stx_item=')
    expect(result).toContain('__stx_extra=')
  })

  it('should not expand :prop for attributes that are not in context', () => {
    const template = `@foreach (items as item)
<Card :item :unknownProp />
@endforeach`
    
    const context = {
      items: [{ name: 'Test' }]
    }
    
    const result = processLoops(template, context, 'test.stx')
    
    // item should be expanded (in context)
    expect(result).toContain('__stx_item=')
    // unknownProp should remain as-is (not in context)
    expect(result).toContain(':unknownProp')
  })
})
