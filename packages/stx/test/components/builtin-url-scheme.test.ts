/**
 * The builtins that write a URL for you refuse a scheme that runs script.
 *
 * `<StxLink :to="user.website">` and `<StxImage :src="row.avatar">` resolve
 * their prop on the server and write it straight into href/src, so they are the
 * same hole as `href="{{ url }}"` by another name -- and the likelier one, since
 * the values come from a record rather than from the template.
 *
 * `<StxLink x-to="...">` is left alone on purpose: that emits an expression for
 * the runtime, which sanitizes what it evaluates to (bound-url-scheme.test.ts).
 */
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const render = async (template: string, context: Record<string, unknown>): Promise<string> =>
  (await processDirectives(template, context, '/tmp/builtin-url.stx', {}, new Set<string>()))
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<link[^>]*>/g, '')
    .trim()

describe('StxLink refuses a script scheme in to', () => {
  it('refuses a server-evaluated :to', async () => {
    const out = await render('<StxLink :to="u">L</StxLink>', { u: 'javascript:alert(1)' })
    expect(out).toContain('href="unsafe:javascript:alert(1)"')
  })

  it('refuses a static to written into the template', async () => {
    const out = await render('<StxLink to="javascript:alert(1)">L</StxLink>', {})
    expect(out).toContain('href="unsafe:javascript:alert(1)"')
  })

  it('refuses a data URL that would navigate to a document', async () => {
    const out = await render('<StxLink :to="u">L</StxLink>', { u: 'data:text/html,<b>x' })
    expect(out).toContain('unsafe:data:text/html')
  })

  it('leaves an ordinary link exactly as it was', async () => {
    for (const to of ['/products', 'https://example.com/a?b=1', '#top', 'mailto:a@b.co']) {
      const out = await render('<StxLink :to="u">L</StxLink>', { u: to })
      expect(out).not.toContain('unsafe:')
      expect(out).toContain('data-stx-link')
    }
  })
})

describe('StxImage refuses a script scheme in src', () => {
  it('refuses a server-evaluated :src', async () => {
    const out = await render('<StxImage :src="u" alt="a" />', { u: 'javascript:alert(1)' })
    expect(out).toContain('src="unsafe:javascript:alert(1)"')
  })

  it('keeps the inline data URLs an image legitimately uses', async () => {
    const out = await render('<StxImage :src="u" alt="a" />', { u: 'data:image/png;base64,AAA' })
    expect(out).toContain('src="data:image/png;base64,AAA"')
    expect(out).not.toContain('unsafe:')
  })

  it('refuses a document data URL even in src', async () => {
    const out = await render('<StxImage :src="u" alt="a" />', { u: 'data:text/html,<b>x' })
    expect(out).toContain('unsafe:data:text/html')
  })

  it('leaves a normal image path alone', async () => {
    const out = await render('<StxImage src="/images/hero.jpg" alt="Hero" width="800" height="600" />', {})
    expect(out).toContain('src="/images/hero.jpg"')
    expect(out).not.toContain('unsafe:')
  })
})
