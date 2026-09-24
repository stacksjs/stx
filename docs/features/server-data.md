# Server data and client hydration

`useServerData(key, loader)` loads JSON data once per key **within a server render**. A matching `useFetch` or `useAsyncData` key initializes client signals from that result instead of repeating the initial request.

```html
<script server>
const user = await useServerData('current-user', async () => {
  const response = await fetch('https://example.com/api/me', {
    headers: { Authorization: `Bearer ${serverToken}` },
  })
  if (!response.ok) throw new Error('Unable to load user')
  const record = await response.json()
  // Explicitly select the fields the browser is allowed to see.
  return { id: record.id, name: record.name }
})
</script>

<script client>
const profile = useFetch('/api/me', { key: 'current-user' })
// profile.data() is populated immediately; loading() is false.
// await profile.refetch() explicitly requests fresh client data.
</script>

<h1>{{ user.name }}</h1>
<button @click="profile.refetch()">Refresh</button>
<p x-text="profile.data()?.name"></p>
```

For a custom client loader, use the same explicit key:

```ts
const profile = useAsyncData(
  () => fetch('/api/me').then(response => response.json()),
  { key: 'current-user' },
)
```

Only `<script server>` runs on the server. The framework does **not** execute client loaders to discover their data requirements. `useServerData` is available directly in server scripts and through an import from `stx` / `@stacksjs/stx`; imported helper functions can call it while a server script is executing. Calls outside that render scope throw. Always await the server loader.

## Keys, isolation, and serialization

- Use a non-empty, stable key identifying the resource and its arguments, such as `product:${id}`. The first loader for a key wins within that render. Concurrent calls share its promise.
- Separate renders have separate data stores, including concurrent authenticated requests. Nested templates and an explicit `renderTemplate` page/layout pair share their render's store. No process-wide data cache is introduced.
- Return JSON-compatible data. `null` is a successful result, not a cache miss. Dates normalize to JSON strings. Undefined values, functions, symbols, non-finite numbers, BigInts, circular objects, Maps, and Sets are rejected. SSR receives the normalized JSON shape too.
- Successful results are serialized in an inert, escaped JSON script before client code. Every field returned is visible to the browser. Never return secrets, tokens, or unfiltered database records. Request isolation does not make a publicly cached HTML response safe for private data: configure the host's response caching appropriately and do not opt sensitive components into rendered-output caching.
- Failed loaders reject and are removed from the request's pending map, allowing an explicit retry. They emit no payload or error details. Catch the error in the server script if you want fallback HTML; existing server-script error handling still applies otherwise.

## Client lifecycle

| Situation | Behavior |
| --- | --- |
| Matching hydrated key | Initialize `data`, apply that consumer's `transform`, skip the initial request; loading/error state starts idle. Multiple consumers can read the snapshot. |
| Missing, malformed, or failed server payload | Follow the client's normal fetching behavior. `immediate: false` still defers fetching. |
| `hydrate: false` | Ignore the snapshot and use the ordinary client lifecycle. |
| `refetch()` / `execute()` | Run the existing client request path, ignoring hydration. Existing client cache options still apply. |
| Reactive `useFetch` URL changes | Fetch the new URL; hydration suppresses only the initial evaluation. |
| `clearServerData(key)` | Forget that key for future consumers. Existing signals are unchanged; call their `refetch()` to update them. Omit the key to clear all hydration data. |
| SPA navigation | Replace the snapshot at the committed swap, before new page scripts run. An absent payload clears the outgoing snapshot. Prefetch alone does not change current data. |
| Cached route revisit | Hydrate from that route's cached HTML snapshot. Invalidate the router cache (`invalidateRoute`) or refresh the route to request a fresh server render. Clearing hydration data alone does not evict cached HTML. |

Hydration does not change `useQuery` deduplication, client request supersession, or scope-teardown cancellation. Existing requests and persistent layout components are not refreshed automatically when another page's snapshot arrives.
