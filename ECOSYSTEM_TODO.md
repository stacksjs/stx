# STX Ecosystem — Implementation TODO

## Phase 1 — Foundation

### 1. `@stacksjs/config` — Type-Safe Environment Variables

- [x] Create `packages/config/` with standard package structure
- [x] Implement `defineEnv()` with TypeScript generic inference
- [x] Implement `.env` file loader using `Bun.env`
- [x] Implement `validateEnv()` with startup error reporting
- [x] Migrate `env.ts` helpers (`isProduction`, `isDevelopment`) into this package
- [x] Add re-export shim in core `stx` package for backwards compat
- [x] Add `@stacksjs/config` to root `tsconfig.json` paths
- [x] Add to workspace in root `package.json`
- [x] Write tests for all env types, defaults, required fields, validation
- [x] Test edge-runtime compatibility (Bun, Node, Deno env access)

### 2. `@stacksjs/router` — Hybrid Server/Client Router

- [x] Create `packages/router/` with standard package structure
- [x] Extract `createRouter`, `matchRoute`, `patternToRegex` from `stx/src/router.ts`
- [x] Extract `defineRoute`, `route()` from `stx/src/routes.ts`
- [x] Extract middleware system from `stx/src/route-middleware.ts`
- [x] Extract SPA client script from `stx/src/client/index.ts`
- [x] Implement nested layout resolution (`_layout.stx` chain)
- [x] Implement route type generation (`.stx/route-types.d.ts`)
- [x] Update `dev-server.ts` and `bun-plugin/src/serve.ts` to import from `@stacksjs/router`
- [x] Add re-export shims in core `stx` for backwards compat
- [x] Write tests for: file scanning, pattern matching, dynamic params, middleware chain, layout nesting, named routes
- [x] Add to `tsconfig.json` paths and workspace

### 3. `@stacksjs/data` — Data Loading & Server Actions

- [x] Create `packages/data/` with standard package structure
- [x] Implement `defineLoader()` with `LoaderContext`
- [x] Implement `defineAction()` with `ActionContext` and form data handling
- [x] Implement `useAsyncData()` and `useFetch()` composables
- [x] Implement loader result caching with stale-while-revalidate
- [x] Implement safe serialization (handle Dates, BigInt, etc.)
- [x] Integrate loader execution into dev-server request pipeline
- [x] Integrate actions with `@form` directive
- [x] Write tests for loaders, actions, composables, caching, serialization
- [x] Add to `tsconfig.json` paths and workspace

### 4. `@stacksjs/deploy` — Deployment Adapters

- [x] Create `packages/deploy/` with standard package structure
- [x] Define `DeployAdapter` interface
- [x] Implement `bunServerAdapter` with compression, static file serving, TLS
- [x] Implement `staticAdapter` wrapping existing SSG
- [x] Extract platform detection from `edge-runtime.ts`
- [x] Integrate with production build pipeline
- [x] Add `stx deploy` CLI command
- [x] Write tests for each adapter
- [x] Add to `tsconfig.json` paths and workspace

---

## Phase 2 — Full-Stack

### 5. `@stacksjs/db` — Database & ORM

- [x] Create `packages/db/` with standard package structure
- [x] Extract `QueryBuilder`, `Model`, adapters from `database.ts`
- [x] Implement `defineTable()` schema builder
- [x] Implement `TableBuilder` with all column types
- [x] Implement migration runner
- [x] Implement auto-migrate for development
- [x] Implement database seeder
- [x] Add re-export shim in core `stx` package
- [x] Write comprehensive tests
- [x] Add to `tsconfig.json` paths and workspace

### 6. `@stacksjs/auth` — Authentication & Authorization

- [x] Create `packages/auth/` with standard package structure
- [x] Implement session management (create, validate, destroy)
- [x] Implement password hashing (bcrypt via Bun)
- [x] Implement OAuth flow (GitHub, Google providers)
- [x] Implement auth/guest middleware
- [x] Implement permissions system
- [x] Create scaffold templates (login, register, forgot-password, reset-password)
- [x] Extract CSRF logic from `forms.ts`
- [x] Wire up `@auth`/`@guest`/`@can` directive backends
- [x] Write tests for all auth flows
- [x] Add to `tsconfig.json` paths and workspace

### 7. `@stacksjs/api` — File-Based API Routes + Type-Safe RPC

- [x] Create `packages/api/` with standard package structure
- [x] Implement `defineHandler()` with method, input validation, middleware
- [x] Implement file-based API route scanning
- [x] Implement typed RPC client generation
- [x] Integrate API route handling into dev-server
- [x] Write tests
- [x] Add to workspace

### 8. `@stacksjs/forms` — Form State + Validation + Server Actions

- [x] Create `packages/forms/` with standard package structure
- [x] Extract `Validator` class from `forms-validation.ts`
- [x] Implement `useForm()` composable
- [x] Implement Zod schema integration
- [x] Integrate with `@form` directive and server actions
- [x] Write tests
- [x] Add to workspace

### 9. `@stacksjs/cache` — Multi-Driver Caching

- [x] Create `packages/cache/` with standard package structure
- [x] Implement memory driver (LRU)
- [x] Implement file driver (from existing `caching.ts`)
- [x] Implement SQLite driver (using `bun:sqlite`)
- [x] Implement `remember()` and tag-based invalidation
- [x] Integrate with ISR
- [x] Write tests
- [x] Add to workspace

---

## Phase 3 — Production Ready

### 10. `@stacksjs/email` — Email with STX Templates

- [x] Create `packages/email/` with standard package structure
- [x] Implement `sendMail()` with STX template rendering
- [x] Implement provider adapters (Resend, SES, SMTP)
- [x] Write tests
- [x] Add to workspace

### 11. `@stacksjs/storage` — File Storage Abstraction

- [x] Create `packages/storage/` with standard package structure
- [x] Implement local disk driver
- [x] Implement S3/R2 driver with signed URLs
- [x] Write tests
- [x] Add to workspace

### 12. `@stacksjs/testing` — Test Utilities

- [x] Create `packages/testing/` with standard package structure
- [x] Implement `renderTemplate()` for template testing
- [x] Implement `testLoader()` and `testAction()` helpers
- [x] Write tests
- [x] Add to workspace

### 13. `@stacksjs/errors` — Error Boundaries & Dev Overlay

- [x] Create `packages/errors/` with standard package structure
- [x] Implement `defineErrorBoundary()`
- [x] Implement dev overlay HTML
- [x] Implement production fallback pages
- [x] Write tests
- [x] Add to workspace

### 14. `@stacksjs/image` — Image Optimization

- [x] Create `packages/image/` with standard package structure
- [x] Implement responsive image generation
- [x] Implement WebP/AVIF conversion
- [x] Implement `@img` directive
- [x] Write tests
- [x] Add to workspace

---

## Phase 4 — Ecosystem

### 15. `@stacksjs/realtime` — WebSocket Channels + SSE

- [x] Create `packages/realtime/` with standard package structure
- [x] Implement WebSocket channel management
- [x] Implement SSE fallback
- [x] Implement `useBroadcast()` composable
- [x] Write tests
- [x] Add to workspace

### 16. `@stacksjs/queue` — Background Jobs

- [x] Create `packages/queue/` with standard package structure
- [x] Implement SQLite-backed job queue
- [x] Implement `defineJob()` and `dispatch()`
- [x] Implement retry logic and dead letter queue
- [x] Write tests
- [x] Add to workspace

### 17. `@stacksjs/search` — Full-Text Search

- [x] Create `packages/search/` with standard package structure
- [x] Implement SQLite FTS5 driver
- [x] Implement `defineSearchable()` and `search()`
- [x] Write tests
- [x] Add to workspace

### 18. `@stacksjs/ai` — LLM Integration

- [x] Create `packages/ai/` with standard package structure
- [x] Implement `useAI()` with provider adapters
- [x] Implement streaming support
- [x] Write tests
- [x] Add to workspace

### 19. `@stacksjs/cms` — File-Based Content Collections

- [x] Create `packages/cms/` with standard package structure
- [x] Implement `defineCollection()` with typed schemas
- [x] Implement `getContent()` and collection queries
- [x] Write tests
- [x] Add to workspace

### 20. `@stacksjs/analytics` — Privacy-Friendly Analytics

- [x] Create `packages/analytics/` with standard package structure
- [x] Implement SQLite-backed page view tracking
- [x] Implement `@analytics` directive
- [x] Implement dashboard queries
- [x] Write tests
- [x] Add to workspace

---

## Implementation Notes

### Dependencies Between Packages

```
config ← (all packages depend on config for env vars)
router ← data (loaders are route-scoped)
db ← auth (user/session tables)
data ← forms (server actions)
```

### Verification Per Package

1. Unit tests pass (`bun test packages/{name}/`)
2. Build succeeds (`cd packages/{name} && bun run build`)
3. Full monorepo test suite passes (`bun test`)
4. Type check passes (`bun run typecheck`)
5. Dev server smoke test works

### Package Template

```
packages/{name}/
  src/index.ts          # Barrel exports
  src/types.ts          # TypeScript interfaces
  test/*.test.ts        # Tests using Bun test runner
  build.ts              # Bun.build + dtsx plugin
  package.json          # @stacksjs/{name}, type: module, exports map
```

### Root Updates Per Package

- `tsconfig.json` — add path alias
- Workspace auto-detected via `"workspaces": ["packages/**"]`
