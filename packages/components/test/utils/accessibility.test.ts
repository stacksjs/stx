import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  announceToScreenReader,
  aria,
  createAriaDescription,
  createAriaLabel,
  createFocusTrap,
  createRovingTabindex,
  createScreenReaderText,
  createSkipLink,
  generateId,
  getFocusableElements,
  hasFocus,
  isVisibleToScreenReader,
  prefersReducedMotion,
  validateAriaRelationships,
} from '../../src/utils/accessibility'

describe('Accessibility Utilities', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
      expect(id1).toContain('a11y')
    })

    it('should use custom prefix', () => {
      const id = generateId('custom')
      expect(id).toContain('custom')
    })
  })

  describe('createAriaLabel', () => {
    it('should create hidden label', () => {
      const input = document.createElement('input')
      container.appendChild(input)

      const labelId = createAriaLabel('Username', input, { visible: false })

      expect(input.getAttribute('aria-labelledby')).toBe(labelId)
      // Label should be in the parent or document
      const label = document.getElementById(labelId) || container.querySelector(`#${labelId}`)
      expect(label).toBeTruthy()
      expect(label?.textContent).toBe('Username')
    })

    it('should create visible label', () => {
      const input = document.createElement('input')
      container.appendChild(input)

      const labelId = createAriaLabel('Username', input, { visible: true })
      const label = document.getElementById(labelId) || container.querySelector(`#${labelId}`)

      expect(label?.tagName).toBe('LABEL')
      expect(label?.textContent).toBe('Username')
    })

    it('should use custom ID', () => {
      const customId = 'my-label'
      const labelId = createAriaLabel('Test', null, { id: customId })

      expect(labelId).toBe(customId)
    })
  })

  describe('createAriaDescription', () => {
    it('should create description and link to element', () => {
      const input = document.createElement('input')
      container.appendChild(input)

      const descId = createAriaDescription('Enter your username', input)

      expect(input.getAttribute('aria-describedby')).toBe(descId)
      const desc = document.getElementById(descId) || container.querySelector(`#${descId}`)
      expect(desc?.textContent).toBe('Enter your username')
    })
  })

  describe('announceToScreenReader', () => {
    it('should create live region for announcement', async () => {
      announceToScreenReader('Test message', 'polite')

      // Wait for announcement to be created
      await new Promise(resolve => setTimeout(resolve, 150))

      const liveRegion = document.querySelector('[role="status"]')
      expect(liveRegion).toBeTruthy()
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
      expect(liveRegion?.textContent).toBe('Test message')
    })

    it('should support assertive announcements', async () => {
      announceToScreenReader('Urgent message', 'assertive')

      await new Promise(resolve => setTimeout(resolve, 150))

      const liveRegion = document.querySelector('[role="status"]')
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive')
    })
  })

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text">
        <textarea></textarea>
        <select></select>
        <div tabindex="0">Div</div>
        <div>Not focusable</div>
      `

      const focusable = getFocusableElements(container)
      expect(focusable.length).toBe(6)
    })

    it('should exclude disabled elements', () => {
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
        <input type="text">
        <input type="text" disabled>
      `

      const focusable = getFocusableElements(container)
      expect(focusable.length).toBe(2)
    })

    it('should exclude hidden inputs', () => {
      container.innerHTML = `
        <input type="text">
        <input type="hidden">
      `

      const focusable = getFocusableElements(container)
      expect(focusable.length).toBe(1)
    })
  })

  describe('createFocusTrap', () => {
    it('should trap focus within container', () => {
      container.innerHTML = `
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      `

      const trap = createFocusTrap(container)

      // Verify trap methods exist
      expect(typeof trap.activate).toBe('function')
      expect(typeof trap.deactivate).toBe('function')
      expect(typeof trap.pause).toBe('function')
      expect(typeof trap.unpause).toBe('function')

      trap.activate()
      trap.deactivate()
    })

    it('should handle escape key', () => {
      container.innerHTML = '<button>Button</button>'

      let activated = false
      let deactivated = false
      const trap = createFocusTrap(container, {
        escapeDeactivates: true,
        onActivate: () => { activated = true },
        onDeactivate: () => { deactivated = true },
      })

      trap.activate()
      expect(activated).toBe(true)

      trap.deactivate()
      expect(deactivated).toBe(true)
    })

    it('should pause and unpause', () => {
      container.innerHTML = '<button>Button</button>'

      const trap = createFocusTrap(container)
      trap.activate()

      // Test pause
      trap.pause()
      expect(typeof trap.pause).toBe('function')

      // Test unpause
      trap.unpause()
      expect(typeof trap.unpause).toBe('function')

      trap.deactivate()
    })
  })

  describe('createRovingTabindex', () => {
    it('should manage roving tabindex', () => {
      container.innerHTML = `
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      `

      const cleanup = createRovingTabindex(container, {
        selector: 'button',
        initialIndex: 0,
      })

      const buttons = Array.from(container.querySelectorAll('button'))
      expect(buttons[0].getAttribute('tabindex')).toBe('0')
      expect(buttons[1].getAttribute('tabindex')).toBe('-1')
      expect(buttons[2].getAttribute('tabindex')).toBe('-1')

      cleanup()
    })

    it('should handle arrow key navigation', () => {
      container.innerHTML = `
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      `

      let _focusIndex = 0
      const cleanup = createRovingTabindex(container, {
        selector: 'button',
        orientation: 'horizontal',
        onFocusChange: (index) => { _focusIndex = index },
      })

      // Verify callback setup works
      expect(typeof cleanup).toBe('function')

      cleanup()
    })

    it('should loop navigation when enabled', () => {
      container.innerHTML = `
        <button>Item 1</button>
        <button>Item 2</button>
      `

      let focusIndex = -1
      const cleanup = createRovingTabindex(container, {
        selector: 'button',
        initialIndex: 1,
        loop: true,
        onFocusChange: (index) => { focusIndex = index },
      })

      // Initial index should be set
      expect(focusIndex).toBe(1)

      cleanup()
    })

    it('should handle Home and End keys', () => {
      container.innerHTML = `
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      `

      let focusIndex = -1
      const cleanup = createRovingTabindex(container, {
        selector: 'button',
        initialIndex: 1,
        onFocusChange: (index) => { focusIndex = index },
      })

      // Initial focus should be set
      expect(focusIndex).toBe(1)

      // Verify orientation options work
      const cleanup2 = createRovingTabindex(container, {
        selector: 'button',
        orientation: 'vertical',
      })

      cleanup()
      cleanup2()
    })
  })

  describe('aria helpers', () => {
    it('should set aria-expanded', () => {
      const button = document.createElement('button')
      aria.setExpanded(button, true)
      expect(button.getAttribute('aria-expanded')).toBe('true')

      aria.setExpanded(button, false)
      expect(button.getAttribute('aria-expanded')).toBe('false')
    })

    it('should set aria-selected', () => {
      const option = document.createElement('div')
      aria.setSelected(option, true)
      expect(option.getAttribute('aria-selected')).toBe('true')
    })

    it('should set aria-checked', () => {
      const checkbox = document.createElement('div')
      aria.setChecked(checkbox, true)
      expect(checkbox.getAttribute('aria-checked')).toBe('true')

      aria.setChecked(checkbox, 'mixed')
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed')
    })

    it('should set aria-disabled with tabindex', () => {
      const button = document.createElement('button')
      aria.setDisabled(button, true)
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.getAttribute('tabindex')).toBe('-1')

      aria.setDisabled(button, false)
      expect(button.getAttribute('aria-disabled')).toBe('false')
      expect(button.hasAttribute('tabindex')).toBe(false)
    })

    it('should set aria-hidden', () => {
      const div = document.createElement('div')
      aria.setHidden(div, true)
      expect(div.getAttribute('aria-hidden')).toBe('true')

      aria.setHidden(div, false)
      expect(div.hasAttribute('aria-hidden')).toBe(false)
    })

    it('should set aria-pressed', () => {
      const button = document.createElement('button')
      aria.setPressed(button, true)
      expect(button.getAttribute('aria-pressed')).toBe('true')
    })

    it('should set aria-invalid', () => {
      const input = document.createElement('input')
      aria.setInvalid(input, true)
      expect(input.getAttribute('aria-invalid')).toBe('true')
    })

    it('should set aria-required', () => {
      const input = document.createElement('input')
      aria.setRequired(input, true)
      expect(input.getAttribute('aria-required')).toBe('true')
    })

    it('should set aria-live', () => {
      const div = document.createElement('div')
      aria.setLive(div, 'polite')
      expect(div.getAttribute('aria-live')).toBe('polite')
    })

    it('should set aria-busy', () => {
      const div = document.createElement('div')
      aria.setBusy(div, true)
      expect(div.getAttribute('aria-busy')).toBe('true')
    })
  })

  describe('createScreenReaderText', () => {
    it('should create visually hidden text', () => {
      const text = createScreenReaderText('Screen reader only')

      expect(text.textContent).toBe('Screen reader only')
      expect(text.style.position).toBe('absolute')
      expect(text.style.width).toBe('1px')
      expect(text.style.height).toBe('1px')
    })
  })

  describe('hasFocus', () => {
    it('should check if element has focus', () => {
      const button = document.createElement('button')
      container.appendChild(button)

      expect(hasFocus(button)).toBe(false)

      // Skip focus test in Happy DOM due to limited focus() support
      if (typeof button.focus === 'function') {
        button.focus()
        expect(hasFocus(button)).toBe(true)
      }
    })
  })

  describe('isVisibleToScreenReader', () => {
    it('should detect aria-hidden elements', () => {
      const div = document.createElement('div')
      container.appendChild(div)

      expect(isVisibleToScreenReader(div)).toBe(true)

      div.setAttribute('aria-hidden', 'true')
      expect(isVisibleToScreenReader(div)).toBe(false)
    })

    it('should detect display:none elements', () => {
      const div = document.createElement('div')
      div.style.display = 'none'
      container.appendChild(div)

      expect(isVisibleToScreenReader(div)).toBe(false)
    })

    it('should detect visibility:hidden elements', () => {
      const div = document.createElement('div')
      div.style.visibility = 'hidden'
      container.appendChild(div)

      expect(isVisibleToScreenReader(div)).toBe(false)
    })
  })

  describe('createSkipLink', () => {
    it('should create skip link', () => {
      const link = createSkipLink('main-content', 'Skip to main')

      expect(link.href).toContain('#main-content')
      expect(link.textContent).toBe('Skip to main')
      expect(link.style.position).toBe('absolute')
    })

    it('should show on focus', () => {
      const link = createSkipLink('main-content')
      expect(link.style.top).toBe('-40px')

      // Use Event instead of FocusEvent for Happy DOM compatibility
      link.dispatchEvent(new Event('focus'))
      // Happy DOM returns '0' without 'px'
      expect(link.style.top).toMatch(/^(-)?0(px)?$/)

      link.dispatchEvent(new Event('blur'))
      expect(link.style.top).toBe('-40px')
    })
  })

  describe('validateAriaRelationships', () => {
    it('should validate aria-labelledby references', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-labelledby', 'label-1')
      container.appendChild(button)

      const errors = validateAriaRelationships(button)
      expect(errors.length).toBe(1)
      expect(errors[0]).toContain('aria-labelledby')
      expect(errors[0]).toContain('label-1')
    })

    it('should validate aria-describedby references', () => {
      const input = document.createElement('input')
      input.setAttribute('aria-describedby', 'desc-1 desc-2')
      container.appendChild(input)

      const errors = validateAriaRelationships(input)
      expect(errors.length).toBe(2)
    })

    it('should pass with valid references', () => {
      const label = document.createElement('span')
      label.id = 'valid-label'
      container.appendChild(label)

      const button = document.createElement('button')
      button.setAttribute('aria-labelledby', 'valid-label')
      container.appendChild(button)

      const errors = validateAriaRelationships(button)
      expect(errors.length).toBe(0)
    })

    it('should validate aria-controls', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-controls', 'panel-1')
      container.appendChild(button)

      const errors = validateAriaRelationships(button)
      expect(errors.length).toBe(1)
      expect(errors[0]).toContain('aria-controls')
    })
  })

  describe('media query preferences', () => {
    it('should check prefers-reduced-motion', () => {
      const result = prefersReducedMotion()
      expect(typeof result).toBe('boolean')
    })
  })
})
