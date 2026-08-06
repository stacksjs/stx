/**
 * Polling gates: visibility, `enabled`, and stop-on-error (stacksjs/stx#1870).
 *
 * Neither `useInterval` nor `useQuery`'s `refetchInterval` could express "poll
 * every N seconds WHILE authorized AND visible" — so an app hand-composed the
 * stop conditions and, most importantly, kept hammering an endpoint from a
 * backgrounded tab because suppressing that was not expressible at all.
 *
 *  - useInterval gains opt-in `enabled` (bool | () => bool) and `whileVisible`.
 *  - refetchInterval pauses while the tab is hidden (a poll should), honours
 *    `enabled`, and stops after an error when `stopOnError` is set.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

let realFetch: typeof globalThis.fetch
let calls: string[] = []
let status = 200

function setHidden(v: boolean): void {
  Object.defineProperty(g.document, 'hidden', { configurable: true, get: () => v })
}
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const stx = () => g.window.stx

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realFetch = globalThis.fetch
})

beforeEach(() => {
  calls = []
  status = 200
  setHidden(false)
  globalThis.fetch = ((url: string) => {
    calls.push(String(url))
    return Promise.resolve(new Response('{"ok":true}', { status, headers: { 'Content-Type': 'application/json' } }))
  }) as never
})

afterEach(() => {
  // Any lingering refetchInterval (onDestroy never fires in this harness) is
  // parked by hiding the tab, so it can't call the restored real fetch.
  setHidden(true)
  globalThis.fetch = realFetch
})

describe('useInterval gating (#1870)', () => {
  it('ticks normally with no gating options (unchanged default)', async () => {
    let n = 0
    const t = stx().useInterval(() => { n++ }, 10)
    await wait(45)
    t.pause()
    expect(n).toBeGreaterThan(0)
  })

  it('does not tick while enabled() is false, and resumes when it flips true', async () => {
    let n = 0
    const flag = { on: false }
    const t = stx().useInterval(() => { n++ }, 10, { enabled: () => flag.on })
    await wait(45)
    expect(n).toBe(0)
    flag.on = true
    await wait(45)
    t.pause()
    expect(n).toBeGreaterThan(0)
  })

  it('skips ticks while the document is hidden when whileVisible is set', async () => {
    setHidden(true)
    let n = 0
    const t = stx().useInterval(() => { n++ }, 10, { whileVisible: true })
    await wait(45)
    expect(n).toBe(0)
    setHidden(false)
    await wait(45)
    t.pause()
    expect(n).toBeGreaterThan(0)
  })
})

describe('useQuery refetchInterval gating (#1870)', () => {
  // A leaked refetchInterval (onDestroy never fires in this harness) keeps
  // polling its own URL, so each test counts only calls to its unique URL.
  const countOf = (u: string) => calls.filter(x => x === u).length

  it('does not poll while the tab is hidden, and resumes when visible', async () => {
    setHidden(true)
    stx().useQuery('/api/live', { immediate: false, refetchInterval: 10 })
    await wait(45)
    expect(countOf('/api/live')).toBe(0)
    setHidden(false)
    await wait(45)
    expect(countOf('/api/live')).toBeGreaterThan(0)
  })

  it('honours enabled() for polling', async () => {
    const flag = { on: false }
    stx().useQuery('/api/e', { immediate: false, refetchInterval: 10, enabled: () => flag.on })
    await wait(45)
    expect(countOf('/api/e')).toBe(0)
    flag.on = true
    await wait(45)
    expect(countOf('/api/e')).toBeGreaterThan(0)
  })

  it('stops polling after an error when stopOnError is set', async () => {
    status = 500 // every response fails
    stx().useQuery('/api/err', { immediate: false, refetchInterval: 10, stopOnError: true })
    await wait(80)
    const stopped = countOf('/api/err')
    expect(stopped).toBeLessThanOrEqual(2) // stopped almost immediately, not ~8 times
    await wait(40)
    expect(countOf('/api/err')).toBe(stopped) // truly stopped, no further polls
  })
})
