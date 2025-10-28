import { describe, expect, it, spyOn } from 'bun:test'
import {
  AVAILABLE_COMPONENTS,
  createButton,
  createCheckbox,
  createTextInput,
} from '../src/components'

describe('Components', () => {
  describe('AVAILABLE_COMPONENTS', () => {
    it('should export array of component names', () => {
      expect(AVAILABLE_COMPONENTS).toBeDefined()
      expect(Array.isArray(AVAILABLE_COMPONENTS)).toBe(true)
    })

    it('should have exactly 35 components', () => {
      expect(AVAILABLE_COMPONENTS.length).toBe(35)
    })

    it('should include all input components', () => {
      const inputComponents = [
        'Button',
        'TextInput',
        'Checkbox',
        'RadioButton',
        'Slider',
        'ColorPicker',
        'DatePicker',
        'TimePicker',
        'Autocomplete',
      ]

      for (const component of inputComponents) {
        expect(AVAILABLE_COMPONENTS).toContain(component)
      }
    })

    it('should include all display components', () => {
      const displayComponents = [
        'Label',
        'ImageView',
        'ProgressBar',
        'Avatar',
        'Badge',
        'Chip',
        'Card',
        'Tooltip',
        'Toast',
      ]

      for (const component of displayComponents) {
        expect(AVAILABLE_COMPONENTS).toContain(component)
      }
    })

    it('should include all layout components', () => {
      const layoutComponents = [
        'ScrollView',
        'SplitView',
        'Accordion',
        'Stepper',
        'Modal',
        'Tabs',
        'Dropdown',
      ]

      for (const component of layoutComponents) {
        expect(AVAILABLE_COMPONENTS).toContain(component)
      }
    })

    it('should include all data components', () => {
      const dataComponents = [
        'ListView',
        'Table',
        'TreeView',
        'DataGrid',
        'Chart',
      ]

      for (const component of dataComponents) {
        expect(AVAILABLE_COMPONENTS).toContain(component)
      }
    })

    it('should include all advanced components', () => {
      const advancedComponents = [
        'Rating',
        'CodeEditor',
        'MediaPlayer',
        'FileExplorer',
        'WebView',
      ]

      for (const component of advancedComponents) {
        expect(AVAILABLE_COMPONENTS).toContain(component)
      }
    })

    it('should not have duplicate component names', () => {
      const uniqueComponents = new Set(AVAILABLE_COMPONENTS)
      expect(uniqueComponents.size).toBe(AVAILABLE_COMPONENTS.length)
    })
  })

  describe('createButton', () => {
    it('should warn that feature is not yet implemented', () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      createButton({ text: 'Click me' })

      expect(consoleWarnSpy).toHaveBeenCalledWith('Button component not yet implemented', expect.any(Object))

      consoleWarnSpy.mockRestore()
    })

    it('should return HTML string', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const result = createButton({ text: 'Click me' })

      expect(typeof result).toBe('string')
      expect(result).toContain('button')
    })

    it('should include button text', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const result = createButton({ text: 'Test Button' })

      expect(result).toContain('Test Button')
    })

    it('should accept onClick handler', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const onClick = () => console.log('clicked')

      createButton({ text: 'Click', onClick })
    })

    it('should accept variant option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost'> = [
        'primary',
        'secondary',
        'outline',
        'ghost',
      ]

      for (const variant of variants) {
        createButton({ text: 'Test', variant })
      }
    })

    it('should accept size option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']

      for (const size of sizes) {
        createButton({ text: 'Test', size })
      }
    })

    it('should accept disabled option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createButton({ text: 'Disabled', disabled: true })
    })

    it('should accept ComponentProps', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createButton({
        text: 'Test',
        id: 'my-button',
        className: 'btn-custom',
        style: { color: 'red' },
        visible: true,
        enabled: true,
      })
    })
  })

  describe('createTextInput', () => {
    it('should warn that feature is not yet implemented', () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      createTextInput({})

      expect(consoleWarnSpy).toHaveBeenCalledWith('TextInput component not yet implemented', expect.any(Object))

      consoleWarnSpy.mockRestore()
    })

    it('should return HTML string', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const result = createTextInput({})

      expect(typeof result).toBe('string')
      expect(result).toContain('input')
      expect(result).toContain('type="text"')
    })

    it('should accept value option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createTextInput({ value: 'Initial value' })
    })

    it('should accept placeholder option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createTextInput({ placeholder: 'Enter text...' })
    })

    it('should accept onChange handler', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const onChange = (value: string) => console.log(value)

      createTextInput({ onChange })
    })

    it('should accept type option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const types: Array<'text' | 'password' | 'email' | 'number'> = [
        'text',
        'password',
        'email',
        'number',
      ]

      for (const type of types) {
        createTextInput({ type })
      }
    })

    it('should accept disabled option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createTextInput({ disabled: true })
    })

    it('should accept ComponentProps', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createTextInput({
        id: 'my-input',
        className: 'input-custom',
        visible: true,
      })
    })
  })

  describe('createCheckbox', () => {
    it('should warn that feature is not yet implemented', () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      createCheckbox({})

      expect(consoleWarnSpy).toHaveBeenCalledWith('Checkbox component not yet implemented', expect.any(Object))

      consoleWarnSpy.mockRestore()
    })

    it('should return HTML string', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const result = createCheckbox({})

      expect(typeof result).toBe('string')
      expect(result).toContain('input')
      expect(result).toContain('type="checkbox"')
    })

    it('should accept checked option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createCheckbox({ checked: true })
    })

    it('should accept onChange handler', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const onChange = (checked: boolean) => console.log(checked)

      createCheckbox({ onChange })
    })

    it('should accept label option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createCheckbox({ label: 'Accept terms' })
    })

    it('should accept disabled option', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createCheckbox({ disabled: true })
    })

    it('should accept ComponentProps', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createCheckbox({
        id: 'my-checkbox',
        className: 'checkbox-custom',
        style: { marginLeft: '10px' },
      })
    })
  })

  describe('Component categories', () => {
    it('should have 9 input components', () => {
      const inputComponents = AVAILABLE_COMPONENTS.filter(c =>
        ['Button', 'TextInput', 'Checkbox', 'RadioButton', 'Slider', 'ColorPicker', 'DatePicker', 'TimePicker', 'Autocomplete'].includes(c),
      )
      expect(inputComponents.length).toBe(9)
    })

    it('should have 9 display components', () => {
      const displayComponents = AVAILABLE_COMPONENTS.filter(c =>
        ['Label', 'ImageView', 'ProgressBar', 'Avatar', 'Badge', 'Chip', 'Card', 'Tooltip', 'Toast'].includes(c),
      )
      expect(displayComponents.length).toBe(9)
    })

    it('should have 7 layout components', () => {
      const layoutComponents = AVAILABLE_COMPONENTS.filter(c =>
        ['ScrollView', 'SplitView', 'Accordion', 'Stepper', 'Modal', 'Tabs', 'Dropdown'].includes(c),
      )
      expect(layoutComponents.length).toBe(7)
    })

    it('should have 5 data components', () => {
      const dataComponents = AVAILABLE_COMPONENTS.filter(c =>
        ['ListView', 'Table', 'TreeView', 'DataGrid', 'Chart'].includes(c),
      )
      expect(dataComponents.length).toBe(5)
    })

    it('should have 5 advanced components', () => {
      const advancedComponents = AVAILABLE_COMPONENTS.filter(c =>
        ['Rating', 'CodeEditor', 'MediaPlayer', 'FileExplorer', 'WebView'].includes(c),
      )
      expect(advancedComponents.length).toBe(5)
    })
  })

  describe('ComponentProps interface', () => {
    it('should accept id prop', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createButton({ text: 'Test', id: 'btn-1' })
      createTextInput({ id: 'input-1' })
      createCheckbox({ id: 'check-1' })
    })

    it('should accept className prop', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createButton({ text: 'Test', className: 'btn btn-primary' })
      createTextInput({ className: 'form-input' })
      createCheckbox({ className: 'form-check' })
    })

    it('should accept style prop', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const style = { color: 'red', fontSize: '16px' }

      createButton({ text: 'Test', style })
      createTextInput({ style })
      createCheckbox({ style })
    })

    it('should accept visible prop', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createButton({ text: 'Test', visible: false })
      createTextInput({ visible: true })
      createCheckbox({ visible: false })
    })

    it('should accept enabled prop', () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      createButton({ text: 'Test', enabled: false })
      createTextInput({ enabled: true })
      createCheckbox({ enabled: false })
    })
  })
})
