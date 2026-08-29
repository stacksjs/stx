import { setDefaultTimeout } from 'bun:test'

/**
 * The time a test that runs the type checker is allowed to take.
 *
 * Bun's default is five seconds. A checker test builds a real TypeScript
 * program per case, which is about two seconds on an idle machine and more than
 * five on a loaded one — so these passed when run alone and timed out in the
 * full suite, which is the worst way for a test to fail: the timing-out test is
 * killed while its `afterAll` deletes the fixture underneath it, and everything
 * downstream inherits a process whose working directory no longer exists. One
 * of these cost 54 unrelated failures across 15 other files.
 *
 * Called per file rather than set once in the preload because Bun resets the
 * default for every file it loads; a preload only ever reaches the first.
 *
 * The bound still exists, at a size that means "this is hung" rather than "this
 * machine is busy".
 */
export function allowForATypeScriptProgram(): void {
  setDefaultTimeout(30_000)
}
