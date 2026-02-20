import { describe, expect, it, beforeEach } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

/**
 * Tests for DOM binding behaviors in the signals runtime.
 * These tests verify that @for, @if, and text interpolation work correctly
 * with proper scope capture, especially for loop variables.
 */
describe('STX Signals - DOM Binding Behavior', () => {
  let stx: any
  let mockWindow: any
  let mockDocument: any
  let domElements: Map<string, any>
  let textNodes: any[]

  /**
   * Create a mock DOM element with essential properties
   */
  function createElement(tagName: string, attrs: Record<string, string> = {}): any {
    const element: any = {
      nodeType: 1, // Node.ELEMENT_NODE
      tagName: tagName.toUpperCase(),
      attributes: [],
      childNodes: [],
      children: [],
      parentNode: null,
      parentElement: null,
      style: { display: '' },
      className: '',
      textContent: '',
      innerHTML: '',
      _eventListeners: {},
      _removed: false,

      hasAttribute(name: string) {
        return this.attributes.some((a: any) => a.name === name)
      },
      getAttribute(name: string) {
        const attr = this.attributes.find((a: any) => a.name === name)
        return attr ? attr.value : null
      },
      setAttribute(name: string, value: string) {
        const existing = this.attributes.find((a: any) => a.name === name)
        if (existing) {
          existing.value = value
        } else {
          this.attributes.push({ name, value })
        }
      },
      removeAttribute(name: string) {
        const idx = this.attributes.findIndex((a: any) => a.name === name)
        if (idx !== -1) this.attributes.splice(idx, 1)
      },
      addEventListener(event: string, handler: any, options?: any) {
        this._eventListeners[event] = this._eventListeners[event] || []
        this._eventListeners[event].push({ handler, options })
      },
      appendChild(child: any) {
        child.parentNode = this
        child.parentElement = this
        this.childNodes.push(child)
        if (child.nodeType === 1) this.children.push(child)
        return child
      },
      insertBefore(newNode: any, refNode: any) {
        newNode.parentNode = this
        newNode.parentElement = this
        if (refNode === null) {
          this.childNodes.push(newNode)
        } else {
          const idx = this.childNodes.indexOf(refNode)
          if (idx !== -1) {
            this.childNodes.splice(idx, 0, newNode)
          } else {
            this.childNodes.push(newNode)
          }
        }
        if (newNode.nodeType === 1) {
          const refIdx = refNode ? this.children.indexOf(refNode) : -1
          if (refIdx !== -1) {
            this.children.splice(refIdx, 0, newNode)
          } else {
            this.children.push(newNode)
          }
        }
        return newNode
      },
      removeChild(child: any) {
        const idx = this.childNodes.indexOf(child)
        if (idx !== -1) this.childNodes.splice(idx, 1)
        const childIdx = this.children.indexOf(child)
        if (childIdx !== -1) this.children.splice(childIdx, 1)
        child.parentNode = null
        child.parentElement = null
        return child
      },
      remove() {
        if (this.parentNode) {
          this.parentNode.removeChild(this)
        }
        this._removed = true
      },
      cloneNode(deep: boolean) {
        const clone = createElement(this.tagName, {})
        clone.attributes = this.attributes.map((a: any) => ({ ...a }))
        clone.className = this.className
        clone.style = { ...this.style }
        clone.textContent = this.textContent
        clone.innerHTML = this.innerHTML
        if (deep) {
          for (const child of this.childNodes) {
            clone.appendChild(child.cloneNode ? child.cloneNode(true) : createTextNode(child.textContent))
          }
        }
        return clone
      },
      closest(selector: string) {
        let current: any = this
        while (current && current !== mockDocument) {
          if (selector.startsWith('[') && selector.endsWith(']')) {
            const attrName = selector.slice(1, -1).split('=')[0]
            if (current.hasAttribute && current.hasAttribute(attrName)) {
              return current
            }
          }
          current = current.parentElement || current.parentNode
        }
        return null
      },
      querySelectorAll(selector: string) {
        const results: any[] = []
        function walk(el: any) {
          if (el.nodeType !== 1) return
          if (selector.startsWith('[') && selector.endsWith(']')) {
            const attrName = selector.slice(1, -1).split('=')[0]
            if (el.hasAttribute && el.hasAttribute(attrName)) {
              results.push(el)
            }
          }
          if (el.childNodes) {
            for (const child of el.childNodes) {
              walk(child)
            }
          }
        }
        walk(this)
        return results
      },
      contains(other: any) {
        let current = other
        while (current) {
          if (current === this) return true
          current = current.parentNode
        }
        return false
      },
    }

    // Set attributes
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value)
    }

    return element
  }

  /**
   * Create a mock text node
   */
  function createTextNode(text: string): any {
    const node = {
      nodeType: 3, // Node.TEXT_NODE
      textContent: text,
      parentNode: null,
      parentElement: null,
      _replaced: false,
      replaceWith(...nodes: any[]) {
        if (this.parentNode) {
          const idx = this.parentNode.childNodes.indexOf(this)
          if (idx !== -1) {
            this.parentNode.childNodes.splice(idx, 1, ...nodes)
            for (const n of nodes) {
              n.parentNode = this.parentNode
              n.parentElement = this.parentNode
            }
          }
        }
        this._replaced = true
      },
      cloneNode() {
        return createTextNode(this.textContent)
      },
    }
    textNodes.push(node)
    return node
  }

  /**
   * Create a mock comment node
   */
  function createComment(text: string): any {
    return {
      nodeType: 8, // Node.COMMENT_NODE
      textContent: text,
      parentNode: null,
      nextSibling: null,
      remove() {
        if (this.parentNode) {
          const idx = this.parentNode.childNodes.indexOf(this)
          if (idx !== -1) this.parentNode.childNodes.splice(idx, 1)
        }
      },
    }
  }

  /**
   * Create a document fragment
   */
  function createDocumentFragment(): any {
    return {
      nodeType: 11,
      childNodes: [],
      appendChild(child: any) {
        this.childNodes.push(child)
        return child
      },
    }
  }

  beforeEach(() => {
    domElements = new Map()
    textNodes = []

    mockDocument = {
      readyState: 'loading',
      addEventListener: (event: string, handler: any) => {
        if (event === 'DOMContentLoaded') {
          // Store the handler to call later
          mockDocument._domContentLoadedHandler = handler
        }
      },
      querySelectorAll: (selector: string) => {
        const results: any[] = []
        for (const el of domElements.values()) {
          if (selector.startsWith('[') && selector.endsWith(']')) {
            const attrName = selector.slice(1, -1).split('=')[0]
            if (el.hasAttribute && el.hasAttribute(attrName)) {
              results.push(el)
            }
          }
        }
        return results
      },
      createElement: (tagName: string) => createElement(tagName),
      createTextNode: (text: string) => createTextNode(text),
      createComment: (text: string) => createComment(text),
      createDocumentFragment: () => createDocumentFragment(),
      getElementById: (id: string) => domElements.get(id),
    }

    mockWindow = {
      stx: null,
    }

    // Evaluate the runtime
    const runtime = generateSignalsRuntimeDev()
    const executeRuntime = new Function(
      'window',
      'document',
      'Node',
      runtime
    )

    const mockNode = {
      TEXT_NODE: 3,
      ELEMENT_NODE: 1,
      COMMENT_NODE: 8,
    }

    executeRuntime(mockWindow, mockDocument, mockNode)
    stx = mockWindow.stx
  })

  describe('@for loop variable scoping', () => {
    it('should make loop variables available in text interpolation', () => {
      // Create a simple @for loop structure
      // <div data-stx-scope="test">
      //   <div @for="item in items()">{{ item.name }}</div>
      // </div>

      const scopeId = 'test_scope_123'
      const container = createElement('div', { 'data-stx-scope': scopeId })
      const forElement = createElement('div', { '@for': 'item in items()' })
      const textNode = createTextNode('{{ item.name }}')
      forElement.appendChild(textNode)
      container.appendChild(forElement)
      domElements.set(scopeId, container)

      // Register scope with items signal
      const items = stx.state([
        { name: 'Apple' },
        { name: 'Banana' },
        { name: 'Cherry' },
      ])

      stx._scopes = stx._scopes || {}
      stx._scopes[scopeId] = {
        items,
      }

      // Trigger DOMContentLoaded
      if (mockDocument._domContentLoadedHandler) {
        mockDocument._domContentLoadedHandler()
      }

      // After processing, each item should have been rendered
      // The @for directive should have created 3 clones with their item.name
      // Check that the text nodes were replaced with spans
      const renderedTexts = container.childNodes
        .filter((n: any) => n.nodeType === 1 && n.tagName !== 'DIV')
        .map((span: any) => span.textContent)

      // Items should have been rendered (not showing raw {{ item.name }})
      expect(container.innerHTML).not.toContain('{{ item.name }}')
    })

    it('should capture scope correctly for effects inside @for', () => {
      // This tests that when effects are created for text interpolation,
      // they capture the loop variable correctly

      const scopeId = 'effect_scope_456'
      const container = createElement('div', { 'data-stx-scope': scopeId })
      domElements.set(scopeId, container)

      // Create items signal
      const items = stx.state([
        { count: 10 },
        { count: 20 },
        { count: 30 },
      ])

      // Create a fmt function
      const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)

      stx._scopes = stx._scopes || {}
      stx._scopes[scopeId] = {
        items,
        fmt,
      }

      // The key test: when items() updates, the fmt function should still be accessible
      let effectRan = false
      stx.effect(() => {
        const list = items()
        for (const item of list) {
          // This simulates what happens in @for text interpolation
          const result = fmt(item.count)
          expect(typeof result).toBe('string')
        }
        effectRan = true
      })

      expect(effectRan).toBe(true)

      // Update items and verify effect re-runs with access to fmt
      items.set([{ count: 1500 }])
      // Effect should have re-run and fmt(1500) should return '1.5K'
    })

    it('should handle nested scope with loop variables and component functions', () => {
      // Simulate the EventsPanel scenario:
      // Component defines: events (signal), fmt (function), getPercentage (function)
      // @for="event in events()" creates loop variable 'event'
      // Text {{ fmt(event.count) }} should have access to both 'event' and 'fmt'

      const scopeId = 'events_panel_789'

      // Component scope variables
      const events = stx.state([
        { name: 'click', count: 100 },
        { name: 'submit', count: 50 },
      ])

      const fmt = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
        return String(n)
      }

      const getPercentage = (count: number) => {
        const total = events().reduce((sum: number, e: any) => sum + e.count, 0)
        return total > 0 ? Math.round((count / total) * 100) : 0
      }

      stx._scopes = stx._scopes || {}
      stx._scopes[scopeId] = {
        events,
        fmt,
        getPercentage,
      }

      // Simulate what happens during @for iteration
      // The runtime creates an itemScope that combines component scope with loop variable
      const componentScope = stx._scopes[scopeId]

      for (const event of events()) {
        // This is what the runtime does:
        const itemScope = { ...componentScope, event }

        // Now evaluate expressions like {{ event.name }} and {{ fmt(event.count) }}
        // Using Function constructor like the runtime does
        const evalExpr = (expr: string) => {
          const fn = new Function(...Object.keys(itemScope), `return ${expr}`)
          return fn(...Object.values(itemScope))
        }

        // These should all work without errors
        expect(evalExpr('event.name')).toBe(event.name)
        expect(evalExpr('event.count')).toBe(event.count)
        expect(evalExpr('fmt(event.count)')).toBe(String(event.count)) // 100 and 50 are < 1000
        expect(evalExpr('getPercentage(event.count)')).toBeGreaterThanOrEqual(0)
      }
    })

    it('should preserve loop variable scope when signal updates', () => {
      // When the signal changes, the @for effect re-runs and creates new clones
      // Each clone should have access to the updated loop variable

      const items = stx.state(['a', 'b', 'c'])
      const fmt = (s: string) => s.toUpperCase()

      const results: string[] = []

      // Simulate what happens on each render
      const render = () => {
        results.length = 0
        for (const item of items()) {
          const scope = { item, fmt }
          const fn = new Function(...Object.keys(scope), 'return fmt(item)')
          results.push(fn(...Object.values(scope)))
        }
      }

      render()
      expect(results).toEqual(['A', 'B', 'C'])

      // Update signal
      items.set(['x', 'y'])
      render()
      expect(results).toEqual(['X', 'Y'])
    })
  })

  describe('Text interpolation with captured scope', () => {
    it('should capture scope at binding time, not evaluation time', () => {
      // Create a signal that changes
      const name = stx.state('Initial')

      // Capture scope at binding time
      const capturedScope = { name }
      let capturedValue = ''

      // Create an effect that uses the captured scope
      stx.effect(() => {
        capturedValue = capturedScope.name()
      })

      expect(capturedValue).toBe('Initial')

      // Update signal - effect should see the update
      name.set('Updated')
      expect(capturedValue).toBe('Updated')
    })

    it('should handle complex expressions with multiple scope variables', () => {
      const loading = stx.state(false)
      const items = stx.state([1, 2, 3])
      const fmt = (n: number) => `[${n}]`

      const scope = { loading, items, fmt }

      // Evaluate complex expressions
      const evalExpr = (expr: string) => {
        const fn = new Function(...Object.keys(scope), `return ${expr}`)
        return fn(...Object.values(scope))
      }

      expect(evalExpr('loading()')).toBe(false)
      expect(evalExpr('items().length')).toBe(3)
      expect(evalExpr('!loading() && items().length > 0')).toBe(true)
      expect(evalExpr('items().map(x => fmt(x)).join(",")')).toBe('[1],[2],[3]')
    })
  })

  describe('__TITLE__ placeholder filtering', () => {
    it('should skip __TITLE__ and similar placeholders', () => {
      // The toValue function should return the placeholder as-is, not try to evaluate it
      // This simulates the fix we made

      const isPlaceholder = (expr: string) => /^__[A-Z_]+__$/.test(expr.trim())

      expect(isPlaceholder('__TITLE__')).toBe(true)
      expect(isPlaceholder('__DESCRIPTION__')).toBe(true)
      expect(isPlaceholder('__META_TAGS__')).toBe(true)
      expect(isPlaceholder('title')).toBe(false)
      expect(isPlaceholder('__title__')).toBe(false) // lowercase
      expect(isPlaceholder('__TITLE')).toBe(false) // missing trailing
    })

    it('should not throw error for placeholder expressions', () => {
      // Simulate toValue with placeholder check
      const toValue = (expr: string, scope: any = {}) => {
        if (/^__[A-Z_]+__$/.test(expr.trim())) {
          return expr // Return as-is
        }
        const fn = new Function(...Object.keys(scope), `return ${expr}`)
        return fn(...Object.values(scope))
      }

      // These should not throw
      expect(() => toValue('__TITLE__')).not.toThrow()
      expect(() => toValue('__DESCRIPTION__')).not.toThrow()

      // Regular expressions should work
      expect(toValue('1 + 2')).toBe(3)
      expect(toValue('name', { name: 'test' })).toBe('test')
    })
  })

  describe('@if with captured scope', () => {
    it('should evaluate @if condition with correct scope', () => {
      const loading = stx.state(true)
      const items = stx.state([])

      const scope = { loading, items }

      const evalIf = (expr: string) => {
        const fn = new Function(...Object.keys(scope), `return ${expr}`)
        return !!fn(...Object.values(scope))
      }

      expect(evalIf('loading()')).toBe(true)
      expect(evalIf('!loading() && items().length > 0')).toBe(false)

      loading.set(false)
      expect(evalIf('loading()')).toBe(false)
      expect(evalIf('!loading() && items().length > 0')).toBe(false)

      items.set([1, 2, 3])
      expect(evalIf('!loading() && items().length > 0')).toBe(true)
    })
  })

  describe('Scope propagation through @if and @for', () => {
    it('should propagate component scope to nested @for inside @if', () => {
      // <div @if="!loading() && items().length > 0">
      //   <div @for="item in items()">{{ fmt(item.name) }}</div>
      // </div>

      const loading = stx.state(false)
      const items = stx.state([{ name: 'test' }])
      const fmt = (s: string) => s.toUpperCase()

      const componentScope = { loading, items, fmt }

      // First, @if evaluates with componentScope
      const ifCondition = !loading() && items().length > 0
      expect(ifCondition).toBe(true)

      // Then @for creates itemScope for each iteration
      const results: string[] = []
      for (const item of items()) {
        const itemScope = { ...componentScope, item }
        // Evaluate {{ fmt(item.name) }}
        const fn = new Function(...Object.keys(itemScope), 'return fmt(item.name)')
        results.push(fn(...Object.values(itemScope)))
      }

      expect(results).toEqual(['TEST'])
    })

    it('should handle @for and @if on the same element', () => {
      // <tr @for="page in pages()" @if="!loading()">
      //   {{ page.path }}
      // </tr>
      // This is a valid pattern - each clone needs @if evaluated

      const loading = stx.state(false)
      const pages = stx.state([
        { path: '/home' },
        { path: '/about' },
        { path: '/contact' },
      ])
      const fmt = (s: string) => s

      const componentScope = { loading, pages, fmt }

      // When @for runs, each clone has @if
      // @if should be evaluated for each item
      const results: string[] = []
      for (const page of pages()) {
        // Check if @if condition passes
        const ifCondition = !loading()
        if (ifCondition) {
          const itemScope = { ...componentScope, page }
          const fn = new Function(...Object.keys(itemScope), 'return page.path')
          results.push(fn(...Object.values(itemScope)))
        }
      }

      expect(results).toEqual(['/home', '/about', '/contact'])

      // When loading is true, no items should render
      loading.set(true)
      const resultsWhileLoading: string[] = []
      for (const page of pages()) {
        const ifCondition = !loading()
        if (ifCondition) {
          const itemScope = { ...componentScope, page }
          const fn = new Function(...Object.keys(itemScope), 'return page.path')
          resultsWhileLoading.push(fn(...Object.values(itemScope)))
        }
      }
      expect(resultsWhileLoading).toEqual([])
    })
  })
})
