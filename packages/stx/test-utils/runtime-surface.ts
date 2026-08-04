/**
 * One anchor for "what does the signals runtime put on `window.stx`?".
 *
 * Three test files each located that object literal by searching for its
 * assignment text. When #1804 changed the assignment from a replacement to an
 * `Object.assign` merge, every one of those anchors stopped matching — and an
 * extractor that returns an empty set on a miss turns the #1785 drift guard into
 * a test that passes because it checked nothing.
 *
 * Hence one shared helper that THROWS when it cannot find the literal.
 */

/** The assignment that opens the runtime's public surface object. */
const SURFACE_ANCHOR = 'window.stx = Object.assign(window.stx || {}, {'

/**
 * Byte offset of the `{` that opens the `window.stx` surface literal.
 *
 * @throws if the assignment cannot be found — a silent miss is the failure mode
 * this helper exists to prevent.
 */
export function runtimeSurfaceStart(src: string): number {
  const start = src.indexOf(SURFACE_ANCHOR)
  if (start === -1) {
    throw new Error(
      'could not locate the window.stx surface assignment in the runtime. '
      + `Expected to find: ${SURFACE_ANCHOR}\n`
      + 'If the assignment was deliberately reshaped, update SURFACE_ANCHOR in '
      + 'test-utils/runtime-surface.ts — do not let this return an empty set.',
    )
  }
  // The opening brace of the object literal is the LAST `{` of the anchor.
  return start + SURFACE_ANCHOR.length - 1
}

/**
 * Every key the signals runtime assigns to `window.stx`.
 *
 * Brace-matches the object literal, then reads the top-level keys. Internal
 * members (`_scopes`, `_cleanupContainer`, …) are included — callers that only
 * want the authoring surface filter them out themselves.
 */
export function runtimeWindowStxSurface(src: string): Set<string> {
  const open = runtimeSurfaceStart(src)
  let depth = 0
  let end = open
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') {
      depth++
    }
    else if (src[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === open)
    throw new Error('unbalanced braces while extracting the window.stx surface')

  const body = src.slice(open + 1, end)
  return new Set([...body.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*[:,]/gm)].map(m => m[1]))
}
