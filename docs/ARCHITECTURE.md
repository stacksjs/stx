# STX Architecture

Internal architecture reference for contributors. See `API.md` for the user-facing API and `CLAUDE.md` for development commands.

## Build Pipeline

A `.stx` file goes through different paths depending on the entry point:

```
                           ┌─────────────────────────────────┐
                           │          .stx file              │
                           └──────────┬──────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
             bun-plugin          dev-server          render.ts
           (index.ts)          (buildPage)        (renderTemplate)
                    │                 │                  │
                    ▼                 ▼                  ▼
              Categorize         Categorize         Categorize
              scripts            scripts            scripts
                    │                 │                  │
                    ▼                 ▼                  ▼
         processDirectives   processDirectives   processDirectives
                    │                 │                  │
                    ▼                 ▼                  ▼
        processClientScript  injectRouterScript   wrapInDocument
                    │                                (optional)
                    ▼
              HTML output
```

### Script Classification

Each entry point classifies `<script>` tags differently. This is a known inconsistency:

| Entry Point | Server Script Detection | Client Script Detection |
|---|---|---|
| **bun-plugin** | No `client`/`type="module"`/`src=` attr, not signals | Has `client`/`type="module"`/`src=` attr |
| **dev-server** | No `client`/`type="module"`/`src=`, no DOM API keywords | Has `client` attr, `type="module"`, `src=`, or uses `document`/`window`/`fetch` |
| **process.ts** | Has explicit `server` attribute | Everything else (after signals scripts removed) |

The `process.ts` path is the canonical behavior: only `<script server>` is server-side. `<script>` and `<script client>` are both client-side (they are equivalent). This was corrected in component rendering (`utils.ts`) — bare `<script>` was previously mis-classified as server-side in some paths.

### TypeScript Transpilation

All paths now use `Bun.Transpiler({ loader: 'ts' })` for TypeScript stripping:

| Path | Function | Location |
|---|---|---|
| Server scripts | `extractVariables()` | `variable-extractor.ts` (Bun.Transpiler, regex fallback) |
| Signal scripts | `processScriptSetup()` → `transpileTypeScript()` | `process.ts` → `utils.ts` |
| Client scripts | `processClientScript()` → `transpileTypeScript()` | `client-script.ts` → `utils.ts` |

## Directive Processing Pipeline

`processDirectives()` is the core of the engine (~920 lines after code split). It acts as a pipeline orchestrator, delegating to extracted modules (`signal-processing.ts`, `runtime-injection.ts`, `component-processing.ts`, `script-validation.ts`, `inline-assets.ts`, `misc-directives.ts`). Three sequential phases:

```
processDirectives (entry, error handling, Crosswind CSS)
  └─ processDirectivesInternal (Phase 1-2)
       ├─ Phase 1: Pre-processing
       │    ├─ Strip comments: {{-- ... --}}
       │    ├─ Escape directives: @@ → placeholder
       │    ├─ Escape expressions: @{{ }} → {{ }}
       │    ├─ Vue template syntax conversion
       │    ├─ Inline asset resolution (stx-inline)
       │    └─ Stack push/prepend collection
       │
       ├─ Phase 2: Layout Resolution
       │    ├─ Extract @layout/@extends path
       │    ├─ Extract @section blocks (with @parent)
       │    ├─ Replace @yield/{{ slot }} with sections
       │    ├─ Replace @stack with collected content
       │    └─ Recursive layout processing
       │
       └─ processOtherDirectives (Phase 3)
            ├─ View composers
            ├─ Pre-processing middleware
            ├─ Server script execution (<script server>)
            ├─ @js, @ts directives (variable definition)
            ├─ Custom directives
            ├─ Component resolution (@component, custom elements)
            ├─ Async components (@async)
            ├─ Loops (@foreach, @for — BEFORE conditionals)
            ├─ Conditionals (@if, @unless, @switch)
            ├─ Error boundaries (@errorBoundary, @fallback)
            ├─ Memoization (@memo, v-memo)
            ├─ Includes (@include, @partial)
            ├─ Forms, SEO, i18n, a11y, markdown
            ├─ Event directives (@click, @keydown)
            ├─ Reactive directives (x-data, x-model)
            ├─ Expressions ({{ }})
            ├─ Scoped styles (<style scoped>)
            ├─ Signals processing (processSignals)
            ├─ Client script transformation
            └─ Post-processing middleware
```

**Order matters.** Loops before conditionals (loop variables in scope). Expressions last (after all directives generate output). Signals after expressions (runtime handles remaining bindings).

## Two Reactive Systems

STX has two independent client-side reactivity runtimes:

### Alpine-Style (`reactive.ts`)

- **Trigger:** `x-data` attribute in template
- **Scope:** Per-element, defined inline
- **Runtime:** `window.__stx_reactive` (Proxy-based)
- **Bindings:** `x-model`, `x-show`, `x-hide`, `x-text`, `x-html`, `x-bind:`, `@click`
- **Processing:** Build-time extraction of scopes/bindings → runtime initialization
- **Build marker:** `data-stx-reactive-owner` on scope elements

### Signals (`signals.ts` + `signals-api.ts`)

- **Trigger:** `state()`, `derived()`, `effect()` in `<script>` block, or `:attr`/`@event` in template
- **Scope:** Per-component, defined in `<script>` block
- **Runtime:** `window.stx` (fine-grained dependency tracking)
- **Bindings:** `{{ }}`, `:class`, `:style`, `:if`, `:show`, `@click`, `@model`, `@for`
- **Processing:** Build-time script wrapping (via `signal-processing.ts`) → runtime `processElement()` DOM walk
- **Build marker:** `data-stx-scope` on component wrapper, `data-stx` on root element
- **Split:** `signals.ts` (~3075 lines) contains runtime generation as a template literal; `signals-api.ts` (~550 lines) provides the TypeScript API (state, derived, effect, batch, lifecycle, type guards)

### Isolation

The systems skip each other's scopes:
- `signals.ts` `processElement()` bails on `x-data` / `__stx_reactive_initialized` elements
- `signals.ts` scope walker skips `data-stx-reactive-owner` elements
- `reactive.ts` is completely independent — doesn't know about signals

They can coexist on the same page but not on the same element. A dev warning is emitted when `debug: true` and both are detected in the same template.

## App Shell Architecture

When `app.stx` exists (or `shell` config is set):

```
Direct Request (browser)           SPA Navigation (router)
        │                                   │
        ▼                                   ▼
   buildPage()                         buildPage()
   stripDocumentWrapper()              stripDocumentWrapper()
        │                                   │
        ▼                                   ▼
   composeShellWithPage()          Return fragment as-is
   (shell + page + router)          X-STX-Fragment: true
        │                                   │
        ▼                                   ▼
   Full HTML document              Page fragment (no wrapper)
        │                                   │
        ▼                                   ▼
   Browser renders                 Router swap() detects
   full page                       <!--stx-fragment--> marker
                                   Injects into [data-stx-content]
```

### Fragment Contract

The server marks fragments with the `X-STX-Fragment: true` response header. The router reads this header on fetch and prepends `<!--stx-fragment-->` to cached HTML. The `swap()` function checks for this marker — no content sniffing.

### SPA Layout Transitions

The router detects layout changes to avoid page reloads when navigating between different layout groups:

```
Same layout group (app → app)           Different layout group (app → auth)
        │                                        │
        ▼                                        ▼
   Fragment swap                            Full body swap
   (fast, <main> only)                      (entire <body> replaced)
        │                                        │
        ▼                                        ▼
   [data-stx-content]                       document.body.innerHTML
   innerHTML replaced                       replaced entirely
```

- **Detection**: `X-STX-Layout` response header + `<meta name="stx-layout">` tag in the document
- **Layout groups**: `'auth'` (layouts containing auth/guest), `'app'` (everything else)
- **Prefetch integration**: Prefetch cache stores layout info alongside HTML, enabling instant layout change detection on hover before navigation occurs
- **No reloads**: True SPA transitions across layout boundaries (like Vue Router/React Router)

## Component Prop Flow

Props are categorized into three types during parsing:

| Type | Syntax | Behavior |
|---|---|---|
| `static` | `title="Hello"` | Plain string value, passed as-is |
| `serverDynamic` | `:title="expr"` | Evaluated server-side, result passed to component |
| `clientReactive` | `:title="expr"` | Preserved for signals runtime (when expression references signals) |

```
Parent template                    Component file
<Card :title="expr" />             <script>
        │                          const props = defineProps<{
        ▼                            title: string
   ComponentRegistry.resolve()      }>()
   (builtins first, then files)     </script>
        │
        ▼                          Server path:
   processComponents()             → props spread into componentContext
   (unified renderer)              → defineProps() reads __STX_CURRENT_PROPS__
   props = { title: value }
        │
        ├─── Server rendering ──→  processDirectives(template, { ...props })
        │
        └─── Client hydration ──→  data-stx-props="{...}" on scope element
                                   mount() sets window.__STX_CURRENT_PROPS__
                                   defineProps() reads from it
```

**Limitation:** Props that survive serialization (strings, numbers, booleans, arrays, plain objects) work with `data-stx-props`. Functions, signals, and class instances do not round-trip through JSON.

### Component Events (defineEmits)

Components emit custom events using `defineEmits()`:

```
Component file                          Parent template
<script>                                <MyButton @click="handleClick"
const emit = defineEmits()                        @submit="handleSubmit" />
emit('submit', { data })
</script>                                       │
        │                                       ▼
        ▼                               @event attributes forwarded
  CustomEvent('submit',                 to component root element
    { detail: { data },                 at render time
      bubbles: true })
```

- `defineEmits()` returns `emit(event, payload)` — no type declaration needed (unlike Vue)
- Events use `CustomEvent` with `bubbles: true` for natural DOM propagation
- `@event` attributes on component usage tags are forwarded to the component's root element during server rendering

### Async Components

```
@async(component: 'HeavyChart', timeout: 5000)
        │
        ▼
  Renders placeholder with loading state
        │
        ▼
  Client fetches /_stx/component/HeavyChart
        │
        ├── Success → resolved state, scripts re-executed, stx:load fired
        ├── Timeout → error state rendered
        └── Delay   → loading state shown after configurable delay
```

- `/_stx/component/:name` endpoint serves individual components as HTML fragments
- Configurable `timeout` and `delay` options
- Scripts within async components are re-executed after load
- `stx:load` event fired on the component element after successful load

### Named Slots

Components support Web Component-style named slots:

```html
<!-- Parent usage -->
<Card>
  <h1 slot="header">Title</h1>          ← slot="name" on direct children
  <img slot="header" src="banner.png">   ← multiple children, same slot
  <p>Default content</p>                 ← no slot attr = default slot
  <input slot="footer" />                ← self-closing elements supported
</Card>

<!-- Component definition -->
<div class="card">
  @slot('header')                        ← named slot placeholder
  @slot                                  ← default slot
  @slot('footer')
</div>
```

- No `<template>` wrapper needed (unlike Vue)
- `<template #name>` backward compatibility preserved

## Component Registry and Builtins

The `ComponentRegistry` (`component-registry.ts`) centralizes component resolution:

1. **Builtin registration** — `registerBuiltins()` registers `StxLink`, `StxImage`, and `StxLoadingIndicator` at startup
2. **File resolution** — user components resolved from `componentsDir`, then current directory
3. **Unified rendering** — `processComponents()` in `component-renderer.ts` replaces the previous five separate rendering functions

### Builtins

Builtins produce standard HTML directly (no custom elements):

- **`<StxLink to="/path">`** → `<a href="/path" data-stx-link>` — SPA navigation via router click interception on `[data-stx-link]`
- **`<StxImage src="..." />`** → `<img src="...">` — enhanced image with lazy loading, responsive, placeholder
- **`<StxLoadingIndicator />`** → loading indicator markup

The old `components/StxLink.stx` and `components/StxImage.stx` template files have been replaced by these builtins.

## Key Files

### Core Pipeline

| File | Purpose | Lines |
|---|---|---|
| `process.ts` | Pipeline orchestrator (delegates to extracted modules) | ~920 |
| `signal-processing.ts` | Signal detection, setup function wrapping | — |
| `runtime-injection.ts` | Signals/router/browser runtime injection | — |
| `component-processing.ts` | Component tag parsing (findComponentTags, parseMultilineAttributes) | — |
| `script-validation.ts` | Client script validation rules | — |
| `inline-assets.ts` | `stx-inline` asset resolution | — |
| `misc-directives.ts` | `@json`, `@once`, ref attrs, `x-cloak` | — |

### Signals

| File | Purpose | Lines |
|---|---|---|
| `signals.ts` | Signals reactive runtime generation (template literal) | ~3075 |
| `signals-api.ts` | TypeScript API (state, derived, effect, batch, lifecycle, type guards) | ~550 |

### Component System

| File | Purpose | Lines |
|---|---|---|
| `component-registry.ts` | Centralized ComponentRegistry with builtin registration and file resolution | — |
| `component-renderer.ts` | Unified `processComponents()` replacing 5 old functions | — |
| `builtins/stx-link.ts` | StxLink produces `<a data-stx-link>` directly (no custom element) | — |
| `builtins/stx-image.ts` | StxImage produces `<img>` directly | — |
| `builtins/stx-loading-indicator.ts` | Loading indicator builtin | — |
| `builtins/index.ts` | Barrel file + `registerBuiltins()` | — |

### Dev Server

| File | Purpose | Lines |
|---|---|---|
| `dev-server.ts` | Re-export hub (7 lines) | ~7 |
| `dev-server/serve-markdown.ts` | Markdown file serving | — |
| `dev-server/serve-file.ts` | Single `.stx` file serving | — |
| `dev-server/serve-multi.ts` | Multi-file routing | — |
| `dev-server/serve-app.ts` | Full app serving with file-based routing | — |

### Dev Server Output

The dev server displays a Bun-style startup banner with interactive shortcuts:

- Pretty banner matching Bun's HTML dev server aesthetic
- Route count and build timing displayed on startup
- Interactive shortcuts: `o` = open browser, `q` = quit

### Other Core Files

| File | Purpose | Lines |
|---|---|---|
| `reactive.ts` | Alpine-style reactive runtime | ~1200 |
| `client-script.ts` | Client script transformation, auto-binding, auto-imports | ~700 |
| `variable-extractor.ts` | Server script execution, TS stripping, variable extraction | ~450 |
| `utils.ts` | Component rendering, SFC processing | ~700 |
| `app-shell.ts` | Shell detection (deprecated), fragment stripping | ~260 |
| `style-scoping.ts` | `<style scoped>` processing | ~130 |
| `document-shell.ts` | Auto-generated HTML document wrapper | ~130 |
| `build-assets.ts` | Fingerprinted runtime/router/CSS assets | ~90 |
| `template-compiler.ts` | Build-time template pre-compilation | ~160 |
| `template-hydrator.ts` | Serve-time placeholder resolution | ~130 |
| `production-builder.ts` | `stx build` orchestrator → `.output/` | ~160 |
| `production-server.ts` | `stx start` production HTTP server (handle with stop(), proper 404) | ~200 |
| `manifest.ts` | Build manifest (routes, assets, hashes) | ~100 |
| `placeholder.ts` | Placeholder token system for pre-compilation (wired into expression processor) | ~80 |
| `client-script-bundler.ts` | Bun.build-powered client script bundling with import resolution | — |
| `router/client.ts` | SPA router (`[data-stx-link]`-only interception, swap, prefetch) | ~420 |
| `bun-plugin/index.ts` | Bun build plugin for .stx files | ~390 |

## State Management (defineStore/useStore)

The signals runtime includes a store system for shared state across components:

```
defineStore('counter', () => {           defineStore('counter', {
  const count = state(0)                   state: () => ({ count: 0 }),
  const doubled = derived(() =>            getters: { doubled: s => s.count * 2 },
    count.value * 2)                       actions: { increment() { this.count++ } },
  function increment() {                 })
    count.value++
  }
  return { count, doubled, increment }
})
        Setup style (primary)                    Options style (backward compat)
```

- **`useStore('id')`** — retrieve a registered store
- **Persistence** — `{ persist: true }` (localStorage, full state) or `{ persist: { pick: ['count'], storage: sessionStorage, key: 'custom-key' } }`
- **SSR hydration** — server serializes state into `window.__STX_STORE_STATE__`, client rehydrates on init
- **SPA survival** — stores are not cleaned up by `cleanupContainer` during SPA navigation; they persist across route changes

## Error Boundaries

Template-level error catching with fallback content:

```html
@errorBoundary
  <DangerousComponent />
@fallback
  <p>Something went wrong</p>
@enderrorBoundary
```

- Server-side: wraps rendering in try/catch, renders `@fallback` content on error
- Client-side: `onErrorCaptured()` composition API hook for programmatic error handling
- Retry support on the client side

## Memoization (@memo / v-memo)

`@memo="[dep1, dep2]"` memoizes template subtrees to skip re-processing when dependencies are unchanged:

```html
@memo="[items.length, filter]"
  <ExpensiveList :items="items" :filter="filter" />
@endmemo
```

- Runtime compares dependency array values between renders
- Skips re-processing if all values are identical
- Vue compatibility: `v-memo="[deps]"` also works

## Lazy Routes

By architecture, stx pages are server-rendered with scripts loading per-page:

- SPA fragments only include the target page's scripts (no global bundle)
- Router prefetches on hover (`[data-stx-link]` elements)
- Production build generates separate fragments per route
- No explicit lazy-loading directive needed — the architecture is inherently lazy

## Client Script Bundler

`client-script-bundler.ts` provides `Bun.build`-powered bundling for client `<script>` tags that contain user imports:

```
<script client>
import { debounce } from '@/functions/debounce'   ← @/ alias
import { format } from './utils'                    ← relative
import confetti from 'canvas-confetti'              ← npm
</script>
```

- **`hasUserImports(code)`** — detects whether bundling is needed
- **`bundleClientScript(code, filePath)`** — runs `Bun.build` with tree-shaking
- **Externals** — stx runtime, stores, and composables are marked external (already injected)
- **Caching** — content-hash based; same input = same cached output
- **Opt-in** — only triggers when user imports are detected; scripts without imports skip bundling entirely

## Route Manifest Generation

On startup, the `Router` constructor generates route manifests in `.stx/`:

| File | Purpose |
|---|---|
| `.stx/routes.ts` | Route definitions (path, component file, layout) — like Nuxt's `.nuxt/routes.mjs` |
| `.stx/route-types.d.ts` | TypeScript route map for type-safe `<StxLink to="...">` |

- **Auto-filtering** — components/, layouts/, partials/ directories are excluded from routes
- **All serve paths** — generated by Router constructor, so `serve-file`, `serve-multi`, and `serve-app` all get manifests
- **File-based routing** — `pages/about.stx` → `/about`, `pages/blog/[slug].stx` → `/blog/:slug`

## Project Structure Convention

### Standalone stx app
```
stx.config.ts              ← config (app.head, plugins, build)
pages/                     ← file-based routes
layouts/default.stx        ← root layout (no HTML boilerplate)
components/                ← reusable components
partials/                  ← includes
.stx/                      ← cache (auto-generated)
.output/                   ← production build (auto-generated)
```

### stx inside Stacks (embedded)
```
stx.config.ts              ← at project root (root: 'resources/views')
resources/views/
  pages/                   ← routes
  layouts/default.stx      ← layout
  components/
  partials/
.stx/                      ← cache at project root
.output/                   ← production build at project root
```

## Document Shell

Templates never write `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>`. The framework auto-generates the document shell from `stx.config.ts` `app.head` configuration:

```typescript
// stx.config.ts
export default {
  app: {
    head: {
      title: 'My App',
      meta: [{ name: 'description', content: '...' }],
      bodyClass: 'dark min-h-screen',
    },
  },
}
```

Layouts are pure content fragments:
```html
<!-- layouts/default.stx -->
<nav>...</nav>
<main>@slot('content')</main>
<footer>...</footer>
```

## Bun-First APIs

The codebase uses Bun-native APIs where possible:

| Node.js API | Bun Replacement | Context |
|---|---|---|
| `import process from 'node:process'` | Removed (global in Bun) | Across 23 files |
| `fs.readFileSync(path)` | `Bun.file(path).text()` | Async contexts |
| `fs.existsSync(path)` | `Bun.file(path).exists()` | Async contexts |
| `fs.writeFileSync(path, data)` | `Bun.write(path, data)` | Async contexts |

Retained from Node.js: `node:path` (no Bun alternative), `node:fs` for directory operations (`mkdirSync`, `readdirSync`, etc.).

## Production Build Pipeline

```
stx build --out .output
  → Discover routes from pages/
  → Generate fingerprinted assets (runtime.js, router.js)
  → Compile all templates (processDirectives in build mode)
  → Placeholder system wired into expression processor for compile mode
  → Generate CSS from all pages
  → Extract SPA fragments (includes body-level styles from @push)
  → Write .output/ + manifest.json

stx start
  → Load manifest.json
  → Returns handle with stop() for programmatic control
  → Static pages: serve directly (<1ms)
  → Dynamic pages: hydrate with request data
  → SPA fragments: serve pre-extracted HTML
  → Assets: immutable cache headers (1 year)
  → Proper 404 handling for unknown routes
```

**Tested benchmarks:** bun-queue (12 pages, 169ms), 11ty (17 pages, 510ms).
