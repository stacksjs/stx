import { expect, spyOn, test } from 'bun:test'
import { requiresAsyncBody } from '../../src/module-syntax'

// The parser still runs for new source. This checks reuse across the working
// set of a rendered page, rather than imposing a machine-dependent deadline.
test('reuses syntax decisions across a page of unchanged client modules', () => {
  const parser = spyOn(Bun.Transpiler.prototype, 'transformSync')
  try {
    const sources = Array.from({ length: 126 }, (_, index) =>
      `const syntaxReuseFixture${index} = ${index};${index === 0 ? `/*${'x'.repeat(860_000)}*/` : ''}`)
    for (const source of sources) expect(requiresAsyncBody(source)).toBe(false)
    const initialParses = parser.mock.calls.length
    expect(initialParses).toBe(126)
    for (const source of sources) expect(requiresAsyncBody(source)).toBe(false)
    expect(parser.mock.calls.length).toBe(initialParses)

    expect(requiresAsyncBody('const syntaxReuseEdited = await Promise.resolve(1)')).toBe(true)
    expect(requiresAsyncBody('const syntaxReuseEdited = Promise.resolve(1)')).toBe(false)
    expect(() => requiresAsyncBody('const syntaxReuseMalformed = ;')).toThrow()
    expect(() => requiresAsyncBody('const syntaxReuseMalformed = ;')).toThrow()
  }
  finally { parser.mockRestore() }
}, 60_000)

test('bounds retained syntax decisions by source bytes and entry count', () => {
  const parser = spyOn(Bun.Transpiler.prototype, 'transformSync')
  try {
    const retained = 'const syntaxBudgetRetained = 1'
    expect(requiresAsyncBody(retained)).toBe(false)
    const oversized = `/*${'x'.repeat(9_000_000)}*/const syntaxBudgetOversized = 1`
    expect(requiresAsyncBody(oversized)).toBe(false)
    expect(requiresAsyncBody(oversized)).toBe(false)
    expect(parser.mock.calls.length).toBe(3)
    expect(requiresAsyncBody(retained)).toBe(false)
    expect(parser.mock.calls.length).toBe(3)

    for (let index = 0; index < 257; index++) requiresAsyncBody(`const syntaxBudgetEviction${index} = 1`)
    const before = parser.mock.calls.length
    expect(requiresAsyncBody(retained)).toBe(false)
    expect(parser.mock.calls.length).toBe(before + 1)
  }
  finally { parser.mockRestore() }
}, 60_000)
