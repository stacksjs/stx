/**
 * Active matching compares the query, not just the path (stacksjs/stx#2017).
 *
 * Query-string links are how filter chips, tab bars and sort controls are
 * normally built. At `/list?status=up` a bare `/list` reported itself EXACT —
 * because the exact test only checked that every param the LINK names is
 * present here, and a link with no params satisfies that trivially. So the
 * unfiltered chip took `exact-active-class` and `aria-current="page"` from the
 * chip the user was actually on, and a screen reader was told the wrong link
 * was the current page.
 *
 * The reporter measured 49 query-carrying router links across four apps, and
 * one dashboard with 28 filter chips across 10 views all of the form
 * `?status=`, `?type=`, `?range=`.
 *
 * Exact now means the two carry the SAME params, in both directions. Active
 * stays prefix-based on the path, so a nav entry can still be active while the
 * page adds filters without claiming to be the exact page.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterEach(() => {
  closeBrowser()
})

/** The chips from the report, plus two cases its suggestion implies. */
const CHIPS = '<div id="chips">'
  + '<a href="/list?status=up" data-stx-link class="chip" id="up">Up</a>'
  + '<a href="/list?status=down" data-stx-link class="chip" id="down">Down</a>'
  + '<a href="/list" data-stx-link class="chip" id="all">All</a>'
  + '<a href="/list?status=up&sort=name" data-stx-link class="chip" id="narrower">Narrower</a>'
  + '</div>'

const FILES = (chrome: string) => ({
  'layouts/app.stx': layout(chrome),
  'pages/list.stx': page('app', '<div id="list">list</div>'),
})

const ROUTES = { '/list': 'pages/list.stx' }

interface Seen {
  classes: string[]
  current: string | null
}

async function at(url: string, chrome = CHIPS): Promise<{ of: (id: string) => Seen, dispose: () => Promise<void> }> {
  const app = await renderApp(FILES(chrome), ROUTES)
  const browser = await boot(app, url)
  await settle()
  return {
    of: (id: string) => {
      const el = browser.window.document.getElementById(id)
      return {
        classes: (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean),
        current: el?.getAttribute('aria-current') ?? null,
      }
    },
    dispose: () => app.dispose(),
  }
}

describe('#2017 — a filter chip is active for its own query', () => {
  it('marks the chip whose query is in effect, and only that one', async () => {
    const seen = await at('/list?status=up')
    try {
      expect(seen.of('up').classes).toContain('exact-active')
      expect(seen.of('up').classes).toContain('active')
      expect(seen.of('up').current).toBe('page')

      // A sibling filter is neither.
      expect(seen.of('down').classes).toEqual(['chip'])
      expect(seen.of('down').current).toBeNull()
    }
    finally {
      await seen.dispose()
    }
  })

  /*
   * The headline symptom. `/list` carries no params, so the old exact test
   * passed vacuously and the unfiltered link claimed to be the current page -
   * taking aria-current from the chip the user was on.
   */
  it('does not let an unfiltered link claim to be the current page', async () => {
    const seen = await at('/list?status=up')
    try {
      expect(seen.of('all').classes).not.toContain('exact-active')
      expect(seen.of('all').current).toBeNull()
      // …while still being ACTIVE, which is the point of the distinction: a nav
      // entry stays lit while the page adds filters.
      expect(seen.of('all').classes).toContain('active')
    }
    finally {
      await seen.dispose()
    }
  })

  /*
   * The other direction, which the one-way test already handled and which has
   * to keep working: a link asking for a param the location does not have is
   * not active at all.
   */
  it('leaves a narrower link inactive', async () => {
    const seen = await at('/list?status=up')
    try {
      expect(seen.of('narrower').classes).toEqual(['chip'])
      expect(seen.of('narrower').current).toBeNull()
    }
    finally {
      await seen.dispose()
    }
  })

  it('marks the unfiltered link exact when no filter is in effect', async () => {
    const seen = await at('/list')
    try {
      expect(seen.of('all').classes).toContain('exact-active')
      expect(seen.of('all').current).toBe('page')
      // And no filter chip is current.
      expect(seen.of('up').current).toBeNull()
      expect(seen.of('down').current).toBeNull()
    }
    finally {
      await seen.dispose()
    }
  })

  /*
   * The workaround trap from the report, which was worse than the bug.
   *
   * `markCurrent` only cleared `aria-current` when the value was exactly
   * 'page', so a consumer who stamped `aria-current="true"` server-side to
   * compensate for the missing attribute kept it forever - the router neither
   * updated nor removed it, and it named the wrong link from then on. Both
   * values say "this is the current one" with no further meaning, so both are
   * now the router's to clear. The role-specific values are still left alone.
   */
  it('clears a server-stamped aria-current="true" on a link that is not current', async () => {
    const stamped = '<div id="chips">'
      + '<a href="/list?status=up" data-stx-link class="chip" id="up">Up</a>'
      + '<a href="/list?status=down" data-stx-link class="chip" id="down" aria-current="true">Down</a>'
      + '<a href="/list?status=held" data-stx-link class="chip" id="held" aria-current="step">Held</a>'
      + '</div>'
    const seen = await at('/list?status=up', stamped)
    try {
      expect(seen.of('down').current).toBeNull()
      expect(seen.of('up').current).toBe('page')
      // Not the router's to interpret: a wizard step, a sort direction.
      expect(seen.of('held').current).toBe('step')
    }
    finally {
      await seen.dispose()
    }
  })

  /*
   * Inside a <nav>, updateNav has the last word and narrows active to the
   * link's own page - which is existing, deliberate policy, not part of this
   * bug. Asserted so the two passes are not accidentally unified later.
   */
  it('keeps a nav link lit only for its own query', async () => {
    const nav = `<nav>${CHIPS.slice('<div id="chips">'.length, -'</div>'.length)}</nav>`
    const seen = await at('/list?status=up', nav)
    try {
      expect(seen.of('up').classes).toContain('active')
      expect(seen.of('up').current).toBe('page')
      expect(seen.of('all').classes).not.toContain('active')
    }
    finally {
      await seen.dispose()
    }
  })
})
