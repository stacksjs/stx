import { describe, expect, it } from 'bun:test'
import {
  animationGroupDirective,
  motionDirective,
  processAnimationDirectives,
  registerAnimationDirectives,
} from '../../src/animation'
import type { StxOptions } from '../../src/types'

describe('animationGroup directive', () => {
  it('should require group name and element selectors', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-error')
    expect(result).toContain('requires a group name and at least one element selector')
  })

  it('should require at least one element selector', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      ['groupName'],
      {},
      '/test.stx',
    )
    expect(result).toContain('stx-error')
  })

  it('should generate animation group script', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      ['myGroup', '#element1', '.element2'],
      {},
      '/test.stx',
    )
    expect(result).toContain('<div>Content</div>')
    expect(result).toContain('<script>')
    expect(result).toContain('Animation Group: myGroup')
    expect(result).toContain('#element1')
    expect(result).toContain('.element2')
  })

  it('should add # prefix to selectors without prefix', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      ['myGroup', 'element1'],
      {},
      '/test.stx',
    )
    expect(result).toContain('#element1')
  })

  it('should include stagger delay handling', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      ['myGroup', '#element1'],
      { staggerDelay: 100 },
      '/test.stx',
    )
    expect(result).toContain('staggerDelay')
    expect(result).toContain("setProperty('--stx-transition-delay'")
    expect(result).toContain('animationDelay')
  })

  it('should include sequence handling', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      ['myGroup', '#element1'],
      { sequence: true },
      '/test.stx',
    )
    expect(result).toContain('sequence')
    expect(result).toContain('index * staggerDelay')
  })

  it('should run on DOMContentLoaded or immediately', () => {
    const result = animationGroupDirective.handler(
      '<div>Content</div>',
      ['myGroup', '#element1'],
      {},
      '/test.stx',
    )
    expect(result).toContain("document.readyState === 'loading'")
    expect(result).toContain("addEventListener('DOMContentLoaded'")
  })
})

describe('motion directive', () => {
  it('should generate motion preferences wrapper', () => {
    const result = motionDirective.handler(
      '<div>Content</div>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('data-animate="auto"')
    expect(result).toContain('<div>Content</div>')
  })

  it('should generate motion preferences script', () => {
    const result = motionDirective.handler(
      '<div>Content</div>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('<script>')
    expect(result).toContain('prefers-reduced-motion')
    expect(result).toContain("data-reduced-motion")
  })

  it('should respect user preferences by default', () => {
    const result = motionDirective.handler(
      '<div>Content</div>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain('data-animate="auto"')
  })

  it('should allow forcing animations', () => {
    const result = motionDirective.handler(
      '<div>Content</div>',
      ['false'],
      {},
      '/test.stx',
    )
    expect(result).toContain('data-animate="true"')
  })

  it('should listen for preference changes', () => {
    const result = motionDirective.handler(
      '<div>Content</div>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain("addEventListener('change'")
    expect(result).toContain('e.matches')
  })

  it('should set transition duration to 0ms for reduced motion', () => {
    const result = motionDirective.handler(
      '<div>Content</div>',
      [],
      {},
      '/test.stx',
    )
    expect(result).toContain("'--stx-transition-duration', '0ms'")
  })
})

describe('processAnimationDirectives', () => {
  const defaultOptions: StxOptions = {
    componentsDir: 'components',
    layoutsDir: 'layouts',
    partialsDir: 'partials',
    cache: false,
  }

  it('should skip processing if animations are disabled', () => {
    const template = '<html><head></head><body>@transition(fade)<p>Test</p>@endtransition</body></html>'
    const options = { ...defaultOptions, animation: { enabled: false } }

    const result = processAnimationDirectives(template, {}, '/test.stx', options)
    expect(result).toBe(template)
  })

  it('should skip processing if no animation directives are present', () => {
    const template = '<html><head></head><body><p>Test</p></body></html>'

    const result = processAnimationDirectives(template, {}, '/other.stx', defaultOptions)
    expect(result).toBe(template)
  })

  it('should add base animation styles', () => {
    const template = '<html><head></head><body>@transition(fade)<p>Test</p>@endtransition</body></html>'

    const result = processAnimationDirectives(template, {}, '/test.stx', defaultOptions)
    expect(result).toContain('<style id="stx-animation-base">')
    expect(result).toContain('--stx-transition-duration')
    expect(result).toContain('.stx-transition')
    expect(result).toContain('.stx-fade')
  })

  it('should add intersection observer script for scroll animations', () => {
    const template = '<html><head></head><body><div class="stx-observe">Test</div></body></html>'

    const result = processAnimationDirectives(template, {}, '/animation/test.stx', defaultOptions)
    expect(result).toContain('IntersectionObserver')
  })

  it('should not duplicate base styles', () => {
    const template = '<html><head><style id="stx-animation-base"></style></head><body>@transition(fade)<p>Test</p>@endtransition</body></html>'

    const result = processAnimationDirectives(template, {}, '/test.stx', defaultOptions)
    const matches = result.match(/<style id="stx-animation-base">/g)
    expect(matches?.length).toBe(1)
  })
})

describe('registerAnimationDirectives', () => {
  it('should add animation directives to options', () => {
    const options: StxOptions = {
      componentsDir: 'components',
      layoutsDir: 'layouts',
      partialsDir: 'partials',
    }

    const result = registerAnimationDirectives(options)

    expect(result.customDirectives).toBeDefined()
    expect(result.customDirectives?.length).toBeGreaterThan(0)
  })

  it('should preserve existing custom directives', () => {
    const existingDirective = {
      name: 'custom',
      handler: () => 'custom',
      hasEndTag: false,
    }

    const options: StxOptions = {
      componentsDir: 'components',
      layoutsDir: 'layouts',
      partialsDir: 'partials',
      customDirectives: [existingDirective],
    }

    const result = registerAnimationDirectives(options)

    expect(result.customDirectives?.some(d => d.name === 'custom')).toBe(true)
  })

  it('should include all animation directives', () => {
    const options: StxOptions = {
      componentsDir: 'components',
      layoutsDir: 'layouts',
      partialsDir: 'partials',
    }

    const result = registerAnimationDirectives(options)

    const directiveNames = result.customDirectives?.map(d => d.name) || []
    expect(directiveNames).toContain('transition')
    expect(directiveNames).toContain('animationGroup')
    expect(directiveNames).toContain('motion')
    expect(directiveNames).toContain('scrollAnimate')
    expect(directiveNames).toContain('keyframe')
    expect(directiveNames).toContain('stagger')
    expect(directiveNames).toContain('spring')
  })
})
