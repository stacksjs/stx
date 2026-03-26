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

The `process.ts` path is the most strict — only `<script server>` is server-side. The bun-plugin and dev-server use heuristics.

### TypeScript Transpilation

All paths now use `Bun.Transpiler({ loader: 'ts' })` for TypeScript stripping:

| Path | Function | Location |
|---|---|---|
| Server scripts | `extractVariables()` | `variable-extractor.ts` (Bun.Transpiler, regex fallback) |
| Signal scripts | `processScriptSetup()` → `transpileTypeScript()` | `process.ts` → `utils.ts` |
| Client scripts | `processClientScript()` → `transpileTypeScript()` | `client-script.ts` → `utils.ts` |

## Directive Processing Pipeline

`processDirectives()` is the core of the engine. It delegates to three sequential phases:

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
            ├─ Loops (@foreach, @for — BEFORE conditionals)
            ├─ Conditionals (@if, @unless, @switch)
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

### Signals (`signals.ts`)

- **Trigger:** `state()`, `derived()`, `effect()` in `<script>` block, or `:attr`/`@event` in template
- **Scope:** Per-component, defined in `<script>` block
- **Runtime:** `window.stx` (fine-grained dependency tracking)
- **Bindings:** `{{ }}`, `:class`, `:style`, `:if`, `:show`, `@click`, `@model`, `@for`
- **Processing:** Build-time script wrapping → runtime `processElement()` DOM walk
- **Build marker:** `data-stx-scope` on component wrapper, `data-stx` on root element

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

## Component Prop Flow

```
Parent template                    Component file
<Card :title="expr" />             <script>
        │                          const props = defineProps<{
        ▼                            title: string
   processCustomElements()          }>()
   Evaluate :title expression       </script>
        │
        ▼                          Server path:
   renderComponentWithSlot()       → props spread into componentContext
   props = { title: value }        → defineProps() reads __STX_CURRENT_PROPS__
        │
        ├─── Server rendering ──→  processDirectives(template, { ...props })
        │
        └─── Client hydration ──→  data-stx-props="{...}" on scope element
                                   mount() sets window.__STX_CURRENT_PROPS__
                                   defineProps() reads from it
```

**Limitation:** Props that survive serialization (strings, numbers, booleans, arrays, plain objects) work with `data-stx-props`. Functions, signals, and class instances do not round-trip through JSON.

## Key Files

| File | Purpose | Lines |
|---|---|---|
| `process.ts` | Directive processing pipeline | ~3100 |
| `signals.ts` | Signals reactive runtime (client-side) | ~3500 |
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
| `production-server.ts` | `stx start` production HTTP server | ~200 |
| `manifest.ts` | Build manifest (routes, assets, hashes) | ~100 |
| `placeholder.ts` | Placeholder token system for pre-compilation | ~80 |
| `router/client.ts` | SPA router (click interception, swap, prefetch) | ~420 |
| `bun-plugin/index.ts` | Bun build plugin for .stx files | ~390 |
| `dev-server.ts` | Development server with HMR | ~2200 |

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

## Production Build Pipeline

```
stx build --out .output
  → Discover routes from pages/
  → Generate fingerprinted assets (runtime.js, router.js)
  → Compile all templates (processDirectives in build mode)
  → Generate CSS from all pages
  → Extract SPA fragments
  → Write .output/ + manifest.json

stx start
  → Load manifest.json
  → Static pages: serve directly (<1ms)
  → Dynamic pages: hydrate with request data
  → SPA fragments: serve pre-extracted HTML
  → Assets: immutable cache headers (1 year)
```
