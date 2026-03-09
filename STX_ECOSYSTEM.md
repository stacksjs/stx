# STX Ecosystem — Packages & Competitive Gap Analysis

## Current Packages

### Core

| Package | Description | Status |
|---------|-------------|--------|
| `stx` | Core template engine — directive processing, component system, signals reactivity, SSR, hydration, SSG, SPA shell | Active |
| `bun-plugin` | Bun build plugin — `.stx`/`.md` loaders, dev server, file-based routing, HMR | Active |
| `create-stx` | Project scaffolding CLI (`bun create stx`) | Active |

### UI & Components

| Package | Description | Status |
|---------|-------------|--------|
| `components` | 40+ UI components (Input, Table, Dialog, Calendar, Tabs, etc.) + 8 composables | Active |
| `iconify-core` | Icon rendering engine (SVG generation, transforms) | Active |
| `iconify-generator` | CLI to generate icon packages from 200K+ Iconify icons | Active |
| `collections` | 200+ auto-generated icon collection packages | Generated |

### Platform Targets

| Package | Description | Status |
|---------|-------------|--------|
| `desktop` | Native desktop apps via Craft (Zig webview) — windows, tray, modals, hotkeys | Active |
| `stx-native` | Native mobile compilation — STX to iOS/Android UI via native bridge | Active |

### Tooling & DX

| Package | Description | Status |
|---------|-------------|--------|
| `vscode` | VS Code extension — syntax highlighting, completions, diagnostics, go-to-definition | Active |
| `devtools` | Dev tools dashboard — template inspection, performance monitoring | Active |
| `benchmarks` | Performance benchmarking suite | Active |

### Utilities

| Package | Description | Status |
|---------|-------------|--------|
| `sanitizer` | HTML/XSS sanitization with 4 presets | Active |
| `markdown` | Markdown parsing with frontmatter | Active |

---

## Competitive Landscape

Compared against: **Next.js**, **Nuxt**, **SvelteKit**, **Astro**, **Laravel/Livewire**, **Remix**, **SolidStart**, **Qwik**, **Angular**, **Htmx**

---

## Gaps to Consider

### High Priority — Table Stakes for Modern Frameworks

#### 1. `@stacksjs/router` — Full-Featured Router
**Gap**: The current file-based routing is embedded in the dev server. No standalone router package.
**Competitors**: Next.js (App Router), Nuxt (vue-router auto-config), SvelteKit (filesystem router)
**What's needed**:
- Standalone router with programmatic API
- Nested routes / route groups
- Route middleware / guards
- Dynamic params (`[id]`, `[...slug]`)
- Typed route params (auto-generated types from file structure)
- Route transitions / loading states
- Parallel routes (Next.js-style)
- Intercepting routes
- Route-level code splitting

#### 2. `@stacksjs/data` — Data Fetching & Caching Layer
**Gap**: No standard data fetching pattern. Templates just use variables from `<script server>`.
**Competitors**: Next.js (fetch + cache), Nuxt (useFetch/useAsyncData), SvelteKit (load functions), Remix (loaders/actions), TanStack Query
**What's needed**:
- Server-side data loaders (per-route, like Remix/SvelteKit)
- Client-side data fetching composables
- Request deduplication
- Caching with revalidation strategies (SWR, stale-while-revalidate)
- Optimistic updates
- Streaming data (progressive loading)
- Server actions / mutations (form actions, RPC-style)

#### 3. `@stacksjs/auth` — Authentication
**Gap**: Has `@auth`/`@guest` directives but no actual auth implementation.
**Competitors**: NextAuth.js, Nuxt Auth, Laravel Sanctum/Fortify, Lucia Auth
**What's needed**:
- Session management
- OAuth providers (Google, GitHub, etc.)
- Email/password auth
- Magic links
- JWT handling
- RBAC (role-based access control) beyond `@can`/`@cannot`
- CSRF protection (has directive, needs full implementation)
- Rate limiting

#### 4. Database & ORM — Use [`bun-query-builder`](https://github.com/stacksjs/bun-query-builder)
**Resolved**: Use `bun-query-builder` from the Stacks ecosystem (4 DB drivers, full ORM, migrations, seeders, caching, transactions).

#### 5. `@stx/deploy` — Deployment Adapters (wraps [`ts-cloud`](https://github.com/stacksjs/ts-cloud))
**Status**: Package renamed to `@stx/deploy`. Wraps ts-cloud for deployment infrastructure.

#### 6. Testing — Use [`very-happy-dom`](https://github.com/stacksjs/very-happy-dom) + Bun test runner
**Resolved**: Use `very-happy-dom` for DOM environment and Bun's built-in test runner. Already configured as preload.

---

### Medium Priority — Differentiators & Developer Experience

#### 7. Forms — Use `@stacksjs/validation` + `storage/framework/requests/` convention
**Resolved**: Use existing Stacks validation layer for server-side form validation.

#### 8. `@stacksjs/api` — API Routes / Server Functions
**Gap**: Dev server has basic API route support but no structured API layer.
**Competitors**: Next.js API routes, Nuxt server routes, tRPC, Hono
**What's needed**:
- File-based API routes (`api/users.ts` -> `POST /api/users`)
- Type-safe RPC (tRPC-style or server functions)
- Request/response helpers
- Middleware chain
- OpenAPI spec generation
- Rate limiting
- WebSocket support

#### 9. Caching — Use [`ts-cache`](https://github.com/stacksjs/ts-cache)
**Resolved**: Use `ts-cache` from the Stacks ecosystem (memory, LRU, Redis drivers; 11+ caching patterns; compression; distributed locking; CLI).

#### 10. `@stacksjs/email` — Email Sending
**Gap**: None.
**Competitors**: Laravel Mail, Resend, React Email, MJML
**What's needed**:
- STX templates for emails (reuse the template engine)
- Provider adapters (Resend, SendGrid, SES, SMTP)
- Email preview in dev tools
- Queued sending
- Template testing

#### 11. Background Jobs — Use [`bun-queue`](https://github.com/stacksjs/bun-queue)
**Resolved**: Use `bun-queue` from the Stacks ecosystem (Redis-backed, priority queues, cron scheduling, batch processing, distributed locks, middleware, horizontal scaling).

#### 12. `@stacksjs/storage` — File Storage
**Gap**: None.
**Competitors**: Laravel Filesystem, AWS S3 SDK, Uploadthing
**What's needed**:
- Unified API for local/S3/R2/GCS
- File uploads (direct, presigned URLs, multipart)
- Image optimization / transformation
- CDN integration

#### 13. `@stx/config` — Environment & Config Management (uses [`bunfig`](https://github.com/stacksjs/bunfig))
**Resolved**: Uses `bunfig` for config loading + env variable resolution. Package renamed to `@stx/config`.

#### 14. `@stacksjs/error` — Error Handling & Reporting
**Gap**: Has error handling module but no user-facing error pages/boundaries.
**Competitors**: Next.js error.tsx, Sentry, Laravel exception handler
**What's needed**:
- Error boundaries (catch errors in component tree)
- Custom error pages (404, 500, etc.)
- Error reporting integration (Sentry, Bugsnag)
- Development error overlay (like Next.js or Vite)
- Source map support for production errors

#### 15. Image Optimization — Use [`ts-images`](https://github.com/stacksjs/ts-images)
**Resolved**: Use `ts-images` (imgx) from the Stacks ecosystem (sharp pipeline, format optimization, app icon generation, sprite sheets, CLI).

---

### Lower Priority — Nice to Have / Emerging Patterns

#### 16. `@stacksjs/ai` — AI Integration
**Competitors**: Vercel AI SDK, LangChain
**What's needed**: LLM streaming helpers, AI-powered components (chat, autocomplete), RAG utilities

#### 18. Realtime — Use [`ts-broadcasting`](https://github.com/stacksjs/ts-broadcasting)
**Resolved**: Use `ts-broadcasting` from the Stacks ecosystem (6 drivers, channel auth, encryption, Redis scaling, client SDK).

#### 19. `@stacksjs/payments` — Payment Processing
**Competitors**: Laravel Cashier, Stripe.js
**What's needed**: Stripe/Paddle integration, subscription management, checkout components

#### 20. `@stacksjs/search` — Full-Text Search
**Competitors**: Laravel Scout, Algolia, Meilisearch, Typesense
**What's needed**: Search indexing, instant search component, faceted filtering

#### 21. `@stacksjs/logger` — Structured Logging
**Competitors**: Pino, Winston, Laravel Log
**What's needed**: Structured JSON logging, log levels, log drains, request correlation

#### 22. `@stacksjs/mailer` — Transactional Email Templates
**Competitors**: React Email, MJML, Maizzle
**What's needed**: Email template builder using STX syntax, preview mode, provider adapters

#### 23. `@stacksjs/feature-flags` — Feature Flags
**Competitors**: LaunchDarkly, Unleash, Laravel Pennant
**What's needed**: Runtime feature toggles, A/B testing, gradual rollouts

#### 24. `@stacksjs/cms` — Content Management
**Competitors**: Nuxt Content, Contentlayer, Keystatic, Sanity
**What's needed**: File-based content (MDX-like), content collections with typed schemas, admin UI

#### 25. `@stacksjs/cli` — CLI Framework
**Competitors**: CAC, Commander, oclif
**What's needed**: Extract CLI utilities into reusable package for user CLIs

#### 26. `@stacksjs/fonts` — Font Optimization
**Competitors**: Next.js Font, Fontsource, @unfonts
**What's needed**: Automatic font optimization, self-hosting, font-display strategies, subsetting

#### 27. `@stacksjs/seo` — SEO Toolkit
**Gap**: Has SEO directives but could be a standalone package.
**What's needed**: Sitemap generation, robots.txt, structured data helpers, meta tag management, OG image generation

#### 28. `@stacksjs/security` — Security Hardening
**Competitors**: Helmet.js, Laravel security middleware
**What's needed**: CSP header management, CORS configuration, rate limiting, bot protection, security headers

---

## Priority Matrix

```
                        HIGH IMPACT
                            |
        Auth, Data Fetching |  Router, Deploy
        ORM/Database        |  API Routes
                            |
   LOW EFFORT ------------- + ------------- HIGH EFFORT
                            |
        Config/Env, Error   |  CMS, Realtime
        Image, Fonts, SEO   |  AI, Payments, Queue
                            |
                        LOW IMPACT
```

## Recommended Build Order

### Phase 1 — Foundation (make it shippable)
1. `@stacksjs/router` — Standalone router with typed params
2. `@stacksjs/data` — Data loading + server actions
3. `@stx/deploy` — Wraps `ts-cloud` + Bun server/static adapters
4. `@stx/config` — Uses `bunfig` for type-safe env vars

### Phase 2 — Full-Stack (compete with Next/Nuxt/Laravel)
5. `@stacksjs/auth` — Session + OAuth
6. `@stacksjs/api` — API routes + type-safe RPC
7. Use `bun-query-builder` for database/ORM
8. Use `@stacksjs/validation` for forms
9. Use `ts-cache` for caching/ISR

### Phase 3 — Production Ready (enterprise adoption)
10. `@stacksjs/email` — STX email templates
11. `@stacksjs/storage` — File storage abstraction
12. Use `very-happy-dom` + Bun test runner for testing
13. `@stacksjs/errors` — Error boundaries + reporting
14. Use `ts-images` for image optimization

### Phase 4 — Ecosystem (moat building)
15. Use `ts-broadcasting` for realtime
16. Use `bun-queue` for background jobs
17. `@stacksjs/search` — Full-text search
18. `@stacksjs/ai` — LLM integration
19. `@stacksjs/cms` — File-based content system
---

## What STX Already Does Better Than Most

- **Single file format** for web + desktop + mobile (no other framework does this)
- **Blade-style directives** in a JavaScript ecosystem (familiar to PHP devs migrating)
- **200K+ icons** built-in with zero config
- **Native desktop** via Craft (Zig webview) — lighter than Electron
- **Native mobile** compilation path (most JS frameworks punt on this)
- **VS Code extension** from day one
- **Bun-native** — not retrofitted, built for Bun from the start
- **HTML-first** — progressive enhancement, works without JS by default
