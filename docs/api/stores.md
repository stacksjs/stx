# Stores Reference

Stores provide shared reactive state across components. stx supports two styles: **setup function** (recommended) and **options object** (backward-compatible).

## defineStore

### Setup Function Style (Recommended)

```typescript
defineStore(id: string, setup: () => T, options?: StoreOptions): T
```

The setup function uses signals directly and returns an object of state, derived values, and actions.

```typescript
// stores/auth.ts
import { defineStore, state, derived } from '@stacksjs/stx'

export const authStore = defineStore('auth', () => {
  const user = state(null)
  const token = state('')
  const isAuthenticated = derived(() => !!user() && !!token())

  async function login(email: string, password: string) {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    user.set(data.user)
    token.set(data.token)
  }

  function logout() {
    user.set(null)
    token.set('')
  }

  return { user, isAuthenticated, token, login, logout }
})
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique store identifier |
| `setup` | `() => T` | Function that creates and returns store state/actions |
| `options` | `StoreOptions` | Optional persistence configuration |

**StoreOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `persist` | `boolean \| PersistConfig` | `false` | Enable state persistence |

**PersistConfig:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pick` | `string[]` | all keys | Which keys to persist |
| `storage` | `string` | `'localStorage'` | `'localStorage'` or `'sessionStorage'` |
| `key` | `string` | `'stx-store:<id>'` | Custom storage key |

```typescript
defineStore('cart', () => {
  const items = state([])
  const total = derived(() => items().reduce((sum, i) => sum + i.price, 0))

  function addItem(item) { items.update(arr => [...arr, item]) }
  function clear() { items.set([]) }

  return { items, total, addItem, clear }
}, {
  persist: {
    pick: ['items'],
    storage: 'localStorage',
    key: 'my-cart',
  },
})
```

### Options Object Style

```typescript
defineStore(id: string, options: DefineStoreOptions): DefinedStore
```

```typescript
// stores/counter.ts
import { defineStore } from '@stacksjs/stx'

export const counterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter',
  }),

  getters: {
    doubleCount: (state) => state.count * 2,
    displayName: (state) => `${state.name}: ${state.count}`,
  },

  actions: {
    increment() { this.count++ },
    decrement() { this.count-- },
    incrementBy(amount: number) { this.count += amount },
    async fetchCount() {
      const response = await fetch('/api/count')
      this.count = await response.json()
    },
  },

  persist: true,
})
```

**DefineStoreOptions:**

| Field | Type | Description |
|-------|------|-------------|
| `state` | `T \| () => T` | Initial state object or factory function |
| `getters` | `Record<string, (state: T) => any>` | Computed properties derived from state |
| `actions` | `Record<string, (...args) => any>` | Methods that mutate state. `this` is bound to the store proxy |
| `persist` | `boolean \| PersistOptions` | Enable persistence |
| `devtools` | `boolean` | Enable devtools integration (default: `true`) |

**Returned store proxy properties:**

| Property | Type | Description |
|----------|------|-------------|
| `$state` | `T` | Current state snapshot |
| `$id` | `string` | Store identifier |
| `$subscribe(cb)` | `(cb: (state, prev) => void) => Unsubscribe` | Subscribe to state changes |
| `$reset()` | `() => void` | Reset to initial state |
| `$patch(partial)` | `(partial: Partial<T> \| (state: T) => void) => void` | Partial state update |

State properties, getters, and actions are all accessible directly on the store:

```typescript
counterStore.count        // state property
counterStore.doubleCount  // getter
counterStore.increment()  // action
```

## useStore

```typescript
useStore(id: string): T
```

Retrieves a previously defined store by its ID. Throws if the store is not found.

```html
<script>
const auth = useStore('auth')
const isLoggedIn = auth.isAuthenticated
</script>

<div x-if="isLoggedIn()">
  <p x-text="'Welcome, ' + auth.user().name"></p>
</div>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The store ID passed to `defineStore()` |

> **Warning:** `useStore()` throws an error if called before the store is defined. See dependency ordering below.

## Auto-Discovery

Store files are auto-discovered from your `storesDir` (default: `stores/`). Any `.ts` file in that directory (except `index.ts`, `types.ts`, and `.d.ts` files) is automatically bundled and injected into the page.

```
stores/
  auth.ts       <- auto-loaded
  cart.ts       <- auto-loaded
  counter.ts    <- auto-loaded
  index.ts      <- skipped
  types.ts      <- skipped
```

### Dependency Ordering

Stores that call `useStore()` depend on other stores. The auto-loader sorts stores so that independent stores (those without `useStore()` calls) load first, and dependent stores load after.

```
auth.ts       <- no useStore() calls, loads first
cart.ts       <- calls useStore('auth'), loads second
```

### Import Stripping

Import statements are stripped from store files before bundling. `defineStore`, `state`, `derived`, `useStore`, and other stx APIs are available as globals in the browser runtime. You still write imports for TypeScript tooling — they are removed at build time.

## Store Lifecycle

1. **Define** — `defineStore('id', ...)` creates the store and registers it in `window.stx._stores`
2. **Inject** — The store loader bundles all store files into a single `<script>` tag, injected before any `<script client>` blocks
3. **Available** — `useStore('id')` can retrieve the store from any component
4. **Persist** — If persistence is enabled, state is saved to storage on every change
5. **SPA Navigation** — Stores survive SPA navigation (they are not cleaned up by `cleanupContainer`)

## Persistence

### Basic

```typescript
defineStore('settings', () => {
  const theme = state('light')
  const locale = state('en')
  return { theme, locale }
}, { persist: true })
```

Saves all returned signals to `localStorage` under the key `stx-store:settings`.

### Selective Persistence

```typescript
defineStore('user', () => {
  const profile = state(null)    // persisted
  const sessionToken = state('') // NOT persisted
  return { profile, sessionToken }
}, {
  persist: {
    pick: ['profile'],
    storage: 'localStorage',
    key: 'user-data',
  },
})
```

### Session Storage

```typescript
defineStore('form', () => {
  const draft = state({})
  return { draft }
}, {
  persist: { storage: 'sessionStorage' },
})
```

## SSR Hydration

Server-rendered pages can pre-populate store state via `window.__STX_STORE_STATE__`:

```html
<script>
  window.__STX_STORE_STATE__ = {
    auth: { user: { name: "Alice" }, token: "abc123" },
    cart: { items: [] },
  }
</script>
```

When the signals runtime initializes, it reads `window.__STX_STORE_STATE__` and hydrates each store with the corresponding state before any client-side code runs.

## Usage in Templates

### In `<script>` / `<script client>`

```html
<script>
const auth = useStore('auth')

effect(() => {
  if (!auth.isAuthenticated()) {
    navigate('/login')
  }
})
</script>
```

### With x-data

```html
<div x-data="{ cart: useStore('cart') }">
  <p x-text="'Items: ' + cart.items().length"></p>
  <button @click="cart.addItem({ name: 'Widget', price: 9.99 })">Add</button>
</div>
```

### Importing from @stores

```typescript
import { authStore, cartStore } from '@stores'
```

This is transformed at build time to:

```typescript
const { authStore, cartStore } = window.__STX_STORES__
```
