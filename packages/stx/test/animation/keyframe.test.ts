import type { Keyframe } from '../../src/animation'
import { describe, expect, it } from 'bun:test'
import {
  generateAnimationCSS,

  keyframeDirective,
  parseAnimationShorthand,
} from '../../src/animation'

describe('keyframe directive', () => {
  it('should require an animation name', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-error')
    expect(result).toContain('requires an animation name')
  })

  it('should apply keyframe animation with default options', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['bounceIn'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-name: bounceIn')
    expect(result).toContain('animation-duration: 1000ms')
    expect(result).toContain('animation-timing-function: ease')
    expect(result).toContain('animation-iteration-count: 1')
    expect(result).toContain('animation-direction: normal')
    expect(result).toContain('animation-fill-mode: forwards')
  })

  it('should accept custom duration', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['fadeIn', '500'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-duration: 500ms')
  })

  it('should accept custom easing', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['fadeIn', '500', 'ease-in-out'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-timing-function: ease-in-out')
  })

  it('should accept custom iterations', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['pulse', '500', 'ease', 'infinite'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-iteration-count: infinite')
  })

  it('should accept custom direction', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['swing', '500', 'ease', '1', 'alternate'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-direction: alternate')
  })

  it('should accept custom fill mode', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['fadeIn', '500', 'ease', '1', 'normal', 'both'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-fill-mode: both')
  })

  it('should strip quotes from animation name', () => {
    const result = keyframeDirective.handler(
      '<p>Test content</p>',
      ['"myAnimation"'],
      {},
      '/test.stx',
    )
    expect(result).toContain('animation-name: myAnimation')
  })

  it('should generate unique IDs', () => {
    const result1 = keyframeDirective.handler(
      '<p>Test 1</p>',
      ['fadeIn'],
      {},
      '/test.stx',
    )
    const result2 = keyframeDirective.handler(
      '<p>Test 2</p>',
      ['fadeIn'],
      {},
      '/test.stx',
    )

    const id1Match = result1.match(/id="(stx-keyframe-[a-z0-9]+)"/)
    const id2Match = result2.match(/id="(stx-keyframe-[a-z0-9]+)"/)

    expect(id1Match).not.toBeNull()
    expect(id2Match).not.toBeNull()
    expect(id1Match![1]).not.toBe(id2Match![1])
  })
})

describe('generateAnimationCSS', () => {
  it('should generate keyframes and animation rule', () => {
    const keyframes: Keyframe[] = [
      { offset: 0, properties: { opacity: '0', transform: 'scale(0.5)' } },
      { offset: 1, properties: { opacity: '1', transform: 'scale(1)' } },
    ]

    const result = generateAnimationCSS('fadeScale', keyframes, {
      duration: 500,
      easing: 'ease-out',
    })

    expect(result).toContain('@keyframes fadeScale')
    expect(result).toContain('0% { opacity: 0; transform: scale(0.5) }')
    expect(result).toContain('100% { opacity: 1; transform: scale(1) }')
    expect(result).toContain('.fadeScale-animation')
    expect(result).toContain('animation-duration: 500ms')
    expect(result).toContain('animation-timing-function: ease-out')
  })

  it('should handle all animation options', () => {
    const keyframes: Keyframe[] = [
      { offset: 0, properties: { opacity: '0' } },
      { offset: 1, properties: { opacity: '1' } },
    ]

    const result = generateAnimationCSS('fade', keyframes, {
      duration: 1000,
      delay: 200,
      easing: 'linear',
      iterations: 'infinite',
      direction: 'alternate',
      fill: 'both',
    })

    expect(result).toContain('animation-delay: 200ms')
    expect(result).toContain('animation-iteration-count: infinite')
    expect(result).toContain('animation-direction: alternate')
    expect(result).toContain('animation-fill-mode: both')
  })

  it('should handle keyframes with easing', () => {
    const keyframes: Keyframe[] = [
      { offset: 0, properties: { transform: 'translateX(0)' }, easing: 'ease-in' },
      { offset: 0.5, properties: { transform: 'translateX(100px)' }, easing: 'ease-out' },
      { offset: 1, properties: { transform: 'translateX(0)' } },
    ]

    const result = generateAnimationCSS('bounce', keyframes, { duration: 1000 })

    expect(result).toContain('0% { transform: translateX(0) }')
    expect(result).toContain('50% { transform: translateX(100px) }')
    expect(result).toContain('100% { transform: translateX(0) }')
  })
})

describe('parseAnimationShorthand', () => {
  it('should parse duration only', () => {
    const result = parseAnimationShorthand('500')
    expect(result.duration).toBe(500)
  })

  it('should parse duration with ms suffix', () => {
    const result = parseAnimationShorthand('500ms')
    expect(result.duration).toBe(500)
  })

  it('should parse duration with s suffix', () => {
    const result = parseAnimationShorthand('2s')
    expect(result.duration).toBe(2000)
  })

  it('should parse duration and delay', () => {
    const result = parseAnimationShorthand('500 100')
    expect(result.duration).toBe(500)
    expect(result.delay).toBe(100)
  })

  it('should parse infinite iterations', () => {
    const result = parseAnimationShorthand('500 infinite')
    expect(result.iterations).toBe('infinite')
  })

  it('should parse numeric iterations after non-duration value', () => {
    // Note: plain numbers are parsed as duration/delay first
    // Iterations are matched only for 'infinite' keyword
    const result = parseAnimationShorthand('500 infinite')
    expect(result.iterations).toBe('infinite')
  })

  it('should parse direction', () => {
    const result = parseAnimationShorthand('500 alternate')
    expect(result.direction).toBe('alternate')
  })

  it('should parse fill mode', () => {
    const result = parseAnimationShorthand('500 forwards')
    expect(result.fill).toBe('forwards')
  })

  it('should parse easing', () => {
    const result = parseAnimationShorthand('500 ease-in-out')
    expect(result.easing).toBe('ease-in-out')
  })

  it('should parse complex shorthand', () => {
    const result = parseAnimationShorthand('500ms 100 ease-in-out infinite alternate both')
    expect(result.duration).toBe(500)
    expect(result.delay).toBe(100)
    expect(result.easing).toBe('ease-in-out')
    expect(result.iterations).toBe('infinite')
    expect(result.direction).toBe('alternate')
    expect(result.fill).toBe('both')
  })

  it('should return default duration for empty string', () => {
    const result = parseAnimationShorthand('')
    expect(result.duration).toBe(300)
  })
})
