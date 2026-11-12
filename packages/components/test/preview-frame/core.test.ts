import { describe, expect, it } from 'bun:test'
import { buildDocument, declaresColorScheme, describeViewport, fitScale, forceColorScheme, FORBIDDEN_SANDBOX_TOKENS, isIsolatingSandbox, normalizeScheme, resolveViewport, sandboxValue, stepViewport, VIEWPORT_PRESETS } from '../../src/ui/preview-frame/core'

describe('viewports', () => {
  it('knows a phone, a tablet and a desktop', () => {
    expect(VIEWPORT_PRESETS.map(preset => preset.name)).toEqual(['phone', 'tablet', 'desktop'])
    expect(resolveViewport('phone')).toEqual({ name: 'phone', size: { width: 390, height: 844 }, landscape: false })
    expect(resolveViewport('desktop').size).toEqual({ width: 1280, height: 800 })
  })

  it('fills the box for no name, and for one nobody knows', () => {
    for (const name of ['fill', '', undefined, null, 'watch', 12])
      expect(resolveViewport(name)).toEqual({ name: 'fill', size: null, landscape: false })
  })

  it('turns a phone on its side, and leaves a desktop as it is', () => {
    expect(resolveViewport('phone', { landscape: true })).toEqual({ name: 'phone', size: { width: 844, height: 390 }, landscape: true })
    expect(resolveViewport('desktop', { landscape: true })).toEqual({ name: 'desktop', size: { width: 1280, height: 800 }, landscape: false })
  })

  it('takes a size of its own over a name, when both numbers are there', () => {
    expect(resolveViewport('phone', { width: 600, height: '400' })).toEqual({ name: 'custom', size: { width: 600, height: 400 }, landscape: false })
    expect(resolveViewport('phone', { width: 600 }).name).toBe('phone')
    expect(resolveViewport('phone', { width: 0, height: -1 }).name).toBe('phone')
    expect(resolveViewport('phone', { width: 'wide', height: 400 }).name).toBe('phone')
  })

  it('shrinks to fit, and never enlarges', () => {
    expect(fitScale({ width: 400, height: 800 }, { width: 400, height: 400 })).toBe(0.5)
    expect(fitScale({ width: 400, height: 800 }, { width: 200, height: 2000 })).toBe(0.5)
    expect(fitScale({ width: 400, height: 800 }, { width: 4000, height: 4000 })).toBe(1)
    expect(fitScale({ width: 400, height: 800 }, { width: 432, height: 432 }, 16)).toBe(0.5)
  })

  it('does not divide by a box that has no size yet', () => {
    expect(fitScale({ width: 400, height: 800 }, { width: 0, height: 0 })).toBe(1)
    expect(fitScale({ width: 400, height: 800 }, { width: 20, height: 20 }, 16)).toBe(1)
    expect(fitScale({ width: 0, height: 0 }, { width: 400, height: 400 })).toBe(1)
  })

  it('says what size the page is seeing', () => {
    expect(describeViewport(resolveViewport('phone'))).toBe('390 × 844')
    expect(describeViewport(resolveViewport('phone'), 0.5)).toBe('390 × 844 at 50%')
    expect(describeViewport(resolveViewport('phone'), 0.999)).toBe('390 × 844')
    expect(describeViewport(resolveViewport('fill'))).toBe('Fills the frame')
  })

  it('steps through the toolbar order, wrapping', () => {
    expect(stepViewport('fill', 1)).toBe('phone')
    expect(stepViewport('desktop', 1)).toBe('fill')
    expect(stepViewport('fill', -1)).toBe('desktop')
    expect(stepViewport('custom', 1)).toBe('phone')
  })
})

describe('the sandbox', () => {
  it('allows nothing unless asked', () => {
    expect(sandboxValue()).toBe('')
    expect(sandboxValue({ scripts: false, forms: false })).toBe('')
  })

  it('allows scripts and forms when asked, and nothing else', () => {
    expect(sandboxValue({ scripts: true })).toBe('allow-scripts')
    expect(sandboxValue({ scripts: true, forms: true })).toBe('allow-scripts allow-forms')
  })

  it('never produces a token that reaches the host', () => {
    for (const scripts of [true, false]) {
      for (const forms of [true, false]) {
        const value = sandboxValue({ scripts, forms, sameOrigin: true, popups: true } as any)

        expect(isIsolatingSandbox(value)).toBe(true)
        for (const token of FORBIDDEN_SANDBOX_TOKENS)
          expect(value.split(' ')).not.toContain(token)
      }
    }
  })

  it('recognises a sandbox that does not isolate', () => {
    expect(isIsolatingSandbox('')).toBe(true)
    expect(isIsolatingSandbox('allow-scripts')).toBe(true)
    expect(isIsolatingSandbox('allow-scripts allow-same-origin')).toBe(false)
    expect(isIsolatingSandbox('ALLOW-TOP-NAVIGATION')).toBe(false)
    expect(isIsolatingSandbox('allow-popups')).toBe(false)
  })
})

describe('the document', () => {
  it('wraps a fragment in a page that follows the colour scheme', () => {
    const page = buildDocument('<h1>Hi</h1>')

    expect(page.startsWith('<!doctype html><html><head><meta charset="utf-8">')).toBe(true)
    expect(page).toContain('<meta name="color-scheme" content="light dark">')
    expect(page).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">')
    expect(page).toContain('<body><h1>Hi</h1></body>')
    expect(declaresColorScheme(page)).toBe(true)
  })

  it('titles a wrapped fragment, escaping the title', () => {
    expect(buildDocument('x', { title: 'A <b> & c' })).toContain('<title>A &lt;b&gt; &amp; c</title>')
    expect(buildDocument('x')).not.toContain('<title>')
  })

  it('shows nothing for nothing', () => {
    expect(buildDocument(null)).toContain('<body></body>')
    expect(buildDocument(undefined)).toContain('<body></body>')
    expect(buildDocument('')).toContain('<body></body>')
  })

  it('leaves a whole document as its author wrote it, but for where links go', () => {
    const mail = '<!DOCTYPE html><html lang="en"><head><title>Welcome</title></head><body><p>Hello</p></body></html>'

    expect(buildDocument(mail)).toBe('<!DOCTYPE html><html lang="en"><head><base target="_blank"><title>Welcome</title></head><body><p>Hello</p></body></html>')
    expect(declaresColorScheme(buildDocument(mail))).toBe(false)
  })

  it('finds somewhere for the base in a document with no head', () => {
    expect(buildDocument('<html><body>x</body></html>')).toBe('<html><head><base target="_blank"></head><body>x</body></html>')
    expect(buildDocument('<!doctype html><p>x</p>')).toBe('<base target="_blank"><!doctype html><p>x</p>')
  })

  it('keeps a base the document already has', () => {
    const page = '<html><head><base href="https://example.com/"></head><body>x</body></html>'

    expect(buildDocument(page)).toBe(page)
  })

  it('sends every link to a window the sandbox will refuse', () => {
    expect(buildDocument('<a href="https://example.com">out</a>')).toContain('<base target="_blank">')
  })
})

describe('the colour scheme', () => {
  it('is light, dark, or whatever the page is', () => {
    expect(normalizeScheme('light')).toBe('light')
    expect(normalizeScheme('dark')).toBe('dark')
    for (const value of ['auto', '', 'sepia', null, undefined, true])
      expect(normalizeScheme(value)).toBe('auto')
  })
})

/*
 * For an engine that does not hand a frame's colour scheme to its page
 * (WebKit, stacksjs/stx#2186): the scheme is written into the document.
 */
describe('a scheme written into the document', () => {
  const page = `<!doctype html><html><head><title>Mail</title><style>
body { color: black }
@media (prefers-color-scheme: dark) { body { color: white } }
@media screen and (Prefers-Color-Scheme:light) { a { color: blue } }
@media not (prefers-color-scheme: dark) { p { margin: 0 } }
</style><link rel="stylesheet" href="dark.css" media="(prefers-color-scheme: dark)"></head><body>
<p>Styles under (prefers-color-scheme: dark) apply at night.</p>
<picture><source srcset="night.png" media='(prefers-color-scheme: dark)'><img src="day.png" alt=""></picture>
<script>const night = matchMedia('(prefers-color-scheme: dark)').matches</script>
</body></html>`

  it('settles every scheme condition in styles, media attributes and scripts', () => {
    const dark = forceColorScheme(page, 'dark')
    expect(dark).toContain('@media (min-width: 0px) { body { color: white } }')
    expect(dark).toContain('@media screen and (max-width: 0px) { a { color: blue } }')
    expect(dark).toContain('@media not (min-width: 0px) { p { margin: 0 } }')
    expect(dark).toContain('href="dark.css" media="(min-width: 0px)"')
    expect(dark).toContain(`media='(min-width: 0px)'`)
    expect(dark).toContain(`matchMedia('(min-width: 0px)').matches`)

    const light = forceColorScheme(page, 'light')
    expect(light).toContain('@media (max-width: 0px) { body { color: white } }')
    expect(light).toContain('@media screen and (min-width: 0px) { a { color: blue } }')
    expect(light).toContain('@media not (max-width: 0px) { p { margin: 0 } }')
    expect(light).toContain(`matchMedia('(max-width: 0px)').matches`)
  })

  it('leaves what the reader is shown as it was written', () => {
    expect(forceColorScheme(page, 'dark')).toContain('<p>Styles under (prefers-color-scheme: dark) apply at night.</p>')
  })

  it('gives the root that scheme, ahead of anything the page says', () => {
    const rule = '<style data-stx-preview-scheme>:root{color-scheme:dark !important}</style>'
    expect(forceColorScheme(page, 'dark')).toContain(`<head>${rule}<title>Mail</title>`)
    expect(forceColorScheme('<html><body>x</body></html>', 'dark')).toBe(`<html><head>${rule}</head><body>x</body></html>`)
    expect(forceColorScheme('<p>x</p>', 'light')).toBe('<style data-stx-preview-scheme>:root{color-scheme:light !important}</style><p>x</p>')
  })

  it('is what buildDocument does when asked, and only then', () => {
    const fragment = '<style>@media (prefers-color-scheme: dark) { p { color: white } }</style><p>Hi</p>'
    expect(buildDocument(fragment)).toContain('(prefers-color-scheme: dark)')
    expect(buildDocument(fragment)).not.toContain('data-stx-preview-scheme')

    const forced = buildDocument(fragment, { forceScheme: 'light' })
    expect(forced).toContain('@media (max-width: 0px) { p { color: white } }')
    expect(forced).toContain(':root{color-scheme:light !important}')
    // The wrapper's own declaration stays; the forced rule outranks it.
    expect(forced).toContain('<meta name="color-scheme" content="light dark">')
    expect(forced).toContain('<base target="_blank">')
  })
})
