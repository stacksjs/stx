import { describe, expect, test } from 'bun:test'
import { injectSeo } from '../src/seo'
import { generateRobots } from '../src/robots'
import { generateSitemap } from '../src/sitemap'

const baseSite = {
  name: 'Test Site',
  url: 'https://example.com',
  description: 'A test site',
  seo: { twitter: 'example' },
}

describe('injectSeo', () => {
  test('replaces stx default SEO tags', () => {
    const html = `<!DOCTYPE html><html><head>
      <!-- stx SEO Tags -->
      <meta name="title" content="stx Project">
      <meta name="description" content="A website built with stx templating engine">
      <meta property="og:title" content="stx Project">
      <meta property="og:description" content="A website built with stx templating engine">
      <meta property="og:type" content="website">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="stx Project">
      <meta name="twitter:description" content="A website built with stx templating engine">
      <title>Real Title</title>
    </head><body></body></html>`

    const result = injectSeo(html, baseSite, {}, '/')

    expect(result).not.toContain('stx Project')
    expect(result).not.toContain('A website built with stx')
    expect(result).toContain('og:title')
    expect(result).toContain('Test Site')
    expect(result).toContain('canonical')
    expect(result).toContain('href="https://example.com/"')
    expect(result).toContain('@example')
  })

  test('uses page-specific overrides', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeo(html, baseSite, { title: 'About Us', description: 'About' }, '/about')

    expect(result).toContain('content="About Us"')
    expect(result).toContain('content="About"')
    expect(result).toContain('href="https://example.com/about"')
  })

  test('idempotent across multiple calls', () => {
    const html = '<html><head></head><body></body></html>'
    const once = injectSeo(html, baseSite, {}, '/')
    const twice = injectSeo(once, baseSite, {}, '/')
    const blockCount = (twice.match(/<!-- SEO -->/g) ?? []).length

    expect(blockCount).toBe(1)
  })

  test('adds image tags when seo.image provided', () => {
    const html = '<html><head></head><body></body></html>'
    const site = { ...baseSite, seo: { ...baseSite.seo, image: 'https://example.com/og.png' } }
    const result = injectSeo(html, site, {}, '/')

    expect(result).toContain('og:image')
    expect(result).toContain('twitter:image')
    expect(result).toContain('summary_large_image')
  })
})

describe('generateRobots', () => {
  test('default: allow all + sitemap', () => {
    const txt = generateRobots(baseSite)!
    expect(txt).toContain('User-agent: *')
    expect(txt).toContain('Allow: /')
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  test('disallow mode for staging', () => {
    const txt = generateRobots({ ...baseSite, robots: 'disallow' })!
    expect(txt).toContain('Disallow: /')
  })

  test('returns null when robots: false', () => {
    expect(generateRobots({ ...baseSite, robots: false })).toBeNull()
  })

  test('passes through raw string', () => {
    const txt = generateRobots({ ...baseSite, robots: 'User-agent: Googlebot\nDisallow:' })!
    expect(txt).toBe('User-agent: Googlebot\nDisallow:\n')
  })
})

describe('generateSitemap', () => {
  test('emits xml with all entries', () => {
    const xml = generateSitemap(baseSite, [
      { path: '/' },
      { path: '/about' },
      { path: '/contact', page: { priority: 0.5 } },
    ])

    expect(xml).toContain('<loc>https://example.com/</loc>')
    expect(xml).toContain('<loc>https://example.com/about</loc>')
    expect(xml).toContain('<priority>1.0</priority>')
    expect(xml).toContain('<priority>0.5</priority>')
  })

  test('skips entries with sitemap: false', () => {
    const xml = generateSitemap(baseSite, [
      { path: '/' },
      { path: '/private', page: { sitemap: false } },
    ])

    expect(xml).toContain('<loc>https://example.com/</loc>')
    expect(xml).not.toContain('/private')
  })
})
