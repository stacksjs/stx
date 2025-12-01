import { describe, expect, it } from 'bun:test'
import {
  findDeadBranches,
  eliminateDeadCode,
  evaluateConstant,
} from '../../src/build-optimizer'

describe('evaluateConstant', () => {
  it('should evaluate boolean literals', () => {
    expect(evaluateConstant('true', {})).toBe(true)
    expect(evaluateConstant('false', {})).toBe(false)
  })

  it('should evaluate null', () => {
    expect(evaluateConstant('null', {})).toBe(null)
  })

  it('should evaluate integer literals', () => {
    expect(evaluateConstant('42', {})).toBe(42)
    expect(evaluateConstant('0', {})).toBe(0)
  })

  it('should evaluate float literals', () => {
    expect(evaluateConstant('3.14', {})).toBe(3.14)
  })

  it('should evaluate string literals', () => {
    expect(evaluateConstant("'hello'", {})).toBe('hello')
    expect(evaluateConstant('"world"', {})).toBe('world')
  })

  it('should look up known constants', () => {
    expect(evaluateConstant('VERSION', { VERSION: '1.0.0' })).toBe('1.0.0')
    expect(evaluateConstant('DEBUG', { DEBUG: true })).toBe(true)
  })

  it('should evaluate comparisons with constants', () => {
    expect(evaluateConstant('x === 5', { x: 5 })).toBe(true)
    expect(evaluateConstant('x === 5', { x: 3 })).toBe(false)
    expect(evaluateConstant('x !== 5', { x: 3 })).toBe(true)
    expect(evaluateConstant('x > 5', { x: 10 })).toBe(true)
    expect(evaluateConstant('x < 5', { x: 3 })).toBe(true)
    expect(evaluateConstant('x >= 5', { x: 5 })).toBe(true)
    expect(evaluateConstant('x <= 5', { x: 5 })).toBe(true)
  })

  it('should return undefined for unknown expressions', () => {
    expect(evaluateConstant('unknown', {})).toBe(undefined)
    expect(evaluateConstant('a + b', {})).toBe(undefined)
  })
})

describe('findDeadBranches', () => {
  it('should find @if(false) blocks', () => {
    const dead = findDeadBranches('@if(false)\n  Dead code\n@endif')
    expect(dead.length).toBeGreaterThan(0)
    expect(dead[0].reason).toContain('always false')
  })

  it('should find @if with false constant', () => {
    const dead = findDeadBranches('@if(DEBUG)\n  Debug\n@endif', { DEBUG: false })
    expect(dead.length).toBeGreaterThan(0)
  })

  it('should not flag @if(true) blocks', () => {
    const dead = findDeadBranches('@if(true)\n  Active\n@endif')
    expect(dead).toHaveLength(0)
  })

  it('should find @unless(true) blocks', () => {
    const dead = findDeadBranches('@unless(true)\n  Dead\n@endunless')
    expect(dead.length).toBeGreaterThan(0)
    expect(dead[0].reason).toContain('always true')
  })

  it('should find @env(development) in production', () => {
    const dead = findDeadBranches("@env('development')\n  Dev only\n@endenv", { __ENV__: 'production' })
    expect(dead.length).toBeGreaterThan(0)
    expect(dead[0].reason).toContain('Development-only')
  })

  it('should not flag @env(development) in development', () => {
    const dead = findDeadBranches("@env('development')\n  Dev only\n@endenv", { __ENV__: 'development' })
    expect(dead).toHaveLength(0)
  })

  it('should find @debug blocks in production', () => {
    const dead = findDeadBranches('@debug\n  Debug info\n@enddebug', { __ENV__: 'production' })
    expect(dead.length).toBeGreaterThan(0)
    expect(dead[0].reason).toContain('Debug code')
  })
})

describe('eliminateDeadCode', () => {
  it('should remove @if(false) blocks', () => {
    const { content, removed } = eliminateDeadCode('@if(false)\n  Dead\n@endif<p>Live</p>')
    expect(content).not.toContain('Dead')
    expect(content).toContain('Live')
    expect(removed.length).toBeGreaterThan(0)
  })

  it('should remove development code in production', () => {
    const { content } = eliminateDeadCode(
      "<p>Header</p>@env('development')\n  Dev\n@endenv<p>Footer</p>",
      { __ENV__: 'production' },
    )
    expect(content).not.toContain('Dev')
    expect(content).toContain('Header')
    expect(content).toContain('Footer')
  })

  it('should preserve live code', () => {
    const { content } = eliminateDeadCode('@if(true)\n  Keep me\n@endif')
    expect(content).toContain('Keep me')
  })

  it('should handle multiple dead branches', () => {
    const template = '@if(false)\nDead1\n@endif\n<p>Live</p>\n@if(false)\nDead2\n@endif'
    const { content, removed } = eliminateDeadCode(template)
    expect(content).not.toContain('Dead1')
    expect(content).not.toContain('Dead2')
    expect(content).toContain('Live')
    expect(removed.length).toBe(2)
  })

  it('should return unchanged template when no dead code', () => {
    const original = '<p>Hello {{ name }}</p>'
    const { content, removed } = eliminateDeadCode(original)
    expect(content).toBe(original)
    expect(removed).toHaveLength(0)
  })
})
