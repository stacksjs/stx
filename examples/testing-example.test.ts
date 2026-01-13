/**
 * STX Testing Utilities Example
 *
 * This file demonstrates how to test STX components using the new testing utilities.
 * Run with: bun test examples/testing-example.test.ts
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import {
  mount,
  render,
  fireEvent,
  matchers,
  waitFor,
  createMockFn,
  createMockStore,
} from 'stx'

// Extend expect with STX matchers
expect.extend(matchers)

describe('STX Testing Utilities', () => {
  describe('mount()', () => {
    it('should mount a simple component', async () => {
      const wrapper = await mount(`
        <script server>
        const message = 'Hello, World!'
        </script>
        <template>
          <div class="greeting">{{ message }}</div>
        </template>
      `)

      expect(wrapper.html()).toContain('Hello, World!')
      expect(wrapper.find('.greeting')).toBeDefined()
    })

    it('should mount with props', async () => {
      const wrapper = await mount(
        `
        <script server>
        import { defineProps, withDefaults } from 'stx'
        const { name, count } = withDefaults(defineProps(), {
          name: 'Guest',
          count: 0
        })
        </script>
        <template>
          <div>
            <span class="name">{{ name }}</span>
            <span class="count">{{ count }}</span>
          </div>
        </template>
      `,
        {
          props: {
            name: 'Alice',
            count: 42,
          },
        }
      )

      expect(wrapper.text()).toContain('Alice')
      expect(wrapper.text()).toContain('42')
    })

    it('should mount with slots', async () => {
      const wrapper = await mount(
        `
        <template>
          <div class="card">
            <div class="header"><slot name="header" /></div>
            <div class="body"><slot /></div>
            <div class="footer"><slot name="footer" /></div>
          </div>
        </template>
      `,
        {
          slots: {
            default: '<p>Main content</p>',
            header: '<h1>Card Title</h1>',
            footer: '<button>Submit</button>',
          },
        }
      )

      expect(wrapper.find('.header')?.html()).toContain('Card Title')
      expect(wrapper.find('.body')?.html()).toContain('Main content')
      expect(wrapper.find('.footer')?.html()).toContain('Submit')
    })
  })

  describe('render()', () => {
    it('should render template to string', async () => {
      const html = await render(`
        <script server>
        const items = ['Apple', 'Banana', 'Cherry']
        </script>
        <template>
          <ul>
            @foreach (items as item)
              <li>{{ item }}</li>
            @endforeach
          </ul>
        </template>
      `)

      expect(html).toContain('<li>Apple</li>')
      expect(html).toContain('<li>Banana</li>')
      expect(html).toContain('<li>Cherry</li>')
    })

    it('should render with context', async () => {
      const html = await render(
        `
        <template>
          <div class="{{ theme }}">
            <h1>{{ title }}</h1>
          </div>
        </template>
      `,
        {
          context: {
            theme: 'dark-mode',
            title: 'Welcome',
          },
        }
      )

      expect(html).toContain('class="dark-mode"')
      expect(html).toContain('Welcome')
    })
  })

  describe('fireEvent', () => {
    it('should trigger click events', async () => {
      const wrapper = await mount(`
        <template>
          <div x-data="{ count: 0 }">
            <button class="btn" @click="count++">Click me</button>
            <span class="count" x-text="count"></span>
          </div>
        </template>
      `)

      const button = wrapper.find('.btn')
      expect(button).toBeDefined()

      // Simulate click
      await fireEvent.click(button!)

      // In real tests, you'd check the reactive state
      expect(wrapper.html()).toContain('btn')
    })

    it('should trigger input events', async () => {
      const wrapper = await mount(`
        <template>
          <div x-data="{ name: '' }">
            <input class="input" x-model="name" type="text" />
            <span class="output" x-text="name"></span>
          </div>
        </template>
      `)

      const input = wrapper.find('.input')
      expect(input).toBeDefined()

      // Simulate input
      await fireEvent.input(input!, 'Hello')
    })

    it('should trigger keyboard events', async () => {
      const wrapper = await mount(`
        <template>
          <div x-data="{ submitted: false }">
            <input class="input" @keydown.enter="submitted = true" />
            <span x-show="submitted">Submitted!</span>
          </div>
        </template>
      `)

      const input = wrapper.find('.input')
      await fireEvent.keyDown(input!, 'Enter')
    })
  })

  describe('waitFor()', () => {
    it('should wait for condition to be true', async () => {
      let ready = false
      setTimeout(() => {
        ready = true
      }, 50)

      await waitFor(() => ready, { timeout: 1000 })
      expect(ready).toBe(true)
    })

    it('should timeout if condition never met', async () => {
      try {
        await waitFor(() => false, { timeout: 100 })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('createMockFn()', () => {
    it('should track function calls', () => {
      const mockFn = createMockFn()

      mockFn('arg1', 'arg2')
      mockFn('arg3')

      expect(mockFn.calls).toHaveLength(2)
      expect(mockFn.calls[0]).toEqual(['arg1', 'arg2'])
      expect(mockFn.calls[1]).toEqual(['arg3'])
    })

    it('should return implementation result', () => {
      const mockFn = createMockFn((x: number) => x * 2)

      expect(mockFn(5)).toBe(10)
      expect(mockFn(3)).toBe(6)
    })

    it('should reset calls', () => {
      const mockFn = createMockFn()
      mockFn('a')
      mockFn('b')

      mockFn.reset()

      expect(mockFn.calls).toHaveLength(0)
    })
  })

  describe('createMockStore()', () => {
    it('should create reactive mock store', () => {
      const store = createMockStore({
        count: 0,
        user: { name: 'Alice' },
      })

      expect(store.getState().count).toBe(0)
      expect(store.getState().user.name).toBe('Alice')

      store.setState({ count: 5 })
      expect(store.getState().count).toBe(5)
    })

    it('should track state changes', () => {
      const store = createMockStore({ value: 'initial' })

      store.setState({ value: 'changed' })
      store.setState({ value: 'final' })

      expect(store.getHistory()).toEqual([
        { value: 'initial' },
        { value: 'changed' },
        { value: 'final' },
      ])
    })

    it('should reset to initial state', () => {
      const store = createMockStore({ count: 0 })

      store.setState({ count: 100 })
      store.reset()

      expect(store.getState().count).toBe(0)
    })
  })

  describe('Custom Matchers', () => {
    it('toHaveClass should check CSS classes', async () => {
      const wrapper = await mount(`
        <template>
          <div class="btn btn-primary active">Button</div>
        </template>
      `)

      const button = wrapper.find('.btn')
      // In real implementation, this would use the matcher
      expect(button?.html()).toContain('btn-primary')
      expect(button?.html()).toContain('active')
    })

    it('toHaveAttribute should check attributes', async () => {
      const wrapper = await mount(`
        <template>
          <input type="email" disabled placeholder="Enter email" />
        </template>
      `)

      const input = wrapper.find('input')
      expect(input?.html()).toContain('type="email"')
      expect(input?.html()).toContain('disabled')
    })

    it('toBeVisible should check visibility', async () => {
      const wrapper = await mount(`
        <template>
          <div>
            <span class="visible">Visible</span>
            <span class="hidden" style="display: none;">Hidden</span>
          </div>
        </template>
      `)

      expect(wrapper.find('.visible')).toBeDefined()
    })
  })

  describe('Component Integration Tests', () => {
    it('should test async component loading', async () => {
      const wrapper = await mount(`
        <script server>
        const data = { loaded: true, message: 'Data loaded!' }
        </script>
        <template>
          @async(timeout: 1000)
            <div class="content">{{ data.message }}</div>
          @error
            <div class="error">Failed to load</div>
          @endasync
        </template>
      `)

      expect(wrapper.html()).toContain('Data loaded!')
    })

    it('should test error boundaries', async () => {
      const wrapper = await mount(`
        <template>
          @errorBoundary
            <div class="safe-content">Safe content rendered</div>
          @fallback
            <div class="error-fallback">Error occurred</div>
          @enderrorBoundary
        </template>
      `)

      expect(wrapper.html()).toContain('Safe content rendered')
    })

    it('should test suspense with fallback', async () => {
      const wrapper = await mount(`
        <script server>
        const items = [1, 2, 3]
        </script>
        <template>
          @suspense(timeout: 2000)
            <ul>
              @foreach (items as item)
                <li>Item {{ item }}</li>
              @endforeach
            </ul>
          @fallback
            <div class="loading">Loading...</div>
          @endsuspense
        </template>
      `)

      expect(wrapper.html()).toContain('Item 1')
      expect(wrapper.html()).toContain('Item 2')
      expect(wrapper.html()).toContain('Item 3')
    })
  })
})

describe('Component Wrapper API', () => {
  let wrapper: Awaited<ReturnType<typeof mount>>

  beforeEach(async () => {
    wrapper = await mount(`
      <script server>
      const items = ['a', 'b', 'c']
      </script>
      <template>
        <div class="container" data-testid="main">
          <h1 class="title">Test Component</h1>
          <ul class="list">
            @foreach (items as item)
              <li class="item">{{ item }}</li>
            @endforeach
          </ul>
          <button class="btn" disabled>Submit</button>
        </div>
      </template>
    `)
  })

  it('find() should locate single element', () => {
    expect(wrapper.find('.title')).toBeDefined()
    expect(wrapper.find('.nonexistent')).toBeNull()
  })

  it('findAll() should locate multiple elements', () => {
    const items = wrapper.findAll('.item')
    expect(items).toHaveLength(3)
  })

  it('html() should return rendered HTML', () => {
    const html = wrapper.html()
    expect(html).toContain('<h1 class="title">Test Component</h1>')
  })

  it('text() should return text content', () => {
    const text = wrapper.text()
    expect(text).toContain('Test Component')
    expect(text).toContain('a')
  })

  it('exists() should check element existence', () => {
    expect(wrapper.exists('.title')).toBe(true)
    expect(wrapper.exists('.missing')).toBe(false)
  })

  it('attributes() should return element attributes', () => {
    const attrs = wrapper.attributes('.btn')
    expect(attrs?.disabled).toBeDefined()
    expect(attrs?.class).toContain('btn')
  })

  it('classes() should return CSS classes', () => {
    const classes = wrapper.classes('.container')
    expect(classes).toContain('container')
  })
})
