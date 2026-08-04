/**
 * useClipboard's auto-reset must be observable (stacksjs/stx#1805).
 *
 * `copied` flips true on copy and back to false on a timer. `subscribe()` is the
 * only channel through which a caller can learn about either — `copied` itself
 * is a plain getter, not a signal, so nothing re-reads it on its own.
 *
 * The reset callback never called `notify()`. So a subscriber mirroring `copied`
 * into a signal saw the true and never the false: it latched, and the standard
 * "Copied!" -> "Copy" affordance could not be built from the public surface at
 * all. The timer's only job was to flip a flag nobody could observe flipping.
 *
 * The timer also outlived the composable — no `onDestroy` — so it fired into
 * subscribers of a scope that had already gone away.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { useClipboard } from '../../src/composables/use-clipboard'

const g = globalThis as any
let written: string[] = []
const savedNavigator = g.navigator

beforeEach(() => {
  written = []
  g.navigator = {
    clipboard: {
      writeText: async (text: string) => { written.push(text) },
      readText: async () => written[written.length - 1] ?? '',
    },
  }
})

afterEach(() => {
  g.navigator = savedNavigator
})

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('useClipboard auto-reset', () => {
  it('notifies subscribers when copied resets', async () => {
    const clipboard = useClipboard({ timeout: 10 })
    const seen: boolean[] = []
    clipboard.subscribe(() => { seen.push(clipboard.copied) })

    await clipboard.copy('hello')
    expect(seen).toEqual([true])

    await tick(30)

    // Without the reset notification this stays [true] forever.
    expect(seen).toEqual([true, false])
  })

  it('lets a subscriber mirror copied into its own state', async () => {
    // The actual affordance the omission made impossible.
    const clipboard = useClipboard({ timeout: 10 })
    let label = 'Copy'
    clipboard.subscribe(() => { label = clipboard.copied ? 'Copied!' : 'Copy' })

    await clipboard.copy('x')
    expect(label).toBe('Copied!')

    await tick(30)
    expect(label).toBe('Copy')
  })

  it('reports the copied text on the reset too', async () => {
    const clipboard = useClipboard({ timeout: 10 })
    const texts: string[] = []
    clipboard.subscribe(text => { texts.push(text) })

    await clipboard.copy('payload')
    await tick(30)

    expect(texts).toEqual(['payload', 'payload'])
  })

  it('restarts the window when a second copy lands mid-timer', async () => {
    const clipboard = useClipboard({ timeout: 40 })
    const seen: boolean[] = []
    clipboard.subscribe(() => { seen.push(clipboard.copied) })

    await clipboard.copy('one')
    await tick(20)
    await clipboard.copy('two')
    await tick(20)

    // Still inside the restarted window: no reset yet.
    expect(seen).toEqual([true, true])

    await tick(40)
    expect(seen).toEqual([true, true, false])
  })

  it('cancels the pending timer on stop()', async () => {
    // Otherwise it fires into subscribers of a scope that is already gone.
    const clipboard = useClipboard({ timeout: 20 })
    const seen: boolean[] = []
    clipboard.subscribe(() => { seen.push(clipboard.copied) })

    await clipboard.copy('x')
    clipboard.stop()
    await tick(40)

    expect(seen).toEqual([true])
  })

  it('drops subscribers on stop()', async () => {
    const clipboard = useClipboard({ timeout: 5 })
    const seen: boolean[] = []
    clipboard.subscribe(() => { seen.push(clipboard.copied) })

    clipboard.stop()
    await clipboard.copy('x')

    expect(seen).toEqual([])
  })

  it('still copies to the clipboard', async () => {
    const clipboard = useClipboard()
    expect(await clipboard.copy('to-write')).toBe(true)
    expect(written).toEqual(['to-write'])
  })
})
