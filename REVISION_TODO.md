# Revision TODO — Improvement Commits Cleanup

> Tracking revisions needed for files introduced by the phase 1-4 improvement commits.
> Reference: `IMPROVEMENT_COMMITS_FILES.md` for full file listing.

---

## Phase 4 Revisions

### 1. `packages/analytics` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`@stacksjs/ts-analytics`](https://github.com/stacksjs/ts-analytics), a far more comprehensive privacy-first analytics toolkit. The `packages/analytics` created in stx is a lightweight subset that duplicates functionality already available in the community package.

**Action Items:**
- [x] Remove `packages/analytics/` directory entirely
- [x] Remove analytics entries from `tsconfig.json` path mappings
- [x] Remove analytics from workspace config if referenced
- [x] Check if `@analytics` directive in stx core references `packages/analytics` — No, it's self-contained (generates script tags for Fathom/GA4/Plausible)
- [x] Update `ECOSYSTEM_TODO.md` to reference `@stacksjs/ts-analytics` instead
- [x] Remove test section from `test-ecosystem.ts`
- [x] Update `docs/advanced/plugins.md` and `docs/showcase.md`

---

## Phase 1 Revisions

### 2. `packages/config` — REMOVE (Redundant) ✅

**Status:** Done — `packages/config` removed entirely. `defineEnv()`/`validateEnv()` contributed upstream to bunfig. Env helpers (`isProduction`, `isDevelopment`, `isTest`) moved into `packages/stx/src/env.ts`.

**Reason:** The stacks ecosystem already has [`bunfig`](https://github.com/stacksjs/bunfig), which stx already uses for config loading (`stx.config.ts`). Having a separate `@stx/config` package that only re-exports from bunfig + 3 one-liner helpers is redundant.

**Action Items:**
- [x] Contributed `defineEnv()` / `validateEnv()` + types to bunfig (`packages/bunfig/src/env.ts`)
- [x] Moved `isProduction()`, `isDevelopment()`, `isTest()` into `packages/stx/src/env.ts`
- [x] Updated `packages/stx/src/plugin.ts` to import from `./env` instead of `@stx/config`
- [x] Updated `packages/stx/src/env.ts` to import directly from `bunfig`
- [x] Updated `test-ecosystem.ts` to import from `bunfig` / `stx`
- [x] Removed `@stx/config` from `tsconfig.json` path mappings
- [x] Removed `packages/config/` directory entirely

---

## Phase 2 Revisions

### 3. `packages/db` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`bun-query-builder`](https://github.com/stacksjs/bun-query-builder), a production-ready, full-featured query builder and ORM.

**Action Items:**
- [x] Remove `packages/db/` directory entirely
- [x] Remove db entries from `tsconfig.json` path mappings
- [x] No stx core imports referencing `@stacksjs/db` found
- [x] Update `ECOSYSTEM_TODO.md` to reference `bun-query-builder`
- [x] Remove test section from `test-ecosystem.ts`

---

### 4. `packages/cache` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`ts-cache`](https://github.com/stacksjs/ts-cache), a production-grade caching library.

**Action Items:**
- [x] Remove `packages/cache/` directory entirely
- [x] Remove cache entries from `tsconfig.json` path mappings
- [x] No stx core imports referencing `@stacksjs/cache` found
- [x] Update `ECOSYSTEM_TODO.md` to reference `ts-cache`
- [x] Remove test section from `test-ecosystem.ts`

---

## Phase 4 Revisions (continued)

### 5. `packages/queue` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`bun-queue`](https://github.com/stacksjs/bun-queue), a production-grade Redis-backed job queue.

**Action Items:**
- [x] Remove `packages/queue/` directory entirely
- [x] Remove queue entries from `tsconfig.json` path mappings
- [x] No stx core imports referencing `@stacksjs/queue` found
- [x] Update `ECOSYSTEM_TODO.md` to reference `bun-queue`
- [x] Remove test section from `test-ecosystem.ts`

---

### 6. `packages/realtime` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`ts-broadcasting`](https://github.com/stacksjs/ts-broadcasting), a production-grade real-time broadcasting system.

**Action Items:**
- [x] Remove `packages/realtime/` directory entirely
- [x] Remove realtime entries from `tsconfig.json` path mappings
- [x] No stx core imports referencing `@stacksjs/realtime` found
- [x] Update `ECOSYSTEM_TODO.md` to reference `ts-broadcasting`
- [x] Remove test section from `test-ecosystem.ts`

---

## Phase 3 Revisions

### 7. `packages/image` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`ts-images`](https://github.com/stacksjs/ts-images) (imgx), a comprehensive image optimization toolkit.

**Action Items:**
- [x] Remove `packages/image/` directory entirely
- [x] Remove image entries from `tsconfig.json` path mappings
- [x] No stx core imports referencing `@stacksjs/image` found
- [x] Update `ECOSYSTEM_TODO.md` to reference `ts-images`
- [x] Remove test section from `test-ecosystem.ts`
- [ ] The `@img()` directive in stx could be rewired to use `ts-images` for actual optimization (future/optional)

---

### 8. `packages/testing` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The stacks ecosystem already has [`very-happy-dom`](https://github.com/stacksjs/very-happy-dom). Combined with Bun's built-in test runner, it replaces `packages/testing`. The stx project already uses `very-happy-dom` (configured in `bunfig.toml` as preload).

**Action Items:**
- [x] Remove `packages/testing/` directory entirely
- [x] Remove testing entries from `tsconfig.json` path mappings
- [x] `very-happy-dom` already configured as DOM environment for Bun tests
- [x] Update `ECOSYSTEM_TODO.md` to reference `very-happy-dom`
- [x] Remove test section from `test-ecosystem.ts`

---

## Phase 2 Revisions (continued)

### 9. `packages/forms` — REMOVE (Redundant) ✅

**Status:** Done

**Reason:** The Stacks framework already has a built-in form/validation layer via `@stacksjs/validation` + `@stacksjs/router`'s `Request` class, used in the `storage/framework/requests/` convention.

**Action Items:**
- [x] Remove `packages/forms/` directory entirely
- [x] Remove forms entries from `tsconfig.json` path mappings
- [x] No stx core imports referencing `@stacksjs/forms` found
- [x] Update `ECOSYSTEM_TODO.md`
- [x] Remove test section from `test-ecosystem.ts`

---

## Phase 1 Revisions (continued)

### 10. `packages/config` — REMOVE (Superseded by #2) ✅

**Status:** Done — package fully removed in revision #2. No separate rename needed.

---

### 11. `packages/deploy` — REVISE (Naming conflict + should wrap ts-cloud) ✅

**Status:** Done — renamed to `@stx/deploy`, ts-cloud integrated as cloud adapter

**What was done:**
- [x] Renamed package from `@stacksjs/deploy` to `@stx/deploy` in `package.json`
- [x] Updated `tsconfig.json` path mapping to `@stx/deploy`
- [x] Updated `test-ecosystem.ts` deploy section to `@stx/deploy`
- [x] Updated `ECOSYSTEM_TODO.md` and `STX_ECOSYSTEM.md`
- [x] Added `ts-cloud` as dependency in `package.json`
- [x] Created `src/adapters/cloud.ts` — cloud adapter wrapping ts-cloud's `deployStaticSite()`
- [x] Updated `src/index.ts` — added `cloudAdapter` and `CloudAdapterConfig` exports
- [x] Updated `test/adapters.test.ts` — added cloud adapter tests

---

### ⚠️ Global Note: `@stacksjs/*` → `@stx/*` Naming

Completed for config and deploy. Zero remaining references to `@stacksjs/config` or `@stacksjs/deploy` in source files.

- [x] `@stacksjs/config` → `@stx/config`
- [x] `@stacksjs/deploy` → `@stx/deploy`

---

## Testing Strategy

### `test-ecosystem.ts` — UPDATE (not delete)

**Status:** Done ✅

- [x] Remove test sections for deleted packages: analytics, cache, db, queue, realtime, image, testing, forms
- [x] Update test sections for revised packages: config → `@stx/config`, deploy → `@stx/deploy`
- [ ] Optionally add integration smoke tests for replacement packages (future)

### Per-package `*.test.ts` files

| Package | Test Files | Status |
|---------|-----------|--------|
| ai | 4 (ai, chat, providers, streaming) | ✅ Has tests |
| auth | 1 (auth) | ✅ Has tests |
| api | 2 (handler, scanner) | ✅ Has tests |
| email | 2 (mailer, providers) | ✅ Has tests |
| errors | 4 (boundary, dev-overlay, fallback, formatter) | ✅ Has tests |
| search | 4 (indexer, memory-driver, search, tokenizer) | ✅ Has tests |
| cms | 4 (collection, content, frontmatter, slug) | ✅ Has tests |
| storage | 2 (drivers, storage) | ✅ Has tests |
| router | 3 (matcher, middleware, named-routes) | ✅ Has tests |
| data | 3 (cache, loader, serialization) | ✅ Has tests |
| deploy | 2 (adapters, runtime) | ✅ Has tests |

### DOM environment

The test preload at `packages/stx/test-utils/happy-dom.ts` already uses `very-happy-dom`. No changes needed.

### Post-Revision Verification

After internal rewrites (#2 and #11) are complete, run:

```bash
# 1. Build to check no broken imports
bun run build

# 2. Run per-package tests
bun test

# 3. Run integration suite
bun test-ecosystem.ts

# 4. Lint
bun run lint
```

---

## Summary

| # | Revision | Status |
|---|----------|--------|
| 1 | `packages/analytics` — REMOVE | ✅ Done |
| 2 | `packages/config` — REMOVE (redundant of bunfig) | ✅ Done |
| 3 | `packages/db` — REMOVE | ✅ Done |
| 4 | `packages/cache` — REMOVE | ✅ Done |
| 5 | `packages/queue` — REMOVE | ✅ Done |
| 6 | `packages/realtime` — REMOVE | ✅ Done |
| 7 | `packages/image` — REMOVE | ✅ Done |
| 8 | `packages/testing` — REMOVE | ✅ Done |
| 9 | `packages/forms` — REMOVE | ✅ Done |
| 10 | `packages/config` — REMOVE (superseded by #2) | ✅ Done |
| 11 | `packages/deploy` — RENAME + REVISE (wrap ts-cloud) | ✅ Done |
| — | `test-ecosystem.ts` — UPDATE | ✅ Done |
| — | `ECOSYSTEM_TODO.md` — UPDATE | ✅ Done |
| — | `STX_ECOSYSTEM.md` — UPDATE | ✅ Done |
| — | `tsconfig.json` — UPDATE | ✅ Done |
