# State Management

STX provides powerful state management capabilities, from simple component-level state to complex global state management. This guide covers all aspects of state management in STX applications.

## Component State

### Local State

The simplest form of state management using local variables:

```stx
@component('Counter')
  @ts
  let count = 0
  
  function increment() {
    count++
  }
  
  function decrement() {
    count--
  }
  @endts

  <div class="counter">
    <button @click="decrement">-</button>
    <span>{{ count }}</span>
    <button @click="increment">+</button>
  </div>
@endcomponent
```

### Reactive State

Use `reactive` for more complex state:

```stx
@component('UserProfile')
  @ts
  interface User {
    name: string
    email: string
    preferences: {
      theme: 'light' | 'dark'
      notifications: boolean
    }
  }

  const user = reactive<User>({
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'light',
      notifications: true
    }
  })

  function updatePreferences(theme: 'light' | 'dark') {
    user.preferences.theme = theme
  }
  @endts

  <div class="profile">
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    
    <div class="preferences">
      <label>
        Theme:
        <select @change="e => updatePreferences(e.target.value)">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  </div>
@endcomponent
```

### Computed State

Derive state using computed properties:

```stx
@component('TodoList')
  @ts
  interface Todo {
    id: number
    text: string
    completed: boolean
  }

  const todos = reactive<Todo[]>([])
  
  // Computed properties
  const completedTodos = computed(() => 
    todos.filter(todo => todo.completed)
  )
  
  const incompleteTodos = computed(() => 
    todos.filter(todo => !todo.completed)
  )
  
  const progress = computed(() => 
    (completedTodos.value.length / todos.length) * 100
  )
  @endts

  <div class="todo-list">
    <div class="progress">
      {{ progress.toFixed(1) }}% Complete
    </div>

    <h3>Incomplete ({{ incompleteTodos.length }})</h3>
    <ul>
      @foreach(incompleteTodos as todo)
        <todo-item :todo="todo" />
      @endforeach
    </ul>

    <h3>Completed ({{ completedTodos.length }})</h3>
    <ul>
      @foreach(completedTodos as todo)
        <todo-item :todo="todo" />
      @endforeach
    </ul>
  </div>
@endcomponent
```

## Global State

### Store Pattern

Create a centralized store for global state:

```ts
// stores/userStore.ts
import { reactive } from '@stacksjs/stx'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

interface UserState {
  currentUser: User | null
  loading: boolean
  error: Error | null
}

interface UserActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const state = reactive<UserState>({
  currentUser: null,
  loading: false,
  error: null
})

const actions: UserActions = {
  async login(email, password) {
    state.loading = true
    state.error = null
    try {
      const user = await api.login(email, password)
      state.currentUser = user
    } catch (error) {
      state.error = error as Error
      throw error
    } finally {
      state.loading = false
    }
  },

  async logout() {
    state.loading = true
    try {
      await api.logout()
      state.currentUser = null
    } catch (error) {
      state.error = error as Error
      throw error
    } finally {
      state.loading = false
    }
  },

  async updateProfile(data) {
    if (!state.currentUser) return
    
    state.loading = true
    try {
      const updated = await api.updateProfile(state.currentUser.id, data)
      state.currentUser = { ...state.currentUser, ...updated }
    } catch (error) {
      state.error = error as Error
      throw error
    } finally {
      state.loading = false
    }
  }
}

export const userStore = {
  state,
  ...actions
}
```

### Using Global State

Access global state in components:

```stx
@component('UserMenu')
  @ts
  import { userStore } from '../stores/userStore'
  
  const { state, logout } = userStore
  
  async function handleLogout() {
    try {
      await logout()
      // Redirect to login
    } catch (error) {
      // Handle error
    }
  }
  @endts

  <div class="user-menu">
    @if(state.currentUser)
      <div class="user-info">
        <img :src="state.currentUser.avatar" />
        <span>{{ state.currentUser.name }}</span>
      </div>
      
      <button @click="handleLogout">
        Logout
      </button>
    @else
      <login-button />
    @endif
  </div>
@endcomponent
```

### State Persistence

Persist state across page reloads:

```ts
// stores/persistentStore.ts
import { reactive, watch } from '@stacksjs/stx'

interface PersistOptions<T> {
  key: string
  storage?: Storage
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
}

export function createPersistentStore<T extends object>(
  initialState: T,
  options: PersistOptions<T>
) {
  const {
    key,
    storage = localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options

  // Load initial state from storage
  let savedState: T | null = null
  try {
    const saved = storage.getItem(key)
    if (saved) {
      savedState = deserialize(saved)
    }
  } catch (e) {
    console.error('Failed to load state:', e)
  }

  const state = reactive({
    ...initialState,
    ...savedState
  })

  // Watch for changes and save to storage
  watch(
    () => state,
    (newState) => {
      try {
        storage.setItem(key, serialize(newState))
      } catch (e) {
        console.error('Failed to save state:', e)
      }
    },
    { deep: true }
  )

  return state
}

// Usage
interface Settings {
  theme: 'light' | 'dark'
  fontSize: number
  notifications: boolean
}

export const settings = createPersistentStore<Settings>(
  {
    theme: 'light',
    fontSize: 16,
    notifications: true
  },
  { key: 'app-settings' }
)
```

## Advanced Patterns

### State Composition

Compose multiple stores:

```ts
// stores/index.ts
import { userStore } from './userStore'
import { settingsStore } from './settingsStore'
import { cartStore } from './cartStore'

export const store = {
  user: userStore,
  settings: settingsStore,
  cart: cartStore
}

// Provide type helper
export type Store = typeof store

// Usage in components
@component('App')
  @ts
  import { store } from '../stores'
  
  const {
    user: { state: userState },
    settings: { theme },
    cart: { items }
  } = store
  @endts

  <div :class="theme">
    <user-menu :user="userState.currentUser" />
    <cart-widget :items="items" />
  </div>
@endcomponent
```

### State Middleware

Add middleware for state changes:

```ts
// stores/middleware.ts
type Middleware<T> = (
  state: T,
  newValue: any,
  path: string[]
) => boolean | void

function createMiddleware<T extends object>(
  state: T,
  middleware: Middleware<T>[]
) {
  return new Proxy(state, {
    set(target, property, value, receiver) {
      const path = [String(property)]
      
      // Run through middleware
      for (const fn of middleware) {
        const result = fn(target, value, path)
        if (result === false) return false
      }
      
      return Reflect.set(target, property, value, receiver)
    }
  })
}

// Example middleware
const loggingMiddleware: Middleware<any> = (state, value, path) => {
  console.log(`Setting ${path.join('.')} to:`, value)
}

const validationMiddleware: Middleware<any> = (state, value, path) => {
  if (value === undefined) {
    console.warn(`Attempting to set undefined at ${path.join('.')}`)
    return false
  }
}

// Usage
const state = createMiddleware(
  reactive({ count: 0 }),
  [loggingMiddleware, validationMiddleware]
)
```

## Best Practices

1. **State Organization**
   - Keep state as local as possible
   - Use stores for shared state
   - Break down complex state
   - Document state shape

2. **Performance**
   - Use computed for derived state
   - Avoid deep watching when possible
   - Implement proper cleanup
   - Profile state updates

3. **Type Safety**
   - Define interfaces for state
   - Use strict TypeScript checks
   - Validate state changes
   - Document state mutations

4. **Testing**
   - Unit test store logic
   - Mock global state
   - Test state persistence
   - Verify computed updates

## Next Steps

- Learn about [Performance Optimization](/advanced/performance)
- Explore [Build Configuration](/advanced/build)
- Understand [Testing](/advanced/testing)
- Check out [Deployment](/advanced/deployment) 