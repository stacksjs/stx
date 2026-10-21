import { afterEach, expect, it } from 'bun:test'
import { backgroundDelay } from '../src/background-delay'
import { findCall, installMockBridge } from './_mock-bridge'

let bridge: ReturnType<typeof installMockBridge> | undefined
afterEach(() => { bridge?.uninstall(); bridge = undefined })

it('forwards the native deadline and cancellation signal without a DOM timer', async () => {
  bridge = installMockBridge(['timers'])
  let complete: () => void = () => {}
  bridge.whenCalled('timers', 'sleep', (_ms: number, _options: unknown) => new Promise<void>(resolve => { complete = resolve }))
  const signal = new AbortController().signal
  let done = false
  const delay = backgroundDelay(65000, { signal }).then(() => { done = true })
  await Promise.resolve()
  expect(done).toBe(false)
  expect(findCall(bridge.calls, 'timers', 'sleep')!.args).toEqual([65000, { signal }])
  complete()
  await delay
  expect(done).toBe(true)
})

it('requires the native capability rather than silently using a throttled DOM timer', async () => {
  bridge = installMockBridge(['focus'])
  ;(window as any).craft = { focus: {} }
  await expect(backgroundDelay(1)).rejects.toThrow(/runtime/)
})

it('rejects invalid delays and already aborted work without posting to native', async () => {
  bridge = installMockBridge(['timers'])
  for (const ms of [-1, NaN, Infinity, 0.5, 86400001]) await expect(backgroundDelay(ms)).rejects.toBeInstanceOf(RangeError)
  const controller = new AbortController()
  controller.abort()
  await expect(backgroundDelay(1, { signal: controller.signal })).rejects.toHaveProperty('name', 'AbortError')
  expect(bridge.calls).toHaveLength(0)
})

it('supports browser completion and cancellation', async () => {
  const previous = window.craft
  delete (window as any).craft
  try {
    await backgroundDelay(1)
    const controller = new AbortController()
    const waiting = backgroundDelay(65000, { signal: controller.signal })
    controller.abort()
    await expect(waiting).rejects.toHaveProperty('name', 'AbortError')
  }
  finally { window.craft = previous }
})
