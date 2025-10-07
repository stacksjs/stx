# Best Practices

This guide outlines the recommended practices for building applications with stx.

## Project Structure

### Directory Organization

Follow this recommended project structure:

```
my-stx-app/
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/       # Shared components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature-specific components
│   ├── pages/            # Page components
│   ├── stores/           # State management
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── styles/           # Global styles
│   └── main.ts           # Application entry
├── public/               # Static assets
├── tests/                # Test files
├── stx.config.ts         # stx configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

### Naming Conventions

Follow these naming conventions:

- Components: PascalCase (`UserProfile.stx`)
- Files: kebab-case (`user-profile.ts`)
- Directories: kebab-case (`feature-name/`)
- Types/Interfaces: PascalCase (`UserData`)
- Variables/Functions: camelCase (`getUserData`)

## Component Design

### Single Responsibility

Keep components focused on a single responsibility:

```stx
// Bad: Component doing too much
@component('UserDashboard')
  <div>
    <user-profile />
    <order-history />
    <payment-methods />
    <shipping-addresses />
    <account-settings />
  </div>
@endcomponent

// Good: Split into focused components
@component('UserDashboard')
  <div>
    <DashboardHeader />
    <DashboardNav />
    <router-view /> <!-- Load specific features as needed -->
  </div>
@endcomponent
```

### Props Design

Design props with TypeScript for better type safety:

```stx
@ts
interface ButtonProps {
  // Use specific types
  variant: 'primary' | 'secondary' | 'danger'
  size: 'sm' | 'md' | 'lg'

  // Provide meaningful defaults
  disabled?: boolean

  // Use descriptive names
  onActionComplete?: () => void
}
@endts

@component('Button', {
  props: {
    variant: {
      type: String,
      required: true,
      validator: (value: string) =>
        ['primary', 'secondary', 'danger'].includes(value)
    },
    size: {
      type: String,
      default: 'md'
    },
    disabled: Boolean,
    onActionComplete: Function
  }
})
```

### Component Communication

Use proper patterns for component communication:

```stx
// Parent to Child: Props
@component('Parent')
  <Child :data="parentData" />
@endcomponent

// Child to Parent: Events
@component('Child', {
  emits: ['update']
})
  <button @click="$emit('update', newValue)">
    Update
  </button>
@endcomponent

// Sibling Communication: Store
const useSharedStore = createStore({
  state: {
    sharedData: null
  },
  actions: {
    updateData(data: any) {
      this.sharedData = data
    }
  }
})
```

## State Management

### Store Organization

Organize stores by feature:

```typescript
// stores/user.ts
export const useUserStore = createStore({
  state: {
    user: null,
    preferences: {}
  },
  actions: {
    async login() { /* ... */ },
    async logout() { /* ... */ },
    updatePreferences() { /* ... */ }
  }
})

// stores/cart.ts
export const useCartStore = createStore({
  state: {
    items: [],
    total: 0
  },
  actions: {
    addItem() { /* ... */ },
    removeItem() { /* ... */ },
    checkout() { /* ... */ }
  }
})
```

### State Access Patterns

Use computed properties for derived state:

```stx
@component('CartSummary', {
  setup() {
    const cartStore = useCartStore()

    // Computed properties for derived state
    const subtotal = computed(() =>
      cartStore.items.reduce((sum, item) =>
        sum + item.price * item.quantity, 0)
    )

    const tax = computed(() => subtotal.value * 0.1)
    const total = computed(() => subtotal.value + tax.value)

    return { subtotal, tax, total }
  }
})
```

## Performance Optimization

### Lazy Loading

Implement lazy loading for better initial load times:

```typescript
// Route-level lazy loading
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.stx')
  }
]

// Component-level lazy loading
const HeavyComponent = () => import('./components/HeavyComponent.stx')
```

### Computed Properties

Use computed properties for expensive calculations:

```stx
@component('ProductList', {
  setup() {
    const products = ref([])

    // Bad: Recalculating on every render
    const filteredProducts = () =>
      products.value.filter(p => p.price > 100)

    // Good: Cached until dependencies change
    const filteredProducts = computed(() =>
      products.value.filter(p => p.price > 100)
    )

    return { filteredProducts }
  }
})
```

### Event Handling

Use debounce/throttle for frequent events:

```typescript
import { debounce } from '@stx/utils'

@component('SearchInput', {
  setup() {
    const searchTerm = ref('')

    const debouncedSearch = debounce((term: string) => {
      // Perform search
    }, 300)

    const handleInput = (e: Event) => {
      searchTerm.value = (e.target as HTMLInputElement).value
      debouncedSearch(searchTerm.value)
    }

    return { searchTerm, handleInput }
  }
})
```

## TypeScript Integration

### Type Safety

Leverage TypeScript for better type safety:

```typescript
// Define strict interfaces
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

// Use generics for reusable components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => string
}

@component('List', {
  props: {} as ListProps<unknown>
})
```

### Type Guards

Use type guards for runtime type checking:

```typescript
function isUser(value: any): value is User {
  return (
    typeof value === 'object' &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    ['admin', 'user'].includes(value.role)
  )
}

@component('UserProfile', {
  setup() {
    const data = ref<unknown>(null)

    const loadUser = async (id: number) => {
      const response = await fetch(`/api/users/${id}`)
      const userData = await response.json()

      if (isUser(userData)) {
        data.value = userData
      } else {
        throw new Error('Invalid user data')
      }
    }

    return { data, loadUser }
  }
})
```

## Testing

### Component Testing

Write comprehensive component tests:

```typescript
import { mount } from '@stx/test-utils'
import Button from './Button.stx'

describe('Button', () => {
  it('renders correctly', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
        size: 'md'
      }
    })

    expect(wrapper.classes()).toContain('btn-primary')
    expect(wrapper.classes()).toContain('btn-md')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted().click).toBeTruthy()
  })
})
```

### Store Testing

Test store functionality:

```typescript
import { createStore } from '@stx/store'

const useCounterStore = createStore({
  state: {
    count: 0
  },
  actions: {
    increment() {
      this.count++
    }
  }
})

describe('Counter Store', () => {
  let store: ReturnType<typeof useCounterStore>

  beforeEach(() => {
    store = useCounterStore()
  })

  it('increments count', () => {
    expect(store.count).toBe(0)
    store.increment()
    expect(store.count).toBe(1)
  })
})
```

## Error Handling

### Component Error Boundaries

Implement error boundaries:

```stx
@component('ErrorBoundary', {
  setup() {
    const hasError = ref(false)
    const error = ref<Error | null>(null)

    onErrorCaptured((err) => {
      hasError.value = true
      error.value = err
      return false // Prevent error propagation
    })

    return { hasError, error }
  }
})
  @if(hasError)
    <div class="error-boundary">
      <h2>Something went wrong</h2>
      <pre>{{ error?.message }}</pre>
      <button @click="hasError = false">
        Try Again
      </button>
    </div>
  @else
    <slot></slot>
  @endif
@endcomponent
```

### API Error Handling

Handle API errors consistently:

```typescript
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message)
  }
}

async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new APIError(
        response.statusText,
        response.status,
        'API_ERROR'
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      // Handle specific API errors
      handleAPIError(error)
    } else {
      // Handle network/other errors
      handleGenericError(error)
    }
    throw error
  }
}
```

## Security

### XSS Prevention

Prevent XSS attacks:

```stx
// Bad: Direct HTML insertion
<div v-html="userInput"></div>

// Good: Escape HTML
<div>{{ userInput }}</div>

// Good: Sanitize HTML when necessary
@component('RichText', {
  props: {
    content: String
  },
  setup(props) {
    const sanitizedContent = computed(() =>
      sanitizeHTML(props.content)
    )
    return { sanitizedContent }
  }
})
  <div v-html="sanitizedContent"></div>
@endcomponent
```

### Form Validation

Implement proper form validation:

```stx
@component('LoginForm', {
  setup() {
    const form = ref({
      email: '',
      password: ''
    })

    const rules = {
      email: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      password: [
        v => !!v || 'Password is required',
        v => v.length >= 8 || 'Password must be at least 8 characters'
      ]
    }

    const validate = () => {
      return Object.entries(rules).every(([field, validators]) =>
        validators.every(validator =>
          validator(form.value[field]) === true
        )
      )
    }

    const handleSubmit = async () => {
      if (validate()) {
        // Process form
      }
    }

    return { form, handleSubmit }
  }
})
```

## Accessibility

### ARIA Attributes

Use proper ARIA attributes:

```stx
@component('Dialog', {
  props: {
    title: String,
    open: Boolean
  }
})
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    :aria-hidden="!open"
  >
    <h2 id="dialog-title">{{ title }}</h2>
    <slot></slot>
    <button
      aria-label="Close dialog"
      @click="$emit('close')"
    >
      ×
    </button>
  </div>
@endcomponent
```

### Keyboard Navigation

Support keyboard navigation:

```stx
@component('TabList', {
  setup() {
    const tabs = ref([])
    const activeIndex = ref(0)

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          activeIndex.value = Math.min(
            activeIndex.value + 1,
            tabs.value.length - 1
          )
          break
        case 'ArrowLeft':
          activeIndex.value = Math.max(
            activeIndex.value - 1,
            0
          )
          break
      }
    }

    return { tabs, activeIndex, handleKeyDown }
  }
})
  <div
    role="tablist"
    @keydown="handleKeyDown"
  >
    @foreach(tabs as tab, index)
      <button
        role="tab"
        :aria-selected="index === activeIndex"
        :tabindex="index === activeIndex ? 0 : -1"
      >
        {{ tab.label }}
      </button>
    @endforeach
  </div>
@endcomponent
```

## Documentation

### Component Documentation

Document components thoroughly:

```typescript
/**
 * Button component with various styles and sizes.
 *
 * @component
 * @example
 * ```stx
 * <Button
 *   variant="primary"
 *   size="md"
 *   @click="handleClick"
 * >
 *   Click Me
 * </Button>
 * ```
 */
@component('Button', {
  props: {
    /**
     * The button variant
     * @values 'primary' | 'secondary' | 'danger'
     */
    variant: {
      type: String,
      required: true
    },

    /**
     * The button size
     * @values 'sm' | 'md' | 'lg'
     * @default 'md'
     */
    size: {
      type: String,
      default: 'md'
    }
  }
})
```

### Code Comments

Write meaningful comments:

```typescript
// Bad: Obvious comment
// Increment count
count++

// Good: Explaining complex logic
// Calculate price with volume discount
const finalPrice = basePrice * (1 - Math.min(quantity / 100, 0.5))

// Good: Documenting edge cases
// Note: API may return null for inactive users
const user = await fetchUser(id)
```

## Deployment

### Build Optimization

Optimize builds for production:

```typescript
// stx.config.ts
export default defineConfig({
  build: {
    // Enable minification
    minify: true,

    // Split vendor chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@stx/core', '@stx/store']
        }
      }
    },

    // Generate source maps
    sourcemap: true
  }
})
```

### Environment Configuration

Handle environment variables properly:

```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
}

// config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  appTitle: import.meta.env.VITE_APP_TITLE
}

// Usage
@component('App')
  <h1>{{ config.appTitle }}</h1>
@endcomponent
```
