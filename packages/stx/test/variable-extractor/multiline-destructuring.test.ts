import { describe, expect, it } from 'bun:test'
import { convertToCommonJS } from '../../src/variable-extractor'

/**
 * A `<script server>` may destructure across several lines.
 *
 *     const {
 *       stores,
 *       westla,
 *     } = await loadSiteModel()
 *
 * `convertToCommonJS` classified declarations by "starts with const/let/var and
 * has no `=` on this line", which is true of `var row;` — a hoisted, initializer-less
 * declaration the transpiler lifts out of a block — and equally true of the
 * first line above. So `const {` was emitted raw, the loop advanced one line,
 * and the pattern never reached the branch that exports its names.
 *
 * The failure was invisible from the outside. The remaining lines still emitted,
 * so the script ran and anything computed from the destructured names was
 * correct; only the template context was missing them, which meant `{{ stores }}`
 * printed as literal text and every `@foreach` over one rendered nothing. No
 * error, no warning, and writing the identical declaration on one line worked —
 * so it read as a data problem rather than a parsing one.
 *
 * These assert the exported names, because that is the thing that was lost, and
 * that the emitted code still parses, because a conversion that lists the right
 * names and throws at run time is no better.
 */

/** The names the conversion will publish to the template context. */
function exportedNames(source: string): string[] {
  return [...convertToCommonJS(source, '/tmp/page.stx').matchAll(/module\.exports\.(\w+)\s*=/g)]
    .map(match => match[1]!)
    // The temporary holding the right-hand side is an implementation detail.
    .filter(name => !name.startsWith('__stx_src_'))
}

/** Whether the emitted CommonJS is syntactically valid. */
function isParseable(source: string): boolean {
  try {
    // eslint-disable-next-line no-new-func
    void new Function('module', 'exports', `return (async () => {\n${convertToCommonJS(source, '/tmp/page.stx')}\n})()`)
    return true
  }
  catch {
    return false
  }
}

describe('destructuring spread across lines', () => {
  it('exports the names of a multi-line object pattern', () => {
    expect(exportedNames('const {\n  a,\n  b\n} = m();')).toEqual(['a', 'b'])
  })

  it('matches what the same declaration on one line produces', () => {
    expect(exportedNames('const {\n  a,\n  b\n} = m();'))
      .toEqual(exportedNames('const { a, b } = m();'))
  })

  it('tolerates a trailing comma', () => {
    expect(exportedNames('const {\n  a,\n  b,\n} = m();')).toEqual(['a', 'b'])
  })

  it('handles an awaited right-hand side', () => {
    // The real case: `const {\n …\n} = await loadSiteModel()`.
    expect(exportedNames('const {\n  a,\n  b\n} = await m();')).toEqual(['a', 'b'])
  })

  it('handles array patterns', () => {
    expect(exportedNames('const [\n  a,\n  b\n] = m();')).toEqual(['a', 'b'])
  })

  it('binds the new name when a key is renamed', () => {
    expect(exportedNames('const {\n  a: alpha,\n  b\n} = m();')).toEqual(['alpha', 'b'])
  })

  it('keeps defaults out of the exported names', () => {
    expect(exportedNames('const {\n  a = 1,\n  b\n} = m();')).toEqual(['a', 'b'])
  })

  it('handles `export const`', () => {
    expect(exportedNames('export const {\n  a,\n  b\n} = m();')).toEqual(['a', 'b'])
  })

  it('handles a right-hand side that is itself multi-line', () => {
    expect(exportedNames('const {\n  a,\n  b\n} = m({\n  k: 1,\n});')).toEqual(['a', 'b'])
  })

  it('emits parseable code in every case', () => {
    for (const source of [
      'const {\n  a,\n  b\n} = m();',
      'const [\n  a,\n  b\n] = await m();',
      'const {\n  user: { name },\n  total,\n} = m();',
      'export const {\n  a,\n  b\n} = m();',
    ])
      expect(isParseable(source)).toBe(true)
  })
})

describe('nested patterns', () => {
  /**
   * `extractDestructuredNames` incremented its depth counter on the nested
   * pattern's opening brace and then returned from the branch without putting
   * it back, so depth stayed above zero and the "skip nested content" guard
   * swallowed every name that followed. Same silent shape as the bug above:
   * `{ user: { name }, total }` bound both at run time but published only
   * `name` to the template.
   *
   * Only reachable on one line before, since a multi-line pattern never got
   * this far.
   */
  it('keeps the names that follow a nested pattern', () => {
    expect(exportedNames('const { a: { deep }, b, c } = m();')).toEqual(['deep', 'b', 'c'])
  })

  it('keeps names on both sides of a nested pattern', () => {
    expect(exportedNames('const { b, a: { deep }, c } = m();')).toEqual(['b', 'deep', 'c'])
  })

  it('handles a nested pattern inside an array pattern', () => {
    expect(exportedNames('const [{ x }, y] = m();')).toEqual(['x', 'y'])
  })

  it('handles more than one level of nesting', () => {
    expect(exportedNames('const { a: { p: { q } }, b } = m();')).toEqual(['q', 'b'])
  })

  it('handles nesting across lines', () => {
    expect(exportedNames('const {\n  user: { name },\n  total,\n} = m();')).toEqual(['name', 'total'])
  })

  it('does not mistake a brace inside a string default for the pattern closing', () => {
    expect(exportedNames('const { sep = "}", b } = m();')).toEqual(['sep', 'b'])
  })
})

describe('declarations with no initializer', () => {
  /**
   * What the old rule was protecting. Bun's transpiler hoists these out of a
   * `for`/`try`/`if`, and `parseVariableDeclaration` throws without a `= value`
   * — which strands the entire script in the fallback extractor, not just the
   * one line. They must still be emitted untouched.
   */
  it('leaves a hoisted var alone', () => {
    expect(exportedNames('var row;')).toEqual([])
    expect(convertToCommonJS('var row;', '/tmp/page.stx')).toContain('var row;')
  })

  it('leaves one without a semicolon alone', () => {
    expect(exportedNames('let i')).toEqual([])
  })

  it('leaves a comma-separated list alone', () => {
    expect(exportedNames('var a, b;')).toEqual([])
  })

  it('still exports an ordinary initialized declaration', () => {
    expect(exportedNames('const x = 1;')).toEqual(['x'])
  })
})
