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
