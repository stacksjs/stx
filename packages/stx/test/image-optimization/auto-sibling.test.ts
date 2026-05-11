/**
 * Tests for `rewriteImagesWithSiblings` — NuxtImage-style auto-discovery
 * of .webp/.avif siblings sitting next to plain <img src="*.jpg"> refs.
 *
 * Uses real temp-dir filesystem fixtures because the implementation
 * deliberately hits `Bun.file().exists()` — mocking would test the mock,
 * not the actual probe logic.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { rewriteImagesWithSiblings } from '../../src/image-optimization/auto-sibling'

let publicDir: string

beforeAll(async () => {
  publicDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-autosib-'))
  await fs.promises.mkdir(path.join(publicDir, 'images'), { recursive: true })

  // hero.jpg has both .webp AND .avif siblings — full picture wrap
  await Bun.write(path.join(publicDir, 'images/hero.jpg'), 'fake jpg')
  await Bun.write(path.join(publicDir, 'images/hero.webp'), 'fake webp')
  await Bun.write(path.join(publicDir, 'images/hero.avif'), 'fake avif')

  // banner.jpg only has .webp — single <source>
  await Bun.write(path.join(publicDir, 'images/banner.jpg'), 'fake jpg')
  await Bun.write(path.join(publicDir, 'images/banner.webp'), 'fake webp')

  // lonely.png has no siblings — must pass through unchanged
  await Bun.write(path.join(publicDir, 'images/lonely.png'), 'fake png')

  // basename-collision: photo.jpeg + photo.webp (note the .jpeg extension)
  await Bun.write(path.join(publicDir, 'images/photo.jpeg'), 'fake jpeg')
  await Bun.write(path.join(publicDir, 'images/photo.webp'), 'fake webp')
})

afterAll(async () => {
  await fs.promises.rm(publicDir, { recursive: true, force: true }).catch(() => {})
})

describe('rewriteImagesWithSiblings', () => {
  it('wraps img in <picture> with avif+webp sources when both siblings exist', async () => {
    const html = `<img src="/images/hero.jpg" alt="Hero">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toContain('<picture>')
    expect(out).toContain('<source type="image/avif" srcset="/images/hero.avif">')
    expect(out).toContain('<source type="image/webp" srcset="/images/hero.webp">')
    expect(out).toContain('<img src="/images/hero.jpg" alt="Hero">')
    expect(out).toContain('</picture>')
    // avif must come before webp (preference order)
    expect(out.indexOf('avif')).toBeLessThan(out.indexOf('webp'))
  })

  it('emits only the formats whose sibling files exist', async () => {
    const html = `<img src="/images/banner.jpg" alt="Banner">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toContain('<source type="image/webp" srcset="/images/banner.webp">')
    expect(out).not.toContain('avif')
  })

  it('leaves img unchanged when no siblings exist', async () => {
    const html = `<img src="/images/lonely.png" alt="Lonely">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toBe(html)
  })

  it('handles .jpeg extension (not just .jpg) for basename matching', async () => {
    const html = `<img src="/images/photo.jpeg" alt="Photo">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toContain('<source type="image/webp" srcset="/images/photo.webp">')
    expect(out).toContain('<img src="/images/photo.jpeg"')
  })

  it('skips imgs already inside a <picture>', async () => {
    const html = `<picture><source type="image/webp" srcset="/images/hero.webp"><img src="/images/hero.jpg" alt="Hero"></picture>`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    // Must not double-wrap. There should be exactly one <picture> and
    // exactly one <img>.
    expect((out.match(/<picture>/g) || []).length).toBe(1)
    expect((out.match(/<img/g) || []).length).toBe(1)
  })

  it('skips remote URLs (http/https/protocol-relative)', async () => {
    const html = [
      `<img src="https://example.com/foo.jpg" alt="x">`,
      `<img src="http://example.com/foo.jpg" alt="y">`,
      `<img src="//cdn.example.com/foo.jpg" alt="z">`,
    ].join('\n')
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toBe(html)
  })

  it('skips data: URIs', async () => {
    const html = `<img src="data:image/png;base64,iVBORw0KGgo=" alt="data">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toBe(html)
  })

  it('skips unknown extensions (.svg, no extension, etc.)', async () => {
    const html = [
      `<img src="/icons/logo.svg" alt="logo">`,
      `<img src="/no-ext" alt="weird">`,
    ].join('\n')
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toBe(html)
  })

  it('skips relative URLs (no leading slash)', async () => {
    // Relative URLs are ambiguous without a template base, so we don't
    // probe them. Consumers using relative paths can opt in by rooting
    // at /.
    const html = `<img src="images/hero.jpg" alt="Hero">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toBe(html)
  })

  it('refuses to probe paths that escape publicDir via traversal', async () => {
    const html = `<img src="/../../../etc/passwd.jpg" alt="bad">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    // Whatever happens with the FS probe, we must not emit a <picture>
    // wrap based on something outside publicDir.
    expect(out).not.toContain('<picture>')
  })

  it('handles multiple imgs in one document', async () => {
    const html = [
      `<p>intro</p>`,
      `<img src="/images/hero.jpg" alt="Hero">`,
      `<p>middle</p>`,
      `<img src="/images/lonely.png" alt="Lonely">`,
      `<img src="/images/banner.jpg" alt="Banner">`,
      `<p>outro</p>`,
    ].join('\n')
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    // hero wrapped (has siblings), lonely passed through, banner wrapped
    expect(out).toContain('<source type="image/avif" srcset="/images/hero.avif">')
    expect(out).toContain('<source type="image/webp" srcset="/images/banner.webp">')
    expect(out).toContain('<img src="/images/lonely.png" alt="Lonely">')
    // lonely should NOT be inside a picture
    const lonelyIdx = out.indexOf('lonely.png')
    const previousPictureClose = out.lastIndexOf('</picture>', lonelyIdx)
    const nextPictureOpen = out.indexOf('<picture>', lonelyIdx)
    if (previousPictureClose !== -1 && nextPictureOpen !== -1) {
      // lonely lives between a </picture> and the next <picture>, good
      expect(lonelyIdx).toBeGreaterThan(previousPictureClose)
      expect(lonelyIdx).toBeLessThan(nextPictureOpen)
    }
  })

  it('preserves all attributes on the original img tag', async () => {
    const html = `<img src="/images/hero.jpg" alt="Hero" loading="lazy" class="rounded" data-test="x">`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toContain('alt="Hero"')
    expect(out).toContain('loading="lazy"')
    expect(out).toContain('class="rounded"')
    expect(out).toContain('data-test="x"')
  })

  it('returns input unchanged when html has no <img> tags', async () => {
    const html = `<div><p>no images here</p></div>`
    const out = await rewriteImagesWithSiblings(html, { publicDir })
    expect(out).toBe(html)
  })

  it('returns input unchanged when publicDir is missing', async () => {
    const html = `<img src="/images/hero.jpg" alt="Hero">`
    // @ts-expect-error — intentionally missing publicDir
    const out = await rewriteImagesWithSiblings(html, {})
    expect(out).toBe(html)
  })

  it('respects custom format priority order', async () => {
    // Flip the default: prefer webp over avif
    const html = `<img src="/images/hero.jpg" alt="Hero">`
    const out = await rewriteImagesWithSiblings(html, {
      publicDir,
      formats: [
        { ext: '.webp', mime: 'image/webp' },
        { ext: '.avif', mime: 'image/avif' },
      ],
    })
    expect(out.indexOf('image/webp')).toBeLessThan(out.indexOf('image/avif'))
  })
})
