import { describe, expect, it } from 'bun:test'

/**
 * `notFound()` in a page's server scope.
 *
 * The status a dynamic page most often needs to set is the one for "the record
 * named in this URL does not exist", and `setResponseStatus(404)` spelled out
 * every time is how pages end up not setting it at all: the lookup misses, the
 * page falls back to some other record, and it answers 200 for a URL that names
 * nothing. Typos and retired records then get indexed as real pages and a
 * crawler never learns they are gone.
 */

/** The recorder the render context uses. */
function pageContext() {
  const ctx: Record<string, unknown> = {}
  const record = (key: string, value: unknown) => { ctx[key] = value }

  return {
    ctx,
    setResponseStatus: (status: number) => {
      if (Number.isInteger(status) && status >= 100 && status <= 599)
        record('__stxResponseStatus', status)
    },
    notFound: (status: number = 404) => {
      const code = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 404
      record('__stxResponseStatus', code)
    },
  }
}

describe('notFound', () => {
  it('records a 404 with no argument', () => {
    const page = pageContext()
    page.notFound()

    expect(page.ctx.__stxResponseStatus).toBe(404)
  })

  it('takes a neighbouring status, so gone reads the same way as missing', () => {
    const page = pageContext()
    page.notFound(410)

    expect(page.ctx.__stxResponseStatus).toBe(410)
  })

  it('falls back to 404 rather than recording nonsense', () => {
    // A typo must not leave the page answering 200, which is the whole failure
    // this exists to prevent.
    for (const bad of [0, 200, 99, 600, Number.NaN, -1, 1.5]) {
      const page = pageContext()
      page.notFound(bad as number)
      expect(page.ctx.__stxResponseStatus).toBe(404)
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
    expect(pageContext().ctx.__stxResponseStatus).toBeUndefined()
  })
})
