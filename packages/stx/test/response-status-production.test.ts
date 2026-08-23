/**
 * A precompiled page deciding its own status.
 *
 * `setResponseStatus` shipped wired into exactly one file —
 * `packages/bun-plugin/src/serve.ts`. On the precompiled path it was worse than
 * missing: nothing put the binding in scope, so the call threw a ReferenceError
 * *inside the server script's own IIFE*, which takes every other binding in the
 * file down with it. The page then rendered its empty-state branch — the
 * not-found branch, for a page whose not-found branch is the one calling it —
 * and answered 200. It looks exactly like the feature working.
 *
 * Both halves are pinned here: the call runs without taking the script down,
 * and what it asked for survives out of `hydrateTemplateStream` for the
 * production server to answer with.
 */

import { describe, expect, it } from 'bun:test'
import { compileTemplate } from '../src/template-compiler'
import { hydrateTemplateStream } from '../src/template-hydrator'

/** Compile a page from source, the way `stx build` does. */
async function compile(source: string, route = '/features/:slug') {
  const file = `${import.meta.dir}/.tmp-prod-status-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)
  try {
    return await compileTemplate(file, route)
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

const LOOKUP_PAGE = `<script server>
const known = { queues: 'Queues' }
const title = known[params.slug]
if (!title)
  notFound()
const heading = title ?? 'No feature by that name.'
</script>
<h1>{{ heading }}</h1>`

describe('notFound() on the precompiled path', () => {
  it('does not take the rest of the server script down with it', async () => {
    // The failure this replaces: the ReferenceError killed `heading` too, so
    // the page rendered blank and read like a correct not-found.
    const compiled = await compile(LOOKUP_PAGE)
    const { html } = await hydrateTemplateStream(compiled, { params: { slug: 'nonsense' }, method: 'GET' })

    expect(html).toContain('No feature by that name.')
  })

  it('carries the status out for the server to answer with', async () => {
    const compiled = await compile(LOOKUP_PAGE)
    const { status } = await hydrateTemplateStream(compiled, { params: { slug: 'nonsense' }, method: 'GET' })

    expect(status).toBe(404)
  })

  it('leaves a request that found its record answering 200', async () => {
    const compiled = await compile(LOOKUP_PAGE)
    const { html, status } = await hydrateTemplateStream(compiled, { params: { slug: 'queues' }, method: 'GET' })

    expect(status).toBeUndefined()
    expect(html).toContain('Queues')
  })

  it('decides per request, not once at build time', async () => {
    // The reason this has to be the runtime spelling rather than the directive:
    // the same compiled template answers differently for two URLs, and only the
    // hydration knows which.
    const compiled = await compile(LOOKUP_PAGE)
    const missing = await hydrateTemplateStream(compiled, { params: { slug: 'nope' }, method: 'GET' })
    const found = await hydrateTemplateStream(compiled, { params: { slug: 'queues' }, method: 'GET' })

    expect([missing.status, found.status]).toEqual([404, undefined])
  })
})

describe('setResponseStatus and setResponseHeader on the precompiled path', () => {
  it('carry both halves, so a redirect can name its destination', async () => {
    const compiled = await compile(`<script server>
setResponseStatus(301)
setResponseHeader('Location', '/features/queues')
const note = 'moved'
</script>
<p>{{ note }}</p>`, '/features/jobs')

    const { html, status, headers } = await hydrateTemplateStream(compiled, { method: 'GET' })

    expect(html).toContain('moved')
    expect(status).toBe(301)
    expect(headers).toEqual({ Location: '/features/queues' })
  })
})

describe('definePageMeta({ status }) on the precompiled path', () => {
  it('survives the build onto the compiled template', async () => {
    // A page that is always an error page says so statically. The production
    // server reads it off the compiled template, including for a page with no
    // server script at all, which has no other way to say it.
    const compiled = await compile(`<script server>
definePageMeta({ title: 'Gone', status: 410 })
</script>
<h1>Gone</h1>`, '/410')

    expect(compiled.status).toBe(410)
  })

  it('is undefined for a page that declared nothing', async () => {
    expect((await compile(`<h1>Home</h1>`, '/')).status).toBeUndefined()
  })
})
