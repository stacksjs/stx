import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import path from 'node:path'
import {
  injectSeoTags,
  processMetaDirectives,
  processSeoDirective,
  processStructuredData,
} from '../../src/seo'
import { cleanupTestDirs, setupTestDirs } from '../utils'
import { productContext } from './templates/context'

describe('SEO template integration', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(async () => {
    await cleanupTestDirs()
  })

  test('should correctly process complete SEO template', async () => {
    const templatePath = path.join(import.meta.dir, 'templates/seo-examples.stx')
    const templateContent = await Bun.file(templatePath).text()

    // Process directives manually
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

    // Process each directive type
    let processed = processMetaDirectives(templateContent, productContext, templatePath, options)
    processed = processStructuredData(processed, productContext, templatePath)
    processed = processSeoDirective(processed, productContext, templatePath, options)
    const finalOutput = injectSeoTags(processed, productContext, options)

    // Verify basic meta tags
    expect(finalOutput).toContain('<meta name="description" content="A detailed description of this product page">')
    expect(finalOutput).toContain('<meta name="keywords" content="product, stx, seo, web">')
    expect(finalOutput).toContain('<meta name="author" content="STX Team">')

    // Verify metaTag directive output
    expect(finalOutput).toContain('<meta name="robots" content="index, follow">')
    expect(finalOutput).toContain('<meta http-equiv="content-language" content="en-US">')

    // Verify OpenGraph tags
    expect(finalOutput).toContain('<meta property="og:type" content="website">')
    expect(finalOutput).toContain('<meta property="og:url" content="https://example.com/product">')
    expect(finalOutput).toContain('<meta property="og:image" content="https://example.com/images/product.jpg">')

    // Verify @seo directive output
    expect(finalOutput).toContain(`<title>${productContext.pageTitle}</title>`)
    expect(finalOutput).toContain(`<meta name="title" content="${productContext.pageTitle}">`)
    expect(finalOutput).toContain(`<meta name="description" content="${productContext.pageDescription}">`)
    expect(finalOutput).toContain(`<link rel="canonical" href="${productContext.pageUrl}">`)

    // Verify OpenGraph tags from @seo directive
    expect(finalOutput).toContain('<meta property="og:type" content="product">')
    expect(finalOutput).toContain(`<meta property="og:title" content="${productContext.pageTitle}">`)
    expect(finalOutput).toContain(`<meta property="og:description" content="${productContext.pageDescription}">`)
    expect(finalOutput).toContain(`<meta property="og:image" content="${productContext.productImage}">`)
    expect(finalOutput).toContain(`<meta property="og:image:alt" content="${productContext.productImageAlt}">`)
    expect(finalOutput).toContain('<meta property="og:site_name" content="STX Demo Store">')

    // Verify Twitter Card tags
    expect(finalOutput).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(finalOutput).toContain(`<meta name="twitter:title" content="${productContext.pageTitle}">`)
    expect(finalOutput).toContain('<meta name="twitter:site" content="@stxframework">')
    expect(finalOutput).toContain('<meta name="twitter:creator" content="@stxteam">')

    // Verify structured data
    expect(finalOutput).toContain('<script type="application/ld+json">')
    expect(finalOutput).toContain('"@context":"https://schema.org"')
    expect(finalOutput).toContain('"@type":"Product"')
    expect(finalOutput).toContain(`"name":"${productContext.productName}"`)
    expect(finalOutput).toContain(`"image":"${productContext.productImage}"`)
    expect(finalOutput).toContain(`"sku":"${productContext.productSku}"`)
    expect(finalOutput).toContain('"brand":{"@type":"Brand"')
    expect(finalOutput).toContain(`"name":"${productContext.productBrand}"`)
    expect(finalOutput).toContain('"offers":{"@type":"Offer"')
    expect(finalOutput).toContain(`"price":${productContext.productPrice}`)
    expect(finalOutput).toContain('priceCurrency":"USD"')
    expect(finalOutput).toContain('availability":"https://schema.org/InStock"')
    expect(finalOutput).toContain('"aggregateRating":{"@type":"AggregateRating"')
    expect(finalOutput).toContain(`"ratingValue":${productContext.productRating}`)
    expect(finalOutput).toContain(`"reviewCount":${productContext.reviewCount}`)
  })
})
