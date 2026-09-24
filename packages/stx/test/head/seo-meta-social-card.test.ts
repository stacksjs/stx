/**
 * useSeoMeta covers what a share card actually reads: the image's size, type
 * and alt text, the card's alt text, and the profile:* properties of a
 * `profile` page. Without them a page had to hand-write those tags beside
 * useSeoMeta, which meant two sources for one card.
 */
import type { MetaTag } from '../../src/head'
import { describe, expect, it } from 'bun:test'
import { seoMetaToHeadConfig } from '../../src/head'

function tags(meta: MetaTag[] | undefined): string[] {
  return (meta ?? []).map(tag => `${tag.property ?? tag.name}=${tag.content}`)
}

describe('seoMetaToHeadConfig social card fields', () => {
  const head = seoMetaToHeadConfig({
    title: 'Mario Adrion',
    ogImage: 'https://example.com/og.jpg',
    ogImageAlt: 'On stage',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    ogType: 'profile',
    profileFirstName: 'Mario',
    profileLastName: 'Adrion',
    profileUsername: 'marioadrion',
    twitterCard: 'summary_large_image',
  })
  const rendered = tags(head.meta)

  it('describes the image right after og:image, where scrapers attach it', () => {
    const at = rendered.indexOf('og:image=https://example.com/og.jpg')
    expect(rendered.slice(at, at + 5)).toEqual([
      'og:image=https://example.com/og.jpg',
      'og:image:type=image/jpeg',
      'og:image:width=1200',
      'og:image:height=630',
      'og:image:alt=On stage',
    ])
  })

  it('emits the profile:* properties', () => {
    expect(rendered).toContain('profile:first_name=Mario')
    expect(rendered).toContain('profile:last_name=Adrion')
    expect(rendered).toContain('profile:username=marioadrion')
  })

  it('gives a card that reuses ogImage the same alt text', () => {
    expect(rendered).toContain('twitter:image=https://example.com/og.jpg')
    expect(rendered).toContain('twitter:image:alt=On stage')
  })

  it('does not borrow the Open Graph alt for a card with its own image', () => {
    const own = tags(seoMetaToHeadConfig({
      ogImage: '/a.jpg',
      ogImageAlt: 'A',
      twitterImage: '/b.jpg',
    }).meta)

    expect(own.some(tag => tag.startsWith('twitter:image:alt'))).toBe(false)
  })

  it('leaves image structure out when there is no image to describe', () => {
    const none = tags(seoMetaToHeadConfig({ ogImageWidth: 1200, ogImageAlt: 'x' }).meta)

    expect(none.some(tag => tag.startsWith('og:image'))).toBe(false)
  })
})
