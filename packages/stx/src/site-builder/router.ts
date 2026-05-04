/**
 * SPA-style router injection for static stx sites.
 *
 * Builds static HTML for each page (so SEO crawlers see the real page,
 * initial loads render instantly) AND injects the canonical stx-router
 * script that intercepts `<a>` clicks at runtime, swaps `<head>` styles
 * to prevent FOUC, and runs the existing nprogress-style loading bar.
 *
 * The router lives in the `stx-router` package; we resolve it lazily so
 * site-builder doesn't pull it in for non-SPA builds.
 */

import type { SiteRouterOptions } from './types'

export type RouterOptions = SiteRouterOptions

let _cachedRouterScript: string | null = null

function getRouterScript(): string {
  if (_cachedRouterScript !== null) return _cachedRouterScript
  try {
    // Lazy require so we don't take a runtime dep on stx-router for non-SPA builds.
    // eslint-disable-next-line ts/no-require-imports
    const mod = require('stx-router') as { getRouterScript?: () => string }
    if (typeof mod.getRouterScript === 'function')
      _cachedRouterScript = mod.getRouterScript()
    else
      _cachedRouterScript = ''
  }
  catch {
    _cachedRouterScript = ''
  }
  return _cachedRouterScript
}

/**
 * Inject the stx SPA router into HTML. The script is appended just
 * before `</body>` (or at the end of the document if there is no body
 * close). Configuration from `options` is exposed as
 * `window.__stxRouterConfig` ahead of the runtime so the runtime picks
 * it up on init.
 */
export function injectRouterScript(html: string, options?: RouterOptions): string {
  const script = getRouterScript()
  if (!script) return html

  const configBlock = options
    ? `<script>window.__stxRouterConfig=${JSON.stringify(options)};</script>\n`
    : ''

  const block = `${configBlock}<script>${script}</script>`

  if (/<\/body>/i.test(html))
    return html.replace(/<\/body>/i, `${block}\n</body>`)

  return `${html}\n${block}`
}
