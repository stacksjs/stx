# Composables Reference

All composables are available as globals in `<script>` and `<script client>` blocks. They can also be imported from `@stacksjs/stx` for TypeScript type checking.

## Reactivity

### state

```typescript
state<T>(initialValue: T): Signal<T>
```

Creates a reactive signal. The foundation of stx reactivity.

```html
<script>
const count = state(0)
const user = state({ name: 'Alice', age: 30 })
const items = state<string[]>([])
</script>

<p x-text="count()"></p>
```

**Signal interface:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `signal()` | `() => T` | Read the current value |
| `signal.set(value)` | `(value: T) => void` | Set a new value |
| `signal.update(fn)` | `(fn: (current: T) => T) => void` | Update based on current value |
| `signal.subscribe(cb)` | `(cb: (value: T, prev: T) => void) => () => void` | Subscribe to changes. Returns unsubscribe function |
| `signal._isSignal` | `true` (readonly) | Internal marker for type detection |

```html
<script>
const count = state(0)

count()              // Read: 0
count.set(5)         // Write: 5
count.update(n => n + 1)  // Update: 6

const unsub = count.subscribe((value, prev) => {
  console.log(`Changed from ${prev} to ${value}`)
})
unsub() // Stop listening
</script>
```

Signals use `Object.is()` for equality — setting the same value does not trigger subscribers or effects.

### derived

```typescript
derived<T>(compute: () => T): DerivedSignal<T>
```

Creates a read-only computed signal that recomputes when its dependencies change.

```html
<script>
const firstName = state('John')
const lastName = state('Doe')
const fullName = derived(() => `${firstName()} ${lastName()}`)

const items = state([1, 2, 3, 4, 5])
const evenItems = derived(() => items().filter(n => n % 2 === 0))
</script>

<p x-text="fullName()"></p>
<p x-text="'Even count: ' + evenItems().length"></p>
```

**DerivedSignal interface:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `signal()` | `() => T` | Read the computed value |
| `signal._isDerived` | `true` (readonly) | Internal marker |

Derived signals are lazy — they only recompute when read after a dependency changes.

### effect

```typescript
effect(fn: () => void | CleanupFn, options?: EffectOptions): CleanupFn
```

Creates a side effect that re-runs when its signal dependencies change.

```html
<script>
const count = state(0)

// Basic effect
effect(() => {
  console.log(`Count is now: ${count()}`)
})

// Effect with cleanup
const stopEffect = effect(() => {
  const interval = setInterval(() => console.log(count()), 1000)
  return () => clearInterval(interval)
})

// Stop the effect manually
stopEffect()
</script>
```

**EffectOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `immediate` | `boolean` | `true` | Run the effect immediately on creation |
| `name` | `string` | — | Name for debugging |

The effect automatically tracks which signals are read during execution and re-runs when any of them change.

### batch

```typescript
batch(fn: () => void): void
```

Batches multiple signal updates so dependent effects run only once.

```html
<script>
const firstName = state('John')
const lastName = state('Doe')

// Without batch: effect runs twice (once per set)
// With batch: effect runs once after both updates
batch(() => {
  firstName.set('Jane')
  lastName.set('Smith')
})
</script>
```

### isSignal

```typescript
isSignal(value: unknown): value is Signal<unknown>
```

Type guard to check if a value is a signal.

### isDerived

```typescript
isDerived(value: unknown): value is DerivedSignal<unknown>
```

Type guard to check if a value is a derived signal.

### untrack

```typescript
untrack<T>(value: T | Signal<T> | DerivedSignal<T>): T
```

Unwraps a signal to get its raw value. If not a signal, returns as-is.

### peek

```typescript
peek<T>(fn: () => T): T
```

Reads signals inside `fn` without tracking them as dependencies.

```html
<script>
const count = state(0)
const other = state(0)

effect(() => {
  console.log(count()) // tracked — effect re-runs on count change
  const val = peek(() => other()) // NOT tracked
})
</script>
```

## Lifecycle

### onMount

```typescript
onMount(fn: () => void | CleanupFn | Promise<void>): void
```

Runs after the component's DOM is ready. Can return a cleanup function.

```html
<script>
onMount(() => {
  console.log('Component mounted')
  const handler = () => console.log('scrolled')
  window.addEventListener('scroll', handler)
  return () => window.removeEventListener('scroll', handler)
})

onMount(async () => {
  const data = await fetch('/api/data').then(r => r.json())
  items.set(data)
})
</script>
```

### onDestroy

```typescript
onDestroy(fn: () => void | Promise<void>): void
```

Runs when the component is removed from the DOM.

```html
<script>
const ws = new WebSocket('wss://example.com')
onDestroy(() => ws.close())
</script>
```

## Navigation

### navigate

```typescript
navigate(url: string, forceReload?: boolean): void
```

Navigates to a URL. Uses the SPA router if available, otherwise falls back to `window.location.href`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | — | Destination URL |
| `forceReload` | `boolean` | `false` | When `true`, performs a full page reload |

```html
<script>
function goToProfile(id) {
  navigate(`/users/${id}`)
}

function goExternal() {
  navigate('https://example.com', true) // full reload
}
</script>
```

### goBack / goForward

```typescript
goBack(): void
goForward(): void
```

History navigation shortcuts wrapping `window.history.back()` and `window.history.forward()`.

### useRoute

```typescript
useRoute(): RouteInfo
```

Returns reactive route information.

```html
<script>
const route = useRoute()
</script>

<p x-text="route.path"></p>
```

**RouteInfo:**

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | `window.location.pathname` |
| `fullPath` | `string` | pathname + search + hash |
| `hash` | `string` | `window.location.hash` |
| `query` | `Record<string, string>` | Parsed search params |
| `params` | `Record<string, string>` | Route params (from dynamic routes like `/users/:id`) |

### useSearchParams

```typescript
useSearchParams(): SearchParamsHandle
```

Reactive URL search parameters. Syncs with `popstate` and `stx:navigate` events.

```html
<script>
const search = useSearchParams()

// Read
const page = search.get('page')

// Write (updates URL and state)
search.set('page', '2')
search.setAll({ page: '1', sort: 'name' })
</script>
```

**SearchParamsHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `data` | `Signal<Record<string, string>>` | Reactive params signal |
| `get(key)` | `(key: string) => string \| undefined` | Read a param |
| `set(key, value)` | `(key: string, value: string) => void` | Set a param (pushes history) |
| `setAll(obj)` | `(obj: Record<string, string>) => void` | Set multiple params |

## DOM

### useRef

```typescript
useRef(name: string): { current: HTMLElement | null, value: HTMLElement | null }
```

Gets a DOM element reference by its `ref="name"` attribute.

```html
<input ref="searchInput" type="text" />

<script>
const input = useRef('searchInput')

onMount(() => {
  input.current.focus()
})
</script>
```

Both `.current` and `.value` return the same element (`.value` is an alias for compatibility).

### useClickOutside

```typescript
useClickOutside(target: string | HTMLElement, handler: (event: PointerEvent) => void): { remove: () => void }
```

Fires `handler` when a `pointerdown` occurs outside the target element.

```html
<script>
useClickOutside('#dropdown', () => {
  isOpen.set(false)
})
</script>
```

Auto-cleans up on component destroy.

### useEventListener

```typescript
useEventListener(event: string, handler: (e: Event) => void, options?: EventListenerOptions): void
```

Adds an event listener that is automatically removed on component destroy.

```html
<script>
useEventListener('resize', () => {
  width.set(window.innerWidth)
}, { target: window, passive: true })
</script>
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `target` | `EventTarget \| string` | Target element or selector (default: `window`) |
| `capture` | `boolean` | Use capture phase |
| `passive` | `boolean` | Passive listener |
| `once` | `boolean` | Fire once |

## Data Fetching

### useFetch

```typescript
useFetch(url: string | (() => string), options?: FetchOptions): FetchResult
```

Declarative data fetching with signals.

```html
<script>
const { data, loading, error, refetch } = useFetch('/api/users')

// With reactive URL
const userId = state(1)
const { data: user } = useFetch(() => `/api/users/${userId()}`)

// With options
const { data: posts } = useFetch('/api/posts', {
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
  transform: (result) => result.data,
  immediate: true,
})
</script>
```

**FetchOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | `string` | `'GET'` | HTTP method |
| `headers` | `Record<string, string>` | `{ 'Content-Type': 'application/json' }` | Request headers |
| `body` | `any` | — | Request body (auto-stringified if object) |
| `initialData` | `any` | `null` | Initial data before fetch completes |
| `transform` | `(result: any) => any` | — | Transform response data |
| `immediate` | `boolean` | `true` | Fetch on mount |
| `onError` | `(error: Error) => void` | — | Error callback |

**FetchResult:**

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Signal<T \| null>` | Response data |
| `loading` | `Signal<boolean>` | Loading state |
| `error` | `Signal<string \| null>` | Error message |
| `refetch` | `() => Promise<void>` | Re-fetch data |
| `isLoading` | `boolean` (getter) | Convenience: `loading()` |
| `hasError` | `boolean` (getter) | Convenience: `!!error()` |
| `isEmpty` | `boolean` (getter) | Convenience: `!loading() && !data()` |

When `url` is a function, it is watched with `effect()` — changing the signal it reads triggers a refetch.

### useQuery

```typescript
useQuery(url: string | (() => string), options?: QueryOptions): QueryResult
```

Advanced data fetching with caching, stale-while-revalidate, and auto-refetch.

```html
<script>
const { data, loading, isStale, refetch, invalidate } = useQuery('/api/users', {
  staleTime: 30000,    // 30s before data is considered stale
  cacheTime: 300000,   // 5min cache lifetime
  refetchOnFocus: true,
  refetchInterval: 60000, // re-fetch every 60s
  transform: (res) => res.users,
  onSuccess: (data) => console.log('Loaded', data.length, 'users'),
})
</script>
```

**QueryOptions (extends FetchOptions):**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `staleTime` | `number` | `0` | ms before cached data is stale |
| `cacheTime` | `number` | `300000` (5 min) | ms before cache entry is evicted |
| `cacheKey` | `string` | URL | Custom cache key |
| `initialData` | `any` | `null` | Initial data |
| `transform` | `(result: any) => any` | — | Transform response |
| `refetchOnFocus` | `boolean` | `false` | Refetch when tab regains focus |
| `refetchInterval` | `number` | — | Auto-refetch interval in ms |
| `immediate` | `boolean` | `true` | Fetch on mount |
| `onSuccess` | `(data: any) => void` | — | Success callback |
| `onError` | `(error: Error) => void` | — | Error callback |
| `headers` | `Record<string, string>` | `{ 'Content-Type': 'application/json' }` | Request headers |

**QueryResult:**

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Signal<T \| null>` | Response data |
| `loading` | `Signal<boolean>` | Loading state |
| `error` | `Signal<string \| null>` | Error message |
| `isStale` | `Signal<boolean>` | Whether current data is stale |
| `refetch` | `() => Promise<void>` | Force re-fetch |
| `invalidate` | `() => Promise<void>` | Clear cache and re-fetch |

### useMutation

```typescript
useMutation(url: string | (() => string), options?: MutationOptions): MutationResult
```

Handles POST/PUT/DELETE operations with optimistic updates and query invalidation.

```html
<script>
const { mutate, loading, error } = useMutation('/api/users', {
  method: 'POST',
  onSuccess: (data) => {
    navigate(`/users/${data.id}`)
  },
  invalidateQueries: ['/api/users'],
  optimisticData: (body) => ({ ...body, id: 'temp' }),
})

function createUser() {
  mutate({ name: 'Alice', email: 'alice@example.com' })
}
</script>
```

**MutationOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | `string` | `'POST'` | HTTP method |
| `headers` | `Record<string, string>` | `{ 'Content-Type': 'application/json' }` | Request headers |
| `transform` | `(result: any) => any` | — | Transform response |
| `onSuccess` | `(data: any) => void` | — | Success callback |
| `onError` | `(error: Error) => void` | — | Error callback |
| `invalidateQueries` | `string[]` | — | Cache keys to invalidate on success |
| `optimisticData` | `any \| (body: any) => any` | — | Optimistic update data (rolled back on error) |

**MutationResult:**

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Signal<T \| null>` | Response data |
| `loading` | `Signal<boolean>` | Loading state |
| `error` | `Signal<string \| null>` | Error message |
| `mutate` | `(body: any) => Promise<T>` | Execute the mutation |
| `reset` | `() => void` | Reset data, error, and loading state |

### useAsync

```typescript
useAsync(fn: (...args: any[]) => Promise<T>, options?: { immediate?: boolean }): AsyncResult
```

Wraps any async function with loading/error/data tracking.

```html
<script>
const { execute, data, isLoading, error } = useAsync(async (query) => {
  const res = await fetch(`/api/search?q=${query}`)
  return res.json()
})

function search(query) {
  execute(query)
}
</script>
```

**AsyncResult:**

| Property | Type | Description |
|----------|------|-------------|
| `state` | `'idle' \| 'loading' \| 'success' \| 'error'` (getter) | Current state |
| `isLoading` | `boolean` (getter) | Whether loading |
| `data` | `T \| null` (getter) | Result data |
| `error` | `Error \| null` (getter) | Error if failed |
| `execute` | `(...args) => Promise<T \| null>` | Run the async function |
| `subscribe` | `(fn) => () => void` | Subscribe to state changes |

## Head & SEO

### useHead

```typescript
useHead(config: HeadConfig): void
```

Manages document head tags at runtime. Works on page load and SPA navigation.

```html
<script>
useHead({
  title: 'My Page',
  meta: [
    { name: 'description', content: 'Page description' },
    { property: 'og:title', content: 'My Page' },
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/page' },
    { rel: 'stylesheet', href: '/styles/extra.css' },
  ],
  script: [
    { src: 'https://example.com/analytics.js', async: true },
  ],
  bodyAttrs: { class: 'dark-mode' },
  htmlAttrs: { lang: 'en' },
})
</script>
```

**HeadConfig:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Sets `document.title` |
| `meta` | `Array<{ name?: string, property?: string, content: string }>` | Upserts `<meta>` tags |
| `link` | `Array<Record<string, string>>` | Appends `<link>` tags (deduped by rel+href) |
| `script` | `Array<{ src?: string, innerHTML?: string, async?: boolean, defer?: boolean }>` | Appends `<script>` tags |
| `bodyAttrs` | `{ class?: string }` | Adds classes to `<body>` |
| `htmlAttrs` | `{ lang?: string }` | Sets attributes on `<html>` |

### useSeoMeta

```typescript
useSeoMeta(config: SeoMetaConfig): void
```

Convenience wrapper for common SEO meta tags. Internally calls `useHead()`.

```html
<script>
useSeoMeta({
  title: 'Product Page',
  description: 'The best product ever made.',
  ogTitle: 'Product Page',
  ogDescription: 'The best product ever made.',
  ogImage: 'https://example.com/og-image.jpg',
  ogType: 'website',
  ogUrl: 'https://example.com/product',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Product Page',
  twitterDescription: 'The best product ever made.',
  twitterImage: 'https://example.com/twitter-image.jpg',
  robots: 'index, follow',
  canonical: 'https://example.com/product',
})
</script>
```

**SeoMetaConfig:**

| Field | Meta tag | Description |
|-------|----------|-------------|
| `title` | `<meta name="title">` + `document.title` | Page title |
| `description` | `<meta name="description">` | Page description |
| `ogTitle` | `<meta property="og:title">` | Open Graph title |
| `ogDescription` | `<meta property="og:description">` | Open Graph description |
| `ogImage` | `<meta property="og:image">` | Open Graph image URL |
| `ogType` | `<meta property="og:type">` | Open Graph type |
| `ogUrl` | `<meta property="og:url">` | Open Graph URL |
| `twitterCard` | `<meta name="twitter:card">` | Twitter card type |
| `twitterTitle` | `<meta name="twitter:title">` | Twitter title |
| `twitterDescription` | `<meta name="twitter:description">` | Twitter description |
| `twitterImage` | `<meta name="twitter:image">` | Twitter image URL |
| `robots` | `<meta name="robots">` | Robots directive |
| `canonical` | `<meta property="og:url">` | Canonical URL |

## Timers & Utilities

### useDebounce

```typescript
useDebounce(fn: (...args: any[]) => void, delay?: number): DebouncedFn
```

Returns a debounced version of `fn`. Default delay: 250ms. Auto-cleans up on destroy.

```html
<script>
const debouncedSearch = useDebounce((query) => {
  fetch(`/api/search?q=${query}`)
}, 300)
</script>

<input @input="debouncedSearch($event.target.value)" />
```

**DebouncedFn:**

| Method | Description |
|--------|-------------|
| `debounced(...args)` | Call the debounced function |
| `debounced.cancel()` | Cancel pending execution |
| `debounced.flush()` | Execute immediately if pending |
| `debounced.pending()` | Returns `true` if a call is pending |

### useDebouncedValue

```typescript
useDebouncedValue(getter: () => T, delay?: number): { value: T, subscribe: (fn) => () => void }
```

Returns a debounced snapshot of a value. Default delay: 250ms.

```html
<script>
const query = state('')
const debouncedQuery = useDebouncedValue(() => query(), 300)

debouncedQuery.subscribe((val) => {
  console.log('Debounced:', val)
})
</script>
```

### useThrottle

```typescript
useThrottle(fn: (...args: any[]) => void, limit?: number): ThrottledFn
```

Returns a throttled version of `fn`. Default limit: 250ms. Auto-cleans up on destroy.

```html
<script>
const throttledScroll = useThrottle(() => {
  console.log('Scroll position:', window.scrollY)
}, 100)

useEventListener('scroll', throttledScroll, { passive: true })
</script>
```

**ThrottledFn:**

| Method | Description |
|--------|-------------|
| `throttled(...args)` | Call the throttled function |
| `throttled.cancel()` | Cancel pending trailing call |

### useInterval

```typescript
useInterval(interval?: number, options?: { immediate?: boolean }): IntervalHandle
```

Starts a repeating interval. Default: 1000ms. Auto-cleans up on destroy.

```html
<script>
const timer = useInterval(1000)
timer.subscribe((count) => {
  console.log('Tick:', count)
})
</script>
```

**IntervalHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `counter` | `number` (getter) | Number of ticks |
| `pause()` | `() => void` | Pause the interval |
| `resume()` | `() => void` | Resume the interval |
| `reset()` | `() => void` | Reset counter and restart |
| `subscribe(fn)` | `(fn: (count) => void) => () => void` | Listen to ticks |

### useTimeout

```typescript
useTimeout(callback: () => void, delay?: number): TimeoutHandle
```

Executes `callback` after `delay` ms. Default: 1000ms. Auto-cleans up on destroy.

```html
<script>
const { isPending, stop } = useTimeout(() => {
  showBanner.set(false)
}, 5000)
</script>
```

**TimeoutHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `isPending` | `boolean` (getter) | Whether the timeout is still waiting |
| `start()` | `() => void` | Restart the timeout |
| `stop()` | `() => void` | Cancel the timeout |
| `subscribe(fn)` | `(fn: (pending) => void) => () => void` | Listen to pending state changes |

### useToggle

```typescript
useToggle(initial?: boolean): [ref, toggle, set]
```

Simple boolean toggle.

```html
<script>
const [isOpen, toggle, setOpen] = useToggle(false)
</script>

<button @click="toggle()">Toggle</button>
<div x-show="isOpen.value">Content</div>
```

**Returns:**

| Index | Type | Description |
|-------|------|-------------|
| `[0]` ref | `{ value: boolean, subscribe: (fn) => () => void }` | Current value |
| `[1]` toggle | `() => void` | Toggle the value |
| `[2]` set | `(value: boolean) => void` | Set explicitly |

### useCounter

```typescript
useCounter(initial?: number, options?: { min?: number, max?: number }): CounterHandle
```

Numeric counter with bounds.

```html
<script>
const counter = useCounter(0, { min: 0, max: 100 })
</script>

<button @click="counter.dec()">-</button>
<span x-text="counter.count"></span>
<button @click="counter.inc()">+</button>
```

**CounterHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `count` | `number` (getter) | Current count |
| `inc(step?)` | `(step?: number) => void` | Increment (default step: 1) |
| `dec(step?)` | `(step?: number) => void` | Decrement (default step: 1) |
| `set(value)` | `(value: number) => void` | Set to specific value (clamped) |
| `reset()` | `() => void` | Reset to initial value |
| `subscribe(fn)` | `(fn: (count) => void) => () => void` | Listen to changes |

## Storage & Persistence

### useLocalStorage

```typescript
useLocalStorage<T>(key: string, defaultValue: T): Signal<T>
```

Returns a signal backed by `localStorage`. Changes are persisted automatically. Syncs across tabs via the `storage` event.

```html
<script>
const theme = useLocalStorage('theme', 'light')

// Read
console.log(theme()) // 'light' (or stored value)

// Write (persists to localStorage)
theme.set('dark')
</script>
```

### useSessionStorage

```typescript
useSessionStorage<T>(key: string, defaultValue: T): Signal<T>
```

Same shape as `useLocalStorage`, but backed by `sessionStorage` — values live only for the duration of the browser tab/session. Cross-tab sync via the `storage` event is filtered to the `sessionStorage` storage area so a `localStorage` write in another tab won't trip the signal.

```html
<script>
const draftCart = useSessionStorage('draft-cart', [])

draftCart.set([...draftCart(), item])
</script>
```

### useCookie

```typescript
useCookie(name: string, options?: UseCookieOptions): Signal<string>
```

Reactive string-valued cookie binding. The signal reads the cookie at construction and writes back on every `.set(value)`. Setting `.set('')` deletes the cookie (`Max-Age=0`).

Options:

| Option | Type | Default | Notes |
|---|---|---|---|
| `defaultValue` | `string` | `''` | Returned when the cookie isn't present |
| `path` | `string` | `'/'` | Cookie path attribute |
| `domain` | `string` | (none) | Cookie domain attribute |
| `maxAge` | `number` | (none) | Seconds; sets `Max-Age=N` |
| `expires` | `Date` | (none) | Sets `Expires=...` (used when `maxAge` not provided) |
| `sameSite` | `'Strict' \| 'Lax' \| 'None'` | `'Lax'` | SameSite attribute |
| `secure` | `boolean` | auto on HTTPS | Sets the `Secure` flag |
| `encode` / `decode` | `(string) => string` | `encodeURIComponent`/`decodeURIComponent` | Custom serialization |

```html
<script>
const token = useCookie('auth-token', {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: 'Lax',
})

// Read
if (!token()) navigate('/login', true)

// Write (writes `auth-token=<encoded>; Path=/; Max-Age=2592000; SameSite=Lax`)
token.set(jwt)

// Delete
token.set('')
</script>
```

Cookies don't fire a `storage` event, so cross-tab updates aren't auto-reflected. If you need that, poll on `visibilitychange` in user-land.

### useReactiveProp

```typescript
useReactiveProp<T>(
  name: string,
  defaultValue: T,
  options?: { parse?: (v: string | null) => T },
): Signal<T>
```

Used **inside a component's `<script client>` block** to bridge a parent's clientReactive attribute (e.g. `<Dialog :open="modalOpen()">`) into the component's local state. Returns a signal whose value tracks the named attribute on the component's root element — when the parent's expression changes and the runtime updates the attribute, a `MutationObserver` forwards the change into this signal.

```html
<!-- Inside Dialog.stx -->
<script client>
const isOpen = useReactiveProp('open', {{ open }})

function close() {
  isOpen.set(false)
  emit('close')
}
</script>

<div :show="isOpen()" role="dialog">
  <slot />
</div>
```

Default parse heuristic (override via `options.parse` for typed props):

| Attribute value | Returned |
|---|---|
| `""` or `"true"` | `true` |
| `"false"` | `false` |
| Numeric string | `Number(v)` |
| Otherwise | the original string |

```html
<!-- Typed: parse JSON for an object-valued prop -->
const items = useReactiveProp('items', [], { parse: (v) => JSON.parse(v || '[]') })

<!-- Typed: keep value as string even when it parses as boolean -->
const role = useReactiveProp('role', '', { parse: (v) => v == null ? '' : String(v) })
```

One-way (parent → child). For two-way binding, the component still emits events (`@input` / `@change` / `@close`) and the parent updates its source signal.

## Color Mode

### useColorMode

```typescript
useColorMode(options?: ColorModeOptions): ColorModeHandle
```

Manages light/dark/auto color mode with persistence, system preference detection, and cross-tab sync.

```html
<script>
const colorMode = useColorMode()
</script>

<button @click="colorMode.toggle()">
  <span x-text="colorMode.isDark ? 'Light mode' : 'Dark mode'"></span>
</button>
```

**ColorModeOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storageKey` | `string` | `'stx-color-mode'` | localStorage key |
| `initialMode` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Initial mode |
| `darkClass` | `string` | `'dark'` | Class added to `<html>` |
| `attribute` | `string \| null` | `null` | Alternative: set attribute instead of class |
| `disableTransitions` | `boolean` | `true` | Disable transitions during toggle |

**ColorModeHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `mode` | `'light' \| 'dark'` (getter) | Resolved mode |
| `preference` | `'light' \| 'dark' \| 'auto'` (getter) | User preference |
| `isDark` | `boolean` (getter) | Whether dark mode is active |
| `set(mode)` | `(mode: 'light' \| 'dark' \| 'auto') => void` | Set mode |
| `toggle()` | `() => void` | Toggle between light and dark |
| `subscribe(fn)` | `(fn: (mode, preference) => void) => () => void` | Listen to changes |

### useDark

```typescript
useDark(options?: ColorModeOptions): DarkHandle
```

Simplified dark mode toggle. Wraps `useColorMode()`.

```html
<script>
const dark = useDark()
</script>

<button @click="dark.toggle()">Toggle dark mode</button>
```

**DarkHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `isDark` | `boolean` (getter) | Whether dark mode is active |
| `toggle()` | `() => void` | Toggle dark mode |
| `set(dark)` | `(dark: boolean) => void` | Set dark mode on/off |
| `subscribe(fn)` | `(fn: (isDark) => void) => () => void` | Listen to changes |

## Communication

### useWebSocket

```typescript
useWebSocket(url: string, options?: WebSocketOptions): WebSocketHandle
```

Reactive WebSocket connection with auto-reconnect and channel subscriptions.

```html
<script>
const { status, lastMessage, send, subscribe } = useWebSocket('wss://example.com/ws', {
  reconnect: true,
  maxReconnects: 10,
})

// Send data
send({ type: 'ping' })

// Channel-based subscriptions
const chat = subscribe('chat-room')
chat.listen('message', (data) => {
  messages.update(arr => [...arr, data])
})
</script>
```

**WebSocketOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `immediate` | `boolean` | `true` | Connect on creation |
| `reconnect` | `boolean` | `true` | Auto-reconnect on close |
| `maxReconnects` | `number` | `10` | Max reconnection attempts |
| `reconnectDelay` | `number` | `1000` | Base delay between reconnects (ms) |
| `onOpen` | `(ws: WebSocket) => void` | — | Connection opened callback |
| `onMessage` | `(data: any, event: MessageEvent) => void` | — | Message received callback |
| `onError` | `(event: Event) => void` | — | Error callback |
| `onClose` | `(event: CloseEvent) => void` | — | Connection closed callback |

**WebSocketHandle:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `ws` | `Signal<WebSocket \| null>` | WebSocket instance |
| `status` | `Signal<'CONNECTING' \| 'OPEN' \| 'CLOSED'>` | Connection status |
| `lastMessage` | `Signal<any>` | Last received message (auto-parsed JSON) |
| `error` | `Signal<Event \| null>` | Last error event |
| `send(data)` | `(data: any) => void` | Send data (auto-stringified) |
| `close()` | `() => void` | Close connection |
| `connect()` | `() => void` | Open/reopen connection |
| `subscribe(channel)` | `(channel: string) => ChannelHandle` | Subscribe to a channel |

**ChannelHandle:**

| Method | Description |
|--------|-------------|
| `listen(event, handler)` | Listen for events on the channel. Returns `this` for chaining |
| `leave()` | Unsubscribe from the channel |

Reconnection uses exponential backoff: `delay * min(attempt, 5)`. Auto-cleans up on component destroy.

## Dependency Injection

### provide

```typescript
provide(name: string, value: any): void
```

Makes a value globally accessible by name. Uses `window[name]` under the hood.

```html
<script>
// Provider component
provide('Modal', ModalComponent)
provide('theme', { primary: '#6366f1' })
</script>
```

```html
<script>
// Consumer component — access the provided value directly
const theme = window.theme
</script>
```

## Cross-References

- **defineStore / useStore** — See [Stores Reference](./stores.md) for full store documentation
- **Vue compatibility aliases**: `ref` = `state`, `reactive` = `state`, `computed` = `derived`, `watchEffect` = `effect`
