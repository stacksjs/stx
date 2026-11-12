/**
 * Where a document's own `</head>` and `</body>` are.
 *
 * Not the first one in the text and not the last: either can be inside a
 * script. A component that writes a document of its own (a preview frame, a
 * print view) has both tags in a string, and so do the router and x-element
 * runtimes. Where such a script lands relative to the real tag depends on the
 * page, so `indexOf` breaks one page and `lastIndexOf` breaks another. Markup
 * spliced in at the wrong one either ends that script early, leaving its
 * source on the page as text, or sits inside a string where the browser never
 * sees it (a stylesheet link that loads nothing).
 *
 * So the scan skips what the HTML parser treats as raw text: comments and the
 * contents of `script`, `style`, `textarea` and `title`. A `</script>` cannot
 * appear inside a script in valid HTML, which is what makes the skip exact.
 */

const RAW_TEXT_OR_TAG = /<!--[\s\S]*?-->|<(script|style|textarea|title)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/(head|body)\s*>/gi

function closeTagIndex(html: string, tag: 'head' | 'body', which: 'first' | 'last'): number {
  // Cheap way out for the common case of a fragment.
  if (!html.includes(`</${tag}`) && !html.includes(`</${tag.toUpperCase()}`))
    return -1
  let found = -1
  RAW_TEXT_OR_TAG.lastIndex = 0
  for (let match = RAW_TEXT_OR_TAG.exec(html); match; match = RAW_TEXT_OR_TAG.exec(html)) {
    if (match[2]?.toLowerCase() !== tag)
      continue
    found = match.index
    if (which === 'first')
      break
  }
  RAW_TEXT_OR_TAG.lastIndex = 0
  return found
}

/** The index of the document's `</head>`, or -1. */
export function headCloseIndex(html: string): number {
  return closeTagIndex(html, 'head', 'first')
}

/** The index of the document's `</body>`, or -1. */
export function bodyCloseIndex(html: string): number {
  return closeTagIndex(html, 'body', 'last')
}

/** Put markup just before the document's `</head>`. Unchanged when there is none. */
export function insertBeforeHeadClose(html: string, markup: string, separator: string = '\n'): string {
  const at = headCloseIndex(html)
  if (at === -1)
    return html
  return `${html.slice(0, at)}${markup}${separator}${html.slice(at)}`
}

/** Put markup just before the document's `</body>`, or on the end when there is none. */
export function insertBeforeBodyClose(html: string, markup: string, separator: string = '\n'): string {
  const at = bodyCloseIndex(html)
  if (at === -1)
    return `${html}\n${markup}`
  return `${html.slice(0, at)}${markup}${separator}${html.slice(at)}`
}
