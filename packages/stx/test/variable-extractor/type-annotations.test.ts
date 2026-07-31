import { describe, expect, it } from 'bun:test'
import { convertToCommonJS, splitDeclaration } from '../../src/variable-extractor'

/**
 * A `<script server>` declaration may carry a TypeScript annotation.
 *
 * The pattern that parsed declarations required the `=` to follow the name
 * directly, so `const rows: any = await db...` matched nothing, fell through to
 * the destructuring branch, and threw. That throw leaves `convertToCommonJS`,
 * the whole server script falls back to static extraction, and the page renders
 * with every variable undefined and no error in the console.
 *
 * One annotated declaration was enough to blank a page, which is why this is
 * covered directly rather than through the pages that hit it.
 */
describe('splitDeclaration', () => {
  it('reads a plain declaration', () => {
    expect(splitDeclaration('const a = 1')).toEqual({ type: 'const', name: 'a', value: '1' })
  })

  it('reads past a simple annotation', () => {
    expect(splitDeclaration('const rows: any = await db')).toEqual({
      type: 'const',
      name: 'rows',
      value: 'await db',
    })
  })

  it('reads past a union, whose pipe is not an operator here', () => {
    expect(splitDeclaration('let x: string | null = null')?.value).toBe('null')
  })

  it('reads past a generic containing a comma', () => {
    expect(splitDeclaration('const m: Map<string, number> = new Map()')?.value).toBe('new Map()')
  })

  it('reads past an object type containing braces', () => {
    expect(splitDeclaration('const g: Array<{ a: number }> = []')?.value).toBe('[]')
  })

  it('handles an exported declaration', () => {
    expect(splitDeclaration('export const h: number = 2')?.name).toBe('h')
  })

  it('does not mistake an arrow for the initializer', () => {
    expect(splitDeclaration('const f = (a) => a')?.value).toBe('(a) => a')
  })

  it('keeps let and var', () => {
    expect(splitDeclaration('let a = 1')?.type).toBe('let')
    expect(splitDeclaration('var b = 2')?.type).toBe('var')
  })

  it('returns null for something that is not a simple declaration', () => {
    expect(splitDeclaration('const bad')).toBeNull()
    expect(splitDeclaration('const { a, b } = c')).toBeNull()
    expect(splitDeclaration('if (a) {')).toBeNull()
  })
})

describe('convertToCommonJS with annotated declarations', () => {
  it('converts an annotated declaration instead of throwing', () => {
    const output = convertToCommonJS('const rows: any = await load()', '/p/v/page.stx')

    expect(output).toContain('rows')
    expect(output).toContain('module.exports.rows')
  })

  it('keeps the statements after an annotated one', () => {
    // The real symptom: everything after the annotated declaration was lost
    // along with it, because the throw abandoned the whole conversion.
    const source = [
      'const rows: any = await load()',
      'const title = \'hello\'',
    ].join('\n')

    const output = convertToCommonJS(source, '/p/v/page.stx')

    expect(output).toContain('title')
  })

  it('handles an annotated multi-line initializer', () => {
    const source = [
      'const rows: any = await db',
      '  .selectFrom(\'x\')',
      '  .execute()',
      'const after = 1',
    ].join('\n')

    const output = convertToCommonJS(source, '/p/v/page.stx')

    expect(output).toContain('selectFrom')
    expect(output).toContain('after')
  })

  it('still converts a plain script', () => {
    const output = convertToCommonJS('const a = 1\nconst b = a + 1', '/p/v/page.stx')

    expect(output).toContain('module.exports.a')
    expect(output).toContain('module.exports.b')
  })
})
