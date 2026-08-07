/**
 * Embed JSON inside a `<script>` tag safely.
 *
 * `JSON.stringify` alone is not enough for script content, in two ways that both
 * end with the browser parsing something the author did not write:
 *
 *  - A `</script>` sequence inside any string value closes the tag early. The
 *    rest of the JSON then lands in the document as markup, so whoever controls
 *    that string controls the page.
 *  - U+2028 and U+2029 are literal line terminators in JavaScript, though legal
 *    unescaped in JSON. A value containing one splits the statement it sits in.
 *
 * This existed as five separate private copies — `spa-shell.ts`,
 * `appearance-bootstrap.ts`, `color-mode-boot.ts`, `misc-directives.ts` and
 * `bun-plugin/src/serve.ts`. That is the shape of bug this repo keeps paying
 * for: a sixth injection site (`runtime-injection.ts`, added with the
 * `ownedRoutes` table in #1864) had no escaping at all, because nothing
 * connected it to the others.
 *
 * The escapes below are written as `\u` sequences rather than literal
 * characters, and that is load-bearing. Writing a raw U+2028 inside the regex
 * terminates the line mid-literal and the file stops parsing — this module's
 * own first draft did exactly that, which is a fair demonstration of why the
 * function needs to exist.
 *
 * @module script-json
 */

/**
 * Escape an already-serialised JSON string for inclusion in a `<script>` body.
 *
 * `<` and `>` are escaped rather than only the `</script>` sequence, so no
 * variant spelling (`</SCRIPT`, `</script foo`) can slip through.
 */
export function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** Serialise a value and escape it for a `<script>` body in one step. */
export function toScriptJson(value: unknown): string {
  return escapeJsonForScript(JSON.stringify(value))
}
