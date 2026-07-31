import { describe, expect, it } from 'bun:test'
import { isMarkdownPath, protectCodeBlocks, renderMarkdownView } from '../src/markdown-view'

/**
 * Markdown files rendered as stx templates.
 *
 * The arrangement VitePress popularised with Vue: prose is markdown, and
 * template syntax inside it still works. The hard part is that documentation is
 * mostly *about* syntax, so the pages most likely to break the feature are the
 * ones documenting it.
 */
describe('isMarkdownPath', () => {
  it('recognises markdown extensions', () => {
    expect(isMarkdownPath('docs/guide.md')).toBe(true)
    expect(isMarkdownPath('docs/guide.markdown')).toBe(true)
  })

  it('leaves templates and everything else alone', () => {
    expect(isMarkdownPath('views/home.stx')).toBe(false)
    expect(isMarkdownPath('readme.md.stx')).toBe(false)
  })
})

describe('protectCodeBlocks', () => {
  /**
   * The regression this exists for: a page documenting `{{ name }}` had it
   * evaluated, so the documentation for interpolation could not show
   * interpolation.
   */
  it('wraps a fenced block so its contents are not executed', () => {
    const html = '<p>Use it:</p><pre><code>{{ name }}</code></pre>'
    const out = protectCodeBlocks(html)

    expect(out).toContain('@raw<pre><code>{{ name }}</code></pre>@endraw')
  })

  it('protects directives in code as well as expressions', () => {
    const out = protectCodeBlocks('<pre><code>@if (user)\n  hi\n@endif</code></pre>')

    expect(out).toContain('@raw<pre>')
    expect(out).toContain('@endraw')
  })

  it('protects inline code spans', () => {
    const out = protectCodeBlocks('<p>write <code>{{ x }}</code> for that</p>')

    expect(out).toContain('@raw<code>{{ x }}</code>@endraw')
  })

  it('does not double-wrap a code element inside a pre', () => {
    // Wrapping both would nest @raw inside @raw and emit stray markers.
    const out = protectCodeBlocks('<pre><code>x</code></pre>')

    expect(out.match(/@raw/g)?.length).toBe(1)
    expect(out.match(/@endraw/g)?.length).toBe(1)
  })

  it('leaves prose outside code untouched, so interpolation still works', () => {
    const out = protectCodeBlocks('<h1>{{ title }}</h1><pre><code>{{ literal }}</code></pre>')

    // The heading must remain live; only the code block is frozen.
    expect(out.startsWith('<h1>{{ title }}</h1>')).toBe(true)
    expect(out).toContain('@raw<pre><code>{{ literal }}</code></pre>@endraw')
  })

  it('handles several blocks in one document', () => {
    const out = protectCodeBlocks('<pre><code>a</code></pre><p>and</p><pre><code>b</code></pre>')

    expect(out.match(/@raw/g)?.length).toBe(2)
    expect(out).toContain('<p>and</p>')
  })

  it('returns the input unchanged when there is no code', () => {
    const html = '<h1>Title</h1><p>No code here.</p>'

    expect(protectCodeBlocks(html)).toBe(html)
  })

  it('keeps attributes on the code element', () => {
    // Highlighters put the language in a class; losing it loses the colours.
    const out = protectCodeBlocks('<pre><code class="language-ts">const x = 1</code></pre>')

    expect(out).toContain('class="language-ts"')
  })

  it('emits every byte of the original exactly once', () => {
    const html = '<p>one</p><pre><code>two</code></pre><p>three</p>'
    const out = protectCodeBlocks(html)

    expect(out.replaceAll('@raw', '').replaceAll('@endraw', '')).toBe(html)
  })
})

describe('renderMarkdownView', () => {
  it('separates frontmatter from body', async () => {
    const view = await renderMarkdownView('---\ntitle: Guide\n---\n\n# Hello\n')

    expect(view.frontmatter.title).toBe('Guide')
    expect(view.html).toContain('Hello')
    expect(view.html).not.toContain('title: Guide')
  })

  it('returns empty frontmatter rather than null when there is none', async () => {
    // Callers spread this into a context; null would throw there.
    const view = await renderMarkdownView('# Just a heading\n')

    expect(view.frontmatter).toEqual({})
  })

  it('leaves stx expressions in prose live', async () => {
    const view = await renderMarkdownView('Hello {{ name }}\n')

    expect(view.html).toContain('{{ name }}')
    expect(view.html).not.toContain('@raw')
  })

  it('protects a fenced block written in markdown', async () => {
    const view = await renderMarkdownView('Example:\n\n```\n{{ name }}\n```\n')

    expect(view.html).toContain('@raw')
    expect(view.html).toContain('@endraw')
  })

  it('accepts a supplied renderer instead of the built-in one', async () => {
    // The seam bunpress plugs into.
    const view = await renderMarkdownView('# ignored', {
      renderer: () => '<article>from bunpress</article>',
    })

    expect(view.html).toBe('<article>from bunpress</article>')
  })

  it('awaits an async renderer', async () => {
    const view = await renderMarkdownView('# x', {
      renderer: async () => '<p>async</p>',
    })

    expect(view.html).toBe('<p>async</p>')
  })

  it('protects code blocks a supplied renderer produced', async () => {
    // Protection is applied after rendering, so it covers any renderer.
    const view = await renderMarkdownView('irrelevant', {
      renderer: () => '<pre><code>@if (x)</code></pre>',
    })

    expect(view.html).toContain('@raw<pre><code>@if (x)</code></pre>@endraw')
  })
})
