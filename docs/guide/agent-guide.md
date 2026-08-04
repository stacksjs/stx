# Agent guide for writing stx

> **Status note (2026-08-05).** This guide was produced by auditing a real
> production app against the framework surface it was failing to use, on stx
> `0.2.113`. Several of the framework defects it cites as root causes have since
> been fixed, so a handful of its warnings now describe history rather than
> current behaviour. The *rules* still hold — they are about writing stx well,
> not about working around bugs — but where a rule says "because the framework
> does X", check whether X is still true.
>
> Fixed since the audit, all of which this guide references:
>
> | Cited defect | Status |
> |---|---|
> | A `<!DOCTYPE>` anywhere disables the layout system (`process.js:311`) | Fixed — the gate is anchored (#1792 item 1) |
> | A literal `<html>` in a comment skips the document shell | Fixed — anchored (#1792 item 3) |
> | Page title interpolated unescaped (stored XSS) | Fixed (#1792 item 4) |
> | `</script>` in a string or comment truncates the block | Fixed — escaped at emit (#1792 item 2) |
> | Directory options double-prefixed by root resolution | Diagnosed at load; the prefixing itself is unchanged (#1792 item 8) |
> | `definePageMeta({ title })` is a silent no-op | Fixed (#1792 item 5) |
> | `site.config.ts` title can never set `<title>` | Fixed (#1792 item 6) |
> | Router defaults disagree across packages | Fixed — one default, forwarded everywhere (#1792 P2) |
> | Browser-only composables unreachable from the client | Fixed — bundled on demand (#1805) |
>
> The audit that produced this guide is the reason those were found. Its value
> was never only the rules.

---

A prescriptive guide for **AI coding agents** writing `.stx` files, produced by auditing a real
production app ([bughq](https://github.com/bughq/bughq), stx `0.2.113`) against the framework surface
it was failing to use.

The twelve chapters are posted as comments below. Each rule is written as **RULE → WHY (with framework
`file:line`) → WRONG (real code) → RIGHT → CHECK (a runnable command)**.

## Why this exists

bughq is ~6,500 lines of stx written largely by AI agents. It works. It is also, structurally, an app
that never switched the framework on:

| | |
|---|---|
| Pages carrying their own `<!DOCTYPE>` | **24** |
| Internal plain `<a href="/…">` | **276** (264 after the 12 deliberate `data-no-router` opt-outs) |
| `<StxLink>` elements | **29**, in 11 files — none in `SiteNav.stx` (35 anchors) or `SiteFooter.stx` (26) |
| Files with an inline `<style>` block | **23** under `views`/`partials`/`components` (6 more are SVG assets, where it is legitimate) |
| Stores | **0** |
| Uses of `@stacksjs/components` (45 primitives installed) | **0** |
| `useSeoMeta` calls | **0** |
| `onMount` / `onDestroy` in any `.stx` | **0** |
| Prohibited DOM calls | **68** across 10 files |

The root cause is one line of the framework:

```js
// process.js:311
const hasDoctype = /<!DOCTYPE\s/i.test(output), hasSections = /@section\s*\(/.test(output)
if (!hasDoctype || hasSections) {   // ← a doctype opts the page out of layouts entirely
```

Every page that writes its own document silently disables layout resolution, which disables runtime
head config, which is why `useHead`/`useSeoMeta` cannot work on those pages, which is why the shell is
duplicated 24 times, which is why the app/marketing boundary exists, which is why
`interceptAllLinks: true` is load-bearing. One regex, the whole architecture downstream of it.

A companion RFC covering the framework-side changes is filed separately.


## The rules

| # | Rule |
|---|---|
| 1 | Never write `<!DOCTYPE>`, `<html>`, `<head>` or `<body>` in a page or component |
| 2 | Never write vanilla DOM code |
| 3 | Never write vanilla CSS — Crosswind only |
| 4 | Use `StxLink` for every internal navigation |
| 5 | Use `useHead` / `useSeoMeta` — never hand-write `<title>` or meta in a page |
| 6 | Use `@stacksjs/components` before hand-rolling any UI primitive |
| 7 | Cross-page state goes in a store, not duplicated per page |
| 8 | Use directives, not JS that builds markup |
| 9 | Never hand-import an auto-imported symbol |
| **10** | **Annotate every parameter, every return, and all server data** |
| 10b | Shared types live in `types/` as ambient declarations |
| 11 | At most two script blocks per file; `client`, `setup` and `lang="ts"` are redundant |
| 12 | Never let user data reach a script block unencoded |

### Rule 10 needs saying out loud

A `.stx` script block is **compiled as TypeScript whether or not you type it** —
`shouldTranspileTypeScript()` (`utils.js:28-33`) returns true unless the block is tagged
`lang="js"`, and server blocks go through `new Bun.Transpiler({ loader: 'ts' })`
(`variable-extractor.js:218`).

So there is no "JavaScript phase" of an stx codebase and no migration to schedule. There is only
typed TypeScript and untyped TypeScript — and untyped TypeScript is strictly worse than
JavaScript, because it pays the cost of a compiler and delivers none of the guarantee. Annotate
as you write, not in a later pass.

The audited app had **12 annotations across 123 functions**, leaving ~58 of 70 parameters
implicitly `any`. It was described as TypeScript throughout.

**Know what annotations are worth right now:** nothing verifies them. `tsc --noEmit` cannot see
inside `.stx` files. Verified by putting `const x: number = 'a string'` in a client block — `tsc`
silent, page renders 200, linter silent. Three gates, none caught it. That is an argument for
fixing the toolchain, not for skipping types, but it does mean a wrong annotation is a real
defect rather than something a compiler catches. The framework's own `useLocalStorage` declares
`: void` while returning a ref (#1795) — that is what unchecked types decay into.

Two auto-import consequences that will bite:

- Only `import type` is ever acceptable, and only for types. Auto-imported symbols have ambient
  declarations in `dist/stx.d.ts`.
- Never write the generic form at a client call site. Detection matches `\b<symbol>\s*\(`
  (`client-script.js:315`), so `useLocalStorage<string>(…)` puts a `<` where the `(` must be — the
  symbol is never detected and you get a `ReferenceError`. Annotate the destination instead.

## Verification

| Check | Result |
|---|---|
| `file:line` citations resolved and in range | **1,843 / 1,850 (99.6%)** |
| Citations to a non-existent file | 1 |
| Citations overshooting EOF | 4, by 1–7 lines |
| Findings behind the guide | 60 raised → **33 confirmed**, 27 refuted under adversarial review |

**Errata:** several chapters say `@extends`/`@section`/`@yield` are used zero times. Precisely: zero
times *in pages*. The two layout files do define slots (`layouts/default.stx:39,42,44`,
`layouts/marketing.stx:6,7,11,12,13`) that nothing fills.

## Chapters

1. Project topology and configuration
2. Page anatomy — never write a document
3. Layouts and the application shell
4. Head, SEO and structured data
5. Server blocks and the server-to-client bridge
6. State: signals, stores and composables
7. Templates: directives and bindings
8. No vanilla JS — the strict-mode mandate
9. Navigation and routing
10. Components
11. Styling with Crosswind, and TypeScript
12. Verification and enforcement


---

### Correction (post-filing)

Three figures in the table above were wrong when this issue was first published, and have been fixed:

| Figure | Published | Correct | Cause |
|---|---|---|---|
| `StxLink` uses | 57 | **29** | counted `<StxLink` *and* `</StxLink` as separate uses |
| Internal anchors | 299 | **276** | `grep 'href="/'` also matched 23 `<link rel=stylesheet href="/…">` |
| Files with `<style>` | 29 | **23** | 6 of the 29 are SVGs under `resources/assets/`, where `<style>` is normal |

Commands the corrected numbers come from:

```bash
grep -rho '<StxLink' resources/ | wc -l                    # 29
grep -rhoE '<a [^>]*href="/' resources/ | wc -l            # 276
grep -rl '<style>' resources/views resources/partials resources/components | wc -l   # 23
```

The conclusions are unchanged — if anything `StxLink` adoption is half what was reported. The chapter
comments below were independently checked: **1,843 of 1,850 `file:line` citations resolve and are in
range (99.6%)**.



---

## 1. Project topology and configuration

There is no `index.html` in this project and there must never be one. `config/ui.ts` is the application root: it declares where pages, layouts, components, partials and stores live, and `app.head` is the only document `<head>` stx generates (`process.js:205-233` → `document-shell.js:101-105`). Every rule in this chapter is about making that declaration true — because today **three of the five keys `config/ui.ts` sets resolve to directories that do not exist**, and the app only boots because two different servers pass overrides on top.

### The two config loaders (read this before touching `config/ui.ts`)

`config/ui.ts` is loaded twice, by two different loaders, with different semantics. Every topology bug in bughq is a consequence of not knowing this.

| | Loader A — `loadStxConfig()` | Loader B — raw `bunfig` |
|---|---|---|
| Entry point | `node_modules/@stacksjs/stx/dist/config.js:387` | `node_modules/bun-plugin-stx/dist/serve.js:8912-8919` |
| Defaults merged | `stx` `defaultConfig` (`config.js:16-24`), `ssr: false` | `defaultStxConfig` (`serve.js:8828-8835`), `ssr: true` |
| Applies `resolveStxRoot` | **Yes** (`config.js:408`) | **No** |
| Prefixes `partialsDir`/`componentsDir`/`layoutsDir` with `root` | **Yes** (`config.js:411-419`) | **No** |
| Loads `plugins` → `_pluginComponentDirs` | Yes (`config.js:420-468`) | No (imports A's result at `serve.js:8922-8930`) |
| Used by | `stx build` (`build.js:4`), SSG, `production-builder.js:46-50`, `store-loader.js:11`, Crosswind config discovery | the dev server (`bun scripts/dev.ts`) and `buddy serve` request path |

A relative directory value **cannot** be correct in both loaders unless `root` is `'.'` or the value is absolute. Verified by running both against this repo:

```
config/ui.ts value: componentsDir: 'resources/components'
  Loader B (serve): "resources/components"           EXISTS
  Loader A (build): "resources/resources/components" MISSING
```

### Directory option inventory

Every path-bearing key in `StxConfig`, its default, what it resolves against, and bughq's current state.

| Key | `config-types.d.ts` | Default | Resolved against | Primary consumer | bughq today |
|---|---|---|---|---|---|
| `root` | :260 | inferred by `resolveStxRoot` (`config.js:363-374`) | cwd | `config.js:411`, `utils.js:321`, `store-loader.js:11` | **inferred** `'resources'` |
| `pagesDir` | :262 | `'pages'` | `root` | `build.js:10`, `stx-router` `Router` (`file-router.js:38-40`) | **inferred** `'views'` |
| `componentsDir` | :273 | `'components'` (`config.js:20`) | `root` (`config.js:415-416`) | `utils.js:327`, `utils.js:397` | `'resources/components'` → **`resources/resources/components` (missing)** |
| `layoutsDir` | :274 | `'layouts'` (`config.js:21`) | `root` (`config.js:417-418`) | `process.js:329-331` | `'resources/layouts'` → **`resources/resources/layouts` (missing)** |
| `partialsDir` | :272 | `'partials'` (`config.js:19`) | `root` (`config.js:413-414`) | `includes.js:245-247`, `includes.js:480-508` | `'resources/partials'` → **`resources/resources/partials` (missing)** |
| `storesDir` | :275 | `'stores'` | `root` (`store-loader.js:11`) | `process.js:245` | **unset** — no stores dir exists |
| `publicDir` | :278 | `'public'` (`serve.js:8938`) | cwd | serve static handler | unset → `public/` |
| `stateDir` | :261 | `'.stx'` (`state-dir.js:2`) | cwd | route codegen, HTML cache | unset → `.stx/` |
| `cachePath` | :283 | `'.stx/cache'` | cwd | `caching.js` | unset |
| `defaultLayout` | :276 | `'default'` (`config.js:22`) | `layoutsDir` | `process.js:329` | unset — **and inert in serve, see 1.6** |
| `templatesDir` | :263 | `'.'` | cwd | `docs.js:559` only | unset — no runtime effect |
| `build.pagesDir` / `build.outputDir` | BuildConfig | `'pages'` / `'dist'` (`config.js:29-30`) | cwd | `ssg.js` | unset → wrote `dist/` |
| `plugins` | :277 | — | package resolution | `config.js:420-468` | unset (see the components chapter) |
| `css` | :281 | — | cwd | Crosswind loader | unset (see the Crosswind chapter) |

Non-configurable, hardcoded paths you cannot move: `resources/assets` (`serve.js:9305`), `config/stx.ts` for `loadStxPartialsDir` (`@stacksjs/buddy/dist/production-server.js:70-75` — bughq's file is `config/ui.ts`, so this lookup always returns `undefined`), and the components directory the dev/prod servers force (`@stacksjs/actions/dist/dev/views.js:71`, `production-server.js:121`).

---

### 1.1 MUST pin `root` and `pagesDir` explicitly

**RULE.** `config/ui.ts` must declare `root: '.'` and `pagesDir: 'resources/views'`. Never let stx infer them.

**WHY.** `resolveStxRoot` (`config.js:363-374`) returns early only when you supply `root`:

```js
// config.js:363-374
function resolveStxRoot(configRoot, configPagesDir) {
  const defaultPagesDir = configPagesDir || "pages";
  if (configRoot) return { root: configRoot, pagesDir: defaultPagesDir };
  const resourcesViews = path.join(process.cwd(), "resources", "views"),
        resourcesLayouts = path.join(process.cwd(), "resources", "layouts");
  if (fs.existsSync(resourcesViews) && fs.existsSync(resourcesLayouts))
    return { root: "resources", pagesDir: "views" };
  ...
  return { root: ".", pagesDir: defaultPagesDir };
}
```

Otherwise the shape of the project is decided by `fs.existsSync` on two directories. In bughq, `resources/layouts/` is **empty** (0 files, created 23 Jul) and is the sole reason `root` resolves to `'resources'` rather than `'.'`. `root` then propagates into: the three-directory prefixing at `config.js:411-419`, the SSG entry pages dir at `build.js:10` (`path.join(config.root || '.', config.pagesDir || ...)`), the store directory at `store-loader.js:11`, and the component convention fallbacks at `utils.js:334-338`. Deleting one empty directory silently changes all four.

**WRONG** — `config/ui.ts:8-16`. No `root`, no `pagesDir`:

```ts
export default {
  // Components directory - for user-defined components
  componentsDir: 'resources/components',
  // Layouts directory - for layout templates
  layoutsDir: 'resources/layouts',
  // Partials directory - for partial templates
  partialsDir: 'resources/partials',
```

**RIGHT:**

```ts
export default {
  root: '.',
  pagesDir: 'resources/views',
```

**CHECK.**

```sh
grep -qE "^\s*root:\s*'\.'" config/ui.ts && grep -qE "^\s*pagesDir:" config/ui.ts \
  || echo "VIOLATION: root/pagesDir are being inferred from directory existence"
```

### 1.2 MUST write the three template directories project-root-relative under `root: '.'`

**RULE.** With `root: '.'`, write `componentsDir`, `layoutsDir` and `partialsDir` as paths from the project root (`resources/components`, …). Do **not** set `root: 'resources'` and shorten them, and do not leave `root` inferred.

**WHY.** `config.js:411-419` prefixes all three with `root` unless the value is absolute:

```js
if (loaded.root && loaded.root !== ".") {
  const rootPrefix = loaded.root;
  if (loaded.partialsDir && !path.isAbsolute(loaded.partialsDir))
    loaded.partialsDir = path.join(rootPrefix, loaded.partialsDir);
  ...
}
```

Loader B does none of this. `root: '.'` makes the `if` false, so both loaders see identical, existing paths — the only relative arrangement that satisfies both (verified: `root: 'resources'` + `layoutsDir: 'layouts'` gives Loader A `resources/layouts` EXISTS and Loader B `layouts` MISSING).

The current values break real code paths, not hypothetical ones: `includes.js:480-508` `resolvePath()` has no fallback, so `@include('SiteNav')` resolves against `resources/resources/partials` and returns an error string; `process.js:328-331` looks for `resources/resources/layouts/default.stx`, does not find it, and applies **no layout at all** — no `<main>`, so `stx-router/dist/client.js:796` (`if (!getContainer()) return false`) makes the SPA router inert. The evidence is on disk in `dist/`:

```
$ grep -rl 'include error' dist/ | wc -l
24
$ head -c 260 dist/layouts/marketing.html | tail -c 120
<body> .../resources/views/layouts/marketing.stx:10:5: include error: Error loading include file SiteNav:
ENOENT: no such file or directory, open '.../resources/resources/partials/SiteNav.stx'
```

That absolute path and the ANSI escape codes that follow it are page content in the built artifact.

**WRONG** — `config/ui.ts:10,13,16` (values above). **RIGHT:**

```ts
  componentsDir: 'resources/components',
  layoutsDir: 'resources/layouts',
  partialsDir: 'resources/partials',
```

— identical text, but now correct because `root: '.'` is pinned (1.1). The values are only meaningful together with `root`.

**CHECK.** Save as `scripts/check-stx-topology.ts` and wire it into CI:

```ts
import fs from 'node:fs'
import path from 'node:path'

const KEYS = ['componentsDir', 'layoutsDir', 'partialsDir'] as const

const { loadConfig } = await import('bunfig')
const raw: any = await loadConfig({ name: 'stx', alias: ['ui'], cwd: process.cwd(), defaultConfig: {}, checkEnv: false, verbose: false })
const served = Object.fromEntries(KEYS.map(k => [k, raw[k]])) as Record<string, string>

const { loadStxConfig } = await import('@stacksjs/stx')
const res: any = await loadStxConfig()

let bad = 0
for (const k of KEYS) {
  if (served[k] !== res[k]) { console.error(`${k}: serve sees ${JSON.stringify(served[k])}, build sees ${JSON.stringify(res[k])}`); bad++ }
  else if (!fs.existsSync(res[k])) { console.error(`${k} -> ${res[k]} does not exist`); bad++ }
}
const pages = path.resolve(res.root === '.' ? '.' : res.root, res.pagesDir)
if (!fs.existsSync(pages)) { console.error(`pagesDir -> ${pages} does not exist`); bad++ }
for (const d of ['layouts', 'components', 'partials', 'stores'])
  if (fs.existsSync(path.join(pages, d))) { console.error(`${d}/ is inside pagesDir and therefore routable`); bad++ }
process.exit(bad ? 1 : 0)
```

Copying the `served` values before calling `loadStxConfig` is required — `loadStxConfig` mutates the object bunfig caches, so reading `raw[k]` afterwards silently reports the mutated value. Current output:

```
componentsDir: serve sees "resources/components", build sees "resources/resources/components"
layoutsDir:    serve sees "resources/layouts",    build sees "resources/resources/layouts"
partialsDir:   serve sees "resources/partials",   build sees "resources/resources/partials"
layouts/ is inside pagesDir and therefore routable
components/ is inside pagesDir and therefore routable
```

### 1.3 MUST NOT let an empty directory carry meaning

**RULE.** Every declared directory must contain the files it claims to contain. An empty directory in `resources/` is a defect, not a placeholder.

**WHY.** `resources/layouts/` is empty and is load-bearing in two opposite directions at once. Its **existence** flips `resolveStxRoot` to `root: 'resources'` (`config.js:367-369`), which causes 1.2's double prefix. Its **emptiness** is why the dev server picks the other directory: `@stacksjs/actions/dist/dev/views.js:59-62` calls `firstExistingPath(['resources/views/layouts', 'resources/layouts'])`, and `views.js:115-126` prefers whichever candidate actually globs `**/*.stx`. Drop one `.stx` file into `resources/layouts/` and both candidates qualify; the resolution then depends on array order. Production disagrees with dev already: `@stacksjs/buddy/dist/production-server.js:114` uses `existsSync('resources/views/layouts') ? 'resources/views/layouts' : 'resources/layouts'` — presence, not content.

**WRONG:**

```
$ ls -la resources/layouts/
total 0
drwxr-xr-x  2 ...  64 Jul 23 20:31 .
```

**RIGHT.** Move the real layouts in and delete the old directory, so `firstExistingPath`, `existsSync` and `config/ui.ts` all name the same place:

```sh
git mv resources/views/layouts/default.stx   resources/layouts/default.stx
git mv resources/views/layouts/marketing.stx resources/layouts/marketing.stx
rmdir resources/views/layouts
```

**CHECK.**

```sh
find resources -type d -empty -not -path '*/node_modules/*' | grep . \
  && echo "VIOLATION: empty directory in resources/ — it is deciding config resolution"
```

### 1.4 MUST keep layouts, components, partials and stores outside `pagesDir`

**RULE.** Nothing under `pagesDir` may be a non-page. A file under `resources/views/` is a public URL.

**WHY.** Route discovery is directory-driven. The exclusion of `components`/`layouts`/`partials` exists in **three** places and is missing from **three others**:

| Path | Excludes non-page dirs? | Evidence |
|---|---|---|
| dev/prod serve file discovery | Yes | `serve.js:9263-9273` |
| `.stx/routes.ts` manifest | Yes | `stx-router/dist/codegen.js:24` |
| `buildForProduction` | Yes | `production-builder.js:62` |
| `.stx/route-types.d.ts` | **No** | `codegen.js:3-22` — no filter |
| `stx-router` `Router` constructor | **No** | `file-router.js:41-58` |
| SSG `generateStaticSite` | **No** | `ssg.d.ts:24-43` — `SSGConfig` has no `componentsDir`/`layoutsDir`/`partialsDir` key at all |

Consequences already shipped into the build output and the generated types:

```
$ ls dist/layouts dist/components
dist/components:  FeatureCard.html
dist/layouts:     default.html  marketing.html
$ grep -o '<loc>[^<]*</loc>' dist/sitemap.xml | grep -E 'layouts|components'
<loc>http://localhost/components/FeatureCard</loc>
<loc>http://localhost/layouts/default</loc>
<loc>http://localhost/layouts/marketing</loc>
$ grep -n 'layouts\|components' .stx/route-types.d.ts
15:    '/components/FeatureCard': {  }
25:    '/layouts/default': {  }
26:    '/layouts/marketing': {  }
```

`/layouts/marketing` is the page whose `<body>` is the absolute-filesystem-path dump quoted in 1.2. It is sitemapped.

**WRONG:** `resources/views/layouts/default.stx`, `resources/views/layouts/marketing.stx`, `resources/views/components/FeatureCard.stx`.

**RIGHT:** `resources/layouts/default.stx`, `resources/layouts/marketing.stx`, `resources/components/FeatureCard.stx` (or delete `FeatureCard.stx` — it has zero references in `resources/` or `routes/`).

Related, and worth knowing before you add a page: the dev server mounts the framework defaults as a second pages root — `views.js:69` passes `patterns: ['resources/views', 'storage/framework/defaults/resources/views']`. Nine routes you did not write are live and in `.stx/routes.ts`: `/cart`, `/coming-soon`, `/checkout/contact`, `/checkout/payment`, `/checkout/shipping`, `/dashboard/custom-page`, `/emails/welcome`, `/errors/tester`, `/orders/:id`. Creating `resources/views/cart.stx` shadows the default (first pattern wins, `file-router.js:45-48`); creating a page that collides with one you did not intend to own is a silent behaviour change.

**CHECK.** Part of the 1.2 script; standalone form:

```sh
ls resources/views/layouts resources/views/components resources/views/partials resources/views/stores 2>/dev/null \
  && echo "VIOLATION: non-page directory inside pagesDir"
grep -nE "'/(layouts|components|partials)/" .stx/route-types.d.ts \
  && echo "VIOLATION: non-page templates typed as routes"
```

### 1.5 MUST only put load-bearing config in keys the serve path forwards

**RULE.** Before adding a key to `config/ui.ts`, confirm it reaches the renderer. The dev and production request paths forward a fixed allow-list and drop everything else.

**WHY.** `serve.js:9508-9528` (and its twin at `serve.js:9690-9708`) rebuilds the render options from scratch:

```js
const config5 = {
  ...defaultConfig4,                 // stx defaultConfig — config.js:16-24
  root: process19.cwd(),             // your `root` is discarded here
  ...componentsDir && { componentsDir },   // from options (views.js:71) — hardcoded
  ...layoutsDir && { layoutsDir },         // from options (views.js:72)
  ...partialsDir && { partialsDir },       // from options (views.js:73)
  autoShell: true,
  ssr: stxConfig.ssr ?? defaultStxConfig.ssr ?? true,
  app: stxConfig.app || {},
  ..."strict" in stxConfig && { strict: stxConfig.strict },
  ..."router" in stxConfig && { router: stxConfig.router },
  ..."debug" in stxConfig && { debug: stxConfig.debug },
  ..."skipDefaultSeoTags" in stxConfig && { skipDefaultSeoTags: stxConfig.skipDefaultSeoTags },
  ..."defaultTitle" / "defaultDescription" / "defaultImage" / "seo" / "analytics" ...,
  ..."_pluginComponentDirs" / "_pluginPageDirs" ...
};
```

Directory precedence is `options.X ?? stxConfig.X ?? defaultStxConfig.X` (`serve.js:8935-8937`) — options always win, and `views.js:68-73` / `production-server.js:121-123` always pass them. **The three keys `config/ui.ts` sets today are exactly the three that are always overridden.** The two that survive (`router`, `app`) are the two the file spends 60 lines documenting, which is correct; the ~30 that also survive are all unset.

| Reaches the renderer | Silently dropped by the serve path |
|---|---|
| `app`, `ssr`, `strict`, `router`, `debug`, `skipDefaultSeoTags`, `defaultTitle`, `defaultDescription`, `defaultImage`, `seo` | `defaultLayout`, `customDirectives`, `middleware`, `markdown`, `i18n`, `a11y`, `animation`, `loops`, `forms`, `csp`, `components`, `hydration`, `routeMiddleware`, `media`, `heatmap`, `pwa`, `story`, `streaming`, `webComponents`, `broadcasting`, `build`, `docs`, `cache`, `cachePath`, `templatesDir`, `skipSignalsRuntime`, `skipEventDirectives` |
| `analytics` (also re-read via Loader A at `serve.js:8929-8930`) | |
| `publicDir` (separate read, `serve.js:8938`) | |
| `plugins` → `_pluginComponentDirs` / `_pluginPageDirs` (`serve.js:8922-8928`) | |
| `storesDir`, `css`, `root`, `pagesDir` (via Loader A, not `config5`) | |

**WRONG.** Adding `customDirectives` or `i18n` to `config/ui.ts` and expecting it to apply in `bun run dev`.

**RIGHT.** Directive registration goes through `plugins` (`config.js:445-460`, `addDirective`), which *is* propagated.

**CHECK.**

```sh
grep -oE "^  [a-zA-Z_]+:" config/ui.ts | tr -d ' :' | grep -vxE \
 'root|pagesDir|componentsDir|layoutsDir|partialsDir|storesDir|publicDir|css|plugins|app|ssr|strict|router|debug|skipDefaultSeoTags|defaultTitle|defaultDescription|defaultImage|seo|analytics' \
 && echo "VIOLATION: key above is dropped by serve.js:9508-9528 — it has no runtime effect"
```

### 1.6 MUST NOT rely on `defaultLayout`, `templatesDir`, or `shell`

**RULE.** These three keys look configurable and are not. Do not set them; do not reason from them.

**WHY.**
- `defaultLayout` (`config-types.d.ts:276`) appears nowhere in `bun-plugin-stx/dist/serve.js`. In the serve path it comes only from the spread of stx's `defaultConfig` (`config.js:22` = `"default"`). Setting `defaultLayout: 'app'` in `config/ui.ts` changes `stx build` and changes nothing in dev or `buddy serve`. The layout file **must** be named `default.stx`.
- `templatesDir` (`:263`) is read at exactly one site, `docs.js:559`, for doc generation. It has no rendering effect.
- `shell` (`:` — `StxConfig.shell?: string | false`) drives `detectShell` (`app-shell.js:17-30`), which looks for `app.stx` in the project root. `app-shell.d.ts` marks it `@deprecated Use layouts/default.stx instead`, and neither `bun-plugin-stx/dist/serve.js` nor `@stacksjs/actions/dist/dev/views.js` calls `detectShell` at all. bughq has no `app.stx` and must not gain one.

**CHECK.**

```sh
grep -nE "^\s*(defaultLayout|templatesDir|shell):" config/ui.ts && echo "VIOLATION: inert key"
test -e app.stx && echo "VIOLATION: deprecated app.stx shell — use resources/layouts/default.stx"
test -e resources/layouts/default.stx || echo "VIOLATION: default layout must be named default.stx"
```

### 1.7 MUST put shared reactive state in `storesDir`. stx has no `composablesDir`

**RULE.** There is no `composablesDir`, `functionsDir` or `composables/` convention anywhere in stx 0.2.113. Verified: `grep -rn "composablesDir" node_modules/@stacksjs/ node_modules/bun-plugin-stx/` returns nothing. Composables (`useDark`, `useCookie`, `useFetch`, …) are **auto-imported globals injected by the runtime** — you never declare a directory for them and you never hand-import them (see the auto-imports chapter). Cross-page reactive state belongs in `storesDir` (`config-types.d.ts:275`), which is real and which bughq does not use.

**WHY.** `store-loader.js:5-11` is the only resolver:

```js
export async function getStoreScript(storesDir) {
  let resolvedDir;
  if (storesDir) resolvedDir = path.resolve(storesDir);
  else {
    const config = await loadStxConfig();
    resolvedDir = path.resolve(config.root || process.cwd(), config.storesDir || "stores");
  }
```

Note `storesDir` is resolved against `root` here, not prefixed at `config.js:411-419` like the other three — a different mechanism for the same convention. In the serve path `options.storesDir` is undefined (it is not in the 1.5 allow-list), so the `else` branch always runs. With `root: '.'` and `storesDir: 'resources/stores'`, that is `<project>/resources/stores`. The directory contract is strict: `Bun.Glob("*.ts")` — **top level only, not recursive** (`store-loader.js:16`); `index.ts` and `types.ts` are skipped (`:19-20`); every `import` line is stripped before transpile (`:36`), so a store must be self-contained. The result is inlined as `<script data-stx-stores>` by `process.js:245-257`.

**WRONG** — `resources/functions/counter.ts:2` and `resources/functions/dark.ts:4-5`. These are stores in everything but location:

```ts
// resources/functions/counter.ts
export const count = state(0)
export function increment() { count.update((n: number) => n + 1) }
```
```ts
// resources/functions/dark.ts
export const isDark = useDark()
export const preferredDark = usePreferredDark()
```

`resources/functions/` matches no stx convention, is referenced by zero `.stx` files (`grep -rn "resources/functions" resources/ config/` → nothing), and is never loaded. Meanwhile the theme state it models is hand-reimplemented across the app.

**RIGHT** — move to `resources/stores/` and declare it:

```ts
// resources/stores/theme.ts   (no imports — they are stripped)
export const isDark = useDark()
export const preferredDark = usePreferredDark()
export function toggleDark() { isDark.set(!isDark()) }
```
```ts
// config/ui.ts
  storesDir: 'resources/stores',
```

Verified end to end against `getStoreScript(undefined)` with this exact config: `LOADED (105 bytes)` → `;(function(){ // Store: theme … })();`.

**CHECK.**

```sh
test -d resources/functions && echo "VIOLATION: resources/functions matches no stx convention — move to resources/stores"
grep -qE "^\s*storesDir:" config/ui.ts || echo "VIOLATION: storesDir undeclared"
find resources/stores -mindepth 2 -name '*.ts' | grep . && echo "VIOLATION: store-loader globs *.ts non-recursively"
grep -rn "^import " resources/stores/*.ts 2>/dev/null && echo "VIOLATION: imports are stripped at store-loader.js:36"
```

### 1.8 MUST make `config/ui.ts` typechecked

**RULE.** `config/ui.ts` ends in `satisfies UiOptions` (`config/ui.ts:79`) and that assertion is never evaluated. Fix `tsconfig.json` `include` so the config, the stores and the generated route types are covered.

**WHY.** stx is a TypeScript-first framework, and the config file is the one place where a typo costs you an entire subsystem. `bun run typecheck` (`package.json` → `bun x tsc --noEmit`) currently visits **ten** project files:

```
$ bun x tsc --listFilesOnly | grep -v node_modules
site.config.ts
types/stacks-app.d.ts
types/ts-cloud-augment.d.ts
app/Models/{AlertChannel,ErrorEvent,Issue,Project,Subscription,User}.ts
app/Support/urls.ts
```

`tsconfig.json` `include` is `["*.ts", "*.d.ts", "types/**/*.d.ts", "app/Models/**/*.ts", "app/Services/**/*.ts", "app/Support/**/*.ts"]` — `config/` and `resources/` match nothing. `.stx/route-types.d.ts` (which declares `module "stx/routes"` with the full `RouteMap`) is likewise never loaded, so route patterns are untyped at every call site.

**RIGHT** — `tsconfig.json`:

```jsonc
  "include": [
    "*.ts",
    "*.d.ts",
    "types/**/*.d.ts",
    "config/**/*.ts",
    "resources/stores/**/*.ts",
    ".stx/route-types.d.ts",
    "app/Models/**/*.ts",
    "app/Services/**/*.ts",
    "app/Support/**/*.ts"
  ],
```

**CHECK.**

```sh
bun x tsc --listFilesOnly | grep -q 'config/ui.ts' || echo "VIOLATION: config/ui.ts is not typechecked"
```

### 1.9 MAY use `_layout.stx` co-location, but know it outranks the configured layout

**RULE.** A file named `_layout.stx` in any directory under `pagesDir` becomes the layout for every page at or below it. Use it for a route group; never add one casually.

**WHY.** `process.js:313-327` walks up from the page's directory (max 20 levels) looking for `_layout.stx` **before** it ever consults `layoutsDir`/`defaultLayout`:

```js
for (let i = 0; i < 20; i++) {
  const candidate = path.join(searchDir, "_layout.stx");
  if (await fileExists(candidate)) { autoLayoutPath = candidate; break }
  ...
}
if (autoLayoutPath) layoutPath = autoLayoutPath;
else if (opts.layoutsDir) { /* layoutsDir/${defaultLayout}.stx */ }
```

`stx-router/dist/nested-layouts.js:3-14` builds the same chain for route metadata. Adding `resources/views/compare/_layout.stx` silently re-parents all eight `/compare/*` pages and no error is emitted.

**CHECK.** Manual review of every hit:

```sh
find resources/views -name '_layout.stx'
```

Each result must be intentional and documented in a comment at the top of the file naming the routes it captures.

### 1.10 The corrected `config/ui.ts`

Apply this verbatim after the file moves in 1.3/1.4. The existing comment blocks on `router` (`config/ui.ts:18-40`) and `app.head` (`:45-73`) are correct and must be preserved — they are elided here with `/* … */` only for length; do not delete them.

```ts
import type { StxOptions as UiOptions } from '@stacksjs/stx'

/**
 * stx configuration — the root of this application. There is no index.html.
 *
 * This file is loaded TWICE, by loaders with different semantics:
 *
 *   A. @stacksjs/stx loadStxConfig()            (dist/config.js:387)
 *      → applies resolveStxRoot (config.js:363-374) and prefixes
 *        componentsDir/layoutsDir/partialsDir with `root` (config.js:411-419).
 *      → used by `stx build`, the SSG, production-builder, store-loader,
 *        and Crosswind config discovery.
 *
 *   B. bun-plugin-stx serve()                   (dist/serve.js:8912-8919)
 *      → raw bunfig load, NO root prefixing, defaults ssr:true.
 *      → used by `bun scripts/dev.ts` and `buddy serve` on every request.
 *
 * A relative directory value cannot be correct in both unless `root` is '.'.
 * That is why `root: '.'` is pinned below and every directory is written from
 * the project root. Verify with scripts/check-stx-topology.ts — it fails if the
 * two loaders disagree or any resolved path is missing.
 */
export default {
  // --- Project shape -------------------------------------------------------
  // Pinned, not inferred. Without `root`, resolveStxRoot (config.js:363-374)
  // decides the whole topology from `fs.existsSync('resources/layouts')` — an
  // empty directory would flip root to 'resources' and double-prefix the three
  // directories below into non-existent resources/resources/*.
  root: '.',

  // Every .stx under here is a public URL (stx-router file-router.js:41-58).
  // Nothing that is not a page may live in this tree: the SSG (ssg.d.ts:24-43)
  // and the route-type codegen (stx-router codegen.js:3-22) have no exclusion,
  // so a layout parked here is built to HTML and sitemapped.
  pagesDir: 'resources/views',

  // --- Template directories ------------------------------------------------
  // Root-relative because `root` is '.', which makes the config.js:411-419
  // prefix a no-op and both loaders agree.
  //
  // Caveat, verified not assumed: all three are OVERRIDDEN on the served path.
  // Dev passes them at @stacksjs/actions/dist/dev/views.js:68-73, prod at
  // @stacksjs/buddy/dist/production-server.js:116-123, and options win at
  // bun-plugin-stx/dist/serve.js:8935-8937. They are still declared here
  // because `stx build`, the SSG and production-builder read them directly.
  //
  // componentsDir in particular is force-set to the framework defaults tree by
  // views.js:71; bughq's own resources/components resolves only via the
  // convention fallback at @stacksjs/stx/dist/utils.js:334-338.
  componentsDir: 'resources/components',
  layoutsDir: 'resources/layouts',
  partialsDir: 'resources/partials',

  // Module-scope reactive state, inlined into every page as
  // <script data-stx-stores> (process.js:245-257). Resolved against `root` by
  // store-loader.js:11 — a different mechanism from the three keys above.
  // Contract: top-level *.ts only (non-recursive glob, store-loader.js:16),
  // index.ts/types.ts skipped, and all `import` lines stripped before
  // transpile (store-loader.js:36) — stores must be self-contained.
  storesDir: 'resources/stores',

  // Static root. Not passed by views.js, so this value actually reaches the
  // server (serve.js:8938). Declared so it stops being a hidden default.
  publicDir: 'public',

  // --- Rendering -----------------------------------------------------------
  // Explicit because the two loaders default it differently: stx's own
  // defaultConfig says false (config.js:18) while bun-plugin-stx says true
  // (serve.js:8833). The false side is what makes `stx build` pick SSG over SSR
  // (build.js:4-5). bughq is SSR; say so once, here.
  ssr: true,

  // Registers the ~35 shipped UI components by tag name — the ONLY code path
  // that fills _pluginComponentDirs (config.js:420-468). See the components
  // chapter. Boot log prints "[stx] Plugin loaded: @stacksjs/components".
  plugins: ['@stacksjs/components/stx-plugin'],

  // stx's built-in prohibited-DOM-API validator for client <script> blocks.
  // See the no-vanilla-JS chapter. Forwarded at serve.js:9517.
  strict: true,

  /* … existing router comment block, config/ui.ts:18-40, unchanged … */
  router: {
    container: 'main',
    interceptAllLinks: true,
  },

  /* … existing app.head comment block, config/ui.ts:45-73, unchanged … */
  app: {
    head: {
      title: 'bughq',
    },
  },
} satisfies UiOptions
```

`satisfies UiOptions` only does work once 1.8 lands. Two keys deliberately omitted here because they belong to later chapters but must eventually be set in this file: `skipDefaultSeoTags` (stx currently injects `stx Project` / `A website built with stx templating engine` into every page — see `dist/compare/sentry.html:1`) and `analytics` (`config/analytics.ts:17-18` has a Fathom site ID that reaches nothing).

### 1.11 Apply order

The moves and the config edit are one atomic change; doing either half alone breaks the other.

1. `git mv resources/views/layouts/*.stx resources/layouts/` and `rmdir resources/views/layouts` — satisfies 1.3 and 1.4 for layouts, and makes `views.js:59-62` / `production-server.js:114` agree with the config.
2. `git mv resources/views/components/FeatureCard.stx resources/components/` (or `git rm` it — zero references) and `rmdir resources/views/components`.
3. Replace `config/ui.ts` with 1.10.
4. Extend `tsconfig.json` `include` per 1.8.
5. Add `scripts/check-stx-topology.ts` from 1.2 and run it — must exit 0.
6. `rm -rf dist .stx && bun run dev`, then re-run step 5 and confirm `grep -rn "'/\(layouts\|components\)/" .stx/route-types.d.ts` is empty and `grep -rl 'include error' dist/` returns nothing.

## 2. Page anatomy — never write a document

A `.stx` file under `resources/views/` is a **fragment**. It contributes markup to a document that stx assembles. It never *is* the document. Every rule in this chapter follows from one line of the framework:

```js
// node_modules/@stacksjs/stx/dist/process.js:310-312
if (!layoutPath && !hasNoLayout && opts.defaultLayout) {
  const hasDoctype = /<!DOCTYPE\s/i.test(output), hasSections = /@section\s*\(/.test(output);
  if (!hasDoctype || hasSections) {
```

Writing `<!DOCTYPE html>` in a page turns off layout resolution for that page. Silently. No warning, no log line. bughq has 24 files that do this (`grep -rl '<!DOCTYPE' resources/views` → 24), and the entire marketing site's structural debt — 357 lines of duplicated shell, a dead layout, 8 `data-no-router` escape hatches, zero `useSeoMeta` calls — is downstream of that one regex.

### The pipeline you are writing into

| Stage | Framework location | What happens |
|---|---|---|
| stx comments stripped | `process.js:288` | `{{-- … --}}` removed before anything reads the template |
| HTML comments masked | `process.js:289-291` | `<!-- … -->` replaced by `\x00STX_HTML_COMMENT_n\x00` placeholders |
| `@push`/`@prepend` harvested | `process.js:299` → `includes.js:682-724` | Content moved into a shared `stacks` object, removed from the page |
| `@nolayout` detected & stripped | `process.js:302-304` | Explicit opt-out |
| `@extends`/`@layout` matched & stripped | `process.js:305-309` | `layoutPath = layoutMatch[1]` |
| **Doctype gate** | `process.js:310-312` | A doctype with no `@section` skips everything below |
| `_layout.stx` auto-discovery | `process.js:313-327` | Walks up ≤20 dirs from the page file |
| `defaultLayout` fallback | `process.js:328-331` | `<layoutsDir>/<defaultLayout>.stx`, default name `"default"` (`config.js:22`) |
| Implicit whole-page wrap | `process.js:333-336` | Only when a layout was auto-resolved AND the page has no `@section` |
| `@section` collected | `process.js:339-362` | Into `sections`; `@show` is an alias for `@endsection`; `@parent` supported |
| `@yield`/`@slot` filled | `process.js:364-370` | Unfilled yields resolve to their default or `''` — never an error |
| `@stack` filled (page) | `process.js:371` | `includes.js:726-732` |
| Orphan `<script>`/`<style>` hoisted | `process.js:372-385` | **Only when a layout applies**; lands in `sections.content`, i.e. the body |
| Layout read, `@push` merged, `@yield` filled, `@stack` filled | `process.js:403-444` | Same `stacks` object as the page |
| Layout body processed | `process.js:446` → `processOtherDirectives` `:511` | `<script server>` in the layout runs here (`:483-499`); `@head` collected at `:557-563` |
| Layout marker emitted | `process.js:447-448` | `<!-- stx-layout: … -->` — **only if a layout ran** |
| HTML comments unmasked | `process.js:449` / `:454` | Comment text becomes visible to everything downstream |
| Document synthesised | `process.js:205-226` | `hasDocumentShell` → `ensureDocumentShell` → `generateDocumentShell` |
| Layout meta injected | `process.js:227-232` | `<meta name="stx-layout">` + `<meta name="stx-layout-group">` |

bughq runs this through `bun-plugin-stx/serve` (`node_modules/@stacksjs/actions/dist/dev/views.js:59-77`), which sets `autoShell: true` unconditionally (`node_modules/bun-plugin-stx/dist/serve.js:9515`) and passes `app: stxConfig.app` (`serve.js:9518`). There is no configuration under which a bughq page needs to write its own document.

---

### 2.1 MUST NOT write `<!DOCTYPE>`, `<html>`, `<head>` or `<body>` in a page

**WHY.** Two independent mechanisms punish it.

1. `process.js:311` disables layout resolution. The page never gets `layouts/marketing.stx` or `layouts/default.stx`, never emits the `<!-- stx-layout: … -->` marker at `process.js:447`, and therefore never gets `<meta name="stx-layout-group">` (`process.js:227-232`). The dev server then reports a **lie** to the SPA router: `node_modules/bun-plugin-stx/dist/serve.js:10120-10121` — `const pageLayout = layoutMatch ? layoutMatch[1] : "default"` — so a marketing page advertises `X-STX-Layout: default`, identical to what a real app page reports from `layouts/default.stx`.
2. `document-shell.js:64-66` — `hasDocumentShell()` returns true for any string containing `<!DOCTYPE` or `<html `. `ensureDocumentShell()` at `document-shell.js:101-105` then returns the HTML **untouched**, so the runtime head assembled at `process.js:206-222` (which is where `useHead`/`useSeoMeta` output lives) is discarded. The consolation path at `process.js:226` calls `injectConfigHeadTags(result, baseHeadConfig)`, which destructures only `meta`, `link`, `script`, `headRaw` (`document-shell.js:71`) — **never `title`**. This is why all 24 doctype pages hand-write `<title>` and not one of them calls `useSeoMeta` (`grep -rlE 'useSeoMeta\(' resources/views` → 0).

**WRONG** — `resources/views/use-cases/agencies.stx:1-13`:

```stx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Error tracking for agencies - bughq</title>
    <meta name="description" content="Keep every client site as its own project…">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk…">
    <link rel="stylesheet" href="/marketing.css">
  </head>
  <body>
```

**RIGHT:**

```stx
@extends('layouts/marketing')

<script server>
useSeoMeta({
  title: 'Error tracking for agencies - bughq',
  description: 'Keep every client site as its own project with isolated issues, releases, and members, and self-host so client data stays on infrastructure you control.',
  canonical: 'https://bughq.org/use-cases/agencies',
})
</script>
```

`generateDocumentShell` (`document-shell.js:11-63`) emits `<!DOCTYPE html>`, `<html lang="en">`, `<meta charset="UTF-8">` and the viewport meta for you at `document-shell.js:21-24, 53-55`. You cannot improve on that by hand; you can only break the head merge.

**CHECK.**
```bash
grep -rlE '<!DOCTYPE|<html[ >]|</body>|</html>' resources/views   # must return nothing
```
Currently returns 24 files.

### 2.2 MUST NOT write a document in a **layout** either

**WHY.** The `hasDocumentShell` test at `process.js:223` runs on the *composed* output — page injected into layout. A doctype in the layout poisons every page that extends it, exactly as if each page had written one. `resources/views/layouts/marketing.stx:1-15` is a document, which is a second reason nothing can safely extend it today. Compare `resources/views/layouts/default.stx:38-44`, which is correct: a bare `<main>`, `@yield('content')`, `@yield('footer')`, `@stack('scripts')` — and that is precisely why the 13 fragment app pages get working `useHead` titles (`resources/views/login.stx:10`, `resources/views/pricing.stx:2`).

**WRONG** — `resources/views/layouts/marketing.stx:1-15` (whole file):

```stx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="@yield('description')">
    <title>@yield('title')</title>
  </head>
  <body>
    @include('SiteNav')
    @yield('content')
    @yield('footer')
    @stack('scripts')
  </body>
</html>
```

**RIGHT** — the same file, rewritten as a fragment layout:

```stx
{{-- Marketing shell. A FRAGMENT, not a document: stx synthesises
     <!DOCTYPE>/<html lang>/<head>/<body> at process.js:224 from config/ui.ts
     app.head merged with each page's useSeoMeta(). A DOCTYPE here makes
     hasDocumentShell() true (document-shell.js:64), ensureDocumentShell() a
     no-op (document-shell.js:102), and every page's title/description/og tags
     are dropped on the floor. --}}
@head
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/marketing.css">
@stack('styles')
@endhead

@include('SiteNav')

{{-- Bare <main>: the single router container (config/ui.ts:42). Pages must not
     declare one — two <main> elements break the fragment swap. --}}
<main>
@yield('content')
</main>

@include('SiteFooter')

@stack('scripts')
```

`@head … @endhead` is the supported way for a fragment to add raw `<head>` content: `head.js:199-206` strips the block and returns its inner text, `process.js:560-563` accumulates it into `context.__stx_head_raw`, `process.js:220` folds it into `headConfig.headRaw`, and `document-shell.js:44` emits it inside `<head>`. It runs on the layout because `processOtherDirectives` (`process.js:446`) is what processes the composed layout body.

`@stack('styles')` **inside** `@head` works because the ordering is: stacks resolved at `process.js:444`, then `@head` extracted at `process.js:560`.

**CHECK.**
```bash
grep -rlE '<!DOCTYPE|<html[ >]' resources/views/layouts   # must return nothing
```

### 2.3 MUST NOT let a `<!DOCTYPE` or `<html>` string appear anywhere in a page — including comments and code samples

**WHY.** The two gates disagree about comments, and the asymmetry is a trap.

- `process.js:311` (`hasDoctype`) runs **after** HTML comments are masked at `process.js:289-291`, so a doctype inside `<!-- -->` is invisible to it.
- `process.js:223` (`hasDocumentShell`) runs **after** they are unmasked at `process.js:449`/`:454`, and its regex `/<html[\s>]/i` (`document-shell.js:65`) is unanchored. A literal `<html>` inside an HTML comment therefore makes stx believe the page is already a document and skip shell generation entirely — the browser receives a headless fragment and falls back to a native navigation.

`{{-- … --}}` comments are safe: they are deleted at `process.js:288`, before any gate. Use them.

For a genuine code sample containing markup, escape it or move it into a `<script server>` string, as `resources/views/index.stx:1-27` already does for its SDK snippet.

**CHECK.**
```bash
grep -rnE '<!DOCTYPE|<html[ >]' resources/views | grep -v '^resources/views/layouts/'
```
Any hit is a defect regardless of whether it is inside a comment. Prefer converting `<!-- -->` to `{{-- --}}` wholesale in views: `grep -rn '<!--' resources/views` currently hits `layouts/default.stx:1-37`, `account.stx:126-127`, `issue/[id].stx:570-572`, `index.stx:53-55`.

### 2.4 MUST declare the layout explicitly with `@extends`

**WHY.** Layout selection has four sources, evaluated in this order. Only the first is explicit.

| Priority | Mechanism | Framework | Marker written |
|---|---|---|---|
| 1 | `@extends('name')` / `@layout('name')` | `process.js:305-309` | `<!-- stx-layout: name -->` (`:447`) |
| 2 | `@nolayout` — opt out | `process.js:302-304, 310` | none |
| 3 | Nearest `_layout.stx` walking up ≤20 dirs | `process.js:313-327` | absolute path |
| 4 | `<layoutsDir>/<defaultLayout>.stx` | `process.js:328-331` | absolute path |

`@extends` accepts a bare name or a `layouts/`-prefixed one; resolution tries the page-relative path first (`utils.js:703-721`), then walks up for a `layouts/` directory (`utils.js:722-747`, which strips a leading `layouts/`), then `options.layoutsDir` (`utils.js:758-778`). From `resources/views/use-cases/agencies.stx`, both `@extends('marketing')` and `@extends('layouts/marketing')` land on `resources/views/layouts/marketing.stx`. **Prefer `@extends('layouts/marketing')`** — it hits on the first branch and cannot ever be shadowed by a sibling page named `marketing.stx`.

The marker matters beyond aesthetics: `deriveLayoutGroup` (`node_modules/stx-router/dist/layout-metadata.js:1-6`) turns `layouts/marketing` into group `marketing` and the absolute `…/layouts/default.stx` into group `default`. Different groups are what let the router do a full-document swap between the marketing site and the app instead of a fragment swap that never carries `/marketing.css` (the fragment path harvests `<style>` only — `serve.js:10126-10147` and `:10151-10161` — never `<link>`).

**WRONG** — zero pages in bughq declare a layout:
```
$ grep -rEn '@(layout|extends)\(' resources/views
(no output)
```
`resources/views/layouts/marketing.stx` is dead code, and `resources/views/layouts/default.stx:39` is reached only by fallback #4.

**RIGHT** — first line of every marketing page:
```stx
@extends('layouts/marketing')
```

**CHECK.**
```bash
find resources/views -name '*.stx' -not -path '*/layouts/*' -not -path '*/components/*' \
  | xargs grep -LE '@(extends|layout)\(|@nolayout' 
```
Every listed file is relying on implicit fallback #3/#4. That is acceptable **only** for app pages that intend `layouts/default.stx`; it is never acceptable for a marketing page. Currently 34 files are listed.

Runtime confirmation that a layout actually ran:
```bash
curl -s -H 'X-STX-Router: true' -D- -o /dev/null http://localhost:3100/use-cases/agencies \
  | grep -i 'X-STX-Layout'
# want: X-STX-Layout: layouts/marketing / X-STX-Layout-Group: marketing
# a page with no layout reports the FAKE default (serve.js:10121)
```

### 2.5 MUST pair `@extends` with `@section('content')` — the page body is silently discarded otherwise

**WHY.** The implicit "wrap the whole page in `@section('content')`" convenience at `process.js:333-336` lives **inside** the `if (!layoutPath && …)` block opened at `process.js:310`. An explicit `@extends` sets `layoutPath`, so that block never runs. With no `@section`, `sections.content` is undefined; the layout's `@yield('content')` resolves through `process.js:432-437` to `defaultContent || ""`; and at `process.js:446` `output` is replaced wholesale by the processed layout. Your markup is gone, the response is 200, nothing is logged.

**WRONG:**
```stx
@extends('layouts/marketing')

<section class="feat-hero shell">
  <h1>One project per client…</h1>
</section>
```
Renders nav + empty `<main>` + footer.

**RIGHT:**
```stx
@extends('layouts/marketing')

@section('content')
  <section class="feat-hero shell">
    <h1>One project per client…</h1>
  </section>
@endsection
```

`@show` is an accepted alias for `@endsection` (`process.js:356`), and `@parent` inside a section splices the layout's own version back in (`process.js:357-359`, `:433-436`). Don't use `@show` in pages — reserve it for layouts that supply a default.

**CHECK.**
```bash
find resources/views -name '*.stx' | xargs grep -lE '@(extends|layout)\(' \
  | xargs grep -LE "@section\(\s*['\"]content"
```
Must return nothing.

### 2.6 MUST source page metadata from `useSeoMeta` in `<script server>`, never from hand-written head tags

**WHY.** `useSeoMeta` (`head.js:31-91`) expands one object into `description`, `keywords`, `author`, `robots`, the full `og:*` set, the full `twitter:*` set, `article:*`, and a `<link rel="canonical">`, then hands it to `useHead` (`head.js:85-90`). It reaches the document through exactly one path: `process.js:206` reads `context.__stx_runtime_head`, `:212-222` merges it over `config/ui.ts:74-78`, `:224` renders it. Rule 2.1 explains why a doctype severs that path.

`<script server>` is the right home because `bun-plugin-stx/dist/serve.js:9494` strips server scripts from the template before rendering and `:9504-9506` executes them before `processDirectives` — so the call always runs, and the tag never reaches the browser. `resetHead()` is called per request at `serve.js:9500`.

Title precedence, as implemented at `process.js:212`:

| Priority | Source | Framework |
|---|---|---|
| 1 | `useHead({title})` / `useSeoMeta({title})` in `<script server>` | `head.js:15-17`, `process.js:206` |
| 2 | `<title>` inside `@head … @endhead` | `process.js:208-211` |
| 3 | `@section('title', 'Foo')` | `process.js:212` reads `context.__sections.title` |
| 4 | `config/ui.ts` `app.head.title` (`'bughq'`) | `process.js:206`, `config/ui.ts:74-78` |
| 5 | `"stx App"` | `document-shell.js:13` |

Note that priority 3 makes `layouts/marketing.stx:7`'s `<title>@yield('title')</title>` redundant even on its own terms — `@section('title', '…')` already feeds the shell. Delete the string-slot head; do not port it.

**WRONG** — `resources/views/compare/sentry.stx:6-7` (and 23 siblings):
```stx
    <title>bughq vs Sentry - bughq</title>
    <meta name="description" content="How bughq, an open-source error tracker you self-host on Postgres, compares to Sentry, the incumbent error platform.">
```

**RIGHT:**
```stx
<script server>
useSeoMeta({
  title: 'bughq vs Sentry - bughq',
  description: 'How bughq, an open-source error tracker you self-host on Postgres, compares to Sentry, the incumbent error platform.',
  canonical: 'https://bughq.org/compare/sentry',
})
</script>
```

**CHECK.**
```bash
grep -rn '<title>\|<meta name="description"' resources/views   # must return nothing
grep -rc 'link rel="stylesheet"' resources/views | grep -v ':0' # must return nothing
```
Currently 24 files declare `<title>`; 34 declare a stylesheet `<link>`.

### 2.7 MUST route page-local CSS through `@push('styles')` → `@stack('styles')`, never a bare `<style>`

**WHY.** There is a safety net and it puts your CSS in the wrong place. `process.js:372-385` hoists orphan `<script>`/`<style>` tags into `sections.content` when a layout applies — i.e. into `<body>`, after the content, in a fragment the SPA router will swap away. `@push` avoids this entirely: `process.js:299` harvests pushes into `stacks` *before* sections are collected (so `@push` may sit anywhere, including inside `@section`), `process.js:423` merges the layout's own pushes into the same object, and `process.js:444` fills `@stack`. Because the layout's `@stack('styles')` sits inside `@head`, the CSS lands in `<head>` (`document-shell.js:44`).

An unfilled `@stack` renders as `''` (`includes.js:727-729`) — no warning. `@prepend`/`@endprepend` unshifts instead of pushes (`includes.js:723`).

**WRONG** — `resources/views/compare/sentry.stx:12-17`, byte-identical in all 8 compare pages:
```stx
    <style>
      /* Highlight the bughq column (2nd of every 3 grid cells) … */
      .cmp-hl .cmp-cell:nth-child(3n+2) { background: var(--accent-soft); }
      .cmp-note { margin-top: 1rem; color: var(--text-3); font-size: 0.86rem; line-height: 1.55; max-width: 68ch; }
    </style>
```

**RIGHT** — for CSS shared by 8 pages, it belongs in `public/marketing.css`. For genuinely page-local CSS:
```stx
@push('styles')
<style>
  .cmp-hl .cmp-cell:nth-child(3n+2) { background: var(--accent-soft); }
</style>
@endpush
```

**CHECK.**
```bash
find resources/views -name '*.stx' -not -path '*/layouts/*' | xargs grep -ln '<style'
```
Every hit must be immediately preceded by `@push(`. 20 view files currently contain a `<style>` block; none use `@push`.

### 2.8 MUST leave `<main>` to the layout — exactly one per rendered page

**WHY.** `config/ui.ts:42` sets `router.container: 'main'`. The fragment responder finds the first `<main …>` and the *last* `</main>` (`serve.js:10148-10166`) and returns everything between them; `extractContainerContent` in the other server does a depth-counting scan (`app-shell.js:163-198`) and falls back to `stripDocumentWrapper` when it cannot match. Two `<main>` elements give both implementations the wrong span. `layouts/default.stx:1-14` already documents this in prose for app pages; it applies identically to marketing once `layouts/marketing.stx` owns the element.

**WRONG** — `resources/views/use-cases/agencies.stx:16` and 23 siblings declare their own `<main>` while the layout is supposed to.

**RIGHT** — the layout has `<main>@yield('content')</main>` (§2.2); the page's `@section('content')` starts at `<nav class="subnav shell">`. Page-level wrappers use `<div>`, as `account.stx:126-127` and `issue/[id].stx:570-572` already do.

**CHECK.**
```bash
find resources/views -name '*.stx' -not -path '*/layouts/*' \
  | xargs grep -lE '^[[:space:]]*<main[ >]'
```
Must return nothing. Currently 24 files.

### 2.9 MUST use `@nolayout` when a page genuinely owns its output — never a DOCTYPE as an implicit signal

**WHY.** `process.js:302-304` strips `@nolayout` and `process.js:310` gates the entire fallback branch on `!hasNoLayout`. It is unconditional and reads as intent. A DOCTYPE is neither: the gate at `process.js:312` is `if (!hasDoctype || hasSections)` — an **OR**. Add a single `@section(` to a doctype page and layout resolution switches back on; `process.js:333-336` then wraps the whole document, DOCTYPE and all, into `@section('content')` and injects it into the layout's `@yield('content')`, producing a document nested inside a document. bughq has 24 files one `@section(` away from this. `grep -rn '@nolayout' resources/views` returns zero.

**RIGHT** — for an embed, an OG-image renderer, or a bare error page:
```stx
@nolayout

<div class="embed">…</div>
```
Note that `@nolayout` opts out of the *layout*, not the shell: `autoShell` still generates `<!DOCTYPE>`/`<head>` at `process.js:224`, so `useSeoMeta` keeps working. That is the whole point — `@nolayout` is not a licence to hand-write a document.

**CHECK.** `grep -rln '@nolayout' resources/views` — cross-reference against the doctype list from §2.1. Any file in one list and not the other is mislabelled. Manual review: the only legitimate `@nolayout` page is one whose output is consumed by something other than the SPA router.

### 2.10 SHOULD use `_layout.stx` for a subtree shell instead of repeating `@extends` in every file

**WHY.** `process.js:313-327` walks up to 20 parent directories from the page file looking for `_layout.stx`, bounded below by `path.dirname(opts.layoutsDir)`, and prefers it over the `defaultLayout` fallback (`:326-327`). bughq has none (`find resources/views -name '_layout.stx'` → empty), so `resources/views/projects/` and `resources/views/issue/` both inherit `layouts/default.stx` by fallback. If either subtree ever needs its own chrome, `resources/views/projects/_layout.stx` is the zero-repetition way to get it.

Two constraints: it is **not** consulted when a page has an explicit `@extends` (`process.js:310` requires `!layoutPath`), and it emits an absolute path into the layout marker, so its layout group is derived from the filename — `_layout` (`layout-metadata.js:2-5`, no `layouts` segment in the path). Prefer explicit `@extends` when the group name matters to the router.

**CHECK.** `find resources/views -name '_layout.stx'` — then confirm no page inside that subtree also declares `@extends`, which would override it silently.

### 2.11 MUST NOT use `definePageMeta({ layout })` — it is a declared type with no implementation

**WHY.** `head.d.ts:215-225` declares `PageMeta.layout?: string | false`, and `definePageMeta` stores it (`head.js:225-231`). Nothing reads it. The only consumers of `getPageMeta()` anywhere in the dist are `dev-server/serve-app.js:388` (`pageMeta.validate`) and `:404-405` (`pageMeta.middleware`). Layout selection is `@extends` / `@nolayout` / `_layout.stx` / `defaultLayout` and nothing else. A page that "sets its layout" via `definePageMeta` gets the `defaultLayout` fallback and no error.

**CHECK.**
```bash
grep -rn 'definePageMeta' resources/views | grep 'layout'   # must return nothing
```

### 2.12 SHOULD keep `layoutsDir` pointing at the directory that actually holds the layouts

**WHY.** `config/ui.ts:13` says `layoutsDir: 'resources/layouts'`. That directory is empty; the layouts live in `resources/views/layouts/`. It works today only because the server overrides the config: `node_modules/@stacksjs/actions/dist/dev/views.js:59-62` resolves `layoutsDir` via `firstExistingPath(['resources/views/layouts', 'resources/layouts'])` and `serve.js:8936` gives `options.layoutsDir` precedence over `stxConfig.layoutsDir`. Any code path that reads `config/ui.ts` directly — `process.js:328-331`, `utils.js:758-778` — resolves `resources/layouts/default.stx`, which does not exist.

Fix in one of two directions, not both: move `layouts/` to `resources/layouts/` (matching `componentsDir` at `config/ui.ts:10` and `partialsDir` at `:16`, which already point outside `resources/views/`), or change `config/ui.ts:13` to `'resources/views/layouts'`. Moving is preferable — it puts all three Nuxt-style directories on the same level, and it removes any dependence on the route-exclusion list at `serve.js:9263-9269` that currently keeps `resources/views/layouts/*.stx` from being served as pages.

**CHECK.**
```bash
node -e "const c=require('./config/ui.ts');" 2>/dev/null; \
  ls "$(grep -oP "layoutsDir: '\K[^']+" config/ui.ts)"/*.stx
```
Must list the layouts. Currently errors — the directory is empty.

---

### Full worked example: `resources/views/use-cases/agencies.stx`

#### Before — 107 lines, a document

```stx
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Error tracking for agencies - bughq</title>
    <meta name="description" content="Keep every client site as its own project with isolated issues, releases, and members, and self-host so client data stays on infrastructure you control.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="/marketing.css">
  </head>
  <body>
    @include('SiteNav')

    <main>
      <nav class="subnav shell" aria-label="Breadcrumb">
        <a href="/">Home</a><span class="sep">/</span>
        <a href="/use-cases">Use cases</a><span class="sep">/</span>
        <span>Agencies</span>
      </nav>

      <section class="feat-hero shell">
        <span class="kicker">Agencies</span>
        <h1>One project per client, one place to watch them all.</h1>
        <p>You maintain a dozen sites on a dozen stacks. bughq keeps each client as its own isolated project with its own issues, releases, and members, so you always know which build on which site started erroring.</p>
        <div class="hero-actions">
          <a class="btn primary" href="/register">Get started</a>
          <a class="btn ghost" href="/features/self-host">Self-hosting</a>
        </div>
      </section>

      <section class="section shell reveal" aria-labelledby="scenarios-heading">
        <div class="section-head">
          <h2 id="scenarios-heading" class="section-title">Built for client work</h2>
        </div>
        <div class="chips">
          <div class="chip">
            <h3>Isolated projects</h3>
            <p>Each client site is its own project. Issues, releases, and quotas never bleed between one account and the next.</p>
          </div>
          <div class="chip">
            <h3>Scoped access</h3>
            <p>Add a client stakeholder to a single project, or keep a site internal to your team. Access ends at the project boundary.</p>
          </div>
          <div class="chip">
            <h3>Per-site releases</h3>
            <p>A deploy on one site tags only that project, so a regression points at the exact build on the exact client.</p>
          </div>
          <div class="chip">
            <h3>Handover-ready</h3>
            <p>When a project ships to the client, the issue history and configuration go with it. Nothing is trapped in a shared inbox.</p>
          </div>
        </div>
      </section>

      <section class="section shell reveal" aria-label="What you get">
        <div class="metrics">
          <div class="metric">
            <div class="m-value">Per client</div>
            <div class="m-label">A separate project for every site, with its own issues and releases.</div>
          </div>
          <div class="metric">
            <div class="m-value">Your servers</div>
            <div class="m-label">Self-host on your own Postgres so client stack data stays with you.</div>
          </div>
          <div class="metric">
            <div class="m-value">Clean billing</div>
            <div class="m-label">Usage is per project, so a noisy site never surprises a quiet one.</div>
          </div>
        </div>
      </section>

      <section class="section shell reveal" aria-labelledby="related-heading">
        <div class="section-head">
          <h2 id="related-heading" class="section-title">Features that do the work</h2>
        </div>
        <div class="related">
          <a href="/features/self-host">
            <div class="r-name">Self-hosting</div>
            <div class="r-desc">Keep every client's stack data inside your own boundary.</div>
          </a>
          <a href="/features/grouping">
            <div class="r-name">Fingerprint grouping</div>
            <div class="r-desc">One issue per bug, isolated to the client it belongs to.</div>
          </a>
          <a href="/features/releases">
            <div class="r-name">Releases and environments</div>
            <div class="r-desc">Name the exact build on the exact site that regressed.</div>
          </a>
        </div>
      </section>

      <section class="section shell reveal" aria-label="Get started">
        <div class="cta-band">
          <h2>Give every client site a net under it.</h2>
          <div class="cta-actions">
            <a class="btn primary" href="/register">Get started</a>
            <a class="btn ghost" href="/docs">Read the docs</a>
          </div>
        </div>
      </section>
    </main>

    @include('SiteFooter')
  </body>
</html>
```

Violations: §2.1 (lines 1-13, 106-107), §2.4 (no `@extends`), §2.6 (lines 6-7), §2.8 (line 16), plus the duplicated `@include('SiteNav')`/`@include('SiteFooter')` that the layout should own.

#### After — 98 lines, a fragment

```stx
@extends('layouts/marketing')

<script server>
useSeoMeta({
  title: 'Error tracking for agencies - bughq',
  description: 'Keep every client site as its own project with isolated issues, releases, and members, and self-host so client data stays on infrastructure you control.',
  canonical: 'https://bughq.org/use-cases/agencies',
})
</script>

@section('content')
  <nav class="subnav shell" aria-label="Breadcrumb">
    <a href="/">Home</a><span class="sep">/</span>
    <a href="/use-cases">Use cases</a><span class="sep">/</span>
    <span>Agencies</span>
  </nav>

  <section class="feat-hero shell">
    <span class="kicker">Agencies</span>
    <h1>One project per client, one place to watch them all.</h1>
    <p>You maintain a dozen sites on a dozen stacks. bughq keeps each client as its own isolated project with its own issues, releases, and members, so you always know which build on which site started erroring.</p>
    <div class="hero-actions">
      <a class="btn primary" href="/register">Get started</a>
      <a class="btn ghost" href="/features/self-host">Self-hosting</a>
    </div>
  </section>

  <section class="section shell reveal" aria-labelledby="scenarios-heading">
    <div class="section-head">
      <h2 id="scenarios-heading" class="section-title">Built for client work</h2>
    </div>
    <div class="chips">
      <div class="chip">
        <h3>Isolated projects</h3>
        <p>Each client site is its own project. Issues, releases, and quotas never bleed between one account and the next.</p>
      </div>
      <div class="chip">
        <h3>Scoped access</h3>
        <p>Add a client stakeholder to a single project, or keep a site internal to your team. Access ends at the project boundary.</p>
      </div>
      <div class="chip">
        <h3>Per-site releases</h3>
        <p>A deploy on one site tags only that project, so a regression points at the exact build on the exact client.</p>
      </div>
      <div class="chip">
        <h3>Handover-ready</h3>
        <p>When a project ships to the client, the issue history and configuration go with it. Nothing is trapped in a shared inbox.</p>
      </div>
    </div>
  </section>

  <section class="section shell reveal" aria-label="What you get">
    <div class="metrics">
      <div class="metric">
        <div class="m-value">Per client</div>
        <div class="m-label">A separate project for every site, with its own issues and releases.</div>
      </div>
      <div class="metric">
        <div class="m-value">Your servers</div>
        <div class="m-label">Self-host on your own Postgres so client stack data stays with you.</div>
      </div>
      <div class="metric">
        <div class="m-value">Clean billing</div>
        <div class="m-label">Usage is per project, so a noisy site never surprises a quiet one.</div>
      </div>
    </div>
  </section>

  <section class="section shell reveal" aria-labelledby="related-heading">
    <div class="section-head">
      <h2 id="related-heading" class="section-title">Features that do the work</h2>
    </div>
    <div class="related">
      <a href="/features/self-host">
        <div class="r-name">Self-hosting</div>
        <div class="r-desc">Keep every client's stack data inside your own boundary.</div>
      </a>
      <a href="/features/grouping">
        <div class="r-name">Fingerprint grouping</div>
        <div class="r-desc">One issue per bug, isolated to the client it belongs to.</div>
      </a>
      <a href="/features/releases">
        <div class="r-name">Releases and environments</div>
        <div class="r-desc">Name the exact build on the exact site that regressed.</div>
      </a>
    </div>
  </section>

  <section class="section shell reveal" aria-label="Get started">
    <div class="cta-band">
      <h2>Give every client site a net under it.</h2>
      <div class="cta-actions">
        <a class="btn primary" href="/register">Get started</a>
        <a class="btn ghost" href="/docs">Read the docs</a>
      </div>
    </div>
  </section>
@endsection
```

What changed, and what each change buys:

| Removed | Replaced by | Bought |
|---|---|---|
| `<!DOCTYPE>`/`<html>`/`<head>`/`<body>` (1-13, 106-107) | `generateDocumentShell` (`document-shell.js:53-62`) | `process.js:311` gate no longer trips; a layout resolves |
| `<title>` + `<meta description>` (6-7) | `useSeoMeta` in `<script server>` | og:title, og:description, twitter:*, canonical — 11 tags from 3 keys (`head.js:31-91`) |
| 4 `<link>` tags (8-11) | `@head` in `layouts/marketing.stx` | one copy instead of 24 |
| `@include('SiteNav')` / `@include('SiteFooter')` (14, 105) | layout | one copy instead of 24 |
| `<main>` (16, 103) | layout | one router container, guaranteed |
| — | `<!-- stx-layout: layouts/marketing -->` (`process.js:447`) | `X-STX-Layout-Group: marketing` ≠ the app's `default`, so cross-shell navigation is a full-document swap that carries `/marketing.css` |

Apply the identical transform to the other 22 marketing pages. The 8 `/compare/*` files are structurally identical 153-line copies (`compare/{airbrake,bugsnag,datadog,glitchtip,honeybadger,raygun,rollbar,sentry}.stx`); once they are fragments, they should collapse further onto a data-driven `@foreach`, following the pattern `resources/views/compare.stx:1-13` and `:52` already establishes — but that is a components-and-data problem, not a page-anatomy one.

---

### Enforcement summary

Run all of these from the repo root. Every one must produce no output.

```bash
# 2.1 / 2.2 / 2.3 — no documents anywhere in views
grep -rlE '<!DOCTYPE|<html[ >]|</body>|</html>' resources/views

# 2.4 — every page declares a layout or opts out explicitly
find resources/views -name '*.stx' -not -path '*/layouts/*' -not -path '*/components/*' \
  | xargs grep -LE '@(extends|layout)\(|@nolayout'

# 2.5 — @extends always paired with @section('content')
find resources/views -name '*.stx' | xargs grep -lE '@(extends|layout)\(' \
  | xargs grep -LE "@section\(\s*['\"]content"

# 2.6 — no hand-written head tags in pages
grep -rn '<title>\|<meta name="description"\|link rel="stylesheet"' resources/views \
  | grep -v '^resources/views/layouts/'

# 2.7 — every <style> in a page is inside @push
find resources/views -name '*.stx' -not -path '*/layouts/*' | xargs grep -ln '<style'

# 2.8 — only the layout declares <main>
find resources/views -name '*.stx' -not -path '*/layouts/*' \
  | xargs grep -lE '^[[:space:]]*<main[ >]'

# 2.11 — definePageMeta layout is a no-op
grep -rn 'definePageMeta' resources/views | grep layout
```

Runtime assertion, per route, once the dev server is up (`bun scripts/dev.ts`):

```bash
for p in / /docs /pricing /use-cases/agencies /compare/sentry /dashboard; do
  printf '%-24s ' "$p"
  curl -s -H 'X-STX-Router: true' -D- -o /dev/null "http://localhost:3100$p" \
    | grep -i '^x-stx-layout-group' || echo 'NO LAYOUT'
done
```
Marketing routes must report `marketing`; app routes must report `default`. Any route reporting `default` that is not an app page is a page that skipped layout resolution — go back to §2.1.

## 3. Layouts and the application shell

bughq has two surfaces — 23 marketing pages that each hand-roll `<!DOCTYPE html>…</html>`, and 13 app/auth fragments that render into `resources/views/layouts/default.stx`. That split is not a design; it is the absence of one. `@extends`, `@layout`, `@section`, `@yield`, `@push` and `@stack` are used **zero times** by any page in the repo (`grep -rEn '@(layout|extends|section|yield|stack|push)' resources --include="*.stx"` returns hits only inside the two layout files themselves). Every consequence documented as immovable in `config/ui.ts:20-40` and `resources/views/layouts/default.stx:22-37` — the pinned `interceptAllLinks: true`, the eight `data-no-router` escapes, "the page arrives unstyled" — is downstream of that one omission.

This chapter defines the shell hierarchy you must build instead.

### The three shell mechanisms, and which one to use

| Mechanism | Entry point | What it produces | Verdict |
|---|---|---|---|
| **`autoShell` + `app.head`** | `config/ui.ts` `app.head` → `generateDocumentShell` (`node_modules/@stacksjs/stx/dist/document-shell.js:11-63`) | `<!DOCTYPE html><html lang><head>` with charset, viewport, `<title>`, cloak style, config `meta`/`link`/`script`, then your content as `<body>` | **MUST use.** This is the only document shell in a correct bughq. |
| **Layouts** (`@extends` / `@yield` / `@section`) | `resources/layouts/*.stx` → `process.js:305-338`, `:372-449` | Body-level chrome (nav, `<main>`, footer) + the `<!-- stx-layout: … -->` marker at `process.js:447` that becomes `<meta name="stx-layout">` / `<meta name="stx-layout-group">` at `process.js:227-232` | **MUST use.** One layout per chrome group. |
| **`app.stx`** (the `shell` config key) | `detectShell` (`app-shell.js:17-30`), `composeShellWithPage` (`app-shell.js:83-116`), config key `shell` at `types/config-types.d.ts:313` | A hardcoded document: fixed `<title>` fallback `'stx App'`, fixed container `[data-stx-content]`, no layout metadata at all | **MUST NOT use.** Marked `@deprecated` at `app-shell.d.ts:6-8`. |

---

### 3.1 MUST: no `.stx` file in the repository may contain `<!DOCTYPE` or a literal `<html` tag — layouts included

**WHY.** `hasDocumentShell` (`node_modules/@stacksjs/stx/dist/document-shell.js:64-66`) is a two-branch regex: `/<!DOCTYPE\b/i.test(html) || /<html[\s>]/i.test(html)`. When it returns true, `process.js:224` skips `ensureDocumentShell` entirely and `process.js:225-226` degrades to `injectConfigHeadTags`, which only tops up `meta`/`link`/`script` into an existing `</head>` (`document-shell.js:67-99`).

Worse, `process.js:311-312` gates the entire layout system on the same test:

```js
const hasDoctype = /<!DOCTYPE\s/i.test(output), hasSections = /@section\s*\(/.test(output);
if (!hasDoctype || hasSections) {   // ← layout resolution lives inside this branch
```

A page with a DOCTYPE and no `@section` never resolves a layout, so `process.js:447` never emits `<!-- stx-layout: … -->`, so `process.js:227-232` never writes the `stx-layout` / `stx-layout-group` metas. Without those metas the router is blind: `bun-plugin-stx/dist/serve.js:10120-10121` falls back to `const pageLayout = layoutMatch ? layoutMatch[1] : "default"` and reports `X-STX-Layout: default` — **the same value bughq's app pages report** — so `client.js:248-266 checkLayoutChange()` sees no change and does a fragment swap. `client.js:568-580` is the only code path that copies `<link rel="stylesheet">` across a navigation and it runs *only* in the full-document branch; the fragment path at `serve.js:10126-10147` and `:10156-10160` harvests `<style>` elements and nothing else. That is precisely, mechanically, "the page arrives unstyled".

**WRONG** — `resources/views/compare/sentry.stx:1-19` (byte-identical in all 8 `/compare/*` pages, and structurally identical across all 23 marketing pages):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>bughq vs Sentry - bughq</title>
    <meta name="description" content="How bughq, an open-source error tracker…">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk…">
    <link rel="stylesheet" href="/marketing.css">
    <style>
      .cmp-hl .cmp-cell:nth-child(3n+2) { background: var(--accent-soft); }
      .cmp-note { margin-top: 1rem; color: var(--text-3); … }
    </style>
  </head>
  <body>
    @include('SiteNav')
    <main>
```

`resources/views/layouts/marketing.stx:1-2` commits the same offence — a *layout* that ships its own DOCTYPE, which then suppresses `app.head` for every page that would extend it.

**RIGHT** — the page owns content and metadata only:

```html
@extends('marketing')

@section('title', 'bughq vs Sentry - bughq')
@section('description', 'How bughq, an open-source error tracker you self-host on Postgres, compares to Sentry.')

@push('styles')
<style>
  .cmp-hl .cmp-cell:nth-child(3n+2) { background: var(--accent-soft); }
  .cmp-note { margin-top: 1rem; color: var(--text-3); font-size: 0.86rem; line-height: 1.55; max-width: 68ch; }
</style>
@endpush

@section('content')
  <nav class="subnav shell" aria-label="Breadcrumb">…</nav>
  <section class="feat-hero shell">…</section>
@endsection
```

The `@section('title', …)` two-argument form is collapsed at `process.js:339-342` into `context.__sections`, and `process.js:213` reads `context.__sections?.title` as the third title source — so a page sets the document `<title>` with **no head markup at all**.

**CHECK.**
```bash
grep -rn "DOCTYPE\|<html[ >]" resources --include="*.stx"   # must return nothing
```
Today this returns 25 hits across 25 files. Note `hasDocumentShell` does not parse HTML: a `<html>` inside an `{{-- --}}` comment trips it too.

---

### 3.2 MUST NOT: create `app.stx`, and MUST NOT set the `shell` config key

**WHY.** `composeShellWithPage` (`app-shell.js:83-116`) hardcodes the entire document as a template literal at `:96-115`. It ignores `options.app.head` completely; the title falls back to the string `"stx App"` (`app-shell.js:95`), the router container is frozen to `window.__stxRouterConfig={container:'[data-stx-content]'}` (`:95`, overriding your `config/ui.ts:42`), and no `stx-layout` meta is ever emitted — permanently disabling layout-group navigation. It is reachable only from `dev-server/serve-app.js:99` and is `@deprecated` at `app-shell.d.ts:6-8`: *"Use `layouts/default.stx` instead. The framework now auto-generates the document shell from `stx.config.ts` `app.head` configuration."*

**WRONG.** Any of: a file named `app.stx` at the project root; `shell: 'app.stx'` in `config/ui.ts`.

**RIGHT.** Delete it. The document shell is `config/ui.ts` `app.head`; the chrome is `resources/layouts/*.stx`.

**CHECK.**
```bash
test ! -e app.stx && ! grep -qn "^\s*shell:" config/ui.ts && echo OK
```

---

### 3.3 MUST: layouts, partials and components live outside `pagesDir`

**WHY.** `resolveStxRoot` (`node_modules/@stacksjs/stx/dist/config.js:363-374`) resolves bughq to `{ root: 'resources', pagesDir: 'views' }` because both `resources/views` and `resources/layouts` exist (`config.js:367-369`). Everything under `resources/views` is therefore a **route**. `production-builder.js:62-63` filters `excludeDirs = ["components","layouts","partials"]` — but that guard exists only in `buildForProduction`; `SSGConfig` (`ssg.d.ts:24-43`) has no such keys, so the SSG path that produced `dist/` swept them up.

Measured in `dist/` right now:

| Artefact | Size | Sitemap entry |
|---|---|---|
| `dist/layouts/default.html` | 35,730 B | `<loc>http://localhost/layouts/default</loc>` |
| `dist/layouts/marketing.html` | 38,053 B | `<loc>http://localhost/layouts/marketing</loc>` |
| `dist/components/FeatureCard.html` | 38,708 B | `<loc>http://localhost/components/FeatureCard</loc>` |

`dist/layouts/marketing.html` publishes this as page body content:

```
include error: Error loading include file SiteNav: ENOENT: no such file or directory,
open '/Users/glennmichaeltorregosa/Documents/Stacks/bughq/resources/resources/partials/SiteNav.stx'
```

— an absolute filesystem path plus raw ANSI escape codes, served on a public URL and listed in the sitemap.

**WRONG.** `resources/views/layouts/default.stx`, `resources/views/layouts/marketing.stx`, `resources/views/components/FeatureCard.stx`.

**RIGHT.** `resources/layouts/default.stx`, `resources/layouts/marketing.stx`, and delete `FeatureCard.stx` (it has zero references anywhere in `resources/` or `routes/`). Layout name resolution does not suffer: `resolveTemplatePathInner` (`utils.js:722-738`) walks up to 10 parent directories from the page looking for a directory literally named `layouts`, and `utils.js:740` strips a leading `layouts/` from the argument — so `@extends('marketing')` from `resources/views/compare/sentry.stx` finds `resources/layouts/marketing.stx` by walk-up, before `options.layoutsDir` is even consulted (`utils.js:759-778`).

**CHECK.**
```bash
test ! -d resources/views/layouts && test ! -d resources/views/components && echo OK
grep -c "<loc>[^<]*/\(layouts\|components\|partials\)/" dist/sitemap.xml   # must be 0
```

---

### 3.4 MUST: every page under `resources/views` opens with `@extends('<layout>')` and puts its body in `@section('content')`

**WHY.** `process.js:305-309` matches `@(?:layout|extends)('name')` and is the *only* deterministic way to bind a page to a shell. The implicit path — `process.js:310-338` — applies `defaultLayout` (`config.js:22`, value `"default"`) only when the page has no DOCTYPE, and then wraps the page in a synthetic `@section('content')` at `process.js:333-336`. Relying on that implicit path is what makes bughq fragile in the exact way `process.js:311-312` describes: because the gate is `if (!hasDoctype || hasSections)`, adding a single `@section(` to any of the 24 DOCTYPE pages silently *re-enables* layout resolution, and `process.js:333-335` then wraps the page's whole document — DOCTYPE and all — into `@section('content')` and injects it into the layout's `@yield('content')`, producing a nested document.

`@extends` also survives config changes. The implicit default layout is resolved purely from `opts.layoutsDir` at `process.js:328-332`; today `config/ui.ts:13` points that at the **empty** `resources/layouts` directory and app pages only get a layout because `@stacksjs/actions/dist/dev/views.js:59-62` overrides it via `firstExistingPath(['resources/views/layouts','resources/layouts'])` and `bun-plugin-stx/dist/serve.js:8936` gives the passed option priority.

**WRONG** — 35 of 35 page files. `resources/views/dashboard.stx` and `resources/views/index.stx` both declare nothing; one accidentally gets `default.stx`, the other accidentally gets no layout.

**RIGHT** — the first non-`<script>` line of every page:

```html
@extends('default')      {{-- app + auth pages --}}
@extends('marketing')    {{-- public marketing pages --}}
```

**CHECK.**
```bash
find resources/views -name '*.stx' -exec grep -L "@extends(" {} +   # must be empty
```
Currently: 35 files.

---

### 3.5 MUST: `<main>` appears in layouts only — never in a page, never twice

**WHY.** `<main>` is the router container (`config/ui.ts:42`). `client.js:193-195 getContainer()` resolves `containerSel || '[data-stx-content]' || 'main'`; if it returns null, `shouldIntercept` bails at `client.js:796` and every link reverts to a full page load, and `swap` bails at `client.js:565` doing `location.href=url`. On the server side, fragment extraction at `serve.js:10148-10164` takes `content.match(/<main\b[^>]*>/i)` (the **first** open tag) and `content.lastIndexOf("</main>")` (the **last** close tag) — two `<main>` elements make the fragment span both, and the router injects nav + main + footer *inside* `<main>`, duplicating the chrome (documented at `app-shell.d.ts:56-58`).

bughq already learned this the hard way twice, in comments rather than in structure: `resources/views/account.stx:126-128` and `resources/views/issue/[id].stx:570-572` both say "a `<div>`, not `<main>`… a second one broke the swap". Meanwhile 19 marketing pages declare their own `<main>` (`compare/sentry.stx:22`, `features/alerts.stx:15`, `use-cases/frontend.stx:16`, `index.stx:56`, …) because they have no layout to declare it for them.

**WRONG** — `resources/views/compare/sentry.stx:19-22`:
```html
  <body>
    @include('SiteNav')

    <main>
```

**RIGHT** — `resources/layouts/marketing.stx` owns it; the page emits sections directly into `@section('content')`. Page-level wrappers use `<div>`.

**CHECK.**
```bash
grep -rn "<main" resources/views --include="*.stx" | grep -v "{{--\|<!--"   # must be empty
grep -rc "<main" resources/layouts/*.stx                                    # must be exactly 1 each
```
Currently 19 real `<main>` tags in `resources/views`.

---

### 3.6 MUST: shared `<head>` content is declared once in `config/ui.ts` `app.head`; per-page assets go through `useHead`, `@section('title')` and `@push('styles')`

**WHY.** When no `.stx` file supplies a document shell, `process.js:224` calls `ensureDocumentShell(result, headConfig)` and `document-shell.js:11-63` builds the head from `AppHeadConfig` (`types/config-types.d.ts:237-246`): `meta` at `:21-26`, `link` at `:27-29`, `script` at `:30-36`, `headRaw` at `:43`. `headConfig` itself is merged at `process.js:206-223` in a fixed precedence:

```
useHead({...}) in <script server>   (context.__stx_runtime_head)
  → @head … @endhead raw block      (context.__stx_head_raw, head.js:199-206)
    → @section('title', '…')        (context.__sections.title)
      → config app.head.title       (config/ui.ts:76)
        → 'stx App'                 (document-shell.js:13)
```

`link` and `meta` arrays are **concatenated**, not replaced (`process.js:216-218`), and `injectConfigHeadTags` dedupes links by exact `href=` (`document-shell.js:79-80`) and metas by `name`/`property`/`charset`/`http-equiv` (`document-shell.js:73-75`). So config-level assets are safe to declare unconditionally.

Page-local `<style>` must go through `@push`/`@stack` (`includes.js:722-732`), not sit loose in the template: when a layout applies, `process.js:373-384` sweeps every orphan `<script>`/`<style>` out of the page and appends it to `sections.content` — i.e. into the **body**, after the content, not the head.

**WRONG** — the same four `<link>` tags appear in 34 of 36 page files. `resources/views/index.stx:37-40`, `compare/sentry.stx:8-11`, `pricing.stx:38-40`, and 31 more:
```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk…">
    <link rel="stylesheet" href="/marketing.css">
```
…while `config/ui.ts:74-78` declares only `{ title: 'bughq' }`.

**RIGHT** — `config/ui.ts`:
```ts
app: {
  head: {
    title: 'bughq',
    lang: 'en',
    link: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' },
    ],
  },
},
```
and the page:
```html
<script server>
useHead({ title: 'bughq vs Sentry - bughq' })
</script>
@extends('marketing')
```

**CHECK.**
```bash
grep -rn "fonts.googleapis.com\|<link rel=" resources/views --include="*.stx"   # must be empty
grep -rn "<style" resources/views --include="*.stx" | grep -v "@push"           # must be empty
```
Currently 92 duplicated `<link>` lines across 23 heads, and 20 files with a loose `<style>`.

---

### 3.7 MUST: one layout file per chrome group, and the filename *is* the routing group

**WHY.** `deriveLayoutGroup` (`node_modules/stx-router/dist/layout-metadata.js:1-6`) takes the path from the `<!-- stx-layout: … -->` marker, finds the last `layouts` segment, and returns the **next segment with `.stx` stripped**. `client.js:230-237` reimplements the identical function browser-side. That string drives two decisions:

- `checkLayoutChange` (`client.js:248-266`): different group → `return true` at `:255-258` → `client.js:350-360` refetches the full document and `client.js:596-607` swaps `document.body.innerHTML`, replacing nav, footer and all chrome. Different *name* within the same group → same full-body swap (`client.js:261-263`).
- `client.js:568-580`: the stylesheet/preconnect `<link>` reconciliation runs only on that full-document path, resolving hrefs against the target document's base URL (`client.js:566-567`).

So `default.stx` → group `default`, `marketing.stx` → group `marketing`. App→marketing and marketing→app both become correct full-body swaps. Today both surfaces report `default` (marketing by the `serve.js:10121` fallback), so the router misclassifies the crossing as a same-layout fragment swap — and the asymmetric case is worse: marketing→app resolves `curGroup` via `defaultLayoutGroup('')` → `'app'` (`client.js:231`) against the app page's `'default'`, firing a **second full-page fetch** on every marketing→`/pricing`, `/login`, `/register` click.

**WRONG.** Two document shells, zero layout metadata, one reported group.

**RIGHT.** Two sibling layouts under `resources/layouts/`. `resources/layouts/marketing.stx`, complete — note it has no DOCTYPE, no `<head>`, and calls `@include` for chrome exactly the way all 23 pages do today:

```html
{{-- Marketing chrome. Group 'marketing': crossing to/from the app shell makes
     client.js:255 fire a full-document swap so nav and footer are replaced. --}}
@include('SiteNav')

<main>
@yield('content')
</main>

@include('SiteFooter')

@stack('scripts')
```

and `resources/layouts/default.stx` keeps its current body (`resources/views/layouts/default.stx:38-44`) with `@yield('footer')` deleted per rule 3.9.

**CHECK.**
```bash
# server-rendered metadata, dev server on :3100
curl -s localhost:3100/compare/sentry | grep -o 'name="stx-layout-group" content="[^"]*"'  # → marketing
curl -s localhost:3100/dashboard     | grep -o 'name="stx-layout-group" content="[^"]*"'  # → default
# fragment headers
curl -s -D- -o/dev/null -H 'X-STX-Router: true' localhost:3100/compare/sentry | grep -i x-stx-layout
```

---

### 3.8 MUST NOT: nest layouts (`@extends` inside a layout file) while relying on layout groups

**WHY.** This is a trap, not a style preference. `process.js:405-421` detects an `@extends` in the layout file, merges the intermediate layout's sections, and recurses via `processDirectives(nestedTemplate, …, layoutFullPath, …)`. That recursive call matches the *base* layout at `process.js:305` and stamps `<!-- stx-layout: base -->` at `process.js:447`. The intermediate layout's name is discarded. So `marketing.stx @extends('base')` and `default.stx @extends('base')` both report group `base` — `checkLayoutChange` (`client.js:255`) sees no change, and you are back to unstyled fragment swaps with extra indirection.

Share the *document* through `app.head` (rule 3.6) and share *markup* through `@include` partials. Never through layout inheritance.

**CHECK.**
```bash
grep -rn "@extends(\|@layout(" resources/layouts/*.stx   # must return nothing
```

---

### 3.9 MUST: `data-no-router` survives only on links whose response is not an HTML page

**WHY.** `client.js:793` honours `data-stx-no-router` and `data-no-router`, but only inside `shouldIntercept`, reachable only from the `interceptAllLinks` branch at `client.js:809` (`client.js:808` matches `[data-stx-link]` first and unconditionally — so `data-no-router` on an `<StxLink>` is silently ignored). There are exactly two legitimate reasons to opt out, and "my target page has a different `<head>`" is not one of them once rule 3.7 holds.

bughq's 12 occurrences split cleanly:

| Site | Target | After a unified shell |
|---|---|---|
| `login.stx:113`, `register.stx:126`, `pricing.stx:88`, `account.stx:119`, `account.stx:183`, `reset-password.stx:117`, `forgot-password.stx:96`, `projects/new.stx:120` | `/` | **Delete.** Layout-group change drives a full-document swap; `client.js:568-580` carries any stylesheet the target needs. |
| `login.stx:146`, `login.stx:152`, `register.stx:158`, `register.stx:164` | `/api/auth/{github,google}/redirect` | **Keep, permanently.** These are 302s. Intercepting one `fetch`es the redirect instead of following it, recovering only via the error path at `client.js:371-373`. |

**WRONG** — `resources/views/login.stx:113`:
```html
<a href="/" data-no-router class="wordmark text-2xl">bughq</a>
```

**RIGHT.**
```html
<StxLink to="/" class="wordmark text-2xl">bughq</StxLink>
```
and, on the four that stay:
```html
{{-- Server 302. Unconditional opt-out, not a shell artefact. --}}
<a href="/api/auth/github/redirect" data-no-router class="oauth-btn …">
```

Once every internal anchor is an `<StxLink>` (`client.js:808` matches `[data-stx-link]` without `interceptAllLinks`), `config/ui.ts:43` **SHOULD** flip to `interceptAllLinks: false`. Do not flip it before then: `resources/partials/SiteNav.stx` and `SiteFooter.stx` carry 64 plain anchors that depend on the flag.

**CHECK.**
```bash
grep -rn "data-no-router" resources/views --include="*.stx" | grep -v "/api/"   # must be empty
```
Currently 8 hits.

---

### 3.10 SHOULD: use `_layout.stx` for subtree chrome, and `@nolayout` for a page that genuinely owns its document

**WHY.** `process.js:313-327` walks up to 20 parent directories from the page file looking for `_layout.stx`, bounded by `path.dirname(opts.layoutsDir)`, and **prefers it over the configured default layout** (`process.js:326-332`). That is the Nuxt-style co-located shell: `resources/views/issue/_layout.stx` would wrap `issue/[id].stx` only. bughq has none. Use it when a subtree needs distinct chrome; do not use it to duplicate `default.stx`.

`@nolayout` (`process.js:302-304`, gated at `:310`) is the explicit opt-out. bughq uses it zero times; its 24 DOCTYPE pages opt out *implicitly* through `process.js:311`, which is why adding one `@section(` to any of them silently produces a nested document (rule 3.4).

**CHECK.** Manual review. A `_layout.stx` is correct only if it differs structurally from its nearest ancestor layout; diff them. `grep -rn "@nolayout" resources` should return only files that are deliberately standalone (an embed, an OG image renderer) — and per rule 3.1 such a page still must not write a DOCTYPE; it must let `ensureDocumentShell` build one.

---

### 3.11 MUST: every `@yield` and `@stack` in a layout is filled by at least one page

**WHY.** Unfilled slots fail **silently**. `process.js:364-366` replaces an unmatched `@yield` with its default argument or the empty string; `includes.js:727-729` renders an empty `@stack` as `''`. No warning, no build error.

**WRONG** — `resources/views/layouts/default.stx:42` `@yield('footer')` and `:44` `@stack('scripts')`; `resources/views/layouts/marketing.stx:12-13` the same pair. Not one page in bughq fills any of them — all 23 marketing pages call `@include('SiteFooter')` inline instead. `marketing.stx` additionally offers no `@stack('styles')` despite 9 pages carrying a page-local `<style>` block.

**RIGHT.** Delete `@yield('footer')` and call `@include('SiteFooter')` from the layout (rule 3.7). Add `@stack('styles')` to the layout only once a page uses `@push('styles')`.

**CHECK.**
```bash
# every yield/stack name a layout declares must appear as a section/push in some page
comm -23 \
  <(grep -rhoE "@(yield|stack)\('([^']+)'" resources/layouts | grep -oE "'[^']+'" | tr -d "'" | sort -u) \
  <(grep -rhoE "@(section|push|prepend)\('([^']+)'" resources/views | grep -oE "'[^']+'" | tr -d "'" | sort -u)
# must print nothing
```

---

### 3.12 The file tree bughq must have

```
config/
  ui.ts                     # declares every directory below — the Nuxt-style manifest
resources/
  layouts/
    default.stx             # app + auth chrome → group 'default'
    marketing.stx           # marketing chrome  → group 'marketing'
  partials/
    SiteNav.stx             # @include('SiteNav')   — already correct location
    SiteFooter.stx          # @include('SiteFooter')
  components/               # user components, resolvable by tag name
  views/                    # pagesDir — ONLY routable pages, nothing else
    index.stx               @extends('marketing')
    pricing.stx             @extends('marketing')
    docs.stx                @extends('marketing')
    compare.stx             @extends('marketing')
    use-cases.stx           @extends('marketing')
    compare/[slug].stx      @extends('marketing')   # replaces 8 × 153 identical files
    features/*.stx          @extends('marketing')
    use-cases/*.stx         @extends('marketing')
    login.stx               @extends('default')
    register.stx            @extends('default')
    forgot-password.stx     @extends('default')
    reset-password.stx      @extends('default')
    dashboard.stx           @extends('default')
    settings.stx            @extends('default')
    account.stx             @extends('default')
    projects/index.stx      @extends('default')
    projects/new.stx        @extends('default')
    issue/[id].stx          @extends('default')
```

Deleted: `resources/views/layouts/`, `resources/views/components/FeatureCard.stx` (zero references), and 7 of the 8 `/compare/*` files — they are byte-identical in tag+class skeleton and the canonical `alternatives` array already exists in `resources/views/compare.stx:1-13`, rendered with `@foreach` at `compare.stx:52`.

The matching config. All three directory keys are **root-relative**, because `config.js:411-419` joins `loaded.root` onto each of `partialsDir`, `componentsDir`, `layoutsDir` — which is why the current absolute-looking values in `config/ui.ts:10,13,16` become `resources/resources/*` and produce the include-error dump in `dist/layouts/marketing.html`:

```ts
export default {
  root: 'resources',        // explicit — do not let config.js:363-374 infer it
  pagesDir: 'views',
  layoutsDir: 'layouts',    // → resources/layouts
  componentsDir: 'components',
  partialsDir: 'partials',
  defaultLayout: 'default',
  app: { head: { /* rule 3.6 */ } },
  router: { container: 'main', interceptAllLinks: false /* after rule 3.9 */ },
} satisfies UiOptions
```

**CHECK** — one command that must pass before any `.stx` change is committed:

```bash
grep -rn "DOCTYPE\|<html[ >]" resources --include="*.stx"                       # empty
find resources/views -name '*.stx' -exec grep -L "@extends(" {} +               # empty
grep -rn "<main" resources/views --include="*.stx" | grep -v "{{--\|<!--"       # empty
grep -rn "data-no-router" resources/views --include="*.stx" | grep -v "/api/"   # empty
grep -rn "@extends(\|@layout(" resources/layouts/*.stx                          # empty
test ! -d resources/views/layouts && test ! -e app.stx
```

## 4. Head, SEO and structured data

Everything a page says about itself — `<title>`, description, canonical, og/twitter, robots, JSON-LD — is produced by exactly two mechanisms in stx 0.2.113: **runtime head calls in a `<script server>` block**, and **`app.head` in `config/ui.ts`**. Nothing else. bughq currently uses a third (24 hand-written `<head>` blocks) and a fourth (`site.config.ts` `pages`), and the result is 24 built pages that ship `<title>stx Project</title>`.

### 4.0 The title precedence chain (read this before writing any rule-breaking code)

`process.js` lines 205–226 are the entire mechanism. `runtimeHead` is `context.__stx_runtime_head` (what `useHead`/`useSeoMeta` write), `pageHeadRaw` is what `@head … @endhead` captured, `sectionTitle` is `@section('title')`, and `baseHeadConfig` is `config/ui.ts` `app.head`:

```js
// node_modules/@stacksjs/stx/dist/process.js:206-215
const baseHeadConfig = options.app?.head || {}, runtimeHead = (context.__stx_runtime_head || null) ?? getHeadStatic();
let pageHeadRaw = (context.__stx_head_raw || "").trim(), pageHeadTitle;
const rawTitleMatch = pageHeadRaw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
if (rawTitleMatch) { pageHeadTitle = rawTitleMatch[1].trim(); pageHeadRaw = pageHeadRaw.replace(rawTitleMatch[0], "").trim(); }
const sectionTitle = context.__sections?.title,
      pageTitle = runtimeHead.title || pageHeadTitle || sectionTitle, headConfig = { ...baseHeadConfig, ...pageTitle && { title: pageTitle }, ... }
```

| # | Source | Written by | Framework line | Verified render |
|---|---|---|---|---|
| 1 | `context.__stx_runtime_head.title` | `useHead` / `useSeoMeta` / `@title(…)` in a page with no server head | `process.js:206`, `:213`; bridge `variable-extractor.js:312-323` | `FROM-USEHEAD` beats `@title`, `@head`, `@section` |
| 2 | `<title>` inside `@head … @endhead` | `processHeadDirective`, `head.js:199-206` → `process.js:559-564` | `process.js:207-212` | `FROM-HEAD` wins only when 1 is absent |
| 3 | `@section('title')` | `context.__sections.title` | `process.js:213` | `Section Title` wins only when 1 and 2 are absent |
| 4 | `config/ui.ts` `app.head.title` | `baseHeadConfig` spread | `process.js:206`, `:214` | bare page renders `<title>bughq</title>` |
| 5 | `"stx App"` | `generateDocumentShell` default | `document-shell.js:13`, `:21`, `:39` | `dist/dashboard.html` ships `<title>stx App</title>` |

Note the trap at tier 1: `@title('X')` writes only the module-global head (`head.js:210` calls the *static* `useHead`), so if a `<script server>` already called `useHead`, `process.js:206` reads `context.__stx_runtime_head` and `@title` is silently discarded. Two mechanisms, one winner, no warning.

### 4.0.1 API status table — stx 0.2.113

Half of the head API documented in `head.d.ts` is inert in a `<script server>` block. Do not use anything marked MUST NOT; it fails silently.

| API | Implementation | Behaviour in `<script server>` | Verdict |
|---|---|---|---|
| `useSeoMeta(config)` | `head.js:31-91` | works for `title`, `description`, `keywords`, `author`, `robots`, all `og:*`, all `twitter:*`, all `article:*` | **MUST** — the default |
| `useSeoMeta({ canonical })` | `head.js:82-84` | **dropped.** The bridge at `variable-extractor.js:326-331` copies only `title` and `meta` into `context.__stx_runtime_head`; `link` is never copied, and `process.js:216` reads `runtimeHead.link` | **MUST NOT** — see 4.5 |
| `useHead(config)` | `head.js:15-17`, bridge `variable-extractor.js:312-323` | works, and is the only call that carries `link`/`script` through | **MUST** for canonical/preload |
| `definePageMeta(config)` | `head.js:92-99` | **no-op.** The server scope binds `definePageMeta = (_meta) => {}` at `variable-extractor.js:300` | **MUST NOT** |
| `usePageTitle` / `useTitle` | `head.js:100-103`, `head.js:222-224` | **not bound.** Absent from the injected parameter list at `variable-extractor.js:466` | **MUST NOT** |
| `titleTemplate` | `head.js:20-21`, applied `head.js:108-109` | **never applied.** Neither bridge copies `titleTemplate` into `context.__stx_runtime_head`, and `generateDocumentShell` renders `<title>${pageTitle}</title>` raw (`document-shell.js:39`) | **MUST NOT** |
| `@structuredData({ … })` | `seo.js:61-97`, wired `process.js:586` | works; balanced-paren parse, auto-injects `@context`, emits `<script type="application/ld+json">` | **MUST** for JSON-LD |
| `@structuredData … @endstructuredData` | `seo.js:321-339`, needs `registerSeoDirectives()` (`seo.js:340-345`) | **dead.** `registerSeoDirectives` is exported but called nowhere in `dist`; the block renders as literal text into the page | **MUST NOT** |
| `@seo({ … })` | `seo.js:98-242`, wired `process.js:587` | works, but emits `<title>` + all meta **inline at the call site**, i.e. inside `<body>`, while the shell keeps its own wrong `<title>` | **MUST NOT** |
| `@head`, `@title`, `@meta` | `head.js:199-220` → `process.js:559-566`; second `@meta` impl `seo.js:3-17` → `process.js:585` | work, but lose to `useHead` and duplicate its job | **MAY** — layouts/partials only |
| `app.head.meta/link/script` | `document-shell.js:11-51` (shell) and `:67-99` (`injectConfigHeadTags`, deduped) | works on both page shapes | **MUST** for anything shared |

Reproduce any row from the repo root:

```bash
bun -e '
const { processDirectives, resetHead } = await import("@stacksjs/stx")
const ui = (await import("./config/ui.ts")).default
for (const f of ["resources/views/pricing.stx", "resources/views/features/alerts.stx"]) {
  resetHead()
  const out = await processDirectives(await Bun.file(f).text(), {}, f, { ...ui, autoShell: true, seo: { enabled: true } }, new Set())
  console.log(f, "->", (out.match(/<title[^>]*>[^<]*<\/title>/gi) || []).join(" | "),
    "| desc:", /name="description"/.test(out), "| stxProject:", /stx Project/.test(out))
}'
# resources/views/pricing.stx        -> <title>Pricing - bughq</title>          | desc: false | stxProject: false
# resources/views/features/alerts.stx -> <title>Alerts and triage - bughq</title> | desc: true  | stxProject: true
```

That one command already fails two rules below: `/pricing` has no description at all, and `/features/alerts`'s only description is the `stx Project` placeholder.

---

### 4.1 MUST — a page never writes `<!DOCTYPE>`, `<html>`, `<head>` or `<title>`

**WHY.** `AppHeadConfig` is documented as "auto-generates the document shell. No .stx file needs to write `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>`" (`config-types.d.ts:235-236`). `hasDocumentShell` (`document-shell.js:64-66`) tests `/<!DOCTYPE\b/i || /<html[\s>]/i`; when it matches, `ensureDocumentShell` returns the HTML untouched (`document-shell.js:101-105`) and stx falls back to string-splicing the runtime head in via `injectIntoHead` (`process.js:618-638`). That splice appends a **second** `<title>` rather than replacing the first — verified:

```
<head><meta charset="utf-8"><title>HANDWRITTEN-TITLE</title><meta name="keywords" content="MARKER">
<title>RUNTIME-TITLE</title>          <-- injected by process.js:634-637
<style data-stx-cloak>…</style></head>
```

Two titles is not cosmetic. `serve.js:10189-10190` takes the **first** `<title>` match and ships it as `X-STX-Title`; `stx-router/dist/client.js:347` assigns that to `document.title` on every SPA navigation. A page with a stale hand-written title and a correct runtime title serves the stale one on arrival.

**WRONG** — `resources/views/features/alerts.stx:1-11` (identical in all 23 marketing pages):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Alerts and triage - bughq</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk…">
    <link rel="stylesheet" href="/marketing.css">
  </head>
  <body>
    @include('SiteNav')
```

**RIGHT** — the file starts with a server script and a `<main>`; the shell is `config/ui.ts`'s job:

```html
<script server>
useSeoMeta({
  title: 'Alerts and triage - bughq',
  description: 'Get alerted when an issue is new or spiking, and stay quiet for the known and handled. Tune the threshold, not the noise.',
  ogImage: 'https://bughq.org/og.png',
})
useHead({ link: [{ rel: 'canonical', href: 'https://bughq.org/features/alerts' }] })
</script>

@include('SiteNav')
<main>
  …
```

**CHECK.**

```bash
grep -rln '<!DOCTYPE\|</head>' resources/views --include='*.stx'   # must print nothing; today prints 24
```

`resources/views/layouts/marketing.stx:1-15` is one of the 24 and is dead code besides — `grep -rn '@extends(\|@layout(' resources/ --include='*.stx'` returns nothing, so nothing extends it. Delete it rather than migrate it.

### 4.2 MUST — exactly one title source per page: `useSeoMeta({ title })` in `<script server>`

**WHY.** Tiers 2–5 of 4.0 exist for templates stx cannot introspect. bughq pages all have a server script, so tier 1 always wins; any title written at tier 2/3 is dead text that will drift. `config/ui.ts:74-78` `app.head.title: 'bughq'` is the last-resort tier and MUST stay a single word — its job is to make a missing title read as "bughq", not to be a title.

**WRONG** — the same string typed in two files, with the sync burden written into a comment instead of removed (`site.config.ts:9-11`: *"So keep a `pages` title in step with the page's own useHead title"*). Ten exact duplicates:

| `site.config.ts` | page | string |
|---|---|---|
| `:30` | `resources/views/index.stx:36` | `bughq - Error tracking for people who ship` |
| `:34` | `resources/views/dashboard.stx:6` | `Issues - bughq` |
| `:38` | `resources/views/account.stx:2` | `Account - bughq` |
| `:42` | `resources/views/use-cases.stx:6` | `Use cases - bughq` |
| `:46` | `resources/views/features/capture.stx:6` | `Automatic error capture - bughq` |
| `:50` | `resources/views/features/grouping.stx:6` | `Fingerprint grouping - bughq` |
| `:54` | `resources/views/features/releases.stx:6` | `Releases and environments - bughq` |
| `:58` | `resources/views/features/stack-traces.stx:6` | `Readable stack traces - bughq` |
| `:62` | `resources/views/features/alerts.stx:6` | `Alerts and triage - bughq` |
| `:66` | `resources/views/features/self-host.stx:6` | `Self-hosting - bughq` |

**RIGHT.** The page owns the title; `site.config.ts` `pages` loses its `title` keys entirely (see 4.7). Do **not** reach for `titleTemplate: '%s - bughq'` to de-duplicate the suffix — it is inert (4.0.1); write the full string.

**CHECK.**

```bash
# more than one title source in a single view
for f in $(find resources/views -name '*.stx'); do
  n=$(grep -c "useHead({ *title\|useSeoMeta({\|<title>\|@title(\|@section('title')" "$f")
  [ "$n" -gt 1 ] && echo "$f has $n title sources"
done
# titles duplicated between site.config.ts and a view
grep -c "^      title:" site.config.ts    # must be 0; today 10
```

### 4.3 MUST — every public page declares a `description`; `useHead({ title })` alone is a bug

**WHY.** `useSeoMeta` derives `og:title` from `config.ogTitle ?? config.title` and `og:description` from `config.ogDescription ?? config.description` (`head.js:43`), and `twitter:title`/`twitter:description` from the same fallbacks (`head.js:58`). One call therefore makes `<title>`, `description`, `og:*` and `twitter:*` provably identical. A bare `useHead({ title })` writes exactly one tag and leaves the rest to whatever `site.config.ts` happens to say — which for `/pricing`, `/login`, `/register`, `/forgot-password` and `/reset-password` is nothing at all, because those five routes are absent from `site.config.ts:28-69`.

**WRONG** — all 11 `useHead` call sites in the repo pass a bare `{ title }`:

| file:line | call |
|---|---|
| `resources/views/pricing.stx:2` | `useHead({ title: 'Pricing - bughq' })` |
| `resources/views/login.stx:10` | `useHead({ title: 'Sign in - bughq' })` |
| `resources/views/register.stx:10` | `useHead({ title: 'Create your account - bughq' })` |
| `resources/views/forgot-password.stx:2` | `useHead({ title: 'Reset your password - bughq' })` |
| `resources/views/reset-password.stx:2` | `useHead({ title: 'Choose a new password - bughq' })` |
| `resources/views/dashboard.stx:6` | `useHead({ title: 'Issues - bughq' })` |
| `resources/views/settings.stx:8` | `useHead({ title: 'Settings - bughq' })` |
| `resources/views/account.stx:2` | `useHead({ title: 'Account - bughq' })` |
| `resources/views/projects/index.stx:5` | `useHead({ title: 'Your apps - bughq' })` |
| `resources/views/projects/new.stx:2` | `useHead({ title: 'New app - bughq' })` |
| `resources/views/issue/[id].stx:107` | `useHead({ title: issueHeadline ? … })` |

Seven marketing pages ship no `<meta name="description">` either — `resources/views/index.stx:33-49` and all six `resources/views/features/*.stx:3-11` have charset, viewport, title and four links and nothing else. Their copy exists only at `site.config.ts:31,:47,:51,:55,:59,:63,:67`.

**RIGHT** — `resources/views/pricing.stx:1-3`:

```html
<script server>
useSeoMeta({
  title: 'Pricing - bughq',
  description: 'Self-host bughq free forever, or start on the hosted plan. Per-project pricing with unlimited errors on every tier.',
  ogImage: 'https://bughq.org/og.png',
})
useHead({ link: [{ rel: 'canonical', href: 'https://bughq.org/pricing' }] })
</script>
```

**CHECK.**

```bash
grep -rn "useHead({ title:" resources/views --include='*.stx'   # must print nothing; today 11
# and per page, assert the rendered output carries a description that is not the placeholder
bun -e 'const {processDirectives,resetHead}=await import("@stacksjs/stx");const ui=(await import("./config/ui.ts")).default;
for (const f of (await Array.fromAsync(new Bun.Glob("resources/views/**/*.stx").scan()))) { resetHead();
  const o=await processDirectives(await Bun.file(f).text(),{},f,{...ui,autoShell:true,seo:{enabled:true}},new Set());
  const m=o.match(/<meta name="description" content="([^"]*)"/);
  if (!m || m[1].startsWith("A website built with stx")) console.log("NO DESCRIPTION:", f) }'
```

### 4.4 MUST — authenticated routes set `robots: 'noindex, nofollow'`, and never appear in `site.config.ts` `pages`

**WHY.** `useSeoMeta({ robots })` emits `<meta name="robots">` at `head.js:41-42`. Nothing else in the app can: `grep -rn robots resources/ config/ site.config.ts` returns exactly one hit, `config/docs.ts:175`, which is the docs site. Meanwhile `site-builder/seo.js:7` unconditionally pushes `<link rel="canonical">`, `og:url`, `og:title`, `og:description`, `og:site_name` and the twitter card for whatever path is requested, and `site.config.ts:33-40` hands it real titles and descriptions for `/dashboard` and `/account`. bughq is actively advertising auth-walled URLs as indexable, with no `robots.txt` to contradict it — `ls public/` shows `assets audio favicon.svg images marketing.css og.png README.md svgs videos`, and `dist/robots.txt` does not exist. The generator is real (`site-builder/robots.js:1-26`, reading `site.robots` and emitting a `Sitemap:` line from `site.url`) but is only ever invoked from `site-builder/build.js:94-96`, a path bughq does not run.

**WRONG** — `resources/views/dashboard.stx:6`, `settings.stx:8`, `account.stx:2`, `projects/index.stx:5`, `projects/new.stx:2`, `issue/[id].stx:107` set a title and nothing else, while `site.config.ts:33-40` gives two of those routes SEO metadata.

**RIGHT** — every view under an auth wall:

```html
<script server>
useSeoMeta({ title: 'Issues - bughq', robots: 'noindex, nofollow' })
</script>
```

plus delete `site.config.ts:33-40`, and ship `public/robots.txt`:

```
User-agent: *
Disallow: /dashboard
Disallow: /settings
Disallow: /account
Disallow: /projects
Disallow: /issue

Sitemap: https://bughq.org/sitemap.xml
```

**CHECK.**

```bash
for f in resources/views/dashboard.stx resources/views/settings.stx resources/views/account.stx \
         resources/views/projects/index.stx resources/views/projects/new.stx 'resources/views/issue/[id].stx'; do
  grep -q "robots:" "$f" || echo "INDEXABLE AUTH ROUTE: $f"
done
test -f public/robots.txt || echo "MISSING public/robots.txt"
grep -n "'/dashboard'\|'/account'" site.config.ts   # must print nothing
```

`dist/sitemap.xml:3-8` is separately broken — it emits `http://localhost/...` instead of `site.config.ts:16`'s `https://bughq.org`, and lists `/layouts/default` and `/components/FeatureCard` as pages. Do not ship it. Manual review: a sitemap must list only routed pages.

### 4.5 MUST — canonical goes through `useHead({ link })`, never `useSeoMeta({ canonical })`

**WHY.** `useSeoMeta` pushes canonical onto `link` (`head.js:82-84`) and forwards it to `useHead` (`head.js:85-90`) — but the server-script bridge that actually reaches the shell copies only `title` and `meta`:

```js
// node_modules/@stacksjs/stx/dist/variable-extractor.js:324-331
}, useSeoMeta = (meta) => {
  headUseSeoMeta(meta);
  const head = headGetHead();
  context.__stx_runtime_head = { ...context.__stx_runtime_head || {}, ...head.title && { title: head.title }, meta: head.meta ? [...head.meta] : [] };
}
```

`process.js:216` then reads `link: [...baseHeadConfig.link || [], ...runtimeHead.link || []]` and finds nothing. Verified: a page calling `useSeoMeta({ canonical: 'https://bughq.org/pricing' })` renders `description`, `og:*` and `twitter:*` but **no** `<link rel="canonical">`. The `useHead` bridge (`variable-extractor.js:312-323`) does merge `link`, and order does not matter because `useSeoMeta` spreads the existing context object.

**WRONG.**

```js
useSeoMeta({ title: 'Pricing - bughq', description: '…', canonical: 'https://bughq.org/pricing' })
```

**RIGHT.**

```js
useSeoMeta({ title: 'Pricing - bughq', description: '…', ogUrl: 'https://bughq.org/pricing' })
useHead({ link: [{ rel: 'canonical', href: 'https://bughq.org/pricing' }] })
```

**CHECK.**

```bash
grep -rn "canonical:" resources/ --include='*.stx'   # must print nothing — the key is silently dropped
grep -rn "rel: 'canonical'" resources/views --include='*.stx' | wc -l   # should equal the number of public pages
```

### 4.6 MUST NOT — `definePageMeta`, `usePageTitle`/`useTitle`, `titleTemplate`, `@seo(…)`, `@structuredData … @endstructuredData`

**WHY.** Each is documented in `head.d.ts`/`seo.js` and each fails silently in a `<script server>` block on 0.2.113. Verified renders, all with `app.head.title: 'bughq'` as the fallback:

| Input | Rendered `<title>` | Cause |
|---|---|---|
| `definePageMeta({ title: 'X', description: 'Y' })` | `bughq` | `variable-extractor.js:300` binds it to `(_meta) => {}` |
| `usePageTitle('X')` | `bughq` | not in the injected parameter list, `variable-extractor.js:466` |
| `useSeoMeta({ title: 'Pricing', titleTemplate: '%s - bughq' })` | `Pricing` | `titleTemplate` never copied into `context.__stx_runtime_head` |
| `@structuredData\n{"@type":"…"}\n@endstructuredData` | `bughq`, and the literal directive text renders into `<body>` | `registerSeoDirectives()` (`seo.js:340-345`) is never called |
| `@seo({ title: 'Alerts…', canonical: '…' })` | `bughq` — plus a stray `<title>Alerts…</title>` **inside `<body>`** | `seo.js:139-232` returns tags as inline HTML at the call site |

**RIGHT.** Everything on that list has a working equivalent: `useSeoMeta` for the first three and `@seo`; `@structuredData({ … })` (expression form) for the fifth.

**CHECK.**

```bash
grep -rn "definePageMeta\|usePageTitle\|useTitle(\|titleTemplate\|@seo(\|@endstructuredData" resources/ config/ site.config.ts
# must print nothing; today 0 — keep it that way
```

### 4.7 MUST — `site.config.ts` `pages` holds only what the page cannot know

**WHY.** `injectSeo` (`site-builder/seo.js:1-45`) is an exact-key lookup — `serve.js:9794` does `(siteConfig.pages ?? {})[normalizedPath] ?? {}`, no wildcards, no params. `seo.js:2` then resolves `title = page.title ?? seo.title ?? site.name` and `description = page.description ?? seo.description`, and `declared()` (`seo.js:21-30`) suppresses only tags the head already has — `<title>`, `canonical`, and any `<meta>` with a matching `name`/`property`. So a page's own `<title>` and `description` survive while `og:title`/`og:description`/`twitter:title`/`twitter:description` are minted fresh from the **generic** site blurb.

**WRONG.** `site.config.ts:28-69` declares 10 keys. Sixteen routed marketing pages are missing: `/docs`, `/pricing`, `/compare`, the eight `/compare/*` pages, and the five `/use-cases/*` pages. `/pricing` and `/docs` are top-nav routes (`resources/partials/SiteNav.stx:39-40`, `:67-68`). Net effect on `/compare/sentry`: the page renders `<title>bughq vs Sentry - bughq</title>` (`resources/views/compare/sentry.stx:6`) and a precise description (`:7`) and then shares as *"bughq - Error tracking for people who ship"* from `site.config.ts:20`. The divergence exists even where the key is present — `site.config.ts:43`'s `/use-cases` description is a different sentence from `resources/views/use-cases.stx:7`, so that one URL serves one string in `<meta name="description">` and another in `og:description`.

**RIGHT.** Once 4.1–4.3 land, the page owns title/description/og/twitter and `pages` shrinks to per-route facts the page cannot compute:

```ts
pages: {
  '/': { image: 'https://bughq.org/og-home.png' },
  '/compare/sentry': { image: 'https://bughq.org/og-compare-sentry.png' },
},
```

**CHECK.**

```bash
# every routed view must either be in `pages` or (better) own its own og tags
comm -23 <(find resources/views -name '*.stx' ! -path '*/layouts/*' ! -path '*/components/*' \
            | sed 's|resources/views||;s|\.stx$||;s|/index$|/|' | sort) \
         <(grep -o "^    '/[^']*'" site.config.ts | tr -d " '" | sort)
grep -c "^      title:\|^      description:" site.config.ts   # target 0
```

### 4.8 MUST — `config/ui.ts` sets `skipDefaultSeoTags: true` and owns every shared head tag

**WHY (placeholder tags).** `injectSeoTags` (`seo.js:243-308`) runs from `process.js:616-617` and early-returns only if `options.seo.enabled === false`, `options.skipDefaultSeoTags === true`, the `<!-- stx SEO Tags -->` marker is present, the runtime head already has a title/og:title/description, or the HTML already has `og:title`/`twitter:title`. bughq's marketing pages satisfy none, so `seo.js:261-273` falls through to `options.defaultTitle || 'stx Project'` and `options.defaultDescription || 'A website built with stx templating engine'`. `config/ui.ts:8-79` sets none of `seo`, `skipDefaultSeoTags`, `defaultTitle`, `defaultDescription`, `defaultImage` — all five are forwarded from project config at `serve.js:9701-9705`. The result is in the build output:

```
$ grep -o "<title>[^<]*</title>" dist/features/alerts.html
<title>stx Project</title>
$ grep -rl 'stx Project' dist --include='*.html' | wc -l
24
```

`site-builder/seo.js:20` scrubs six of those literals by exact string match on the served path but leaves `og:type` and `twitter:card` behind — a band-aid over a config that should never have produced them.

**WHY (shared tags).** `AppHeadConfig` (`config-types.d.ts:237-246`) takes `meta`, `link`, `script`, `headRaw`, `bodyClass`, `bodyAttrs`, not just `title`. `generateDocumentShell` renders them for fragment pages (`document-shell.js:22-36`) and `injectConfigHeadTags` splices them into a page that already owns a head (`document-shell.js:67-99`), skipping any `<meta>` whose `name`/`property`/`charset` is already present (`:72-77`) and any `<link>` whose exact `href` is already present (`:78-82`). The dedup makes centralising safe **before** deleting the per-page copies. Today `config/ui.ts:74-78` is `app: { head: { title: 'bughq' } }` and the same tags are re-typed: `meta charset` in 24 files, `name="viewport"` in 24, the Google Fonts preconnect+stylesheet in 34, `/marketing.css` in 23. The 11 fragment pages emit those `<link>`s *inside the swapped body* — `resources/views/dashboard.stx:294-296`, `resources/views/pricing.stx:38-40`.

**RIGHT** — `config/ui.ts`:

```ts
export default {
  componentsDir: 'resources/components',
  layoutsDir: 'resources/layouts',
  partialsDir: 'resources/partials',
  router: { container: 'main', interceptAllLinks: true },

  // The page and site.config own every SEO tag. Without this, seo.js:261-273
  // injects <title>stx Project</title> into any page that forgets one.
  skipDefaultSeoTags: true,

  app: {
    head: {
      title: 'bughq', // last resort only — see the precedence chain
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' },
        { rel: 'stylesheet', href: '/marketing.css' },
      ],
    },
  },
} satisfies UiOptions
```

`resources/views/login.stx:56` and `resources/views/dashboard.stx:296` request different font weight sets — unify on the superset (the line above) before deleting the inline copies.

**CHECK.**

```bash
grep -n "skipDefaultSeoTags" config/ui.ts                       # must match; today 0
grep -rl 'stx Project' dist --include='*.html' | wc -l          # must be 0; today 24
grep -rc 'rel="preconnect" href="https://fonts.googleapis.com"' resources/views --include='*.stx' | grep -v ':0'   # must be empty; today 34 files
grep -rn 'charset=\|name="viewport"\|href="/marketing.css"' resources/views --include='*.stx'                       # must be empty
```

### 4.9 MUST — JSON-LD uses `@structuredData({ … })`, driven by the same array that renders the markup

**WHY.** `processStructuredData` (`seo.js:61-97`) does a balanced-paren scan, evaluates the object against the template context via `safeEvaluateObject`, injects `"@context": "https://schema.org"` if absent (`seo.js:85-86`) and emits `<script type="application/ld+json">` with `</` escaped (`seo.js:87`). It is wired at `process.js:586`. Because it evaluates against context, a `<script server>` array drives both the JSON-LD and the visible markup — one source, no drift. Never hand-write `<script type="application/ld+json">`.

**WRONG.** `grep -rn 'ld+json\|structuredData\|schema.org' resources/ config/ public/ site.config.ts` returns **0**, while 22 pages hand-write a breadcrumb trail as bare anchors with no `BreadcrumbList` — `resources/views/features/alerts.stx:16-20`, `resources/views/compare/sentry.stx:23-27`, `resources/views/docs.stx:17-20`, `resources/views/use-cases.stx:17-20`, and 18 siblings:

```html
<nav class="subnav shell" aria-label="Breadcrumb">
  <a href="/">Home</a><span class="sep">/</span>
  <a href="/#features">Features</a><span class="sep">/</span>
  <span>Alerts and triage</span>
</nav>
```

`resources/views/pricing.stx:8-25` carries plan/interval state in signals with no `Product`/`Offer`; `resources/views/index.stx` has no `SoftwareApplication` or `Organization`.

**RIGHT** — one array, two consumers (verified render below):

```html
<script server>
import type { Crumb } from '../../types/seo'

useSeoMeta({ title: 'Alerts and triage - bughq', description: '…' })

const crumbs: Crumb[] = [
  { name: 'Home', href: '/', url: 'https://bughq.org/' },
  { name: 'Features', href: '/#features', url: 'https://bughq.org/#features' },
  { name: 'Alerts and triage' },
]
</script>

@structuredData({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
})

<main>
  <nav class="subnav shell" aria-label="Breadcrumb">
    @foreach (crumbs as c)
      @if (c.href)<StxLink to="{{ c.href }}">{{ c.name }}</StxLink><span class="sep">/</span>
      @else<span>{{ c.name }}</span>@endif
    @endforeach
  </nav>
```

renders

```html
<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://bughq.org/"},…],"@context":"https://schema.org"}</script>
```

**CHECK.**

```bash
# every breadcrumb nav must be accompanied by a BreadcrumbList
diff <(grep -rl 'aria-label="Breadcrumb"' resources/views --include='*.stx' | sort) \
     <(grep -rl '@structuredData(' resources/views --include='*.stx' | sort)
# today: 22 vs 0
grep -rn '<script type="application/ld+json"' resources/ --include='*.stx'   # must be empty — use the directive
```

Manual review for coverage beyond breadcrumbs: `/` needs `SoftwareApplication`, `/pricing` needs `Product` + `Offer`, `/docs` needs `TechArticle`. No grep can decide that; a reviewer must.

### 4.10 MUST — dynamic titles and descriptions are computed in `<script server>`, before `useSeoMeta`

**WHY.** `context.__stx_runtime_head` is written during server-script extraction (`process.js:514` → `variable-extractor.js:312-331`), which runs before the shell is assembled at `process.js:205`. Any value in scope at that point can feed the title. There is a second constraint specific to bughq's SPA: `serve.js:10189-10190` extracts the raw `<title>` text into the `X-STX-Title` header and `stx-router/dist/client.js:347` assigns it straight to `document.title`, where HTML entities do **not** decode. Escape-then-assign shows `&lt;` on SPA arrival and a bare bracket on reload.

**RIGHT** — `resources/views/issue/[id].stx:100-107` already gets this right and is the pattern to copy; extend it to the description:

```js
// Dropping beats entity-escaping here: the SPA path hands raw title text to the
// X-STX-Title header and the router assigns it to document.title, where entities
// do NOT decode.
const issueHeadline = String((latest && latest.message) || issue?.title || '').replace(/[<>]/g, '').trim()
const short = issueHeadline.length > 60 ? `${issueHeadline.slice(0, 60)}…` : issueHeadline

useSeoMeta({
  title: issueHeadline ? `${short} - bughq` : 'Issue - bughq',
  description: `${issue.eventCount} events across ${issue.userCount} users, first seen in ${issue.firstRelease}.`,
  robots: 'noindex, nofollow',
})
```

**CHECK.**

```bash
# a title built from template data must not be interpolated into markup instead
grep -rn '<title>{{\|<title>@' resources/views --include='*.stx'    # must be empty
# and no entity escaping in a title expression
grep -rn "useSeoMeta\|useHead" -A3 resources/views --include='*.stx' | grep '&amp;\|&lt;\|escapeHtml'
```

### 4.11 SHOULD — every public page names an `ogImage`; og/twitter are never re-typed

**WHY.** `head.js:43` and `:58` derive `og:title`/`og:description`/`twitter:title`/`twitter:description` from `title`/`description`, and `twitterImage = config.twitterImage ?? config.ogImage` (`head.js:58`). Typing `ogTitle` or `twitterDescription` by hand is how the four tags drift apart. Only `ogImage` has no derivation and must be stated; `site.config.ts:22` already points at `https://bughq.org/og.png` and `public/og.png` exists, so per-page images are the only reason to override.

**WRONG.** No page in `resources/` passes `ogImage`, `ogTitle`, `twitterCard` or any og/twitter key — the entire og surface comes from `site-builder/seo.js:7`, which cannot see the page.

**RIGHT.**

```js
useSeoMeta({
  title: 'bughq vs Sentry - bughq',
  description: 'How bughq, an open-source error tracker you self-host on Postgres, compares to Sentry, the incumbent error platform.',
  ogImage: 'https://bughq.org/og-compare-sentry.png',
  twitterCard: 'summary_large_image',
})
```

**CHECK.**

```bash
grep -rn "ogTitle:\|ogDescription:\|twitterTitle:\|twitterDescription:" resources/ --include='*.stx'   # must be empty — derived, not typed
grep -rLn "ogImage:" $(grep -rl "useSeoMeta(" resources/views --include='*.stx')                        # lists pages with no share image
```

### 4.12 MUST — SEO shapes live in `types/`, not inline in a `.stx` file

**WHY.** `types/` already exists (`types/stacks-app.d.ts`, `types/ts-cloud-augment.d.ts`) and is where TypeScript surface belongs. stx ships the source types to extend: `SeoMeta` (`head.d.ts:188-214`), `HeadConfig` (`head.d.ts:177-187`), `MetaTag`/`LinkTag`/`ScriptTag` (`head.d.ts:153-176`). A page-local `const crumbs = [...]` with no annotation gives the agent editing it nothing to check against.

**RIGHT** — `types/seo.ts`:

```ts
import type { SeoMeta } from '@stacksjs/stx'

/** A single breadcrumb hop. `href`/`url` are omitted on the current page. */
export interface Crumb {
  name: string
  href?: string
  url?: string
}

/** Every public bughq page must supply at least these. */
export type PageSeo = Required<Pick<SeoMeta, 'title' | 'description'>> & Pick<SeoMeta, 'ogImage' | 'robots'>

/** Auth-walled routes. */
export const NOINDEX: Pick<SeoMeta, 'robots'> = { robots: 'noindex, nofollow' }
```

used as:

```html
<script server>
import type { PageSeo } from '../../types/seo'

const seo: PageSeo = {
  title: 'Alerts and triage - bughq',
  description: 'Get alerted when an issue is new or spiking, and stay quiet for the known and handled.',
  ogImage: 'https://bughq.org/og.png',
}
useSeoMeta(seo)
</script>
```

`useSeoMeta`, `useHead` and `state` are injected into the server-script scope by name (`variable-extractor.js:466-470`) — **never** `import { useSeoMeta } from '@stacksjs/stx'` in a `.stx` file. Only `import type` is legitimate.

**CHECK.**

```bash
grep -rn "^import .*useSeoMeta\|^import .*useHead\|from '@stacksjs/stx'" resources/ --include='*.stx' | grep -v 'import type'
# must be empty — these are globals
ls types/seo.ts   # must exist once any page annotates its SEO object
```

---

### 4.13 Migration order (do not reorder — each step unblocks the next)

| Step | Change | Unblocks |
|---|---|---|
| 1 | `config/ui.ts`: add `skipDefaultSeoTags: true`, `app.head.meta`, `app.head.link` | Kills the 24 `stx Project` pages immediately; `document-shell.js:72-82` dedup means no page edits required yet |
| 2 | Delete the shared `<meta charset>`, viewport, font and `/marketing.css` lines from all 34 views | 4.8 |
| 3 | Strip `<!DOCTYPE>`/`<html>`/`<head>`/`<title>` from the 23 marketing pages; delete `resources/views/layouts/marketing.stx` | 4.1 — and only now does the runtime head reach these pages cleanly |
| 4 | Replace all 11 `useHead({ title })` and 23 hand-written titles with `useSeoMeta({ title, description, ogImage })` + `useHead({ link: [canonical] })` | 4.2, 4.3, 4.5, 4.11 |
| 5 | Add `robots: 'noindex, nofollow'` to the 6 auth views; delete `site.config.ts:33-40`; ship `public/robots.txt` | 4.4 |
| 6 | Reduce `site.config.ts` `pages` to per-route `image` only | 4.7 |
| 7 | Add `types/seo.ts`; add `@structuredData({ '@type': 'BreadcrumbList', … })` beside all 22 breadcrumb navs | 4.9, 4.12 |

## 5. Server blocks and the server-to-client bridge

A `.stx` file has exactly one server-side execution surface: `<script server>`. It runs on every render, its top-level declarations become the template context, and it is deleted from the response before the browser sees a byte. Everything the browser needs from it crosses one officially-supported boundary — the server-data bridge. bughq currently hand-rolls that boundary in base64, interpolates raw values into script bodies in 11 places, and is inlining the caller's session JWT into four pages as a side effect. This chapter is the fix.

### The injected surface of `<script server>`

The block is transpiled with `Bun.Transpiler({ loader: 'ts' })` (`node_modules/@stacksjs/stx/dist/variable-extractor.js:218`), rewritten to CommonJS (`variable-extractor.js:495`), then invoked as an async IIFE built by `Function(...)` at `variable-extractor.js:466-470`. These names are in scope with no import:

| Group | Names | Source |
| --- | --- | --- |
| Module | `module`, `exports`, `require` | `variable-extractor.js:466` |
| Props (components) | `props`, `$props`, `defineProps`, `withDefaults`, `defineSlots`, `defineEmits`, `defineExpose` | `variable-extractor.js:466`; each prop key is also a bare local (`:449-457`) |
| Head | `useHead`, `useSeoMeta`, `definePageMeta` | real implementations, `variable-extractor.js:315-330` |
| Routing | `params`, `useRoute` | `variable-extractor.js:300-310`; `useRouter` is a **stub** (`:311`) |
| Reactivity | `state`, `derived`, `effect`, `batch`, `ref`, `reactive`, `computed`, `watch`, `onMount`, `onDestroy`, `onMounted`, `onUnmounted`, `nextTick`, `provide`, `inject`, `useColorMode`, `useDark` | **all inert stubs**, `variable-extractor.js:283-331` |
| Browser mocks | `window`, `document`, `fetch`, `confirm`, `alert` | `variable-extractor.js:331-397`; `console` is the real console (`:397`) |
| Request context | `cookies`, `host`, `ip`, `locale`, `t`, `params`, `__stxServeSearch`, `__stxServeContext` | written onto the render context by `node_modules/bun-plugin-stx/dist/serve.js:9151-9176` |

Every context key that looks like an identifier is passed in as a scope variable (`variable-extractor.js:399`, `:460-466`), which is why `cookies` and `params` are plain locals.

---

### 5.1 MUST — write the server block as the literal tag `<script server>`, once, at the top of the file

**WHY.** `extractServerScriptVariables` (`process.js:483-499`) runs any script whose attribute string matches `/\bserver\b/` (`process.js:488`). The removal pass that deletes it from the response is stricter — `/<script\s+server\b[^>]*>/gi` at `process.js:673` — so `server` must be the *first* attribute token or the block executes on the server **and** ships to the browser. The removal itself is string- and comment-aware (`findScriptBodyEnd`, `process.js:55-...`, called at `:677`); the extraction is not (see 5.9).

**WRONG** (hypothetical, and the reason the rule exists — `\bserver\b` matches inside a filename):

```html
<script src="/js/server-status.js"></script>
```

`process.js:488` accepts it as a server block; `process.js:673` refuses to remove it.

**RIGHT** — `resources/views/projects/index.stx:1`:

```html
<script server>
```

**CHECK.** Must return nothing:

```bash
grep -rn "<script[^>]*server[^>]*>" resources/ | grep -v "<script server>"
```

Currently clean (0 hits).

---

### 5.2 MUST — expose data to the template by declaring it at top level; nothing else works

**WHY.** `convertToCommonJS` appends `module.exports.<name> = <name>` for every top-level `const`/`let`/`var` (`variable-extractor.js:586-600`), `function` (`:591-605`), `class` (`:618`) and rewritten import binding (`:566`, `:573`). The result object is merged into the template context at `variable-extractor.js:476`. A binding nested inside `if`/`try`/a function body never reaches the template — `extractDeclaredVariableNames` only walks brace-depth 0 (`variable-extractor.js:41-58`).

**WRONG** — a value assigned only inside a block is invisible to the template unless it was also declared at top level.

**RIGHT** — `resources/views/settings.stx:33-36` declares at top level and mutates inside the `if`:

```js
let activeProject = null
let members = []
if (user) {
  activeProject = projects.find(p => p.id === requestedProject) || projects[0]
}
```

**CHECK.** Manual review, plus: if `{{ someName }}` renders literally as `{{ someName }}` in the response, the binding never left the server block. `addCloakToUnresolvedExpressions` (`process.js:604`) marks these — grep the served HTML for `data-stx-cloak`.

---

### 5.3 MUST — use `import` statements, one per line, at the top of the block

**WHY.** `convertToCommonJS` rewrites `import { db } from '@stacksjs/database'` into exactly `const { db } = await import('@stacksjs/database')` **plus** `module.exports.db = db` (`variable-extractor.js:567-574`). Hand-writing the `await import()` form buys nothing and loses the export line. The rewrite is line-based and regex-driven (`variable-extractor.js:558`): a multi-line import matches none of the three patterns, falls through to `variable-extractor.js:579` and is emitted verbatim into a `Function` body — a `SyntaxError` that kills the whole block and silently degrades to regex-based static extraction (`variable-extractor.js:480-492`).

Verified against the shipped `extractVariables`:

| Block | Context keys produced |
| --- | --- |
| `import type { Issue } from '../types/issue'` + `import { db } from '@stacksjs/database'` + `const rows: Issue[] = []` + `const n: number = 1` | `db`, `rows`, `n` |
| `import {\n  db,\n} from '@stacksjs/database'` + `const n = 1` | `n` only — block did not execute |

**WRONG** — `resources/views/settings.stx:10-11`, `resources/views/issue/[id].stx:12`, and 10 more (22 `await import(` calls across `resources/`, 0 static imports):

```js
const { db } = await import('@stacksjs/database')
const { appUrl, ingestUrl } = await import('../../app/Support/urls')
```

**RIGHT:**

```js
import { db } from '@stacksjs/database'
import { appUrl, ingestUrl } from '../../app/Support/urls'
```

Both still satisfy 5.5's ordering requirement: the rewrite makes `await import(...)` the first statement in the compiled block.

**CHECK.**

```bash
grep -rn "await import(" resources/          # target: 0
grep -rnE "^\s*import\s+\{[^}]*$" resources/ # multi-line imports: must be 0
```

---

### 5.4 MUST NOT — call reactive APIs inside `<script server>`

**WHY.** `state`, `derived`, `effect`, `ref`, `computed`, `watch`, `onMount`, `onDestroy`, `useRouter` are no-op stubs in the server scope (`variable-extractor.js:283-331`). `state()` returns a getter whose `.set` and `.update` are empty functions (`variable-extractor.js:284-286`); `effect()` is `(_fn) => {}` (`:300`). Confirmed by running the shipped `extractVariables`: after `const count = state(5); count.set(99)` the value is still `5`, and an `effect()` that assigns a variable leaves it untouched. Worse, a `state()` binding is a **function**, and `extractBridgeData` drops functions (`client-script.js:371-372`) — so server-side "state" cannot even reach the client.

**RIGHT.** Compute plain values in `<script server>`; create signals in the client script and seed them from the bridge (5.6).

**CHECK.**

```bash
python3 - <<'EOF'
import re,glob
S=re.compile(r'<script\s+server\b[^>]*>([\s\S]*?)</script>',re.I)
A=re.compile(r'\b(state|derived|effect|onMount|onDestroy|useRouter|watch|computed|ref)\s*\(')
for f in glob.glob('resources/**/*.stx',recursive=True):
    m=S.search(open(f).read())
    if m and A.search(m.group(1)): print(f, sorted({x.group(1) for x in A.finditer(m.group(1))}))
EOF
```

Currently clean (0 hits). Keep it that way.

---

### 5.5 MUST — read request state from the injected context locals, not `requestContext` or `globalThis`

**WHY.** `injectServeRequestContext` writes `cookies`, `host`, `ip`, `__stxServeSearch` and `__stxServeContext` onto **this render's** context object (`serve.js:9156-9175`), immediately before `extractVariables` runs (`serve.js:9502 → 9505` for static routes, `9684 → 9686` for dynamic). `cookies` is a decoded `Record<string,string>` (`serve.js:9105-9123`). For a `[param]` route, `processTemplateDynamic` additionally sets `context.params` and each bare param name (`serve.js:9667-9678`).

`requestContext` is **not part of stx** — a full-tree grep of `node_modules/@stacksjs/stx` returns zero hits. It is a global installed by whichever server boots, and the two implementations differ:

| | dev (`node_modules/@stacksjs/actions/dist/dev/views.js`) | production (`node_modules/@stacksjs/buddy/dist/production-server.js`) |
| --- | --- | --- |
| lookup | `requestStore.getStore() ?? globalThis.__stxServeContext` (`:7`) | `globalThis.__stxServeContext`, then `globalThis.__stxServeCookies` (`:8-11`) |
| store | `AsyncLocalStorage`, entered with `requestStore.enterWith(ctx)` (`:110`) after the globals are set (`:108-109`) | none |

That AsyncLocalStorage-first-then-mutable-global lookup is what forces bughq's ordering workaround, documented verbatim at `resources/views/issue/[id].stx:5-9`: *"the request context rides an AsyncLocalStorage that only resolves correctly AFTER the first top-level `await` — read synchronously at the very top it comes back empty."* The context locals have no ordering requirement and no cross-request global to race on.

**WRONG** — `resources/views/issue/[id].stx:17-39` reconstructs the route param by parsing the URL, because the comment at `:8-9` believes `id` is not injected:

```js
let issueId = ''
try {
  const u = (typeof requestContext !== 'undefined' && requestContext.url && requestContext.url()) || ''
  if (u) {
    const seg = new URL(u).pathname.split('/').filter(Boolean)
    const i = seg.indexOf('issue')
    if (i !== -1 && seg[i + 1]) issueId = decodeURIComponent(seg[i + 1])
  }
} catch { issueId = '' }
```

and `resources/views/settings.stx:18-22`:

```js
const query = new URLSearchParams((typeof globalThis !== 'undefined' && globalThis.__stxServeSearch) || '')
const cookieProject = (typeof requestContext !== 'undefined' && requestContext.cookie && requestContext.cookie('bughq_project')) || ''
const token = (typeof requestContext !== 'undefined' && requestContext.cookie && requestContext.cookie('bughq_token')) || ''
```

**RIGHT** — `serve.js:9160`, `:9678`, `:9156`:

```js
const issueId = params.id ?? ''
const query = new URLSearchParams(__stxServeSearch || '')
const cookieProject = cookies.bughq_project ?? ''
const __token = cookies.bughq_token ?? ''   // __ prefix: see 5.8
```

**CHECK.**

```bash
grep -rn "requestContext\|globalThis.__stxServe" resources/   # target: 0 (currently 15)
```

If you must keep `requestContext` for a route the serve layer does not populate, the first statement in the block must be an `await`, and you must state why in a comment.

---

### 5.6 MUST — move server values to the client with the built-in bridge; never write your own encoder

**WHY.** stx ships the bridge. `extractBridgeData(context)` (`client-script.js:365-376`) collects every top-level, non-function, non-`__`/`$` context value; `generateServerDataBridge(code, serverData)` (`client-script.js:377-402`) emits `var <name> = <json>;` for each name the client script **references** (`:384`) but does **not redeclare** (`:386`), escaping `<` to `\u003c` on the way out (`:396`). It is wired into every client-script path: `process.js:609-610` and `:705` for pages, `client-script.js:731` inside `processClientScript`, `signal-processing.js:685` for signal setup blocks, `utils.js:638-642` for components (so component **props** bridge too). The contract is documented at `client-script.d.ts:44-55`. The emitted `var`s are function-scoped inside the IIFE / `window.stx.mount` wrapper (`client-script.js:747-771`) — they are not globals.

**WRONG** — `resources/views/settings.stx:144-157` (server) and `:181-189, :220-221` (client), 20 lines of hand-rolled base64 to reproduce the escaping the bridge already performs:

```js
// settings.stx:144-151
function b64(value) {
  return JSON.stringify(Buffer.from(JSON.stringify(value ?? ''), 'utf8').toString('base64'))
}
const guideInstallB64 = b64(guide.install || '')
const keyFullB64 = b64(keyFull)
const projectIdB64 = b64(projectId || '')
```
```js
// settings.stx:181-189
function fromB64(encoded) {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}
const installText = fromB64({!! guideInstallB64 !!})
const projectId = fromB64({!! projectIdB64 !!})
```

**RIGHT** — delete `b64`, `fromB64` and all seven `*B64` constants; reference the server names directly:

```js
// <script server>
const guide = activeProject ? installGuide(activeProject.platform, keyFull) : { label: '', install: '', code: '' }
const projectId = activeProject?.id || null

// <script client>
const installText = guide.install
const codeText = guide.code
const currentKey = state(keyFull)
const maskedKey = state(keyMask)
```

Verified against the shipped function — the bridge already produces safe output for the exact value the base64 layer was written to protect:

```
generateServerDataBridge('console.log(install)', { install: '<script src="…/sdk.js" data-key="abc"></script>' })
→   var install = "\u003cscript src=\"…/sdk.js\" data-key=\"abc\">\u003c/script>";
```

Do not redeclare a bridged name in the client script: `client-script.js:386` skips any name matched by `(?:const|let|var|function|class)\s+<name>\b`, which is why `settings.stx:189`'s `const projectId = …` silently suppresses the server's `projectId`.

**CHECK.**

```bash
grep -rn "btoa(\|atob(\|toString('base64')\|TextDecoder()" resources/   # target: 0 (currently 2 sites)
```

---

### 5.7 MUST NOT — interpolate a server value into a script body with `{{ … }}` or `{!! … !!}`

**WHY.** `interpolateScriptsInTemplate` (`expressions.js:326-339`) rewrites every non-`server`, non-`src`, non-`data-raw`, non-`application/json` script body before the bridge runs (`process.js:515`). Inside a script body:

| Form | Emits | Escapes `<`? | Source |
| --- | --- | --- | --- |
| `{!! x !!}` | `String(value)` — raw text, no quoting at all | no | `expressions.js:306` |
| `{{ x }}` | `JSON.stringify(value)` — a quoted JS literal | **no** | `expressions.js:319` |
| bridge | `JSON.stringify(value).replace(/</g,'\\u003c')` | yes | `client-script.js:396` |

Two independent failures follow. First, truncation — proven against the shipped interpolator with bughq's own values:

```
// issue/[id].stx:348 with a real stack trace
const stackText = "TypeError: x is not a function\n    at <script> (https://app/#</script>)"
```

The HTML parser ends the script element at that `</script>`; `copyStack` and everything after it cease to exist. Second, double-quoting — `{{ }}` emits a JSON literal, so wrapping it in quotes embeds the quotes:

```
interpolateScriptExpressions("const autofixIssueId = '{{ issueId }}'", { issueId: 'abc-123' })
→ const autofixIssueId = '"abc-123"'
```

**WRONG** — `resources/components/AutofixPanel.stx:11-12` (every autofix API call sends a double-quoted id), `resources/views/issue/[id].stx:800` (`var proj = '"proj_x"'`, so the `bughq_project` cookie never matches a real project id), and `resources/views/issue/[id].stx:111, :348`:

```js
// server
const stackJson = JSON.stringify(stack)
// client
const stackText = {!! stackJson !!}
```

**RIGHT** — delete `stackJson`; the bridge already ships `stack` to this page (it is referenced by the word `stack` in the comment at `issue/[id].stx:346`):

```js
// client
navigator.clipboard.writeText(stack)
```

For `AutofixPanel.stx`, props reach the component's client script through the bridge (`utils.js:638`, props merged into context at `variable-extractor.js:477-479`):

```js
const autofixIssueId = issueId
const autofixProjectId = projectId
```

**CHECK.**

```bash
python3 - <<'EOF'
import re,glob
C=re.compile(r'<script(?![^>]*\bserver\b)[^>]*>(.*?)</script>',re.S|re.I)
for f in glob.glob('resources/**/*.stx',recursive=True):
    s=open(f).read()
    for m in C.finditer(s):
        for mm in re.finditer(r'\{!!.*?!!\}|\{\{.*?\}\}', m.group(1)):
            print(f'{f}:{s[:m.start(1)+mm.start()].count(chr(10))+1}: {mm.group(0)[:60]}')
EOF
```

Target 0. Currently 11: `AutofixPanel.stx:11,12`; `settings.stx:187,188,189,220,221,352,478`; `issue/[id].stx:348,800`.

---

### 5.8 MUST NOT — declare a secret as a top-level binding in `<script server>`

**WHY.** The bridge is opt-out, not opt-in. `extractBridgeData` takes **every** top-level value (`client-script.js:365-374`), and `generateServerDataBridge` emits it if the client script contains the bare word — the test at `client-script.js:384` is `new RegExp('\\b'+name+'\\b').test(code)` run over the **raw source**, comments and string literals included. Only `__`/`$`-prefixed keys and functions are excluded (`client-script.js:368-372`).

bughq is leaking today. Running the shipped `extractBridgeData` + `generateServerDataBridge` over `resources/views/dashboard.stx` with a realistic context:

```
--- resources/views/dashboard.stx client script #0 ---
  // stx: server -> client data bridge (seeded from server scope)
  var token = "eyJhbGciOiJIUzI1NiJ9.REAL_SESSION_JWT.sig";
  var user = {"id":7,"email":"a@b.c","password":"$2b$hash"};
```

The triggers are not code. `token` is emitted because `dashboard.stx:44` declares it at top level and the client block contains the word; `user` is emitted because of the string `localStorage.removeItem('user')` at `dashboard.stx:231` and the comment at `:566`. `issue/[id].stx` bridges `stack` purely because of the word "stack" in the comment at `:346`.

Full current inventory, produced by the CHECK below:

| File | Bridged bindings |
| --- | --- |
| `resources/views/dashboard.stx` | `token`, `user`, `projects` |
| `resources/views/settings.stx` | `token`, `projects`, `channels`, `members`, and 7 `*B64` blobs |
| `resources/views/issue/[id].stx` | `token`, `issue`, `stack`, `stackJson` |
| `resources/views/projects/index.stx` | `token`, `user` |

**WRONG** — `resources/views/dashboard.stx:44-45` (identical at `settings.stx:22`, `projects/index.stx:9`, `issue/[id].stx:44`):

```js
const token = (typeof requestContext !== 'undefined' && requestContext.cookie && requestContext.cookie('bughq_token')) || ''
let user = null
```

**RIGHT** — prefix anything that must not cross the boundary, and project the model down to the fields the template actually renders:

```js
const __token = cookies.bughq_token ?? ''
let __user = null
if (__token) {
  const { Auth } = await import('@stacksjs/auth')
  __user = await Auth.getUserFromToken(__token)
}
// only what the page renders crosses to the client
const viewer = __user ? { id: Number(__user.id), email: String(__user.email) } : null
```

`__token` and `__user` are still usable in the template (`variable-extractor.js:399` accepts leading `_`) but are excluded from the bridge at `client-script.js:368`.

**CHECK** — save as `scripts/bridge-audit.ts` and run `bun run scripts/bridge-audit.ts`. It uses stx's own scanner and its own `skipAttrs` regex (`process.js:698`), so it reports exactly what the renderer will emit:

```ts
import { Glob } from 'bun'
import { generateServerDataBridge } from '@stacksjs/stx/client-script'
import { scanScriptTags } from '@stacksjs/stx/signal-processing'

const SKIP = /\bserver\b|\bsrc\s*=|\bdata-stx-scoped\b|\bdata-stx-router\b|\btype\s*=\s*["'](?!(?:text\/javascript|application\/javascript|module)["'])[^"']*["']/
const SRV = /<script\s+server\b[^>]*>([\s\S]*?)<\/script>/i
const DECL = /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm

let n = 0
for await (const file of new Glob('resources/**/*.stx').scan('.')) {
  const src = await Bun.file(file).text()
  const srv = SRV.exec(src)
  if (!srv) continue
  const fake = Object.fromEntries([...srv[1].matchAll(DECL)].map(m => [m[1], `<<${m[1]}>>`]))
  const seen = new Set<string>()
  for (const s of scanScriptTags(src, { skipAttrs: SKIP }))
    for (const line of generateServerDataBridge(s.body, fake).split('\n')) {
      const m = /^\s*var (\w+) =/.exec(line)
      if (m && !seen.has(m[1])) { seen.add(m[1]); console.log(`${file}: bridges ${m[1]}`); n++ }
    }
}
console.log(`${n} bridged bindings — every one is in the HTML`)
```

Reports 20 today. Every line is a value you are choosing to publish; if you did not choose it, rename the binding.

---

### 5.9 MUST NOT — write a literal `</script>` anywhere inside any script body, including comments

**WHY.** The removal pass is string-aware (`findScriptBodyEnd`, `process.js:55`, used at `:677`), but the two passes that *read* script bodies are not: server extraction uses the non-greedy `/<script\b([^>]*)>([\s\S]*?)<\/script>/gi` (`process.js:484`) and client scanning uses `html.toLowerCase().indexOf('</script>', bodyStart)` (`signal-processing.js:13`). Both stop at the first literal occurrence, wherever it sits.

Verified end-to-end through the real `processDirectives`. A server block whose third line contains `const snippet = '</script>'`:

```
[stx] demo.stx: <script> 0 opened, 1 closed — 1 stray </script>.
<p>before=ok after=function after(callback) { … }</p>
context keys: [ "before" ]
```

`after` never executed, and `{{ after }}` silently resolved to an unrelated global and rendered a function body into the page.

**WRONG** — `resources/views/settings.stx:130-143` is a 14-line comment that exists solely to describe this trap without triggering it, ending: *"The same trap applies to this comment, which is why it never spells the tag out — doing so truncates the server block instead."*

**RIGHT.** Never construct or quote the tag. Let the bridge escape it for you (5.6) — `client-script.js:396` turns it into `\u003c/script>`, which no parser will end an element on. If you must write it in a comment, split it: `'<' + '/script>'`.

**CHECK.** stx already detects it. `warnUnbalancedTags` (`template-tag-balance.js:73-92`) runs on every non-production render (`process.js:198-199`) and prints:

```
[stx] <file>.stx: <script> N opened, M closed — 1 stray </script>.
```

Treat that line as a build failure. Static pre-check:

```bash
grep -rn "</script>" resources/ --include=*.stx | grep -v "^\S*:[0-9]*:\s*</script>\s*$"
```

---

### 5.10 SHOULD — use `@json(expr)` when a value must land somewhere the bridge cannot reach

**WHY.** The bridge only injects `var` declarations at the top of a script body. For a value that has to appear inside an attribute, a `type="application/json"` block (which `expressions.js:332` deliberately skips), or mid-expression, `@json()` is the only escaping-correct option: `processJsonDirective` (`misc-directives.js:3-96`, invoked at `process.js:589`) emits `JSON.stringify(data)` with `<`, `>`, `&`, U+2028 and U+2029 all escaped (`misc-directives.js:87`) — strictly stronger than the bridge's single `<` replacement, and strictly stronger than `{{ }}`.

**RIGHT:**

```html
<script type="application/json" id="bughq-boot">@json(viewer)</script>
```

**CHECK.** Manual review. `@json` currently has zero uses in `resources/` (`grep -rn "@json(" resources/`); any new `type="application/json"` payload or data-attribute carrying structured data must use it rather than `{{ }}`.

---

### 5.11 MUST — debug a server block with `STX_DEBUG=1`

**WHY.** If the compiled block throws — a syntax error from a multi-line import (5.3), a rejected promise, anything — `variable-extractor.js:480` catches it and falls back to `fallbackVariableExtraction` (`:1062-1084`), a regex scraper that assigns whatever literals it can parse. The page renders, partially populated, with **no output at all** unless `process.env.STX_DEBUG` is set (`variable-extractor.js:481-484`). The outer handler at `process.js:493-497` only fires for failures outside `extractVariables`.

**RIGHT:**

```bash
STX_DEBUG=1 bun scripts/dev.ts
```

then look for:

```
[stx] server <script> did not execute in resources/views/settings.stx — falling back to static extraction. Cause: …
```

**CHECK.** Run the dev server with `STX_DEBUG=1` before declaring a server-block change done. Any `did not execute` line is a failure, not a warning.

## 6. State: signals, stores and composables

stx is a signals framework. There is no virtual DOM, no re-render pass, and no component instance — a `state()` is a function you call, an `effect()` re-runs when a signal it read changes, and directives are effects. Everything in this chapter follows from that.

bughq currently uses **one** of the framework's state primitives. It declares 53 `state()` calls and zero `derived()`, zero `effect()`, zero `batch()`, zero `onMount`/`onDestroy`, zero stores, and zero data-fetching composables — against 23 raw `fetch()` calls and 22 raw `document.cookie` writes.

```
$ grep -rEc '\b(state|derived|effect|batch)\(' resources --include='*.stx' | ...
state( 53   derived( 0   effect( 0   batch( 0
onMount|onDestroy 0   useQuery|useMutation|useFetch|useAsync 0
defineStore|useStore|getStore|createStore 0   fetch( 23   document.cookie 22
```

### Reactive core — the only four primitives

| API | Source | Returns | Reactive in templates |
|---|---|---|---|
| `state(v)` | `dist/signals.js:475` | callable signal; `.set` / `.update` / `.subscribe` / `.value` | yes |
| `derived(fn)` | `dist/signals.js:532` | cached callable; recomputes only when a dependency dirties it (`isDirty`, `:534`) | yes |
| `effect(fn)` | `dist/signals.js:583` | `dispose()`; return a function from `fn` for cleanup (`:597`) | n/a |
| `batch(fn)` | `dist/signals.js:661` | void; defers effects to one flush (`:672-674`) | n/a |

`onMount` / `onDestroy` are `dist/signals.js:703-704`. Vue-compatible aliases `ref` / `reactive` / `computed` / `watch` / `watchEffect` exist (`dist/signals.js:3519-3524`) — **do not use them in bughq**; they are aliases, not extra capability, and mixing vocabularies is the spaghetti requirement 12 forbids.

---

### 6.1 MUST — express computed values with `derived()`, not with plain functions

**WHY.** `derived` caches. `dist/signals.js:534` sets `isDirty = true` on creation and `:559-566` recomputes only while dirty, then clears the flag; `markDirty` (`:536`) is the only thing that re-arms it. A plain function has no cache: every directive that calls it re-runs the whole body on every effect flush, and nothing tells stx that two bindings share a dependency.

**WRONG** — `resources/components/AutofixPanel.stx:32-176`. Twenty functions, each re-deriving from `autofixState()` on every read. `stageReached` (`:166`) and `stageActive` (`:172`) each re-walk `autofixState()?.run?.status` per step, per flush:

```js
// AutofixPanel.stx:32-58
function currentAutofix() { return autofixState() || {} }
function currentRun() { return currentAutofix().run || null }
function hasAutofixRun() { return !!currentRun() }
function canRunAutofix() { return !!currentAutofix().can_run }
function currentRunStatus() { return currentRun()?.status || '' }
```

**RIGHT.**

```js
const autofix   = derived(() => autofixState() || {})
const run       = derived(() => autofix().run || null)
const hasRun    = derived(() => !!run())
const canRun    = derived(() => !!autofix().can_run)
const runStatus = derived(() => run()?.status || '')
```

`readyClass()` (`AutofixPanel.stx:109-113`) then reads `hasRun()` and pays for the chain once per `autofixState` change instead of once per binding.

**CHECK.**
```bash
# any .stx with >5 state() and zero derived() is presumed guilty
for f in $(grep -rl 'state(' resources --include='*.stx'); do
  s=$(grep -c '\bstate(' "$f"); d=$(grep -c '\bderived(' "$f")
  [ "$s" -gt 5 ] && [ "$d" -eq 0 ] && echo "$f: $s state, 0 derived"
done
```

---

### 6.2 SHOULD — wrap multi-signal writes in `batch()`

**WHY.** `signal.set` (`dist/signals.js:487`) runs every subscribed effect **synchronously** unless `isBatching` is set, in which case they queue into `pendingEffects` (`:499-501`) and `batch` flushes them once (`dist/signals.js:672-674`).

**WRONG** — `resources/components/AutofixPanel.stx:185-195`. Four writes, four flushes, four DOM passes over the same panel:

```js
autofixState.set(data)
if (!repositoryInput() && data.repository) repositoryInput.set(data.repository)
if (!branchInput() && data.repository_branch) branchInput.set(data.repository_branch)
autofixError.set('')
// ... finally { autofixLoading.set(false) }
```

**RIGHT.**

```js
batch(() => {
  autofixState.set(data)
  if (!repositoryInput() && data.repository) repositoryInput.set(data.repository)
  if (!branchInput() && data.repository_branch) branchInput.set(data.repository_branch)
  autofixError.set('')
  autofixLoading.set(false)
})
```

Note `$reset` and `$patch` on a store already batch for you (`dist/signals.js:4344`, `:4351`).

**CHECK.** Manual review, with this as the trigger list — any function body containing three or more `.set(` and no `batch(`:
```bash
grep -rn '\.set(' resources --include='*.stx' | awk -F: '{print $1}' | uniq -c | sort -rn
grep -rLn 'batch(' $(grep -rl '\.set(' resources --include='*.stx')
```

---

### 6.3 MUST — a fact used by more than one page lives in a store, not in a per-page signal

**WHY.** `window.stx._stores` is a `Map` the runtime comments verbatim as *"Global store registry — survives SPA navigation"* (`dist/signals.js:4246`). `cleanupContainer` (`dist/signals.js:5099`) resets `componentScope` and disposes per-element effects on every fragment swap but never touches `_stores` — so a store is the only client state in stx that outlives a navigation. `defineStore` is idempotent (`dist/signals.js:4254-4257`: returns the existing store for a known id), so re-running the bundle on a swap is a no-op.

**WRONG (a) — theme, four copies.** The identical `effectiveTheme` / `theme` / `toggleTheme` block appears at `resources/views/dashboard.stx:214-227`, `resources/views/settings.stx:164-177`, `resources/views/projects/index.stx:41-54`, and `resources/views/issue/[id].stx:331-344`:

```js
// dashboard.stx:214-227
function effectiveTheme() {
  return document.documentElement.getAttribute('data-theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}
const theme = state(effectiveTheme())
function toggleTheme() {
  const next = theme() === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try { localStorage.setItem('bughq_theme', next) } catch { /* Safari private mode */ }
  theme.set(next)
}
```

The comment above it at `login.stx:101-103` argues *"No signal or store either: the theme already lives in two places that outlive a swap."* That is wrong on the framework: it is not the storage that is duplicated, it is the **toggle, the media-query read and the persistence policy**, copied four times and absent from the other 20 pages.

**WRONG (b) — `/api/me`, two round trips, two `pro` signals.** `resources/views/account.stx:10` (`const pro = state(false)`) + `:40` and `resources/views/dashboard.stx:238` + `:278` fetch the same endpoint independently; navigating `/account` ⇄ `/dashboard` refetches every time.

**RIGHT.** `resources/stores/theme.ts`:

```ts
// Auto-imported globals only — see 6.4. `attribute` writes data-theme on <html>
// (signals.js:3448) and useColorMode already owns persistence (:3452), the
// prefers-color-scheme listener (:3470-3479) and the cross-tab storage listener
// (:3482-3489) — none of which the four copied blocks have.
defineStore('theme', () => {
  const cm = useColorMode({ storageKey: 'bughq_theme', attribute: 'data-theme' })
  const mode = state(cm.mode)                       // see 6.8: cm.mode is a getter
  cm.subscribe(resolved => mode.set(resolved))
  return { mode, isDark: derived(() => mode() === 'dark'), toggle: () => cm.toggle() }
})
```

`resources/stores/session.ts`:

```ts
defineStore('session', () => {
  const token = useCookie('bughq_token', { maxAge: 2592000 })   // 6.5
  const project = useCookie('bughq_project', { maxAge: 31536000 })
  const me = useQuery('/api/me', { cacheKey: 'me', staleTime: 30000 })  // 6.6
  return {
    token, project, me: me.data, loading: me.loading,
    pro: derived(() => me.data()?.pro === true),
    signOut() { batch(() => { token.set(''); me.data.set(null) }); navigate('/login') },
  }
})
```

And in every page: `const theme = useStore('theme')` — no per-page `effectiveTheme`, no second `pro`.

**Where the directory goes — this is a trap, verified by execution.** `loadStxConfig()` resolves bughq's `root` to `"resources"` (`dist/config.js:369`, because `resources/views` and `resources/layouts` both exist). `getStoreScript` then does `path.resolve(config.root, config.storesDir || "stores")` (`dist/store-loader.js:11`). Probing the real config:

```
root = "resources"         storesDir = undefined
resolved (as-is)                         = <repo>/resources/stores      ← correct, already
resolved if storesDir = "resources/stores" = <repo>/resources/resources/stores  ← broken
componentsDir                            = "resources/resources/components"  ← already broken this way
```

So: **create `resources/stores/` and add nothing to `config/ui.ts`.** Do not set `storesDir: 'resources/stores'` — it reproduces the exact double-prefix that already killed `componentsDir` (`config/ui.ts:10`). If you set the key at all, set `storesDir: 'stores'`.

**CHECK.**
```bash
test -d resources/stores || echo 'FAIL: no store directory'
grep -n "storesDir" config/ui.ts | grep -v "'stores'" && echo 'FAIL: storesDir must be bare "stores"'
grep -rn 'function effectiveTheme' resources --include='*.stx' | wc -l   # must be 0
grep -rn "state(false)" resources/views/account.stx resources/views/dashboard.stx  # no duplicate `pro`
```

---

### 6.4 MUST — obey the store-loader contract: no value imports, no `index.ts`/`types.ts`, unique top-level names

**WHY.** Store files are not modules. `getStoreScript` (`dist/store-loader.js:5-73`) globs `*.ts` **non-recursively** (`:16`), skips any file named `index` or `types` (`:20`) and any `.d.ts` (`:22`), then for each file **deletes every single-line import** (`:52`, `/^import\s+.*from\s+['"][^'"]+['"]\s*;?\s*$/gm`) and **strips the `export` keyword** (`:53`), transpiles, and concatenates every file into one shared IIFE (`:66-69`). The result is injected into the page at `dist/process.js:245-256`.

Consequences, all enforceable:

| Constraint | Mechanism | Failure mode |
|---|---|---|
| No value imports | `store-loader.js:52` deletes the line | `ReferenceError` at runtime, no build error |
| `import type` is fine | stripped at `:52`, annotations erased by the transpiler | none |
| Multi-line imports are **not** stripped | regex is single-line | `import` inside an IIFE → whole bundle is a syntax error; only a `console.warn` at `store-loader.js:60` |
| Never name a file `index.ts` or `types.ts` | `store-loader.js:20` | store silently never loads |
| Top-level identifiers must be globally unique across `resources/stores/*.ts` | one shared IIFE (`:66`) | `const` redeclaration throws; every store dies |
| A store that consumes another must call `useStore(` | files containing `useStore(` are sorted last (`:37-45`) | `Error: Store "x" not found` (`signals.js:4457`) |
| The page must have at least one `<script client>` | store tag is inserted after the first `<script data-stx-scoped>` (`process.js:247-250`); no scoped script → no injection | store absent on that page only |
| `import { x } from '@stores'` matches the **defineStore id**, not the const name | rewritten to `window.__STX_STORES__` (`dist/store-imports.js:6-8`); keyed by id at `signals.js:4443-4444` | `undefined` |

**RIGHT.** Prefer `useStore('session')` (auto-imported, `dist/client-script.js:210`) over `import { … } from '@stores'`; it fails loudly (`signals.js:4457`) instead of yielding `undefined`.

**Ordering guarantee you must not break.** The store `<script>` sits *after* the page's client script in the HTML, but a client script that uses signals is wrapped in `window.stx.mount(function(){…})` (`dist/client-script.js:749-755`) and deferred to the mount queue (`signals.js:4513`, flushed at `:4823`), so store reads inside it run after the bundle. **`useStore` is not in the `usesSignals` trigger regex** (`dist/client-script.js:743`) — a client script whose only stx call is `useStore(...)` falls through to the immediate `;(function(){…})()` form (`:766-771`) and throws. Guarantee the wrapper by putting store reads inside `onMount(...)`, which *is* in the regex.

**CHECK.**
```bash
# value imports (type imports are allowed)
grep -rn '^import ' resources/stores/*.ts 2>/dev/null | grep -v 'import type' && echo FAIL
# reserved filenames
ls resources/stores/index.ts resources/stores/types.ts 2>/dev/null && echo FAIL
# duplicate top-level const/function names across the bundle
grep -hoE '^(export )?(const|let|var|function) [A-Za-z_$][\w$]*' resources/stores/*.ts \
  | awk '{print $NF}' | sort | uniq -d
# stores present in the served HTML
curl -s localhost:3100/dashboard | grep -c 'data-stx-stores'   # must be 1
```
Runtime confirmation: the boot log prints `[stx:store] registered: <id> total stores: N` (`signals.js:4446`).

---

### 6.5 MUST — read and write cookies with `useCookie()`, never `document.cookie`

**WHY.** `useCookie` (`dist/signals.js:3568-3616`) returns a **signal**: it escapes the cookie name before matching (`:3574`), serialises `path` defaulting to `/` (`:3584`), `max-age` (`:3585-3586`), `SameSite` defaulting to `Lax` (`:3588`), and derives `Secure` from `location.protocol === 'https:'` (`:3589-3591`) — the exact string bughq retypes at 17 sites. Writes happen inside an `effect` (`:3594-3597`), so a cookie change propagates to every binding; `set('')` emits `max-age=0` (`:3585`) and deletes. `document.cookie` is also on stx's own prohibited list (`dist/script-validation.js:38-39`).

**WRONG** — 22 sites. `resources/views/dashboard.stx:568-569`:

```js
if (!/(^|;)\s*bughq_token=/.test(document.cookie)) {
  document.cookie = 'bughq_token=' + t + '; path=/; max-age=2592000; samesite=lax'
    + (location.protocol === 'https:' ? '; secure' : '')
```
duplicated verbatim at `settings.stx:1003-1004`, `projects/index.stx:187-188`, `projects/new.stx:20-21`, `issue/[id].stx:791-792`; plus the un-escaped `bughq_project` writes at `dashboard.stx:270`, `:429`, `:590`, `settings.stx:215`, `issue/[id].stx:802`; plus the three sign-out clears at `dashboard.stx:232`, `account.stx:33`, `projects/index.stx:59`.

**RIGHT** — one declaration in `resources/stores/session.ts` (6.3), then everywhere:

```js
const session = useStore('session')
onMount(() => { if (!session.token()) session.token.set(localStorage.getItem('token') || '') })
// sign out, all three pages:
session.signOut()
// project switch, all five pages:
session.project.set(id)
```

**CHECK.**
```bash
grep -rn 'document\.cookie' resources --include='*.stx' | wc -l   # must be 0
```
Or make it fail the build — set `strict: { enabled: true, failOnViolation: true }` in `config/ui.ts` (`dist/types/config-types.d.ts:309`, `:214-218`); the rule at `dist/script-validation.js:38` reports *"document.cookie is prohibited"*.

---

### 6.6 MUST — fetch with `useQuery` / `useMutation`, never `fetch()` plus hand-rolled `loading`/`error`

**WHY.** `useQuery` (`dist/signals.js:1042-1126`) returns `{ data, loading, error, isStale, refetch, invalidate }` (`:1116-1125`) — precisely the triad bughq redeclares in eleven files. It adds a module-scope response cache `_queryCache` (`dist/signals.js:1023`) with `staleTime` / `cacheTime` and stale-while-revalidate (`:1058-1072`). That cache lives in the runtime closure, which `cleanupContainer` (`signals.js:5099`) never clears — so it survives every fragment swap of `config/ui.ts:42`'s `main`. It fetches on `onMount` (`:1099`), not at script-parse time. `useMutation` (`dist/signals.js:1129-1192`) gives `{ data, loading, error, mutate, reset }` with optimistic update and rollback (`:1141-1145`, `:1170`) and `invalidateQueries` (`:1163-1165`).

**WRONG (a)** — six identical pairs: `login.stx:16-17`, `register.stx:16-17`, `reset-password.stx:9-10`, `forgot-password.stx:8-9`, `projects/new.stx:9-10`, `pricing.stx:9-10`.

```js
// login.stx:16-51
const error = state('')
const loading = state(false)
async function handleSubmit(e) {
  e.preventDefault(); if (loading()) return
  loading.set(true); error.set('')
  try {
    const res = await fetch('/login', { method: 'POST', headers: {...}, body: JSON.stringify({...}) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { error.set(data.message || 'Invalid email or password.'); return }
    ...
  } catch { error.set('Something went wrong. Please try again.') }
  finally { loading.set(false) }
}
```

**WRONG (b)** — the duplicated read at `account.stx:38-56` and `dashboard.stx:276-291`, both hitting `/api/me` with hand-written 401 handling.

**RIGHT (a).**

```js
const login = useMutation('/login', {
  onSuccess(data) {
    const session = useStore('session')
    batch(() => { session.token.set(data.token || data.access_token || '') })
    navigate('/dashboard')
  },
})
function handleSubmit(e) {
  e.preventDefault()
  const f = e.target
  login.mutate({ email: f.elements.email.value, password: f.elements.password.value })
}
```
Template binds `login.loading()` and `login.error()`; delete both `state()` lines.

**RIGHT (b).** One `useQuery('/api/me', { cacheKey: 'me', staleTime: 30000 })` in `resources/stores/session.ts` (6.3). `/account` and `/dashboard` then share one request and one `pro`.

Choosing between the four:

| Use | When | Cleanup it owns |
|---|---|---|
| `useQuery` (`:1042`) | GET you want cached/shared/polled | `refetchInterval` → `onDestroy(clearInterval)` (`:1110-1113`) |
| `useFetch` (`:839`) | one-shot GET, no cache; refetches when a `urlOrFn` dependency changes (`:900-906`) | fetch on `onMount` (`:897`) |
| `useMutation` (`:1129`) | POST/PUT/DELETE | — |
| `useAsync` (`:3395`) | non-HTTP async work | — (**not signals**, see 6.8) |

**CHECK.**
```bash
grep -rEn '(^|[^.[:alnum:]_])fetch\(' resources --include='*.stx' | wc -l   # target 0
grep -rEn '\buse(Query|Mutation|Fetch)\(' resources --include='*.stx' | wc -l # target ≥ 12
grep -rn "const loading = state\|const error = state" resources --include='*.stx' # target 0
```

---

### 6.7 MUST — every timer, listener and subscription is cancelled by `onDestroy`, or by a composable that registers one for you

**WHY.** `onDestroy` (`dist/signals.js:704`) pushes onto `destroyCallbacks`, which `_handleStxLoad` drains on every `stx:load` — i.e. on every SPA navigation (`dist/signals.js:5181-5185`) — and `cleanupContainer` fires per-element `__stx_destroy` hooks (`:5127-5132`). Without a hook, nothing is cancelled: `cleanupContainer` clears `mountCallbacks` (`:5102`) and disposes effects, but it cannot know about a `setTimeout` you closed over.

**WRONG** — `resources/components/AutofixPanel.stx:189`, inside `loadAutofix`, which re-arms itself:

```js
if (schedule && activeRun(data.run)) setTimeout(() => loadAutofix(true), 2200)
```

`config/ui.ts:42` swaps `main` on navigation, so leaving `/issue/[id]` destroys the panel's DOM while the chain keeps hitting `/api/issues/:id/autofix` on an authenticated origin, forever. There are zero `onDestroy` calls in all 52 `.stx` files.

**RIGHT** — let `useQuery` own the interval (`dist/signals.js:1110-1113` pairs `setInterval` with `onDestroy(clearInterval)`):

```js
const autofix = useQuery(() => `/api/issues/${encodeURIComponent(autofixIssueId)}/autofix`, {
  headers: authHeaders(),
  refetchInterval: 2200,          // cancelled on swap by signals.js:1112
})
const run = derived(() => autofix.data()?.run || null)
```
Gate polling by re-creating on demand, or keep `refetchInterval` and let `activeRun` short-circuit server-side. If you truly need a bare timer, use `useTimeout` (`dist/signals.js:3271`, `onDestroy(stop)` at `:3296`) or `useInterval` (`:3229`, `onDestroy(pause)` at `:3258`) — never `setTimeout`/`setInterval` directly.

Six more unowned timers exist today: `settings.stx:203`, `:406`, `:512`, `issue/[id].stx:354` (copy-label restores — replace with `useTimeout`), and the two `Promise.race` guards at `dashboard.stx:173` / `issue/[id].stx:81` (server-block, acceptable).

**CHECK.**
```bash
grep -rEn '(^|[^.[:alnum:]_])(setTimeout|setInterval)\(' resources --include='*.stx' \
  | grep -v '<script server>'    # must be 0 in client scripts
grep -rEn '\bon(Mount|Destroy)\(' resources --include='*.stx' | wc -l   # must be > 0
```
`strict` mode also names this exact case — `dist/script-validation.js:93-100` reports *"setTimeout() is prohibited"* with the suggestion *"Use useTimeout() or useDebounce() from composables"*.

---

### 6.8 MUST — composables that return getter objects are NOT reactive; bridge them into a signal

**WHY.** Only `state()` and `derived()` register with `activeEffect` (`dist/signals.js:479-481`, `:552`). Several composables return a plain object with JS getters plus a `subscribe`, not signals. Reading `cm.isDark` inside a directive registers no dependency, so the binding never updates. The affected set, all in the runtime:

| Composable | Source | Returns |
|---|---|---|
| `useColorMode` / `useDark` | `signals.js:3429` / `:3507` | getters `mode`/`preference`/`isDark` + `subscribe` (`:3500`) |
| `useAsync` | `signals.js:3395` | getters `state`/`data`/`error`/`isLoading` + `subscribe` (`:3418`) |
| `useToggle` / `useCounter` | `signals.js:3308` / `:3324` | getter `value`/`count` + `subscribe` |
| `useInterval` / `useTimeout` | `signals.js:3229` / `:3271` | getter `counter`/`isPending` + `subscribe` |

Signal-returning composables — safe to bind directly: `useLocalStorage` (`:3526`), `useSessionStorage` (`:3547`), `useCookie` (`:3568`), `useReactiveProp` (`:3618`), and the `{ data, loading, error }` of `useFetch`/`useQuery`/`useMutation`.

**WRONG** — `resources/views/dashboard.stx:214-219`. Same class of bug, hand-built: `matchMedia(...).matches` is read **once**, at hydration, into a snapshot. No listener is registered, so an OS theme change or a toggle in another tab never reaches the page:

```js
function effectiveTheme() {
  return document.documentElement.getAttribute('data-theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}
const theme = state(effectiveTheme())
```

**RIGHT** — subscribe once, mirror into a signal (this is the body of the theme store in 6.3):

```js
const cm = useColorMode({ storageKey: 'bughq_theme', attribute: 'data-theme' })
const mode = state(cm.mode)
cm.subscribe(resolved => mode.set(resolved))    // signals.js:3500
```
`useColorMode` then supplies what the four hand-rolled copies lack: a live `prefers-color-scheme` listener (`signals.js:3470-3479`), a cross-tab `storage` listener (`:3482-3489`), transition suppression to kill the repaint flash (`:3446-3450`), and its own `onDestroy` teardown (`:3492`).

**CHECK.** Manual review. Grep for a getter-returning composable whose result is used in a template without a `subscribe` bridge:
```bash
grep -rEn '\buse(ColorMode|Dark|Async|Toggle|Counter|Interval|Timeout)\(' resources --include='*.stx' \
  | while IFS=: read f l _; do grep -q 'subscribe(' "$f" || echo "$f:$l no subscribe bridge"; done
```

---

### 6.9 MUST — never hand-import an auto-import, and never call `createStore` in client code

**WHY.** `dist/client-script.js:143-215` is the definitive auto-import list; `generateAutoImportDestructuring` (`:334-337`) emits `var { … } = window.stx || window` at the top of every client script. Writing `import { state } from '@stacksjs/stx'` is redundant at best; worse, any import outside `EXTERNAL_PATTERNS` (`dist/client-script-bundler.js:5-11`: `stx`, `@stacksjs/stx`, `@stores`, `stx/stores`, `@composables`) flips `hasUserImports` and drags the whole client script through the bundler (`:12-34`).

The state/store names that resolve for free: `state`, `derived`, `effect`, `batch`, `untrack`, `peek`, `isSignal`, `onMount`, `onDestroy`, `useQuery`, `useMutation`, `useFetch`, `useOptimistic`, `useLocalStorage`, `useSessionStorage`, `useCookie`, `useColorMode`, `useDark`, `useAsync`, `useToggle`, `useCounter`, `useDebounce`, `useDebouncedValue`, `useThrottle`, `useInterval`, `useTimeout`, `useClickOutside`, `useFocus`, `useEventListener`, `useWebSocket`, `useRoute`, `useSearchParams`, `defineStore`, `useStore`, `provide`.

**`createStore` is listed at `client-script.js:211` but does not exist in the browser runtime.** `grep -c createStore dist/signals.js` → 0; it is absent from both the `window.stx` object (`signals.js:4136-4230`) and the `window.*` assignments (`:4625-4671`). It only exists in `dist/state-management.js:64`, a **build-time/Node** module exported from `index.d.ts:134`. Same for `getStore`, `registerStore`, `createSelector`, `action`. In a `<script client>` these all destructure to `undefined`.

**WRONG** — none in bughq yet (zero store calls). Do not introduce:
```js
import { defineStore } from '@stacksjs/stx'   // redundant; auto-imported at client-script.js:212
const s = createStore({ pro: false })          // undefined at runtime
```

**RIGHT.**
```js
const session = useStore('session')            // window.stx.useStore, signals.js:4450
```

**CHECK.** stx already ships the detector: `generateAutoImportGuard` (`dist/client-script.js:347-364`) emits a runtime check that logs
`[stx] "createStore" is used in this client script and auto-imported from stx, but the client runtime does not provide it.`
Static form:
```bash
grep -rEn '\b(createStore|getStore|registerStore|createSelector)\(' resources --include='*.stx' && echo FAIL
grep -rn "from '@stacksjs/stx'" resources --include='*.stx' | grep -v 'import type' && echo FAIL
```

---

### 6.10 SHOULD — know which composable surface you are on before you reach for one

**WHY.** There are two parallel implementations and they are not interchangeable.

| Surface | Path | How it reaches a page | Count |
|---|---|---|---|
| Runtime globals | `dist/signals.js:4136-4230` (`window.stx`), `:4625-4671` (`window.*`) | auto-import destructuring, zero cost | 35 state/composable names (`client-script.js:143-215`) |
| ESM composables module | `dist/composables/index.js` | `import … from '@stacksjs/stx/composables'` → **not** in `EXTERNAL_PATTERNS`, so it triggers `bundleClientScript` (`client-script-bundler.js:12`) | 91 `use*` (152 exports total) |

The `@composables` specifier is rewritten to `window.__composables` (`dist/store-imports.js:11-13`) — and **nothing in the runtime ever assigns `window.__composables`** (`grep -rn 'window.__composables *=' dist` → no matches). Importing from `@composables` yields `undefined` bindings today.

**RIGHT.** Default to the runtime globals in 6.9's list. Reach into `@stacksjs/stx/composables` only for the 56 names that have no global (`useStorage`, `useClipboard`, `useMediaQuery`, `useIdle`, `useNetwork`, `useElementSize`, `useHotkey`, `useInfiniteScroll`, `useSSE`, …), accept that the script gets bundled, and use an explicit package path — never `@composables`.

**CHECK.**
```bash
grep -rn "from '@composables'" resources --include='*.stx' && echo 'FAIL: resolves to undefined'
# names used but not global => script will be bundled; confirm intentional
grep -rn "@stacksjs/stx/composables" resources --include='*.stx'
```
Runtime confirmation of an accidental bundle: the dev server logs `[stx:bundler] detected user import: <source>` (`dist/client-script-bundler.js:21`).

---

### 6.11 MUST — store and query shapes are declared types, in `types/`, and `tsconfig.json` must cover the stores directory

**WHY.** Requirements 8 and 10. `resources/stores/*.ts` is transpiled by `Bun.Transpiler({ loader: 'ts' })` (`dist/store-loader.js:49`), which **erases** types without checking them — a store is only typechecked if `tsc --noEmit` sees it. `tsconfig.json:31-38` currently includes `types/**/*.d.ts`, `app/Models/**`, `app/Services/**`, `app/Support/**` and nothing under `resources/`, so a new store directory would be invisible to typecheck. Inline `interface` declarations inside `.stx` (the pattern at `resources/components/AutofixPanel.stx:2-5`) are never typechecked at all — `.stx` is not in `include`.

**WRONG.** `resources/components/AutofixPanel.stx:13` — the panel's central fact is `state(null)` with its entire shape (`run.status`, `run.plan.steps[]`, `run.changes.files[]`, `repository`, `can_run`, `enabled`) implied only by the 20 accessor functions below it:

```js
const autofixState = state(null)
```

**RIGHT.** `types/stores.d.ts` (global, so store files need no import — 6.4):

```ts
declare global {
  type AutofixStatus = 'queued' | 'analyzing' | 'planning' | 'editing' | 'creating_pr' | 'completed' | 'failed'
  interface AutofixRun {
    status: AutofixStatus
    root_cause?: string
    plan?: { steps: Array<{ title: string, detail: string }> }
    changes?: { files: Array<{ path: string, explanation: string }> }
    error?: string
    pr_url?: string
    branch_name?: string
  }
  interface AutofixState { run: AutofixRun | null, repository: string, repository_branch?: string, enabled: boolean, can_run: boolean }
  interface SessionUser { id: string, name: string, email: string, created_at: string }
  interface MeResponse { user: SessionUser, pro: boolean }
}
export {}
```
Then `const autofixState = state<AutofixState | null>(null)` and `useQuery<MeResponse>('/api/me', …)`.

Add to `tsconfig.json:31-38`:
```json
"include": ["*.ts", "*.d.ts", "types/**/*.d.ts", "resources/stores/**/*.ts", "app/Models/**/*.ts", "app/Services/**/*.ts", "app/Support/**/*.ts"]
```

**CHECK.**
```bash
grep -q '"resources/stores/\*\*/\*.ts"' tsconfig.json || echo 'FAIL: stores not typechecked'
bunx tsc --noEmit
grep -rn 'state(null)\|state<any>' resources --include='*.stx'   # untyped nullable state — annotate it
```

---

### Migration order (do not reorder — each step depends on the one above)

| # | Change | Unblocks | Findings closed |
|---|---|---|---|
| 1 | `mkdir resources/stores` (no `config/ui.ts` change — 6.3) | everything below | 23 |
| 2 | `types/stores.d.ts` + `tsconfig.json` include | typed stores | — |
| 3 | `resources/stores/theme.ts` via `useColorMode`; delete 4 `effectiveTheme` blocks | one theme, live OS + cross-tab sync | 23, 41, 55 |
| 4 | `resources/stores/session.ts` via `useCookie`; replace 22 `document.cookie` sites | `strict` mode can be turned on | 24 |
| 5 | `useQuery('/api/me')` in the session store; delete both `pro` signals | one request per session | 25 |
| 6 | `useMutation` in the 6 auth/form pages; delete 6 `loading`/`error` pairs | — | 25 |
| 7 | `AutofixPanel`: `derived()` chain + `refetchInterval` | kills the immortal poll | 25, 26 |
| 8 | `strict: { enabled: true, failOnViolation: true }` in `config/ui.ts` | regressions fail the build | 22, 48 |

## 7. Templates: directives and bindings

Every rule below was checked against `node_modules/@stacksjs/stx/dist` at stx **0.2.113** and against bughq's real `.stx` files. Where a claim was verifiable by rendering, it was rendered through `processDirectives` and the output is quoted.

### 7.0 The two passes — read this before any rule

`processOtherDirectives` (`node_modules/@stacksjs/stx/dist/process.js:511-610`) is a single ordered string pipeline. Everything in it runs **on the server**. Only three things survive into the browser:

| Survives to the client | Emitted by |
|---|---|
| `@if` / `@for` / `@show` / `@model` **as attributes** | `convertSignalDirectivesToAttributes` (`signal-processing.js:201`), `convertSignalLoopsToAttributes` (`signal-processing.js:455`), gated at `process.js:519` |
| `:attr` / `:text` / `:class` / `:style` / `:html` / `ref` | left verbatim in the HTML; bound by the injected signals runtime (`signals.js:1782-1828`) |
| `@click` and other event attributes | left verbatim; bound at `signals.js:1830-1932` |

Everything else — `@if (...)` block form, `@foreach`, `@auth`, `@include`, `@json`, `@switch` — is resolved and **deleted** before the response is written.

The switch between the two is `conditionIsClientReactive` (`signal-processing.js:151-178`), whose last line is:

```js
return (refsSignal || refsZeroArgGetter) && !refsServerVar   // signal-processing.js:177
```

A condition that names **one** `<script server>` variable is server-evaluated and frozen forever. A condition that names only signals or zero-arg getters becomes a client attribute. There is no warning either way.

#### Directive inventory (what 0.2.113 actually ships)

| Directive | Pass | Verdict | bughq |
|---|---|---|---|
| `@if` / `@elseif` / `@else` / `@endif` | both (see 7.0) | **MUST** | 88 / 1 / 19 / 81 uses |
| `@unless` / `@endunless` | server (`conditionals.js:79-121`) | MAY — rewritten to `@if (!(…))` | unused |
| `@switch` / `@case` / `@default` / `@break` | server (`conditionals.js:26-70`) | SHOULD for ≥3 branches | unused |
| `@isset` / `@empty(x)` | server (`conditionals.js:447-513`) | MAY | unused |
| `@env('production')` | server (`conditionals.js:515-517`) | **MUST NOT — broken** | unused |
| `@auth` / `@guest` / `@else` | server (`conditionals.js:208-320`, wired `process.js:568`) | **MUST** for auth markup | 0 uses (finding 53) |
| `@auth('guard')` / `@can` / `@cannot` | server (`conditionals.js:283, :346`) | **MUST NOT — broken** | 0 uses |
| `@foreach` / `@endforeach`, `@for`, `@while`, `@each` | server (`loops.js:313`) | **MUST** for server lists | 20 uses |
| `@forelse` / `@empty` / `@endforelse` | server (`loops.js:179-310`) | **MUST** over `@if (x.length)` + `@foreach` | 5 uses |
| `loop.index` / `.iteration` / `.first` / `.last` / `.count` | server (`loops.js:424-425`) | SHOULD | 0 uses |
| `@json(expr[, true])` | server (`misc-directives.js:3-95`) | SHOULD **in markup only** (7.11) | 0 uses |
| `@once` / `@endonce` | server (`includes.js:250-256`) | MAY — **per-file only** (7.10) | 0 uses |
| `@memo(deps)` / `@endmemo` | server stamp (`misc-directives.js:100-135`) + runtime (`signals.js:1566`) | MAY | 0 uses |
| `@ref="name"` / `ref="name"` | server rewrite (`misc-directives.js:136-139`) → `signals.js:1825` | SHOULD instead of `getElementById` | 0 uses |
| `@validate('f','rules')` | **never invoked** | **MUST NOT — dead** (7.9) | 0 uses |
| `@error` / `@errors` / `@hasErrors` | server (`forms-validation.js:438-500`, `forms.js:117`) | MAY (needs `context.errors`) | 0 uses |
| `@csrf` / `@method('PUT')` | server (`forms.js:35-74`) | MAY | 0 uses |
| `@transition(…)` / `@transition.fade=` | server → inline `<script>` (`transitions.js:84, :437`) | **MUST NOT** (7.12) | 0 uses |
| `@suspense` / `@fallback` | server → inline `<script>` (`suspense.js:5-11`) | **MUST NOT** (7.12) | 0 uses |
| `@errorBoundary` / `@fallback` | server → inline `<script>` (`error-boundaries.js:5-11`) | **MUST NOT** (7.12) | 0 uses |
| `@keepAlive`, `@defer`, `@teleport`, `@stream`, `@virtualList`, `@client`, `@static` | server → inline `<script>` | **MUST NOT** (7.12) | 0 uses |
| `@markdown`, `@translate`, `@route`, `@image`, `@js`, `@ts`, `@computed`, `@watch` | server | MAY (out of chapter) | 0 uses |

Attribute bindings, all bound by the signals runtime:

| Binding | Runtime site | Verdict |
|---|---|---|
| `:if` / `@if=` / `x-if` | `signals.js:1681-1692`, `bindIf` at `:2923` | **MUST** for signal-driven branches inside a server loop |
| `:for` / `@for=` | `signals.js:1655-1659`, `bindFor` at `:2307` | MUST for signal-driven lists |
| `:show` / `@show=` | `bindShow`, `signals.js:2012-2065` (`el.style.display`) | **MUST** over a hand-rolled hidden class |
| `:model` | `bindModel`, `signals.js:2069` | SHOULD over `@input` mirror + manual `.value =` |
| `:text` / `:html` | `signals.js:1811-1823` | **MUST** over `{{ }}` in first-paint content |
| `:class` / `:style` | `bindClass` `signals.js:2111`, `bindStyle` `:2176` | MUST — **appends** to static `class` |
| `:anyOther` (`:disabled`, `:hidden`, `:href`, `:value`, `:open`, `:data-*`, `:aria-*`) | `signals.js:1782-1801` | MUST — needs a static counterpart (7.1) |
| `ref="x"` / `:ref` | `signals.js:1825-1828` | SHOULD |

Reserved names that are **not** attribute bindings: `class style text html show model if for ref` (`DIRECTIVE_NAMES`, `signals.js:1754`) and anything matching `EVENT_RE` (`signals.js:1762`).

---

### 7.1 MUST — every `:attr` needs a static counterpart that encodes the SSR state

**WHY.** `:attr` is not resolved on the server. The generic binder is an `effect` that runs in the browser (`signals.js:1788-1799`); until it runs, the attribute sits in the HTML as literal text. Verified in the shipped build:

```html
<!-- dist/login.html -->
<button type="submit" :disabled="loading()" class="btn w-full py-2.5 text-sm font-semibold" x-cloak>
```

For `:class` the rule is sharper: the string and array forms **append** to whatever `class` the element already had — `originalClasses` is captured once at bind time (`signals.js:2112`) and re-prefixed on every recompute (`signals.js:2166`, `:2170`). Anything you put only in the binding is absent from the server HTML.

**WRONG** — `resources/views/pricing.stx:92-93`. The interval toggle carries no `class` at all, so the SSR HTML ships two unstyled buttons:

```html
<button @click="pick('monthly')" :class="interval() === 'monthly' ? 'on px-4 py-1.5 font-medium' : 'px-4 py-1.5 font-medium'">Monthly</button>
```

```html
<!-- dist/pricing.html — what the browser gets before hydration -->
<button @click="pick('monthly')" :class="interval() === 'monthly' ? 'on px-4 py-1.5 font-medium' : 'px-4 py-1.5 font-medium'">Monthly</button>
```

**RIGHT** — static classes carry every always-true utility; the binding carries only the conditional token:

```html
<button @click="pick('monthly')" class="px-4 py-1.5 font-medium" :class="interval() === 'monthly' ? 'on' : ''">Monthly</button>
```

bughq already does this correctly for boolean attributes, and documents why at `resources/views/settings.stx:730-733`:

```html
<!-- resources/views/settings.stx:975 -->
<div class="dz-overlay" :hidden="dzAction() === null" hidden @click="dzBackdrop" @keydown="dzKey">
<!-- resources/views/settings.stx:983 -->
<button @click="dzConfirm" :disabled="dzBusy() || !dzMatches()" :text="dzConfirmLabel()" type="button" class="btn-danger px-4 py-2.5 text-sm font-semibold" disabled></button>
```

**CHECK.**
```bash
# :class with no static class= on the same tag
grep -rnoE '<[a-z][a-z0-9-]*[^>]*:class="[^"]*"[^>]*>' resources --include='*.stx' | grep -vE '[[:space:]]class="'
# :disabled / :hidden / :open with no static counterpart
grep -rn ':disabled="' resources --include='*.stx' | grep -v ' disabled'
grep -rn ':hidden="'   resources --include='*.stx' | grep -v ' hidden'
```
First command currently returns 19 lines (`pricing.stx:92,93` + all of `AutofixPanel.stx`). Target: 0.

---

### 7.2 MUST — never put a signal expression in `{{ }}` inside content that must be visible at first paint; use `:text` with static fallback text

**WHY.** `addCloakToUnresolvedExpressions` (`misc-directives.js:141-176`) runs at `process.js:604`, *after* `processExpressions` at `:603`. Any `{{ }}` still unresolved by then is client-only, and the pass stamps `x-cloak` on the wrapping tag — but only if that tag is in a hard-coded whitelist (`misc-directives.js:142`: `div|span|p|h1-6|td|th|li|a|button|label|section|…`) and only if the `{{` appears before the first `</` in its content. `CLOAK_STYLE` (`document-shell.js:1`) then injects `[x-cloak]{display:none !important}`. So the element is **invisible until the runtime boots** — and elements outside the whitelist (`option`, `title`, `textarea`) get no cloak at all and flash raw `{{ … }}`.

**WRONG** — `resources/views/login.stx:134-136`. The primary CTA on the sign-in page:

```html
<button type="submit" :disabled="loading()" class="btn w-full py-2.5 text-sm font-semibold">
  {{ loading() ? 'Signing in…' : 'Sign in' }}
</button>
```

`dist/login.html` ships it as `… class="btn w-full py-2.5 text-sm font-semibold" x-cloak>` — `display:none`. `resources/views/pricing.stx:114` does the same to the actual price:

```html
<!-- dist/pricing.html -->
<div class="mt-3" x-cloak><span class="wordmark text-4xl" x-cloak>{{ interval() === 'yearly' ? '\$190' : '\$19' }}</span><span class="text-sm text-subtle" x-cloak>{{ interval() === 'yearly' ? ' / year' : ' / month' }}</span></div>
```

**RIGHT** — `resources/views/settings.stx:781` is the pattern already in the repo: static text is the SSR fallback, `:text` overwrites it on hydration, no `{{ }}` means no cloak.

```html
<button type="submit" :disabled="loading()" :text="loading() ? 'Signing in…' : 'Sign in'" class="btn w-full py-2.5 text-sm font-semibold">Sign in</button>
```

**CHECK.** Authoritative (post-build):
```bash
grep -o '<[a-z][^>]* x-cloak>' dist/*.html
```
`dist/pricing.html` currently returns 5, `dist/account.html` 11. Every hit is an element the user cannot see until JS runs; each must be justified or converted to `:text`. Source-side candidate scan:
```bash
grep -rnoE '<(div|span|p|h[1-6]|td|th|li|a|button|label|section|article|header|footer|main|nav|aside|summary|pre|code|em|strong|small|time|b|i)\b[^>]*>[[:space:]]*\{\{[^}]*\(\)' resources --include='*.stx'
```

---

### 7.3 MUST — toggle visibility with `:show` or `@if=`, never with a class that means "hidden"

**WHY.** `bindShow` (`signals.js:2012-2065`) captures `originalDisplay` and writes `el.style.display`, keeping the node mounted and focusable. A "hidden class" instead rides the `:class` **append** path (`signals.js:2170`), so it fights the static class list and needs bespoke CSS that the SSR pass cannot apply.

**WRONG** — `resources/components/AutofixPanel.stx:90-142` defines **ten** helpers whose only job is to return a sentinel, applied at `:309, :315, :317-319, :334, :337, :342, :347-348, :384-386, :390, :396`:

```js
function retryClass() {
  return currentRunStatus() === 'failed' && canRunAutofix()
    ? 'flex gap-4 items-center justify-between autofix-run'
    : 'autofix-hidden'
}
```
```html
<div :class="retryClass()">                       <!-- AutofixPanel.stx:390 -->
```

**RIGHT.**
```html
<div class="flex gap-4 items-center justify-between autofix-run"
     :show="currentRunStatus() === 'failed' && canRunAutofix()" style="display:none">
```
(the static `style="display:none"` is the 7.1 counterpart; `bindShow` reads it as `originalDisplay === 'none'` only when the element starts hidden, so pair it with `:show` and let the first effect run reveal it.)

**CHECK.**
```bash
grep -rn "'[a-z-]*hidden'" resources --include='*.stx'   # 10 hits, all AutofixPanel
grep -rc ':show=\|@show=' resources --include='*.stx'    # 0 — should be >0 once fixed
```

---

### 7.4 MUST — auth-conditional markup uses `@auth` / `@guest`; never a `localStorage` DOM rewrite

**WHY.** `processAuthDirectives` (`conditionals.js:208-320`, wired at `process.js:568`) reads `context.auth.check` through `evaluateAuthExpression` (`auth.js:2-12`), supports a top-level `@else` (`conditionals.js:275-280`, `:309-314`), and defaults to **guest** when `context.auth` is absent (`conditionals.js:271`, `:306`). Verified by render:

```
tpl: "A:@auth\n<b>hi</b>\n@else\n<b>guest</b>\n@endauth\nB:@guest\n<b>signup</b>\n@endguest"
auth={check:true}  -> "A:\n<b>hi</b>\n\nB:"
no auth in context -> "A:\n<b>guest</b>\n\nB:\n<b>signup</b>"
```

Two syntax facts you must respect, both from the opener regex `/@auth(?:\s*\(|\s|(?=\n))/` (`conditionals.js:266`):
* `@auth` must be followed by whitespace, a newline, or `(`. `@auth<b>hi</b>@endauth` is **not matched** and ships to the browser as literal text — verified.
* **MUST NOT** use the guard form `@auth('is_admin')`. `conditionals.js:283` builds `` `auth?.check && auth?.user?.[${guard}]` `` with the guard **unquoted**, so it evaluates `auth?.user?.[is_admin]` — an undefined identifier. Verified: with `user.is_admin === true` the block renders empty. Same defect in `@guest` (`:311`) and `@can`/`@cannot` (`conditionals.js:346`, which additionally needs a `context.userCan` or `context.permissions.check` that bughq does not have).

**WRONG** — `resources/views/index.stx:132-147`. The markers live in two shared partials (`resources/partials/SiteNav.stx:44-45, :70-71`; `resources/partials/SiteFooter.stx:47-48`) included by all 24 marketing pages, but the script that acts on them exists on exactly one:

```html
<script>
  (function () {
    if (!localStorage.getItem('token')) return
    document.querySelectorAll('[data-auth-login]').forEach(function (a) {
      a.textContent = 'Dashboard'
      a.setAttribute('href', '/dashboard')
    })
    document.querySelectorAll('[data-auth-signup]').forEach(function (a) { a.style.display = 'none' })
    …
```

**RIGHT** — one edit in `SiteNav.stx`, correct on all 24 pages, zero DOM API calls:

```html
@guest
  <a class="nav-login" href="/login">Log in</a>
  <a class="btn nav-cta primary sm" href="/register">Sign up</a>
@else
  <a class="nav-login" href="/dashboard">Dashboard</a>
@endguest
```

**CHECK.**
```bash
grep -rn 'data-auth-login\|data-auth-signup\|data-auth-cta' resources --include='*.stx'   # must be 0
grep -rhoE '@(auth|guest|endauth|endguest)' resources --include='*.stx' | sort | uniq -c  # currently 0
grep -rnE "@(auth|guest)\s*\(" resources --include='*.stx'                                # must stay 0 (broken guard form)
```

---

### 7.5 MUST — pick the pass deliberately; a signal-driven branch inside a server loop goes in the attribute form with the loop variable interpolated

**WHY.** `conditionIsClientReactive` returns false the moment the condition names any key of the server context (`signal-processing.js:172-175`). `@if (!dismissed().includes(inv.token))` inside `@foreach (pendingInvites as inv)` names `inv` → server-evaluated → the branch is baked into the HTML and the signal never moves it. The block form silently degrades; there is no error.

**RIGHT** — `resources/views/dashboard.stx:413`, which already solves this correctly by pushing the server value through `{{ }}` into the attribute so the condition names only signals:

```html
<div class="panel flex flex-wrap items-center gap-3 px-5 py-3.5 mb-2.5" style="…" @if="!dismissed().includes('{{ inv.token }}')">
  <button @click="joinInvite('{{ inv.token }}')" :disabled="joining() === '{{ inv.token }}'" :text="joinLabel('{{ inv.token }}')" class="pill …">Join</button>
```

The same shape appears at `resources/views/settings.stx:831, :842, :886`. Note the attribute form only wraps a **single balanced element**; anything else is wrapped in `<template @if="…">` (`signal-processing.js:179-187`).

**WRONG** — `resources/views/dashboard.stx:396-398` uses a server-only `@if` for a fact the client needs, then reads the server's decision back out of the DOM at `dashboard.stx:577`:

```html
@if (!user)
  <div id="auth-pending" class="text-center py-24 text-sm text-subtle">Loading…</div>
@endif
```
```js
if (document.getElementById('auth-pending')) {            // dashboard.stx:577
  localStorage.removeItem('token'); localStorage.removeItem('user')
```

Replace the gate with `@guest … @endguest` (7.4) and bridge the boolean into `<script client>` rather than probing the DOM for it.

**CHECK.** Manual review, with two greps to find candidates:
```bash
# @if conditions that name a zero-arg getter AND a bare identifier — likely mixed
grep -rnoE '@if \([^)]*\(\)[^)]*\)' resources --include='*.stx'
# any getElementById/querySelector probing an element that an @if renders
grep -rn 'getElementById\|querySelector' resources --include='*.stx'
```
The second currently returns hits in `login.stx:172`, `register.stx:187`, `settings.stx:511`, `dashboard.stx:577`, `index.stx:135-145`. Target: 0.

---

### 7.6 MUST — `@forelse` / `@empty` / `@endforelse` for any server list that can be empty; use `loop.*` instead of hand-carried indices

**WHY.** `processLoops` (`loops.js:313`, wired `process.js:526`) handles `@forelse` with a properly balanced `@empty` scan (`loops.js:230-276`) and injects `loop` and `$loop` into each iteration's scope (`loops.js:424-425`) with `index`, `iteration`, `first`, `last`, `count` (`loops.d.ts:10-16`). Verified:

```
@foreach (steps as step) {{ String(loop.iteration).padStart(2,'0') }}|{{ loop.first }}|{{ loop.last }}|{{ loop.count }}
-> 01|true|false|3   02|false|false|3   03|false|true|3
```

bughq uses `@forelse` correctly five times (`dashboard.stx:485/:506`, `projects/index.stx:145/:158`, `issue/[id].stx:598/:626, :661/:673, :741/:746`). It uses `loop.*` zero times.

**WRONG** — `resources/views/index.stx:24-28` hand-carries the ordinal in the data so that `index.stx:99` can print it:

```js
const steps = [
  { num: '01', verb: 'Install', body: '…' },
  { num: '02', verb: 'Capture', body: '…' },
  { num: '03', verb: 'Triage',  body: '…' },
]
```
```html
<span class="flow-num">{{ step.num }}</span>
```

**RIGHT.**
```js
const steps = [
  { verb: 'Install', body: '…' },
  { verb: 'Capture', body: '…' },
  { verb: 'Triage',  body: '…' },
]
```
```html
<span class="flow-num">{{ String(loop.iteration).padStart(2, '0') }}</span>
```

**CHECK.**
```bash
# an @if on .length immediately wrapping an @foreach = a missed @forelse
grep -rn -A2 '@if (.*\.length)' resources --include='*.stx' | grep '@foreach'
# hand-carried ordinals
grep -rn "num: '0" resources --include='*.stx'
```

---

### 7.7 MUST — bind events with `@event="namedHandler"`; never a DOM-0 `on*` attribute

**WHY.** A bare identifier is invoked with the event: `parseEventShorthand` matches `/^([a-zA-Z_$][\w$]*)$/` and returns `($event) => fn($event)` (`signals.js:1352-1361`), reached from the listener at `signals.js:1878-1879`. That is why every bughq handler is written `function handleSubmit(e)`. A DOM-0 `on*` attribute is a global-scope string: it cannot see signals, cannot see anything from `<script client>`, and is invisible to stx's strict client-script validator.

**WRONG** — `resources/views/dashboard.stx:429`, ~200 characters of JS in an attribute:

```html
<select onchange="document.cookie = 'bughq_project=' + encodeURIComponent(this.value) + '; path=/; max-age=31536000; samesite=lax' + (location.protocol === 'https:' ? '; secure' : ''); location.href = '{{ pageUrl({ page: 1 }) }}'"
        class="panel mono px-3 py-1.5 text-sm text-muted">
```

**RIGHT** — `resources/views/settings.stx:750` already does the identical job:

```html
<select @change="switchProject" class="panel mono px-3 py-1.5 text-sm text-muted">
```

**CHECK.**
```bash
grep -rnE '<[a-z][a-z0-9-]*[^>]*\son(click|change|input|submit|keydown|keyup|focus|blur|toggle)=' resources --include='*.stx'
```
Currently 15 hits: `dashboard.stx:429` (live) plus 14 in the unreferenced scaffolding under `resources/components/` (`LoginForm.stx`, `Taskbar.stx`, `StartMenu.stx`, `Window.stx`, `NotificationPopup.stx`). Target: 0.

---

### 7.8 MUST — use only the modifiers the signals runtime implements; `.debounce`, `.throttle` and the mouse-button modifiers do not exist here, and `@click.left` disables the handler

**WHY.** `processEventDirectives` (`events.js:340-379`) — the path whose doc comment advertises `.debounce`, `.throttle`, `.left/.middle/.right` and the `esc` alias (`events.js:49-66`, `:99-110`) — **returns the template untouched** on line 341 whenever the file contains `state(`, `derived(`, `effect(`, `@if=`, `@for=`, `@show=`, `@model=` or `data-stx`. Every bughq file that uses `@click` declares signals, so `events.js` never runs on any of them. Confirmed empirically: `grep -c 'id="__stx_evt_' dist/*.html` is 0 across the build.

The only modifier implementation that applies is the signals runtime, `signals.js:1862-1872` plus the listener options at `:1928-1930`:

| Supported | Not supported (silently ignored) |
|---|---|
| `.prevent` `.stop` `.self` `.capture` `.passive` `.once` | `.debounce` `.debounce.300` `.throttle` |
| `.ctrl` `.alt` `.shift` `.meta` | `.esc` (only `escape` is in `KEY_MAP`, `signals.js:1763`) |
| `.enter` `.tab` `.escape` `.space` `.up` `.down` `.left` `.right` `.delete` `.backspace` | `.middle` — and `.left` / `.right` are **key** modifiers |

The last row is a trap, not a nit: `@click.left="save"` runs the key-modifier loop at `signals.js:1868-1869`, finds `KEY_MAP['left'] === 'ArrowLeft'`, compares it to a `MouseEvent.key` of `undefined`, and `return`s. The handler never fires and nothing is logged.

**WRONG** — `resources/views/settings.stx:535-543` re-implements two shipped modifiers in JS:

```js
function dzKey(e) {
  if (e.key === 'Escape')
    dzClose()
}

function dzBackdrop(e) {
  if (e.target === e.currentTarget)
    dzClose()
}
```

**RIGHT** — `.escape` maps at `signals.js:1869`; `.self` compares against the bound element at `signals.js:1862`, which is `currentTarget`:

```html
<div class="dz-overlay" :hidden="dzAction() === null" hidden @click.self="dzClose" @keydown.escape="dzClose">
```

The same reduction applies to the seven `e.preventDefault()` calls that open every form handler (`login.stx:20`, `register.stx:20`, `forgot-password.stx:13`, `reset-password.stx:19`, `projects/new.stx:26`, `settings.stx:307`, `settings.stx:438`): `.prevent` fires at `signals.js:1871`, *before* the handler is invoked at `:1878`. Change `@submit="handleSubmit"` to `@submit.prevent="handleSubmit"` and drop the first line of each handler — then confirm in the browser, since this path has no server-side test.

**CHECK.**
```bash
grep -rnE '@[a-z]+\.(debounce|throttle|middle|left|right|esc)\b' resources --include='*.stx'   # must be 0
grep -rn 'preventDefault()\|stopPropagation()' resources --include='*.stx'                     # currently 7; each is a missing .prevent/.stop
grep -rn "e.key === '" resources --include='*.stx'                                             # each is a missing key modifier
```

---

### 7.9 MUST — do not write `@$event` into markup; keep handler logic in `<script client>`

**WHY.** `$event` is only reachable through the generic `new Function` paths (`signals.js:1900`, `:1912`, `:1917`). Those paths stringify the entire captured scope into a function body and decide whether a signal keeps its `.set()` by a **substring test on the handler source**:

```js
if (v && typeof v === 'function' && v._isSignal && value.includes(k + '.set(')) {   // signals.js:1908
```

An inline expression that mutates a signal through anything other than a literal `name.set(` — a helper, a destructured alias, a computed key — gets the signal auto-unwrapped to its current value and the write is discarded, silently. The bare-reference form (`signals.js:1356-1361`) bypasses all of that and hands you the event as the first argument. bughq has **zero** `$event` uses and 30 named handlers; keep it that way.

**WRONG** shape (not present in bughq — do not introduce it):
```html
<input @input="dzTyped.set($event.target.value)">
```

**RIGHT** — `resources/views/settings.stx:980` + a handler in `<script client>`, or `:model` (`signals.js:2069`) when the binding is a plain mirror:
```html
<input id="dz-input" type="text" class="field w-full px-3.5 py-2.5 text-sm mono mb-4" :model="dzTyped" autocomplete="off">
```

**CHECK.**
```bash
grep -rn '\$event' resources --include='*.stx'   # must be 0
```

---

### 7.10 MUST NOT — `@validate` and `@env`; they are dead in 0.2.113

**WHY.**

*`@validate`* is never reached by the render pipeline. `processValidateDirective` (`forms.js:359-394`) has exactly one caller, `processForms` (`forms.js:27-33`), and `process.js:21` imports only `processBasicFormDirectives`, `processErrorDirective`, `processFormInputDirectives` from `forms.js`. `processFormValidationDirectives` (`process.js:556`) resolves to `forms-validation.js:502-508`, which handles `@error`/`@errors`/`@hasErrors` and nothing else. And even if it were wired, its return value is a pair of HTML **comments** (`forms.js:393`), not attributes. Verified — the directive renders as literal page text:

```
in:  @validate('password', 'required|min:8')
out: @validate('password', 'required|min:8')
```

*`@env`* hard-codes the environment (`conditionals.js:517`):
```js
const currentEnv = "development";
```
`@env('production')` therefore always takes the `@else` branch, in production too. Verified: `@env('production')<b>PROD</b>@else<b>DEV</b>@endenv` → `<b>DEV</b>`.

**WRONG.** Any plan that adopts these. Audit finding 58 proposes replacing `resources/views/register.stx:23-27` —

```js
if (form.elements.password.value.length < 8) {
  error.set('Password must be at least 8 characters.')
  return
}
```

— with `@validate('password', 'required|min:8')`. **Do not.** That change would delete a working check and print the directive on the page.

**RIGHT.** Keep the rule on the input as a real HTML attribute and keep the signal for the message:
```html
<input name="password" type="password" required minlength="8" autocomplete="new-password" class="field w-full px-3.5 py-2.5 text-sm">
```
For environment branching, use a `<script server>` value in a normal `@if`, not `@env`.

**CHECK.**
```bash
grep -rnE '@(validate|env)\s*\(' resources --include='*.stx'   # must stay 0
grep -rn '@validate' dist/*.html                               # must be 0 — proof it never leaked
```

---

### 7.11 MAY — `@once`, but only inside a partial; it cannot deduplicate across sibling files

**WHY.** Two implementations exist and the earlier one wins. `processIncludes` (`process.js:571`) handles `@once` at `includes.js:250-256` with the key:

```js
const contentHash = content.trim(), onceKey = `${filePath}:${contentHash}`;
```

`filePath` is the file currently being processed, and nested includes are processed under the **partial's** path (`includes.js:624`). So `@once` deduplicates a block inside a partial that is included N times. It does **not** deduplicate identical blocks in N different page files — the keys differ. Whatever survives to `process.js:590` is then stripped by `processOnceDirective` (`misc-directives.js:97-98`, a bare `replace(…, "$1")`), which is why a stray `@once` never errors.

**Correction to audit finding 59:** its proposed fix — `@once` around the byte-identical `<style>` blocks at `resources/views/compare/*.stx:12-17` (8 separate files) — cannot work. Those must first move into one partial; `@once` inside that partial is then correct and necessary.

**CHECK.** Manual review plus:
```bash
# every @once must live under resources/partials/
grep -rln '@once' resources --include='*.stx' | grep -v '^resources/partials/'
```

---

### 7.12 MUST — `@json` in markup only; never inside a `<script>` body

**WHY.** In markup, `@json` (`misc-directives.js:3-95`, wired `process.js:589`) escapes `<`, `>`, `&`, U+2028 and U+2029 (`misc-directives.js:88`). Verified:

```
in:  <div data-x='@json(stack)'>   stack = 'a </script><b>x</b> & c'
out: <div data-x='"a \u003c/script\u003e\u003cb\u003ex\u003c/b\u003e \u0026 c"'>
```

Inside a `<script>` body the escaping is undone. `processScriptSetup` (`signal-processing.js:654`, run from `processSignals` at `process.js:610`) transpiles the script *after* `@json` ran, and the transpiler normalises `\u003c` back to `<`. Verified:

```
in:  <script>const stackText = @json(stack)</script>   stack = 'a </script><img src=x> b'
out: <script data-stx-scoped>… const stackText = "a </script><img src=x> b"; …
```

The `</script>` survives, the HTML parser ends the block there, and everything defined after it ceases to exist.

**WRONG** — `resources/views/issue/[id].stx:111` + `:348` hand-roll the same unsafe shape, on a value (a captured stack trace) that an attacker controls:

```js
const stackJson = JSON.stringify(stack)   // issue/[id].stx:111
```
```html
const stackText = {!! stackJson !!}       <!-- issue/[id].stx:348 -->
```

**RIGHT.** For markup — attributes, `data-*`, JSON-LD `<script type="application/ld+json">` (not a JS script body) — use `@json(expr)` and delete the hand-rolled `JSON.stringify`. For a JS script body, use the base64 bridge that `resources/views/settings.stx:145` already defines and `settings.stx:123-143` documents at length:

```js
function b64(value) {
  return JSON.stringify(Buffer.from(JSON.stringify(value ?? ''), 'utf8').toString('base64'))
}
```

**CHECK.**
```bash
# @json or {!! !!} inside a script body
awk '/<script/{s=1} /<\/script>/{s=0} s && (/@json\(/ || /\{!!/) {print FILENAME":"FNR": "$0}' $(grep -rl '' resources --include='*.stx')
```
Currently flags `issue/[id].stx:348`, `settings.stx:186-190` (the latter is the safe base64 form). Any new hit that is not base64-wrapped is a bug.

---

### 7.13 MUST NOT — `@suspense`, `@errorBoundary`, `@transition`, `@defer`, `@teleport`, `@keepAlive`, `@stream`, `@virtualList`

**WHY.** Every one of these expands to markup **plus an inline `<script>` that drives the DOM by hand** — the exact thing rule 3 of the house standard forbids, wrapped in a directive:

* `suspense.js:38-48` — `document.querySelector('[data-suspense-id="…"]')` ×3, then `style.display` toggling.
* `error-boundaries.js:38` — same shape, `data-boundary-content` / `data-boundary-fallback` with `style="display: none;"`.
* `transitions.js:99-101` — `document.querySelector('[data-transition-id="…"]')` plus a `MutationObserver` calling `window.STX?.transition?.enter`, a global that is not part of the signals runtime.

None of them are signal-aware: they toggle raw `display` on ids generated by `Math.random()` (`transitions.js:88`, `suspense.js:3`), so an SPA container swap orphans the listeners. The signals runtime already ships the reactive equivalents — `:show` (`signals.js:2012`), `@if=` (`signals.js:1681`), and a native `<Suspense>` boundary bound at `signals.js:1958+` that aggregates `useQuery`/`useFetch` state.

Audit finding 59's own recommendation agrees for the async pair: the `Loading…` panels at `dashboard.stx:397`, `settings.stx:738`, `projects/index.stx:141` are server-rendered auth gates, not async children, so `@suspense` is the wrong tool there too. `@memo` (`misc-directives.js:100-135` → `signals.js:1566-1567`) is the one member of this family that is purely declarative and MAY be used.

**CHECK.**
```bash
grep -rnE '@(suspense|errorBoundary|transition|defer|teleport|keepAlive|stream|virtualList|virtualGrid|infiniteList|client|static)\b' resources --include='*.stx'
```
Must stay 0. If a hit appears, confirm the generated output with `grep -c 'document.querySelector' dist/<page>.html` before and after.

## 8. No vanilla JS — the strict-mode mandate

stx ships a client-script DOM validator. bughq has never turned it on. `config/ui.ts` (79 lines, read in full) declares `componentsDir:10`, `layoutsDir:13`, `partialsDir:16`, `router:41`, `app:74` — and no `strict` key. The consequence is mechanical: `validateClientScript(content, filePath, options.strict)` runs on **every** non-server `<script>` body at `node_modules/@stacksjs/stx/dist/process.js:704`, but with `strict` undefined it resolves to `{ enabled: false }` at `script-validation.js:129` and the `if (errors.length > 0 && strictConfig.enabled)` guard at `script-validation.js:148` makes every violation a silent no-op. `defaultConfig` (`config.js:16-41`) has no `strict` key, and the serve path only forwards it when it exists — `bun-plugin-stx/dist/serve.js:9517` is literally `..."strict" in stxConfig && { strict: stxConfig.strict }`.

Running stx's own `PROHIBITED_DOM_PATTERNS` over `resources/**/*.stx` today (verified, not estimated):

| File | Distinct violation sites | Violating `<script>` blocks | Rules tripped |
| --- | ---: | ---: | --- |
| `resources/views/settings.stx` | 18 | 3 | `getElementById`, `document.cookie`, `window.location`, `window.confirm`, `setTimeout`, `location.href=`, `location.assign`, `location.replace` |
| `resources/views/dashboard.stx` | 15 | 3 | `document.cookie`, `window.location`, `location.assign`, `location.replace`, `getElementById`, `window.history` |
| `resources/views/issue/[id].stx` | 6 | 2 | `setTimeout`, `document.cookie`, `window.location`, `location.replace` |
| `resources/views/projects/index.stx` | 6 | 2 | `document.cookie`, `window.location`, `location.assign`, `location.replace` |
| `resources/views/projects/new.stx` | 5 | 1 | `document.cookie`, `window.location`, `location.assign`, `location.replace` |
| `resources/views/register.stx` | 4 | 2 | `document.cookie`, `querySelector`, `createElement` |
| `resources/views/account.stx` | 4 | 2 | `document.cookie`, `window.location`, `location.assign`, `location.replace` |
| `resources/views/login.stx` | 3 | 2 | `document.cookie`, `getElementById`, `window.location` |
| `resources/views/index.stx` | 3 | 1 | `querySelectorAll` |
| `resources/views/pricing.stx` | 1 | 1 | `location.assign` |
| `resources/components/AutofixPanel.stx` | 1 | 1 | `setTimeout` |
| **Total** | **66** | **20** | 12 of the 25 shipped rules |

Against that: `grep -rn 'useRef\|useEventListener\|useTimeout\|useInterval\|useCookie\|useSearchParams\|useLocalStorage\|useQuery\|useColorMode\|onMount\|onDestroy' resources/ --include='*.stx'` returns **0** across all 52 `.stx` files. `navigate()` is used exactly 3 times (`login.stx:43`, `pricing.stx:16`, `register.stx:56`). The framework's answer to every one of the 66 sites is already loaded in the page and already auto-imported.

---

### 8.1 MUST — turn `strict` on in `config/ui.ts` before writing another line of client script

**WHY.** `StrictModeConfig` is `{ enabled, failOnViolation?, allowPatterns? }` (`node_modules/@stacksjs/stx/dist/types/config-types.d.ts:214-218`), surfaced as `strict?: boolean | StrictModeConfig` at `config-types.d.ts:309`. `loadStxConfig` reads bughq's file via `alias: 'ui'` (`config.js:401-402`), so `config/ui.ts` is the one place this can live. With `enabled: true, failOnViolation: false` the validator `console.warn`s a per-file report with line numbers and the exact composable to use (`script-validation.js:150-155`); with `failOnViolation: true` it `throw`s (`script-validation.js:152`) — at render time, which on the SSR path means a 500 per request. Turn it on warning-first, then flip.

**WRONG** — `config/ui.ts:8-79`, the entire default export, with the key absent:

```ts
export default {
  componentsDir: 'resources/components',   // :10
  layoutsDir: 'resources/layouts',         // :13
  partialsDir: 'resources/partials',       // :16
  router: { container: 'main', interceptAllLinks: true },  // :41-43
  app: { head: { title: 'bughq' } },       // :74-77
} satisfies UiOptions
```

**RIGHT:**

```ts
export default {
  componentsDir: 'resources/components',
  layoutsDir: 'resources/layouts',
  partialsDir: 'resources/partials',

  // stx's client-script DOM guard. process.js:704 calls validateClientScript on
  // every non-server <script> body; without this key it resolves to
  // { enabled: false } (script-validation.js:129) and never reports anything.
  // failOnViolation throws from inside the render, so it stays off in prod.
  strict: {
    enabled: true,
    failOnViolation: process.env.NODE_ENV !== 'production',
    allowPatterns: [],
  },

  router: { container: 'main', interceptAllLinks: true },
  app: { head: { title: 'bughq' } },
} satisfies UiOptions
```

**Two things about `allowPatterns` you must know before using it.** The filter is `allowPatterns.some(a => message.includes(a) || pattern.source.includes(a))` (`script-validation.js:130-132`). It is **rule-global, not site-scoped** — there is no way to exempt one call site. And it is a substring match on the message, so `allowPatterns: ['location']` silently kills four rules at once (`window.location`, `location.href assignment`, `location.assign()`, `location.replace()`). Keep the array empty and fix the code.

**CHECK:**

```bash
grep -n "strict" config/ui.ts   # must print a `strict:` key
```

and the burn-down list, which runs stx's own validator and needs no config change:

```bash
bun -e '
const { validateClientScript: V } = await import("./node_modules/@stacksjs/stx/dist/script-validation.js")
let bad = 0
for await (const f of new Bun.Glob("resources/**/*.stx").scan(".")) {
  const src = await Bun.file(f).text()
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bserver\b/i.test(m[1])) continue
    try { V(m[2], f, { enabled: true, failOnViolation: true }) } catch (e) { bad++; console.log(e.message) }
  }
}
console.log("violating blocks:", bad); process.exit(bad ? 1 : 0)'
```

Today that exits 1 and prints `violating blocks: 20`. Gotcha: the line numbers it reports are **body-relative**, not file-relative — `script-validation.js:139-145` splits `content`, which is the script body only. `AutofixPanel.stx` reports `line: 180`; the `<script client>` opens at file line 10, so the real site is line 189. Add `(tag line − 1)`.

---

### 8.2 MUST — use this replacement table. Every row is a real bughq site

`PROHIBITED_DOM_PATTERNS` is 25 rules at `script-validation.js:1-127`. Each carries its own replacement in `suggestion`. Every replacement below is auto-imported into `<script client>` from `window.stx` — see `STX_AUTO_IMPORTS` at `client-script.js:143` (`onMount:152`, `onDestroy:153`, `useRef:154`, `navigate:155`, `useSearchParams:160`, `useQuery:162`, `useLocalStorage:166`, `useCookie:168`, `useEventListener:173`, `useInterval:178`, `useTimeout:179`, `useColorMode:185`), destructured at `client-script.js:334-340` as `var { … } = window.stx || window;`. **Do not `import` any of them.**

| Vanilla (banned) | stx replacement | Mechanism | Live bughq site |
| --- | --- | --- | --- |
| `document.getElementById()` | `ref="name"` + `useRef('name')` | `signals.js:1825-1828` (ref handler), `signals.js:926-935` (useRef) | `login.stx:172`, `settings.stx:513`, `dashboard.stx:577` |
| `document.querySelector(All)()` | `ref=` + `useRef`, or `:if`/`@foreach` on the markup | same | `register.stx:187,191`, `index.stx:135,139,142` |
| `document.createElement()` | markup + `@if` / `:if` | `signal-processing.js:201-265`, `signals.js:1681-1690` | `register.stx:193` |
| `el.innerHTML = x` | `:html="x"` | `signals.js:1817-1823` | 0 sites — keep it that way |
| `el.textContent = x` | `:text="x"` | `signals.js:1811-1815` | `login.stx:173`, `index.stx:136,143` |
| `el.style.display = …` | `:if` / `:show` / `:class` + Crosswind | `signals.js:1694-1697` (`:show`), `1802-1805` (`:class`) | `login.stx:173`, `index.stx:140`, `register.stx:188,195` |
| `el.classList.add/remove` | `:class="{ 'cls': cond }"` | `bindClass`, `signals.js:2155-2171` | 0 sites — keep it that way |
| `el.setAttribute(k, v)` | `:k="v"` | `signals.js:1784-1800` | `index.stx:137,144`, `register.stx:188` |
| `addEventListener` / `on*=` attr | `@click` / `@change` / `@input`, or `useEventListener()` | `signals.js:1830-1840`, `signals.js:3645-3652` | `dashboard.stx:429`, `StartMenu.stx:52` |
| `window.location.*`, `location.assign/replace/href=` | `navigate(url)` / `navigate(url, true)` | `signals.js:941-952` | 29 sites across 8 files |
| `window.history.replaceState` | `useSearchParams().set/setAll` | `signals.js:1004-1016` | `dashboard.stx:593` |
| `setTimeout` / `setInterval` | `useTimeout()` / `useInterval()` | `signals.js:3271-3300`, `3229-3268` | `settings.stx:203,406,512`, `issue/[id].stx:354`, `AutofixPanel.stx:189` |
| self-rescheduling poll | `useQuery(url, { refetchInterval })` or `useInterval` | `signals.js:1110-1113` | `AutofixPanel.stx:189` |
| `document.cookie = …` | `useCookie(name, opts)` | `signals.js:3568-3599` | 21 sites across 8 files |
| `localStorage.*` | `useLocalStorage(key, default)` | `signals.js:3526-3539` | 74 raw hits |
| `window.confirm()` | `window.stxConfirm(...)` | already used at `settings.stx:235-236`; fallback at `:237` is the violation | `settings.stx:237` |
| `document.title = …` | `useHead({ title })` | `signals.js:1119+`; already correct in bughq's server blocks | — |

---

### 8.3 MUST — never select an element; declare a `ref` and read it with `useRef()`

**WHY.** `useRef(name)` reads `componentScope.$refs[name]` (`signals.js:926-935`), populated by the `ref` / `:ref` / `x-ref` attribute handler at `signals.js:1825-1828`. `componentScope.$refs` is initialised at `signals.js:1224` and — critically for bughq, whose router swaps `<main>` — **preserved across SPA navigation** at `signals.js:5108-5109`. A `getElementById` cached in a closure is not; it points at a detached node after the first swap.

**WRONG** — `resources/views/settings.stx:504-519`. `dzTyped` is already a signal (`settings.stx:480`) and the input already carries `@input="dzType"` (`settings.stx:980`), yet the open handler reaches through the DOM and re-clears the field by hand:

```js
function dzOpen(which) {
  dzAction.set(which)
  dzTyped.set('')
  // …
  setTimeout(() => {
    const field = document.getElementById('dz-input')   // settings.stx:513
    if (field) {
      field.value = ''
      field.focus()
    }
  }, 20)
}
```

**RIGHT** — one ref, one composable timer, and `:model` doing the value mirror so `field.value = ''` becomes unrepresentable:

```stx
<!-- resources/views/settings.stx:980 -->
<input ref="dzInput" :model="dzTyped" type="text"
       class="field w-full px-3.5 py-2.5 text-sm mono mb-4"
       autocomplete="off" autocapitalize="off" spellcheck="false">
```

```js
const dzInput = useRef('dzInput')
// useTimeout starts on creation (signals.js:3294) and registers its own
// onDestroy(stop) at :3296 — park it, then re-arm per open.
const focusDz = useTimeout(() => dzInput.current?.focus(), 20)
focusDz.stop()

function dzOpen(which) {
  dzAction.set(which)
  dzTyped.set('')      // :model writes this back to the input; no field.value
  dzNote.set(null)
  dzBusy.set(false)
  focusDz.start()
}
```

`:model` two-way binding is dispatched at `signals.js:1699-1703` → `bindModel` at `signals.js:2069`. `dzType` (`settings.stx:528-530`) is then dead code — delete it and the `@input` attribute.

**CHECK:** `grep -rnE 'document\.(getElementById|querySelector|querySelectorAll|getElementsBy)' resources/ --include='*.stx'` → must be empty. Today: 8 hits.

---

### 8.4 MUST — bind events with directives; no `addEventListener`, no `on*=` attributes

**WHY.** `@click` / `@change` / `@input` / `@submit` are handled by the attribute dispatcher at `signals.js:1830-1840`, which parses modifiers (`@submit.prevent`, `@keydown.enter`) from the attribute name. For non-element targets (`window`, `document`) use `useEventListener(event, handler, { target })` — `signals.js:3645-3652` — which registers `onDestroy(() => target.removeEventListener(...))` for you. A DOM-0 `onchange=` attribute gets none of that, is invisible to the strict validator (it is not inside a `<script>` body, so the scan at `process.js:696-701` never sees it), and cannot reference the page's signals.

**WRONG** — `resources/views/dashboard.stx:429`, ~200 characters of inline JS in an attribute, doing by hand exactly what the sibling page does with a directive:

```stx
<select onchange="document.cookie = 'bughq_project=' + encodeURIComponent(this.value) + '; path=/; max-age=31536000; samesite=lax' + (location.protocol === 'https:' ? '; secure' : ''); location.href = '{{ pageUrl({ page: 1 }) }}'"
        class="panel mono px-3 py-1.5 text-sm text-muted">
```

**RIGHT** — mirror `resources/views/settings.stx:750`, which already does this correctly:

```stx
<select @change="switchProject" class="panel mono px-3 py-1.5 text-sm text-muted">
  @foreach (projects as p)
    <option value="{{ p.id }}" {{ p.id === projectId ? 'selected' : '' }}>{{ p.name }}</option>
  @endforeach
</select>
```

```js
// <script client> — useCookie and navigate are auto-imported
const activeProject = useCookie('bughq_project', { maxAge: 31536000, sameSite: 'Lax' })

function switchProject(e) {
  activeProject.set(e.target.value)
  navigate('/dashboard')
}
```

`useCookie` serialises `path=/`, `SameSite=Lax` and adds `Secure` on https itself (`signals.js:3582-3596`), and `encodeURIComponent` is its default encoder (`signals.js:3570`) — the hand-written string is byte-for-byte reimplementation.

**CHECK:**

```bash
grep -rnE '\son(click|change|input|submit|keydown|keyup|focus|blur|load|error)=' resources/ --include='*.stx'
grep -rn 'addEventListener' resources/ --include='*.stx'
```

Today: 17 DOM-0 handlers (16 in the dead scaffolding under `resources/components/`, 1 live at `dashboard.stx:429`), 0 `addEventListener`. Both greps must return empty.

---

### 8.5 MUST — express visual state as `:class` / `:if` / `:show`, never by assigning `.style.*` or `.classList`

**WHY.** `:class` accepts the object form `{ 'a b': cond }` and splits multi-token keys before touching `classList` (`bindClass`, `signals.js:2155-2171`); `:style`, `:show` and `:if` are dispatched at `signals.js:1806-1809`, `1694-1697`, `1681-1690`. All four re-run inside an `effect`, so they track the signal. An imperative `el.style.display = 'none'` runs once and is erased by the next `<main>` swap. It also writes raw CSS from JS, which violates the Crosswind-only rule from Chapter 5 twice over.

**WRONG** — `resources/views/index.stx:132-147`. This script exists on **1** of the 24 pages that include `SiteNav`, so on the other 23 a signed-in visitor still sees "Log in / Sign up":

```stx
<script>
  (function () {
    if (!localStorage.getItem('token')) return
    document.querySelectorAll('[data-auth-login]').forEach(function (a) {
      a.textContent = 'Dashboard'                 // index.stx:136
      a.setAttribute('href', '/dashboard')        // index.stx:137
    })
    document.querySelectorAll('[data-auth-signup]').forEach(function (a) {
      a.style.display = 'none'                    // index.stx:140
    })
  })()
</script>
```

**RIGHT** — the condition moves into `resources/partials/SiteNav.stx` (lines 44-45, 70-71, where the `data-auth-*` markers currently sit), so all 24 pages get it, and the `data-auth-*` markers disappear:

```stx
<script client>
const loggedIn = state(!!localStorage.getItem('token'))
</script>

<StxLink to="/dashboard" :if="loggedIn()"  class="nav-link">Dashboard</StxLink>
<StxLink to="/login"     :if="!loggedIn()" class="nav-link">Log in</StxLink>
<StxLink to="/register"  :if="!loggedIn()" class="nav-cta">Sign up</StxLink>
```

Use the **attribute** form `:if="expr"` for signal-driven conditionals, not the block form. bughq already does this correctly at `dashboard.stx:413` (`@if="!dismissed().includes('{{ inv.token }}')"`). The block form `@if (...) … @endif` is server-side (`process.js`), and only becomes reactive when `convertSignalDirectivesToAttributes` recognises the condition as client-reactive and rewrites it to an attribute (`signal-processing.js:201-265`, gated by `conditionIsClientReactive` at `:244` and `:257`). Attribute form is unconditional; use it and stop guessing.

**CHECK:** `grep -rnE '\.(classList|innerHTML|outerHTML|textContent)\b|\.style\.' resources/ --include='*.stx'` → must be empty. Today: 10 hits (`login.stx:173`, `index.stx:136,140,143`, `register.stx:188,195`, plus prop-name false positives in `InputGroup.stx:12,28` — read them, do not blanket-suppress).

---

### 8.6 MUST — build DOM in markup; `createElement` and `innerHTML` are banned outright

**WHY.** There is no legitimate use in a `.stx` file. The template *is* the DOM description; `@if`/`:if`/`@foreach` are the conditional and repeated cases. `createElement` additionally forces you to write CSS in a string, which is how `register.stx` ended up duplicating the page's own design tokens.

**WRONG** — `resources/views/register.stx:181-202`. Three violations stacked: `querySelector` twice, `createElement`, a 200-char `cssText`, and an `insertBefore`:

```js
var p = new URLSearchParams(location.search)
var email = p.get('email')
if (email) {
  var el = document.querySelector('input[name="email"]')                    // :187
  if (el) { el.value = email; el.setAttribute('readonly', 'readonly'); el.style.opacity = '0.85' }  // :188
}
if (p.get('invite')) {
  var form = document.querySelector('form')                                 // :191
  if (form) {
    var hint = document.createElement('p')                                  // :193
    hint.textContent = "You've been invited to a project — sign up to join it."
    hint.style.cssText = 'font-size:13px;margin:0 0 14px;…color:var(--accent);…'  // :195
    form.parentNode.insertBefore(hint, form)                                // :196
  }
}
```

**RIGHT** — the whole trailing `<script>` is deleted. Two signals in the existing `<script client>` (which already holds `error` and `loading`), and the banner becomes markup above the form at `register.stx:130`:

```js
// <script client> — useSearchParams resyncs on popstate and stx:navigate (signals.js:999-1000)
const params = useSearchParams()
const invitedEmail = derived(() => params.get('email') || '')
const isInvited = derived(() => !!params.get('invite'))
```

```stx
<p :if="isInvited()" class="text-[13px] mb-3.5 px-3 py-2.5 rounded-lg text-accent bg-accent/10 border border-accent/35">
  You've been invited to a project — sign up to join it.
</p>

<form @submit="handleSubmit" class="space-y-4">
  @if (error())
    <div class="err text-sm rounded-lg px-3 py-2">{{ error() }}</div>
  @endif
  <!-- resources/views/register.stx:141 -->
  <input name="email" type="email" required autocomplete="email"
         :value="invitedEmail()" :readonly="isInvited()"
         :class="{ 'opacity-85': isInvited() }"
         placeholder="you@example.com" class="field w-full px-3.5 py-2.5 text-sm">
```

`:readonly` goes through the generic attribute binder at `signals.js:1784-1800`, which removes the attribute on `false` and sets it bare on `true` — the correct boolean-attribute semantics `setAttribute('readonly','readonly')` fakes.

The identical rewrite applies to `resources/views/login.stx`: delete the permanently-hidden `<div id="oauth-error" … style="display:none">` at `login.stx:139` and the whole script at `login.stx:167-176`, then add two lines to the `<script client>` that already exists at `login.stx:13`:

```js
const error = state('')                       // login.stx:16 — already there
const params = useSearchParams()
if (params.get('error')) error.set(params.get('error'))
```

The file already renders it: `@if (error())` at `login.stx:118-120`.

**CHECK:** `grep -rnE 'createElement|innerHTML|outerHTML|insertAdjacentHTML|appendChild|insertBefore' resources/ --include='*.stx'` → must be empty. Today: 2 hits, both in `register.stx`.

---

### 8.7 MUST — navigate with `navigate()`, and never emit a redirect as markup

**WHY.** `navigate(url, forceReload)` at `signals.js:941-952` delegates to `window.stxRouter.navigate` when the router is live and falls back to `location.href` when it is not — it is strictly safer than the hand-written form, never worse. `config/ui.ts:41-43` pins `router: { container: 'main', interceptAllLinks: true }` with a 20-line comment explaining that the SPA behaviour is load-bearing; `location.assign` throws that away (the fragment fetch, the 5-minute response cache at `stx-router/dist/client.js:342-370`, the View Transition swap at `client.js:772-783`, the progress bar at `client.js:913-925`). For a genuine document load pass `navigate(url, true)` — `signals.js:942-944` — which is the *declared* full load, not an accidental one.

**WRONG (a)** — `resources/views/settings.stx:214-217` and `resources/views/account.stx:25-35`, in-shell navigations that discard the router:

```js
function switchProject(e) {
  document.cookie = `bughq_project=${encodeURIComponent(e.target.value)}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
  window.location.href = '/settings'     // settings.stx:216
}
```

**WRONG (b)** — `resources/views/dashboard.stx:402` and `resources/views/settings.stx:742`: a redirect shipped as *page content*, from a condition the server block already computed:

```stx
@if (user && needsOnboarding)
  <div class="text-center py-24 text-sm text-subtle">Setting up your workspace…</div>
  <script>window.location.replace('/projects/new')</script>
@endif
```

**RIGHT (a):**

```js
const activeProject = useCookie('bughq_project', { maxAge: 31536000, sameSite: 'Lax' })

function switchProject(e) {
  activeProject.set(e.target.value)
  navigate('/settings')
}
```

**RIGHT (b):** delete the `<script>` and the surrounding `@if` entirely. `needsOnboarding` is resolved in the `<script server>` block; redirect there with a 302 before any HTML is produced. A `<script>` tag emitted as template output is not a redirect — it is a rendered page that then tears itself down, and it costs a full document load on a route the server already knew was wrong.

**WRONG (c)** — `resources/views/dashboard.stx:588-594`, raw history manipulation to scrub a query param:

```js
var qs = new URLSearchParams(window.location.search)
if (qs.get('project')) {
  document.cookie = 'bughq_project=' + encodeURIComponent(qs.get('project')) + '; …'
  qs.delete('project')
  var rest = qs.toString()
  window.history.replaceState(null, '', window.location.pathname + (rest ? '?' + rest : ''))
}
```

**RIGHT (c):** `useSearchParams()` owns history rewriting (`signals.js:1004-1016`) and resyncs its signal after every write:

```js
const params = useSearchParams()
const activeProject = useCookie('bughq_project', { maxAge: 31536000, sameSite: 'Lax' })
if (params.get('project')) {
  activeProject.set(params.get('project'))
  params.setAll({ project: undefined })   // rewrites the URL, then syncFromUrl()
}
```

**External URLs are not an exception.** `resources/views/pricing.stx:26` does `location.assign(data.url)` to reach Stripe. Write `navigate(data.url, true)` — same document load, one declared API, one fewer strict violation.

**CHECK:** `grep -rnE 'window\.location|window\.history|location\.(href\s*=|assign|replace)' resources/ --include='*.stx'` → must match only the sites declared under rule 8.11. Today: 29 `window.location`, 11 `location.replace`, 7 `location.assign`, 1 `location.href=`, 1 `window.history`.

---

### 8.8 MUST — every timer is a composable; a bare `setTimeout` is a leak

**WHY.** `useTimeout` registers `onDestroy(stop)` at `signals.js:3296`; `useInterval` registers `onDestroy(pause)` at `signals.js:3258`; `useQuery`'s `refetchInterval` pairs its `setInterval` with `onDestroy(() => clearInterval(id))` at `signals.js:1110-1113`. Those destroy callbacks actually fire: the runtime flushes `destroyCallbacks` on the `stx:load` event the router emits after every swap (`signals.js:5181-5185`), and per-scope callbacks on subtree disposal (`signals.js:5037-5041`). A bare `setTimeout` is registered nowhere and cancelled by nothing.

**WRONG** — `resources/components/AutofixPanel.stx:178-197`. A self-rescheduling poll against an authenticated endpoint that nothing can stop. `config/ui.ts:41` swaps `<main>`, so navigating off `/issue/[id]` destroys the panel's DOM while the timer chain keeps hitting `/api/issues/:id/autofix` for the life of the tab:

```js
async function loadAutofix(schedule = true) {
  try {
    const response = await fetch(`/api/issues/${encodeURIComponent(autofixIssueId)}/autofix`, { headers: authHeaders() })
    // …
    if (schedule && activeRun(data.run)) setTimeout(() => loadAutofix(true), 2200)   // :189
  }
  // …
}
```

**RIGHT** — one `useInterval`, gated by an `effect` so it still only polls while a run is active, and torn down by the framework:

```js
const poll = useInterval(2200)                        // signals.js:3229
poll.subscribe(() => loadAutofix())                   // signals.js:3260-3266
effect(() => {
  if (activeRun(autofixState()?.run)) poll.resume()
  else poll.pause()
})

async function loadAutofix() {
  try {
    const response = await fetch(`/api/issues/${encodeURIComponent(autofixIssueId)}/autofix`, { headers: authHeaders() })
    // … no rescheduling; the interval owns cadence
  }
  finally { autofixLoading.set(false) }
}
```

**WRONG (b)** — the "Copied" label reset, duplicated at `settings.stx:200-212` and `issue/[id].stx:351-360`:

```js
function copyText(which, text) {
  const mark = () => {
    copied.set(which)
    setTimeout(() => { if (copied() === which) copied.set('') }, 1400)   // settings.stx:203
  }
  // …
}
```

**RIGHT (b)** — one timer for the page, re-armed per copy. Note `useTimeout` starts on creation (`signals.js:3294`), so park it:

```js
const copied = state('')
const resetCopied = useTimeout(() => copied.set(''), 1400)
resetCopied.stop()

function copyText(which, text) {
  const mark = () => { copied.set(which); resetCopied.start() }
  if (navigator.clipboard?.writeText && text) navigator.clipboard.writeText(text).then(mark, mark)
  else mark()
}
```

**CHECK:** `grep -rnE '(^|[^.\w])(setTimeout|setInterval|clearTimeout|clearInterval)\s*\(' resources/ --include='*.stx'` → must be empty. Today: 5 sites (`settings.stx:203,406,512`, `issue/[id].stx:354`, `AutofixPanel.stx:189`). Additionally, `grep -rn 'onDestroy' resources/ --include='*.stx'` currently returns 0 across 52 files — anything that starts a timer, a listener, or an observer and does not appear in that grep is a leak by definition.

---

### 8.9 MUST — cookies and storage go through `useCookie` / `useLocalStorage`

**WHY.** `useCookie(name, opts)` (`signals.js:3568-3599`) returns a signal, writes through an `effect` on change, and serialises `path`, `max-age`, `SameSite` and conditional `Secure` at `signals.js:3582-3596`. Setting it to `''` deletes the cookie (`signals.js:3585`). bughq re-types that serialisation string at 21 sites; every one of them is a chance to drop `secure` or mistype `max-age`.

**WRONG** — `resources/views/account.stx:25-35`, one of eight files repeating the same pattern:

```js
function logout() {
  const token = localStorage.getItem('token')
  try { fetch('/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }) }
  catch { }
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  document.cookie = 'bughq_token=; path=/; max-age=0'   // account.stx:33
  window.location.assign('/login')                       // account.stx:34
}
```

**RIGHT:**

```js
const authToken = useCookie('bughq_token', { maxAge: 2592000, sameSite: 'Lax' })

function logout() {
  fetch('/logout', { method: 'POST', headers: { Authorization: `Bearer ${authToken()}` } }).catch(() => {})
  authToken.set('')          // signals.js:3585 emits max-age=0
  navigate('/login')
}
```

**Blunt caveat on `useLocalStorage`.** It `JSON.parse`s on read and `JSON.stringify`s on write (`signals.js:3527,3531`). bughq stores the raw token string (`login.stx:36`: `localStorage.setItem('token', token)`), so `useLocalStorage('token', '')` will throw on the existing value. Migrating means writing through the composable at *every* site in the same commit — `login.stx:36`, `register.stx`, `dashboard.stx:230-231`, `account.stx:31-32`, `settings.stx`, `projects/*` — or leaving `token` as a raw read and only migrating `user`, which is already JSON. Pick one and do it wholesale; a half-migration corrupts sessions.

Also note the validator's pattern is `/window\.localStorage/` (`script-validation.js:63`), so bughq's 74 bare `localStorage.*` hits are **invisible to strict mode**. See rule 8.10.

**CHECK:** `grep -rn 'document.cookie' resources/ --include='*.stx'` → must be empty (today: 21). `grep -rnE '(^|[^.\w])(localStorage|sessionStorage)\.' resources/ --include='*.stx'` → manual review against the migration plan above (today: 74).

---

### 8.10 MUST — cover the validator's blind spots with a second grep

**WHY.** `strict` is necessary, not sufficient. Four categories of vanilla JS pass it cleanly, and you must know all four:

| Blind spot | Reason | bughq count |
| --- | --- | --- |
| Inline `on*=` attributes | The scan at `process.js:696-701` only walks `<script>` bodies | 17 |
| Element mutation — `classList`, `style.*`, `innerHTML`, `textContent`, `setAttribute`, `appendChild` | Not in `PROHIBITED_DOM_PATTERNS` at all (`script-validation.js:1-127` is 25 rules, none element-level) | 42 grep-B hits |
| Bare globals — `localStorage.x`, `location.search`, `location.protocol` | Patterns require the `window.` prefix (`script-validation.js:48,63,68`); `location.href/assign/replace` are the only bare forms covered (`:113,118,123`) | 63 |
| `<script server>` blocks | Skipped by design via `skipAttrs` (`process.js:697-699`) — correct, server code has no DOM |

**CHECK** — run both, always, and treat grep-B/C output as a work list, not noise:

```bash
# B: element mutation + DOM-0 handlers.  Today: 42 hits
grep -rnE '\.(classList|innerHTML|outerHTML|textContent)\b|\.style\.|\.(setAttribute|appendChild|insertBefore|removeChild)\(|\son(click|change|input|submit|keydown|keyup|focus|blur|load|error)=' resources/ --include='*.stx'

# C: bare browser globals.  Today: 63 hits across 13 files
grep -rnE '(^|[^.\w])(localStorage|sessionStorage|location)\.' resources/ --include='*.stx'
```

Wire A (rule 8.1), B and C into one script and make it a `package.json` task so CI runs it; the validator alone certifies nothing.

---

### 8.11 MAY — exactly four calls stay native; declare them or delete them

Not every full document load is a bug. These are the ones that are deliberate, all in **pre-hydration blocking scripts** whose entire job is to leave before the page is worth rendering:

| Site | Call | Why it is native |
| --- | --- | --- |
| `dashboard.stx:565`, `settings.stx:1002`, `projects/index.stx:186`, `projects/new.stx:15`, `issue/[id].stx:790`, `account.stx:194` | `location.replace('/login')` | Runs before the runtime and the router exist; `navigate()` would fall through to `location.href` anyway (`signals.js:949-951`) and add a history entry `replace` deliberately avoids |
| `dashboard.stx:570`, `settings.stx:1005`, `issue/[id].stx:793`, `projects/new.stx` | `window.location.reload()` | The cookie mirror just landed; the *server* render has to be redone |
| `dashboard.stx:580` | `location.replace('/login')` after clearing dead credentials | Same pre-paint guard |
| `pricing.stx:26` | — | **Not** an exception. Rewrite as `navigate(data.url, true)` |

**How to declare them.** Because `allowPatterns` is rule-global (`script-validation.js:130-132`), suppressing `location.replace` project-wide to permit six guard scripts also permits every future accident. The enforceable shape is the opposite: move the guard into **one** partial — `resources/partials/AuthGuard.stx` — `@include` it from the six app views, and keep `allowPatterns: []`. Then the strict report names exactly one file, and any second file appearing in that report is a real regression.

**CHECK:** manual review of every remaining hit from rule 8.7's grep. The test is mechanical: *is this script positioned before hydration and does its only job is to leave the page?* If yes, it belongs in `AuthGuard.stx`. If it runs inside a handler, an `async` continuation, or a `.then()` — as `settings.stx:216`, `settings.stx:594`, `account.stx:34`, `projects/new.stx:57`, `dashboard.stx:233`, `dashboard.stx:271` all do — the router is live and it is a violation.

## 9. Navigation and routing

bughq ships an SPA router it barely uses. `config/ui.ts:41-44` pins `router: { container: 'main', interceptAllLinks: true }`, and 263 internal links still render as plain `<a href="/…">` against 27 `<StxLink>` — all 27 confined to 10 app-shell files, none in `resources/partials/SiteNav.stx`, `SiteFooter.stx` or any of the 24 marketing pages. The router is doing SPA navigation *by accident*, through a compatibility flag, instead of *by declaration*. This chapter fixes that.

Everything below is verified against stx 0.2.113 (`node_modules/@stacksjs/stx/dist`) and stx-router (`node_modules/stx-router/dist/client.js`).

---

### 9.1 MUST — every same-origin navigation is `<StxLink to="…">`; a plain `<a>` is an opt-out you must justify

**RULE.** Write `<StxLink to="/path">`. Never write `<a href="/path">` for an internal route unless the destination matches one of the four exemptions in §9.2. `StxLink` needs no import, no registration, and no config.

**WHY.** `StxLinkBuiltin` is registered unconditionally at boot — `node_modules/@stacksjs/stx/dist/builtins/index.js:24` (`registry.registerBuiltin(StxLinkBuiltin)`), aliases `StxLink` and `stx-link` (`builtins/stx-link.js:15`). It renders a plain `<a>` plus three data attributes (`builtins/stx-link.js:24-26`): `data-stx-link`, `data-stx-active-class`, `data-stx-exact-active-class`.

Those attributes are the entire contract with the router, and the router treats them as a first-class path:

| Router behaviour | Code | Plain `<a>` | `<StxLink>` |
|---|---|---|---|
| Click interception | `client.js:808` `e.target.closest('[data-stx-link]')` | only via the `interceptAllLinks` fallback at `client.js:809-812`, which then runs `shouldIntercept()` (`client.js:787-798`) and can bail | matched first, **unconditionally**, `shouldIntercept()` never consulted |
| Hover prefetch | `client.js:830-833` — `closest('[data-stx-link]')`, `return` if absent | never | always (when `o.prefetch`, default `true` at `client.js:9`) |
| Active class | `client.js:858` (`a.hasAttribute('data-stx-link')`) and `client.js:865-880` (`querySelectorAll('[data-stx-link]')`) | never | yes |

So 263 anchors in bughq forfeit prefetch and active state outright, and their SPA behaviour depends entirely on `interceptAllLinks: true` — a flag `config/ui.ts:26-30` already documents as a liability.

Props are resolved server-side before render: a single `{{ … }}` becomes `resolved.static` at `component-renderer.js:237-254`, a mixed literal is interpolated at `component-renderer.js:255-273`. Both work in `to=`. Components are processed *after* `@include` (`process.js:571-572`), so `StxLink` resolves inside `SiteNav.stx` and `SiteFooter.stx` exactly as it does in a page.

**WRONG** — `resources/partials/SiteNav.stx:39-41, 44-45` (the nav included on all 24 marketing pages via `resources/views/index.stx:51`):

```html
      <a href="/pricing">Pricing</a>
      <a href="/docs">Docs</a>
      <a href="https://github.com/stacksjs/bughq">GitHub</a>
    </div>

    <a class="nav-login" data-auth-login href="/login">Log in</a>
    <a class="btn nav-cta primary sm" data-auth-signup href="/register">Sign up</a>
```

**RIGHT:**

```html
      <StxLink to="/pricing" activeClass="nav-current">Pricing</StxLink>
      <StxLink to="/docs" activeClass="nav-current">Docs</StxLink>
      <a href="https://github.com/stacksjs/bughq">GitHub</a>
    </div>

    <StxLink to="/login" class="nav-login" data-auth-login>Log in</StxLink>
    <StxLink to="/register" class="btn nav-cta primary sm" data-auth-signup>Sign up</StxLink>
```

The GitHub link stays a plain `<a>` (§9.2). `data-auth-login` / `data-auth-signup` survive: `stx-link.js:29-37` passes through every attribute not in `consumedStatic` (`to`, `class`, `className`, `activeClass`, `exactActiveClass`, `prefetch`).

**CHECK:**

```bash
grep -rnE '<a [^>]*href="/' resources/views resources/partials resources/components \
  | grep -vE 'data-no-router|href="/api/'
# bughq today: 263 hits. Target: 0.
```

Convert `SiteNav.stx` (35) and `SiteFooter.stx` (26) first — 61 of the 263, covering the nav and footer of every marketing page.

---

### 9.2 MUST — the only four legitimate plain-`<a>` cases

**RULE.** A plain `<a>` is correct **only** in these four cases. Everything else is a defect.

| Case | Markup | Why the router must not handle it |
|---|---|---|
| External host | `<a href="https://github.com/…">` | `client.js:791` `href.startsWith('http')` → `shouldIntercept` false; `client.js:816` skips even a `[data-stx-link]` |
| `mailto:` / `tel:` / in-page `#hash` | `<a href="mailto:…">` | same two lines |
| New tab or download | `<a target="_blank">`, `<a download>` | `client.js:792`, `client.js:793`, `client.js:817` |
| Server redirect endpoint | `<a href="/api/auth/github/redirect" data-no-router>` | a fragment `fetch` consumes the 302 instead of following it; the only recovery is the error path at `client.js:371-373` (`.catch(… location.href=url)`) |

**WHY.** `data-no-router` (and its alias `data-stx-no-router`) is honoured at `client.js:793` — **but only inside `shouldIntercept()`**, which is only reached from `client.js:809` when `interceptAllLinks` is on and the element is *not* a `[data-stx-link]`. See §9.3.

**WRONG** — `resources/views/login.stx:113`, one of 8 identical app→marketing opt-outs (`account.stx:119`, `account.stx:183`, `pricing.stx:88`, `register.stx:126`, `reset-password.stx:117`, `forgot-password.stx:96`, `projects/new.stx:120`):

```html
      <a href="/" data-no-router class="wordmark text-2xl">bughq</a>
```

This is not a real exemption. It exists purely because the 23 marketing pages carry their own `<!DOCTYPE>` and therefore never get a layout (`process.js:311-312`: `const hasDoctype = /<!DOCTYPE\s/i.test(output)` … `if (!hasDoctype || hasSections)` gates all layout resolution), so they report the same layout group as app pages (`serve.js:10120-10121` defaults `pageLayout` to `"default"`), so `checkLayoutChange()` (`client.js:248-266`) misclassifies app→marketing as a same-layout fragment swap and `client.js:568-580` — the only code that copies `<link rel="stylesheet">` across — never runs. The page arrives unstyled. That is a layout defect (Chapter on layouts), not a routing decision.

**RIGHT** — after marketing pages `@extends('marketing')`:

```html
      <StxLink to="/" class="wordmark text-2xl">bughq</StxLink>
```

and the 4 OAuth links keep their opt-out permanently, with the reason stated inline:

```html
      {{-- Server 302 to the OAuth provider. Unconditional opt-out: a fragment
           fetch swallows the redirect (stx-router client.js:371-373). Not a
           marketing-shell artefact — never remove this. --}}
      <a href="/api/auth/github/redirect" data-no-router class="oauth-btn …">
```

**CHECK:**

```bash
# Any data-no-router that is not an /api/ redirect is a defect (8 today, target 0)
grep -rnE '<a [^>]*data-no-router' resources/views | grep -v 'href="/api/'
```

---

### 9.3 MUST NOT — put `data-no-router` on a `<StxLink>`

**RULE.** `data-no-router` on a `<StxLink>` is silently ignored. If a link must not be intercepted, it must be a plain `<a>`. There is no middle ground.

**WHY.** `client.js:808` matches `[data-stx-link]` and assigns `link` before the `interceptAllLinks` branch at `:809` ever runs; `shouldIntercept()` — the only reader of `data-no-router` (`client.js:793`) — is never called for it. The handler then `preventDefault()`s at `client.js:818`.

bughq already knows this — it is documented at `resources/views/layouts/default.stx:16-20` — but nothing enforces it.

**WRONG** (would compile, would do the opposite of what it says):

```html
<StxLink to="/api/auth/github/redirect" data-no-router>Continue with GitHub</StxLink>
```

**RIGHT:**

```html
<a href="/api/auth/github/redirect" data-no-router>Continue with GitHub</a>
```

**CHECK:**

```bash
grep -rn '<StxLink[^>]*data-\(stx-\)\?no-router' resources/   # must return nothing
```

---

### 9.4 MUST — filter tabs, pagination and any query-string link are `<StxLink>`

**RULE.** Links whose href differs from the current URL only by query string **must** be `<StxLink>`. A plain `<a>` here is not merely suboptimal — it is broken today.

**WHY.** `shouldIntercept()` returns `false` when `href === location.pathname` (`client.js:795`). `pageUrl()` at `resources/views/dashboard.stx:92-103` deliberately omits every default, so the default filter state serialises to the bare string `/dashboard`. From `/dashboard?status=resolved`, the "Unresolved" tab's href is `/dashboard`, which equals `location.pathname` → not intercepted → full document reload. Same for "Prev" from `/dashboard?page=2` (`prevHref` = `pageUrl({page:1})` = `/dashboard`, `dashboard.stx:154`).

`StxLink` bypasses that check entirely (`client.js:808`), and `navigate()` compares *full hrefs* (`client.js:300` `t.href===location.href`), so `/dashboard` vs `/dashboard?status=resolved` correctly navigates.

**WRONG** — `resources/views/dashboard.stx:450-458` and `:518`/`:524`:

```html
        @foreach (statusTabs as f)
          <a href="{{ f.href }}"
             class="pill px-3.5 py-1.5 text-sm font-medium border"
             style="{{ f.key === statusFilter ? 'color: #fff; background: var(--accent); border-color: var(--accent)' : 'color: var(--text-2); border-color: var(--border)' }}">{{ f.label }}</a>
        @endforeach
```

**RIGHT** — swap the tag, keep the server-computed active state as a class (see §9.5 for why `activeClass` cannot replace it), and drop the inline style ternary per the no-vanilla-CSS rule:

```html
        @foreach (statusTabs as f)
          <StxLink to="{{ f.href }}"
                   class="pill px-3.5 py-1.5 text-sm font-medium border {{ f.key === statusFilter ? 'pill-on' : 'pill-off' }}"
                   aria-current="{{ f.key === statusFilter ? 'page' : 'false' }}">{{ f.label }}</StxLink>
        @endforeach
```

Pagination (`dashboard.stx:518`, `:524`) converts the same way:

```html
              <StxLink to="{{ pager.prevHref }}" class="pill px-3 py-1.5 text-xs font-medium border text-muted border-line">&larr; Prev</StxLink>
```

**CHECK:**

```bash
# any anchor whose href is a server expression is almost always a route link
grep -rn '<a href="{{' resources/views   # dashboard.stx:450,456,518,524 today
```

---

### 9.5 MUST — treat `activeClass` as pathname-only, and author `aria-current` yourself

**RULE.** `activeClass` / `exactActiveClass` compare **`location.pathname` only**. They cannot express query-string state, and they never set `aria-current`. Server-render the authoritative active state; use `activeClass` only for pathname-level navs (site nav, sidebar).

**WHY.** Two functions run after every navigation, in this order — `client.js:447-448` (fragment swap) and `client.js:708-709` (document swap):

1. `updateNav(url)` (`client.js:853-863`) — selector `nav a[href], #mobileNav a[href], [data-stx-nav] a[href]`, exact match against `url`, which *is* pathname+search (`cacheKey`, `client.js:221-222`). It only touches elements with `data-stx-link` (`client.js:858`).
2. `updateActiveLinks()` (`client.js:865-880`) — **removes** both class sets from every `[data-stx-link]` (`:873-874`), then re-adds using `var cur = location.pathname` (`:868`): `exactActiveClass` when `cur === href`, `activeClass` when `cur.startsWith(href)` (`:875-876`).

Because `updateActiveLinks()` runs second and clears first, **it wins**. Query strings are discarded. And at first paint `init()` calls `updateNav(location.pathname)` (`client.js:963`) with no search string at all — so even `updateNav`'s search-aware match is wrong on a hard load.

Consequences you must design around:
- `to="/projects"` also lights up on `/projects/new` (prefix match).
- Nothing emits `aria-current`; `stx-link.js:19-37` writes only `href`, `class` and the three `data-*` attributes. `grep -rn aria-current resources/` returns **0** today.

**WRONG** — assuming `activeClass` reproduces the dashboard pill state:

```html
<StxLink to="{{ f.href }}" activeClass="pill-on">{{ f.label }}</StxLink>
```

From `/dashboard`, `cur.startsWith('/dashboard?status=resolved')` is false for every non-default tab and true for the bare `/dashboard` one — so exactly one tab is ever lit, regardless of the real filter.

**RIGHT** — pathname navs use the router; query-state navs use the server:

```html
{{-- SiteNav.stx: pathname-level, router-driven --}}
<StxLink to="/pricing" activeClass="nav-current" exactActiveClass="nav-current">Pricing</StxLink>

{{-- dashboard.stx: query-state, server-driven (see §9.4) --}}
<StxLink to="{{ f.href }}" class="pill {{ f.key === statusFilter ? 'pill-on' : 'pill-off' }}"
         aria-current="{{ f.key === statusFilter ? 'page' : 'false' }}">{{ f.label }}</StxLink>
```

`public/marketing.css:82-84` has `.nav-links a` hover rules and no active rule at all — adding `.nav-current` gives the marketing nav a current-page state it does not have today.

**CHECK:**

```bash
# activeClass on a link whose `to` carries a query string is always wrong
grep -rn '<StxLink[^>]*to="[^"]*?[^"]*"[^>]*activeClass' resources/
# every nav must expose current-page state to assistive tech
grep -rn 'aria-current' resources/ | wc -l   # 0 today
```

---

### 9.6 MUST NOT — write `prefetch` on a `<StxLink>`

**RULE.** The `prefetch` prop is a no-op. Never write it. Prefetch is a global setting; change it in `config/ui.ts` or not at all.

**WHY.** `stx-link.js:27-28` emits `data-stx-prefetch` when the prop is truthy. `grep -n data-stx-prefetch node_modules/stx-router/dist/client.js` returns **nothing** — the attribute is never read. The actual behaviour is unconditional: `if(o.prefetch){ … closest('[data-stx-link]') … }` at `client.js:830-833`, with `prefetch:true` in the defaults at `client.js:9`. Every `StxLink` on the page prefetches on hover; results go into an LRU capped at `prefetchCacheMax` (default 50, `client.js:9`, eviction at `client.js:86-93`).

**WRONG:**

```html
<StxLink to="/dashboard" prefetch>Dashboard</StxLink>   {{-- attribute is inert --}}
```

**RIGHT** — say nothing on the link; state the policy once:

```ts
// config/ui.ts
router: {
  container: 'main',
  interceptAllLinks: true,
  prefetch: true,   // hover-prefetch every <StxLink>; stx-router client.js:830
},
```

**CHECK:**

```bash
grep -rn '<StxLink[^>]*\bprefetch\b' resources/   # must return nothing
```

---

### 9.7 MUST — programmatic navigation is `navigate()`, never `location.*` or `history.*`

**RULE.** In any `<script>` block, use the auto-imported `navigate(url)`. Use `navigate(url, true)` when you genuinely need a document load. Use `goBack()` / `goForward()` for history. Use `useSearchParams().set()` to rewrite the query string. Never write `window.location`, `location.href =`, `location.assign()`, `location.replace()` or `history.replaceState()`.

**WHY.** `navigate` is defined at `signals.js:940-951` and published as a global at `signals.js:4635` (also `window.stx.navigate`, `signals.js:4148`). It delegates to `window.stxRouter.navigate` when the router is live (`signals.js:946-947`) and falls back to `location.href` only when it is not — strictly safer than the hand-written form. `goBack`/`goForward`: `signals.js:953-954`. `useSearchParams()` owns history rewriting: `signals.js:1004-1024`.

The router's `navigate()` (`client.js:272-376`) does the fragment fetch, the LRU response cache (`client.js:312-335`), the View Transitions swap (`client.js:772-783`) and the progress bar (`client.js:302-310`). A `location.assign` throws all of it away. It also handles the cases you would otherwise hand-code: cross-origin → full navigation (`client.js:285`), same-page hash → smooth scroll (`client.js:287-292`), navigation to the current href → no-op (`client.js:300`).

You never import it. `navigate` is in `STX_AUTO_IMPORTS` (`client-script.js:143`, entry at `:155`) and is auto-injected on detection of `navigate(` at `client-script.js:312-316`. So are `goBack`, `goForward`, `useRoute`, `useSearchParams` (`:156-160`).

bughq is split against itself: `login.stx:43`, `register.stx:56` and `pricing.stx:16` already call `navigate()`; 21 other sites do not.

**WRONG** — `resources/views/dashboard.stx:233` and `:271`:

```js
function signOut() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  document.cookie = 'bughq_token=; path=/; max-age=0'
  window.location.assign('/login')
}
```

**WRONG** — `resources/views/dashboard.stx:429`, an inline `onchange` that both hand-serialises a cookie and full-reloads:

```html
          <select onchange="document.cookie = 'bughq_project=' + encodeURIComponent(this.value) + '; path=/; max-age=31536000; samesite=lax' + (location.protocol === 'https:' ? '; secure' : ''); location.href = '{{ pageUrl({ page: 1 }) }}'"
```

**RIGHT** — a `@change` directive, `useCookie` (`signals.js:3568-3598` emits exactly that cookie string, including the `Secure` rule at `:3589-3591`), and `navigate()`:

```html
<script>
const activeProjectId = useCookie('bughq_project', { maxAge: 31536000, sameSite: 'Lax' })

function switchProject(e) {
  activeProjectId.set(e.target.value)
  navigate('{{ pageUrl({ page: 1 }) }}')
}
</script>

<select @change="switchProject" class="panel mono px-3 py-1.5 text-sm text-muted">
```

`resources/views/settings.stx:214-217` collapses to the same three lines.

**Exemptions**, all of which must be declared rather than argued in review:

| Site | Call | Why it stays |
|---|---|---|
| `dashboard.stx:565`, `settings.stx:1002`, `projects/index.stx:186`, `issue/[id].stx:790`, `account.stx:44` | `location.replace('/login')` | pre-paint auth bounce, runs before the router exists; `replace` (not `assign`) is deliberate — no history entry |
| `dashboard.stx:570`, `settings.stx:329/463/570/615/1005`, `projects/index.stx:189`, `issue/[id].stx:793` | `location.reload()` | re-render after mirroring the token into a cookie the *server* reads |
| `pricing.stx:26` | `location.assign(data.url)` | cross-origin Stripe URL — but write `navigate(data.url)`: `client.js:285` handles the origin switch |

**CHECK** — grep now, then make it a build failure (§9.11):

```bash
grep -rnE '(window\.)?(location\.(href[[:space:]]*=|assign\(|replace\()|history\.(push|replace)State)' \
  resources/views resources/components
# 21 today. Every survivor must be in the exemption table above.
```

`script-validation.js` already carries the exact rules: `window.location` → “Use navigate() or useRoute()” (`:47-51`), `window.history` → “Use navigate(), goBack(), goForward()” (`:52-56`), and `location.href =` / `.assign()` / `.replace()` → “Use navigate() instead” (`:113-125`).

---

### 9.8 MUST NOT — ship a redirect as markup

**RULE.** A `<script>` tag emitted as template output to perform a redirect is forbidden. If the server block already knows the answer, redirect on the server.

**WHY.** The condition is computed server-side, so the browser is being asked to re-decide something already decided — after paying for a full render, a paint, and a second document load. `client.js` is not involved at all; this is not navigation, it is a control-flow bug in template form.

**WRONG** — `resources/views/dashboard.stx:400-403` and the byte-identical `resources/views/settings.stx:741-743`:

```html
    @if (user && needsOnboarding)
      <div class="text-center py-24 text-sm text-subtle">Setting up your workspace…</div>
      <script>window.location.replace('/projects/new')</script>
    @endif
```

**RIGHT** — return a redirect from the `<script server>` block that already computed `needsOnboarding`, so the browser never renders the dead branch. If the surrounding server code genuinely cannot redirect, the fallback is still not a `<script>` tag in markup — it is `onMount(() => navigate('/projects/new', true))` inside the page's client script, where it is cancellable and lintable.

**CHECK:**

```bash
grep -rn '<script>[^<]*location\.' resources/views   # 2 today, target 0
```

---

### 9.9 MUST — exactly one `<main>` per rendered document, and it belongs to the layout

**RULE.** `config/ui.ts:41` sets `container: 'main'`. The layout owns that element. A page fragment must never contain a `<main>`; a self-shelled document must contain exactly one.

**WHY.** `getContainer()` (`client.js:193-195`) is `document.querySelector(containerSel) || querySelector('[data-stx-content]') || querySelector('main')` — it returns the *first* match. Two `<main>` elements make the swap target ambiguous. With no container at all, `shouldIntercept()` bails at `client.js:796` and `swap()` falls back to `location.href = url` at `client.js:395`.

The server side depends on it too: fragment extraction in `serve.js:10147-10162` slices between the first `<main …>` and the **last** `</main>`, and lifts that element's attributes into `X-STX-Container-Attrs` (`serve.js:10198`), which the client re-applies at `client.js:442`.

bughq documents the rule at `resources/views/layouts/default.stx:1-14` and follows it — `account.stx:126-127` and `issue/[id].stx:570-572` both carry comments explaining why they use a `<div>`. Encode it as a check rather than a comment.

**CHECK** — one script, run in CI:

```bash
bun -e '
import {readdirSync,statSync,readFileSync} from "fs";
function walk(d,a=[]){for(const e of readdirSync(d)){const p=d+"/"+e;statSync(p).isDirectory()?walk(p,a):e.endsWith(".stx")&&a.push(p)}return a}
let bad=0
for(const f of walk("resources/views")){
  const s=readFileSync(f,"utf8").replace(/<!--[\s\S]*?-->/g,"").replace(/\{\{--[\s\S]*?--\}\}/g,"");
  const doctype=/<!DOCTYPE\s/i.test(s), mains=(s.match(/<main[\s>]/gi)||[]).length;
  if((doctype&&mains!==1)||(!doctype&&mains!==0)){console.log(`${doctype?"doc":"frag"} mains=${mains}  ${f}`);bad++}
}
process.exit(bad?1:0)'
```

Today this reports exactly two files, both layouts: `layouts/default.stx` (legitimate — it *is* the container) and `layouts/marketing.stx` (0 mains — it is dead and, per the layout chapter, must gain one before any page extends it). Add `resources/views/layouts/` to the walk's skip list once both are correct.

---

### 9.10 MUST — read route params from `params`, never re-parse the URL

**RULE.** In a `<script server>` block on a dynamic route, use the injected `params` object or the bare param name. In a client script, use `useRoute().params`. Never reconstruct a param from `requestContext.url()`, `location.pathname` or a query-string fallback.

**WHY.** `bun-plugin-stx/dist/serve.js:9667-9680` builds `paramsObj` from the matched `[name]` segments, URI-decodes each one (`:9670-9672`), then injects **both** forms into the render context:

```js
    for (const name of paramNames) {
      context[name] = paramsObj[name];        // serve.js:9675-9676
    }
    context.params = paramsObj;               // serve.js:9678
    if (reqCtx)
      reqCtx.params = paramsObj;              // serve.js:9679-9680
```

The same object is shipped to the client at `serve.js:9713-9721` as `window.stx._rp` / `window.__stx_rp`, picked up by the signals runtime at `signals.js:976-977`, and exposed reactively through `useRoute().params` (`signals.js:990-1002`). `useRoute()` also gives you `path`, `fullPath`, `hash` and `query` — no `URLSearchParams` needed.

`useRoute` is auto-imported (`client-script.js:158`); never hand-import it.

**WRONG** — `resources/views/issue/[id].stx:9-40`. A 24-line URL parser, plus a query-string fallback, plus the correct answer buried last at `:39-40`:

```js
// dashboard. The `[id]` path segment is NOT injected as a global here, so the
// issue id is parsed out of `requestContext.url()`.
…
let issueId = ''
try {
  const u = (typeof requestContext !== 'undefined' && requestContext.url && requestContext.url()) || ''
  if (u) {
    const seg = new URL(u).pathname.split('/').filter(Boolean)
    const i = seg.indexOf('issue')
    if (i !== -1 && seg[i + 1])
      issueId = decodeURIComponent(seg[i + 1])
  }
}
catch { issueId = '' }
if (!issueId) { /* ?i= fallback */ }
if (!issueId && typeof id !== 'undefined' && id)
  issueId = String(id)
```

The comment is false for stx 0.2.113: `serve.js:9675-9676` injects `id` as a context global, already decoded.

**RIGHT:**

```js
const { db } = await import('@stacksjs/database')

// `[id]` is injected into the render context by the serve path
// (bun-plugin-stx serve.js:9675-9678), already URI-decoded.
const issueId = params.id ?? ''
```

**CHECK:**

```bash
# no page may reconstruct a path param by hand
grep -rn "requestContext.url()\|pathname.split('/')\|__stxServeSearch" resources/views
# 2 hits today, both in issue/[id].stx
```

---

### 9.11 SHOULD — derive route types from `.stx/route-types.d.ts`; never hand-maintain a route union

**RULE.** Route names and params are generated. Consume them from `types/`. Never edit `.stx/`, never commit it, never retype a route list.

**WHY.** `stx-router`'s `Router` constructor calls `generateRouteTypes(this.routes, stxDir)` and `generateRouteManifest(…)` on every boot (`file-router.js:71-73`). The former writes an ambient `declare module "stx/routes"` with a `RouteMap` interface (`codegen.js:3-22`), one entry per route, params typed `string` — or `string[]` for a catch-all (`codegen.js:12`). The latter writes `.stx/routes.ts` with a `const` array and `export type RouteName = typeof routes[number]['pattern']` (`codegen.js:34-35`).

bughq's current output, `.stx/route-types.d.ts:48-49`:

```ts
    '/issue/:id': { id: string }
    '/orders/:id': { id: string }
```

Two facts that decide how you use it:

1. `.stx/` is gitignored (`.gitignore:51`) and is **not** in `tsconfig.json` `include` (`tsconfig.json:31-38` covers `*.ts`, `*.d.ts`, `types/**/*.d.ts`, `app/…`). So `RouteMap` is currently invisible to `tsc`. Add `".stx/*.d.ts"` to `include`.
2. There is no runtime package named `stx` (`@stacksjs/stx`'s `exports` map has no such alias). `stx/routes` is a **type-only** module. Value-importing it will fail at runtime.

**RIGHT** — one file in the types folder (requirement 8), which is the only place any other TS may name a route:

```ts
// types/routes.d.ts
// Route names and params come from .stx/route-types.d.ts, regenerated on every
// dev-server boot by stx-router (file-router.js:71-73). Type-only: `stx/routes`
// has no runtime implementation.
import type { RouteMap } from 'stx/routes'

export type AppRoute = keyof RouteMap
export type RouteParams<R extends AppRoute> = RouteMap[R]
export type DynamicRoute = { [K in AppRoute]: keyof RouteMap[K] extends never ? never : K }[AppRoute]
```

**WRONG:** any hand-written `type Route = '/dashboard' | '/settings' | …`, and any `import { routes } from 'stx/routes'` (no runtime module).

**CHECK:**

```bash
git check-ignore -v .stx/route-types.d.ts                    # must be ignored
grep -q '".stx/\*.d.ts"' tsconfig.json || echo 'FAIL: route types not in tsc program'
grep -rn "from 'stx/routes'" --include='*.ts' . | grep -v 'import type'   # must be empty
```

`.stx/routes.ts:15` and `:25` also expose which non-page files stx is currently routing (`/layouts/default`, `/components/FeatureCard`) — treat unexpected entries there as a directory-layout defect, not a routing one.

---

### 9.12 Reference — router config keys that actually reach the browser

**RULE.** Only set keys in this table's "reaches client" column. The others are declared in the type but dropped in transit; setting them is dead config that reads as configured behaviour.

**WHY.** `config/ui.ts` `router` is typed by `config-types.d.ts:316-333`, but the forwarder that serialises it into `window.__stxRouterConfig` copies an explicit subset — `runtime-injection.js:92-112`. Anything not on that list never reaches `client.js:10` (`Object.assign({}, defaults, window.__stxRouterConfig||{}, window.STX_ROUTER_OPTIONS||{})`).

| Key | Declared | Forwarded | Read by client | Default |
|---|---|---|---|---|
| `container` | `:318` | `runtime-injection.js:92` | `client.js:11`, `193-195` | `'main'` |
| `interceptAllLinks` | `:320` | `:94` | `client.js:809` | `false` (stx-router) / `true` (serve path, `serve.js:9764`) |
| `prefetch` | `:325` | `:106` | `client.js:830` | `true` |
| `cache` | `:326` | `:108` | `client.js:312`, `365`, `847` | `true` |
| `scrollToTop` | `:324` | `:104` | `client.js:449`, `712` | `true` |
| `viewTransitions` | `:321` | `:98` | `client.js:15`, `901` | `true` |
| `viewTransitionDuration` | `:322` | `:100` | `client.js:902` | `220` |
| `viewTransitionEasing` | `:323` | `:102` | `client.js:903` | `cubic-bezier(0.16,1,0.3,1)` |
| `progress` | `:331` | `:96` | `client.js:42`, `53`, `913` | `true` |
| `progressColor` | `:332` | `:110` | `client.js:898` | `#78dce8` |
| `progressHeight` | `:333` | `:112` | `client.js:899` | `2px` |
| `enabled` | `:317` | **no** | never | — |
| `linkSelector` | `:319` | **no** | never | — |
| `cacheTTL` | `:327` | **no** | never | — |
| `skipSelectors` | `:328` | **no** | never | — |
| `viewTransitionCSS` | `:329` | **no** | never | — |

Two keys are only reachable through `window.__stxRouterConfig` directly, not through `config/ui.ts`: `loadingClass` (`client.js:9`, `303`, `310`) and `prefetchCacheMax` (`client.js:9`, `86`).

`interceptAllLinks` is worth pinning explicitly, as `config/ui.ts:31-35` already argues: stx-router's own default is `false` (`client.js:9`) while the serve path hardcodes `true` (`serve.js:9764`) before merging `stxConfig.router`. Once §9.1 is complete across `SiteNav.stx` and `SiteFooter.stx`, flip it to `false` — that is the whole point of the conversion.

**CHECK** — against a running dev server:

```bash
curl -s http://localhost:3100/dashboard | grep -o '__stxRouterConfig={[^<]*}'
curl -sI -H 'X-STX-Router: true' http://localhost:3100/dashboard | grep -i '^x-stx-'
# expect X-STX-Fragment, X-STX-Layout, X-STX-Layout-Group, X-STX-Title (serve.js:10194-10199)
curl -s http://localhost:3100/ | grep -c 'data-stx-link'     # marketing nav: 0 today
```

---

### 9.13 MUST — enable `strict` so §9.7 and §9.8 fail the build

**RULE.** `config/ui.ts` must set `strict`. Rules that only a reviewer enforces are not rules.

**WHY.** `process.js:704` calls `validateClientScript(content, filePath, options.strict)` for every non-server `<script>` block it processes. `validateClientScript` (`script-validation.js:128-159`) is inert when `strict` is absent — `strictConfig = … ?? { enabled: !1 }` at `:129`, and the throw/warn at `:148-157` is gated on `strictConfig.enabled`. `config/ui.ts` sets no `strict` key, so all 21 navigation violations pass silently.

The shape is `StrictModeConfig` (`config-types.d.ts:209-218`): `{ enabled, failOnViolation?, allowPatterns? }`. `allowPatterns` matches against either the message or the pattern source (`script-validation.js:130-131`), so it is a per-rule opt-out, not a per-file one.

**RIGHT** — land it staged, `enabled` first, then `failOnViolation`:

```ts
// config/ui.ts
strict: {
  enabled: true,
  failOnViolation: true,
  // Pre-paint auth bounces and the post-cookie reload are deliberate full
  // document loads (see §9.7). Everything else must use navigate().
  allowPatterns: ['location.replace() is prohibited'],
},
```

Note the cost of that allowance: it exempts `location.replace()` project-wide, including the two markup redirects in §9.8. Delete those first, then add the pattern — never the other way round.

**CHECK:**

```bash
grep -q 'strict' config/ui.ts || echo 'FAIL: strict unset — navigation rules unenforced'
./buddy dev:api   # with failOnViolation:true, a violating .stx throws at render
```

## 10. Components

bughq resolves **zero** library components today. `config/ui.ts:8-79` declares `componentsDir`, `layoutsDir`, `partialsDir`, `router` and `app` — and no `plugins` key. `node_modules/@stacksjs/stx/dist/config.js:420` gates the *only* code path that fills `_pluginComponentDirs` on `if (loaded.plugins && loaded.plugins.length > 0)`. With that array undefined, `utils.js:404-409` never searches the library, and every `<Badge>`, `<Button>`, `<Switch>` you write emits a visible error string into the page. Every hand-rolled duplicate in this codebase — twelve `.btn` systems, five badge systems, two copy-button state machines, 21 inline SVGs — descends from that one missing line.

### 10.1 MUST register the components plugin in `config/ui.ts`

**RULE** — Add `plugins: ['@stacksjs/components/stx-plugin']` to the default export in `config/ui.ts` before writing a single library tag. MUST.

**WHY** — `config.js:422-439` imports each plugin entry, resolves `path.dirname(require.resolve(pluginPath))`, and pushes `path.resolve(pluginDir, plugin.components)` onto `pluginComponentDirs`, assigned to `loaded._pluginComponentDirs` at `config.js:468`. The shim that exists for exactly this is `node_modules/@stacksjs/components/stx-plugin.ts:16-19` (`{ name: '@stacksjs/components', components: './src/ui' }`), documented at `stx-plugin.ts:9-14`. Lookup reads that array at `utils.js:330-333` (`userComponentFileExists`) and `utils.js:404-409` (`renderComponentWithSlot`); the recursive walk at `utils.js:445-479` (`MAX_DEPTH = 8`) is what makes the grouped `src/ui/<family>/<Name>.stx` layout resolve without listing 44 directories. The config type already accepts it: `node_modules/@stacksjs/stx/dist/types/config-types.d.ts:277` — `plugins?: Array<string | [string, Record<string, any>]>`.

**WRONG** — `config/ui.ts:8-16`, the entire directory block with no `plugins`:

```ts
export default {
  componentsDir: 'resources/components',
  layoutsDir: 'resources/layouts',
  partialsDir: 'resources/partials',
```

**RIGHT**

```ts
export default {
  // Makes all 86 library components resolvable by tag name. Resolution walks
  // subdirectories (utils.js:445-479), so src/ui/<family>/<Name>.stx works as-is.
  plugins: ['@stacksjs/components/stx-plugin'],

  componentsDir: 'resources/components',
```

**CHECK** — `grep -n "plugins" config/ui.ts` must return a hit. At boot, `config.js:463` prints `[stx] Plugin loaded: @stacksjs/components`. Verified end-to-end: with the dir registered, `<Badge variant="danger" size="sm">boom</Badge>` renders `<span class="inline-flex items-center gap-1.5 font-medium rounded-full bg-red-100 text-red-800 … px-2 py-0.5 text-xs" role="status">`. Without it, the same tag renders this into the page body:

```
[Error loading component: ENOENT: no such file or directory, open 'badge']
Searched paths:
  - /Users/…/bughq/resources/components/badge.stx
  - /Users/…/bughq/resources/components/Badge.stx
  …
```

Absolute filesystem paths, shipped to the browser. Post-build check: `grep -rn "Error loading component" dist/ && exit 1`.

### 10.2 Inventory — every shipped component and what it replaces in bughq

86 `.stx` files in 44 families under `node_modules/@stacksjs/components/src/ui`. **Status was measured, not read**: each tag was rendered through `processDirectives` with the plugin dir registered and the output checked for unresolved-component errors and unprocessed directives. Do not trust the READMEs.

| Family | Tags | Replaces in bughq | Status |
|---|---|---|---|
| avatar | `Avatar` | `account.stx:88,134-139`; initials circles at `settings.stx:823,832,843`, `projects/index.stx:147` | works |
| badge | `Badge` | `.badge` at `settings.stx:661-666`, `account.stx:86-87`; `.pill` at `issue/[id].stx:395-409` | works |
| button | `Button` | 12 `.btn` systems (§10.6) | works |
| card | `Card` | `.card` at `account.stx:79`, `issue/[id].stx` | works |
| checkbox / radio / textarea / input | `Checkbox`, `Radio`, `Textarea`, `TextInput`, `EmailInput`, `PasswordInput`, `SearchInput`, `NumberInput` | `.field` at `settings.stx:659-660`; `resources/components/InputGroup.stx` | works |
| progress | `Progress` | `AutofixPanel.stx:270-271,348` | works |
| skeleton | `Skeleton` | `AutofixPanel.stx:291-292,310-312`; `.skeleton` at `account.stx:90-92,142` | works |
| spinner | `Spinner` | ternary loading labels at `register.stx:149`, `projects/new.stx:152`, `settings.stx:859` | works |
| switch | `Switch` | `.tgl` div at `settings.stx:667-670,893` | works |
| tooltip | `Tooltip` | 16 native `title=` attrs (prefer `x-tooltip`, §10.10) | works |
| pagination | `Pagination` | `dashboard.stx:513-530` (do **not** adopt — §10.10) | works |
| notification | `Notification` | `resources/components/NotificationPopup.stx`; error banners at `login.stx`, `register.stx` | works |
| dialog | `Dialog` | outer shell of `settings.stx:975-989` | works |
| dialog | `DialogPanel`, `DialogTitle`, `DialogDescription`, `DialogBackdrop` | — | **BROKEN** |
| table | `Table`, `TableHead`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` | issue list markup in `dashboard.stx` | works |
| sidebar | `Sidebar`, `SidebarHeader`, `SidebarFooter`, `SidebarItem`, `SidebarSection` | nothing yet | works |
| tabs | `TabPanel` | — | works |
| tabs | `Tabs` | `settings.stx` tab nav, `dashboard.stx:448` filter tabs | **BROKEN** |
| accordion | `AccordionItem` | — | works |
| accordion | `Accordion` | `<details>` groups in `AutofixPanel.stx:350-388` | **BROKEN** |
| auth | `Login`, `Signup`, `TwoFactorChallenge` | `login.stx`, `register.stx`, `resources/components/LoginForm.stx` | works |
| command-palette | `CommandPalette`, `CommandPaletteItem` | nothing yet | works |
| drawer / portal / teleport / transition | `Drawer`, `Portal`, `Teleport`, `Transition` | nothing yet | works |
| image / video / audio | `Image`, `Video`, `Audio` | raw `<img>` in `account.stx:135` | works |
| calendar / form / heatmap | `Calendar`, `Form`, `Heatmap` | nothing yet | works |
| virtual-list | `VirtualList` | nothing yet | works |
| payment | `DefaultPaymentMethod` | — | works |
| payment | `Checkout`, `SubscriptionCheckout`, `PaymentMethods` | `pricing.stx`, `account.stx` billing rows | **BROKEN** |
| breadcrumb | `Breadcrumb` | 22 hand-written breadcrumbs (§10.9) | **BROKEN** |
| select | `Select` | `<select>` in `settings.stx`, `projects/new.stx` | **BROKEN** |
| navigator | `Navigator` | `resources/partials/SiteNav.stx` | **BROKEN** |
| virtual-table | `VirtualTable` | — | **BROKEN** |
| stepper | `Stepper`, `StepperStep` | `AutofixPanel.stx:272-287,350-388` | **BROKEN** |
| dropdown | `Dropdown`, `DropdownButton`, `DropdownItems`, `DropdownItem` | `resources/components/ContextMenu.stx`, `StartMenu.stx` | **BROKEN** |
| combobox | `Combobox`, `ComboboxInput`, `ComboboxButton`, `ComboboxOptions`, `ComboboxOption` | — | **BROKEN** |
| listbox | `Listbox`, `ListboxButton`, `ListboxLabel`, `ListboxOptions`, `ListboxOption` | — | **BROKEN** |
| popover | `Popover`, `PopoverButton`, `PopoverPanel` | — | **BROKEN** |
| radio-group | `RadioGroup`, `RadioGroupLabel`, `RadioGroupDescription`, `RadioGroupOption` | severity/status selectors in `issue/[id].stx` | **BROKEN** |

`src/components/` (`CodeBlock`, `Hero`, `Footer`, `Installation`) is a **sibling** of `src/ui`, not a child — the shim registers `./src/ui` only (`stx-plugin.ts:18`), and the subdirectory walk starts *at* that dir. None of the four resolve by tag name after §10.1. See §10.7.

Also always available with no registration and no import — `builtins/index.js:23-33` registers them into `component-registry.js:13-17` on first render: `StxLink`, `StxImage`, `SafeImage`, `StxLoadingIndicator`, `StxToast`, `StxModal`, `StxDrawer`, `Icon` (aliases `icon`, `stx-icon`), `Suspense`, `TransitionGroup`.

### 10.3 MUST NOT use the 32 quarantined components

**RULE** — Do not write any tag marked **BROKEN** in §10.2. MUST.

**WHY** — Two independent defects in `@stacksjs/components@0.2.113`:

1. **`<component :is>` leaks an error.** 26 files render their root through `<component :is="{{ as }}">` (e.g. `DialogPanel.stx:10`, `Stepper.stx:15`, `StepperStep.stx:26`, `Dropdown.stx`). `process.js:527` runs `processComponents` **before** `processDynamicComponents` at `process.js:528`. The lowercase-tag pass at `component-renderer.js:586` treats `component` as a user component (the dash-guard at `component-renderer.js:613` only skips tags *containing* a dash), so it reaches `renderComponentWithSlot` and returns the `utils.js:485-490` ENOENT string. Measured: `<DialogPanel>hi</DialogPanel>` → `[Error loading component: ENOENT: no such file or directory, open 'component']`.
2. **`@foreach(x in y)` never runs.** `loops.js:336-338` parses the header with `params.indexOf(" as ")` and `continue`s when it is `-1`. Nine components use the `in` form — `Breadcrumb.stx:30`, `Select.stx:66`, `Navigator.stx:75`, `Tabs.stx:144,187`, `Accordion.stx:110`, `PaymentMethods.stx:41`, `SubscriptionCheckout.stx:206`, `VirtualTable.stx:70`. The literal directive text ships to the browser.

**WRONG** — the audit's own suggested fix for the 22 breadcrumbs:

```stx
<Breadcrumb :items="[{label:'Home',href:'/'},{label:'Features',href:'/#features'},{label:'Automatic capture'}]" />
```

Measured output:

```html
<nav class="flex items-center flex-wrap gap-2 text-sm" aria-label="Breadcrumb">
  <ol class="flex items-center gap-2">
    @foreach(item in displayItems)
      <li class="flex items-center gap-2">
```

**RIGHT** — for a quarantined component either (a) use the working sibling (`Dialog` without `DialogPanel`; `TabPanel` without `Tabs`), or (b) keep local markup and fix its semantics by hand (§10.9). Do not "fix" the library file in `node_modules` — `bun install` wipes it.

**CHECK**

```bash
grep -rEn '<(DialogPanel|DialogTitle|DialogDescription|DialogBackdrop|Dropdown|DropdownButton|DropdownItems|DropdownItem|Combobox[A-Za-z]*|Listbox[A-Za-z]*|Popover[A-Za-z]*|RadioGroup[A-Za-z]*|Stepper|StepperStep|Breadcrumb|Select|Navigator|Tabs|Accordion|VirtualTable|Checkout|SubscriptionCheckout|PaymentMethods)\b' resources/
```

Any hit is a violation. Second, generic check after every build: `grep -rEn '@(foreach|for|if|switch)\s*\(' dist/ && exit 1` — an unprocessed directive in built HTML is always a bug. Third, set `debug: true` in `config/ui.ts` during development: `component-renderer.js:656-659` then warns `[stx] <file>: unresolved component tag(s) after render passes: …`.

### 10.4 MUST NOT hand-roll a confirmation dialog

**RULE** — A yes/no confirmation MUST call `stxConfirm`. A dialog that collects input MAY keep bespoke markup, but MUST NOT re-implement Escape, backdrop-dismiss or scroll-lock — declare `data-stx-modal="<id>"` and drive it with `stx.modal.open/close`. MUST.

**WHY** — `stxConfirm(message, options) => Promise<boolean>` is declared at `stx.d.ts:386` and implemented at `signals.js:4000-4001` via `_createDialog` (`signals.js:3907-3996`), exposed as `window.stxConfirm` at `signals.js:4666`. The modal registry is `stx.d.ts:341-350` / `signals.js:3853-3892`: Escape (`3863-3869`), backdrop click (`3871-3873`), body-scroll lock on open (`3861`) and restore on close (`3884`). bughq already uses `stxConfirm` correctly at `settings.stx:236` for the rotate-key confirm — and then hand-rolls the other dialog 700 lines later.

**WRONG** — `settings.stx:694-698` (CSS incl. `dz-fade`/`dz-pop` keyframes), `settings.stx:975` (markup), `settings.stx:535-543` (handlers):

```stx
<div class="dz-overlay" :hidden="dzAction() === null" hidden @click="dzBackdrop" @keydown="dzKey">
```

```js
function dzKey(e) { if (e.key === 'Escape') dzClose() }
function dzBackdrop(e) { if (e.target === e.currentTarget) dzClose() }
```

Nothing here locks body scroll — the page behind the modal still scrolls today.

**RIGHT** — keep the type-the-project-name gate (it is app logic), delete the chrome:

```stx
<div class="dz-overlay panel-host" data-stx-modal="dz" style="display: none">
  <div class="dz-card panel" role="dialog" aria-modal="true" aria-labelledby="dz-title">
```

```js
function dzOpen(which) {
  dzAction.set(which); dzTyped.set(''); dzNote.set(null); dzBusy.set(false)
  window.stx.modal.open('dz')
  setTimeout(() => document.getElementById('dz-input')?.focus(), 20)
}
function dzClose() {
  window.stx.modal.close('dz')
  dzAction.set(null); dzTyped.set(''); dzNote.set(null); dzBusy.set(false)
}
```

`dzKey` and `dzBackdrop` (`settings.stx:535-543`) and the `dz-fade`/`dz-pop` keyframes (`settings.stx:697-698`) are deleted. Neither the framework modal nor bughq's version traps focus — **manual review**: confirm Tab does not escape the panel, or add a focus trap.

**CHECK** — `grep -rn "e.key === 'Escape'" resources/views/` and `grep -rn "e.target === e.currentTarget" resources/views/`. Both are the signature of a hand-rolled overlay. Zero hits expected.

### 10.5 MUST use `<Switch>` for any on/off control

**RULE** — Never write `role="switch"` on a non-button element. MUST.

**WHY** — `Switch.stx:61-71` renders a real `<button type="button" role="switch">`, so it is focusable and Space/Enter-activated for free, with `:aria-checked` (`Switch.stx:64`), disabled + `aria-disabled` (`Switch.stx:66`), an `sr-only` label (`Switch.stx:69`) and `useReactiveProp('checked', …)` (`Switch.stx:31`) so a parent signal drives it. Verified rendering.

**WRONG** — `settings.stx:893`. A keyboard or screen-reader user cannot enable or disable a Slack/Discord alert channel at all:

```stx
<div class="tgl" @click="toggleChannel('{{ c.id }}')" :data-on="isOn('{{ c.id }}') ? '1' : '0'" :aria-checked="isOn('{{ c.id }}') ? 'true' : 'false'" role="switch" title="Enable / disable"></div>
```

**RIGHT**

```stx
<Switch :checked="isOn('{{ c.id }}')" label="{{ c.label }} alerts" @change="toggleChannel('{{ c.id }}')" />
```

Delete `.tgl` at `settings.stx:667-670`. The optimistic-revert logic at `settings.stx:375-388` is unchanged.

**CHECK** — `grep -rn 'role="switch"' resources/ | grep -v '<button'` must be empty.

### 10.6 MUST use `<Button>` and `<Badge>` instead of per-file CSS systems

**RULE** — No `.stx` file may define `.btn`, `.btn-*`, `.badge`, `.badge-*` or `.pill*` CSS. MUST.

**WHY** — `Button.stx` ships five variants incl. `danger` (`Button.stx:12-18`), five sizes xs–xl (`Button.stx:20-26`), a real `loading` prop that swaps in a spinner and sets `aria-busy` (`Button.stx:5,56-62`), an `isDisabled = disabled || loading` guard so a loading button cannot double-submit (`Button.stx:31,42-48`), `fullWidth` (`Button.stx:30`) and left/right icon slots (`Button.stx:64-72`). `Badge.stx` ships seven semantic variants (`Badge.stx:8-16`), three sizes (`Badge.stx:18`), an optional status dot with per-variant colour (`Badge.stx:20-28,44-46`), a removable close button emitting `remove` (`Badge.stx:38-40,50-61`) and `role="status"` on the root (`Badge.stx:43`) — which none of bughq's spans have.

**WRONG** — 11 files define `.btn` at column 0 (`account.stx:80`, `login.stx:76`, `register.stx:89`, `reset-password.stx:84`, `forgot-password.stx:63`, `pricing.stx:51-55`, `projects/new.stx:88`, `projects/index.stx:88-91`, `settings.stx:652-658`, `issue/[id].stx:456-462`, `AutofixPanel.stx:254-256,266-267`) and they disagree — `border-radius: 10px` at `login.stx:76` versus `9px` at `settings.stx:655`. Loading is re-typed per page:

```stx
<button @click="createProject" :disabled="loading()" :text="loading() ? 'Creating…' : 'Create app'" class="btn px-4 py-2.5 text-sm"></button>
```

Four files define badges: `settings.stx:661-666`, `account.stx:86-87`, `issue/[id].stx:395-409`, `dashboard.stx` — three of them set their own pill radius/padding/weight, which is why the same concept renders at three sizes across the app.

**RIGHT**

```stx
<Button variant="primary" size="sm" :loading="loading()" @click="createProject">Create app</Button>
<Badge variant="danger" size="sm">{{ issue.level || 'error' }}</Badge>
<Badge variant="success" size="sm" dot>{{ status }}</Badge>
```

The `:text="… ? 'Creating…' : 'Create'"` ternaries go away — `loading` renders the spinner itself. The level→variant map is already computed server-side in `issue/[id].stx` (`levelColor`/`levelLabel`), so that site is a one-line substitution.

**CHECK**

```bash
grep -rEn '^\.(btn|badge|pill)\b' resources/          # expect 0
grep -rEn "'(Creating|Saving|Sending|Deleting)…'" resources/   # hand-rolled loading labels
```

### 10.7 MUST NOT use `<CodeBlock>`; factor one local component instead

**RULE** — Do not adopt `@stacksjs/components/src/components/CodeBlock.stx`, and do not use `useCopyCode`. MUST.

**WHY** — Two reasons. (a) It is outside the registered plugin dir, so it needs an explicit ES import; `component-renderer.js:404-478` (`processESImports`) does resolve `import { CodeBlock } from '@stacksjs/components'` by walking `pkgDir/src` at `component-renderer.js:351-386` and registering it into `__importedComponents` — measured working. (b) But its output is broken: `highlighter.ts:52` does `const html = await highlighter.highlight(code, language)`, and `ts-syntax-highlighter/dist/highlighter.d.ts:9` declares `highlight(): Promise<RenderedCode>` — an **object**. `highlighter.ts:55` then does `String(html)`. Measured render: `<div class="rounded-md overflow-auto text-sm leading-relaxed font-mono">[object Object]</div>`. Separately, `useCopyCode.ts:20,55` returns a plain `let copied = false` snapshot, not a signal — binding it in a template gives you a value frozen at render time.

**WRONG** — `settings.stx:690-692` (CSS) + `settings.stx:778-787` (markup) + `settings.stx:194-212` (`copied` signal, `copyLabel`, `copyText` with its own 1400 ms timer), duplicated wholesale at `issue/[id].stx:349-360` + `issue/[id].stx:579`, plus ten raw `<pre><code>` sites (`docs.stx:65-75`, `index.stx:73`, `features/{capture,stack-traces,releases,self-host}.stx:35`, `use-cases/{frontend,backend}.stx:36`, `issue/[id].stx:638,756`).

**RIGHT** — one local component, `resources/components/CodeBlock.stx`. This is the worked example for §10.11:

```stx
<script server>
export const code = $props.code || ''
export const language = $props.language || 'bash'
export const copyable = $props.copyable !== false
</script>

<script client>
const copied = state(false)
const source = {{ code }}

function copy() {
  navigator.clipboard.writeText(source).then(() => {
    copied.set(true)
    setTimeout(() => copied.set(false), 1400)
  })
}
function label() { return copied() ? 'Copied' : 'Copy' }
</script>

<div class="relative">
  <pre class="overflow-x-auto rounded-lg border border-line bg-panel px-4 py-3 pr-16 font-mono text-xs leading-relaxed"><code data-lang="{{ language }}">{{ code }}</code></pre>
  @if (copyable)
    <button type="button" class="absolute right-2 top-2 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-subtle hover:text-default" @click="copy" :text="label()">Copy</button>
  @endif
</div>
```

Used as `<CodeBlock :code="guide.code" :language="guide.label.toLowerCase()" />` at all eleven sites. `settings.stx:194-212` and `690-692` and `issue/[id].stx:349-360` are deleted.

**CHECK** — `grep -rn "<CodeBlock" resources/ | grep -v "resources/components/CodeBlock.stx"` — every hit must resolve to the local file, and `grep -rn "@stacksjs/components/src/components" resources/` must be empty. Post-build: `grep -rn "\[object Object\]" dist/ && exit 1`.

### 10.8 MUST use `<Avatar>`; a broken image URL must not render a broken-image icon

**RULE** — Every user-facing avatar MUST be `<Avatar>`. MUST.

**WHY** — `Avatar.stx:65` binds `@error="onImageError($event)"` on the `<img>`, and the `showImage` derived signal at `Avatar.stx:55` falls back to initials when the URL 404s. `Avatar.stx:42` derives initials from `alt` when none are given. Six sizes (`Avatar.stx:10-17`), circle/square (`Avatar.stx:19`), online/offline/away/busy dot (`Avatar.stx:30-35,70-76`). Verified rendering.

**WRONG** — `account.stx:134-139`. A dead OAuth avatar URL renders the browser's broken-image glyph:

```stx
@if (user() && user().avatar)
  <img class="avatar w-14 h-14" :src="user().avatar" alt="" width="56" height="56">
@endif
@if (!user() || !user().avatar)
  <div class="avatar w-14 h-14 grid place-items-center text-accent" style="font-weight: 700; font-size: 1.25rem">{{ user() ? initial(user().name || user().email) : '' }}</div>
@endif
```

**RIGHT**

```stx
<Avatar :src="user()?.avatar" :alt="user()?.name || user()?.email" size="lg" />
```

Delete `initial()` at `account.stx:12-14` and `.avatar` at `account.stx:88`. Same tag with `initials=` at `settings.stx:823,832,843` and `projects/index.stx:147`.

**CHECK** — `grep -rn 'class="[^"]*avatar' resources/` must be empty, and `grep -rEn '<img[^>]*:src=' resources/ | grep -v '@error'` flags any remaining unguarded remote image.

### 10.9 Breadcrumbs are quarantined — fix the markup in place

**RULE** — The 22 hand-written breadcrumbs MUST use `<ol>`/`<li>`, MUST mark the current page `aria-current="page"`, and MUST hide separators with `aria-hidden="true"`. They MUST NOT use `<Breadcrumb>` until §10.3's `in`-form defect is fixed upstream. MUST.

**WHY** — `Breadcrumb.stx:28-38,68` does exactly this markup and is the right target — but `Breadcrumb.stx:30` uses `@foreach(item in displayItems)`, which `loops.js:337` skips (§10.3). Adopting it today ships a literal `@foreach` string on 22 marketing pages.

**WRONG** — `features/capture.stx:16-20`, repeated verbatim in `docs.stx:17-20`, `use-cases.stx:17`, `compare.stx:31`, `features/{stack-traces,grouping,alerts,releases,self-host}.stx:16`, `use-cases/{frontend,backend,mobile,on-call,agencies}.stx:17` and `compare/{sentry,bugsnag,rollbar,raygun,honeybadger,airbrake,glitchtip,datadog}.stx:23`:

```stx
<nav class="subnav shell" aria-label="Breadcrumb">
  <a href="/">Home</a><span class="sep">/</span>
  <a href="/#features">Features</a><span class="sep">/</span>
  <span>Automatic capture</span>
</nav>
```

**RIGHT** — one partial, `resources/partials/Breadcrumbs.stx`, included by all 22 (`@include('Breadcrumbs', ['crumbs' => [...]])`):

```stx
<nav class="subnav shell" aria-label="Breadcrumb">
  <ol>
    @foreach (crumbs as c)
      <li>
        @if ($loop.last)
          <span aria-current="page">{{ c.label }}</span>
        @else
          <StxLink to="{{ c.href }}">{{ c.label }}</StxLink><span class="sep" aria-hidden="true">/</span>
        @endif
      </li>
    @endforeach
  </ol>
</nav>
```

Note ` as `, not ` in ` — `loops.js:336` is the only header form stx parses. Partials live in `resources/partials/`, not `resources/views/components/`.

**CHECK** — `grep -rn 'aria-label="Breadcrumb"' resources/ | wc -l` must be 1 (currently 22), and `grep -rn 'aria-label="Breadcrumb"' -A 3 resources/partials/Breadcrumbs.stx | grep -c 'aria-current'` must be 1.

### 10.10 `x-tooltip` replaces `title=`; server-rendered pagination stays

**RULE** — Use `x-tooltip="…"` for hover help, never native `title=`. Do **not** replace `dashboard.stx:513-530` with `<Pagination>`. SHOULD / MUST NOT respectively.

**WHY** — stx ships a zero-config global tooltip runtime inside the signals bundle: `signals.js:4043-4085`, reading `x-tooltip` (`signals.js:4054`) and `x-tooltip-position` (`signals.js:4059`), with viewport clamping and delegated `mouseover`/`mouseout`/`focusin`/`focusout` at `signals.js:4077-4080`. `x-tooltip`/`x-tooltip-position` are declared handled attributes at `signals.js:1782`, so they are not passed through as stray DOM attributes. Native `title` has ~1 s delay, no styling, no dark-mode awareness, no touch support. For pagination: `Pagination.stx` is client-signal driven and emits `change` — bughq's version is server-rendered anchors that work without JS and are crawlable. Adopting it would be a regression unless the dashboard also moves to client-side filtering.

**WRONG** — 16 sites, e.g. `dashboard.stx:440`, `dashboard.stx:444`, `settings.stx:729,838,848,850,892,893,894`, `issue/[id].stx:504,508,697,699`:

```stx
<button class="icon-btn theme-btn" :data-t="theme()" @click="toggleTheme" title="Toggle theme" aria-label="Toggle theme">
```

**RIGHT**

```stx
<button class="icon-btn theme-btn" :data-t="theme()" @click="toggleTheme" x-tooltip="Toggle theme" aria-label="Toggle theme">
```

Keep `aria-label` where it is the accessible name — `x-tooltip` is not exposed to AT.

**CHECK** — `grep -rn ' title="' resources/views resources/partials | grep -v '<title'` must be empty. Deviation for `dashboard.stx:513-530` is deliberate; note it in the file so a later agent does not "fix" it.

### 10.11 MUST use `<Icon>` instead of inline SVG, and install the collection

**RULE** — No hand-pasted `<svg>` for a library icon. MUST.

**WHY** — `IconBuiltin` is registered unconditionally at `builtins/index.js:31`, named `Icon` with aliases `icon`/`stx-icon` (`builtins/icon.js:70-72`). It takes `name` (`"lucide:sun"`), `size`, `color`, `class`, `style` and emits the SVG server-side (`builtins/icon.js:83-94`). No import, no registration. `bun-plugin-stx/dist/serve.js:8932-8933` calls `preloadIconCollection('lucide')` on every serve boot; `builtins/icon.js:8` then warns `[stx] icon collection "lucide" is not installed, so its icons render as nothing` — bughq has `@iconify-json/f7` and `@iconify-json/hugeicons` in `node_modules` but not `lucide`, and no iconify entry in `package.json` at all.

**WRONG** — 21 inline SVGs (`issue/[id].stx` ×10, `dashboard.stx` ×3, `login.stx`/`settings.stx`/`register.stx`/`projects/index.stx` ×2 each). `dashboard.stx:441` is lucide `sun` transcribed by hand — a circle plus eight `<line>` elements — and the same path block is duplicated verbatim at `settings.stx:730`.

**RIGHT**

```bash
bun add -d @iconify-json/lucide
```

```stx
<button class="icon-btn theme-btn" :data-t="theme()" @click="toggleTheme" x-tooltip="Toggle theme" aria-label="Toggle theme">
  <Icon name="lucide:sun" class="ic-sun" />
  <Icon name="lucide:moon" class="ic-moon" />
</button>
```

`login.stx:147` (GitHub) and `login.stx:153` (Google) are brand marks — either keep inline or add `@iconify-json/simple-icons` and use `<Icon name="simple-icons:github" />`.

**CHECK** — `grep -rc '<svg' resources/views resources/partials | grep -v ':0$'` must be empty except for deliberate brand marks. Boot check: the dev server must not print `icon collection "lucide" is not installed`. A missing icon renders an HTML comment, not a crash — `grep -rn '<!-- Icon:' dist/ && exit 1` catches typos like `lucide:setting`.

### 10.12 Authoring a local component

**RULE** — A local component lives in `resources/components/<Name>.stx`, reads props via `$props`, declares no imports for globals, uses `<script server>` for render-time data and `<script client>` for behaviour, and never contains `<!DOCTYPE>` or `<html>`. MUST.

**WHY** — the mechanics, in order:

| Concern | Mechanism | Source |
|---|---|---|
| Tag → file | PascalCase tag is kebab-cased, then `<name>.stx` / `<Name>.stx` / `<name>.stx` are tried in each search dir | `component-renderer.js:595`, `utils.js:388-392` |
| Search order | `dirname(__originalFilePath)/components` → `componentsDir` → `dirname(parent)/components` → `options.componentsDir` → **plugin dirs** → `root/resources/views/components` → `root/resources/components` → `root/src/components` → `root/components` → stx's own `dist/components` (`StxLink`, `StxImage`) | `utils.js:392-420` |
| Props in | `:prop="expr"` is evaluated server-side when every identifier is in scope, else deferred as a client-reactive attribute; `kebab-case` → `camelCase` | `component-renderer.js:198-235` |
| Props read | Whole props object is spread into the component context, and also available as `$props` / `props` | `utils.js:512-515` |
| Destructured defaults | `const { size = 'md' } = defineProps<P>()` defaults are evaluated and merged | `utils.js:292-311` (`applyDestructuredPropDefaults`) |
| Default slot | `<slot />` | `utils.js:570-571`, `slots.js:196-201` |
| Named slots | `<slot name="header" />` in the component; `<template #header>`, `<template v-slot:header>`, `<template slot="header">` or `slot="header"` on any element in the caller; presence testable via `$slots.header` | `slots.js:36-78`, `utils.js:507-511`; used at `Sidebar.stx:361-391` |
| Events out | `defineEmits()` in `<script client>`; caller binds `@change="…"` | `Switch.stx:22,36` |
| Imperative handle | `defineExpose({ … })` | `Dialog.stx:26-30`, `Switch.stx:51` |
| Nesting depth | 3 expansion passes, then stop | `component-renderer.js:650-655` |
| Precedence | a local `resources/components/Badge.stx` **shadows** the library `Badge` (local dirs are searched first); a local file also overrides a builtin | `utils.js:397-409`, `component-renderer.js:595-596` |

Requirement 11 is enforced by the runtime, not by convention: `client-script.js:180-215` lists the injected globals — `state`, `derived`, `effect`, `defineProps`, `withDefaults`, `defineEmits`, `defineExpose`, `defineSlots`, `useSlots`, `provide`, `inject`, `useStore`, `defineStore`, `navigate`, `useHead`, `useFetch`, `useQuery`, `useReactiveProp`, `onMount`, `onDestroy` and ~70 more. `utils.js:603` destructures the whole set from `window.stx` into every component's client scope. Importing them is dead code at best.

**WRONG** — `resources/components/InputGroup.stx:1-31`, representative of all 11 dead files:

```stx
<script server>
import { defineProps, withDefaults } from 'stx'
...
</script>

<template>
  <div class="login-input-group">
    <label>{{ label }}:</label>
    <input type="{{ type }}" id="{{ id }}" class="{{ }} classList" placeholder="{{ placeholder }}" />
  </div>
</template>
```

`node_modules/stx` does not exist in this project (deps are `stacks` and `bun-plugin-auto-imports` — `package.json:72-75`). `class="{{ }} classList"` is a broken interpolation. `FeatureButton.stx:20` is worse — `class="(active)active@endif @if feature-btn"`, a directive mangled into an attribute. `NotificationPopup.stx:24,41` calls `onclick="closeNotificationPopup()"` against globals that do not exist.

And `resources/views/components/FeatureCard.stx:1-5` is silently dead — it declares locals, never reads props, so it would always render an empty title and `<img src="">`:

```stx
<script server>
const title = ''
const description = ''
const image = ''
</script>
```

**RIGHT** — the library's own convention (`Badge.stx:2-6`, `Avatar.stx:2-8`), no imports, no `<template>` wrapper needed:

```stx
<script server>
export const title = $props.title || ''
export const description = $props.description || ''
export const image = $props.image || ''
</script>

<article class="area-card">
  @if (image)
    <div class="area-icon"><img src="{{ image }}" alt="" loading="lazy"></div>
  @endif
  <h3>{{ title }}</h3>
  <p>{{ description }}</p>
  <slot />
</article>
```

**CHECK**

```bash
grep -rn "^import" resources/components/*.stx        # expect 0 — everything is auto-imported
grep -rln "DOCTYPE\|<html" resources/components/      # expect 0
grep -rn "const [a-z][A-Za-z]* = ''" resources/components/  # locals masquerading as props
```

### 10.13 MUST delete the dead scaffolding under `resources/components`

**RULE** — Delete the ten unreferenced template files. MUST.

**WHY** — Only `AutofixPanel` is used (`issue/[id].stx:564`); `ContextMenu`/`StartMenu` are referenced solely by their own sibling item files. The rest are Windows-desktop-demo scaffolding from the project template, every one of them shadowing a shipped equivalent that resolves through the plugin dir once §10.1 lands: `NotificationPopup.stx` vs `Notification.stx`; `ContextMenu.stx`/`ContextMenuItem.stx` vs the `dropdown` family (quarantined — delete anyway, they are unused); `InputGroup.stx` vs `TextInput.stx`; `LoginForm.stx` vs `auth/Login.stx`. Additionally, `resources/views/components/FeatureCard.stx` sits inside `pagesDir`, so stx routes it as a public page and builds `/components/FeatureCard` into the sitemap.

**WRONG** — present and unreferenced:

```
resources/components/ContextMenu.stx        resources/components/StartMenu.stx
resources/components/ContextMenuItem.stx    resources/components/StartMenuItem.stx
resources/components/FeatureButton.stx      resources/components/Taskbar.stx
resources/components/InputGroup.stx         resources/components/Window.stx
resources/components/LoginForm.stx          resources/components/PackageItem.stx
resources/components/NotificationPopup.stx  resources/views/components/FeatureCard.stx
```

**RIGHT** — `git rm` all twelve. `resources/components/` then holds `AutofixPanel.stx` plus the new `CodeBlock.stx` from §10.7, and `resources/views/components/` is removed entirely.

**CHECK** — a reference audit, runnable in CI:

```bash
for f in resources/components/*.stx; do
  n=$(basename "$f" .stx)
  c=$(grep -rl "<$n\b" resources/ app/ --include='*.stx' | grep -v "$f" | wc -l)
  [ "$c" -eq 0 ] && echo "UNREFERENCED: $f"
done
```

Plus `test ! -d resources/views/components` — no component may live under `pagesDir`.

## 11. Styling with Crosswind, and TypeScript

Two halves of the same discipline: the browser gets utility classes generated from a typed config, and the editor gets types that actually run. bughq currently fails both — 1,001 lines of hand-written CSS live inside 23 `.stx` files, another 273 in `public/marketing.css`, and `bun run typecheck` inspects exactly nine project files.

### Part A — Crosswind

#### How the CSS actually gets to the page (read this before any rule)

| Step | Mechanism | File:line |
|---|---|---|
| Config discovery | `bunfig` searches `<cwd>`, `<cwd>/config`, `<cwd>/.config` for `crosswind.*` — this is why `config/crosswind.ts` is found | `node_modules/bunfig/dist/discovery.js:32-40`, `node_modules/@stacksjs/stx/dist/dev-server/crosswind.js:145-147` |
| Class extraction | Regex over the **rendered HTML**: `class="…"` plus **string literals only** inside `:class="…"` / `x-class="…"` | `dev-server/crosswind.js:218-238` |
| Config merge | `{...baseConfig, ...userConfig, content: [], output: '', preflight: true, minify: false, theme, safelist}` — your `content`/`output`/`preflight`/`minify` are **discarded** | `dev-server/crosswind.js:305-313` |
| Theme merge | Only `theme.extend` is carried across; top-level `theme.*` keys are dropped | `dev-server/crosswind.js:296-300` |
| Generation | `new CSSGenerator(cfg)`, `generate()` per safelist entry then per extracted class, `toCSS(true, false)` | `dev-server/crosswind.js:313-318` |
| Injection | One `<style data-crosswind="generated">` before `</head>` | `dev-server/crosswind.js:371-393`, called from `process.js:258-259` (top-level render only, gated on `context.__stx_inject_css !== false`) |
| SPA survival | On navigation the router **merges** `style[data-crosswind]` (append-only, dedup by block) and **destroys** every other `<head>` style | `node_modules/stx-router/dist/client.js:517-529, 548` |

Extraction runs on rendered output, so a class string composed in `<script server>` and interpolated with `{{ }}` is safe. A class string computed in the browser is not. That single distinction drives rules 11.4 and 11.5.

---

#### 11.1 MUST NOT put a `<style>` block in any `.stx` file

**WHY.** Three independent mechanisms punish it.

1. It is invisible to Crosswind. The extractor only reads `class=` attributes (`dev-server/crosswind.js:219`); a `<style>` block is dead weight the engine cannot dedupe, purge, or minify.
2. The SPA router tears down and rebuilds page styles on every swap, but only the Crosswind tag is treated as durable (`stx-router/dist/client.js:548` removes every `head style` that is neither `keepIds` nor `[data-crosswind]`). Fragment swaps re-append the incoming page's styles as `style[data-stx-page]` (`client.js:433-438`) while the **entry page's** server-rendered `<style>` — which carries no `data-stx-page` — is never removed (`client.js:418`). Navigate `/dashboard → /settings` and two conflicting `:root` blocks are live at once.
3. It defeats every one of the twelve requirements at once: it is vanilla CSS, it is not a directive, and it is duplicated per file.

**WRONG** — `resources/views/dashboard.stx:298-369`, 72 lines of CSS in a view:

```stx
<style>
:root {
  --bg: #fbfbfd; --panel: #ffffff; --border: rgba(15,23,42,0.09);
  --text: #0b0f19; --text-2: #4b5565; --text-3: #97a1b2; --accent: #e11d48;
  ...
}
.panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px;
  height: 34px; border: 1px solid var(--border); border-radius: 9px; color: var(--text-2);
  background: var(--panel); cursor: pointer; transition: color 0.15s ease, border-color 0.15s ease; }
.chrome-logout { right: 18px; font-weight: 500; cursor: pointer; ... }
</style>
```

**RIGHT** — tokens move to `config/crosswind.ts` (rule 11.2), repeated shapes become shortcuts, one-offs become utilities on the element:

```stx
<!-- resources/views/dashboard.stx — no <style> tag at all -->
<button class="inline-flex items-center justify-center w-[34px] h-[34px] rounded-[9px]
               border border-line bg-panel text-muted transition-colors hover:text-ink">
```

```ts
// config/crosswind.ts
shortcuts: {
  'panel': 'bg-panel border border-line rounded-xl',
  'icon-btn': 'inline-flex items-center justify-center w-[34px] h-[34px] rounded-[9px] border border-line bg-panel text-muted transition-colors hover:text-ink',
},
```

`shortcuts` are expanded by the render path (`dev-server/crosswind.js:319-345`) provided the shortcut name itself appears in a `class=` attribute or in `safelist`.

**CHECK.**
```bash
grep -rln --include='*.stx' '<style' resources/    # must print nothing; currently 23 files
```

---

#### 11.2 MUST declare design tokens exactly once, in `config/crosswind.ts`

**WHY.** `theme.extend.colors` values are emitted verbatim into the utility (`bg-panel { background-color: var(--panel) }` — verified by generating against bughq's own config), and the `var()` targets must be defined in exactly one place or the utilities lie. bughq defines them in **three mutually inconsistent** places:

| Source | `--bg` (light) | `--bg` (dark) | panel token | Consumers |
|---|---|---|---|---|
| `resources/views/dashboard.stx:302` (+ 8 byte-identical copies in `account`, `login`, `register`, `forgot-password`, `reset-password`, `projects/index`, `projects/new`, `settings`) | `#fbfbfd` | `#090b11` | `--panel` | app pages |
| `resources/views/issue/[id].stx:369` | `#f6f7f9` | `#0a0c12` | `--panel`, `--panel-2` | one page |
| `public/marketing.css:5-51` | `#fbfbfd` | `#090b11` | `--surface` (**no `--panel`**) | 26 pages |

`config/crosswind.ts:25` maps `panel: 'var(--panel)'`. On any of the 26 marketing pages that token is undefined, so `bg-panel` resolves to nothing. On `/issue/[id]` the "same" background is a different colour than on `/dashboard`.

**WRONG** — nine copies of this, one per app page (`resources/views/account.stx:64-76`, `dashboard.stx:300-315`, …):

```stx
<style>
:root { --bg: #fbfbfd; --panel: #ffffff; --border: rgba(15,23,42,0.09); ... }
@media (prefers-color-scheme: dark) { :root { --bg: #090b11; ... } }
:root[data-theme="dark"]  { --bg: #090b11; ... }
:root[data-theme="light"] { --bg: #fbfbfd; ... }
</style>
```

**RIGHT** — one `preflights` entry in the typed config. `Preflight` is `{ getCSS: () => string }` (`node_modules/@cwcss/crosswind/dist/types.d.ts:136-138`); the returned CSS is prepended to the generated sheet, so it lands inside the one `<style data-crosswind>` tag the router preserves across SPA swaps:

```ts
// config/crosswind.ts
const LIGHT = `--bg:#fbfbfd;--panel:#ffffff;--panel-2:#f4f5f8;--border:rgba(15,23,42,.09);
--text:#0b0f19;--text-2:#4b5565;--text-3:#97a1b2;--accent:#e11d48;`
const DARK = `--bg:#090b11;--panel:#10131c;--panel-2:#161a24;--border:rgba(148,163,184,.12);
--text:#f3f5f9;--text-2:#b3bccb;--text-3:#667085;--accent:#fb7185;`

preflights: [{
  getCSS: () => `:root{${LIGHT}}
    @media (prefers-color-scheme: dark){:root{${DARK}}}
    :root[data-theme="dark"]{${DARK}}
    :root[data-theme="light"]{${LIGHT}}`,
}],
```

Verified: a `preflights` entry survives the render path's config merge and appears in the generated sheet.

**CHECK.**
```bash
# Any CSS custom property declared outside config/crosswind.ts is a violation.
grep -rn --include='*.stx' -- '--[a-z0-9-]*:' resources/ | wc -l   # must be 0; currently 101
grep -cE -- '^\s*--[a-z-]+:' public/marketing.css                  # must be 0; currently 47
```

---

#### 11.3 MUST end `config/crosswind.ts` with `satisfies CrosswindConfig`, and put every theme value under `theme.extend`

**WHY.** `config/ui.ts:79` ends `} satisfies UiOptions` and is therefore correct. `config/crosswind.ts:40` ends with a bare `}` and is therefore not: line 38 says `preflight: true`, and `preflight` is **not a key of `CrosswindConfig`** — the real key is `includePreflight` (`node_modules/@cwcss/crosswind/dist/types.d.ts:27-48`; the runtime reads `includePreflight ?? true`). It is a silent no-op. So are `content` (lines 14-20), `minify` (line 39) and `output`: the render path overwrites all four unconditionally at `dev-server/crosswind.js:307-310`. Five of the eight lines in that config do nothing.

Separately, `dev-server/crosswind.js:296-300` copies **only** `theme.extend` from user config onto the base theme. A top-level `theme.colors` is silently discarded at request time.

**WRONG** — `config/crosswind.ts:13, 38-40`:

```ts
export default {
  content: [ './resources/views/**/*.{stx,html}', ... ],   // discarded at crosswind.js:307
  theme: { extend: { colors: {...}, fontFamily: {...} } },
  preflight: true,                                          // not a key. no-op.
  minify: false,                                            // discarded at crosswind.js:310
}
```

**RIGHT:**

```ts
import type { CrosswindConfig } from '@cwcss/crosswind'

export default {
  theme: { extend: { colors: { canvas: 'var(--bg)', panel: 'var(--panel)', /* … */ } } },
  preflights: [/* rule 11.2 */],
  safelist: [/* rule 11.4 */],
  shortcuts: { /* rule 11.1 */ },
} satisfies Partial<CrosswindConfig>
```

**CHECK.** Add the `satisfies` and run `tsc`. Confirmed to produce:
```
config/crosswind.ts(38,3): error TS2561: Object literal may only specify known properties,
  but 'preflight' does not exist in type 'Partial<CrosswindConfig>'. Did you mean 'preflights'?
```
Grep guard: `grep -L 'satisfies' config/crosswind.ts` must print nothing.

---

#### 11.4 MUST NOT return a class string from a client-side function

**WHY.** The extractor's dynamic branch (`dev-server/crosswind.js:227-237`) pulls single-quoted **string literals** out of the `:class` attribute value and nothing else. `:class="fn()"` yields zero literals, so zero utilities are generated. The classes then exist in the DOM at runtime with no matching rule.

**WRONG** — `resources/components/AutofixPanel.stx:89-91, 109-113` bound at `:309, :337`:

```stx
<script client>
function loadingClass() {
  return autofixLoading() ? 'grid gap-3 autofix-run' : 'autofix-hidden'
}
function readyClass() {
  return !autofixLoading() && autofixEnabled() && !!currentRepository() && !hasAutofixRun()
    ? 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between autofix-run'
    : 'autofix-hidden'
}
</script>
<div :class="loadingClass()" aria-busy="true">
<div :class="readyClass()">
```

Verified against bughq's own `config/crosswind.ts` — rendering `<div :class="loadingClass()"></div>` produces a sheet in which `.grid`, `.gap-3`, `.flex-col` and `md\:flex-row` are all **absent**. Those styles only ever appear when some *other* element on the same document happens to use the same utility literally.

**RIGHT** — literals inside the attribute. Same test, `<div :class="loading() ? 'grid gap-3' : 'hidden'"></div>`, generates `.grid`, `.gap-3` and `.hidden`:

```stx
<div :class="autofixLoading() ? 'grid gap-3' : 'hidden'" aria-busy="true">
<div :class="isReady() ? 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between' : 'hidden'">
```

If a helper is genuinely unavoidable, every class it can emit MUST be listed in `safelist` in `config/crosswind.ts` — the safelist is merged at `dev-server/crosswind.js:301-304` and force-generated at `:314-315`.

Composing in `<script server>` is always safe, because extraction runs after interpolation. That is how the shipped library does it — `node_modules/@stacksjs/components/src/ui/badge/Badge.stx:30` builds `badgeClasses` in a server block and emits `class="{{ badgeClasses }}"`, and it ships zero `<style>` tags.

**CHECK.** Rendered-output check using stx's own extractor:
```bash
bun -e '
const {extractClassNames}=await import("./node_modules/@stacksjs/stx/dist/dev-server/crosswind.js")
for await (const f of new Bun.Glob("resources/**/*.stx").scan(".")) {
  const s=await Bun.file(f).text()
  for (const m of s.matchAll(/:class="([^"]+)"/g))
    if (!/[\x27]/.test(m[1])) console.log(`${f}: :class="${m[1]}" — extracts no classes`)
}'
```
Currently reports every `:class` in `AutofixPanel.stx`.

---

#### 11.5 MUST NOT use a `style="…"` attribute for anything a utility can express

**WHY.** Inline styles are unreachable by the extractor, unpurgeable, un-themable, and outrank every utility — which is precisely why `dashboard.stx:337` needs the comment *"the ACTIVE tab carries inline accent styles which outrank these rules."* They are also a CSP liability: `config-types.d.ts` exposes a `csp` surface that a `style-src 'unsafe-inline'`-free policy would break.

**WRONG** — 102 occurrences across `resources/`, 14 of them re-deriving tokens by hand (`resources/components/AutofixPanel.stx:318`):

```stx
<p :class="repositoryFieldsClass()"
   style="color:var(--text-2); font-size:.875rem; margin:0 0 .75rem">Connect the repository…</p>
```

**RIGHT:**

```stx
<p :class="canRun() ? 'block' : 'hidden'" class="text-muted text-sm mt-0 mb-3">Connect the repository…</p>
```

The only legitimate `style=` is a value that is genuinely computed per-render and unbounded — a progress bar width, a chart bar height. Those MUST be bound with `:style`, never string-concatenated into a static attribute: `AutofixPanel.stx:348` `<span :style="autofixProgressStyle()">` is correct.

**CHECK.**
```bash
grep -rn --include='*.stx' 'style="' resources/ | grep -v ':style='   # currently 102
```
Manual review for the `:style` survivors: each must be a genuinely continuous numeric value.

---

#### 11.6 MUST NOT let a component reference a token its host page happens to define

**WHY.** Components are placed by their consumer. A component whose CSS depends on variables declared in one particular page's `<style>` block renders wrong everywhere else, and the failure is silent — an undefined `var()` resolves to the property's initial value, not an error.

**WRONG** — `resources/components/AutofixPanel.stx:250-295` references `var(--panel-2)` and `var(--border-2)` seven times:

```stx
<style>
.autofix-top   { ... border-bottom: 1px solid var(--border-2); }
.autofix-setup { padding: 1rem 1.1rem 1.15rem; background: var(--panel-2); }
.autofix-step  { border-top: 1px solid var(--border-2); }
</style>
```

`--panel-2` and `--border-2` are declared in exactly one file in the entire repo: `resources/views/issue/[id].stx:369`. That is also the only page that mounts the component (`issue/[id].stx:564`). Drop `<AutofixPanel>` on `/dashboard` — which defines `--panel` but not `--panel-2` — and every panel surface goes transparent.

**RIGHT.** The tokens live in `config/crosswind.ts` `preflights` (rule 11.2) and the component uses utilities that are defined for every page:

```stx
<!-- resources/components/AutofixPanel.stx — no <style> -->
<section class="w-full min-w-0 overflow-hidden bg-panel border border-line rounded-[14px]"
         aria-labelledby="autofix-heading">
  <div class="flex items-center justify-between gap-4 px-[1.1rem] py-4 border-b border-line">
```

**CHECK.**
```bash
# every var(--x) referenced from resources/components must be declared in config/crosswind.ts
comm -23 \
  <(grep -rhoE -- '--[a-z0-9-]+' resources/components/*.stx | sort -u) \
  <(grep -ohE -- '--[a-z0-9-]+' config/crosswind.ts | sort -u)
```

---

#### 11.7 SHOULD delete `public/marketing.css`; only `preflights` is legitimate global CSS

**WHY.** `public/marketing.css` is 273 lines / 16 KB defining 121 bespoke classes (`.btn`, `.panel`, `.cell`, `.chip`, `.hero`, `.cmp-cell`, …) linked by 26 pages (`resources/views/index.stx:39`). Every one of those is a utility composition, i.e. a `shortcut`. Worse, it is a render-blocking external stylesheet that the SPA router must special-case: because the app→marketing boundary arrives without it, `config/ui.ts:38-42` documents `data-no-router` as the workaround.

Crosswind already emits the reset — `includePreflight` defaults true and the render path hardcodes `toCSS(true, false)` (`dev-server/crosswind.js:318`). Confirmed output includes `*,::before,::after{box-sizing:border-box}`, `[hidden]{display:none}`, `img{max-width:100%;height:auto}`.

**What legitimately stays hand-written CSS, and where it goes:**

| Category | Example | Where |
|---|---|---|
| Design tokens | `:root { --bg: … }` | `preflights` (rule 11.2) |
| `@font-face` / web fonts | Space Grotesk, JetBrains Mono | `fonts: { google: [...], display: 'swap' }` — `@cwcss/crosswind/dist/types.d.ts:20-25` emits the `@import`/`@font-face` for you |
| Named `@keyframes` beyond the built-ins | `@keyframes autofix-shimmer` | `preflights` |
| Pseudo-elements no utility reaches | `::-webkit-scrollbar`, `summary::-webkit-details-marker`, `::selection` | `preflights` (verified: a `preflights` entry emitting `::selection{…}` reaches the sheet) |
| Third-party widget overrides | none in bughq | `preflights` |
| Anything else | — | **utilities or a shortcut. No exceptions.** |

Everything in that table lands inside the single `<style data-crosswind="generated">` tag, which is the only style tag the SPA router preserves and merges rather than destroys (`stx-router/dist/client.js:517-529`).

**CHECK.**
```bash
grep -rn --include='*.stx' 'marketing.css' resources/ | wc -l   # must be 0; currently 26
test ! -f public/marketing.css
ls public/*.css 2>/dev/null                                     # must print nothing
```

---

#### 11.8 MUST make `dark:` work before using a component that ships it

**WHY.** Crosswind's `darkMode` defaults to `'class'`. Verified: `dark:bg-red-900` compiles to `.dark .dark\:bg-red-900 { … }` with the default and to `@media (prefers-color-scheme: dark){ .dark\:bg-red-900 { … } }` with `darkMode: 'media'` (`@cwcss/crosswind/dist/types.d.ts:34`). bughq's theme switch writes `data-theme` on `<html>` and never a `dark` class (`resources/views/dashboard.stx:312-315`). Every `dark:` utility in the shipped library — `Badge.stx:9-16` alone has fourteen — is therefore dead in bughq today.

bughq's own markup does not need `dark:` at all: the semantic tokens flip under `[data-theme]` and `prefers-color-scheme`, so `bg-panel` is correct in both modes with one class. That is the intended pattern and MUST be preserved.

**RIGHT.** Keep `darkMode: 'class'` (so an explicit user choice wins over the OS) and have the theme writer set both attributes on `<html>`:

```ts
// resources/stores/theme.ts — one place, per rule 11.2's sibling in the state chapter
root.setAttribute('data-theme', mode)
root.classList.toggle('dark', mode === 'dark')
```

Do **not** switch to `darkMode: 'media'`: it would make library components follow the OS and ignore the user's toggle, producing a light Badge on a dark page.

**CHECK.**
```bash
grep -rn --include='*.stx' 'dark:' resources/ | head            # bughq markup: should stay empty
grep -rn "classList.toggle('dark'\|classList.add('dark')" resources/   # must find the theme writer
```

---

### Part B — TypeScript

#### 11.9 MUST make `tsconfig.json` include every file you write

**WHY.** This is the rule that makes all the others enforceable, and it is currently the single largest gap in the repo.

`tsconfig.json:31-38` includes only `*.ts`, `*.d.ts`, `types/**/*.d.ts`, `app/Models/**`, `app/Services/**`, `app/Support/**`. `tsc --noEmit --listFilesOnly` confirms `bun run typecheck` inspects **nine** project files:

```
site.config.ts, types/stacks-app.d.ts, types/ts-cloud-augment.d.ts,
app/Models/{AlertChannel,ErrorEvent,Issue,Project,Subscription,User}.ts, app/Support/urls.ts
```

Not `app/Actions/**`, not `app/Errors/**`, not `app/Autofix/**`, not `config/**`, not `resources/**`. The irony is on display in the repo itself: `types/ts-cloud-augment.d.ts:5-7` says it exists so *"`config/cloud.ts` fails `tsc --noEmit` even though the config is valid"* — but `config/` is not in `include`, so the augmentation guards nothing.

**WRONG** — `tsconfig.json:31-38`:

```json
"include": [
  "*.ts", "*.d.ts", "types/**/*.d.ts",
  "app/Models/**/*.ts", "app/Services/**/*.ts", "app/Support/**/*.ts"
],
```

**RIGHT:**

```json
"include": [
  "*.ts", "*.d.ts",
  "types/**/*.d.ts",
  "app/**/*.ts",
  "config/**/*.ts",
  "resources/**/*.ts"
],
```

The cost is bounded and measured — expanding `include` this way produces exactly **12** errors, all real:

| File | Error |
|---|---|
| `app/Actions/Auth/SocialCallbackAction.ts:34,110` | `Property 'html' does not exist on type 'ResponseFactory'` |
| `app/Actions/StripeWebhook.ts:2,67` | missing `stripe` types; `event` implicitly `any` |
| `config/auth.ts:94`, `config/dns.ts:28` | `string \| number \| true` not assignable to `string` |
| `config/commit.ts:2` | two non-existent imports from `@stacksjs/utils` |
| `config/deps.ts:18-19`, `config/query-builder.ts:74` | invalid literal / missing `snapshotDir` |
| `resources/functions/dark.ts:5` | **`Cannot find name 'usePreferredDark'`** |

That last one is a live runtime bug: `resources/functions/dark.ts:5` calls `usePreferredDark()`, which is exported from `@stacksjs/stx/composables` but is **neither** in `STX_AUTO_IMPORTS` (`client-script.js:143-218`) **nor** an ambient global in `stx.d.ts`. It is a `ReferenceError` waiting for a page to touch it, and the current `include` hides it.

**CHECK.** `bun run typecheck` must exit 0 **and** `tsc --noEmit --listFilesOnly | grep -v node_modules | wc -l` must be greater than the number of files you touched.

---

#### 11.10 MUST put shared app types in `types/`, one declaration per concept

**WHY.** `types/` exists, is already on the `include` path (`tsconfig.json:34`), and is empty of app types — `types/stacks-app.d.ts` is ten bytes: `export {}`. With nowhere to put them, types have been re-declared inline. `app/Errors/alerts.ts:20-29` and `app/Errors/channels.ts:18-27` declare `AlertKind` twice and the same six-field issue shape under two names, field for field:

```ts
// app/Errors/alerts.ts:20                      // app/Errors/channels.ts:18
export type AlertKind = 'new' | 'regression'    export type AlertKind = 'new' | 'regression'
export interface AlertIssue {                   export interface ChannelIssue {
  id: string                                      id: string
  title: string                                   title: string
  culprit?: string | null                         culprit?: string | null
  level?: string | null                           level?: string | null
  environment?: string | null                     environment?: string | null
  count?: number                                  count?: number
}                                               }
```

`app/Errors/limits.ts:23` is worse — `interface Window { count: number; resetAt: number }` shadows the DOM `Window` inside that module, and `lib` includes `DOM` (`tsconfig.json:11`).

**RIGHT** — the layout an agent MUST follow:

| Path | Holds |
|---|---|
| `types/globals.d.ts` | ambient wiring only (rule 11.12) — triple-slash references, no app types |
| `types/domain.ts` | entities the app reasons about: `Issue`, `Project`, `AlertKind`, `IngestAuth` |
| `types/api.ts` | request/response shapes crossing `/api/*` |
| `types/views.ts` | per-view server-block context shapes: `DashboardContext`, `IssueContext` |
| `types/props.ts` | component prop interfaces (rule 11.11) |

Module-private helper types stay in their module. Anything named in two files moves to `types/`.

```ts
// types/domain.ts
export type AlertKind = 'new' | 'regression'
export type ChannelType = 'slack' | 'discord'

export interface AlertIssue {
  id: string
  title: string
  culprit?: string | null
  level?: string | null
  environment?: string | null
  count?: number
}
```
```ts
// app/Errors/channels.ts
import type { AlertIssue, AlertKind, ChannelType } from '~/types/domain'
```

`~/*` already maps to `./*` (`tsconfig.json:26`), and a plain value import through that alias is verified to resolve inside a `<script server>` block too.

**CHECK.**
```bash
# any interface/type name declared in two or more files under app/ or resources/
grep -rhoE '^(export )?(interface|type) [A-Z][A-Za-z0-9]*' app/ resources/ --include='*.ts' \
  | awk '{print $NF}' | sort | uniq -d
```
Currently prints `AlertKind`. Additionally, `grep -rn 'interface \(Window\|Document\|Event\|Element\|Response\|Request\)\b' app/ resources/` must print nothing.

---

#### 11.11 MUST type `<script server>` data and component props

**WHY.** Every `<script>` block in a `.stx` file is TypeScript unless it is tagged `js` or `lang="js"` (`node_modules/@stacksjs/stx/dist/utils.js:28-33`), and server blocks go through `new Bun.Transpiler({ loader: 'ts' })` (`variable-extractor.js:218`). Verified end-to-end: a server block containing `import type`, `interface`, `const rows: Row[]` and `satisfies` renders correctly, with all annotations erased. There is no excuse for untyped server data.

**WRONG** — `resources/views/dashboard.stx:45, 55-56`. Under `"strict": true` these infer `null`, `any[]`, `null`; every downstream `.id`, `.name`, `.is_owner` access is unchecked, and the template's `{{ activeProject.name }}` has no contract at all:

```stx
<script server>
let user = null
let projects = []
let activeProject = null
</script>
```

**RIGHT:**

```stx
<script server>
import type { DashboardContext, ProjectRow, PendingInvite } from '~/types/views'
import type { AuthUser } from '~/types/domain'

useHead({ title: 'Issues - bughq' })

let user: AuthUser | null = null
let projects: ProjectRow[] = []
let activeProject: ProjectRow | null = null
let pendingInvites: PendingInvite[] = []

projects = (await db.unsafe<ProjectRow>(/* … */, [Number(user.id), userEmail])) ?? []
</script>
```

For components, prefer the form that already works and does not hand-import (rule 11.12) — `resources/components/AutofixPanel.stx:1-8` is the correct model in the repo, with the interface hoisted to `types/props.ts`:

```stx
<script>
import type { AutofixPanelProps } from '~/types/props'
const { issueId, projectId } = defineProps<AutofixPanelProps>()
</script>
```

Client blocks are TypeScript too, so annotate them. `AutofixPanel.stx:14, 27` currently ships `const autofixState = state(null)` (inferred `StxSignal<null>`) and `function activeRun(run)` (implicit `any`). Write `const autofixState = state<AutofixState | null>(null)` **in a server block or a hoisted `.ts` module** — see rule 11.12 for why the generic form is forbidden at a client call site — and `function activeRun(run: AutofixRun | null): boolean`.

**CHECK.** Manual review plus:
```bash
# server-block bindings initialised to a bare null/[] with no annotation
grep -rn --include='*.stx' -E '^\s*let [a-zA-Z]+ = (null|\[\])\s*$' resources/   # currently 3 in dashboard.stx
```
Once rule 11.9 lands, hoisting these shapes into `types/*.ts` makes them `tsc`-verified for real.

---

#### 11.12 MUST NOT hand-import an auto-imported symbol, and MUST NOT call one with a generic type argument

**WHY — the hand-import half.** `client-script.js:296-310` finds `import { … } from 'stx' | '@stacksjs/browser'`, records the names, and **replaces the whole statement** with `// [auto-import processed]`. The names are then re-bound from `window.stx` / `window.StacksBrowser` (`client-script.js:334-343`). A hand-written import is at best a no-op and at worst a redirect: import an stx symbol from any *other* module specifier and it is bound from `window.StacksBrowser`, which does not have it, and the emitted guard (`client-script.js:347-363`) logs `"…the client runtime does not provide it."`

**WRONG** — 11 of 12 files in `resources/components/` open with the same dead line (`FeatureButton.stx:2`, `InputGroup.stx:2`, `LoginForm.stx:2`, `Window.stx:2`, `Taskbar.stx:2`, `StartMenu.stx:2`, `StartMenuItem.stx:2`, `ContextMenu.stx:2`, `ContextMenuItem.stx:2`, `PackageItem.stx:2`, `NotificationPopup.stx:2`):

```stx
<script server>
import { defineProps, withDefaults } from 'stx'
</script>
```

**RIGHT** — `AutofixPanel.stx:1-8` gets it right: no import at all. The 74 auto-imported symbols are listed at `client-script.js:143-218`; the browser-core set at `:218-227`. Ambient TypeScript declarations for them ship with the package (`dist/stx.d.ts`, pulled in by `/// <reference path="./stx.d.ts" />` at `dist/index.d.ts:1`). **Only** `import type` is ever acceptable, and only for types — value imports of `state`, `derived`, `computed`, `useHead`, `defineProps`, `navigate`, `useCookie`, `onMount`, … are forbidden.

**WHY — the generic half.** Auto-import detection runs on the raw TypeScript **before** erasure (`client-script.js:727` `transformAutoImports`, then `:734` `transpileTypeScript`), and the detector's regex is `\b<symbol>\s*\(` (`client-script.js:315`). `useSessionStorage<string>(` puts a `<` where the `(` must be, so the symbol is never detected and the destructuring line is never emitted.

Verified end-to-end by rendering a real `.stx`:

```
<script client>const tok = useSessionStorage('k','')</script>
  ->  var { useSessionStorage } = window.stx || window;
      const tok = useSessionStorage("k", "");

<script client>const tok = useSessionStorage<string>('k','')</script>
  ->  (no destructuring emitted)
      const tok = useSessionStorage("k", "");     // ReferenceError at runtime
```

The signals runtime assigns 40 of the 74 symbols directly to `window` (`signals.js:4627ff`), so those degrade silently rather than crashing. The other **34 hard-fail**:

`untrack, peek, isSignal, isDerived, setRouteParams, useOptimistic, useReactiveProp, useSessionStorage, useCookie, definePageMeta, useMeta, watchMultiple, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, defineProps, withDefaults, defineEmits, defineExpose, defineSlots, inject, nextTick, getCurrentInstance, onErrorCaptured, useSlots, useAttrs, createStore, action, createSelector, h, Fragment`

`useCookie` is on that list, and the audit calls for replacing 17 hand-serialised `document.cookie` writes with it.

**RIGHT** — annotate the binding, never the call:

```stx
<script client>
const token: StxSignal<string> = useCookie('bughq_token')
const draft = useSessionStorage('issue-draft', '') as StxSignal<string>
</script>
```

`defineProps<T>()` in a **server** block is exempt — that path does not run `transformAutoImports` — which is why the 12 existing `defineProps<T>()` calls work. Do not generalise from them.

**WIRING (do this once).** Create `types/globals.d.ts` so both the stx ambients and the generated auto-imports are guaranteed in the program rather than arriving by accident through a transitive import:

```ts
/// <reference types="@stacksjs/stx" />
/// <reference path="../.stx/route-types.d.ts" />
/// <reference path="../storage/framework/auto-imports/globals.d.ts" />
```

Verified: with that file present, `state(0)`, `useDark()` and `haversineDistance` all resolve under `tsc --noEmit` — and the reference chain drags `resources/functions/*` into the program, which is what surfaces the `usePreferredDark` bug from rule 11.9. Note `storage/framework/**` is in `exclude` (`tsconfig.json:44`); `exclude` does not block files reached by reference, so this works as written.

**CHECK.**
```bash
# 1. hand-imports — currently 11
grep -rnE --include='*.stx' "^\s*import \{[^}]*\} from '(stx|@stacksjs/browser)'" resources/

# 2. generic calls in client/signals blocks, classified by stx's own classifier
bun -e '
const {classifyAllScripts}=await import("./node_modules/@stacksjs/stx/dist/script-classifier.js")
const S=/\b(state|derived|effect|batch|untrack|peek|onMount|onDestroy|useRef|navigate|useRoute|useSearchParams|useFetch|useQuery|useMutation|useOptimistic|useReactiveProp|useLocalStorage|useSessionStorage|useCookie|useWebSocket|useHead|useSeoMeta|useEventListener|useDebounce|useThrottle|useInterval|useTimeout|useToggle|useCounter|useAsync|useColorMode|useDark|ref|reactive|computed|watch|watchEffect|defineProps|withDefaults|defineEmits|defineSlots|defineExpose|inject|nextTick|h)\s*<[^<>()]*>\s*\(/g
let bad=0
for await (const f of new Bun.Glob("resources/**/*.stx").scan(".")) {
  const {signals,client}=classifyAllScripts(await Bun.file(f).text())
  for (const s of [...signals,...client]) for (const m of s.content.matchAll(S)) { console.log(f,m[0].trim()); bad++ }
}
process.exit(bad?1:0)'
```
Check 2 passes today (all 12 generics sit in server blocks) — keep it in CI so the first `useCookie<string>()` fails the build instead of the page.

## 12. Verification and enforcement

"Done" is not a judgement you are permitted to make. It is the output of a fixed set of commands. This chapter defines them.

Throughout, `dist/…` means `node_modules/@stacksjs/stx/dist/…` (stx 0.2.113), and `router/…` means `node_modules/stx-router/dist/…`. Every number quoted was measured against the working tree, not estimated.

---

### 12.1 MUST — turn on stx `strict` in `config/ui.ts` before editing any `.stx` file

**RULE.** `config/ui.ts` must set `strict: { enabled: true, failOnViolation: false, allowPatterns: [...] }`. Do not write a client script until it does.

**WHY.** stx ships the "no vanilla JS" rule as executable code, not documentation. `dist/script-validation.js:1-127` is a 25-entry table of prohibited browser APIs, each carrying the exact stx replacement (`document.cookie → useCookie()`, `window.location → navigate()`, `setInterval → useInterval()`, `document.getElementById → useRef()`). `dist/process.js:704` calls `validateClientScript(content, filePath, options.strict)` on every non-`server` script block in every render. With `strict` unset, `dist/script-validation.js:129` defaults it to `{ enabled: false }` and the guard at `dist/script-validation.js:148` (`if (errors.length > 0 && strictConfig.enabled)`) discards every finding. The option is typed at `dist/types/config-types.d.ts:309` (`strict?: boolean | StrictModeConfig`, interface at `:214-218`) and is forwarded to the renderer by `node_modules/bun-plugin-stx/dist/serve.js:9517` and `:9698` — but only under `"strict" in stxConfig`, so an absent key is never forwarded.

**WRONG** — `config/ui.ts:8-79`. The whole default export; there is no `strict` key anywhere in the file:

```ts
export default {
  componentsDir: 'resources/components',
  layoutsDir: 'resources/views/layouts',
  partialsDir: 'resources/partials',
  router: { container: 'main', interceptAllLinks: true },
  app: { head: { title: 'bughq' } },
} satisfies UiOptions
```

Resolved at runtime, `loadStxConfig(process.cwd())` returns `strict: undefined`. Consequence: **85 prohibited DOM calls across 11 `.stx` files** render silently today.

**RIGHT:**

```ts
export default {
  // …existing keys…

  // stx's own DOM-API guard (dist/script-validation.js:128-157), wired into every
  // client script at dist/process.js:704. Warn-only until the list is clean, then
  // flip failOnViolation and regressions throw at render instead of shipping.
  strict: {
    enabled: true,
    failOnViolation: false,
    allowPatterns: [
      'location.replace()', // pre-paint auth guard — must beat first paint
    ],
  },
} satisfies UiOptions
```

`allowPatterns` is matched against the rule's `message` **or** its `pattern.source` (`dist/script-validation.js:131`), so `'location.replace()'` suppresses exactly that one rule.

**CHECK:**

```bash
bun -e 'const c=(await import("./config/ui.ts")).default; if(c.strict==null){console.error("config/ui.ts: strict is unset");process.exit(1)}'
```

---

### 12.2 MUST — lint with `bunx --bun pickier .`, never eslint, and gate on `--max-warnings 0`

**RULE.** The only linter is pickier. Never invoke `eslint`. A change is not done until `bunx --bun pickier . --max-warnings 0` exits 0.

**WHY.** `AGENTS.md:16-17` states it as a project law ("Use **pickier** for linting, never eslint directly"), and `.claude/skills/stacks-lint/SKILL.md` repeats it as CRITICAL RULE 1. It is not stylistic: pickier lints `.stx` files, and its `pickier/sort-tailwind-classes` rule is the machine enforcement of the Crosswind-only requirement. Measured on this tree, `bunx --bun pickier resources config app` reports **470 problems, 100% of them `pickier/sort-tailwind-classes` in `.stx` files** — all auto-fixable. eslint cannot see a `.stx` file at all, so running it produces a false green.

Default exit is 0 even with warnings; `--max-warnings <n>` (pickier 0.1.44) is what makes it a gate. Verified: `pickier resources` → exit 0; `pickier resources --max-warnings 0` → exit 1.

**WRONG:** running `eslint .`, or running `bunx --bun pickier .`, reading "470 warnings", and calling it clean because the exit code was 0.

**RIGHT:**

```bash
bunx --bun pickier . --fix          # auto-sort Crosswind classes, fix what is fixable
bunx --bun pickier . --max-warnings 0   # then gate; must exit 0
```

**CHECK:**

```bash
bunx --bun pickier . --max-warnings 0
bunx --bun pickier . --reporter compact | awk '{print $3}' | sort | uniq -c | sort -rn   # rule breakdown
```

---

### 12.3 MUST — run `lintStxStrict` yourself; it is not wired into pickier

**RULE.** Run stx's footgun linter over `resources/**/*.stx` on every change. Pin the rule toggles in a committed script with a comment citing the runtime line that justifies each toggle.

**WHY.** `dist/strict-lint.js` ships a self-contained detector for the five documented "looks correct, does nothing" patterns (`stacksjs/stx#1744`, Phase 1). Its own header states the wiring is a follow-up — it is exported from the package root (`import { lintStxStrict } from '@stacksjs/stx'`, verified) but **no CLI, no pickier rule, and no build step calls it**. If you do not call it, it never runs. Entry point `dist/strict-lint.js:267-280`; per-rule toggles via `StxStrictOptions.rules` (`dist/strict-lint.d.ts`).

Measured on this tree: **40 diagnostics in 12 files.** Both firing rules are stale against 0.2.113, and this is why the "pin the toggles with a citation" half of the rule exists — an agent that mass-edits on Phase-1 output will damage 40 working call sites.

| Rule | Fires in bughq | Verdict vs 0.2.113 | Proof |
|---|---|---|---|
| `stx/no-bare-function-ref-in-event` | 29 (`settings.stx` ×12, `AutofixPanel.stx` ×4, …) | **Stale — false positive.** The runtime added bare-ref support. | `dist/signals.js:1356-1362` `bareIdMatch` → `return ($event) => fn($event)`, reached first at `dist/signals.js:1878-1879` via `parseEventShorthand`. The source comment at `dist/signals.js:1354-1355` describes the old no-op behaviour the fix replaced. |
| `stx/no-view-level-script-client` | 11 (every app view: `login.stx:13`, `dashboard.stx:210`, `settings.stx:160`, …) | **Stale — false positive.** View-level `<script client>` compiles normally. | Minimal repro: a view with `<script client>` renders `<body data-stx="__stx_setup_…">` and the function body survives, both with and without a layout applied. |
| `stx/store-value-imports-must-be-local` | 0 | Untriggered — bughq has no `resources/stores/` | `dist/strict-lint.js:161-...` only runs for paths containing `resources/stores/` |
| `stx/no-signal-call-in-for-iteration-var` | 0 | Advisory | `dist/strict-lint.js` |
| `stx/no-backticks-in-html-comments` | 0 | Advisory — but see 12.5; the rule scans `<!-- -->` only (`dist/strict-lint.js:248`), not `{{-- --}}` | 22 backticks exist in bughq comments, all inside `{{-- --}}`, all correctly ignored |

**WRONG:** taking the 40 diagnostics at face value and rewriting `@click="toggleTheme"` → `@click="toggleTheme()"` in 29 places.

**RIGHT:** disable the two stale rules explicitly, with the citation inline, so the next agent does not re-litigate it:

```ts
const RULES = {
  // Both stale vs stx 0.2.113. Bare refs are handled by dist/signals.js:1356-1362
  // (parseEventShorthand bareIdMatch); view-level <script client> compiles to a
  // normal __stx_setup_ function. Re-enable and re-verify on an stx upgrade.
  'stx/no-bare-function-ref-in-event': false,
  'stx/no-view-level-script-client': false,
} as const
```

**CHECK:**

```bash
bun -e '
import { lintStxStrict } from "@stacksjs/stx"; import { Glob } from "bun"
const RULES = { "stx/no-view-level-script-client": false, "stx/no-bare-function-ref-in-event": false }
let n = 0
for await (const f of new Glob("resources/**/*.stx").scan(".")) 
  for (const d of lintStxStrict(await Bun.file(f).text(), { filePath: f, rules: RULES }))
    { console.log(`${f}:${d.line}:${d.column} ${d.ruleId} ${d.message}`); n++ }
process.exit(n ? 1 : 0)'
```

Re-run this **with `rules: {}`** after every `@stacksjs/stx` version bump and re-triage the two toggles against the shipped runtime.

---

### 12.4 MUST — never let the characters `</script` appear inside a `<script>` body, in any form

**Silent-failure landmine 1.**

**RULE.** A JS comment, string literal, or template literal inside a `<script>` block must never contain `</script`. Write "the client script block", not "the `</script>` tag".

**WHY.** stx scans client scripts with `scanScriptTags` (`dist/signal-processing.js:8-24`), whose body terminator is a naive first-match: `dist/signal-processing.js:13` — `html.toLowerCase().indexOf("</script>", bodyStart)`. It is not comment-aware. stx *does* ship a comment-aware, string-aware, regex-aware scanner — `findScriptBodyEnd` at `dist/process.js:55-120` — but it is used **only** for `<script server>` blocks (`dist/process.js:677`). Client scripts go through the naive path at `dist/process.js:695-706`. The browser's own HTML parser behaves identically, so the failure is doubled.

Reproduced end-to-end through `processDirectives`:

```
input:  <script client>
          // now handled in the </script> block
          const n = state(1)
          function bump(){ n.set(n()+1) }
        </script>
        <main><b @click="bump()">{{ n() }}</b></main>

output: <body>                                    ← data-stx="__stx_setup_…" GONE
        <script/><script/> block
        const n = state(1)
        function bump(){ n.set(n()+1) }
        </script>
        <main><b @click="bump()"></b></main>       ← {{ n() }} never interpolated
```

The script body is truncated at `// now handled in the `, the remaining JS is emitted as **visible page text**, `<body>` loses its `data-stx` setup binding (`dist/process.js:234-236` only stamps it when a `__stx_setup_` function survives), and the page is inert.

The one diagnostic stx emits is `[stx] page.stx: <script> 0 opened, 1 closed — 1 stray </script>.` from `warnUnbalancedTags` (`dist/template-tag-balance.js:73-92`), gated at `dist/process.js:198` to `options.debug || (!isProduction() && !isTest())` and deduped once per `filePath:length` by `dist/template-tag-balance.js:82-84`. It is a `console.warn` in dev-server stdout. In production it never prints.

**WRONG** (the shape that broke bughq — documented at `.claude/skills/stacks-browse/SKILL.md:217-222`): a comment reading "…now handled in the `<script client>` block" produced `SyntaxError: Unexpected identifier` from the router's `doFragSwap` on every navigation to that page, while the page still *looked* fine because the swap completed.

**RIGHT:**

```js
// now handled in the client script block
```

**CHECK** — the truncation hides itself from a body scan (the body is already cut short), so count tags instead:

```bash
bun -e '
import { Glob } from "bun"; let n = 0
for await (const f of new Glob("resources/**/*.stx").scan(".")) {
  const s = await Bun.file(f).text()
  const open = (s.match(/<script\b/gi) ?? []).length, close = (s.match(/<\/script\s*>/gi) ?? []).length
  if (open !== close) { console.log(`${f}: ${open} <script> vs ${close} </script>`); n++ }
}
process.exit(n ? 1 : 0)'
```

Control test (mandatory the first time you wire this): plant `// never write </script> here` in a scratch `.stx`, confirm the check fires, then remove it. Verified — the control reports `1 <script> vs 2 </script>`.

---

### 12.5 MUST — comment with `{{-- --}}`; never use `<!-- -->` in a `.stx` file

**Silent-failure landmine 2.**

**RULE.** Every comment in a `.stx` file uses `{{-- … --}}`. `<!-- … -->` is prohibited in `resources/views/`, `resources/components/`, `resources/partials/`, and `resources/layouts/`.

**WHY.** `{{-- --}}` is compiled away; `<!-- -->` ships to the browser verbatim and is then parsed as content by four separate consumers. Verified:

```
source: {{-- SECRET_STX with <html> and </script> and ` --}}
        <!-- SECRET_HTML -->
        <main>x</main>

rendered output contains SECRET_STX  : false
rendered output contains SECRET_HTML : true
```

The specific kill is `<html>`. `hasDocumentShell` (`dist/document-shell.js:64-66`) is a raw text test — `/<!DOCTYPE\b/i.test(html) || /<html[\s>]/i.test(html)` — run over the whole rendered string at `dist/process.js:223`. A true result makes `ensureDocumentShell` return the html untouched (`dist/document-shell.js:101-103`). Measured:

| Page source | `<!DOCTYPE>` + `<html>` + `<head>` emitted? |
|---|---|
| `<main>Hi</main>` | yes |
| `<!-- the <html> tag is banned here -->` + `<main>Hi</main>` | **no** |
| `<!-- <!DOCTYPE html> -->` + `<main>Hi</main>` | **no** |
| `{{-- the <html> tag is banned here --}}` + `<main>Hi</main>` | yes |

With no `<head>`, the layout-metadata injection at `dist/process.js:227-232` is skipped (it is gated on `result.includes("<head")`), so the page ships without `<meta name="stx-layout">`. On a full-document swap the client router then fails `isStxDocument` (`router/client.js:447-457`, which looks for exactly `name="stx-layout"`, `__stxRouterConfig`, or `data-stx-content`) and executes `location.href=url` at `router/client.js:392` — a native full reload. `.claude/skills/stacks-browse/SKILL.md:223-227` records the incident: *"One comment mentioning `<html>` silently turned every app-to-app navigation into a full reload."*

`<script` inside an HTML comment is the same family via a different consumer: the fragment swap re-executes scripts by regex-scanning the incoming HTML (`router/client.js:405-408`) and matches inside comments (`SKILL.md:217-222`). A backtick inside an HTML comment is the third (`dist/strict-lint.js:247-262`).

**WRONG:**

```html
<!-- Confirm modal (archive / delete): type the project name to confirm -->
```
— `resources/views/settings.stx:970`. Harmless today, but it is one word away from fatal and it ships to every visitor.

**RIGHT** — the shape already used correctly at `resources/views/layouts/default.stx:1-38`, which safely contains `<main>`, `<head>`, `<StxLink>` and backticks precisely because it is `{{-- --}}`:

```
{{-- Confirm modal (archive / delete): type the project name to confirm --}}
```

**CHECK:**

```bash
grep -rn --include='*.stx' -e '<!--' resources/views resources/components resources/partials resources/layouts
```

Must return nothing. If a genuine HTML comment is required (a conditional comment, a build marker), the narrower gate is:

```bash
bun -e '
import { Glob } from "bun"; let n = 0
for await (const f of new Glob("resources/**/*.stx").scan(".")) {
  const s = await Bun.file(f).text()
  for (const m of s.matchAll(/<!--([\s\S]*?)-->/g))
    if (/<\/?html\b|<!DOCTYPE\b|<\/?script\b|`/i.test(m[1]))
      { console.log(`${f}:${s.slice(0,m.index).split("\n").length}  banned token in <!-- -->`); n++ }
}
process.exit(n ? 1 : 0)'
```

---

### 12.6 MUST — never write `<!DOCTYPE` in a page or component

**Silent-failure landmine 3.**

**RULE.** No `.stx` file under `resources/views/`, `resources/components/`, or `resources/partials/` may contain `<!DOCTYPE`. The shell is produced by `autoShell` from `app.head` in `config/ui.ts`, or by a layout.

**WHY.** A DOCTYPE is stx's *implicit* signal to disable the entire layout system. `dist/process.js:311-312`:

```js
const hasDoctype = /<!DOCTYPE\s/i.test(output), hasSections = /@section\s*\(/.test(output);
if (!hasDoctype || hasSections) {
```

Everything inside that branch — `_layout.stx` auto-discovery (`dist/process.js:313-327`), `defaultLayout` resolution (`dist/process.js:328-331`), and the automatic `@section('content')` wrap (`dist/process.js:332-335`) — is skipped. Nothing is logged. Measured against a real `layoutsDir` + `defaultLayout`:

| Page | Layout applied? |
|---|---|
| `<main><h1>Hi</h1></main>` | **yes** |
| `<!DOCTYPE html><html>…<main><h1>Hi</h1></main>…</html>` | **no** |
| `<!DOCTYPE html><html><body>@section('content')<main>Hi</main>@endsection</body></html>` | **yes** — the `||` flips it back on |

That last row is the trap: the gate is an **OR**. A DOCTYPE page that gains a single `@section(` starts resolving a layout, and `dist/process.js:332-335` then wraps its *entire document, DOCTYPE included*, into `@section('content')` and injects it into the layout's `@yield('content')` — producing a nested document.

The second-order cost is that `useHead`/`useSeoMeta` stop working: `dist/process.js:206-222` builds `headConfig` from the runtime head, but `dist/process.js:223-225` throws it away for an already-shelled page and calls `injectConfigHeadTags(result, baseHeadConfig)` with the *base* config only.

**Currently: 24 files** carry a DOCTYPE with no `@nolayout`, across `resources/views/{index,compare,docs,use-cases}.stx`, `compare/*.stx` (8), `features/*.stx` (6), `use-cases/*.stx` (5), and `layouts/marketing.stx`. `grep -rn '@nolayout' resources/` returns **zero** hits.

**WRONG** — `resources/views/features/alerts.stx:1`, and 23 siblings:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ...
```

**RIGHT** — the page owns content only; the layout owns the document:

```
@extends('marketing')

@section('title', 'Alert routing — bughq')
@section('content')
  <div class="…">…</div>
@endsection
```

If a file genuinely must own its document (an email template such as `resources/emails/subscription-confirmation.stx`, or an embed), say so explicitly with `@nolayout` — the supported opt-out at `dist/process.js:302-304` and `:310` — instead of relying on the DOCTYPE side effect.

**CHECK:**

```bash
bun -e '
import { Glob } from "bun"; let n = 0
for await (const f of new Glob("resources/{views,components,partials,layouts}/**/*.stx").scan(".")) {
  const s = await Bun.file(f).text()
  if (/<!DOCTYPE\s/i.test(s) && !/@nolayout\b/.test(s)) { console.log(`${f}: DOCTYPE with no @nolayout`); n++ }
}
process.exit(n ? 1 : 0)'
```

Baseline today: 24. Target: 0.

---

### 12.7 MUST — prove SPA navigation with the probe harness; never by looking at the page

**RULE.** Any change touching a view, a layout, `<main>`, an anchor, `config/ui.ts:router`, or a `data-no-router` attribute must be verified with `.claude/skills/stacks-browse/scripts/`. Loading the page in a browser is not verification.

**WHY.** The router swaps `<main>`'s *contents* and keeps the outer element and the rest of the document (`router/client.js:441` — `currentContent.innerHTML=cleanFrag`). A page can therefore be perfect on a direct load and broken when *arrived at*. `.claude/skills/stacks-browse/SKILL.md:126-133` lists three defects shipped in bughq that direct loading could not see: body-appended chrome surviving the swap; a `class` on `<main>` leaking forward and narrowing every page reached from `/` by 48px; a page arriving completely unstyled across a shell boundary.

Three tools, three different questions. Pick by question, not by habit:

| Script | Question it answers | Oracle | Exit code |
|---|---|---|---|
| `spa-probe.ts routes <base> <path…>` | Does each route render? How many `<main>`s, nested `<main>`s, `<main>` class, layout group, `fullDoc`, console errors | `INSPECT` expression, `spa-probe.ts:60-78` | 0 |
| `spa-probe.ts navs <base> <from>::<to>…` | Was this navigation an SPA swap or a full reload? | `window.__spaProbe` stamped pre-click (`spa-probe.ts:148`), survival checked post-click (`spa-probe.ts:172-183`) — timing-independent | 0 |
| `spa-shot.ts fresh\|via` | Does the page *render the same* when arrived at? | The same URL loaded directly seconds earlier, same browser, same data, same clock — no golden files | 0 |
| `link-intercept.ts <base> <page> <href>` | Did the router intercept this link, or was it native? | Network request **type**: `Fetch`/`XHR` ⇒ intercepted, `Document` only ⇒ native (`link-intercept.ts:114`) | **0 native / 1 intercepted** |

**WRONG:** verifying a `data-no-router` attribute with `spa-probe.ts`. It reports a **false pass** — for a link whose target is not an stx page (OAuth redirect, download, API route) the end state is identical whether the router ignored it or intercepted it, failed, and fell back to `location.href` (`router/client.js:371-373`): dead JS context, URL on the target, either way. Only `link-intercept.ts` can distinguish them (`link-intercept.ts:5-16`).

**RIGHT** — with the control run, which is not optional:

```bash
export SPA_COOKIE="bughq_token=$TOKEN" SPA_LOCALSTORAGE="{\"token\":\"$TOKEN\"}"
S=.claude/skills/stacks-browse/scripts

bun $S/spa-probe.ts routes http://localhost:3100 / /pricing /dashboard /settings /account
bun $S/spa-probe.ts navs   http://localhost:3100 /dashboard::/settings /::/pricing
bun $S/spa-shot.ts fresh /settings /tmp/a.png && bun $S/spa-shot.ts via /dashboard /settings /tmp/b.png
bun $S/link-intercept.ts http://localhost:3100 /login /api/auth/github/redirect   # expect NATIVE, exit 0
# CONTROL: remove data-no-router, re-run, expect INTERCEPTED / exit 1, then restore.
```

Both credentials are required. The cookie authenticates the server render; the client guard in each page redirects to `/login` unless the token is also in `localStorage`. With only the cookie, `link-intercept.ts` reports `NO_LINK` for every app page — which reads as a missing link, not a missing credential (`SKILL.md:196-206`).

**CHECK.** `spa-probe.ts navs` must report `SPA` for every app→app pair, and `mainsAfter: 1`, `nestedMainsAfter: 0`. `link-intercept.ts` exit code is the gate for `data-no-router`. Assertions that hold for this codebase:

| Assertion | Where it comes from |
|---|---|
| Exactly one `<main>` per page; zero nested | `resources/views/layouts/default.stx:6-9` |
| Runtime-mounted DOM lives inside `<main>` | `resources/views/layouts/default.stx:11-15` |
| App→marketing and `/api/auth/*/redirect` links are plain `<a data-no-router>` | `config/ui.ts:36-40`, `resources/views/layouts/default.stx:22-31` |
| `data-no-router` on a `<StxLink>` is silently ignored — the router matches `[data-stx-link]` first | `resources/views/layouts/default.stx:16-21`, reported as `noRouter`+`stxLink` both true by `link-intercept.ts:119-122` |

Two measurement traps, both already paid for (`SKILL.md:209-231`): `grep -c '<main'` lies (the injected router script mentions `<main` ~6× in comments — count DOM elements or strip `<script>` first), and a newly created partial is not picked up until it is *modified* while the dev server runs — clearing `.stx/cache` and restarting is not enough.

---

### 12.8 SHOULD — make the pre-commit hook see `.stx`

**RULE.** The `staged-lint` glob must include `stx`.

**WHY.** `package.json:79-86` wires `bun-git-hooks`:

```json
"git-hooks": {
  "pre-commit": { "staged-lint": { "*.{js,ts,json,yaml,yml,md}": "bun x --bun pickier lint --fix" } },
  "commit-msg": "bun x gitlint --edit .git/COMMIT_EDITMSG"
}
```

`stx` is absent from that glob (`package.json:82`), so none of the 52 `.stx` files in `resources/` are ever linted on commit — despite pickier supporting them (`config/code-style.ts:5` lists `stx` in `format.extensions`, and pickier 0.1.44 emits `pickier/sort-tailwind-classes` on `.stx` today).

**RIGHT:**

```json
"*.{js,ts,stx,json,yaml,yml,md}": "bun x --bun pickier lint --fix"
```

**CHECK:**

```bash
bun -e 'const p=await Bun.file("package.json").json(); const g=Object.keys(p["git-hooks"]["pre-commit"]["staged-lint"])[0]; if(!g.includes("stx")){console.error("staged-lint glob excludes .stx: "+g);process.exit(1)}'
```

---

### 12.9 The gate script

**RULE.** Every `.stx` change runs this, in this order, and every step exits 0 before you report done.

```bash
#!/usr/bin/env bash
# stx pre-merge gate — run from the repo root.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
fail=0

echo "== 1. pickier (never eslint) =="
bunx --bun pickier . --fix >/dev/null
bunx --bun pickier . --max-warnings 0 || fail=1

echo "== 2. types =="
bun x tsc --noEmit || fail=1

echo "== 3. config surface =="
bun -e '
const c = (await import("./config/ui.ts")).default
for (const [k, why] of [["strict","DOM guard, ch.12.1"],["plugins","@stacksjs/components/stx-plugin"],["storesDir","state management"]])
  if (c[k] == null) { console.error(`config/ui.ts: missing ${k} (${why})`); process.exitCode = 1 }
' || fail=1

echo "== 4. stx-strict + DOM guard + landmines =="
bun -e '
import { lintStxStrict } from "@stacksjs/stx"
import { PROHIBITED_DOM_PATTERNS } from "@stacksjs/stx/script-validation"
import { scanScriptTags } from "@stacksjs/stx/signal-processing"
import { Glob } from "bun"
// Stale vs 0.2.113: bare refs handled at dist/signals.js:1356-1362; view-level
// <script client> compiles to a normal __stx_setup_ fn. Re-triage on upgrade.
const RULES = { "stx/no-view-level-script-client": false, "stx/no-bare-function-ref-in-event": false }
let bad = 0; const say = (s) => { console.log(s); bad++ }
for await (const f of new Glob("resources/**/*.stx").scan(".")) {
  const src = await Bun.file(f).text()
  for (const d of lintStxStrict(src, { filePath: f, rules: RULES }))
    say(`${f}:${d.line}:${d.column}  ${d.ruleId}  ${d.message}`)
  for (const s of scanScriptTags(src, { skipAttrs: /\bserver\b|\bsrc\s*=/ }))
    for (const { pattern, message, suggestion } of PROHIBITED_DOM_PATTERNS) {
      pattern.lastIndex = 0
      const m = s.body.match(pattern)
      if (m) say(`${f}  dom-guard: ${message} x${m.length} -> ${suggestion}`)
    }
  const open = (src.match(/<script\b/gi) ?? []).length, close = (src.match(/<\/script\s*>/gi) ?? []).length
  if (open !== close) say(`${f}  LANDMINE 1: ${open} <script> vs ${close} </script> — "</script" inside a script body`)
  for (const m of src.matchAll(/<!--([\s\S]*?)-->/g))
    if (/<\/?html\b|<!DOCTYPE\b|<\/?script\b|`/i.test(m[1]))
      say(`${f}:${src.slice(0,m.index).split("\n").length}  LANDMINE 2: banned token in <!-- -->. Use {{-- --}}.`)
  if (/<!DOCTYPE\s/i.test(src) && !/@nolayout\b/.test(src) && !f.startsWith("resources/emails/"))
    say(`${f}  LANDMINE 3: <!DOCTYPE> with no @nolayout — layouts silently disabled`)
}
process.exit(bad ? 1 : 0)
' || fail=1

echo "== 5. grep gates =="
g() { local n=$1 want=$2; shift 2
  local got; got=$("$@" 2>/dev/null | wc -l | tr -d " ")
  [ "$got" -le "$want" ] && printf "  ok   %-38s %s\n" "$n" "$got" \
    || { printf "  FAIL %-38s %s>%s\n" "$n" "$got" "$want"; fail=1; } }
g "no vanilla <style> block"   0 grep -rn --include=*.stx -e '<style' resources/views resources/components resources/partials
g "no inline style= attribute" 0 grep -rEn --include=*.stx -e 'style="' resources
g "no plain internal <a href>" 0 grep -rEn --include=*.stx -e '<a [^>]*href="/' resources
g "no unmanaged timers"        0 grep -rEn --include=*.stx -e '(^|[^.\w])(setTimeout|setInterval)\s*\(' resources

echo "== 6. a11y (advisory — stx a11y always exits 0) =="
bun node_modules/@stacksjs/stx/dist/cli.js a11y resources | tail -1

echo "== 7. runtime resolution =="
bun node_modules/@stacksjs/stx/dist/cli.js doctor

exit $fail
```

Measured baseline on the current tree, so you can tell your regressions from the inherited debt:

| Gate | Now | Target |
|---|---|---|
| pickier `--max-warnings 0` | 470 warnings (100% `sort-tailwind-classes`, all `--fix`-able) | 0 |
| `config/ui.ts` missing keys | `strict`, `plugins`, `storesDir` | none |
| stx-strict (both stale rules off) | 0 | 0 |
| DOM guard (`PROHIBITED_DOM_PATTERNS`) | 85 in 11 files | 0 |
| Landmine 1 — unbalanced `<script>` | 0 | 0 |
| Landmine 2 — banned token in `<!-- -->` | 0 | 0 |
| Landmine 3 — DOCTYPE without `@nolayout` | 24 | 0 |
| `<style>` blocks in views/components/partials | 25 | 0 |
| Inline `style="` | 102 | 0 |
| Plain internal `<a href="/…">` | 276 (vs 29 `<StxLink>`) | 0 |
| `stx a11y resources` | 23 issues in 11 files | 0 |
| `stx doctor` | all layers aligned | aligned |

Steps 6 and 7 are **advisory**: `stx a11y resources` exits 0 regardless of findings (verified), so read its `Total:` line — it is not a gate. `stx doctor` (`dist/doctor.d.ts`, CLI at `dist/cli.js`) never mutates anything; it verifies that `@stacksjs/stx`, `bun-plugin-stx`, and the generated signals runtime resolve to the same install — run it first when render behaviour contradicts the source you are reading.

---

### 12.10 The pre-merge checklist

Tick every line, in order. A line you cannot tick is a line you must report as not done.

1. `bunx --bun pickier . --max-warnings 0` exits 0. You did not run eslint.
2. `bun x tsc --noEmit` exits 0.
3. `config/ui.ts` declares `strict`, `plugins`, `storesDir`, `componentsDir`, `layoutsDir`, `partialsDir`.
4. The gate script in 12.9 exits 0, or every remaining violation is pre-existing and listed by file:line in your report.
5. No file you touched contains `<!DOCTYPE` (unless it carries `@nolayout` and you can say why).
6. No file you touched contains `<!-- -->`.
7. `<script>` and `</script>` counts balance in every file you touched.
8. Dev servers are up (`bun run dev` → `:3100` web, `:3108` API; `scripts/dev.ts:20-23`). A "`:3100` Unable to connect" 500 means `:3108` is down, not a code bug.
9. `spa-probe.ts routes` for every route you touched: `status` 200, `at` equals the path you asked for (an unauthenticated run happily verifies `/login` N times and reports all green), `mains: 1`, `nestedMains: 0`, `consoleErrors: []`.
10. `spa-probe.ts navs` for every navigation into or out of a page you touched: `SPA`, not `FULL_RELOAD`.
11. `spa-shot.ts fresh` + `spa-shot.ts via` captured for any page whose layout, `<main>`, or runtime-mounted DOM changed. **Read both PNGs and compare them.** Do not assert they match without looking.
12. `link-intercept.ts` run for every `data-no-router` you added or removed, **plus the control run with the attribute inverted**. A probe that reports "correct" in both directions is measuring nothing.
13. If you verified against `dist/`: re-verify against the running server. Production is SSR, so `dist/` defects may never ship and `dist/` passes may not reflect production (`SKILL.md:215-216`).
14. If you created a new partial: modify it once while the dev server is running before trusting any render of it (`SKILL.md:228-231`).
15. Report the numbers, not adjectives. "pickier 0 / tsc 0 / gate 0 / 6 navs SPA / 2 shots compared" — never "verified" or "looks good".

## Correction: chapter 11 buried the most important rule in it

The twelve rules above previously read **"Types live in `types/`"** as rule 10 — which says
where types go, not that code must be typed. An agent reading only the headline rules would
never learn that annotations are required. Chapter 11 did say *"There is no excuse for untyped
server data"*, but at line 442 of a 563-line chapter.

Rule 10 is now the mandate itself, with the organisational point demoted to 10b, and chapter 11
leads with the same statement instead of arriving at it.

The distinction that makes this matter, and that the original draft never stated plainly:

> A `.stx` script block is compiled as TypeScript **whether or not you type it**. There is no
> "JavaScript phase" — only typed TypeScript and untyped TypeScript. Untyped TypeScript is
> strictly worse than JavaScript, because it pays for a compiler and delivers none of the
> guarantee.

This was caught by the owner of the audited codebase reading the chapter and asking why the app
was still untyped after five refactor stages. Fair question — the guide never told anyone to
type it.
