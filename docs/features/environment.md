# Environment Variables

stx has two complementary ways to expose env vars to your code: a server-side `$env` template context and a build-time `import.meta.env.STX_PUBLIC_*` substitution that mirrors the same values onto the client. Both filter through a configurable prefix (default `STX_PUBLIC_`) so secrets never accidentally ship in client bundles.

Bun automatically loads `.env` files — no stx config needed. Just configure the prefix (or accept the default) and you're done.

## Server-Side: `$env` in Templates

Any env var matching the prefix is exposed to template expressions via `$env`:

```bash
# .env
STX_PUBLIC_API_URL=https://api.example.com
STX_PUBLIC_FEATURE_FLAG=true
SECRET_DB_PASSWORD=hunter2  # NOT exposed (no prefix)
```

```html
<p>API: {{ $env.STX_PUBLIC_API_URL }}</p>

@if($env.STX_PUBLIC_FEATURE_FLAG === 'true')
  <div>New feature enabled</div>
@endif
```

Server-only env vars (anything without the prefix) remain accessible via `process.env.X` inside `<script server>` blocks for things like database credentials and API keys — they just aren't reachable from `$env` or the client.

## Client-Side: `import.meta.env.STX_PUBLIC_*`

Any env var matching the prefix is also inlined as `import.meta.env.<KEY>` at build time across every client-bundling path. This mirrors stx's server-side `$env` story onto the client and is Vite-compatible — projects migrating from Vite work without changes.

```bash
# .env
STX_PUBLIC_API_URL=https://api.example.com
```

```html
<!-- pages/index.stx -->
<script client>
  const api = import.meta.env.STX_PUBLIC_API_URL
  // built output: const api = "https://api.example.com"

  fetch(api + '/users').then(r => r.json()).then(console.log)
</script>
```

```ts
// stores/auth.ts
import { defineStore } from 'stx'

export const useAuth = defineStore('auth', () => {
  const apiUrl = import.meta.env.STX_PUBLIC_API_URL
  // ...
})
```

### Where Substitution Runs

The build-time replacement is wired into every code path that bundles or transpiles client code:

| Path | What it bundles |
|------|-----------------|
| `inline-assets.ts` | `Bun.build` for `<script src="...">` references |
| `client-script-bundler.ts` | `Bun.build` for `<script client>` blocks that import from `@/`, npm packages, or relative paths |
| `utils.ts` | `Bun.Transpiler` for inline `<script client>` blocks with no imports |
| `store-loader.ts` | `Bun.Transpiler` for `resources/stores/*.ts` files |
| `variable-extractor.ts` | `Bun.Transpiler` for `<script>` introspection |

Build-time means **zero runtime cost** and **dead-branch tree-shaking works**:

```ts
if (import.meta.env.STX_PUBLIC_DEBUG) {
  // When STX_PUBLIC_DEBUG is "" or undefined, this entire branch
  // is pruned by the bundler — no runtime check, no dead code in
  // production output.
  console.log('debug info')
}
```

## Configuring the Prefix

Default: `STX_PUBLIC_`. Override per-app via `stx.config.ts`:

```ts
// stx.config.ts
export default {
  envPrefix: 'PUBLIC_',  // now PUBLIC_API_URL is exposed instead of STX_PUBLIC_API_URL
}
```

Pick something distinctive enough that there's no chance of accidentally exposing a secret. The default `STX_PUBLIC_` is verbose for that exact reason — explicit opt-in beats opt-out.

## Lower-Level API

For consumers building custom bundling pipelines, the same substitution map is exported:

```ts
import { getPublicEnvDefine, getPublicEnv } from '@stacksjs/stx'

// Returns a Bun.build `define` map: { 'import.meta.env.STX_PUBLIC_API_URL': '"..."' }
const define = getPublicEnvDefine({ envPrefix: 'STX_PUBLIC_' })

// Returns the raw key/value map without JSON-stringification
const env = getPublicEnv({ envPrefix: 'STX_PUBLIC_' })
```

Both live in `packages/stx/src/public-env.ts`.

## What Doesn't Get Inlined

- Vars without the prefix → never exposed.
- Vars referenced via `process.env.X` from a `<script client>` → not substituted (use `import.meta.env.X` instead).
- Vars referenced from a `<script server>` block → use `process.env.X` directly. These run on the server, so the value is read at request time, not build time.

## Migrating from `window.X` Injection

Old pattern (manual injection in a layout):

```html
<script>
  window.__APP__ = { apiUrl: '@php echo env("API_URL") @endphp' }
</script>

<script client>
  fetch(window.__APP__.apiUrl + '/users')
</script>
```

New pattern (build-time inlined):

```html
<script client>
  fetch(import.meta.env.STX_PUBLIC_API_URL + '/users')
</script>
```

No layout boilerplate, no runtime indirection, dead-code branches prune correctly.
