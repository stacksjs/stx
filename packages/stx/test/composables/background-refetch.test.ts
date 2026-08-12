/**
 * A refresh that does not disturb the screen (stacksjs/stx#1929).
 *
 * `fetchData` opened with an unconditional `loading.set(true)` in both data
 * primitives, and neither took a background/quiet/silent option. So a view that
 * polls — the ordinary "keep this list current" case — could not use `useFetch`
 * or `useQuery` at all: converting it would put a spinner on screen once a
 * minute, forever. Every such view kept a hand-rolled fetch with its own
 * `{ quiet: true }` flag, which is the thing these composables exist to remove.
 *
 * The fix is two signals rather than one overloaded one, which is the
 * convention everywhere else this problem has been solved:
 *
 *   - `loading` — nothing to show yet. A background run leaves it alone.
 *   - `isFetching` — a request is open, background ones included. This is what
 *     a subtle "refreshing…" indicator binds to.
 *
 * Three things here are easy to get wrong and are asserted separately:
 *
 *   1. A background run must not CLEAR the current error on the way in. Blanking
 *      a message that is still true is the same disturbance as flashing a
 *      spinner — but it must clear on recovery, or one failed poll leaves the
 *      message up for the life of the page.
 *   2. `isFetching` has to come back down. A flag that latches is worse than no
 *      flag, because an indicator bound to it never goes away.
 *   3. The refetches nobody asked for — `refetchInterval`, `refetchOnFocus` —
 *      have to be background by default. Leaving those on the foreground path
 *      means the composable's own polling option still cannot be used for
 *      polling, which is the whole complaint.
 *
 * Run against BOTH `useFetch` implementations (CLAUDE.md item 40): the module
 * one in `composables/use-fetch.ts` and the generated runtime's. A background
 * refetch that worked on only one path would be the same crash-depending-on-
 * your-bundler shape #1726 fixed.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import * as composableModule from '../../src/composables/use-fetch'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { effect } from '../../src/signals-api'

interface BackgroundFetchResult {
  data: () => unknown
  loading: () => boolean
  isFetching: () => boolean
  error: () => unknown
  refetch: (options?: { background?: boolean }) => Promise<void>
}

type UseFetchFn = (url: string, opts?: Record<string, unknown>) => BackgroundFetchResult

// eslint-disable-next-line ts/no-explicit-any
const g = globalThis as any

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

/** Serves a body that changes on every call, so a refresh is observable. */
function installCountingFetch(url: string, opts: { failFirst?: boolean } = {}) {
  const original = globalThis.fetch
  let call = 0
  // eslint-disable-next-line ts/no-explicit-any
  ;(globalThis as any).fetch = async (input: string | URL | Request) => {
    if (String(input) !== url)
      throw new Error(`network: no mock for ${String(input)}`)
    call++
    if (opts.failFirst && call === 1)
      return new Response('nope', { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ call }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return {
    calls: () => call,
    restore: () => { (globalThis as { fetch: typeof fetch }).fetch = original },
  }
}

const flush = () => new Promise(r => setTimeout(r, 5))

for (const name of ['composable', 'runtime'] as const) {
  describe(`background refetch (${name})`, () => {
    let useFetch: UseFetchFn
    let mock: ReturnType<typeof installCountingFetch> | null = null

    beforeAll(() => {
      useFetch = (name === 'composable'
        ? composableModule.useFetch
        : g.window?.stx?.useFetch) as unknown as UseFetchFn
      if (!useFetch)
        throw new Error(`impl ${name} not available`)
    })

    beforeEach(() => {
      mock?.restore()
      mock = null
    })

    afterAll(() => {
      mock?.restore()
    })

    it('exposes isFetching alongside loading', () => {
      mock = installCountingFetch('/a')
      const r = useFetch('/a', { immediate: false })

      expect(typeof r.isFetching).toBe('function')
      expect(typeof r.loading).toBe('function')
    })

    it('leaves loading alone during a background refetch, and still lands the data', async () => {
      mock = installCountingFetch('/poll')
      const r = useFetch('/poll', { immediate: false })

      await r.refetch()
      await flush()
      expect(r.data()).toEqual({ call: 1 })

      // Watched rather than sampled: a spinner that flipped true and back
      // inside one tick would not show up in a point-in-time read, and the
      // assertion would pass by measuring nothing.
      let flashed = false
      // Each impl's signals are only visible to its OWN effect (CLAUDE.md item
      // 40) — a signals-api effect cannot observe a runtime signal.
      const watch = name === 'runtime' ? g.window.stx.effect : effect
      watch(() => { if (r.loading()) flashed = true })
      flashed = false

      const p = r.refetch({ background: true })
      // The assertion the issue is about: a poll must not flash the spinner.
      expect(r.loading()).toBe(false)
      // …but the request IS open, and an indicator can say so.
      expect(r.isFetching()).toBe(true)

      await p
      await flush()
      expect(flashed).toBe(false)
      expect(r.data()).toEqual({ call: 2 })
      // A latched flag is worse than none: the indicator would never clear.
      expect(r.isFetching()).toBe(false)
      expect(r.loading()).toBe(false)
    })

    it('still sets loading for an ordinary refetch', async () => {
      // The default is unchanged. Only an explicit background run opts out.
      mock = installCountingFetch('/normal')
      const r = useFetch('/normal', { immediate: false })

      const p = r.refetch()
      expect(r.loading()).toBe(true)
      expect(r.isFetching()).toBe(true)

      await p
      await flush()
      expect(r.loading()).toBe(false)
      expect(r.isFetching()).toBe(false)
    })

    it('does not blank a live error while the background run is in flight', async () => {
      // Clearing the message on the way in is the same disturbance as the
      // spinner: the failure is still true until the new response says
      // otherwise.
      mock = installCountingFetch('/flaky', { failFirst: true })
      const r = useFetch('/flaky', { immediate: false })

      await r.refetch()
      await flush()
      expect(r.error()).not.toBeNull()

      const p = r.refetch({ background: true })
      expect(r.error()).not.toBeNull()

      await p
      await flush()
      // …and it clears once the retry actually succeeds, or one failed poll
      // would leave the message up for the life of the page.
      expect(r.error()).toBeNull()
      expect(r.data()).toEqual({ call: 2 })
    })
  })
}

describe('useQuery', () => {
  let mock: ReturnType<typeof installCountingFetch> | null = null

  beforeEach(() => {
    mock?.restore()
    mock = null
    Object.defineProperty(g.document, 'hidden', { configurable: true, get: () => false })
  })

  afterAll(() => {
    // Park any surviving interval before the real fetch comes back: onDestroy
    // never fires in this harness.
    Object.defineProperty(g.document, 'hidden', { configurable: true, get: () => true })
    mock?.restore()
  })

  it('returns isStale and invalidate, which the type used to omit', () => {
    mock = installCountingFetch('/q1')
    const q = g.window.stx.useQuery('/q1', { immediate: false })

    // Both existed at runtime and were invisible to `StxQueryResult`, so
    // reading either was a type error on a value that was really there.
    expect(typeof q.isStale).toBe('function')
    expect(typeof q.invalidate).toBe('function')
    expect(typeof q.isFetching).toBe('function')
  })

  it('honours a background refetch', async () => {
    mock = installCountingFetch('/q2')
    const q = g.window.stx.useQuery('/q2', { immediate: false })

    await q.refetch()
    await flush()
    expect(q.data()).toEqual({ call: 1 })

    const p = q.refetch({ background: true })
    expect(q.loading()).toBe(false)
    expect(q.isFetching()).toBe(true)

    await p
    await flush()
    expect(q.data()).toEqual({ call: 2 })
    expect(q.isFetching()).toBe(false)
  })

  it('polls in the background, so refetchInterval stops flashing the spinner', async () => {
    // The composable's own polling option was on the foreground path, which
    // meant it could not be used for the thing it is named after.
    mock = installCountingFetch('/q3')
    const q = g.window.stx.useQuery('/q3', { refetchInterval: 20 })

    await q.refetch()
    await flush()
    expect(q.loading()).toBe(false)

    const before = mock.calls()
    // Watched through an effect, not sampled on a timer. A poll settles in a
    // microtask, so a spinner that flashed true and back inside one tick would
    // be invisible to polling the signal — and the test would pass by measuring
    // nothing. The effect re-runs on every transition.
    let flashed = false
    let fetchingSeen = false
    g.window.stx.effect(() => { if (q.loading()) flashed = true })
    g.window.stx.effect(() => { if (q.isFetching()) fetchingSeen = true })
    flashed = false
    fetchingSeen = false

    await new Promise(r => setTimeout(r, 90))

    expect(mock.calls()).toBeGreaterThan(before)
    expect(flashed).toBe(false)
    // The counter-assertion: the polls really did happen and really were
    // observable — just not through `loading`.
    expect(fetchingSeen).toBe(true)
  })
})
