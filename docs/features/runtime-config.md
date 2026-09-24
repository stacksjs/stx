# Runtime configuration

Declare defaults in `stx.config.ts`:

```ts
import { defineStxConfig } from '@stacksjs/stx'

export default defineStxConfig({
  ssr: true,
  runtimeConfig: {
    public: { apiUrl: '/api', retries: 3 },
    private: { serviceToken: '' },
  },
})
```

In `<script server>`, `useRuntimeConfig()` returns the public object.
`useServerRuntimeConfig()` returns `{ public, private }`. Both are engine
bindings, so no import is needed. In server API modules, import them from
`@stacksjs/stx/runtime-config-server`.

```html
<script server>
const apiUrl = useRuntimeConfig().apiUrl
</script>
<p>{{ apiUrl }}</p>
<script client>
import { useRuntimeConfig } from '@stacksjs/stx/runtime-config'
const endpoint = useRuntimeConfig().apiUrl
</script>
```

The browser module exposes **only public values**, never a `.private` property.
Config loading/builds generate `.stx/runtime-config.d.ts` and a separate
`.stx/runtime-config-server.d.ts`. Include the public declaration in client
TypeScript projects; include both for server code. For template typechecking,
pass the declarations using `stx typecheck --lib`. Types are inferred from the
defaults without importing the config file or embedding default values in
client declarations. Keep private defaults empty; provide secrets at deployment.

## Deployment overrides

Build once, then set environment variables before starting the production server:

```sh
STX_RUNTIME_PUBLIC__API_URL=https://api.example.com \
STX_RUNTIME_PRIVATE__SERVICE_TOKEN=secret-from-your-deployer \
  bun run start
```

Keys must be declared in the defaults. Convert each camelCase segment to
UPPER_SNAKE_CASE; separate nested segments with **two underscores**. For example,
`public.api.timeout` becomes `STX_RUNTIME_PUBLIC__API__TIMEOUT`.
Strings are literal; booleans, numbers, arrays and null use JSON syntax.
Array elements must match a shape present in the default array; an empty default
array accepts arbitrary JSON elements (`unknown[]`). A null default accepts only
null; declare a concrete default for an overridable non-null value.
Wrong primitive/container types and ambiguous environment names fail startup
without printing their values. Undeclared environment variables are ignored.

The production server takes an immutable snapshot at startup. Changing the
environment requires a restart, not a rebuild. Multiple server instances have
independent snapshots. Programmatic callers can supply `runtimeConfig` defaults
to `startProductionServer`; environment overrides still take precedence.

Defaults are stored in `.output/server/runtime-config.json`, **not public/**.
Only the public object is safely JSON-serialized into HTML. SSR expressions,
API handlers, browser hydration and committed SPA navigations see the matching
snapshot. Prefetching does not update the active browser config. Read the accessor
again after navigation instead of retaining an old object indefinitely.

Private config/accessor modules are rejected by the client bundler and blocked
by development source serving. Serializing the entire server accessor result
omits its non-enumerable private section. Explicitly rendering a secret, returning
it from an API, or passing it to `defineClientPayload`/`useServerData` still exposes
it: application code must not do that.

## Static output and compatibility

Fully static deployments have no server startup and use build-time public values.
Prerendered content and structural server loops/conditionals are also build-time;
use dynamic SSR expression bindings for deployment-varying content. The production
server refreshes the public hydration payload even on prerendered pages, but cannot
recompute their already-rendered markup. Do not use runtime-varying values in
prerendered markup if it must match hydration.

Existing `STX_PUBLIC_*` / `import.meta.env` substitution is unchanged and remains
build-time. The separate `STX_RUNTIME_*` namespace is never automatically inlined
into client bundles.
