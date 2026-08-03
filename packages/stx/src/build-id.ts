/**
 * Per-process build identity, used to detect runtime/fragment skew
 * (stacksjs/stx#1772).
 *
 * Under `bun --watch`, a loaded page holds the client runtime from build N. A
 * file save restarts the server, and the next SPA navigation fetches a fragment
 * rendered by build N+1. Fragments legitimately carry preserved `{{ }}`
 * moustaches for client-side binding, so any drift in the scoped-script or
 * binding format between the two builds leaves the OLD runtime unable to
 * hydrate the NEW fragment: literal moustaches on screen, dead `:show`, stale
 * canvas. It is sporadic and never reproduces from a clean boot, which is
 * exactly its signature.
 *
 * Stamping the identity on both sides lets the router notice the mismatch and
 * fall back to a full page navigation — the same thing Next and Vite's HMR
 * clients do on a version mismatch. It does not fix format drift; it makes the
 * whole class of skew symptoms impossible to observe.
 *
 * The comparison is deliberately conservative: the router only acts when BOTH
 * sides are known. A missing id means "no information", never "mismatch".
 * That keeps statically hosted output (no headers to send) and any consumer on
 * an older server working exactly as before.
 *
 * @module build-id
 */

/** `<meta name="stx-build">` on every rendered page. */
export const BUILD_ID_META = 'stx-build'

/** Response header carrying the id that rendered an SPA fragment. */
export const BUILD_ID_HEADER = 'X-STX-Build'

let cached: string | null = null

/**
 * The current process's build id.
 *
 * Stable for the lifetime of the process, which is the unit that matters: a
 * `bun --watch` restart produces a new process and therefore a new id, while a
 * production build stamps every page it renders with one value.
 *
 * `STX_BUILD_ID` overrides it, for deployments that render across several
 * processes and need them to agree.
 */
export function getBuildId(): string {
  if (cached === null) {
    cached = process.env.STX_BUILD_ID
      || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  }
  return cached
}

/** @internal test-only — force the id, or with `null` restore generation. */
export function __setBuildIdForTest(id: string | null): void {
  cached = id
}

/**
 * Add `<meta name="stx-build">` to `<head>` if it isn't already there.
 *
 * Idempotent, and a no-op for output with no `<head>` — SPA fragments carry the
 * id in a response header instead, since they have nowhere to put a meta.
 */
export function injectBuildId(html: string, buildId: string = getBuildId()): string {
  if (html.includes(`name="${BUILD_ID_META}"`))
    return html

  const headOpen = /<head\b[^>]*>/i.exec(html)
  if (!headOpen)
    return html

  const insertAt = headOpen.index + headOpen[0].length
  return `${html.slice(0, insertAt)}\n  <meta name="${BUILD_ID_META}" content="${buildId}">${html.slice(insertAt)}`
}
