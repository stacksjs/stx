# State Management

STX provides powerful state management capabilities for building complex applications. This page covers all state management features and patterns available in the STX ecosystem.

## Local Component State

### Reactive State

```stx
@component('Counter')
  @state({
    count: 0,
    isLoading: false
  })
  
  <div class="counter">
    <button @click="count--" :disabled="isLoading">-</button>
    <span>{{ count }}</span>
    <button @click="count++" :disabled="isLoading">+</button>
  </div>
@endcomponent
```

### Computed Properties

```stx
@component('UserProfile')
  @state({
    firstName: 'John',
    lastName: 'Doe',
    age: 25
  })
  
  @computed({
    fullName: () => `${firstName} ${lastName}`,
    isAdult: () => age >= 18,
    displayName: () => isAdult ? fullName : firstName
  })
  
  <div class="profile">
    <h1>{{ displayName }}</h1>
    <p>Age: {{ age }} ({{ isAdult ? 'Adult' : 'Minor' }})</p>
  </div>
@endcomponent
```

### Watchers

```stx
@component('SearchBox')
  @state({
    query: '',
    results: [],
    isSearching: false
  })
  
  @watch('query', async (newQuery, oldQuery) => {
    if (newQuery !== oldQuery && newQuery.length > 2) {
      isSearching = true
      results = await searchAPI(newQuery)
      isSearching = false
    }
  })
  
  <div class="search">
    <input @model="query" placeholder="Search...">
    @if(isSearching)
      <spinner />
    @endif
    @foreach(results as result)
      <div class="result">{{ result.title }}</div>
    @endforeach
  </div>
@endcomponent
```

## Global State Management

### Store Creation

```typescript
import { createStore } from '@stx/state'

interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

const store = createStore<AppState>({
  state: {
    user: null,
    theme: 'light',
    notifications: []
  },
  
  getters: {
    isAuthenticated: (state) => state.user !== null,
    unreadCount: (state) => state.notifications.filter(n => !n.read).length
  },
  
  actions: {
    async login(email: string, password: string) {
      const user = await authAPI.login(email, password)
      this.state.user = user
    },
    
    toggleTheme() {
      this.state.theme = this.state.theme === 'light' ? 'dark' : 'light'
    },
    
    addNotification(notification: Notification) {
      this.state.notifications.push(notification)
    }
  }
})
```

### Using Store in Components

```stx
@component('UserHeader')
  @connect(store, ['user', 'theme'])
  
  <header class="header" :class="theme">
    @if(user)
      <div class="user-info">
        <img :src="user.avatar" :alt="user.name">
        <span>{{ user.name }}</span>
      </div>
    @else
      <login-button />
    @endif
  </header>
@endcomponent
```

### Store Modules

```typescript
// modules/auth.ts
export const authModule = {
  namespaced: true,
  state: {
    user: null,
    token: null,
    permissions: []
  },
  
  actions: {
    async login({ commit }, credentials) {
      const response = await authAPI.login(credentials)
      commit('setUser', response.user)
      commit('setToken', response.token)
    },
    
    logout({ commit }) {
      commit('setUser', null)
      commit('setToken', null)
      localStorage.removeItem('auth_token')
    }
  },
  
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setToken(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('auth_token', token)
      }
    }
  }
}

// Store setup
const store = createStore({
  modules: {
    auth: authModule,
    ui: uiModule,
    data: dataModule
  }
})
```

## State Persistence

### LocalStorage Integration

```typescript
import { createPersistedStore } from '@stx/state'

const store = createPersistedStore({
  key: 'app-state',
  storage: localStorage,
  state: {
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  }
})
```

### Custom Persistence

```typescript
const store = createStore({
  state: initialState,
  
  plugins: [
    persistence({
      key: 'app-state',
      paths: ['user', 'preferences'],
      
      // Custom serializer
      serialize: (state) => JSON.stringify(state),
      deserialize: (data) => JSON.parse(data),
      
      // Custom storage
      storage: {
        getItem: (key) => database.get(key),
        setItem: (key, value) => database.set(key, value),
        removeItem: (key) => database.delete(key)
      }
    })
  ]
})
```

## Async State Management

### Loading States

```stx
@component('UserList')
  @state({
    users: [],
    loading: false,
    error: null
  })
  
  @async fetchUsers() {
    loading = true
    error = null
    
    try {
      users = await userAPI.getAll()
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
  
  @mounted(() => {
    fetchUsers()
  })
  
  <div class="user-list">
    @if(loading)
      <loading-spinner />
    @elseif(error)
      <error-message :message="error" />
    @else
      @foreach(users as user)
        <user-card :user="user" />
      @endforeach
    @endif
  </div>
@endcomponent
```

### Resource Management

```typescript
import { createResource } from '@stx/state'

const userResource = createResource({
  fetcher: (id: string) => userAPI.get(id),
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100
  }
})

// In component
const user = userResource.get(userId)
// Returns: { data, loading, error, refetch }
```

### Optimistic Updates

```typescript
const store = createStore({
  state: {
    posts: []
  },
  
  actions: {
    async createPost(post) {
      // Optimistic update
      const tempId = generateTempId()
      const optimisticPost = { ...post, id: tempId, pending: true }
      this.state.posts.unshift(optimisticPost)
      
      try {
        const createdPost = await postAPI.create(post)
        // Replace optimistic post with real one
        const index = this.state.posts.findIndex(p => p.id === tempId)
        this.state.posts[index] = createdPost
      } catch (error) {
        // Remove optimistic post on error
        this.state.posts = this.state.posts.filter(p => p.id !== tempId)
        throw error
      }
    }
  }
})
```

## State Composition

### Composables

```typescript
// composables/useAuth.ts
export function useAuth() {
  const { user, isAuthenticated } = useStore(['user'])
  
  const login = async (credentials) => {
    await store.dispatch('auth/login', credentials)
  }
  
  const logout = () => {
    store.dispatch('auth/logout')
  }
  
  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    login,
    logout
  }
}

// In component
@component('LoginForm')
  @setup(() => {
    const { user, login, logout } = useAuth()
    return { user, login, logout }
  })
  
  <!-- Component template -->
@endcomponent
```

### State Providers

```stx
@provider('ThemeProvider', {
  state: {
    theme: 'light',
    colors: lightColors
  },
  
  actions: {
    setTheme(newTheme) {
      this.theme = newTheme
      this.colors = newTheme === 'light' ? lightColors : darkColors
    }
  }
})
  <div class="app" :class="theme">
    <slot />
  </div>
@endprovider

@component('App')
  <theme-provider>
    <header />
    <main />
    <footer />
  </theme-provider>
@endcomponent
```

## State Debugging

### DevTools Integration

```typescript
const store = createStore({
  state: initialState,
  
  plugins: [
    devtools({
      enabled: process.env.NODE_ENV === 'development',
      name: 'STX App Store',
      trace: true,
      logActions: true,
      logMutations: true
    })
  ]
})
```

### Time Travel Debugging

```typescript
// Enable history tracking
const store = createStore({
  state: initialState,
  
  plugins: [
    history({
      maxHistoryLength: 50,
      debounce: 100
    })
  ]
})

// Time travel controls
store.history.undo()
store.history.redo()
store.history.jumpTo(10) // Jump to specific point
```

## Performance Optimization

### Selective Subscriptions

```stx
@component('UserProfile')
  <!-- Only subscribes to user.profile, not entire user object -->
  @connect(store, ['user.profile.name', 'user.profile.email'])
  
  <div class="profile">
    <h1>{{ user.profile.name }}</h1>
    <p>{{ user.profile.email }}</p>
  </div>
@endcomponent
```

### Memoization

```typescript
const store = createStore({
  state: {
    users: [],
    filters: { status: 'active', role: 'user' }
  },
  
  getters: {
    // Memoized getter - only recalculates when dependencies change
    filteredUsers: memoize((state) => {
      return state.users.filter(user => 
        user.status === state.filters.status &&
        user.role === state.filters.role
      )
    }, ['users', 'filters'])
  }
})
```

## Testing State

### State Testing

```typescript
import { createTestStore } from '@stx/testing'

describe('User Store', () => {
  let store
  
  beforeEach(() => {
    store = createTestStore({
      modules: { auth: authModule }
    })
  })
  
  test('login action', async () => {
    const credentials = { email: 'user@example.com', password: 'password' }
    
    await store.dispatch('auth/login', credentials)
    
    expect(store.state.auth.user).toBeTruthy()
    expect(store.getters['auth/isAuthenticated']).toBe(true)
  })
  
  test('logout action', () => {
    store.commit('auth/setUser', mockUser)
    
    store.dispatch('auth/logout')
    
    expect(store.state.auth.user).toBeNull()
  })
})
```

## Related Resources

- [State Guide](/guide/state) - Comprehensive state management guide
- [Component API](/api/component) - Component state management
- [Performance Guide](/guide/performance) - State performance optimization
- [Testing Guide](/guide/testing) - State testing strategies 