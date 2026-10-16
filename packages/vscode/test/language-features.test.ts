import { describe, expect, test } from 'bun:test'
import {
  getStxAttributeCompletionContext,
  STX_ATTRIBUTE_DIRECTIVES,
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

  test('keeps reactive attribute names unique', () => {
    const names = STX_ATTRIBUTE_DIRECTIVES.map(directive => directive.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(expect.arrayContaining([
      ':if',
      ':for',
      'v-if',
      'v-memo',
      'x-if',
      'x-for',
      'x-text',
      '@click',
      'stx-hydrate',
    ]))
  })

  test('detects attribute completion in single and multiline opening tags', () => {
    expect(getStxAttributeCompletionContext('<button @cl')).toEqual({ prefix: '@cl' })
    expect(getStxAttributeCompletionContext('<div\n  class="card"\n  :fo')).toEqual({ prefix: ':fo' })
    expect(getStxAttributeCompletionContext('<section x-')).toEqual({ prefix: 'x-' })
  })

  test('does not confuse statements, values, or closed tags with attributes', () => {
    expect(getStxAttributeCompletionContext('@if(user)')).toBeUndefined()
    expect(getStxAttributeCompletionContext('<div title="@click')).toBeUndefined()
    expect(getStxAttributeCompletionContext('<div> @cl')).toBeUndefined()
    expect(getStxAttributeCompletionContext('</div @cl')).toBeUndefined()
    expect(getStxAttributeCompletionContext('if (left < right) @cl')).toBeUndefined()
  })
})
