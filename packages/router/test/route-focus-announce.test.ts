/**
 * SPA navigation moves focus and announces the route (stacksjs/stx#1862).
 *
 * A fragment swap replaces content without a document load, so the browser
 * does none of what it normally does for a navigation:
 *
 *   - focus stays on the link that was clicked, which no longer exists, so the
 *     browser resets it to <body> — a keyboard user is silently returned to
 *     the top of the tab order on every navigation;
 *   - no screen reader says anything, because nothing in the accessibility
 *     tree changed in a way it watches, so there is no signal the page changed.
 *
 * `grep -n 'focus\|aria-live\|announce'` over the whole 1400-line router
 * returned nothing before this change. Neither problem is fixable from app
 * code, because only the router knows a navigation happened.
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
  MouseEvent: globalThis.MouseEvent,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

const FRAGMENT_HEADERS = {
  'X-STX-Fragment': 'true',
  'X-STX-Layout': 'layouts/default.stx',
  'X-STX-Layout-Group': 'default',
}

function installRouter(fragment: string, config: Record<string, unknown> = {}, title = 'Dashboard') {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`<html><head><title>Home</title>
    <meta name="stx-layout" content="layouts/default.stx">
    <meta name="stx-layout-group" content="default">
  </head><body><a id="src" data-stx-link href="/dashboard">Go</a><main>Home</main></body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
    progress: false,
    viewTransitions: false,
    ...config,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: async () => new Response(fragment, {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'X-STX-Title': title, ...FRAGMENT_HEADERS },
    }),
  })

  new Function(getRouterScript())()
  return window as any
}

const settle = () => new Promise(r => setTimeout(r, 220))

describe('focus management on SPA navigation (#1862)', () => {
  it('moves focus into the new content', async () => {
    const window = installRouter('<h1>Dashboard</h1><p>body</p>')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    const main = window.document.querySelector('main')
    expect(window.document.activeElement).toBe(main)
  })

  it('makes the container programmatically focusable without adding it to the tab order', async () => {
    const window = installRouter('<h1>Dashboard</h1>')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    // tabindex="-1" is focusable via script but skipped when tabbing. A 0 here
    // would insert the whole container into the tab order on every page.
    expect(window.document.querySelector('main')?.getAttribute('tabindex')).toBe('-1')
  })

  it('does not overwrite a tabindex the page already set', async () => {
    const window = installRouter('<h1>Dashboard</h1>')
    window.document.querySelector('main').setAttribute('tabindex', '0')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.document.querySelector('main')?.getAttribute('tabindex')).toBe('0')
  })

  it('can be turned off', async () => {
    const window = installRouter('<h1>Dashboard</h1>', { routeFocus: false })

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.document.querySelector('main')?.hasAttribute('tabindex')).toBe(false)
  })
})

describe('route announcement (#1862)', () => {
  it('creates a polite live region', async () => {
    const window = installRouter('<h1>Dashboard</h1>')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    const announcer = window.document.getElementById('stx-route-announcer')
    expect(announcer).not.toBeNull()
    expect(announcer.getAttribute('aria-live')).toBe('polite')
    expect(announcer.getAttribute('role')).toBe('status')
  })

  it('announces the destination heading', async () => {
    const window = installRouter('<h1>Billing settings</h1><p>x</p>')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.document.getElementById('stx-route-announcer').textContent)
      .toBe('Billing settings')
  })

  it('falls back to the document title when the page has no h1', async () => {
    const window = installRouter('<p>no heading here</p>', {}, 'Reports')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.document.getElementById('stx-route-announcer').textContent)
      .toBe('Reports')
  })

  it('is hidden visually but not from assistive technology', async () => {
    const window = installRouter('<h1>Dashboard</h1>')

    await window.stxRouter.navigate('/dashboard')
    await settle()

    const style = window.document.getElementById('stx-route-announcer').style
    // display:none and visibility:hidden are both skipped by screen readers,
    // which would make the whole region a silent no-op that still looks
    // correct in the DOM.
    expect(style.display).not.toBe('none')
    expect(style.visibility).not.toBe('hidden')
    expect(style.position).toBe('absolute')
  })

  it('reuses one region across navigations instead of stacking them', async () => {
    const window = installRouter('<h1>Dashboard</h1>')

    await window.stxRouter.navigate('/dashboard')
    await settle()
    await window.stxRouter.navigate('/reports')
    await settle()

    expect(window.document.querySelectorAll('#stx-route-announcer')).toHaveLength(1)
  })

  it('can be turned off', async () => {
    const window = installRouter('<h1>Dashboard</h1>', { announceRoute: false })

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.document.getElementById('stx-route-announcer')).toBeNull()
  })

  // A heading built from page state is the server's template until the
  // runtime binds it, which happens after stx:load. Read at the swap, screen
  // readers heard "{{ greeting }}, {{ firstName }}" (HQ's /home), and
  // "{{ navTitle() }}" on every /m screen.
  function bindOnLoad(window: any, render: () => void, delay = 5): void {
    // The runtime's own stx:load handler binds after a short debounce.
    window.addEventListener('stx:load', () => setTimeout(render, delay))
  }

  function recordAnnouncements(window: any): string[] {
    const heard: string[] = []
    const timer = setInterval(() => {
      const text = window.document.getElementById('stx-route-announcer')?.textContent
      if (text && heard[heard.length - 1] !== text)
        heard.push(text)
    }, 1)
    setTimeout(() => clearInterval(timer), 2500)
    return heard
  }

  it('announces the heading as bound, not its template', async () => {
    const window = installRouter('<h1 id="greet">{{ greeting }}, {{ firstName }}</h1><p>x</p>')
    bindOnLoad(window, () => { window.document.getElementById('greet').textContent = 'Good morning, Chris' })
    const heard = recordAnnouncements(window)

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.document.getElementById('stx-route-announcer').textContent).toBe('Good morning, Chris')
    expect(heard).toEqual(['Good morning, Chris'])
  })

  it('waits for a heading that binds later than stx:load', async () => {
    const window = installRouter('<h1 id="season">{{ seasonLabel }}</h1>')
    bindOnLoad(window, () => { window.document.getElementById('season').textContent = '2026 season' }, 120)
    const heard = recordAnnouncements(window)

    await window.stxRouter.navigate('/dashboard')
    await new Promise(r => setTimeout(r, 400))

    expect(heard).toEqual(['2026 season'])
  })

  it('falls back to the title when the heading never binds', async () => {
    const window = installRouter('<h1>{{ editingId ? \'Edit Workout\' : \'New Workout\' }}</h1>', {}, 'Workout builder')
    const heard = recordAnnouncements(window)

    await window.stxRouter.navigate('/dashboard')
    await new Promise(r => setTimeout(r, 1800))

    expect(heard).toEqual(['Workout builder'])
  })

  it('never announces an unrendered @{ } block or title', async () => {
    const window = installRouter('<h1>@{ navTitle() }</h1>', {}, '{{ navTitle() }}')
    const heard = recordAnnouncements(window)

    await window.stxRouter.navigate('/dashboard')
    await new Promise(r => setTimeout(r, 1800))

    expect(heard).toEqual([])
  })
})

