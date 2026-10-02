/**
 * An `@if` condition is checked as an expression in its own right
 * (stacksjs/stx#2013).
 *
 * `guardChainAt` emits each condition verbatim into an `if (…)` that wraps
 * every expression inside the block, and its own comment claimed a condition
 * that does not compile "is reported where it is written — as its own template
 * expression". It never was: nothing extracted conditions, so a fault in one
 * had no line of its own to land on. It surfaced against whichever expression
 * happened to be inside the block, and when the block held none it was not
 * reported at all.
 *
 * `@if (x() && x().prop)` reads as guarded and is not — nothing promises two
 * calls to `x()` return the same value. The diagnostic is a true positive
 * worth keeping; the reporter found 9 real latent bugs with it. That is exactly
 * why it has to point at the condition instead of at innocent markup: the
 * natural reading of "Object is possibly null" against a `state<string>` is
 * "the checker has false positives", and then the real fix gets skipped.
 *
 * The five cases below are the reporter's own isolation table.
 */

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'bun:test'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

// Outside the repo: a fixture inside it is reached by this repository's own
// tsconfig, so tsc reports unrelated errors and the fixture stops testing what
// it says it tests.
const dir = join(tmpdir(), `stx-2013-${crypto.randomUUID()}`)

const HEAD = `<script client>
interface N { ok: boolean }
const note = state<N | null>(null)
const unrelated = state<string>('x')
function text(n: N | null): string { return n ? 'y' : 'n' }
</script>
`

/** The condition that reads as guarded and is not. `note()` is called twice. */
const FAULTY = '@if (note() && note().ok)'

async function check(name: string, body: string): Promise<Awaited<ReturnType<typeof typecheckStxFiles>>> {
  const file = join(dir, name)
  await Bun.write(file, `${HEAD}\n${body}\n`)
  return typecheckStxFiles([file])
}

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

describe('#2013 — a faulty condition is reported against itself', () => {
  /** Case A: the expression alone is correct, so nothing is reported. */
  it('leaves a correct expression alone', async () => {
    const result = await check('a.stx', '<span :text="text(note())"></span>')

    expect(result.diagnostics).toEqual([])
  })

  /*
   * Case B, and the serious half of the report: the block holds no expression,
   * so there was nothing for the fault to land on and it went unreported. A
   * genuinely unguarded null access passed clean.
   */
  it('reports a condition in a block with no expression at all', async () => {
    const result = await check('b.stx', `${FAULTY}\n  <span>plain text</span>\n@endif`)

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].expression).toBe('note() && note().ok')
  })

  /*
   * Case C: it used to be reported once, against the `<span>` on the line
   * below. `text(note())` is correct by its own signature — it openly accepts
   * `N | null` — so the diagnostic named provably fine code.
   */
  it('reports it once, against the condition and not the markup below', async () => {
    const result = await check('c.stx', `${FAULTY}\n  <span :text="text(note())"></span>\n@endif`)

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].expression).toBe('note() && note().ok')
    // The condition's own line, not the span's.
    expect(result.diagnostics[0].line).toBe(8)
  })

  /*
   * Case D, the clearest of the five: `unrelated` is `state<string>` and can
   * never be null, yet it was the expression named in an "Object is possibly
   * null" diagnostic.
   */
  it('never blames an expression that cannot be null', async () => {
    const result = await check('d.stx', `${FAULTY}\n  <span>{{ unrelated() }}</span>\n@endif`)

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].expression).toBe('note() && note().ok')
    expect(result.diagnostics.some(d => d.expression?.includes('unrelated'))).toBe(false)
  })

  /*
   * Case E: an expression AFTER `@endif` is outside the guard, so there was no
   * wrapper carrying the condition and nothing was reported.
   */
  it('reports it when the only expression is outside the block', async () => {
    const result = await check('e.stx', `${FAULTY}\n  <span>plain</span>\n@endif\n<span>{{ unrelated() }}</span>`)

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].expression).toBe('note() && note().ok')
  })

  /*
   * The count in `Checked N template expression(s)` was dishonest in case B -
   * it read 0 while the file plainly had an expression in it - and "0 errors"
   * over something uncounted is indistinguishable from a pass.
   */
  it('counts the condition as an expression it checked', async () => {
    const result = await check('count.stx', `${FAULTY}\n  <span>plain text</span>\n@endif`)

    expect(result.expressionCount).toBeGreaterThan(0)
  })

  /*
   * A correct condition stays silent, and the guard it provides still narrows
   * the expressions inside - which is what `guardChainAt` is for and what must
   * not regress while conditions become checkable.
   */
  it('stays silent on a condition that really does guard', async () => {
    /*
     * A VARIABLE, not a repeated call. My first version of this guarded a
     * `{{ note().ok }}` with `@if (note())`, which is the same anti-pattern the
     * other cases test - two calls to one function, which TypeScript does not
     * narrow across - and it reported, correctly. Narrowing is what
     * `guardChainAt` exists for and it works on a binding: the reported case
     * was a `T | undefined` from a `.find()` read inside its own `@if`, 75 of
     * them in one application.
     */
    const file = join(dir, 'guarded.stx')
    await Bun.write(file, `<script client>
interface N { ok: boolean }
const maybe = (null as N | null)
</script>

@if (maybe)
  <span>{{ maybe.ok }}</span>
@endif
`)
    const result = await typecheckStxFiles([file])

    expect(result.diagnostics).toEqual([])
  })

  it('checks an @elseif condition too', async () => {
    const result = await check(
      'elseif.stx',
      '@if (unrelated())\n  <span>a</span>\n@elseif (note() && note().ok)\n  <span>b</span>\n@endif',
    )

    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].expression).toBe('note() && note().ok')
  })
})
