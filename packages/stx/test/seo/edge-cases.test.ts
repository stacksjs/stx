/**
 * SEO edge case tests - redistributed from bugs/ directory.
 *
 * Covers: sitemap generation, robots.txt, structured data, meta directives,
 * SEO injection, and SEO regression tests.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { generateRobotsTxt, generateSitemap, generateSitemapIndex, generateDefaultRobotsTxt, processMetaDirectives, processSeoDirective, processStructuredData, injectSeoTags } from '../../src/seo'

const opts = defaultConfig as any as StxOptions
const fp = 'test.stx'
const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function render(template: string, context: Record<string, any> = {}) {
  return processDirectives(template, context, fp, opts, new Set<string>())
}

// =============================================================================
// 1. SEO Generation Edge Cases (from deep-edge-cases.ts)
// =============================================================================

describe('SEO Generation Edge Cases', () => {
  it('generateSitemap with entry that has all fields', () => {
    const sitemap = generateSitemap(
      [{
        loc: '/about',
        lastmod: '2024-01-15',
        changefreq: 'monthly',
        priority: 0.8,
      }],
      { baseUrl: 'https://example.com' },
    )
    expect(sitemap).toContain('https://example.com/about')
    expect(sitemap).toContain('2024-01-15')
    expect(sitemap).toContain('monthly')
    expect(sitemap).toContain('0.8')
    expect(sitemap).toContain('<?xml')
    expect(sitemap).toContain('<urlset')
  })

  it('generateSitemap with duplicate entries', () => {
    const sitemap = generateSitemap(
      [
        { loc: '/page' },
        { loc: '/page' },
      ],
      { baseUrl: 'https://example.com' },
    )
    const pageMatches = sitemap.match(/\/page/g)
    expect(pageMatches!.length).toBeGreaterThanOrEqual(2)
  })

  it('generateSitemap with trailing slash path', () => {
    const sitemap = generateSitemap(
      [{ loc: '/about/' }],
      { baseUrl: 'https://example.com' },
    )
    expect(sitemap).toContain('https://example.com/about/')
  })

  it('generateSitemap with query params in path', () => {
    const sitemap = generateSitemap(
      [{ loc: '/search?q=test' }],
      { baseUrl: 'https://example.com' },
    )
    expect(sitemap).toContain('/search?q=test')
  })

  it('generateSitemap with hash fragment in path', () => {
    const sitemap = generateSitemap(
      [{ loc: '/page#section' }],
      { baseUrl: 'https://example.com' },
    )
    expect(sitemap).toContain('/page#section')
  })

  it('generateRobotsTxt with Googlebot specific rules', () => {
    const robots = generateRobotsTxt({
      rules: [
        { userAgent: '*', allow: ['/'] },
        { userAgent: 'Googlebot', allow: ['/'], disallow: ['/private'], crawlDelay: 1 },
      ],
    })
    expect(robots).toContain('User-agent: Googlebot')
    expect(robots).toContain('Disallow: /private')
    expect(robots).toContain('Crawl-delay: 1')
  })

  it('generateRobotsTxt with no sitemap', () => {
    const robots = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
    })
    expect(robots).not.toContain('Sitemap:')
    expect(robots).toContain('User-agent: *')
  })

  it('generateRobotsTxt with host directive', () => {
    const robots = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      host: 'https://example.com',
    })
    expect(robots).toContain('Host: https://example.com')
  })

  it('generateRobotsTxt with multiple sitemaps', () => {
    const robots = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      sitemap: [
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml',
      ],
    })
    expect(robots).toContain('Sitemap: https://example.com/sitemap1.xml')
    expect(robots).toContain('Sitemap: https://example.com/sitemap2.xml')
  })

  it('processStructuredData with valid JSON-LD', async () => {
    const template = `@structuredData({
      '@type': 'Organization',
      name: 'Example Corp',
      url: 'https://example.com'
    })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('application/ld+json')
    expect(result).toContain('Organization')
    expect(result).toContain('schema.org')
  })

  it('processSeoDirective with canonical URL containing special chars', async () => {
    const template = `@seo({
      title: 'Test',
      canonical: 'https://example.com/page?id=1&ref=home'
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('canonical')
    expect(result).toContain('&amp;')
  })
})

// =============================================================================
// 2. SEO injection edge cases (from discovered-bugs.ts)
// =============================================================================

describe('SEO injection edge cases', () => {
  it('should not duplicate title when title already exists in head', () => {
    const html = '<html><head><title>Existing</title></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'New' }, opts)
    const titleCount = (result.match(/<title>/g) || []).length
    expect(titleCount).toBe(1)
  })
})

// =============================================================================
// 3. SEO edge cases (from discovered-bugs.ts)
// =============================================================================

describe('SEO edge cases', () => {
  it('should handle @seo with empty config', () => {
    const r = processSeoDirective('@seo({})', {}, fp, opts)
    expect(r).toBe('')
  })

  it('should XML-escape URLs in sitemap', () => {
    const r = generateSitemap([{ loc: '/search?q=a&b=c' }], { baseUrl: 'https://example.com' })
    expect(r).toContain('&amp;')
    expect(r).not.toContain('&b=')
  })

  it('should handle unicode in sitemap URLs', () => {
    const r = generateSitemap([{ loc: '/\u65E5\u672C\u8A9E' }], { baseUrl: 'https://example.com' })
    expect(r).toContain('/\u65E5\u672C\u8A9E')
  })

  it('should include multiple sitemaps', () => {
    const r = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      sitemap: ['https://example.com/sitemap1.xml', 'https://example.com/sitemap2.xml'],
    })
    expect(r).toContain('sitemap1.xml')
    expect(r).toContain('sitemap2.xml')
  })

  it('should inject into head with attributes', () => {
    const html = '<html><head lang="en"></head><body></body></html>'
    const r = injectSeoTags(html, { title: 'Test' }, opts)
    expect(r).toContain('og:title')
  })
})

// =============================================================================
// 4. SEO advanced scenarios (from edge-case-bugs.ts)
// =============================================================================

describe('SEO advanced scenarios', () => {
  it('BUG: @seo with array keywords breaks brace-matching parser', () => {
    const template = `@seo({
      title: 'My Page',
      description: 'A great page',
      keywords: ['web', 'dev'],
      robots: 'index, follow',
      canonical: 'https://example.com/page',
      openGraph: {
        type: 'article',
        title: 'OG Title',
        description: 'OG Desc',
        url: 'https://example.com/page',
        image: 'https://example.com/image.jpg',
        imageAlt: 'An image',
        imageWidth: 1200,
        imageHeight: 630,
        siteName: 'My Site'
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Twitter Title',
        description: 'Twitter Desc',
        image: 'https://example.com/twitter.jpg',
        site: '@mysite',
        creator: '@creator'
      }
    })`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('<title>My Page</title>')
    expect(result).toContain('og:title')
    expect(result).toContain('twitter:card')
    expect(result).toContain('@mysite')
    expect(result).toContain('@creator')
    expect(result).toContain('og:image:width')
    expect(result).toContain('og:site_name')
  })

  it('should handle @seo with nested objects (no arrays)', () => {
    const template = `@seo({
      title: 'My Page',
      description: 'A great page',
      openGraph: {
        type: 'article',
        title: 'OG Title',
        image: 'https://example.com/image.jpg',
        siteName: 'My Site'
      },
      twitter: {
        card: 'summary_large_image',
        site: '@mysite'
      }
    })`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('<title>My Page</title>')
    expect(result).toContain('og:title')
    expect(result).toContain('twitter:card')
    expect(result).toContain('og:site_name')
  })

  it('should handle @meta with simple name/content', () => {
    const template = "@meta('viewport', 'width=device-width, initial-scale=1')"
    const result = processMetaDirectives(template, {}, fp, opts)
    expect(result).toContain('name="viewport"')
    expect(result).toContain('width=device-width')
  })

  it('should handle multiple @meta tags on same page', () => {
    const template = "@meta('author', 'John')\n@meta('robots', 'noindex')"
    const result = processMetaDirectives(template, {}, fp, opts)
    expect(result).toContain('name="author"')
    expect(result).toContain('name="robots"')
  })

  it('should handle @structuredData with nested object', () => {
    const template = `@structuredData({
      '@type': 'Organization',
      name: 'ACME',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Springfield',
        addressRegion: 'IL'
      }
    })`
    const result = processStructuredData(template, {}, fp)
    expect(result).toContain('application/ld+json')
    expect(result).toContain('Organization')
    expect(result).toContain('PostalAddress')
    expect(result).toContain('schema.org')
  })

  it('should generate sitemap with multiple entries', () => {
    const entries = [
      { loc: '/', priority: 1.0 },
      { loc: '/about', priority: 0.8 },
      { loc: '/blog', changefreq: 'daily' as const },
    ]
    const result = generateSitemap(entries, { baseUrl: 'https://example.com' })
    expect(result).toContain('<?xml version="1.0"')
    expect(result).toContain('https://example.com/')
    expect(result).toContain('https://example.com/about')
    expect(result).toContain('<priority>1.0</priority>')
    expect(result).toContain('<changefreq>daily</changefreq>')
  })

  it('should generate sitemap with 100+ entries (performance)', () => {
    const entries = Array.from({ length: 150 }, (_, i) => ({
      loc: `/page-${i}`,
      priority: 0.5,
    }))
    const result = generateSitemap(entries, { baseUrl: 'https://example.com' })
    expect(result).toContain('page-0')
    expect(result).toContain('page-149')
    expect(result.split('<url>').length).toBe(151)
  })

  it('should generate sitemap with absolute URLs (external)', () => {
    const entries = [
      { loc: 'https://external.com/page', priority: 0.5 },
      { loc: '/local', priority: 0.5 },
    ]
    const result = generateSitemap(entries, { baseUrl: 'https://example.com' })
    expect(result).toContain('https://external.com/page')
    expect(result).toContain('https://example.com/local')
  })

  it('should generate sitemap index with mixed relative/absolute URLs', () => {
    const sitemaps = ['/sitemap-1.xml', 'https://cdn.example.com/sitemap-2.xml']
    const result = generateSitemapIndex(sitemaps, 'https://example.com')
    expect(result).toContain('sitemapindex')
    expect(result).toContain('https://example.com/sitemap-1.xml')
    expect(result).toContain('https://cdn.example.com/sitemap-2.xml')
  })

  it('should inject SEO tags on minimal HTML with <head>', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'Test' }, opts)
    expect(result).toContain('<title>Test</title>')
    expect(result).toContain('stx SEO Tags')
  })

  it('should not inject when no <head> tag exists', () => {
    const html = '<html><body>Hello</body></html>'
    const result = injectSeoTags(html, { title: 'Test' }, opts)
    expect(result).toBe(html)
  })

  it('should handle injectSeoTags when description has special characters', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { description: 'A "great" <site> & more' }, opts)
    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;site&gt;')
  })

  it('should generate robots.txt with crawl delay', () => {
    const result = generateRobotsTxt({
      rules: [{
        userAgent: 'Googlebot',
        allow: ['/'],
        crawlDelay: 2,
      }],
    })
    expect(result).toContain('Crawl-delay: 2')
    expect(result).toContain('User-agent: Googlebot')
  })

  it('should generate default robots.txt with sitemap', () => {
    const result = generateDefaultRobotsTxt('https://example.com/sitemap.xml')
    expect(result).toContain('User-agent: *')
    expect(result).toContain('Allow: /')
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('should generate default robots.txt without sitemap', () => {
    const result = generateDefaultRobotsTxt()
    expect(result).toContain('User-agent: *')
    expect(result).toContain('Allow: /')
    expect(result).not.toContain('Sitemap:')
  })

  it('should handle @seo with keywords as string (not array)', () => {
    const template = `@seo({
      title: 'Test',
      keywords: 'web, dev, stx'
    })`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('keywords')
    expect(result).toContain('web, dev, stx')
  })

  it('should handle @seo with twitter inheriting from openGraph', () => {
    const template = `@seo({
      title: 'Shared Title',
      description: 'Shared Desc',
      openGraph: {
        image: 'https://example.com/og.jpg'
      },
      twitter: {
        card: 'summary'
      }
    })`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('twitter:image')
    expect(result).toContain('og.jpg')
  })
})

// =============================================================================
// 5. SEO Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('SEO Regression Tests', () => {
  it('should generate blog post SEO tags', () => {
    const template = `@seo({
  title: 'How to Build Templates with stx',
  description: 'A comprehensive guide to building web templates using the stx framework.',
  keywords: 'stx, templates, web development',
  canonical: 'https://example.com/blog/stx-templates',
  openGraph: {
    type: 'article',
    title: 'How to Build Templates with stx',
    image: 'https://example.com/images/stx-blog.jpg',
    siteName: 'My Tech Blog'
  },
  twitter: {
    card: 'summary_large_image',
    site: 'mytechblog',
    creator: 'theauthor'
  }
})`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('<title>How to Build Templates with stx</title>')
    expect(result).toContain('A comprehensive guide')
    expect(result).toContain('og:type')
    expect(result).toContain('article')
    expect(result).toContain('og:image')
    expect(result).toContain('twitter:card')
    expect(result).toContain('mytechblog')
    expect(result).toContain('theauthor')
    expect(result).toContain('canonical')
  })

  it('should generate product page SEO with structured data', () => {
    const template = `@seo({
  title: 'Wireless Headphones - TechStore',
  description: 'Premium wireless headphones with noise cancellation.',
  canonical: 'https://store.com/products/headphones',
  openGraph: {
    type: 'product',
    title: 'Wireless Headphones',
    image: 'https://store.com/img/headphones.jpg'
  },
  structuredData: {
    '@type': 'Product',
    name: 'Wireless Headphones',
    description: 'Premium wireless headphones',
    offers: {
      '@type': 'Offer',
      price: '79.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  }
})`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('Wireless Headphones - TechStore')
    expect(result).toContain('application/ld+json')
    expect(result).toContain('"@type":"Product"')
    expect(result).toContain('"price":"79.99"')
  })

  it('should generate homepage SEO with website type', async () => {
    const template = `@seo({
  title: 'My Amazing Website',
  description: 'Welcome to the most amazing website on the internet.',
  openGraph: {
    type: 'website',
    siteName: 'My Amazing Website'
  }
})`
    const result = await render(template, {})
    expect(result).toContain('My Amazing Website')
    expect(result).toContain('og:type')
    expect(result).toContain('website')
  })

  it('should generate 404 page SEO with noindex', async () => {
    const template = `@seo({
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
  robots: 'noindex, nofollow'
})`
    const result = await render(template, {})
    expect(result).toContain('Page Not Found')
    expect(result).toContain('noindex, nofollow')
  })

  it('should generate search page SEO with noindex', async () => {
    const template = `@seo({
  title: 'Search Results',
  description: 'Search our website.',
  robots: 'noindex'
})`
    const result = await render(template, {})
    expect(result).toContain('noindex')
  })

  it('should process @meta directives for category page', () => {
    const template = `@meta('description', 'Browse our electronics category')
@meta('keywords', 'electronics, gadgets, tech')`
    const result = processMetaDirectives(template, {}, fp, opts)
    expect(result).toContain('name="description"')
    expect(result).toContain('Browse our electronics category')
    expect(result).toContain('name="keywords"')
    expect(result).toContain('electronics, gadgets, tech')
  })

  it('should generate social media optimized page with all OG and Twitter tags', () => {
    const template = `@seo({
  title: 'Our Product Launch',
  description: 'We are launching something amazing.',
  openGraph: {
    type: 'website',
    title: 'Our Product Launch',
    description: 'Something amazing is coming.',
    url: 'https://example.com/launch',
    image: 'https://example.com/launch.jpg',
    imageAlt: 'Product Launch Banner',
    imageWidth: 1200,
    imageHeight: 630,
    siteName: 'Example Inc.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Product Launch',
    description: 'Something amazing is coming.',
    image: 'https://example.com/launch-twitter.jpg',
    site: 'examplehandle',
    creator: 'ceohandle'
  }
})`
    const result = processSeoDirective(template, {}, fp, opts)
    expect(result).toContain('og:title')
    expect(result).toContain('og:description')
    expect(result).toContain('og:url')
    expect(result).toContain('og:image')
    expect(result).toContain('og:image:alt')
    expect(result).toContain('og:image:width')
    expect(result).toContain('og:image:height')
    expect(result).toContain('og:site_name')
    expect(result).toContain('twitter:card')
    expect(result).toContain('twitter:title')
    expect(result).toContain('twitter:description')
    expect(result).toContain('twitter:image')
    expect(result).toContain('twitter:site')
    expect(result).toContain('twitter:creator')
  })

  it('should generate a sitemap for a typical site with 10 pages', () => {
    const entries = [
      { loc: '/', priority: 1.0, changefreq: 'daily' as const },
      { loc: '/about', priority: 0.8 },
      { loc: '/blog', priority: 0.9, changefreq: 'daily' as const },
      { loc: '/blog/post-1', priority: 0.7 },
      { loc: '/blog/post-2', priority: 0.7 },
      { loc: '/blog/post-3', priority: 0.7 },
      { loc: '/contact', priority: 0.6 },
      { loc: '/products', priority: 0.8 },
      { loc: '/products/widget', priority: 0.7 },
      { loc: '/faq', priority: 0.5 },
    ]
    const sitemap = generateSitemap(entries, {
      baseUrl: 'https://example.com',
      includeLastmod: false,
    })
    expect(sitemap).toContain('<?xml version="1.0"')
    expect(sitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(sitemap).toContain('<loc>https://example.com/</loc>')
    expect(sitemap).toContain('<loc>https://example.com/about</loc>')
    expect(sitemap).toContain('<priority>1.0</priority>')
    expect(sitemap).toContain('<priority>0.5</priority>')
    expect(sitemap).toContain('<changefreq>daily</changefreq>')
    const urlCount = (sitemap.match(/<url>/g) || []).length
    expect(urlCount).toBe(10)
  })

  it('should generate robots.txt for a typical site', () => {
    const robotsTxt = generateRobotsTxt({
      rules: [
        {
          userAgent: '*',
          allow: ['/'],
          disallow: ['/admin', '/private', '/api'],
        },
        {
          userAgent: 'Googlebot',
          allow: ['/'],
          crawlDelay: 1,
        },
      ],
      sitemap: 'https://example.com/sitemap.xml',
    })
    expect(robotsTxt).toContain('User-agent: *')
    expect(robotsTxt).toContain('Allow: /')
    expect(robotsTxt).toContain('Disallow: /admin')
    expect(robotsTxt).toContain('Disallow: /private')
    expect(robotsTxt).toContain('Disallow: /api')
    expect(robotsTxt).toContain('User-agent: Googlebot')
    expect(robotsTxt).toContain('Crawl-delay: 1')
    expect(robotsTxt).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('should inject default SEO tags when no @seo directive present', () => {
    const html = `<html><head></head><body>Hello</body></html>`
    const context = { title: 'My Page', description: 'My page description' }
    const result = injectSeoTags(html, context, opts)
    expect(result).toContain('<title>My Page</title>')
    expect(result).toContain('og:title')
    expect(result).toContain('twitter:card')
  })
})
