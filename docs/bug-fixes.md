# Bug Fixes & Resolutions

Tracking significant bugs found and fixed during development. Most recent first.

---

## Component Resolution Depended on `process.cwd()` (2026-05-31)

**Problem:** `userComponentFileExists` and `renderComponentWithSlot` (`utils.ts`)
built their "convention" component search dirs (`src/components`,
`resources/views/components`, `components`, …) by resolving against
`process.cwd()`. So whether a user file shadowed a built-in depended on **where the
process was launched**, not the project. Running from `packages/stx`, resolution
found stx's own `packages/stx/src/components/StxLink.stx`, shadowed the `<StxLink>`
built-in, and — because that file renders `<stx-link>`, which re-resolves to
itself — produced `[Circular component reference: stx-link]`. Worse, the two
functions could disagree about *which* file a tag resolves to (one keyed off cwd,
the other off config), a latent correctness hazard. Symptom: several component
tests passed from the repo root but failed from `packages/stx`.

**Fix:** Both functions now derive the project root from the **configured**
`options.root` (resolved absolute) and fall back to the rendered file's directory —
never `process.cwd()`. The convention search dirs only apply within an explicitly
configured root; the built-in `import.meta.dir/components` dir is always searched
(cwd-independent). Resolution is now deterministic regardless of launch directory,
and the two functions agree. Guarded by cwd-independence tests in
`test/components/builtin-override.test.ts`. The full suite now passes from both the
repo root and `packages/stx`.

---

## Security Hardening Pass — masks, builtins, event fallback (2026-05-31)

Follow-ups after the `<script>`-stash XSS, closing the same bug class everywhere:

- **Comment & script-expr masks (same un-escape-on-restore class).** `process.ts`
  masked `<!-- … -->` and `expressions.ts` masked `<script>`/`<style>` with global
  regexes, then restored them raw — so a comment/script inside an attribute value
  could break out of the attribute on restore (defeating the renderer's escaping).
  Both now route through `html-masking.ts` `maskAtElementPosition`, which only masks
  tokens at element position (not inside an open tag or quoted attribute value).
- **Builtins didn't escape interpolated props.** `icon` (class/style/size/color),
  `drawer`/`modal` (id), `toast` (position) interpolated prop values into attributes
  unescaped — unlike StxLink/StxImage. Added a shared `builtins/escape.ts` and
  applied it. (`tooltip`/`stx-loading-indicator` were already safe.)
- **Non-reactive `@event` fallback.** The fallback inlined the HTML-entity-encoded
  handler as raw JS (`else { doIt(&quot;a&quot;) }`) — invalid JS, and it never ran
  for forwarded handlers. Now routed through `__stx_runHandler`, which keeps the
  handler entity-encoded in the emitted `<script>` (no `</script>` breakout) and
  decodes it to JS only in memory before running it with `$event`/`$el` in scope.
- **Conditional reactivity heuristic** (`conditionIsClientReactive`) now treats only
  **zero-arg** getter calls (`loading()`, `cart.count()`) as signal-driven; with-arg
  calls (`formatDate(x)`) are assumed server helpers and stay server-side, removing a
  false positive on helpers not present in the server context.

---

## XSS via `<script>` Stashing Inside Attribute Values (2026-05-30)

**Problem:** The component scanner stashes real `<script>…</script>` element bodies behind NUL sentinels before its three regex passes (so JS string literals like Leaflet's `'<v:shape>'` aren't mis-resolved as components — #1730). The stash regex (`/<script\b[^>]*>[\s\S]*?<\/script>/gi`) was **not quote-aware**, so a `<script>` appearing inside an *attribute value* — e.g. `<StxLink aria-label="<script>alert(1)</script>">` — was also pulled out. The renderer's `escapeAttr`/`escapeAttribute` then ran against the harmless placeholder, and the raw `<script>alert(1)</script>` was restored back into the attribute afterward, unescaped — an XSS sink on every builtin/component that forwards static attrs or `@event` handlers.

**Fix:** Replaced both stash sites (`component-renderer.ts`, `component-processing.ts`) with a shared tag/quote-aware walker, `stashScriptElements()` (+ `restoreStashedScripts()`) in `component-processing.ts`. It only stashes a `<script>` that begins at *element position* (not within an open tag, not inside a quoted attribute value); a script embedded in an attribute is left in place to be HTML-escaped normally. Covered by `test/components/security.test.ts` and unit tests in `test/components/script-tag-stashing.test.ts`.

---

## `@if`/`v-if` Else-Chains Not Reactive on Signal Pages (2026-05-30)

**Problem:** `@if`/`v-if`/`:if` were documented as three frozen "lifecycles," but the intent is interchangeable sugar (`v-if`→`@if`, `x-if`→`:if`) where reactivity follows the data. The converter already promoted signal-driven `@if` blocks to reactive attributes, but **skipped any block containing `@elseif`/`@else`**, so a reactive if/else chain had to be written with `:if`/`:else`. Separately, the no-else path converted *any* `@if` on a signal page, which could drag a server/loop-data condition (`@if(b.status)` inside a server `@foreach`) client-side where its variables don't exist.

**Fix:** `convertSignalDirectivesToAttributes` now (a) promotes `@if`/`@elseif`/`@else` chains to reactive `@if`/`@else-if`/`@else` attribute sibling-chains (the runtime's `findIfChain`/`bindIfChain` already handle those attrs), and (b) decides conversion **per condition** via `conditionIsClientReactive` — client-reactive iff it reads a declared signal or a non-server getter call and doesn't read a bare `<script server>` var. Server/loop-data conditions stay textual for `processConditionals`. Docs (`prefix-convention.md`, `directives.md`, CLAUDE.md) rewritten to the unified model.

---

## Route Guard Middleware for SSG (2026-04-16)

**Commit:** `00ad5bc998`

**Problem:** No way to protect pages during SSG builds. Auth-gated pages like `/dashboard` would generate as normal HTML accessible to anyone.

**Fix:** SSG builds now run route middleware (`middleware/auth.ts`) before rendering each page. Auth middleware generates a static redirect page (`<meta http-equiv="refresh">`) instead of the real content. Works on all static hosts.

**Usage:**
```ts
// middleware/auth.ts
export default defineMiddleware(async (ctx) => {
  if (!ctx.cookies.get('session')) return navigateTo('/login')
})

// pages/dashboard.stx
<script server>
  definePageMeta({ middleware: ['auth'] })
</script>
```

---

## `defineStore` / `useStore` Not Exposed as Globals (2026-04-15)

**Commit:** `3064af8679`

**Problem:** `defineStore()` and `useStore()` were only on `window.stx.defineStore` but not exposed as bare globals like `state`, `derived`, `onMount`, etc. `<script client>` blocks calling `defineStore()` without `stx.` prefix would get `ReferenceError`.

**Fix:** Added `window.defineStore = window.stx.defineStore` and `window.useStore = window.stx.useStore` alongside the other global exports in the signals runtime.

---

## `:for` Full DOM Teardown on Unrelated Signal Changes (2026-04-15)

**Issue:** [#1666](https://github.com/stacksjs/stx/issues/1666)
**Commit:** `c2cad94aa8`

**Problem:** `:for` re-rendered every item when any signal in the component scope changed — even signals completely unrelated to the loop data. Clicking a modal toggle would rebuild an entire calendar grid (390+ bindIf log lines, visible UI glitch).

**Root cause:** `effect()` inside `bindFor` used `evalExpr()` which eagerly unwrapped ALL signals via `Object.values(unwrapScope)`, registering every signal as a dependency.

**Fix:** Two changes:
1. **Narrow dependency tracking** via `evalLazy()` — uses `with(scope)` so only variables actually accessed by the list expression trigger signal reads
2. **Key-based diffing** — reuses DOM nodes by `:key` instead of teardown/rebuild. Items wrapped in signals so bindings auto-update when data changes.

---

## `:for` Keyed Items Don't Re-evaluate Bindings (2026-04-15)

**Issue:** [#1669](https://github.com/stacksjs/stx/issues/1669)
**Commit:** `c2cad94aa8`

**Problem:** When `:for` reused a DOM node by `:key` match and the item data changed, bindings (`:text`, `:if`, `:class`) showed stale data from the old item.

**Fix:** Each loop item is now wrapped in a signal. When the list updates and a key matches, `signal.set(newItem)` triggers all bindings to re-evaluate via the reactive dependency graph.

---

## `@show`/`:show` Silently Corrupts Sibling Rendering (2026-04-15)

**Issue:** [#1668](https://github.com/stacksjs/stx/issues/1668) (Bug 1+5)
**Commit:** `67ff69f270`

**Problem:** `@show="!recording()"` (any call expression) silently failed. The signal was eagerly unwrapped to its boolean value, then the expression tried to call a boolean as a function. TypeError was caught and swallowed. ALL sibling elements after the failing `:show` stopped rendering.

**Fix:** `bindShow` now uses `createAutoUnwrapProxy` with a retry-without-unwrap fallback, matching the pattern already used by `evalAttrExpr` (`:text`, `:class`).

---

## SPA Router: Setup Scripts Redeclare on Navigation (2026-04-15)

**Issue:** [#1668](https://github.com/stacksjs/stx/issues/1668) (Bug 2)
**Commit:** `29a3f6fc25`

**Problem:** `Uncaught SyntaxError: Identifier 'dark' has already been declared` when navigating between pages. Layout-level partials (theme.stx, seed.stx) with top-level `const`/`function` declarations were re-executed on every SPA navigation.

**Fix:** Track executed script content hashes. Scripts already executed on initial page load are skipped on subsequent navigations. Setup functions (`__stx_setup_`) are exempt since each page has its own.

---

## SPA Router: Component Imports Break on Navigation (2026-04-15)

**Issue:** [#1668](https://github.com/stacksjs/stx/issues/1668) (Bug 3)
**Commit:** `29a3f6fc25`

**Problem:** `Cannot use import statement outside a module` when navigating to pages with component `<script setup>` blocks containing `import` statements.

**Fix:** Detect `import` statements in re-injected scripts and set `type="module"` on the `<script>` element.

---

## SPA Router: Layout Swap Not Triggered for Same-Group Layouts (2026-04-15)

**Commit:** `a645a910be`

**Problem:** Navigating from `layouts/app` to `layouts/coach` only swapped `<main>` content — nav, sidebar, and other layout-level elements stayed from the old layout. The router only compared layout GROUPS (`app` vs `auth`), not specific layout names.

**Fix:** Added a second check in `checkLayoutChange()`: if the specific layout name differs (even within the same group), trigger a full body swap.

---

## SSG Minifier Breaks JavaScript with `//` Comments (2026-04-15)

**Commit:** `a645a910be`

**Problem:** `Uncaught SyntaxError: Unexpected end of input` on 3 scripts in SSG-built pages. The `minifyHtml()` function collapsed ALL whitespace (including newlines inside `<script>` blocks) into single spaces. JavaScript `//` single-line comments rely on newlines to terminate — without them, `//` comments out everything after it until end of file.

**Fix:** Split HTML into script/non-script segments during minification. HTML gets full whitespace collapsing. Script content gets `//` comment stripping while preserving structure.

---

## SSG: `processDirectives` Skips All Processing When `ssr: false` (2026-04-15)

**Commit:** `a645a910be`

**Problem:** After flipping the default `ssr` to `false`, ALL templates were returned raw (unprocessed `@extends`, `@section`, `@include`) because `process.ts` line 89 had `if (options.ssr === false) return template`. This guard was written when `ssr` defaulted to `true` — flipping the default made every SSG build silently return raw templates.

**Fix:** Narrowed the guard to only skip processing for the legacy SPA-shell serving mode (`buildMode === 'spa'`), not for SSG builds.

---

## SSG: `buildApp()` Doesn't Pass Config Directory Mappings (2026-04-15)

**Commit:** `a645a910be`

**Problem:** `generateStaticSite()` used default `pagesDir: 'pages'` instead of reading from `stx.config.ts`. Stacks apps with `pagesDir: 'views'` and `root: 'resources'` produced 0 pages.

**Fix:** `buildApp()` now joins `config.root` + `config.pagesDir` (and `publicDir`) before passing to `generateStaticSite()`.

---

## Layout Resolver Doubles `layouts/` Prefix (2026-04-14)

**Commit:** `a645a910be`

**Problem:** `@extends('layouts/app')` with `layoutsDir: 'resources/layouts'` resolved to `resources/layouts/layouts/app` — doubled prefix. Layout not found, template returned raw.

**Fix:** Strip `layouts/` prefix from the template path before joining with `layoutsDir` in `utils.ts:875`, matching the pattern already used by the directory-walk resolver.

---

## Unified Build: SSG/SSR Config Flag (2026-04-13)

**Commit:** `7bc12b20f8`

**Problem:** Users had to manually choose between `buildForProduction()` (SSR) and `generateStaticSite()` (SSG) in their `build.ts`. No single entry point, no config-driven selection.

**Fix:** New `buildApp()` function reads `ssr` from `stx.config.ts` (default: `false`). `ssr: false` → SSG → `dist/`. `ssr: true` → SSR → `.output/`. `<script server>` works in both modes — the flag controls WHEN it runs (build time vs request time).

---

## ts-cloud: 4 Gaps in Static-Site-on-Route53 Deploy (2026-04-11)

**Commit (upstream):** `5c3e598`

**Problems:**
1. Route53 excluded from the lightweight `sites: {}` deploy path (`!== 'route53'` exclusion)
2. `cloud deploy` on infrastructure path doesn't upload files
3. `public` bucket name hardcoded for alias auto-wiring
4. `public` bucket forces SPA assumptions, breaking multi-page SSG

**Fixes (all in ts-cloud):**
1. Removed Route53 exclusion, added `route53-adapter.ts`
2. Added `root` field on `StorageItemConfig` for auto-upload
3. Added explicit `aliases` field on `StorageItemConfig`
4. `spa` defaults to `false`, URL-rewrite CloudFront Function auto-created

See `cloudtodo.md` in ultrarunner-paw for full details.

---

## CSS Class Sorter Mangles `:class` Expressions (2026-04-14)

**Affected:** trailbuddy (35 expressions across 10 files)

**Problem:** Crosswind/Tailwind class sorter alphabetized CSS classes inside `:class` attribute values, destroying the JavaScript ternary expressions. `difficulty() === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'` became `text-gray-600 text-white' dark:text-slate-400' : ? 'all' 'bg-emerald-600 === difficulty()`.

**Fix:** Manually reconstructed all 35 expressions. The class sorter needs to be configured to skip `:class`, `x-bind:class`, and `@bind:class` attributes.
