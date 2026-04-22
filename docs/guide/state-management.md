# State Management

stx provides two levels of state management: **local state** with `state()` for page-specific reactivity, and **stores** with `defineStore()` for state shared across pages. This guide covers when to use each and how they work.

## Decision Tree

Ask yourself one question: **Is this state shared across pages?**

- **No** --> Use `state()` in your `<script client>` block
- **Yes** --> Use `defineStore()` in a store file

That is the entire decision. Do not overcomplicate it.

### What Stays as Local `state()`

- Form input values (`state('')` for a search box)
- UI toggles (`state(false)` for a dropdown or modal)
- Loading flags (`state(true)` while fetching page-specific data)
- Page-specific data (`state(null)` for API response data)
- Temporary values that reset on navigation

### What Goes in a Store

- Authentication state (current user, token, login status)
- Shopping cart contents
- User preferences (theme, language, sidebar state)
- Any data that must survive SPA navigation between pages

## Local State with `state()`

The `state()` function creates a reactive signal. When its value changes, any template binding that reads it automatically updates.

```html
<script client>
const count = state(0)
const name = state('World')
const items = state([])

function addItem(item) {
  items.update(arr => [...arr, item])
}
</script>

<p>Hello, <span x-text="name()"></span>!</p>
<p>Count: <span x-text="count()"></span></p>
<button @click="count.set(count() + 1)">Increment</button>
```

### Signal API

```typescript
const count = state(0)

// Read the value
count()              // 0

// Set a new value
count.set(5)         // now 5

// Update based on current value
count.update(n => n + 1)  // now 6

// Subscribe to changes
const unsub = count.subscribe((value, prev) => {
  console.log(`Changed from ${prev} to ${value}`)
})
unsub()  // stop listening
```

### Derived State

Use `derived()` for values computed from other signals:

```html
<script client>
const price = state(100)
const quantity = state(1)
const total = derived(() => price() * quantity())
const formatted = derived(() => `$${total().toFixed(2)}`)
</script>

<p>Total: <span x-text="formatted()"></span></p>
```

Derived signals automatically re-compute when any signal they read changes. You never manually invalidate them.

### Effects

Use `effect()` to run side effects when signals change:

```html
<script client>
const query = state('')

effect(() => {
  const q = query()
  if (q.length >= 3) {
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(results => searchResults.set(results))
  }
})
</script>
```

## Stores with `defineStore()`

Stores are for state that must persist across SPA page navigations. They live in the `stores/` directory (configurable via `storesDir` in your config).

### Creating a Store

```typescript
// stores/auth.ts
import { defineStore, state, derived } from '@stacksjs/stx'

export const useAuthStore = defineStore('auth', () => {
  const user = state(null)
  const token = state(null)
  const isAuthenticated = derived(() => !!token())

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    token.set(data.token)
    user.set(data.user)
  }

  function logout() {
    token.set(null)
    user.set(null)
    navigate('/login')
  }

  return { user, token, isAuthenticated, login, logout }
})
```

### Using a Store

In any page's `<script client>` block, retrieve the store with `useStore()`:

```html
<script client>
const auth = useStore('auth')

onMount(() => {
  if (!auth.isAuthenticated()) {
    navigate('/login')
  }
})
</script>

<div :show="auth.isAuthenticated()">
  <p>Welcome, <span x-text="auth.user()?.name"></span></p>
  <button @click="auth.logout()">Log out</button>
</div>
```

`useStore()` returns the store object. It throws an error if the store is not found -- it never returns null.

### Auto-Discovery

stx automatically discovers store files:

1. On startup, stx scans `storesDir` (default: `stores/`) for `.ts` files
2. Each file is transpiled (TypeScript stripped) and bundled
3. The bundled stores are injected as a `<script>` tag before any `<script client>` blocks
4. `defineStore()`, `state()`, `derived()`, and `useStore()` are available as globals in the browser

This means you do not need to import anything in your `.stx` pages. The store is registered automatically:

```html
<!-- No imports needed -- stores are globals -->
<script client>
const cart = useStore('cart')
</script>
```

In `.ts` files (the store definitions themselves), you do need explicit imports:

```typescript
// stores/cart.ts
import { defineStore, state, derived } from '@stacksjs/stx'

export const useCartStore = defineStore('cart', () => {
  // ...
})
```

### Store Dependency Order

Stores are loaded in dependency order. If store A calls `useStore('B')`, store B is loaded first:

```typescript
// stores/auth.ts -- loaded first (no useStore calls)
export const useAuthStore = defineStore('auth', () => {
  const token = state(null)
  return { token }
})

// stores/api.ts -- loaded second (depends on auth)
export const useApiStore = defineStore('api', () => {
  const auth = useStore('auth')

  async function fetchWithAuth(url) {
    return fetch(url, {
      headers: { Authorization: `Bearer ${auth.token()}` },
    })
  }

  return { fetchWithAuth }
})
```

stx detects `useStore()` calls in store files and sorts them: stores without `useStore()` load first, stores with `useStore()` load after.

### Persistence

Add `{ persist: true }` to save store state to localStorage and restore it on page load:

```typescript
// stores/preferences.ts
import { defineStore, state } from '@stacksjs/stx'

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = state('light')
  const language = state('en')
  const sidebarOpen = state(true)

  return { theme, language, sidebarOpen }
}, { persist: true })
```

For fine-grained control:

```typescript
defineStore('preferences', () => {
  // ...
}, {
  persist: {
    pick: ['theme', 'language'],  // Only persist these keys
    storage: 'local',             // 'local', 'session', or 'memory'
    key: 'app-prefs',             // Custom localStorage key
  },
})
```

### SSR Hydration

In SSR mode, stores can be hydrated from the server. The server injects `window.__STX_STORE_STATE__` with initial store values, and the client picks them up on load.

## Complete Example: E-Commerce Cart

### Store Definition

```typescript
// stores/cart.ts
import { defineStore, state, derived } from '@stacksjs/stx'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = state<CartItem[]>([])

  const count = derived(() =>
    items().reduce((sum, item) => sum + item.quantity, 0)
  )

  const total = derived(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addItem(product: { id: string, name: string, price: number }) {
    items.update(current => {
      const existing = current.find(i => i.id === product.id)
      if (existing) {
        return current.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  function removeItem(id: string) {
    items.update(current => current.filter(i => i.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) return removeItem(id)
    items.update(current =>
      current.map(i => i.id === id ? { ...i, quantity } : i)
    )
  }

  function clear() {
    items.set([])
  }

  return { items, count, total, addItem, removeItem, updateQuantity, clear }
}, { persist: true })
```

### Product Page

```html
<script server>
const product = await fetch(`https://api.example.com/products/${params.id}`).then(r => r.json())

useSeoMeta({
  title: product.name,
  description: product.description,
})
</script>

<script client>
const cart = useStore('cart')
const added = state(false)

function addToCart() {
  cart.addItem({
    id: '{{ product.id }}',
    name: '{{ product.name }}',
    price: {{ product.price }},
  })
  added.set(true)
  setTimeout(() => added.set(false), 2000)
}
</script>

<h1>{{ product.name }}</h1>
<p>{{ product.description }}</p>
<p>${{ product.price }}</p>

<button @click="addToCart()">
  <span :show="!added()">Add to Cart</span>
  <span :show="added()">Added!</span>
</button>

<p>Cart: <span x-text="cart.count()"></span> items</p>
```

### Cart Page

```html
<script server>
useSeoMeta({ title: 'Shopping Cart' })
</script>

<script client>
const cart = useStore('cart')
</script>

<h1>Shopping Cart</h1>

<div :show="cart.count() === 0">
  <p>Your cart is empty.</p>
  <button @click="navigate('/products')">Browse Products</button>
</div>

<div :show="cart.count() > 0">
  <div :for="item in cart.items()" :key="item.id" class="flex justify-between py-4 border-b">
    <div>
      <p x-text="item.name" class="font-medium"></p>
      <p class="text-gray-500">$<span x-text="item.price.toFixed(2)"></span></p>
    </div>
    <div class="flex items-center gap-2">
      <button @click="cart.updateQuantity(item.id, item.quantity - 1)">-</button>
      <span x-text="item.quantity"></span>
      <button @click="cart.updateQuantity(item.id, item.quantity + 1)">+</button>
      <button @click="cart.removeItem(item.id)" class="text-red-500 ml-4">Remove</button>
    </div>
  </div>

  <div class="mt-6 text-right">
    <p class="text-xl font-bold">Total: $<span x-text="cart.total().toFixed(2)"></span></p>
    <button @click="navigate('/checkout')" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded">
      Checkout
    </button>
  </div>
</div>
```

## Stores Survive SPA Navigation

Store state persists across SPA page navigations. When a user navigates from `/products` to `/cart`, the cart store retains its items. This is fundamental -- stores are not cleaned up during navigation.

Local `state()` values, by contrast, are re-created when a page's `<script client>` re-executes after navigation.

## Anti-Patterns

> **Using `state()` for data shared across pages.**
> If two pages need the same data, it belongs in a store. Local `state()` is recreated on each page load.

> **Using `x-data` for state management.**
> The `x-data` attribute (Alpine-style reactivity) is available but not recommended for new code. Use `<script client>` with `state()` and composables instead. `x-data` does not compose well and cannot share state across pages.

> **Creating a store for page-local state.**
> A modal open/close flag, a form's loading state, or a search input value do not need to be in a store. Use `state()` in `<script client>`.

> **Importing store files directly instead of using `useStore()`.**
> Stores are registered globally by the auto-loader. Always access them via `useStore('name')`. Direct imports may create duplicate instances.

> **Forgetting that `useStore()` throws if the store is not found.**
> Double-check that your store file is in `storesDir` and uses `defineStore()`. If the file is named `types.ts` or `index.ts`, it is skipped by the auto-loader.

## Quick Reference

| What | Where | API |
|---|---|---|
| Page-local reactive value | `<script client>` | `const x = state(initial)` |
| Computed value | `<script client>` | `const x = derived(() => ...)` |
| Side effect | `<script client>` | `effect(() => { ... })` |
| Batch updates | `<script client>` | `batch(() => { a.set(1); b.set(2) })` |
| Cross-page state | `stores/*.ts` | `defineStore('name', () => { ... })` |
| Access store | `<script client>` | `const s = useStore('name')` |
| Persist store | `stores/*.ts` | `defineStore('name', fn, { persist: true })` |
| Read signal | Anywhere | `count()` |
| Write signal | Anywhere | `count.set(value)` |
| Update signal | Anywhere | `count.update(fn)` |
