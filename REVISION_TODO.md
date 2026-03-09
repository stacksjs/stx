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
- [ ] Check if `@analytics` directive in stx core references `packages/analytics` — if so, rewire to use `@stacksjs/ts-analytics` or remove
- [x] Update `ECOSYSTEM_TODO.md` to reference `@stacksjs/ts-analytics` instead
- [x] Remove test section from `test-ecosystem.ts`
- [x] Update `docs/advanced/plugins.md` and `docs/showcase.md`

---

## Phase 1 Revisions

### 2. `packages/config` — REVISE (Use bunfig) ⚠️ Partial

**Status:** Partial — renamed to `@stx/config` and imports updated, but internals NOT yet rewritten to use bunfig

**Reason:** The stacks ecosystem already has [`bunfig`](https://github.com/stacksjs/bunfig), which stx already uses for config loading (`stx.config.ts`). The `packages/config` env utilities (`env.ts`, `loader.ts`, `validation.ts`) are a hand-rolled `.env` file parser and typed env schema validator that duplicate what bunfig already provides.

**What was done:**
- [x] Renamed package from `@stacksjs/config` to `@stx/config` in `package.json`
- [x] Updated `tsconfig.json` path mapping to `@stx/config`
- [x] Updated `packages/stx/src/env.ts` re-exports to import from `@stx/config`
- [x] Updated `packages/stx/src/plugin.ts` import to `@stx/config`
- [x] Updated `test-ecosystem.ts` config section to `@stx/config`
- [x] Updated `ECOSYSTEM_TODO.md` and `STX_ECOSYSTEM.md`

**Still TODO — internal rewrite:**
- [ ] Replace `defineEnv()` / `validateEnv()` usage with bunfig's `loadConfig()` + env variable resolution
- [ ] Remove custom `.env` file parsing (`loader.ts`) — bunfig handles env vars automatically
- [ ] Remove `validation.ts` — bunfig has JSON Schema validation built-in
- [ ] Keep `isProduction()`, `isDevelopment()`, `isTest()` helpers — move to stx core or lightweight utility
- [ ] Update `packages/stx/src/env.ts` re-exports after internal rewrite
- [ ] Rewrite or remove `packages/config/test/env.test.ts` and `packages/config/test/validation.test.ts`

**Files still needing internal changes:**
- `packages/config/src/env.ts` — Rewrite to use bunfig
- `packages/config/src/loader.ts` — Remove (bunfig handles this)
- `packages/config/src/validation.ts` — Remove (bunfig handles this)
- `packages/config/src/types.ts` — Slim down (remove `EnvVarDef`, `TypedEnv`, `EnvValidationError`)
- `packages/config/src/index.ts` — Update exports
- `packages/config/test/env.test.ts` — Rewrite or remove
- `packages/config/test/validation.test.ts` — Remove

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

### 10. `packages/config` — RENAME (Naming conflict) ✅

**Status:** Done (rename only — see revision #2 for internal rewrite)

**Action Items:**
- [x] Rename package from `@stacksjs/config` to `@stx/config` in `package.json`
- [x] Update all imports across the codebase (`env.ts`, `plugin.ts`, `test-ecosystem.ts`, `tsconfig.json`)
- [ ] Combine with revision #2 (internal rewrite to use bunfig) — still pending

---

### 11. `packages/deploy` — REVISE (Naming conflict + should wrap ts-cloud) ⚠️ Partial

**Status:** Partial — renamed to `@stx/deploy` and imports updated, but internals NOT yet rewritten to wrap ts-cloud

**What was done:**
- [x] Renamed package from `@stacksjs/deploy` to `@stx/deploy` in `package.json`
- [x] Updated `tsconfig.json` path mapping to `@stx/deploy`
- [x] Updated `test-ecosystem.ts` deploy section to `@stx/deploy`
- [x] Updated `ECOSYSTEM_TODO.md` and `STX_ECOSYSTEM.md`

**Still TODO — internal rewrite:**
- [ ] Rewrite to wrap/reuse `ts-cloud` for actual deployment logic
- [ ] Keep the adapter interface pattern if useful, but delegate to ts-cloud
- [ ] Add `ts-cloud` as dependency in `package.json`
- [ ] Rewrite `packages/deploy/test/adapters.test.ts`

**Files still needing internal changes:**
- `packages/deploy/src/adapter.ts` — Revise to wrap ts-cloud
- `packages/deploy/src/adapters/bun-server.ts` — Revise
- `packages/deploy/src/adapters/static.ts` — Revise
- `packages/deploy/src/index.ts` — Update exports
- `packages/deploy/src/types.ts` — Revise types
- `packages/deploy/test/adapters.test.ts` — Rewrite

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
| config | 2 (env, validation) | ⚠️ Needs rewrite after bunfig revision (#2) |
| deploy | 2 (adapters, runtime) | ⚠️ Needs rewrite after ts-cloud revision (#11) |

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
| 2 | `packages/config` — REVISE (use bunfig) | ⚠️ Partial (renamed, internals pending) |
| 3 | `packages/db` — REMOVE | ✅ Done |
| 4 | `packages/cache` — REMOVE | ✅ Done |
| 5 | `packages/queue` — REMOVE | ✅ Done |
| 6 | `packages/realtime` — REMOVE | ✅ Done |
| 7 | `packages/image` — REMOVE | ✅ Done |
| 8 | `packages/testing` — REMOVE | ✅ Done |
| 9 | `packages/forms` — REMOVE | ✅ Done |
| 10 | `packages/config` — RENAME | ✅ Done |
| 11 | `packages/deploy` — RENAME + REVISE (wrap ts-cloud) | ⚠️ Partial (renamed, internals pending) |
| — | `test-ecosystem.ts` — UPDATE | ✅ Done |
| — | `ECOSYSTEM_TODO.md` — UPDATE | ✅ Done |
| — | `STX_ECOSYSTEM.md` — UPDATE | ✅ Done |
| — | `tsconfig.json` — UPDATE | ✅ Done |
