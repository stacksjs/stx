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
