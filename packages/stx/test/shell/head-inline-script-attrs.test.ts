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
import { extractContainerContent } from '../../src/app-shell'
import { normalizeCriticalHeadOrder } from '../../src/color-mode-boot'
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

describe('before-runtime head scripts', () => {
  it('places an opted-in server head script before the client runtime', async () => {
    const out = await processDirectives(`<script server>
useHead({ script: [{ id: 'early-decision', content: 'window.__checkedEarly = true', beforeRuntime: true }] })
</script>
<script client>
const label = state('Ready')
</script>
<main><h1 :text="label"></h1></main>`, { ...defaultConfig }, 'page.stx', { autoShell: true } as any, new Set())
    const early = out.indexOf('<script id="early-decision" data-stx-before-runtime="">')
    const runtime = out.search(/<script\b[^>]*\bdata-stx-runtime(?=[\s=>])/)
    expect(early).toBeGreaterThan(-1)
    expect(runtime).toBeGreaterThan(early)
    const fragment = extractContainerContent(out)
    expect(fragment).not.toContain('window.__checkedEarly = true')
  })

  it('keeps document policy and relative URL configuration ahead of the opted-in script', () => {
    const html = '<html><head><meta charset="utf-8"><base href="/app/">'
      + `<meta http-equiv="Content-Security-Policy" content="script-src 'self'"><script data-stx-runtime></script>`
      + '<script data-stx-before-runtime="">init()</script></head><body></body></html>'
    const ordered = normalizeCriticalHeadOrder(html)
    expect(ordered.indexOf('charset')).toBeLessThan(ordered.indexOf('<base'))
    expect(ordered.indexOf('Content-Security-Policy')).toBeLessThan(ordered.indexOf('data-stx-before-runtime'))
    expect(ordered.indexOf('data-stx-before-runtime')).toBeLessThan(ordered.indexOf('data-stx-runtime'))
    expect(normalizeCriticalHeadOrder(ordered)).toBe(ordered)
  })

  it('preserves color-mode boot order without re-hoisting on a second pass', () => {
    const html = '<html><head><meta charset="utf-8"><script data-stx-runtime></script>'
      + '<script data-stx-color-mode-boot>boot()</script><script data-stx-before-runtime="">init()</script></head></html>'
    const ordered = normalizeCriticalHeadOrder(html)
    expect(ordered.indexOf('data-stx-color-mode-boot')).toBeLessThan(ordered.indexOf('data-stx-before-runtime'))
    expect(ordered.indexOf('data-stx-before-runtime')).toBeLessThan(ordered.indexOf('data-stx-runtime'))
    expect(normalizeCriticalHeadOrder(ordered)).toBe(ordered)
  })

  it('requires inline classic JavaScript for the opting-in script', async () => {
    const { renderHead } = await import('../../src/head')
    expect(() => renderHead({ script: [{ src: '/boot.js', beforeRuntime: true }] })).toThrow('synchronous inline JavaScript')
    expect(() => renderHead({ script: [{ content: 'boot()', type: 'module', beforeRuntime: true }] })).toThrow('synchronous inline JavaScript')
    expect(renderHead({ script: [{ content: 'boot()', beforeRuntime: false }] })).not.toMatch(/beforeRuntime|data-stx-before-runtime/)
  })
})
