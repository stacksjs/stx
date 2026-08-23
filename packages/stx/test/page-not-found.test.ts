import { describe, expect, it } from 'bun:test'
import { readResponseStatus, responseBindings } from '../src/page-response'

/**
 * `notFound()` in a page's server scope.
 *
 * The status a dynamic page most often needs to set is the one for "the record
 * named in this URL does not exist", and `setResponseStatus(404)` spelled out
 * every time is how pages end up not setting it at all: the lookup misses, the
 * page falls back to some other record, and it answers 200 for a URL that names
 * nothing. Typos and retired records then get indexed as real pages and a
 * crawler never learns they are gone.
 *
 * Against the real bindings, not a copy of them. The copy this file used to
 * carry passed for a release in which `notFound` was declared for the type
 * checker, implemented in `render.ts`, and read by no server at all.
 */

/** A page's context and the bindings its server script is handed. */
function pageContext() {
  const ctx: Record<string, any> = {}
  return { ctx, ...responseBindings(ctx) }
}

describe('notFound', () => {
  it('records a 404 with no argument', () => {
    const page = pageContext()
    page.notFound()

    expect(readResponseStatus(page.ctx)).toBe(404)
  })

  it('takes a neighbouring status, so gone reads the same way as missing', () => {
    const page = pageContext()
    page.notFound(410)

    expect(readResponseStatus(page.ctx)).toBe(410)
  })

  it('falls back to 404 rather than recording nonsense', () => {
    // A typo must not leave the page answering 200, which is the whole failure
    // this exists to prevent.
    for (const bad of [0, 200, 99, 600, Number.NaN, -1, 1.5]) {
      const page = pageContext()
      page.notFound(bad as number)
      expect(readResponseStatus(page.ctx)).toBe(404)
    }
  })

  it('agrees with setResponseStatus(404)', () => {
    const viaHelper = pageContext()
    viaHelper.notFound()
    const viaStatus = pageContext()
    viaStatus.setResponseStatus(404)

    expect(viaHelper.ctx).toEqual(viaStatus.ctx)
  })

  it('records nothing until it is called', () => {
    // A page that never calls it keeps whatever status the host chose.
    expect(readResponseStatus(pageContext().ctx)).toBeUndefined()
  })
})

describe('setResponseStatus', () => {
  it('takes the last call, so a page can look, decide, then change its mind', () => {
    const page = pageContext()
    page.notFound()
    page.setResponseStatus(200)

    expect(readResponseStatus(page.ctx)).toBe(200)
  })

  it('ignores a status outside the HTTP range rather than throwing', () => {
    const page = pageContext()
    page.setResponseStatus(999)
    page.setResponseStatus(-1)

    expect(readResponseStatus(page.ctx)).toBeUndefined()
  })
})

describe('setResponseHeader', () => {
  it('accumulates, so a 301 can carry its Location', () => {
    const page = pageContext()
    page.setResponseStatus(301)
    page.setResponseHeader('Location', '/features/queues')
    page.setResponseHeader('X-Robots-Tag', 'noindex')

    expect(page.ctx.__stxResponseHeaders).toEqual({
      'Location': '/features/queues',
      'X-Robots-Tag': 'noindex',
    })
  })

  it('ignores a nameless header rather than recording an empty key', () => {
    const page = pageContext()
    page.setResponseHeader('   ', 'anything')

    expect(page.ctx.__stxResponseHeaders).toBeUndefined()
  })
})
