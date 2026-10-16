import { describe, expect, test } from 'bun:test'
import {
  STX_DIRECTIVES,
  STX_DIRECTIVE_PAIRS,
  STX_OPENING_DIRECTIVE_BY_CLOSE,
} from '../src/language-features'

describe('shared stx language catalog', () => {
  test('keeps directive names unique', () => {
    const names = STX_DIRECTIVES.map(directive => directive.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('describes every block closing directive', () => {
    const names = new Set(STX_DIRECTIVES.map(directive => directive.name))
    for (const closing of Object.values(STX_DIRECTIVE_PAIRS))
      expect(names.has(closing)).toBe(true)
  })

  test('provides a lossless reverse block lookup', () => {
    for (const [opening, closing] of Object.entries(STX_DIRECTIVE_PAIRS))
      expect(STX_OPENING_DIRECTIVE_BY_CLOSE.get(closing)).toBe(opening)
  })
})
