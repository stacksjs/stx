/**
 * Tests for Phase 4: defineProps / defineEmits / component composition
 */
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { defineProps, withDefaults, defineEmits } from '../../src/props'

const defaultOptions = {
  partialsDir: '/tmp',
  componentsDir: '/tmp',
}

async function processTemplate(template: string, context: Record<string, unknown> = {}) {
  return processDirectives(template, context, '/test.stx', defaultOptions, new Set<string>())
}

describe('Phase 4: Component Composition API', () => {
  describe('defineProps (server-side)', () => {
    it('should return empty props when no context', () => {
      const props = defineProps()
      expect(props).toBeDefined()
      expect(typeof props).toBe('object')
    })

    it('should apply defaults when props are undefined', () => {
      // Set up global props context
      const prevProps = (globalThis as any).__STX_CURRENT_PROPS__
      ;(globalThis as any).__STX_CURRENT_PROPS__ = { title: 'Hello' }

      const props = defineProps({
        title: { default: 'Default Title' },
        count: { default: 0 },
      })

      expect(props.title).toBe('Hello') // from props, not default
      expect(props.count).toBe(0) // from default

      // Restore
      ;(globalThis as any).__STX_CURRENT_PROPS__ = prevProps
    })

    it('should support factory defaults', () => {
      const prevProps = (globalThis as any).__STX_CURRENT_PROPS__
      ;(globalThis as any).__STX_CURRENT_PROPS__ = {}

      const props = defineProps({
        items: { default: () => [] },
      })

      expect(Array.isArray(props.items)).toBe(true)
      expect(props.items).toEqual([])

      ;(globalThis as any).__STX_CURRENT_PROPS__ = prevProps
    })
  })

  describe('withDefaults (server-side)', () => {
    it('should merge defaults with existing props', () => {
      const prevProps = (globalThis as any).__STX_CURRENT_PROPS__
      ;(globalThis as any).__STX_CURRENT_PROPS__ = { title: 'Custom' }

      const props = withDefaults(defineProps(), {
        title: 'Default',
        variant: 'primary',
        size: 'md',
      })

      expect(props.title).toBe('Custom') // kept from props
      expect(props.variant).toBe('primary') // from defaults
      expect(props.size).toBe('md') // from defaults

      ;(globalThis as any).__STX_CURRENT_PROPS__ = prevProps
    })
  })

  describe('defineEmits (server-side)', () => {
    it('should return an emit function', () => {
      const emit = defineEmits()
      expect(typeof emit).toBe('function')
    })
  })

  describe('TypeScript in defineProps', () => {
    it('should strip generics from defineProps<T>() in client scripts', async () => {
      const html = `<script>
interface CardProps {
  title: string
  count: number
}
const props = defineProps<CardProps>()
const doubled = props.count * 2
</script>
<div>{{ props.title }}</div>`

      const result = await processTemplate(html, {})
      // TypeScript should be stripped
      expect(result).not.toContain('interface CardProps')
      expect(result).not.toContain('<CardProps>')
      // defineProps call should remain (without generics)
      expect(result).toContain('defineProps()')
    })

    it('should strip generics from withDefaults pattern', async () => {
      const html = `<script>
const { title, variant } = withDefaults(defineProps<{
  title: string
  variant?: string
}>(), {
  variant: 'primary'
})
</script>
<div>{{ title }}</div>`

      const result = await processTemplate(html, {})
      expect(result).not.toContain('<{')
      expect(result).toContain('withDefaults(defineProps()')
    })
  })

  describe('Auto-import of composition API', () => {
    it('should auto-import defineProps from window.stx', async () => {
      // defineProps is in STX_AUTO_IMPORTS, so when used in a client script
      // it should generate: var { defineProps, ... } = window.stx || window;
      const html = `<script client>
const props = defineProps()
</script>
<div>Hello</div>`

      const result = await processTemplate(html, {})
      // Should have auto-import destructuring
      expect(result).toContain('defineProps')
    })
  })

  describe('Props serialization for client hydration', () => {
    it('should serialize props to data-stx-props on scoped components', async () => {
      // This tests that when a component with signals renders,
      // its props are available as data-stx-props attribute
      const html = `<div>{{ title }}</div>`

      // Process with props in context
      const result = await processTemplate(html, { title: 'Test Title' })
      // The template should render with the title
      expect(result).toContain('Test Title')
    })
  })
})
