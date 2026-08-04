/**
 * Sentinel values used while resolving component props.
 *
 * A leaf module on purpose: `component-renderer.ts` imports `./builtins`, so a
 * builtin importing the renderer back would be a cycle. Both sides import this
 * instead.
 *
 * @module prop-sentinels
 */

/**
 * Marks a prop that was written as a bare HTML boolean attribute — `<X open>`
 * rather than `<X open="true">`.
 *
 * It carries a leading NUL precisely so it cannot collide with an author-written
 * value, which also means it must never survive into a response: a NUL byte
 * makes the document invalid UTF-8, and tools treat the file as binary. `grep`
 * in particular goes SILENT on it — not zero matches, no output at all — so a
 * verification step that greps rendered HTML returns an empty string and reads
 * as a pass (stacksjs/stx#1816).
 */
export const BOOLEAN_ATTRIBUTE_SENTINEL = '\0stx-boolean-attribute'

/** Is this value the bare-boolean-attribute marker? */
export function isBooleanAttributeSentinel(value: unknown): boolean {
  return value === BOOLEAN_ATTRIBUTE_SENTINEL
}

/**
 * Last-resort guard for anything about to be written into a response.
 *
 * Nothing should reach output carrying a NUL, but the cost of one escaping is
 * an invalid document and a silent grep, which is far worse than the cost of
 * this check.
 */
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.indexOf('\0') === -1 ? value : value.replace(/\0/g, '')
}
