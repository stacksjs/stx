# Testing

STX provides comprehensive testing utilities to ensure your application's reliability. This guide covers unit testing, component testing, and integration testing approaches.

## Setup

### Test Configuration

Create a `bun.test.ts` file in your project root:

```ts
import { expect, test, describe } from 'bun:test'
import { mount } from '@stacksjs/stx/test-utils'

// Configure test environment
export default {
  testMatch: ['**/*.test.ts'],
  testTimeout: 5000,
  setupFiles: ['./test/setup.ts']
}
```

### Test Utils

STX provides test utilities for component testing:

```ts
import { mount, shallowMount } from '@stacksjs/stx/test-utils'
```

## Unit Testing

### Testing Functions and Utilities

```ts
// utils/format.ts
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// utils/format.test.ts
import { expect, test } from 'bun:test'
import { formatPrice } from './format'

test('formatPrice formats numbers as USD currency', () => {
  expect(formatPrice(10)).toBe('$10.00')
  expect(formatPrice(10.5)).toBe('$10.50')
  expect(formatPrice(1000)).toBe('$1,000.00')
})
```

### Testing TypeScript Code

```ts
// types/user.ts
interface User {
  id: number
  name: string
  role: 'admin' | 'user'
}

function isAdmin(user: User): boolean {
  return user.role === 'admin'
}

// types/user.test.ts
import { expect, test } from 'bun:test'

test('isAdmin correctly identifies admin users', () => {
  const admin = { id: 1, name: 'Admin', role: 'admin' }
  const user = { id: 2, name: 'User', role: 'user' }
  
  expect(isAdmin(admin)).toBe(true)
  expect(isAdmin(user)).toBe(false)
})
```

## Component Testing

### Testing Basic Components

```stx
// components/Button.stx
@component('Button')
  @ts
  interface Props {
    type?: 'primary' | 'secondary'
    disabled?: boolean
  }
  @endts

  <button 
    class="btn btn-{{ type }}"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
@endcomponent

// components/Button.test.ts
import { expect, test } from 'bun:test'
import { mount } from '@stacksjs/stx/test-utils'
import Button from './Button.stx'

test('Button renders correctly', () => {
  const wrapper = mount(Button, {
    props: {
      type: 'primary'
    },
    slots: {
      default: 'Click me'
    }
  })

  expect(wrapper.text()).toBe('Click me')
  expect(wrapper.classes()).toContain('btn-primary')
})

test('Button handles disabled state', () => {
  const wrapper = mount(Button, {
    props: {
      disabled: true
    }
  })

  expect(wrapper.attributes('disabled')).toBeDefined()
})
```

### Testing Component Events

```stx
// components/Counter.stx
@component('Counter')
  @ts
  let count = 0
  
  function increment() {
    count++
    emit('change', count)
  }
  @endts

  <div>
    <span>{{ count }}</span>
    <button @click="increment">Increment</button>
  </div>
@endcomponent

// components/Counter.test.ts
import { expect, test } from 'bun:test'
import { mount } from '@stacksjs/stx/test-utils'
import Counter from './Counter.stx'

test('Counter emits change event on increment', async () => {
  const wrapper = mount(Counter)
  const button = wrapper.find('button')
  
  await button.trigger('click')
  
  expect(wrapper.emitted().change).toBeTruthy()
  expect(wrapper.emitted().change[0]).toEqual([1])
})
```

## Integration Testing

### Testing Page Components

```ts
import { expect, test } from 'bun:test'
import { mount } from '@stacksjs/stx/test-utils'
import UserDashboard from '../pages/UserDashboard.stx'

test('UserDashboard integrates components correctly', async () => {
  const wrapper = mount(UserDashboard)
  
  // Test navigation component
  expect(wrapper.find('nav').exists()).toBe(true)
  
  // Test user profile component
  const profile = wrapper.findComponent({ name: 'UserProfile' })
  expect(profile.exists()).toBe(true)
  
  // Test interaction between components
  await wrapper.find('[data-test="edit-profile"]').trigger('click')
  expect(wrapper.findComponent({ name: 'ProfileEditor' }).exists()).toBe(true)
})
```

### Testing Routing

```ts
import { expect, test } from 'bun:test'
import { mount } from '@stacksjs/stx/test-utils'
import { createRouter } from '@stacksjs/stx/router'
import App from '../App.stx'

test('routing works correctly', async () => {
  const router = createRouter({
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: About }
    ]
  })

  const wrapper = mount(App, {
    global: {
      plugins: [router]
    }
  })

  // Test navigation
  await router.push('/about')
  expect(wrapper.findComponent(About).exists()).toBe(true)
})
```

## Best Practices

1. **Test Organization**
   - Keep tests close to components
   - Use descriptive test names
   - Group related tests
   - Mock external dependencies

2. **Testing Strategy**
   - Unit test utilities and functions
   - Component test in isolation
   - Integration test key workflows
   - End-to-end test critical paths

3. **Performance**
   - Mock heavy operations
   - Use shallow mounting when possible
   - Clean up after tests
   - Run tests in parallel

4. **Continuous Integration**
   - Run tests on every commit
   - Maintain test coverage
   - Monitor test performance
   - Automate test runs

## Next Steps

- Explore [Deployment](/features/deployment)
- Learn about [State Management](/features/state)
- Check out [Performance Optimization](/features/performance)
- Review [Security Guidelines](/features/security) 