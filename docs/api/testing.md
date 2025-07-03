# Testing API Reference

This document covers STX's testing utilities and APIs for unit testing, component testing, and integration testing.

## Test Setup

### Basic Configuration

```ts
// test/setup.ts
import { expect, test, describe, beforeEach, afterEach } from 'bun:test'
import { createTestApp } from '@stacksjs/stx/testing'

// Create test app instance
const app = createTestApp({
  // Test configuration
  plugins: [],
  components: {},
  mocks: {}
})

// Global test setup
beforeEach(() => {
  // Reset app state
  app.reset()
})

afterEach(() => {
  // Cleanup
  app.unmount()
})

export { app, expect, test, describe }
```

### Test Environment

```ts
// test/environment.ts
import { TestEnvironment } from '@stacksjs/stx/testing'

const env = new TestEnvironment({
  // Mock browser APIs
  window: true,
  document: true,
  localStorage: true,
  
  // Mock STX features
  router: true,
  store: true,
  
  // Custom mocks
  mocks: {
    // Add custom mock implementations
  }
})

export { env }
```

## Unit Testing

### Testing Functions

```ts
import { expect, test } from 'bun:test'
import { formatDate } from '../src/utils'

test('formatDate formats date correctly', () => {
  const date = new Date('2024-01-01')
  expect(formatDate(date)).toBe('Jan 1, 2024')
})

test('formatDate handles invalid input', () => {
  expect(() => formatDate(null)).toThrow('Invalid date')
})

test('formatDate with custom format', () => {
  const date = new Date('2024-01-01')
  expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-01')
})
```

### Testing Async Code

```ts
import { expect, test } from 'bun:test'
import { fetchUserData } from '../src/api'

test('fetchUserData returns user data', async () => {
  const data = await fetchUserData(1)
  expect(data).toEqual({
    id: 1,
    name: 'John'
  })
})

test('fetchUserData handles errors', async () => {
  try {
    await fetchUserData(-1)
  } catch (error) {
    expect(error.message).toBe('Invalid user ID')
  }
})
```

## Component Testing

### Component Mounting

```ts
import { mount } from '@stacksjs/stx/testing'
import MyComponent from '../src/components/MyComponent'

test('component renders correctly', () => {
  const wrapper = mount(MyComponent, {
    props: {
      title: 'Test'
    }
  })
  
  expect(wrapper.text()).toContain('Test')
  expect(wrapper.find('.title')).toBeTruthy()
})

test('component with slots', () => {
  const wrapper = mount(MyComponent, {
    slots: {
      default: 'Default content',
      header: '<h1>Header</h1>'
    }
  })
  
  expect(wrapper.find('h1').text()).toBe('Header')
})
```

### Event Testing

```ts
test('component emits events', async () => {
  const wrapper = mount(MyComponent)
  
  // Trigger event
  await wrapper.find('button').trigger('click')
  
  // Check emitted events
  expect(wrapper.emitted().click).toBeTruthy()
  expect(wrapper.emitted().click[0]).toEqual(['clicked'])
})

test('component handles user input', async () => {
  const wrapper = mount(MyComponent)
  
  // Set input value
  await wrapper.find('input').setValue('test')
  
  // Check model update
  expect(wrapper.vm.inputValue).toBe('test')
})
```

### Component State

```ts
test('component reactivity', async () => {
  const wrapper = mount(MyComponent, {
    props: {
      count: 0
    }
  })
  
  // Update props
  await wrapper.setProps({ count: 1 })
  
  // Check updates
  expect(wrapper.text()).toContain('1')
  expect(wrapper.vm.doubleCount).toBe(2)
})

test('component lifecycle', async () => {
  const wrapper = mount(MyComponent)
  
  // Check mounted state
  expect(wrapper.vm.isReady).toBe(true)
  
  // Trigger update
  await wrapper.vm.$nextTick()
  
  // Unmount
  wrapper.unmount()
  expect(wrapper.vm.isDestroyed).toBe(true)
})
```

## Integration Testing

### Router Testing

```ts
import { createRouter, createTestRouter } from '@stacksjs/stx/testing'

test('router navigation', async () => {
  const router = createTestRouter([
    {
      path: '/',
      component: Home
    },
    {
      path: '/about',
      component: About
    }
  ])
  
  // Navigate
  await router.push('/about')
  expect(router.currentRoute.value.path).toBe('/about')
  
  // Check guards
  const guardResult = await router.beforeEach((to, from) => {
    if (to.path === '/admin') return false
    return true
  })
  
  expect(guardResult).toBe(true)
})
```

### Store Testing

```ts
import { createStore, createTestStore } from '@stacksjs/stx/testing'

test('store mutations', () => {
  const store = createTestStore({
    state: {
      count: 0
    },
    mutations: {
      increment(state) {
        state.count++
      }
    }
  })
  
  store.commit('increment')
  expect(store.state.count).toBe(1)
})

test('store actions', async () => {
  const store = createTestStore({
    actions: {
      async fetchData({ commit }) {
        const data = await api.getData()
        commit('setData', data)
      }
    }
  })
  
  await store.dispatch('fetchData')
  expect(store.state.data).toBeTruthy()
})
```

## Mocking

### Function Mocks

```ts
import { vi } from '@stacksjs/stx/testing'

test('mocking functions', () => {
  // Create mock
  const mockFn = vi.fn()
  mockFn.mockReturnValue('mocked')
  
  // Use mock
  expect(mockFn()).toBe('mocked')
  expect(mockFn).toHaveBeenCalled()
  
  // Mock implementation
  mockFn.mockImplementation((arg) => {
    return `processed ${arg}`
  })
  
  expect(mockFn('input')).toBe('processed input')
})
```

### API Mocks

```ts
import { vi } from '@stacksjs/stx/testing'

test('mocking API calls', async () => {
  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'mocked' })
  })
  
  const response = await api.getData()
  expect(response.data).toBe('mocked')
  
  // Mock error
  global.fetch = vi.fn().mockRejectedValue(new Error('API error'))
  
  try {
    await api.getData()
  } catch (error) {
    expect(error.message).toBe('API error')
  }
})
```

### Component Mocks

```ts
import { mount, createComponentMock } from '@stacksjs/stx/testing'

test('mocking child components', () => {
  // Create mock component
  const ChildComponent = createComponentMock({
    name: 'ChildComponent',
    props: ['value'],
    template: '<div>{{ value }}</div>'
  })
  
  // Mount with mock
  const wrapper = mount(ParentComponent, {
    global: {
      components: {
        ChildComponent
      }
    }
  })
  
  expect(wrapper.findComponent(ChildComponent).props('value'))
    .toBe('test')
})
```

## Test Utilities

### DOM Assertions

```ts
import { expect } from '@stacksjs/stx/testing'

test('DOM assertions', () => {
  const wrapper = mount(MyComponent)
  
  // Element existence
  expect(wrapper.find('.title')).toExist()
  expect(wrapper.find('.missing')).not.toExist()
  
  // Content checks
  expect(wrapper.text()).toContain('Hello')
  expect(wrapper.html()).toContain('<div>')
  
  // Attributes
  expect(wrapper.attributes('class')).toBe('component')
  expect(wrapper.classes()).toContain('active')
  
  // State
  expect(wrapper).toBeVisible()
  expect(wrapper).not.toBeDisabled()
})
```

### Snapshot Testing

```ts
import { expect } from '@stacksjs/stx/testing'

test('component snapshot', () => {
  const wrapper = mount(MyComponent, {
    props: {
      title: 'Test'
    }
  })
  
  // Match snapshot
  expect(wrapper.html()).toMatchSnapshot()
  
  // Inline snapshot
  expect(wrapper.html()).toMatchInlineSnapshot(`
    <div class="component">
      <h1>Test</h1>
    </div>
  `)
})
```

### Test Coverage

```ts
// package.json
{
  "scripts": {
    "test": "bun test",
    "test:coverage": "bun test --coverage"
  }
}

// Test with coverage
// bun run test:coverage

// Coverage output
// ------------------|---------|----------|---------|---------|
// File             | % Stmts | % Branch | % Funcs | % Lines |
// ------------------|---------|----------|---------|---------|
// All files        |   85.71 |    76.92 |   88.89 |   85.71 |
// ------------------|---------|----------|---------|---------|
```

## Next Steps

- Explore [Core API](/api/core)
- Check out [Component API](/api/components)
- Learn about [Helper Functions](/api/helpers)
- Review [Plugin Development](/api/plugins) 