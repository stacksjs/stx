/**
 * Regression tests for directive-processing hardening:
 *   - Unclosed `@unless`/`@auth`/`@guest`/`@isset`/`@env` emit a helpful
 *     console.warn instead of silently dropping the block
 *   - `@auth`/`@guest` guard parsing handles backslash-escaped embedded
 *     quotes (was previously broken by a greedy `(.*?)` regex)
 */

import { describe, expect, it } from 'bun:test'
import {
  processAuthDirectives,
  processConditionals,
  processIssetEmptyDirectives,
} from '../../src/conditionals'

// Capture / restore console.warn across each test.
function captureWarn<T>(fn: () => T): { result: T, warnings: string[] } {
  const originalWarn = console.warn
  const warnings: string[] = []
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  try {
    return { result: fn(), warnings }
  }
  finally {
    console.warn = originalWarn
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unclosed directive warnings
// ─────────────────────────────────────────────────────────────────────────────

describe('conditionals — unclosed directives emit a helpful warning', () => {
  it('warns when @unless has no @endunless', () => {
    const { warnings } = captureWarn(() =>
      processConditionals('@unless(x) leftover content', { x: false }, 'test.stx'),
    )
    expect(warnings.some(m => /@unless.*no matching @endunless/i.test(m))).toBe(true)
  })

  it('warns when @auth has no @endauth', () => {
    const { warnings } = captureWarn(() =>
      processAuthDirectives('@auth leftover content', { auth: { check: true } }),
    )
    expect(warnings.some(m => /@auth.*no matching @endauth/i.test(m))).toBe(true)
  })

  it('warns when @isset has no @endisset', () => {
    const { warnings } = captureWarn(() =>
      processIssetEmptyDirectives('@isset(user) content without closer', { user: { name: 'x' } }),
    )
    expect(warnings.some(m => /@isset.*no matching @endisset/i.test(m))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// @auth / @guest guard — quote-aware parser parses & advances correctly
// ─────────────────────────────────────────────────────────────────────────────
//
// The guard value feeds a bracket-notation auth-check that is independent of
// this parser fix, so we don't test "guard passes → content renders". We
// DO test the parser itself — the old greedy regex mangled embedded quotes
// and left stray source text behind. After the fix, the directive is
// recognized as a complete guarded @auth, the END tag is matched, and no
// fragment of the guard value leaks into the output regardless of auth state.

describe('@auth / @guest — guard parser consumes quoted guards cleanly', () => {
  it('fully consumes @auth("web") … @endauth (no stray source bleeds through)', () => {
    const tpl = 'before @auth("web") inner @endauth after'
    const out = processAuthDirectives(tpl, { auth: { check: false } })
    // Unauthed user with a guarded block — the entire @auth(...)…@endauth
    // span is replaced by empty string, leaving only the surrounding text.
    // Critically the literal `"web"` from the guard must not survive.
    expect(out).toContain('before')
    expect(out).toContain('after')
    expect(out).not.toContain('"web"')
    expect(out).not.toContain('@auth')
    expect(out).not.toContain('@endauth')
  })

  it('accepts @auth(\'admin\\\'s\') with a backslash-escaped inner quote', () => {
    // Before the fix, the lazy `(['"])(.*?)\\1` regex terminated at the
    // first inner quote, so `@auth('admin\\'s')` parsed as guard=`admin\\`
    // with stray `s')` source trailing into the content. After the fix,
    // the char-by-char parser honors the backslash-escape and consumes
    // the whole guard.
    const tpl = '@auth(\'admin\\\'s\') inner @endauth'
    const out = processAuthDirectives(tpl, { auth: { check: false } })
    // Guard parsed successfully → whole block stripped → no stray tokens.
    expect(out).not.toContain('@auth')
    expect(out).not.toContain('@endauth')
    expect(out).not.toContain("admin\\'s")
    expect(out.trim()).toBe('')
  })

  it('falls back to "no guard" when guard parens are malformed', () => {
    // Missing closing paren → parseQuotedGuard returns null → directive
    // runs without a guard. With check:true, content shows.
    const tpl = '@auth A @endauth'
    const out = processAuthDirectives(tpl, { auth: { check: true } })
    expect(out.trim()).toBe('A')
  })
})
