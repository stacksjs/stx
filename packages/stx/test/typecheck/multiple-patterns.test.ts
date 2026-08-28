/**
 * Every pattern on the command line is checked, not only the first.
 *
 * `stx typecheck` declares `[patterns...]`, and its argument parser recognised
 * only the LEADING spelling of a variadic argument (`[...patterns]`). The
 * trailing one bound a single value, so
 *
 *     stx typecheck 'a/**' + '/*.stx' 'b/**' + '/*.stx'
 *
 * checked the first tree and reported a clean pass over the second, which it
 * had never opened. That is the worst possible failure for a checker: the
 * natural way to add one to CI is to list the directories you care about, and
 * every extra directory you list is silently unverified for the life of the
 * project. It hid 75 real errors in one consuming repo, including several
 * pages that rendered empty in production.
 *
 * Fixed in the parser (stacksjs/clapp), and pinned here because this is where
 * the consequence lands. `resolveStxTargets` was never the problem - it has
 * always looped over its whole list - so this exercises the CLI end to end
 * rather than the resolver.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = join(tmpdir(), `stx-multi-${crypto.randomUUID()}`)
const cli = join(import.meta.dir, '..', '..', 'bin', 'cli.ts')

const CLEAN = `<script client>\nconst n: number = 1\nconsole.log(n)\n</script>\n<main>x</main>`
const BROKEN = `<script client>\nconst n: number = 'not a number'\nconsole.log(n)\n</script>\n<main>x</main>`

beforeAll(async () => {
  await Bun.write(join(dir, 'first', 'clean.stx'), CLEAN)
  await Bun.write(join(dir, 'second', 'broken.stx'), BROKEN)
})

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function typecheck(...patterns: string[]) {
  const result = await Bun.$`bun ${cli} typecheck ${patterns}`.cwd(dir).quiet().nothrow()
  return `${result.stdout.toString()}${result.stderr.toString()}`
}

describe('stx typecheck with several patterns', () => {
  it('reports the error in the SECOND pattern', async () => {
    const output = await typecheck('first/**/*.stx', 'second/**/*.stx')

    expect(output).toContain('broken.stx')
    expect(output).not.toContain('0 error(s)')
  })

  it('reads both trees, not one', async () => {
    const output = await typecheck('first/**/*.stx', 'second/**/*.stx')

    expect(output).toContain('2 file(s)')
  })

  it('still reports an error in the first pattern', async () => {
    const output = await typecheck('second/**/*.stx', 'first/**/*.stx')

    expect(output).toContain('broken.stx')
  })

  it('passes when every pattern is clean', async () => {
    const output = await typecheck('first/**/*.stx', 'first/*.stx')

    expect(output).toContain('0 error(s)')
  })
})
