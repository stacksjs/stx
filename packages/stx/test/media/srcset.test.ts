import { describe, expect, it } from 'bun:test'
import {
  generateWidthSrcset,
  generateDprSrcset,
  generateDprSrcsetWithVariableQuality,
  generateSizesAttribute,
  generateSourceTags,
  generateSrcsetData,
  buildImageUrl,
  parseImageUrl,
  calculateOptimalWidths,
  getBestVariant,
  getFallbackVariant,
  getMimeType,
  getFormatExtension,
  detectFormat,
  DEFAULT_WIDTHS,
  DEFAULT_DPR_VALUES,
  DEFAULT_FORMATS,
  MIME_TYPES,
} from '../../src/media/image/srcset'

describe('srcset - buildImageUrl', () => {
  it('should return src unchanged when no params', () => {
    expect(buildImageUrl('/images/hero.jpg')).toBe('/images/hero.jpg')
  })

  it('should append query parameters', () => {
    const url = buildImageUrl('/images/hero.jpg', { w: 800, h: 600 })
    expect(url).toContain('/images/hero.jpg?')
    expect(url).toContain('w=800')
    expect(url).toContain('h=600')
  })

  it('should use & separator for existing query strings', () => {
    const url = buildImageUrl('/images/hero.jpg?existing=true', { w: 800 })
    expect(url).toContain('&w=800')
  })

  it('should filter undefined and null params', () => {
    const url = buildImageUrl('/img.jpg', { w: 100, h: undefined, q: null } as any)
    expect(url).toContain('w=100')
    expect(url).not.toContain('h=')
    expect(url).not.toContain('q=')
  })
})

describe('srcset - parseImageUrl', () => {
  it('should parse URL without query string', () => {
    const { src, params } = parseImageUrl('/images/hero.jpg')
    expect(src).toBe('/images/hero.jpg')
    expect(Object.keys(params).length).toBe(0)
  })

  it('should parse URL with numeric parameters', () => {
    const { src, params } = parseImageUrl('/images/hero.jpg?w=800&h=600')
    expect(src).toBe('/images/hero.jpg')
    expect(params.w).toBe(800)
    expect(params.h).toBe(600)
  })
})

describe('srcset - generateWidthSrcset', () => {
  it('should generate width descriptors for given widths', () => {
    const srcset = generateWidthSrcset('/img.jpg', [320, 640, 1024])
    expect(srcset).toContain('/img.jpg?w=320 320w')
    expect(srcset).toContain('/img.jpg?w=640 640w')
    expect(srcset).toContain('/img.jpg?w=1024 1024w')
  })

  it('should sort widths in ascending order', () => {
    const srcset = generateWidthSrcset('/img.jpg', [1024, 320, 640])
    const parts = srcset.split(', ')
    expect(parts[0]).toContain('320w')
    expect(parts[1]).toContain('640w')
    expect(parts[2]).toContain('1024w')
  })

  it('should use DEFAULT_WIDTHS when no widths provided', () => {
    const srcset = generateWidthSrcset('/img.jpg')
    for (const w of DEFAULT_WIDTHS) {
      expect(srcset).toContain(`${w}w`)
    }
  })

  it('should include format parameter when specified', () => {
    const srcset = generateWidthSrcset('/img.jpg', [320], {}, 'webp')
    expect(srcset).toContain('fm=webp')
  })

  it('should include additional params', () => {
    const srcset = generateWidthSrcset('/img.jpg', [320], { q: 80 })
    expect(srcset).toContain('q=80')
  })
})

describe('srcset - generateDprSrcset', () => {
  it('should generate DPR descriptors', () => {
    const srcset = generateDprSrcset('/img.jpg', 200, [1, 2, 3])
    expect(srcset).toContain('w=200')
    expect(srcset).toContain('1x')
    expect(srcset).toContain('w=400')
    expect(srcset).toContain('2x')
    expect(srcset).toContain('w=600')
    expect(srcset).toContain('3x')
  })

  it('should use DEFAULT_DPR_VALUES when not specified', () => {
    const srcset = generateDprSrcset('/img.jpg', 100)
    for (const dpr of DEFAULT_DPR_VALUES) {
      expect(srcset).toContain(`${dpr}x`)
    }
  })
})

describe('srcset - generateDprSrcsetWithVariableQuality', () => {
  it('should reduce quality for higher DPR values', () => {
    const srcset = generateDprSrcsetWithVariableQuality('/img.jpg', 200, [1, 2, 3], 80)
    // 1x should have q=80, 2x should have q=64, 3x should have q=56
    const parts = srcset.split(', ')
    const q1x = parts.find(p => p.includes('1x'))
    const q2x = parts.find(p => p.includes('2x'))
    const q3x = parts.find(p => p.includes('3x'))

    expect(q1x).toContain('q=80')
    expect(q2x).toContain('q=64')
    expect(q3x).toContain('q=56')
  })
})

describe('srcset - generateSizesAttribute', () => {
  it('should generate sizes from breakpoints', () => {
    const sizes = generateSizesAttribute({
      '768px': '100vw',
      '1024px': '50vw',
    })
    expect(sizes).toContain('(max-width: 768px) 100vw')
    expect(sizes).toContain('(max-width: 1024px) 50vw')
    expect(sizes).toMatch(/100vw$/) // default at end
  })

  it('should return default size when no breakpoints', () => {
    expect(generateSizesAttribute({})).toBe('100vw')
    expect(generateSizesAttribute({}, '50vw')).toBe('50vw')
  })

  it('should sort breakpoints by size', () => {
    const sizes = generateSizesAttribute({
      '1024px': '50vw',
      '480px': '100vw',
      '768px': '75vw',
    })
    const parts = sizes.split(', ')
    expect(parts[0]).toContain('480px')
    expect(parts[1]).toContain('768px')
    expect(parts[2]).toContain('1024px')
  })

  it('should add px unit to bare numbers', () => {
    const sizes = generateSizesAttribute({ '768': '100vw' })
    expect(sizes).toContain('768px')
  })
})

describe('srcset - generateSourceTags', () => {
  it('should generate source tags for multiple formats', () => {
    const srcsetData = [
      { srcset: '/img.avif 320w', format: 'avif' as const, mimeType: 'image/avif', variants: [] },
      { srcset: '/img.webp 320w', format: 'webp' as const, mimeType: 'image/webp', variants: [] },
    ]
    const tags = generateSourceTags(srcsetData)
    expect(tags).toContain('<source type="image/avif"')
    expect(tags).toContain('<source type="image/webp"')
    expect(tags).toContain('sizes="100vw"')
  })

  it('should use custom sizes', () => {
    const srcsetData = [
      { srcset: '/img.webp 320w', format: 'webp' as const, mimeType: 'image/webp', variants: [] },
    ]
    const tags = generateSourceTags(srcsetData, '50vw')
    expect(tags).toContain('sizes="50vw"')
  })
})

describe('srcset - generateSrcsetData', () => {
  it('should generate srcset data for multiple formats', () => {
    const data = generateSrcsetData({
      src: '/img.jpg',
      formats: ['avif', 'webp', 'jpeg'],
      widths: [320, 640],
    })
    expect(data.length).toBe(3)
    expect(data[0].format).toBe('avif')
    expect(data[1].format).toBe('webp')
    expect(data[2].format).toBe('jpeg')
  })

  it('should generate DPR-based srcset when fixedWidth provided', () => {
    const data = generateSrcsetData({
      src: '/img.jpg',
      fixedWidth: 200,
      dprValues: [1, 2],
      formats: ['webp'],
    })
    expect(data.length).toBe(1)
    expect(data[0].srcset).toContain('1x')
    expect(data[0].srcset).toContain('2x')
  })
})

describe('srcset - calculateOptimalWidths', () => {
  it('should include min and max widths', () => {
    const widths = calculateOptimalWidths(320, 2560)
    expect(widths[0]).toBe(320)
    expect(widths[widths.length - 1]).toBe(2560)
  })

  it('should generate increasing widths', () => {
    const widths = calculateOptimalWidths(320, 1920)
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThan(widths[i - 1])
    }
  })
})

describe('srcset - utility functions', () => {
  it('getMimeType should return correct MIME types', () => {
    expect(getMimeType('jpeg')).toBe('image/jpeg')
    expect(getMimeType('webp')).toBe('image/webp')
    expect(getMimeType('avif')).toBe('image/avif')
    expect(getMimeType('png')).toBe('image/png')
  })

  it('getFormatExtension should return correct extensions', () => {
    expect(getFormatExtension('jpeg')).toBe('jpg')
    expect(getFormatExtension('webp')).toBe('webp')
    expect(getFormatExtension('avif')).toBe('avif')
  })

  it('detectFormat should detect from file extension', () => {
    expect(detectFormat('/images/hero.jpg')).toBe('jpeg')
    expect(detectFormat('/images/hero.jpeg')).toBe('jpeg')
    expect(detectFormat('/images/hero.png')).toBe('png')
    expect(detectFormat('/images/hero.webp')).toBe('webp')
    expect(detectFormat('/images/hero.avif')).toBe('avif')
    expect(detectFormat('/images/hero.gif')).toBe('gif')
    expect(detectFormat('/images/hero.bmp')).toBeUndefined()
  })

  it('getBestVariant should return smallest variant >= target width', () => {
    const variants = [
      { path: '', url: '', width: 320, height: 0, format: 'jpeg' as const, size: 0 },
      { path: '', url: '', width: 640, height: 0, format: 'jpeg' as const, size: 0 },
      { path: '', url: '', width: 1024, height: 0, format: 'jpeg' as const, size: 0 },
    ]
    const best = getBestVariant(variants, 500)
    expect(best?.width).toBe(640)
  })

  it('getBestVariant should return largest when target exceeds all', () => {
    const variants = [
      { path: '', url: '', width: 320, height: 0, format: 'jpeg' as const, size: 0 },
      { path: '', url: '', width: 640, height: 0, format: 'jpeg' as const, size: 0 },
    ]
    const best = getBestVariant(variants, 1000)
    expect(best?.width).toBe(640)
  })

  it('getBestVariant should return undefined for empty array', () => {
    expect(getBestVariant([], 500)).toBeUndefined()
  })

  it('getFallbackVariant should return middle variant', () => {
    const variants = [
      { path: '', url: '', width: 320, height: 0, format: 'jpeg' as const, size: 0 },
      { path: '', url: '', width: 640, height: 0, format: 'jpeg' as const, size: 0 },
      { path: '', url: '', width: 1024, height: 0, format: 'jpeg' as const, size: 0 },
    ]
    const fallback = getFallbackVariant(variants)
    expect(fallback).toBeDefined()
  })
})

describe('srcset - constants', () => {
  it('DEFAULT_WIDTHS should contain standard breakpoints', () => {
    expect(DEFAULT_WIDTHS).toContain(320)
    expect(DEFAULT_WIDTHS).toContain(768)
    expect(DEFAULT_WIDTHS).toContain(1024)
    expect(DEFAULT_WIDTHS).toContain(1920)
  })

  it('DEFAULT_DPR_VALUES should contain standard ratios', () => {
    expect(DEFAULT_DPR_VALUES).toContain(1)
    expect(DEFAULT_DPR_VALUES).toContain(2)
  })

  it('DEFAULT_FORMATS should include avif, webp, jpeg', () => {
    expect(DEFAULT_FORMATS).toContain('avif')
    expect(DEFAULT_FORMATS).toContain('webp')
    expect(DEFAULT_FORMATS).toContain('jpeg')
  })

  it('MIME_TYPES should map all formats', () => {
    expect(MIME_TYPES.jpeg).toBe('image/jpeg')
    expect(MIME_TYPES.webp).toBe('image/webp')
    expect(MIME_TYPES.avif).toBe('image/avif')
    expect(MIME_TYPES.png).toBe('image/png')
    expect(MIME_TYPES.gif).toBe('image/gif')
  })
})
