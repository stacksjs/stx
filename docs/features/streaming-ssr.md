# Streaming SSR

Flush the page shell to the browser immediately, then stream slow regions in as
their server-side data resolves — instead of blocking the whole response on the
slowest query. The browser paints the shell at once; each boundary swaps in when
ready. (stacksjs/stx#1746 Phase 3)

## How it works

### Declarative: `@stream`

Wrap the slow region in an `@stream('id')` boundary and provide its data via
`streamBoundaries`. The boundary's template is rendered **per request** with
`$boundary` set to the resolved data — after the shell has already flushed:

```stx
<script server>
export const streamBoundaries = {
  // Runs AFTER the shell flushes — its latency doesn't block first paint.
  article: async () => fetch('https://api.example.com/article/16').then(r => r.json()),
}
</script>

<h1>My Blog</h1>             <!-- shell: streamed immediately -->

@stream('article')
  <article>
    <h1>{{ $boundary.title }}</h1>
    {{ $boundary.body }}
  </article>
@fallback
  <div class="skeleton">Loading article…</div>
@endstream
```

`@stream('id') … @fallback … @endstream` is distinct from the client-side
`@suspense` directive — it defers **server-side** rendering. `@fallback` is
optional.

### Low-level: a `streamBoundaries` function returning HTML

If you'd rather build the HTML yourself, skip `@stream` and place a
`data-suspense` placeholder, with the boundary function returning the final HTML:

```stx
<script server>
export const streamBoundaries = {
  article: async () => {
    const data = await fetch('https://api.example.com/article/16').then(r => r.json())
    return `<article><h1>${data.title}</h1>${data.body}</article>`
  },
}
</script>

<h1>My Blog</h1>
<div data-suspense="article"><div class="skeleton">Loading article…</div></div>
```

The server:

1. Renders the full page shell (layout, Crosswind CSS, HMR — the normal pipeline)
   with the `data-suspense` placeholders, and **flushes it first**.
2. Runs each `streamBoundaries` function. As each resolves, it streams a small
   script that swaps the matching placeholder for the rendered HTML — in
   **completion order**, so a fast boundary isn't held back by a slow one.

A boundary whose function throws gets an inline error UI in its placeholder; the
rest of the stream is unaffected.

## When to use

- A page with one or more **slow data dependencies** (a third-party API, an
  expensive query) where the rest of the page is ready immediately.
- Content sites where time-to-first-content matters more than time-to-complete.

For data that's fast or already in hand, render it inline in the shell — there's
nothing to defer.

## Notes & current scope

- **Opt-in & isolated** — a page without `streamBoundaries` is served exactly as
  before. Streaming pages are re-run per request so the boundary functions see
  fresh request state.
- **Full-page loads** — streaming applies to direct page loads. SPA fragment
  navigation returns the fragment as before.
- **Dev *and* production** — works in the dev server and the compiled-template
  production server (which re-runs `<script server>` per request, repopulating
  `streamBoundaries`). In production use the **function form** of
  `streamBoundaries` (returns HTML); the `@stream` template sugar isn't
  serialized into the compiled template, so it's dev/SSG-only for now.
- **`@stream` lives in the page (or its layout), not an included partial** — it's
  extracted early (before includes) so its inner template is captured pristine.
- **Interactive content inside a boundary hydrates.** The boundary function
  returns HTML; when it streams in, stx runs `window.stx.hydrate()` on the
  swapped-in subtree — executing its scoped setup scripts, binding directives,
  and firing `onMount` — so islands/signals inside a streamed boundary come
  alive, and a `stx:hydrated` event fires for it. (Hydration is a no-op when the
  page ships no signals runtime — the content is simply static.)

## Primitives

The serve layer is built on two exports from `stx` you can also use directly:

- `renderStreamingPage(shellHtml, boundaries)` → `ReadableStream<string>` — flush
  the shell, then stream each `{ id, render }` boundary as it resolves.
- `streamToResponse(stream, init?)` → a chunked `Response`.

```ts
import { renderStreamingPage, streamToResponse } from 'stx'

const stream = renderStreamingPage(shellHtml, [
  { id: 'article', render: async () => renderArticle(await loadArticle()) },
])
return streamToResponse(stream)
```
