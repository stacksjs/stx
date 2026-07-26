import type { SiteConfig } from '../src/site-builder/types'
import { describe, expect, it } from 'bun:test'
import { injectSeo } from '../src/site-builder/seo'

/**
 * `injectSeo` fills gaps in a page's head. It must never overwrite what the
 * page authored: the page knows what it is about, and the site config does
 * not.
 */
const site: SiteConfig = {
  name: 'Example Site',
  url: 'https://example.com',
  description: 'A site',
  seo: { title: 'Example Site', description: 'A site', locale: 'en_US' },
} as SiteConfig

/** Count of a tag in the head only, so an SVG title in the body cannot count. */
function headOccurrences(html: string, pattern: RegExp): number {
  const head = html.split(/<\/head>/i)[0] ?? html
  return head.match(pattern)?.length ?? 0
}

describe('injectSeo', () => {
  it('fills a bare head', () => {
    const html = injectSeo('<html><head></head><body></body></html>', site, {}, '/')

    expect(html).toContain('<title>Example Site</title>')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('rel="canonical"')
  })

  it('keeps the page\'s own title and does not add a second', () => {
    const page = '<html><head><title>Targeted weed control</title></head><body></body></html>'
    const html = injectSeo(page, site, {}, '/features/weeds')

    expect(html).toContain('<title>Targeted weed control</title>')
    expect(html).not.toContain('<title>Example Site</title>')
    expect(headOccurrences(html, /<title[\s>]/gi)).toBe(1)
  })

  it('leaves a page\'s own og tags alone', () => {
    const page = [
      '<html><head>',
      '<meta property="og:title" content="Targeted weed control">',
      '<meta property="og:description" content="Spray the weeds, not the field">',
      '<meta property="og:image" content="https://example.com/og/weeds.jpg">',
      '<meta name="twitter:card" content="summary_large_image">',
      '</head><body></body></html>',
    ].join('\n')

    const html = injectSeo(page, site, {}, '/features/weeds')

    expect(headOccurrences(html, /property="og:title"/g)).toBe(1)
    expect(html).toContain('content="Targeted weed control"')
    // The generic description must not appear as a SECOND og:description:
    // crawlers read the first one. Filling `<meta name="description">`, which
    // this page never wrote, is the injector doing its actual job.
    expect(headOccurrences(html, /property="og:description"/g)).toBe(1)
    expect(html).toContain('content="Spray the weeds, not the field"')
    // A card size the page chose is not downgraded to `summary`.
    expect(headOccurrences(html, /name="twitter:card"/g)).toBe(1)
    expect(html).toContain('content="summary_large_image"')
  })

  it('still fills the tags the page left out', () => {
    const page = '<html><head><title>Only a title</title></head><body></body></html>'
    const html = injectSeo(page, site, {}, '/about')

    expect(html).toContain('<title>Only a title</title>')
    expect(html).toContain('property="og:description"')
    expect(html).toContain('href="https://example.com/about"')
  })

  it('injects after the page\'s own tags, not in front of them', () => {
    const page = '<html><head><meta property="og:title" content="Mine"></head><body></body></html>'
    const html = injectSeo(page, site, {}, '/')

    expect(html.indexOf('content="Mine"')).toBeLessThan(html.indexOf('<!-- SEO -->'))
  })

  it('is idempotent', () => {
    const once = injectSeo('<html><head></head><body></body></html>', site, {}, '/')
    const twice = injectSeo(once, site, {}, '/')

    expect(headOccurrences(twice, /<title[\s>]/gi)).toBe(1)
    expect(headOccurrences(twice, /property="og:title"/g)).toBe(1)
  })

  it('does not mistake an SVG title in the body for the document title', () => {
    const page = '<html><head></head><body><svg><title>A chart</title></svg></body></html>'
    const html = injectSeo(page, site, {}, '/')

    expect(html).toContain('<title>Example Site</title>')
  })
})
