/**
 * Put markup just before the document's closing `</body>`.
 *
 * The LAST one, never the first. A page's first `</body>` is routinely inside a
 * script: a component that writes a document of its own (a preview frame, a
 * print view) has the tag in a string, and so do the router and x-element
 * runtimes. Replacing the first match drops the new markup into the middle of
 * that script, which ends it early and leaves the rest of its source on the
 * page as text.
 *
 * Without a `</body>` the markup goes on the end.
 */
export function insertBeforeBodyClose(html: string, markup: string): string {
  const at = html.toLowerCase().lastIndexOf('</body>')
  if (at === -1)
    return `${html}\n${markup}`
  return `${html.slice(0, at)}${markup}\n${html.slice(at)}`
}
