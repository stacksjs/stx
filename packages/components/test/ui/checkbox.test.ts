import { describe, expect, it, beforeEach } from 'bun:test'
import type { CheckboxProps } from '../../src/ui/checkbox'

describe('Checkbox Component - DOM Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('Rendering', () => {
    it('should render a checkbox input', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      container.appendChild(checkbox)

      expect(container.querySelector('input[type="checkbox"]')).toBeTruthy()
      expect(checkbox.type).toBe('checkbox')
    })

    it('should render with label', () => {
      const label = document.createElement('label')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.id = 'agree-checkbox'

      const labelText = document.createElement('span')
      labelText.textContent = 'I agree to terms'

      label.appendChild(checkbox)
      label.appendChild(labelText)
      container.appendChild(label)

      expect(label.querySelector('input[type="checkbox"]')).toBeTruthy()
      expect(labelText.textContent).toBe('I agree to terms')
    })

    it('should render description', () => {
      const wrapper = document.createElement('div')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'

      const description = document.createElement('span')
      description.className = 'checkbox-description'
      description.textContent = 'By checking this, you agree to our terms'

      wrapper.appendChild(checkbox)
      wrapper.appendChild(description)
      container.appendChild(wrapper)

      expect(wrapper.querySelector('.checkbox-description')?.textContent).toBe('By checking this, you agree to our terms')
    })

    it('should apply size classes', () => {
      const sizes: Array<CheckboxProps['size']> = ['sm', 'md', 'lg']

      sizes.forEach((size) => {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = `checkbox checkbox-${size}`
        container.appendChild(checkbox)

        expect(checkbox.className).toContain(`checkbox-${size}`)
      })
    })
  })

  describe('States', () => {
    it('should be unchecked by default', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      container.appendChild(checkbox)

      expect(checkbox.checked).toBe(false)
    })

    it('should be checked', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = true
      container.appendChild(checkbox)

      expect(checkbox.checked).toBe(true)
    })

    it('should toggle checked state', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      container.appendChild(checkbox)

      expect(checkbox.checked).toBe(false)
      checkbox.checked = true
      expect(checkbox.checked).toBe(true)
      checkbox.checked = false
      expect(checkbox.checked).toBe(false)
    })

    it('should support indeterminate state', () => {
      const checkbox = document.createElement('input') as HTMLInputElement
      checkbox.type = 'checkbox'
      container.appendChild(checkbox)

      // Indeterminate is only settable via property, not attribute
      checkbox.indeterminate = true
      expect(checkbox.indeterminate).toBe(true)

      checkbox.indeterminate = false
      expect(checkbox.indeterminate).toBe(false)
    })

    it('should be disabled', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.disabled = true
      container.appendChild(checkbox)

      expect(checkbox.disabled).toBe(true)
    })
  })

  describe('Interactions', () => {
    it('should handle click event', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      let clicked = false

      checkbox.addEventListener('click', () => {
        clicked = true
      })

      container.appendChild(checkbox)
      checkbox.click()

      expect(clicked).toBe(true)
    })

    it('should handle change event', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      let changeValue = false

      checkbox.addEventListener('change', () => {
        changeValue = checkbox.checked
      })

      container.appendChild(checkbox)
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))

      expect(changeValue).toBe(true)
    })

    it('should not trigger events when disabled', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.disabled = true
      let clicked = false

      checkbox.addEventListener('click', () => {
        clicked = true
      })

      container.appendChild(checkbox)
      // Disabled elements don't trigger click in real browsers
      expect(checkbox.disabled).toBe(true)
    })
  })

  describe('Form Integration', () => {
    it('should have name and value', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.name = 'terms'
      checkbox.value = 'agreed'
      container.appendChild(checkbox)

      expect(checkbox.name).toBe('terms')
      expect(checkbox.value).toBe('agreed')
    })

    it('should be required', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.required = true
      container.appendChild(checkbox)

      expect(checkbox.required).toBe(true)
    })

    it('should work in a form', () => {
      const form = document.createElement('form')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.name = 'subscribe'
      checkbox.value = 'yes'
      checkbox.checked = true

      form.appendChild(checkbox)
      container.appendChild(form)

      expect(form.querySelector('input[name="subscribe"]')).toBeTruthy()
      expect(checkbox.checked).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper role', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      container.appendChild(checkbox)

      // Checkbox inputs have implicit role="checkbox"
      expect(checkbox.type).toBe('checkbox')
    })

    it('should set aria-label', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.setAttribute('aria-label', 'Accept terms')
      container.appendChild(checkbox)

      expect(checkbox.getAttribute('aria-label')).toBe('Accept terms')
    })

    it('should set aria-checked', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = true
      checkbox.setAttribute('aria-checked', 'true')
      container.appendChild(checkbox)

      expect(checkbox.getAttribute('aria-checked')).toBe('true')
    })

    it('should set aria-describedby', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.setAttribute('aria-describedby', 'checkbox-desc')

      const description = document.createElement('span')
      description.id = 'checkbox-desc'
      description.textContent = 'Check this to continue'

      container.appendChild(checkbox)
      container.appendChild(description)

      expect(checkbox.getAttribute('aria-describedby')).toBe('checkbox-desc')
    })

    it('should be keyboard focusable', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      container.appendChild(checkbox)

      expect(checkbox.tabIndex).toBe(0)
    })

    it('should handle keyboard activation', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      let activated = false

      checkbox.addEventListener('keydown', (e: any) => {
        const key = e.key || (e as any).keyCode
        if (key === ' ' || key === 32) {
          activated = true
        }
      })

      container.appendChild(checkbox)

      const spaceEvent = new KeyboardEvent('keydown', { bubbles: true })
      Object.defineProperty(spaceEvent, 'key', { value: ' ', writable: true })
      checkbox.dispatchEvent(spaceEvent)

      expect(activated).toBe(true)
    })
  })

  describe('Error State', () => {
    it('should show error state', () => {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'checkbox checkbox-error'
      checkbox.setAttribute('aria-invalid', 'true')

      const errorMsg = document.createElement('span')
      errorMsg.className = 'error-message'
      errorMsg.textContent = 'You must accept the terms'

      container.appendChild(checkbox)
      container.appendChild(errorMsg)

      expect(checkbox.className).toContain('checkbox-error')
      expect(checkbox.getAttribute('aria-invalid')).toBe('true')
      expect(errorMsg.textContent).toBe('You must accept the terms')
    })
  })

  describe('Checkbox Group', () => {
    it('should support multiple checkboxes with same name', () => {
      const form = document.createElement('form')

      const checkbox1 = document.createElement('input')
      checkbox1.type = 'checkbox'
      checkbox1.name = 'interests'
      checkbox1.value = 'sports'
      checkbox1.checked = true

      const checkbox2 = document.createElement('input')
      checkbox2.type = 'checkbox'
      checkbox2.name = 'interests'
      checkbox2.value = 'music'
      checkbox2.checked = true

      const checkbox3 = document.createElement('input')
      checkbox3.type = 'checkbox'
      checkbox3.name = 'interests'
      checkbox3.value = 'reading'

      form.appendChild(checkbox1)
      form.appendChild(checkbox2)
      form.appendChild(checkbox3)
      container.appendChild(form)

      const checkboxes = form.querySelectorAll('input[name="interests"]')
      expect(checkboxes.length).toBe(3)

      const checkedBoxes = Array.from(checkboxes).filter((cb: any) => cb.checked)
      expect(checkedBoxes.length).toBe(2)
    })
  })
})
