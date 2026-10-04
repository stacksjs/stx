import { describe, expect, it } from 'bun:test'
import { bracketDepths, stripCommentsAndLiterals } from '../../src/strip-literals'

describe('stripCommentsAndLiterals and regex literals', () => {
  it('blanks a regex body, quotes and braces included, keeping offsets', () => {
    const code = `const re = /[&<>"']\\{x\\}/g; const next = 1`
    const out = stripCommentsAndLiterals(code)
    expect(out).toHaveLength(code.length)
    expect(out).not.toContain('"')
    expect(out).not.toContain('{')
    expect(out).toContain('const next = 1')
    expect(bracketDepths(out).balanced).toBe(true)
  })

  it('tells division from a regex by what precedes the slash', () => {
    expect(stripCommentsAndLiterals('const half = total / 2 / count')).toBe('const half = total / 2 / count')
    expect(stripCommentsAndLiterals('const r = (a) / (b)')).toBe('const r = (a) / (b)')
    expect(stripCommentsAndLiterals('if (x) return /ab/.test(s)')).toBe('if (x) return /  /.test(s)')
    expect(stripCommentsAndLiterals('f(/a"b/)')).toBe('f(/   /)')
  })

  it('leaves a slash alone when no regex can close on its line', () => {
    expect(stripCommentsAndLiterals('a = b\n/ c')).toBe('a = b\n/ c')
  })

  it('treats a string or template as the end of an expression', () => {
    expect(stripCommentsAndLiterals(`'a' / 2 / 'b'`)).toBe(`    / 2 /    `)
  })
})
