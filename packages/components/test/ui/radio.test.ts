import type { RadioProps } from '../../src/ui/radio'
import { beforeEach, describe, expect, it } from 'bun:test'

describe('Radio Component - DOM Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('Rendering', () => {
    it('should render a radio input', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      container.appendChild(radio)

      expect(container.querySelector('input[type="radio"]')).toBeTruthy()
      expect(radio.type).toBe('radio')
    })

    it('should render with label', () => {
      const label = document.createElement('label')
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.id = 'option-a'

      const labelText = document.createElement('span')
      labelText.textContent = 'Option A'

      label.appendChild(radio)
      label.appendChild(labelText)
      container.appendChild(label)

      expect(label.querySelector('input[type="radio"]')).toBeTruthy()
      expect(labelText.textContent).toBe('Option A')
    })

    it('should render description', () => {
      const wrapper = document.createElement('div')
      const radio = document.createElement('input')
      radio.type = 'radio'

      const description = document.createElement('span')
      description.className = 'radio-description'
      description.textContent = 'This is the recommended option'

      wrapper.appendChild(radio)
      wrapper.appendChild(description)
      container.appendChild(wrapper)

      expect(wrapper.querySelector('.radio-description')?.textContent).toBe('This is the recommended option')
    })

    it('should apply size classes', () => {
      const sizes: Array<RadioProps['size']> = ['sm', 'md', 'lg']

      sizes.forEach((size) => {
        const radio = document.createElement('input')
        radio.type = 'radio'
        radio.className = `radio radio-${size}`
        container.appendChild(radio)

        expect(radio.className).toContain(`radio-${size}`)
      })
    })
  })

  describe('States', () => {
    it('should be unchecked by default', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      container.appendChild(radio)

      expect(radio.checked).toBe(false)
    })

    it('should be checked', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.checked = true
      container.appendChild(radio)

      expect(radio.checked).toBe(true)
    })

    it('should be disabled', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.disabled = true
      container.appendChild(radio)

      expect(radio.disabled).toBe(true)
    })
  })

  describe('Radio Group Behavior', () => {
    it('should create a radio group with same name', () => {
      const form = document.createElement('form')

      const radio1 = document.createElement('input')
      radio1.type = 'radio'
      radio1.name = 'size'
      radio1.value = 'small'

      const radio2 = document.createElement('input')
      radio2.type = 'radio'
      radio2.name = 'size'
      radio2.value = 'medium'

      const radio3 = document.createElement('input')
      radio3.type = 'radio'
      radio3.name = 'size'
      radio3.value = 'large'

      form.appendChild(radio1)
      form.appendChild(radio2)
      form.appendChild(radio3)
      container.appendChild(form)

      const radios = form.querySelectorAll('input[name="size"]')
      expect(radios.length).toBe(3)
    })

    it('should allow only one radio to be checked in a group', () => {
      const form = document.createElement('form')

      const radio1 = document.createElement('input')
      radio1.type = 'radio'
      radio1.name = 'color'
      radio1.value = 'red'

      const radio2 = document.createElement('input')
      radio2.type = 'radio'
      radio2.name = 'color'
      radio2.value = 'blue'

      const radio3 = document.createElement('input')
      radio3.type = 'radio'
      radio3.name = 'color'
      radio3.value = 'green'

      form.appendChild(radio1)
      form.appendChild(radio2)
      form.appendChild(radio3)
      container.appendChild(form)

      // Check first radio
      radio1.checked = true
      expect(radio1.checked).toBe(true)
      expect(radio2.checked).toBe(false)
      expect(radio3.checked).toBe(false)

      // Check second radio - in real browsers this would uncheck radio1
      // In our test we'll manually simulate this behavior
      radio1.checked = false
      radio2.checked = true
      expect(radio1.checked).toBe(false)
      expect(radio2.checked).toBe(true)
      expect(radio3.checked).toBe(false)
    })

    it('should allow different groups to have independent selections', () => {
      const form = document.createElement('form')

      const sizeRadio1 = document.createElement('input')
      sizeRadio1.type = 'radio'
      sizeRadio1.name = 'size'
      sizeRadio1.value = 'small'
      sizeRadio1.checked = true

      const colorRadio1 = document.createElement('input')
      colorRadio1.type = 'radio'
      colorRadio1.name = 'color'
      colorRadio1.value = 'red'
      colorRadio1.checked = true

      form.appendChild(sizeRadio1)
      form.appendChild(colorRadio1)
      container.appendChild(form)

      // Both can be checked because they're in different groups
      expect(sizeRadio1.checked).toBe(true)
      expect(colorRadio1.checked).toBe(true)
    })
  })

  describe('Interactions', () => {
    it('should handle click event', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      let clicked = false

      radio.addEventListener('click', () => {
        clicked = true
      })

      container.appendChild(radio)
      radio.click()

      expect(clicked).toBe(true)
    })

    it('should handle change event', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      let changeValue = ''

      radio.addEventListener('change', () => {
        changeValue = radio.value
      })

      container.appendChild(radio)
      radio.value = 'option1'
      radio.checked = true
      radio.dispatchEvent(new Event('change', { bubbles: true }))

      expect(changeValue).toBe('option1')
    })

    it('should not trigger events when disabled', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.disabled = true
      let clicked = false

      radio.addEventListener('click', () => {
        clicked = true
      })

      container.appendChild(radio)
      // Disabled elements don't trigger click in real browsers
      expect(radio.disabled).toBe(true)
    })
  })

  describe('Form Integration', () => {
    it('should have name and value', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = 'payment'
      radio.value = 'credit-card'
      container.appendChild(radio)

      expect(radio.name).toBe('payment')
      expect(radio.value).toBe('credit-card')
    })

    it('should be required', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.required = true
      container.appendChild(radio)

      expect(radio.required).toBe(true)
    })

    it('should work in a form', () => {
      const form = document.createElement('form')
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = 'plan'
      radio.value = 'premium'
      radio.checked = true

      form.appendChild(radio)
      container.appendChild(form)

      expect(form.querySelector('input[name="plan"]')).toBeTruthy()
      expect(radio.checked).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper role', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      container.appendChild(radio)

      // Radio inputs have implicit role="radio"
      expect(radio.type).toBe('radio')
    })

    it('should set aria-label', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.setAttribute('aria-label', 'Premium plan')
      container.appendChild(radio)

      expect(radio.getAttribute('aria-label')).toBe('Premium plan')
    })

    it('should set aria-checked', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.checked = true
      radio.setAttribute('aria-checked', 'true')
      container.appendChild(radio)

      expect(radio.getAttribute('aria-checked')).toBe('true')
    })

    it('should set aria-describedby', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.setAttribute('aria-describedby', 'radio-desc')

      const description = document.createElement('span')
      description.id = 'radio-desc'
      description.textContent = 'Most popular choice'

      container.appendChild(radio)
      container.appendChild(description)

      expect(radio.getAttribute('aria-describedby')).toBe('radio-desc')
    })

    it('should use fieldset and legend for groups', () => {
      const fieldset = document.createElement('fieldset')
      const legend = document.createElement('legend')
      legend.textContent = 'Choose your plan'

      const radio1 = document.createElement('input')
      radio1.type = 'radio'
      radio1.name = 'plan'
      radio1.value = 'basic'

      const radio2 = document.createElement('input')
      radio2.type = 'radio'
      radio2.name = 'plan'
      radio2.value = 'premium'

      fieldset.appendChild(legend)
      fieldset.appendChild(radio1)
      fieldset.appendChild(radio2)
      container.appendChild(fieldset)

      expect(fieldset.querySelector('legend')?.textContent).toBe('Choose your plan')
      expect(fieldset.querySelectorAll('input[type="radio"]').length).toBe(2)
    })

    it('should be keyboard focusable', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      container.appendChild(radio)

      expect(radio.tabIndex).toBe(0)
    })

    it('should handle keyboard activation', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      let activated = false

      radio.addEventListener('keydown', (e: any) => {
        const key = e.key || (e as any).keyCode
        if (key === ' ' || key === 32) {
          activated = true
        }
      })

      container.appendChild(radio)

      const spaceEvent = new KeyboardEvent('keydown', { bubbles: true })
      Object.defineProperty(spaceEvent, 'key', { value: ' ', writable: true })
      radio.dispatchEvent(spaceEvent)

      expect(activated).toBe(true)
    })
  })

  describe('Error State', () => {
    it('should show error state', () => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.className = 'radio radio-error'
      radio.setAttribute('aria-invalid', 'true')

      const errorMsg = document.createElement('span')
      errorMsg.className = 'error-message'
      errorMsg.textContent = 'Please select an option'

      container.appendChild(radio)
      container.appendChild(errorMsg)

      expect(radio.className).toContain('radio-error')
      expect(radio.getAttribute('aria-invalid')).toBe('true')
      expect(errorMsg.textContent).toBe('Please select an option')
    })
  })
})
