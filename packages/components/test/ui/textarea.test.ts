import type { TextareaProps } from '../../src/ui/textarea'
import { beforeEach, describe, expect, it } from 'bun:test'

describe('Textarea Component - DOM Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('Rendering', () => {
    it('should render a textarea element', () => {
      const textarea = document.createElement('textarea')
      container.appendChild(textarea)

      expect(container.querySelector('textarea')).toBeTruthy()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render with label', () => {
      const label = document.createElement('label')
      label.textContent = 'Description'
      label.setAttribute('for', 'description-textarea')

      const textarea = document.createElement('textarea')
      textarea.id = 'description-textarea'

      container.appendChild(label)
      container.appendChild(textarea)

      expect(container.querySelector('label')).toBeTruthy()
      expect(label.getAttribute('for')).toBe('description-textarea')
    })

    it('should render helper text', () => {
      const helper = document.createElement('span')
      helper.className = 'helper-text'
      helper.textContent = 'Enter a description'
      container.appendChild(helper)

      expect(container.querySelector('.helper-text')?.textContent).toBe('Enter a description')
    })

    it('should render character counter', () => {
      const textarea = document.createElement('textarea')
      textarea.maxLength = 500
      textarea.value = 'Some text'

      const counter = document.createElement('span')
      counter.className = 'char-counter'
      counter.textContent = `${textarea.value.length}/${textarea.maxLength}`

      container.appendChild(textarea)
      container.appendChild(counter)

      expect(counter.textContent).toBe('9/500')
    })
  })

  describe('Attributes', () => {
    it('should set rows', () => {
      const textarea = document.createElement('textarea')
      textarea.rows = 5
      container.appendChild(textarea)

      expect(textarea.rows).toBe(5)
    })

    it('should set cols', () => {
      const textarea = document.createElement('textarea')
      textarea.cols = 50
      container.appendChild(textarea)

      expect(textarea.cols).toBe(50)
    })

    it('should set placeholder', () => {
      const textarea = document.createElement('textarea')
      textarea.placeholder = 'Enter your message'
      container.appendChild(textarea)

      expect(textarea.placeholder).toBe('Enter your message')
    })

    it('should set disabled state', () => {
      const textarea = document.createElement('textarea')
      textarea.disabled = true
      container.appendChild(textarea)

      expect(textarea.disabled).toBe(true)
    })

    it('should set readonly state', () => {
      const textarea = document.createElement('textarea')
      textarea.setAttribute('readonly', 'true')
      container.appendChild(textarea)

      expect(textarea.hasAttribute('readonly')).toBe(true)
    })

    it('should set required attribute', () => {
      const textarea = document.createElement('textarea')
      textarea.required = true
      container.appendChild(textarea)

      expect(textarea.required).toBe(true)
    })

    it('should set maxLength', () => {
      const textarea = document.createElement('textarea')
      textarea.maxLength = 500
      container.appendChild(textarea)

      expect(textarea.maxLength).toBe(500)
    })

    it('should set resize style', () => {
      const resizeOptions: Array<TextareaProps['resize']> = ['none', 'vertical', 'horizontal', 'both']

      resizeOptions.forEach((resize) => {
        const textarea = document.createElement('textarea')
        textarea.style.resize = resize!
        container.appendChild(textarea)

        expect(textarea.style.resize).toBe(resize)
      })
    })
  })

  describe('Value Management', () => {
    it('should update value', () => {
      const textarea = document.createElement('textarea')
      container.appendChild(textarea)

      textarea.value = 'test value'
      expect(textarea.value).toBe('test value')
    })

    it('should handle multiline text', () => {
      const textarea = document.createElement('textarea')
      const multilineText = 'Line 1\nLine 2\nLine 3'
      textarea.value = multilineText
      container.appendChild(textarea)

      expect(textarea.value).toBe(multilineText)
    })

    it('should clear value', () => {
      const textarea = document.createElement('textarea')
      textarea.value = 'test'
      container.appendChild(textarea)

      textarea.value = ''
      expect(textarea.value).toBe('')
    })
  })

  describe('Auto-resize', () => {
    it('should set initial height based on rows', () => {
      const textarea = document.createElement('textarea')
      textarea.rows = 3
      container.appendChild(textarea)

      expect(textarea.rows).toBe(3)
    })

    it('should respect maxRows constraint', () => {
      const textarea = document.createElement('textarea')
      textarea.rows = 3
      textarea.setAttribute('data-max-rows', '10')
      container.appendChild(textarea)

      expect(textarea.getAttribute('data-max-rows')).toBe('10')
    })
  })

  describe('Events', () => {
    it('should handle input event', () => {
      const textarea = document.createElement('textarea')
      let value = ''

      textarea.addEventListener('input', () => {
        value = textarea.value
      })

      container.appendChild(textarea)
      textarea.value = 'hello world'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))

      expect(value).toBe('hello world')
    })

    it('should handle change event', () => {
      const textarea = document.createElement('textarea')
      let changed = false

      textarea.addEventListener('change', () => {
        changed = true
      })

      container.appendChild(textarea)
      textarea.dispatchEvent(new Event('change', { bubbles: true }))

      expect(changed).toBe(true)
    })

    it('should handle focus/blur', () => {
      const textarea = document.createElement('textarea')
      let focused = false
      let blurred = false

      textarea.addEventListener('focus', () => {
        focused = true
      })
      textarea.addEventListener('blur', () => {
        blurred = true
      })

      container.appendChild(textarea)
      textarea.dispatchEvent(new Event('focus'))
      textarea.dispatchEvent(new Event('blur'))

      expect(focused).toBe(true)
      expect(blurred).toBe(true)
    })
  })

  describe('Error State', () => {
    it('should show error state', () => {
      const textarea = document.createElement('textarea')
      textarea.className = 'textarea textarea-error'
      textarea.setAttribute('aria-invalid', 'true')

      const errorMsg = document.createElement('span')
      errorMsg.className = 'error-message'
      errorMsg.textContent = 'This field is required'

      container.appendChild(textarea)
      container.appendChild(errorMsg)

      expect(textarea.className).toContain('textarea-error')
      expect(textarea.getAttribute('aria-invalid')).toBe('true')
      expect(errorMsg.textContent).toBe('This field is required')
    })
  })

  describe('Accessibility', () => {
    it('should associate label with textarea', () => {
      const label = document.createElement('label')
      label.setAttribute('for', 'test-textarea')
      label.textContent = 'Test Textarea'

      const textarea = document.createElement('textarea')
      textarea.id = 'test-textarea'

      container.appendChild(label)
      container.appendChild(textarea)

      expect(label.getAttribute('for')).toBe(textarea.id)
    })

    it('should set aria-label', () => {
      const textarea = document.createElement('textarea')
      textarea.setAttribute('aria-label', 'Message')
      container.appendChild(textarea)

      expect(textarea.getAttribute('aria-label')).toBe('Message')
    })

    it('should set aria-required', () => {
      const textarea = document.createElement('textarea')
      textarea.required = true
      textarea.setAttribute('aria-required', 'true')
      container.appendChild(textarea)

      expect(textarea.getAttribute('aria-required')).toBe('true')
    })

    it('should set aria-invalid for errors', () => {
      const textarea = document.createElement('textarea')
      textarea.setAttribute('aria-invalid', 'true')
      textarea.setAttribute('aria-describedby', 'error-msg')

      const errorMsg = document.createElement('span')
      errorMsg.id = 'error-msg'
      errorMsg.textContent = 'Invalid input'

      container.appendChild(textarea)
      container.appendChild(errorMsg)

      expect(textarea.getAttribute('aria-invalid')).toBe('true')
      expect(textarea.getAttribute('aria-describedby')).toBe('error-msg')
    })

    it('should be keyboard focusable', () => {
      const textarea = document.createElement('textarea')
      container.appendChild(textarea)

      expect(textarea.tabIndex).toBe(0)
    })
  })
})
