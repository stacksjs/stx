import { setDefaultTimeout } from 'bun:test'

/**
 * The time a test that drives a real browser is allowed to take.
 *
 * Bun's default is five seconds, and `describe(name, fn, ms)` does NOT change
 * it: bun:test accepts a timeout on `it`/`test` and silently ignores the third
 * argument on `describe`. A file that wrote one therefore ran its browser cases
 * under the five-second default while reading as though it had a minute, and
 * nothing in the output said so.
 *
 * That matters here because of what a browser case does when it is cut off.
 * Bun ends the case and runs `afterAll`, which closes the view, but the case's
 * body keeps executing — so its next read calls `evaluate` on a view that is
 * already closed and fails with `ERR_INVALID_STATE: WebView.evaluate: view is
 * closed`. That is a different error from an in-flight read interrupted by a
 * close, which rejects with a bare `WebView closed`, and the distinction is
 * what identifies the overrun: the failure names the last line of the case, not
 * the deadline, so it reads as the browser dying rather than as a timeout. See
 * stacksjs/stx#2156, where it only ever appeared in the full suite.
 *
 * Called per file rather than set once in the preload because Bun resets the
 * default for every file it loads; a preload only ever reaches the first.
 *
 * The bound still exists, at a size that means "this is hung" rather than "this
 * machine is busy": a real browser case is a few hundred milliseconds of CDP
 * round trips locally, and the whole point is to survive a loaded host.
 */
export function allowForARealBrowser(): void {
  setDefaultTimeout(60_000)
}
