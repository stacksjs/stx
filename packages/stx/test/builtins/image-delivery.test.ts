import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { clearImageDeliveryCatalog, getImageDelivery, imageEncoderIdentity, prepareImageDelivery, setImageEncoderIdentity, webpHeaderHasAlpha } from '../../src/builtins/image-delivery'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

describe('build-time Image delivery', () => {
  let tempDir: string
  let publicDir: string
  let outputDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-image-delivery-'))
    publicDir = join(tempDir, 'public')
    outputDir = join(tempDir, 'dist')
    await mkdir(join(publicDir, 'images'), { recursive: true })

    const width = 64
    const height = 32
    const pixels = new Uint8Array(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4
        pixels[offset] = (x * 7 + y * 3) % 256
        pixels[offset + 1] = (x * 2 + y * 11) % 256
        pixels[offset + 2] = (x * 13 + y * 5) % 256
        pixels[offset + 3] = 255
      }
    }
    const png = await encode({ data: pixels, width, height, channels: 4 }, 'png')
    await writeFile(join(publicDir, 'images', 'hero.png'), png)
  })

  afterAll(async () => {
    clearImageDeliveryCatalog()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('renders <Image> with responsive formats, intrinsic size, and a content placeholder', async () => {
    const result = await prepareImageDelivery(publicDir, outputDir)
    expect(result.count).toBe(1)
    expect(result.fingerprint).toHaveLength(64)

    const options = { ...defaultConfig, componentsDir: join(tempDir, 'components') } as any
    const html = await processDirectives(
      '<Image src="/images/hero.png" alt="A bright test image" />',
      {},
      join(tempDir, 'page.stx'),
      options,
      new Set<string>(),
    )

    expect(html).toContain('<picture>')
    expect(html).toMatch(/type="image\/(avif|webp)"/)
    expect(html).toContain('width="64"')
    expect(html).toContain('height="32"')
    expect(html).toContain('sizes="100vw"')
    expect(html).toContain('background-image:url(data:image/bmp;base64,')
    expect(html).toContain('/_stx/images/')
  })

  it('skips an unreadable raster without failing every valid image', async () => {
    await writeFile(join(publicDir, 'images', 'broken.png'), 'not image bytes')

    const result = await prepareImageDelivery(publicDir, outputDir)

    expect(result.count).toBe(1)
    expect(result.fingerprint).toHaveLength(64)
  })

  it('does not send an oversized original frame to responsive encoders', async () => {
    const width = 4097
    const height = 8
    const pixels = new Uint8Array(width * height * 4).fill(127)
    const file = join(publicDir, 'images', 'wide.png')
    await writeFile(file, await encode({ data: pixels, width, height, channels: 4 }, 'png'))

    try {
      const result = await prepareImageDelivery(publicDir, outputDir)
      expect(result.count).toBe(2)
      expect(result.fingerprint).toHaveLength(64)
    }
    finally {
      await rm(file)
    }
  })

  it('keeps a reactive source on an img root instead of binding src to picture', async () => {
    clearImageDeliveryCatalog()
    const options = { ...defaultConfig, componentsDir: join(tempDir, 'components') } as any
    const html = await processDirectives(
      '<Image :src="avatarUrl" alt="Profile photo" />',
      {},
      join(tempDir, 'page.stx'),
      options,
      new Set<string>(),
    )

    expect(html).toMatch(/<img[^>]*:src="avatarUrl"/)
    expect(html).toContain(':src="avatarUrl"')
    expect(html).not.toContain('<picture')
  })

  it('names variants the same from any output directory, so releases reuse the cache', async () => {
    // An atomic-release deploy runs the exact same build from a new absolute
    // path each time. If the output directory leaks into the variant names,
    // every release re-encodes the whole public directory and the previous
    // release's output is dead weight on disk.
    const releaseOne = join(tempDir, 'releases', 'aaaaaaa', 'delivery')
    const releaseTwo = join(tempDir, 'releases', 'bbbbbbb', 'delivery')

    clearImageDeliveryCatalog()
    const first = await prepareImageDelivery(publicDir, releaseOne)
    const firstNames = (await readdir(join(releaseOne, '_stx', 'images'))).sort()

    clearImageDeliveryCatalog()
    const second = await prepareImageDelivery(publicDir, releaseTwo)
    const secondNames = (await readdir(join(releaseTwo, '_stx', 'images'))).sort()

    expect(firstNames.length).toBeGreaterThan(0)
    expect(secondNames).toEqual(firstNames)
    expect(second.fingerprint).toBe(first.fingerprint)
  })

  it('only probes a corrupt raster once, then skips it on later runs', async () => {
    // A corrupt file makes the catalog build reject the whole batch. Recovery
    // decodes every file to find the bad one and then builds the catalog a
    // second time — and the file is still corrupt next boot, so without a
    // record of it the server pays that twice-over forever.
    const outDir = join(tempDir, 'releases', 'ddddddd', 'delivery')
    const broken = join(publicDir, 'images', 'corrupt-once.png')
    await writeFile(broken, 'not image bytes')

    const warnings: string[] = []
    const realWarn = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')) }

    try {
      clearImageDeliveryCatalog()
      const first = await prepareImageDelivery(publicDir, outDir)
      // The probe ran, found it, and said so.
      expect(warnings.some(line => line.includes('corrupt-once.png'))).toBe(true)

      warnings.length = 0
      clearImageDeliveryCatalog()
      const second = await prepareImageDelivery(publicDir, outDir)

      // Second run filtered it out up front: no probe, so no warning, and the
      // same catalog either way.
      expect(warnings.some(line => line.includes('corrupt-once.png'))).toBe(false)
      expect(second.count).toBe(first.count)
      expect(second.fingerprint).toBe(first.fingerprint)
    }
    finally {
      console.warn = realWarn
      await rm(broken, { force: true })
    }
  })

  it('retries a file that was corrupt once its bytes change', async () => {
    // The record is keyed by stat identity, so replacing a bad file with a
    // good one must not leave it permanently excluded.
    const outDir = join(tempDir, 'releases', 'eeeeeee', 'delivery')
    const file = join(publicDir, 'images', 'fixed-later.png')
    await writeFile(file, 'not image bytes')

    try {
      clearImageDeliveryCatalog()
      const broken = await prepareImageDelivery(publicDir, outDir)

      const width = 16
      const height = 16
      const pixels = new Uint8Array(width * height * 4).fill(200)
      await writeFile(file, await encode({ data: pixels, width, height, channels: 4 }, 'png'))

      clearImageDeliveryCatalog()
      const repaired = await prepareImageDelivery(publicDir, outDir)

      expect(repaired.count).toBe(broken.count + 1)
    }
    finally {
      await rm(file, { force: true })
    }
  })

  it('reuses variants already on disk instead of re-encoding them', async () => {
    const outDir = join(tempDir, 'releases', 'ccccccc', 'delivery')

    clearImageDeliveryCatalog()
    await prepareImageDelivery(publicDir, outDir)
    const written = join(outDir, '_stx', 'images')
    const before = await Promise.all(
      (await readdir(written)).sort().map(async name => [name, (await stat(join(written, name))).mtimeMs] as const),
    )

    clearImageDeliveryCatalog()
    await prepareImageDelivery(publicDir, outDir)
    const after = await Promise.all(
      (await readdir(written)).sort().map(async name => [name, (await stat(join(written, name))).mtimeMs] as const),
    )

    // Same names and untouched mtimes: the second pass found every variant and
    // wrote nothing. A miss would rewrite the file and move the mtime.
    expect(after).toEqual(before)
  })
})

describe('variants written by an older encoder', () => {
  let tempDir: string

  afterAll(async () => {
    setImageEncoderIdentity()
    clearImageDeliveryCatalog()
    await rm(tempDir, { recursive: true, force: true })
  })

  // A release that still resolved ts-webp 0.1.3 wrote opaque WebPs for
  // transparent sources into the variant cache every release shares. The
  // names hashed the source and the options, not the encoder, so every later
  // release found them, and with a fixed encoder still served PNG forever.
  it('does not reuse them once the encoder changes', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-image-encoder-'))
    const publicDir = join(tempDir, 'public')
    const sharedCache = join(tempDir, 'shared-cache')
    await mkdir(publicDir, { recursive: true })

    const width = 48
    const height = 48
    const pixels = new Uint8Array(width * height * 4)
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 200
      pixels[i + 1] = 40
      pixels[i + 2] = 90
      pixels[i + 3] = (i / 4) % width < width / 2 ? 0 : 255
    }
    await writeFile(join(publicDir, 'logo.png'), await encode({ data: pixels, width, height, channels: 4 }, 'png'))

    // The old release: every WebP it wrote is opaque.
    const opaque = await encode({ data: new Uint8Array(width * height * 4).fill(255), width, height, channels: 4 }, 'webp')
    setImageEncoderIdentity('ts-webp@0.1.3+ts-avif@0.1.4')
    await prepareImageDelivery(publicDir, sharedCache)
    const imagesDir = join(sharedCache, '_stx', 'images')
    const oldNames = (await readdir(imagesDir)).filter(name => name.endsWith('.webp'))
    expect(oldNames.length).toBeGreaterThan(0)
    for (const name of oldNames)
      await writeFile(join(imagesDir, name), opaque)

    const warn = console.warn
    console.warn = () => {}
    try {
      // Same encoder, same names: the stale variants are all it can find.
      clearImageDeliveryCatalog()
      await prepareImageDelivery(publicDir, sharedCache)
      expect(getImageDelivery('/logo.png')?.sources.webp).toBeUndefined()

      // The fixed encoder writes under names the old one never used.
      setImageEncoderIdentity()
      clearImageDeliveryCatalog()
      await prepareImageDelivery(publicDir, sharedCache)
    }
    finally {
      console.warn = warn
    }
    const manifest = getImageDelivery('/logo.png')
    expect(manifest?.sources.webp).toBeDefined()
    const webp = manifest!.variants.filter(variant => variant.format === 'webp')
    expect(webp.length).toBeGreaterThan(0)
    for (const variant of webp) {
      expect(oldNames).not.toContain(variant.path.split('/').pop())
      expect(webpHeaderHasAlpha((await readFile(variant.path)).subarray(0, 32))).toBe(true)
    }
  })

  it('names the encoders it resolves', () => {
    setImageEncoderIdentity()
    expect(imageEncoderIdentity()).toMatch(/^ts-webp@\d+\.\d+\.\d+\+ts-avif@\d+\.\d+\.\d+$/)
  })
})
