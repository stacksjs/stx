/**
 * The shipped router script carries no debug logging; the dev one keeps it.
 *
 * The router's `log()` helper is gated on `debug`, so its 31 call sites print
 * nothing in an ordinary page -- and shipped 2.3KB of dead weight to every one
 * of them anyway. `getRouterScript()` now strips the calls and
 * `getRouterScriptDev()` keeps them, the same split the signals runtime makes
 * between generateSignalsRuntime and generateSignalsRuntimeDev.
 *
 * The strip rewrites each call to `0`, which is why parsing both builds is the
 * test that matters: an over-eager match once turned the helper's own
 * declaration into `function 0(){}`, which is not a program. `new Function`
 * compiles without running.
 */
import { describe, expect, it } from 'bun:test'
import { getRouterScript, getRouterScriptDev } from '../src/client'

/** `log(` that is a call, not `dialog(`, `console.log(` or the declaration. */
const callSites = (source: string): string[] =>
  [...source.matchAll(/[^\w$.]log\(/g)]
    .filter(hit => !/\bfunction\s+$/.test(source.slice(Math.max(0, hit.index - 16), hit.index + 1)))
    .map(hit => source.slice(hit.index, hit.index + 60))

describe('router dev/prod split', () => {
  it('leaves no log call in the shipped script', () => {
    expect(callSites(getRouterScript())).toEqual([])
  })

  it('keeps the log calls in the dev script', () => {
    expect(callSites(getRouterScriptDev()).length).toBeGreaterThan(20)
  })

  it('keeps the helper itself, so a call the strip missed is still harmless', () => {
    expect(getRouterScript()).toContain('function log()')
  })

  it('drops the logged messages, not the code around them', () => {
    const shipped = getRouterScript()
    expect(shipped).not.toContain('[router] build skew')
    // The function that logged the skew still runs its reload.
    expect(shipped).toContain('reloadForSkew')
  })

  it('produces a parseable program either way', () => {
    expect(() => new Function(getRouterScript())).not.toThrow()
    expect(() => new Function(getRouterScriptDev())).not.toThrow()
  })

  it('ships fewer bytes than it does in development', () => {
    const bytes = (source: string): number => new TextEncoder().encode(source).byteLength
    expect(bytes(getRouterScript())).toBeLessThan(bytes(getRouterScriptDev()) - 2000)
  })

  it('returns the same string on a second call', () => {
    expect(getRouterScript()).toBe(getRouterScript())
    expect(getRouterScriptDev()).toBe(getRouterScriptDev())
  })
})
