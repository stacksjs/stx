/**
 * The document expression pass returns to the event loop, and says the same
 * thing when it does (stacksjs/stx#2176).
 *
 * A page whose interpolations are not inside a loop used to render as one
 * uninterrupted sweep: 20,000 of them cost about 1.3 seconds with 80-85% of it
 * in a single stretch, during which the server answered nothing. The pass is
 * now a generator with two drivers -- the synchronous one every nested caller
 * uses, and a chunked one for the document -- and these are the two properties
 * that makes safe:
 *
 *   1. Dividing the SCAN is not dividing the document. Every offset and scope
 *      the replacer reads still describes the whole string, so the chunked
 *      output has to be the synchronous output, byte for byte.
 *   2. The chunked driver really does yield. Asserted by event-loop turns, not
 *      by a latency budget: a timing threshold on a shared machine is how this
 *      issue came to be filed against the wrong thing in the first place.
 */
import { describe, expect, it } from 'bun:test'
import { processExpressions, processExpressionsChunked } from '../src/expressions'

const ROWS = 4000
const context = { identity: 'alice', rows: ROWS, label: '<b>&"quoted"</b>' }
const flat = `<main><b>{{ identity }}</b>${Array.from({ length: ROWS }, (_, i) => `<p id="line-${i}"><span>{{ ${i} + rows }}</span><code>{{ label }}</code>{!! identity !!}</p>`).join('')}</main>`

/** Count the macrotask turns the event loop gets while `work` is pending. */
async function turnsDuring<T>(work: () => Promise<T> | T): Promise<{ value: T, turns: number }> {
  let turns = 0
  let running = true
  const tick = (): void => {
    if (!running)
      return
    turns++
    setTimeout(tick, 0)
  }
  setTimeout(tick, 0)
  const value = await work()
  running = false
  return { value, turns }
}

describe('the chunked document pass', () => {
  it('produces exactly what the synchronous pass does', async () => {
    const sync = processExpressions(flat, context, 'flat.stx')
    // A zero budget pauses at every opportunity, which is the most divided the
    // scan can be and therefore the hardest case for equivalence.
    expect(await processExpressionsChunked(flat, context, 'flat.stx', 0)).toBe(sync)
    expect(await processExpressionsChunked(flat, context, 'flat.stx')).toBe(sync)
    expect(sync).toContain('<span>4000</span>')
    expect(sync).toContain('&lt;b&gt;')
  })

  it('gives the event loop turns while a loop-free document renders', async () => {
    const chunked = await turnsDuring(() => processExpressionsChunked(flat, context, 'flat.stx', 0))
    expect(chunked.turns).toBeGreaterThan(1)
  })

  it('leaves the synchronous pass uninterrupted, as nested callers require', async () => {
    // `@for` renders through a generated loop that calls back synchronously, so
    // this entry point must never pause: no turn can land inside it.
    const sync = await turnsDuring(() => processExpressions(flat, context, 'flat.stx'))
    expect(sync.turns).toBe(0)
  })

  it('does not pause at all on a document with a handful of interpolations', async () => {
    const small = '<p>{{ identity }}</p><p>{{ rows }}</p>'
    const result = await turnsDuring(() => processExpressionsChunked(small, context, 'small.stx', 0))
    expect(result.value).toBe(processExpressions(small, context, 'small.stx'))
    expect(result.turns).toBe(0)
  })
})
