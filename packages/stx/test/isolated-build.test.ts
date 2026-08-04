/**
 * One bad entrypoint does not take down the batch (stacksjs/stx#1810).
 *
 * `Bun.build` over a list of entrypoints is all-or-nothing: one unparseable
 * file throws and nothing is emitted. For a static-site build that means a
 * single malformed view — often one the app never references, inherited from a
 * framework defaults directory — fails the whole build, with a message naming
 * no file.
 *
 * Isolating by building each entrypoint separately would cost a build per page
 * on every run, including the overwhelmingly common case where nothing is
 * wrong. So the batch runs first and the per-entrypoint pass happens ONLY on
 * failure: the happy path pays nothing, the broken path pays one extra pass and
 * returns a precise list.
 */
import { describe, expect, it } from 'bun:test'
import { buildIsolatingFailures } from '../src/isolated-build'

/** A fake builder that throws for any entrypoint named in `bad`. */
function builder(bad: Set<string>, calls: string[][]) {
  return async (subset: string[]) => {
    calls.push([...subset])
    const broken = subset.filter(e => bad.has(e))
    if (broken.length > 0)
      throw new Error(`Unexpected === in ${broken[0]}`)
  }
}

describe('buildIsolatingFailures', () => {
  it('builds the batch in one pass when everything is fine', async () => {
    // The performance contract: no per-entrypoint work on a healthy build.
    const calls: string[][] = []
    const result = await buildIsolatingFailures(['a', 'b', 'c'], builder(new Set(), calls))

    expect(result.succeeded).toEqual(['a', 'b', 'c'])
    expect(result.failed).toEqual([])
    expect(calls).toHaveLength(1)
  })

  it('keeps the good entrypoints when one is broken', async () => {
    const calls: string[][] = []
    const result = await buildIsolatingFailures(['a', 'bad', 'c'], builder(new Set(['bad']), calls))

    expect(result.succeeded).toEqual(['a', 'c'])
    expect(result.failed.map(f => f.entrypoint)).toEqual(['bad'])
  })

  it('names the offending entrypoint in the message', async () => {
    // The other half of the report: the error pointed nowhere.
    const result = await buildIsolatingFailures(['ok', '/views/blog/category.stx'], builder(new Set(['/views/blog/category.stx']), []))

    expect(result.failed[0].error).toContain('/views/blog/category.stx')
    expect(result.failed[0].error).toContain('Unexpected ===')
  })

  it('reports every broken entrypoint, not just the first', async () => {
    const result = await buildIsolatingFailures(['a', 'x', 'b', 'y'], builder(new Set(['x', 'y']), []))
    expect(result.failed.map(f => f.entrypoint)).toEqual(['x', 'y'])
    expect(result.succeeded).toEqual(['a', 'b'])
  })

  it('falls back to exactly one build per entrypoint', async () => {
    const calls: string[][] = []
    await buildIsolatingFailures(['a', 'bad', 'c'], builder(new Set(['bad']), calls))

    // The batch, then one per entrypoint — not a retry storm.
    expect(calls).toHaveLength(4)
    expect(calls[0]).toEqual(['a', 'bad', 'c'])
    expect(calls.slice(1)).toEqual([['a'], ['bad'], ['c']])
  })

  it('reports all of them when everything is broken', async () => {
    const result = await buildIsolatingFailures(['x', 'y'], builder(new Set(['x', 'y']), []))
    expect(result.succeeded).toEqual([])
    expect(result.failed).toHaveLength(2)
  })

  it('does nothing for an empty list', async () => {
    const calls: string[][] = []
    const result = await buildIsolatingFailures([], builder(new Set(), calls))
    expect(result).toEqual({ succeeded: [], failed: [] })
    expect(calls).toEqual([])
  })
})
