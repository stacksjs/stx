/**
 * Escape script bodies at EMIT time (stacksjs/stx#1792, part one item 2).
 *
 * A `</script>` anywhere inside a script body — in a string, a comment, or a
 * runtime value — ends the element as far as the HTML parser is concerned. The
 * rest of the script is then painted onto the page as text, and everything
 * defined below the offending line silently does not exist.
 *
 * The documented workaround is to write `<\/script>` in the source. It does not
 * work, and that is the crux of the report: `transpileTypeScript` runs every
 * non-server block through Bun's transpiler, which NORMALISES the escape away
 * before the browser ever sees it.
 *
 *   in : const s = "<\/script>"
 *   out: const s = "</script>";
 *
 * So the escape protects the source from stx's own scanners and is then
 * stripped, leaving the HTML parser to apply exactly the rule it was meant to
 * dodge. Escaping on emit is the only place the protection can survive, because
 * it happens after the transpiler.
 *
 * The transform is semantically inert for JavaScript: `\/` inside a string, a
 * template literal, a regex literal or a comment parses as `/`. It is also
 * valid inside JSON, where `\/` is an explicit escape — so a JSON-LD or
 * importmap body would survive it, though those bodies are excluded upstream
 * and never reach here.
 *
 * This is a leaf module on purpose: no stx imports, so every emit site can use
 * it without creating a cycle.
 */

/** Matches a closing script tag that would terminate the element. */
const RAW_CLOSE = /<\/(script)/gi

/**
 * Neutralise closing script tags in a JavaScript body about to be embedded in
 * an HTML `<script>` element.
 *
 * Idempotent: an already-escaped `<\/script` contains no `</script`, so
 * re-running this is a no-op rather than a double-escape.
 */
export function escapeScriptBody(js: string): string {
  if (!js || js.indexOf('</') === -1)
    return js
  return js.replace(RAW_CLOSE, '<\\/$1')
}

/**
 * Warn when a body still carries a raw closing tag at emit time.
 *
 * A truncated script is never the intent, so this is worth saying out loud —
 * both of the reported production incidents were diagnosed from the browser's
 * "Unexpected end of input" rather than from anything stx said.
 *
 * Deliberately a warning rather than the `StxSyntaxError` the issue proposes: a
 * hard throw here could brick a production build over a vendor bundle inlined
 * through `stx-inline`, which is a worse failure than the one being reported.
 */
export function assertNoRawClose(js: string, site: string, filePath?: string): void {
  if (!js || !/<\/script/i.test(js))
    return
  console.warn(
    `[stx] ${filePath ? `${filePath}: ` : ''}a script body emitted by ${site} still contains a `
    + 'literal closing script tag. The HTML parser will end the element there, so everything '
    + 'after it becomes page text and every declaration below it silently disappears. '
    + 'See stacksjs/stx#1792.',
  )
}
