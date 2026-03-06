import { describe, expect, test } from 'bun:test'
import { highlight, normalize, tokenize } from '../src/tokenizer'

describe('normalize', () => {
  test('lowercases text', () => {
    expect(normalize('Hello World')).toBe('hello world')
  })

  test('trims whitespace', () => {
    expect(normalize('  hello  ')).toBe('hello')
  })

  test('handles accented characters', () => {
    expect(normalize('café')).toBe('cafe')
    expect(normalize('naïve')).toBe('naive')
    expect(normalize('über')).toBe('uber')
    expect(normalize('résumé')).toBe('resume')
    expect(normalize('señor')).toBe('senor')
  })

  test('handles empty string', () => {
    expect(normalize('')).toBe('')
  })

  test('handles combined accents and case', () => {
    expect(normalize('CAFÉ RÉSUMÉ')).toBe('cafe resume')
  })
})

describe('tokenize', () => {
  test('splits text on whitespace', () => {
    const tokens = tokenize('hello world test', { stopWords: [] })
    expect(tokens).toEqual(['hello', 'world', 'test'])
  })

  test('splits on punctuation', () => {
    const tokens = tokenize('hello, world! test.', { stopWords: [] })
    expect(tokens).toEqual(['hello', 'world', 'test'])
  })

  test('filters short words by default (minLength=2)', () => {
    const tokens = tokenize('a big cat', { stopWords: [] })
    expect(tokens).toEqual(['big', 'cat'])
  })

  test('respects custom minLength', () => {
    const tokens = tokenize('a big cat dog', { minLength: 4, stopWords: [] })
    expect(tokens).toEqual([])
  })

  test('removes default stop words', () => {
    const tokens = tokenize('the quick brown fox is very fast')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('is')
    expect(tokens).not.toContain('very')
    expect(tokens).toContain('quick')
    expect(tokens).toContain('brown')
    expect(tokens).toContain('fox')
    expect(tokens).toContain('fast')
  })

  test('removes custom stop words', () => {
    const tokens = tokenize('hello world test', { stopWords: ['hello'] })
    expect(tokens).toEqual(['world', 'test'])
  })

  test('normalizes during tokenization', () => {
    const tokens = tokenize('Hello WORLD Café', { stopWords: [] })
    expect(tokens).toEqual(['hello', 'world', 'cafe'])
  })

  test('handles empty string', () => {
    expect(tokenize('')).toEqual([])
  })

  test('handles special characters', () => {
    const tokens = tokenize('hello@world.com test#value', { stopWords: [] })
    expect(tokens).toContain('hello')
    expect(tokens).toContain('world')
    expect(tokens).toContain('com')
    expect(tokens).toContain('test')
    expect(tokens).toContain('value')
  })
})

describe('highlight', () => {
  test('wraps matches in mark tags', () => {
    expect(highlight('hello world', 'hello')).toBe('<mark>hello</mark> world')
  })

  test('case-insensitive matching', () => {
    expect(highlight('Hello World', 'hello')).toBe('<mark>Hello</mark> World')
  })

  test('highlights multiple occurrences', () => {
    expect(highlight('hello hello world', 'hello')).toBe('<mark>hello</mark> <mark>hello</mark> world')
  })

  test('supports custom tag', () => {
    expect(highlight('hello world', 'hello', 'strong')).toBe('<strong>hello</strong> world')
  })

  test('highlights multiple query terms', () => {
    const result = highlight('the quick brown fox', 'quick fox')
    expect(result).toContain('<mark>quick</mark>')
    expect(result).toContain('<mark>fox</mark>')
  })

  test('returns original text when no matches', () => {
    expect(highlight('hello world', 'xyz')).toBe('hello world')
  })

  test('handles empty query', () => {
    expect(highlight('hello world', '')).toBe('hello world')
  })
})
