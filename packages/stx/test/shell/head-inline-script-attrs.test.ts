/**
 * An inline head script keeps its attributes.
 *
 * generateDocumentShell and injectConfigHeadTags wrote a `script` entry with
 * `content` as a bare `<script>${content}</script>`, dropping `type`, `id` and
 * the rest. `useHead({ script: [{ type: 'application/ld+json', content }] })`
 * then reached the browser as JavaScript: the JSON-LD threw a syntax error and
 * search engines never saw it (hq.training#220 had to route around it with
 * `@structuredData`). A `src` script always kept its attributes; only the
 * inline branch lost them.
 *
 * A JSON data block also gets `</` escaped, so a value holding `</script>`
 * cannot end the block early. JavaScript is not touched.
 */
import { describe, expect, it } from 'bun:test'
import { generateDocumentShell, injectConfigHeadTags } from '../../src/document-shell'
import { defaultConfig, processDirectives } from '../../src/index'

const LD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', 'name': 'HQ' })
const HEAD = (inner = '') => `<!doctype html><html><head><title>Page</title>${inner}</head><body><h1>Hi</h1></body></html>`
const head = (html: string): string => html.slice(0, html.indexOf('</head>'))

describe('inline head script attributes', () => {
  describe('generateDocumentShell', () => {
    it('keeps type and id on a JSON-LD script', () => {
      const out = generateDocumentShell('<h1>Hi</h1>', {
        script: [{ type: 'application/ld+json', id: 'org', content: LD }],
      } as any)
      expect(head(out)).toContain(`<script type="application/ld+json" id="org">${LD}</script>`)
    })

    it('leaves a plain inline script as a bare tag', () => {
      const out = generateDocumentShell('<h1>Hi</h1>', { script: [{ content: 'window.x = 1' }] } as any)
      expect(head(out)).toContain('<script>window.x = 1</script>')
    })

    it('escapes </ in a JSON block so it cannot close the script', () => {
      const content = JSON.stringify({ name: '</script><img src=x onerror=alert(1)>' })
      const out = generateDocumentShell('<h1>Hi</h1>', {
        script: [{ type: 'application/ld+json', content }],
      } as any)
      expect(out).not.toContain('</script><img')
      expect(out).toContain('<\\/script><img')
      // Still the same JSON once parsed.
      const body = head(out).match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1] ?? ''
      expect(JSON.parse(body)).toEqual(JSON.parse(content))
    })

    it('does not rewrite </ in JavaScript', () => {
      const js = 'const re = /a<\\/b/; if (x </ 2) {}'
      const out = generateDocumentShell('<h1>Hi</h1>', { script: [{ content: js }] } as any)
      expect(out).toContain(`<script>${js}</script>`)
    })
  })

  describe('injectConfigHeadTags', () => {
    it('keeps type and id on a JSON-LD script', () => {
      const out = injectConfigHeadTags(HEAD(), { script: [{ type: 'application/ld+json', id: 'org', content: LD }] } as any)
      expect(head(out)).toContain(`<script type="application/ld+json" id="org">${LD}</script>`)
    })

    it('stays idempotent for an escaped JSON block already in the head', () => {
      const content = JSON.stringify({ name: 'a</b' })
      const once = injectConfigHeadTags(HEAD(), { script: [{ type: 'application/ld+json', content }] } as any)
      const twice = injectConfigHeadTags(once, { script: [{ type: 'application/ld+json', content }] } as any)
      expect(twice).toBe(once)
    })
  })

  describe('rendered page', () => {
    it('sends config app.head JSON-LD as a data block, not JavaScript', async () => {
      const out = await processDirectives(
        '<h1>Hello</h1>',
        { ...defaultConfig },
        'page.stx',
        { app: { head: { script: [{ type: 'application/ld+json', content: LD }] } }, autoShell: true } as any,
        new Set(),
      )
      expect(out).toContain(`<script type="application/ld+json">${LD}</script>`)
      expect(out).not.toContain(`<script>${LD}</script>`)
    })

    it('sends a page useHead JSON-LD script as a data block', async () => {
      const out = await processDirectives(
        `<script server>
useHead({ title: 'Org', script: [{ type: 'application/ld+json', id: 'org', content: ${JSON.stringify(LD)} }] })
</script>
<h1>Hello</h1>`,
        { ...defaultConfig },
        'page.stx',
        { autoShell: true } as any,
        new Set(),
      )
      expect(head(out)).toContain(`<script type="application/ld+json" id="org">${LD}</script>`)
      expect(out).not.toContain(`<script>${LD}</script>`)
    })
  })
})

describe('renderHead', () => {
  it('escapes </ in a JSON-LD script the same way', async () => {
    const { renderHead } = await import('../../src/head')
    const content = JSON.stringify({ name: '</script>' })
    const out = renderHead({ script: [{ type: 'application/ld+json', content }] })
    expect(out).toBe(`<script type="application/ld+json">${content.replace('</', '<\\/')}</script>`)
  })
})
