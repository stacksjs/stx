import { expect, test } from 'bun:test'
import { useAnimationFrame } from '../src/composables/use-animation-frame'
import { referencedFrameworkComposables, getFrameworkComposableScript } from '../src/framework-composables'

test('animation clock suspends hidden work, resets delta, and disposes without leaked frames', () => {
  const saved = new Map<string, PropertyDescriptor | undefined>()
  const listeners = new Set<() => void>()
  const document = { hidden: false, addEventListener: (name: string, fn: () => void) => listeners.add(fn), removeEventListener: (name: string, fn: () => void) => listeners.delete(fn) }
  const visibility = () => listeners.forEach(fn => fn())
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  const globals = { window: {}, document, requestAnimationFrame: (fn: FrameRequestCallback) => { frames.set(++id, fn); return id }, cancelAnimationFrame: (key: number) => frames.delete(key) }
  for (const [key, value] of Object.entries(globals)) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value }) }
  const tick = (time: number) => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time)) }
  try {
    const deltas: number[] = []
    const clock = useAnimationFrame(delta => deltas.push(delta), { maxDelta: 50 })
    tick(0); tick(20); tick(400)
    expect(deltas).toEqual([0, 20, 50])
    document.hidden = true; visibility()
    expect(frames.size).toBe(0)
    document.hidden = false; visibility(); tick(50000)
    expect(deltas.at(-1)).toBe(0)
    clock.pause(); expect(frames.size).toBe(0)
    clock.resume(); clock.resume(); expect(frames.size).toBe(1)
    clock.stop(); clock.resume(); visibility()
    expect(frames.size).toBe(0)
    expect(clock.active).toBe(false)
  }
  finally { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key) } }
})

test('animation clock is SSR safe and validates its time budget', () => {
  const browser = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Reflect.deleteProperty(globalThis, 'window')
  try {
    const clock = useAnimationFrame(() => { throw new Error('SSR must not run') })
    expect(clock.active).toBe(false)
  }
  finally { if (browser) Object.defineProperty(globalThis, 'window', browser) }
  expect(() => useAnimationFrame(() => {}, { maxDelta: Infinity })).toThrow(RangeError)
})

test('animation clock is delivered to client scripts on demand', async () => {
  expect(referencedFrameworkComposables('useAnimationFrame(delta => draw(delta))')).toEqual(['useAnimationFrame'])
  const bundle = await getFrameworkComposableScript('useAnimationFrame(delta => draw(delta))')
  expect(bundle).toContain('useAnimationFrame')
  expect(bundle).not.toContain('node:')
})
