/**
 * #1873 (second half): "the runtime console.logs unconditionally in production".
 *
 * That claim is FALSE as reported -- generateSignalsRuntime() already strips
 * every console.log site, and `debug` defaults to false (config.ts:27), so a
 * production page is quiet. The logs seen in a terminal come from the dev
 * runtime, which keeps them deliberately.
 *
 * What WAS real: stripping happened inside the try block, and the catch returned
 * generateSignalsRuntimeDev() -- the raw, unstripped source. So any failure
 * inside Bun.Transpiler silently shipped all ~40 log sites to production, with
 * no symptom beyond a consumer's DevTools filling up with `[stx] signal.set:`.
 *
 * These pin both halves: prod is quiet, and it stays quiet when minification
 * fails.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'

function logSites(src: string): number {
  return (src.match(/console\s*\.\s*log/g) || []).length
}

describe('signals runtime log stripping (#1873)', () => {
  it('keeps console.log in the dev runtime', () => {
    // Deliberate: the dev runtime is what a terminal/dev server shows.
    expect(logSites(generateSignalsRuntimeDev())).toBeGreaterThan(0)
  })

  it('emits no console.log site in the production runtime', () => {
    expect(logSites(generateSignalsRuntime())).toBe(0)
  })

  it('preserves console.warn and console.error, which signal real problems', () => {
    const prod = generateSignalsRuntime()
    expect(prod).toMatch(/console\s*\.\s*(warn|error)/)
  })

  it('minifies rather than falling back', () => {
    expect(generateSignalsRuntime().length).toBeLessThan(generateSignalsRuntimeDev().length)
  })

  it('stays quiet when minification throws', () => {
    // The fallback path used to return the unstripped dev source. Force the
    // transpiler to fail and assert the result is still log-free.
    const OriginalTranspiler = Bun.Transpiler
    ;(Bun as any).Transpiler = class {
      transformSync(): string {
        throw new Error('simulated transpiler failure')
      }
    }
    try {
      const out = generateSignalsRuntime()
      expect(logSites(out)).toBe(0)
      // And it is the fallback, not a minified build.
      expect(out.length).toBeGreaterThan(0)
    }
    finally {
      ;(Bun as any).Transpiler = OriginalTranspiler
    }
  })
})
