/**
 * One unparseable block must not switch type checking off for everything else.
 *
 * tsc collects SEMANTIC diagnostics only when the program has no SYNTACTIC
 * ones, and that check is program-wide rather than per file
 * (`emitFilesAndReportErrors`). Every block this checker generates goes into one
 * program, so a single block that cannot parse silently disables type checking
 * for every other file in the run.
 *
 * Measured on a 42-file corpus while fixing #1920: 500 real type errors became
 * 52 syntax errors and nothing else the moment unparseable blocks entered the
 * program. Not an abort, not a warning — a smaller number that reads like
 * progress.
 *
 * It is the same shape as #1906 (`--lib` silencing every diagnostic) and #1911
 * (prohibited APIs matched inside comments): the tool reports a total while most
 * of the work never happened. Checking bare `<script>` blocks walked straight
 * into it, because an unparseable bare block is precisely what #1920 is about —
 * so the fix for one blind spot would have opened another.
 *
 * The remedy is a second pass with the unparseable buffers dropped, so both
 * halves arrive at once instead of the second only appearing after the first is
 * fixed.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

// Outside the repo: a fixture inside it is reached by this repository's own
// tsconfig, and unrelated errors would muddy exactly the counts under test.
const dir = join(tmpdir(), `stx-mute-${crypto.randomUUID()}`)

async function page(name: string, source: string): Promise<string> {
  const file = join(dir, name)
  await Bun.write(file, source)
  return file
}

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

describe('a file that cannot parse', () => {
  it('does not hide the type errors in the files that can', async () => {
    const semantic = await page('semantic.stx', `<script client>
const n: number = "definitely a string"
</script>`)
    const syntax = await page('syntax.stx', `<script>
const broken = (((
</script>`)

    const alone = await typecheckStxFiles([semantic], { templates: false })
    const together = await typecheckStxFiles([semantic, syntax], { templates: false })

    // The semantic error is real on its own — establishing that before asking
    // whether it survives company, so a failure here means the right thing.
    expect(alone.diagnostics.map(d => d.code)).toContain(2322)

    // …and it is still reported with an unparseable file in the same run.
    expect(together.diagnostics.map(d => d.code)).toContain(2322)
    // The syntax error is not traded away for it: both halves, one run.
    expect(together.diagnostics.some(d => d.code >= 1000 && d.code < 2000)).toBe(true)
  })

  it('attributes each diagnostic to the file it came from', async () => {
    // A second pass reuses the same generated buffers, so a mix-up here would
    // point authors at the wrong file — a quieter failure than reporting none.
    const semantic = await page('attr-semantic.stx', `<script client>\nconst n: number = "nope"\n</script>`)
    const syntax = await page('attr-syntax.stx', `<script>\nconst broken = (((\n</script>`)

    const result = await typecheckStxFiles([semantic, syntax], { templates: false })

    for (const d of result.diagnostics) {
      if (d.code === 2322)
        expect(d.file).toBe(semantic)
      if (d.code >= 1000 && d.code < 2000)
        expect(d.file).toBe(syntax)
    }
  })

  it('reports nothing extra when every block is unparseable', async () => {
    // The retry is skipped when there is nothing left to retry. Running it with
    // an empty file list would hand tsc a program of ambient files only, whose
    // clean result says nothing about the user's code.
    const syntax = await page('all-broken.stx', `<script>\nconst broken = (((\n</script>`)
    const result = await typecheckStxFiles([syntax], { templates: false })

    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(result.diagnostics.every(d => d.file === syntax)).toBe(true)
    expect(result.failure).toBeUndefined()
  })

  it('still reports a checker abort as a failure rather than a clean run', async () => {
    // The retry counts diagnostics of its own, and #1906's guard reads a
    // diagnostic count. Feeding it the retry's numbers would answer a different
    // question than "did this run abort".
    const clean = await page('clean.stx', `<script server>\nconst ok: number = 1\n</script>`)
    await Bun.write(join(dir, 'broken.d.ts'), `export interface Broken { id: string`)

    const result = await typecheckStxFiles([clean], { extraLibs: [join(dir, 'broken.d.ts')] })

    expect(result.failure).toBeDefined()
  })
})
