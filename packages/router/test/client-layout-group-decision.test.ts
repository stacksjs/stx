/**
 * A full-document swap honours the layout decision that caused it
 * (stacksjs/stx#1833).
 *
 * Navigating across layout GROUPS is supposed to replace the whole `<body>`, so
 * the destination gets its own chrome. Instead the destination's `<main>` was
 * dropped into the previous page's nav and footer — the same URL rendering
 * differently depending on how the user arrived.
 *
 * The reported mechanism was that `checkLayoutChange` never fires on a cold
 * click. It does. The post-response check reads `X-STX-Layout-Group`, returns
 * true, and the router pays for a second full-document fetch. What goes wrong
 * is what happens next: `swap()` re-derives the same decision from `<meta>`
 * tags, gets the opposite answer, and takes the container-only branch. The
 * router discards the reason it made the fetch.
 *
 * The two sources disagree more easily than they look:
 *
 *   - the bun-plugin serve path calls a layout-less page `default` while the
 *     client's own fallback calls it `app`;
 *   - a `<head>` carrying attributes silently skipped the meta injection
 *     entirely, so the page shipped with no layout metas;
 *   - the i18n path rewrites every page's group to `i18n:<locale>`.
 *
 * Any one of those leaves the metas saying "unchanged" about a document the
 * headers said had changed. So the server's answer now wins inside `swap()`.
 *
 * Worth noting for anyone reading the original report: `performance.timeOrigin`
 * being unchanged proves only that no BROWSER NAVIGATION happened. It is
 * equally true of the correct full-document swap, which replaces the body
 * in-place — so it cannot distinguish the two, and the evidence there was not
 * evidence of a fragment swap.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const originalGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  location: globalThis.location,
  history: globalThis.history,
  fetch: globalThis.fetch,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

interface Setup {
  /** `<head>` of the page being navigated FROM. */
  currentHead: string
  /** `<head>` of the full document the server returns. */
  documentHead: string
  /** Layout headers on the fragment response. */
  headers: Record<string, string>
}

/**
 * `<body>` is kept bare on both sides deliberately: very-happy-dom's
 * `attributes` collection yields entries with no `name`, so the router's
 * body-attribute copy throws `setAttribute(undefined)` and the swap falls back
 * to `location.href` — which would make every outcome look the same.
 */
function navigate({ currentHead, documentHead, headers }: Setup) {
  const requests: string[] = []
  const window = new Window({ url: 'http://localhost/compare' })
  window.document.write(`<html><head>${currentHead}</head><body>`
    + '<nav id="src-nav">n</nav><main data-stx-content>Compare</main><footer id="src-footer">f</footer>'
    + '</body></html>')
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
    progress: false,
    viewTransitions: false,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (_url: string, init?: any) => {
      const wantsFragment = !!init?.headers?.['X-STX-Router']
      requests.push(wantsFragment ? 'fragment' : 'document')
      if (wantsFragment) {
        return new Response('<main data-stx-content>Pricing</main>', {
          headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', ...headers },
        })
      }
      return new Response(
        `<!DOCTYPE html><html><head>${documentHead}</head><body><main data-stx-content>Pricing</main></body></html>`,
        { headers: { 'Content-Type': 'text/html' } },
      )
    },
  })

  new Function(getRouterScript())()

  return {
    async go() {
      await (window as any).stxRouter.navigate('/pricing')
      await new Promise(resolve => setTimeout(resolve, 250))
      return {
        requests,
        keptOldChrome: !!window.document.querySelector('#src-nav'),
        content: window.document.querySelector('main')?.textContent?.trim(),
      }
    },
  }
}

const GROUP_CHANGED = { 'X-STX-Layout': 'default', 'X-STX-Layout-Group': 'default' }
const MARKETING_METAS = '<meta name="stx-layout" content="layouts/marketing">'
  + '<meta name="stx-layout-group" content="marketing">'

describe('the server decides, and the swap honours it', () => {
  it('replaces the chrome when neither document carries layout metas', async () => {
    // The reproducing shape: the serve path calls a layout-less page 'default'
    // while the client's fallback calls it 'app', so the headers say the group
    // changed and the metas cannot see it.
    const result = await navigate({ currentHead: '', documentHead: '', headers: GROUP_CHANGED }).go()

    expect(result.keptOldChrome).toBe(false)
    expect(result.content).toBe('Pricing')
  })

  it('replaces the chrome when the metas contradict the headers', async () => {
    // The fetched document's own metas claim the same group as the current
    // page. Before, that answer won and the fetch was wasted.
    const result = await navigate({
      currentHead: MARKETING_METAS,
      documentHead: MARKETING_METAS,
      headers: GROUP_CHANGED,
    }).go()

    expect(result.keptOldChrome).toBe(false)
  })

  it('still fetches the full document rather than swapping a fragment', async () => {
    // The decision to fetch was always right; only what followed was wrong.
    const result = await navigate({ currentHead: '', documentHead: '', headers: GROUP_CHANGED }).go()

    expect(result.requests).toEqual(['fragment', 'document'])
  })
})

describe('what must not change', () => {
  it('keeps the chrome for a same-group navigation', async () => {
    // A fragment swap is the whole point of the SPA path; forcing a body swap
    // on every hop would be its own regression.
    const result = await navigate({
      currentHead: MARKETING_METAS,
      documentHead: MARKETING_METAS,
      headers: { 'X-STX-Layout': 'layouts/marketing', 'X-STX-Layout-Group': 'marketing' },
    }).go()

    expect(result.requests).toEqual(['fragment'])
    expect(result.keptOldChrome).toBe(true)
    expect(result.content).toBe('Pricing')
  })

  it('falls back to the document metas when the server declares nothing', async () => {
    // Static hosting and older servers send no layout headers at all.
    const result = await navigate({
      currentHead: MARKETING_METAS,
      documentHead: '<meta name="stx-layout" content="layouts/default">'
        + '<meta name="stx-layout-group" content="default">',
      headers: {},
    }).go()

    expect(result.keptOldChrome).toBe(false)
  })
})
