/**
 * The generated runtimes are syntactically valid JavaScript.
 *
 * The client runtime is authored as a ~6000-line TEMPLATE LITERAL inside
 * signals.ts, so ordinary-looking source is really string content. Two
 * characters change meaning:
 *
 *   - a backtick — including one inside a `// comment`, where it reads as
 *     documentation but terminates the literal
 *   - `${`, which interpolates
 *
 * Neither is a TypeScript error, so the file compiles, the tests import fine,
 * and the breakage only appears when something executes the generated string.
 * That failure is remote from its cause and, when several test files load the
 * broken runtime at once, has surfaced as a Bun segfault rather than a syntax
 * error — which reads as a toolchain problem, not a typo.
 *
 * This asserts it directly: parse both builds, fail with the offending source
 * if either is invalid. The same trap exists in `packages/router/src/client.ts`
 * (covered by its own suite) and in `color-mode-boot.ts`.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'

/** Parse without running — `new Function` compiles the body eagerly. */
function parseError(source: string): string | null {
  try {
    // eslint-disable-next-line no-new-func
    void new Function(source)
    return null
  }
  catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

/** Point at the offending region so the failure names a line, not a file. */
function context(source: string, message: string): string {
  const backtickish = source.split('\n').findIndex(l => l.includes('`'))
  return `${message}\n\nFirst line containing a backtick (index ${backtickish}):\n`
    + `${backtickish >= 0 ? source.split('\n')[backtickish].slice(0, 200) : '(none)'}`
}

describe('generated runtime is valid JavaScript', () => {
  it('parses the development build', () => {
    const source = generateSignalsRuntimeDev()
    const err = parseError(source)
    expect(err === null ? '' : context(source, err)).toBe('')
  })

  it('parses the production build', () => {
    // Minification + the ASI semicolon pass run here, so this covers the
    // post-processing too, not just the template literal.
    const source = generateSignalsRuntime()
    const err = parseError(source)
    expect(err === null ? '' : context(source, err)).toBe('')
  })

  it('has no unescaped backtick inside the authoring template literal', () => {
    // The parse tests above prove the result is valid; this one names the line
    // in signals.ts you have to edit, which is the part that costs time. A
    // backtick inside the literal must be written \` — the runtime writes
    // genuine template literals of its own that way, and comments that quote
    // `code` need the same treatment even though they read as prose.
    const file = Bun.file(new URL('../../src/signals.ts', import.meta.url)).text()
    return file.then((src) => {
      const open = src.indexOf('return `', src.indexOf('export function generateSignalsRuntimeDev')) + 'return `'.length
      const offenders: string[] = []
      for (let i = open; i < src.length; i++) {
        if (src[i] !== '`' || src[i - 1] === '\\')
          continue
        const line = src.slice(0, i).split('\n').length
        const text = src.split('\n')[line - 1]
        // The literal's own closing backtick terminates the scan.
        if (text.trim() === '`;' || text.trim() === '`')
          break
        offenders.push(`signals.ts:${line}  ${text.trim().slice(0, 120)}`)
      }
      expect(offenders).toEqual([])
    })
  })
})
