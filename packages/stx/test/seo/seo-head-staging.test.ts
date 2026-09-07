import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { applyHeadInjections, createHeadInjections } from '../../src/head-injection'
import { processDirectives } from '../../src/process'
import { injectSeoTags } from '../../src/seo'

const defaultOptions = { ...defaultConfig } as StxOptions

// The default SEO block used to be spliced into the document where it was
// generated, which rebuilt the whole document to insert ~500 bytes. It now
// contributes to the render's head collection instead and rides the single
// rebuild the top-level pipeline already performs (stacksjs/stx#1945). These
// pin the parts of that change that are easy to break: the fallback path for
// callers with no collection, the idempotence guard that the marker check can
// no longer cover, and the <title> that has to stay in the document.
describe('injectSeoTags head staging', () => {
  it('splices as before when the context has no head collection', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectSeoTags(html, {}, defaultOptions)

    expect(result).not.toBe(html)
    expect(result).toContain('<!-- stx SEO Tags -->')
  })

  it('leaves the document untouched when a collection is open', () => {
    const html = '<html><head><title>T</title></head><body></body></html>'
    const injections = createHeadInjections()
    const context: Record<string, any> = { __stx_head_injections: injections }

    const result = injectSeoTags(html, context, defaultOptions)

    // Not merely equal — the same string, so nothing was copied.
    expect(result).toBe(html)
    expect(injections.afterOpen.join('')).toContain('<!-- stx SEO Tags -->')
    expect(applyHeadInjections(result, injections)).toContain('<meta name="twitter:card"')
  })

  it('stages once even though the marker is no longer findable in the html', () => {
    const html = '<html><head><title>T</title></head><body></body></html>'
    const injections = createHeadInjections()
    const context: Record<string, any> = { __stx_head_injections: injections }

    injectSeoTags(html, context, defaultOptions)
    injectSeoTags(html, context, defaultOptions)

    const applied = applyHeadInjections(html, injections)
    expect(applied.match(/stx SEO Tags/g)).toHaveLength(1)
  })

  it('still writes a missing <title> into the document rather than staging it', () => {
    // renderHead reconciles <title> a few steps later and only sees tags that
    // are actually in the html; a staged title would produce a second one.
    const html = '<html><head></head><body></body></html>'
    const injections = createHeadInjections()
    const context: Record<string, any> = { __stx_head_injections: injections, title: 'Staged Page' }

    const result = injectSeoTags(html, context, defaultOptions)

    expect(result).toContain('<title>Staged Page</title>')
    expect(injections.afterOpen.join('')).not.toContain('<title>')
  })

  it('contributes nothing when a guard declines, so the page is not rebuilt', () => {
    const injections = createHeadInjections()
    const context: Record<string, any> = { __stx_head_injections: injections }
    const noHead = '<div>fragment</div>'

    expect(injectSeoTags(noHead, context, defaultOptions)).toBe(noHead)
    expect(injections.afterOpen).toHaveLength(0)
    expect(context.__stx_seo_staged).toBeUndefined()
  })

  it('emits exactly one SEO block through a full render', async () => {
    const template = '<html><head><title>Page</title></head><body><p>hi</p></body></html>'
    const options = { ...defaultConfig, seo: { enabled: true } } as StxOptions

    const output = await processDirectives(template, {}, '/app/page.stx', options, new Set())

    expect(output.match(/stx SEO Tags/g)).toHaveLength(1)
    expect(output).toContain('<meta property="og:title"')
  })
})
