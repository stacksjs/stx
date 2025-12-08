/* eslint-disable no-template-curly-in-string */
import { describe, expect, it } from 'bun:test'
import {
  extractBalancedExpression,
  findExpressions,
  findMatchingDelimiter,
  parseArguments,
  parseExpressionWithFilters,
  parseScriptDeclarations,
  splitByPipe,
  Tokenizer,
} from '../../src/parser'

describe('Tokenizer', () => {
  describe('basic tokenization', () => {
    it('should tokenize simple identifiers', () => {
      const tokenizer = new Tokenizer('foo bar')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'IDENTIFIER').map(t => t.value)).toEqual(['foo', 'bar'])
    })

    it('should tokenize numbers', () => {
      const tokenizer = new Tokenizer('123 45.67 0xFF 1e10')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'NUMBER').map(t => t.value)).toEqual(['123', '45.67', '0xFF', '1e10'])
    })

    it('should tokenize strings', () => {
      const tokenizer = new Tokenizer('"hello" \'world\'')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'STRING').map(t => t.value)).toEqual(['"hello"', '\'world\''])
    })

    it('should tokenize operators', () => {
      const tokenizer = new Tokenizer('a + b === c && d')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'OPERATOR').map(t => t.value)).toEqual(['+', '===', '&&'])
    })

    it('should tokenize template strings with expressions', () => {
      const tokenizer = new Tokenizer('`hello ${name}!`')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'TEMPLATE_STRING').map(t => t.value)).toEqual(['`hello ${name}!`'])
    })

    it('should tokenize nested template expressions', () => {
      const tokenizer = new Tokenizer('`${a + `${b}`}`')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'TEMPLATE_STRING').map(t => t.value)).toEqual(['`${a + `${b}`}`'])
    })
  })

  describe('expression markers', () => {
    it('should tokenize {{ }}', () => {
      const tokenizer = new Tokenizer('{{ foo }}')
      const tokens = tokenizer.tokenize()

      expect(tokens.some(t => t.type === 'EXPRESSION_START')).toBe(true)
      expect(tokens.some(t => t.type === 'EXPRESSION_END')).toBe(true)
    })

    it('should tokenize {!! !!}', () => {
      const tokenizer = new Tokenizer('{!! raw !!}')
      const tokens = tokenizer.tokenize()

      expect(tokens.some(t => t.type === 'RAW_START')).toBe(true)
      expect(tokens.some(t => t.type === 'RAW_END')).toBe(true)
    })

    it('should tokenize directives', () => {
      const tokenizer = new Tokenizer('@if @foreach @endif')
      const tokens = tokenizer.tokenize()

      expect(tokens.filter(t => t.type === 'DIRECTIVE').map(t => t.value)).toEqual(['@if', '@foreach', '@endif'])
    })
  })

  describe('string with special characters', () => {
    it('should handle escaped quotes', () => {
      const tokenizer = new Tokenizer('"hello \\"world\\""')
      const tokens = tokenizer.tokenize()

      const strings = tokens.filter(t => t.type === 'STRING')
      expect(strings).toHaveLength(1)
      expect(strings[0].value).toBe('"hello \\"world\\""')
    })

    it('should handle braces inside strings', () => {
      const tokenizer = new Tokenizer('"{a: {b: 1}}"')
      const tokens = tokenizer.tokenize()

      const strings = tokens.filter(t => t.type === 'STRING')
      expect(strings).toHaveLength(1)
      expect(strings[0].value).toBe('"{a: {b: 1}}"')
    })
  })
})

describe('findMatchingDelimiter', () => {
  it('should find matching closing brace', () => {
    const source = '{foo: {bar: 1}}'
    const result = findMatchingDelimiter(source, '{', '}', 0)
    expect(result).toBe(source.length - 1)
  })

  it('should handle strings with braces inside', () => {
    const source = '{"key": "value with { brace"}'
    const result = findMatchingDelimiter(source, '{', '}', 0)
    expect(result).toBe(source.length - 1)
  })

  it('should handle template literals', () => {
    const source = '{key: `value ${nested}`}'
    const result = findMatchingDelimiter(source, '{', '}', 0)
    expect(result).toBe(source.length - 1)
  })

  it('should return -1 for unclosed delimiter', () => {
    const source = '{foo: bar'
    const result = findMatchingDelimiter(source, '{', '}', 0)
    expect(result).toBe(-1)
  })
})

describe('extractBalancedExpression', () => {
  it('should extract simple expression', () => {
    const source = 'foo + bar}}'
    const result = extractBalancedExpression(source, 0)
    expect(result.expression).toBe('foo + bar')
  })

  it('should handle nested objects', () => {
    const source = '{a: {b: 1}}}}'
    const result = extractBalancedExpression(source, 0)
    expect(result.expression).toBe('{a: {b: 1}}')
  })

  it('should handle function calls', () => {
    const source = 'func(a, b)}}'
    const result = extractBalancedExpression(source, 0)
    expect(result.expression).toBe('func(a, b)')
  })

  it('should handle array access', () => {
    const source = 'arr[0][1]}}'
    const result = extractBalancedExpression(source, 0)
    expect(result.expression).toBe('arr[0][1]')
  })
})

describe('splitByPipe', () => {
  it('should split simple expression', () => {
    const result = splitByPipe('value | filter')
    expect(result).toEqual(['value', 'filter'])
  })

  it('should not split on logical OR', () => {
    const result = splitByPipe('a || b')
    expect(result).toEqual(['a || b'])
  })

  it('should handle multiple filters', () => {
    const result = splitByPipe('value | filter1 | filter2')
    expect(result).toEqual(['value', 'filter1', 'filter2'])
  })

  it('should handle pipes inside strings', () => {
    const result = splitByPipe('"a|b" | filter')
    expect(result).toEqual(['"a|b"', 'filter'])
  })

  it('should handle pipes inside template literals', () => {
    const result = splitByPipe('`${a|b}` | filter')
    expect(result).toEqual(['`${a|b}`', 'filter'])
  })

  it('should handle pipes inside function arguments', () => {
    const result = splitByPipe('func(a | b) | filter')
    expect(result).toEqual(['func(a | b)', 'filter'])
  })
})

describe('parseExpressionWithFilters', () => {
  it('should parse expression without filters', () => {
    const result = parseExpressionWithFilters('foo.bar')
    expect(result.baseExpression).toBe('foo.bar')
    expect(result.filters).toHaveLength(0)
  })

  it('should parse expression with simple filter', () => {
    const result = parseExpressionWithFilters('value | uppercase')
    expect(result.baseExpression).toBe('value')
    expect(result.filters).toHaveLength(1)
    expect(result.filters[0].name).toBe('uppercase')
    expect(result.filters[0].args).toHaveLength(0)
  })

  it('should parse filter with arguments', () => {
    const result = parseExpressionWithFilters('value | truncate(10, "...")')
    expect(result.baseExpression).toBe('value')
    expect(result.filters).toHaveLength(1)
    expect(result.filters[0].name).toBe('truncate')
    expect(result.filters[0].args).toEqual(['10', '"..."'])
  })

  it('should parse multiple filters', () => {
    const result = parseExpressionWithFilters('value | lower | truncate(10)')
    expect(result.baseExpression).toBe('value')
    expect(result.filters).toHaveLength(2)
    expect(result.filters[0].name).toBe('lower')
    expect(result.filters[1].name).toBe('truncate')
  })
})

describe('parseArguments', () => {
  it('should parse simple arguments', () => {
    const result = parseArguments('a, b, c')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should handle nested function calls', () => {
    const result = parseArguments('a, func(b, c), d')
    expect(result).toEqual(['a', 'func(b, c)', 'd'])
  })

  it('should handle objects in arguments', () => {
    const result = parseArguments('a, {b: 1, c: 2}, d')
    expect(result).toEqual(['a', '{b: 1, c: 2}', 'd'])
  })

  it('should handle arrays in arguments', () => {
    const result = parseArguments('a, [1, 2, 3], d')
    expect(result).toEqual(['a', '[1, 2, 3]', 'd'])
  })

  it('should handle strings with commas', () => {
    const result = parseArguments('a, "hello, world", b')
    expect(result).toEqual(['a', '"hello, world"', 'b'])
  })
})

describe('findExpressions', () => {
  it('should find simple expression', () => {
    const result = findExpressions('<p>{{ name }}</p>')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('name')
    expect(result[0].isRaw).toBe(false)
  })

  it('should find raw expression', () => {
    const result = findExpressions('<p>{!! html !!}</p>')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('html')
    expect(result[0].isRaw).toBe(true)
  })

  it('should find multiple expressions', () => {
    const result = findExpressions('{{ a }} and {{ b }}')
    expect(result).toHaveLength(2)
    expect(result[0].expression).toBe('a')
    expect(result[1].expression).toBe('b')
  })

  it('should handle expressions with nested braces', () => {
    const result = findExpressions('{{ {a: 1}.a }}')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('{a: 1}.a')
  })

  it('should handle expressions with strings containing }}', () => {
    const result = findExpressions('{{ "}}" }}')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('"}}"')
  })

  it('should handle expressions with template literals', () => {
    const result = findExpressions('{{ `${a}` }}')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('`${a}`')
  })
})

describe('parseScriptDeclarations', () => {
  it('should parse simple variable declaration', () => {
    const result = parseScriptDeclarations('const foo = "bar"')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('variable')
    expect(result[0].name).toBe('foo')
    expect(result[0].value.trim()).toBe('"bar"')
  })

  it('should parse exported variable', () => {
    const result = parseScriptDeclarations('export const foo = "bar"')
    expect(result).toHaveLength(1)
    expect(result[0].exported).toBe(true)
  })

  it('should parse function declaration', () => {
    const result = parseScriptDeclarations('function greet(name) { return name }')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('function')
    expect(result[0].name).toBe('greet')
  })

  it('should parse multiple declarations', () => {
    const script = `
      const a = 1
      const b = 2
      function sum() { return a + b }
    `
    const result = parseScriptDeclarations(script)
    expect(result).toHaveLength(3)
  })

  it('should parse object values', () => {
    const result = parseScriptDeclarations('const obj = { a: 1, b: 2 }')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('obj')
    expect(result[0].value).toContain('{ a: 1, b: 2 }')
  })

  it('should parse array values', () => {
    const result = parseScriptDeclarations('const arr = [1, 2, 3]')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('arr')
    expect(result[0].value).toContain('[1, 2, 3]')
  })

  it('should handle multi-line objects', () => {
    const script = `const obj = {
      a: 1,
      b: {
        c: 2
      }
    }`
    const result = parseScriptDeclarations(script)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('obj')
  })

  it('should handle strings with braces', () => {
    const result = parseScriptDeclarations('const str = "{braces}"')
    expect(result).toHaveLength(1)
    expect(result[0].value.trim()).toBe('"{braces}"')
  })
})

describe('splitByPipe edge cases', () => {
  it('should handle nested array/object in filter args', () => {
    const result = splitByPipe('items | filter([1, 2, 3])')
    expect(result).toEqual(['items', 'filter([1, 2, 3])'])
  })

  it('should handle object in filter args', () => {
    const result = splitByPipe('data | format({style: "currency"})')
    expect(result).toEqual(['data', 'format({style: "currency"})'])
  })
})

describe('findExpressions edge cases', () => {
  it('should handle expression with object literal', () => {
    const result = findExpressions('{{ {key: "value"}.key }}')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('{key: "value"}.key')
  })

  it('should handle expression with array literal', () => {
    const result = findExpressions('{{ [1, 2, 3][0] }}')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('[1, 2, 3][0]')
  })

  it('should handle expression with ternary', () => {
    const result = findExpressions('{{ a ? "yes" : "no" }}')
    expect(result).toHaveLength(1)
    expect(result[0].expression).toBe('a ? "yes" : "no"')
  })

  it('should handle triple brace as raw', () => {
    const result = findExpressions('{{{ rawHtml }}}')
    expect(result).toHaveLength(1)
    expect(result[0].isRaw).toBe(true)
    expect(result[0].expression).toBe('rawHtml')
  })
})
