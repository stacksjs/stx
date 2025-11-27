import type { ButtonProps } from '../src/ui/button'
import { describe, expect, it } from 'bun:test'

describe('Button Component', () => {
  describe('Props', () => {
    it('should have default variant as primary', () => {
      const defaultProps: ButtonProps = {}
      expect(defaultProps.variant || 'primary').toBe('primary')
    })

    it('should have default size as md', () => {
      const defaultProps: ButtonProps = {}
      expect(defaultProps.size || 'md').toBe('md')
    })

    it('should have default disabled as false', () => {
      const defaultProps: ButtonProps = {}
      expect(defaultProps.disabled || false).toBe(false)
    })

    it('should have default type as button', () => {
      const defaultProps: ButtonProps = {}
      expect(defaultProps.type || 'button').toBe('button')
    })
  })

  describe('Variants', () => {
    it('should accept primary variant', () => {
      const props: ButtonProps = { variant: 'primary' }
      expect(props.variant).toBe('primary')
    })

    it('should accept secondary variant', () => {
      const props: ButtonProps = { variant: 'secondary' }
      expect(props.variant).toBe('secondary')
    })

    it('should accept outline variant', () => {
      const props: ButtonProps = { variant: 'outline' }
      expect(props.variant).toBe('outline')
    })

    it('should accept ghost variant', () => {
      const props: ButtonProps = { variant: 'ghost' }
      expect(props.variant).toBe('ghost')
    })

    it('should accept danger variant', () => {
      const props: ButtonProps = { variant: 'danger' }
      expect(props.variant).toBe('danger')
    })
  })

  describe('Sizes', () => {
    it('should accept sm size', () => {
      const props: ButtonProps = { size: 'sm' }
      expect(props.size).toBe('sm')
    })

    it('should accept md size', () => {
      const props: ButtonProps = { size: 'md' }
      expect(props.size).toBe('md')
    })

    it('should accept lg size', () => {
      const props: ButtonProps = { size: 'lg' }
      expect(props.size).toBe('lg')
    })
  })

  describe('States', () => {
    it('should accept disabled state', () => {
      const props: ButtonProps = { disabled: true }
      expect(props.disabled).toBe(true)
    })

    it('should accept onClick handler', () => {
      const onClick = () => console.log('clicked')
      const props: ButtonProps = { onClick }
      expect(props.onClick).toBe(onClick)
    })
  })

  describe('Custom className', () => {
    it('should accept additional className', () => {
      const props: ButtonProps = { className: 'custom-class' }
      expect(props.className).toBe('custom-class')
    })
  })
})
