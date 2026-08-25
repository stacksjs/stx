/**
 * The built CLI actually runs (#1896).
 *
 * `stx typecheck` and `stx codemod` exited immediately in every published
 * build, including the 0.2.170 tarball on npm:
 *
 *     $ bun node_modules/@stacksjs/stx/dist/cli.js codemod
 *     ReferenceError: awaitPromise is not defined
 *
 * The source was `const { Glob } = await import('bun')`. The bundler rewrites a
 * dynamic import of the bun builtin to `await Promise.resolve(globalThis.Bun)`,
 * and when that lands second in a comma-separated declaration list the space
 * between `await` and `Promise` is dropped, fusing them into an identifier that
 * does not exist. Two independently produced builds both had it.
 *
 * ## Why the existing tests could not catch it
 *
 * Every test of these commands imports from `src`, where the construct is
 * valid — the defect is created by the bundler, so it exists only in `dist`.
 * And it is not a syntax error: `awaitPromise` parses cleanly and fails at
 * runtime, so parsing the artifact proves nothing either. The only thing that
 * would have caught it is running the built file, which nothing did.
 *
 * So this executes it. `dist` is gitignored and absent on a fresh clone, so the
 * checks skip rather than fail when there is nothing built yet — a test that
 * fails for the wrong reason gets muted as surely as one that invents errors.
 */

import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const packageRoot = join(import.meta.dir, '..', '..')
const cli = join(packageRoot, 'dist', 'cli.js')
const built = existsSync(cli)

/** Run the built CLI and return what it printed and how it exited. */
async function run(...args: string[]): Promise<{ code: number, output: string }> {
  const proc = Bun.spawn(['bun', cli, ...args], {
    cwd: packageRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])

  return { code: await proc.exited, output: stdout + stderr }
}

describe.skipIf(!built)('the built CLI', () => {
  it('does not carry the fused await identifier', async () => {
    // The specific defect, named. Cheap, and it says exactly what went wrong
    // when it trips.
    const source = await Bun.file(cli).text()

    expect(source).not.toContain('awaitPromise')
  })

  it('runs codemod without dying on its first line', async () => {
    const { output } = await run('codemod', '--rule', 'tooltip', 'test/**/*.stx')

    expect(output).not.toContain('is not defined')
    expect(output).not.toContain('ReferenceError')
  })

  it('runs typecheck without dying on its first line', async () => {
    // `typecheck` needs `tsc`, which may be absent — but "no TypeScript found"
    // is a different failure from dying before reading a file, and only the
    // second one is what this guards.
    const { output } = await run('typecheck', 'test/**/*.stx')

    expect(output).not.toContain('is not defined')
    expect(output).not.toContain('ReferenceError')
    // Spawns the CLI, which spawns `tsc` over a glob, so the wall time belongs
    // to a compiler rather than to anything this asserts. It takes ~3.5s on an
    // idle machine, which left no margin under bun's 5s default and duly timed
    // out on a loaded runner — failing a build for a reason the test does not
    // even check. The budget is generous on purpose: a slow answer here is not
    // the defect, dying before reading a file is.
  }, 60_000)

  it('still answers --help', async () => {
    const { output } = await run('--help')

    expect(output).toContain('typecheck')
    expect(output).toContain('codemod')
  })
})

describe.skipIf(!built)('no other command imports the bun builtin dynamically', () => {
  it('has no `await import("bun")` left in the source', async () => {
    /*
     * The construct itself, not just its symptom. It is only miscompiled in
     * some positions, so a second use elsewhere could reintroduce the same
     * runtime error in a build that this file's other checks happen to pass.
     * `Bun` is a global; the dynamic import buys nothing.
     */
    const source = await Bun.file(join(packageRoot, 'bin', 'cli.ts')).text()
    // Comments stripped first: the fix's own note names the construct it
    // replaced, and matching that would make this fail on the explanation
    // rather than on a reoccurrence.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '')

    expect(code).not.toMatch(/await\s+import\(\s*['"]bun['"]\s*\)/)
  })
})
