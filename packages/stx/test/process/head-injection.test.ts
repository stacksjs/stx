/**
 * Regression tests for server-rendered <head> injection.
 *
 * A page rendered through a named layout (and/or an app shell) can emit
 * `<html><body>…` with NO <head> element. Head meta registered via
 * useHead/useSeoMeta used to be dropped on the server in that case (only
 * applied client-side), so SEO/social crawlers never saw per-page title/OG
 * meta. processDirectives now creates a <head> when one is missing.
 */
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions = {
  partialsDir: '/tmp',
  componentsDir: '/tmp',
}

async function processTemplate(template: string, context: Record<string, unknown> = {}) {
  return processDirectives(template, context, '/test.stx', defaultOptions, new Set<string>())
}

describe('SSR head injection', () => {
  it('creates a <head> when the document has none (layout emitted <html><body>)', async () => {
    const template = `<html lang="en"><body><h1>Hi</h1></body></html>`
    const context = {
      __stx_runtime_head: {
        title: 'My Post',
        meta: [{ property: 'og:image', content: '/img.png' }],
      },
    }
    const result = await processTemplate(template, context)

    expect(result).toContain('<head>')
    expect(result).toContain('</head>')
    expect(result).toContain('<title>My Post</title>')
    expect(result).toContain('property="og:image"')
    // The created <head> must sit before <body>.
    expect(result.indexOf('</head>')).toBeLessThan(result.indexOf('<body'))
  })

  it('injects into an existing <head> without creating a second one', async () => {
    const template = `<html><head><meta charset="utf-8"></head><body>Hi</body></html>`
    const context = {
      __stx_runtime_head: {
        title: 'T',
        meta: [{ property: 'og:title', content: 'T' }],
      },
    }
    const result = await processTemplate(template, context)

    expect((result.match(/<head>/g) || []).length).toBe(1)
    expect(result).toContain('property="og:title"')
  })

  it('leaves output unchanged when no head meta is registered', async () => {
    const template = `<html lang="en"><body><h1>Plain</h1></body></html>`
    const result = await processTemplate(template, {})
    // No head meta to inject → no spurious <head> is created.
    expect(result).not.toContain('<title>')
  })
})
