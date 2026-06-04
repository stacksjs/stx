# Proposal: Stacks DevTools

> Tracking issue: [stacksjs/stx#1747](https://github.com/stacksjs/stx/issues/1747)
> Status: **planning** · Effort: **XL** (Phase 1 is the shippable, in-repo first PR)
>
> Grounded in a file:line audit of the runtime's introspection surface and the
> existing `devtools.ts` / `packages/devtools` code.

## Goal

A Vue/React-DevTools-class inspector for stx: component tree, signal/scope
inspector, reactive-graph + effect-run profiler, `:if` decision trace, and a
query timeline. Today debugging means `console.log`, `querySelectorAll(
'[data-stx-scope]')`, and reading `window.stx._scopes` by hand.

## Current reality (what exists vs what's missing)

- **Data source exists:** `window.stx._scopes` (scope registry), `findElementScope`
  (`signals.ts:1226`), `_stores`, and `_isSignal`/`_isDerived`/`_isStxStore`
  markers — enough to build the **component tree + scope-var inspector** today.
- **A `devtools.ts` already exists** (`enableDevTools`, `ComponentInfo`,
  `StoreInfo`, `MutationRecord`, `registerComponent`…) — but it's a **manual** API
  (requires explicit `registerComponent` calls) and isn't wired to the live
  runtime. **Consolidate into it; don't fork a parallel one.**
- **`packages/devtools/` is a different thing** — a server-side project
  **dashboard** (template explorer, perf, config), not a runtime reactive
  inspector. Keep these distinct (and say so in docs).
- **The reactive graph is tracked but not exposed:** every signal already holds
  its subscribed `effects` set internally (`signals.ts:494`, closure) — but it's
  private. **No set/run counters exist** (the issue's "set 3x", "re-ran 8x" need
  new dev-mode instrumentation).

## Foundational reframing (same shape as #1746)

The issue's Phase 1 (a console/programmatic API) **is the whole near-term
deliverable that lives in this repo.** Phases 2/4/6 are a **separate
browser-extension package** — mostly UI consuming a protocol, a year-long
effort, and it belongs in its own package/repo. So: **build the in-runtime
introspection protocol first** (independently useful from the console), then the
extension is a thin client of it.

---

## Phase 1 — `window.__stxDevtools` programmatic API *(in-repo, shippable now)*

> **Shipped.** The runtime now exposes a read-only `window.__stxDevtools`:
> `tree()` (component tree from `[data-stx-scope]`, nested by DOM ancestry),
> `scope(id)` (signals / derived / stores / methods / plain values for a scope),
> `inspect(el)` (nearest enclosing scope), and `stores()`. Auto-wired — no manual
> `registerComponent`. Signal values are read via `peek`, so inspecting never
> subscribes the active effect (it can't pollute the reactive graph). Phase 2
> (the live dependency graph + set/run counters) is the next increment.

**Goal:** auto-wired, documented introspection — no extension needed.

- **Component tree:** walk `[data-stx-scope]` DOM elements + `_scopes`,
  parent/child by DOM nesting, names from the scope id. New surface that reads the
  runtime instead of requiring `registerComponent`.
- **Scope inspector:** for a scope, list vars; classify by
  `_isSignal`/`_isDerived`/`_isStxStore`; read values via `peek`/`untrack`
  (`signals.ts`) so inspection **does not pollute the dependency graph**.
- **Reuse:** `findElementScope`, the `_scopes`/`_stores` registries, the existing
  `devtools.ts` types.
- **Risks:** reading a signal naively *subscribes the active effect* — must use
  `peek`. The API must be **debug-gated / absent in production** (no info-leak, no
  overhead).
- **Verify:** unit-test tree/scope serialization against a constructed `_scopes` —
  fully testable in happy-dom.

## Phase 2 — Runtime instrumentation (graph + counters) *(in-repo, dev-mode only)*

**Goal:** expose what Phases 3–5 of the UI need.

- **Reactive graph:** in debug mode, attach each signal's subscriber/`effects` set
  (or a `WeakMap` registry) so `__stxDevtools` can report "which effects read this
  signal" and "which signals a derived reads."
- **Counters:** dev-mode increment on `.set()` (set count) and effect re-run (run
  count). The binders already carry labels (`bindIfChain`/`bindFor` diagnostics
  currently emitted as `[stx] …` `console.log`s) — turn those into **structured
  records**.
- **Risk:** **overhead + memory** — strictly behind the `debug` flag, never in the
  prod runtime. (DevTools is client-only, so instrument the runtime impl; the
  `signals-api.ts` module impl can be left alone.)

## Phase 3 — Conditional-render trace + query timeline *(in-repo data, extension UI)*

- **`:if` trace:** `bindIfChain` already computes the picked branch (the
  `pick: <idx>` diagnostics) — emit them as structured trace records.
- **Query timeline:** instrument `useQuery`/`useFetch`/`useMutation` (the data
  layer now exists, #1742) to push `{url, status, ms, cached, optimistic}` records
  — clean, since those are single runtime functions.

## Phases 4–6 — The browser extension *(separate package; the year-long part)*

- **Architecture (standard trifecta):** injected page-script reads
  `window.__stxDevtools` and `postMessage`s → content script relays → a **devtools
  panel** UI (built in stx itself — dogfooding). The **message protocol** is the
  real contract; design it once in Phase 1 so the extension stays thin.
- **SSR/hydration diff (Phase 6):** compare SSR HTML vs a client dry-render —
  depends on #1739 (SSR branch elimination); the most speculative, do last.
- **Where it lives:** a new `packages/devtools-extension` (or its own repo). Not
  the existing `packages/devtools` (server dashboard) — keep them distinct.

---

## Decisions that need a maintainer call

1. **Build on `devtools.ts`** (auto-wire it to the runtime + expose as
   `__stxDevtools`) — recommended — or start fresh?
2. **Instrumentation gating:** counters/graph behind the existing `debug` flag
   only (recommended) — confirm prod must stay zero-overhead.
3. **Extension home:** `packages/devtools-extension` in this monorepo, or its own
   repo?
4. **Reconcile with `packages/devtools`** (the server dashboard) — shared
   branding/launcher, or fully separate tools?

## Effort & sequencing

| Phase | Estimate | Notes |
|---|---|---|
| 1 — `__stxDevtools` API | ~1–2 wks | mostly wrapping existing data |
| 2 — runtime instrumentation | ~2 wks | dev-gated graph + counters |
| 3 — `:if` trace + query timeline | ~1–2 wks | structured records from existing diagnostics |
| 4–6 — extension UI + SSR diff | months | separate package |

**Phase 1 alone retires the manual `[stx-debug]` probing** the issue calls out —
that's the natural first PR, in-repo and fully testable.
