import { describe, expect, test } from 'bun:test'
import {
  GLOBAL_OBJECT_HOVERS,
  HTML_TAGS,
  htmlTagDescription,
  JAVASCRIPT_OPERATOR_HOVERS,
} from '../src/providers/hover-documentation'

describe('hover documentation', () => {
  test('covers JavaScript operators and browser globals', () => {
    expect(JAVASCRIPT_OPERATOR_HOVERS.typeof.syntax).toBe('typeof operand')
    expect(JAVASCRIPT_OPERATOR_HOVERS.of.description).toContain('for...of')
    expect(GLOBAL_OBJECT_HOVERS.window.type).toContain('Window')
    expect(GLOBAL_OBJECT_HOVERS.localStorage.type).toBe('Storage')
  })

  test('describes known, heading, and fallback HTML elements', () => {
    expect(HTML_TAGS.has('article')).toBeTrue()
    expect(htmlTagDescription('div')).toContain('container')
    expect(htmlTagDescription('h4')).toContain('Level 4')
    expect(htmlTagDescription('article')).toBe('HTML article element')
  })
})
