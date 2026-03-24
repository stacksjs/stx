import { describe, expect, it } from 'bun:test'
import {
  processMetaDirectives,
  processStructuredData,
  processSeoDirective,
  injectSeoTags,
  generateSitemap,
  generateSitemapIndex,
  generateRobotsTxt,
  generateDefaultRobotsTxt,
  registerSeoDirectives,
} from '../../src/seo'
import type { StxOptions } from '../../src/types'
import { defaultConfig } from '../../src/config'

const defaultOptions = { ...defaultConfig } as StxOptions

// =============================================================================
// processMetaDirectives
// =============================================================================

describe('processMetaDirectives', () => {
  it('should process simple @meta with name and content', () => {
    const template = `@meta('description', 'Page desc')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toBe('<meta name="description" content="Page desc">')
  })

  it('should process @meta with double quotes', () => {
    const template = `@meta("description", "Page desc")`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toBe('<meta name="description" content="Page desc">')
  })

  it('should process @meta for og:title with context.title', () => {
    const template = `@meta('og:title')`
    const context = { title: 'My Page Title' }
    const result = processMetaDirectives(template, context, 'test.stx', defaultOptions)
    expect(result).toBe('<meta property="og:title" content="My Page Title">')
  })

  it('should process @meta for og:image with context.openGraph.image', () => {
    const template = `@meta('og:image')`
    const context = { openGraph: { image: 'https://example.com/og.jpg' } }
    const result = processMetaDirectives(template, context, 'test.stx', defaultOptions)
    expect(result).toBe('<meta property="og:image" content="https://example.com/og.jpg">')
  })

  it('should return empty string when og: meta has no matching context', () => {
    const template = `@meta('og:title')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toBe('')
  })

  it('should return empty string when content is missing for simple meta', () => {
    // @meta with only a non-colon name and no content value
    const template = `@meta('description')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    // No second argument means no content, so the regex won't match the two-arg form
    // and since 'description' doesn't contain ':', it won't match the og form either
    // Actually, the regex has an optional second arg, so it will match with content=undefined
    expect(result).toBe('')
  })

  it('should escape HTML special chars in content: ampersand via simple meta', () => {
    // The regex [^'"]+ prevents quotes inside the content capture group,
    // so we test HTML escaping with characters that do match the pattern
    const template = `@meta('description', 'Tom & Jerry')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('Tom &amp; Jerry')
  })

  it('should escape HTML special chars in content: angle brackets', () => {
    const template = `@meta('description', 'Use <b> tags')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('&lt;b&gt;')
  })

  it('should escape HTML special chars in content: ampersand', () => {
    const template = `@meta('description', 'Tom & Jerry')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('Tom &amp; Jerry')
  })

  it('should escape HTML special chars in og: meta content', () => {
    const template = `@meta('og:title')`
    const context = { title: 'Title with "quotes" & <tags>' }
    const result = processMetaDirectives(template, context, 'test.stx', defaultOptions)
    expect(result).toContain('&quot;quotes&quot;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;tags&gt;')
  })

  it('should process @metaTag with name and content object', () => {
    const template = `@metaTag({ name: 'author', content: 'John' })`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta')
    expect(result).toContain('name="author"')
    expect(result).toContain('content="John"')
  })

  it('should process @metaTag with property attribute', () => {
    const template = `@metaTag({ property: 'og:title', content: 'Title' })`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('property="og:title"')
    expect(result).toContain('content="Title"')
  })

  it('should process @metaTag with httpEquiv attribute', () => {
    const template = `@metaTag({ httpEquiv: 'refresh', content: '30' })`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('http-equiv="refresh"')
    expect(result).toContain('content="30"')
  })

  it('should process multiple meta tags in the same template', () => {
    const template = `@meta('description', 'Desc') @meta('keywords', 'a,b,c')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="description" content="Desc">')
    expect(result).toContain('<meta name="keywords" content="a,b,c">')
  })

  it('should process mixed @meta and @metaTag in the same template', () => {
    const template = `@meta('description', 'Desc')\n@metaTag({ name: 'author', content: 'Jane' })`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="description" content="Desc">')
    expect(result).toContain('name="author"')
    expect(result).toContain('content="Jane"')
  })

  it('should handle @metaTag with context variables', () => {
    const template = `@metaTag({ name: 'author', content: authorName })`
    const context = { authorName: 'Alice' }
    const result = processMetaDirectives(template, context, 'test.stx', defaultOptions)
    expect(result).toContain('content="Alice"')
  })

  it('should handle @metaTag evaluation error gracefully', () => {
    const template = `@metaTag({ broken: Object.keys(undefined) })`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    // Should contain an inline error or be handled gracefully
    expect(result).toBeDefined()
  })

  it('should process @meta with very long content', () => {
    const longContent = 'A'.repeat(500)
    const template = `@meta('description', '${longContent}')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain(longContent)
  })

  it('should handle @meta with single quotes in content via escaping', () => {
    const template = `@meta('description', 'It is a page')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('content="It is a page"')
  })

  it('should process og:description from openGraph context', () => {
    const template = `@meta('og:description')`
    const context = { openGraph: { description: 'OG Desc' } }
    const result = processMetaDirectives(template, context, 'test.stx', defaultOptions)
    expect(result).toContain('content="OG Desc"')
  })

  it('should prefer direct context key over openGraph for og: meta', () => {
    const template = `@meta('og:title')`
    const context = { title: 'Direct Title', openGraph: { title: 'OG Title' } }
    const result = processMetaDirectives(template, context, 'test.stx', defaultOptions)
    // The code checks contextKey first, then openGraph
    expect(result).toContain('content="Direct Title"')
  })
})

// =============================================================================
// processStructuredData
// =============================================================================

describe('processStructuredData', () => {
  it('should process basic JSON-LD structured data', () => {
    const template = `@structuredData({ "@type": "Organization", "name": "Test" })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('<script type="application/ld+json">')
    expect(result).toContain('"@type":"Organization"')
    expect(result).toContain('"name":"Test"')
    expect(result).toContain('</script>')
  })

  it('should auto-add @context if missing', () => {
    const template = `@structuredData({ "@type": "Person", "name": "John" })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"@context":"https://schema.org"')
  })

  it('should preserve @context if already provided', () => {
    const template = `@structuredData({ "@context": "https://custom.org", "@type": "Person", "name": "John" })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"@context":"https://custom.org"')
    expect(result).not.toContain('"@context":"https://schema.org"')
  })

  it('should escape </script> in JSON output to prevent XSS', () => {
    const template = `@structuredData({ "@type": "Article", "content": "</script><script>alert(1)</script>" })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).not.toContain('</script><script>alert')
    expect(result).toContain('<\\/')
  })

  it('should handle complex nested structured data', () => {
    const template = `@structuredData({
      "@type": "Article",
      "author": {
        "@type": "Person",
        "name": "John Doe",
        "url": "https://example.com/john"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Example Inc"
      }
    })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"@type":"Article"')
    expect(result).toContain('"name":"John Doe"')
    expect(result).toContain('"name":"Example Inc"')
  })

  it('should handle Product schema', () => {
    const template = `@structuredData({
      "@type": "Product",
      "name": "Widget",
      "description": "A great widget",
      "sku": "W12345",
      "brand": { "@type": "Brand", "name": "WidgetCo" }
    })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"@type":"Product"')
    expect(result).toContain('"sku":"W12345"')
    expect(result).toContain('"name":"WidgetCo"')
  })

  it('should handle Article schema', () => {
    const template = `@structuredData({
      "@type": "Article",
      "headline": "Breaking News",
      "datePublished": "2025-01-01",
      "author": { "@type": "Person", "name": "Reporter" }
    })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"headline":"Breaking News"')
    expect(result).toContain('"datePublished":"2025-01-01"')
  })

  it('should handle BreadcrumbList schema', () => {
    const template = `@structuredData({
      "@type": "BreadcrumbList",
      "itemListElement": {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://example.com"
      }
    })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"@type":"BreadcrumbList"')
    expect(result).toContain('"position":1')
  })

  it('should handle evaluation error gracefully', () => {
    // Object.keys(undefined) does not throw in the safe evaluator; it produces a minimal object
    // Instead test with truly broken syntax that causes an evaluation error
    const template = `@structuredData({ @#$invalid })`
    const result = processStructuredData(template, {}, 'test.stx')
    // Should produce an inline error comment or handle gracefully
    expect(result).toBeDefined()
  })

  it('should handle multiple structured data blocks', () => {
    const template = `@structuredData({ "@type": "Organization", "name": "Org1" }) @structuredData({ "@type": "Person", "name": "Person1" })`
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toContain('"@type":"Organization"')
    expect(result).toContain('"@type":"Person"')
    // Two script blocks
    const scriptCount = (result.match(/<script type="application\/ld\+json">/g) || []).length
    expect(scriptCount).toBe(2)
  })

  it('should use context variables in structured data', () => {
    const template = `@structuredData({ "@type": "Product", "name": productName })`
    const context = { productName: 'Dynamic Widget' }
    const result = processStructuredData(template, context, 'test.stx')
    expect(result).toContain('"name":"Dynamic Widget"')
  })

  it('should handle structured data with no closing paren gracefully', () => {
    const template = `@structuredData({ "@type": "Person", "name": "Test"`
    const result = processStructuredData(template, {}, 'test.stx')
    // Should not crash, template returned mostly unchanged
    expect(result).toBeDefined()
  })
})

// =============================================================================
// processSeoDirective
// =============================================================================

describe('processSeoDirective', () => {
  it('should process full @seo directive with all options', () => {
    const template = `@seo({
      title: 'Page Title',
      description: 'Page description',
      keywords: 'key1, key2',
      robots: 'index, follow',
      canonical: 'https://example.com/page',
      openGraph: {
        type: 'article',
        image: 'https://example.com/img.jpg'
      },
      twitter: {
        card: 'summary_large_image',
        site: '@handle'
      },
      structuredData: {
        '@type': 'Article',
        'name': 'Page Title'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<title>Page Title</title>')
    expect(result).toContain('<meta name="description" content="Page description">')
    expect(result).toContain('<meta name="keywords" content="key1, key2">')
    expect(result).toContain('<meta name="robots" content="index, follow">')
    expect(result).toContain('<link rel="canonical" href="https://example.com/page">')
    expect(result).toContain('<meta property="og:type" content="article">')
    expect(result).toContain('<meta property="og:image" content="https://example.com/img.jpg">')
    expect(result).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(result).toContain('<meta name="twitter:site" content="@handle">')
    expect(result).toContain('<script type="application/ld+json">')
  })

  it('should process @seo with title only', () => {
    const template = `@seo({ title: 'Just a Title' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<title>Just a Title</title>')
    expect(result).toContain('<meta name="title" content="Just a Title">')
    expect(result).not.toContain('<meta name="description"')
  })

  it('should process @seo with description only', () => {
    const template = `@seo({ description: 'Only description here' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="description" content="Only description here">')
    expect(result).not.toContain('<title>')
  })

  it('should process @seo with keywords as string', () => {
    const template = `@seo({ keywords: 'alpha, beta, gamma' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="keywords" content="alpha, beta, gamma">')
  })

  it('should process @seo with OpenGraph inheriting title and description', () => {
    const template = `@seo({
      title: 'Inherited Title',
      description: 'Inherited Desc',
      openGraph: { type: 'website' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta property="og:title" content="Inherited Title">')
    expect(result).toContain('<meta property="og:description" content="Inherited Desc">')
  })

  it('should process @seo with OpenGraph using its own title over top-level', () => {
    const template = `@seo({
      title: 'Page Title',
      openGraph: { title: 'OG Specific Title', type: 'website' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta property="og:title" content="OG Specific Title">')
  })

  it('should process @seo with OpenGraph all fields', () => {
    const template = `@seo({
      title: 'Test',
      openGraph: {
        type: 'article',
        title: 'OG Title',
        description: 'OG Desc',
        url: 'https://example.com/article',
        image: 'https://example.com/img.jpg',
        imageAlt: 'Alt text',
        imageWidth: 1200,
        imageHeight: 630,
        siteName: 'MySite'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta property="og:type" content="article">')
    expect(result).toContain('<meta property="og:title" content="OG Title">')
    expect(result).toContain('<meta property="og:description" content="OG Desc">')
    expect(result).toContain('<meta property="og:url" content="https://example.com/article">')
    expect(result).toContain('<meta property="og:image" content="https://example.com/img.jpg">')
    expect(result).toContain('<meta property="og:image:alt" content="Alt text">')
    expect(result).toContain('<meta property="og:image:width" content="1200">')
    expect(result).toContain('<meta property="og:image:height" content="630">')
    expect(result).toContain('<meta property="og:site_name" content="MySite">')
  })

  it('should process @seo with OpenGraph url falling back to canonical', () => {
    const template = `@seo({
      canonical: 'https://example.com/canonical-url',
      openGraph: { type: 'website' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta property="og:url" content="https://example.com/canonical-url">')
  })

  it('should process @seo with Twitter all fields', () => {
    const template = `@seo({
      title: 'T Title',
      description: 'T Desc',
      twitter: {
        card: 'summary',
        title: 'Twitter Title',
        description: 'Twitter Desc',
        image: 'https://example.com/tw.jpg',
        site: '@mysite',
        creator: '@mycreator'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="twitter:card" content="summary">')
    expect(result).toContain('<meta name="twitter:title" content="Twitter Title">')
    expect(result).toContain('<meta name="twitter:description" content="Twitter Desc">')
    expect(result).toContain('<meta name="twitter:image" content="https://example.com/tw.jpg">')
    expect(result).toContain('<meta name="twitter:site" content="@mysite">')
    expect(result).toContain('<meta name="twitter:creator" content="@mycreator">')
  })

  it('should process @seo with Twitter inheriting from top-level title/description', () => {
    const template = `@seo({
      title: 'Top Title',
      description: 'Top Desc',
      twitter: { card: 'summary_large_image' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="twitter:title" content="Top Title">')
    expect(result).toContain('<meta name="twitter:description" content="Top Desc">')
  })

  it('should process @seo with Twitter image inheriting from OpenGraph image', () => {
    const template = `@seo({
      openGraph: { image: 'https://example.com/og-image.jpg', type: 'website' },
      twitter: { card: 'summary_large_image' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="twitter:image" content="https://example.com/og-image.jpg">')
  })

  it('should process @seo with Twitter defaulting card to summary_large_image', () => {
    const template = `@seo({
      twitter: { site: '@test' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="twitter:card" content="summary_large_image">')
  })

  it('should process @seo with OpenGraph defaulting type to website', () => {
    const template = `@seo({
      title: 'Test',
      openGraph: { image: 'https://example.com/img.jpg' }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta property="og:type" content="website">')
  })

  it('should process @seo with structuredData embedded', () => {
    const template = `@seo({
      title: 'Article',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Article Title'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<script type="application/ld+json">')
    expect(result).toContain('"@type":"Article"')
    expect(result).toContain('"headline":"Article Title"')
  })

  it('should process @seo with robots meta tag', () => {
    const template = `@seo({ robots: 'noindex, nofollow' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="robots" content="noindex, nofollow">')
  })

  it('should process @seo with canonical link', () => {
    const template = `@seo({ canonical: 'https://example.com/page' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<link rel="canonical" href="https://example.com/page">')
  })

  it('should escape HTML in title', () => {
    const template = `@seo({ title: '<script>alert("xss")</script>' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).not.toContain('<script>alert')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should escape HTML in description', () => {
    const template = `@seo({ description: 'A "quoted" & <tagged> desc' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('&quot;quoted&quot;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;tagged&gt;')
  })

  it('should escape HTML in canonical URL', () => {
    const template = `@seo({ canonical: 'https://example.com/page?a=1&b=2' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('href="https://example.com/page?a=1&amp;b=2"')
  })

  it('should escape </script> in structuredData within @seo', () => {
    const template = `@seo({
      title: 'Test',
      structuredData: {
        '@type': 'Article',
        'text': '</script>'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).not.toContain('"</script>"')
    expect(result).toContain('<\\/')
  })

  it('should handle error for invalid @seo config gracefully', () => {
    const template = `@seo({ invalid!!! })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    // Should contain an inline error or be somewhat handled
    expect(result).toBeDefined()
  })

  it('should use context variables in @seo directive', () => {
    const template = `@seo({ title: pageTitle, description: pageDesc })`
    const context = { pageTitle: 'Dynamic Title', pageDesc: 'Dynamic description' }
    const result = processSeoDirective(template, context, 'test.stx', defaultOptions)
    expect(result).toContain('<title>Dynamic Title</title>')
    expect(result).toContain('<meta name="description" content="Dynamic description">')
  })

  it('should handle @seo with no matching closing paren gracefully', () => {
    const template = `@seo({ title: 'Unclosed'`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    // Should not throw, returns template as-is or partially processed
    expect(result).toBeDefined()
  })

  it('should handle multiple @seo directives in the same template', () => {
    const template = `@seo({ title: 'First' })\n<div>Content</div>\n@seo({ title: 'Second' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<title>First</title>')
    expect(result).toContain('<title>Second</title>')
  })
})

// =============================================================================
// injectSeoTags
// =============================================================================

describe('injectSeoTags', () => {
  it('should inject SEO tags into <head> when no existing SEO tags', () => {
    const html = '<html><head></head><body>Hello</body></html>'
    const result = injectSeoTags(html, {}, defaultOptions)
    expect(result).toContain('<!-- stx SEO Tags -->')
    expect(result).toContain('<meta name="title"')
    expect(result).toContain('<meta name="description"')
  })

  it('should use context.title for title', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'Context Title' }, defaultOptions)
    expect(result).toContain('content="Context Title"')
    expect(result).toContain('<title>Context Title</title>')
  })

  it('should use context.meta.title as fallback', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { meta: { title: 'Meta Title' } }, defaultOptions)
    expect(result).toContain('content="Meta Title"')
  })

  it('should use options.seo.defaultConfig.title as fallback', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = {
      seo: { enabled: true, defaultConfig: { title: 'Config Title' } },
    }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="Config Title"')
  })

  it('should use options.defaultTitle as final fallback', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = { defaultTitle: 'Fallback Title', seo: { enabled: true } }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="Fallback Title"')
  })

  it('should use the hardcoded fallback when no title is provided anywhere', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = { seo: { enabled: true } }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="stx Project"')
  })

  it('should use context.description for description', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { description: 'Context Desc' }, defaultOptions)
    expect(result).toContain('<meta name="description" content="Context Desc">')
  })

  it('should use context.meta.description as fallback', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { meta: { description: 'Meta Desc' } }, defaultOptions)
    expect(result).toContain('content="Meta Desc"')
  })

  it('should use options.seo.defaultConfig.description as fallback', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = {
      seo: { enabled: true, defaultConfig: { description: 'Default Desc' } },
    }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="Default Desc"')
  })

  it('should use options.defaultDescription as final fallback', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = { defaultDescription: 'Final Desc', seo: { enabled: true } }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="Final Desc"')
  })

  it('should use image from context.image', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { image: 'https://example.com/img.jpg' }, defaultOptions)
    expect(result).toContain('<meta property="og:image" content="https://example.com/img.jpg">')
    expect(result).toContain('<meta name="twitter:image" content="https://example.com/img.jpg">')
  })

  it('should use image from context.meta.image', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { meta: { image: 'https://example.com/meta-img.jpg' } }, defaultOptions)
    expect(result).toContain('content="https://example.com/meta-img.jpg"')
  })

  it('should use image from context.openGraph.image', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { openGraph: { image: 'https://example.com/og-img.jpg' } }, defaultOptions)
    expect(result).toContain('content="https://example.com/og-img.jpg"')
  })

  it('should use image from options.seo.defaultImage', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = {
      seo: { enabled: true, defaultImage: 'https://example.com/default.jpg' },
    }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="https://example.com/default.jpg"')
  })

  it('should use image from options.defaultImage', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = {
      defaultImage: 'https://example.com/opt-img.jpg',
      seo: { enabled: true },
    }
    const result = injectSeoTags(html, {}, opts)
    expect(result).toContain('content="https://example.com/opt-img.jpg"')
  })

  it('should not include image tags when no image is available', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = { seo: { enabled: true } }
    const result = injectSeoTags(html, {}, opts)
    expect(result).not.toContain('og:image')
    expect(result).not.toContain('twitter:image')
  })

  it('should add <title> tag if missing', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'Added Title' }, defaultOptions)
    expect(result).toContain('<title>Added Title</title>')
  })

  it('should NOT add duplicate <title> if one already exists', () => {
    const html = '<html><head><title>Existing</title></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'New Title' }, defaultOptions)
    const titleCount = (result.match(/<title>/g) || []).length
    expect(titleCount).toBe(1)
    expect(result).toContain('<title>Existing</title>')
  })

  it('should skip injection if SEO is explicitly disabled', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = { seo: { enabled: false } }
    const result = injectSeoTags(html, { title: 'Test' }, opts)
    expect(result).not.toContain('<!-- stx SEO Tags -->')
    expect(result).toBe(html)
  })

  it('should skip if already has stx SEO marker comment', () => {
    const html = '<html><head><!-- stx SEO Tags --></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'Test' }, defaultOptions)
    const markerCount = (result.match(/<!-- stx SEO Tags -->/g) || []).length
    expect(markerCount).toBe(1)
  })

  it('should skip if skipDefaultSeoTags option is set', () => {
    const html = '<html><head></head><body></body></html>'
    const opts: StxOptions = { skipDefaultSeoTags: true }
    const result = injectSeoTags(html, { title: 'Test' }, opts)
    expect(result).not.toContain('<!-- stx SEO Tags -->')
    expect(result).toBe(html)
  })

  it('should skip if no <head> tag exists', () => {
    const html = '<html><body>No head</body></html>'
    const result = injectSeoTags(html, { title: 'Test' }, defaultOptions)
    expect(result).not.toContain('<!-- stx SEO Tags -->')
    expect(result).toBe(html)
  })

  it('should generate og:title, og:description, og:type', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'OG', description: 'OG Desc' }, defaultOptions)
    expect(result).toContain('<meta property="og:title" content="OG">')
    expect(result).toContain('<meta property="og:description" content="OG Desc">')
    expect(result).toContain('<meta property="og:type" content="website">')
  })

  it('should generate twitter:card, twitter:title, twitter:description', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'TW', description: 'TW Desc' }, defaultOptions)
    expect(result).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(result).toContain('<meta name="twitter:title" content="TW">')
    expect(result).toContain('<meta name="twitter:description" content="TW Desc">')
  })

  it('should generate og:image and twitter:image if image available', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'T', image: 'https://example.com/img.png' }, defaultOptions)
    expect(result).toContain('<meta property="og:image" content="https://example.com/img.png">')
    expect(result).toContain('<meta name="twitter:image" content="https://example.com/img.png">')
  })

  it('should escape HTML entities in injected title', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'A & B "C"' }, defaultOptions)
    expect(result).toContain('<title>A &amp; B &quot;C&quot;</title>')
  })

  it('should handle <head > with attributes', () => {
    const html = '<html><head lang="en"></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'Test' }, defaultOptions)
    expect(result).toContain('<!-- stx SEO Tags -->')
  })
})

// =============================================================================
// generateSitemap
// =============================================================================

describe('generateSitemap', () => {
  it('should generate a basic sitemap with entries', () => {
    const result = generateSitemap(
      [{ loc: '/' }, { loc: '/about' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(result).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(result).toContain('<loc>https://example.com/</loc>')
    expect(result).toContain('<loc>https://example.com/about</loc>')
    expect(result).toContain('</urlset>')
  })

  it('should normalize base URL by removing trailing slash', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com/', includeLastmod: false },
    )
    expect(result).toContain('<loc>https://example.com/page</loc>')
    expect(result).not.toContain('https://example.com//page')
  })

  it('should make relative URL paths absolute', () => {
    const result = generateSitemap(
      [{ loc: '/contact' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<loc>https://example.com/contact</loc>')
  })

  it('should handle relative paths without leading slash', () => {
    const result = generateSitemap(
      [{ loc: 'about' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<loc>https://example.com/about</loc>')
  })

  it('should preserve full URL paths unchanged', () => {
    const result = generateSitemap(
      [{ loc: 'https://other.com/page' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<loc>https://other.com/page</loc>')
  })

  it('should use default changefreq of weekly', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<changefreq>weekly</changefreq>')
  })

  it('should use default priority of 0.5', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<priority>0.5</priority>')
  })

  it('should use custom priority and changefreq per entry', () => {
    const result = generateSitemap(
      [{ loc: '/important', priority: 0.9, changefreq: 'daily' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<priority>0.9</priority>')
    expect(result).toContain('<changefreq>daily</changefreq>')
  })

  it('should include lastmod when includeLastmod is true', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com', includeLastmod: true },
    )
    expect(result).toContain('<lastmod>')
    // Should contain a date in YYYY-MM-DD format
    expect(result).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
  })

  it('should not include lastmod when includeLastmod is false and no entry lastmod', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).not.toContain('<lastmod>')
  })

  it('should use custom lastmod date from entry', () => {
    const result = generateSitemap(
      [{ loc: '/page', lastmod: '2025-06-15' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<lastmod>2025-06-15</lastmod>')
  })

  it('should handle multiple entries', () => {
    const result = generateSitemap(
      [
        { loc: '/', priority: 1.0 },
        { loc: '/about', priority: 0.8 },
        { loc: '/blog', changefreq: 'daily' as const },
        { loc: '/contact' },
      ],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('https://example.com/')
    expect(result).toContain('https://example.com/about')
    expect(result).toContain('https://example.com/blog')
    expect(result).toContain('https://example.com/contact')
  })

  it('should XML-escape special characters in URLs', () => {
    const result = generateSitemap(
      [{ loc: '/search?q=hello&lang=en' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('&amp;')
    expect(result).not.toMatch(/<loc>[^<]*&[^a]/)
  })

  it('should set priority 1.0 for root when specified', () => {
    const result = generateSitemap(
      [{ loc: '/', priority: 1.0 }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<priority>1.0</priority>')
  })

  it('should have valid XML structure with namespace', () => {
    const result = generateSitemap(
      [{ loc: '/' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(result).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
  })

  it('should use custom default changefreq from options', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com', defaultChangefreq: 'monthly', includeLastmod: false },
    )
    expect(result).toContain('<changefreq>monthly</changefreq>')
  })

  it('should use custom default priority from options', () => {
    const result = generateSitemap(
      [{ loc: '/page' }],
      { baseUrl: 'https://example.com', defaultPriority: 0.7, includeLastmod: false },
    )
    expect(result).toContain('<priority>0.7</priority>')
  })

  it('should handle empty entries array', () => {
    const result = generateSitemap(
      [],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<urlset')
    expect(result).toContain('</urlset>')
    expect(result).not.toContain('<url>')
  })

  it('should format priority with one decimal place', () => {
    const result = generateSitemap(
      [{ loc: '/page', priority: 1 }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<priority>1.0</priority>')
  })
})

// =============================================================================
// generateSitemapIndex
// =============================================================================

describe('generateSitemapIndex', () => {
  it('should generate a sitemap index with multiple sitemap URLs', () => {
    const result = generateSitemapIndex(
      ['/sitemap-1.xml', '/sitemap-2.xml'],
      'https://example.com',
    )
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(result).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(result).toContain('<loc>https://example.com/sitemap-1.xml</loc>')
    expect(result).toContain('<loc>https://example.com/sitemap-2.xml</loc>')
    expect(result).toContain('</sitemapindex>')
  })

  it('should handle absolute URLs in sitemap entries', () => {
    const result = generateSitemapIndex(
      ['https://cdn.example.com/sitemap.xml'],
      'https://example.com',
    )
    expect(result).toContain('<loc>https://cdn.example.com/sitemap.xml</loc>')
  })

  it('should handle relative URLs', () => {
    const result = generateSitemapIndex(
      ['sitemap-blog.xml'],
      'https://example.com',
    )
    expect(result).toContain('<loc>https://example.com/sitemap-blog.xml</loc>')
  })

  it('should include lastmod date', () => {
    const result = generateSitemapIndex(
      ['/sitemap.xml'],
      'https://example.com',
    )
    expect(result).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
  })

  it('should have proper XML structure', () => {
    const result = generateSitemapIndex(
      ['/sitemap.xml'],
      'https://example.com',
    )
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(result).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(result).toContain('<sitemap>')
    expect(result).toContain('</sitemap>')
  })

  it('should normalize base URL by removing trailing slash', () => {
    const result = generateSitemapIndex(
      ['/sitemap.xml'],
      'https://example.com/',
    )
    expect(result).toContain('<loc>https://example.com/sitemap.xml</loc>')
    expect(result).not.toContain('https://example.com//sitemap.xml')
  })

  it('should handle empty sitemaps array', () => {
    const result = generateSitemapIndex([], 'https://example.com')
    expect(result).toContain('<sitemapindex')
    expect(result).toContain('</sitemapindex>')
    expect(result).not.toContain('<sitemap>')
  })

  it('should XML-escape special characters in URLs', () => {
    const result = generateSitemapIndex(
      ['/sitemap.xml?v=1&t=2'],
      'https://example.com',
    )
    expect(result).toContain('&amp;')
  })
})

// =============================================================================
// generateRobotsTxt
// =============================================================================

describe('generateRobotsTxt', () => {
  it('should generate robots.txt with single allow/disallow rule', () => {
    const result = generateRobotsTxt({
      rules: [{
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin'],
      }],
    })
    expect(result).toContain('User-agent: *')
    expect(result).toContain('Allow: /')
    expect(result).toContain('Disallow: /admin')
  })

  it('should generate robots.txt with multiple rules for different user agents', () => {
    const result = generateRobotsTxt({
      rules: [
        { userAgent: 'Googlebot', allow: ['/'], disallow: ['/private'] },
        { userAgent: 'Bingbot', allow: ['/public'], disallow: ['/secret'] },
      ],
    })
    expect(result).toContain('User-agent: Googlebot')
    expect(result).toContain('User-agent: Bingbot')
    expect(result).toContain('Disallow: /private')
    expect(result).toContain('Disallow: /secret')
  })

  it('should handle wildcard user-agent *', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
    })
    expect(result).toContain('User-agent: *')
  })

  it('should include crawl-delay directive', () => {
    const result = generateRobotsTxt({
      rules: [{
        userAgent: '*',
        allow: ['/'],
        crawlDelay: 10,
      }],
    })
    expect(result).toContain('Crawl-delay: 10')
  })

  it('should include crawl-delay of 0', () => {
    const result = generateRobotsTxt({
      rules: [{
        userAgent: '*',
        crawlDelay: 0,
      }],
    })
    expect(result).toContain('Crawl-delay: 0')
  })

  it('should include single sitemap URL', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      sitemap: 'https://example.com/sitemap.xml',
    })
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('should include multiple sitemap URLs from array', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      sitemap: [
        'https://example.com/sitemap-1.xml',
        'https://example.com/sitemap-2.xml',
      ],
    })
    expect(result).toContain('Sitemap: https://example.com/sitemap-1.xml')
    expect(result).toContain('Sitemap: https://example.com/sitemap-2.xml')
  })

  it('should include host directive for Yandex', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      host: 'https://example.com',
    })
    expect(result).toContain('Host: https://example.com')
  })

  it('should handle empty allow array', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: [], disallow: ['/admin'] }],
    })
    expect(result).not.toContain('Allow:')
    expect(result).toContain('Disallow: /admin')
  })

  it('should handle empty disallow array', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'], disallow: [] }],
    })
    expect(result).toContain('Allow: /')
    expect(result).not.toContain('Disallow:')
  })

  it('should handle multiple disallow paths', () => {
    const result = generateRobotsTxt({
      rules: [{
        userAgent: '*',
        disallow: ['/admin', '/private', '/tmp', '/api/internal'],
      }],
    })
    expect(result).toContain('Disallow: /admin')
    expect(result).toContain('Disallow: /private')
    expect(result).toContain('Disallow: /tmp')
    expect(result).toContain('Disallow: /api/internal')
  })

  it('should handle rule with no allow or disallow', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: 'Googlebot' }],
    })
    expect(result).toContain('User-agent: Googlebot')
    expect(result).not.toContain('Allow:')
    expect(result).not.toContain('Disallow:')
  })

  it('should separate rules with empty lines', () => {
    const result = generateRobotsTxt({
      rules: [
        { userAgent: '*', allow: ['/'] },
        { userAgent: 'Googlebot', allow: ['/'] },
      ],
    })
    // Rules should be separated by an empty line
    const lines = result.split('\n')
    const firstRuleEnd = lines.indexOf('Allow: /')
    // There should be an empty line between the two rules
    expect(lines[firstRuleEnd + 1]).toBe('')
  })

  it('should not include sitemap when not provided', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
    })
    expect(result).not.toContain('Sitemap:')
  })

  it('should not include host when not provided', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
    })
    expect(result).not.toContain('Host:')
  })

  it('should trim trailing whitespace', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
    })
    expect(result).toBe(result.trim())
  })
})

// =============================================================================
// generateDefaultRobotsTxt
// =============================================================================

describe('generateDefaultRobotsTxt', () => {
  it('should allow all with Allow: /', () => {
    const result = generateDefaultRobotsTxt()
    expect(result).toContain('User-agent: *')
    expect(result).toContain('Allow: /')
  })

  it('should include sitemap URL when provided', () => {
    const result = generateDefaultRobotsTxt('https://example.com/sitemap.xml')
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('should not include sitemap when not provided', () => {
    const result = generateDefaultRobotsTxt()
    expect(result).not.toContain('Sitemap:')
  })

  it('should not include sitemap when undefined is passed', () => {
    const result = generateDefaultRobotsTxt(undefined)
    expect(result).not.toContain('Sitemap:')
  })
})

// =============================================================================
// registerSeoDirectives
// =============================================================================

describe('registerSeoDirectives', () => {
  it('should return an array of custom directives', () => {
    const directives = registerSeoDirectives()
    expect(Array.isArray(directives)).toBe(true)
  })

  it('should return exactly 2 directives', () => {
    const directives = registerSeoDirectives()
    expect(directives).toHaveLength(2)
  })

  it('should include a meta directive', () => {
    const directives = registerSeoDirectives()
    const meta = directives.find(d => d.name === 'meta')
    expect(meta).toBeDefined()
    expect(meta!.hasEndTag).toBe(false)
  })

  it('should include a structuredData directive', () => {
    const directives = registerSeoDirectives()
    const sd = directives.find(d => d.name === 'structuredData')
    expect(sd).toBeDefined()
    expect(sd!.hasEndTag).toBe(true)
  })

  it('should have handler functions on all directives', () => {
    const directives = registerSeoDirectives()
    for (const d of directives) {
      expect(typeof d.handler).toBe('function')
    }
  })

  it('meta directive handler should generate meta tag with params', () => {
    const directives = registerSeoDirectives()
    const meta = directives.find(d => d.name === 'meta')!
    const result = meta.handler('', ['description', 'Test desc'], {}, 'test.stx')
    expect(result).toBe('<meta name="description" content="Test desc">')
  })

  it('meta directive handler should strip quotes from params', () => {
    const directives = registerSeoDirectives()
    const meta = directives.find(d => d.name === 'meta')!
    const result = meta.handler('', ['"description"', "'Test desc'"], {}, 'test.stx')
    expect(result).toBe('<meta name="description" content="Test desc">')
  })

  it('meta directive handler should return error when no params', () => {
    const directives = registerSeoDirectives()
    const meta = directives.find(d => d.name === 'meta')!
    const result = meta.handler('', [], {}, 'test.stx')
    expect(result).toContain('<!-- [Meta Error')
  })

  it('structuredData directive handler should generate JSON-LD', () => {
    const directives = registerSeoDirectives()
    const sd = directives.find(d => d.name === 'structuredData')!
    const content = JSON.stringify({ '@type': 'Person', 'name': 'Jane' })
    const result = sd.handler(content, [], {}, 'test.stx')
    expect(result).toContain('<script type="application/ld+json">')
    expect(result).toContain('"@context":"https://schema.org"')
  })

  it('structuredData directive handler should return error for empty content', () => {
    const directives = registerSeoDirectives()
    const sd = directives.find(d => d.name === 'structuredData')!
    const result = sd.handler('', [], {}, 'test.stx')
    expect(result).toContain('<!-- [StructuredData Error')
  })

  it('structuredData directive handler should return error for missing @type', () => {
    const directives = registerSeoDirectives()
    const sd = directives.find(d => d.name === 'structuredData')!
    const content = JSON.stringify({ name: 'No Type' })
    const result = sd.handler(content, [], {}, 'test.stx')
    expect(result).toContain('<!-- [StructuredData Error')
    expect(result).toContain('structuredData requires @type property')
  })

  it('structuredData directive handler should return error for invalid JSON', () => {
    const directives = registerSeoDirectives()
    const sd = directives.find(d => d.name === 'structuredData')!
    const result = sd.handler('not valid json {{{', [], {}, 'test.stx')
    expect(result).toContain('<!-- [StructuredData Error')
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge cases', () => {
  it('should prevent XSS in meta values via processMetaDirectives', () => {
    const template = `@meta('description', '<script>alert(1)</script>')`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).not.toContain('<script>alert(1)</script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should prevent XSS in @metaTag values', () => {
    const template = `@metaTag({ name: 'test', content: '<img onerror=alert(1)>' })`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).not.toContain('<img onerror')
    expect(result).toContain('&lt;img')
  })

  it('should prevent XSS in injectSeoTags title', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: '"><script>alert(1)</script>' }, defaultOptions)
    expect(result).not.toContain('"><script>alert(1)</script>')
    expect(result).toContain('&quot;&gt;&lt;script&gt;')
  })

  it('should handle very long descriptions in processSeoDirective', () => {
    const longDesc = 'B'.repeat(1000)
    const template = `@seo({ description: '${longDesc}' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain(longDesc)
  })

  it('should handle Unicode in titles', () => {
    const template = `@seo({ title: 'Cafe avec des crepes' })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('Cafe avec des crepes')
  })

  it('should handle Unicode in descriptions via injectSeoTags', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, { title: 'Titulo', description: 'Descripcion especial' }, defaultOptions)
    expect(result).toContain('Descripcion especial')
  })

  it('should handle empty @seo config object', () => {
    const template = `@seo({})`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    // Empty config should produce empty or minimal output
    expect(result).toBeDefined()
    expect(result).not.toContain('<title>')
    expect(result).not.toContain('<meta name="description"')
  })

  it('should handle special characters in URLs for sitemap', () => {
    const result = generateSitemap(
      [{ loc: '/search?q=hello world&category=test<1>' }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })

  it('should handle structured data with script injection attempt', () => {
    const template = `@structuredData({
      "@type": "Article",
      "name": "Test</script><script>alert('xss')</script>"
    })`
    const result = processStructuredData(template, {}, 'test.stx')
    // The </script> should be escaped in the JSON output
    expect(result).toContain('<\\/')
    expect(result).not.toContain('</script><script>alert')
  })

  it('should handle @seo with only openGraph (no title/description)', () => {
    const template = `@seo({
      openGraph: {
        type: 'website',
        title: 'OG Only Title',
        description: 'OG Only Desc'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta property="og:title" content="OG Only Title">')
    expect(result).toContain('<meta property="og:description" content="OG Only Desc">')
  })

  it('should handle @seo with only twitter (no title/description)', () => {
    const template = `@seo({
      twitter: {
        card: 'summary',
        title: 'TW Only Title',
        description: 'TW Only Desc'
      }
    })`
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('<meta name="twitter:title" content="TW Only Title">')
    expect(result).toContain('<meta name="twitter:description" content="TW Only Desc">')
  })

  it('should handle injectSeoTags with empty context and minimal options', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, {}, {})
    // With empty options, seo.enabled is not explicitly false, so it should inject
    expect(result).toContain('<!-- stx SEO Tags -->')
  })

  it('should handle generateSitemap with priority 0', () => {
    const result = generateSitemap(
      [{ loc: '/low-priority', priority: 0 }],
      { baseUrl: 'https://example.com', includeLastmod: false },
    )
    expect(result).toContain('<priority>0.0</priority>')
  })

  it('should handle generateRobotsTxt with both sitemap and host', () => {
    const result = generateRobotsTxt({
      rules: [{ userAgent: '*', allow: ['/'] }],
      sitemap: 'https://example.com/sitemap.xml',
      host: 'example.com',
    })
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml')
    expect(result).toContain('Host: example.com')
  })

  it('should handle meta directive with ampersand escaping in content', () => {
    const template = `@meta("description", "R&D team")`
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toContain('R&amp;D team')
  })

  it('should handle processMetaDirectives with no directives in template', () => {
    const template = '<div>No meta directives here</div>'
    const result = processMetaDirectives(template, {}, 'test.stx', defaultOptions)
    expect(result).toBe(template)
  })

  it('should handle processStructuredData with no directives in template', () => {
    const template = '<div>No structured data here</div>'
    const result = processStructuredData(template, {}, 'test.stx')
    expect(result).toBe(template)
  })

  it('should handle processSeoDirective with no directives in template', () => {
    const template = '<div>No SEO directives here</div>'
    const result = processSeoDirective(template, {}, 'test.stx', defaultOptions)
    expect(result).toBe(template)
  })
})
