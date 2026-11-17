import { expect, spyOn, test } from 'bun:test'
import { extractTemplateExpressions } from '../../src/stx-virtual-ts'

// Count source reads instead of imposing a machine-dependent render deadline.
// Finding each expression's line by rescanning the entire prefix made real
// application pages spend over a second in composable reachability alone.
test('indexes source positions once for a large page of template expressions', () => {
  const prefix = `<div>${'static '.repeat(20_000)}</div>\n`
  const source = prefix + Array.from({ length: 128 }, (_, index) =>
    `<p :text="rows[${index}].name">{{ rows[${index}].name }}</p>`).join('\n')
  const original = String.prototype.charCodeAt
  let reads = 0
  const reader = spyOn(String.prototype, 'charCodeAt').mockImplementation(function (this: string, index: number) {
    if (this.length === source.length) reads++
    return original.call(this, index)
  })
  let expressions: ReturnType<typeof extractTemplateExpressions>
  try { expressions = extractTemplateExpressions(source) }
  finally { reader.mockRestore() }

  expect(expressions).toHaveLength(256)
  expect(expressions[0]).toEqual({ code: 'rows[0].name', line: 2, column: 11, offset: prefix.length + 10, kind: 'directive', attribute: ':text' })
  expect(expressions.at(-1)).toMatchObject({ code: 'rows[127].name', line: 129, column: 30, kind: 'interpolation' })
  expect(reads).toBeLessThan(source.length * 3)
})
