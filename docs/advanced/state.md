# Advanced State Management

This guide covers advanced state management patterns, optimization techniques, and architectural strategies for complex stx applications.

## State Architecture Patterns

### Store Composition

```typescript
// stores/index.ts
export interface RootState {
  auth: AuthState
  ui: UIState
  data: DataState
  features: FeatureState
}

export const rootStore = createStore<RootState>({
  modules: {
    auth: authModule,
    ui: uiModule,
    data: dataModule,
    features: featureModule
  },

  plugins: [
    persistencePlugin({
      key: 'stx-app',
      paths: ['auth.user', 'ui.preferences']
    }),
    devtoolsPlugin({ enabled: __DEV__ }),
    loggerPlugin({
      collapsed: true,
      logActions: true,
      logMutations: __DEV__
    })
  ]
})
```

### Module Federation

```typescript
// stores/modules/auth.ts
export const authModule = createModule({
  namespaced: true,

  state: (): AuthState => ({
    user: null,
    token: null,
    permissions: [],
    isAuthenticated: false,
    loginAttempts: 0,
    lastLoginAt: null
  }),

  getters: {
    isAdmin: (state): boolean =>
      state.user?.role === 'admin',

    hasPermission: (state) => (permission: string): boolean =>
      state.permissions.some(p => p.name === permission),

    canAccess: (state, getters) => (resource: string): boolean => {
      if (getters.isAdmin) return true
      return getters.hasPermission(`access:${resource}`)
    }
  },

  mutations: {
    SET_USER(state, user: User) {
      state.user = user
      state.isAuthenticated = !!user
      state.lastLoginAt = user ? new Date().toISOString() : null
    },

    SET_TOKEN(state, token: string) {
      state.token = token
    },

    SET_PERMISSIONS(state, permissions: Permission[]) {
      state.permissions = permissions
    },

    INCREMENT_LOGIN_ATTEMPTS(state) {
      state.loginAttempts++
    },

    RESET_LOGIN_ATTEMPTS(state) {
      state.loginAttempts = 0
    }
  },

  actions: {
    async login({ commit, dispatch }, credentials: LoginCredentials) {
      try {
        const response = await authAPI.login(credentials)

        commit('SET_USER', response.user)
        commit('SET_TOKEN', response.token)
        commit('SET_PERMISSIONS', response.permissions)
        commit('RESET_LOGIN_ATTEMPTS')

        // Set token for API calls
        dispatch('setAuthHeader', response.token, { root: true })

        return response
      } catch (error) {
        commit('INCREMENT_LOGIN_ATTEMPTS')
        throw error
      }
    }
  }
})
```

## Advanced State Patterns

### Event Sourcing

```typescript
// stores/event-sourcing.ts
interface Event {
  type: string
  payload: any
  timestamp: number
  userId?: string
}

export class EventStore {
  private events: Event[] = []
  private snapshots = new Map<number, any>()

  dispatch(event: Event) {
    this.events.push({
      ...event,
      timestamp: Date.now()
    })

    // Create snapshot every 100 events
    if (this.events.length % 100 === 0) {
      this.createSnapshot()
    }
  }

  replay(fromTimestamp?: number): any {
    const relevantEvents = fromTimestamp
      ? this.events.filter(e => e.timestamp >= fromTimestamp)
      : this.events

    return relevantEvents.reduce((state, event) => {
      return this.applyEvent(state, event)
    }, this.getInitialState())
  }

  private createSnapshot() {
    const currentState = this.replay()
    this.snapshots.set(this.events.length, currentState)
  }

  private applyEvent(state: any, event: Event): any {
    switch (event.type) {
      case 'USER_CREATED':
        return {
          ...state,
          users: [...state.users, event.payload]
        }

      case 'USER_UPDATED':
        return {
          ...state,
          users: state.users.map(user =>
            user.id === event.payload.id
              ? { ...user, ...event.payload.changes }
              : user
          )
        }

      default:
        return state
    }
  }
}
```

### CQRS Pattern

```typescript
// stores/cqrs.ts
interface Command {
  type: string
  payload: any
  metadata?: any
}

interface Query {
  type: string
  params?: any
}

export class CQRSStore {
  private writeStore = new Map<string, any>()
  private readStore = new Map<string, any>()
  private projections = new Map<string, (event: Event) => void>()

  // Command side (writes)
  async execute(command: Command): Promise<void> {
    const events = await this.handleCommand(command)

    for (const event of events) {
      // Apply to write store
      this.applyEvent(event)

      // Update read projections
      this.updateProjections(event)
    }
  }

  // Query side (reads)
  query(query: Query): any {
    switch (query.type) {
      case 'GET_USER_PROFILE':
        return this.readStore.get(`user_profile:${query.params.userId}`)

      case 'GET_USER_LIST':
        return this.readStore.get('user_list') || []

      default:
        throw new Error(`Unknown query type: ${query.type}`)
    }
  }

  private async handleCommand(command: Command): Promise<Event[]> {
    switch (command.type) {
      case 'CREATE_USER':
        return [{
          type: 'USER_CREATED',
          payload: command.payload,
          timestamp: Date.now()
        }]

      default:
        throw new Error(`Unknown command type: ${command.type}`)
    }
  }

  private updateProjections(event: Event) {
    for (const [name, projection] of this.projections) {
      try {
        projection(event)
      } catch (error) {
        console.error(`Projection ${name} failed:`, error)
      }
    }
  }

  registerProjection(name: string, projection: (event: Event) => void) {
    this.projections.set(name, projection)
  }
}
```

## State Optimization

### Memoized Selectors

```typescript
// stores/selectors.ts
import { createSelector } from '@stx/state'

// Basic selector
const getUsers = (state: RootState) => state.data.users

// Memoized selector
const getActiveUsers = createSelector(
  [getUsers],
  (users) => users.filter(user => user.status === 'active')
)

// Complex memoized selector
const getUsersByRole = createSelector(
  [getUsers, (state: RootState, role: string) => role],
  (users, role) => users.filter(user => user.role === role)
)

// Selector with multiple dependencies
const getUserStats = createSelector(
  [getUsers, getActiveUsers],
  (allUsers, activeUsers) => ({
    total: allUsers.length,
    active: activeUsers.length,
    inactive: allUsers.length - activeUsers.length,
    percentage: (activeUsers.length / allUsers.length) * 100
  })
)

// Usage in components
@component('UserStats')
  @computed({
    userStats: () => getUserStats(store.state),
    adminUsers: () => getUsersByRole(store.state, 'admin')
  })
@endcomponent
```

### State Normalization

```typescript
// stores/normalization.ts
interface NormalizedState<T> {
  byId: Record<string, T>
  allIds: string[]
}

export function normalizeEntities<T extends { id: string }>(
  entities: T[]
): NormalizedState<T> {
  return {
    byId: entities.reduce((acc, entity) => {
      acc[entity.id] = entity
      return acc
    }, {} as Record<string, T>),
    allIds: entities.map(entity => entity.id)
  }
}

export function denormalizeEntities<T>(
  normalized: NormalizedState<T>
): T[] {
  return normalized.allIds.map(id => normalized.byId[id])
}

// Usage in store
const dataModule = createModule({
  state: (): DataState => ({
    users: { byId: {}, allIds: [] },
    posts: { byId: {}, allIds: [] }
  }),

  mutations: {
    SET_USERS(state, users: User[]) {
      state.users = normalizeEntities(users)
    },

    ADD_USER(state, user: User) {
      state.users.byId[user.id] = user
      if (!state.users.allIds.includes(user.id)) {
        state.users.allIds.push(user.id)
      }
    },

    UPDATE_USER(state, { id, changes }: { id: string, changes: Partial<User> }) {
      if (state.users.byId[id]) {
        state.users.byId[id] = { ...state.users.byId[id], ...changes }
      }
    },

    REMOVE_USER(state, id: string) {
      delete state.users.byId[id]
      state.users.allIds = state.users.allIds.filter(userId => userId !== id)
    }
  },

  getters: {
    allUsers: (state) => denormalizeEntities(state.users),
    getUserById: (state) => (id: string) => state.users.byId[id]
  }
})
```

## Async State Management

### Resource Management

```typescript
// stores/resources.ts
interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch: number | null
  stale: boolean
}

export function createResource<T, P = any>(config: {
  fetcher: (params: P) => Promise<T>
  key: (params: P) => string
  staleTime?: number
  cacheTime?: number
}) {
  const cache = new Map<string, ResourceState<T>>()

  return {
    async get(params: P): Promise<ResourceState<T>> {
      const key = config.key(params)
      const existing = cache.get(key)

      // Return cached data if fresh
      if (existing && !this.isStale(existing)) {
        return existing
      }

      // Set loading state
      const loadingState: ResourceState<T> = {
        data: existing?.data || null,
        loading: true,
        error: null,
        lastFetch: existing?.lastFetch || null,
        stale: false
      }
      cache.set(key, loadingState)

      try {
        const data = await config.fetcher(params)
        const successState: ResourceState<T> = {
          data,
          loading: false,
          error: null,
          lastFetch: Date.now(),
          stale: false
        }
        cache.set(key, successState)
        return successState
      } catch (error) {
        const errorState: ResourceState<T> = {
          data: existing?.data || null,
          loading: false,
          error: error.message,
          lastFetch: existing?.lastFetch || null,
          stale: true
        }
        cache.set(key, errorState)
        return errorState
      }
    },

    invalidate(params: P) {
      const key = config.key(params)
      const existing = cache.get(key)
      if (existing) {
        cache.set(key, { ...existing, stale: true })
      }
    },

    isStale(state: ResourceState<T>): boolean {
      if (!state.lastFetch) return true
      const staleTime = config.staleTime || 5 * 60 * 1000 // 5 minutes
      return Date.now() - state.lastFetch > staleTime
    }
  }
}

// Usage
const userResource = createResource({
  fetcher: (id: string) => userAPI.get(id),
  key: (id: string) => `user:${id}`,
  staleTime: 5 * 60 * 1000 // 5 minutes
})

@component('UserProfile')
  @state({
    userState: null as ResourceState<User> | null
  })

  @mounted(async () => {
    userState = await userResource.get(userId)
  })
@endcomponent
```

### Optimistic Updates

```typescript
// stores/optimistic.ts
interface OptimisticUpdate<T> {
  id: string
  type: 'create' | 'update' | 'delete'
  data: T
  rollback: () => void
  timestamp: number
}

export class OptimisticManager<T> {
  private updates = new Map<string, OptimisticUpdate<T>>()

  applyOptimistic(
    id: string,
    type: 'create' | 'update' | 'delete',
    data: T,
    rollback: () => void
  ) {
    this.updates.set(id, {
      id,
      type,
      data,
      rollback,
      timestamp: Date.now()
    })
  }

  confirmUpdate(id: string) {
    this.updates.delete(id)
  }

  rollbackUpdate(id: string) {
    const update = this.updates.get(id)
    if (update) {
      update.rollback()
      this.updates.delete(id)
    }
  }

  rollbackAll() {
    for (const update of this.updates.values()) {
      update.rollback()
    }
    this.updates.clear()
  }

  getAll(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values())
  }
}

// Usage in store actions
const userModule = createModule({
  actions: {
    async createUser({ commit, state }, userData: CreateUserData) {
      const optimisticId = generateId()
      const optimisticUser = { ...userData, id: optimisticId, pending: true }

      // Apply optimistic update
      commit('ADD_USER', optimisticUser)

      try {
        const realUser = await userAPI.create(userData)

        // Replace optimistic user with real one
        commit('REMOVE_USER', optimisticId)
        commit('ADD_USER', realUser)

        return realUser
      } catch (error) {
        // Rollback optimistic update
        commit('REMOVE_USER', optimisticId)
        throw error
      }
    }
  }
})
```

## State Persistence

### Advanced Persistence

```typescript
// stores/persistence.ts
interface PersistenceConfig {
  key: string
  paths?: string[]
  storage?: Storage
  serialize?: (state: any) => string
  deserialize?: (stored: string) => any
  throttle?: number
  encrypt?: boolean
}

export function createPersistencePlugin(config: PersistenceConfig) {
  let throttleTimer: number | null = null

  return (store: Store) => {
    // Load persisted state
    const stored = loadState(config)
    if (stored) {
      store.replaceState(mergeState(store.state, stored))
    }

    // Subscribe to changes
    store.subscribe((mutation, state) => {
      if (config.throttle) {
        if (throttleTimer) clearTimeout(throttleTimer)
        throttleTimer = setTimeout(() => {
          saveState(state, config)
        }, config.throttle)
      } else {
        saveState(state, config)
      }
    })
  }
}

function loadState(config: PersistenceConfig): any {
  try {
    const storage = config.storage || localStorage
    const stored = storage.getItem(config.key)

    if (!stored) return null

    const deserialize = config.deserialize || JSON.parse
    let data = deserialize(stored)

    if (config.encrypt) {
      data = decrypt(data)
    }

    return data
  } catch (error) {
    console.error('Failed to load persisted state:', error)
    return null
  }
}

function saveState(state: any, config: PersistenceConfig) {
  try {
    const storage = config.storage || localStorage

    let dataToSave = config.paths
      ? pickPaths(state, config.paths)
      : state

    if (config.encrypt) {
      dataToSave = encrypt(dataToSave)
    }

    const serialize = config.serialize || JSON.stringify
    storage.setItem(config.key, serialize(dataToSave))
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}
```

## State Testing

### Advanced Testing Patterns

```typescript
// tests/store.test.ts
import { createTestStore, StoreTestUtils } from '@stx/testing'

describe('Advanced Store Testing', () => {
  let store: Store
  let utils: StoreTestUtils

  beforeEach(() => {
    store = createTestStore({
      modules: { user: userModule }
    })
    utils = new StoreTestUtils(store)
  })

  test('handles complex async workflows', async () => {
    const mockAPI = utils.mockAPI({
      'POST /api/users': { delay: 100, response: { id: 1, name: 'John' } },
      'GET /api/users/1': { response: { id: 1, name: 'John', posts: [] } }
    })

    // Start user creation
    const createPromise = store.dispatch('user/create', { name: 'John' })

    // Should show loading state
    expect(store.state.user.creating).toBe(true)

    // Wait for creation
    const user = await createPromise

    expect(store.state.user.creating).toBe(false)
    expect(store.state.user.users.byId[user.id]).toEqual(user)

    // Verify API calls
    expect(mockAPI.history.post).toHaveLength(1)
  })

  test('state time travel', async () => {
    const stateHistory = utils.captureHistory()

    store.commit('user/ADD_USER', { id: 1, name: 'John' })
    store.commit('user/ADD_USER', { id: 2, name: 'Jane' })
    store.commit('user/REMOVE_USER', 1)

    expect(stateHistory.length).toBe(4) // initial + 3 mutations

    // Travel back to state with both users
    utils.restoreState(stateHistory[2])

    expect(Object.keys(store.state.user.users.byId)).toHaveLength(2)
  })
})
```

## Related Resources

- [State Management Guide](/guide/state) - Basic state management concepts
- [Component State](/features/state) - Component-level state features
- [Performance Optimization](/guide/performance) - State performance patterns
- [Testing State](/features/testing) - State testing strategies
