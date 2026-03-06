import { describe, expect, test } from 'bun:test'
import { dominantColor, generateBlurDataUrl, generatePlaceholderStyle } from '../src/placeholder'

describe('generateBlurDataUrl', () => {
  test('returns valid data URL', () => {
    const result = generateBlurDataUrl()
    expect(result).toStartWith('data:image/svg+xml;base64,')
  })

  test('generates base64 encoded SVG', () => {
    const result = generateBlurDataUrl()
    const base64 = result.replace('data:image/svg+xml;base64,', '')
    const decoded = Buffer.from(base64, 'base64').toString('utf8')
    expect(decoded).toContain('<svg')
    expect(decoded).toContain('feGaussianBlur')
  })

  test('uses custom dimensions', () => {
    const result = generateBlurDataUrl(40, 30)
    const base64 = result.replace('data:image/svg+xml;base64,', '')
    const decoded = Buffer.from(base64, 'base64').toString('utf8')
    expect(decoded).toContain('viewBox="0 0 40 30"')
  })

  test('uses custom color', () => {
    const result = generateBlurDataUrl(20, 20, '#ff0000')
    const base64 = result.replace('data:image/svg+xml;base64,', '')
    const decoded = Buffer.from(base64, 'base64').toString('utf8')
    expect(decoded).toContain('#ff0000')
  })
})

describe('dominantColor', () => {
  test('returns default color when no input', () => {
    const result = dominantColor()
    expect(result).toBe('#e2e8f0')
  })

  test('normalizes hex with hash', () => {
    const result = dominantColor('#abcdef')
    expect(result).toBe('#abcdef')
  })

  test('adds hash when missing', () => {
    const result = dominantColor('abcdef')
    expect(result).toBe('#abcdef')
  })

  test('expands shorthand hex', () => {
    const result = dominantColor('#abc')
    expect(result).toBe('#aabbcc')
  })
})

describe('generatePlaceholderStyle', () => {
  test('generates color placeholder style', () => {
    const result = generatePlaceholderStyle({ type: 'color', color: '#ff0000' })
    expect(result).toBe('background-color: #ff0000;')
  })

  test('generates blur placeholder style', () => {
    const result = generatePlaceholderStyle({ type: 'blur' })
    expect(result).toContain('background-image: url(')
    expect(result).toContain('background-size: cover;')
  })

  test('uses default color for color type without color', () => {
    const result = generatePlaceholderStyle({ type: 'color' })
    expect(result).toContain('#e2e8f0')
  })
})
