import { describe, expect, it } from 'bun:test'
import { scrollAnimateDirective } from '../../src/animation'

describe('scrollAnimate directive', () => {
  it('should require at least one parameter', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-error')
    expect(result).toContain('requires at least an animation type')
  })

  it('should generate fade scroll animation', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['fade'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-observe')
    expect(result).toContain('stx-out')
    expect(result).toContain('stx-fade')
    expect(result).toContain('<p>Test content</p>')
  })

  it('should generate slide-up scroll animation', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['slide-up'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-from-bottom')
  })

  it('should generate slide-down scroll animation', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['slide-down'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-from-top')
  })

  it('should generate slide-left scroll animation', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['slide-left'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-from-right')
  })

  it('should generate slide-right scroll animation', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['slide-right'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-from-left')
  })

  it('should generate scale scroll animation', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['scale'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-scale')
  })

  it('should accept custom duration', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['fade', '500'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-transition-duration: 500ms')
  })

  it('should accept custom ease', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['fade', '300', 'ease-in-out'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-transition-ease: ease-in-out')
  })

  it('should accept custom threshold', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['fade', '300', 'ease', '0.5'],
      {},
      '/test.stx',
    )
    expect(result).toContain('data-threshold="0.5"')
  })

  it('should accept custom delay', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['fade', '300', 'ease', '0.2', '100'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-transition-delay: 100ms')
  })

  it('should generate unique IDs', () => {
    const result1 = scrollAnimateDirective.handler(
      '<p>Test 1</p>',
      ['fade'],
      {},
      '/test.stx',
    )
    const result2 = scrollAnimateDirective.handler(
      '<p>Test 2</p>',
      ['fade'],
      {},
      '/test.stx',
    )

    const id1Match = result1.match(/id="(stx-scroll-[a-z0-9]+)"/)
    const id2Match = result2.match(/id="(stx-scroll-[a-z0-9]+)"/)

    expect(id1Match).not.toBeNull()
    expect(id2Match).not.toBeNull()
    expect(id1Match![1]).not.toBe(id2Match![1])
  })

  it('should include will-change for performance', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['fade'],
      {},
      '/test.stx',
    )
    expect(result).toContain('will-change: opacity, transform')
  })

  it('should handle custom animation types', () => {
    const result = scrollAnimateDirective.handler(
      '<p>Test content</p>',
      ['custom-slide'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-custom-slide')
  })
})
