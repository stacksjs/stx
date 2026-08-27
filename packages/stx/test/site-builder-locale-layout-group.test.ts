import { describe, expect, it } from 'bun:test'
import { stampLocaleLayoutGroup } from '../src/site-builder/i18n'

/**
 * The SPA router swaps the container only while the layout group is
 * unchanged, so `<nav>` and `<footer>` keep whatever page loaded first.
 * That is wrong for every cross-locale hop, because the chrome carries
 * translated labels and locale-prefixed hrefs the server already resolved
 * for the destination. A per-locale group tells the router to swap the
 * whole body instead.
 *
 * This lived only in the dev server; the static build emitted no group meta
 * at all, so a built site translated `<main>` on a language switch and left
 * the nav in the previous language, which is the one place the bug could
 * not be seen while developing. Both renderers now call this.
 */
describe('stampLocaleLayoutGroup', () => {
  it('adds the group meta to a head that has none', () => {
    const html = stampLocaleLayoutGroup('<html><head><title>x</title></head><body></body></html>', 'de')
    expect(html).toContain('<meta name="stx-layout-group" content="i18n:de">')
    // Inside the head, where the router looks for it.
    expect(html.split(/<\/head>/i)[0]).toContain('stx-layout-group')
  })

  it('gives each locale a distinct group', () => {
    const of = (locale: string) =>
      stampLocaleLayoutGroup('<html><head></head><body></body></html>', locale)
        .match(/content="(i18n:[^"]+)"/)?.[1]

    expect(of('en')).toBe('i18n:en')
    expect(of('de')).toBe('i18n:de')
    expect(of('en')).not.toBe(of('de'))
  })

  it('replaces an existing group rather than emitting a second one', () => {
    const once = stampLocaleLayoutGroup('<html><head></head><body></body></html>', 'en')
    const twice = stampLocaleLayoutGroup(once, 'pl')

    expect(twice.match(/name="stx-layout-group"/g)).toHaveLength(1)
    expect(twice).toContain('content="i18n:pl"')
    expect(twice).not.toContain('content="i18n:en"')
  })

  it('escapes the locale into the attribute', () => {
    const html = stampLocaleLayoutGroup('<html><head></head><body></body></html>', 'e"n')
    expect(html).not.toContain('content="i18n:e"n"')
    expect(html).toContain('&quot;')
  })

  it('still stamps a fragment with no head', () => {
    const html = stampLocaleLayoutGroup('<div>fragment</div>', 'de')
    expect(html).toContain('<meta name="stx-layout-group" content="i18n:de">')
    expect(html).toContain('<div>fragment</div>')
  })
})
