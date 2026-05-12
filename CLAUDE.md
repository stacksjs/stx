# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**stx** is a fast, modern UI/templating framework that combines Laravel Blade-like syntax with Bun's performance. It's a monorepo containing multiple packages that work together to provide server-side rendering, component-based architecture, and a rich development experience.

## Core Architecture

### Monorepo Structure

This is a Bun workspace monorepo with packages in `packages/`:

- **`packages/stx`** - Core framework with template processing engine
- **`packages/bun-plugin`** - Bun plugin for `.stx` file processing
- **`packages/desktop`** - Native desktop application framework (NEW)
- **`packages/markdown`** - Markdown parsing with frontmatter support
- **`packages/sanitizer`** - HTML/XSS sanitization
- **`packages/iconify-core`** - Iconify integration core
- **`packages/iconify-generator`** - Icon package generation CLI
- **`packages/vscode`** - VS Code extension for `.stx` syntax
- **`packages/devtools`** - Development tooling
- **`packages/benchmarks`** - Performance benchmarks

**External dependency**: Craft (~/Code/craft) - Zig-based native webview framework for desktop/mobile apps

### Template Processing Pipeline

The core template processing is orchestrated by `packages/stx/src/process.ts` (~920 lines), which acts as a pipeline orchestrator delegating to extracted modules:

1. **Pre-processing**: Comments removal, escaped directives
2. **Directive Processing**: Sequential processing of directives in specific order:
   - Stack directives (`@push`, `@prepend`)
   - JavaScript/TypeScript execution (`@js`, `@ts`)
   - Includes and layouts (`@include`, `@layout`, `@extends`, `@section`)
   - Custom directives
   - Components (via `component-renderer.ts` and `component-registry.ts`)
   - Async components (`@async`)
   - Conditionals (`@if`, `@switch`, `@auth`, `@env`)
   - Loops (`@foreach`, `@for`)
   - Error boundaries (`@errorBoundary`, `@fallback`, `@enderrorBoundary`)
   - Memoization (`@memo`, `v-memo`)
   - Expressions (`{{ }}`, `{!! !!}`) — includes placeholder system for compile mode
   - i18n (`@translate`)
   - Forms (`@csrf`, `@method`, `@error`)
   - SEO directives (`@meta`, `@seo`)
3. **Post-processing**: Middleware, stack replacements, web component injection

#### Extracted Modules (from process.ts code split)

| Module | Responsibility |
|---|---|
| `signal-processing.ts` | Signal detection, setup function wrapping |
| `runtime-injection.ts` | Signals/router/browser runtime injection |
| `component-processing.ts` | Component tag parsing (findComponentTags, parseMultilineAttributes) |
| `script-validation.ts` | Client script validation rules |
| `inline-assets.ts` | `stx-inline` asset resolution |
| `misc-directives.ts` | `@json`, `@once`, ref attrs, `x-cloak` |

#### Signals Split

- `signals.ts` (~3075 lines) — runtime generation (template literal for client-side signals runtime)
- `signals-api.ts` (~550 lines) — TypeScript API (state, derived, effect, batch, lifecycle, type guards)

### Plugin System

The Bun plugin (`packages/bun-plugin/src/index.ts`) registers loaders for:
- `.stx` files - Processed as templates and exported as JavaScript modules
- `.md` files - Parsed with frontmatter and exported with `content` and `data` exports

## Development Commands

### Building

```bash
# Build all packages
bun run build

# Build individual packages
cd packages/bun-plugin && bun run build
cd packages/stx && bun run build
```

The build process:
1. Builds CSS assets (`packages/stx/scripts/build-css.ts`)
2. Compiles TypeScript using custom build scripts (`build.ts` in each package)
3. Creates compiled CLI binaries for multiple platforms

### Testing

```bash
# Run all tests
bun test

# Run tests for a specific package
cd packages/stx && bun test

# Run specific test file
bun test packages/stx/test/directives/conditionals.test.ts

# Run tests with coverage
cd packages/stx && bun test --coverage

# Run tests in watch mode
cd packages/stx && bun test --watch
```

Tests use Bun's built-in test runner with Happy DOM preloaded (configured in `bunfig.toml`). Test files follow the pattern `*.test.ts` and are located in each package's `test/` directory.

### Linting

```bash
# Lint all code
bun run lint

# Auto-fix linting issues
bun run lint:fix
```

Uses `@stacksjs/eslint-config` for consistent code style.

### Development Server

```bash
# Serve .stx files for development
bun packages/bun-plugin/dist/serve.js pages/ --port 8888

# Or using the CLI
stx-serve pages/ --port 3000
```

## Key Concepts

### Script Execution Model

**Only `<script server>` runs on the server.** All other script types run on the client:

| Tag | Execution | Purpose |
|-----|-----------|---------|
| `<script server>` | Server-side | Data fetching, variable extraction for templates |
| `<script>` | Client-side | Browser code, signals, composables |
| `<script client>` | Client-side | Same as bare `<script>` (explicit alias) |
| `<script type="module">` | Client-side | ES module scripts |

This rule is enforced across ALL code paths: `process.ts`, `includes.ts`, `render.ts`, `serve.ts`, `plugin.ts`, `streaming.ts`, and `build-views.ts`. Previously, some paths used heuristics (checking for `document`/`window`/`localStorage` references) to guess whether a bare `<script>` was client or server — this caused crashes when browser-only code like `localStorage.getItem()` was executed server-side.

### Context and Variables

Templates execute in an isolated context. Variables are extracted from:
1. `<script server>` tags - Variables declared here are available to template expressions
2. Parent component/layout context
3. Props passed to components

**Important**: The `export` keyword is **optional** in `<script server>` tags. All variable declarations (`const`, `let`, `var`) and function declarations are automatically made available to the template, whether exported or not.

```html
<script server>
// Both styles work identically:
const title = 'Hello'           // ✅ Works (auto-exported)
export const subtitle = 'World' // ✅ Works (explicitly exported)

function greet(name) {           // ✅ Works (auto-exported)
  return `Hello, ${name}!`
}
</script>

<h1>{{ title }}</h1>
<h2>{{ subtitle }}</h2>
<p>{{ greet('Alice') }}</p>
```

See `packages/stx/src/variable-extractor.ts` `extractVariables()` and `convertToCommonJS()` for implementation details.

### Directive Registration

Custom directives are registered in `packages/stx/src/config.ts` as part of `defaultConfig.customDirectives`. Each directive needs:
- `name` - without the `@` prefix
- `handler` - function that processes the directive
- `hasEndTag` - whether it uses an end tag (e.g., `@directive...@enddirective`)
- `description` - for documentation

### Caching

Template caching is managed in `packages/stx/src/caching.ts`:
- Cache location: `.stx/cache` (configurable via `cachePath`)
- Cache invalidation based on file modification times and dependencies
- Disabled in development mode by default

### Component System

Components use a centralized registry and unified renderer:

- **`component-registry.ts`** — `ComponentRegistry` with builtin registration and file resolution
- **`component-renderer.ts`** — unified `processComponents()` replacing the previous five separate functions
- **Builtins** (in `packages/stx/src/builtins/`):
  - `stx-link.ts` — `<StxLink>` produces `<a data-stx-link>` directly (no custom element)
  - `stx-image.ts` — `<StxImage>` produces `<img>` directly
  - `stx-loading-indicator.ts` — loading indicator builtin
  - `index.ts` — barrel file + `registerBuiltins()`
- User components are `.stx` files in `componentsDir`, resolved recursively to prevent circular dependencies
- Components can receive props and slots, and support scoped context

#### Prop Types

Props are categorized into three types:
- **`static`** — plain string values (`title="Hello"`)
- **`serverDynamic`** — `:prop="expr"` evaluated server-side
- **`clientReactive`** — `:prop="expr"` preserved for signals runtime

#### SPA Navigation

- `<a href>` = native full page reload (always)
- `<StxLink to>` = SPA navigation via router
- Router intercepts clicks on `[data-stx-link]` elements only
- Fragment extraction includes body-level styles from `@push`

#### SPA Layout Transitions

The router detects layout changes and handles them without page reloads:

- **Detection**: `X-STX-Layout` response header and `<meta name="stx-layout">` tag
- **Same layout group**: Fragment swap (fast, only `<main>` content replaced)
- **Different layout group**: Full body swap (entire `<body>` replaced)
- **Layout groups**: `'auth'` (contains auth/guest layouts), `'app'` (everything else)
- **No page reloads** — true SPA transitions across layout changes (like Vue/React)
- **Prefetch cache** stores layout info for instant layout change detection on hover

#### Component Events (defineEmits)

Components can emit custom events to parent templates:

- `defineEmits()` returns an `emit(event, payload)` function inside `<script>`
- Uses `CustomEvent` with `bubbles: true` for DOM propagation
- `@event` attributes on component tags are forwarded to the component root element
- Parent handles emitted events via `@event="handler"` on component usage

#### Async Components

- `@async(component: 'Name', timeout: 5000)` directive loads components asynchronously
- `/_stx/component/:name` endpoint serves individual components as HTML fragments
- Supports loading/error/resolved states with configurable timeout and delay
- Scripts are re-executed and `stx:load` event fired after component loads

#### Prefix Convention

stx uses three distinct prefixes:

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `:` | **Structural directives** (control flow) | `:if`, `:show`, `:for`, `:key` |
| `x-` | **Attribute bindings & content** | `x-class`, `x-style`, `x-href`, `x-src`, `x-text`, `x-html`, `x-model`, `x-cloak` |
| `@` | **Event listeners** | `@click`, `@submit`, `@keydown.enter` |

~~`x-data` is deprecated~~ — all client-side state lives in `<script client>` blocks using signals:

```html
<script client>
  const open = state(false)
  const items = state(null)

  onMount(async () => {
    items.set(await fetch('/api').then(r => r.json()))
  })
</script>

<button @click="open.set(!open())">Toggle</button>
<div :show="open">Content</div>
<div :for="item in items()" :key="item.id" class="card">
  <p x-text="item.name"></p>
</div>
```

- **No `<template>` wrappers** — put `:for`/`:if` directly on the element. stx strips `<template>` tags during server processing (SFC extraction), so `<template :for>` breaks. Use `<div :for>` instead.
- All directives work: `:for`, `:if`, `:show`, `x-text`, `x-html`, `x-model`, `x-class`, `x-style`, `@click`
- `:for` supports parenthesized syntax: `(item, index) in array`
- Avoid `>` operator in attribute expressions (`:if="count > 0"`) — use `:if="count"` or `:if="count >= 1"` instead. The `>` can be parsed as the HTML tag closer by regex-based processors.

#### Named Slots

Components support named slots using the Web Component-style `slot="name"` attribute:

- `slot="name"` attribute on direct children (no `<template>` wrapper needed)
- Self-closing elements supported
- Multiple children can target the same slot
- `<template #name>` backward compatibility preserved

### Web Components

Web components are built from `.stx` templates (see `packages/stx/src/web-components.ts`):
- Configured in `stx.config.ts` under `webComponents`
- Generate custom element classes
- Support Shadow DOM, observed attributes, and lifecycle callbacks

## Configuration

Configuration is loaded from `stx.config.ts` or `.config/stx.config.ts` using `bunfig`.

Default config is in `packages/stx/src/config.ts`.

### Convention over Configuration

All directories default relative to where `stx.config.ts` lives. Only override what differs:

```
my-app/
  pages/          ← default pagesDir
  layouts/        ← default layoutsDir
  components/     ← default componentsDir
  partials/       ← default partialsDir
  functions/      ← shared composables
  stores/         ← state management
  public/         ← default publicDir (static assets)
  stx.config.ts
  crosswind.config.ts  ← auto-discovered next to stx.config.ts
```

Minimal config (all defaults):
```typescript
export default {
  app: { head: { title: 'My App' } },
}
```

Stacks embedded (only override what differs):
```typescript
export default {
  root: 'resources',    // shifts base directory
  pagesDir: 'views',    // pages/ → views/
}
```

### Config Fields

- `root` - Base directory for all relative paths (default: `.`)
- `pagesDir` - Pages directory name (default: `pages`)
- `componentsDir` - Components directory (default: `components`)
- `layoutsDir` - Layouts directory (default: `layouts`)
- `partialsDir` - Partials directory (default: `partials`)
- `storesDir` - Stores directory (default: `stores`)
- `publicDir` - Static assets directory (default: `public`)
- `css` - Path to Crosswind config or inline CSS config (default: auto-discovers `crosswind.config.ts`)
- `envPrefix` - Env var prefix for template exposure (default: `STX_PUBLIC_`)
- `envFile` - Path to .env file (Bun loads `.env` automatically)
- `plugins` - Plugin/module array (npm packages, local paths, or `[path, options]` tuples)
- `cache` - Enable/disable template caching
- `debug` - Enable detailed error logging
- `customDirectives` - Register custom directives
- `middleware` - Pre/post-processing middleware
- `i18n` - Internationalization settings
- `webComponents` - Web component generation config

### Plugin/Module System

Plugins register components, functions, stores, pages, and middleware into an stx app:

```typescript
// stx.config.ts
export default {
  plugins: [
    '@stacksjs/stx-auth',                    // npm package
    './plugins/analytics',                     // local plugin
    ['bun-queue/devtools', { port: 4400 }],   // with options
  ],
}
```

Plugin definition:
```typescript
import { definePlugin } from 'stx'

export default definePlugin({
  name: 'my-plugin',
  components: './components',   // auto-registered in host app
  functions: './functions',     // importable via @/functions/
  stores: './stores',           // auto-registered
  pages: './pages',             // merged into file-based routing
  setup(options, stx) {
    stx.addDirective({ name: 'auth', handler: authHandler, hasEndTag: true })
    stx.addRoute('/api/auth/login', loginHandler)
  },
})
```

### Environment Variables

- Bun automatically loads `.env` files — no stx config needed
- Variables with `STX_PUBLIC_` prefix (configurable via `envPrefix`) are exposed to templates via `$env`:

```html
<p>API: {{ $env.STX_PUBLIC_API_URL }}</p>
@if($env.STX_PUBLIC_FEATURE_FLAG === 'true')
  <div>New feature enabled</div>
@endif
```

## TypeScript Paths

TypeScript path mappings are configured in `tsconfig.json`:

```typescript
"paths": {
  "stx": ["./packages/stx/src/index.ts"],
  "@stacksjs/stx": ["./packages/stx/src/index.ts"],
  "bun-plugin-stx": ["./packages/bun-plugin/src/index.ts"],
  // ... other packages
}
```

Use these imports consistently across the codebase.

## Release Process

```bash
# Generate changelog
bun run changelog

# Bump version and release (prompts for version)
bun run release
```

The release script:
1. Generates `CHANGELOG.md` using `logsmith`
2. Prompts for version bump using `bumpx`
3. Updates versions recursively across workspace packages
4. Compiles binaries for all platforms
5. Creates zip archives of binaries

## Working with Icons

Icons use Iconify with 200K+ icons:

```bash
# List available icon collections
bun stx iconify list

# Generate icon package
bun stx iconify generate <collection-name>
```

Icon components are generated in `packages/collections/` and used as `<IconName size="24" />` in templates.

## Desktop Applications

The `@stacksjs/desktop` package provides native desktop application support:

### Architecture

```
@stacksjs/desktop (TypeScript API)
    ↓
Craft (~/Code/craft - Zig webview implementation)
    ↓
Native APIs (WebKit/GTK/WebView2)
```

**Note**: The desktop package uses Craft for native webview rendering. Craft source lives at `~/Code/craft`.

### Usage

```bash
# Open native window with dev server
stx dev examples/homepage.stx --native
```

This internally calls `openDevWindow()` from the desktop package, which uses Craft to create a lightweight native window.

### Key Features

- **Window Management**: Create and control native windows
- **System Tray**: Build menubar applications
- **Modals & Alerts**: Native dialogs and notifications
- **35 UI Components**: Documented component library
- **Hot Reload**: Development mode support
- **100% Test Coverage**: 132 tests, 96.77% line coverage

### Implementation Location

- `packages/desktop/src/window.ts` - Window management (fully implemented)
- `packages/desktop/src/system-tray.ts` - System tray with Craft bridge + web simulation (fully implemented)
- `packages/desktop/src/modals.ts` - Modal dialogs with native + web fallback (fully implemented)
- `packages/desktop/src/alerts.ts` - Toast notifications with native + web fallback (fully implemented)
- `packages/desktop/src/components.ts` - 35+ UI components with HTML rendering (fully implemented)
- `packages/desktop/src/types.ts` - Complete type definitions
- `packages/desktop/test/` - Comprehensive test suite
- `packages/desktop/examples/` - Working examples

### Integration with stx CLI

The `--native` flag in `stx dev` is implemented via the dev-server module. `dev-server.ts` is now a 7-line re-export hub delegating to:
- `dev-server/serve-markdown.ts` — markdown file serving
- `dev-server/serve-file.ts` — single `.stx` file serving
- `dev-server/serve-multi.ts` — multi-file routing
- `dev-server/serve-app.ts` — full app serving with file-based routing

Native window integration example:

```typescript
import { openDevWindow } from '@stacksjs/desktop'

async function openNativeWindow(port: number) {
  return await openDevWindow(port, {
    title: 'stx Development',
    width: 1400,
    height: 900,
    darkMode: true,
    hotReload: true,
  })
}
```

### Testing

Run desktop package tests:
```bash
cd packages/desktop
bun test              # Run all tests
bun test --coverage   # With coverage report
```

All desktop functionality is fully tested. The package uses Craft (`~/Code/craft`) for native rendering.

## Error Handling

The framework has robust error handling (`packages/stx/src/error-handling.ts`):
- `StxRuntimeError` - Enhanced errors with file path, line/column info
- `errorLogger` - Structured error logging
- `errorRecovery` - Fallback content generation in production
- `devHelpers` - Development-friendly error messages

When debugging, enable `debug: true` in config for detailed stack traces.

## Performance Monitoring

Performance tracking is available via `packages/stx/src/performance-utils.ts`:
- `performanceMonitor.timeAsync()` - Measure async operations
- Metrics tracked: template processing, directive execution, file I/O
- Enable with performance config options

## CLI Commands

The stx CLI (`packages/stx/bin/cli.ts`) provides:

```bash
# Initialize new project
stx init

# Generate documentation
stx docs [--format html|markdown|json] [--output dir]

# Icon management
stx iconify list
stx iconify generate <collection>

# Serve templates
stx serve <directory> [--port 3000]
```

## Important Implementation Notes

1. **Directive Processing Order Matters**: Directives are processed sequentially. The order in `process.ts` ensures that includes/layouts are resolved before conditionals, which are resolved before expressions.

2. **Context Isolation**: Each template execution gets an isolated VM context to prevent variable leakage and security issues. See `packages/stx/src/safe-evaluator.ts`.

3. **Dependency Tracking**: The build plugin tracks all template dependencies (includes, components, layouts) for proper cache invalidation.

4. **Async Processing**: Most directive handlers support async operations, allowing for file I/O, API calls, etc.

5. **Middleware Timing**: Middleware can run `before` or `after` directive processing. Set the `timing` field appropriately.

6. **Component Resolution**: Components are resolved via `ComponentRegistry` — builtins first, then `componentsDir`, then current directory. Paths without extensions automatically append `.stx`.

7. **Bun-First APIs**: The codebase uses Bun-native APIs where possible. `Bun.file().text()` replaces `fs.readFileSync`, `Bun.file().exists()` replaces `fs.existsSync`, and `Bun.write()` replaces `fs.writeFileSync` in async contexts. `node:path` is retained (no Bun alternative) and `node:fs` is kept for directory operations. `import process from 'node:process'` has been removed across the codebase (global in Bun).

8. **Production Build**: The placeholder system is wired into the expression processor for compile mode. The production server returns a handle with `stop()` and proper 404 handling. Tested with real projects: bun-queue (12 pages, 169ms), 11ly (17 pages, 510ms).

9. **State Management (defineStore/useStore)**: Signals-based store system in the runtime. `defineStore('id', () => setup)` (setup style, primary) and `defineStore('id', { state, getters, actions })` (options style, backward compat). `useStore('id')` retrieves a store. Supports persistence via `{ persist: true }` or `{ persist: { pick, storage, key } }`. SSR hydration via `window.__STX_STORE_STATE__`. Stores survive SPA navigation (not cleaned up by `cleanupContainer`).

10. **Client Script Bundler**: `client-script-bundler.ts` provides `hasUserImports()` and `bundleClientScript()`. Uses `Bun.build` to bundle client scripts that import from `@/functions/...`, `./relative` paths, or npm packages. Features tree-shaking and content-hash caching. stx/stores/composables are marked as external. Opt-in: only triggers when user imports are detected.

11. **Route Manifest Generation**: `.stx/routes.ts` is generated on startup (like Nuxt's `.nuxt/routes.mjs`). `.stx/route-types.d.ts` provides a TypeScript route map. Auto-filters components/layouts/partials. Generated by the `Router` constructor, so it works for all serve paths.

12. **Script Execution Rule**: Only `<script server>` runs on the server. Bare `<script>` and `<script client>` are both client-side. This is enforced in ALL code paths: `process.ts`, `includes.ts`, `render.ts`, `serve.ts`, `plugin.ts`, `streaming.ts`, and `build-views.ts`. Never use heuristics to guess — check for the `server` attribute only.

13. **Error Boundaries**: `@errorBoundary`/`@fallback`/`@enderrorBoundary` directives provide template-level error catching. `onErrorCaptured()` composition API hook available for programmatic error handling. Client-side error catching supports retry.

14. **v-memo / @memo**: `@memo="[dep1, dep2]"` memoizes template subtrees. Runtime skips re-processing if dependency values are unchanged. Vue compatibility: `v-memo` also works.

15. **Lazy Routes**: Pages are server-rendered by architecture, with scripts loading per-page. SPA fragments only include the target page's scripts. Router prefetches on hover. Production build generates separate fragments per route.

16. **Bun-style Dev Server Output**: Dev server displays a pretty startup banner matching Bun's HTML dev server style. Interactive shortcuts: `o` = open browser, `q` = quit. Route count and timing displayed on startup.

17. **Runtime Pre-Initialization Shim**: Before the signals IIFE, a shim captures `onMount`/`onDestroy` calls into temporary arrays (`window.__stx_early_mounts`, `window.__stx_early_destroys`). Once the real runtime initializes, it drains these queues. This prevents errors when partial scripts execute before the full runtime is ready.

18. **HTML Entity Decoding in Expressions**: `evalAttrExpr` in the signals runtime decodes common HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&#x27;`) before evaluating expressions. This handles cases where browsers encode attribute values like `:text="a > b"` as `a &gt; b`.

19. **Runtime Cache Behavior**: The signals runtime is cached in memory via `getCachedSignalsRuntime()` in `caching.ts`. In debug mode, the runtime is always regenerated (no caching) to prevent stale output during development. In production mode, it's cached for the lifetime of the process.

20. **Active Class Handling**: Both `updateNav()` and `updateActiveLinks()` in the router handle space-separated class strings. `activeClass="bg-indigo-500/10 text-indigo-400"` is split and each class added/removed individually via `classList`.

21. **Alpine-style x-data Reactive Bridge**: `reactive.ts` provides a bridge between Alpine-style `x-data` syntax and the signals runtime. The bridge parses `x-data`, wraps state properties in signals via `stx.state()`, handles `init()` (including async), and registers scope into `window.stx._scopes`. The signals runtime then processes ALL directives (`x-for`, `x-text`, `x-show`, `:bind`, `@click`, etc.) within those scopes — the reactive bridge does NOT evaluate bindings itself. `x-data` triggers signals runtime injection via `hasSignalsSyntax`.

22. **x-* Directive Support in Signals Runtime**: The signals runtime handles Alpine-style directives alongside the native `@`/`:` syntax: `x-for`, `x-if`, `x-show`, `x-text`, `x-html`, `x-model`, `x-bind:attr`, `x-ref`. The `x-for` regex supports both `item in list` and Alpine's parenthesized `(item, index) in list` syntax. All bind functions (`bindShow`, `bindFor`, `bindIf`, `bindClass`, `bindStyle`) use `createAutoUnwrapProxy` to auto-unwrap signals during evaluation.

23. **Signal Auto-Unwrap in All Evaluation Contexts**: Every expression evaluation function uses `createAutoUnwrapProxy` so that signal objects from x-data scopes are automatically unwrapped to their values. This ensures `x-show="mobileOpen"` evaluates to `false` (the signal value) not truthy (the signal function). Event handlers (`@click="mobileOpen = !mobileOpen"`) detect signals in scope and write back through `signal.set()`.

24. **CRITICAL: Never use `.replace('</body>', ...)` for injection**: Always use `lastIndexOf('</body>')` + slice. The first `</body>` in the document may be inside a `<script>` tag's string content (e.g. the x-element or router runtime). Using `.replace()` matches the first occurrence and injects code into the middle of a script, breaking the page. This applies to ALL modules that inject before `</body>`: reactive bridge, x-element, events, hot-reload, animation, production-build, css-scoping, PWA, analytics, heatmap. Also never include `</body>` in comments inside generated `<script>` blocks.

25. **Runtime Minification ASI Fix**: After `Bun.Transpiler` minifies the signals runtime with `minifyWhitespace: true`, a post-processing step inserts semicolons at `}var `, `}let `, `}const `, `}function ` boundaries (→ `};var `, `};function `). Browsers in strict mode reject these without semicolons when newlines are stripped, even though Bun's parser accepts them.

26. **SPA Fragment Script Extraction**: When serving page fragments for SPA navigation, `serve.ts` extracts ALL `data-stx-scoped` scripts from the full page response (partial scope IIFEs, setup functions, reactive bridge initScope calls) and appends them to the fragment. The router re-executes these scripts after swapping content. A `_latestSetup=null` clear script is prepended to prevent stale scope from the previous page. Previously, fragments only included `__stx_setup_` scripts, leaving partial scopes uninitialized on SPA navigation.

27. **Partial Signal Scripts Use Real APIs**: `transformSignalScript` in `includes.ts` destructures directly from `window.stx` instead of using polyfill fallbacks. The old polyfills created signals without `._isSignal`, which broke auto-unwrap and effect tracking. The signals runtime is always available (injected in `<head>` before any `data-stx-scoped` script).

28. **Global mountCallbacks Flush After Scope Processing**: The DOMContentLoaded handler flushes the global `mountCallbacks` array after processing all `[data-stx-scope]` elements. Previously, `mountCallbacks` was only flushed inside the `[data-stx]` loop (for setup function pages). Partial `<script client>` blocks that call `onMount()` push to the global array, so it must be flushed regardless of which code path registered the callbacks.

29. **Document Shell Comment Stripping**: `hasDocumentShell` strips HTML comments (like `<!-- stx-layout: ... -->`) before checking if the output starts with `<!DOCTYPE>` or `<html>`. Without this, layout comments caused double `<body>` wrapping — the document shell wrapped the already-complete layout output because it didn't detect the existing document structure.

30. **Known Limitation: Server-Side Component Props in Loops**: Component props (`:prop="expr"`) inside `@foreach` loops do not receive loop variables in their evaluation context. The component renderer creates an isolated context where loop variables like `feature` are not available. Workaround: inline the HTML directly in the `@foreach` loop instead of using a component. This affects server-side rendering only — client-side `:for` with components works correctly.

31. **`<template>` Tag Stripping**: `bun-plugin/src/serve.ts` strips `<template>` wrapper tags from output (browsers don't render template content). Tags with reactive directives (`x-for`, `x-if`, `@for`, `@if`, `:for`, `:if`) are preserved for the client-side runtime. Prefer putting `x-for`/`x-if` directly on elements (`<div x-for="item in items">`) instead of using `<template>` wrappers to avoid stripping issues.

32. **Stacks App Conventions**: Stacks apps use `resources/views/` for stx pages (Mode 1: server-side). Config: `root: 'resources'`, `pagesDir: 'views'`, `componentsDir: 'views/components'`, `layoutsDir: 'views/layouts'`, `partialsDir: 'views/partials'`. Standalone SPA apps (training, bench-review, 11ly) use `pages/` at root (Mode 2: client-side with API). Both modes use the same stx engine — the mode is implicit from which directives and script types are used, not a config flag.

33. **CRITICAL: @click Signal Writeback Only for Direct Assignments**: The `@click` handler has a signal writeback mechanism for inline assignment expressions like `@click="count = count + 1"` or `@click="open = !open"`. This MUST NOT run for function call expressions like `@click="openModal()"` — the function internally calls `signal.set()`, and the writeback would reset the signal to its pre-handler value (undoing the function's changes). The writeback is guarded by `isDirectAssignment` check: only fires when the expression matches `/^[a-zA-Z_$]\w*\s*=/` (direct variable assignment).

34. **Directive Double-Bind Guards**: All directive binding functions (`bindIf`, `bindShow`, `bindFor`, `bindModel`, event handlers) have guards (`el.__stx_if_bound`, `el.__stx_show_bound`, `el.__stx_for_bound`, `el.__stx_model_bound`, `el.__stx_evt_*`) to prevent duplicate binding when `processElement` is called multiple times on the same element (e.g., from `:if` subtree re-processing).

35. **bindIf Subtree Processing Deferred**: When `:if` inserts an element and needs to process its children (bind `:text`, `@click`, `:show`, etc.), the processing is deferred via `setTimeout(0)`. This prevents child effects from accidentally subscribing to the parent `bindIf` effect's tracked signals (which would cause cascading re-runs). The `childrenProcessed` flag ensures processing happens only once per element.

36. **Client-side useHead / useSeoMeta**: `useHead({ title, meta, link, script, bodyAttrs, htmlAttrs })` and `useSeoMeta({ title, description, ogTitle, ogImage, ... })` are available in `<script client>` blocks. They update `document.title`, `<meta>` tags, and `<link>` tags at runtime — works on both full page load and SPA navigation (scripts re-execute after fragment swap).

37. **Dev Server No-Cache**: The dev server (`bun-plugin/src/serve.ts`) does NOT cache processed templates or partials. Every request re-reads files from disk and re-processes. This ensures file changes are reflected immediately on browser refresh without restarting the server. Production caching is handled separately.

38. **Lazy Hydration (`stx-hydrate`)**: Defer `processElement` for a subtree until a trigger fires. Supported triggers: `visible` (IntersectionObserver, 50px rootMargin), `idle` (requestIdleCallback, 2000ms timeout), `interaction` (mouseenter/click/focusin/touchstart, once), `media:<query>` (matchMedia). Fires `stx:hydrated` CustomEvent on `window` when the subtree activates. Implementation in `signals.ts` `deferHydration()` — runs before the main `processElement` body, short-circuits processing until the trigger. Elements with `stx-hydrate` still ship their HTML immediately (no fetch, unlike `@async`) — only the wire-up is deferred. See `docs/features/lazy-hydration.md`.

39. **Route Guard Middleware (SSG)**: SSG builds run route middleware before rendering each page. Auto-loads from `middleware/` directory. Pages declare middleware via `definePageMeta({ middleware: ['auth'] })` in `<script server>`. Redirect → generates a static redirect page (`<meta http-equiv="refresh">`). Abort → skips the page. Global middleware via `stx.config.ts` `routeMiddleware.global`. See `packages/stx/src/ssg.ts` middleware integration.

---

## Additional Documentation

- **[Bug Fixes](docs/bug-fixes.md)** — Comprehensive tracking of significant bugs found and fixed, with root causes and commit references
- **[Lazy Hydration](docs/features/lazy-hydration.md)** — `stx-hydrate` attribute documentation with trigger types and usage examples
- **[Deployment](docs/features/deployment.md)** — Deployment guide for static sites and SSR apps

---

## Linting

- Use **pickier** for linting — never use eslint directly
- Run `bunx --bun pickier .` to lint, `bunx --bun pickier . --fix` to auto-fix
- When fixing unused variable warnings, prefer `// eslint-disable-next-line` comments over prefixing with `_`

## Frontend

- Use **stx** for templating — use signals/composables in `<script>` or `<script client>` tags
- Use `<script server>` for server-side data fetching — this is the ONLY script type that runs on the server
- Bare `<script>` tags with browser APIs (`localStorage`, `document`, `window`) are fine — they run client-side
- Use **crosswind** as the default CSS framework which enables standard Tailwind-like utility classes
- If you see an abundance of custom styling or utility classes in `<style>` blocks, that's wrong — use Crosswind utility classes in the HTML instead. Custom CSS should be rare (only for things Tailwind can't express).

## App Architecture (logic ↔ UI separation)

**stx apps separate logic from UI.** Components are presentation; everything else lives in composables or stores. This is the *default* — only deviate when a piece of code is genuinely single-use and trivial.

When writing or editing components, follow this layout:

| Concern | Lives in | Imported by |
|---|---|---|
| Network calls (fetch, GraphQL, websocket) | `functions/` (composables) or `stores/` | Components, other composables |
| Persistent client state (auth, cart, theme, current filter) | `stores/` (`defineStore`) | Components |
| Domain logic (validation, formatting, transforms, business rules) | `functions/` (composables) | Components, stores |
| Browser API access (localStorage, IntersectionObserver, geolocation) | `functions/` (composables) | Components |
| Local ephemeral UI state (a single dropdown's open flag, hover state) | inline in the component's `<script client>` | n/a |

The mapping is mechanical: if it has *any* of {persistence, reuse potential, side effects that aren't pure DOM, more than ~15 lines of logic}, factor it out.

**Components import composables/stores. Composables/stores never import components.** Anything in the table's right column flows to the left, not the other way.

### What "right" looks like

```html
<!-- pages/products/[id].stx -->
<script client>
  // Compose: store for shared state, composable for the fetch.
  const cart = useStore('cart')
  const { product, loading, error } = useProduct(route.params.id)

  function addToCart() {
    cart.add(product())
  }
</script>

<div :if="loading()">Loading…</div>
<div :if="error()" x-text="error().message"></div>
<article :if="product()">
  <h1 x-text="product().name"></h1>
  <button @click="addToCart()">Add to cart</button>
</article>
```

```ts
// functions/useProduct.ts — composable owns the fetch + retry + caching
import { state, derived } from 'stx'

export function useProduct(id: string) {
  const product = state(null)
  const loading = state(true)
  const error = state(null)

  ;(async () => {
    try {
      const res = await fetch(`/api/products/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      product.set(await res.json())
    }
    catch (e) {
      error.set(e)
    }
    finally {
      loading.set(false)
    }
  })()

  return { product, loading, error }
}
```

```ts
// stores/cart.ts — store owns the shared cross-page state
import { defineStore, state, derived } from 'stx'

export const useCart = defineStore('cart', () => {
  const items = state([])
  const total = derived(() => items().reduce((sum, x) => sum + x.price, 0))

  function add(product) { items.set([...items(), product]) }
  function remove(id) { items.set(items().filter(x => x.id !== id)) }

  return { items, total, add, remove }
}, { persist: true })
```

### What "wrong" looks like (don't do this)

```html
<!-- ❌ Component crammed with fetch + retry + cart state + business rules -->
<script client>
  const product = state(null)
  const loading = state(true)
  const cart = state(JSON.parse(localStorage.getItem('cart') || '[]'))

  ;(async () => {
    let attempt = 0
    while (attempt < 3) {
      try {
        const res = await fetch(`/api/products/${id}`)
        product.set(await res.json())
        loading.set(false)
        return
      }
      catch (e) {
        attempt++
        await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }
  })()

  function addToCart() {
    const next = [...cart(), { ...product(), addedAt: Date.now() }]
    cart.set(next)
    localStorage.setItem('cart', JSON.stringify(next))
    fetch('/api/cart/sync', { method: 'POST', body: JSON.stringify(next) })
  }
</script>
```

Three composables/stores got fused into one component. Now nothing's testable in isolation, the cart isn't shared across pages, the retry logic can't be reused for other endpoints, and the next person to touch this file has to read the whole thing to find the actual UI.

### Why this matters

- **Testability** — composables are plain functions, trivially unit-testable. Components are templates, not.
- **Reuse** — `useProduct(id)` works on every page that shows a product. Inline fetch logic doesn't.
- **State sharing** — stores survive SPA navigation (see "Important Implementation Notes" item 9). Component-local state doesn't.
- **Discoverability** — `grep -r 'fetch(' functions/` finds every API call. `grep -r 'fetch(' .` is noise.
- **Agent output quality** — without this rule, agents (this one included) tend to cram fetch + state + handlers + UI into a single file because it's the shortest path to "something on the screen". The result compiles but is unmaintainable. Forcing the separation up front produces code that survives review.

### When inlining IS fine

- Single-purpose UI state with no domain coupling: a tooltip's hover flag, a modal's open boolean, a form input's focused state. Keep those in the component's `<script client>`.
- Trivial event handlers that just call a composable/store method: `@click="cart.add(product())"` is fine, no need to wrap.
- One-off layout-level calculations (e.g., computing CSS classes from props).

If you're unsure: factor it out. It's much cheaper to inline a small composable later than to disentangle a 200-line component.

## Dependencies

- **buddy-bot** handles dependency updates — not renovatebot
- **better-dx** provides shared dev tooling as peer dependencies — do not install its peers (e.g., `typescript`, `pickier`, `bun-plugin-dtsx`) separately if `better-dx` is already in `package.json`
- If `better-dx` is in `package.json`, ensure `bunfig.toml` includes `linker = "hoisted"`
