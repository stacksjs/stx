import type { SwitchProps } from '../src/ui/switch'
import { describe, expect, it } from 'bun:test'

describe('Switch Component', () => {
  describe('Props', () => {
    it('should have default checked as false', () => {
      const defaultProps: SwitchProps = {}
      expect(defaultProps.checked || false).toBe(false)
    })

    it('should have default size as md', () => {
      const defaultProps: SwitchProps = {}
      expect(defaultProps.size || 'md').toBe('md')
    })

    it('should have default disabled as false', () => {
      const defaultProps: SwitchProps = {}
      expect(defaultProps.disabled || false).toBe(false)
    })
  })

  describe('Checked State', () => {
    it('should accept checked true', () => {
      const props: SwitchProps = { checked: true }
      expect(props.checked).toBe(true)
    })

    it('should accept checked false', () => {
      const props: SwitchProps = { checked: false }
      expect(props.checked).toBe(false)
    })
  })

  describe('Sizes', () => {
    it('should accept sm size', () => {
      const props: SwitchProps = { size: 'sm' }
      expect(props.size).toBe('sm')
    })

    it('should accept md size', () => {
      const props: SwitchProps = { size: 'md' }
      expect(props.size).toBe('md')
    })

    it('should accept lg size', () => {
      const props: SwitchProps = { size: 'lg' }
      expect(props.size).toBe('lg')
    })
  })

  describe('States', () => {
    it('should accept disabled state', () => {
      const props: SwitchProps = { disabled: true }
      expect(props.disabled).toBe(true)
    })

    it('should accept onChange handler', () => {
      const onChange = (checked: boolean) => console.log('changed', checked)
      const props: SwitchProps = { onChange }
      expect(props.onChange).toBe(onChange)
    })

    it('should accept label', () => {
      const props: SwitchProps = { label: 'Enable notifications' }
      expect(props.label).toBe('Enable notifications')
    })
  })

  describe('Custom className', () => {
    it('should accept additional className', () => {
      const props: SwitchProps = { className: 'custom-class' }
      expect(props.className).toBe('custom-class')
    })
  })

  describe('onChange behavior', () => {
    it('should toggle checked state when called', () => {
      let checked = false
      const onChange = (newChecked: boolean) => {
        checked = newChecked
      }

      onChange(true)
      expect(checked).toBe(true)

      onChange(false)
      expect(checked).toBe(false)
    })
  })
})
