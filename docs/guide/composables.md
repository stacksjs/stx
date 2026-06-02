# Composables

Composables are reusable functions that encapsulate logic. They are the primary way to share behavior across pages and components in stx. If you find yourself writing the same logic in multiple places, extract it into a composable.

## Convention

- Put composables in the `functions/` directory (auto-discovered by stx)
- Name them with the `use` prefix: `useAuth()`, `useDark()`, `useFetch()`
- Export a single function per file
- Composables can use signals, lifecycle hooks, and other composables

```
functions/
  useAuth.ts
  useDark.ts
  useDebounce.ts
  useFetch.ts
  useLocalStorage.ts
  useMediaQuery.ts
```

## Basic Composable

A composable is just a function that returns reactive state and methods:

```typescript
// functions/useCounter.ts
import { state, derived } from '@stacksjs/stx'

export function useCounter(initial = 0) {
  const count = state(initial)
  const doubled = derived(() => count() * 2)
  const isPositive = derived(() => count() > 0)

  function increment() {
    count.update(n => n + 1)
  }

  function decrement() {
    count.update(n => n - 1)
  }

  function reset() {
    count.set(initial)
  }

  return { count, doubled, isPositive, increment, decrement, reset }
}
```

Use it in a page:

```html
<script client>
const { count, doubled, increment, decrement, reset } = useCounter(10)
</script>

<div>
  <p>Count: <span x-text="count()"></span></p>
  <p>Doubled: <span x-text="doubled()"></span></p>
  <button @click="increment()">+</button>
  <button @click="decrement()">-</button>
  <button @click="reset()">Reset</button>
</div>
```

## Real-World Examples

### useAuth

```typescript
// functions/useAuth.ts
import { state, derived } from '@stacksjs/stx'

export function useAuth() {
  const user = state(null)
  const token = state(null)
  const loading = state(false)
  const isAuthenticated = derived(() => !!token())

  async function login(email: string, password: string) {
    loading.set(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) throw new Error('Login failed')

      const data = await res.json()
      token.set(data.token)
      user.set(data.user)
      navigate('/dashboard')
    } catch (e) {
      throw e
    } finally {
      loading.set(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    token.set(null)
    user.set(null)
    navigate('/login')
  }

  async function checkAuth() {
    const stored = localStorage.getItem('auth_token')
    if (!stored) return

    token.set(stored)
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored}` },
      })
      if (res.ok) {
        user.set(await res.json())
      } else {
        token.set(null)
      }
    } catch {
      token.set(null)
    }
  }

  return { user, token, loading, isAuthenticated, login, logout, checkAuth }
}
```

### useDark

```typescript
// functions/useDark.ts
import { state, effect } from '@stacksjs/stx'

export function useDark() {
  const isDark = state(false)

  // Initialize from system preference or stored preference
  function init() {
    const stored = localStorage.getItem('theme')
    if (stored) {
      isDark.set(stored === 'dark')
    } else {
      isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }

  // Sync to DOM and localStorage
  effect(() => {
    const dark = isDark()
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  })

  function toggle() {
    isDark.set(!isDark())
  }

  return { isDark, toggle, init }
}
```

### useDebounce

```typescript
// functions/useDebounce.ts
import { state, effect } from '@stacksjs/stx'

export function useDebounce<T>(source: () => T, delay = 300) {
  const debounced = state(source())
  let timeout: ReturnType<typeof setTimeout>

  effect(() => {
    const value = source()
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.set(value)
    }, delay)
  })

  return debounced
}
```

### useFetch

```typescript
// functions/useFetch.ts
import { state } from '@stacksjs/stx'

export function useFetch<T>(url: string, options?: RequestInit) {
  const data = state<T | null>(null)
  const error = state<string | null>(null)
  const loading = state(true)

  async function execute() {
    loading.set(true)
    error.set(null)

    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data.set(await res.json())
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      loading.set(false)
    }
  }

  async function refresh() {
    await execute()
  }

  // Auto-execute on creation
  execute()

  return { data, error, loading, refresh }
}
```

Usage:

```html
<script client>
const { data: users, loading, error, refresh } = useFetch('/api/users')
</script>

<div :show="loading()">Loading...</div>
<div :show="error()" class="text-red-500" x-text="error()"></div>
<div :show="!loading() && !error()">
  <button @click="refresh()">Refresh</button>
  <ul>
    <li :for="user in users()" :key="user.id" x-text="user.name"></li>
  </ul>
</div>
```

### useOptimistic

React-19-style optimistic state, adapted to signals. Shows an immediate value
layered on top of a base signal while an async action is in flight, then falls
back to the base as the source of truth once the real update lands — so you stop
hand-rolling snapshot/rollback in every mutation.

`useOptimistic(base, reducer)` returns `[optimistic, addOptimistic]`:

- **`optimistic`** — a derived signal: `base` with every pending action folded in
  via `reducer`. Read it in templates as the bare name (`optimistic`), in scripts
  as a call (`optimistic()`).
- **`addOptimistic(action)`** — queues an optimistic action (visible immediately)
  and returns a `settle()` to remove it. Pass a promise as the 2nd arg to auto-settle.

Pass the **signal** (or a getter) as `base` so the overlay stays reactive — unlike
React there's no render cycle to re-read a plain value.

```html
<script client>
  const likes = useStore('reviews').likes   // a shared signal
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (cur, delta) => cur + delta)

  async function toggleLike() {
    const settle = addOptimistic(liked() ? -1 : 1)   // optimisticLikes() updates instantly
    try {
      await authFetch('/api/reviews/16/like', { method: 'POST' })
      // On success the store updates `likes` → the overlay is discarded automatically.
    }
    catch {
      settle()   // On error, base never changed — roll back this entry.
    }
  }
</script>

<button @click="toggleLike()">
  ♥ <span x-text="optimisticLikes"></span>
</button>
```

The overlay is discarded the moment `base` changes (the server/store confirmed the
real value), so the happy path needs no cleanup. For list mutations the reducer can
append: `useOptimistic(comments, (list, draft) => [...list, draft])`.

> Available as a bare identifier in `<script client>` and on `window.stx`
> (`window.stx.useOptimistic`). Implemented in both reactive impls with parity
> (`signals-api.ts` + the client runtime).

### useLocalStorage

```typescript
// functions/useLocalStorage.ts
import { state, effect } from '@stacksjs/stx'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  const value = state<T>(stored ? JSON.parse(stored) : defaultValue)

  effect(() => {
    localStorage.setItem(key, JSON.stringify(value()))
  })

  function remove() {
    localStorage.removeItem(key)
    value.set(defaultValue)
  }

  return { value, remove }
}
```

## Composables Using Other Composables

Composables can call other composables. This lets you build complex behavior from simple pieces:

```typescript
// functions/useAuthenticatedFetch.ts
import { state } from '@stacksjs/stx'

export function useAuthenticatedFetch<T>(url: string) {
  const { token, isAuthenticated } = useAuth()
  const data = state<T | null>(null)
  const error = state<string | null>(null)
  const loading = state(false)

  async function execute() {
    if (!isAuthenticated()) {
      error.set('Not authenticated')
      return
    }

    loading.set(true)
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (res.status === 401) {
        navigate('/login')
        return
      }
      data.set(await res.json())
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Fetch failed')
    } finally {
      loading.set(false)
    }
  }

  return { data, error, loading, execute }
}
```

## Before/After: Extracting Composables

### Before: God Component (Anti-Pattern)

```html
<script client>
// Everything jammed into one script block
const user = state(null)
const token = state(null)
const loading = state(false)
const theme = state('light')
const sidebarOpen = state(true)
const notifications = state([])
const notifCount = derived(() => notifications().filter(n => !n.read).length)

async function login(email, password) {
  loading.set(true)
  const res = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  token.set(data.token)
  user.set(data.user)
  loading.set(false)
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' })
  token.set(null)
  user.set(null)
  navigate('/login')
}

function toggleTheme() {
  const next = theme() === 'light' ? 'dark' : 'light'
  theme.set(next)
  document.documentElement.classList.toggle('dark', next === 'dark')
  localStorage.setItem('theme', next)
}

function toggleSidebar() {
  sidebarOpen.set(!sidebarOpen())
}

async function fetchNotifications() {
  const res = await fetch('/api/notifications', {
    headers: { Authorization: `Bearer ${token()}` },
  })
  notifications.set(await res.json())
}

onMount(() => {
  const stored = localStorage.getItem('theme')
  if (stored) theme.set(stored)
  fetchNotifications()
})
</script>
```

### After: Composable Extraction

```html
<script client>
const { user, isAuthenticated, logout } = useAuth()
const { isDark, toggle: toggleTheme, init: initTheme } = useDark()
const sidebarOpen = state(true)
const { data: notifications, refresh: refreshNotifs } = useAuthenticatedFetch('/api/notifications')
const notifCount = derived(() =>
  (notifications() || []).filter(n => !n.read).length
)

function toggleSidebar() {
  sidebarOpen.set(!sidebarOpen())
}

onMount(() => {
  initTheme()
  refreshNotifs()
})
</script>
```

The page script went from 50 lines to 15. Each composable is independently testable, reusable across pages, and has a single responsibility.

## Built-In Composables

stx provides several composables out of the box:

| Composable | Purpose |
|---|---|
| `useHead()` | Set document title, meta tags, link tags at runtime |
| `useSeoMeta()` | Set SEO meta tags (title, description, og:*) |
| `navigate(url)` | SPA navigation (or `navigate(url, true)` for full reload) |
| `goBack()` | Navigate back in history |
| `goForward()` | Navigate forward in history |
| `useRoute()` | Access current route info (path, query, params) |
| `useSearchParams()` | Reactive URL search params |
| `onMount(fn)` | Run code when page/component mounts |
| `onDestroy(fn)` | Run cleanup when page/component unmounts |
| `useRef(name)` | Get a reference to a DOM element |

## Anti-Patterns

> **Dumping all logic inline in a page.**
> If your `<script client>` is longer than 30-40 lines, you almost certainly need to extract composables. Each concern (auth, data fetching, UI state, theme) should be its own composable.

> **Using `state()` for simple boolean flags that are never shared.**
> A local `let` variable works fine for values that do not need to reactively update the DOM. Use `state()` only when the template needs to react to changes.

> **Using `window.location` for navigation.**
> Always use `navigate(url)` for SPA transitions. It uses the stx router when available and falls back to `location.href` when not. Using `window.location.href = url` directly bypasses the router and causes a full page reload.

> **Using `document.cookie` directly.**
> Wrap cookie access in a composable (`useCookie()`) for consistent behavior and testability. Raw `document.cookie` is error-prone and not reactive.

> **Defining composables inside `<script client>` blocks.**
> Composables belong in the `functions/` directory as `.ts` files. Defining them inline means they cannot be reused or tested independently.

## Tips

- **Name files after the composable**: `functions/useAuth.ts` exports `useAuth()`
- **Return an object**: Always return an object with named properties, not positional values
- **Keep composables pure when possible**: Composables that only use signals and computed values (no side effects) are easiest to test
- **Use `effect()` for side effects**: If a composable needs to sync state to localStorage, the DOM, or an API, use `effect()` so it runs automatically when dependencies change
- **Composables run in `<script client>` context**: They have access to `document`, `window`, signals, and other client-side APIs
