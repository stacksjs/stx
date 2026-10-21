import { expect, it } from 'bun:test'
import { SIGNALS_TIMER_RUNTIME } from '../src/client/signals-timer-runtime'

function fixture(ready = false) {
  const target = document.createElement('div') as HTMLElement & { craft?: object }
  if (ready) target.craft = { tray: {} }
  const mounts: Array<() => void> = []
  const destroys: Array<() => void> = []
  const useNativeDesktop = new Function('window', 'onMount', 'onDestroy', `${SIGNALS_TIMER_RUNTIME}\nreturn useNativeDesktop`)(
    target, (fn: () => void) => mounts.push(fn), (fn: () => void) => destroys.push(fn),
  )
  return { target, mounts, destroys, native: useNativeDesktop() }
}

it('delivers an already ready bridge on mount exactly once', () => {
  const f = fixture(true)
  let calls = 0
  f.native.onReady((bridge: unknown) => {
    expect(bridge).toBe(f.target.craft)
    calls++
  })
  expect(calls).toBe(0)
  f.mounts.forEach(fn => fn())
  f.target.dispatchEvent(new Event('craft:ready'))
  expect(calls).toBe(1)
})

it('waits for native readiness and removes listeners on teardown', () => {
  const f = fixture()
  let calls = 0
  f.native.onReady(() => calls++)
  f.mounts.forEach(fn => fn())
  expect(f.native()).toBeNull()
  f.target.craft = {}
  f.target.dispatchEvent(new Event('craft:ready'))
  f.target.dispatchEvent(new Event('craft:ready'))
  expect(calls).toBe(1)

  const disposed = fixture()
  disposed.native.onReady(() => calls++)
  disposed.destroys.forEach(fn => fn())
  disposed.target.craft = {}
  disposed.target.dispatchEvent(new Event('craft:ready'))
  expect(calls).toBe(1)
})
