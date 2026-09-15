import { describe, expect, it } from 'bun:test'
import { processConditionals } from '../../src/conditionals'

describe('@if batching', () => {
  it('replaces several sibling branches without moving intervening markup', () => {
    const template = '<main>before</main>@if (a)A@else X@endif<span>middle</span>@if (b)B@else Y@endif<footer>end</footer>'
    const output = processConditionals(template, { a: true, b: false }, 'test.stx')

    expect(output).toBe('<main>before</main>A<span>middle</span> Y<footer>end</footer>')
  })

  it('exposes nested conditionals for the next pass', () => {
    const template = '@if (outer)A@if (inner)B@else C@endif D@endif|@if (tail)E@endif'
    const output = processConditionals(template, { outer: true, inner: false, tail: true }, 'test.stx')

    expect(output).toBe('A C D|E')
  })

  it('evaluates sibling conditions from right to left as before', () => {
    const calls: string[] = []
    const touch = (value: string): boolean => {
      calls.push(value)
      return true
    }
    const template = '@if (touch("left"))L@endif|@if (touch("middle"))M@endif|@if (touch("right"))R@endif'
    const output = processConditionals(template, { touch }, 'test.stx')

    expect(output).toBe('L|M|R')
    expect(calls).toEqual(['right', 'middle', 'left'])
  })
})
