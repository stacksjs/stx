/**
 * Removes every scratch directory a test run made with `createTempDir`.
 *
 * `temp-dir.ts` removes what is still live on process exit, but `bun test`
 * ends without emitting `exit` (or `beforeExit`), so on its own a run leaves
 * every directory a test did not remove itself: about 590 `stx-*`
 * directories per full run before this. An `afterAll` in a preload runs once,
 * after the last file, whether tests passed, failed or a file threw while
 * loading. Interrupts are still handled by the helper's signal handlers, and
 * a run killed outright is swept by the next one.
 *
 * Every bunfig.toml that runs tests preloads this file.
 */
import { afterAll } from 'bun:test'
import { removeAllTempDirs } from '../src/temp-dir'

afterAll(removeAllTempDirs)
