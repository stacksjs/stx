/**
 * Two things the suite as a whole needs, and no single test can arrange.
 *
 * ## A working directory that exists
 *
 * Bun runs every test file in one process, so `process.chdir` is shared state.
 * A dozen tests here point the cwd at a temporary project, run a checker or a
 * build against it, and put the cwd back in a `finally`. That is correct right
 * up until the test is killed — a timeout, an assertion thrown from the wrong
 * place — because then `afterAll` deletes the temporary project first and the
 * restoring `chdir` runs second, against a directory that is no longer there.
 *
 * The process is then parked inside a deleted directory, and a process whose
 * cwd does not exist cannot spawn a child at all: `Bun.spawn` fails with
 * `syscall: "TODO", errno: 0` and no path in it. Every later file that shells
 * out — the typecheck suites, the build suites — fails on something that has
 * nothing to do with what it was testing. One timeout in
 * `composables-dir.test.ts` cost 54 unrelated failures across 15 files, and
 * none of them named the cause.
 *
 * So: after every test, if the cwd has gone, put it somewhere real. It is a
 * guard rather than a fix — the fix is each test restoring its own cwd — but it
 * is the one place that can stop a single casualty becoming a massacre.
 *
 * The other half of that story — why a test was killed in the first place —
 * lives in `checker-timeout.ts`, which has to be called per file because Bun
 * resets the default timeout for every file it loads.
 */
import path from 'node:path'
import process from 'node:process'
import { existsSync } from 'node:fs'
import { afterEach } from 'bun:test'

/** The repository root: this file is `packages/stx/test-utils/`. */
const anchor = path.resolve(import.meta.dir, '../../..')

/** Whether the process still has a working directory that exists. */
function cwdIsGone(): boolean {
  try {
    return !existsSync(process.cwd())
  }
  catch {
    // `getcwd` itself fails once the directory is unlinked on some platforms.
    return true
  }
}

afterEach(() => {
  if (cwdIsGone())
    process.chdir(anchor)
})
