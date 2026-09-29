/**
 * The SEO directives in a partial read the partial's own server variables.
 *
 * A head partial is where `@seo` belongs, and it is also where the values it
 * needs get computed: the canonical URL from the page's path, the preview card
 * for this page, structured data built from the app's own data. The partial's
 * `{{ }}` saw those variables, but `@seo`, `@meta` and `@structuredData` were
 * left in the markup for the page-level pass, which evaluates them against the
 * page's context - where the partial's variables do not exist. The directive
 * then rendered what it could from literals and dropped every tag that named
 * a variable, silently: no canonical, no og:image, no JSON-LD.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processIncludes } from '../../src/includes'

describe('SEO directives inside a partial', () => {
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'stx-partial-seo-'))
    await writeFile(join(dir, 'head.stx'), `
<script server>
const pageUrl = \`https://example.com\${path}\`
const seo = { title, canonical: pageUrl, openGraph: { image: 'https://example.com/og.png', siteName: 'Example' } }
const product = { '@type': 'SoftwareApplication', name: 'Example', url: pageUrl }
</script>
@seo({ ...seo })
@structuredData(product)
@metaTag({ name: 'author', content: pageUrl })
`)
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function render(context: Record<string, unknown>) {
    return processIncludes(`@include('head.stx')`, context, join(dir, 'page.stx'), { partialsDir: dir, componentsDir: dir }, new Set())
  }

  it('evaluates @seo against the variables the partial declares', async () => {
    const html = await render({ path: '/pricing', title: 'Pricing' })

    expect(html).toContain('<title>Pricing</title>')
    expect(html).toContain('<link rel="canonical" href="https://example.com/pricing">')
    expect(html).toContain('<meta property="og:image" content="https://example.com/og.png">')
    expect(html).toContain('<meta property="og:site_name" content="Example">')
    expect(html).not.toContain('@seo')
  })

  it('evaluates @structuredData and @metaTag against them too', async () => {
    const html = await render({ path: '/', title: 'Home' })

    expect(html).toContain('"url":"https://example.com/"')
    expect(html).toContain('"@context":"https://schema.org"')
    expect(html).toContain('<meta name="author" content="https://example.com/">')
    expect(html).not.toContain('@structuredData')
    expect(html).not.toContain('@metaTag')
  })
})
