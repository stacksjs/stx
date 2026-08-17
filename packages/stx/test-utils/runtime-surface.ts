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

/** The declaration that opens the toast factory. */
const ADD_TOAST_ANCHOR = 'function addToast(type, message, options) {'

/**
 * Every option key `addToast` reads from its options argument.
 *
 * The point is a list nobody maintains by hand. `stx.d.ts` describes the runtime
 * by hand and has now fallen behind it three times — `useEventListener` (#1923),
 * `StxQueryResult` (#1929), and the toast options (#1932), where the runtime
 * read four and the declaration listed one. A guard that reads the runtime
 * cannot fall behind it.
 *
 * Same discipline as {@link runtimeSurfaceStart}: THROWS when the function
 * cannot be found, because an extractor that returns an empty set on a miss
 * turns a drift guard into a test that passes by checking nothing.
 */
export function runtimeToastOptionReads(src: string): Set<string> {
  const start = src.indexOf(ADD_TOAST_ANCHOR)
  if (start === -1) {
    throw new Error(
      'could not locate addToast in the runtime. '
      + `Expected to find: ${ADD_TOAST_ANCHOR}\n`
      + 'If it was deliberately reshaped, update ADD_TOAST_ANCHOR in '
      + 'test-utils/runtime-surface.ts — do not let this return an empty set.',
    )
  }

  const open = src.indexOf('{', start + ADD_TOAST_ANCHOR.length - 1)
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
    throw new Error('unbalanced braces while extracting the addToast body')

  // `opts` is the local the body reads the caller's options through.
  const body = src.slice(open, end)
  return new Set([...body.matchAll(/\bopts\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))
}

/**
 * The property names on the object a runtime function returns.
 *
 * Finds `function <name>(`, brace-matches its body, takes the LAST top-level
 * `return {` in it, and reads the keys of that literal — covering the
 * `get counter() { … }` accessor form the timers use as well as plain
 * `pause: pause` pairs.
 *
 * Intended for drift guards that compare a hand-written declaration against
 * what the implementation actually hands back (#1941).
 *
 * @throws if the function, or a returned object literal inside it, cannot be
 * found. Returning an empty set would let a guard report success for a surface
 * it never read.
 */
export function runtimeReturnedKeys(src: string, name: string): Set<string> {
  const anchor = `function ${name}(`
  const start = src.indexOf(anchor)
  if (start === -1) {
    throw new Error(
      `could not locate ${name} in the runtime. `
      + `Expected to find: ${anchor}\n`
      + 'If it was renamed, update the caller — do not let this return an empty set.',
    )
  }

  // Brace-match the function body so a `return {` in a LATER function cannot
  // answer for this one.
  const bodyOpen = src.indexOf('{', start + anchor.length - 1)
  let depth = 0
  let bodyEnd = -1
  for (let i = bodyOpen; i < src.length; i++) {
    if (src[i] === '{') {
      depth++
    }
    else if (src[i] === '}') {
      depth--
      if (depth === 0) {
        bodyEnd = i
        break
      }
    }
  }
  if (bodyEnd === -1)
    throw new Error(`unbalanced braces while extracting the ${name} body`)

  const body = src.slice(bodyOpen, bodyEnd)
  const returnIdx = body.lastIndexOf('return {')
  if (returnIdx === -1)
    throw new Error(`${name} does not return an object literal — nothing to compare a declaration against`)

  const open = returnIdx + 'return '.length
  depth = 0
  let end = -1
  for (let i = open; i < body.length; i++) {
    if (body[i] === '{') {
      depth++
    }
    else if (body[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1)
    throw new Error(`unbalanced braces while extracting the object ${name} returns`)

  // Depth 1 only, so keys of nested literals are not mistaken for this one's.
  const literal = body.slice(open + 1, end)
  const keys = new Set<string>()
  let nesting = 0
  for (const line of literal.split('\n')) {
    const trimmed = line.trim()
    if (nesting === 0) {
      const m = trimmed.match(/^(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*[:(]/)
      if (m)
        keys.add(m[1])
    }
    for (const ch of trimmed) {
      if (ch === '{' || ch === '(' || ch === '[') nesting++
      else if (ch === '}' || ch === ')' || ch === ']') nesting--
    }
    if (nesting < 0) nesting = 0
  }

  if (keys.size === 0)
    throw new Error(`extracted no keys from what ${name} returns — the literal shape changed`)

  return keys
}
