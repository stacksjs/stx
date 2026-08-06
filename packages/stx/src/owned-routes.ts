/**
 * Which same-origin paths the SPA router actually owns (stacksjs/stx#1864).
 *
 * With `interceptAllLinks` — hardcoded as the base default on the serve path —
 * the router claimed EVERY same-origin relative anchor. `shouldIntercept()`
 * filtered on protocol, target and a few opt-out attributes and had no notion
 * of a route table, so a link to a non-page endpoint got fetched, failed to
 * swap, and then fell back to a real navigation. The endpoint was hit twice:
 *
 *     Fetch     503  /api/auth/github/redirect
 *     Document  503  /api/auth/github/redirect
 *
 * on an endpoint whose whole job is minting OAuth state. Worse, when such an
 * endpoint returns a successful cross-origin redirect, `fetch` follows it and
 * the router swaps a third-party document into the container.
 *
 * The only escape was `data-no-router`, which removes the anchor from routing
 * entirely — one reporting app carries 17 of them, and every new link has to
 * remember whether it needs one.
 *
 * The missing concept is a manifest of owned paths, which the file router
 * already has. This ships the compiled matchers to the client so interception
 * asks "is this a page I can render?" instead of "is this same-origin?".
 *
 * Regex SOURCES are shipped rather than patterns because the client runtime is
 * a template literal (see CLAUDE.md item 41) — re-implementing the pattern
 * compiler in there would mean maintaining a second matcher, in a file where
 * every backslash has to be doubled, that must agree with this one forever.
 *
 * @module owned-routes
 */

import { createRouter } from './router'
import { loadStxConfig } from './config'

/** Cached per pages directory: discovery walks the filesystem. */
const _cache = new Map<string, string[]>()

/**
 * Serialised matchers for every route the router can render.
 *
 * Empty when nothing could be discovered — callers MUST treat that as "unknown"
 * and leave interception alone, never as "owns nothing". Shipping an empty list
 * as authoritative would disable SPA navigation for a whole site, which is a
 * far worse failure than the double-fetch this fixes.
 */
export async function getOwnedRouteMatchers(pagesDir?: string): Promise<string[]> {
  let dir = pagesDir
  if (!dir) {
    try {
      const config = await loadStxConfig()
      dir = (config as any)?.pagesDir || 'pages'
    }
    catch {
      dir = 'pages'
    }
  }

  const key = dir as string
  const cached = _cache.get(key)
  if (cached)
    return cached

  let sources: string[] = []
  try {
    // `Route.regex` is the same matcher the server routes with, so the client
    // cannot disagree with it about what is a page.
    sources = createRouter('.', { pagesDir: key })
      .map(route => route.regex.source)
      .filter(Boolean)
  }
  catch {
    // Undiscoverable — leave it unknown rather than claiming the site has no
    // routes.
    sources = []
  }

  _cache.set(key, sources)
  return sources
}

/** Drop the memo, for tests and for a dev server that added a page. */
export function clearOwnedRoutesCache(): void {
  _cache.clear()
}
