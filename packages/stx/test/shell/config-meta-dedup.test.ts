/**
 * Config head tags are merged the same way whichever path builds the page
 * (stacksjs/stx#1840).
 *
 * Two functions merge `app.head` into a document. `injectConfigHeadTags` dedups
 * — its docblock advertises it — while `generateDocumentShell` prepended a
 * hardcoded `charset` / `viewport` pair and then straight-concatenated whatever
 * config supplied.
 *
 * So declaring `charset` or `viewport` in `app.head.meta`, which is the obvious
 * place for site-wide head tags, emitted TWO of each on every page built
 * through the shell, and one on a page that owned its own document. Same
 * config, different head, and the difference is invisible from the config file
 * — which is why at least one real app carries a comment telling the next
 * person not to declare them there.
 *
 * Config wins over the default, for the same reason the page's own head wins in
 * `injectConfigHeadTags`: between an author's declaration and a framework
 * default, the author's is the more specific statement of intent.
 */
import { describe, expect, it } from 'bun:test'
import { generateDocumentShell, injectConfigHeadTags, metaDedupKey } from '../../src/document-shell'

function shell(meta: Record<string, string>[]): string {
  return generateDocumentShell('<main>hi</main>', { meta } as never, {})
}

const count = (html: string, pattern: RegExp): number => (html.match(pattern) ?? []).length
const CHARSET = /<meta charset/g
const VIEWPORT = /name="viewport"/g

describe('generateDocumentShell', () => {
  it('emits one charset when config declares it', async () => {
    expect(count(shell([{ charset: 'ISO-8859-1' }]), CHARSET)).toBe(1)
  })

  it('emits one viewport when config declares it', async () => {
    expect(count(shell([{ name: 'viewport', content: 'width=500' }]), VIEWPORT)).toBe(1)
  })

  it('lets the configured value win over the default', async () => {
    // Deduping to the wrong one would be its own bug: the author asked for
    // this value.
    const out = shell([{ charset: 'ISO-8859-1' }, { name: 'viewport', content: 'width=500' }])

    expect(out).toContain('<meta charset="ISO-8859-1">')
    expect(out).toContain('content="width=500"')
    expect(count(out, CHARSET)).toBe(1)
    expect(count(out, VIEWPORT)).toBe(1)
  })

  it('still emits the defaults when config declares neither', async () => {
    const out = shell([])

    expect(out).toContain('<meta charset="UTF-8">')
    expect(out).toContain('width=device-width, initial-scale=1.0')
  })

  it('does not disturb unrelated config meta', async () => {
    const out = shell([{ name: 'description', content: 'hi' }])

    expect(count(out, CHARSET)).toBe(1)
    expect(count(out, VIEWPORT)).toBe(1)
    expect(out).toContain('name="description"')
  })
})

describe('the two merge paths agree', () => {
  it('produces one of each however the page was built', async () => {
    // The actual invariant: the same config must not depend on whether the page
    // owns its document.
    const meta = [{ charset: 'UTF-8' }, { name: 'viewport', content: 'width=device-width' }]

    const built = shell(meta)
    const toppedUp = injectConfigHeadTags(
      '<html><head><meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>',
      { meta } as never,
    )

    expect(count(built, CHARSET)).toBe(1)
    expect(count(toppedUp, CHARSET)).toBe(1)
    expect(count(built, VIEWPORT)).toBe(1)
    expect(count(toppedUp, VIEWPORT)).toBe(1)
  })
})

describe('metaDedupKey', () => {
  it('identifies each shape the head merger understands', () => {
    expect(metaDedupKey({ name: 'viewport' })).toBe('name="viewport"')
    expect(metaDedupKey({ property: 'og:title' })).toBe('property="og:title"')
    expect(metaDedupKey({ charset: 'UTF-8' })).toBe('charset=')
    expect(metaDedupKey({ 'http-equiv': 'refresh' })).toBe('http-equiv="refresh"')
  })

  it('keys charset by presence, not value', () => {
    // A document may only have one, whatever it says — which is exactly why
    // the duplicate was harmful rather than merely untidy.
    expect(metaDedupKey({ charset: 'UTF-8' })).toBe(metaDedupKey({ charset: 'ISO-8859-1' }))
  })

  it('returns nothing for a tag it cannot identify', () => {
    // Callers treat '' as "cannot dedup, keep it".
    expect(metaDedupKey({ content: 'orphan' })).toBe('')
  })
})
