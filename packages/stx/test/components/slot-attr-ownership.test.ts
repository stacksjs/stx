/**
 * A `slot="name"` child belongs to the component it is a DIRECT child of, and
 * several children of one slot render in source order.
 *
 * Both passes of slot parsing are depth-aware now. `<template #name>` already
 * was; the `slot=` attribute form was two global regexes over the whole child
 * content, which produced three wrong renders:
 *
 *   - the outermost component consumed a nested component's slot children, so
 *     `<Outer><Card><i slot="t">X</i></Card></Outer>` lost X completely;
 *   - if the outer component declared a slot of the same name, X rendered
 *     THERE instead of in the component it was written inside;
 *   - an element carrying slot= inside a plain wrapper was hoisted out of the
 *     wrapper, leaving the wrapper empty in the default slot.
 *
 * Any nesting of two slot-taking components hits this -- the ordinary
 * <Dialog><DialogPanel><h2 slot="title"> shape.
 *
 * The accumulation order was a separate defect in the same pass: the loop ran
 * over a descending sort (needed for safe splicing) and appended content in
 * that order, so three children of one slot rendered 3, 2, 1.
 */
import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { parseSlots } from '../../src/slots'

/** Markers make it unambiguous WHICH component a child rendered into. */
const CARD = '<div class="c">[T:<slot name="t"></slot>][D:<slot></slot>]</div>'
const OUTER = '<section>[O:<slot></slot>]</section>'
const OUTER_WITH_T = '<section>[OT:<slot name="t"></slot>][O:<slot></slot>]</section>'

function project(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'stx-slot-owner-'))
  mkdirSync(path.join(dir, 'components'), { recursive: true })
  writeFileSync(path.join(dir, 'components', 'Card.stx'), CARD)
  writeFileSync(path.join(dir, 'components', 'Outer.stx'), OUTER)
  writeFileSync(path.join(dir, 'components', 'OuterT.stx'), OUTER_WITH_T)
  return dir
}

async function render(page: string): Promise<string> {
  const dir = project()
  const out = await processDirectives(
    page,
    {},
    path.join(dir, 'page.stx'),
    { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
    new Set<string>(),
  )
  return out.replace(/<link[^>]*>/g, '').trim()
}

describe('slot="name" targets the component it is a direct child of', () => {
  it('fills the inner component, not the outer one', async () => {
    expect(await render('<Card><i slot="t">X</i>body</Card>'))
      .toBe('<div class="c">[T:<i>X</i>][D:body]</div>')

    // The regression: X used to vanish here.
    expect(await render('<Outer><Card><i slot="t">X</i>body</Card></Outer>'))
      .toBe('<section>[O:<div class="c">[T:<i>X</i>][D:body]</div>]</section>')
  })

  it('does not hand the child to an outer component with the same slot name', async () => {
    const out = await render('<OuterT><Card><i slot="t">X</i>body</Card></OuterT>')
    // X belongs to Card; OuterT's own t slot stays empty.
    expect(out).toContain('[T:<i>X</i>]')
    expect(out).toContain('[OT:]')
  })

  it('leaves a slot= element nested inside a wrapper where it was written', async () => {
    const out = await render('<Card><div><i slot="t">X</i></div>body</Card>')
    // Not a direct child, so not a slot target: the wrapper keeps its content
    // and Card's t slot renders its fallback (empty here).
    expect(out).toContain('[T:]')
    expect(out).toContain('<div><i slot="t">X</i></div>body')
  })

  it('renders several children of one slot in source order', async () => {
    expect(await render('<Card><i slot="t">1</i><i slot="t">2</i><i slot="t">3</i></Card>'))
      .toBe('<div class="c">[T:<i>1</i><i>2</i><i>3</i>][D:]</div>')
  })

  it('keeps a self-closing child and its other attributes', async () => {
    expect(await render('<Card><img slot="t" src="a.png" />body</Card>'))
      .toBe('<div class="c">[T:<img src="a.png"/>][D:body]</div>')
  })

  it('matches the right close tag when the child nests its own tag name', async () => {
    expect(await render('<Card><b slot="t">out<b>in</b></b>body</Card>'))
      .toBe('<div class="c">[T:<b>out<b>in</b></b>][D:body]</div>')
  })
})

describe('parseSlots, directly', () => {
  it('reports depth-0 slot children only, in order', () => {
    const slots = parseSlots('<i slot="a">1</i><span><i slot="a">deep</i></span><i slot="a">2</i>')
    expect(slots.named.get('a')?.content).toBe('<i>1</i><i>2</i>')
    expect(slots.default).toBe('<span><i slot="a">deep</i></span>')
  })

  it('accepts a single-quoted slot attribute', () => {
    const slots = parseSlots(`<i slot='a'>1</i>rest`)
    expect(slots.named.get('a')?.content).toBe('<i>1</i>')
    expect(slots.default).toBe('rest')
  })

  it('keeps a quoted > inside an attribute in the same element', () => {
    const slots = parseSlots('<i slot="a" data-q="a>b">1</i>rest')
    expect(slots.named.get('a')?.content).toBe('<i data-q="a>b">1</i>')
    expect(slots.default).toBe('rest')
  })

  it('still pairs <template #name> with the component it is written in', () => {
    const slots = parseSlots('<template #a><p>A</p></template>tail')
    expect(slots.named.get('a')?.content).toBe('<p>A</p>')
    expect(slots.default).toBe('tail')
  })

  it('degrades to the open tag alone when the child is never closed', () => {
    const slots = parseSlots('<i slot="a">unclosed')
    expect(slots.named.get('a')?.content).toBe('<i>')
  })
})
