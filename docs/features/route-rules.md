# Per-route production policies

Use `routeRules` with `ssr: true` to mix build-time pages and request-time pages in one `.output` deployment:

```ts
export default {
  ssr: true,
  routeRules: {
    '/about': { rendering: 'prerender' },
    '/news/**': {
      rendering: 'dynamic',
      cache: { public: true, maxAge: 60, swr: 120 },
    },
    '/account/**': { rendering: 'dynamic', cache: false },
  },
}
```

Run `stx build`, then `stx start`. Rules are validated at build time and stored in the manifest; the server does not need to reload the original config. `buildForProduction({ root, routeRules })` accepts the same rules. Flat SSG builds reject route rules: a static host cannot run their request/cache policies.

## Matching

Patterns start with `/`. A literal matches itself, `:name` or `*` matches one segment, and a terminal `**` matches zero or more segments. Query strings are not part of rule matching. A trailing request slash is ignored.

The most specific matching rule wins **as a whole**, without inheriting a broader rule's cache settings. Specificity is compared left-to-right: literal, parameter, `*`, then `**`. An exact end wins over `**`; equivalent patterns use lexical order. Declaration order does not matter. Thus `/news/private` can disable a broader `/news/**` cache.

## Rendering

- `prerender`: resolves the compiled page during the build and serves that immutable artifact until the next build. Actions return 405. Parameter routes, redirects, response headers/cookies, streaming and cache/revalidation settings are rejected for prerendering.
- `dynamic`: uses the existing production template hydrator per request (or cache miss). Server scripts and expression placeholders execute with the request and route parameters. As with existing production compilation, structural loops/conditionals are compiled at build time; this option does not turn that compiler into a full request-time template interpreter.
- Omitted rendering: retains the existing static/compiled-dynamic selection.

SPA navigation hydrates dynamic pages too, then extracts the configured router container. Documents and fragments share the policy but never share a cache entry. Request-time `useServerData` payloads replace build-time payloads in both representations.

## Origin caching and privacy

Caching is off by default. `public: true` is an explicit author promise: an anonymous response must be safe to reuse for other anonymous visitors. Do not opt in pages personalized by IP, arbitrary headers, experiments or hidden request state. Cookie/Authorization/Range requests and non-GET methods always bypass caching. Responses with Set-Cookie, non-200 status, private/no-cache/no-store directives or unsupported Vary fields are not stored. Streaming responses bypass caching.

`maxAge` is the fresh lifetime in seconds. `swr` is an additional bounded stale window: an expired entry is served while one background refresh runs. Failed refreshes do not replace a good entry. Beyond the stale window a request waits for a fresh render; failures are returned, not disguised as fresh content. Concurrent misses only share cacheable responses.

This is a bounded, process-local origin cache, using stx's existing byte-aware LRU: at most 1,000 entries / 32 MiB, with a 1 MiB body limit per entry. URLs include query strings and origin in their keys. Responses remain `private, no-store` to downstream caches, and carry `Vary: X-STX-Router`. This keeps explicit origin invalidation effective; it is not a CDN ISR adapter or a distributed cache. The existing `createISRHandler` API remains available for applications managing their own file-backed ISR.

```ts
const server = await startProductionServer({ outputDir: '.output' })
server.invalidate('/news/latest') // all query and document/fragment variants
server.invalidate() // entire origin cache
```

Invalidation also prevents outstanding refreshes from writing old data back. Each process must be invalidated separately. Rebuild to update prerendered artifacts. Do not expose an unauthenticated invalidation endpoint.
