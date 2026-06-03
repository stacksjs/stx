# Proposal: Islands architecture + streaming SSR

> Tracking issue: [stacksjs/stx#1746](https://github.com/stacksjs/stx/issues/1746)
> Status: **planning** · Effort: **XL** (Phase 0+1 are the shippable first PR)
>
> This plan is grounded in a file:line audit of the current runtime, serve,
> component, streaming, and script-classification subsystems. It is a roadmap,
> not a committed implementation.

## Goal

Today stx hydrates the **entire** page: any signal syntax on a page injects the
full client runtime and a client scope for everything. For a content site,
~70% of the DOM is static after first paint, so that JS is wasted. Islands make
hydration **opt-in and per-unit**; streaming flushes HTML as data resolves.

## The core problem, in current-architecture terms

Hydration is **binary and page-global**:

- `hasSignalsSyntax()` (`packages/stx/src/signal-processing.ts:183`) scans 17
  patterns; **any** match makes `processSignals` inject the ~150KB runtime
  (`runtime-injection.ts:109`) and emit a client scope IIFE
  (`includes.ts:276`) + `data-stx-scope` for the **whole page**.
- There is **no** per-component or per-file gate.

Islands = make that gate exist and default it to *off*.

## Foundational reframing (vs the issue's phase order)

The issue lists per-file `'use client'` as Phase 1 and per-component `client:*`
as Phase 2. **We recommend inverting them.** Per-component opt-in is *additive
and safe* (reuses `deferHydration`, breaks nothing); flipping the per-file
default to server-only has *huge blast radius*. Ship the safe, high-value win
first; flip the default last, behind a config flag.

A second, load-bearing finding: there are already **three** partial hydration
mechanisms — `deferHydration`/`stx-hydrate` (`signals.ts:1395`), a
`partial-hydration.ts` with `@client:*` directives, and an unused `hydration.ts`
(`setupVisibleHydration/...`). **These must be consolidated before adding a
fourth**, or the framework ships competing, confusing hydration models.

---

## Phase 0 — Consolidate + build the gate *(prerequisite; highest risk, no user-visible feature)*

**Goal:** one hydration mechanism, plus the ability to render a component's HTML
while suppressing its scope/runtime.

1. **Unify the 3 partial impls** into `deferHydration` (`signals.ts:1395` — which
   already has all triggers). Deprecate `hydration.ts`'s unused helpers; fold
   `partial-hydration.ts`'s `@client:*` into the same path.
2. **Split detection:** add `hasClientInteractivity()` distinct from
   `hasSignalsSyntax()`. A page using `state()` only for SSR variable extraction
   should not ship the runtime. (`signal-processing.ts:183` is the seam.)
3. **The suppression gate:** thread a per-render hydration decision through
   `processSignals` (`signal-processing.ts:1476`) → `injectSignalsRuntime`
   (`runtime-injection.ts:109`) → `addScopeToRootElement` / `transformSignalScript`
   (`includes.ts:326,276`). Server-only unit ⇒ skip the scope IIFE, the
   `data-stx*` attrs, and (if nothing hydrates) the runtime itself.
4. **The make-or-break risk — don't strand directives.** When the runtime is
   suppressed, `@if`/`@for` over **server** data must still render via
   `processConditionals`/`processLoops`. `convertSignalDirectivesToAttributes`
   (`signal-processing.ts:471`) already decides per-condition whether something
   is client-reactive (cf. #1748). Phase 0 must guarantee *suppress runtime ⇒ all
   remaining `@if`/`@for` are provably server-evaluable*, else bare unprocessed
   markup ships (silent failure).

**Verify:** a page with only server `@if`/`@foreach` + `{{ }}` ships **zero**
`data-stx*` attrs and **no** runtime, yet renders identically (snapshot + a
"no `<script data-stx-scoped>` emitted" assertion).

## Phase 1 — Per-component `client="load|visible|idle|interaction|media:…"` *(the headline win)*

> **First increment shipped:** the `client="…"` directive now defers a
> component's hydration *work* (`processElement`) to the trigger by stamping
> `stx-hydrate` on its scope wrapper (`utils.ts` `renderComponentWithSlot`,
> consumed via the existing `deferHydration`). Opt-in, zero blast radius. Still
> to do in this phase: byte-level suppression (don't ship the scope script until
> the trigger) and trigger-timed `onMount`. See [docs](/features/lazy-hydration).

**Goal:** `<CommentsList client="visible" />` ships HTML now, hydrates on trigger.

- **Seam:** `processCustomElementTags` (`component-renderer.ts:791`) parses the
  `client` attr; `renderComponentWithSlot` (`utils.ts:956`) currently
  *unconditionally* wraps signal components in `data-stx-scope`. Gate that:
  emit the HTML, but instead of an eager scope, stamp `stx-hydrate="<trigger>"`
  on the wrapper (already honored by `deferHydration`) and mark the scope script
  deferred.
- **Reuse:** `deferHydration` (all triggers done), `findElementScope`
  (`signals.ts:1230`), the `stx:hydrated` event (`signals.ts:1407`), the existing
  `data-stx-props` serialization.
- **Risks / mitigations:**
  - **Shared state** — a component exporting via `defineExpose`/`provide` can't
    be deferred (dependents read `undefined`). Restrict deferral to *leaf*
    islands; validate at compile time.
  - **Callback props** can't be JSON-serialized (`utils.ts:965` already fails
    silently) → reject non-serializable props on islands, or add a `scopeId`-keyed
    callback registry (later).
  - **SPA-nav cleanup** — cancel pending observers/timers when `cleanupContainer`
    tears a scope down.

**Verify:** DOM-shim tests that a `client="visible"` component is inert until an
IntersectionObserver fires, then processes. **Acceptance metric:** the
bench-review article page JS drops toward the ~50KB target.

## Phase 2 — Per-file `'use client'` + server-only default *(the default flip; behind a flag)*

- **Seam:** detect the marker in `build-mode-detector.ts:27` / before TS-strip in
  `variable-extractor.ts`; set `context.__stx_useClient` **at top level only**
  (don't let a layout's mode infect children — `isTopLevel`, `process.ts:290`).
  Gate the client-script block (`process.ts:1302–1435`) + runtime injection on it.
- **Risk:** this *flips the default* → ship behind an `islands: true` project
  config, with a codemod that adds `'use client'` to existing interactive files.
  `validateComponentScripts` (`build-mode-detector.ts:84`) already rejects mixed
  server+client — extend it to reject `'use client'` + `<script server>`.

## Phase 3 — Streaming SSR *(independent track; builds on the shipped `<Suspense>`)*

- **Wire-in seam:** `serve-app.ts:751` returns a synchronous `Response`. When a
  page has suspense queries, call `streamTemplate` (`streaming.ts:180`) +
  `streamToResponse` (`streaming.ts:709`, currently unused) instead.
- **The hard gap:** `useQuery({suspense})` registers synchronously but only
  `fetchData()`s on `onMount` (**client-only**), and `registerSuspense` reads
  `__STX_CURRENT_ELEMENT__` (no DOM on server). Streaming needs **server-side
  eager query execution** + a context-based (not DOM-based) boundary registry,
  then a **deterministic-ID handshake** so the client `bindSuspense`
  (`signals.ts:1872`) recognizes already-streamed content (mark it
  `data-stx-streamed` to skip re-processing) and the resolver sets the client
  error signal on failure.
- **Reuse:** `buildSuspenseResolveScript` (escaping/error handling),
  `window.__stxSuspense.resolve`, the three-region Suspense markup (#1742).
- **Verify:** mostly needs a **real browser / HTTP** harness (chunked transfer,
  backpressure) — the one phase that can't be fully unit-tested in happy-dom.

## Phase 4 — Resumability (Qwik-style) — *research spike only*

Out of near-term scope; a separate design exercise (serialize state + lazy event
wiring instead of hydration). Do not block 0–3 on it.

---

## Decisions that need a maintainer call

1. **Default flip:** opt-in via `islands: true` config (recommended) or flip
   globally at a major version?
2. **Island callback props:** reject at compile time, or build a `scopeId`
   callback registry?
3. **`@island`/streaming vs `client:*`:** the existing `@island` streaming
   directive (`streaming.ts:622`) overlaps conceptually — converge them or keep
   orthogonal (docs-only)?
4. **Marker syntax:** `client="visible"` (attribute) vs Astro's `client:visible`
   — the `:` collides with stx's directive prefix, so the attribute form is safer.

## Effort & sequencing

| Phase | Estimate | Notes |
|---|---|---|
| 0 — consolidate + gate | ~2–3 wks | the correctness gate is the crux |
| 1 — per-component `client=` | ~2 wks | mostly reuse of `deferHydration` |
| 2 — `'use client'` default flip | ~1–2 wks + migration | behind a flag |
| 3 — streaming SSR | ~3–4 wks | browser-validated |
| 4 — resumability | research | out of near-term scope |

**Phase 0 + 1 alone deliver most of the bundle-size win** and are independently
shippable — that's the natural first PR.

## Related

Pairs with #1739 (SSR `:if` branch elimination) and #1742's `<Suspense>` /
`useQuery({suspense})` (both shipped). All three are the same direction: render
more on the server, ship less to the client.
