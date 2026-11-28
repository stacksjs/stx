import { describe, expect, it } from 'bun:test'
import { bracketDepths, stripBindingLiterals, stripCommentsAndLiterals } from '../../src/strip-literals'

describe('stripCommentsAndLiterals and regex literals', () => {
  it('keeps binding offsets after large generated literals and nested templates', () => {
    const payload = 'x'.repeat(600_000)
    const source = `const payload = '${payload}'; /*hidden\ncomment*/\nconst value = \`text $plain \${format(\`nested \${name}\`)}\`;\nvalue / 2`
    const prefix = `const payload = ${' '.repeat(payload.length + 2)}; ${' '.repeat(8)}\n${' '.repeat(9)}\nconst value = `
    expect(stripCommentsAndLiterals(source)).toBe(`${prefix}${' '.repeat(15)}format(${' '.repeat(10)}name  )  ;\nvalue / 2`)
    const bindings = stripBindingLiterals(source)
    expect(bindings).toHaveLength(source.length)
    expect(bindings.indexOf('format')).toBe(source.indexOf('format'))
    expect(bindings.indexOf('name')).toBe(source.indexOf('name'))
    expect(bindings).toContain(`format((${' '.repeat(8)}{name}))`)
    expect(bracketDepths(bindings).balanced).toBe(true)
  })

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

  it('preserves Unicode whitespace and regex offsets around ASCII words', () => {
    for (const space of ['\t', '\n', '\r', '\u00a0', '\u1680', '\u2003', '\u2028', '\u2029', '\u202f', '\u3000', '\ufeff']) {
      const regex = `if (active) return${space}/a[b]+/; const count_2 = 9`
      const division = `const value = $counter_2${space}/ divisor / tail`
      expect(stripCommentsAndLiterals(regex)).toBe(regex.replace('/a[b]+/', '/     /'))
      expect(stripBindingLiterals(regex)).toBe(regex.replace('/a[b]+/', '/     /'))
      expect(stripCommentsAndLiterals(division)).toBe(division)
    }
  })

  it('treats a string or template as the end of an expression', () => {
    expect(stripCommentsAndLiterals(`'a' / 2 / 'b'`)).toBe(`    / 2 /    `)
  })

  it('reads a regex inside a template interpolation, quote and all', () => {
    // Stacks' NativeBarButton: the `"` in /"/g was taken for a string that ran
    // past the interpolation, so the function after it scanned as nested and
    // was left out of the page's scope ("tapBarButton is not defined").
    const code = "const photo = derived(() => `url(\"${String(src()).replace(/\"/g, '%22')}\")`)\n\nfunction tap(): void {\n  go()\n}\n"
    const out = stripCommentsAndLiterals(code)
    expect(out).toHaveLength(code.length)
    const { depths, balanced } = bracketDepths(out)
    expect(balanced).toBe(true)
    expect(depths[out.indexOf('function tap')]).toBe(0)
  })
})
