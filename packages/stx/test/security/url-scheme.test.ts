/**
 * A substituted value cannot introduce a URL scheme the page did not ask for.
 *
 * `{{ }}` escapes HTML, which stops a value from closing its attribute -- and
 * says nothing about what the attribute means. `javascript:alert(1)` holds not
 * one character escaping touches, so `<a href="{{ url }}">` over a stored URL
 * ran script on click. security-edge-cases.test.ts asserted exactly that,
 * called it a known limitation, and there it sat.
 *
 * What must NOT change is the larger half of this: prose keeps every byte, a
 * value after a `?` keeps every byte, and `{!! !!}` is still the way a template
 * says it vouches for a value.
 */
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { isDangerousUrl, sanitizeUrlValue, schemeWindow, urlSchemePosition } from '../../src/url-safety'

const render = async (template: string, context: Record<string, unknown>): Promise<string> =>
  (await processDirectives(template, context, '/tmp/url-scheme.stx', {}, new Set<string>())).trim()

describe('a scheme cannot arrive in a value', () => {
  it('refuses javascript: in an href', async () => {
    expect(await render('<a href="{{ url }}">L</a>', { url: 'javascript:alert(1)' }))
      .toBe('<a href="unsafe:javascript:alert(1)">L</a>')
  })

  it('refuses the spellings a browser still reads as a scheme', async () => {
    const spellings = [
      'JaVaScript:alert(1)',
      'javascript\t:alert(1)',
      'java\tscript:alert(1)',
      '  javascript:alert(1)',
      '\njavascript:alert(1)',
      'vbscript:msgbox(1)',
      'livescript:alert(1)',
    ]
    for (const url of spellings) {
      const out = await render('<a href="{{ url }}">L</a>', { url })
      expect(out).toContain('unsafe:')
    }
  })

  it('refuses a data URL that carries a document where it would be navigated to', async () => {
    expect(await render('<a href="{{ u }}">L</a>', { u: 'data:text/html,<b>x</b>' })).toContain('unsafe:data:text/html')
    expect(await render('<a href="{{ u }}">L</a>', { u: 'data:image/svg+xml,<svg/>' })).toContain('unsafe:data:image/svg')
    expect(await render('<iframe src="{{ u }}"></iframe>', { u: 'data:text/html,<b>x' })).toContain('unsafe:data:text/html')
  })

  it('still loads the data URLs a page legitimately inlines', async () => {
    // StxImage emits its own blur placeholder as an inline SVG data URL.
    expect(await render('<img src="{{ u }}">', { u: 'data:image/svg+xml,<svg/>' })).toBe('<img src="data:image/svg+xml,&lt;svg/&gt;">')
    expect(await render('<img src="{{ u }}">', { u: 'data:image/png;base64,AAA' })).toBe('<img src="data:image/png;base64,AAA">')
  })

  it('covers the other attributes the browser resolves as a URL', async () => {
    const attributes = ['href', 'src', 'action', 'formaction', 'poster', 'cite', 'ping', 'xlink:href', 'srcset', 'to']
    for (const attribute of attributes) {
      // The element does not matter to the decision, only the attribute name.
      const out = await render(`<span ${attribute}="{{ u }}"></span>`, { u: 'javascript:alert(1)' })
      expect(out).toContain('unsafe:javascript')
    }
  })

  it('leaves a value that is not in the scheme position', async () => {
    // A scheme can only be at the start of a URL, so nothing here can add one.
    expect(await render('<a href="/search?q={{ q }}">L</a>', { q: 'javascript:alert(1)' }))
      .toBe('<a href="/search?q=javascript:alert(1)">L</a>')
    expect(await render('<a href="/a/{{ id }}">L</a>', { id: 'javascript:x' }))
      .toBe('<a href="/a/javascript:x">L</a>')
  })

  it('leaves an attribute that holds no URL, and text', async () => {
    expect(await render('<div title="{{ t }}">x</div>', { t: 'javascript:alert(1)' }))
      .toBe('<div title="javascript:alert(1)">x</div>')
    expect(await render('<p>{{ t }}</p>', { t: 'javascript:alert(1)' }))
      .toBe('<p>javascript:alert(1)</p>')
    expect(await render('<div data-href="{{ t }}">x</div>', { t: 'javascript:alert(1)' }))
      .toBe('<div data-href="javascript:alert(1)">x</div>')
  })

  it('leaves every ordinary URL exactly as it was', async () => {
    const urls = ['https://example.com/a?b=1&c=2', '/relative/path', './sibling', '#anchor', 'mailto:a@b.co', 'tel:+15551234', 'javascript-guide.html', 'data:image/webp;base64,AA']
    for (const url of urls) {
      const out = await render('<a href="{{ url }}">L</a>', { url })
      expect(out).not.toContain('unsafe:')
    }
  })

  it('leaves the raw form alone, which is how a template vouches for a value', async () => {
    expect(await render('<a href="{!! url !!}">L</a>', { url: 'javascript:alert(1)' }))
      .toBe('<a href="javascript:alert(1)">L</a>')
  })

  it('refuses a scheme that arrives through a loop or a conditional', async () => {
    expect(await render('@foreach(links as l)<a href="{{ l }}">L</a>@endforeach', { links: ['javascript:alert(1)', '/ok'] }))
      .toBe('<a href="unsafe:javascript:alert(1)">L</a><a href="/ok">L</a>')
    expect(await render('@if(true)<a href="{{ u }}">L</a>@endif', { u: 'javascript:alert(1)' }))
      .toContain('unsafe:javascript')
  })
})

describe('url-safety helpers', () => {
  it('reads a scheme through whitespace and case, and only with its colon', () => {
    expect(isDangerousUrl('javascript:x')).toBe(true)
    expect(isDangerousUrl('JAVASCRIPT:x')).toBe(true)
    expect(isDangerousUrl('java\u0000script:x')).toBe(true)
    expect(isDangerousUrl('javascript')).toBe(false)
    expect(isDangerousUrl('javascript-guide.html')).toBe(false)
    expect(isDangerousUrl('https://javascript.info')).toBe(false)
  })

  it('splits the data URLs by what the attribute does with them', () => {
    expect(isDangerousUrl('data:image/svg+xml,<svg/>', 'navigable')).toBe(true)
    expect(isDangerousUrl('data:image/svg+xml,<svg/>', 'fetched')).toBe(false)
    expect(isDangerousUrl('data:text/html,x', 'fetched')).toBe(true)
  })

  it('names the attribute a substitution is landing in', () => {
    expect(urlSchemePosition('<a href="')).toBe('navigable')
    expect(urlSchemePosition('<img SRC=\'')).toBe('fetched')
    expect(urlSchemePosition('<object data="')).toBe('navigable')
    expect(urlSchemePosition('<div title="')).toBe(null)
    expect(urlSchemePosition('<div data-src="')).toBe(null)
    expect(urlSchemePosition('<a href="/x?q=')).toBe(null)
    expect(urlSchemePosition('plain text ')).toBe(null)
  })

  it('cuts its window at a boundary, so half a name cannot read as a whole one', () => {
    // A six-character window over data-href="" is exactly `href="`, which is the
    // false positive the boundary cut exists to prevent.
    const output = `${'x'.repeat(400)}<div data-href="`
    expect(schemeWindow(output, output.length, 6)).not.toContain('href')
    expect(urlSchemePosition(schemeWindow(output, output.length, 6))).toBe(null)
    const real = `${'x'.repeat(400)}<a href="`
    expect(urlSchemePosition(schemeWindow(real, real.length))).toBe('navigable')
  })

  it('prefixes rather than empties, so what was blocked stays readable', () => {
    expect(sanitizeUrlValue('javascript:alert(1)')).toBe('unsafe:javascript:alert(1)')
    expect(sanitizeUrlValue('/fine')).toBe('/fine')
  })
})
