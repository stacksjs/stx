import { describe, expect, it } from 'bun:test'
import { state, effect, onMount, onDestroy } from '../../src/signals'

describe('Effect Disposal', () => {
  it('should stop running after dispose', () => {
    const count = state(0)
    let runs = 0
    const dispose = effect(() => { count(); runs++ })
    expect(runs).toBe(1)
    count.set(1)
    expect(runs).toBe(2)
    dispose()
    count.set(2)
    expect(runs).toBe(2)
  })

  it('should run cleanup function on dispose', () => {
    let cleaned = false
    const dispose = effect(() => {
      return () => { cleaned = true }
    })
    expect(cleaned).toBe(false)
    dispose()
    expect(cleaned).toBe(true)
  })

  it('should run cleanup before re-execution', () => {
    const count = state(0)
    const cleanups: number[] = []
    effect(() => {
      const val = count()
      return () => { cleanups.push(val) }
    })
    count.set(1)
    expect(cleanups).toEqual([0])
    count.set(2)
    expect(cleanups).toEqual([0, 1])
  })
})

describe('onDestroy', () => {
  it('should register destroy callback', () => {
    let destroyed = false
    onDestroy(() => { destroyed = true })
    expect(destroyed).toBe(false)
  })
})

describe('onMount', () => {
  it('should register mount callback', () => {
    let mounted = false
    onMount(() => { mounted = true })
    // onMount pushes to mountCallbacks array
    // In test context, it won't auto-fire (no DOMContentLoaded)
    expect(mounted).toBe(false)
  })
})
