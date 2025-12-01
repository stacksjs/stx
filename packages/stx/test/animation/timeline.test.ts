import { describe, expect, it } from 'bun:test'
import {
  createAnimationTimeline,
  generateAnimationRuntime,
  type TimelineEntry,
} from '../../src/animation'

describe('createAnimationTimeline', () => {
  it('should generate timeline script', () => {
    const entries: TimelineEntry[] = [
      {
        selector: '#box1',
        keyframes: [
          { offset: 0, properties: { opacity: '0' } },
          { offset: 1, properties: { opacity: '1' } },
        ],
        options: { duration: 1000 },
      },
    ]

    const result = createAnimationTimeline(entries)
    expect(result).toContain('<script>')
    expect(result).toContain('const timeline =')
    expect(result).toContain('#box1')
    expect(result).toContain('runTimeline')
  })

  it('should include keyframe mapping', () => {
    const entries: TimelineEntry[] = [
      {
        selector: '.animated',
        keyframes: [
          { offset: 0, properties: { transform: 'scale(0)' } },
          { offset: 0.5, properties: { transform: 'scale(1.2)' } },
          { offset: 1, properties: { transform: 'scale(1)' } },
        ],
        options: { duration: 500 },
      },
    ]

    const result = createAnimationTimeline(entries)
    expect(result).toContain('keyframes.map')
    expect(result).toContain('kf.properties')
    expect(result).toContain('kf.offset')
    expect(result).toContain('kf.easing')
  })

  it('should include animation options', () => {
    const entries: TimelineEntry[] = [
      {
        selector: '#test',
        keyframes: [
          { offset: 0, properties: { opacity: '0' } },
          { offset: 1, properties: { opacity: '1' } },
        ],
        options: {
          duration: 1000,
          delay: 200,
          easing: 'ease-in-out',
          iterations: 3,
          direction: 'alternate',
          fill: 'forwards',
        },
      },
    ]

    const result = createAnimationTimeline(entries)
    expect(result).toContain('duration: entry.options.duration || 1000')
    expect(result).toContain('delay: entry.options.delay || 0')
    expect(result).toContain('easing: entry.options.easing')
    expect(result).toContain('iterations: entry.options.iterations')
    expect(result).toContain('direction: entry.options.direction')
    expect(result).toContain('fill: entry.options.fill')
  })

  it('should handle multiple entries', () => {
    const entries: TimelineEntry[] = [
      {
        selector: '#first',
        keyframes: [{ offset: 0, properties: { opacity: '0' } }],
        options: { duration: 500 },
      },
      {
        selector: '#second',
        keyframes: [{ offset: 0, properties: { opacity: '0' } }],
        options: { duration: 500 },
      },
    ]

    const result = createAnimationTimeline(entries)
    expect(result).toContain('#first')
    expect(result).toContain('#second')
    expect(result).toContain('timeline.forEach')
  })

  it('should run on DOMContentLoaded or immediately', () => {
    const entries: TimelineEntry[] = [
      {
        selector: '#test',
        keyframes: [{ offset: 0, properties: { opacity: '0' } }],
        options: { duration: 500 },
      },
    ]

    const result = createAnimationTimeline(entries)
    expect(result).toContain("document.readyState === 'loading'")
    expect(result).toContain("addEventListener('DOMContentLoaded'")
    expect(result).toContain('runTimeline()')
  })

  it('should use Web Animations API', () => {
    const entries: TimelineEntry[] = [
      {
        selector: '#test',
        keyframes: [{ offset: 0, properties: { opacity: '0' } }],
        options: { duration: 500 },
      },
    ]

    const result = createAnimationTimeline(entries)
    expect(result).toContain('element.animate(keyframes, options)')
  })
})

describe('generateAnimationRuntime', () => {
  it('should generate runtime script', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('<script>')
    expect(result).toContain('window.__stxAnimation')
  })

  it('should include animation registry', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('animations: new Map()')
    expect(result).toContain('register(name, keyframes, options)')
    expect(result).toContain('this.animations.set(name')
  })

  it('should include animate function', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('animate(element, nameOrKeyframes, options = {})')
    expect(result).toContain('element.animate(keyframes')
    expect(result).toContain('document.querySelector')
  })

  it('should support registered animations', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('this.animations.has(nameOrKeyframes)')
    expect(result).toContain('this.animations.get(nameOrKeyframes)')
  })

  it('should include stagger function', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('stagger(elements, keyframes, options = {}, staggerDelay = 100)')
    expect(result).toContain('document.querySelectorAll')
    expect(result).toContain('index * staggerDelay')
  })

  it('should include sequence function', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('async sequence(steps)')
    expect(result).toContain('await animation.finished')
  })

  it('should include parallel function', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('parallel(steps)')
    expect(result).toContain('Promise.all')
    expect(result).toContain('animation.finished')
  })

  it('should handle null elements gracefully', () => {
    const result = generateAnimationRuntime()
    expect(result).toContain('if (!element) return null')
  })
})
