/**
 * The request header that asks for a page fragment instead of a document, and
 * the cache correctness that has to travel with it.
 *
 * The SPA router fetches the SAME url the browser would navigate to and tells
 * the server which representation it wants with `X-STX-Router: true`. Two very
 * different bodies therefore share one url: a full `<html>` document, and the
 * inner content of the router container with no `<head>` at all.
 *
 * That is legal HTTP only while the server says so. A response whose body
 * depends on a request header MUST list that header in `Vary`, or any shared
 * cache between the origin and the browser is entitled to store whichever
 * representation it saw first and serve it to everyone. When the stored one is
 * the fragment, every visitor gets a headless page — no doctype, no stylesheet,
 * no nav — until the entry expires. It is invisible from the origin, which is
 * still answering both requests perfectly, and it lasts as long as the cache's
 * TTL rather than as long as the mistake.
 *
 * @module spa-nav
 */

/** Request header the SPA router sends to ask for a fragment. */
export const SPA_NAV_HEADER = 'X-STX-Router'

/**
 * `Cache-Control` for a fragment response.
 *
 * `private` is the half that matters: a fragment is only ever meaningful to the
 * router instance that asked for it, so no shared cache should hold it under
 * any circumstances. `no-store` then keeps it out of the browser's cache too,
 * where it would otherwise be replayed into a fresh document load.
 */
export const FRAGMENT_CACHE_CONTROL = 'private, no-store'

/**
 * The text a rendered `<title>` element represents, as a string.
 *
 * The title header is built by reading the rendered page's `<title>` back out
 * of the HTML, where the renderer has already escaped it: a title of
 * `founder & skyrunner` is sitting in the markup as `founder &amp; skyrunner`.
 * `encodeURIComponent` then protects that escape rather than resolving it, and
 * the router assigns the result straight to `document.title`, which is a
 * string and not markup. The tab ends up reading `founder &amp; skyrunner`,
 * but only after a client-side navigation - a full load parses the same
 * `<title>` as HTML and gets it right, so the two disagree about the name of
 * the same page.
 *
 * Only the escapes an HTML escaper produces, plus numeric references, are
 * resolved. A `<title>` holds character data and cannot contain elements, so
 * there is nothing else in there to decode, and a full named-entity table is a
 * lot of surface to carry for a tab label. `&amp;` is resolved last so that a
 * literal `&amp;lt;` in a title survives as `&lt;` instead of becoming `<`.
 */
export function decodeTitleEntities(title: string): string {
  return title
    .replace(/&#(\d+);/g, (match, code) => codePoint(Number(code), match))
    .replace(/&#x([0-9a-f]+);/gi, (match, code) => codePoint(Number.parseInt(code, 16), match))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
}

/** One numeric character reference, or the reference itself when it names no character. */
function codePoint(code: number, original: string): string {
  if (!Number.isInteger(code) || code < 0 || code > 0x10FFFF)
    return original

  try {
    return String.fromCodePoint(code)
  }
  catch {
    return original
  }
}

/** Whether this request is the SPA router asking for a fragment. */
export function isSpaNavRequest(request: { headers: { get: (name: string) => string | null } }): boolean {
  return request.headers.get(SPA_NAV_HEADER) === 'true'
}

/**
 * `vary` with `field` appended, or `field` alone when there was nothing there.
 *
 * Appends only when the field is not already listed: `Vary: X-STX-Router,
 * X-STX-Router` is legal, pointless, and confusing to read in a response.
 */
export function appendVary(vary: string | null | undefined, field: string): string {
  if (!vary)
    return field

  const listed = vary.split(',').some(entry => entry.trim().toLowerCase() === field.toLowerCase())
  return listed ? vary : `${vary}, ${field}`
}

/**
 * The header bag a route serves when it answers both representations.
 *
 * Spread into BOTH the fragment and the document response. Declaring it on only
 * the fragment fixes nothing: a cache that stored the document first would go
 * on serving that document to the router, which then swaps a whole `<html>`
 * tree inside the container. `Vary` describes the url, not one answer for it.
 */
export function spaNavVaryHeaders(existing?: string | null): { Vary: string } {
  return { Vary: appendVary(existing, SPA_NAV_HEADER) }
}
