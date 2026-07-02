/**
 * Regression: config `app.head` must land on pages that ALREADY render their
 * own <html><head> (layout-based / SSG static builds) — not just when stx
 * builds the shell. Otherwise a site-wide analytics <script> (Fathom /
 * Contentsquare / ts-analytics) silently never injects on static builds.
 * See stacksjs/stx#1765.
 */
import { describe, expect, it } from 'bun:test'
import { injectConfigHeadTags } from '../../src/document-shell'

const HEAD = (inner = '') => `<!doctype html><html><head><title>Page</title>${inner}</head><body><h1>Hi</h1></body></html>`
const count = (s: string, needle: string): number => s.split(needle).length - 1

describe('injectConfigHeadTags (config app.head into an existing shell)', () => {
  it('injects config app.head.script into an existing <head>', () => {
    const out = injectConfigHeadTags(HEAD(), { script: [{ src: 'https://cs.example.com/uxa.js', defer: true }] } as any)
    expect(out).toContain('src="https://cs.example.com/uxa.js"')
    expect(out).toContain('defer="true"')
    // before </head>
    expect(out.indexOf('cs.example.com')).toBeLessThan(out.indexOf('</head>'))
  })

  it('injects config meta and link', () => {
    const out = injectConfigHeadTags(HEAD(), { meta: [{ name: 'description', content: 'D' }], link: [{ rel: 'icon', href: '/favicon.ico' }] } as any)
    expect(out).toContain('name="description"')
    expect(out).toContain('href="/favicon.ico"')
  })

  it('is idempotent — never duplicates a script src / link href / meta already present', () => {
    const already = HEAD('<script src="https://cs.example.com/uxa.js" defer></script><meta charset="utf-8">')
    const out = injectConfigHeadTags(already, {
      script: [{ src: 'https://cs.example.com/uxa.js', defer: true }],
      meta: [{ charset: 'utf-8' }, { name: 'description', content: 'D' }],
    } as any)
    expect(count(out, 'cs.example.com/uxa.js')).toBe(1)
    expect(count(out, 'charset=')).toBe(1)
    expect(out).toContain('name="description"') // the new one IS added
  })

  it('never injects a config title (page/layout owns its title)', () => {
    const out = injectConfigHeadTags(HEAD(), { title: 'Config Title', script: [{ src: '/a.js' }] } as any)
    expect(out).not.toContain('Config Title')
    expect(count(out, '<title>')).toBe(1)
  })

  it('injects inline <script> content, deduped', () => {
    const out = injectConfigHeadTags(HEAD(), { script: [{ content: 'window.X=1' }] } as any)
    expect(out).toContain('<script>window.X=1</script>')
    expect(count(injectConfigHeadTags(out, { script: [{ content: 'window.X=1' }] } as any), 'window.X=1')).toBe(1)
  })

  it('no-ops when there is no </head> (SPA fragment)', () => {
    const frag = '<main>hi</main>'
    expect(injectConfigHeadTags(frag, { script: [{ src: '/a.js' }] } as any)).toBe(frag)
  })
})
