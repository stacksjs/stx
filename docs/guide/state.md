# State Management

stx provides powerful state management capabilities to help you manage application data effectively. This guide covers both local component state and global application state.

## Component State

### Basic State Management

Use reactive state in components:

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

### Computed Properties

Create derived state:

```stx
@component('TodoList')
  @ts
  interface Todo {
    id: number
    text: string
    completed: boolean
  }

  const todos = ref<Todo[]>([])

  const completedTodos = computed(() =>
    todos.value.filter(todo => todo.completed)
  )

  const incompleteTodos = computed(() =>
    todos.value.filter(todo => !todo.completed)
  )
  @endts

  <div class="todo-list">
    <h3>Completed ({{ completedTodos.length }})</h3>
    <todo-items :items="completedTodos" />

    <h3>Incomplete ({{ incompleteTodos.length }})</h3>
    <todo-items :items="incompleteTodos" />
  </div>
@endcomponent
```

### Watchers

React to state changes:

```stx
@component('UserProfile')
  @ts
  interface User {
    id: number
    name: string
    preferences: Record<string, any>
  }

  const user = ref<User | null>(null)

  watch(() => user.value?.preferences, (newPrefs, oldPrefs) => {
    if (newPrefs !== oldPrefs) {
      savePreferences(newPrefs)
    }
  }, { deep: true })
  @endts

  <div class="profile">
    @if(user)
      <user-preferences :preferences="user.preferences" />
    @endif
  </div>
@endcomponent
```

## Global State

### Store Setup

Create a global store:

```ts
// store/index.ts
import { createStore } from '@stacksjs/stx/store'

interface State {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

interface Actions {
  setUser(user: User | null): void
  toggleTheme(): void
  addNotification(notification: Notification): void
}

export const store = createStore<State, Actions>({
  state: {
    user: null,
    theme: 'light',
    notifications: []
  },

  actions: {
    setUser(state, user) {
      state.user = user
    },

    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },

    addNotification(state, notification) {
      state.notifications.push(notification)
    }
  }
})
```

### Using the Store

Access store state in components:

```stx
@component('AppHeader')
  @ts
  import { store } from '@/store'

  const { user, theme } = store.state
  const { toggleTheme } = store.actions
  @endts

  <header :class="{ 'dark': theme === 'dark' }">
    @if(user)
      <user-menu :user="user" />
    @else
      <login-button />
    @endif

    <button @click="toggleTheme">
      Toggle Theme
    </button>
  </header>
@endcomponent
```

### Store Modules

Organize state with modules:

```ts
// store/modules/auth.ts
export const auth = {
  state: {
    user: null,
    token: null
  },

  actions: {
    async login(state, credentials) {
      const response = await api.login(credentials)
      state.user = response.user
      state.token = response.token
    },

    logout(state) {
      state.user = null
      state.token = null
    }
  }
}

// store/index.ts
import { auth } from './modules/auth'

export const store = createStore({
  modules: {
    auth
  }
})
```

## State Persistence

### Local Storage

Persist state to local storage:

```ts
import { createPersistedStore } from '@stacksjs/stx/store'

export const store = createPersistedStore({
  state: {
    theme: 'light',
    settings: {}
  },

  persistence: {
    key: 'app-state',
    paths: ['theme', 'settings'],
    storage: localStorage
  }
})
```

### Custom Storage

Implement custom persistence:

```ts
const customStorage = {
  async get(key: string) {
    const value = await api.getState(key)
    return JSON.parse(value)
  },

  async set(key: string, value: any) {
    await api.setState(key, JSON.stringify(value))
  }
}

export const store = createPersistedStore({
  // ... store config
  persistence: {
    storage: customStorage
  }
})
```

## State Management Patterns

### Component Communication

Share state between components:

```stx
@component('ParentComponent')
  @ts
  const sharedState = ref({
    value: 0
  })
  @endts

  <div>
    <child-a :state="sharedState" />
    <child-b :state="sharedState" />
  </div>
@endcomponent

@component('ChildA')
  @ts
  const props = defineProps<{
    state: { value: number }
  }>()

  function increment() {
    props.state.value++
  }
  @endts

  <button @click="increment">
    Increment from A
  </button>
@endcomponent
```

### State Composition

Compose multiple state sources:

```ts
function useUserState() {
  const user = ref(null)
  const loading = ref(false)

  async function fetchUser(id: number) {
    loading.value = true
    try {
      user.value = await api.getUser(id)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    fetchUser
  }
}

function usePermissions(user) {
  const can = (action: string) => {
    return user.value?.permissions.includes(action)
  }

  return { can }
}

// Usage in component
@component('UserDashboard')
  @ts
  const { user, loading, fetchUser } = useUserState()
  const { can } = usePermissions(user)
  @endts

  <div>
    @if(loading)
      <loading-spinner />
    @elseif(user)
      @if(can('view-dashboard'))
        <dashboard-content />
      @endif
    @endif
  </div>
@endcomponent
```

## Best Practices

1. **State Organization**
   - Keep state minimal
   - Use computed properties
   - Split into modules
   - Document state shape

2. **Performance**
   - Use shallow refs when possible
   - Avoid deep watching large objects
   - Batch updates
   - Optimize rerenders

3. **State Access**
   - Use composition
   - Implement access control
   - Handle loading states
   - Manage side effects

4. **Persistence**
   - Choose appropriate storage
   - Handle errors
   - Implement migrations
   - Secure sensitive data

## Next Steps

- Learn about [Testing](/features/testing)
- Explore [Performance](/features/performance)
- Check out [Security](/features/security)
- Review [Deployment](/features/deployment)
