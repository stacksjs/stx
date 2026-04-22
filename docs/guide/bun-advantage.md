# Why Bun

stx is built exclusively on Bun. Not "supports Bun." Not "works with Bun." The entire framework -- dev server, production server, bundler, transpiler, test runner, file I/O -- is Bun, top to bottom. This is a deliberate architectural decision, and it is one of the best things about stx.

## No Vite

This is the first thing that surprises people. Every modern frontend framework ships a Vite plugin or depends on Vite for development. stx does not use Vite. There is no Vite config, no Vite plugin, no HMR module graph, no ESBuild pre-bundling step.

Why? Because stx templates are processed server-side. The template engine runs in Bun, evaluates directives, resolves components, processes expressions, and returns HTML. There is no browser-side module graph to manage. Vite's core value proposition -- fast browser-side HMR via native ESM -- does not apply when your rendering happens on the server.

Bun's native speed makes the optimization tricks that Vite relies on unnecessary. When template processing takes 30-50ms, you do not need a clever caching layer to make development feel fast. It already is fast.

## `Bun.serve()` -- One Server for Everything

The stx dev server and production server both use `Bun.serve()`. A single HTTP server handles:

- Template processing and rendering
- Static file serving from `public/`
- API route handling
- SPA fragment serving for client-side navigation
- Hot reload via file watching (WebSocket-based)
- Component endpoint serving for async components

There is no proxy layer, no middleware chain bolted onto Express, no separate static file server. `Bun.serve()` handles all of it in one process.

```ts
Bun.serve({
  port: 3000,
  async fetch(request) {
    // Route matching, template processing, static files -- all here
  },
})
```

Bun's HTTP server benchmarks show 4-10x throughput compared to Node.js HTTP servers. For stx, this means the dev server responds to page requests in single-digit milliseconds (after template processing). Production serving is equally fast because it is the same code path.

## `Bun.build()` -- Client Script Bundling

When a page's `<script client>` imports from `@/functions/`, relative paths, or npm packages, stx uses `Bun.build()` to bundle the client script:

```ts
const result = await Bun.build({
  entrypoints: [tempFile],
  target: 'browser',
  minify: true,
  // stx internals (stores, composables) are marked external
  external: ['stx', '@stacksjs/stx'],
})
```

Tree-shaking is built in. Output is content-hashed for caching. The bundler only runs when user imports are detected (`hasUserImports()` check), so pages without imports skip this step entirely.

No Webpack. No Rollup. No esbuild-as-a-separate-tool. `Bun.build()` is native, fast, and already running in the same process as everything else.

## `Bun.Transpiler` -- TypeScript at Template Speed

stx uses `Bun.Transpiler` to strip TypeScript types during template processing. This powers:

- **SSG minification**: The production build minifies the signals runtime and client scripts
- **Store auto-loading**: Store files are transpiled to detect `defineStore` calls
- **Signals runtime generation**: The ~3000-line signals runtime is transpiled and minified before injection

```ts
const transpiler = new Bun.Transpiler({
  loader: 'ts',
  minifyWhitespace: true,
})
const minified = transpiler.transformSync(code)
```

No `tsc`. No Babel. No SWC-as-a-dependency. TypeScript is handled natively by the same runtime that serves your pages.

## `Bun.file()` -- Async File I/O

Throughout the stx codebase, `Bun.file()` replaces Node.js `fs` operations:

```ts
// Reading a template
const content = await Bun.file(templatePath).text()

// Checking existence
const exists = await Bun.file(path).exists()

// Writing output
await Bun.write(outputPath, html)
```

`Bun.file()` is lazy -- it does not read the file until you call `.text()`, `.json()`, or `.arrayBuffer()`. It auto-detects MIME types. And it is measurably faster than `fs.readFileSync` for the I/O-heavy work of resolving component trees and layout hierarchies.

## Template Processing Speed

Real numbers from production builds:

- **Single page**: 30-50ms processing time
- **bun-queue app** (12 pages): 169ms total build
- **11ly app** (17 pages): 510ms total build
- **Training app** (16 pages): ~250ms total build

These are not cached numbers. This is cold processing -- reading every template from disk, resolving all includes and components, evaluating all directives, and producing final HTML.

The speed comes from Bun's runtime performance, not from caching tricks. Template processing is CPU-bound (string manipulation, regex matching, expression evaluation), and Bun's JavaScriptCore JIT compiles these hot paths aggressively.

## Single Runtime

Consider the typical frontend development stack:

```
Node.js (runtime)
  -> npm/yarn/pnpm (package manager)
  -> Vite (dev server)
    -> esbuild (pre-bundling)
    -> Rollup (production build)
  -> Babel/SWC (transpilation)
  -> PostCSS (CSS processing)
  -> Jest/Vitest (testing)
  -> nodemon (file watching)
```

Now consider stx:

```
Bun (everything)
```

The same `bun` binary:
- Installs packages (`bun install`)
- Runs the dev server (`bun run dev`)
- Bundles client scripts (`Bun.build()`)
- Transpiles TypeScript (`Bun.Transpiler`)
- Runs tests (`bun test`)
- Serves production (`bun run start`)
- Watches files for changes (built-in file watcher)

One tool. One process. One set of APIs. No version mismatches between tools. No "works in dev but breaks in production because the bundler behaves differently." The dev server and production server run the same template processing code.

## Why Not Vite?

This is a fair question, so here is a direct answer.

Vite solves a real problem: making browser-side development fast by serving ES modules natively during development and bundling them for production. If your framework renders in the browser and needs to transform `.vue`, `.svelte`, or `.tsx` files into browser-executable JavaScript, Vite is excellent.

stx renders on the server. Templates go in, HTML comes out. The browser receives HTML, not a JavaScript module graph. Client-side interactivity is added via the signals runtime (injected as a single script) and per-page `<script client>` blocks (bundled individually when needed).

There is no browser-side module graph to serve. There is no HMR boundary to calculate. There is no dependency pre-bundling step because the server already has everything it needs. Adding Vite would add complexity to solve a problem that does not exist in stx's architecture.

## The Bun Bet

Building on Bun exclusively is a bet. It means stx does not run on Node.js. It means the framework's capabilities are bounded by what Bun provides. It means contributors need Bun installed.

It is a bet worth making. Bun is fast, actively developed, and increasingly stable. The APIs stx depends on (`Bun.serve`, `Bun.build`, `Bun.Transpiler`, `Bun.file`) are all documented and shipping. And the simplicity of a single-runtime architecture -- no tool sprawl, no configuration layers, no "works on my machine" issues from tool version mismatches -- is a genuine developer experience improvement.

When you run `bun run dev` on an stx project and your page loads in under 100ms on the first request, that is not because of a clever optimization. It is because there is nothing between your code and the runtime except the runtime itself.
