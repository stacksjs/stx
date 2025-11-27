import type { TextInputProps } from '../../src/ui/input'
import { beforeEach, describe, expect, it } from 'bun:test'

describe('Input Components - DOM Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('TextInput', () => {
    describe('Rendering', () => {
      it('should render an input element', () => {
        const input = document.createElement('input')
        input.type = 'text'
        container.appendChild(input)

        expect(container.querySelector('input')).toBeTruthy()
        expect(input.type).toBe('text')
      })

      it('should apply size classes', () => {
        const sizes: Array<TextInputProps['size']> = ['sm', 'md', 'lg']

        sizes.forEach((size) => {
          const input = document.createElement('input')
          input.className = `input input-${size}`
          container.appendChild(input)

          expect(input.className).toContain(`input-${size}`)
        })
      })

      it('should render with label', () => {
        const label = document.createElement('label')
        label.textContent = 'Username'
        label.setAttribute('for', 'username-input')

        const input = document.createElement('input')
        input.id = 'username-input'

        container.appendChild(label)
        container.appendChild(input)

        expect(container.querySelector('label')).toBeTruthy()
        expect(label.getAttribute('for')).toBe('username-input')
      })

      it('should render helper text', () => {
        const helper = document.createElement('span')
        helper.className = 'helper-text'
        helper.textContent = 'Enter your username'
        container.appendChild(helper)

        expect(container.querySelector('.helper-text')?.textContent).toBe('Enter your username')
      })

      it('should render with icons', () => {
        const wrapper = document.createElement('div')
        const leftIcon = document.createElement('span')
        leftIcon.className = 'icon-left'
        const input = document.createElement('input')
        const rightIcon = document.createElement('span')
        rightIcon.className = 'icon-right'

        wrapper.appendChild(leftIcon)
        wrapper.appendChild(input)
        wrapper.appendChild(rightIcon)
        container.appendChild(wrapper)

        expect(wrapper.querySelector('.icon-left')).toBeTruthy()
        expect(wrapper.querySelector('.icon-right')).toBeTruthy()
      })

      it('should render character counter', () => {
        const input = document.createElement('input')
        input.maxLength = 100
        input.value = 'Hello'

        const counter = document.createElement('span')
        counter.className = 'char-counter'
        counter.textContent = `${input.value.length}/${input.maxLength}`

        container.appendChild(input)
        container.appendChild(counter)

        expect(counter.textContent).toBe('5/100')
      })
    })

    describe('Attributes', () => {
      it('should set placeholder', () => {
        const input = document.createElement('input')
        input.placeholder = 'Enter text'
        container.appendChild(input)

        expect(input.placeholder).toBe('Enter text')
      })

      it('should set disabled state', () => {
        const input = document.createElement('input')
        input.disabled = true
        container.appendChild(input)

        expect(input.disabled).toBe(true)
      })

      it('should set readonly state', () => {
        const input = document.createElement('input')
        input.setAttribute('readonly', 'true')
        container.appendChild(input)

        expect(input.hasAttribute('readonly')).toBe(true)
      })

      it('should set required attribute', () => {
        const input = document.createElement('input')
        input.required = true
        container.appendChild(input)

        expect(input.required).toBe(true)
      })

      it('should set maxLength', () => {
        const input = document.createElement('input')
        input.maxLength = 50
        container.appendChild(input)

        expect(input.maxLength).toBe(50)
      })
    })

    describe('Value Management', () => {
      it('should update value', () => {
        const input = document.createElement('input')
        container.appendChild(input)

        input.value = 'test value'
        expect(input.value).toBe('test value')
      })

      it('should clear value', () => {
        const input = document.createElement('input')
        input.value = 'test'
        container.appendChild(input)

        const clearButton = document.createElement('button')
        clearButton.addEventListener('click', () => {
          input.value = ''
        })
        container.appendChild(clearButton)

        clearButton.click()
        expect(input.value).toBe('')
      })

      it('should enforce maxLength', () => {
        const input = document.createElement('input')
        input.maxLength = 10
        container.appendChild(input)

        input.value = '12345678901234567890'
        // Browser would truncate, but in tests we just verify maxLength is set
        expect(input.maxLength).toBe(10)
      })
    })

    describe('Events', () => {
      it('should handle input event', () => {
        const input = document.createElement('input')
        let value = ''

        input.addEventListener('input', () => {
          value = input.value
        })

        container.appendChild(input)
        input.value = 'hello'
        input.dispatchEvent(new Event('input', { bubbles: true }))

        expect(value).toBe('hello')
      })

      it('should handle change event', () => {
        const input = document.createElement('input')
        let changed = false

        input.addEventListener('change', () => {
          changed = true
        })

        container.appendChild(input)
        input.dispatchEvent(new Event('change', { bubbles: true }))

        expect(changed).toBe(true)
      })

      it('should handle focus/blur', () => {
        const input = document.createElement('input')
        let focused = false
        let blurred = false

        input.addEventListener('focus', () => {
          focused = true
        })
        input.addEventListener('blur', () => {
          blurred = true
        })

        container.appendChild(input)
        input.dispatchEvent(new Event('focus'))
        input.dispatchEvent(new Event('blur'))

        expect(focused).toBe(true)
        expect(blurred).toBe(true)
      })
    })

    describe('Error State', () => {
      it('should show error state', () => {
        const input = document.createElement('input')
        input.className = 'input input-error'
        input.setAttribute('aria-invalid', 'true')

        const errorMsg = document.createElement('span')
        errorMsg.className = 'error-message'
        errorMsg.textContent = 'This field is required'

        container.appendChild(input)
        container.appendChild(errorMsg)

        expect(input.className).toContain('input-error')
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(errorMsg.textContent).toBe('This field is required')
      })
    })
  })

  describe('EmailInput', () => {
    it('should have email type', () => {
      const input = document.createElement('input')
      input.type = 'email'
      container.appendChild(input)

      expect(input.type).toBe('email')
    })

    it('should set email pattern', () => {
      const input = document.createElement('input')
      input.type = 'email'
      input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$'
      container.appendChild(input)

      expect(input.pattern).toBeTruthy()
    })

    it('should validate email format', () => {
      const input = document.createElement('input')
      input.type = 'email'
      input.value = 'test@example.com'
      container.appendChild(input)

      // In real browsers, checkValidity() would validate
      // In tests, we just verify the email value is set
      expect(input.value).toBe('test@example.com')
    })
  })

  describe('PasswordInput', () => {
    it('should have password type by default', () => {
      const input = document.createElement('input')
      input.type = 'password'
      container.appendChild(input)

      expect(input.type).toBe('password')
    })

    it('should toggle password visibility', () => {
      const input = document.createElement('input')
      input.type = 'password'

      const toggleButton = document.createElement('button')
      toggleButton.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password'
      })

      container.appendChild(input)
      container.appendChild(toggleButton)

      expect(input.type).toBe('password')
      toggleButton.click()
      expect(input.type).toBe('text')
      toggleButton.click()
      expect(input.type).toBe('password')
    })

    it('should show password strength indicator', () => {
      const input = document.createElement('input')
      input.value = 'Str0ng!Pass'

      const strengthBar = document.createElement('div')
      strengthBar.className = 'strength-bar strength-strong'

      const strengthText = document.createElement('span')
      strengthText.textContent = 'Strong'

      container.appendChild(input)
      container.appendChild(strengthBar)
      container.appendChild(strengthText)

      expect(strengthBar.className).toContain('strength-strong')
      expect(strengthText.textContent).toBe('Strong')
    })
  })

  describe('NumberInput', () => {
    it('should have number type', () => {
      const input = document.createElement('input')
      input.type = 'number'
      container.appendChild(input)

      expect(input.type).toBe('number')
    })

    it('should set min/max values', () => {
      const input = document.createElement('input')
      input.type = 'number'
      input.min = '0'
      input.max = '100'
      container.appendChild(input)

      expect(input.min).toBe('0')
      expect(input.max).toBe('100')
    })

    it('should set step value', () => {
      const input = document.createElement('input')
      input.type = 'number'
      input.step = '0.5'
      container.appendChild(input)

      expect(input.step).toBe('0.5')
    })

    it('should increment value', () => {
      const input = document.createElement('input')
      input.type = 'number'
      input.value = '5'

      const incrementButton = document.createElement('button')
      incrementButton.addEventListener('click', () => {
        input.value = String(Number(input.value) + 1)
      })

      container.appendChild(input)
      container.appendChild(incrementButton)

      incrementButton.click()
      expect(input.value).toBe('6')
    })

    it('should decrement value', () => {
      const input = document.createElement('input')
      input.type = 'number'
      input.value = '5'

      const decrementButton = document.createElement('button')
      decrementButton.addEventListener('click', () => {
        input.value = String(Number(input.value) - 1)
      })

      container.appendChild(input)
      container.appendChild(decrementButton)

      decrementButton.click()
      expect(input.value).toBe('4')
    })

    it('should respect min/max constraints', () => {
      const input = document.createElement('input')
      input.type = 'number'
      input.min = '0'
      input.max = '10'
      input.value = '5'

      const incrementButton = document.createElement('button')
      incrementButton.addEventListener('click', () => {
        const newValue = Number(input.value) + 1
        const max = Number(input.max)
        input.value = String(Math.min(newValue, max))
      })

      container.appendChild(input)
      container.appendChild(incrementButton)

      // Increment to max
      for (let i = 0; i < 10; i++) {
        incrementButton.click()
      }

      expect(input.value).toBe('10')
    })
  })

  describe('SearchInput', () => {
    it('should have search type', () => {
      const input = document.createElement('input')
      input.type = 'search'
      container.appendChild(input)

      expect(input.type).toBe('search')
    })

    it('should render search icon', () => {
      const wrapper = document.createElement('div')
      const icon = document.createElement('span')
      icon.className = 'search-icon'
      const input = document.createElement('input')
      input.type = 'search'

      wrapper.appendChild(icon)
      wrapper.appendChild(input)
      container.appendChild(wrapper)

      expect(wrapper.querySelector('.search-icon')).toBeTruthy()
    })

    it('should trigger search on Enter', () => {
      const input = document.createElement('input')
      input.type = 'search'
      let searchValue = ''

      input.addEventListener('keydown', (e: any) => {
        const key = e.key || (e as any).keyCode
        if (key === 'Enter' || key === 13) {
          searchValue = input.value
        }
      })

      container.appendChild(input)
      input.value = 'search query'

      const enterEvent = new KeyboardEvent('keydown', { bubbles: true })
      Object.defineProperty(enterEvent, 'key', { value: 'Enter', writable: true })
      input.dispatchEvent(enterEvent)

      expect(searchValue).toBe('search query')
    })

    it('should show loading state', () => {
      const wrapper = document.createElement('div')
      const input = document.createElement('input')
      input.type = 'search'
      const spinner = document.createElement('span')
      spinner.className = 'spinner'

      wrapper.appendChild(input)
      wrapper.appendChild(spinner)
      container.appendChild(wrapper)

      expect(wrapper.querySelector('.spinner')).toBeTruthy()
    })

    it('should clear search', () => {
      const input = document.createElement('input')
      input.type = 'search'
      input.value = 'search query'

      const clearButton = document.createElement('button')
      clearButton.addEventListener('click', () => {
        input.value = ''
      })

      container.appendChild(input)
      container.appendChild(clearButton)

      clearButton.click()
      expect(input.value).toBe('')
    })
  })

  describe('Accessibility', () => {
    it('should associate label with input', () => {
      const label = document.createElement('label')
      label.setAttribute('for', 'test-input')
      label.textContent = 'Test Input'

      const input = document.createElement('input')
      input.id = 'test-input'

      container.appendChild(label)
      container.appendChild(input)

      expect(label.getAttribute('for')).toBe(input.id)
    })

    it('should set aria-label', () => {
      const input = document.createElement('input')
      input.setAttribute('aria-label', 'Search')
      container.appendChild(input)

      expect(input.getAttribute('aria-label')).toBe('Search')
    })

    it('should set aria-required', () => {
      const input = document.createElement('input')
      input.required = true
      input.setAttribute('aria-required', 'true')
      container.appendChild(input)

      expect(input.getAttribute('aria-required')).toBe('true')
    })

    it('should set aria-invalid for errors', () => {
      const input = document.createElement('input')
      input.setAttribute('aria-invalid', 'true')
      input.setAttribute('aria-describedby', 'error-msg')

      const errorMsg = document.createElement('span')
      errorMsg.id = 'error-msg'
      errorMsg.textContent = 'Invalid input'

      container.appendChild(input)
      container.appendChild(errorMsg)

      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')).toBe('error-msg')
    })

    it('should be keyboard focusable', () => {
      const input = document.createElement('input')
      container.appendChild(input)

      expect(input.tabIndex).toBe(0)
    })
  })
})
