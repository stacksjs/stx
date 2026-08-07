/**
 * The single extractor behind `stx typecheck` and the editor plugin
 * (stacksjs/stx#1852 asks 4 and 5).
 *
 * Everything here was measured against the repo's own 173-file `.stx` corpus
 * before being shipped, because a template checker that invents errors is worse
 * than no template checker at all — a CI gate people mute is a CI gate that
 * catches nothing. The first run produced 400 diagnostics across 2072
 * expressions and every one was a false positive; each case below is a rule
 * that measurement forced.
 *
 * The final corpus run: 2072 expressions, 1 diagnostic, and that one is a real
 * bug (`examples/components/buddy/terminal.stx` has an unterminated string
 * inside `{{ }}`, which renders empty).
 */
import { describe, expect, it } from 'bun:test'
import {
  buildVirtualTypeScript,
  collectBlockDeclarations,
  collectTemplateBindings,
  crossScopeCollisions,
  extractScriptBlocks,
  extractTemplateExpressions,
  lineStarts,
  maskNonTemplateRegions,
  offsetToPosition,
  positionToOffset,
  resolvePosition,
  stripFilterChain,
} from '../../src/stx-virtual-ts'

describe('what counts as an expression', () => {
  it('skips {{-- template comments --}}', () => {
    // The single biggest source of noise: 305 of the first run's 400
    // diagnostics were Blade-style comments parsed as TypeScript.
    const source = '{{-- Page Header --}}\n<p>{{ title }}</p>'

    expect(extractTemplateExpressions(source).map(e => e.code)).toEqual(['title'])
  })

  it('skips an escaped interpolation', () => {
    expect(extractTemplateExpressions('@{{ notAnExpression }}')).toEqual([])
  })

  it('ignores anything inside a script, a style or an HTML comment', () => {
    const source = [
      '<script client>const a = "{{ nope }}"</script>',
      '<style>.x { content: "{{ nope }}" }</style>',
      '<!-- {{ nope }} -->',
      '<p>{{ yes }}</p>',
    ].join('\n')

    expect(extractTemplateExpressions(source).map(e => e.code)).toEqual(['yes'])
  })

  it('masks without moving anything', () => {
    // Offsets have to survive masking or every position after a script block
    // would be wrong.
    const source = '<script>const a = 1</script>\n<p>{{ x }}</p>'
    const masked = maskNonTemplateRegions(source)

    expect(masked.length).toBe(source.length)
    expect(masked.split('\n').length).toBe(source.split('\n').length)
  })

  it('reads a directive value as an expression', () => {
    const found = extractTemplateExpressions('<div :if="open" @click="go()" x-text="name"></div>')

    expect(found.map(e => [e.attribute, e.code])).toEqual([
      [':if', 'open'],
      ['@click', 'go()'],
      ['x-text', 'name'],
    ])
  })

  it('takes only the iterable half of a :for', () => {
    // `item` is a binding, not something to resolve.
    const found = extractTemplateExpressions('<li :for="(item, i) in rows" :key="item.id"></li>')

    expect(found.map(e => e.code)).toEqual(['rows'])
  })

  it('substitutes a server interpolation spliced into a client expression', () => {
    // `:show="photos()[{{ idx }}]"` is real stx — the server fills it in before
    // the client parses the attribute. Left alone it is a syntax error.
    const [directive] = extractTemplateExpressions('<img :show="photos()[{{ idx }}]">')

    expect(directive.code).toBe('photos()[__stx_interpolated]')
  })
})

describe('filter chains', () => {
  it('keeps logical OR', () => {
    expect(stripFilterChain('a || b')).toBe('a || b')
  })

  it('drops a filter', () => {
    expect(stripFilterChain('name | upper')).toBe('name ')
  })

  it('ignores a pipe inside a string or a nested call', () => {
    expect(stripFilterChain('join("|")')).toBe('join("|")')
    expect(stripFilterChain('f(a | b)')).toBe('f(a | b)')
  })
})

describe('template bindings', () => {
  it('types a loop variable from the iterable it came from', () => {
    // The case the issue reports: a renamed column has to become an error.
    expect(collectTemplateBindings('@foreach(rows as row)')).toEqual([
      { name: 'row', iterable: 'rows' },
    ])
  })

  it('does not type a destructured or indexed binding', () => {
    // `(item, index)` is not the element type, and guessing invents errors.
    expect(collectTemplateBindings('<li :for="(item, i) in rows">')).toEqual([
      { name: 'i', iterable: undefined },
      { name: 'item', iterable: undefined },
    ])
  })

  it('gives up on a name bound by two different loops', () => {
    const bindings = collectTemplateBindings('@foreach(a as x)@endforeach\n@foreach(b as x)@endforeach')

    expect(bindings).toEqual([{ name: 'x', iterable: undefined }])
  })

  it('finds names declared in an @js block', () => {
    expect(collectTemplateBindings('@js\nconst total = 1\n@endjs').map(b => b.name)).toEqual(['total'])
  })
})

describe('block declarations', () => {
  it('finds every declaration form', () => {
    const code = [
      'const a = 1',
      'export let b = 2',
      'var c = 3',
      'function d() {}',
      'export async function e() {}',
      'class F {}',
      'const { g, h: i } = x',
      'const [j] = y',
    ].join('\n')

    expect(collectBlockDeclarations(code)).toEqual(['F', 'a', 'b', 'c', 'd', 'e', 'g', 'i', 'j'])
  })

  it('reports a name declared on both sides of the server/client boundary', () => {
    const blocks = extractScriptBlocks([
      '<script server>',
      'const items = []',
      'const onlyServer = 1',
      '</script>',
      '<script client>',
      'const items = state([])',
      '</script>',
    ].join('\n'))

    expect(crossScopeCollisions(blocks)).toEqual(['items'])
  })
})

describe('the virtual buffer', () => {
  const PAGE = [
    '<script server>', //  1
    'const title = 1', //  2
    '</script>', //        3
    '<h1>x</h1>', //       4
    '<p>{{ title }}</p>', //5
  ].join('\n')

  it('writes each script line at the line it already occupies', () => {
    const lines = buildVirtualTypeScript(PAGE).text.split('\n')

    expect(lines[1]).toBe('const title = 1')
    expect(lines[3]).toBe('') // markup blanked, not removed
  })

  it('ends as a module', () => {
    // Without `export {}` the buffer is a global script, so a top-level
    // `const open` does not shadow lib.dom's `open` and `open.set(…)` reports
    // against `Window.open`. Any name lib.dom claims hits this.
    expect(buildVirtualTypeScript(PAGE).text.trimEnd().endsWith('export {}')).toBe(true)
  })

  it('carries a source position for every synthetic expression line', () => {
    const built = buildVirtualTypeScript(PAGE)
    const expressions = [...built.lineMap.values()].filter(m => m.expression)

    expect(expressions).toHaveLength(1)
    expect(expressions[0].line).toBe(5)
  })

  it('does not model an event handler that assigns to a binding', () => {
    // `@click="open = !open"` is documented stx syntax, but assigns to what
    // TypeScript sees as a const — reporting it would be inventing an error.
    const built = buildVirtualTypeScript('<button @click="open = !open">x</button>')

    expect([...built.lineMap.values()].filter(m => m.expression)).toHaveLength(0)
  })

  it('can leave the markup out entirely', () => {
    const built = buildVirtualTypeScript(PAGE, { templateExpressions: false })

    expect([...built.lineMap.values()].filter(m => m.expression)).toHaveLength(0)
  })
})

describe('position mapping', () => {
  const text = 'ab\ncde\nf'

  it('round-trips an offset', () => {
    const starts = lineStarts(text)

    for (let offset = 0; offset < text.length; offset++) {
      const { line, column } = offsetToPosition(starts, offset)
      expect(positionToOffset(starts, line, column)).toBe(offset)
    }
  })

  it('leaves a script-block position where it is', () => {
    const built = buildVirtualTypeScript('<script server>\nconst a = 1\n</script>')

    expect(resolvePosition(built, 2, 7)).toEqual({ line: 2, column: 7 })
  })

  it('returns nothing for an appended ambient declaration', () => {
    // They correspond to nothing the author wrote.
    const built = buildVirtualTypeScript('<script server>\nconst a = 1\n</script>')
    const globalsLine = built.sourceLineCount + 3

    expect(resolvePosition(built, globalsLine, 1)).toBeNull()
  })

  it('points inside the expression, not at the start of the attribute', () => {
    const source = '<p>{{ row.total }}</p>'
    const built = buildVirtualTypeScript(source)
    const [line, mapped] = [...built.lineMap.entries()].find(([, m]) => m.expression)!

    // Four characters into the expression is `total`; column 7 + 4 = 11.
    const resolved = resolvePosition(built, line, (mapped.prefixLength ?? 0) + 5)
    expect(resolved).toMatchObject({ line: 1, column: 11 })
    expect(source[10]).toBe('t')
  })
})
