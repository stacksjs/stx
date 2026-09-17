/**
 * Effect disposal is idempotent in both reactive implementations
 * (stacksjs/stx#1954).
 *
 * The client runtime can reach one effect's dispose from more than one place.
 * trackEffects copies a child tracker's disposers into its parent, so the
 * effects of a :for row rendered on first load are held by the row's own
 * tracker AND by the page tracker. Removing the row disposes them; SPA
 * navigation later calls the page tracker, which disposes them again. Before
 * #1954 a second dispose ran the effect's cleanup a second time.
 *
 * signals-api.ts and the runtime template literal in signals.ts must agree
 * (see dual-impl-parity.test.ts and CLAUDE.md note 40), so this runs the same
 * contract against both.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import * as api from '../../src/signals-api'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface DisposeImpl {
  state: <T>(initial: T) => { (): T, set: (v: T) => void }
  effect: (fn: () => void | (() => void)) => () => void
}

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

function getImpl(name: 'signals-api' | 'runtime'): DisposeImpl {
  // eslint-disable-next-line ts/no-explicit-any
  return name === 'signals-api' ? api as unknown as DisposeImpl : (globalThis as any).window?.stx as DisposeImpl
}

for (const name of ['signals-api', 'runtime'] as const) {
  describe(`effect dispose parity (${name})`, () => {
    let impl: DisposeImpl
    beforeAll(() => {
      impl = getImpl(name)
      if (!impl)
        throw new Error(`impl ${name} not available — happy-dom or runtime setup failed`)
    })

    it('runs the cleanup once however many times dispose is called', () => {
      let cleanups = 0
      const dispose = impl.effect(() => () => { cleanups++ })
      dispose()
      dispose()
      dispose()
      expect(cleanups).toBe(1)
    })

    it('runs only the latest cleanup on dispose after a re-run', () => {
      const s = impl.state(0)
      const cleaned: number[] = []
      const dispose = impl.effect(() => {
        const seen = s()
        return () => { cleaned.push(seen) }
      })
      s.set(1)
      // The re-run released the first run's cleanup.
      expect(cleaned).toEqual([0])
      dispose()
      dispose()
      expect(cleaned).toEqual([0, 1])
    })

    it('does not re-run after dispose, and a second dispose changes nothing', () => {
      const s = impl.state(0)
      let runs = 0
      const dispose = impl.effect(() => { s(); runs++ })
      expect(runs).toBe(1)
      dispose()
      s.set(1)
      dispose()
      s.set(2)
      expect(runs).toBe(1)
    })

    it('does not retry a cleanup that threw on the first dispose', () => {
      let attempts = 0
      const dispose = impl.effect(() => () => {
        attempts++
        throw new Error('cleanup failed')
      })
      expect(() => dispose()).toThrow('cleanup failed')
      expect(() => dispose()).not.toThrow()
      expect(attempts).toBe(1)
    })
  })
}
