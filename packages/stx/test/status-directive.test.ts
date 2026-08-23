/**
 * `@status(code)` — a view declaring its own HTTP status.
 *
 * The gap this closes: a view rendered by stx always answered 200. A dynamic
 * route that could not resolve its parameter — `features/[slug].stx` for a slug
 * that names no feature — rendered "no feature by that name" under a 200, which
 * tells a crawler, a cache and an uptime check that the URL is a real page. The
 * only expressible part of a 404 from inside a template was
 * `<meta name="robots" content="noindex">`, and applications were writing it.
 *
 * `<script server>`'s `setResponseStatus` / `notFound` are the other spelling.
 * The directive exists because the decision usually belongs *beside* the markup
 * that explains it, inside the branch that already knows:
 *
 *     @if (!feature)
 *       @status(404)
 *       <h1>No feature by that name.</h1>
 *     @endif
 *
 * which is why the ordering below — after `processConditionals` — is pinned as
 * behaviour rather than left to whoever next reorders the pipeline.
 */

import { describe, expect, it } from 'bun:test'
import { renderTemplate } from '../src/render'
import { processStatusDirective, readResponseStatus } from '../src/page-response'

/** Render a template from a string, the way a host that mounts views does. */
async function render(source: string, context: Record<string, any> = {}): Promise<{ html: string, status?: number }> {
  const file = `${import.meta.dir}/.tmp-status-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)

  const shared: Record<string, any> = { ...context }
  try {
    const html = await renderTemplate(file, { context: shared })
    return { html, status: readResponseStatus(shared) }
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

const FEATURE_PAGE = (feature: string): string => `<script server>
const feature = ${feature}
</script>
<main>
@if (!feature)
  @status(404)
  <h1>No feature by that name.</h1>
@else
  <h1>{{ feature.title }}</h1>
@endif
</main>`

describe('@status inside a conditional', () => {
  it('fires in the branch that rendered', async () => {
    const { html, status } = await render(FEATURE_PAGE('null'))

    expect(status).toBe(404)
    expect(html).toContain('No feature by that name.')
    // The directive itself never reaches the browser.
    expect(html).not.toContain('@status')
  })

  it('does not fire from a branch that lost', async () => {
    // The whole reason the pass runs after the conditionals. A `@status` in the
    // dead branch is already gone from the template by then, so the page that
    // found its record answers 200 without having to say so.
    const { html, status } = await render(FEATURE_PAGE(`{ title: 'Queues' }`))

    expect(status).toBeUndefined()
    expect(html).toContain('Queues')
  })
})

describe('@status', () => {
  it('takes a bare literal', async () => {
    expect((await render(`@status(410)\n<p>gone</p>`)).status).toBe(410)
  })

  it('takes an expression against the server scope', async () => {
    const { status } = await render(`<script server>
const found = false
</script>
@status(found ? 200 : 404)
<p>looked</p>`)

    expect(status).toBe(404)
  })

  it('takes the last one, so a page can decide late', async () => {
    expect((await render(`@status(404)\n<p>x</p>\n@status(200)`)).status).toBe(200)
  })

  it('ignores an argument that is not an HTTP status, rather than failing the page', async () => {
    // A status is not worth losing a rendered page over. It is warned about,
    // because unlike a runtime call this one was typed into the template and a
    // silent no-op there reads as the feature not existing.
    const { html, status } = await render(`@status(9999)\n<p>still here</p>`)

    expect(status).toBeUndefined()
    expect(html).toContain('still here')
  })

  it('leaves a page that never uses it alone', async () => {
    expect((await render(`<p>ordinary</p>`)).status).toBeUndefined()
  })
})

describe('the directive parser', () => {
  const status = (template: string, context: Record<string, any> = {}): number | undefined => {
    const ctx = { ...context }
    processStatusDirective(template, ctx)
    return readResponseStatus(ctx)
  }

  it('reads an argument containing parentheses', () => {
    expect(status(`@status(Number('410'))`, { Number })).toBe(410)
  })

  it('reads an argument containing a quoted parenthesis', () => {
    expect(status(`@status(')' ? 404 : 200)`)).toBe(404)
  })

  it('leaves an unclosed directive exactly as written', () => {
    // Scanning to the end of the file for a `)` that is not there would turn a
    // typo into a blank page.
    const ctx: Record<string, any> = {}
    const template = `@status(404\n<p>rest of the page</p>`

    expect(processStatusDirective(template, ctx)).toBe(template)
    expect(readResponseStatus(ctx)).toBeUndefined()
  })

  it('does not leave the blank line the directive sat on', () => {
    expect(processStatusDirective('<p>a</p>\n@status(404)\n<p>b</p>', {})).toBe('<p>a</p>\n<p>b</p>')
  })

  it('is skipped when precompiling, because the build has no request', () => {
    // `stx build` runs the pipeline once with no request, so the branch a
    // `@status` sits in was chosen by a build-time guess. Baking that would
    // hand every visitor the answer the build happened to compute.
    const ctx: Record<string, any> = {}
    processStatusDirective('@status(404)', ctx, { buildMode: 'compile' })

    expect(readResponseStatus(ctx)).toBeUndefined()
  })
})
