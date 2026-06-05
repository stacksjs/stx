/**
 * The live-refresh poller (stacksjs/stx#1747): start/stop over an injectable
 * timer, verified without real time.
 */
import { describe, expect, it } from 'bun:test'
import { createPoller } from '../src/poller'

/** A fake timer: register one interval, fire it manually via `flush()`. */
function fakeTimer() {
  let fn: (() => void) | null = null
  let nextId = 1
  let cleared = false
  return {
    setInterval: (f: () => void) => { fn = f; return nextId++ },
    clearInterval: () => { fn = null; cleared = true },
    flush: () => fn?.(),
    get cleared() { return cleared },
  }
}

describe('createPoller', () => {
  it('ticks on each interval while running', () => {
    const t = fakeTimer()
    let ticks = 0
    const p = createPoller({ tick: () => { ticks++ }, intervalMs: 100, setInterval: t.setInterval, clearInterval: t.clearInterval })

    expect(p.running()).toBe(false)
    p.start()
    expect(p.running()).toBe(true)
    t.flush()
    t.flush()
    expect(ticks).toBe(2)
  })

  it('stop() clears the timer and halts ticks', () => {
    const t = fakeTimer()
    let ticks = 0
    const p = createPoller({ tick: () => { ticks++ }, intervalMs: 100, setInterval: t.setInterval, clearInterval: t.clearInterval })
    p.start()
    p.stop()
    expect(p.running()).toBe(false)
    expect(t.cleared).toBe(true)
    t.flush() // timer was cleared → fn is null
    expect(ticks).toBe(0)
  })

  it('start() is idempotent (no duplicate intervals)', () => {
    let intervals = 0
    const p = createPoller({
      tick: () => {},
      intervalMs: 100,
      setInterval: () => { intervals++; return intervals },
      clearInterval: () => {},
    })
    p.start()
    p.start()
    expect(intervals).toBe(1)
  })

  it('swallows a rejecting async tick (best-effort)', () => {
    const t = fakeTimer()
    const p = createPoller({ tick: async () => { throw new Error('x') }, intervalMs: 100, setInterval: t.setInterval, clearInterval: t.clearInterval })
    p.start()
    expect(() => t.flush()).not.toThrow()
  })
})
