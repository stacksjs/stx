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

#### 4. `@stacksjs/orm` or `@stacksjs/db` — Database Layer
**Gap**: Has a `database.ts` file (~2,400 lines) but unclear if it's a full ORM.
**Competitors**: Prisma, Drizzle, Laravel Eloquent, Kysely
**What's needed**:
- Schema definition / migrations
- Query builder
- Relations (one-to-many, many-to-many, etc.)
- Type-safe queries (auto-generated from schema)
- Database seeding
- Multi-database support (SQLite, Postgres, MySQL)
- Edge-compatible (D1, Turso, PlanetScale)

#### 5. `@stacksjs/deploy` — Deployment Adapters
**Gap**: No deployment story.
**Competitors**: Vercel (Next.js), Netlify, Cloudflare Pages, Laravel Forge/Vapor
**What's needed**:
- Build adapters (Node, Bun, static, serverless, edge)
- Platform presets (Vercel, Netlify, Cloudflare Workers, AWS Lambda, Fly.io)
- Docker support / Dockerfile generation
- Preview deployments
- Environment variable management

#### 6. `@stacksjs/testing` — Testing Utilities
**Gap**: Tests exist but no dedicated testing utilities package for users.
**Competitors**: @testing-library/react, @vue/test-utils, Playwright, Vitest
**What's needed**:
- Component testing utilities (render, query, interact)
- Template assertion helpers
- Mock server / MSW integration
- Snapshot testing helpers
- E2E testing integration (Playwright adapter)
- Visual regression testing utilities

---

### Medium Priority — Differentiators & Developer Experience

#### 7. `@stacksjs/forms` — Form Handling
**Gap**: Has form directives but no full form library.
**Competitors**: React Hook Form, Formik, VeeValidate, Laravel form requests
**What's needed**:
- Form state management
- Field-level validation (Zod/Valibot integration)
- Multi-step forms
- File uploads with progress
- Form persistence (draft saving)
- Server-side validation with error propagation

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

#### 9. `@stacksjs/cache` — Caching Layer
**Gap**: Template caching exists but no application-level caching.
**Competitors**: Laravel Cache, Vercel ISR, Nuxt cache
**What's needed**:
- Page-level caching (ISR — Incremental Static Regeneration)
- Data caching with TTL
- Cache invalidation (tags, paths)
- Multiple drivers (memory, Redis, filesystem)
- Edge caching headers

#### 10. `@stacksjs/email` — Email Sending
**Gap**: None.
**Competitors**: Laravel Mail, Resend, React Email, MJML
**What's needed**:
- STX templates for emails (reuse the template engine)
- Provider adapters (Resend, SendGrid, SES, SMTP)
- Email preview in dev tools
- Queued sending
- Template testing

#### 11. `@stacksjs/queue` — Background Jobs
**Gap**: None.
**Competitors**: Laravel Queue, BullMQ, Inngest
**What's needed**:
- Job dispatching and processing
- Multiple drivers (Redis, database, in-memory)
- Retry strategies
- Scheduled/cron jobs
- Job monitoring in devtools

#### 12. `@stacksjs/storage` — File Storage
**Gap**: None.
**Competitors**: Laravel Filesystem, AWS S3 SDK, Uploadthing
**What's needed**:
- Unified API for local/S3/R2/GCS
- File uploads (direct, presigned URLs, multipart)
- Image optimization / transformation
- CDN integration

#### 13. `@stacksjs/config` — Environment & Config Management
**Gap**: Has `stx.config.ts` but no env management package.
**Competitors**: dotenv, Nuxt runtimeConfig, t3-env
**What's needed**:
- Type-safe environment variables (validated at build time)
- Runtime config vs build-time config separation
- Secret management
- Per-environment overrides

#### 14. `@stacksjs/error` — Error Handling & Reporting
**Gap**: Has error handling module but no user-facing error pages/boundaries.
**Competitors**: Next.js error.tsx, Sentry, Laravel exception handler
**What's needed**:
- Error boundaries (catch errors in component tree)
- Custom error pages (404, 500, etc.)
- Error reporting integration (Sentry, Bugsnag)
- Development error overlay (like Next.js or Vite)
- Source map support for production errors

#### 15. `@stacksjs/image` — Image Optimization
**Gap**: Has image optimization tests but no standalone package.
**Competitors**: Next.js Image, Nuxt Image, sharp, Cloudinary
**What's needed**:
- `<Image>` component with automatic optimization
- Responsive images (srcset generation)
- Lazy loading with blur placeholder
- Format conversion (WebP, AVIF)
- CDN integration
- Build-time optimization

---

### Lower Priority — Nice to Have / Emerging Patterns

#### 16. `@stacksjs/analytics` — Analytics Integration
**Competitors**: Vercel Analytics, Plausible, PostHog
**What's needed**: Privacy-friendly analytics, Web Vitals tracking, custom events

#### 17. `@stacksjs/ai` — AI Integration
**Competitors**: Vercel AI SDK, LangChain
**What's needed**: LLM streaming helpers, AI-powered components (chat, autocomplete), RAG utilities

#### 18. `@stacksjs/realtime` — Real-time Features
**Competitors**: Laravel Echo, Socket.io, Pusher, PartyKit
**What's needed**: WebSocket abstraction, server-sent events, presence channels, broadcasting

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
3. `@stacksjs/deploy` — At least static + Bun server adapters
4. `@stacksjs/config` — Type-safe env vars

### Phase 2 — Full-Stack (compete with Next/Nuxt/Laravel)
5. `@stacksjs/auth` — Session + OAuth
6. `@stacksjs/db` — ORM with migrations
7. `@stacksjs/api` — API routes + type-safe RPC
8. `@stacksjs/forms` — Validation + server actions
9. `@stacksjs/cache` — ISR + data caching

### Phase 3 — Production Ready (enterprise adoption)
10. `@stacksjs/email` — STX email templates
11. `@stacksjs/storage` — File storage abstraction
12. `@stacksjs/testing` — Component + E2E testing utils
13. `@stacksjs/error` — Error boundaries + reporting
14. `@stacksjs/image` — Optimized image component

### Phase 4 — Ecosystem (moat building)
15. `@stacksjs/realtime` — WebSockets + SSE
16. `@stacksjs/queue` — Background jobs
17. `@stacksjs/search` — Full-text search
18. `@stacksjs/ai` — LLM integration
19. `@stacksjs/cms` — File-based content system
20. `@stacksjs/analytics` — Web Vitals + custom events

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
