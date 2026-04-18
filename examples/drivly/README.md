# Drivly — A Turo-style Car Rental Marketplace

A full-featured car rental marketplace example built end-to-end with **stx**. Think Airbnb but for cars: guests browse, book, and meet hosts; hosts list, earn, and manage trips. Every page is wired up, with SPA navigation, signals-driven state, persisted stores, dark/light theming, responsive layouts, and a full checkout flow.

## Pages

| Route                | What it does                                                                   |
|----------------------|--------------------------------------------------------------------------------|
| `/`                  | Marketing home — hero with search, categories, featured cars, deals, cities, testimonials, host CTA |
| `/search`            | Browse/filter 12+ cars — reactive filter chips, price range slider, sort, live count, grid/list toggle, URL-based filter presets |
| `/cars/:id`          | Car detail — photo gallery + lightbox, tabs (overview / features / rules / reviews / location), reactive price breakdown, host card |
| `/book/:id`          | 5-step checkout — dates → protection → extras → driver → payment → success confirmation, live total calculation |
| `/trips`             | Guest "My trips" dashboard — upcoming + past + cancelled tabs with bookings history |
| `/favorites`         | Saved cars — persisted via store with localStorage fallback |
| `/host/dashboard`    | Host earnings dashboard — KPIs, 12-month SVG chart, upcoming bookings table, inbox, listings, reviews |
| `/host/list`         | Multi-step "List your car" wizard — 5 steps, live earnings projection, photo upload preview |
| `/about`             | How-it-works / trust / FAQ |
| `/login`, `/signup`  | Auth (signs into signals-backed `session` store) |

## Architecture

```
drivly/
├── stx.config.ts              Convention-based config
├── pages/
│   ├── index.stx              Home
│   ├── search.stx             Browse
│   ├── about.stx              How it works
│   ├── login.stx / signup.stx Auth
│   ├── trips.stx / favorites.stx
│   ├── cars/[id].stx          Dynamic route — car detail
│   ├── book/[id].stx          Dynamic route — checkout
│   └── host/
│       ├── dashboard.stx      Earnings + bookings
│       └── list.stx           Listing wizard
├── layouts/
│   ├── app.stx                Main layout (nav + footer + shell)
│   └── auth.stx               Split-screen auth layout
├── components/
│   ├── CarCard.stx            Listing card with favorite toggle
│   ├── SearchBar.stx          Hero + compact variants
│   ├── Rating.stx             Star rating display
│   ├── HostChip.stx           Host avatar + metadata
│   └── FeatureTag.stx
├── partials/
│   └── footer.stx
├── stores/
│   ├── favorites.ts           Persisted favorites store
│   ├── search.ts              Persisted search prefs
│   └── session.ts             Current user session
└── data/
    └── cars.ts                Catalog + hosts + reviews + cities
```

## stx features demonstrated

- **Layouts with `@extends` / `@yield` / `@section`** → `app.stx` and `auth.stx`
- **Partials via `@include`** → `footer.stx`
- **Components with slots and props** → `@component('CarCard', { car: car })`
- **Builtin components** → `<StxLink>` for SPA nav, `<Icon>` for iconify icons
- **Dynamic routes** → `cars/[id].stx`, `book/[id].stx`
- **`<script server>`** for data-fetching and expression context
- **`<script client>`** with full signals runtime (`state`, `derived`, `effect`, `batch`)
- **Stores** (`defineStore` + `useStore`) with `persist: { pick, key }` — favorites survive reload and SPA navigation
- **Directives**: `@foreach`, `@if` / `@elseif` / `@else`, `{{ }}`, `{!! !!}`
- **`@push('styles')` / `@stack('styles')`** for per-page CSS
- **SPA router** — `<StxLink>` makes navigation instant, with prefetch on hover
- **Dark/light theming** via `data-theme` + CSS custom properties, persisted to localStorage
- **Responsive + accessible** — 900px mobile nav breakpoint, focus styles, semantic HTML, aria-live toasts
- **Reactive UI** — search filters, price sliders, multi-step wizards all driven by signals
- **Form flows** with validation (HTML5 + inline) and loading spinners

## Run it

```bash
# Recommended — use the stx CLI directly
cd examples/drivly
./../../stx dev

# Open http://localhost:3000 (or whatever --port you pass)
```

Dynamic routes (`/cars/:id`, `/book/:id`) rebuild per request with the actual URL params, so every car URL shows its own data.

Alternatively, a standalone `serve.ts` is also provided (uses the same internal processing). Run it with `bun examples/drivly/serve.ts` from the repo root.

## Highlights to try

1. Open `/search`, adjust the **price slider** — watch the reactive chip count update live.
2. Click the **heart icon** on any car — open `/favorites` in a new tab → it's already there. Refresh → still there (persisted).
3. Toggle **dark mode** via the sun/moon icon — state survives page navigation via `localStorage`.
4. Go through the **booking flow** at `/book/tesla-model-3-2024` — watch the total update as you change dates, protection, and extras.
5. Sign up as a host → lands you on `/host/list` → projected earnings update as you type.
6. Navigate between pages — notice zero flash (SPA routing with script re-execution on fragment swap).

## Notes from the build

- Server-data variables for `@foreach` must be declared in `<script server>` (or bare `<script>`, which defaults to server classification). Inline array literals in `@foreach` get converted to client-side `@for` attributes.
- `@foreach (items as idx => item)` and `@foreach (items as (item, idx))` both work for server-side iteration (parser fix landed alongside this example). You can still use `@foreach (items as item)` + `loop.index` when you prefer.
- `{{ expr }}` and `{!! expr !!}` inside `<script client>` blocks are interpolated with server values before the script reaches the browser. Inside scripts `{{ }}` becomes `JSON.stringify(value)` (safe JS — strings get quoted, arrays/objects become JSON literals); `{!! !!}` splices the raw value. Expressions that reference client-only signals are preserved for the client runtime. See `search.stx`, `cars/[id].stx`, `book/[id].stx`, and `favorites.stx` for examples.

---

Built on stx — the Blade-syntax templating framework that runs on Bun.
