/**
 * A component whose `<script server>` throws says so.
 *
 * When one threw, the component rendered as a HOLE: the markup skeleton
 * survived, every `{{ }}` that depended on the script resolved to nothing, the
 * page answered 200, and nothing anywhere said why - not the dev server, not
 * the browser console, not `debug: true`.
 *
 * The reported case was a dependency that had started importing a package it
 * did not declare, so a static import threw wherever that package was
 * unreachable. The developer had not caused it and could not see it; finding it
 * took instrumenting the pipeline by hand (stacksjs/stx#1991). It also hides
 * upstream breakage indefinitely - a dependency can start throwing and every
 * page keeps rendering "successfully", just without that component.
 *
 * The warning was behind STX_DEBUG. It is unconditional now, once per distinct
 * cause.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { extractVariables } from '../src/variable-extractor'

let warnings: string[]
let originalWarn: typeof console.warn

beforeEach(() => {
  warnings = []
  originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '))
  }
})

afterEach(() => {
  console.warn = originalWarn
})

/** A unique path per case, so the once-per-cause memo cannot cross tests. */
function uniquePath(): string {
  return `/tmp/stx-throw-${crypto.randomUUID()}/Widget.stx`
}

describe('a server script that throws is reported', () => {
  it('names the file and the cause', async () => {
    const file = uniquePath()
    const context: Record<string, unknown> = {}

    await extractVariables(`throw new Error('highlighter unavailable')`, context, file)

    const reported = warnings.filter(line => line.includes(file))

    expect(reported.length).toBe(1)
    expect(reported[0]).toContain('highlighter unavailable')
    expect(reported[0]).toContain('threw')
  })

  it('says what it costs, not just that it happened', async () => {
    const file = uniquePath()

    await extractVariables(`throw new Error('boom')`, {}, file)

    // The symptom points nowhere near the cause, so the message has to
    // connect the two: the hole in the page IS this.
    expect(warnings.find(l => l.includes(file))).toContain('undefined')
  })

  it('does not repeat itself for the same cause', async () => {
    const file = uniquePath()

    for (let i = 0; i < 4; i++)
      await extractVariables(`throw new Error('once please')`, {}, file)

    expect(warnings.filter(line => line.includes(file)).length).toBe(1)
  })

  it('reports a second, different cause in the same file', async () => {
    const file = uniquePath()

    await extractVariables(`throw new Error('first')`, {}, file)
    await extractVariables(`throw new Error('second')`, {}, file)

    const reported = warnings.filter(line => line.includes(file))

    expect(reported.length).toBe(2)
    expect(reported.join('\n')).toContain('first')
    expect(reported.join('\n')).toContain('second')
  })

  /*
   * The one case the silence was for. A server script reaching for a browser
   * global is a legitimate failure here, and warning about it would train
   * people to ignore the channel.
   */
  it('stays quiet when the script reaches for a browser global', async () => {
    const file = uniquePath()

    await extractVariables(`const w = window.innerWidth\nexport const w2 = w`, {}, file)

    expect(warnings.filter(line => line.includes(file))).toEqual([])
  })

  /*
   * The message claims every variable in the script is undefined. Checked,
   * rather than asserted in prose: a declaration ahead of the throw does NOT
   * survive, which is exactly why the hole in the page is total and why the
   * warning is worth printing.
   */
  it('is telling the truth about what is lost', async () => {
    const file = uniquePath()
    const context: Record<string, unknown> = {}

    await extractVariables(`export const title = 'Kept'\nthrow new Error('later')`, context, file)

    expect(Object.keys(context).filter(key => !key.startsWith('__'))).toEqual([])
    expect(warnings.find(line => line.includes(file))).toContain('undefined')
  })
})
