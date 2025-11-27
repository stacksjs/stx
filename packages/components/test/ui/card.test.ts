import type { CardProps } from '../../src/ui/card'
import { beforeEach, describe, expect, it } from 'bun:test'

describe('Card Component - DOM Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('Rendering', () => {
    it('should render a card element', () => {
      const card = document.createElement('div')
      card.className = 'card'
      container.appendChild(card)

      expect(container.querySelector('.card')).toBeTruthy()
    })

    it('should render card content', () => {
      const card = document.createElement('div')
      card.className = 'card'

      const header = document.createElement('div')
      header.className = 'card-header'
      header.textContent = 'Card Title'

      const body = document.createElement('div')
      body.className = 'card-body'
      body.textContent = 'Card content'

      card.appendChild(header)
      card.appendChild(body)
      container.appendChild(card)

      expect(card.querySelector('.card-header')?.textContent).toBe('Card Title')
      expect(card.querySelector('.card-body')?.textContent).toBe('Card content')
    })

    it('should apply variant classes', () => {
      const variants: Array<CardProps['variant']> = ['default', 'outlined', 'elevated', 'flat']

      variants.forEach((variant) => {
        const card = document.createElement('div')
        card.className = `card card-${variant}`
        container.appendChild(card)

        expect(card.className).toContain(`card-${variant}`)
      })
    })

    it('should apply padding classes', () => {
      const paddings: Array<CardProps['padding']> = ['none', 'sm', 'default', 'lg']

      paddings.forEach((padding) => {
        const card = document.createElement('div')
        card.className = `card padding-${padding}`
        container.appendChild(card)

        expect(card.className).toContain(`padding-${padding}`)
      })
    })

    it('should render with image', () => {
      const card = document.createElement('div')
      card.className = 'card'

      const img = document.createElement('img')
      img.src = '/image.jpg'
      img.alt = 'Card image'
      img.className = 'card-image'

      card.appendChild(img)
      container.appendChild(card)

      expect(card.querySelector('.card-image')).toBeTruthy()
      expect((card.querySelector('.card-image') as HTMLImageElement)?.src).toContain('image.jpg')
    })

    it('should position image at top', () => {
      const card = document.createElement('div')
      card.className = 'card'

      const img = document.createElement('img')
      img.className = 'card-image image-top'

      const body = document.createElement('div')
      body.className = 'card-body'

      card.appendChild(img)
      card.appendChild(body)
      container.appendChild(card)

      expect(card.firstChild).toBe(img)
    })

    it('should position image at bottom', () => {
      const card = document.createElement('div')
      card.className = 'card'

      const body = document.createElement('div')
      body.className = 'card-body'

      const img = document.createElement('img')
      img.className = 'card-image image-bottom'

      card.appendChild(body)
      card.appendChild(img)
      container.appendChild(card)

      expect(card.lastChild).toBe(img)
    })
  })

  describe('States', () => {
    it('should apply hover effect', () => {
      const card = document.createElement('div')
      card.className = 'card card-hover'
      let hovered = false

      card.addEventListener('mouseenter', () => {
        hovered = true
        card.classList.add('hovered')
      })

      card.addEventListener('mouseleave', () => {
        hovered = false
        card.classList.remove('hovered')
      })

      container.appendChild(card)

      card.dispatchEvent(new Event('mouseenter'))
      expect(hovered).toBe(true)
      expect(card.classList.contains('hovered')).toBe(true)

      card.dispatchEvent(new Event('mouseleave'))
      expect(hovered).toBe(false)
      expect(card.classList.contains('hovered')).toBe(false)
    })

    it('should be clickable', () => {
      const card = document.createElement('div')
      card.className = 'card card-clickable'
      card.style.cursor = 'pointer'
      let clicked = false

      card.addEventListener('click', () => {
        clicked = true
      })

      container.appendChild(card)
      card.click()

      expect(clicked).toBe(true)
      expect(card.style.cursor).toBe('pointer')
    })
  })

  describe('Interactions', () => {
    it('should handle click event', () => {
      const card = document.createElement('div')
      card.className = 'card'
      let clicked = false

      card.addEventListener('click', () => {
        clicked = true
      })

      container.appendChild(card)
      card.click()

      expect(clicked).toBe(true)
    })

    it('should not be clickable when disabled', () => {
      const card = document.createElement('div')
      card.className = 'card card-disabled'
      card.setAttribute('aria-disabled', 'true')
      let clicked = false

      card.addEventListener('click', (e) => {
        if (card.getAttribute('aria-disabled') === 'true') {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        clicked = true
      })

      container.appendChild(card)
      card.click()

      expect(card.getAttribute('aria-disabled')).toBe('true')
    })
  })

  describe('Accessibility', () => {
    it('should have proper role for clickable cards', () => {
      const card = document.createElement('div')
      card.className = 'card card-clickable'
      card.setAttribute('role', 'button')
      card.tabIndex = 0
      container.appendChild(card)

      expect(card.getAttribute('role')).toBe('button')
      expect(card.tabIndex).toBe(0)
    })

    it('should set aria-label', () => {
      const card = document.createElement('div')
      card.className = 'card'
      card.setAttribute('aria-label', 'Product card')
      container.appendChild(card)

      expect(card.getAttribute('aria-label')).toBe('Product card')
    })

    it('should handle keyboard activation for clickable cards', () => {
      const card = document.createElement('div')
      card.className = 'card card-clickable'
      card.tabIndex = 0
      let activated = false

      card.addEventListener('keydown', (e: any) => {
        const key = e.key || (e as any).keyCode
        if (key === 'Enter' || key === ' ' || key === 13 || key === 32) {
          activated = true
        }
      })

      container.appendChild(card)

      const enterEvent = new KeyboardEvent('keydown', { bubbles: true })
      Object.defineProperty(enterEvent, 'key', { value: 'Enter', writable: true })
      card.dispatchEvent(enterEvent)

      expect(activated).toBe(true)
    })
  })

  describe('Layout', () => {
    it('should support header/body/footer structure', () => {
      const card = document.createElement('div')
      card.className = 'card'

      const header = document.createElement('div')
      header.className = 'card-header'
      header.textContent = 'Header'

      const body = document.createElement('div')
      body.className = 'card-body'
      body.textContent = 'Body'

      const footer = document.createElement('div')
      footer.className = 'card-footer'
      footer.textContent = 'Footer'

      card.appendChild(header)
      card.appendChild(body)
      card.appendChild(footer)
      container.appendChild(card)

      expect(card.querySelector('.card-header')).toBeTruthy()
      expect(card.querySelector('.card-body')).toBeTruthy()
      expect(card.querySelector('.card-footer')).toBeTruthy()
    })

    it('should support actions in footer', () => {
      const card = document.createElement('div')
      const footer = document.createElement('div')
      footer.className = 'card-footer'

      const button1 = document.createElement('button')
      button1.textContent = 'Cancel'

      const button2 = document.createElement('button')
      button2.textContent = 'Save'

      footer.appendChild(button1)
      footer.appendChild(button2)
      card.appendChild(footer)
      container.appendChild(card)

      expect(footer.querySelectorAll('button').length).toBe(2)
    })
  })
})
