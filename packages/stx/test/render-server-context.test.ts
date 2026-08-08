/**
 * The server-context bindings, on the paths that are not `serve`.
 *
 * `STX_SERVER_CONTEXT` declares `setResponseStatus`, `setResponseHeader` and
 * `definePageMeta` for the type checker, and `serve.ts` implements them - so a
 * page written against them checks clean and works in development. Every other
 * path provided none of them, and calling one threw a ReferenceError *inside
 * the server script's IIFE*, which takes every other binding in that file down
 * with it.
 *
 * The failure is the reason this is pinned. A page whose not-found branch calls
 * `setResponseStatus(404)` renders "not found" for exactly the reason it
 * intended - because every variable it checks is now undefined - while every
 * other branch of the same file is silently blank. It looks like the feature
 * working, and there is nothing in the output to suggest otherwise.
 */

import { describe, expect, it } from 'bun:test'
import { renderTemplate } from '../src/render'

/** Render a template from a string, the way a host that mounts views does. */
async function render(source: string, context: Record<string, any> = {}): Promise<{ html: string, context: any }> {
  const file = `${import.meta.dir}/.tmp-server-context-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)

  // Context travels in `renderOptions.context`, and the same object is where a
  // page's request for a status is recorded - so the caller reads it back off
  // the object it handed in.
  const shared: any = { ...context }

  try {
    const html = await renderTemplate(file, { context: shared })

    return { html, context: shared }
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

describe('a page that calls setResponseStatus', () => {
  it('still gets every other variable in its script', async () => {
    // The whole bug. Before this, the call threw and `title` was undefined, so
    // the page rendered its empty branch and read as a correct answer.
    const { html } = await render(`<script server>
const title = 'a-distinctive-title'
setResponseStatus(404)
</script>
<h1>{{ title }}</h1>`)

    expect(html).toContain('a-distinctive-title')
  })

  it('records the status, so a host can answer with it', async () => {
    const { context } = await render(`<script server>
setResponseStatus(404)
const ok = true
</script>
<p>{{ ok }}</p>`)

    expect(context.__stxResponseStatus).toBe(404)
  })

  it('ignores a status outside the range rather than throwing', async () => {
    // A status is not worth failing a page over, and the range check is what
    // stops a typo becoming a 500 from whatever reads it back.
    const { html, context } = await render(`<script server>
const title = 'still-here'
setResponseStatus(9999)
</script>
<h1>{{ title }}</h1>`)

    expect(html).toContain('still-here')
    expect(context.__stxResponseStatus).toBeUndefined()
  })
})

describe('setResponseHeader', () => {
  it('does not take the page down, and records what was asked for', async () => {
    const { html, context } = await render(`<script server>
const title = 'header-page'
setResponseHeader('X-Robots-Tag', 'noindex')
</script>
<h1>{{ title }}</h1>`)

    expect(html).toContain('header-page')
    expect(context.__stxResponseHeaders).toEqual({ 'X-Robots-Tag': 'noindex' })
  })
})

describe('definePageMeta', () => {
  it('is callable without a host', async () => {
    const { html } = await render(`<script server>
definePageMeta({ status: 404 })
const title = 'meta-page'
</script>
<h1>{{ title }}</h1>`)

    expect(html).toContain('meta-page')
  })
})

describe('what is deliberately not defaulted', () => {
  it('a real context still wins', async () => {
    // The serve path passes its own implementations through
    // `renderOptions.context`, and they must override these defaults rather
    // than the other way round.
    let seen = 0

    const file = `${import.meta.dir}/.tmp-override-${crypto.randomUUID()}.stx`
    await Bun.write(file, `<script server>
setResponseStatus(418)
const title = 'override'
</script>
<h1>{{ title }}</h1>`)

    try {
      const context: any = { setResponseStatus: (s: number) => { seen = s } }
      const html = await renderTemplate(file, { context })

      expect(html).toContain('override')
      expect(seen).toBe(418)
      // The default did not also fire.
      expect(context.__stxResponseStatus).toBeUndefined()
    }
    finally {
      await Bun.file(file).delete().catch(() => {})
    }
  })
})

/**
 * `useRoute().query` on a host that supplies the query already parsed.
 *
 * Two hosts render stx and they hand it the query string in different shapes.
 * The dev server sets `__stxServeSearch` (or `__stxServeContext.search`) as the
 * raw `?a=b`; bun-router's file-based `serve()` sets neither, and instead puts
 * an already-parsed `query` object on the context - the same way it supplies
 * `params`, which `useRoute()` was already reading directly.
 *
 * Reading only the string meant `useRoute().query` was `{}` on the second host,
 * with nothing to suggest it: a page keyed on `?token=…` rendered its no-token
 * branch, which is a real branch that looks entirely correct. On the boot a
 * production server and an e2e suite both use.
 */
describe('useRoute().query', () => {
  it('reads the raw search string when the host supplies one', async () => {
    const { html } = await render(
      `<script server>
const q = useRoute().query
</script>
<p>{{ q.token }}</p>`,
      { __stxServeSearch: '?token=from-the-string' },
    )

    expect(html).toContain('from-the-string')
  })

  it('and the parsed object when the host supplies that instead', async () => {
    const { html } = await render(
      `<script server>
const q = useRoute().query
</script>
<p>{{ q.token }}</p>`,
      { query: { token: 'from-the-object' } },
    )

    expect(html).toContain('from-the-object')
  })

  it('prefers the string, which is the more specific of the two', async () => {
    const { html } = await render(
      `<script server>
const q = useRoute().query
</script>
<p>{{ q.token }}</p>`,
      { __stxServeSearch: '?token=from-the-string', query: { token: 'from-the-object' } },
    )

    expect(html).toContain('from-the-string')
  })

  it('is an empty object when there is no query at all', async () => {
    const { html } = await render(`<script server>
const empty = Object.keys(useRoute().query).length === 0
</script>
<p>{{ empty }}</p>`)

    expect(html).toContain('true')
  })

  it('puts the query back on fullPath when only the parsed object was given', async () => {
    // Otherwise `fullPath` is silently the path alone, which reads as a page
    // that was reached without one.
    const { html } = await render(
      `<script server>
const full = useRoute().fullPath
</script>
<p>{{ full }}</p>`,
      { __stxServeContext: { path: '/forgot-password' }, query: { token: 'abc' } },
    )

    expect(html).toContain('/forgot-password?token=abc')
  })
})
