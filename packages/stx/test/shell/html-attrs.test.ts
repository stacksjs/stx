/**
 * `htmlAttrs` reaches the `<html>` element (stacksjs/stx#1798).
 *
 * It was typed on HeadConfig, merged onto the render path by process.ts, and
 * then dropped: generateDocumentShell never destructured it and hardcoded
 * `<html lang="${lang}">`. Its sibling `bodyAttrs` was emitted, so the gap read
 * as an oversight rather than a decision — and the docs already advertised
 * `htmlAttrs` as "sets attributes on <html>".
 *
 * It matters because a layout that scopes its design tokens to the root element
 * (`html.marketing { --bg: … }`) has no other way to put the class there once it
 * stops hand-writing its own document shell — which is exactly what stx asks
 * pages to do.
 */
import { describe, expect, it } from 'bun:test'
import { applyHtmlAttrs, buildHtmlAttrs, generateDocumentShell, mergeHtmlAttrs } from '../../src/document-shell'
import { defaultConfig, processDirectives } from '../../src/index'

function htmlTag(html: string): string {
  return html.match(/<html\b[^>]*>/i)?.[0] ?? ''
}

describe('htmlAttrs → <html>', () => {
  describe('generateDocumentShell', () => {
    it('emits a class on the root element', () => {
      const out = generateDocumentShell('<h1>Hi</h1>', { htmlAttrs: { class: 'marketing' } })
      expect(htmlTag(out)).toContain('class="marketing"')
    })

    it('emits arbitrary attributes', () => {
      const out = generateDocumentShell('<h1>Hi</h1>', {
        htmlAttrs: { 'data-theme': 'sunset', 'dir': 'rtl' },
      })
      const tag = htmlTag(out)
      expect(tag).toContain('data-theme="sunset"')
      expect(tag).toContain('dir="rtl"')
    })

    it('keeps the bare tag byte-identical when htmlAttrs is absent', () => {
      // No trailing space, no markers — this exact string is asserted by
      // existing shell tests and by anything diffing generated output.
      expect(generateDocumentShell('<h1>Hi</h1>')).toContain('<html lang="en">')
    })

    it('lets htmlAttrs.lang win over the lang option instead of emitting lang twice', () => {
      // Two lang= attributes on one element is a parse error that browsers
      // resolve by keeping the FIRST — silently ignoring the more specific one.
      const out = generateDocumentShell('<h1>Hi</h1>', { lang: 'en', htmlAttrs: { lang: 'fr' } })
      const tag = htmlTag(out)
      expect(tag.match(/\blang=/g)).toHaveLength(1)
      expect(tag).toContain('lang="fr"')
    })

    it('escapes attribute values so a quote cannot break out of the tag', () => {
      const out = generateDocumentShell('<h1>Hi</h1>', {
        htmlAttrs: { 'data-x': '" onload="alert(1)' },
      })
      expect(htmlTag(out)).not.toContain('onload="alert(1)"')
      expect(out).toContain('&quot;')
    })

    it('drops attribute names that are not valid identifiers', () => {
      const out = generateDocumentShell('<h1>Hi</h1>', {
        htmlAttrs: { 'ok': 'yes', 'bad name': 'x', '><script>': 'y' },
      })
      const tag = htmlTag(out)
      expect(tag).toContain('ok="yes"')
      expect(tag).not.toContain('bad name')
      expect(out).not.toContain('<script>y')
    })

    it('records what it wrote so the router can undo exactly that much', () => {
      const tag = htmlTag(generateDocumentShell('<h1>Hi</h1>', {
        htmlAttrs: { class: 'marketing wide', 'data-theme': 'sunset' },
      }))
      expect(tag).toContain('data-stx-html-class="marketing wide"')
      expect(tag).toContain('data-stx-html-attrs="data-theme"')
    })

    it('omits the markers when there is nothing to undo', () => {
      const tag = htmlTag(generateDocumentShell('<h1>Hi</h1>', { lang: 'de' }))
      expect(tag).not.toContain('data-stx-html-class')
      expect(tag).not.toContain('data-stx-html-attrs')
    })

    it('does not record lang as removable', () => {
      // lang has its own reconcile in the router and always has a value;
      // listing it would let a destination page delete it entirely.
      const tag = htmlTag(generateDocumentShell('<h1>Hi</h1>', { htmlAttrs: { lang: 'fr' } }))
      expect(tag).not.toContain('data-stx-html-attrs')
    })
  })

  describe('buildHtmlAttrs', () => {
    it('defaults to lang="en"', () => {
      expect(buildHtmlAttrs()).toBe(' lang="en"')
    })

    it('ignores null and undefined values', () => {
      const out = buildHtmlAttrs({ a: null as any, b: undefined as any, c: 'keep' })
      expect(out).not.toContain('a=')
      expect(out).not.toContain('b=')
      expect(out).toContain('c="keep"')
    })
  })

  describe('applyHtmlAttrs (page wrote its own <html>)', () => {
    const doc = '<!DOCTYPE html>\n<html lang="en" class="theme-base">\n<head></head>\n<body></body>\n</html>'

    it('unions classes instead of replacing the template\'s own', () => {
      const tag = htmlTag(applyHtmlAttrs(doc, { class: 'marketing' }))
      expect(tag).toContain('theme-base')
      expect(tag).toContain('marketing')
    })

    it('records only the classes it added, not the ones already there', () => {
      // Otherwise an SPA navigation away would strip a class the template
      // hand-wrote and still wants.
      const tag = htmlTag(applyHtmlAttrs(doc, { class: 'marketing' }))
      expect(tag).toContain('data-stx-html-class="marketing"')
    })

    it('overwrites non-class attributes', () => {
      const tag = htmlTag(applyHtmlAttrs('<html lang="en" dir="ltr">', { dir: 'rtl' }))
      expect(tag).toContain('dir="rtl"')
      expect(tag).not.toContain('dir="ltr"')
    })

    it('overrides lang without duplicating it', () => {
      const tag = htmlTag(applyHtmlAttrs(doc, { lang: 'fr' }))
      expect(tag.match(/\blang=/g)).toHaveLength(1)
      expect(tag).toContain('lang="fr"')
    })

    it('is idempotent', () => {
      const once = applyHtmlAttrs(doc, { 'class': 'marketing', 'data-theme': 'sunset' })
      expect(applyHtmlAttrs(once, { 'class': 'marketing', 'data-theme': 'sunset' })).toBe(once)
    })

    it('does not re-expand $-sequences in a value', () => {
      const tag = htmlTag(applyHtmlAttrs(doc, { 'data-x': '$& $1' }))
      expect(tag).toContain('data-x="$&amp; $1"')
    })

    it('is a no-op without htmlAttrs or without an <html> tag', () => {
      expect(applyHtmlAttrs(doc, {})).toBe(doc)
      expect(applyHtmlAttrs('<div>fragment</div>', { class: 'x' })).toBe('<div>fragment</div>')
    })

    it('leaves the rest of the document untouched', () => {
      const out = applyHtmlAttrs(`${doc}<!-- tail -->`, { class: 'marketing' })
      expect(out).toContain('<head></head>')
      expect(out).toContain('<!-- tail -->')
      expect(out.match(/<html\b/gi)).toHaveLength(1)
    })
  })

  describe('mergeHtmlAttrs (config ← page)', () => {
    it('overrides per key', () => {
      expect(mergeHtmlAttrs({ dir: 'ltr' }, { dir: 'rtl' })).toEqual({ dir: 'rtl' })
    })

    it('unions class so a global one does not vanish', () => {
      // app.head.htmlAttrs.class is typically structural (h-full, a font
      // class). A page adding its own class should not delete it.
      expect(mergeHtmlAttrs({ class: 'h-full' }, { class: 'marketing' }).class).toBe('h-full marketing')
    })

    it('does not duplicate a class both declare', () => {
      expect(mergeHtmlAttrs({ class: 'h-full' }, { class: 'h-full wide' }).class).toBe('h-full wide')
    })

    it('handles either side being absent', () => {
      expect(mergeHtmlAttrs({}, { class: 'a' }).class).toBe('a')
      expect(mergeHtmlAttrs({ class: 'a' }, {}).class).toBe('a')
      expect(mergeHtmlAttrs()).toEqual({})
    })
  })

  describe('through the render pipeline', () => {
    it('lands on the shell from config app.head.htmlAttrs', async () => {
      const out = await processDirectives(
        '<h1>Hello</h1>',
        { ...defaultConfig },
        'page.stx',
        { app: { head: { htmlAttrs: { class: 'marketing' } } }, autoShell: true } as any,
        new Set(),
      )
      expect(htmlTag(out)).toContain('class="marketing"')
    })

    it('lands on a hand-written <html> too', async () => {
      const out = await processDirectives(
        '<!DOCTYPE html><html lang="en"><head><title>T</title></head><body><h1>Hi</h1></body></html>',
        { ...defaultConfig },
        'page.stx',
        { app: { head: { htmlAttrs: { class: 'marketing' } } }, autoShell: true } as any,
        new Set(),
      )
      expect(htmlTag(out)).toContain('marketing')
      expect(out.match(/<html\b/gi)).toHaveLength(1)
    })

    it('lands from a per-page useHead({ htmlAttrs })', async () => {
      // The layout's own <script server> useHead — the per-layout case config
      // cannot express, and the whole reason the option is worth having.
      const out = await processDirectives(
        '<h1>Hello</h1>',
        { ...defaultConfig, __stx_runtime_head: { htmlAttrs: { class: 'marketing' } } },
        'page.stx',
        { autoShell: true } as any,
        new Set(),
      )
      expect(htmlTag(out)).toContain('class="marketing"')
      expect(htmlTag(out)).toContain('data-stx-html-class="marketing"')
    })

    it('unions a per-page class with the config one', async () => {
      const out = await processDirectives(
        '<h1>Hello</h1>',
        { ...defaultConfig, __stx_runtime_head: { htmlAttrs: { class: 'marketing' } } },
        'page.stx',
        { app: { head: { htmlAttrs: { class: 'h-full' } } }, autoShell: true } as any,
        new Set(),
      )
      expect(htmlTag(out)).toContain('class="h-full marketing"')
    })
  })
})
