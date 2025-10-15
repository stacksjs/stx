# Advanced Testing

This guide covers advanced testing strategies, patterns, and tools for building robust stx applications with comprehensive test coverage.

## Testing Architecture

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   ├── workflows/
│   └── features/
├── e2e/
│   ├── specs/
│   ├── fixtures/
│   └── support/
├── performance/
├── accessibility/
└── visual/
```

### Test Configuration

```typescript
// test.config.ts
export default {
  testDir: './tests',
  timeout: 30000,
  retries: 2,

  projects: [
    {
      name: 'unit',
      testMatch: 'tests/unit/**/*.test.ts',
      use: {
        environment: 'very-happy-dom',
        setupFiles: ['./tests/setup/unit.ts']
      }
    },
    {
      name: 'integration',
      testMatch: 'tests/integration/**/*.test.ts',
      use: {
        environment: 'node',
        setupFiles: ['./tests/setup/integration.ts']
      }
    },
    {
      name: 'e2e',
      testMatch: 'tests/e2e/**/*.test.ts',
      use: {
        browser: 'chromium',
        setupFiles: ['./tests/setup/e2e.ts']
      }
    }
  ]
}
```

## Component Testing Patterns

### Testing Hooks

```typescript
// tests/utils/component-testing.ts
import { mount } from '@stacksjs/testing'

export function createComponentTester<T>(component: T) {
  return {
    mount: (props = {}, options = {}) => {
      return mount(component, {
        props,
        global: {
          stubs: ['router-link', 'router-view'],
          mocks: {
            $auth: { user: null, isAuthenticated: false },
            $router: { push: vi.fn() }
          }
        },
        ...options
      })
    },

    mountWithAuth: (user: User, props = {}) => {
      return mount(component, {
        props,
        global: {
          mocks: {
            $auth: { user, isAuthenticated: true }
          }
        }
      })
    },

    mountWithStore: (storeState: any, props = {}) => {
      const store = createTestStore(storeState)
      return mount(component, {
        props,
        global: {
          plugins: [store]
        }
      })
    }
  }
}
```

### Async Component Testing

```typescript
import { test, expect } from 'bun:test'
import { mount, flushPromises } from '@stacksjs/testing'
import AsyncDataLoader from './AsyncDataLoader.stx'

test('handles async data loading', async () => {
  const mockApi = {
    fetchData: vi.fn().mockResolvedValue({ data: 'test data' })
  }

  const wrapper = mount(AsyncDataLoader, {
    global: {
      provide: { api: mockApi }
    }
  })

  // Initially shows loading state
  expect(wrapper.find('.loading').exists()).toBe(true)

  // Wait for async operations to complete
  await flushPromises()

  // Shows loaded data
  expect(wrapper.find('.loading').exists()).toBe(false)
  expect(wrapper.text()).toContain('test data')
})
```

### Error Boundary Testing

```typescript
test('error boundary catches component errors', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  const FailingComponent = {
    mounted() {
      throw new Error('Component error')
    },
    template: '<div>Should not render</div>'
  }

  const wrapper = mount(ErrorBoundary, {
    slots: {
      default: FailingComponent
    }
  })

  await wrapper.vm.$nextTick()

  expect(wrapper.find('.error-message').exists()).toBe(true)
  expect(wrapper.find('.error-message').text()).toContain('Something went wrong')

  consoleError.mockRestore()
})
```

## State Testing

### Store Testing

```typescript
// tests/store/user.test.ts
import { test, expect, beforeEach } from 'bun:test'
import { createTestStore } from '@stacksjs/testing'
import { userModule } from '@/store/modules/user'

describe('User Store', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore({
      modules: { user: userModule }
    })
  })

  test('login action updates state correctly', async () => {
    const credentials = { email: 'test@example.com', password: 'password' }

    await store.dispatch('user/login', credentials)

    expect(store.state.user.isAuthenticated).toBe(true)
    expect(store.state.user.user.email).toBe('test@example.com')
  })

  test('logout action clears user state', async () => {
    // Setup authenticated state
    store.commit('user/setUser', { email: 'test@example.com' })
    store.commit('user/setAuthenticated', true)

    await store.dispatch('user/logout')

    expect(store.state.user.isAuthenticated).toBe(false)
    expect(store.state.user.user).toBeNull()
  })
})
```

### Reactive State Testing

```typescript
test('reactive state updates trigger re-renders', async () => {
  const { state, increment } = useCounter()

  const wrapper = mount({
    setup() {
      return { state, increment }
    },
    template: '<div>{{ state.count }}</div>'
  })

  expect(wrapper.text()).toBe('0')

  increment()
  await wrapper.vm.$nextTick()

  expect(wrapper.text()).toBe('1')
})
```

## API Testing

### Mock API Responses

```typescript
// tests/utils/api-mocks.ts
export function createApiMock() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),

    // Helper methods for common scenarios
    mockSuccess: (data: any) => {
      return Promise.resolve({ data, status: 200 })
    },

    mockError: (message: string, status = 500) => {
      return Promise.reject({ message, status })
    },

    mockPaginated: (items: any[], page = 1, perPage = 10) => {
      const start = (page - 1) * perPage
      const end = start + perPage

      return Promise.resolve({
        data: items.slice(start, end),
        pagination: {
          current: page,
          total: Math.ceil(items.length / perPage),
          perPage
        }
      })
    }
  }
}
```

### HTTP Client Testing

```typescript
import { test, expect } from 'bun:test'
import { createApiMock } from './utils/api-mocks'
import { UserService } from '@/services/UserService'

test('UserService handles API errors gracefully', async () => {
  const apiMock = createApiMock()
  apiMock.get.mockRejectedValue({ message: 'Network error', status: 500 })

  const userService = new UserService(apiMock)

  await expect(userService.getUsers()).rejects.toThrow('Network error')
  expect(apiMock.get).toHaveBeenCalledWith('/api/users')
})
```

## Performance Testing

### Component Performance

```typescript
// tests/performance/component-performance.test.ts
import { test, expect } from 'bun:test'
import { benchmark, mount } from '@stacksjs/testing'
import LargeList from '@/components/LargeList.stx'

test('large list renders within performance budget', async () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random()
  }))

  const result = await benchmark('large list rendering', () => {
    return mount(LargeList, {
      props: { items }
    })
  }, {
    iterations: 10,
    warmup: 2
  })

  // Should render 1000 items in under 100ms
  expect(result.average).toBeLessThan(100)
})
```

### Memory Leak Testing

```typescript
test('component cleanup prevents memory leaks', async () => {
  const getMemoryUsage = () => (performance as any).memory?.usedJSHeapSize || 0

  const initialMemory = getMemoryUsage()

  // Create and destroy many components
  for (let i = 0; i < 100; i++) {
    const wrapper = mount(TestComponent)
    wrapper.unmount()
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }

  const finalMemory = getMemoryUsage()
  const memoryGrowth = finalMemory - initialMemory

  // Memory growth should be minimal (less than 1MB)
  expect(memoryGrowth).toBeLessThan(1024 * 1024)
})
```

## Accessibility Testing

### Automated A11y Testing

```typescript
// tests/a11y/accessibility.test.ts
import { test, expect } from 'bun:test'
import { mount } from '@stacksjs/testing'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('Button component has no accessibility violations', async () => {
  const wrapper = mount(Button, {
    slots: { default: 'Click me' },
    props: { variant: 'primary' }
  })

  const results = await axe(wrapper.element)
  expect(results).toHaveNoViolations()
})

test('Form has proper ARIA labels', async () => {
  const wrapper = mount(LoginForm)

  const emailInput = wrapper.find('input[type="email"]')
  const passwordInput = wrapper.find('input[type="password"]')

  expect(emailInput.attributes('aria-label')).toBe('Email address')
  expect(passwordInput.attributes('aria-label')).toBe('Password')
  expect(emailInput.attributes('aria-required')).toBe('true')
})
```

### Keyboard Navigation Testing

```typescript
test('modal can be navigated with keyboard', async () => {
  const wrapper = mount(Modal, {
    props: { isOpen: true }
  })

  const modal = wrapper.find('[role="dialog"]')
  const closeButton = wrapper.find('[aria-label="Close"]')

  // Modal should be focusable
  expect(modal.attributes('tabindex')).toBe('-1')

  // Escape key should close modal
  await modal.trigger('keydown', { key: 'Escape' })
  expect(wrapper.emitted('close')).toBeTruthy()

  // Tab navigation should work
  closeButton.element.focus()
  await closeButton.trigger('keydown', { key: 'Tab' })

  // Focus should be trapped within modal
  expect(document.activeElement).not.toBe(document.body)
})
```

## Visual Regression Testing

### Screenshot Testing

```typescript
// tests/visual/visual-regression.test.ts
import { test, expect } from '@playwright/test'

test('button variants match visual designs', async ({ page }) => {
  await page.goto('/component-library/button')

  // Test different button variants
  const variants = ['primary', 'secondary', 'danger']

  for (const variant of variants) {
    const button = page.locator(`[data-variant="${variant}"]`)
    await expect(button).toHaveScreenshot(`button-${variant}.png`)
  }
})

test('responsive layout renders correctly', async ({ page }) => {
  await page.goto('/dashboard')

  // Test desktop layout
  await page.setViewportSize({ width: 1920, height: 1080 })
  await expect(page).toHaveScreenshot('dashboard-desktop.png')

  // Test tablet layout
  await page.setViewportSize({ width: 768, height: 1024 })
  await expect(page).toHaveScreenshot('dashboard-tablet.png')

  // Test mobile layout
  await page.setViewportSize({ width: 375, height: 667 })
  await expect(page).toHaveScreenshot('dashboard-mobile.png')
})
```

## Test Data Management

### Factories and Fixtures

```typescript
// tests/factories/user.ts
import { faker } from '@faker-js/faker'

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.number.int(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  }
}

export function createUsers(count: number): User[] {
  return Array.from({ length: count }, () => createUser())
}

// Usage
test('user list displays multiple users', () => {
  const users = createUsers(5)
  const wrapper = mount(UserList, { props: { users } })

  expect(wrapper.findAll('.user-item')).toHaveLength(5)
})
```

### Database Seeding

```typescript
// tests/setup/database.ts
export async function seedTestDatabase() {
  const db = getTestDatabase()

  // Clear existing data
  await db.table('users').del()
  await db.table('posts').del()

  // Insert test data
  const users = await db.table('users').insert([
    createUser({ email: 'admin@example.com', role: 'admin' }),
    createUser({ email: 'user@example.com', role: 'user' })
  ])

  const posts = await db.table('posts').insert([
    { title: 'Test Post 1', userId: users[0].id },
    { title: 'Test Post 2', userId: users[1].id }
  ])

  return { users, posts }
}
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        test-type: [unit, integration, e2e]

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test:${{ matrix.test-type }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.test-type == 'unit'
        with:
          file: ./coverage/lcov.info
```

### Test Reporting

```typescript
// tests/setup/reporting.ts
import { afterAll } from 'bun:test'

afterAll(() => {
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    tests: global.__TEST_RESULTS__,
    coverage: global.__COVERAGE__
  }

  // Save report
  require('fs').writeFileSync(
    './test-reports/results.json',
    JSON.stringify(report, null, 2)
  )
})
```

## Related Resources

- [Testing Guide](/guide/testing) - Basic testing concepts and setup
- [Component Testing](/features/testing) - Component-specific testing features
- [Performance Guide](/guide/performance) - Performance testing strategies
- [Security Testing](/features/security) - Security testing practices
