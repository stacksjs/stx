/**
 * Build failures say where they happened (stacksjs/stx#1810).
 *
 * The report was `BuildMessage: Unexpected ===` and nothing else — no path, no
 * line — so locating the offending view meant binary-searching the scanned
 * roots by hand.
 *
 * The location was never missing. Bun computes it and puts it on
 * `BuildMessage.position`; `.message` and `.toString()` omit it. And because a
 * `BuildMessage` is NOT an `instanceof Error` and carries no `.stack`, the
 * ubiquitous `error instanceof Error ? error.message : String(error)` idiom
 * reduces it to exactly that bare string — which is how the position got thrown
 * away at every catch site.
 */
import { describe, expect, it } from 'bun:test'
import { formatBuildFailure } from '../src/build-message'

/** Shaped like Bun's BuildMessage: not an Error, no stack, position on the side. */
function buildMessage(message: string, position?: Record<string, unknown>) {
  return { name: 'BuildMessage', message, position: position ?? null }
}

describe('formatBuildFailure', () => {
  it('recovers the file and line Bun already computed', () => {
    const out = formatBuildFailure(
      buildMessage('Unexpected ===', { file: 'input.ts', line: 145, column: 22 }),
      '/app/views/blog/category.stx',
    )
    expect(out).toContain('/app/views/blog/category.stx:145:22')
    expect(out).toContain('Unexpected ===')
  })

  it('prefers the real path over the transpiler\'s synthetic entry name', () => {
    // Bun.Transpiler reports position.file as its own synthetic entry, never the
    // real path, so pointing the reader at it sends them to a file that does
    // not exist.
    const out = formatBuildFailure(
      buildMessage('Unexpected ===', { file: 'input.ts', line: 3 }),
      '/app/views/real.stx',
    )
    expect(out).toContain('/app/views/real.stx:3')
    expect(out).not.toContain('input.ts')
  })

  it('unwraps the AggregateError Bun.build throws', () => {
    // Bun.build does not throw a BuildMessage — it throws an AggregateError
    // whose .errors holds them, so the detail is one level down.
    const aggregate = {
      name: 'AggregateError',
      message: 'Bundle failed',
      errors: [
        buildMessage('Unexpected ===', { line: 145 }),
        buildMessage('Expected }', { line: 150 }),
      ],
    }
    const out = formatBuildFailure(aggregate, '/app/views/x.stx')
    expect(out).toContain('Unexpected ===')
    expect(out).toContain('Expected }')
    expect(out).toContain(':145')
    expect(out).toContain(':150')
  })

  it('includes the offending source line when Bun provides it', () => {
    const out = formatBuildFailure(
      buildMessage('Unexpected ===', { line: 145, lineText: `    <li class=": ? '' === a b">` }),
      '/app/views/x.stx',
    )
    expect(out).toContain(`<li class=": ? '' === a b">`)
  })

  it('still names the file when there is no position at all', () => {
    const out = formatBuildFailure(buildMessage('Unexpected ==='), '/app/views/x.stx')
    expect(out).toContain('/app/views/x.stx')
    expect(out).toContain('Unexpected ===')
  })

  it('handles an ordinary Error', () => {
    const out = formatBuildFailure(new Error('ENOENT: no such file'), '/app/views/x.stx')
    expect(out).toContain('/app/views/x.stx')
    expect(out).toContain('ENOENT')
  })

  it('handles a thrown non-Error', () => {
    expect(formatBuildFailure('something odd', '/app/views/x.stx')).toContain('something odd')
  })

  it('omits the location prefix when nothing is known', () => {
    expect(formatBuildFailure(buildMessage('Unexpected ==='))).toBe('Unexpected ===')
  })

  it('does not depend on the value being an Error', () => {
    // The whole point: a BuildMessage fails `instanceof Error`, which is what
    // silently discarded the position everywhere it was caught.
    const message = buildMessage('Unexpected ===', { line: 9 })
    expect(message instanceof Error).toBe(false)
    expect(formatBuildFailure(message, '/a.stx')).toContain('/a.stx:9')
  })

  it('locates it just the same when it IS an Error', () => {
    // Bun has shipped BuildMessage both ways, so the test above covers only
    // half of what arrives in practice. Newer Bun throws something that passes
    // `instanceof Error` and still carries `.position` — describeBuildFailure
    // duck-types on that field rather than on the class, so both locate.
    const asError = Object.assign(new Error('Unexpected ==='), {
      name: 'BuildMessage',
      position: { line: 9, column: 17, lineText: 'const y = a === === b' },
    })

    expect(asError instanceof Error).toBe(true)
    const formatted = formatBuildFailure(asError, '/a.stx')
    expect(formatted).toContain('/a.stx:9:17')
    expect(formatted).toContain('const y = a === === b')
  })
})

describe('against real Bun errors', () => {
  it('turns the reported symptom into a located message', async () => {
    // The exact string from the report, produced by real Bun rather than a
    // mock: `BuildMessage: Unexpected ===` with nothing else.
    let thrown: unknown
    try {
      new Bun.Transpiler({ loader: 'ts' }).transformSync('const y = a === === b')
    }
    catch (error) {
      thrown = error
    }

    expect(thrown).toBeDefined()
    expect(String(thrown)).toContain('Unexpected ===')

    // Deliberately NOT asserting `thrown instanceof Error`, or the exact
    // `String(thrown)`, or the column. Those are Bun's, and Bun has changed
    // them: this test pinned `instanceof Error === false`, which was true on
    // 1.3.x and false on the newer Bun that CI installs (setup-bun with no
    // version takes latest), so the suite was red on every commit for a
    // behaviour stx does not own and does not depend on — describeBuildFailure
    // duck-types on `.position`, precisely so either shape works.
    //
    // What IS stx's promise: the position survives into a message that names
    // the file, the line, and the offending source.
    const formatted = formatBuildFailure(thrown, '/app/views/blog/category.stx')
    expect(formatted).toMatch(/\/app\/views\/blog\/category\.stx:1(?::\d+)?: /)
    expect(formatted).toContain('Unexpected ===')
    expect(formatted).toContain('const y = a === === b')
  })

  it('extracts detail from the AggregateError Bun.build throws', async () => {
    // Bun.build throws by default, so every `if (!result.success)` branch in
    // the repo is dead code — and the throw stringifies to a useless
    // "Bundle failed" with the real cause one level down in .errors.
    const entry = '/tmp/stx-build-message-fixture.ts'
    await Bun.write(entry, 'const y = a === === b\n')

    let thrown: unknown
    try {
      await Bun.build({ entrypoints: [entry] })
    }
    catch (error) {
      thrown = error
    }

    expect(String(thrown)).toContain('Bundle failed')

    const formatted = formatBuildFailure(thrown, '/app/views/real.stx')
    expect(formatted).toContain('/app/views/real.stx')
    expect(formatted).toContain('Unexpected ===')
  })
})
