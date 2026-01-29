import { describe, expect, test } from 'bun:test'
import { PropsTypeExtractor } from '../src/services/PropsTypeExtractor'

describe('PropsTypeExtractor', () => {
  const extractor = new PropsTypeExtractor()

  describe('extractPropsType', () => {
    test('extracts inline type from defineProps<T>()', () => {
      const content = `
<script>
const props = defineProps<{ title: string; count?: number }>()
</script>
`
      const result = extractor.extractPropsType(content)

      expect(result.typeAnnotation).toBe('{ title: string; count?: number }')
      expect(result.propNames).toContain('title')
      expect(result.propNames).toContain('count')
      expect(result.propDetails.length).toBe(2)

      const titleProp = result.propDetails.find(p => p.name === 'title')
      expect(titleProp?.type).toBe('string')
      expect(titleProp?.required).toBe(true)

      const countProp = result.propDetails.find(p => p.name === 'count')
      expect(countProp?.type).toBe('number')
      expect(countProp?.required).toBe(false)
    })

    test('resolves interface reference', () => {
      const content = `
<script>
interface ButtonProps {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}
const props = defineProps<ButtonProps>()
</script>
`
      const result = extractor.extractPropsType(content)

      expect(result.typeAnnotation).toBe('ButtonProps')
      expect(result.propNames).toContain('variant')
      expect(result.propNames).toContain('disabled')

      const variantProp = result.propDetails.find(p => p.name === 'variant')
      expect(variantProp?.type).toBe("'primary' | 'secondary'")
      expect(variantProp?.required).toBe(true)

      const disabledProp = result.propDetails.find(p => p.name === 'disabled')
      expect(disabledProp?.type).toBe('boolean')
      expect(disabledProp?.required).toBe(false)
    })

    test('handles withDefaults', () => {
      const content = `
<script>
interface Props {
  title?: string;
  count?: number;
}
const { title, count } = withDefaults(defineProps<Props>(), {
  title: 'Hello',
  count: 0
})
</script>
`
      const result = extractor.extractPropsType(content)

      expect(result.propNames).toContain('title')
      expect(result.propNames).toContain('count')

      const titleProp = result.propDetails.find(p => p.name === 'title')
      expect(titleProp?.defaultValue).toBe("'Hello'")
      expect(titleProp?.required).toBe(false)

      const countProp = result.propDetails.find(p => p.name === 'count')
      expect(countProp?.defaultValue).toBe('0')
      expect(countProp?.required).toBe(false)
    })

    test('extracts from @ts blocks', () => {
      const content = `
@ts
interface CardProps {
  title: string;
  subtitle?: string;
}
const props = defineProps<CardProps>()
@endts
`
      const result = extractor.extractPropsType(content)

      expect(result.typeAnnotation).toBe('CardProps')
      expect(result.propNames).toContain('title')
      expect(result.propNames).toContain('subtitle')
    })

    test('returns empty result when no defineProps found', () => {
      const content = `
<script>
const title = 'Hello'
</script>
`
      const result = extractor.extractPropsType(content)

      expect(result.typeAnnotation).toBeNull()
      expect(result.propNames).toHaveLength(0)
      expect(result.propDetails).toHaveLength(0)
    })

    test('handles complex types', () => {
      const content = `
<script>
interface Props {
  items: string[];
  config: Record<string, number>;
  onClick?: () => void;
}
const props = defineProps<Props>()
</script>
`
      const result = extractor.extractPropsType(content)

      expect(result.propNames).toContain('items')
      expect(result.propNames).toContain('config')
      expect(result.propNames).toContain('onClick')

      const itemsProp = result.propDetails.find(p => p.name === 'items')
      expect(itemsProp?.type).toBe('string[]')

      const configProp = result.propDetails.find(p => p.name === 'config')
      expect(configProp?.type).toBe('Record<string, number>')
    })
  })

  describe('generateTypeString', () => {
    test('generates type string from prop details', () => {
      const propDetails = [
        { name: 'title', type: 'string', required: true },
        { name: 'count', type: 'number', required: false },
      ]

      const typeString = extractor.generateTypeString(propDetails)

      expect(typeString).toBe('{ title: string; count?: number }')
    })

    test('returns Record for empty props', () => {
      const typeString = extractor.generateTypeString([])

      expect(typeString).toBe('Record<string, unknown>')
    })
  })
})
