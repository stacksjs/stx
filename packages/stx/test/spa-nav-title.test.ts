import { describe, expect, it } from 'bun:test'
import { decodeTitleEntities } from '../src/spa-nav'

describe('decodeTitleEntities', () => {
  // The bug: a full load parses <title> as HTML and gets the ampersand, while
  // a client-side navigation assigned the same markup to document.title as a
  // string, so one page had two different names depending on how you arrived.
  it('resolves the escape an HTML escaper leaves in a title', () => {
    expect(decodeTitleEntities('Chris Breuer - Software engineer, founder &amp; skyrunner'))
      .toBe('Chris Breuer - Software engineer, founder & skyrunner')
  })

  it('resolves the rest of the escaped set', () => {
    expect(decodeTitleEntities('&lt;script&gt; &quot;quoted&quot; &apos;apostrophe&apos;'))
      .toBe('<script> "quoted" \'apostrophe\'')
  })

  it('resolves numeric references, decimal and hex', () => {
    expect(decodeTitleEntities('caf&#233; &#x2014; b&#xE9;b&#233;')).toBe('café — bébé')
  })

  it('leaves a title with nothing to decode exactly as it was', () => {
    expect(decodeTitleEntities('About - Chris Breuer')).toBe('About - Chris Breuer')
  })

  // &amp; is resolved last for this case: decoding it first would turn the
  // text "&lt;" that the author wanted to show into an actual "<".
  it('does not resolve an escape that the title only quotes', () => {
    expect(decodeTitleEntities('Writing &amp;lt; in HTML')).toBe('Writing &lt; in HTML')
  })

  it('keeps a reference that names no character rather than throwing', () => {
    expect(decodeTitleEntities('out of range &#1114112; here')).toBe('out of range &#1114112; here')
  })
})
