import { describe, expect, test, beforeEach, afterEach, mock } from 'bun:test'
import { PropsTypeExtractor } from '../src/services/PropsTypeExtractor'

// Note: ComponentRegistry requires VS Code APIs which aren't available in unit tests
// These tests focus on the PropsTypeExtractor which ComponentRegistry depends on

describe('ComponentRegistry Integration', () => {
  const extractor = new PropsTypeExtractor()

  describe('Component name extraction', () => {
    test('extracts PascalCase component name from file path', () => {
      // ComponentRegistry.extractComponentName logic
      const extractComponentName = (filePath: string): string => {
        const basename = filePath.split('/').pop()?.replace('.stx', '') || ''
        return basename
          .split(/[-_\s]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('')
      }

      expect(extractComponentName('/path/to/Button.stx')).toBe('Button')
      expect(extractComponentName('/path/to/user-card.stx')).toBe('UserCard')
      expect(extractComponentName('/path/to/my_component.stx')).toBe('MyComponent')
    })

    test('converts PascalCase to kebab-case', () => {
      const toKebabCase = (str: string): string => {
        return str
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
          .toLowerCase()
      }

      expect(toKebabCase('Button')).toBe('button')
      expect(toKebabCase('UserCard')).toBe('user-card')
      expect(toKebabCase('XMLParser')).toBe('xml-parser')
    })
  })

  describe('Props extraction for registry', () => {
    test('extracts props from simple component', () => {
      const content = `
<script>
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
}
const props = defineProps<ButtonProps>()
</script>

<template>
  <button class="btn btn-{{ props.variant }}">{{ props.label }}</button>
</template>
`
      const result = extractor.extractPropsType(content)

      expect(result.propNames).toContain('label')
      expect(result.propNames).toContain('variant')
      expect(result.propDetails.find(p => p.name === 'label')?.required).toBe(true)
      expect(result.propDetails.find(p => p.name === 'variant')?.required).toBe(false)
    })

    test('extracts props with defaults', () => {
      const content = `
<script>
interface CardProps {
  title?: string
  bordered?: boolean
}
const props = withDefaults(defineProps<CardProps>(), {
  title: 'Untitled',
  bordered: false
})
</script>
`
      const result = extractor.extractPropsType(content)

      expect(result.propNames).toContain('title')
      expect(result.propNames).toContain('bordered')

      const titleProp = result.propDetails.find(p => p.name === 'title')
      expect(titleProp?.defaultValue).toBe("'Untitled'")

      const borderedProp = result.propDetails.find(p => p.name === 'bordered')
      expect(borderedProp?.defaultValue).toBe('false')
    })

    test('handles component without defineProps', () => {
      const content = `
<script>
const title = 'Hello'
</script>

<template>
  <h1>{{ title }}</h1>
</template>
`
      const result = extractor.extractPropsType(content)

      expect(result.typeAnnotation).toBeNull()
      expect(result.propNames).toHaveLength(0)
    })
  })

  describe('Component lookup patterns', () => {
    test('supports multiple name formats for kebab-case input', () => {
      // ComponentRegistry stores components by multiple name formats
      // This simulates how it works when component file is "user-card.stx"
      const storeComponent = (name: string): Map<string, string> => {
        const map = new Map<string, string>()
        // Convert to PascalCase from kebab/snake/space
        const pascalName = name
          .split(/[-_\s]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('')
        // Convert PascalCase to kebab-case
        const kebabName = pascalName
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
          .toLowerCase()

        // Store by lowercase variations
        map.set(name.toLowerCase(), pascalName)
        map.set(pascalName.toLowerCase(), pascalName)
        map.set(kebabName, pascalName)

        return map
      }

      // When the file is named "user-card.stx"
      const lookup = storeComponent('user-card')
      expect(lookup.get('user-card')).toBe('UserCard')
      expect(lookup.get('usercard')).toBe('UserCard')
    })

    test('supports lookup by original PascalCase name', () => {
      // When the file is named "UserCard.stx"
      const storeComponent = (name: string): Map<string, string> => {
        const map = new Map<string, string>()
        // Name is already PascalCase, store it
        const kebabName = name
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
          .toLowerCase()

        map.set(name.toLowerCase(), name)
        map.set(kebabName, name)

        return map
      }

      const lookup = storeComponent('UserCard')
      expect(lookup.get('usercard')).toBe('UserCard')
      expect(lookup.get('user-card')).toBe('UserCard')
    })
  })

  describe('Type generation', () => {
    test('generates proper TypeScript type string', () => {
      const propDetails = [
        { name: 'title', type: 'string', required: true },
        { name: 'count', type: 'number', required: false },
        { name: 'items', type: 'string[]', required: true },
      ]

      const typeString = extractor.generateTypeString(propDetails)

      expect(typeString).toBe('{ title: string; count?: number; items: string[] }')
    })

    test('handles empty props', () => {
      const typeString = extractor.generateTypeString([])
      expect(typeString).toBe('Record<string, unknown>')
    })
  })
})
