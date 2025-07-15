# TypeScript

STX provides first-class TypeScript support with comprehensive type checking, IDE integration, and development tools. This page covers all TypeScript features and capabilities in the STX ecosystem.

## TypeScript Integration

### Component Type Safety

```stx
@ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: (event: MouseEvent) => void
}

interface ButtonSlots {
  default: any
  icon?: any
}
@endts

@component('Button', {
  props: {
    variant: { type: String, default: 'primary' },
    size: { type: String, default: 'md' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
  }
})
  <button 
    class="btn btn--&#123;&#123; variant &#125;&#125; btn--&#123;&#123; size &#125;&#125;"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
    {{ $attributes }}
  >
    @if(loading)
      <spinner class="btn__spinner" />
    @endif
    <slot name="icon" />
    <slot />
  </button>
@endcomponent
```

### Template Type Checking

```stx
@ts
interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'moderator'
  createdAt: Date
}

interface UserListProps {
  users: User[]
  showEmail?: boolean
  onUserClick?: (user: User) => void
}
@endts

@component('UserList', {
  props: {
    users: { type: Array, required: true },
    showEmail: { type: Boolean, default: false }
  }
})
  <div class="user-list">
    @foreach(users as user)
      <div 
        class="user-item" 
        @click="$emit('userClick', user)"
        :key="user.id"
      >
        <img :src="user.avatar" :alt="user.name">
        <div class="user-info">
          <h3>&#123;&#123; user.name &#125;&#125;</h3>
          @if(showEmail)
            <p>&#123;&#123; user.email &#125;&#125;</p>
          @endif
          <span class="user-role">&#123;&#123; user.role &#125;&#125;</span>
        </div>
      </div>
    @endforeach
  </div>
@endcomponent
```

## State Type Safety

### Typed Component State

```stx
@ts
interface CounterState {
  count: number
  step: number
  history: number[]
  isAnimating: boolean
}

interface CounterMethods {
  increment(): void
  decrement(): void
  reset(): void
  setStep(step: number): void
}
@endts

@component('Counter')
  @state<CounterState>({
    count: 0,
    step: 1,
    history: [],
    isAnimating: false
  })
  
  @computed({
    canUndo: (): boolean => history.length > 0,
    lastValue: (): number => history[history.length - 1] || 0
  })
  
  @method increment(): void {
    history.push(count)
    count += step
    triggerAnimation()
  }
  
  @method decrement(): void {
    history.push(count)
    count -= step
    triggerAnimation()
  }
  
  @method reset(): void {
    history.push(count)
    count = 0
  }
  
  <div class="counter">
    <button @click="decrement">-</button>
    <span class="counter__value">&#123;&#123; count &#125;&#125;</span>
    <button @click="increment">+</button>
    
    @if(canUndo)
      <button @click="undo">Undo</button>
    @endif
  </div>
@endcomponent
```

### Global Store Types

```typescript
// types/store.ts
export interface AppState {
  auth: AuthState
  ui: UIState
  data: DataState
}

export interface AuthState {
  user: User | null
  token: string | null
  permissions: Permission[]
  isAuthenticated: boolean
}

export interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  notifications: Notification[]
  loading: Record<string, boolean>
}

// store.ts
import { createStore } from '@stx/state'
import type { AppState } from './types/store'

const store = createStore<AppState>({
  state: {
    auth: {
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false
    },
    ui: {
      theme: 'light',
      sidebarOpen: false,
      notifications: [],
      loading: {}
    }
  },
  
  getters: {
    currentUser(state): User | null {
      return state.auth.user
    },
    
    hasPermission(state): (permission: string) => boolean {
      return (permission: string) => 
        state.auth.permissions.some(p => p.name === permission)
    }
  },
  
  actions: {
    async login(credentials: LoginCredentials): Promise<void> {
      const response = await authAPI.login(credentials)
      this.state.auth.user = response.user
      this.state.auth.token = response.token
      this.state.auth.isAuthenticated = true
    }
  }
})
```

## API Type Safety

### Typed API Calls

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current: number
    total: number
    perPage: number
  }
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'user' | 'moderator'

// api/users.ts
class UserAPI {
  async getAll(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    const response = await fetch('/api/users', {
      method: 'GET',
      body: JSON.stringify(params)
    })
    return response.json()
  }
  
  async getById(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  }
  
  async create(userData: CreateUserData): Promise<ApiResponse<User>> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  }
}
```

### Typed Forms

```stx
@ts
interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginFormErrors {
  email?: string
  password?: string
  general?: string
}

interface LoginFormMethods {
  validate(): boolean
  submit(): Promise<void>
  resetForm(): void
}
@endts

@component('LoginForm')
  @state<{
    form: LoginForm
    errors: LoginFormErrors
    isSubmitting: boolean
  }>({
    form: {
      email: '',
      password: '',
      rememberMe: false
    },
    errors: {},
    isSubmitting: false
  })
  
  @method validate(): boolean {
    errors = {}
    
    if (!form.email) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Invalid email format'
    }
    
    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    return Object.keys(errors).length === 0
  }
  
  @method async submit(): Promise<void> {
    if (!validate()) return
    
    isSubmitting = true
    errors = {}
    
    try {
      await authAPI.login(form)
      router.push('/dashboard')
    } catch (error) {
      errors.general = error.message
    } finally {
      isSubmitting = false
    }
  }
  
  <form @submit.prevent="submit" class="login-form">
    <div class="field">
      <label for="email">Email</label>
      <input 
        id="email"
        @model="form.email"
        type="email"
        :class="{ 'error': errors.email }"
      >
      @if(errors.email)
        <span class="error-message">&#123;&#123; errors.email &#125;&#125;</span>
      @endif
    </div>
    
    <div class="field">
      <label for="password">Password</label>
      <input 
        id="password"
        @model="form.password"
        type="password"
        :class="{ 'error': errors.password }"
      >
      @if(errors.password)
        <span class="error-message">&#123;&#123; errors.password &#125;&#125;</span>
      @endif
    </div>
    
    <div class="field">
      <label>
        <input @model="form.rememberMe" type="checkbox">
        Remember me
      </label>
    </div>
    
    @if(errors.general)
      <div class="error-message">&#123;&#123; errors.general &#125;&#125;</div>
    @endif
    
    <button type="submit" :disabled="isSubmitting">
      &#123;&#123; isSubmitting ? 'Logging in...' : 'Login' &#125;&#125;
    </button>
  </form>
@endcomponent
```

## Advanced TypeScript Features

### Generic Components

```stx
@ts
interface DataTableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: any, item: T) => string
}

interface DataTableProps<T> {
  items: T[]
  columns: DataTableColumn<T>[]
  sortBy?: keyof T
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: keyof T) => void
}
@endts

@component('DataTable', {
  props: {
    items: { type: Array, required: true },
    columns: { type: Array, required: true },
    sortBy: String,
    sortDirection: { type: String, default: 'asc' }
  }
})
  <table class="data-table">
    <thead>
      <tr>
        @foreach(columns as column)
          <th 
            @click="column.sortable && $emit('sort', column.key)"
            :class="{ 
              'sortable': column.sortable,
              'sorted': sortBy === column.key 
            }"
          >
            &#123;&#123; column.title &#125;&#125;
            @if(sortBy === column.key)
              <span class="sort-indicator">
                &#123;&#123; sortDirection === 'asc' ? '↑' : '↓' &#125;&#125;
              </span>
            @endif
          </th>
        @endforeach
      </tr>
    </thead>
    <tbody>
      @foreach(items as item, index)
        <tr>
          @foreach(columns as column)
            <td>
              <slot 
                :name="column.key" 
                :item="item" 
                :value="item[column.key]"
                :index="index"
              >
                &#123;&#123; column.render ? column.render(item[column.key], item) : item[column.key] &#125;&#125;
              </slot>
            </td>
          @endforeach
        </tr>
      @endforeach
    </tbody>
  </table>
@endcomponent
```

### Type Guards and Utilities

```typescript
// utils/types.ts
export type NonNullable<T> = T extends null | undefined ? never : T

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Expected number')
  }
}

export function isArrayOf<T>(
  array: unknown[], 
  guard: (item: unknown) => item is T
): array is T[] {
  return array.every(guard)
}

// Usage in components
@component('UserFilter')
  @method filterValidUsers(users: (User | null)[]): User[] {
    return users.filter(isNotNull)
  }
  
  @method processUserData(data: unknown): User[] {
    if (!Array.isArray(data)) {
      throw new Error('Expected array')
    }
    
    if (!isArrayOf(data, isUser)) {
      throw new Error('Invalid user data')
    }
    
    return data
  }
@endcomponent
```

## Build-time Type Checking

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.stx",
    "tests/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### Template Type Checking

```typescript
// stx.config.ts
export default {
  typescript: {
    strict: true,
    checkTemplates: true,
    typeCheckTimeout: 30000,
    
    // Custom type definitions
    globalTypes: {
      $auth: 'AuthService',
      $router: 'Router',
      $i18n: 'I18nService'
    },
    
    // Template type checking options
    templateOptions: {
      strictAttributeTypes: true,
      strictEventTypes: true,
      strictSlotTypes: true
    }
  }
}
```

## IDE Integration

### VSCode Configuration

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "stx.typescript.enabled": true,
  "stx.typescript.strictMode": true,
  
  "files.associations": {
    "*.stx": "stx"
  },
  
  "emmet.includeLanguages": {
    "stx": "html"
  }
}
```

### Type Definitions

```typescript
// types/global.d.ts
declare global {
  interface Window {
    __STX_APP__: STXApp
  }
}

declare module '@stx/core' {
  interface ComponentInstance {
    $auth: AuthService
    $router: Router
    $i18n: I18nService
  }
}

declare module '*.stx' {
  import type { ComponentOptions } from '@stx/core'
  const component: ComponentOptions
  export default component
}

export {}
```

## Testing with TypeScript

### Typed Test Setup

```typescript
// tests/setup.ts
import { beforeEach } from 'bun:test'
import type { ComponentWrapper } from '@stx/testing'

declare global {
  interface TestContext {
    wrapper: ComponentWrapper
    mockUser: User
    mockAPI: MockAPI
  }
}

beforeEach<TestContext>(async (context) => {
  context.mockUser = createMockUser()
  context.mockAPI = createMockAPI()
})
```

### Component Testing

```typescript
import { test, expect } from 'bun:test'
import { mount } from '@stx/testing'
import type { User } from '@/types'
import UserCard from '@/components/UserCard.stx'

test('UserCard displays user information correctly', () => {
  const user: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const wrapper = mount(UserCard, {
    props: { user, showEmail: true }
  })
  
  expect(wrapper.find('.user-card__name').text()).toBe('John Doe')
  expect(wrapper.find('.user-card__email').text()).toBe('john@example.com')
  expect(wrapper.find('.user-role').text()).toBe('user')
})

test('UserCard emits userClick event with correct payload', async () => {
  const user: User = createMockUser()
  const wrapper = mount(UserCard, { props: { user } })
  
  await wrapper.find('.user-item').trigger('click')
  
  const emitted = wrapper.emitted<{ userClick: [User] }>()
  expect(emitted.userClick).toBeTruthy()
  expect(emitted.userClick[0][0]).toEqual(user)
})
```

## Performance Optimizations

### Type-aware Tree Shaking

```typescript
// utils/index.ts
export type { User, UserRole } from './types'
export { createUser, validateUser } from './user'
export { formatDate, parseDate } from './date'

// Component usage - only imports what's needed
import type { User } from '@/utils'
import { formatDate } from '@/utils'
```

### Lazy Type Loading

```typescript
// Lazy load heavy type definitions
const LazyUserAdmin = lazy(() => 
  import('@/components/UserAdmin.stx').then(module => ({
    default: module.default as ComponentOptions<UserAdminProps>
  }))
)
```

## Related Resources

- [TypeScript Guide](/guide/typescript) - Comprehensive TypeScript development guide
- [Component Testing](/advanced/testing) - Testing TypeScript components
- [State Management](/advanced/state) - Typed state management patterns
- [Build Configuration](/advanced/build) - TypeScript build setup 