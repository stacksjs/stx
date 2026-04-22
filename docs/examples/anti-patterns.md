# Anti-Patterns

Things that go wrong when building stx applications. Every section shows the wrong way and the right way. If you are an AI agent generating stx code, read this entire page before writing anything.

---

## 1. Manual navigation instead of `navigate()`

The `navigate()` function is globally available in client scripts. It performs SPA navigation through the stx router, updating the URL, swapping content, and running transitions. `window.location` causes a full page reload and destroys all client state.

```html
<!-- BAD -->
<script client>
  function goToLogin() {
    window.location.href = '/login'
  }
</script>

<!-- GOOD -->
<script client>
  function goToLogin() {
    navigate('/login', true)  // second arg = replace history entry
  }
</script>
```

---

## 2. Raw `document.cookie` instead of a store

Scattering cookie reads/writes across pages leads to inconsistent state and makes auth logic impossible to test or reason about.

```html
<!-- BAD -->
<script client>
  const token = document.cookie.match(/token=([^;]+)/)?.[1] || ''
  function setToken(t) {
    document.cookie = `token=${t}; path=/; max-age=86400`
  }
</script>

<!-- GOOD: centralize in a store -->
<!-- stores/auth.ts -->
defineStore('auth', () => {
  const token = state(localStorage.getItem('auth_token') || '')
  function setToken(t) {
    token.set(t)
    localStorage.setItem('auth_token', t)
  }
  return { token, setToken }
})

<!-- page.stx -->
<script client>
  const auth = useStore('auth')
  // auth.token(), auth.setToken('...')
</script>
```

---

## 3. `document.querySelector` instead of `useRef`

Direct DOM queries are fragile, break with SPA navigation (elements get swapped), and bypass the reactive system.

```html
<!-- BAD -->
<script client>
  onMount(() => {
    const el = document.querySelector('#my-input')
    el.focus()
  })
</script>
<input id="my-input" />

<!-- GOOD -->
<script client>
  const inputRef = useRef('myInput')
  onMount(() => {
    inputRef.el?.focus()
  })
</script>
<input ref="myInput" />
```

---

## 4. Duplicated state across pages instead of a store

If the same `state()` declaration appears in more than two pages, it belongs in a store.

```html
<!-- BAD: copy-pasted in pages/dashboard.stx, pages/settings.stx, pages/profile.stx -->
<script client>
  const user = state(null)
  const loading = state(true)
  onMount(async () => {
    user.set(await fetch('/api/me').then(r => r.json()))
    loading.set(false)
  })
</script>

<!-- GOOD: single source of truth -->
<!-- stores/user.ts -->
defineStore('user', () => {
  const user = state(null)
  const loading = state(true)
  async function load() {
    user.set(await fetch('/api/me').then(r => r.json()))
    loading.set(false)
  }
  return { user, loading, load }
})

<!-- any page -->
<script client>
  const { user, loading, load } = useStore('user')
  onMount(() => { if (!user()) load() })
</script>
```

---

## 5. `x-data` for component-level state

`x-data` is for small, self-contained interactive islands (dropdowns, toggles). For page-level state, use `<script client>` with `state()`. Mixing the two systems in the same component creates confusion.

```html
<!-- BAD: using x-data for page-level state -->
<div x-data="{ items: [], loading: true, error: '', search: '', page: 1 }">
  <!-- 50 lines of template using x-data scope... -->
</div>

<!-- GOOD: use script client for page state -->
<script client>
  const items = state([])
  const loading = state(true)
  const search = state('')
  const page = state(1)
</script>

<div :if="loading()">Loading...</div>
<div :for="item in items()" :key="item.id">
  <span :text="item.name"></span>
</div>
```

When `x-data` IS appropriate:

```html
<!-- Small self-contained toggle -- x-data is fine here -->
<div x-data="{ open: false }">
  <button @click="open = !open">Menu</button>
  <nav x-show="open" class="mt-2">
    <StxLink to="/about">About</StxLink>
  </nav>
</div>
```

---

## 6. Ternary in `:class` instead of proper class binding

The `:class` attribute works, but `x-class` is more readable for conditional classes and handles space-separated class strings correctly.

```html
<!-- BAD: hard to read, error-prone with quotes -->
<div :class="active ? 'bg-blue-500 text-white font-bold' : 'bg-gray-100 text-gray-600'"></div>

<!-- GOOD -->
<div x-class="active() ? 'bg-blue-500 text-white font-bold' : 'bg-gray-100 text-gray-600'"></div>

<!-- ALSO GOOD: object syntax for toggling individual classes -->
<div :class="{ 'bg-blue-500 text-white': active(), 'opacity-50': disabled() }"></div>
```

---

## 7. Explicit `lang="ts"` on script tags

TypeScript is the default in stx. Adding `lang="ts"` is unnecessary noise.

```html
<!-- BAD -->
<script client lang="ts">
  const count: number = state(0)
</script>

<!-- GOOD -->
<script client>
  const count = state(0)
</script>
```

---

## 8. God-component scripts instead of composables

When `<script client>` exceeds ~80 lines, extract logic into composables in `functions/`.

```html
<!-- BAD: 200+ lines of inline script -->
<script client>
  const items = state([])
  const loading = state(true)
  const search = state('')
  const filters = state({})
  const sort = state('name')
  const page = state(1)
  // ... 150 more lines of data fetching, filtering, sorting, pagination logic
</script>

<!-- GOOD: composable extraction -->
<script client>
  import { useFilteredList } from '@/functions/useFilteredList'
  const { items, loading, search, paginated, load } = useFilteredList('/api/items')
  onMount(() => load())
</script>
```

See the [Composable Extraction pattern](./patterns.md#composable-extraction) for the full example.

---

## 9. Raw `localStorage` instead of `useLocalStorage`

Direct `localStorage` calls are not reactive and require manual serialization.

```html
<!-- BAD -->
<script client>
  const theme = state(localStorage.getItem('theme') || 'light')
  effect(() => {
    localStorage.setItem('theme', theme())
  })
</script>

<!-- GOOD: use store persistence -->
defineStore('preferences', () => {
  const theme = state('light')
  return { theme }
}, { persist: { pick: ['theme'] } })

<!-- or if you need simple key-value persistence -->
<script client>
  const prefs = useStore('preferences')
</script>
```

---

## 10. `addEventListener` instead of `@event`

Manual event listeners are not cleaned up on SPA navigation and require manual removal.

```html
<!-- BAD -->
<script client>
  onMount(() => {
    document.getElementById('btn').addEventListener('click', () => {
      console.log('clicked')
    })
  })
</script>
<button id="btn">Click</button>

<!-- GOOD -->
<button @click="handleClick()">Click</button>

<script client>
  function handleClick() {
    console.log('clicked')
  }
</script>
```

For keyboard shortcuts or window events, use `onMount`/`onDestroy` for cleanup:

```html
<script client>
  function onKeydown(e) {
    if (e.key === 'Escape') closeModal()
  }
  onMount(() => window.addEventListener('keydown', onKeydown))
  onDestroy(() => window.removeEventListener('keydown', onKeydown))
</script>
```

---

## 11. `setTimeout` for DOM access instead of `onMount`

`setTimeout(..., 0)` is a hack. `onMount` runs after the DOM is ready and is the correct lifecycle hook.

```html
<!-- BAD -->
<script client>
  setTimeout(() => {
    document.querySelector('.chart').style.height = '400px'
  }, 0)
</script>

<!-- GOOD -->
<script client>
  onMount(() => {
    const chartRef = useRef('chart')
    chartRef.el.style.height = '400px'
  })
</script>
<div ref="chart" class="chart"></div>
```

---

## 12. Working around rendering bugs with hacks

stx is in alpha. If something renders incorrectly, the correct response is to file an issue, not to add workarounds that will break when the bug is fixed.

```html
<!-- BAD: working around a rendering issue -->
<script client>
  // HACK: component doesn't re-render, force it with a key change
  const forceKey = state(0)
  function forceRerender() {
    forceKey.set(forceKey() + 1)
  }
</script>

<!-- GOOD: report it -->
<!-- If :for doesn't update when the array changes, that's a bug.
     File an issue at https://github.com/stacksjs/stx/issues
     with a minimal reproduction. -->
```

---

## 13. Bare `<script>` instead of `<script client>`

Both run client-side, but `<script client>` makes the intent explicit. Bare `<script>` can confuse readers (and agents) into thinking it might run server-side.

```html
<!-- BAD: ambiguous -->
<script>
  const count = state(0)
</script>

<!-- GOOD: explicit -->
<script client>
  const count = state(0)
</script>
```

The only script tag that runs on the server is `<script server>`. Everything else is client-side. Being explicit prevents mistakes.

---

## 14. `state()` for non-reactive values

Not everything needs to be a signal. If a value never triggers UI updates, use a plain variable.

```html
<!-- BAD: state() for a value that never changes the UI -->
<script client>
  const API_BASE = state('https://api.example.com')
  const MAX_RETRIES = state(3)
  const isProcessing = state(false)  // only read in console.log, never in template
</script>

<!-- GOOD: plain variables for constants and non-reactive values -->
<script client>
  const API_BASE = 'https://api.example.com'
  const MAX_RETRIES = 3
  let isProcessing = false  // not bound to any template expression
</script>
```

Use `state()` when the value is read in the template (`:text`, `:if`, `:for`, etc.) or when other signals depend on it via `derived()`. Use plain variables for everything else.
