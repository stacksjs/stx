/**
 * `@meta(...)` reaches `<head>`, and a page tag replaces the config tag.
 *
 * Two silent failures, both of which leave a page that renders correctly and
 * is wrong where it counts.
 *
 * The first: `metaDirective` is registered in `defaultConfig.customDirectives`,
 * and custom directives run long before either dedicated handler
 * (`processMetaDirective` in head.ts, `processMetaDirectives` in seo.ts). It
 * returned markup, so the tag was emitted wherever the directive sat, which is
 * the `<body>`. The tag is in the HTML and no crawler reads it. It also wrote
 * `name="og:title"`, and Open Graph is RDFa: a scraper implementing the spec
 * looks for `property` and finds nothing.
 *
 * The second: page meta was appended to config meta, so a page setting its own
 * description shipped two `<meta name="description">` tags with the site-wide
 * one first. Crawlers take the first, so every page advertised the site
 * default while its own description sat below it looking correct.
 */
import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { metaDirective } from '../../src/seo'
import type { HeadConfig } from '../../src/head'
import type { StxOptions } from '../../src/types'

/** Run the directive the way processCustomDirectives does, returning both halves. */
function run(params: string[], context: Record<string, any> = {}): { output: string, head: HeadConfig } {
  const output = metaDirective.handler('', params, context, 'test.stx') as string
  return { output, head: (context.__stx_runtime_head ?? {}) as HeadConfig }
}

describe('metaDirective staging', () => {
  it('stages the tag on the head instead of emitting it inline', () => {
    const { output, head } = run(['\'description\'', '\'Page desc\''])

    // Nothing left in the body: an inline <meta> there is decoration.
    expect(output).toBe('')
    expect(head.meta).toEqual([{ name: 'description', content: 'Page desc' }])
  })

  it('addresses Open Graph by property, not name', () => {
    const { head } = run(['\'og:title\'', '\'Hello\''])

    expect(head.meta).toEqual([{ property: 'og:title', content: 'Hello' }])
  })

  it.each(['article:author', 'book:isbn', 'profile:username', 'fb:app_id', 'music:album', 'video:actor'])(
    'addresses %s by property',
    (name) => {
      const { head } = run([`'${name}'`, '\'x\''])
      expect(head.meta?.[0]).toHaveProperty('property', name)
    },
  )

  it('keeps twitter tags on name, which is what the card spec says', () => {
    const { head } = run(['\'twitter:card\'', '\'summary\''])

    expect(head.meta).toEqual([{ name: 'twitter:card', content: 'summary' }])
  })

  it('resolves an unquoted argument from the context', () => {
    const { head } = run(['\'og:image\'', 'ogImage'], { ogImage: 'https://example.com/a.png' })

    expect(head.meta).toEqual([{ property: 'og:image', content: 'https://example.com/a.png' }])
  })

  it('keeps quotes that are part of the value', () => {
    const { head } = run(['\'description\'', '"It\'s fine"'])

    // The old handler stripped every quote in the string, not the outer pair.
    expect(head.meta?.[0]).toHaveProperty('content', 'It\'s fine')
  })

  it('reads the one-argument form out of the context', () => {
    const { head } = run(['\'og:title\''], { title: 'From context' })

    expect(head.meta).toEqual([{ property: 'og:title', content: 'From context' }])
  })

  it('reads the one-argument form out of an openGraph object', () => {
    const { head } = run(['\'og:image\''], { openGraph: { image: '/og.png' } })

    expect(head.meta).toEqual([{ property: 'og:image', content: '/og.png' }])
  })

  it('emits nothing when there is no value to state', () => {
    const { output, head } = run(['\'og:title\''], {})

    expect(output).toBe('')
    expect(head.meta ?? []).toEqual([])
  })

  it('accumulates across several directives', () => {
    const context: Record<string, any> = {}
    metaDirective.handler('', ['\'description\'', '\'A\''], context, 'test.stx')
    metaDirective.handler('', ['\'og:title\'', '\'B\''], context, 'test.stx')

    expect((context.__stx_runtime_head as HeadConfig).meta).toEqual([
      { name: 'description', content: 'A' },
      { property: 'og:title', content: 'B' },
    ])
  })

  it('still reports a directive called with no arguments', () => {
    const { output } = run([])

    expect(output).toContain('meta directive requires at least the meta name')
  })
})

describe('@meta through a full render', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-meta-head-'))

  async function render(source: string, head: Record<string, any>): Promise<string> {
    const file = path.join(dir, 'page.stx')
    fs.writeFileSync(file, source)

    return processDirectives(source, {}, file, {
      ...defaultConfig,
      autoShell: true,
      app: { head },
    } as unknown as StxOptions, new Set<string>())
  }

  it('puts the tag in the head, above the body', async () => {
    const html = await render(
      `@meta('description', 'Page desc')\n@meta('og:title', 'Page title')\n<div>hi</div>`,
      { title: 'Site' },
    )

    const headEnd = html.indexOf('</head>')
    expect(headEnd).toBeGreaterThan(-1)
    expect(html.indexOf('content="Page desc"')).toBeLessThan(headEnd)
    expect(html).toContain('<meta property="og:title" content="Page title">')
    // And not left behind in the body.
    expect(html.slice(headEnd)).not.toContain('Page desc')
  })

  it('replaces the config description rather than appending to it', async () => {
    const html = await render(
      `@meta('description', 'Page desc')\n<div>hi</div>`,
      { title: 'Site', meta: [{ name: 'description', content: 'Site desc' }] },
    )

    expect(html).toContain('content="Page desc"')
    expect(html).not.toContain('Site desc')
    expect(html.match(/name="description"/g)).toHaveLength(1)
  })

  it('leaves config meta the page does not set', async () => {
    const html = await render(
      `@meta('description', 'Page desc')\n<div>hi</div>`,
      {
        title: 'Site',
        meta: [
          { name: 'description', content: 'Site desc' },
          { name: 'color-scheme', content: 'light dark' },
        ],
      },
    )

    expect(html).toContain('content="light dark"')
    expect(html).toContain('content="Page desc"')
  })
})
