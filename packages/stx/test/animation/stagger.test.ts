import { describe, expect, it } from 'bun:test'
import { staggerDirective } from '../../src/animation'

describe('stagger directive', () => {
  it('should apply stagger animation with default options', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li><li>Item 2</li></ul>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-stagger-container')
    expect(result).toContain('<ul><li>Item 1</li><li>Item 2</li></ul>')
    expect(result).toContain('<script>')
    expect(result).toContain('<style>')
  })

  it('should include stagger animation styles', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('.stx-stagger-item')
    expect(result).toContain('@keyframes staggerIn')
    expect(result).toContain('opacity: 0')
    expect(result).toContain('translateY(10px)')
  })

  it('should accept custom child selector', () => {
    const result = staggerDirective.handler(
      '<div><span>A</span><span>B</span></div>',
      ['span'],
      {},
      '/test.stx',
    )
    expect(result).toContain("querySelectorAll('span')")
  })

  it('should accept custom stagger delay', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      ['> *', '200'],
      {},
      '/test.stx',
    )
    expect(result).toContain('index * 200')
  })

  it('should accept custom base delay', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      ['> *', '100', '500'],
      {},
      '/test.stx',
    )
    expect(result).toContain('500 + (index * 100)')
  })

  it('should apply fade animation type', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      ['> *', '100', '0', 'fade'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-fade')
  })

  it('should apply slide animation type', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      ['> *', '100', '0', 'slide'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-from-bottom')
  })

  it('should apply scale animation type', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      ['> *', '100', '0', 'scale'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-scale')
  })

  it('should generate unique IDs', () => {
    const result1 = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      [],
      {},
      '/test.stx',
    )
    const result2 = staggerDirective.handler(
      '<ul><li>Item 2</li></ul>',
      [],
      {},
      '/test.stx',
    )

    const id1Match = result1.match(/id="(stx-stagger-[a-z0-9]+)"/)
    const id2Match = result2.match(/id="(stx-stagger-[a-z0-9]+)"/)

    expect(id1Match).not.toBeNull()
    expect(id2Match).not.toBeNull()
    expect(id1Match![1]).not.toBe(id2Match![1])
  })

  it('should include script for applying stagger delays', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain("style.setProperty('--stx-stagger-delay'")
    expect(result).toContain('animationDelay')
    expect(result).toContain("classList.add('")
  })

  it('should strip quotes from selectors', () => {
    const result = staggerDirective.handler(
      '<ul><li>Item 1</li></ul>',
      ['"li"'],
      {},
      '/test.stx',
    )
    expect(result).toContain("querySelectorAll('li')")
  })
})
