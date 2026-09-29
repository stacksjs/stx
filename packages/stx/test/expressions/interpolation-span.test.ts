/**
 * A `{{ }}` interpolation is read whole, however many braces its expression
 * carries.
 *
 * The three matchers were `/\{\{([\s\S]*?)\}\}/g` -- lazy, and blind to both
 * nesting and string literals -- so the span ended at the FIRST `}}` inside the
 * expression. One level of object nesting was enough:
 *
 *   {{ JSON.stringify({a:1}) }}      worked
 *   {{ JSON.stringify({a:{b:1}}) }}  evaluated `JSON.stringify({a:{b:1`
 *
 * which threw, yielding empty, and the remainder leaked as literal text: pages
 * shipped `) }}` where the value belonged, attribute values included. No error,
 * no warning. `{{ "a}}b" }}` broke the same way on a `}}` inside a string.
 */
import { describe, expect, it } from 'bun:test'
import { findMustacheEnd, replaceInterpolations } from '../../src/expressions'
import { processDirectives } from '../../src/process'

const render = async (template: string, context: Record<string, unknown> = {}): Promise<string> =>
  (await processDirectives(template, context, '/tmp/interpolation-span.stx', {}, new Set<string>())).trim()

describe('nested braces inside an interpolation', () => {
  it('serializes a nested object in text', async () => {
    // &quot; because the value is HTML-escaped, as any {{ }} value is.
    expect(await render('{{ JSON.stringify({a:{b:1}}) }}')).toBe('{&quot;a&quot;:{&quot;b&quot;:1}}')
  })

  it('serializes a nested object inside an attribute', async () => {
    expect(await render('<div data-x="{{ JSON.stringify({a:{b:1}}) }}"></div>'))
      .toBe('<div data-x="{&quot;a&quot;:{&quot;b&quot;:1}}"></div>')
  })

  it('passes a nested object literal to a function', async () => {
    expect(await render('{{ fmt({o:{x:1}}) }}', { fmt: () => 'ok' })).toBe('ok')
  })

  it('keeps a }} that lives inside a string literal', async () => {
    expect(await render('{{ "a}}b" }}')).toBe('a}}b')
    expect(await render('{{ \'}}\' }}')).toBe('}}')
  })

  it('still reads ordinary and adjacent expressions', async () => {
    expect(await render('{{ a }}-{{ b }}', { a: 1, b: 2 })).toBe('1-2')
    expect(await render('{{ name | uppercase }}', { name: 'ada' })).toBe('ADA')
    expect(await render('{{ flag ? {y:1}.y : 0 }}', { flag: true })).toBe('1')
  })

  it('leaves an unterminated {{ alone', async () => {
    expect(await render('{{ a ')).toBe('{{ a')
  })
})

describe('findMustacheEnd', () => {
  const end = (s: string) => findMustacheEnd(s, s.indexOf('{{'))

  it('returns the index of the closing brace pair', () => {
    expect(end('{{ a }}')).toBe(5)
    expect(end('x {{ a }} y')).toBe(7)
  })

  it('counts nested braces', () => {
    const s = '{{ f({a:{b:1}}) }}'
    expect(end(s)).toBe(s.length - 2)
  })

  it('skips braces in single, double and template quotes', () => {
    for (const quoted of ['{{ "}}" }}', '{{ \'}}\' }}', '{{ `}}` }}'])
      expect(end(quoted)).toBe(quoted.length - 2)
  })

  it('honours a backslash escape inside a string', () => {
    const s = '{{ "a\\"}}b" }}'
    expect(end(s)).toBe(s.length - 2)
  })

  it('reports -1 when nothing closes it', () => {
    expect(end('{{ a')).toBe(-1)
    expect(end('{{ f({a:1) }')).toBe(-1)
  })
})

describe('replaceInterpolations', () => {
  it('reports match, expression and offset for each span', () => {
    const seen: Array<[string, string, number]> = []
    const out = replaceInterpolations('a{{ x }}b{{ y }}c', (match, expr, offset) => {
      seen.push([match, expr.trim(), offset])
      return expr.trim().toUpperCase()
    })

    expect(out).toBe('aXbYc')
    expect(seen).toEqual([['{{ x }}', 'x', 1], ['{{ y }}', 'y', 9]])
  })

  it('does not rescan what a replacement inserted', () => {
    // A value that itself looks like an interpolation is left as data.
    expect(replaceInterpolations('{{ x }}', () => '{{ y }}')).toBe('{{ y }}')
  })

  it('returns the input untouched when there is nothing to replace', () => {
    expect(replaceInterpolations('plain text', () => 'NO')).toBe('plain text')
    expect(replaceInterpolations('{{ unterminated', () => 'NO')).toBe('{{ unterminated')
  })
})
