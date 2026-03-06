import { describe, expect, test } from 'bun:test'
import { buildSizes, buildSrcSet, generateResponsiveSet } from '../src/responsive'

describe('generateResponsiveSet', () => {
  test('creates variants for each breakpoint', () => {
    const set = generateResponsiveSet('images/hero.jpg')
    expect(set.original).toBe('images/hero.jpg')
    expect(set.variants).toHaveLength(4)
    expect(set.variants[0].width).toBe(640)
    expect(set.variants[1].width).toBe(768)
    expect(set.variants[2].width).toBe(1024)
    expect(set.variants[3].width).toBe(1280)
  })

  test('generates correct variant paths', () => {
    const set = generateResponsiveSet('assets/photo.png')
    expect(set.variants[0].path).toBe('assets/photo-640.png')
    expect(set.variants[1].path).toBe('assets/photo-768.png')
  })

  test('uses custom breakpoints', () => {
    const set = generateResponsiveSet('img.jpg', [
      { width: 320, suffix: '-sm' },
      { width: 1920, suffix: '-xl' },
    ])
    expect(set.variants).toHaveLength(2)
    expect(set.variants[0].path).toBe('img-sm.jpg')
    expect(set.variants[1].path).toBe('img-xl.jpg')
  })

  test('preserves format from extension', () => {
    const set = generateResponsiveSet('photo.webp')
    expect(set.variants[0].format).toBe('webp')
  })

  test('generates srcset string', () => {
    const set = generateResponsiveSet('photo.jpg')
    expect(set.srcset).toContain('photo-640.jpg 640w')
    expect(set.srcset).toContain('photo-1280.jpg 1280w')
  })
})

describe('buildSrcSet', () => {
  test('formats variants into srcset string', () => {
    const result = buildSrcSet([
      { path: 'image-640.webp', width: 640 },
      { path: 'image-1024.webp', width: 1024 },
    ])
    expect(result).toBe('image-640.webp 640w, image-1024.webp 1024w')
  })

  test('handles single variant', () => {
    const result = buildSrcSet([{ path: 'image.jpg', width: 800 }])
    expect(result).toBe('image.jpg 800w')
  })

  test('handles empty array', () => {
    const result = buildSrcSet([])
    expect(result).toBe('')
  })
})

describe('buildSizes', () => {
  test('creates sizes attribute from breakpoints', () => {
    const result = buildSizes([
      { width: 640 },
      { width: 1024 },
      { width: 1280 },
    ])
    expect(result).toBe('(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1280px')
  })

  test('sorts breakpoints by width', () => {
    const result = buildSizes([
      { width: 1280 },
      { width: 640 },
    ])
    expect(result).toBe('(max-width: 640px) 640px, 1280px')
  })

  test('handles single breakpoint', () => {
    const result = buildSizes([{ width: 800 }])
    expect(result).toBe('800px')
  })

  test('handles empty breakpoints', () => {
    const result = buildSizes([])
    expect(result).toBe('')
  })
})
