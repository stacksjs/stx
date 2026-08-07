/**
 * Server values spliced into an `x-data` object.
 *
 * The scope a page hydrates with is built twice from the same template: once
 * into the `data-stx-xdata` attribute, and once into the
 * `__stx_reactive.initScope(...)` call in the bridge script. The second is what
 * the runtime actually reads, and `processExpressions` never reaches inside a
 * JS string literal - so the substitution has to happen here instead.
 *
 * Where the placeholder sits decides how it is spliced, and getting that wrong
 * is silent. `x-data="{ url: '{{ value }}' }"` used to produce
 * `{ url: '"https://example.com"' }`: quoted by the template and quoted again
 * by `JSON.stringify`. Nothing throws. The page renders, every binding updates,
 * and the value carries two literal quote characters wherever it goes - which
 * surfaces as a copy button that copies `"https://example.com"`.
 */

import { describe, expect, it } from 'bun:test'
import { processReactiveDirectives } from '../src/reactive'

/** The state expression as it reaches the runtime, out of the bridge script. */
function scopeExpression(template: string, context: Record<string, any>): string {
  const output = processReactiveDirectives(template, context, 'test.stx')
  const match = /initScope\(scopeEl, ("(?:[^"\\]|\\.)*"), \[\]/.exec(output)

  if (!match)
    throw new Error(`no initScope call in output:\n${output}`)

  return JSON.parse(match[1]!) as string
}

/** What the runtime gets after evaluating that expression, as it does. */
function scopeValue(template: string, context: Record<string, any>): any {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${scopeExpression(template, context)})`)()
}

describe('an interpolation inside a string literal', () => {
  it('is spliced raw, not quoted a second time', () => {
    const scope = scopeValue(
      `<div x-data="{ url: '{{ cloneUrl }}' }"></div>`,
      { cloneUrl: 'https://example.com/anna/checkout.git' },
    )

    expect(scope.url).toBe('https://example.com/anna/checkout.git')
    expect(scope.url.startsWith('"')).toBe(false)
  })

  it('works the same in double quotes and backticks', () => {
    expect(scopeValue(`<div x-data='{ a: "{{ value }}" }'></div>`, { value: 'x' }).a).toBe('x')
    expect(scopeValue('<div x-data="{ a: `{{ value }}` }"></div>', { value: 'x' }).a).toBe('x')
  })

  it('escapes a quote in the value rather than closing the literal early', () => {
    // A repository description, a commit subject, anything a person typed.
    const scope = scopeValue(
      `<div x-data="{ title: '{{ title }}' }"></div>`,
      { title: "it's a 'quoted' thing" },
    )

    expect(scope.title).toBe("it's a 'quoted' thing")
  })

  it('escapes a backslash, which would otherwise eat the next character', () => {
    expect(scopeValue(`<div x-data="{ path: '{{ path }}' }"></div>`, { path: 'C:\\Users\\ada' }).path)
      .toBe('C:\\Users\\ada')
  })

  it('escapes a newline, which is not legal inside a quoted literal', () => {
    expect(scopeValue(`<div x-data="{ body: '{{ body }}' }"></div>`, { body: 'one\ntwo' }).body)
      .toBe('one\ntwo')
  })

  it('does not let a value open an interpolation inside a template literal', () => {
    // `${` in a backtick string is executable. A value that carries one must
    // not become code, and this is the one quote style where that is possible.
    expect(scopeValue('<div x-data="{ a: `{{ value }}` }"></div>', { value: '${1 + 1}' }).a)
      .toBe('${1 + 1}')
  })

  it('handles several placeholders in one object', () => {
    const scope = scopeValue(
      `<div x-data="{ https: '{{ https }}', ssh: '{{ ssh }}', scheme: 'https' }"></div>`,
      { https: 'https://example.com/x.git', ssh: 'ssh://git@example.com:2222/x.git' },
    )

    expect(scope).toEqual({
      https: 'https://example.com/x.git',
      ssh: 'ssh://git@example.com:2222/x.git',
      // A literal in the template, which was always fine and must stay so.
      scheme: 'https',
    })
  })
})

describe('an interpolation outside a string literal', () => {
  it('is still spliced as a JS literal', () => {
    // `disabledItems: {{ ids }}` has no quotes to sit in, so the value has to
    // arrive as one - which is the case the old behaviour was written for.
    expect(scopeValue(`<div x-data="{ name: {{ name }} }"></div>`, { name: 'ada' }).name).toBe('ada')
    expect(scopeValue(`<div x-data="{ count: {{ count }} }"></div>`, { count: 7 }).count).toBe(7)
    expect(scopeValue(`<div x-data="{ ok: {{ ok }} }"></div>`, { ok: false }).ok).toBe(false)
  })

  it('splices an array or object as the literal it is', () => {
    expect(scopeValue(`<div x-data="{ ids: {{ ids }} }"></div>`, { ids: [1, 2, 3] }).ids).toEqual([1, 2, 3])
    expect(scopeValue(`<div x-data="{ meta: {{ meta }} }"></div>`, { meta: { a: 1 } }).meta).toEqual({ a: 1 })
  })

  it('splices pre-stringified JSON without encoding it twice', () => {
    expect(scopeValue(`<div x-data="{ meta: {{ metaJson }} }"></div>`, { metaJson: '{"a":1}' }).meta)
      .toEqual({ a: 1 })
  })
})

describe('what cannot be resolved', () => {
  it('is left alone for the client to deal with', () => {
    // A signal the server has no value for. Leaving the placeholder is what
    // lets client-side handling pick it up.
    expect(scopeExpression(`<div x-data="{ a: '{{ unknown }}' }"></div>`, {}))
      .toContain('{{ unknown }}')
  })
})
