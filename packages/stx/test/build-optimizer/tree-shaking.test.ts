import { describe, expect, it } from 'bun:test'
import {
  analyzeDirectiveUsage,
  generateTreeShakenBundle,
  getUnusedDirectives,
} from '../../src/build-optimizer'

describe('analyzeDirectiveUsage', () => {
  it('should detect used directives', () => {
    const usage = analyzeDirectiveUsage('@if(x)\n  content\n@endif')
    const names = usage.map(u => u.name)
    expect(names).toContain('if')
    expect(names).toContain('endif')
  })

  it('should count directive occurrences', () => {
    const usage = analyzeDirectiveUsage('@if(a)\n@endif\n@if(b)\n@endif')
    const ifUsage = usage.find(u => u.name === 'if')
    expect(ifUsage?.count).toBe(2)
  })

  it('should detect loop directives', () => {
    const usage = analyzeDirectiveUsage('@foreach(items as item)\n@endforeach')
    const names = usage.map(u => u.name)
    expect(names).toContain('foreach')
    expect(names).toContain('endforeach')
  })

  it('should detect auth directives', () => {
    const usage = analyzeDirectiveUsage('@auth\n  Welcome\n@endauth')
    const names = usage.map(u => u.name)
    expect(names).toContain('auth')
    expect(names).toContain('endauth')
  })

  it('should track line numbers', () => {
    const usage = analyzeDirectiveUsage('Line 1\n@if(x)\nLine 3\n@endif')
    const ifUsage = usage.find(u => u.name === 'if')
    expect(ifUsage?.locations[0].line).toBeGreaterThan(1)
  })

  it('should handle templates without directives', () => {
    const usage = analyzeDirectiveUsage('<div>Hello World</div>')
    expect(usage).toHaveLength(0)
  })

  it('should ignore non-stx @ symbols', () => {
    const usage = analyzeDirectiveUsage('email@example.com')
    // 'email' is not a known directive
    expect(usage).toHaveLength(0)
  })
})

describe('getUnusedDirectives', () => {
  it('should return unused directives', () => {
    const unused = getUnusedDirectives('@if(x)\n@endif')
    // Should not include 'if' and 'endif'
    expect(unused).not.toContain('if')
    expect(unused).not.toContain('endif')
    // Should include many unused ones
    expect(unused).toContain('foreach')
    expect(unused).toContain('auth')
    expect(unused).toContain('csrf')
  })

  it('should preserve specified directives', () => {
    const unused = getUnusedDirectives('@if(x)\n@endif', ['csrf', 'method'])
    expect(unused).not.toContain('csrf')
    expect(unused).not.toContain('method')
  })

  it('should include end directives for used directives', () => {
    const unused = getUnusedDirectives('@foreach(items as item)\n@endforeach')
    expect(unused).not.toContain('foreach')
    expect(unused).not.toContain('endforeach')
  })
})

describe('generateTreeShakenBundle', () => {
  it('should generate import statements for used modules', () => {
    const bundle = generateTreeShakenBundle(['if', 'endif', 'foreach', 'endforeach'])
    expect(bundle).toContain('conditionals')
    expect(bundle).toContain('loops')
  })

  it('should create activeDirectives map', () => {
    const bundle = generateTreeShakenBundle(['if', 'foreach'])
    expect(bundle).toContain('activeDirectives')
    expect(bundle).toContain('\'if\': true')
    expect(bundle).toContain('\'foreach\': true')
  })

  it('should generate isDirectiveActive function', () => {
    const bundle = generateTreeShakenBundle(['if'])
    expect(bundle).toContain('isDirectiveActive')
  })

  it('should include header comment', () => {
    const bundle = generateTreeShakenBundle(['if', 'foreach'])
    expect(bundle).toContain('Tree-shaken directive bundle')
    expect(bundle).toContain('Only includes:')
  })
})
