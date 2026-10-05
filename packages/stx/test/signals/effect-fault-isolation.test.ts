/**
 * One effect that throws must not stop the others.
 *
 * The runtime re-threw an effect's error out of the `.set()` that ran it, and
 * that `set()` stopped notifying every subscriber after it. In an app this was
 * a list rendered half-way, its rows showing raw `{{ }}` and taking no clicks,
 * and a selection that moved while the transcript it drives stayed put. The
 * exception ended in an event handler or a native callback, so nothing reached
 * the console.
 *
 * A throw inside `batch()` was worse: it left batching switched on, so every
 * later update was queued for a flush that never came.
 *
 * The generated runtime is executed here, not pattern-matched, because what
 * matters is that the other effects run.
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { batch, effect, state } from '../../src/signals-api'

function quietConsole() {
  const errors: string[] = []
  return { errors, console: { ...console, log() {}, debug() {}, info() {}, warn() {}, error: (...args: unknown[]) => errors.push(args.map(String).join(' ')) } }
}

function runtime() {
  const window = new Window({ url: 'http://localhost/' }) as any
  const quiet = quietConsole()
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'console', generateSignalsRuntimeDev())(window, window.document, quiet.console)
  return { stx: window.stx, errors: quiet.errors }
}

describe('effect fault isolation, generated runtime', () => {
  it('runs every other effect when one throws, and says which', () => {
    const { stx, errors } = runtime()
    const n = stx.state(0)
    const seen: number[] = []
    stx.effect(() => {
      if (n() === 1)
        throw new Error('broken effect')
    })
    stx.effect(() => {
      seen.push(n())
    })

    expect(() => n.set(1)).not.toThrow()
    expect(seen).toEqual([0, 1])
    expect(errors.join('\n')).toContain('broken effect')

    // The broken effect is disposed; the healthy one keeps working.
    n.set(2)
    expect(seen).toEqual([0, 1, 2])
  })

  it('keeps updating after a batch whose body throws', () => {
    const { stx } = runtime()
    const n = stx.state(0)
    const seen: number[] = []
    stx.effect(() => {
      seen.push(n())
    })

    expect(() => stx.batch(() => {
      n.set(1)
      throw new Error('inside batch')
    })).toThrow('inside batch')
    expect(seen).toEqual([0, 1])

    n.set(2)
    expect(seen).toEqual([0, 1, 2])
  })
})

describe('effect fault isolation, module side', () => {
  it('runs every other effect when one throws', () => {
    const original = console.error
    const errors: string[] = []
    console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '))
    try {
      const n = state(0)
      const seen: number[] = []
      effect(() => {
        if (n() === 1)
          throw new Error('broken effect')
      })
      effect(() => {
        seen.push(n())
      })

      expect(() => n.set(1)).not.toThrow()
      expect(seen).toEqual([0, 1])
      expect(errors.join('\n')).toContain('broken effect')

      expect(() => batch(() => n.set(2))).not.toThrow()
      expect(seen).toEqual([0, 1, 2])
    }
    finally {
      console.error = original
    }
  })
})
