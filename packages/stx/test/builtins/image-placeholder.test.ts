/**
 * `<StxImage placeholder="blur">` shows the image, not a grey box.
 *
 * The placeholder used to be a flat `#e5e7eb` rectangle — and the same one for
 * every image on the page, since a builtin renders synchronously and nothing in
 * that pass had ever opened the file it pointed at. It was indistinguishable
 * from having asked for no placeholder at all, while reading as though blur-up
 * were implemented.
 *
 * The work now happens before rendering: a build derives a thumbhash per image
 * and the component looks it up. These tests seed that cache directly rather
 * than decoding a JPEG, so they pin the CONTRACT — what reaches the markup, and
 * what happens when nothing was derived — without depending on an image codec
 * being installed.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import {
  clearImagePlaceholders,
  meshSvg,
  setImagePlaceholder,
  svgDataUrl,
} from '../../src/builtins/image-placeholder'

const dir = join(import.meta.dir, '..', 'fixtures')

async function render(template: string): Promise<string> {
  const options = { ...defaultConfig, componentsDir: dir } as any
  const out = await processDirectives(template, {}, join(dir, 'probe.stx'), options, new Set<string>())
  return out.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').trim()
}

/** A stand-in for what a build derives from a real file. */
function seed(urlPath: string) {
  setImagePlaceholder(urlPath, {
    dataUrl: 'data:image/svg+xml;base64,SEEDED',
    color: '#123456',
  })
}

afterEach(() => {
  clearImagePlaceholders()
})

describe('StxImage placeholders', () => {
  it('uses the derived mesh and colour for a blur placeholder', async () => {
    seed('/images/hero.jpg')
    const out = await render('<StxImage src="/images/hero.jpg" alt="Hero" placeholder="blur" />')

    expect(out).toContain('data:image/svg+xml;base64,SEEDED')
    // The average colour sits underneath, so the slot is never blank — not even
    // for the moment an SVG background takes to rasterise.
    expect(out).toContain('background-color:#123456')
  })

  it('treats thumbhash the same as blur', async () => {
    seed('/images/hero.jpg')
    const out = await render('<StxImage src="/images/hero.jpg" alt="Hero" placeholder="thumbhash" />')

    expect(out).toContain('data:image/svg+xml;base64,SEEDED')
  })

  it('gives a colour placeholder the image\'s own average, not a fixed grey', async () => {
    seed('/images/hero.jpg')
    const out = await render('<StxImage src="/images/hero.jpg" alt="Hero" placeholder="color" />')

    expect(out).toContain('background-color:#123456')
    // A flat colour was asked for; the mesh would be a different thing.
    expect(out).not.toContain('SEEDED')
  })

  it('ignores a query string when looking the image up', async () => {
    // The cache is keyed by the file's url; `?v=2` is a cache-buster, not a
    // different image.
    seed('/images/hero.jpg')
    const out = await render('<StxImage src="/images/hero.jpg?v=2" alt="Hero" placeholder="blur" />')

    expect(out).toContain('SEEDED')
  })

  it('falls back to a flat colour when nothing was derived', async () => {
    // No warm has run — a build without the image codec, or a remote src. The
    // component must still render, exactly as it did before.
    const out = await render('<StxImage src="/images/missing.jpg" alt="Hero" placeholder="blur" />')

    expect(out).toContain('<img')
    expect(out).toContain('background-image:url(data:image/svg+xml;base64,')
    expect(out).not.toContain('SEEDED')
  })

  it('adds no placeholder styling when none was asked for', async () => {
    seed('/images/hero.jpg')
    const out = await render('<StxImage src="/images/hero.jpg" alt="Hero" />')

    expect(out).not.toContain('background-image')
    expect(out).not.toContain('background-color')
  })
})

describe('the thumbhash mesh', () => {
  /** Four rows of a 2x2 image: red, green, blue, white. */
  const rgba = new Uint8Array([
    255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 255, 255, 255, 255, 255, 255,
  ])

  it('emits one cell per grid position, carrying that region\'s colour', () => {
    const svg = meshSvg(rgba, 2, 2, 2, 2)

    expect(svg.match(/<rect /g)).toHaveLength(4)
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('fill="#00ff00"')
    expect(svg).toContain('fill="#0000ff"')
    expect(svg).toContain('fill="#ffffff"')
  })

  it('blurs the cells so their edges never show', () => {
    // Without this the placeholder is a visible checkerboard, which is worse
    // than a flat colour rather than better.
    expect(meshSvg(rgba, 2, 2, 2, 2)).toContain('feGaussianBlur')
  })

  it('stretches to the box rather than letter-boxing inside it', () => {
    expect(meshSvg(rgba, 2, 2, 2, 2)).toContain('preserveAspectRatio="none"')
  })

  it('stays far smaller than the thumbhash PNG it replaces', () => {
    // The reason this is a mesh and not thumbhash's own 32x32 PNG: that is
    // ~4.2KB per image, and nine of them roughly doubles a page here.
    const url = svgDataUrl(meshSvg(rgba, 2, 2))
    expect(url.length).toBeLessThan(1200)
    expect(url.startsWith('data:image/svg+xml;base64,')).toBe(true)
  })
})
