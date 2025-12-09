import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_TRANSITION_OPTIONS,
  TransitionDirection,
  transitionDirective,
  TransitionEase,
  TransitionType,
} from '../../src/animation'

describe('transition directive', () => {
  it('should require at least one parameter', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-error')
    expect(result).toContain('requires at least a transition type')
  })

  it('should generate fade transition', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Fade],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-transition')
    expect(result).toContain('stx-fade')
    expect(result).toContain('<p>Test content</p>')
  })

  it('should generate slide transition', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Slide],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-slide')
  })

  it('should generate scale transition', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Scale],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-scale')
  })

  it('should generate flip transition', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Flip],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-flip')
  })

  it('should generate rotate transition', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Rotate],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-rotate')
  })

  it('should accept custom duration', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Fade, '500'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-transition-duration: 500ms')
  })

  it('should accept custom ease', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Fade, '300', 'ease-in-out'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-transition-ease: ease-in-out')
  })

  it('should accept custom delay', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Fade, '300', 'ease', '100'],
      {},
      '/test.stx',
    )
    expect(result).toContain('--stx-transition-delay: 100ms')
  })

  it('should add out class for out direction', () => {
    const result = transitionDirective.handler(
      '<p>Test content</p>',
      [TransitionType.Fade, '300', 'ease', '0', TransitionDirection.Out],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-out')
  })

  it('should generate unique IDs', () => {
    const result1 = transitionDirective.handler(
      '<p>Test 1</p>',
      [TransitionType.Fade],
      {},
      '/test.stx',
    )
    const result2 = transitionDirective.handler(
      '<p>Test 2</p>',
      [TransitionType.Fade],
      {},
      '/test.stx',
    )

    const id1Match = (result1 as string).match(/id="(stx-transition-[a-z0-9]+)"/)
    const id2Match = (result2 as string).match(/id="(stx-transition-[a-z0-9]+)"/)

    expect(id1Match).not.toBeNull()
    expect(id2Match).not.toBeNull()
    expect(id1Match![1]).not.toBe(id2Match![1])
  })
})

describe('transition types', () => {
  it('should have all required transition types', () => {
    expect(TransitionType.Fade).toBe('fade' as TransitionType)
    expect(TransitionType.Slide).toBe('slide' as TransitionType)
    expect(TransitionType.Scale).toBe('scale' as TransitionType)
    expect(TransitionType.Flip).toBe('flip' as TransitionType)
    expect(TransitionType.Rotate).toBe('rotate' as TransitionType)
    expect(TransitionType.Custom).toBe('custom' as TransitionType)
  })

  it('should have all required transition directions', () => {
    expect(TransitionDirection.In).toBe('in' as TransitionDirection)
    expect(TransitionDirection.Out).toBe('out' as TransitionDirection)
    expect(TransitionDirection.Both).toBe('both' as TransitionDirection)
  })

  it('should have all required transition eases', () => {
    expect(TransitionEase.Linear).toBe('linear' as TransitionEase)
    expect(TransitionEase.Ease).toBe('ease' as TransitionEase)
    expect(TransitionEase.EaseIn).toBe('ease-in' as TransitionEase)
    expect(TransitionEase.EaseOut).toBe('ease-out' as TransitionEase)
    expect(TransitionEase.EaseInOut).toBe('ease-in-out' as TransitionEase)
    expect(TransitionEase.Spring).toBe('spring' as TransitionEase)
  })
})

describe('default transition options', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_TRANSITION_OPTIONS.duration).toBe(300)
    expect(DEFAULT_TRANSITION_OPTIONS.delay).toBe(0)
    expect(DEFAULT_TRANSITION_OPTIONS.ease).toBe('ease')
    expect(DEFAULT_TRANSITION_OPTIONS.direction).toBe('both')
  })
})
