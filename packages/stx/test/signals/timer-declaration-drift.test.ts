/**
 * `stx.d.ts` describes the timers the runtime actually returns (stacksjs/stx#1941).
 *
 * `useInterval` was declared as `(fn, ms, options) => { start, stop, isActive }`.
 * Nothing implements that. The runtime returns
 * `{ counter, pause, resume, reset, subscribe }` and the module twin returned a
 * fourth shape again, so a call written against the declaration typechecked
 * clean and threw `poll.start is not a function` on mount.
 *
 * The declared overload was the *plausible* one — a callback-driven interval is
 * what most people reach for — and it is the only `useInterval` visible from a
 * client script, since `stx.d.ts` is the ambient set for that context. The types
 * pointed at the broken call and away from the working one.
 *
 * Fourth instance of the same failure: `useEventListener` (#1923),
 * `StxQueryResult` (#1929), the toast options (#1932), now this. The pattern in
 * all four is a declaration maintained by hand beside an implementation that
 * moved. So this reads the RETURN SHAPE out of the runtime source and compares
 * it to the declaration rather than restating either — a list nobody maintains
 * cannot fall behind.
 *
 * Extractors throw rather than returning an empty set when they cannot find
 * their target. A drift guard that silently checks nothing reports success for
 * a surface it never looked at.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { runtimeReturnedKeys } from '../../test-utils/runtime-surface'

async function declarationSource(): Promise<string> {
  return Bun.file(join(import.meta.dir, '..', '..', 'stx.d.ts')).text()
}

/** The property names declared on an interface or inline return object. */
function declaredKeys(source: string, anchor: string): Set<string> {
  const start = source.indexOf(anchor)
  if (start === -1)
    throw new Error(`could not find ${anchor} in stx.d.ts — do not let this return an empty set`)

  const end = source.indexOf('\n}', start)
  if (end === -1)
    throw new Error(`unterminated block for ${anchor} in stx.d.ts`)

  const body = source.slice(start + anchor.length, end)
  return new Set(
    [...body.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*[:(]/gm)].map(m => m[1]),
  )
}

describe('useInterval', () => {
  it('declares exactly the keys the runtime returns', async () => {
    const runtime = runtimeReturnedKeys(generateSignalsRuntimeDev(), 'useInterval')
    const declared = declaredKeys(await declarationSource(), 'interface StxIntervalControls {')

    expect([...runtime].filter(k => !declared.has(k)).sort()).toEqual([])
    expect([...declared].filter(k => !runtime.has(k)).sort()).toEqual([])
  })

  it('found a real surface, so the comparison is not vacuous', () => {
    const runtime = runtimeReturnedKeys(generateSignalsRuntimeDev(), 'useInterval')

    expect(runtime).toContain('counter')
    expect(runtime).toContain('resume')
    expect(runtime.size).toBeGreaterThanOrEqual(4)
  })

  it('declares none of the names that never existed', async () => {
    const source = await declarationSource()
    const declared = declaredKeys(source, 'interface StxIntervalControls {')

    // The three from the phantom overload. Named individually so a failure says
    // which one came back.
    for (const phantom of ['start', 'stop', 'isActive'])
      expect(declared.has(phantom)).toBe(false)
  })

  it('keeps the callback form the runtime supports', async () => {
    const source = await declarationSource()

    // `useInterval(fn, ms)` is the form most callers reach for and the runtime
    // branches on it. If only the counter overload were declared, the working
    // call would fail to typecheck — which is how the reporter ended up on the
    // broken one in the first place.
    expect(source).toContain('declare function useInterval(_fn: (_count: number) => void, _ms?: number')
    expect(source).toContain('declare function useInterval(_interval?: number')
  })
})

describe('useTimeout', () => {
  it('declares exactly the keys the runtime returns', async () => {
    const runtime = runtimeReturnedKeys(generateSignalsRuntimeDev(), 'useTimeout')
    const declared = declaredKeys(await declarationSource(), 'declare function useTimeout(_fn: () => void, _ms?: number): {')

    expect([...runtime].filter(k => !declared.has(k)).sort()).toEqual([])
    expect([...declared].filter(k => !runtime.has(k)).sort()).toEqual([])
  })

  it('found a real surface, so the comparison is not vacuous', () => {
    const runtime = runtimeReturnedKeys(generateSignalsRuntimeDev(), 'useTimeout')

    expect(runtime).toContain('isPending')
    expect(runtime.size).toBeGreaterThanOrEqual(3)
  })
})

describe('the extractor', () => {
  it('throws rather than reporting an empty surface', () => {
    expect(() => runtimeReturnedKeys('function somethingElse() { return {}; }', 'useInterval'))
      .toThrow(/useInterval/)
  })
})
