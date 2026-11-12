/**
 * A wait of 0 means 0 in the page runtime, as it does in the module
 * composables.
 *
 * The runtime wrote its defaults with ||, which replaces 0 along with an
 * omitted argument. useTimeout(fn, 0), written to mean "on the next turn",
 * waited a full second: in one app a menu sheet stayed up a second after every
 * choice, audio stopped a second late and two reloads ran a second late. The
 * module versions take a default parameter, which only an omitted argument
 * triggers, so the two implementations disagreed about the same call.
 */
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import * as moduleTimers from '../../src/composables/use-timer'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { generateSignalsRuntimeDev } from '../../src/signals'

type Timers = Pick<typeof moduleTimers, 'useTimeout' | 'useDebounce' | 'useThrottle' | 'useDebouncedValue'>

let runtimeTimers: Timers

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  runtimeTimers = (window as unknown as { stx: Timers }).stx
})

/** Long enough for a 0ms timer under load, far short of any default. */
const SOON = 100

const implementations: Array<[string, () => Timers]> = [
  ['the module composables', () => moduleTimers],
  ['the page runtime', () => runtimeTimers],
]

describe.each(implementations)('a wait of 0 in %s', (_name, timers) => {
  it('fires a timeout on the next turn, not after the default second', async () => {
    let fired = false
    const timeout = timers().useTimeout(() => { fired = true }, 0)
    expect(timeout.isPending).toBe(true)
    await Bun.sleep(SOON)
    expect(fired).toBe(true)
    expect(timeout.isPending).toBe(false)
  })

  it('still waits the default second when no wait is given', async () => {
    let fired = false
    const timeout = timers().useTimeout(() => { fired = true })
    await Bun.sleep(SOON)
    expect(fired).toBe(false)
    timeout.stop()
  })

  it('runs a debounced call on the next turn', async () => {
    let calls = 0
    const debounced = timers().useDebounce(() => { calls++ }, 0)
    debounced()
    await Bun.sleep(SOON)
    expect(calls).toBe(1)
  })

  it('still debounces by the default when no wait is given', async () => {
    let calls = 0
    const debounced = timers().useDebounce(() => { calls++ })
    debounced()
    await Bun.sleep(SOON)
    expect(calls).toBe(0)
    debounced.cancel()
  })

  it('lets every call through a throttle of 0', async () => {
    let calls = 0
    const throttled = timers().useThrottle(() => { calls++ }, 0)
    throttled()
    await Bun.sleep(5)
    throttled()
    expect(calls).toBe(2)
  })

  it('settles a debounced value on the next turn', async () => {
    let source = 'first'
    const settled = timers().useDebouncedValue(() => source, 0)
    expect(settled.value).toBe('first')
    source = 'second'
    await Bun.sleep(SOON)
    // Sampled when its timer fires, which with a wait of 0 is the next turn.
    expect(settled.value).toBe('second')
  })
})

describe.each(['ios', 'android'] as const)('a wait of 0 on a native screen (%s)', (platform) => {
  afterEach(unmountAllNativeScreens)

  it('fires the timeout on the next turn', async () => {
    const { code } = await compileNativeScreen(`<script client>
const closed = state(false)
const defaulted = state(false)
useTimeout(() => closed.set(true), 0)
const unset = useTimeout(() => defaulted.set(true))
window.probe = { closed, defaulted, unset }
</script>
<section><span :text="closed() ? 'closed' : 'open'"></span></section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    await Bun.sleep(SOON)
    await phone.settle()
    expect(phone.context.probe.closed()).toBe(true)
    expect(phone.texts()).toContain('closed')
    expect(phone.context.probe.defaulted()).toBe(false)
    phone.context.probe.unset.stop()
  }, 30_000)
})

