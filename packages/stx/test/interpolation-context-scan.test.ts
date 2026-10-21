/**
 * The HTML-context classifier behind every escaped interpolation.
 *
 * It used to rescan the template from the start for each interpolation, so a
 * page with a few hundred of them was quadratic: a quarter of HQ's home-page
 * render. It now keeps its scan between calls. It must still answer exactly
 * as the single-pass version did, in any call order - except inside HTML
 * comments, which the single-pass version read as markup: the apostrophe in
 * `<!-- the device's own setting -->` opened a "quote" that swallowed the
 * comment's `>`, and every interpolation after it was classified as text,
 * never as an attribute.
 */
import { describe, expect, it } from 'bun:test'
import { classifyHtmlInterpolation } from '../src/interpolation-context'
import { referenceClassifyHtmlInterpolation } from './__reference/interpolation-context-single-pass'

const offsetsOf = (source: string): number[] => {
  const offsets: number[] = []
  for (let i = source.indexOf('{{'); i >= 0; i = source.indexOf('{{', i + 2))
    offsets.push(i)
  return offsets
}

/** A small deterministic generator, so a failure names a seed that reproduces it. */
function document(seed: number): string {
  let state = seed
  const next = (n: number) => {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7FFFFFFF
    return state % n
  }
  const parts = [
    '<a ', '<div class="', '" ', '<input value=\'', '\' ', '>', '</p>', 'text ', ' title="a > b" ',
    '{{ x }}', '{{ "a>b" }}', '{{ \'q\' }}', '{{ a ? "<" : ">" }}', '{{ { a: 1 } }}', '{{', '}}',
    '<', ' href=', 'onclick=\'f("x")\' ', '<!DOCTYPE html>', '<br/>', '\n', '<img src={{ s }} ', '/>',
  ]
  let out = ''
  for (let i = 0, n = 20 + next(60); i < n; i++)
    out += parts[next(parts.length)]
  return out
}

describe('classifyHtmlInterpolation', () => {
  it('answers as the single-pass version for every interpolation, in any order', () => {
    let checks = 0
    for (let seed = 1; seed <= 400; seed++) {
      const source = document(seed)
      const offsets = offsetsOf(source)
      const orders = [offsets, [...offsets].reverse(), offsets.filter((_, i) => i % 2 === 0).concat(offsets.filter((_, i) => i % 2 === 1))]
      for (const order of orders) {
        for (const offset of order) {
          for (const fragment of [false, true]) {
            const expected = referenceClassifyHtmlInterpolation(source, offset, fragment)
            const actual = classifyHtmlInterpolation(source, offset, fragment)
            if (JSON.stringify(actual) !== JSON.stringify(expected))
              throw new Error(`seed ${seed}, offset ${offset}, fragment ${fragment}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`)
            checks++
          }
        }
      }
    }
    expect(checks).toBeGreaterThan(1000)
  })

  it('switches between documents without carrying state across', () => {
    const a = '<a title="{{ one }}">{{ two }}</a>'
    const b = '<p>{{ three }}</p><img alt="{{ four }}">'
    const ask = (source: string, nth: number) => classifyHtmlInterpolation(source, offsetsOf(source)[nth])
    expect(ask(a, 0)).toEqual({ kind: 'attribute', name: 'title', quote: '"', valuePrefix: '' })
    expect(ask(b, 0)).toBeNull()
    expect(ask(a, 1)).toBeNull()
    expect(ask(b, 1)).toEqual({ kind: 'attribute', name: 'alt', quote: '"', valuePrefix: '' })
  })

  it('reads a comment as a comment, quotes and all', () => {
    const source = `<!-- Light, dark or the device's own setting -->\n<a href="{{ url }}">{{ label }}</a>`
    const [href, label] = offsetsOf(source)
    expect(classifyHtmlInterpolation(source, href)).toEqual({ kind: 'attribute', name: 'href', quote: '"', valuePrefix: '' })
    expect(classifyHtmlInterpolation(source, label)).toBeNull()
    // What the single-pass version answered: text, so the attribute's checks never ran.
    expect(referenceClassifyHtmlInterpolation(source, href)).toBeNull()
  })

  it('classifies an interpolation inside a comment as text', () => {
    const source = `<div><!-- by {{ author }}, "quoted" --><b title="{{ t }}"></b></div>`
    const [inComment, title] = offsetsOf(source)
    expect(classifyHtmlInterpolation(source, inComment)).toBeNull()
    expect(classifyHtmlInterpolation(source, title)).toEqual({ kind: 'attribute', name: 'title', quote: '"', valuePrefix: '' })
  })

  it('treats an unterminated comment as running to the end', () => {
    const source = `<!-- it's open\n<a href="{{ url }}">`
    expect(classifyHtmlInterpolation(source, offsetsOf(source)[0])).toBeNull()
  })

  it('stays linear on a long page after a quote-bearing comment', () => {
    const row = '<li><a href="{{ item.href }}" title="{{ item.title }}">{{ item.label }}</a></li>\n'
    const source = `<!-- the device's own setting -->\n<ul>\n${row.repeat(3000)}</ul>`
    const offsets = offsetsOf(source)
    const started = performance.now()
    for (const offset of offsets)
      classifyHtmlInterpolation(source, offset)
    // 9000 interpolations over ~250 KB. Rescanning from the start took seconds.
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
