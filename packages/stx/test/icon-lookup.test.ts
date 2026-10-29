/**
 * Tests for finding an icon inside a collection once the file is on disk.
 *
 * Two things in `icons.json` were being thrown away at load, and both failed
 * the same quiet way: an HTML comment, or a wrong viewBox, where a glyph
 * should be. Nothing throws, nothing warns, and the surrounding markup is
 * intact — so the page looks like the feature was never built.
 *
 * `aliases` is how a collection records a rename. lucide has 220 of them.
 * `trash-2` is one, and an app that wrote `<Icon name="trash-2">` got an empty
 * clickable square where its delete button should have been, for long enough
 * that the feature was reported missing rather than broken. The same name
 * written as a ts-css utility class — `i-lucide-trash-2` — rendered correctly
 * the whole time, because that resolver does read aliases. Same file, same
 * name, two different answers.
 *
 * The top-level `width`/`height` are the collection's own default, which icons
 * rely on instead of repeating it. Framework7's default is 56 and not one of
 * its 1,253 icons states a size of its own, so assuming 24 drew every one of
 * them into a viewBox a fifth of the size: the artwork cropped to its top-left
 * corner, scaled up.
 */

import { describe, expect, it } from 'bun:test'
import { IconBuiltin, lookupIcon } from '../src/builtins/icon'

const collection = {
  width: 56,
  height: 56,
  icons: {
    trash: { body: '<path d="M1"/>' },
    arrow: { body: '<path d="M2"/>', width: 24, height: 24 },
  },
  aliases: {
    'trash-2': { parent: 'trash' },
    'bin': { parent: 'trash-2' },
    'arrow-left': { parent: 'arrow', hFlip: true },
    'arrow-up': { parent: 'arrow', rotate: 3 },
  },
}

describe('lookupIcon', () => {
  it('finds an icon by its own name', () => {
    expect(lookupIcon(collection, 'trash')?.body).toBe('<path d="M1"/>')
  })

  it('finds an icon by an alias', () => {
    expect(lookupIcon(collection, 'trash-2')?.body).toBe('<path d="M1"/>')
  })

  it('follows an alias that names another alias', () => {
    expect(lookupIcon(collection, 'bin')?.body).toBe('<path d="M1"/>')
  })

  it('knows what a missing one looks like', () => {
    // Without this the three above pass against a lookup that returns
    // something for anything at all.
    expect(lookupIcon(collection, 'no-such-icon')).toBeNull()
  })

  it('refuses to spin on a collection whose alias points at itself', () => {
    const looped = { icons: {}, aliases: { a: { parent: 'b' }, b: { parent: 'a' } } }
    expect(lookupIcon(looped, 'a')).toBeNull()
  })

  it("takes the collection's default size when the icon states none", () => {
    expect(lookupIcon(collection, 'trash')).toMatchObject({ width: 56, height: 56 })
  })

  it("prefers the icon's own size over the collection's", () => {
    expect(lookupIcon(collection, 'arrow')).toMatchObject({ width: 24, height: 24 })
  })

  it('falls back to 24 when neither states a size', () => {
    const sizeless = { icons: { dot: { body: '<circle/>' } } }
    expect(lookupIcon(sizeless, 'dot')).toMatchObject({ width: 24, height: 24 })
  })

  it('applies the flip an alias asks for, about the icon\'s own size', () => {
    // 24, the icon's size — not 56, the collection's. Mirroring about the
    // wrong axis moves the glyph out of frame instead of flipping it.
    expect(lookupIcon(collection, 'arrow-left')?.body)
      .toBe('<g transform="translate(24 0) scale(-1 1)"><path d="M2"/></g>')
  })

  it('applies a rotation about the centre', () => {
    expect(lookupIcon(collection, 'arrow-up')?.body)
      .toBe('<g transform="rotate(270 12 12)"><path d="M2"/></g>')
  })

  it('leaves a plain alias untouched', () => {
    expect(lookupIcon(collection, 'trash-2')?.body).not.toContain('<g')
  })
})

/** The whole point: what the template actually gets back. */
describe('<Icon> on an aliased name', () => {
  function render(name: string): string {
    return IconBuiltin.render(
      { static: { name }, staticNames: {}, serverDynamic: {}, clientReactive: {}, events: {} },
      '',
      {} as any,
    )
  }

  it('draws the icon rather than an HTML comment', () => {
    const html = render('trash-2')
    expect(html).toContain('<svg')
    expect(html).not.toContain('<!--')
  })

  it('still reports a name that is in neither icons nor aliases', () => {
    expect(render('definitely-not-an-icon')).toContain('not found')
  })
})
