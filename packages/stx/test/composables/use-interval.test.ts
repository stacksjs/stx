import { describe, expect, it } from 'bun:test'
import { useInterval } from '../../src/composables/use-timer'

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('useInterval', () => {
  it('counts ticks with the counter-style signature', async () => {
    const timer = useInterval(10)
    await tick(35)
    timer.pause()
    expect(timer.counter).toBeGreaterThan(0)
  })

  it('runs a callback passed first, rather than silently ignoring it', async () => {
    // `useInterval(fn, ms)` is what most callers write; before this was
    // supported the function was treated as the delay and never invoked.
    let calls = 0
    const timer = useInterval(() => { calls++ }, 10)
    await tick(35)
    timer.pause()
    expect(calls).toBeGreaterThan(0)
  })

  it('keeps the callback and the counter in step', async () => {
    const seen: number[] = []
    const timer = useInterval(counter => seen.push(counter), 10)
    await tick(35)
    timer.pause()
    expect(seen.length).toBe(timer.counter)
    expect(seen[0]).toBe(1)
  })

  it('stops calling back once paused', async () => {
    let calls = 0
    const timer = useInterval(() => { calls++ }, 10)
    await tick(25)
    timer.pause()
    const atPause = calls
    await tick(30)
    expect(calls).toBe(atPause)
  })

  it('defaults to a one-second delay when only a callback is given', () => {
    let calls = 0
    const timer = useInterval(() => { calls++ })
    timer.pause()
    expect(calls).toBe(0)
  })
})
