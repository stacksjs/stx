/**
 * `stx.d.ts` keeps up with the toast runtime (stacksjs/stx#1932).
 *
 * Three times now the declaration has fallen behind the implementation, in the
 * same direction and with the same consequence: `useEventListener` was declared
 * target-first while the runtime was event-first (#1923); `StxQueryResult`
 * omitted `isStale` and `invalidate`, which existed and were unreachable
 * (#1929); and the toast runtime read four options while the declaration listed
 * one (#1932), so the feature built to unblock a migration could not be called
 * from a typechecked file at all.
 *
 * `test/typecheck/toast-options.test.ts` pins the call sites. This file pins the
 * relationship, which is the part that keeps drifting: every option the RUNTIME
 * reads must be declared. It reads both sides rather than restating either, so
 * adding `opts.position` to the runtime fails here until `stx.d.ts` catches up —
 * a list nobody maintains cannot fall behind.
 *
 * The extractor throws rather than returning an empty set when it cannot find
 * `addToast`, because a drift guard that silently checks nothing is worse than
 * no guard: it reports success for a surface it never looked at, which is how
 * five tests once anchored on `window.stx = {` and passed against nothing.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { runtimeToastOptionReads } from '../../test-utils/runtime-surface'

/** The option keys declared on `StxToastOptions`. */
async function declaredToastOptions(): Promise<Set<string>> {
  const source = await Bun.file(join(import.meta.dir, '..', '..', 'stx.d.ts')).text()
  const anchor = 'interface StxToastOptions {'
  const start = source.indexOf(anchor)
  if (start === -1)
    throw new Error(`could not find ${anchor} in stx.d.ts — do not let this return an empty set`)

  const end = source.indexOf('\n}', start)
  if (end === -1)
    throw new Error('unterminated StxToastOptions interface in stx.d.ts')

  const body = source.slice(start + anchor.length, end)
  return new Set([...body.matchAll(/^\s*([A-Za-z_$][\w$]*)\??\s*:/gm)].map(m => m[1]))
}

describe('StxToastOptions', () => {
  it('declares every option the runtime reads', async () => {
    const read = runtimeToastOptionReads(generateSignalsRuntimeDev())
    const declared = await declaredToastOptions()

    // Reported as the missing set rather than a boolean, so a failure names the
    // option instead of just saying no.
    expect([...read].filter(name => !declared.has(name))).toEqual([])
  })

  it('finds the options at all, so this is not passing vacuously', async () => {
    const read = runtimeToastOptionReads(generateSignalsRuntimeDev())

    expect(read.size).toBeGreaterThanOrEqual(4)
    expect([...read].sort()).toContain('title')
  })

  it('declares nothing the runtime ignores', async () => {
    // The other direction, and the quieter failure: an option in the type that
    // the runtime never reads is a documented feature that silently does
    // nothing.
    const read = runtimeToastOptionReads(generateSignalsRuntimeDev())
    const declared = await declaredToastOptions()

    expect([...declared].filter(name => !read.has(name))).toEqual([])
  })
})

describe('the extractor', () => {
  it('throws rather than reporting an empty surface', () => {
    // If `addToast` is renamed, this guard must fail loudly. Returning an empty
    // set would make every assertion above pass against nothing.
    expect(() => runtimeToastOptionReads('function somethingElse() {}')).toThrow(/addToast/)
  })
})
