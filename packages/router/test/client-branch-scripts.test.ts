/**
 * A component under :if gets its setup on a page reached by a link.
 *
 * On a whole page, a component used as `<Card :if="ready" />` sits in a
 * `<template :if>` with its setup scripts, and the browser runs them when the
 * runtime clones the branch into the page. A fragment's scripts were all made
 * inert placeholders for the router to run itself, but one inside
 * template.content is out of document.querySelector's reach, so nobody ran it:
 * the branch drew the component's markup with no scope behind it. In HQ the
 * home page's Oura card (`<OuraRecovery :if="hasTraining" />`) stayed empty
 * whenever home was reached by the router, and the page came back shorter
 * than it was left, so Back could not restore the place.
 *
 * Such a placeholder is now an ordinary script again, for the branch to run as
 * a whole page would, and the router leaves it alone. A loop template keeps
 * its scripts inert: bindFor runs those once per row.
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

function installRouter(fragment: string) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`
    <html>
      <head>
        <meta name="stx-layout" content="layouts/app.stx">
        <meta name="stx-layout-group" content="app">
      </head>
      <body><main>Home</main></body>
    </html>
  `)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false, announceRoute: false }
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async () => new Response(fragment, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app.stx',
        'X-STX-Layout-Group': 'app',
      },
    }),
  })
  new Function(getRouterScript())()
  return window as any
}

async function navigate(window: any, url = '/next') {
  await window.stxRouter.navigate(url)
  await new Promise(r => setTimeout(r, 200))
}

/** Scripts the router ran itself (it marks each with data-stx-page). */
function ranByRouter(window: any, needle: string): number {
  return Array.from(window.document.querySelectorAll('script[data-stx-page]'))
    .filter((s: any) => (s.textContent || '').includes(needle)).length
}

/** The scripts a template holds for its branch, with their type. */
function templateWith(root: any, attribute: string): any {
  return Array.from(root.querySelectorAll('template')).find((t: any) => t.hasAttribute(attribute))
}

function branchScripts(window: any, attribute: string): Array<{ type: string | null, text: string, owner: string | null }> {
  const template = templateWith(window.document.querySelector('main'), attribute)
  return Array.from(template?.content?.querySelectorAll('script') || []).map((s: any) => ({
    type: s.getAttribute('type'),
    text: s.textContent || '',
    owner: s.getAttribute('data-stx-owner'),
  }))
}

const componentScripts = (scope: string, sentinel: string) =>
  `<div data-stx-scope="${scope}">card</div>`
  + `<script data-stx-scoped data-stx-run="always" data-stx-owner="${scope}">${sentinel}("${scope}")<\/script>`

describe('router: component setup inside an :if branch', () => {
  it('hands the branch its scripts as scripts, the way a whole page has them', async () => {
    const window = installRouter(`<section>Body</section><template :if="ready">${componentScripts('stx_card_1_next', 'SENTINEL_BRANCH')}</template>`)
    await navigate(window)
    expect(window.document.querySelector('main')?.textContent).toContain('Body')
    const scripts = branchScripts(window, ':if')
    expect(scripts).toHaveLength(1)
    // Executable: no inert type left on it, its code and owner intact.
    expect(scripts[0].type).toBeNull()
    expect(scripts[0].text).toContain('SENTINEL_BRANCH')
    expect(scripts[0].owner).toBe('stx_card_1_next')
    // And not run early by the router: the branch runs it when drawn.
    expect(ranByRouter(window, 'SENTINEL_BRANCH')).toBe(0)
  })

  it('does the same for an :else branch and a branch nested in one', async () => {
    const window = installRouter(
      '<section>Body</section>'
      + `<template :if="a"><p>a</p></template><template :else><template :if="b">${componentScripts('stx_inner_1_next', 'SENTINEL_NESTED')}</template></template>`,
    )
    await navigate(window)
    const outer = templateWith(window.document.querySelector('main'), ':else')
    const inner = outer?.content?.querySelector('template')
    const script = inner?.content?.querySelector('script')
    expect(script?.textContent).toContain('SENTINEL_NESTED')
    expect(script?.getAttribute('type')).toBeNull()
    expect(ranByRouter(window, 'SENTINEL_NESTED')).toBe(0)
  })

  it('leaves a loop template\'s scripts inert for bindFor', async () => {
    const window = installRouter(`<section>Body</section><template :for="item in items">${componentScripts('stx_row_1_next', 'SENTINEL_ROW')}</template>`)
    await navigate(window)
    const scripts = branchScripts(window, ':for')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].type).toBe('application/stx-pending')
  })

  it('still runs a component script on the page itself', async () => {
    const window = installRouter(`<section>${componentScripts('stx_card_2_next', 'SENTINEL_PAGE')}</section>`)
    await navigate(window)
    expect(ranByRouter(window, 'SENTINEL_PAGE')).toBe(1)
  })
})
