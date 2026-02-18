import { describe, expect, it } from 'bun:test'
import { renderImgComponent } from '../../src/media/image/component'
import type { ImgProps } from '../../src/media/types'

describe('@img directive - renderImgComponent', () => {
  it('should render basic image with lazy loading', async () => {
    const props: ImgProps = {
      src: '/images/hero.jpg',
      alt: 'Hero image',
    }
    const result = await renderImgComponent(props, { isDev: true })

    expect(result.html).toContain('<img')
    expect(result.html).toContain('src="/images/hero.jpg"')
    expect(result.html).toContain('alt="Hero image"')
    expect(result.html).toContain('loading="lazy"')
    expect(result.html).toContain('decoding="async"')
  })

  it('should set loading="eager" for priority images', async () => {
    const props: ImgProps = {
      src: '/images/hero.jpg',
      alt: 'Hero',
      priority: true,
    }
    const result = await renderImgComponent(props, { isDev: true })

    expect(result.html).toContain('loading="eager"')
    // Priority images should have preload link
    if (result.preloadLink) {
      expect(result.preloadLink).toContain('<link')
      expect(result.preloadLink).toContain('rel="preload"')
    }
  })

  it('should include width and height when provided', async () => {
    const props: ImgProps = {
      src: '/images/photo.jpg',
      alt: 'Photo',
      width: 800,
      height: 600,
    }
    const result = await renderImgComponent(props, { isDev: true })

    expect(result.html).toContain('width="800"')
    expect(result.html).toContain('height="600"')
  })

  it('should include custom class and id', async () => {
    const props: ImgProps = {
      src: '/images/photo.jpg',
      alt: 'Photo',
      class: 'hero-image rounded',
      id: 'main-hero',
    }
    const result = await renderImgComponent(props, { isDev: true })

    expect(result.html).toContain('hero-image')
    expect(result.html).toContain('main-hero')
  })

  it('should handle missing alt gracefully', async () => {
    const props: ImgProps = {
      src: '/images/decorative.jpg',
      alt: '',
    }
    const result = await renderImgComponent(props, { isDev: true })

    expect(result.html).toContain('<img')
    expect(result.html).toContain('alt=""')
  })

  it('should return html as string', async () => {
    const result = await renderImgComponent(
      { src: '/test.jpg', alt: 'test' },
      { isDev: true },
    )

    expect(typeof result.html).toBe('string')
    expect(result.html.length).toBeGreaterThan(0)
  })
})
