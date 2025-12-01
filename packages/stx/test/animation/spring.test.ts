import { describe, expect, it } from 'bun:test'
import {
  SPRING_PRESETS,
  springDirective,
} from '../../src/animation'

describe('spring directive', () => {
  it('should apply spring animation with default preset', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-spring')
    expect(result).toContain('--stx-spring-stiffness: 100')
    expect(result).toContain('--stx-spring-damping: 10')
    expect(result).toContain('--stx-spring-mass: 1')
    expect(result).toContain('<p>Test content</p>')
  })

  it('should apply gentle preset', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['gentle'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 120')
    expect(result).toContain('--stx-spring-damping: 14')
  })

  it('should apply wobbly preset', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['wobbly'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 180')
    expect(result).toContain('--stx-spring-damping: 12')
  })

  it('should apply stiff preset', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['stiff'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 210')
    expect(result).toContain('--stx-spring-damping: 20')
  })

  it('should apply slow preset', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['slow'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 280')
    expect(result).toContain('--stx-spring-damping: 60')
  })

  it('should apply molasses preset', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['molasses'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 280')
    expect(result).toContain('--stx-spring-damping: 120')
  })

  it('should accept custom stiffness value', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['150'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 150')
  })

  it('should accept custom stiffness and damping', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['200', '25'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 200')
    expect(result).toContain('--stx-spring-damping: 25')
  })

  it('should accept custom stiffness, damping, and mass', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['200', '25', '1.5'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-spring-stiffness: 200')
    expect(result).toContain('--stx-spring-damping: 25')
    expect(result).toContain('--stx-spring-mass: 1.5')
  })

  it('should accept custom duration', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['default', '10', '1', '800'],
      {},
      '/test.stx',
    )
    expect(result).toContain('800ms')
  })

  it('should generate unique IDs', () => {
    const result1 = springDirective.handler(
      '<p>Test 1</p>',
      ['default'],
      {},
      '/test.stx',
    )
    const result2 = springDirective.handler(
      '<p>Test 2</p>',
      ['default'],
      {},
      '/test.stx',
    )

    const id1Match = result1.match(/id="(stx-spring-[a-z0-9]+)"/)
    const id2Match = result2.match(/id="(stx-spring-[a-z0-9]+)"/)

    expect(id1Match).not.toBeNull()
    expect(id2Match).not.toBeNull()
    expect(id1Match![1]).not.toBe(id2Match![1])
  })

  it('should include transition style', () => {
    const result = springDirective.handler(
      '<p>Test content</p>',
      ['default'],
      {},
      '/test.stx',
    )
    expect(result).toContain('transition: all')
    expect(result).toContain('cubic-bezier')
  })
})

describe('spring presets', () => {
  it('should have all required presets', () => {
    expect(SPRING_PRESETS.default).toBeDefined()
    expect(SPRING_PRESETS.gentle).toBeDefined()
    expect(SPRING_PRESETS.wobbly).toBeDefined()
    expect(SPRING_PRESETS.stiff).toBeDefined()
    expect(SPRING_PRESETS.slow).toBeDefined()
    expect(SPRING_PRESETS.molasses).toBeDefined()
  })

  it('should have correct default preset values', () => {
    expect(SPRING_PRESETS.default.stiffness).toBe(100)
    expect(SPRING_PRESETS.default.damping).toBe(10)
    expect(SPRING_PRESETS.default.mass).toBe(1)
  })

  it('should have correct gentle preset values', () => {
    expect(SPRING_PRESETS.gentle.stiffness).toBe(120)
    expect(SPRING_PRESETS.gentle.damping).toBe(14)
    expect(SPRING_PRESETS.gentle.mass).toBe(1)
  })

  it('should have correct wobbly preset values', () => {
    expect(SPRING_PRESETS.wobbly.stiffness).toBe(180)
    expect(SPRING_PRESETS.wobbly.damping).toBe(12)
    expect(SPRING_PRESETS.wobbly.mass).toBe(1)
  })

  it('should have correct stiff preset values', () => {
    expect(SPRING_PRESETS.stiff.stiffness).toBe(210)
    expect(SPRING_PRESETS.stiff.damping).toBe(20)
    expect(SPRING_PRESETS.stiff.mass).toBe(1)
  })

  it('should have correct slow preset values', () => {
    expect(SPRING_PRESETS.slow.stiffness).toBe(280)
    expect(SPRING_PRESETS.slow.damping).toBe(60)
    expect(SPRING_PRESETS.slow.mass).toBe(1)
  })

  it('should have correct molasses preset values', () => {
    expect(SPRING_PRESETS.molasses.stiffness).toBe(280)
    expect(SPRING_PRESETS.molasses.damping).toBe(120)
    expect(SPRING_PRESETS.molasses.mass).toBe(1)
  })
})
