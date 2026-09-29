/**
 * `@foreach(items as {id, name})` binds the names it destructures.
 *
 * Array destructuring (`as [key, val]`) was handled; the object form was not.
 * `{` was already excluded from the comma split above it -- reserved, with a
 * comment saying the form "isn't supported" -- so the binding fell through to
 * being bound under its own literal text. Every name inside the row then read as
 * undefined and the row rendered blank, with no error and no warning.
 */
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const render = async (template: string, context: Record<string, unknown>): Promise<string> =>
  (await processDirectives(template, context, '/tmp/foreach-destructuring.stx', {}, new Set<string>())).trim()

const PEOPLE = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]

describe('@foreach with object destructuring', () => {
  it('binds each destructured property', async () => {
    expect(await render('@foreach(items as {id, name}){{ id }}:{{ name }};@endforeach', { items: PEOPLE }))
      .toBe('1:Ada;2:Grace;')
  })

  it('renames with {prop: alias}', async () => {
    expect(await render('@foreach(items as {name: who}){{ who }};@endforeach', { items: PEOPLE }))
      .toBe('Ada;Grace;')
  })

  it('works in the `binding in collection` spelling too', async () => {
    expect(await render('@foreach({id, name} in items){{ id }}:{{ name }};@endforeach', { items: PEOPLE }))
      .toBe('1:Ada;2:Grace;')
  })

  it('reads only the properties named, leaving the rest out of scope', async () => {
    const out = await render(
      '@foreach(items as {name}){{ name }}|{{ typeof id }};@endforeach',
      { items: [{ id: 9, name: 'Ada' }] },
    )
    expect(out).toBe('Ada|undefined;')
  })

  it('still supports the array form, the index form and a plain binding', async () => {
    expect(await render('@foreach(pairs as [k, v]){{ k }}={{ v }};@endforeach', { pairs: [['x', 1], ['y', 2]] }))
      .toBe('x=1;y=2;')
    expect(await render('@foreach(items as it, i){{ i }}:{{ it.name }};@endforeach', { items: PEOPLE }))
      .toBe('0:Ada;1:Grace;')
    expect(await render('@foreach(items as it){{ it.name }};@endforeach', { items: PEOPLE }))
      .toBe('Ada;Grace;')
  })

  it('renders nothing for an item that is not an object, rather than throwing', async () => {
    // Destructuring a number throws in JS; a template should not take the page
    // down over one bad row.
    expect(await render('@foreach(nums as {id})[{{ id }}];@endforeach', { nums: [1, null] }))
      .toBe('[];[];')
  })

  it('keeps the loop meta available alongside the destructured names', async () => {
    expect(await render('@foreach(items as {name}){{ loop.iteration }}.{{ name }};@endforeach', { items: PEOPLE }))
      .toBe('1.Ada;2.Grace;')
  })
})
