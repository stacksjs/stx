import { describe, expect, test } from 'bun:test'
import { generateImageTag, generatePictureTag } from '../src/html'
import { processImageDirective } from '../src/directive'

describe('generateImageTag', () => {
  test('generates basic img tag', () => {
    const result = generateImageTag({ src: '/images/photo.jpg', alt: 'A photo' })
    expect(result).toContain('src="/images/photo.jpg"')
    expect(result).toContain('alt="A photo"')
    expect(result).toContain('<img ')
    expect(result).toContain(' />')
  })

  test('includes lazy loading by default', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test' })
    expect(result).toContain('loading="lazy"')
    expect(result).toContain('decoding="async"')
  })

  test('allows eager loading', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', lazy: false })
    expect(result).toContain('loading="eager"')
  })

  test('includes width and height', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', width: 800, height: 600 })
    expect(result).toContain('width="800"')
    expect(result).toContain('height="600"')
  })

  test('includes class attribute', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', class: 'hero-img rounded' })
    expect(result).toContain('class="hero-img rounded"')
  })

  test('includes sizes attribute', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', sizes: '(max-width: 768px) 100vw, 50vw' })
    expect(result).toContain('sizes="(max-width: 768px) 100vw, 50vw"')
  })

  test('includes blur placeholder style', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', placeholder: 'blur' })
    expect(result).toContain('style="background-image:')
    expect(result).toContain('background-size: cover;')
  })

  test('respects custom loading attribute', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', loading: 'eager' })
    expect(result).toContain('loading="eager"')
  })

  test('respects custom decoding attribute', () => {
    const result = generateImageTag({ src: '/img.jpg', alt: 'test', decoding: 'sync' })
    expect(result).toContain('decoding="sync"')
  })
})

describe('generatePictureTag', () => {
  test('generates picture element with sources', () => {
    const result = generatePictureTag({ src: '/images/photo.jpg', alt: 'A photo', formats: ['webp', 'jpg'] })
    expect(result).toContain('<picture>')
    expect(result).toContain('</picture>')
    expect(result).toContain('<source type="image/webp"')
    expect(result).toContain('<img ')
  })

  test('fallback img uses last format', () => {
    const result = generatePictureTag({ src: '/images/photo.png', alt: 'test', formats: ['avif', 'webp', 'jpg'] })
    expect(result).toContain('<source type="image/avif"')
    expect(result).toContain('<source type="image/webp"')
    expect(result).toContain('src="/images/photo.jpg"')
  })

  test('includes alt on fallback img', () => {
    const result = generatePictureTag({ src: '/img.png', alt: 'My image', formats: ['webp', 'png'] })
    expect(result).toContain('alt="My image"')
  })

  test('includes width and height on fallback img', () => {
    const result = generatePictureTag({ src: '/img.jpg', alt: 'test', formats: ['webp', 'jpg'], width: 1200, height: 800 })
    expect(result).toContain('width="1200"')
    expect(result).toContain('height="800"')
  })

  test('includes class on fallback img', () => {
    const result = generatePictureTag({ src: '/img.jpg', alt: 'test', formats: ['webp', 'jpg'], class: 'responsive' })
    expect(result).toContain('class="responsive"')
  })

  test('defaults to webp and jpg formats', () => {
    const result = generatePictureTag({ src: '/images/photo.jpg', alt: 'test' })
    expect(result).toContain('<source type="image/webp"')
    expect(result).toContain('src="/images/photo.jpg"')
  })
})

describe('processImageDirective', () => {
  test('replaces @img directive with img tag', () => {
    const content = `<div>@img('/images/hero.jpg', { alt: 'Hero' })</div>`
    const result = processImageDirective(content)
    expect(result).toContain('<img ')
    expect(result).toContain('src="/images/hero.jpg"')
    expect(result).toContain('alt="Hero"')
    expect(result).not.toContain('@img')
  })

  test('handles @img without options', () => {
    const content = `@img('/images/photo.jpg')`
    const result = processImageDirective(content)
    expect(result).toContain('src="/images/photo.jpg"')
    expect(result).toContain('alt=""')
  })

  test('passes through content without directives', () => {
    const content = '<div>Hello world</div>'
    const result = processImageDirective(content)
    expect(result).toBe(content)
  })

  test('replaces multiple @img directives', () => {
    const content = `@img('/a.jpg', { alt: 'A' }) and @img('/b.jpg', { alt: 'B' })`
    const result = processImageDirective(content)
    expect(result).toContain('src="/a.jpg"')
    expect(result).toContain('src="/b.jpg"')
    expect(result).not.toContain('@img')
  })

  test('respects config lazyLoad setting', () => {
    const content = `@img('/img.jpg', { alt: 'test' })`
    const result = processImageDirective(content, { lazyLoad: false })
    expect(result).toContain('loading="eager"')
  })
})
