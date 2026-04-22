/**
 * Regression tests for tokenizer / lexer hardening:
 *   - splitByPipe respects backslash-escaped `\|` outside strings
 *   - Tokenizer caps nested `${…}` depth to avoid stack exhaustion
 *     on adversarial template-literal input
 */

import { describe, expect, it } from 'bun:test'
import { Tokenizer } from '../../src/parser/tokenizer'
import { splitByPipe } from '../../src/parser/tokenizer'

// ─────────────────────────────────────────────────────────────────────────────
// splitByPipe — escaped pipe `\|` outside string
// ─────────────────────────────────────────────────────────────────────────────

describe('splitByPipe — backslash-escaped pipe outside strings', () => {
  it('does NOT split on `\\|`', () => {
    // Pipe-escape lets filter arguments carry literal pipe chars without
    // starting a new filter segment.
    expect(splitByPipe('a \\| b')).toEqual(['a | b'])
  })

  it('splits on an unescaped pipe elsewhere in the same expression', () => {
    expect(splitByPipe('a \\| b | upper')).toEqual(['a | b', 'upper'])
  })

  it('still treats `||` as logical OR (not a filter boundary)', () => {
    expect(splitByPipe('a || b')).toEqual(['a || b'])
  })

  it('handles multiple escaped pipes', () => {
    expect(splitByPipe('x \\| y \\| z')).toEqual(['x | y | z'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Template-string nesting cap — adversarial input guard
// ─────────────────────────────────────────────────────────────────────────────

describe('Tokenizer readTemplateString — nested `${` depth cap', () => {
  it('tokenizes pathological deep-nested template strings without throwing', () => {
    // Build a ~2 KB template literal with 1024 nested ${… layers. Without
    // the cap, consumers could pay quadratic cost or stack-overflow.
    const OPEN = '${'
    const CLOSE = '}'
    const DEPTH = 1024
    const src = `\`${OPEN.repeat(DEPTH)}x${CLOSE.repeat(DEPTH)}\``

    const tok = new Tokenizer(src)
    // If the cap didn't engage, this either hangs or throws; either failure
    // manifests as a timeout in the CI runner. Reaching the assertion means
    // the guard kicked in and we got a usable token back.
    const tokens = tok.tokenize()
    const tmplTokens = tokens.filter(t => t.type === 'TEMPLATE_STRING')
    expect(tmplTokens.length).toBeGreaterThanOrEqual(1)
  })

  it('still tokenizes reasonable nested templates normally', () => {
    // Common case: `a ${ `b ${ c } d` } e` — tokenizer should return one
    // template-string token covering the whole span.
    const src = '`a ${ `b ${c} d` } e`'
    const tokens = new Tokenizer(src).tokenize()
    const tmpl = tokens.find(t => t.type === 'TEMPLATE_STRING')
    expect(tmpl).toBeDefined()
    expect(tmpl!.value).toBe(src)
  })
})
