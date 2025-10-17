import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import {
  injectSeoTags,
  metaDirective,
  processMetaDirectives,
  processSeoDirective,
  processStructuredData,
  registerSeoDirectives,
  structuredDataDirective,
} from '../../src/seo'
import { cleanupTestDirs, createTestFile, setupTestDirs } from '../utils'

describe('SEO features', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(async () => {
    await cleanupTestDirs()
  })

  describe('processMetaDirectives', () => {
    test('should process @meta directive with name and content', () => {
      const template = '<head>@meta("description", "This is a test page")</head>'
      const result = processMetaDirectives(template, {}, 'test.stx', {})
      expect(result).toContain('<meta name="description" content="This is a test page">')
    })

    test('should process @meta directive with property from context', () => {
      const template = '<head>@meta("og:title")</head>'
      const context = { title: 'Test Page' }
      const result = processMetaDirectives(template, context, 'test.stx', {})
      expect(result).toContain('<meta property="og:title" content="Test Page">')
    })

    test('should process @meta directive with property from openGraph context', () => {
      const template = '<head>@meta("og:title")</head>'
      const context = {
        openGraph: {
          title: 'Test Page OG',
        },
      }
      const result = processMetaDirectives(template, context, 'test.stx', {})
      expect(result).toContain('<meta property="og:title" content="Test Page OG">')
    })

    test('should process @metaTag directive with object of attributes', () => {
      const template = '<head>@metaTag({ name: "viewport", content: "width=device-width" })</head>'
      const result = processMetaDirectives(template, {}, 'test.stx', {})
      expect(result).toContain('<meta name="viewport" content="width=device-width">')
    })

    test('should process @metaTag directive with property attribute', () => {
      const template = '<head>@metaTag({ property: "og:image", content: "https://example.com/image.jpg" })</head>'
      const result = processMetaDirectives(template, {}, 'test.stx', {})
      expect(result).toContain('<meta property="og:image" content="https://example.com/image.jpg">')
    })

    test('should process @metaTag directive with http-equiv attribute', () => {
      const template = '<head>@metaTag({ httpEquiv: "content-type", content: "text/html; charset=UTF-8" })</head>'
      const result = processMetaDirectives(template, {}, 'test.stx', {})
      expect(result).toContain('<meta http-equiv="content-type" content="text/html; charset=UTF-8">')
    })

    test('should handle errors in @metaTag directive', () => {
      const template = '<head>@metaTag({ broken: Object.keys(undefined) })</head>'
      const result = processMetaDirectives(template, {}, 'test.stx', {})
      expect(result).toContain('<!-- Error in @metaTag:')
    })
  })

  describe('processStructuredData', () => {
    test('should process @structuredData directive with JSON-LD data', () => {
      const template = `<head>@structuredData({
        "@type": "Organization",
        "name": "Test Company",
        "url": "https://example.com"
      })</head>`
      const result = processStructuredData(template, {}, 'test.stx')
      expect(result).toContain('<script type="application/ld+json">')
      expect(result).toContain('"@context":"https://schema.org"')
      expect(result).toContain('"@type":"Organization"')
      expect(result).toContain('"name":"Test Company"')
    })

    test('should add default @context if not provided', () => {
      const template = `<head>@structuredData({
        "@type": "Person",
        "name": "John Doe"
      })</head>`
      const result = processStructuredData(template, {}, 'test.stx')
      expect(result).toContain('"@context":"https://schema.org"')
    })

    test('should use context variables in structured data', () => {
      const template = `<head>@structuredData({
        "@type": "Product",
        "name": productName,
        "price": price
      })</head>`
      const context = {
        productName: 'Test Product',
        price: '$9.99',
      }
      const result = processStructuredData(template, context, 'test.stx')
      expect(result).toContain('"name":"Test Product"')
      expect(result).toContain('"price":"$9.99"')
    })

    test('should handle errors in @structuredData directive', () => {
      const template = '<head>@structuredData({ "broken": "value", @ })</head>'
      const result = processStructuredData(template, {}, 'test.stx')
      expect(result).toContain('<!-- Error in @structuredData:')
    })
  })

  describe('processSeoDirective', () => {
    test('should process @seo directive with basic config', () => {
      const template = `<head>@seo({
        title: "Test Page",
        description: "This is a test page"
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<title>Test Page</title>')
      expect(result).toContain('<meta name="title" content="Test Page">')
      expect(result).toContain('<meta name="description" content="This is a test page">')
    })

    test('should process @seo directive with keywords', () => {
      const template = `<head>@seo({
        title: "Test Page",
        keywords: ["test", "page", "seo"]
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<meta name="keywords" content="test, page, seo">')
    })

    test('should process @seo directive with robots', () => {
      const template = `<head>@seo({
        title: "Test Page",
        robots: "noindex, nofollow"
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<meta name="robots" content="noindex, nofollow">')
    })

    test('should process @seo directive with canonical link', () => {
      const template = `<head>@seo({
        title: "Test Page",
        canonical: "https://example.com/test"
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<link rel="canonical" href="https://example.com/test">')
    })

    test('should process @seo directive with OpenGraph data', () => {
      const template = `<head>@seo({
        title: "Test Page",
        description: "This is a test page",
        openGraph: {
          type: "website",
          image: "https://example.com/image.jpg",
          imageAlt: "Test image",
          imageWidth: 1200,
          imageHeight: 630,
          siteName: "Test Site"
        }
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<meta property="og:type" content="website">')
      expect(result).toContain('<meta property="og:title" content="Test Page">')
      expect(result).toContain('<meta property="og:description" content="This is a test page">')
      expect(result).toContain('<meta property="og:image" content="https://example.com/image.jpg">')
      expect(result).toContain('<meta property="og:image:alt" content="Test image">')
      expect(result).toContain('<meta property="og:image:width" content="1200">')
      expect(result).toContain('<meta property="og:image:height" content="630">')
      expect(result).toContain('<meta property="og:site_name" content="Test Site">')
    })

    test('should process @seo directive with Twitter data', () => {
      const template = `<head>@seo({
        title: "Test Page",
        description: "This is a test page",
        twitter: {
          card: "summary_large_image",
          site: "@testsite",
          creator: "@testcreator"
        }
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<meta name="twitter:card" content="summary_large_image">')
      expect(result).toContain('<meta name="twitter:title" content="Test Page">')
      expect(result).toContain('<meta name="twitter:description" content="This is a test page">')
      expect(result).toContain('<meta name="twitter:site" content="@testsite">')
      expect(result).toContain('<meta name="twitter:creator" content="@testcreator">')
    })

    test('should process @seo directive with structured data', () => {
      const template = `<head>@seo({
        title: "Test Page",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Test Page",
          "description": "This is a test page"
        }
      })</head>`
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('<script type="application/ld+json">')
      expect(result).toContain('"@context":"https://schema.org"')
      expect(result).toContain('"@type":"WebPage"')
    })

    test('should handle errors in @seo directive', () => {
      const template = '<head>@seo({ "invalid": "value", @ })</head>'
      const result = processSeoDirective(template, {}, 'test.stx', {})
      expect(result).toContain('Error processing @seo directive:')
    })

    test('should use context variables in @seo directive', () => {
      const template = `<head>@seo({
        title: pageTitle,
        description: pageDescription
      })</head>`
      const context = {
        pageTitle: 'Dynamic Page Title',
        pageDescription: 'Dynamic page description',
      }
      const result = processSeoDirective(template, context, 'test.stx', {})
      expect(result).toContain('<title>Dynamic Page Title</title>')
      expect(result).toContain('<meta name="description" content="Dynamic page description">')
    })
  })

  describe('injectSeoTags', () => {
    test('should inject SEO tags when enabled in config', () => {
      const html = '<html><head></head><body>Test</body></html>'
      const context = { title: 'Test Page' }
      const options: StxOptions = {
        seo: {
          enabled: true,
          defaultConfig: {
            title: 'Default Title',
            description: 'Default description',
          },
        },
      }
      const result = injectSeoTags(html, context, options)
      expect(result).toContain('<!-- stx SEO Tags -->')
      expect(result).toContain('<title>Test Page</title>')
      expect(result).toContain('<meta name="title" content="Test Page">')
      expect(result).toContain('<meta name="description" content="Default description">')
    })

    test('should not inject SEO tags when disabled in config', () => {
      const html = '<html><head></head><body>Test</body></html>'
      const context = { title: 'Test Page' }
      const options: StxOptions = {
        seo: {
          enabled: false,
        },
      }
      const result = injectSeoTags(html, context, options)
      expect(result).not.toContain('<!-- stx SEO Tags -->')
    })

    test('should not inject SEO tags when no <head> tag exists', () => {
      const html = '<html><body>Test</body></html>'
      const context = { title: 'Test Page' }
      const options: StxOptions = {
        seo: {
          enabled: true,
          defaultConfig: {
            title: 'Default Title',
          },
        },
      }
      const result = injectSeoTags(html, context, options)
      expect(result).not.toContain('<!-- stx SEO Tags -->')
    })

    test('should not inject SEO tags when already injected', () => {
      const html = '<html><head><!-- stx SEO Tags --></head><body>Test</body></html>'
      const context = { title: 'Test Page' }
      const options: StxOptions = {
        seo: {
          enabled: true,
          defaultConfig: {
            title: 'Default Title',
          },
        },
      }
      const result = injectSeoTags(html, context, options)
      // Count occurrences of the comment
      const count = (result.match(/<!-- stx SEO Tags -->/g) || []).length
      expect(count).toBe(1) // Should still have only one instance
    })

    test('should inject social preview tags when enabled', () => {
      const html = '<html><head></head><body>Test</body></html>'
      const context = { title: 'Test Page', description: 'Test description' }
      const options: StxOptions = {
        seo: {
          enabled: true,
          defaultConfig: {
            title: 'Default Title',
            description: 'Default description',
          },
          socialPreview: true,
          defaultImage: 'https://example.com/default.jpg',
        },
      }
      const result = injectSeoTags(html, context, options)
      expect(result).toContain('<meta property="og:title" content="Test Page">')
      expect(result).toContain('<meta property="og:description" content="Test description">')
      expect(result).toContain('<meta property="og:image" content="https://example.com/default.jpg">')
      expect(result).toContain('<meta name="twitter:card" content="summary_large_image">')
    })

    test('should not add title tag when one already exists', () => {
      const html = '<html><head><title>Existing Title</title></head><body>Test</body></html>'
      const context = { title: 'Test Page' }
      const options: StxOptions = {
        seo: {
          enabled: true,
          defaultConfig: {
            title: 'Default Title',
          },
        },
      }
      const result = injectSeoTags(html, context, options)
      // Count occurrences of title tags
      const count = (result.match(/<title>/g) || []).length
      expect(count).toBe(1) // Should still have only one title tag
      expect(result).toContain('<title>Existing Title</title>') // Should preserve existing title
      expect(result).toContain('<meta name="title" content="Test Page">') // But add meta title
    })
  })

  describe('SEO directives', () => {
    test('metaDirective should generate meta tag', () => {
      const result = metaDirective.handler('', ['description', 'Test description'], {}, 'test.stx')
      expect(result).toBe('<meta name="description" content="Test description">')
    })

    test('metaDirective should handle missing content', () => {
      const result = metaDirective.handler('', ['keywords'], {}, 'test.stx')
      expect(result).toBe('<meta name="keywords" content="">')
    })

    test('metaDirective should handle missing name', () => {
      const result = metaDirective.handler('', [], {}, 'test.stx')
      expect(result).toBe('[Error: meta directive requires at least the meta name]')
    })

    test('structuredDataDirective should generate JSON-LD script', () => {
      const content = JSON.stringify({
        '@type': 'Person',
        'name': 'John Doe',
      })
      const result = structuredDataDirective.handler(content, [], {}, 'test.stx')
      expect(result).toContain('<script type="application/ld+json">')
      expect(result).toContain('"@context":"https://schema.org"')
      expect(result).toContain('"@type":"Person"')
      expect(result).toContain('"name":"John Doe"')
    })

    test('structuredDataDirective should handle empty content', () => {
      const result = structuredDataDirective.handler('', [], {}, 'test.stx')
      expect(result).toBe('[Error: structuredData directive requires JSON-LD content]')
    })

    test('structuredDataDirective should handle missing @type', () => {
      const content = JSON.stringify({
        name: 'John Doe',
      })
      const result = structuredDataDirective.handler(content, [], {}, 'test.stx')
      expect(result).toBe('[Error: structuredData requires @type property]')
    })

    test('structuredDataDirective should handle invalid JSON', () => {
      const result = structuredDataDirective.handler('invalid json', [], {}, 'test.stx')
      expect(result).toContain('<!-- Error in structuredData directive:')
    })

    test('registerSeoDirectives should return all SEO directives', () => {
      const directives = registerSeoDirectives()
      expect(directives).toHaveLength(2)
      expect(directives[0].name).toBe('meta')
      expect(directives[1].name).toBe('structuredData')
    })
  })

  describe('Integration tests', () => {
    test('should process all SEO features in a template', async () => {
      const templateContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          @meta("viewport", "width=device-width, initial-scale=1.0")
          @metaTag({ name: "author", content: "Test Author" })

          @seo({
            title: "Test Page",
            description: "This is a test page with SEO",
            keywords: ["test", "seo", "stx"],
            canonical: "https://example.com/test",
            openGraph: {
              image: "https://example.com/image.jpg",
              siteName: "stx Test Site"
            },
            twitter: {
              card: "summary_large_image",
              site: "@stacksjsframework"
            }
          })

          @structuredData({
            "@type": "WebPage",
            "name": "Test Page",
            "description": "This is a test page with SEO"
          })
        </head>
        <body>
          <h1>Test Page</h1>
          <p>This is a test page with SEO features.</p>
        </body>
        </html>
      `

      const testFile = await createTestFile('seo-test.stx', templateContent)

      // Process directives manually instead of using the build process
      const context = {}
      const options: StxOptions = {
        seo: {
          enabled: true,
          defaultConfig: {
            title: 'Default Title',
            description: 'Default description',
          },
          socialPreview: true,
        },
      }

      // Process each directive type
      let processed = processMetaDirectives(templateContent, context, testFile, options)
      processed = processStructuredData(processed, context, testFile)
      processed = processSeoDirective(processed, context, testFile, options)
      const finalOutput = injectSeoTags(processed, context, options)

      // Check meta tags
      expect(finalOutput).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
      expect(finalOutput).toContain('<meta name="author" content="Test Author">')

      // Check SEO tags
      expect(finalOutput).toContain('<title>Test Page</title>')
      expect(finalOutput).toContain('<meta name="description" content="This is a test page with SEO">')
      expect(finalOutput).toContain('<meta name="keywords" content="test, seo, stx">')
      expect(finalOutput).toContain('<link rel="canonical" href="https://example.com/test">')

      // Check Open Graph tags
      expect(finalOutput).toContain('<meta property="og:title" content="Test Page">')
      expect(finalOutput).toContain('<meta property="og:description" content="This is a test page with SEO">')
      expect(finalOutput).toContain('<meta property="og:image" content="https://example.com/image.jpg">')
      expect(finalOutput).toContain('<meta property="og:site_name" content="stx Test Site">')

      // Check Twitter Card tags
      expect(finalOutput).toContain('<meta name="twitter:card" content="summary_large_image">')
      expect(finalOutput).toContain('<meta name="twitter:title" content="Test Page">')
      expect(finalOutput).toContain('<meta name="twitter:site" content="@stacksjsframework">')

      // Check Structured Data
      expect(finalOutput).toContain('<script type="application/ld+json">')
      expect(finalOutput).toContain('"@context":"https://schema.org"')
      expect(finalOutput).toContain('"@type":"WebPage"')
    })
  })
})
