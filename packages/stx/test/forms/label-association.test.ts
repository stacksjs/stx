/**
 * `@label`'s `for=` reaches a control that exists (stacksjs/stx#1861).
 *
 * `@label('email')` has always emitted `for="email"`, but no control directive
 * emitted an `id` at all — `grep -c 'id=' packages/stx/src/forms.ts` returned
 * 0 — so every generated `for=` pointed at nothing. The markup stx generated
 * was flagged by stx's own accessibility checker.
 *
 * The pairing is asserted here by parsing the output and looking the id up,
 * rather than by string-matching the two halves separately: a test that checks
 * `for="email"` and `id="email"` in isolation passes even if the two are
 * generated from different normalisations and never actually match.
 */
import { describe, expect, it } from 'bun:test'
import { processFormInputDirectives } from '../../src/forms'

/** Every `for=` in the output must name an id that the output also defines. */
function unresolvedLabels(html: string): string[] {
  const ids = new Set([...html.matchAll(/\bid="([^"]*)"/g)].map(m => m[1]))
  return [...html.matchAll(/<label[^>]*\bfor="([^"]*)"/g)]
    .map(m => m[1] as string)
    .filter(target => !ids.has(target))
}

describe('label/control association (#1861)', () => {
  it('pairs a label with a text input', () => {
    const html = processFormInputDirectives(
      `@label('email')Email@endlabel@input('email')`,
      {},
    )
    expect(unresolvedLabels(html)).toEqual([])
  })

  it('pairs a label with a textarea and a select', () => {
    const html = processFormInputDirectives(
      `@label('bio')Bio@endlabel@textarea('bio')x@endtextarea`
      + `@label('country')Country@endlabel@select('country')<option>US</option>@endselect`,
      {},
    )
    expect(unresolvedLabels(html)).toEqual([])
  })

  it('pairs a label with a file input', () => {
    const html = processFormInputDirectives(
      `@label('avatar')Avatar@endlabel@file('avatar')`,
      {},
    )
    expect(unresolvedLabels(html)).toEqual([])
  })

  it('pairs a label with a lone checkbox', () => {
    // No value of its own, so it keeps the bare field id.
    const html = processFormInputDirectives(
      `@label('terms')Accept@endlabel@checkbox('terms')`,
      {},
    )
    expect(html).toContain('id="terms"')
    expect(unresolvedLabels(html)).toEqual([])
  })

  it('handles a field name that is not a legal bare id', () => {
    const html = processFormInputDirectives(
      `@label('user[email]')Email@endlabel@input('user[email]')`,
      {},
    )
    // The name is untouched — it is what the server parses — while the id and
    // the for= are both normalised, so they still meet.
    expect(html).toContain('name="user[email]"')
    expect(html).toContain('id="user-email"')
    expect(unresolvedLabels(html)).toEqual([])
  })

  it('strips array notation so tags[] and tags share an id', () => {
    const html = processFormInputDirectives(`@input('tags[]')`, {})
    expect(html).toContain('name="tags[]"')
    expect(html).toContain('id="tags"')
  })
})

describe('grouped controls get distinct ids (#1861)', () => {
  it('gives each radio in a group its own id', () => {
    const html = processFormInputDirectives(
      `@radio('color', 'red')@radio('color', 'blue')`,
      {},
    )
    // A shared name with a shared id would be invalid HTML and would make
    // every label in the group select the same control.
    expect(html).toContain('id="color-red"')
    expect(html).toContain('id="color-blue"')
  })

  it('gives each checkbox in a group its own id', () => {
    const html = processFormInputDirectives(
      `@checkbox('tags', 'a')@checkbox('tags', 'b')`,
      {},
    )
    expect(html).toContain('id="tags-a"')
    expect(html).toContain('id="tags-b"')
  })

  it('emits no duplicate ids for a radio group', () => {
    const html = processFormInputDirectives(
      `@radio('color', 'red')@radio('color', 'blue')@radio('color', 'green')`,
      {},
    )
    const ids = [...html.matchAll(/\bid="([^"]*)"/g)].map(m => m[1])
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
  })
})

describe('an author-supplied id wins (#1861)', () => {
  it('does not add a second id to an input', () => {
    const html = processFormInputDirectives(
      `@input('email', '', {id: 'custom-email'})`,
      {},
    )
    const ids = [...html.matchAll(/\bid="([^"]*)"/g)].map(m => m[1])
    expect(ids).toEqual(['custom-email'])
  })

  it('does not add a second id to a textarea', () => {
    const html = processFormInputDirectives(
      `@textarea('bio', {id: 'custom-bio'})x@endtextarea`,
      {},
    )
    const ids = [...html.matchAll(/\bid="([^"]*)"/g)].map(m => m[1])
    expect(ids).toEqual(['custom-bio'])
  })
})
