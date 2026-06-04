# Lazy Hydration

Defer processing of interactive elements until they're actually needed.

## What it does

By default, stx processes every element on a page during `DOMContentLoaded` — wiring up `x-data`, `:text`, `@click`, `x-show`, and every other binding. For pages with many interactive components, this runs all at once, even for elements the user can't see yet (below the fold, inside collapsed sections, hidden tabs).

`stx-hydrate` lets you delay processing for a specific subtree until a trigger fires. The static HTML renders immediately; interactivity activates only when needed.

## Triggers

```html
<!-- Hydrate when the element scrolls into view (IntersectionObserver) -->
<section stx-hydrate="visible">
  <HeavyChart :data="chartData" />
</section>

<!-- Hydrate when the browser is idle (requestIdleCallback) -->
<footer stx-hydrate="idle">
  <NewsletterSignup />
</footer>

<!-- Hydrate when the user interacts (click, hover, focus, touch) -->
<div stx-hydrate="interaction">
  <CommentThread :post-id="postId" />
</div>

<!-- Hydrate only when a media query matches -->
<aside stx-hydrate="media:(max-width: 768px)">
  <MobileNav />
</aside>
```

### `visible`
Uses `IntersectionObserver` with a 50px rootMargin (starts processing just before the element enters the viewport). Falls back to immediate hydration in environments without `IntersectionObserver`.

### `idle`
Uses `requestIdleCallback` with a 2000ms timeout. Falls back to `setTimeout(200)` when unavailable. Good for non-critical UI that should activate eventually but isn't time-sensitive.

### `interaction`
Listens for `mouseenter`, `click`, `focusin`, and `touchstart` on the element. The first matching event triggers hydration and removes all listeners. Perfect for dropdowns, modals, and popovers where content doesn't matter until the user engages.

### `media:<query>`
Uses `matchMedia`. If the query matches on load, hydrates immediately. Otherwise, waits for the query to start matching. Use for responsive-only UI — mobile menus on small screens, desktop sidebars on large screens.

## When to use

**Good candidates:**
- Footer widgets and newsletter signups
- Comment sections
- Below-the-fold dashboard charts
- Modal/drawer contents (use `interaction`)
- Tab panels that aren't the active tab
- Mobile-only or desktop-only UI (use `media:`)

**Don't use for:**
- Above-the-fold interactive content (nav, hero CTAs, primary form inputs) — these need to be live the moment the page loads
- Small/cheap components — the overhead of `IntersectionObserver` setup may exceed the cost of just processing them
- SSG-only sites with minimal JavaScript — there's little to optimize

## How it fits with SSG vs SSR

- **SSR mode (`ssr: true`)**: This is where lazy hydration has the biggest impact. The server already rendered the HTML with live data; deferring client-side wire-up keeps the initial `DOMContentLoaded` pass fast.
- **SSG mode (`ssr: false`)**: Not strictly "hydration" (no server-rendered state to reconnect to), but `stx-hydrate` still works — it defers `processElement` on the subtree, which can help very large static pages with many `x-data` scopes.

## The `stx:hydrated` event

Every time a deferred subtree hydrates, stx dispatches a `stx:hydrated` event on `window`:

```js
window.addEventListener('stx:hydrated', (e) => {
  console.log('Hydrated:', e.detail.el, 'via', e.detail.trigger)
})
```

Useful for analytics, performance measurement, or chaining additional work after a section becomes interactive.

## Comparison with `@async`

`@async` and `stx-hydrate` solve different problems:

| | `@async` | `stx-hydrate` |
|---|---|---|
| Purpose | Defer loading component HTML from the server | Defer wire-up of already-rendered HTML |
| When HTML exists | After fetch completes | Immediately (SSG build or SSR render) |
| Requires server | Yes (`/_stx/component/:name`) | No — works in SSG and SSR |
| Works with `ssr: false` | No | Yes |
| Typical use | Slow-loading components | Performance optimization for off-screen content |

Use `@async` when you want to skip shipping a component's HTML entirely until needed. Use `stx-hydrate` when the HTML is fine to ship upfront, but interactivity can wait.

## Islands: `client="…"` on components

`stx-hydrate` is the low-level attribute. For a **component**, the ergonomic form
is the `client="…"` directive on the tag — it defers that component's hydration
to the given trigger (it compiles down to `stx-hydrate` on the component's scope
wrapper). This is the per-component half of the islands model (see
[the islands proposal](/proposals/islands-streaming) — tracking
[#1746](https://github.com/stacksjs/stx/issues/1746)).

```stx
<BenchHeader client="load" />                     <!-- eager (the default) -->
<CommentsList client="visible" />                 <!-- hydrate when scrolled into view -->
<LikeButton client="idle" />                      <!-- hydrate during idle time -->
<SearchBox client="media:(min-width: 768px)" />   <!-- hydrate when the query matches -->
```

| Value | Behaviour |
|---|---|
| `load` | Eager — hydrates at page load (same as omitting `client`). |
| `visible` | Hydrate when the component scrolls into the viewport. |
| `idle` | Hydrate during the browser's idle time. |
| `interaction` | Hydrate on first `mouseenter` / `click` / `focusin` / `touchstart`. |
| `media:<query>` | Hydrate when the media query first matches. |

The component's **HTML still ships and renders** immediately; what's deferred is
*all* of its client-side execution until the trigger fires:

- the reactive wire-up (`processElement`) — the expensive main-thread work;
- the component's **setup script itself** — emitted inert as
  `<script type="stx/island">`, the runtime runs it only on the trigger, so any
  side-effectful setup (a `fetch`/subscription in the `<script client>` body)
  fires when the island hydrates, *not* at page load;
- `onMount`, which fires on hydration (the trigger), not at page load.

`client="…"` is **opt-in**: a component without it behaves exactly as before. It
only applies to interactive components (those with a `<script client>` scope); on
a static component it's a harmless no-op.

Islands also hydrate correctly when their page is reached via **SPA navigation**,
not just a full page load — the router's re-init pass arms the island's trigger
on the swapped-in content the same way the initial load does.

So `<CommentsList client="visible">` ships its rendered HTML up front, but doesn't
create signals, run effects, *or* fire its data-loading `fetch` until it scrolls
into view — the whole island is dormant until then.

### Per-island chunking (production)

By default a deferred island's setup script still ships **inline** (inert), so its
*bytes* arrive with the page even though they only run on the trigger. For a
production build you can move each island's setup into a **separately-fetched
chunk** so the bytes arrive only when the island hydrates:

```ts
// build script
import { generateStaticSite } from 'stx'

await generateStaticSite({
  pagesDir: 'pages',
  outputDir: 'dist',
  chunkIslands: true, // opt-in
})
```

With `chunkIslands: true`, the build lifts each island's IIFE into a
content-hashed file under `dist/_stx/islands/<hash>.js` and rewrites the tag to
reference it (`data-stx-src="/_stx/islands/<hash>.js"`, empty body). On the
trigger the runtime loads that chunk via a real `<script src>` — so the island's
JS isn't downloaded until it's needed, and identical islands across pages share
one immutable, content-addressed file.

- **Opt-in & inert by default** — `chunkIslands` defaults to `false`; existing
  builds are byte-identical. Dev/SSR always stay inline (no stable build phase to
  emit chunks into, and bytes are local anyway).
- **CSP-clean** — the chunked path uses `<script src>`, **no `eval`/`new
  Function`**, so `script-src 'self'` is sufficient for chunked islands.
- **Subresource Integrity (opt-in)** — `integrityIslands: true` stamps a
  `sha384` hash on each chunk so the runtime pins it against tampering and a
  strict CSP can require SRI. Only enable it when chunks are served byte-for-byte
  unchanged (no CDN/proxy transform), otherwise the hash won't match and the
  island silently won't hydrate. Requires `chunkIslands`; default `false`.

#### Prefetching soon-to-hydrate chunks

Lazy chunks mean the JS arrives only on the trigger — great for bytes, but a
`visible` island still pays a fetch round-trip the moment it scrolls into view.
`prefetchIslands: true` warms those chunks ahead of time:

```ts
await generateStaticSite({
  pagesDir: 'pages',
  outputDir: 'dist',
  chunkIslands: true,
  prefetchIslands: true, // warm visible/idle chunks
})
```

It emits `<link rel="prefetch" href="/_stx/islands/<hash>.js" as="script">` into
the `<head>` for **`visible`** and **`idle`** islands — the ones likely to
hydrate — so the chunk is cached before the trigger fires (instant hydration,
still no inline JS). `interaction` and `media:` islands are **skipped** (they may
never hydrate, so eagerly fetching them would waste bandwidth). `prefetch` (not
`preload`) is used deliberately: it's idle-priority, so it never competes with
the critical render path. Defaults to `false` — it trades some idle bandwidth
for latency, and requires `chunkIslands`.

> **Scope of this phase.** `client="…"` defers the component's full client-side
> *execution* (wire-up, setup script, `onMount`), and `chunkIslands: true` now
> defers the *download* too. Still inline: the shared signals runtime, and
> dev/SSR islands.
>
> ⚠️ The **inline** path (dev, SSR, or `chunkIslands: false`) executes the
> deferred setup via `new Function(...)`, so a strict `script-src` CSP without
> `'unsafe-eval'` blocks island hydration there — use `chunkIslands: true` for a
> CSP-clean production build. Eager (`client="load"` / no `client`) components
> are unaffected either way.
