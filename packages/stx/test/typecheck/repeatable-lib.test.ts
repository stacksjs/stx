/**
 * `--lib` accumulates, as it is documented to (stacksjs/stx#1925, #1926).
 *
 * The CLI parser collapses a repeated option to its LAST value — for
 * `<path>`, `<path...>` and `[path...]` alike, so no option spec expresses
 * "repeatable". The command advertised `--lib` as repeatable and guarded with
 * `Array.isArray(options.lib)`, a branch that could therefore never run. A
 * project splitting its ambient declarations across two files silently got
 * whichever it listed last:
 *
 *     --lib A          -> A's names resolve
 *     --lib B          -> B's names resolve
 *     --lib A --lib B  -> identical to `--lib B` alone
 *     --lib B --lib A  -> identical to `--lib A` alone
 *
 * Order decided the result, which is the shape of the whole report.
 *
 * ## Why it cost an afternoon
 *
 * The failure points the wrong way. Listing every declaration file — the
 * obvious move, and what "repeatable" invites — lands on the UNHELPED baseline,
 * because the file that was helping got replaced by one that does not cover
 * those names. That reads as "the flag does nothing" rather than "the flag is
 * dropping all but one of my files".
 *
 * And it changes WHICH errors are reported, not merely how many: names that
 * would resolve come back as `Cannot find name`, and the real diagnostics
 * underneath them — in one app, a null-dereference on a SQL-interpolating path —
 * stay hidden behind the noise.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectRepeatedFlag } from '../../src/cli-flags'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = join(tmpdir(), `stx-lib-repeat-${crypto.randomUUID()}`)
const domain = join(dir, 'types', 'domain.d.ts')
const globals = join(dir, 'types', 'globals.d.ts')
const page = join(dir, 'views', 'page.stx')

async function setup(): Promise<void> {
  await Bun.write(domain, `declare type IssueLevel = 'info' | 'warn' | 'error'\n`)
  await Bun.write(globals, `declare const requestContext: { id: string }\n`)
  await Bun.write(page, `<script server>
const level: IssueLevel = 'info'
const ctx = requestContext.id
</script>
<main>{{ level }}{{ ctx }}</main>`)
}

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

const unresolved = (diagnostics: Array<{ message: string }>, name: string): number =>
  diagnostics.filter(d => d.message.includes(`Cannot find name '${name}'`)).length

describe('collectRepeatedFlag', () => {
  it('returns every occurrence, in the order written', () => {
    expect(collectRepeatedFlag(['bun', 'cli', 'typecheck', '--lib', 'a.d.ts', '--lib', 'b.d.ts'], '--lib'))
      .toEqual(['a.d.ts', 'b.d.ts'])
  })

  it('accepts the `--flag=value` spelling', () => {
    // Someone told a flag repeats will reasonably try either form.
    expect(collectRepeatedFlag(['--lib=a.d.ts', '--lib=b.d.ts'], '--lib'))
      .toEqual(['a.d.ts', 'b.d.ts'])
  })

  it('mixes both spellings', () => {
    expect(collectRepeatedFlag(['--lib', 'a.d.ts', '--lib=b.d.ts'], '--lib'))
      .toEqual(['a.d.ts', 'b.d.ts'])
  })

  it('does not swallow the next option when a value is missing', () => {
    // `--lib --no-client` must not consume `--no-client` as a path, which would
    // silently turn another flag off.
    expect(collectRepeatedFlag(['--lib', '--no-client'], '--lib')).toEqual([])
  })

  it('ignores an unrelated flag and a bare argument', () => {
    expect(collectRepeatedFlag(['--libs', 'x', 'lib', '--lib', 'real.d.ts'], '--lib'))
      .toEqual(['real.d.ts'])
  })

  it('returns nothing when the flag is absent', () => {
    expect(collectRepeatedFlag(['typecheck', 'views'], '--lib')).toEqual([])
  })
})

describe('two ambient files', () => {
  it('are both honoured, and neither replaces the other', async () => {
    await setup()

    const both = await typecheckStxFiles([page], { templates: false, extraLibs: [domain, globals] })
    const reversed = await typecheckStxFiles([page], { templates: false, extraLibs: [globals, domain] })

    expect(unresolved(both.diagnostics, 'IssueLevel')).toBe(0)
    expect(unresolved(both.diagnostics, 'requestContext')).toBe(0)
    // Order must not decide the result — that was the whole bug.
    expect(reversed.diagnostics.length).toBe(both.diagnostics.length)
  })

  it('each still resolves only its own names on its own', async () => {
    // Establishes that the fixture really does need both, so the test above is
    // not passing for an unrelated reason.
    await setup()

    const onlyDomain = await typecheckStxFiles([page], { templates: false, extraLibs: [domain] })
    const onlyGlobals = await typecheckStxFiles([page], { templates: false, extraLibs: [globals] })

    expect(unresolved(onlyDomain.diagnostics, 'IssueLevel')).toBe(0)
    expect(unresolved(onlyDomain.diagnostics, 'requestContext')).toBe(1)
    expect(unresolved(onlyGlobals.diagnostics, 'IssueLevel')).toBe(1)
    expect(unresolved(onlyGlobals.diagnostics, 'requestContext')).toBe(0)
  })
})
