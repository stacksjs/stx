import { describe, expect, it } from 'bun:test'
import {
  extractParenthesizedExpression,
  findDirectiveBlocks,
  findIfBlocks,
  findMatchingEndTag,
  parseConditionalBlock,
  parseSwitchBlock,
} from '../../src/parser'

describe('extractParenthesizedExpression', () => {
  it('should extract simple expression', () => {
    const result = extractParenthesizedExpression('(a + b)', 0)
    expect(result).not.toBeNull()
    expect(result!.expression).toBe('a + b')
    expect(result!.endPos).toBe(7)
  })

  it('should handle nested parentheses', () => {
    const result = extractParenthesizedExpression('(fn(a, fn(b, c)))', 0)
    expect(result).not.toBeNull()
    expect(result!.expression).toBe('fn(a, fn(b, c))')
  })

  it('should skip leading whitespace', () => {
    const result = extractParenthesizedExpression('  (x)', 0)
    expect(result).not.toBeNull()
    expect(result!.expression).toBe('x')
  })

  it('should return null for non-parenthesized', () => {
    const result = extractParenthesizedExpression('abc', 0)
    expect(result).toBeNull()
  })

  it('should handle strings with parentheses', () => {
    const result = extractParenthesizedExpression('("hello (world)")', 0)
    expect(result).not.toBeNull()
    expect(result!.expression).toBe('"hello (world)"')
  })
})

describe('findMatchingEndTag', () => {
  it('should find simple end tag', () => {
    const source = 'content @endif'
    const result = findMatchingEndTag(source, 'if', 'endif', 0)
    expect(result).toBe(8)
  })

  it('should handle nested directives', () => {
    const source = '@if(a) inner @endif outer @endif'
    const result = findMatchingEndTag(source, 'if', 'endif', 0)
    expect(result).toBe(26) // The outer @endif
  })

  it('should return -1 for unclosed directive', () => {
    const source = 'content without endif'
    const result = findMatchingEndTag(source, 'if', 'endif', 0)
    expect(result).toBe(-1)
  })
})

describe('parseConditionalBlock', () => {
  it('should parse simple @if', () => {
    const source = '@if(true) content @endif'
    const result = parseConditionalBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.branches).toHaveLength(1)
    expect(result!.branches[0].type).toBe('if')
    expect(result!.branches[0].condition).toBe('true')
    expect(result!.branches[0].content.trim()).toBe('content')
  })

  it('should parse @if with @else', () => {
    const source = '@if(true) yes @else no @endif'
    const result = parseConditionalBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.branches).toHaveLength(2)
    expect(result!.branches[0].type).toBe('if')
    expect(result!.branches[1].type).toBe('else')
  })

  it('should parse @if with @elseif', () => {
    const source = '@if(a) A @elseif(b) B @else C @endif'
    const result = parseConditionalBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.branches).toHaveLength(3)
    expect(result!.branches[0].type).toBe('if')
    expect(result!.branches[0].condition).toBe('a')
    expect(result!.branches[1].type).toBe('elseif')
    expect(result!.branches[1].condition).toBe('b')
    expect(result!.branches[2].type).toBe('else')
  })

  it('should handle nested parentheses in condition', () => {
    const source = '@if(fn(a, fn(b))) content @endif'
    const result = parseConditionalBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.branches[0].condition).toBe('fn(a, fn(b))')
  })

  it('should handle strings with braces in condition', () => {
    const source = '@if(str === "{test}") content @endif'
    const result = parseConditionalBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.branches[0].condition).toBe('str === "{test}"')
  })
})

describe('findIfBlocks', () => {
  it('should find single @if block', () => {
    const source = '<p>@if(x) yes @endif</p>'
    const results = findIfBlocks(source)

    expect(results).toHaveLength(1)
    expect(results[0].branches[0].condition).toBe('x')
  })

  it('should find multiple @if blocks', () => {
    const source = '@if(a) A @endif @if(b) B @endif'
    const results = findIfBlocks(source)

    expect(results).toHaveLength(2)
  })

  it('should not return nested @if as separate block', () => {
    const source = '@if(outer) @if(inner) content @endif @endif'
    const results = findIfBlocks(source)

    // Only the outer block should be returned
    expect(results).toHaveLength(1)
    expect(results[0].branches[0].condition).toBe('outer')
  })
})

describe('parseSwitchBlock', () => {
  it('should parse simple switch', () => {
    const source = '@switch(x) @case(1) one @break @case(2) two @break @default default @endswitch'
    const result = parseSwitchBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.expression).toBe('x')
    expect(result!.cases).toHaveLength(3)
    expect(result!.cases[0].type).toBe('case')
    expect(result!.cases[0].value).toBe('1')
    expect(result!.cases[2].type).toBe('default')
  })

  it('should handle nested parentheses in expression', () => {
    const source = '@switch(fn(a, b)) @case(1) one @endswitch'
    const result = parseSwitchBlock(source, 0)

    expect(result).not.toBeNull()
    expect(result!.expression).toBe('fn(a, b)')
  })
})

describe('findDirectiveBlocks', () => {
  it('should find foreach blocks', () => {
    const source = '@foreach($items as $item) {{ $item }} @endforeach'
    const results = findDirectiveBlocks(source, 'foreach', 'endforeach')

    expect(results).toHaveLength(1)
    expect(results[0].params).toBe('$items as $item')
    expect(results[0].content).toContain('{{ $item }}')
  })

  it('should handle nested foreach', () => {
    const source = '@foreach($outer as $o) @foreach($inner as $i) {{ $i }} @endforeach @endforeach'
    const results = findDirectiveBlocks(source, 'foreach', 'endforeach')

    // Should return outer, with inner as part of content
    expect(results).toHaveLength(1)
    expect(results[0].params).toBe('$outer as $o')
    expect(results[0].content).toContain('@foreach($inner as $i)')
  })

  it('should find multiple separate blocks', () => {
    const source = '@foreach($a as $x) X @endforeach @foreach($b as $y) Y @endforeach'
    const results = findDirectiveBlocks(source, 'foreach', 'endforeach')

    expect(results).toHaveLength(2)
  })
})
