/**
 * Parity tests for the two `useFetch` implementations (stacksjs/stx#1726).
 *
 * stx ships two `useFetch` impls:
 *   1. `packages/stx/src/composables/use-fetch.ts` — module-import path,
 *      used by tests and code that imports from 'stx' directly.
 *   2. The runtime template literal inside `packages/stx/src/signals.ts`,
 *      injected into client pages as `window.stx.useFetch`.
 *
 * Pre-fix the two diverged completely: composable returned a Vue-style
 * `{ get, subscribe, refresh, execute, abort }` ref; runtime returned
 * Signal-shaped `{ data, loading, error, refetch }`. Same import name,
 * incompatible APIs. Code crashed depending on which entry point
 * resolved.
 *
 * Contract pinned here (both impls):
 *   - returns `{ data: Signal<T|null>, loading: Signal<boolean>,
 *               error: Signal<Error|null>, refetch: () => Promise<void> }`
 *   - `loading()` flips true → false across a successful request
 *   - `data()` lands the parsed body on success
 *   - `error()` lands an Error on HTTP failure / network failure
 *   - `refetch()` reruns the request
 *   - `options.immediate: false` skips the initial fetch
 *
 * The composable additionally exposes `status`, `statusText`, and
 * `abort` (supersets the runtime doesn't implement) — those are tested
 * in `use-fetch.test.ts`, not here. This file only covers the shared
 * contract.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import * as composableModule from '../../src/composables/use-fetch'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface FetchResult {
  data: () => unknown
  loading: () => boolean
  error: () => Error | null
  refetch: () => Promise<void>
}

type UseFetchFn = (url: string | (() => string), opts?: Record<string, unknown>) => FetchResult

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

function getImpls(): Record<string, UseFetchFn> {
  // eslint-disable-next-line ts/no-explicit-any
  const runtimeUseFetch = (globalThis as any).window?.stx?.useFetch as UseFetchFn
  return {
    // eslint-disable-next-line ts/no-explicit-any
    'composable': composableModule.useFetch as any as UseFetchFn,
    'runtime': runtimeUseFetch,
  }
}

// Controllable mock fetch. Each test installs it on globalThis.
function installMockFetch(responses: Record<string, { body: unknown, ok?: boolean, status?: number }>) {
  const original = globalThis.fetch
  // eslint-disable-next-line ts/no-explicit-any
  ;(globalThis as any).fetch = async (input: string | URL | Request) => {
    const url = String(input)
    const entry = responses[url]
    if (!entry) {
      // Network-level failure → throw
      throw new Error(`network: no mock for ${url}`)
    }
    const ok = entry.ok ?? true
    const status = entry.status ?? (ok ? 200 : 500)
    return new Response(JSON.stringify(entry.body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return () => { (globalThis as { fetch: typeof fetch }).fetch = original }
}

async function flush() {
  // Allow microtasks + the inner await chain to settle.
  await new Promise(r => setTimeout(r, 5))
}

for (const name of ['composable', 'runtime'] as const) {
  describe(`useFetch parity (${name})`, () => {
    let useFetch: UseFetchFn

    beforeAll(() => {
      useFetch = getImpls()[name]
      if (!useFetch)
        throw new Error(`impl ${name} not available — runtime setup failed`)
    })

    let restore: () => void
    beforeEach(() => {
      restore?.()
      restore = installMockFetch({})
    })
    // CRITICAL: restore globalThis.fetch when this describe ends. Without
    // it, the mock fetch leaks into subsequent test files in the same bun
    // process — and since the mock throws on any URL it doesn't recognize,
    // any later test that calls real `fetch(http://localhost:PORT/...)`
    // (e.g. production-server/error-page.test.ts) suddenly gets thrown
    // errors. Caught during the full-suite regression for #1729.
    afterAll(() => {
      restore?.()
    })

    it('returns Signal-shaped { data, loading, error, refetch }', async () => {
      restore()
      restore = installMockFetch({ '/x': { body: { ok: 1 } } })
      const r = useFetch('/x', { immediate: false })
      expect(typeof r.data).toBe('function')
      expect(typeof r.loading).toBe('function')
      expect(typeof r.error).toBe('function')
      expect(typeof r.refetch).toBe('function')
    })

    it('refetch() resolves data and flips loading true → false', async () => {
      restore()
      restore = installMockFetch({ '/users': { body: [{ id: 1 }, { id: 2 }] } })
      const r = useFetch('/users', { immediate: false })

      // Before refetch — initial state has no data, not yet loading.
      expect(r.data()).toBeNull()

      const p = r.refetch()
      // Loading should be true synchronously after refetch starts.
      expect(r.loading()).toBe(true)
      await p
      await flush()

      expect(r.loading()).toBe(false)
      expect(r.data()).toEqual([{ id: 1 }, { id: 2 }])
      expect(r.error()).toBeNull()
    })

    it('records error on HTTP failure', async () => {
      restore()
      restore = installMockFetch({ '/boom': { body: 'fail', ok: false, status: 500 } })
      const r = useFetch('/boom', { immediate: false })

      await r.refetch()
      await flush()

      expect(r.loading()).toBe(false)
      expect(r.error()).not.toBeNull()
      expect(r.error()?.message).toContain('500')
    })

    it('records error on network failure (no response)', async () => {
      restore()
      restore = installMockFetch({}) // empty → fetch will throw
      const r = useFetch('/no-mock', { immediate: false })

      await r.refetch()
      await flush()

      expect(r.error()).not.toBeNull()
    })

    // The `immediate: true` happy path differs intentionally between
    // the two impls: the composable calls doFetch() synchronously in
    // the constructor; the runtime defers via onMount() so the request
    // doesn't start before the scope's setup is complete. Inside a real
    // `<script client>` the difference is invisible (the scope mounts
    // either way), but in this no-scope parity harness onMount never
    // fires for the runtime, so testing it here would always fail on
    // the runtime side. Skipped intentionally; covered separately by
    // composable-only and signals-runtime tests.

    it('immediate: false skips the initial fetch', async () => {
      restore()
      restore = installMockFetch({ '/manual': { body: 'should-not-load' } })
      const r = useFetch('/manual', { immediate: false })

      await flush()
      // Without an explicit refetch(), data must remain at initial null.
      expect(r.data()).toBeNull()
    })
  })
}
