# File-based API endpoints

API discovery is **opt-in**. Existing Stacks/Bun routers and manual `apiRoutes` keep working without adopting it.

```ts
// stx.config.ts
export default {
  ssr: true,
  serverApi: true, // default directory: server/api, relative to this project
}
```

Use `serverApi: { dir: 'backend/endpoints' }` to change the directory. It is relative to the project/config directory, independent of `root: 'resources'` or `pagesDir`. Keep helpers outside the endpoint directory, for example in `server/utils/`.

| File | Route |
| --- | --- |
| `server/api/index.get.ts` | `GET /api` |
| `server/api/users.get.ts` | `GET /api/users` |
| `server/api/users.post.ts` | `POST /api/users` |
| `server/api/users/[id].get.ts` | `GET /api/users/:id` |
| `server/api/files/[...path].get.ts` | `GET /api/files/:path*` |

Supported extensions are `.ts`, `.js`, `.mts`, `.mjs`. A missing method suffix means GET. Supported lowercase suffixes are `get`, `post`, `put`, `patch`, `delete`, `head`, `options`. Duplicate method/path shapes, repeated parameter names, nonterminal catch-alls and unsupported suffixes fail discovery with the filenames involved.

```ts
// server/api/users/[id].get.ts
import { defineApiHandler } from '@stacksjs/stx/api-handler'
import { findUser } from '../../utils/users'

export default defineApiHandler(async (request, { params }) => {
  const user = await findUser(params.id)
  if (!user) return new Response('Not Found', { status: 404 })
  return { id: user.id, name: user.name }
})
```

Handlers receive the standard `Request` and decoded string `params`. Return JSON-serializable data for automatic `Response.json`, a `Response` for full control (cookies, status, streams), or `undefined` for 204. Exceptions produce a generic 500 JSON response; details stay in the server log. Authentication, authorization and input validation remain the handler/host middleware's responsibility.

Literal routes win over parameter routes, which win over catch-alls. The path is selected before the method: POST `/api/users/new` does not fall through to POST `/api/users/:id` when `/api/users/new` exists as GET-only. Wrong methods return 405 with Allow. GET supplies HEAD unless explicitly overridden; unmatched OPTIONS on a known path supplies 204 and Allow. This does not implicitly enable cross-origin access.

## Development and production

`stx serve` / the app dev server and programmatic `serve({ configDir })` discover the enabled directory. Development rescans API requests and bundles their handlers, so adding/removing an endpoint or changing an imported helper is reflected without restarting. Module-level side effects follow module import semantics, not per-request semantics. Restarting clears old development module generations.

`stx build` bundles endpoints and imported helpers into `.output/server/api/`, with content-addressed filenames recorded in the manifest. `stx start` dispatches them without the original endpoint sources. No endpoint bundle is copied into `public/`. Runtime filesystem resources accessed via `Bun.file`, variable imports and native dependencies still need explicit deployment packaging; emitting additional bundler assets is rejected rather than silently dropped. Flat SSG builds reject `serverApi` because they have no request handler.

Page route rules do not cache API responses. Use explicit HTTP/cache behavior in your endpoint or existing host router.

## Typed browser calls

Discovery/build generates `.stx/api-types.d.ts` (or your configured state directory). Include that file in your app's `tsconfig.json`. It augments the real `@stacksjs/stx/api-client` module with method/path keys, required params and inferred JSON response shapes.

For the template checker, also pass it as an ambient library: `stx typecheck --lib .stx/api-types.d.ts`. Before the declaration is included, the client intentionally falls back to unknown response types rather than claiming inferred types are available.

```ts
import { apiFetch } from '@stacksjs/stx/api-client'

const user = await apiFetch('GET /api/users/:id', {
  params: { id: '42' },
  query: { details: true },
})
```

The method is part of the key, so a GET response cannot be mistaken for a POST response. Route/method typos and missing/wrong parameter names fail TypeScript checking. Dates become strings in the inferred JSON type. A handler returning a raw `Response` has an unknown body type; use ordinary `fetch` for non-JSON responses, or narrow/validate the JSON at the call site. Generated types describe your code, not runtime validation of untrusted data.

`apiFetch` accepts normal fetch options (except method), optional query values and `baseURL` for server-side callers. It encodes parameters, throws on non-2xx responses (the error carries `status` and `response`), and returns undefined for HEAD/204. Import the **api-client subpath** in client scripts; it contains no server runtime imports. Endpoint references exist only in the generated declaration file and disappear from browser bundles. stx's client bundler rejects value imports of enabled/discovered endpoint implementations, including previously cached bundles. Dev servers also block serving their source files, including symlink aliases.

## Embedded hosts and precedence

The production/app-dev order is: custom request hook (where supported), existing `apiRouter` (404 falls through), exact manual `apiRoutes`, discovered endpoints, then pages. Programmatic `serve` additionally preserves its existing explicit `routes`/`onRequest` order ahead of this chain. Static public assets retain their existing server-specific precedence; avoid placing assets under `/api`.

For a Stacks host that already owns the HTTP server, leave discovery disabled by default and opt in deliberately:

```ts
import { createServerApi } from '@stacksjs/stx'

const discovered = await createServerApi(projectRoot, true)
// In the host's development handler, after its existing routes:
const response = await discovered(request)
// null means no API path matched; continue the host's normal routing.
```

For production, pass existing integrations to `startProductionServer({ apiRouter, apiRoutes })`; functions are not serialized into a build manifest. The discovered endpoints come from that manifest. This convention adds file discovery around standard Bun handlers, not a separate backend framework.
