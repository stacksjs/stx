/**
 * Runtime Injection Module
 *
 * Handles injecting the signals runtime, browser runtime, and SPA router
 * script into rendered HTML templates.
 *
 * @module runtime-injection
 */

import type { StxOptions } from './types'
import { BROWSER_CORE_IMPORTS } from './browser-core-imports'
import { getOwnedRouteMatchers } from './owned-routes'
import { toScriptJson } from './script-json'
import { findBodyOpenTag, replaceBodyOpenTag } from './find-body-tag'
// Static: `builtins/tooltip` exports one pure function and imports nothing, so
// there is no cycle and no cost to pulling it in here.
import { getTooltipRuntime } from './builtins/tooltip'

/**
 * Inject an @stacksjs/browser initialization input into a template that will
 * continue through STX client-script processing. The later bundling pass turns
 * this package specifier into browser-ready code.
 *
 * IMPORTANT: Only checks CLIENT scripts (not <script server>).
 * Server scripts should use the server ORM directly, not browser functions.
 */
export function injectBrowserRuntime(template: string): string {
  // Don't inject if already present
  if (template.includes('window.StacksBrowser') || template.includes('StacksBrowser =')) {
    return template
  }

  // Extract only CLIENT script content (exclude <script server> blocks)
  // Client scripts are: <script>, <script client>, <script type="module">, etc.
  // Server scripts are: <script server>
  // eslint-disable-next-line no-super-linear-backtracking
  const clientScriptRegex = /<script\b(?![^>]*\bserver\b)[^>]*>([\s\S]*?)<\/script>/gi
  let clientCode = ''
  let match: RegExpExecArray | null

  while ((match = clientScriptRegex.exec(template)) !== null) {
    clientCode += match[1] + '\n'
  }

  // Also check template expressions ({{ }}) which execute on client
  const templateExprRegex = /\{\{([\s\S]*?)\}\}/g
  while ((match = templateExprRegex.exec(template)) !== null) {
    clientCode += match[1] + '\n'
  }

  // If no client code, no need for browser runtime
  if (!clientCode.trim()) {
    return template
  }

  // The names that make this template need @stacksjs/browser are exactly the
  // names the client-script pass will auto-import from it. This used to be a
  // second hand-maintained list, and it had drifted seven names behind:
  // BrowserQueryError, browserAuth, getBrowserConfig, createBrowserDb,
  // isBrowser, useObjectUrl and useTimeoutFn were all promised by the
  // auto-import manifest but did not count as a reason to load the module.
  //
  // A page whose client code used only those got the destructure without the
  // module: `var { useTimeoutFn } = window.StacksBrowser || {}` against a
  // global nothing had defined. Every one of them came out undefined, and the
  // page reported it through the auto-import guard rather than by failing at
  // the call site — so it read as a packaging warning rather than as the
  // missing bootstrap it was.
  //
  // Reading the manifest directly is what keeps the two ends honest. That is
  // the reason browser-core-imports.ts is a leaf module importing nothing:
  // it already had two readers, and this is the third.
  const coreSymbols = BROWSER_CORE_IMPORTS

  // Check for core browser utilities in CLIENT code only
  const usesCoreSymbols = coreSymbols.some(sym => {
    const regex = new RegExp(`\\b${sym}\\b`)
    return regex.test(clientCode)
  })

  // Check for model usage in CLIENT code only (PascalCase + query methods)
  // Exclude JS built-ins that are PascalCase (Promise.all, Object.keys, Array.from, etc.)
  const jsBuiltins = new Set(['Promise', 'Object', 'Array', 'Map', 'Set', 'Date', 'Error', 'JSON', 'Math', 'Number', 'String', 'RegExp', 'Symbol', 'WeakMap', 'WeakSet', 'Proxy', 'Reflect', 'Intl', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response', 'AbortController', 'EventTarget', 'Element', 'Document', 'Node', 'Window', 'Console', 'Storage', 'Navigator', 'Blob', 'File', 'FileReader', 'HTMLElement', 'SVGElement', 'Event', 'CustomEvent', 'DOMParser', 'XMLSerializer', 'WebSocket', 'Worker', 'SharedWorker', 'IntersectionObserver', 'MutationObserver', 'ResizeObserver', 'PerformanceObserver', 'Notification', 'Bun', 'Buffer', 'Process'])
  const modelPattern = /\b([A-Z][a-zA-Z0-9]*)\s*\.\s*(all|find|first|get|where|orderBy|orderByDesc|limit|select|pluck|create|update|delete)\s*\(/g
  let modelMatch: RegExpExecArray | null
  let usesModels = false
  while ((modelMatch = modelPattern.exec(clientCode)) !== null) {
    if (!jsBuiltins.has(modelMatch[1])) {
      usesModels = true
      break
    }
  }

  if (!usesCoreSymbols && !usesModels) {
    return template
  }

  // Inject a module input that loads @stacksjs/browser. The regular client
  // script pass bundles it before the rendered document leaves the compiler.
  // The browser module auto-initializes and loads all app models dynamically
  // This must run before component scripts
  const browserScript = `<script type="module">
// STX: Auto-load @stacksjs/browser (auto-initializes API and loads models)
import '@stacksjs/browser'
</script>`

  // Inject before other scripts in <head>, or before </head>
  if (template.includes('</head>')) {
    const headEndPos = template.indexOf('</head>')
    const headSection = template.slice(0, headEndPos)
    const firstScriptPos = headSection.indexOf('<script')

    if (firstScriptPos !== -1) {
      return template.slice(0, firstScriptPos) + browserScript + '\n' + template.slice(firstScriptPos)
    }
    return template.replace('</head>', `${browserScript}\n</head>`)
  }

  // Same reason as the setup wiring in process.ts: the first `<body` in the
  // document can be prose inside a style block or a comment, and injecting the
  // runtime there puts the script inside CSS, where it never executes.
  const bodyTag = findBodyOpenTag(template)
  if (bodyTag) {
    return replaceBodyOpenTag(template, tag => `${tag}\n${browserScript}`)
  }

  return browserScript + '\n' + template
}

/**
 * Does this rendered page ship the signals runtime?
 *
 * Answers the question the SPA router cannot: a fragment never carries the
 * runtime, so swapping one into a page that has none leaves it permanently
 * unhydrated. The router used to guess from markers in the fragment markup and
 * missed the shape that has no markers at all — reactive syntax with no setup
 * function, whose only stamp is `data-stx-auto` on `<body>`, which the fragment
 * excludes (stacksjs/stx#1827). The server knows, because it is the thing that
 * decided; it reports the answer in `X-STX-Runtime` on fragment responses.
 *
 * Deliberately keyed on the same marker `injectSignalsRuntime` writes and
 * checks below, so the two cannot disagree about what "has a runtime" means.
 * Pass the FULL page, before it is reduced to the container's inner content.
 */
export function pageShipsSignalsRuntime(fullPageHtml: string): boolean {
  return fullPageHtml.includes('data-stx-runtime')
}

/**
 * Does this rendered output contain a script that will THROW without the
 * signals runtime?
 *
 * The safety net for stacksjs/stx#1820. Two independent decisions used to be
 * made about the same page — `hasSignalsSyntax` decided whether to inject the
 * runtime, and the client-script pass separately decided to emit
 * `window.stx.mount(...)` — and nothing reconciled them. When they disagreed
 * the page died on its first client line with "Cannot read properties of
 * undefined (reading 'mount')", taking every handler defined in that block
 * with it.
 *
 * Widening the gate does not fix that; it only makes the disagreement rarer,
 * and it has already been widened twice. The gate is also evaluated against a
 * template `processEventDirectives` has already rewritten, so an `@event=`
 * page cannot match it however many patterns are added. This asks the opposite
 * question, of the finished output, where no ordering can hide the answer: did
 * we emit something that requires the runtime?
 *
 * Keyed on an UNGUARDED reach for `window.stx`, because that is precisely what
 * throws. The guarded spellings the compiler also emits are all safe and must
 * not trigger injection:
 *
 *   var { state } = window.stx || window;   // falls back
 *   var s = window.stx || {};               // falls back
 *   window.stx = window.stx || {};          // self-initializing
 *   if (window.stx) window.stx._latestSetup = null;   // guarded
 *
 * The appearance bootstrap is the reason this runs before that directive is
 * processed: it emits a self-contained `data-stx-scoped` script on pages with
 * no reactivity at all, so keying on the presence of a client script — the
 * obvious invariant, and the one the issue suggested — would pull the runtime
 * onto every static page that sets a theme.
 */
export function outputNeedsSignalsRuntime(html: string): boolean {
  // `window.stx.<name>` — a property read, e.g. .mount( or ._scopes
  // `} = window.stx;` — the runtime-globals destructure, with no `|| window`
  const reach = /window\.stx\s*\.\s*[A-Za-z_$]|\}\s*=\s*window\.stx\s*;/g

  for (let m = reach.exec(html); m !== null; m = reach.exec(html)) {
    const preceding = html.slice(Math.max(0, m.index - 80), m.index)
    if (/if\s*\(\s*window\.stx\s*\)|window\.stx\s*&&/.test(preceding))
      continue
    return true
  }

  return false
}

/**
 * Place the runtime tag so it precedes anything that reaches for it, without
 * landing ahead of the doctype.
 *
 * The rule used to be "insert before the first `<script` in the entire
 * document", and the reason is real: a layout script can appear before `<head>`,
 * and the runtime has to come first or that script throws. What it never asked
 * was whether that offset is ahead of `<!DOCTYPE html>`.
 *
 * On a page using a full-document layout whose `<head>` contains no script of
 * its own, it is. The runtime — and the store block that anchors to it — then
 * get prepended above the doctype, and a start tag before the doctype puts the
 * document in QUIRKS MODE. Measured on a real app: `document.compatMode` was
 * `BackCompat` on the one page in that shape and `CSS1Compat` on every other
 * page of the same site. It serves 200, screenshots correctly and logs no
 * console error, so nothing short of `compatMode` catches it — the page just
 * quietly uses a different box model than the rest of the site.
 * See stacksjs/stx#1899.
 *
 * So the first-script rule still wins whenever it lands after the doctype,
 * which covers both the layout-script case it was written for and fragments,
 * which have no doctype at all. Only when it would jump the doctype do we fall
 * through to the head, which is both valid and still ahead of every script in
 * the document.
 */
function placeRuntimeTag(template: string, runtimeScript: string): string {
  const firstScript = template.indexOf('<script')
  const doctype = template.search(/<!doctype\b/i)

  if (firstScript !== -1 && (doctype === -1 || firstScript > doctype))
    return template.slice(0, firstScript) + runtimeScript + '\n' + template.slice(firstScript)

  // Immediately after `<head>` rather than before `</head>`: the head can hold
  // scripts of its own, and the runtime has to precede them.
  const headOpen = /<head\b[^>]*>/i.exec(template)
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length
    return `${template.slice(0, at)}\n${runtimeScript}${template.slice(at)}`
  }

  if (template.includes('</head>')) {
    const idx = template.indexOf('</head>')
    return template.slice(0, idx) + runtimeScript + '\n' + template.slice(idx)
  }

  // Same reason as injectBrowserRuntime above: the first `<body` in the source
  // can be prose in a comment or a style block, so find the real tag.
  const bodyTag = findBodyOpenTag(template)
  if (bodyTag)
    return replaceBodyOpenTag(template, tag => `${tag}\n${runtimeScript}`)

  return `${runtimeScript}\n${template}`
}

/**
 * Inject STX signals runtime into the template.
 * The runtime provides client-side reactivity.
 */
export async function injectSignalsRuntime(template: string, options: StxOptions): Promise<string> {
  // Don't inject if actual signals runtime is already present
  // Check for the runtime's unique signature (state, derived, effect assignment),
  // not just any 'window.stx =' which could be scope registration from includes
  if (template.includes('data-stx-runtime') || template.includes('window.stx.state') || template.includes('STX Signals Runtime')) {
    return template
  }

  // Serve mode: reference the shared runtime instead of repeating it in every
  // rendered document. The Bun serve adapter owns this endpoint and returns
  // the same cached runtime with ETag revalidation.
  if (options.buildMode === 'serve') {
    return placeRuntimeTag(template, `<script data-stx-runtime src="/_stx/runtime.js"></script>`)
  }

  // Build mode: emit a placeholder reference instead of inlining the full runtime.
  // The production builder will replace this with a fingerprinted <script src> tag.
  if (options.buildMode === 'compile') {
    return placeRuntimeTag(template, `<script data-stx-runtime src="/__stx/runtime.__STX_HASH__.js"></script>`)
  }

  // Use cached runtime (identical for every page, never changes during dev session)
  const { getCachedSignalsRuntime } = await import('./caching')
  const runtime = await getCachedSignalsRuntime(options.debug)
  // String concatenation throughout placeRuntimeTag, not String.replace(), so a
  // `$&` or `$1` inside the inlined runtime cannot be read as a replacement
  // pattern.
  return placeRuntimeTag(template, `<script data-stx-scoped data-stx-runtime>${runtime}</script>`)
}

/**
 * Whether the finished page has an element carrying `x-tooltip`.
 *
 * Asked of the OUTPUT rather than the source, for the reason
 * `outputNeedsSignalsRuntime` is: both the attribute and every rewrite that
 * could have produced it have happened by then, so no processing order can hide
 * the answer.
 *
 * Anchored on `<` … so the name has to sit inside a tag: documentation prose
 * that merely names the attribute does not pull a runtime onto the page. The
 * attribute value is allowed to contain `>` — a tooltip reading `a > b` is
 * ordinary — so the scan walks to the quote rather than to the first `>`.
 */
export function outputNeedsTooltipRuntime(html: string): boolean {
  return /<[a-z][^>]*?\sx-tooltip\s*=/i.test(html)
}

/**
 * Ship the `x-tooltip` runtime on any page that uses the attribute.
 *
 * `getTooltipRuntime()` was written, exported from `builtins/index.ts`, and
 * called by nothing — two definitions and zero call sites, in stx and in
 * `bun-plugin-stx`. `registerBuiltins()` registers ten builtins and tooltip is
 * not one of them, so the attribute reached the DOM and nothing ever acted on
 * it. Hovering showed the native `title` tooltip, which would have shown anyway
 * (stacksjs/stx#1922).
 *
 * The dead export was not merely unused: the codemod's largest and only
 * auto-fixable rule rewrites `title=` into `x-tooltip=`, so every consuming
 * codebase was being pointed at an attribute that had never worked. It read as
 * an adoption problem — `codemod.d.ts` records `x-tooltip` as "delivered and
 * used zero times" — when the cause was that there was nothing to adopt.
 *
 * Not a registered builtin, because it is not a component: it is one delegated
 * listener pair on `document`, so it costs nothing when no element matches and
 * covers elements added later without per-element wiring. Injected only when the
 * attribute is present, and before the CSP pass so a nonce still reaches it.
 */
export function injectTooltipRuntime(html: string): string {
  if (html.includes('data-stx-tooltip-runtime') || !outputNeedsTooltipRuntime(html))
    return html

  const tag = `<script data-stx-scoped data-stx-tooltip-runtime>${getTooltipRuntime()}</script>`

  /*
   * `lastIndexOf`, never `.replace('</body>', …)`.
   *
   * The FIRST `</body>` in a document is routinely inside a script's string
   * content — the router runtime and the x-element runtime both contain one —
   * and replacing that occurrence injects this script into the middle of
   * another one, breaking the page. See CLAUDE.md item 24.
   */
  const bodyIdx = html.lastIndexOf('</body>')
  if (bodyIdx === -1)
    return `${html}\n${tag}`

  return `${html.slice(0, bodyIdx)}${tag}\n${html.slice(bodyIdx)}`
}

/**
 * Inject the SPA router script into the template.
 * The router is provided by the canonical router in packages/router/src/client.ts.
 * It guards against double-initialization so it's safe to inject alongside @stxRouter.
 */
export async function injectRouterScript(template: string, options?: StxOptions): Promise<string> {
  // Only inject into full HTML pages (not template fragments or components)
  if (!template.includes('</body>')) {
    return template
  }

  // Don't inject if already present (check for the router's own guard, not config references)
  if (template.includes('data-stx-router') || template.includes('__stxRouter)return') || template.includes('__stxRouter=true')) {
    return template
  }

  // Inject router config from stx.config.ts (replaces manual window.STX_ROUTER_OPTIONS scripts)
  const routerConfig = options?.router
  let configScript = ''
  {
    const configObj: Record<string, any> = {}
    if (routerConfig) {
      if (routerConfig.container) configObj.container = routerConfig.container
      if (routerConfig.interceptAllLinks !== undefined) configObj.interceptAllLinks = routerConfig.interceptAllLinks
      if (routerConfig.progress !== undefined) configObj.progress = routerConfig.progress
      if (routerConfig.viewTransitions !== undefined) configObj.viewTransitions = routerConfig.viewTransitions
      if (routerConfig.viewTransitionDuration !== undefined) configObj.viewTransitionDuration = routerConfig.viewTransitionDuration
      if (routerConfig.viewTransitionEasing !== undefined) configObj.viewTransitionEasing = routerConfig.viewTransitionEasing
      if (routerConfig.scrollToTop !== undefined) configObj.scrollToTop = routerConfig.scrollToTop
      if (routerConfig.prefetch !== undefined) configObj.prefetch = routerConfig.prefetch
      if (routerConfig.cache !== undefined) configObj.cache = routerConfig.cache
      if (routerConfig.progressColor !== undefined) configObj.progressColor = routerConfig.progressColor
      if (routerConfig.progressHeight !== undefined) configObj.progressHeight = routerConfig.progressHeight
    }

    // The paths the router can actually render, so interception stops claiming
    // endpoints it cannot swap and hitting them twice (#1864). Omitted entirely
    // when discovery found nothing: the client treats absence as "unknown" and
    // keeps its old behaviour, where an empty list would read as "owns nothing"
    // and kill SPA navigation site-wide.
    try {
      const owned = await getOwnedRouteMatchers((options as any)?.pagesDir)
      if (owned.length > 0)
        configObj.ownedRoutes = owned
    }
    catch {
      // Undiscoverable — leave the key off.
    }

    if (Object.keys(configObj).length > 0) {
      // Escaped, not just stringified. This was the one `<script>` injection
      // site in the codebase with no escaping at all — the other five
      // (spa-shell, appearance-bootstrap, color-mode-boot, misc-directives,
      // bun-plugin/serve) all have it.
      //
      // Reachable via the `router` config block, whose string values are copied
      // in verbatim: a `container` selector containing `</script>` ends the
      // element and the rest lands in the document as markup. The `ownedRoutes`
      // table added here in #1864 turns out NOT to be a vector — the regex
      // compiler escapes `/` as `\/`, so a route path emits `<\/script>` — but
      // that is an accident of regex serialisation, not a guarantee worth
      // relying on. See #1849.
      configScript = `<script>window.__stxRouterConfig=${toScriptJson(configObj)};</script>\n`
    }
  }

  // Build mode: emit a placeholder reference instead of inlining the full router script.
  const { getCachedRouterScript } = await import('./caching')
  const routerScript = options?.buildMode === 'compile'
    ? `<script data-stx-router src="/__stx/router.__STX_HASH__.js"></script>`
    : options?.buildMode === 'serve'
      ? `<script data-stx-router src="/_stx/router.js"></script>`
      : `<script data-stx-router>${await getCachedRouterScript()}</script>`

  // Use string concatenation to avoid $-interpretation in .replace()
  const bodyCloseIdx = template.lastIndexOf('</body>')
  return template.slice(0, bodyCloseIdx) + configScript + routerScript + '\n</body>' + template.slice(bodyCloseIdx + 7)
}
