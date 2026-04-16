# Bug Fixes & Resolutions

Tracking significant bugs found and fixed during development. Most recent first.

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
