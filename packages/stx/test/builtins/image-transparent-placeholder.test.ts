/**
 * A transparent image never sits on a placeholder, and a placeholder never
 * outlives the image it stood in for.
 *
 * Reported on a site header: a white wordmark shipped as a palette PNG with a
 * `tRNS` chunk, rendered through `<StxImage>`. Build-time delivery gave every
 * image a default placeholder (the splathash over a `#e5e7eb` fill) in the
 * `<img>`'s own inline style, and nothing ever removed it. An opaque photo
 * covers its background, so nobody noticed; a transparent logo shows it
 * through every clear pixel, and the page's `filter: brightness(0)` (one white
 * asset, knocked to ink in light mode) turned that grey slot into a black box.
 *
 * Three things are pinned here:
 *  - a transparent source is detected (including the palette + `tRNS` form)
 *    and renders with no placeholder at all, since a solid one would show;
 *  - an opaque image still gets one, with an `onload` that clears exactly
 *    the properties the placeholder set;
 *  - no WebP `<source>` is offered for a transparent image unless its bytes
 *    really carry alpha. Older encoders wrote plain `VP8 ` frames and the
 *    browser painted the clear pixels solid.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'
import { encode } from 'ts-images'
import {
  clearImageDeliveryCatalog,
  getImageDelivery,
  isTransparentImage,
  prepareImageDelivery,
  webpHeaderHasAlpha,
} from '../../src/builtins/image-delivery'
import { clearImagePlaceholders, setImagePlaceholder } from '../../src/builtins/image-placeholder'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

function chunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'latin1')
  Buffer.from(data).copy(out, 8)
  out.writeUInt32BE(Bun.hash.crc32(out.subarray(4, 8 + data.length)) >>> 0, 8 + data.length)
  return out
}

/**
 * An 8-bit palette PNG with a `tRNS` chunk: the left half fully transparent,
 * the right half white. Same shape as the reported wordmark, and a form a
 * colour-type check alone would call opaque.
 */
function palettePngWithTransparency(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 3 // colour type: indexed
  const plte = new Uint8Array([0, 0, 0, 255, 255, 255])
  const trns = new Uint8Array([0]) // index 0 transparent, index 1 implicitly opaque
  const raw = Buffer.alloc((width + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0 // filter: none
    for (let x = 0; x < width; x++)
      raw[y * (width + 1) + 1 + x] = x < width / 2 ? 0 : 1
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('tRNS', trns),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ])
}

async function render(template: string, dir: string): Promise<string> {
  const options = { ...defaultConfig, componentsDir: join(dir, 'components') } as any
  const out = await processDirectives(template, {}, join(dir, 'page.stx'), options, new Set<string>())
  return out.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').trim()
}

function imgTag(html: string): string {
  const match = html.match(/<img\b[^>]*>/)
  expect(match).not.toBeNull()
  return match![0]
}

/** What a browser does with an inline `onload`: run the body with `this` bound to the element. */
function fireInlineLoad(img: Element): void {
  const body = img.getAttribute('onload')
  if (body)
    // eslint-disable-next-line no-new-func
    new Function(body).call(img)
}

describe('StxImage over a transparent source', () => {
  let tempDir: string
  let publicDir: string
  let outputDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-image-alpha-'))
    publicDir = join(tempDir, 'public')
    outputDir = join(tempDir, 'dist')
    await mkdir(join(publicDir, 'images'), { recursive: true })

    await writeFile(join(publicDir, 'images', 'logo.png'), palettePngWithTransparency(400, 76))

    const width = 64
    const height = 32
    const pixels = new Uint8Array(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      pixels[i * 4] = (i * 7) % 256
      pixels[i * 4 + 1] = (i * 3) % 256
      pixels[i * 4 + 2] = (i * 11) % 256
      pixels[i * 4 + 3] = 255
    }
    await writeFile(join(publicDir, 'images', 'photo.png'), await encode({ data: pixels, width, height, channels: 4 }, 'png'))

    // A transparent image may print a warning about its WebP variants when
    // the installed encoder cannot write alpha; that is expected here.
    const realWarn = console.warn
    console.warn = () => {}
    try {
      await prepareImageDelivery(publicDir, outputDir)
    }
    finally {
      console.warn = realWarn
    }
  })

  afterAll(async () => {
    clearImageDeliveryCatalog()
    clearImagePlaceholders()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('detects a palette PNG with tRNS as transparent, and an RGBA photo with no clear pixel as opaque', () => {
    expect(isTransparentImage('/images/logo.png')).toBe(true)
    expect(isTransparentImage('/images/photo.png')).toBe(false)
  })

  it('keeps the PNG fallback for the transparent source', () => {
    expect(getImageDelivery('/images/logo.png')?.fallback.format).toBe('png')
  })

  it('renders the transparent image with no placeholder and nothing to clear', async () => {
    const tag = imgTag(await render(
      '<StxImage src="/images/logo.png" alt="Logo" width="132" height="25" lazy="false" />',
      tempDir,
    ))

    expect(tag).not.toContain('background-color')
    expect(tag).not.toContain('background-image')
    expect(tag).not.toContain('onload=')
    // Still sized, so it does not shift layout.
    expect(tag).toContain('aspect-ratio:132/25')
  })

  it('refuses a derived placeholder even when one is asked for explicitly', async () => {
    for (const mode of ['blur', 'color', 'thumbhash']) {
      const tag = imgTag(await render(`<StxImage src="/images/logo.png" alt="Logo" placeholder="${mode}" />`, tempDir))
      expect(tag).not.toContain('background-color')
      expect(tag).not.toContain('background-image')
    }
  })

  it('offers no WebP source for the transparent image unless every variant carries alpha', async () => {
    const manifest = getImageDelivery('/images/logo.png')!
    const webp = manifest.variants.filter(variant => variant.format === 'webp')
    for (const variant of webp)
      expect(webpHeaderHasAlpha(new Uint8Array(await readFile(variant.path)))).toBe(true)

    const html = await render('<StxImage src="/images/logo.png" alt="Logo" />', tempDir)
    if (webp.length === 0)
      expect(html).not.toContain('image/webp')
  })

  it('gives the opaque image a placeholder that its load event clears', async () => {
    const html = await render('<StxImage src="/images/photo.png" alt="Photo" style="border-radius:4px" />', tempDir)
    const tag = imgTag(html)
    expect(tag).toContain('background-image:url(data:image/')
    expect(tag).toContain('onload="')

    document.body.innerHTML = html
    const img = document.querySelector('img')!
    expect(img.style.backgroundImage).not.toBe('')
    expect(img.style.backgroundColor).not.toBe('')

    fireInlineLoad(img)

    expect(img.style.backgroundImage).toBe('')
    expect(img.style.backgroundColor).toBe('')
    // The author's own declarations are not the placeholder's to remove.
    expect(img.style.borderRadius).toBe('4px')
    document.body.innerHTML = ''
  })

  it('runs an author onload after the cleanup instead of emitting a second attribute', async () => {
    const tag = imgTag(await render('<StxImage src="/images/photo.png" alt="Photo" onload="window.__loaded = true" />', tempDir))

    expect(tag.match(/\sonload=/g)).toHaveLength(1)
    expect(tag).toMatch(/onload="var s=this\.style;[^"]*;window\.__loaded = true"/)
  })

  it('clears a colour placeholder without touching a background image the author set', async () => {
    const html = await render(
      '<StxImage src="/images/photo.png" alt="Photo" placeholder="color" style="background-image:url(/texture.png)" />',
      tempDir,
    )
    document.body.innerHTML = html
    const img = document.querySelector('img')!
    fireInlineLoad(img)

    expect(img.style.backgroundColor).toBe('')
    expect(img.style.backgroundImage).toContain('texture.png')
    document.body.innerHTML = ''
  })
})

describe('StxImage over a transparent thumbhash placeholder', () => {
  afterAll(() => {
    clearImagePlaceholders()
  })

  it('renders none when the warmed placeholder says the image is transparent', async () => {
    setImagePlaceholder('/images/mark.png', { dataUrl: 'data:image/svg+xml;base64,SEEDED', color: '#ffffff', transparent: true })
    const tag = imgTag(await render('<StxImage src="/images/mark.png" alt="Mark" placeholder="blur" />', tmpdir()))

    expect(tag).not.toContain('SEEDED')
    expect(tag).not.toContain('background-color')
  })
})

describe('webpHeaderHasAlpha', () => {
  function header(fourCC: string, bytes: number[]): Uint8Array {
    const out = new Uint8Array(32)
    out.set(Buffer.from('RIFF', 'latin1'), 0)
    out.set(Buffer.from('WEBP', 'latin1'), 8)
    out.set(Buffer.from(fourCC, 'latin1'), 12)
    out.set(bytes, 20)
    return out
  }

  it('reads a simple lossy frame as opaque', () => {
    expect(webpHeaderHasAlpha(header('VP8 ', [0x9D, 0x01, 0x2A, 0, 0]))).toBe(false)
  })

  it('reads the VP8X alpha flag', () => {
    expect(webpHeaderHasAlpha(header('VP8X', [0x10, 0, 0, 0, 0]))).toBe(true)
    expect(webpHeaderHasAlpha(header('VP8X', [0x00, 0, 0, 0, 0]))).toBe(false)
  })

  it('reads the VP8L alpha_is_used bit', () => {
    expect(webpHeaderHasAlpha(header('VP8L', [0x2F, 0, 0, 0, 0x10]))).toBe(true)
    expect(webpHeaderHasAlpha(header('VP8L', [0x2F, 0, 0, 0, 0x00]))).toBe(false)
  })
})
