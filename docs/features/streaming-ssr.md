# Streaming SSR

Flush the page shell to the browser immediately, then stream slow regions in as
their server-side data resolves — instead of blocking the whole response on the
slowest query. The browser paints the shell at once; each boundary swaps in when
ready. (stacksjs/stx#1746 Phase 3)

## How it works

A page opts in by exporting **`streamBoundaries`** from `<script server>` — a map
of boundary id → a server-side `async` function that returns the boundary's HTML.
The template carries a **fallback placeholder** for each boundary:

```stx
<script server>
export const streamBoundaries = {
  // Runs AFTER the shell flushes — its latency doesn't block first paint.
  article: async () => {
    const data = await fetch('https://api.example.com/article/16').then(r => r.json())
    return `<article><h1>${data.title}</h1>${data.body}</article>`
  },
}
</script>

<h1>My Blog</h1>            <!-- shell: streamed immediately -->

<!-- Fallback shown until the boundary resolves; id matches streamBoundaries -->
<div data-suspense="article">
  <div class="skeleton">Loading article…</div>
</div>
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
- **Boundary content is server-rendered HTML.** The boundary function returns a
  string; it's swapped into the DOM as-is. Hydrating interactive content *inside*
  a streamed boundary (signals/islands) is a later increment — for now, put
  interactive components in the shell, or hydrate them after the
  `stx:hydrated`-style swap yourself.

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
