# State Management API Reference

This document covers STX's state management system, including store creation, state mutations, actions, and plugins.

## Store Setup

### Basic Store

```ts
import { createStore } from '@stacksjs/stx/store'

const store = createStore({
  // Initial state
  state: {
    count: 0,
    user: null,
    todos: []
  },
  
  // Computed state
  getters: {
    doubleCount: state => state.count * 2,
    completedTodos: state => state.todos.filter(todo => todo.completed)
  },
  
  // Synchronous state changes
  mutations: {
    increment(state) {
      state.count++
    },
    setUser(state, user) {
      state.user = user
    }
  },
  
  // Asynchronous operations
  actions: {
    async fetchUser({ commit }, id) {
      const user = await api.getUser(id)
      commit('setUser', user)
    }
  }
})
```

### Store Configuration

```ts
interface StoreOptions {
  // State object/function
  state?: State | (() => State)
  
  // Getters object
  getters?: GetterTree
  
  // Mutations object
  mutations?: MutationTree
  
  // Actions object
  actions?: ActionTree
  
  // Modules object
  modules?: ModuleTree
  
  // Plugin array
  plugins?: Plugin[]
  
  // Strict mode
  strict?: boolean
  
  // Dev tools
  devtools?: boolean
}
```

## State Management

### Accessing State

```ts
// Direct state access
console.log(store.state.count)

// Using getters
console.log(store.getters.doubleCount)

// In components
const MyComponent = defineComponent({
  setup() {
    // Access state
    const count = computed(() => store.state.count)
    
    // Access getters
    const doubleCount = computed(() => store.getters.doubleCount)
    
    return {
      count,
      doubleCount
    }
  }
})
```

### Mutating State

```ts
// Commit mutations
store.commit('increment')
store.commit('setUser', { id: 1, name: 'John' })

// With payload object
store.commit({
  type: 'setUser',
  user: { id: 1, name: 'John' }
})

// In components
const MyComponent = defineComponent({
  setup() {
    const increment = () => store.commit('increment')
    const setUser = user => store.commit('setUser', user)
    
    return {
      increment,
      setUser
    }
  }
})
```

## Actions

### Dispatching Actions

```ts
// Basic dispatch
store.dispatch('fetchUser', 1)

// With payload object
store.dispatch({
  type: 'fetchUser',
  id: 1
})

// Async/await
async function loadUser(id) {
  try {
    await store.dispatch('fetchUser', id)
    console.log('User loaded')
  } catch (error) {
    console.error('Failed to load user:', error)
  }
}

// In components
const MyComponent = defineComponent({
  setup() {
    const loadUser = id => store.dispatch('fetchUser', id)
    
    return {
      loadUser
    }
  }
})
```

### Action Handlers

```ts
const store = createStore({
  actions: {
    // Simple action
    increment({ commit }) {
      commit('increment')
    },
    
    // Async action
    async fetchUser({ commit }, id) {
      try {
        const user = await api.getUser(id)
        commit('setUser', user)
        return user
      } catch (error) {
        commit('setError', error)
        throw error
      }
    },
    
    // Action with multiple mutations
    async updateUser({ commit, state }, userData) {
      commit('setLoading', true)
      try {
        const user = await api.updateUser(state.user.id, userData)
        commit('setUser', user)
        commit('setSuccess', 'User updated')
      } catch (error) {
        commit('setError', error)
      } finally {
        commit('setLoading', false)
      }
    }
  }
})
```

## Modules

### Module Definition

```ts
const userModule = {
  namespaced: true,
  
  state: () => ({
    user: null,
    profile: null
  }),
  
  getters: {
    isAdmin: state => state.user?.role === 'admin'
  },
  
  mutations: {
    setUser(state, user) {
      state.user = user
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      const user = await api.login(credentials)
      commit('setUser', user)
    }
  }
}

const store = createStore({
  modules: {
    user: userModule
  }
})
```

### Accessing Modules

```ts
// Access module state
console.log(store.state.user.profile)

// Access module getters
console.log(store.getters['user/isAdmin'])

// Commit module mutations
store.commit('user/setUser', { id: 1 })

// Dispatch module actions
store.dispatch('user/login', {
  username: 'john',
  password: '****'
})

// In components
const MyComponent = defineComponent({
  setup() {
    // Access module state/getters
    const user = computed(() => store.state.user.user)
    const isAdmin = computed(() => store.getters['user/isAdmin'])
    
    // Module actions
    const login = credentials => store.dispatch('user/login', credentials)
    
    return {
      user,
      isAdmin,
      login
    }
  }
})
```

## Plugins

### Plugin Development

```ts
// Simple logger plugin
function loggerPlugin(store) {
  store.subscribe((mutation, state) => {
    console.log('Mutation:', mutation.type)
    console.log('Payload:', mutation.payload)
    console.log('State:', state)
  })
}

// Persistence plugin
function persistencePlugin(store) {
  // Restore state
  const savedState = localStorage.getItem('vuex')
  if (savedState) {
    store.replaceState(JSON.parse(savedState))
  }
  
  // Save state changes
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex', JSON.stringify(state))
  })
}

// Use plugins
const store = createStore({
  plugins: [loggerPlugin, persistencePlugin]
})
```

### Advanced Plugins

```ts
// Action subscriber plugin
function actionSubscriber(store) {
  store.subscribeAction({
    before: (action, state) => {
      console.log('Before action:', action.type)
    },
    after: (action, state) => {
      console.log('After action:', action.type)
    },
    error: (action, state, error) => {
      console.error('Action error:', error)
    }
  })
}

// State watch plugin
function stateWatcher(store) {
  store.watch(
    state => state.count,
    newValue => {
      console.log('Count changed:', newValue)
    }
  )
}

// Dynamic module plugin
function dynamicModulePlugin(store) {
  // Register module
  store.registerModule('dynamic', {
    state: () => ({ /* ... */ })
  })
  
  // Unregister on cleanup
  return () => {
    store.unregisterModule('dynamic')
  }
}
```

## Store Composition

### Composable Store

```ts
import { createStore, useStore } from '@stacksjs/stx/store'

// Create store with composition API
export function useCounter() {
  const store = useStore()
  
  return {
    // State as refs
    count: computed(() => store.state.count),
    double: computed(() => store.getters.doubleCount),
    
    // Actions as methods
    increment: () => store.commit('increment'),
    async fetch: () => store.dispatch('fetchCount')
  }
}

// Use in components
const MyComponent = defineComponent({
  setup() {
    const { count, double, increment, fetch } = useCounter()
    
    return {
      count,
      double,
      increment,
      fetch
    }
  }
})
```

### Store Helpers

```ts
import { mapState, mapGetters, mapMutations, mapActions } from '@stacksjs/stx/store'

const MyComponent = defineComponent({
  computed: {
    // Map state to computed properties
    ...mapState(['count', 'user']),
    ...mapState({
      myCount: state => state.count
    }),
    
    // Map getters
    ...mapGetters(['doubleCount', 'isAdmin'])
  },
  
  methods: {
    // Map mutations to methods
    ...mapMutations(['increment', 'setUser']),
    ...mapMutations({
      add: 'increment'
    }),
    
    // Map actions
    ...mapActions(['fetchUser', 'login'])
  }
})
```

## Next Steps

- Explore [Core API](/api/core)
- Check out [Component API](/api/components)
- Learn about [Helper Functions](/api/helpers)
- Review [Router API](/api/router) 