/**
 * A page handling its own form POST, on the path that is not the dev server
 * (stacksjs/stx#1847).
 *
 * `f5f03e3291` gave a page an `action` export and wired it into exactly one
 * file — `packages/bun-plugin/src/serve.ts`. `production-server.ts`,
 * `stx/src/serve.ts` and `ssg.ts` had zero mentions of it, so a form worked
 * under `buddy dev` and silently did nothing once deployed: the POST fell
 * through to an ordinary render and answered 200 with the pre-submit markup,
 * which is indistinguishable from the action having run and found nothing
 * wrong.
 *
 * That is the same shape as most of what v0.2.156-170 spent two weeks
 * removing — code that answers 200 and does nothing — so it is pinned on the
 * production path rather than trusted to the dev server's tests.
 */

import { describe, expect, it } from 'bun:test'
import { compileTemplate } from '../src/template-compiler'
import { hydrateTemplateStream } from '../src/template-hydrator'
import { actionRedirectResponse, isActionableMethod, parseFormBody, runPageAction } from '../src/page-action'

/** Compile a page from source, the way `stx build` does. */
async function compile(source: string) {
  const file = `${import.meta.dir}/.tmp-action-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)
  try {
    return await compileTemplate(file, '/signup')
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

const submit = (body: string): Request =>
  new Request('https://example.test/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

/*
 * Note what this page does NOT do: initialise `errors` and `values` in the
 * server block. Writing `const errors = ''` for a clean GET render is the
 * natural shape, and it breaks — `compileTemplate` executes server scripts at
 * build time and freezes their values into the HTML, so both expressions
 * become the empty string and the action has nowhere to put its result. That
 * is stacksjs/stx#1895, not this feature, and the test below pins it so the
 * limitation is visible rather than folklore.
 */
const VALIDATING_PAGE = `<script server>
export async function action({ form }) {
  if (!String(form.email).includes('@'))
    return { errors: 'Enter a valid email address.', values: form.email }
  return { redirect: '/welcome' }
}
</script>
<form method="POST">
  <input name="email" value="{{ values }}">
  <p>{{ errors }}</p>
</form>`

describe('a page action on the production path', () => {
  it('renders what the action returned, not the pre-submit page', async () => {
    // The whole bug. Without this the POST renders the GET version of the page
    // and answers 200, which reads exactly like a successful submit.
    const compiled = await compile(VALIDATING_PAGE)
    const { html } = await hydrateTemplateStream(compiled, {
      request: submit('email=nope'),
      method: 'POST',
      params: {},
    })

    expect(html).toContain('Enter a valid email address.')
    expect(html).toContain('value="nope"')
  })

  it('surfaces a redirect rather than rendering a page', async () => {
    const compiled = await compile(VALIDATING_PAGE)
    const result = await hydrateTemplateStream(compiled, {
      request: submit('email=a@b.c'),
      method: 'POST',
      params: {},
    })

    expect(result.redirect).toBe('/welcome')
  })

  it('leaves a GET alone', async () => {
    // An action must never run on a page load, or every visit is a mutation.
    const compiled = await compile(VALIDATING_PAGE)
    const { html, redirect } = await hydrateTemplateStream(compiled, {
      request: new Request('https://example.test/signup'),
      method: 'GET',
      params: {},
    })

    expect(redirect).toBeUndefined()
    expect(html).not.toContain('Enter a valid email address.')
  })

  it('is inert for a page that declares no action', async () => {
    const compiled = await compile(`<script server>
const title = 'plain'
</script>
<h1>{{ title }}</h1>`)

    const { html, redirect } = await hydrateTemplateStream(compiled, {
      request: submit('anything=1'),
      method: 'POST',
      params: {},
    })

    expect(redirect).toBeUndefined()
    expect(html).toContain('plain')
  })
})

describe('the redirect a submission gets', () => {
  it('is a 303, so Back does not resubmit', async () => {
    /*
     * 303 rather than 302 deliberately: it is the status that makes the browser
     * follow up with a GET. A 302 leaves the method up to the client, and the
     * historical behaviour is a repeated POST on reload.
     */
    const response = actionRedirectResponse('/welcome')

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('/welcome')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('parsing a form body', () => {
  it('collapses a repeated field into an array', async () => {
    // Checkbox groups are the common case; keeping only the last value loses
    // every box but one, silently.
    const form = await parseFormBody(submit('tag=a&tag=b&name=x'))

    expect(form.tag).toEqual(['a', 'b'])
    expect(form.name).toBe('x')
  })

  it('reads a multipart body and skips file parts', async () => {
    const data = new FormData()
    data.set('email', 'a@b.c')
    data.set('avatar', new File(['bytes'], 'a.png', { type: 'image/png' }))

    const form = await parseFormBody(
      new Request('https://example.test/', { method: 'POST', body: data }),
    )

    expect(form.email).toBe('a@b.c')
    expect(form.avatar).toBeUndefined()
  })

  it('answers empty for a body it does not understand', async () => {
    const form = await parseFormBody(new Request('https://example.test/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email":"a@b.c"}',
    }))

    expect(form).toEqual({})
  })
})

describe('which methods run an action', () => {
  it('is every method that is not a read', () => {
    expect(isActionableMethod('POST')).toBe(true)
    expect(isActionableMethod('put')).toBe(true)
    expect(isActionableMethod('DELETE')).toBe(true)
    expect(isActionableMethod('GET')).toBe(false)
    expect(isActionableMethod('HEAD')).toBe(false)
    expect(isActionableMethod(undefined)).toBe(false)
  })
})

describe('runPageAction merges rather than replaces', () => {
  it('keeps what the server block computed for the GET render', async () => {
    // A re-render still needs the page's own data — its country list, its
    // heading — not just the action's errors.
    const context: Record<string, any> = {
      countries: ['GB', 'US'],
      heading: 'Sign up',
      action: () => ({ errors: { email: 'required' } }),
    }

    await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(context.countries).toEqual(['GB', 'US'])
    expect(context.heading).toBe('Sign up')
    expect(context.errors).toEqual({ email: 'required' })
  })

  it('reports that nothing ran when there is no action', async () => {
    const result = await runPageAction({}, { request: submit(''), method: 'POST' })

    expect(result.ran).toBe(false)
  })
})

describe('the shape everyone writes, which used to be the broken one', () => {
  it('repopulates a value the server block initialised', async () => {
    /*
     * `const errors = ''` is how anyone writes a clean GET render, and it used
     * to be the shape that silently did not work: `compileTemplate` executed
     * the server block at build time and froze both expressions to the empty
     * string, so no placeholder survived for the action to fill. The action
     * ran, returned its message, and the template had nowhere to put it.
     *
     * Fixed in stacksjs/stx#1895 — an expression reading a server-declared name
     * is a placeholder, resolved per request, instead of a baked build-time
     * value. This test asserted the broken behaviour with the issue number on
     * it, and flipped when the issue was fixed, which is what it was for.
     */
    const compiled = await compile(`<script server>
export async function action({ form }) {
  return { errors: 'Enter a valid email address.', values: form.email }
}
const errors = ''
const values = ''
</script>
<form method="POST">
  <input name="email" value="{{ values }}">
  <p>{{ errors }}</p>
</form>`)

    expect(Object.keys(compiled.placeholders).length).toBeGreaterThan(0)

    const { html } = await hydrateTemplateStream(compiled, {
      request: submit('email=nope'),
      method: 'POST',
      params: {},
    })

    expect(html).toContain('Enter a valid email address.')
    expect(html).toContain('value="nope"')
  })

  it('still renders the initialised value on a plain GET', async () => {
    // The other half: with no action run, the server block's own value is what
    // the placeholder resolves to, so the GET render is unchanged.
    const compiled = await compile(`<script server>
const heading = 'Sign up'
</script>
<h1>{{ heading }}</h1>`)

    const { html } = await hydrateTemplateStream(compiled, {
      request: new Request('https://example.test/signup'),
      method: 'GET',
      params: {},
    })

    expect(html).toContain('Sign up')
  })
})
