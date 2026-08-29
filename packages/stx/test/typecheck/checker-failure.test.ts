/**
 * A checker that did not run must not report a clean run (stacksjs/stx#1906).
 *
 * `--lib` is exactly the flag you reach for when the checker cannot see your
 * app's types — and passing it turned every diagnostic off. Same file, same
 * block and expression counts, exit 0. One app's 220 errors became 0 and read
 * as "wired up correctly, codebase is clean."
 *
 * Two separate defects, and the second is the one that made it silent:
 *
 * 1. A relative `--lib types/session.d.ts` was resolved against the GENERATED
 *    tsconfig, which lives in a temp directory — so tsc looked for
 *    `.stx/typecheck/types/session.d.ts`, found nothing, and aborted with
 *    TS6053. The most natural way to write the flag was the broken one.
 *
 * 2. tsc's exit code was never read. An abort produces no line this parser
 *    recognises, and zero parsed diagnostics was reported as zero errors —
 *    the one outcome indistinguishable from success.
 */

import { describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

// Outside the repo on purpose: a fixture inside it is reached by this
// repository's own tsconfig, so tsc reports unrelated errors from
// `packages/stx/src` and the fixture stops testing what it says it tests.
const dir = join(tmpdir(), `stx-lib-${crypto.randomUUID()}`)

/** A page with an unambiguous type error, so a clean report is always wrong. */
async function sabotagedPage(): Promise<string> {
  const file = `${dir}/page.stx`
  await Bun.write(file, `<script server>
const __sabotage: number = "definitely a string"
</script>`)
  return file
}

describe('a lib that cannot be loaded', () => {
  it('is reported as a failure, not as zero errors', async () => {
    const page = await sabotagedPage()
    await Bun.write(`${dir}/broken.d.ts`, `export interface Broken { id: string`)

    try {
      const result = await typecheckStxFiles([page], { extraLibs: [`${dir}/broken.d.ts`] })

      expect(result.failure).toBeDefined()
      expect(result.failure).toContain('nothing in your code was checked')
    }
    finally {
      await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
    }
  })

  it('does not claim failure on a genuinely clean run', async () => {
    // The guard is on BOTH conditions — a zero exit with no diagnostics is a
    // real pass, and flagging it would make the checker cry wolf.
    const file = `${dir}/clean.stx`
    await Bun.write(file, `<script server>\nconst ok: number = 1\n</script>`)

    try {
      const result = await typecheckStxFiles([file])

      expect(result.diagnostics).toEqual([])
      expect(result.failure).toBeUndefined()
    }
    finally {
      await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
    }
  })

  it('does not claim failure when there are real errors to report', async () => {
    const page = await sabotagedPage()

    try {
      const result = await typecheckStxFiles([page])

      expect(result.diagnostics.length).toBeGreaterThan(0)
      expect(result.failure).toBeUndefined()
    }
    finally {
      await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
    }
  })
})

describe('a relative --lib path', () => {
  it('resolves against the caller, not the generated tsconfig', async () => {
    // The whole point of the flag: with the lib loaded, the deliberate error in
    // the page is still reported. Before, it silently reported nothing at all.
    const page = await sabotagedPage()
    await Bun.write(`${dir}/types/session.d.ts`, `export interface SessionStore { id: string }\n`)

    const previous = process.cwd()
    try {
      process.chdir(dir)
      const result = await typecheckStxFiles([page], { extraLibs: ['types/session.d.ts'] })

      expect(result.failure).toBeUndefined()
      expect(result.diagnostics.some(d => d.message.includes('not assignable'))).toBe(true)
    }
    finally {
      process.chdir(previous)
      await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
    }
  })
})
